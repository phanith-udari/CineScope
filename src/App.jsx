import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrendingSection } from './components/TrendingSection';
import { HiddenGemsSection } from './components/HiddenGemsSection';
import { BrowseMoodSection } from './components/BrowseMoodSection';
import { MovieModal } from './components/MovieModal';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { MovieCard } from './components/MovieCard';
import { MovieGridSkeleton } from './components/MovieSkeleton';
import { ErrorState } from './components/ErrorState';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { SearchDiscoveryPage } from './pages/SearchDiscoveryPage';
import { PersonalJournalPage } from './pages/PersonalJournalPage';
import { fetchTrendingMovies, searchMovies } from './services/tmdb';
import { Search, Sparkles, X, ArrowLeft } from 'lucide-react';
import './App.css';

const WATCHLIST_STORAGE_KEY = 'cinescope_user_watchlist';

export default function App() {
  // Watchlist persisted in localStorage
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [heroMovie, setHeroMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Active view: homepage, search discovery, diary/journal, or movie details page
  const [activeMovieId, setActiveMovieId] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/movie/')) {
      return hash.replace('#/movie/', '');
    }
    return null;
  });

  const [isSearchView, setIsSearchView] = useState(() => {
    return window.location.hash.startsWith('#/search');
  });

  const [isDiaryView, setIsDiaryView] = useState(() => {
    return window.location.hash.startsWith('#/diary') || 
           window.location.hash.startsWith('#/watchlist') || 
           window.location.hash.startsWith('#/collections') ||
           window.location.hash.startsWith('#/journal') ||
           window.location.hash.startsWith('#/stats');
  });

  const [diaryInitialTab, setDiaryInitialTab] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/watchlist')) return 'watchlist';
    if (hash.startsWith('#/collections')) return 'collections';
    if (hash.startsWith('#/stats')) return 'stats';
    return 'diary';
  });

  const [searchInitialQuery, setSearchInitialQuery] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/search')) {
      const match = hash.match(/\?q=([^&]*)/);
      return match ? decodeURIComponent(match[1]) : '';
    }
    return '';
  });

  // Track previous view before opening movie details (for back button: 'home' | 'search' | 'diary')
  const [previousView, setPreviousView] = useState('home');

  const [selectedModalMovie, setSelectedModalMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState('Feel Good');
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/diary') || hash.startsWith('#/watchlist') || hash.startsWith('#/collections')) return 'diary';
    if (hash.startsWith('#/search')) return 'search';
    return 'home';
  });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });

  // Sync watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.warn('Could not persist watchlist to localStorage', e);
    }
  }, [watchlist]);

  // Load real TMDB featured movie for the Hero
  useEffect(() => {
    let isMounted = true;
    async function loadHeroFeatured() {
      try {
        const trending = await fetchTrendingMovies('week');
        if (isMounted && trending && trending.length > 0) {
          // Choose the top trending movie with high rating
          const pick = trending.find(m => m.rating >= 7.5 && m.posterPath) || trending[0];
          setHeroMovie(pick);
        }
      } catch (err) {
        console.warn('Could not load TMDB hero featured film:', err);
      }
    }
    loadHeroFeatured();
    return () => { isMounted = false; };
  }, []);

  // Listen to browser URL hash changes for native back/forward support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/movie/')) {
        const id = hash.replace('#/movie/', '');
        setActiveMovieId(id);
        setIsSearchView(false);
        setIsDiaryView(false);
      } else if (hash.startsWith('#/search')) {
        setActiveMovieId(null);
        setIsSearchView(true);
        setIsDiaryView(false);
        setActiveSection('search');
        const match = hash.match(/\?q=([^&]*)/);
        if (match) {
          setSearchInitialQuery(decodeURIComponent(match[1]));
        }
      } else if (hash.startsWith('#/diary') || hash.startsWith('#/watchlist') || hash.startsWith('#/collections') || hash.startsWith('#/journal') || hash.startsWith('#/stats')) {
        setActiveMovieId(null);
        setIsSearchView(false);
        setIsDiaryView(true);
        setActiveSection('diary');
        if (hash.startsWith('#/watchlist')) setDiaryInitialTab('watchlist');
        else if (hash.startsWith('#/collections')) setDiaryInitialTab('collections');
        else if (hash.startsWith('#/stats')) setDiaryInitialTab('stats');
        else setDiaryInitialTab('diary');
      } else {
        setActiveMovieId(null);
        setIsSearchView(false);
        setIsDiaryView(false);
        setActiveSection('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Debounced TMDB Search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const results = await searchMovies(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('TMDB Search error:', err);
        setSearchError(err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3200);
  };

  const handleToggleWatchlist = (movie) => {
    if (!movie) return;
    const isAlreadySaved = watchlist.some(m => m.id === movie.id);
    if (isAlreadySaved) {
      setWatchlist(prev => prev.filter(m => m.id !== movie.id));
      showToast(`Removed "${movie.title}" from your watchlist`, 'removed');
    } else {
      setWatchlist(prev => [...prev, movie]);
      showToast(`Pinned "${movie.title}" to your journal watchlist 💌`, 'saved');
    }
  };

  const handleRemoveFromWatchlist = (movie) => {
    setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    showToast(`Removed "${movie.title}" from your watchlist`, 'removed');
  };

  const handleClearWatchlist = () => {
    setWatchlist([]);
    showToast('Your watchlist has been cleared', 'info');
  };

  // Navigate to individual movie details page
  const handleSelectMovie = (movie) => {
    if (!movie) return;
    const movieId = movie.id || movie;
    if (isSearchView) setPreviousView('search');
    else if (isDiaryView) setPreviousView('diary');
    else setPreviousView('home');

    setActiveMovieId(movieId);
    window.location.hash = `#/movie/${movieId}`;
  };

  const handleBackToHome = () => {
    setActiveMovieId(null);
    setIsSearchView(false);
    setIsDiaryView(false);
    setActiveSection('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetails = () => {
    if (previousView === 'search') {
      setActiveMovieId(null);
      setIsSearchView(true);
      setIsDiaryView(false);
      setActiveSection('search');
      window.location.hash = '#/search';
    } else if (previousView === 'diary') {
      setActiveMovieId(null);
      setIsSearchView(false);
      setIsDiaryView(true);
      setActiveSection('diary');
      window.location.hash = '#/diary';
    } else {
      handleBackToHome();
    }
  };

  const handleQuickFilter = ({ type, value }) => {
    if (activeMovieId || isSearchView || isDiaryView) handleBackToHome();
    if (type === 'mood') {
      setSelectedMood(value);
      setTimeout(() => {
        const el = document.getElementById('moods');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleNavigate = (sectionId) => {
    if (sectionId === 'diary') {
      setActiveMovieId(null);
      setIsSearchView(false);
      setIsDiaryView(true);
      setDiaryInitialTab('diary');
      setActiveSection('diary');
      window.location.hash = '#/diary';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'watchlist') {
      setActiveMovieId(null);
      setIsSearchView(false);
      setIsDiaryView(true);
      setDiaryInitialTab('watchlist');
      setActiveSection('diary');
      window.location.hash = '#/watchlist';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'search') {
      setActiveMovieId(null);
      setIsSearchView(true);
      setIsDiaryView(false);
      setActiveSection('search');
      window.location.hash = '#/search';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activeMovieId || isSearchView || isDiaryView) {
      handleBackToHome();
      setTimeout(() => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      setActiveSection(sectionId);
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="cinescope-app">
      {/* Navigation Bar */}
      <Navbar 
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onNavigate={handleNavigate}
        activeSection={activeSection}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
        }}
        onSearchSubmit={(text) => {
          const q = text || searchQuery;
          if (q) {
            setSearchInitialQuery(q);
            window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
          } else {
            window.location.hash = '#/search';
          }
          setIsSearchView(true);
          setActiveMovieId(null);
          setIsDiaryView(false);
          setActiveSection('search');
        }}
      />

      <main>
        {activeMovieId ? (
          /* Individual Movie Details Page */
          <MovieDetailsPage 
            movieId={activeMovieId}
            onBack={handleBackFromDetails}
            isInWatchlist={(m) => watchlist.some(w => w.id === m.id)}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectMovie={handleSelectMovie}
            onLogFilmInDiary={(movie) => {
              setActiveMovieId(null);
              setIsSearchView(false);
              setIsDiaryView(true);
              setDiaryInitialTab('diary');
              setActiveSection('diary');
              window.location.hash = '#/diary';
            }}
          />
        ) : isDiaryView ? (
          /* Personal Watchlist, Film Diary & Collections Page */
          <PersonalJournalPage 
            initialTab={diaryInitialTab}
            onBack={handleBackToHome}
            onSelectMovie={handleSelectMovie}
            onOpenGlobalSearch={() => handleNavigate('search')}
            showToast={showToast}
          />
        ) : isSearchView ? (
          /* Advanced Search & Discovery Page */
          <SearchDiscoveryPage 
            initialQuery={searchInitialQuery}
            onBack={handleBackToHome}
            isInWatchlist={(m) => watchlist.some(w => w.id === m.id)}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectMovie={handleSelectMovie}
          />
        ) : (
          /* Homepage View */
          <>
            {/* Hero Section */}
            <Hero 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onQuickFilter={handleQuickFilter}
              onMovieClick={handleSelectMovie}
              heroMovie={heroMovie}
            />

            {/* Live TMDB Search Results Section if Search is active */}
            {searchQuery.trim() && (
              <section id="search-results" className="search-results-section">
                <div className="container">
                  <div className="search-results-header">
                    <div className="results-title-group">
                      <span className="pill-badge badge-lavender">
                        <Search size={12} />
                        <span>Live TMDB Search</span>
                      </span>
                      <h3 className="results-heading">
                        {searchLoading
                          ? `Searching TMDB for “${searchQuery}”...`
                          : `Found ${searchResults.length} ${searchResults.length === 1 ? 'match' : 'matches'} for “${searchQuery}”`}
                      </h3>
                    </div>
                    <button 
                      className="btn-secondary clear-search-pill"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={15} />
                      <span>Clear Search</span>
                    </button>
                  </div>

                  {searchLoading ? (
                    <MovieGridSkeleton count={4} />
                  ) : searchError ? (
                    <ErrorState 
                      error={searchError} 
                      onRetry={() => {
                        setSearchLoading(true);
                        searchMovies(searchQuery).then(setSearchResults).catch(setSearchError).finally(() => setSearchLoading(false));
                      }} 
                      title="Couldn't complete TMDB search" 
                    />
                  ) : searchResults.length === 0 ? (
                    <div className="no-search-results">
                      <p className="no-results-title">No TMDB entries found for “{searchQuery}”</p>
                      <p className="no-results-sub">
                        Check your spelling, or explore curated categories in our Trending and Mood sections below.
                      </p>
                    </div>
                  ) : (
                    <div className="movies-grid search-grid">
                      {searchResults.map(movie => (
                        <MovieCard 
                          key={movie.id}
                          movie={movie}
                          isInWatchlist={watchlist.some(w => w.id === movie.id)}
                          onToggleWatchlist={handleToggleWatchlist}
                          onSelectMovie={handleSelectMovie}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Real Trending Movies Section */}
            <TrendingSection 
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onSelectMovie={handleSelectMovie}
            />

            {/* Real Hidden Gems Section */}
            <HiddenGemsSection 
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onSelectMovie={handleSelectMovie}
            />

            {/* Real Browse by Mood Section */}
            <BrowseMoodSection 
              watchlist={watchlist}
              selectedMood={selectedMood}
              onSelectMood={setSelectedMood}
              onToggleWatchlist={handleToggleWatchlist}
              onSelectMovie={handleSelectMovie}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Quick Look Movie Modal */}
      <MovieModal 
        movie={selectedModalMovie}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isInWatchlist={selectedModalMovie ? watchlist.some(w => w.id === selectedModalMovie.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* Watchlist Slide-over Drawer */}
      <WatchlistDrawer 
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        onRemoveMovie={handleRemoveFromWatchlist}
        onClearWatchlist={handleClearWatchlist}
        onSelectMovie={(movie) => {
          setIsWatchlistOpen(false);
          handleSelectMovie(movie);
        }}
      />

      {/* Toast Feedback Notification */}
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onDismiss={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
