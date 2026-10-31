/**
 * CineScope AI Story Service
 * Fetches spoiler-free premise explanations and curated viewing points
 * via the backend /api/story proxy.
 * Includes client-side caching to eliminate redundant requests.
 */

const clientStoryCache = new Map();

/**
 * Fetch spoiler-free narrative explanation for a given movie
 */
export async function fetchSpoilerFreeStory(movie) {
  if (!movie || !movie.id) {
    return {
      spoilerFreeStory: movie?.overview || 'No story overview available.',
      whyYouMightLoveIt: [],
      isFallback: true,
      provider: 'none'
    };
  }

  const cacheKey = `cinescope_story_${movie.id}`;

  // 1. In-memory client cache check
  if (clientStoryCache.has(cacheKey)) {
    return clientStoryCache.get(cacheKey);
  }

  // 2. SessionStorage cache check
  try {
    const sessionSaved = sessionStorage.getItem(cacheKey);
    if (sessionSaved) {
      const parsed = JSON.parse(sessionSaved);
      clientStoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // SessionStorage disabled or full
  }

  try {
    // 3. Request through secure backend proxy endpoint
    const response = await fetch('/api/story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        movieId: movie.id,
        title: movie.title,
        year: movie.year,
        genres: movie.genres,
        director: movie.director,
        overview: movie.overview
      })
    });

    if (!response.ok) {
      throw new Error(`Story API returned ${response.status}`);
    }

    const data = await response.json();

    const result = {
      spoilerFreeStory: data.spoilerFreeStory || movie.overview,
      whyYouMightLoveIt: data.whyYouMightLoveIt || [],
      isFallback: data.isFallback === true,
      provider: data.provider || 'tmdb-fallback'
    };

    // Cache result
    clientStoryCache.set(cacheKey, result);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Ignore sessionStorage quotas
    }

    return result;
  } catch (err) {
    console.warn('Failed to fetch AI spoiler-free story, using TMDB overview fallback:', err);
    return {
      spoilerFreeStory: movie.overview || 'No overview synopsis provided.',
      whyYouMightLoveIt: [
        {
          title: 'Storytelling Craft',
          description: 'Engaging narrative built on strong character motivations and high personal stakes.'
        },
        {
          title: 'Visual Experience',
          description: 'Atmospheric visual framing and deliberate cinematography.'
        },
        {
          title: 'Emotional Depth',
          description: 'Explores meaningful themes that resonate long after the credits roll.'
        }
      ],
      isFallback: true,
      provider: 'client-fallback'
    };
  }
}
