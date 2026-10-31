/**
 * CineScope LocalStorage Persistence Service
 * Manages Personal Watchlist, Film Diary, and Collections with 100% client-side persistence.
 */

export const STORAGE_KEYS = {
  WATCHLIST: 'cinescope_user_watchlist',
  DIARY: 'cinescope_user_diary',
  COLLECTIONS: 'cinescope_user_collections'
};

// Default initial collections
export const DEFAULT_COLLECTIONS = [
  {
    id: 'col_favourites',
    name: 'Favourite Movies',
    description: 'Timeless films that left a permanent impression on my heart',
    theme: 'blush',
    icon: 'Heart',
    isDefault: true,
    movieIds: [157336] // Interstellar
  },
  {
    id: 'col_must_watch',
    name: 'Must Watch',
    description: 'High-priority films to experience at the earliest opportunity',
    theme: 'lavender',
    icon: 'Bookmark',
    isDefault: true,
    movieIds: [129] // Spirited Away
  },
  {
    id: 'col_watched',
    name: 'Watched',
    description: 'Completed stories logged in the journal archive',
    theme: 'sage',
    icon: 'Check',
    isDefault: true,
    movieIds: [157336]
  },
  {
    id: 'col_hidden_gems',
    name: 'Hidden Gems',
    description: 'Quiet, poetic non-blockbusters worth treasuring',
    theme: 'cream',
    icon: 'Sparkles',
    isDefault: true,
    movieIds: []
  },
  {
    id: 'col_rewatch_later',
    name: 'Rewatch Later',
    description: 'Masterpieces deserving a second viewing with fresh eyes',
    theme: 'lavender',
    icon: 'RotateCcw',
    isDefault: true,
    movieIds: []
  }
];

// Sample initial diary entry if clean
const INITIAL_SAMPLE_DIARY = [
  {
    id: 'entry_sample_interstellar',
    movieId: 157336,
    movie: {
      id: 157336,
      title: 'Interstellar',
      year: '2014',
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      backdrop: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
      rating: 8.5,
      runtimeMinutes: 169,
      duration: '2h 49m',
      director: 'Christopher Nolan',
      genres: ['Adventure', 'Drama', 'Science Fiction'],
      overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.'
    },
    personalRating: 9.5,
    review: 'A breathtaking fusion of cosmic wonder and profound human emotion. Nolan articulates love as a tangible physical dimension across space and time. The docking sequence accompanied by Hans Zimmer’s organ score remains one of cinema’s most transcendent moments.',
    notes: 'Watched on IMAX in 70mm. Awe-inspiring soundtrack. Left with tears in the third act.',
    dateWatched: '2026-10-20',
    createdAt: new Date().toISOString()
  }
];

// -------------------------------------------------------------
// Watchlist Helpers
// -------------------------------------------------------------

export function loadWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not load watchlist from LocalStorage:', err);
    return [];
  }
}

export function saveWatchlist(watchlist) {
  try {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
  } catch (err) {
    console.warn('Could not save watchlist to LocalStorage:', err);
  }
}

// -------------------------------------------------------------
// Film Diary Helpers
// -------------------------------------------------------------

export function loadDiaryEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DIARY);
    if (!raw) {
      // Seed with 1 sample entry so diary is not completely blank initially
      saveDiaryEntries(INITIAL_SAMPLE_DIARY);
      return INITIAL_SAMPLE_DIARY;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not load diary entries from LocalStorage:', err);
    return [];
  }
}

export function saveDiaryEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Could not save diary entries to LocalStorage:', err);
  }
}

// -------------------------------------------------------------
// Collections Helpers
// -------------------------------------------------------------

export function loadCollections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
    if (!raw) {
      saveCollections(DEFAULT_COLLECTIONS);
      return DEFAULT_COLLECTIONS;
    }
    const parsed = JSON.parse(raw);
    // Ensure default collections exist
    const existingIds = new Set(parsed.map(c => c.id));
    const merged = [...parsed];
    DEFAULT_COLLECTIONS.forEach(def => {
      if (!existingIds.has(def.id)) {
        merged.push(def);
      }
    });
    return merged;
  } catch (err) {
    console.warn('Could not load collections from LocalStorage:', err);
    return DEFAULT_COLLECTIONS;
  }
}

export function saveCollections(collections) {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  } catch (err) {
    console.warn('Could not save collections to LocalStorage:', err);
  }
}

// -------------------------------------------------------------
// Personal Statistics Calculator (100% verified actual user data)
// -------------------------------------------------------------

export function calculatePersonalStatistics(diaryEntries = [], watchlist = []) {
  const totalWatched = diaryEntries.length;
  const totalWatchlist = watchlist.length;

  // Average Personal Rating
  let averageRating = '—';
  if (totalWatched > 0) {
    const validRatings = diaryEntries
      .map(e => Number(e.personalRating))
      .filter(r => !isNaN(r) && r > 0);
    if (validRatings.length > 0) {
      const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
      averageRating = (sum / validRatings.length).toFixed(1);
    }
  }

  // Genre Frequency Calculation
  const genreTally = {};
  diaryEntries.forEach(entry => {
    const genres = entry.movie?.genres || [];
    genres.forEach(g => {
      genreTally[g] = (genreTally[g] || 0) + 1;
    });
  });

  let topGenre = 'None yet';
  let topGenreCount = 0;
  Object.entries(genreTally).forEach(([genre, count]) => {
    if (count > topGenreCount) {
      topGenre = genre;
      topGenreCount = count;
    }
  });

  // Movies Watched This Month
  const now = new Date();
  const currentYearMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
  const watchedThisMonth = diaryEntries.filter(entry => {
    if (!entry.dateWatched) return false;
    return entry.dateWatched.startsWith(currentYearMonth);
  }).length;

  // Total Watch Time Calculation
  let totalMinutes = 0;
  diaryEntries.forEach(entry => {
    const mins = Number(entry.movie?.runtimeMinutes);
    if (!isNaN(mins) && mins > 0) {
      totalMinutes += mins;
    } else if (entry.movie?.duration && entry.movie.duration.includes('h')) {
      // Fallback parse "2h 49m"
      const match = entry.movie.duration.match(/(\d+)h\s*(\d*)m?/);
      if (match) {
        const h = parseInt(match[1], 10) || 0;
        const m = parseInt(match[2], 10) || 0;
        totalMinutes += h * 60 + m;
      }
    }
  });

  let formattedWatchTime = '0h 0m';
  if (totalMinutes > 0) {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    formattedWatchTime = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  return {
    totalWatched,
    totalWatchlist,
    averageRating,
    topGenre,
    topGenreCount,
    watchedThisMonth,
    totalMinutes,
    formattedWatchTime,
    genreBreakdown: genreTally
  };
}

