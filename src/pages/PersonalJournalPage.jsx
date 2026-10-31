import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Bookmark, Star, Clock, Calendar,
  Plus, Edit3, Trash2, Sparkles, Film, ArrowLeft, X,
  Check, FolderPlus, Layers, Search, BarChart3,
  Flame, MessageSquare
} from 'lucide-react';
import {
  loadWatchlist,
  saveWatchlist,
  loadDiaryEntries,
  saveDiaryEntries,
  loadCollections,
  saveCollections,
  calculatePersonalStatistics
} from '../services/storage';
import { searchMovies, fetchMovieDetails } from '../services/tmdb';
import { MovieCard } from '../components/MovieCard';
import './PersonalJournalPage.css';

const TODAY_ISO = new Date().toISOString().split('T')[0];

export const PersonalJournalPage = ({
  initialTab = 'diary',
  onBack,
  onSelectMovie,
  onOpenGlobalSearch,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'diary' | 'watchlist' | 'collections' | 'stats'

  // Storage states
  const [watchlist, setWatchlistState] = useState(() => loadWatchlist());
  const [diaryEntries, setDiaryEntries] = useState(() => loadDiaryEntries());
  const [collections, setCollections] = useState(() => loadCollections());
  const [activeCollectionId, setActiveCollectionId] = useState('col_favourites');

  // Modals state
  const [diaryModalOpen, setDiaryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // null when creating new
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

  // Diary Form State
  const [formMovieSearch, setFormMovieSearch] = useState('');
  const [formSearchResults, setFormSearchResults] = useState([]);
  const [formSearchLoading, setFormSearchLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [personalRating, setPersonalRating] = useState(8);
  const [reviewText, setReviewText] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [dateWatched, setDateWatched] = useState(() => new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  // Collection Form State
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [newCollectionTheme, setNewCollectionTheme] = useState('lavender');
  const [collectionFormError, setCollectionFormError] = useState('');

  // Diary search/filter
  const [diarySearchQuery, setDiarySearchQuery] = useState('');

  // Sync to LocalStorage when states change
  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  useEffect(() => {
    saveDiaryEntries(diaryEntries);
  }, [diaryEntries]);

  useEffect(() => {
    saveCollections(collections);
  }, [collections]);

  // Sync activeTab when initialTab prop updates
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Statistics calculation from actual user data
  const stats = useMemo(() => {
    return calculatePersonalStatistics(diaryEntries, watchlist);
  }, [diaryEntries, watchlist]);

  // Filtered diary entries
  const filteredDiary = useMemo(() => {
    if (!diarySearchQuery.trim()) return diaryEntries;
    const q = diarySearchQuery.toLowerCase();
    return diaryEntries.filter(entry =>
      entry.movie?.title?.toLowerCase().includes(q) ||
      entry.review?.toLowerCase().includes(q) ||
      entry.notes?.toLowerCase().includes(q) ||
      entry.movie?.director?.toLowerCase().includes(q)
    );
  }, [diaryEntries, diarySearchQuery]);

  // Active Collection
  const activeCollection = useMemo(() => {
    return collections.find(c => c.id === activeCollectionId) || collections[0] || null;
  }, [collections, activeCollectionId]);

  // Movies in active collection
  const collectionMovies = useMemo(() => {
    if (!activeCollection) return [];
    const movieIds = new Set(activeCollection.movieIds || []);
    // Look up in diary, watchlist, or stored movie cache
    const pool = [...watchlist, ...diaryEntries.map(d => d.movie)].filter(Boolean);
    const seen = new Set();
    const result = [];
    pool.forEach(m => {
      if (movieIds.has(m.id) && !seen.has(m.id)) {
        seen.add(m.id);
        result.push(m);
      }
    });
    return result;
  }, [activeCollection, watchlist, diaryEntries]);

  // -------------------------------------------------------------
  // Watchlist Actions
  // -------------------------------------------------------------
  const handleRemoveFromWatchlist = (movieId) => {
    setWatchlistState(prev => prev.filter(m => m.id !== movieId));
    if (showToast) showToast('Removed film from your watchlist', 'removed');
  };

  const handleClearWatchlist = () => {
    if (window.confirm('Are you sure you want to clear your entire watchlist?')) {
      setWatchlistState([]);
      if (showToast) showToast('Watchlist cleared', 'info');
    }
  };

  // -------------------------------------------------------------
  // Diary Form Helpers
  // -------------------------------------------------------------
  const openNewDiaryModal = (presetMovie = null) => {
    setEditingEntry(null);
    setSelectedMovie(presetMovie || null);
    setFormMovieSearch('');
    setFormSearchResults([]);
    setPersonalRating(8.0);
    setReviewText('');
    setPersonalNotes('');
    setDateWatched(new Date().toISOString().split('T')[0]);
    setFormError('');
    setDiaryModalOpen(true);
  };

  const openEditDiaryModal = (entry) => {
    setEditingEntry(entry);
    setSelectedMovie(entry.movie);
    setFormMovieSearch('');
    setFormSearchResults([]);
    setPersonalRating(entry.personalRating || 8.0);
    setReviewText(entry.review || '');
    setPersonalNotes(entry.notes || '');
    setDateWatched(entry.dateWatched || TODAY_ISO);
    setFormError('');
    setDiaryModalOpen(true);
  };

  // Debounced TMDB Movie Search in Diary Modal
  useEffect(() => {
    if (!formMovieSearch.trim() || selectedMovie) {
      setFormSearchResults([]);
      setFormSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setFormSearchLoading(true);
      try {
        const results = await searchMovies(formMovieSearch.trim());
        setFormSearchResults(results.slice(0, 6));
      } catch (err) {
        console.warn('Diary search movie error:', err);
      } finally {
        setFormSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formMovieSearch, selectedMovie]);

  const handleSelectMovieForDiary = async (movie) => {
    // If details are sparse, retrieve full details for accurate runtime and director
    try {
      const details = await fetchMovieDetails(movie.id);
      setSelectedMovie(details || movie);
    } catch {
      setSelectedMovie(movie);
    }
    setFormMovieSearch('');
    setFormSearchResults([]);
    setFormError('');
  };

  const handleSaveDiaryEntry = (e) => {
    e.preventDefault();
    if (!selectedMovie) {
      setFormError('Please select a film to record in your diary.');
      return;
    }
    if (!dateWatched) {
      setFormError('Please choose the date you watched this film.');
      return;
    }
    if (personalRating < 1 || personalRating > 10) {
      setFormError('Please provide a personal rating between 1 and 10.');
      return;
    }

    if (editingEntry) {
      // Update existing
      setDiaryEntries(prev => prev.map(entry => {
        if (entry.id === editingEntry.id) {
          return {
            ...entry,
            movie: selectedMovie,
            movieId: selectedMovie.id,
            personalRating: Number(personalRating),
            review: reviewText.trim(),
            notes: personalNotes.trim(),
            dateWatched: dateWatched,
            updatedAt: new Date().toISOString()
          };
        }
        return entry;
      }));
      if (showToast) showToast(`Updated diary entry for "${selectedMovie.title}" ✍️`, 'saved');
    } else {
      // Create new entry
      const newEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        movieId: selectedMovie.id,
        movie: selectedMovie,
        personalRating: Number(personalRating),
        review: reviewText.trim(),
        notes: personalNotes.trim(),
        dateWatched: dateWatched,
        createdAt: new Date().toISOString()
      };
      setDiaryEntries(prev => [newEntry, ...prev]);

      // Also ensure it is marked in "Watched" collection automatically
      setCollections(prev => prev.map(c => {
        if (c.id === 'col_watched' && !c.movieIds.includes(selectedMovie.id)) {
          return { ...c, movieIds: [selectedMovie.id, ...c.movieIds] };
        }
        return c;
      }));

      if (showToast) showToast(`Recorded "${selectedMovie.title}" in your Film Diary 💌`, 'saved');
    }

    setDiaryModalOpen(false);
  };

  const handleDeleteDiaryEntry = (entryId, movieTitle) => {
    if (window.confirm(`Delete diary entry for "${movieTitle}"?`)) {
      setDiaryEntries(prev => prev.filter(e => e.id !== entryId));
      if (showToast) showToast('Diary entry deleted', 'removed');
    }
  };

  // -------------------------------------------------------------
  // Collections Helpers
  // -------------------------------------------------------------
  const handleCreateCollection = (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) {
      setCollectionFormError('Please enter a collection name.');
      return;
    }

    const newCol = {
      id: `col_${Date.now()}`,
      name: newCollectionName.trim(),
      description: newCollectionDesc.trim() || 'A curated cinema collection',
      theme: newCollectionTheme,
      icon: 'Layers',
      isDefault: false,
      movieIds: []
    };

    setCollections(prev => [...prev, newCol]);
    setActiveCollectionId(newCol.id);
    setNewCollectionName('');
    setNewCollectionDesc('');
    setCollectionFormError('');
    setCollectionModalOpen(false);
    if (showToast) showToast(`Created collection "${newCol.name}" ✨`, 'saved');
  };

  const handleDeleteCollection = (colId, colName) => {
    if (window.confirm(`Delete collection "${colName}"?`)) {
      setCollections(prev => prev.filter(c => c.id !== colId));
      setActiveCollectionId('col_favourites');
      if (showToast) showToast(`Deleted collection "${colName}"`, 'removed');
    }
  };

  const handleRemoveMovieFromCollection = (movieId) => {
    if (!activeCollection) return;
    setCollections(prev => prev.map(c => {
      if (c.id === activeCollection.id) {
        return {
          ...c,
          movieIds: (c.movieIds || []).filter(id => id !== movieId)
        };
      }
      return c;
    }));
    if (showToast) showToast(`Removed film from ${activeCollection.name}`, 'removed');
  };

  return (
    <div className="personal-journal-page">
      {/* Decorative ambient background */}
      <div className="journal-ambient-blur blur-left" />
      <div className="journal-ambient-blur blur-right" />

      <div className="container journal-container">
        {/* Navigation & Header */}
        <div className="journal-top-nav">
          <button className="back-link-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Return to CineScope</span>
          </button>
        </div>

        {/* Page Header */}
        <header className="journal-header">
          <div className="journal-badge-row">
            <span className="pill-badge badge-lavender">
              <Sparkles size={13} />
              <span>Personal Cinema Archives</span>
            </span>
          </div>
          <h1 className="journal-main-title">
            My Film Diary & <span className="highlight-text-curve">Watchlist.</span>
          </h1>
          <p className="journal-subtitle">
            Your private cinematic sanctuary. Record watched stories, capture impressions and notes,
            organize mood collections, and celebrate your personal viewing milestones.
          </p>

          {/* Quick Stats Ribbon */}
          <div className="journal-stats-ribbon">
            <div className="stats-metric-card">
              <span className="metric-label">Films Watched</span>
              <span className="metric-value">{stats.totalWatched}</span>
              <span className="metric-sub">{stats.watchedThisMonth} this month</span>
            </div>
            <div className="stats-metric-card">
              <span className="metric-label">In Watchlist</span>
              <span className="metric-value">{stats.totalWatchlist}</span>
              <span className="metric-sub">waiting to be seen</span>
            </div>
            <div className="stats-metric-card">
              <span className="metric-label">Avg. Personal Rating</span>
              <span className="metric-value rating-accent">
                {stats.averageRating !== '—' ? `${stats.averageRating}★` : '—'}
              </span>
              <span className="metric-sub">across all reviews</span>
            </div>
            <div className="stats-metric-card">
              <span className="metric-label">Total Watch Time</span>
              <span className="metric-value">{stats.formattedWatchTime}</span>
              <span className="metric-sub">cinema immersion</span>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="journal-tabs-bar">
            <button
              className={`journal-tab-btn ${activeTab === 'diary' ? 'active' : ''}`}
              onClick={() => setActiveTab('diary')}
            >
              <BookOpen size={17} />
              <span>Film Diary</span>
              <span className="tab-count-pill">{diaryEntries.length}</span>
            </button>
            <button
              className={`journal-tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              <Bookmark size={17} />
              <span>Watchlist</span>
              <span className="tab-count-pill">{watchlist.length}</span>
            </button>
            <button
              className={`journal-tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
              onClick={() => setActiveTab('collections')}
            >
              <Layers size={17} />
              <span>Collections</span>
              <span className="tab-count-pill">{collections.length}</span>
            </button>
            <button
              className={`journal-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 size={17} />
              <span>Personal Stats</span>
            </button>
          </div>
        </header>

        {/* =========================================================
            TAB 1: FILM DIARY
            ========================================================= */}
        {activeTab === 'diary' && (
          <section className="diary-tab-section">
            <div className="tab-toolbar">
              <div className="toolbar-search-box">
                <Search size={16} className="toolbar-search-icon" />
                <input
                  type="text"
                  placeholder="Search reviews, thoughts, or titles..."
                  value={diarySearchQuery}
                  onChange={(e) => setDiarySearchQuery(e.target.value)}
                  className="toolbar-search-input"
                />
                {diarySearchQuery && (
                  <button className="clear-filter-btn" onClick={() => setDiarySearchQuery('')}>✕</button>
                )}
              </div>

              <button
                className="btn-primary log-movie-trigger-btn"
                onClick={() => openNewDiaryModal()}
              >
                <Plus size={16} />
                <span>Record a Watched Film</span>
              </button>
            </div>

            {filteredDiary.length === 0 ? (
              <div className="journal-empty-state">
                <div className="empty-icon-wrap">
                  <BookOpen size={40} />
                </div>
                <h3 className="empty-state-title">
                  {diarySearchQuery ? 'No matching diary entries' : 'Your film diary is a fresh page'}
                </h3>
                <p className="empty-state-desc">
                  {diarySearchQuery
                    ? `No logged reviews found matching “${diarySearchQuery}”.`
                    : 'Record the stories that touch you. Rate each experience, save personal thoughts, and remember who you watched it with.'}
                </p>
                <button
                  className="btn-primary"
                  onClick={() => diarySearchQuery ? setDiarySearchQuery('') : openNewDiaryModal()}
                >
                  <Plus size={15} />
                  <span>{diarySearchQuery ? 'Clear Search Filter' : 'Record Your First Film'}</span>
                </button>
              </div>
            ) : (
              <div className="diary-entries-timeline">
                {filteredDiary.map(entry => {
                  const m = entry.movie || {};
                  return (
                    <article key={entry.id} className="diary-entry-card">
                      {/* Left Poster Column */}
                      <div className="entry-poster-col" onClick={() => onSelectMovie(m)}>
                        <img
                          src={m.poster}
                          alt={m.title}
                          className="entry-poster-img"
                        />
                        <div className="entry-user-rating-badge">
                          <Star size={13} fill="#E07A9F" color="#E07A9F" />
                          <span className="score-number">{Number(entry.personalRating).toFixed(1)}</span>
                          <span className="score-denom">/ 10</span>
                        </div>
                      </div>

                      {/* Main Entry Body */}
                      <div className="entry-content-col">
                        <div className="entry-header-row">
                          <div>
                            <div className="entry-meta-pills">
                              <span className="entry-date-pill">
                                <Calendar size={12} />
                                <span>Watched on {entry.dateWatched || 'Recently'}</span>
                              </span>
                              {m.runtimeMinutes > 0 && (
                                <span className="entry-duration-pill">
                                  <Clock size={12} />
                                  <span>{m.duration}</span>
                                </span>
                              )}
                              {m.director && (
                                <span className="entry-director-pill">
                                  Dir. {m.director}
                                </span>
                              )}
                            </div>
                            <h3 className="entry-movie-title" onClick={() => onSelectMovie(m)}>
                              {m.title} <span className="entry-year">({m.year})</span>
                            </h3>
                          </div>

                          {/* Actions */}
                          <div className="entry-actions-group">
                            <button
                              className="entry-action-btn edit-btn"
                              onClick={() => openEditDiaryModal(entry)}
                              title="Edit personal review"
                            >
                              <Edit3 size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="entry-action-btn delete-btn"
                              onClick={() => handleDeleteDiaryEntry(entry.id, m.title)}
                              title="Delete entry"
                              aria-label="Delete entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Personal Review */}
                        {entry.review ? (
                          <div className="entry-review-box">
                            <MessageSquare size={14} className="review-quote-icon" />
                            <p className="entry-review-text">“{entry.review}”</p>
                          </div>
                        ) : (
                          <p className="entry-no-review-text">No written review attached. Rated {entry.personalRating}★.</p>
                        )}

                        {/* Personal Notes / Companion / Mood */}
                        {entry.notes && (
                          <div className="entry-notes-row">
                            <span className="notes-tag-label">Journal Notes:</span>
                            <span className="notes-content-text">{entry.notes}</span>
                          </div>
                        )}

                        {/* Genres */}
                        <div className="entry-genres-row">
                          {(m.genres || []).map((g, idx) => (
                            <span key={idx} className="genre-tag-pill">{g}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =========================================================
            TAB 2: MY WATCHLIST
            ========================================================= */}
        {activeTab === 'watchlist' && (
          <section className="watchlist-tab-section">
            <div className="tab-toolbar">
              <div className="toolbar-info-text">
                <span className="highlight-count">{watchlist.length}</span> films saved in your watchlist
              </div>

              {watchlist.length > 0 && (
                <button
                  className="btn-secondary clear-watchlist-trigger"
                  onClick={handleClearWatchlist}
                >
                  <Trash2 size={14} />
                  <span>Clear Watchlist</span>
                </button>
              )}
            </div>

            {watchlist.length === 0 ? (
              <div className="journal-empty-state">
                <div className="empty-icon-wrap">
                  <Bookmark size={40} />
                </div>
                <h3 className="empty-state-title">Your watchlist is empty</h3>
                <p className="empty-state-desc">
                  Browse curated releases, hidden gems, or search any title in TMDB and click the heart bookmark to save it here.
                </p>
                <button
                  className="btn-primary"
                  onClick={onOpenGlobalSearch}
                >
                  <Search size={15} />
                  <span>Explore & Discover Films</span>
                </button>
              </div>
            ) : (
              <div className="watchlist-grid">
                {watchlist.map(movie => (
                  <div key={movie.id} className="watchlist-card-wrapper">
                    <MovieCard
                      movie={movie}
                      isInWatchlist={true}
                      onToggleWatchlist={() => handleRemoveFromWatchlist(movie.id)}
                      onSelectMovie={onSelectMovie}
                    />
                    <div className="watchlist-card-quick-actions">
                      <button
                        className="quick-log-btn"
                        onClick={() => openNewDiaryModal(movie)}
                        title="I watched this! Log in diary"
                      >
                        <Check size={13} />
                        <span>Log as Watched</span>
                      </button>
                      <button
                        className="quick-remove-btn"
                        onClick={() => handleRemoveFromWatchlist(movie.id)}
                        title="Remove from watchlist"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================================================
            TAB 3: COLLECTIONS
            ========================================================= */}
        {activeTab === 'collections' && (
          <section className="collections-tab-section">
            <div className="collections-layout">
              {/* Left sidebar of collections */}
              <div className="collections-sidebar">
                <div className="collections-sidebar-header">
                  <h3 className="collections-heading">My Collections</h3>
                  <button
                    className="new-collection-trigger-btn"
                    onClick={() => {
                      setNewCollectionName('');
                      setNewCollectionDesc('');
                      setCollectionFormError('');
                      setCollectionModalOpen(true);
                    }}
                    title="Create custom collection"
                  >
                    <FolderPlus size={15} />
                    <span>New</span>
                  </button>
                </div>

                <div className="collections-list">
                  {collections.map(col => {
                    const isSelected = col.id === activeCollectionId;
                    return (
                      <div
                        key={col.id}
                        className={`collection-list-item ${isSelected ? 'active' : ''} theme-${col.theme || 'lavender'}`}
                        onClick={() => setActiveCollectionId(col.id)}
                      >
                        <div className="col-item-info">
                          <span className="col-name">{col.name}</span>
                          <span className="col-count">{(col.movieIds || []).length} films</span>
                        </div>
                        {!col.isDefault && (
                          <button
                            className="delete-custom-col-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollection(col.id, col.name);
                            }}
                            title="Delete custom collection"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right main area showing movies in selected collection */}
              <div className="collection-movies-main">
                {activeCollection && (
                  <div className="collection-hero-bar">
                    <div>
                      <div className="collection-meta-row">
                        <span className="collection-tag-pill">
                          {activeCollection.isDefault ? 'Standard Shelf' : 'Custom Collection'}
                        </span>
                        <span className="collection-film-counter">
                          {(activeCollection.movieIds || []).length} titles
                        </span>
                      </div>
                      <h2 className="collection-title">{activeCollection.name}</h2>
                      <p className="collection-desc">{activeCollection.description}</p>
                    </div>
                  </div>
                )}

                {collectionMovies.length === 0 ? (
                  <div className="journal-empty-state compact">
                    <div className="empty-icon-wrap">
                      <Layers size={32} />
                    </div>
                    <h4 className="empty-state-title">No movies added to this shelf yet</h4>
                    <p className="empty-state-desc">
                      Add films from your watchlist or diary to curate this personal shelf.
                    </p>
                    {watchlist.length > 0 && (
                      <div className="quick-add-from-watchlist">
                        <span className="quick-add-title">Add from your Watchlist:</span>
                        <div className="quick-add-pills">
                          {watchlist.slice(0, 5).map(m => (
                            <button
                              key={m.id}
                              className="add-to-col-pill"
                              onClick={() => {
                                setCollections(prev => prev.map(c => {
                                  if (c.id === activeCollection.id && !c.movieIds.includes(m.id)) {
                                    return { ...c, movieIds: [...c.movieIds, m.id] };
                                  }
                                  return c;
                                }));
                                if (showToast) showToast(`Added "${m.title}" to ${activeCollection.name} ✦`, 'saved');
                              }}
                            >
                              <Plus size={11} />
                              <span>{m.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="movies-grid collection-grid">
                    {collectionMovies.map(movie => (
                      <div key={movie.id} className="collection-card-item">
                        <MovieCard
                          movie={movie}
                          isInWatchlist={watchlist.some(w => w.id === movie.id)}
                          onToggleWatchlist={() => { }}
                          onSelectMovie={onSelectMovie}
                        />
                        <button
                          className="remove-from-col-btn"
                          onClick={() => handleRemoveMovieFromCollection(movie.id)}
                          title={`Remove from ${activeCollection.name}`}
                        >
                          <X size={13} />
                          <span>Remove from Collection</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 4: PERSONAL STATISTICS
            ========================================================= */}
        {activeTab === 'stats' && (
          <section className="stats-tab-section">
            <div className="stats-hero-card">
              <div className="stats-hero-content">
                <span className="pill-badge badge-lavender">
                  <BarChart3 size={13} />
                  <span>Cinematic Viewing Milestones</span>
                </span>
                <h2 className="stats-dashboard-title">Your Viewing Anatomy</h2>
                <p className="stats-dashboard-sub">
                  Calculated from your verified diary reviews, watched timestamps, and movie metadata.
                </p>
              </div>
            </div>

            {/* Core Stats Grid */}
            <div className="stats-detailed-grid">
              {/* Stat 1 */}
              <div className="stat-card">
                <div className="stat-card-icon-wrap icon-lavender">
                  <Film size={22} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-label">Total Watched</span>
                  <span className="stat-card-number">{stats.totalWatched}</span>
                  <span className="stat-card-caption">verified film logs</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="stat-card">
                <div className="stat-card-icon-wrap icon-blush">
                  <Clock size={22} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-label">Total Watch Time</span>
                  <span className="stat-card-number">{stats.formattedWatchTime}</span>
                  <span className="stat-card-caption">({stats.totalMinutes.toLocaleString()} minutes)</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="stat-card">
                <div className="stat-card-icon-wrap icon-sage">
                  <Star size={22} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-label">Average Personal Rating</span>
                  <span className="stat-card-number">{stats.averageRating !== '—' ? `${stats.averageRating}★` : '—'}</span>
                  <span className="stat-card-caption">across all rated films</span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="stat-card">
                <div className="stat-card-icon-wrap icon-cream">
                  <Flame size={22} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-label">Most Watched Genre</span>
                  <span className="stat-card-number text-truncate">{stats.topGenre}</span>
                  <span className="stat-card-caption">{stats.topGenreCount > 0 ? `${stats.topGenreCount} titles logged` : 'Start logging stories'}</span>
                </div>
              </div>

              {/* Stat 5 */}
              <div className="stat-card">
                <div className="stat-card-icon-wrap icon-lavender">
                  <Calendar size={22} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-label">Watched This Month</span>
                  <span className="stat-card-number">{stats.watchedThisMonth}</span>
                  <span className="stat-card-caption">current viewing momentum</span>
                </div>
              </div>

              {/* Stat 6 */}
              <div className="stat-card">
                <div className="stat-card-icon-wrap icon-blush">
                  <Bookmark size={22} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-label">Watchlist Backlog</span>
                  <span className="stat-card-number">{stats.totalWatchlist}</span>
                  <span className="stat-card-caption">films waiting to be discovered</span>
                </div>
              </div>
            </div>

            {/* Genre Distribution Breakdown */}
            <div className="genre-distribution-card">
              <h3 className="section-title">Genre Breakdown</h3>
              <p className="section-desc">Distribution of genres across all logged films in your diary.</p>

              {Object.keys(stats.genreBreakdown).length === 0 ? (
                <p className="no-stats-text">No genre distribution data available yet. Record movies in your diary to generate insights.</p>
              ) : (
                <div className="genre-bars-list">
                  {Object.entries(stats.genreBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([genre, count]) => {
                      const pct = Math.round((count / stats.totalWatched) * 100);
                      return (
                        <div key={genre} className="genre-bar-item">
                          <div className="genre-bar-label-row">
                            <span className="genre-name">{genre}</span>
                            <span className="genre-count">{count} {count === 1 ? 'film' : 'films'} ({pct}%)</span>
                          </div>
                          <div className="genre-progress-track">
                            <div className="genre-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* =========================================================
          MODAL: RECORD / EDIT FILM DIARY ENTRY
          ========================================================= */}
      {diaryModalOpen && (
        <div className="journal-modal-overlay" onClick={() => setDiaryModalOpen(false)}>
          <div className="journal-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="journal-modal-header">
              <div>
                <h3 className="modal-title">
                  {editingEntry ? 'Edit Diary Entry' : 'Record a Watched Film'}
                </h3>
                <p className="modal-subtitle">
                  Capture your personal rating, reflections, and notes in your digital diary.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setDiaryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDiaryEntry} className="journal-modal-form">
              {formError && (
                <div className="form-error-banner">
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Movie Selection */}
              <div className="form-section">
                <label className="form-label">Film</label>
                {selectedMovie ? (
                  <div className="selected-movie-preview">
                    <img src={selectedMovie.poster} alt={selectedMovie.title} className="preview-poster" />
                    <div className="preview-info">
                      <h4 className="preview-title">{selectedMovie.title} ({selectedMovie.year})</h4>
                      <span className="preview-meta">
                        {selectedMovie.duration} • Dir. {selectedMovie.director}
                      </span>
                    </div>
                    {!editingEntry && (
                      <button
                        type="button"
                        className="change-selected-btn"
                        onClick={() => setSelectedMovie(null)}
                      >
                        Change
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="movie-picker-section">
                    <div className="movie-search-input-wrap">
                      <Search size={16} className="picker-search-icon" />
                      <input
                        type="text"
                        placeholder="Search TMDB film title to log (e.g. Inception, Past Lives)..."
                        value={formMovieSearch}
                        onChange={(e) => setFormMovieSearch(e.target.value)}
                        className="movie-picker-input"
                        autoFocus
                      />
                    </div>

                    {formSearchLoading && (
                      <div className="picker-loading">Searching TMDB...</div>
                    )}

                    {formSearchResults.length > 0 && (
                      <div className="picker-results-dropdown">
                        {formSearchResults.map(m => (
                          <div
                            key={m.id}
                            className="picker-result-row"
                            onClick={() => handleSelectMovieForDiary(m)}
                          >
                            <img src={m.poster} alt={m.title} className="picker-thumb" />
                            <div className="picker-row-info">
                              <span className="picker-row-title">{m.title}</span>
                              <span className="picker-row-meta">{m.year} • ★ {m.rating}</span>
                            </div>
                            <span className="picker-select-badge">Select</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Pick from Watchlist */}
                    {watchlist.length > 0 && !formMovieSearch && (
                      <div className="quick-pick-watchlist-box">
                        <span className="quick-pick-label">Or select from your Watchlist:</span>
                        <div className="quick-pick-chips">
                          {watchlist.slice(0, 6).map(m => (
                            <button
                              key={m.id}
                              type="button"
                              className="watchlist-chip-btn"
                              onClick={() => handleSelectMovieForDiary(m)}
                            >
                              <Plus size={11} />
                              <span>{m.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Personal Rating (out of 10) */}
              <div className="form-section">
                <div className="rating-label-row">
                  <label className="form-label">Personal Rating: <strong className="rating-bold-val">{personalRating} / 10</strong></label>
                  <span className="rating-adjective">
                    {personalRating >= 9.5 ? '✦ Masterpiece' :
                      personalRating >= 8.5 ? '✦ Outstanding' :
                        personalRating >= 7.5 ? '✦ Great Experience' :
                          personalRating >= 6.0 ? '✦ Good Watch' : '✦ Average'}
                  </span>
                </div>
                <div className="rating-range-slider-wrap">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={personalRating}
                    onChange={(e) => setPersonalRating(Number(e.target.value))}
                    className="rating-slider"
                  />
                  <div className="slider-ticks">
                    <span>1</span>
                    <span>3</span>
                    <span>5</span>
                    <span>7</span>
                    <span>9</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* 3. Date Watched */}
              <div className="form-section">
                <label className="form-label">Date Watched</label>
                <input
                  type="date"
                  value={dateWatched}
                  max={TODAY_ISO}
                  onChange={(e) => setDateWatched(e.target.value)}
                  className="form-date-input"
                  required
                />
              </div>

              {/* 4. Personal Review */}
              <div className="form-section">
                <label className="form-label">Personal Review & Reflections</label>
                <textarea
                  placeholder="What feelings, cinematography, or themes lingered with you? How did the story resonate?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows="4"
                  className="form-textarea"
                />
              </div>

              {/* 5. Personal Notes */}
              <div className="form-section">
                <label className="form-label">Personal Notes (Viewing Context)</label>
                <input
                  type="text"
                  placeholder="e.g. Watched on IMAX with Emma. Rain falling outside. Loved the final dialogue."
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  className="form-text-input"
                />
              </div>

              {/* Actions */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDiaryModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>{editingEntry ? 'Update Entry' : 'Save to Film Diary'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CREATE NEW CUSTOM COLLECTION
          ========================================================= */}
      {collectionModalOpen && (
        <div className="journal-modal-overlay" onClick={() => setCollectionModalOpen(false)}>
          <div className="journal-modal-panel small" onClick={(e) => e.stopPropagation()}>
            <div className="journal-modal-header">
              <div>
                <h3 className="modal-title">New Collection</h3>
                <p className="modal-subtitle">Curate a themed shelf for your cinema journal.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setCollectionModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="journal-modal-form">
              {collectionFormError && (
                <div className="form-error-banner">
                  <span>{collectionFormError}</span>
                </div>
              )}

              <div className="form-section">
                <label className="form-label">Collection Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cozy Rainy Sunday Films, Sci-Fi Epics..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="form-text-input"
                  autoFocus
                  required
                />
              </div>

              <div className="form-section">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="A short note on why these films belong together..."
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  className="form-text-input"
                />
              </div>

              <div className="form-section">
                <label className="form-label">Pastel Color Palette</label>
                <div className="palette-picker-row">
                  {['lavender', 'blush', 'sage', 'cream'].map(theme => (
                    <button
                      key={theme}
                      type="button"
                      className={`theme-pick-btn theme-${theme} ${newCollectionTheme === theme ? 'selected' : ''}`}
                      onClick={() => setNewCollectionTheme(theme)}
                    >
                      {newCollectionTheme === theme && <Check size={14} />}
                      <span className="theme-name">{theme}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCollectionModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Plus size={16} />
                  <span>Create Collection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

