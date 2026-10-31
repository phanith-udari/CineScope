import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, SlidersHorizontal, X, ArrowLeft, Star, Clock, 
  Calendar, RotateCcw, Sparkles, ChevronDown, Check, Globe,
  Film, Filter, ArrowUpDown, ChevronRight, Layers, Flame
} from 'lucide-react';
import { 
  searchAndDiscoverMovies, 
  searchMovies,
  TMDB_GENRES, 
  TMDB_LANGUAGES, 
  TMDB_SORT_OPTIONS 
} from '../services/tmdb';
import { MovieCard } from '../components/MovieCard';
import { MovieGridSkeleton } from '../components/MovieSkeleton';
import { ErrorState } from '../components/ErrorState';
import './SearchDiscoveryPage.css';

const RECENT_SEARCHES_KEY = 'cinescope_recent_searches';
const POPULAR_SEARCH_PRESETS = [
  'Interstellar',
  'Studio Ghibli',
  'Christopher Nolan',
  'Spirited Away',
  'Sci-Fi',
  'Everything Everywhere',
  'Past Lives',
  'La La Land'
];

const YEAR_RANGE_PRESETS = [
  { label: 'All Time', from: null, to: null },
  { label: '2020s', from: '2020', to: '2026' },
  { label: '2010s', from: '2010', to: '2019' },
  { label: '2000s', from: '2000', to: '2009' },
  { label: '1990s', from: '1990', to: '1999' },
  { label: 'Classics (< 1990)', from: '1950', to: '1989' }
];

const RATING_PRESETS = [
  { label: 'Any Rating', value: 0 },
  { label: '6.0+ ★', value: 6.0 },
  { label: '7.0+ ★', value: 7.0 },
  { label: '7.5+ ★', value: 7.5 },
  { label: '8.0+ ★', value: 8.0 }
];

const VOTE_COUNT_PRESETS = [
  { label: 'Any Votes', value: 0 },
  { label: '100+ votes', value: 100 },
  { label: '300+ votes', value: 300 },
  { label: '500+ votes', value: 500 },
  { label: '1,000+ votes', value: 1000 }
];

export const SearchDiscoveryPage = ({ 
  initialQuery = '', 
  onBack, 
  isInWatchlist, 
  onToggleWatchlist, 
  onSelectMovie 
}) => {
  // Search Text State
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);

  // Live Auto-complete suggestions while typing
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchBarRef = useRef(null);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : ['Interstellar', 'Spirited Away', 'Inception'];
    } catch {
      return ['Interstellar', 'Spirited Away'];
    }
  });

  // Filter States
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedYearPreset, setSelectedYearPreset] = useState('All Time');
  const [customYearFrom, setCustomYearFrom] = useState('');
  const [customYearTo, setCustomYearTo] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [minVotes, setMinVotes] = useState(0);
  const [sortBy, setSortBy] = useState('popularity.desc');

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Results State
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize initialQuery if changed from outside
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQueryInput(initialQuery);
      setSubmittedQuery(initialQuery);
    }
  }, [initialQuery]);

  // Save recent searches to localStorage
  const saveRecentSearch = (text) => {
    const clean = text.trim();
    if (!clean) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save recent search:', e);
      }
      return updated;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.warn('Could not clear recent searches:', e);
    }
  };

  // Debounced query live suggestions as user types
  useEffect(() => {
    if (!queryInput.trim() || queryInput.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const matches = await searchMovies(queryInput.trim(), 1);
        setSuggestions(matches.slice(0, 6));
      } catch (err) {
        console.warn('Autocomplete error:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [queryInput]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active year bounds
  const getActiveYears = useCallback(() => {
    if (customYearFrom || customYearTo) {
      return {
        from: customYearFrom || null,
        to: customYearTo || null
      };
    }
    const preset = YEAR_RANGE_PRESETS.find(p => p.label === selectedYearPreset);
    return {
      from: preset?.from || null,
      to: preset?.to || null
    };
  }, [customYearFrom, customYearTo, selectedYearPreset]);

  // Main movie fetching function
  const fetchMovies = useCallback(async (targetPage = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const years = getActiveYears();
      const res = await searchAndDiscoverMovies({
        query: submittedQuery,
        page: targetPage,
        genres: selectedGenres,
        yearFrom: years.from,
        yearTo: years.to,
        language: selectedLanguage,
        minRating: minRating,
        minVotes: minVotes,
        sortBy: sortBy
      });

      if (append) {
        setMovies(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newItems = res.results.filter(m => !existingIds.has(m.id));
          return [...prev, ...newItems];
        });
      } else {
        setMovies(res.results);
      }

      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotalResults(res.totalResults);
    } catch (err) {
      console.error('Failed to fetch discovery movies:', err);
      setError(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [
    submittedQuery, 
    selectedGenres, 
    getActiveYears,
    selectedLanguage, 
    minRating, 
    minVotes, 
    sortBy
  ]);

  // Re-fetch whenever filters or submittedQuery changes
  useEffect(() => {
    setPage(1);
    fetchMovies(1, false);
  }, [fetchMovies]);

  // Handle Search Submission
  const handleSearchSubmit = (textToSearch) => {
    const q = textToSearch !== undefined ? textToSearch : queryInput;
    setSubmittedQuery(q.trim());
    setShowSuggestions(false);
    if (q.trim()) {
      saveRecentSearch(q.trim());
    }
  };

  // Toggle Genre
  const handleToggleGenre = (genreId) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId) 
        : [...prev, genreId]
    );
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedGenres([]);
    setSelectedYearPreset('All Time');
    setCustomYearFrom('');
    setCustomYearTo('');
    setSelectedLanguage('all');
    setMinRating(0);
    setMinVotes(0);
    setSortBy('popularity.desc');
  };

  // Active filter count for badge
  const activeFiltersCount = 
    selectedGenres.length +
    (selectedYearPreset !== 'All Time' || customYearFrom || customYearTo ? 1 : 0) +
    (selectedLanguage !== 'all' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (minVotes > 0 ? 1 : 0) +
    (sortBy !== 'popularity.desc' ? 1 : 0);

  return (
    <div className="search-discovery-page">
      {/* Decorative ambient background */}
      <div className="discovery-ambient-blur blur-top-left" />
      <div className="discovery-ambient-blur blur-top-right" />

      <div className="container discovery-container">
        {/* Navigation & Header */}
        <div className="discovery-top-nav">
          <button className="back-link-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Return to CineScope</span>
          </button>
        </div>

        {/* Hero Search Box Area */}
        <header className="discovery-header-section">
          <div className="discovery-title-pill">
            <span className="pill-badge badge-lavender">
              <Sparkles size={13} />
              <span>CineScope Global Vault · TMDB Discovery</span>
            </span>
          </div>

          <h1 className="discovery-main-title">
            Search & Explore <span className="highlight-text-curve">Cinema.</span>
          </h1>
          <p className="discovery-subtitle">
            Search titles, filter by cinematic genres, release eras, languages, and ratings 
            to uncover hidden gems and masterpieces.
          </p>

          {/* Prominent Large Search Bar */}
          <div className="large-search-wrapper" ref={searchBarRef}>
            <div className="large-search-box">
              <Search size={22} className="large-search-icon" />
              <input
                type="text"
                placeholder="Search movies by title (e.g. Interstellar, Past Lives, Miyazaki)..."
                value={queryInput}
                onChange={(e) => {
                  setQueryInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                className="large-search-input"
              />
              {queryInput && (
                <button 
                  className="clear-query-btn" 
                  onClick={() => {
                    setQueryInput('');
                    setSubmittedQuery('');
                    setSuggestions([]);
                  }}
                  title="Clear text"
                >
                  <X size={16} />
                </button>
              )}
              <button 
                className="search-execute-btn"
                onClick={() => handleSearchSubmit()}
              >
                <span>Search</span>
                <Sparkles size={16} />
              </button>
            </div>

            {/* Live Autocomplete Suggestions Dropdown */}
            {showSuggestions && queryInput.trim().length >= 2 && (
              <div className="search-suggestions-dropdown">
                {suggestionsLoading ? (
                  <div className="suggestions-loading">
                    <Sparkles size={14} className="spin-icon" />
                    <span>Searching cinema database...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="suggestions-empty">
                    <span>No quick title matches. Press Enter to perform a global search.</span>
                  </div>
                ) : (
                  <div className="suggestions-list">
                    <span className="suggestions-header-label">Instant Matches</span>
                    {suggestions.map(item => (
                      <div 
                        key={item.id} 
                        className="suggestion-item"
                        onClick={() => {
                          setShowSuggestions(false);
                          onSelectMovie(item);
                        }}
                      >
                        <img 
                          src={item.poster} 
                          alt={item.title} 
                          className="suggestion-thumb" 
                        />
                        <div className="suggestion-info">
                          <h5 className="suggestion-title">{item.title}</h5>
                          <span className="suggestion-meta">
                            {item.year} • {item.genres.slice(0, 2).join(', ')} • ★ {item.rating}
                          </span>
                        </div>
                        <div className="suggestion-action">
                          <span>View</span>
                          <ChevronRight size={13} />
                        </div>
                      </div>
                    ))}
                    <div 
                      className="suggestion-view-all"
                      onClick={() => handleSearchSubmit()}
                    >
                      <span>Search all results for “{queryInput}”</span>
                      <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent & Popular Search Pills */}
          <div className="search-quick-tags-container">
            {recentSearches.length > 0 && (
              <div className="quick-tags-row recent-row">
                <span className="quick-row-label">
                  <Clock size={12} />
                  <span>Recent:</span>
                </span>
                <div className="tags-flex">
                  {recentSearches.map((term, i) => (
                    <button 
                      key={i} 
                      className="history-pill"
                      onClick={() => {
                        setQueryInput(term);
                        handleSearchSubmit(term);
                      }}
                    >
                      <span>{term}</span>
                    </button>
                  ))}
                  <button 
                    className="clear-history-link"
                    onClick={handleClearRecentSearches}
                    title="Clear recent searches"
                  >
                    Clear history
                  </button>
                </div>
              </div>
            )}

            <div className="quick-tags-row popular-row">
              <span className="quick-row-label">
                <Flame size={12} />
                <span>Trending Searches:</span>
              </span>
              <div className="tags-flex">
                {POPULAR_SEARCH_PRESETS.map((preset, i) => (
                  <button 
                    key={i} 
                    className="popular-pill"
                    onClick={() => {
                      setQueryInput(preset);
                      handleSearchSubmit(preset);
                    }}
                  >
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Filter Toggle Button */}
        <div className="mobile-filter-bar">
          <button 
            className="mobile-filter-toggle-btn"
            onClick={() => setMobileFilterOpen(true)}
          >
            <SlidersHorizontal size={16} />
            <span>Filters & Sorting</span>
            {activeFiltersCount > 0 && (
              <span className="filter-count-badge">{activeFiltersCount}</span>
            )}
          </button>

          <span className="mobile-results-counter">
            {loading ? 'Searching...' : `${totalResults.toLocaleString()} titles`}
          </span>
        </div>

        {/* Main Layout Grid: Sidebar Filters (Desktop) + Results Grid */}
        <div className="discovery-main-layout">
          {/* Filters Sidebar (Desktop) / Modal Drawer (Mobile) */}
          <aside className={`discovery-filters-sidebar ${mobileFilterOpen ? 'mobile-drawer-open' : ''}`}>
            <div className="sidebar-inner-card">
              <div className="sidebar-header">
                <div className="sidebar-title-group">
                  <Filter size={16} className="sidebar-icon" />
                  <h3 className="sidebar-title">Filters & Discovery</h3>
                </div>
                <div className="sidebar-header-actions">
                  {activeFiltersCount > 0 && (
                    <button 
                      className="reset-filters-btn"
                      onClick={handleResetFilters}
                      title="Reset all filters"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  )}
                  {mobileFilterOpen && (
                    <button 
                      className="mobile-drawer-close"
                      onClick={() => setMobileFilterOpen(false)}
                      aria-label="Close filters"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="sidebar-scrollable-content">
                {/* 1. Sort By */}
                <div className="filter-block">
                  <div className="filter-block-label">
                    <ArrowUpDown size={13} />
                    <span>Sort Movies By</span>
                  </div>
                  <div className="select-wrapper">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      {TMDB_SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-chevron" />
                  </div>
                </div>

                {/* 2. Genres Filter */}
                <div className="filter-block">
                  <div className="filter-block-label">
                    <Layers size={13} />
                    <span>Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}</span>
                  </div>
                  <div className="genre-chips-grid">
                    {TMDB_GENRES.map(genre => {
                      const isSelected = selectedGenres.includes(genre.id);
                      return (
                        <button
                          key={genre.id}
                          className={`genre-filter-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => handleToggleGenre(genre.id)}
                        >
                          {isSelected && <Check size={11} className="chip-check" />}
                          <span>{genre.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Release Year & Era */}
                <div className="filter-block">
                  <div className="filter-block-label">
                    <Calendar size={13} />
                    <span>Release Era</span>
                  </div>
                  <div className="era-pills-row">
                    {YEAR_RANGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        className={`era-pill ${selectedYearPreset === preset.label && !customYearFrom && !customYearTo ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedYearPreset(preset.label);
                          setCustomYearFrom('');
                          setCustomYearTo('');
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Year Range Inputs */}
                  <div className="custom-year-row">
                    <span className="custom-year-label">Custom Year:</span>
                    <input
                      type="number"
                      placeholder="From (e.g. 1994)"
                      value={customYearFrom}
                      onChange={(e) => {
                        setCustomYearFrom(e.target.value);
                        setSelectedYearPreset('');
                      }}
                      className="year-input"
                      min="1900"
                      max="2030"
                    />
                    <span className="year-separator">—</span>
                    <input
                      type="number"
                      placeholder="To (e.g. 2024)"
                      value={customYearTo}
                      onChange={(e) => {
                        setCustomYearTo(e.target.value);
                        setSelectedYearPreset('');
                      }}
                      className="year-input"
                      min="1900"
                      max="2030"
                    />
                  </div>
                </div>

                {/* 4. Original Spoken Language */}
                <div className="filter-block">
                  <div className="filter-block-label">
                    <Globe size={13} />
                    <span>Original Language</span>
                  </div>
                  <div className="select-wrapper">
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="filter-select"
                    >
                      {TMDB_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-chevron" />
                  </div>
                </div>

                {/* 5. Minimum TMDB Rating */}
                <div className="filter-block">
                  <div className="filter-block-label">
                    <Star size={13} />
                    <span>Minimum TMDB Rating ({minRating > 0 ? `${minRating.toFixed(1)}★` : 'Any'})</span>
                  </div>
                  <div className="rating-presets-row">
                    {RATING_PRESETS.map((r, i) => (
                      <button
                        key={i}
                        className={`rating-pill-btn ${minRating === r.value ? 'active' : ''}`}
                        onClick={() => setMinRating(r.value)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Minimum Vote Count */}
                <div className="filter-block">
                  <div className="filter-block-label">
                    <Flame size={13} />
                    <span>Minimum Votes</span>
                  </div>
                  <div className="votes-presets-row">
                    {VOTE_COUNT_PRESETS.map((v, i) => (
                      <button
                        key={i}
                        className={`vote-pill-btn ${minVotes === v.value ? 'active' : ''}`}
                        onClick={() => setMinVotes(v.value)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Drawer Apply Action */}
              {mobileFilterOpen && (
                <div className="mobile-drawer-footer">
                  <button 
                    className="btn-primary drawer-apply-btn"
                    onClick={() => setMobileFilterOpen(false)}
                  >
                    <span>View {totalResults > 0 ? `${totalResults} Titles` : 'Results'}</span>
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Right Column: Active Chips Bar & Results Grid */}
          <main className="discovery-results-column">
            {/* Active Filter Chips Bar */}
            <div className="active-filters-bar">
              <div className="active-chips-scroll">
                {submittedQuery && (
                  <span className="active-chip query-chip">
                    <span>Title: “{submittedQuery}”</span>
                    <button 
                      onClick={() => {
                        setQueryInput('');
                        setSubmittedQuery('');
                      }}
                      title="Remove title filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedGenres.map(gId => {
                  const g = TMDB_GENRES.find(item => item.id === gId);
                  return (
                    <span key={gId} className="active-chip genre-chip">
                      <span>{g ? g.name : gId}</span>
                      <button onClick={() => handleToggleGenre(gId)} title="Remove genre">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}

                {(selectedYearPreset !== 'All Time' || customYearFrom || customYearTo) && (
                  <span className="active-chip era-chip">
                    <span>
                      {customYearFrom || customYearTo 
                        ? `${customYearFrom || 'Any'} - ${customYearTo || 'Present'}`
                        : selectedYearPreset}
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedYearPreset('All Time');
                        setCustomYearFrom('');
                        setCustomYearTo('');
                      }}
                      title="Remove year filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedLanguage !== 'all' && (
                  <span className="active-chip lang-chip">
                    <span>Lang: {TMDB_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage}</span>
                    <button onClick={() => setSelectedLanguage('all')} title="Remove language filter">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {minRating > 0 && (
                  <span className="active-chip rating-chip">
                    <span>Min {minRating.toFixed(1)}★</span>
                    <button onClick={() => setMinRating(0)} title="Remove rating filter">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {minVotes > 0 && (
                  <span className="active-chip votes-chip">
                    <span>{minVotes.toLocaleString()}+ votes</span>
                    <button onClick={() => setMinVotes(0)} title="Remove votes filter">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {activeFiltersCount > 0 && (
                  <button className="clear-all-chips-btn" onClick={handleResetFilters}>
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Result Count Stat */}
              <div className="results-count-stat">
                <span className="count-num">
                  {loading ? '...' : totalResults.toLocaleString()}
                </span>
                <span className="count-label">
                  {totalResults === 1 ? 'film match' : 'films discovered'}
                </span>
              </div>
            </div>

            {/* Results Content State */}
            {loading ? (
              <div className="discovery-grid-wrap">
                <MovieGridSkeleton count={8} />
              </div>
            ) : error ? (
              <div className="discovery-error-wrap">
                <ErrorState 
                  error={error} 
                  onRetry={() => fetchMovies(1, false)} 
                  title="Couldn't complete cinema search"
                />
              </div>
            ) : movies.length === 0 ? (
              <div className="discovery-empty-state">
                <div className="empty-state-icon">
                  <Film size={40} />
                </div>
                <h3 className="empty-state-title">No matching cinematic stories found</h3>
                <p className="empty-state-text">
                  We couldn't find any films matching your exact search criteria. Try relaxing your 
                  minimum rating, clearing some genre filters, or searching for a broader title keyword.
                </p>
                <button className="btn-secondary empty-reset-btn" onClick={handleResetFilters}>
                  <RotateCcw size={14} />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div className="discovery-results-grid-container">
                <div className="movies-grid discovery-grid">
                  {movies.map(movie => (
                    <MovieCard 
                      key={movie.id}
                      movie={movie}
                      isInWatchlist={isInWatchlist(movie)}
                      onToggleWatchlist={onToggleWatchlist}
                      onSelectMovie={onSelectMovie}
                    />
                  ))}
                </div>

                {/* Pagination / Load More Button */}
                {page < totalPages && (
                  <div className="discovery-pagination-wrap">
                    <button 
                      className="btn-primary load-more-btn"
                      onClick={() => fetchMovies(page + 1, true)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Sparkles size={16} className="spin-icon" />
                          <span>Unlocking more stories...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Titles</span>
                          <span className="page-indicator-pill">Page {page} of {totalPages}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

