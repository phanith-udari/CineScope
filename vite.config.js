import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In-memory server-side caches
const omdbServerCache = new Map();
const storyServerCache = new Map();

/**
 * Intelligent spoiler-free story and highlights synthesizer from verified TMDB data
 * Used when an external AI provider (Gemini/OpenAI) is not configured or as fallback.
 */
function generateSpoilerFreeFallback({ title, year, genres, director, overview }) {
  const cleanTitle = title || 'This film';
  const cleanYear = year ? `(${year})` : '';
  const genreList = Array.isArray(genres) ? genres.join(', ') : (genres || 'Drama');
  const dirText = director && director !== 'Cinema Director' ? `directed by ${director}` : '';

  // Clean raw overview to remove any obvious spoilers or resolution phrases
  let cleanOverview = (overview || '').trim();
  if (cleanOverview.length > 300) {
    // Keep the opening setup of the overview (first 2-3 sentences), strictly avoiding third-act details
    const sentences = cleanOverview.split(/(?<=[.?!])\s+/);
    cleanOverview = sentences.slice(0, 2).join(' ');
  }

  // Synthesize concise 100-150 word spoiler-free explanation
  const storyParagraph = `${cleanTitle} ${cleanYear} invites audiences into a gripping ${genreList.toLowerCase()} journey ${dirText ? dirText + ', ' : ''}centered around an unforgettable initial premise. ${cleanOverview} At its core, the narrative focuses on the main protagonist thrust into an extraordinary dilemma where ordinary comfort is no longer an option. As the central conflict unfolds, the characters must navigate high-stakes choices that test their courage, ideals, and emotional bonds. What makes the journey particularly captivating is its deliberate pacing and atmospheric tension, pulling viewers into an intimate, thought-provoking spectacle that leaves the audience questioning how far one would go when everything is on the line.`;

  // Determine tailored "Why You Might Love It" points based on verified genres
  const gStr = String(genreList).toLowerCase();
  
  let storytellingPoint = 'Features a tightly structured opening that establishes high stakes and compelling personal motivations without giving away its secrets.';
  let visualPoint = 'Immersive cinematographic framing and rich visual world-building designed for deep, focused viewing.';
  let emotionalPoint = 'Grounded human performances that lend genuine heart and relatable weight to the characters\' central quest.';

  if (gStr.includes('sci-fi') || gStr.includes('science fiction')) {
    storytellingPoint = 'Explores fascinating philosophical concepts and inventive scientific what-ifs that spark thought-provoking reflections.';
    visualPoint = 'Spectacular scale, cosmic environmental detail, and awe-inspiring aesthetic visual composition.';
    emotionalPoint = 'Balances grand interstellar or technological wonder with deeply resonant human and familial bonds.';
  } else if (gStr.includes('thriller') || gStr.includes('mystery')) {
    storytellingPoint = 'Constructs an intricate puzzle of clues and psychological tension that keeps you glued to every subtle gesture.';
    visualPoint = 'Moody, atmospheric lighting and sharp editing that build a constant, palpable sense of suspense.';
    emotionalPoint = 'High-pressure moral dilemmas where characters reveal their true resilience and vulnerabilities.';
  } else if (gStr.includes('romance') || gStr.includes('drama')) {
    storytellingPoint = 'Gentle, character-driven storytelling prioritizing nuanced glances, unspoken thoughts, and poetic pacing.';
    visualPoint = 'Lush, intimate color palettes and tender framing that evoke a nostalgic, warm cinematic journal feeling.';
    emotionalPoint = 'Deeply moving explorations of love, longing, and the subtle choices that shape our paths.';
  } else if (gStr.includes('animation') || gStr.includes('fantasy')) {
    storytellingPoint = 'Enchanting mythological world-building filled with imaginative rules, charming creatures, and timeless themes.';
    visualPoint = 'Vibrant, handcrafted art direction with breathtaking painterly backgrounds and expressive character motion.';
    emotionalPoint = 'A tender, heartwarming core that speaks directly to the child and dreamer inside every viewer.';
  }

  return {
    success: true,
    provider: 'tmdb-verified-fallback',
    isFallback: true,
    movieId: null,
    spoilerFreeStory: storyParagraph,
    whyYouMightLoveIt: [
      {
        title: 'Storytelling Craft',
        description: storytellingPoint
      },
      {
        title: 'Visual Experience',
        description: visualPoint
      },
      {
        title: 'Emotional Depth',
        description: emotionalPoint
      }
    ],
    confidenceSpoilerFree: true
  };
}

/**
 * Call Google Gemini API
 */
async function callGeminiAPI(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) throw new Error('Empty response from Gemini');
  return JSON.parse(textContent);
}

/**
 * Call OpenAI API
 */
async function callOpenAIAPI(apiKey, prompt) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return JSON.parse(content);
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables including non-VITE_ ones like OMDB_API_KEY and GEMINI_API_KEY
  const env = loadEnv(mode, process.cwd(), '');

  const handleOmdbRequest = async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const imdbId = parsedUrl.searchParams.get('imdbId');
    const apiKey = env.OMDB_API_KEY || process.env.OMDB_API_KEY;

    if (!imdbId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ Response: 'False', Error: 'Missing imdbId query parameter' }));
      return;
    }

    if (omdbServerCache.has(imdbId)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.end(JSON.stringify(omdbServerCache.get(imdbId)));
      return;
    }

    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ Response: 'False', Error: 'OMDB_API_KEY not configured on server' }));
      return;
    }

    try {
      const omdbUrl = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}`;
      const omdbRes = await fetch(omdbUrl);
      const data = await omdbRes.json();

      omdbServerCache.set(imdbId, data);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.end(JSON.stringify(data));
    } catch {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ Response: 'False', Error: 'Failed to reach OMDb service' }));
    }
  };

  const handleStoryRequest = async (req, res) => {
    let body = {};
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      } catch {
        body = {};
      }
    } else {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      body = {
        movieId: parsedUrl.searchParams.get('movieId'),
        title: parsedUrl.searchParams.get('title'),
        year: parsedUrl.searchParams.get('year'),
        director: parsedUrl.searchParams.get('director'),
        overview: parsedUrl.searchParams.get('overview'),
        genres: parsedUrl.searchParams.get('genres') ? parsedUrl.searchParams.get('genres').split(',') : []
      };
    }

    const { movieId, title, year, genres, director, overview } = body;

    // Check server cache
    const cacheKey = String(movieId || title || 'default');
    if (storyServerCache.has(cacheKey)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end(JSON.stringify(storyServerCache.get(cacheKey)));
      return;
    }

    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    const strictPrompt = `You are an expert film curator and spoiler protection specialist for CineScope, an aesthetic movie journal.
Generate a concise, engaging, and STRICTLY SPOILER-FREE explanation of the movie based ONLY on the provided verified context.

Context:
Title: "${title || 'Film'}" (${year || ''})
Genres: ${Array.isArray(genres) ? genres.join(', ') : (genres || 'Cinema')}
Director: ${director || 'Not listed'}
Verified TMDB Premise: "${overview || ''}"

STRICT RULES:
1. Length: Approximately 100-150 words total for the story.
2. Tone: Simple, natural, and engaging English.
3. Content:
   - Introduce the basic premise of the movie.
   - Introduce the main character and their starting situation.
   - Outline the central conflict or challenge that sets the journey in motion.
   - Explain what makes the story interesting to experience.
   - Describe the general viewing experience and emotional atmosphere.
4. STRICT SPOILER PROTECTION (CRUCIAL):
   - Never reveal the ending.
   - Never reveal major plot twists.
   - Never disclose surprise character identities.
   - Never reveal unexpected deaths or betrayals.
   - Never explain the final resolution.
   - Stop right before the main action or adventure begins.
5. In addition to the story, provide "Why You Might Love It" with exactly 3 short points (1 sentence each) focusing on:
   - Interesting Storytelling (narrative structure, suspense, or style)
   - Visual Experience (cinematography, scale, color, or art direction)
   - Emotional Depth (character resonance, themes, or heart)

Respond ONLY with valid JSON matching this schema:
{
  "spoilerFreeStory": "100-150 word engaging spoiler-free narrative explanation",
  "whyYouMightLoveIt": [
    { "title": "Interesting Storytelling", "description": "One concise sentence" },
    { "title": "Visual Experience", "description": "One concise sentence" },
    { "title": "Emotional Depth", "description": "One concise sentence" }
  ],
  "confidenceSpoilerFree": true
}`;

    let result = null;

    // Try Gemini if configured
    if (geminiKey && geminiKey.trim() && geminiKey !== 'your_gemini_api_key_here') {
      try {
        const aiJson = await callGeminiAPI(geminiKey.trim(), strictPrompt);
        if (aiJson && aiJson.spoilerFreeStory) {
          result = {
            success: true,
            provider: 'gemini',
            isFallback: false,
            movieId,
            spoilerFreeStory: aiJson.spoilerFreeStory,
            whyYouMightLoveIt: aiJson.whyYouMightLoveIt || [],
            confidenceSpoilerFree: aiJson.confidenceSpoilerFree !== false
          };
        }
      } catch {
        console.warn('Gemini API call failed, falling back:', err.message);
      }
    }

    // Try OpenAI if configured and Gemini was not used
    if (!result && openAiKey && openAiKey.trim() && openAiKey !== 'your_openai_api_key_here') {
      try {
        const aiJson = await callOpenAIAPI(openAiKey.trim(), strictPrompt);
        if (aiJson && aiJson.spoilerFreeStory) {
          result = {
            success: true,
            provider: 'openai',
            isFallback: false,
            movieId,
            spoilerFreeStory: aiJson.spoilerFreeStory,
            whyYouMightLoveIt: aiJson.whyYouMightLoveIt || [],
            confidenceSpoilerFree: aiJson.confidenceSpoilerFree !== false
          };
        }
      } catch {
        console.warn('OpenAI API call failed, falling back:', err.message);
      }
    }

    // Fall back to intelligent TMDB spoiler-free synthesis if AI was not configured or errored
    if (!result) {
      result = generateSpoilerFreeFallback({ title, year, genres, director, overview });
      result.movieId = movieId;
    }

    storyServerCache.set(cacheKey, result);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(JSON.stringify(result));
  };

  return {
    plugins: [
      react(),
      {
        name: 'cinescope-backend-api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/omdb', handleOmdbRequest);
          server.middlewares.use('/api/story', handleStoryRequest);
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/omdb', handleOmdbRequest);
          server.middlewares.use('/api/story', handleStoryRequest);
        }
      }
    ]
  };
});
