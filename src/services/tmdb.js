/**
 * CineScope Centralized TMDB API Service
 * Securely communicates with The Movie Database (TMDB) API v3
 * using environment variables (VITE_TMDB_API_KEY).
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_POSTER = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
export const TMDB_IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// Fallback pastel poster for movies without poster_path
export const FALLBACK_POSTER = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='750' viewBox='0 0 500 750'%3E%3Crect width='500' height='750' fill='%23F4F0FD'/%3E%3Ccircle cx='250' cy='320' r='90' fill='%23FAD2E1'/%3E%3Cpath d='M220 290 L290 320 L220 350 Z' fill='%238C7AB6'/%3E%3Ctext x='250' y='460' font-family='sans-serif' font-size='22' font-weight='600' fill='%235E4E85' text-anchor='middle'%3ENo Poster Available%3C/text%3E%3Ctext x='250' y='495' font-family='sans-serif' font-size='16' fill='%23887B98' text-anchor='middle'%3ECineScope Journal Archive%3C/text%3E%3C/svg%3E";

export const FALLBACK_BACKDROP = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23E8E0F8'/%3E%3Cstop offset='50%25' stop-color='%23FAD2E1'/%3E%3Cstop offset='100%25' stop-color='%23C5DBD6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1280' height='720' fill='url(%23bg)'/%3E%3Ctext x='640' y='360' font-family='sans-serif' font-size='32' font-weight='600' fill='%235E4E85' text-anchor='middle'%3ECineScope Film Sanctuary%3C/text%3E%3C/svg%3E";

// In-memory cache for genre map
let genreMap = null;

/**
 * Retrieve the TMDB API key safely from environment variables
 */
export function getApiKey() {
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TMDB_API_KEY)
    || (typeof process !== 'undefined' && process.env?.VITE_TMDB_API_KEY)
    || '';
  return envKey ? envKey.trim() : '';
}

/**
 * Format poster image URL
 */
export function getPosterUrl(path, size = 'w500') {
  if (!path) return FALLBACK_POSTER;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

/**
 * Format backdrop image URL
 */
export function getBackdropUrl(path, size = 'w1280') {
  if (!path) return FALLBACK_BACKDROP;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

/**
 * Core fetch wrapper with secure query parameters and error classification
 */
async function fetchFromTMDB(endpoint, params = {}) {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    throw new Error('MISSING_API_KEY');
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    language: 'en-US',
    include_adult: 'false',
    ...params
  });

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);

    if (response.status === 401) {
      throw new Error('INVALID_API_KEY');
    }

    if (response.status === 404) {
      throw new Error('NOT_FOUND');
    }

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (err.message === 'MISSING_API_KEY' || err.message === 'INVALID_API_KEY' || err.message === 'NOT_FOUND') {
      throw err;
    }
    // Network or parser error
    throw new Error('NETWORK_ERROR');
  }
}

/**
 * Fetch and cache official TMDB genre list
 */
export async function getGenres() {
  if (genreMap) return genreMap;
  try {
    const data = await fetchFromTMDB('/genre/movie/list');
    genreMap = {};
    if (data && data.genres) {
      data.genres.forEach(g => {
        genreMap[g.id] = g.name;
      });
    }
    return genreMap;
  } catch (err) {
    console.warn('Failed to fetch TMDB genres, using fallback map', err);
    return {
      28: 'Action',
      12: 'Adventure',
      16: 'Animation',
      35: 'Comedy',
      80: 'Crime',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      14: 'Fantasy',
      36: 'History',
      27: 'Horror',
      10402: 'Music',
      9648: 'Mystery',
      10749: 'Romance',
      878: 'Sci-Fi',
      10770: 'TV Movie',
      53: 'Thriller',
      10752: 'War',
      37: 'Western'
    };
  }
}

/**
 * Assign an aesthetic pastel palette based on movie properties
 */
function getPastelPalette(movie) {
  const palettes = ['lavender', 'blush', 'sage', 'cream'];
  const index = Math.abs((movie.id || 0) % palettes.length);
  return palettes[index];
}

/**
 * Format runtime (e.g. 118 -> "1h 58m")
 */
export function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return 'Feature Film';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Convert ISO language code to human-readable language name
 */
export function formatLanguage(code) {
  if (!code) return 'English';
  const langMap = {
    en: 'English',
    ja: 'Japanese',
    fr: 'French',
    ko: 'Korean',
    es: 'Spanish',
    de: 'German',
    it: 'Italian',
    hi: 'Hindi',
    zh: 'Mandarin',
    cn: 'Cantonese',
    sv: 'Swedish',
    da: 'Danish',
    no: 'Norwegian',
    pt: 'Portuguese',
    ru: 'Russian',
    pl: 'Polish'
  };
  return langMap[code.toLowerCase()] || code.toUpperCase();
}

/**
 * Extract curated thematic motifs from verified genre and overview
 */
export function extractMovieThemes(movie) {
  if (!movie) return [];
  const themes = [];
  const genres = movie.genres || [];
  const overview = (movie.overview || '').toLowerCase();
  
  if (genres.includes('Science Fiction') || genres.includes('Sci-Fi')) {
    if (overview.includes('space') || overview.includes('planet') || overview.includes('earth') || overview.includes('galaxy')) {
      themes.push('Cosmic Survival & Exploration');
    }
    themes.push('Human Destiny & Technology');
  }
  if (genres.includes('Drama')) {
    if (overview.includes('family') || overview.includes('father') || overview.includes('mother') || overview.includes('daughter') || overview.includes('son')) {
      themes.push('Family Bonds & Kinship');
    } else if (overview.includes('grief') || overview.includes('loss') || overview.includes('death')) {
      themes.push('Grief, Loss & Healing');
    } else {
      themes.push('Personal Resilience & Integrity');
    }
  }
  if (genres.includes('Romance')) {
    themes.push('Love, Longing & Time');
  }
  if (genres.includes('Thriller') || genres.includes('Mystery')) {
    if (overview.includes('murder') || overview.includes('investigat') || overview.includes('detective')) {
      themes.push('Search for Truth & Moral Cost');
    } else {
      themes.push('Psychological Tension & Identity');
    }
  }
  if (genres.includes('Adventure') || genres.includes('Action')) {
    themes.push('Courage & The Hero\'s Journey');
  }
  if (genres.includes('Animation') || genres.includes('Fantasy')) {
    themes.push('Transformation, Wonder & Hope');
  }
  if (genres.includes('Crime')) {
    themes.push('Justice, Morality & Consequences');
  }
  if (genres.includes('War') || genres.includes('History')) {
    themes.push('Historical Memory & Human Sacrifice');
  }
  if (genres.includes('Comedy')) {
    themes.push('Human Connection & Finding Light');
  }
  if (genres.includes('Horror')) {
    themes.push('The Unknown & Confronting Fear');
  }
  if (genres.includes('Music')) {
    themes.push('Artistic Passion & Creative Expression');
  }
  if (themes.length === 0) {
    themes.push('Human Connection', 'Overcoming Adversity');
  }
  // Deduplicate and return top 3
  return Array.from(new Set(themes)).slice(0, 3);
}

/**
 * Normalize raw TMDB movie data into a structured CineScope movie object
 */
export async function normalizeMovie(raw, genresDict = null) {
  if (!raw) return null;
  const genresLookup = genresDict || (await getGenres());

  // Extract genre names
  let genreNames = [];
  if (Array.isArray(raw.genres) && raw.genres.length > 0) {
    genreNames = raw.genres.map(g => g.name);
  } else if (Array.isArray(raw.genre_ids)) {
    genreNames = raw.genre_ids.map(id => genresLookup[id]).filter(Boolean);
  }

  // Release year
  const releaseYear = raw.release_date ? raw.release_date.split('-')[0] : 'N/A';

  // Editorial badge based on popularity / rating
  let badge = '';
  if (raw.vote_average >= 8.4) {
    badge = 'Critical Masterpiece';
  } else if (raw.vote_average >= 7.8) {
    badge = 'Curator Pick';
  } else if (raw.popularity > 200) {
    badge = 'Crowd Favorite';
  } else if (raw.release_date && new Date(raw.release_date) > new Date()) {
    badge = 'Upcoming Premiere';
  }

  const movieObj = {
    id: raw.id,
    title: raw.title || raw.original_title || 'Untitled Story',
    year: releaseYear,
    releaseDate: raw.release_date || '',
    duration: raw.runtime ? formatRuntime(raw.runtime) : '1h 50m',
    runtimeMinutes: raw.runtime || 0,
    originalLanguage: formatLanguage(raw.original_language),
    rawLanguage: raw.original_language || 'en',
    rating: raw.vote_average ? Number(raw.vote_average.toFixed(1)) : 0,
    voteCount: raw.vote_count || 0,
    director: raw.credits?.crew?.find(c => c.job === 'Director')?.name || 'Cinema Director',
    cast: raw.credits?.cast?.slice(0, 5).map(c => c.name) || [],
    genres: genreNames.length > 0 ? genreNames.slice(0, 3) : ['Cinema'],
    overview: raw.overview || 'No overview synopsis provided for this title yet.',
    synopsis: raw.overview || 'No overview synopsis provided for this title yet.',
    poster: getPosterUrl(raw.poster_path),
    backdrop: getBackdropUrl(raw.backdrop_path),
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    palette: getPastelPalette(raw),
    badge: badge,
    journalNote: raw.tagline || (raw.overview ? raw.overview.slice(0, 95) + '...' : 'A quiet aesthetic frame captured in time.'),
    popularity: raw.popularity || 0,
    status: raw.status || 'Released',
    imdbId: raw.external_ids?.imdb_id || raw.imdb_id || null
  };

  movieObj.themes = extractMovieThemes(movieObj);
  return movieObj;
}

/**
 * Normalizes an array of raw TMDB movies
 */
export async function normalizeMovieList(results) {
  if (!Array.isArray(results)) return [];
  const genresDict = await getGenres();
  return Promise.all(results.map(item => normalizeMovie(item, genresDict)));
}

// -------------------------------------------------------------
// TMDB API Endpoints
// -------------------------------------------------------------

/**
 * 1. Trending Movies (week or day)
 */
export async function fetchTrendingMovies(timeWindow = 'week', page = 1) {
  const data = await fetchFromTMDB(`/trending/movie/${timeWindow}`, { page });
  return normalizeMovieList(data.results || []);
}

/**
 * 2. Popular Movies
 */
export async function fetchPopularMovies(page = 1) {
  const data = await fetchFromTMDB('/movie/popular', { page });
  return normalizeMovieList(data.results || []);
}

/**
 * 3. Top Rated Movies
 */
export async function fetchTopRatedMovies(page = 1) {
  const data = await fetchFromTMDB('/movie/top_rated', { page });
  return normalizeMovieList(data.results || []);
}

/**
 * 4. Upcoming Movies
 */
export async function fetchUpcomingMovies(page = 1) {
  const data = await fetchFromTMDB('/movie/upcoming', { page });
  return normalizeMovieList(data.results || []);
}

/**
 * 5. Hidden Gems
 * High rated (>= 7.6) with reasonable vote counts (< 4000), sorting by rating
 */
export async function fetchHiddenGems(page = 1) {
  const data = await fetchFromTMDB('/discover/movie', {
    page,
    'vote_average.gte': '7.6',
    'vote_count.gte': '120',
    'vote_count.lte': '4000',
    sort_by: 'vote_average.desc',
    'primary_release_date.lte': new Date().toISOString().split('T')[0]
  });
  const normalized = await normalizeMovieList(data.results || []);
  return normalized.map(movie => ({
    ...movie,
    isHiddenGem: true,
    gemReason: `Scored ${movie.rating}★ across ${movie.voteCount.toLocaleString()} cinephile votes. A soulful, non-blockbuster discovery.`
  }));
}

/**
 * 6. Browse by Mood
 * Maps CineScope mood categories to TMDB genre filters
 */
export async function fetchMoviesByMood(mood, page = 1) {
  const moodGenreMap = {
    'Feel Good': { with_genres: '35,10751', sort_by: 'popularity.desc' }, // Comedy, Family
    'Mind Bending': { with_genres: '878,9648', sort_by: 'vote_average.desc', 'vote_count.gte': '300' }, // Sci-Fi, Mystery
    'Emotional': { with_genres: '18,10749', sort_by: 'vote_average.desc', 'vote_count.gte': '250' }, // Drama, Romance
    'Thriller': { with_genres: '53,9648', sort_by: 'popularity.desc' }, // Thriller, Mystery
    'Adventure': { with_genres: '12,14', sort_by: 'popularity.desc' }, // Adventure, Fantasy
    'Romantic': { with_genres: '10749', sort_by: 'vote_average.desc', 'vote_count.gte': '200' } // Romance
  };

  const config = moodGenreMap[mood] || { sort_by: 'popularity.desc' };
  const data = await fetchFromTMDB('/discover/movie', {
    page,
    ...config
  });
  return normalizeMovieList(data.results || []);
}

/**
 * Official TMDB Genre List with IDs
 */
export const TMDB_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

/**
 * Filterable Languages
 */
export const TMDB_LANGUAGES = [
  { code: 'all', name: 'All Languages' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'fr', name: 'French' },
  { code: 'ko', name: 'Korean' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Mandarin' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'da', name: 'Danish' },
  { code: 'sv', name: 'Swedish' }
];

/**
 * Supported Sort Options
 */
export const TMDB_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest Releases' },
  { value: 'primary_release_date.asc', label: 'Oldest Releases' },
  { value: 'vote_count.desc', label: 'Most Voted' }
];

/**
 * 7. Search Movies
 */
export async function searchMovies(query, page = 1) {
  if (!query || !query.trim()) return [];
  const data = await fetchFromTMDB('/search/movie', {
    query: query.trim(),
    page
  });
  return normalizeMovieList(data.results || []);
}

/**
 * 7b. Advanced Search & Discover Movies
 * Seamlessly switches between /search/movie (when keyword query provided)
 * and /discover/movie (when filtering by genre, rating, year, language, sort)
 */
export async function searchAndDiscoverMovies({
  query = '',
  page = 1,
  genres = [],
  yearFrom = null,
  yearTo = null,
  language = 'all',
  minRating = 0,
  minVotes = 0,
  sortBy = 'popularity.desc'
}) {
  const hasTextQuery = query && query.trim().length > 0;

  if (hasTextQuery) {
    const searchParams = {
      query: query.trim(),
      page
    };
    if (yearFrom && yearFrom === yearTo) {
      searchParams.primary_release_year = yearFrom;
    }
    const data = await fetchFromTMDB('/search/movie', searchParams);
    let normalized = await normalizeMovieList(data.results || []);

    // Filter by genres if selected
    if (genres.length > 0) {
      const genresDict = await getGenres();
      const targetGenreNames = genres.map(id => genresDict[id] || id);
      normalized = normalized.filter(m => 
        (m.genres || []).some(g => targetGenreNames.includes(g))
      );
    }

    // Filter by language
    if (language && language !== 'all') {
      normalized = normalized.filter(m => m.rawLanguage === language);
    }

    // Filter by year range
    if (yearFrom) {
      normalized = normalized.filter(m => {
        const y = parseInt(m.year, 10);
        return !isNaN(y) && y >= parseInt(yearFrom, 10);
      });
    }
    if (yearTo) {
      normalized = normalized.filter(m => {
        const y = parseInt(m.year, 10);
        return !isNaN(y) && y <= parseInt(yearTo, 10);
      });
    }

    // Filter by min rating
    if (minRating > 0) {
      normalized = normalized.filter(m => m.rating >= minRating);
    }

    // Filter by min votes
    if (minVotes > 0) {
      normalized = normalized.filter(m => m.voteCount >= minVotes);
    }

    // Client-side sorting for text search results
    if (sortBy === 'vote_average.desc') {
      normalized.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'primary_release_date.desc') {
      normalized.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
    } else if (sortBy === 'primary_release_date.asc') {
      normalized.sort((a, b) => (a.releaseDate || '').localeCompare(b.releaseDate || ''));
    } else if (sortBy === 'vote_count.desc') {
      normalized.sort((a, b) => b.voteCount - a.voteCount);
    } else {
      normalized.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return {
      results: normalized,
      totalResults: data.total_results || normalized.length,
      totalPages: data.total_pages || 1,
      page: data.page || page
    };
  } else {
    // TMDB Discover endpoint
    const discoverParams = {
      page,
      sort_by: sortBy || 'popularity.desc'
    };

    if (genres.length > 0) {
      discoverParams.with_genres = genres.join(',');
    }
    if (language && language !== 'all') {
      discoverParams.with_original_language = language;
    }
    if (yearFrom) {
      discoverParams['primary_release_date.gte'] = `${yearFrom}-01-01`;
    }
    if (yearTo) {
      discoverParams['primary_release_date.lte'] = `${yearTo}-12-31`;
    }
    if (minRating > 0) {
      discoverParams['vote_average.gte'] = minRating;
    }
    if (minVotes > 0) {
      discoverParams['vote_count.gte'] = minVotes;
    } else if (sortBy === 'vote_average.desc') {
      discoverParams['vote_count.gte'] = 50; // Guard against 1-vote anomalies
    }

    const data = await fetchFromTMDB('/discover/movie', discoverParams);
    const normalized = await normalizeMovieList(data.results || []);

    return {
      results: normalized,
      totalResults: data.total_results || 0,
      totalPages: data.total_pages || 1,
      page: data.page || page
    };
  }
}

/**
 * 8. External IDs (IMDb ID, Wikidata, etc.)
 */
export async function fetchMovieExternalIds(movieId) {
  if (!movieId) return null;
  try {
    const data = await fetchFromTMDB(`/movie/${movieId}/external_ids`);
    return data;
  } catch (err) {
    console.warn(`Failed to fetch external IDs for movie ${movieId}:`, err);
    return null;
  }
}

/**
 * 9. Full Movie Details (including credits, similar & external_ids)
 */
export async function fetchMovieDetails(movieId) {
  if (!movieId) return null;
  const raw = await fetchFromTMDB(`/movie/${movieId}`, {
    append_to_response: 'credits,similar,videos,external_ids'
  });
  const normalized = await normalizeMovie(raw);
  
  // Attach IMDb ID from external_ids or fallback endpoint
  let imdbId = raw.external_ids?.imdb_id || raw.imdb_id || null;
  if (!imdbId) {
    const ext = await fetchMovieExternalIds(movieId);
    imdbId = ext?.imdb_id || null;
  }
  normalized.imdbId = imdbId;

  // Attach director & full cast
  if (raw.credits) {
    const director = raw.credits.crew?.find(c => c.job === 'Director')?.name || 'Cinema Director';
    const topCast = raw.credits.cast?.slice(0, 8).map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
    })) || [];
    
    normalized.director = director;
    normalized.castList = topCast;
    normalized.tagline = raw.tagline || '';
    normalized.budget = raw.budget;
    normalized.revenue = raw.revenue;
    normalized.status = raw.status;
  }
  return normalized;
}

/**
 * 10. Fetch Similar and Recommended movies combined, deduplicated, excluding current movie
 */
export async function fetchMovieRecommendationsAndSimilar(movieId) {
  if (!movieId) return [];
  try {
    const [recRes, simRes] = await Promise.allSettled([
      fetchFromTMDB(`/movie/${movieId}/recommendations`),
      fetchFromTMDB(`/movie/${movieId}/similar`)
    ]);

    const recList = recRes.status === 'fulfilled' ? (recRes.value?.results || []) : [];
    const simList = simRes.status === 'fulfilled' ? (simRes.value?.results || []) : [];

    // Prioritize recommendations, then similar
    const combined = [...recList, ...simList];
    const seen = new Set();
    const unique = [];

    for (const item of combined) {
      if (item && item.id && item.id !== Number(movieId) && !seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }

    return normalizeMovieList(unique.slice(0, 10));
  } catch (err) {
    console.warn(`Failed to fetch recommendations for movie ${movieId}:`, err);
    return [];
  }
}
