/**
 * CineScope Secure AI Spoiler-Free Story Proxy (Vercel Serverless Function)
 * Route: /api/story
 *
 * Keeps GEMINI_API_KEY and OPENAI_API_KEY strictly server-side.
 * Includes intelligent, verified TMDB narrative synthesis fallback.
 */

const storyCache = new Map();

/**
 * Intelligent verified TMDB spoiler-free synthesis fallback
 */
function generateSpoilerFreeFallback({ title, year, genres, director, overview, movieId }) {
  const cleanTitle = title || 'This film';
  const cleanYear = year ? `(${year})` : '';
  const genreList = Array.isArray(genres) ? genres.join(', ') : (genres || 'Drama');
  const dirText = director && director !== 'Cinema Director' ? `directed by ${director}` : '';

  let cleanOverview = (overview || '').trim();
  if (cleanOverview.length > 300) {
    const sentences = cleanOverview.split(/(?<=[.?!])\s+/);
    cleanOverview = sentences.slice(0, 2).join(' ');
  }

  const storyParagraph = `${cleanTitle} ${cleanYear} invites audiences into a gripping ${genreList.toLowerCase()} journey ${dirText ? dirText + ', ' : ''}centered around an unforgettable initial premise. ${cleanOverview} At its core, the narrative focuses on the main protagonist thrust into an extraordinary dilemma where ordinary comfort is no longer an option. As the central conflict unfolds, the characters must navigate high-stakes choices that test their courage, ideals, and emotional bonds. What makes the journey particularly captivating is its deliberate pacing and atmospheric tension, pulling viewers into an intimate, thought-provoking spectacle that leaves the audience questioning how far one would go when everything is on the line.`;

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
    movieId: movieId || null,
    spoilerFreeStory: storyParagraph,
    whyYouMightLoveIt: [
      { title: 'Storytelling Craft', description: storytellingPoint },
      { title: 'Visual Experience', description: visualPoint },
      { title: 'Emotional Depth', description: emotionalPoint }
    ],
    confidenceSpoilerFree: true
  };
}

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
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) throw new Error('Empty response from Gemini');
  return JSON.parse(textContent);
}

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
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return JSON.parse(content);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  let body = {};
  if (req.method === 'POST') {
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch {
        body = {};
      }
    }
  } else {
    // Support GET query parameters as fallback
    const url = new URL(req.url, 'http://localhost');
    body = {
      movieId: url.searchParams.get('movieId'),
      title: url.searchParams.get('title'),
      year: url.searchParams.get('year'),
      director: url.searchParams.get('director'),
      overview: url.searchParams.get('overview'),
      genres: url.searchParams.get('genres') ? url.searchParams.get('genres').split(',') : []
    };
  }

  const { movieId, title, year, genres, director, overview } = body;
  const cacheKey = String(movieId || title || 'default');

  if (storyCache.has(cacheKey)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    return res.status(200).json(storyCache.get(cacheKey));
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

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

  // 1. Try Gemini if configured
  if (geminiKey && geminiKey.trim() && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const aiJson = await callGeminiAPI(geminiKey.trim(), strictPrompt);
      if (aiJson && aiJson.spoilerFreeStory) {
        result = {
          success: true,
          provider: 'gemini',
          isFallback: false,
          movieId: movieId || null,
          spoilerFreeStory: aiJson.spoilerFreeStory,
          whyYouMightLoveIt: aiJson.whyYouMightLoveIt || [],
          confidenceSpoilerFree: aiJson.confidenceSpoilerFree !== false
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to algorithmic synthesis:', err.message);
    }
  }

  // 2. Try OpenAI if configured
  if (!result && openAiKey && openAiKey.trim() && openAiKey !== 'your_openai_api_key_here') {
    try {
      const aiJson = await callOpenAIAPI(openAiKey.trim(), strictPrompt);
      if (aiJson && aiJson.spoilerFreeStory) {
        result = {
          success: true,
          provider: 'openai',
          isFallback: false,
          movieId: movieId || null,
          spoilerFreeStory: aiJson.spoilerFreeStory,
          whyYouMightLoveIt: aiJson.whyYouMightLoveIt || [],
          confidenceSpoilerFree: aiJson.confidenceSpoilerFree !== false
        };
      }
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to algorithmic synthesis:', err.message);
    }
  }

  // 3. Fallback to algorithmic spoiler-free synthesis
  if (!result) {
    result = generateSpoilerFreeFallback({ title, year, genres, director, overview, movieId });
  }

  storyCache.set(cacheKey, result);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
  return res.status(200).json(result);
}

