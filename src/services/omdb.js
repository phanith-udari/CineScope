/**
 * CineScope OMDb Service
 * Fetches verified IMDb ratings and vote counts through a secure backend proxy endpoint (/api/omdb).
 * The OMDB_API_KEY is kept strictly server-side and never exposed in client bundles.
 */

// In-memory cache to prevent repeated requests
const imdbCache = new Map();

/**
 * Fetch IMDb data for a given IMDb ID (e.g. "tt0816692")
 * Includes in-memory caching and graceful error handling.
 */
export async function fetchImdbData(imdbId) {
  // 1. Validation: check if IMDb ID is provided
  if (!imdbId || typeof imdbId !== 'string' || !imdbId.trim().startsWith('tt')) {
    return {
      available: false,
      imdbId: null,
      reason: 'No IMDb ID linked'
    };
  }

  const cleanId = imdbId.trim();

  // 2. Check in-memory cache
  if (imdbCache.has(cleanId)) {
    return imdbCache.get(cleanId);
  }

  try {
    // 3. Request through secure backend proxy endpoint
    const response = await fetch(`/api/omdb?imdbId=${encodeURIComponent(cleanId)}`);

    if (!response.ok) {
      const result = {
        available: false,
        imdbId: cleanId,
        imdbUrl: `https://www.imdb.com/title/${cleanId}/`,
        reason: 'IMDb service connection issue'
      };
      imdbCache.set(cleanId, result);
      return result;
    }

    const data = await response.json();

    // 4. Handle OMDb API error or missing movie
    if (data.Response === 'False' || !data.imdbRating || data.imdbRating === 'N/A') {
      const result = {
        available: false,
        imdbId: cleanId,
        imdbUrl: `https://www.imdb.com/title/${cleanId}/`,
        reason: 'IMDb rating unavailable'
      };
      imdbCache.set(cleanId, result);
      return result;
    }

    // 5. Extract Rotten Tomatoes score if available in Ratings array
    const rtRating = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null;

    // 6. Return verified IMDb data (never fabricated or substituted)
    const result = {
      available: true,
      imdbId: data.imdbID || cleanId,
      imdbRating: Number(data.imdbRating),
      imdbRatingRaw: data.imdbRating,
      imdbVotes: data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
      imdbUrl: `https://www.imdb.com/title/${cleanId}/`,
      metascore: data.Metascore && data.Metascore !== 'N/A' ? data.Metascore : null,
      rottenTomatoes: rtRating,
      awards: data.Awards && data.Awards !== 'N/A' ? data.Awards : null
    };

    // Cache the result
    imdbCache.set(cleanId, result);
    return result;
  } catch (err) {
    console.error(`Failed to fetch IMDb data for ${cleanId}:`, err);
    return {
      available: false,
      imdbId: cleanId,
      imdbUrl: `https://www.imdb.com/title/${cleanId}/`,
      reason: 'IMDb rating unavailable'
    };
  }
}
