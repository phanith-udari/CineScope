import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Search, Sparkles, Scale, Clock, 
  Globe, Layers, BookOpen, Heart, Compass, ArrowRight, RefreshCw 
} from 'lucide-react';
import { fetchMovieDetails, searchMovies } from '../services/tmdb';
import { fetchImdbData } from '../services/omdb';
import './MovieComparisonSection.css';

/**
 * Assign qualitative tone attributes based on genres and overview
 */
function getToneDescription(movie) {
  const g = (movie.genres || []).map(x => x.toLowerCase());

  if (g.includes('romance') || (g.includes('drama') && !g.includes('thriller') && !g.includes('action'))) {
    return { 
      tone: 'Deeply Emotional & Intimate', 
      primaryType: 'emotional',
      weight: 9,
      desc: 'leans into human vulnerability, character bonds, and introspective emotion' 
    };
  } else if (g.includes('thriller') || g.includes('mystery') || g.includes('horror')) {
    return { 
      tone: 'High-Tension Suspense', 
      primaryType: 'suspense',
      weight: 8,
      desc: 'prioritizes psychological suspense, escalating stakes, and edge-of-seat pacing' 
    };
  } else if (g.includes('science fiction') || g.includes('sci-fi')) {
    return { 
      tone: 'Philosophical & Wonder-Driven', 
      primaryType: 'adventure',
      weight: 7,
      desc: 'balances existential curiosity, speculative science, and cosmic dilemmas' 
    };
  } else if (g.includes('adventure') || g.includes('action')) {
    return { 
      tone: 'Kinetic Adventure & High Stakes', 
      primaryType: 'adventure',
      weight: 7,
      desc: 'emphasizes expansive physical journeys, courage, and momentum-driven conflict' 
    };
  } else if (g.includes('animation') || g.includes('fantasy')) {
    return { 
      tone: 'Imaginative & Whimsical Drama', 
      primaryType: 'emotional',
      weight: 8,
      desc: 'evokes visual enchantment, transformation, and allegorical resonance' 
    };
  } else if (g.includes('comedy')) {
    return {
      tone: 'Lighthearted & Comedic Energy',
      primaryType: 'drama',
      weight: 6,
      desc: 'centers on humorous human misunderstandings and buoyant warmth'
    };
  }
  return { 
    tone: 'Reflective Narrative Drama', 
    primaryType: 'drama',
    weight: 7,
    desc: 'focuses on deliberate pacing, moral crossroads, and character choices' 
  };
}

/**
 * Generate smart comparison insights dynamically from verified movie data
 */
function generateComparisonInsights(movieList) {
  if (!movieList || movieList.length < 2) return null;

  const [m1, m2, m3] = movieList;
  const count = movieList.length;

  // 1. Concept Contrast
  let conceptDiff = '';
  if (count === 2) {
    conceptDiff = `While "${m1.title}" (${m1.year}) anchors its premise around ${m1.genres.slice(0, 2).join(' and ').toLowerCase()}, focusing on ${m1.overview ? m1.overview.slice(0, 95) + '...' : 'its unique world'}, "${m2.title}" (${m2.year}) approaches cinema through a ${m2.genres.slice(0, 2).join(' and ').toLowerCase()} lens, centering on ${m2.overview ? m2.overview.slice(0, 95) + '...' : 'its own distinct narrative conflict'}.`;
  } else {
    conceptDiff = `"${m1.title}" (${m1.year}), "${m2.title}" (${m2.year}), and "${m3.title}" (${m3.year}) offer three distinct narrative journeys across ${Array.from(new Set([...m1.genres, ...m2.genres, ...m3.genres])).slice(0, 5).join(', ').toLowerCase()} traditions, each establishing a unique inciting incident and scale of conflict.`;
  }

  // 2. Emotional Tone vs Suspense / Adventure / Drama
  const tones = movieList.map(m => ({
    title: m.title,
    ...getToneDescription(m)
  }));

  const emotionalFilms = tones.filter(t => t.primaryType === 'emotional');
  const suspenseFilms = tones.filter(t => t.primaryType === 'suspense');
  const adventureFilms = tones.filter(t => t.primaryType === 'adventure');

  let toneContrastSummary = '';
  if (count === 2) {
    const [t1, t2] = tones;
    if (t1.primaryType === 'emotional' && (t2.primaryType === 'suspense' || t2.primaryType === 'adventure')) {
      toneContrastSummary = `"${t1.title}" delivers a noticeably more emotional, intimate tone centered on heartfelt personal vulnerability, whereas "${t2.title}" focuses more intensely on ${t2.primaryType === 'suspense' ? 'suspense, psychological tension, and mystery' : 'adventure, world exploration, and external conflict'}.`;
    } else if (t2.primaryType === 'emotional' && (t1.primaryType === 'suspense' || t1.primaryType === 'adventure')) {
      toneContrastSummary = `"${t2.title}" presents a warmer, more emotionally poignant tone, whereas "${t1.title}" places its emphasis firmly on ${t1.primaryType === 'suspense' ? 'suspense and psychological tension' : 'adventure and kinetic momentum'}.`;
    } else if (t1.primaryType === 'suspense' && t2.primaryType === 'adventure') {
      toneContrastSummary = `"${t1.title}" focuses primarily on taut suspense and edge-of-seat tension, while "${t2.title}" directs its energy toward grand-scale adventure and curiosity-driven exploration.`;
    } else if (t2.primaryType === 'suspense' && t1.primaryType === 'adventure') {
      toneContrastSummary = `"${t2.title}" is driven by suspense and psychological pressure, while "${t1.title}" focuses predominantly on adventure and expansive scale.`;
    } else {
      toneContrastSummary = `Both films weave nuanced drama, with "${t1.title}" leaning into ${t1.tone.toLowerCase()} and "${t2.title}" highlighting ${t2.tone.toLowerCase()}.`;
    }
  } else {
    // 3 films comparison
    const emotionalNames = emotionalFilms.map(f => `"${f.title}"`).join(' and ');
    const suspenseNames = suspenseFilms.map(f => `"${f.title}"`).join(' and ');
    const advNames = adventureFilms.map(f => `"${f.title}"`).join(' and ');

    const parts = [];
    if (emotionalNames) parts.push(`${emotionalNames} brings the most emotionally introspective and poignant core`);
    if (suspenseNames) parts.push(`${suspenseNames} leads in psychological suspense and tension`);
    if (advNames) parts.push(`${advNames} emphasizes expansive adventure and high-stakes discovery`);

    if (parts.length >= 2) {
      toneContrastSummary = `Among the three selections, ${parts.join(', while ')}.`;
    } else {
      toneContrastSummary = `All three films develop character-driven drama, with "${tones[0].title}" channeling ${tones[0].tone.toLowerCase()}, "${tones[1].title}" focusing on ${tones[1].tone.toLowerCase()}, and "${tones[2].title}" expressing ${tones[2].tone.toLowerCase()}.`;
    }
  }

  // 3. Similarities
  const allGenreArrays = movieList.map(m => m.genres || []);
  const sharedGenres = allGenreArrays.reduce((acc, curr) => acc.filter(g => curr.includes(g)));
  
  let similarityText = '';
  if (sharedGenres.length > 0) {
    similarityText = `All compared titles share verified ${sharedGenres.join(' and ')} roots, employing deliberate visual framing and narrative momentum to explore how protagonists navigate defining trials where their beliefs are put to the test.`;
  } else {
    similarityText = `While operating within distinct genres, these films share a focus on personal agency—each protagonist is pulled from ordinary circumstances into a transformative threshold where every choice carries lasting repercussions.`;
  }

  // 4. Thematic Differences
  const themeStatements = movieList.map(m => {
    const tStr = m.themes && m.themes.length > 0 ? m.themes.join(' and ') : 'Personal Resilience';
    return `"${m.title}" explores ${tStr}`;
  });
  const themeDiffText = themeStatements.join(', whereas ') + '.';

  return {
    conceptDiff,
    tones,
    toneContrastSummary,
    similarityText,
    themeDiffText
  };
}

/**
 * Compute differences to highlight meaningful variations
 */
function computeMeaningfulDifferences(movies, imdbRatings) {
  if (!movies || movies.length < 2) return {};

  const diffs = {};
  const validTmdb = movies.map(m => m.rating).filter(r => r > 0);
  const maxTmdb = validTmdb.length > 0 ? Math.max(...validTmdb) : 0;

  const validImdb = movies
    .map(m => imdbRatings[m.id]?.available ? imdbRatings[m.id].imdbRating : null)
    .filter(r => r !== null && !isNaN(r));
  const maxImdb = validImdb.length > 0 ? Math.max(...validImdb) : 0;

  const baseRuntime = movies[0]?.runtimeMinutes || 0;

  // Count occurrences of each genre across compared set
  const genreCount = {};
  movies.forEach(m => {
    (m.genres || []).forEach(g => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  movies.forEach((m, idx) => {
    const isTopTmdb = maxTmdb > 0 && m.rating === maxTmdb && movies.filter(x => x.rating === maxTmdb).length === 1;
    const imdbVal = imdbRatings[m.id]?.available ? imdbRatings[m.id].imdbRating : null;
    const isTopImdb = maxImdb > 0 && imdbVal === maxImdb && movies.filter(x => imdbRatings[x.id]?.imdbRating === maxImdb).length === 1;

    // Genres unique to this film in this comparison
    const uniqueGenres = (m.genres || []).filter(g => genreCount[g] === 1);

    // Runtime relative to first film
    let runtimeDiffLabel = null;
    if (idx > 0 && m.runtimeMinutes > 0 && baseRuntime > 0) {
      const diffMins = m.runtimeMinutes - baseRuntime;
      if (Math.abs(diffMins) >= 15) {
        runtimeDiffLabel = diffMins > 0 ? `+${diffMins}m longer` : `${Math.abs(diffMins)}m shorter`;
      }
    }

    diffs[m.id] = {
      isTopTmdb,
      isTopImdb,
      uniqueGenres,
      runtimeDiffLabel
    };
  });

  return diffs;
}

export const MovieComparisonSection = React.forwardRef(({ 
  baseMovie, 
  recommendedMovies = [], 
  onSelectMovie,
  onComparedMoviesChange
}, ref) => {
  // Up to 3 movies in comparison: baseMovie is slot 0
  const [comparedMovies, setComparedMovies] = useState([baseMovie]);
  const [imdbRatings, setImdbRatings] = useState({});
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [replacingId, setReplacingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  React.useImperativeHandle(ref, () => ({
    addMovie: (movie) => {
      handleAddMovie(movie);
      setTimeout(() => {
        const el = document.getElementById('compare-stories');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    openSearch: () => {
      setReplacingId(null);
      setSearchModalOpen(true);
    }
  }));

  // Reset comparison base when baseMovie changes
  useEffect(() => {
    if (baseMovie) {
      setComparedMovies([baseMovie]);
      setReplacingId(null);
    }
  }, [baseMovie?.id]);

  // Notify parent whenever compared movies change
  useEffect(() => {
    if (onComparedMoviesChange) {
      onComparedMoviesChange(comparedMovies);
    }
  }, [comparedMovies, onComparedMoviesChange]);

  // Fetch IMDb ratings for all movies in comparison list
  useEffect(() => {
    comparedMovies.forEach(async (m) => {
      if (m && m.imdbId && !imdbRatings[m.id]) {
        try {
          const res = await fetchImdbData(m.imdbId);
          setImdbRatings(prev => ({ ...prev, [m.id]: res }));
        } catch {
          setImdbRatings(prev => ({ ...prev, [m.id]: { available: false, reason: 'Unavailable' } }));
        }
      }
    });
  }, [comparedMovies]);

  // Add or Replace a movie in comparison with immediate feedback and background detail fetching
  const handleAddMovie = async (movieOrId) => {
    const rawMovie = { ...movieOrId };

    // Close modal immediately for smooth response
    setSearchModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);

    const targetReplaceId = replacingId;
    setReplacingId(null);

    // 1. Check if movie already present
    if (!targetReplaceId && comparedMovies.some(m => m.id === rawMovie.id)) {
      return;
    }
    if (!targetReplaceId && comparedMovies.length >= 3) {
      return;
    }

    // 2. Put into state immediately (with loading flag if extra details needed)
    const needsFullDetails = !rawMovie.runtimeMinutes || rawMovie.director === 'Cinema Director' || !rawMovie.castList;
    const initialMovie = {
      ...rawMovie,
      isLoadingDetails: needsFullDetails
    };

    if (targetReplaceId) {
      setComparedMovies(prev => prev.map(m => m.id === targetReplaceId ? initialMovie : m));
    } else {
      setComparedMovies(prev => [...prev, initialMovie]);
    }

    // 3. If full details are needed, fetch in background and update
    if (needsFullDetails) {
      try {
        const fullDetails = await fetchMovieDetails(rawMovie.id);
        if (fullDetails) {
          setComparedMovies(prev => prev.map(m => m.id === rawMovie.id ? { ...fullDetails, isLoadingDetails: false } : m));
        }
      } catch (err) {
        console.warn('Could not fetch extra details for movie:', rawMovie.id, err);
        setComparedMovies(prev => prev.map(m => m.id === rawMovie.id ? { ...m, isLoadingDetails: false } : m));
      }
    }
  };

  const handleOpenReplace = (targetMovieId) => {
    setReplacingId(targetMovieId);
    setSearchModalOpen(true);
  };

  // Remove a movie from comparison (base movie slot cannot be removed, but secondary ones can)
  const handleRemoveMovie = (movieId) => {
    if (comparedMovies.length <= 1) return;
    setComparedMovies(prev => prev.filter(m => m.id !== movieId));
  };

  // Search handler in modal
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchMovies(searchQuery);
        // Exclude movies already in comparison
        const filtered = res.filter(m => !comparedMovies.some(c => c.id === m.id));
        setSearchResults(filtered);
      } catch (err) {
        console.warn('Comparison search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, comparedMovies]);

  const insights = generateComparisonInsights(comparedMovies);
  const diffs = computeMeaningfulDifferences(comparedMovies, imdbRatings);

  return (
    <section id="compare-stories" className="comparison-feature-section">
      {/* Section Header */}
      <div className="comparison-header">
        <div className="comp-title-group">
          <span className="pill-badge badge-blush">
            <Scale size={13} />
            <span>Storyline Deep-Dive</span>
          </span>
          <h2 className="comparison-main-title">Compare the Stories</h2>
          <p className="comparison-sub">
            Place up to three films side by side to contrast storytelling structures, 
            cinematic runtime, director craft, and audience reception.
          </p>
        </div>

        {/* Add Movie Button */}
        {comparedMovies.length < 3 && (
          <button 
            className="btn-primary add-compare-top-btn"
            onClick={() => { setReplacingId(null); setSearchModalOpen(true); }}
          >
            <Plus size={16} />
            <span>Add Film to Compare ({comparedMovies.length}/3)</span>
          </button>
        )}
      </div>

      {/* Side-by-Side Comparison Cards Grid */}
      <div className={`comparison-cards-layout count-${comparedMovies.length}`}>
        {comparedMovies.map((movie, index) => {
          const imdbInfo = imdbRatings[movie.id];
          const isPrimary = index === 0;
          const movieDiffs = diffs[movie.id] || {};

          return (
            <div key={movie.id} className={`comp-card ${isPrimary ? 'primary-slot' : 'secondary-slot'}`}>
              {/* Card Header with Slot Badge & Actions */}
              <div className="comp-card-top-bar">
                <span className={`slot-badge ${isPrimary ? 'badge-primary' : 'badge-secondary'}`}>
                  {isPrimary ? '✦ Main Film' : `Compare Choice #${index}`}
                </span>
                <div className="comp-card-actions">
                  <button 
                    className="replace-comp-btn"
                    onClick={() => handleOpenReplace(movie.id)}
                    title={`Replace ${movie.title} with another film`}
                  >
                    <RefreshCw size={12} />
                    <span>Replace</span>
                  </button>
                  {!isPrimary && (
                    <button 
                      className="remove-comp-btn"
                      onClick={() => handleRemoveMovie(movie.id)}
                      title="Remove from comparison"
                      aria-label={`Remove ${movie.title}`}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Poster & Title Header */}
              <div className="comp-poster-wrap">
                <img 
                  src={movie.poster} 
                  alt={movie.title} 
                  className="comp-poster-img"
                />
                <div className="comp-title-overlay">
                  <h3 className="comp-movie-title" title={movie.title}>{movie.title}</h3>
                  <span className="comp-movie-year">{movie.year}</span>
                </div>
              </div>

              {/* Comparison Rows */}
              <div className="comp-details-list">
                {/* 1. Ratings Row (IMDb & TMDB) */}
                <div className="comp-row">
                  <span className="comp-row-label">Ratings</span>
                  <div className="comp-ratings-dual">
                    <div 
                      className={`dual-rating tmdb-pill ${movieDiffs.isTopTmdb ? 'highlight-top' : ''}`}
                      title="The Movie Database audience rating"
                    >
                      <span className="source-dot tmdb-dot" />
                      <span className="source-name">TMDB</span>
                      <span className="score-val">{movie.rating > 0 ? movie.rating.toFixed(1) : 'N/A'}</span>
                      {movieDiffs.isTopTmdb && <span className="top-indicator">★ Highest</span>}
                    </div>
                    <div 
                      className={`dual-rating imdb-pill ${movieDiffs.isTopImdb ? 'highlight-top' : ''}`}
                      title="Internet Movie Database verified rating"
                    >
                      <span className="imdb-text-logo">IMDb</span>
                      <span className="score-val">
                        {imdbInfo 
                          ? (imdbInfo.available ? imdbInfo.imdbRating.toFixed(1) : 'N/A')
                          : (movie.imdbId ? '...' : 'N/A')}
                      </span>
                      {movieDiffs.isTopImdb && <span className="top-indicator">★ Highest</span>}
                    </div>
                  </div>
                </div>

                {/* 2. Runtime & Language */}
                <div className="comp-row">
                  <span className="comp-row-label">Format</span>
                  <div className="comp-format-row">
                    <span className="comp-tag" title="Feature film runtime">
                      <Clock size={12} className="tag-icon" />
                      <span>{movie.duration || 'Feature Film'}</span>
                      {movieDiffs.runtimeDiffLabel && (
                        <span className="runtime-diff-pill">{movieDiffs.runtimeDiffLabel}</span>
                      )}
                    </span>
                    <span className="comp-tag" title="Original spoken language">
                      <Globe size={12} className="tag-icon" />
                      <span>{movie.originalLanguage || 'English'}</span>
                    </span>
                  </div>
                </div>

                {/* 3. Director */}
                <div className="comp-row">
                  <span className="comp-row-label">Director</span>
                  <span className="comp-director-text">
                    {movie.isLoadingDetails ? 'Loading director...' : (movie.director || 'Cinema Director')}
                  </span>
                </div>

                {/* 4. Genres */}
                <div className="comp-row">
                  <span className="comp-row-label">Genres</span>
                  <div className="comp-genres-wrap">
                    {(movie.genres || []).map((g, i) => {
                      const isUnique = movieDiffs.uniqueGenres?.includes(g);
                      return (
                        <span 
                          key={i} 
                          className={`comp-genre-chip ${isUnique ? 'genre-distinctive' : ''}`}
                          title={isUnique ? 'Distinctive genre in this comparison set' : undefined}
                        >
                          {isUnique ? `✦ ${g}` : g}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Main Themes */}
                <div className="comp-row">
                  <span className="comp-row-label">Main Themes</span>
                  <div className="comp-themes-wrap">
                    {(movie.themes || ['Human Connection', 'Destiny']).map((t, i) => (
                      <span key={i} className="comp-theme-chip">✦ {t}</span>
                    ))}
                  </div>
                </div>

                {/* 6. Story Overview Snippet */}
                <div className="comp-row overview-row">
                  <span className="comp-row-label">Story Overview</span>
                  <p className="comp-overview-snip">
                    {movie.overview || 'No overview synopsis provided for this title.'}
                  </p>
                </div>
              </div>

              {/* View Individual Movie Link */}
              {!isPrimary && (
                <button 
                  className="comp-view-btn"
                  onClick={() => onSelectMovie && onSelectMovie(movie)}
                >
                  <span>Open Full Entry</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          );
        })}

        {/* Empty Slot Placeholder if fewer than 3 movies are compared */}
        {comparedMovies.length < 3 && (
          <div 
            className="comp-empty-slot-card"
            onClick={() => { setReplacingId(null); setSearchModalOpen(true); }}
          >
            <div className="empty-slot-plus-circle">
              <Plus size={28} />
            </div>
            <h4 className="empty-slot-title">Add Another Film</h4>
            <p className="empty-slot-desc">
              Choose from similar recommendations or search any title to compare narratives.
            </p>
            <span className="empty-slot-action">
              <span>Select Film</span>
              <Sparkles size={14} />
            </span>
          </div>
        )}
      </div>

      {/* Smart Comparison Insights: "What Makes Them Different?" */}
      {insights && comparedMovies.length >= 2 && (
        <div className="smart-insights-container">
          <div className="insights-header">
            <div className="insights-title-row">
              <Sparkles size={18} className="insights-sparkle-icon" />
              <h3 className="insights-title">What Makes Them Different?</h3>
            </div>
            <span className="editorial-disclaimer-pill">
              ✦ Editorial Journal Observations · Objective Story Analysis
            </span>
          </div>

          <div className="insights-cards-grid">
            {/* 1. Core Concept Difference */}
            <div className="insight-card concept-card">
              <div className="insight-card-head">
                <BookOpen size={16} className="head-icon" />
                <h4 className="card-head-title">Story Concepts & Inciting Hooks</h4>
                <span className="card-tag-verified">Verified Metadata</span>
              </div>
              <p className="insight-text">{insights.conceptDiff}</p>
            </div>

            {/* 2. Emotional Tone & Pace */}
            <div className="insight-card tone-card">
              <div className="insight-card-head">
                <Heart size={16} className="head-icon" />
                <h4 className="card-head-title">Emotional Tone vs Suspense / Adventure / Drama</h4>
                <span className="card-tag-subjective">Subjective Observation</span>
              </div>
              {insights.toneContrastSummary && (
                <div className="tone-contrast-callout">
                  <span className="callout-sparkle">✦</span>
                  <p className="callout-text">{insights.toneContrastSummary}</p>
                </div>
              )}
              <div className="tones-list">
                {insights.tones.map((t, idx) => (
                  <div key={idx} className="tone-item">
                    <span className="tone-film-name">{t.title}:</span>
                    <span className="tone-badge">{t.tone}</span>
                    <span className="tone-desc">— {t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Storytelling Similarities */}
            <div className="insight-card similarity-card">
              <div className="insight-card-head">
                <Compass size={16} className="head-icon" />
                <h4 className="card-head-title">Similarities in Storytelling</h4>
                <span className="card-tag-structural">Structural Observation</span>
              </div>
              <p className="insight-text">{insights.similarityText}</p>
            </div>

            {/* 4. Thematic Differences */}
            <div className="insight-card theme-card">
              <div className="insight-card-head">
                <Layers size={16} className="head-icon" />
                <h4 className="card-head-title">Thematic Motifs & Differences</h4>
                <span className="card-tag-subjective">Subjective Observation</span>
              </div>
              <p className="insight-text">{insights.themeDiffText}</p>
            </div>
          </div>

          {/* Editorial Note & Non-hierarchical Disclaimer */}
          <div className="insights-footer-note">
            <span className="footer-note-star">✦</span>
            <p className="footer-note-text">
              <strong>Journalist Note:</strong> Tone categorizations and thematic contrasts are qualitative editorial observations derived from verified narrative patterns. Cinematic storytelling is subjective; CineScope does not rank one artistic vision as objectively superior to another.
            </p>
          </div>
        </div>
      )}

      {/* Search / Select Comparison Film Modal */}
      {searchModalOpen && (
        <div className="comp-modal-overlay" onClick={() => { setSearchModalOpen(false); setReplacingId(null); }}>
          <div className="comp-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="comp-modal-header">
              <div className="modal-title-group">
                <h3 className="modal-title">
                  {replacingId ? 'Replace Film in Comparison' : 'Select Movie to Compare'}
                </h3>
                <p className="modal-subtitle">
                  {replacingId 
                    ? 'Search or pick a similar title to substitute into this comparison slot' 
                    : 'Pick from curated similar recommendations or search any title in TMDB'}
                </p>
              </div>
              <button 
                className="modal-close" 
                onClick={() => { setSearchModalOpen(false); setReplacingId(null); }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="modal-search-box">
              <Search size={16} className="search-box-icon" />
              <input
                type="text"
                placeholder="Search film by title (e.g. Inception, Arrival, Fight Club)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="modal-search-input"
              />
              {searchQuery && (
                <button className="clear-modal-search" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            {/* Modal Body */}
            <div className="comp-modal-content">
              {/* Search Results if user is searching */}
              {searchQuery.trim() ? (
                <div className="modal-results-section">
                  <h4 className="modal-group-title">
                    {searchLoading ? 'Searching TMDB...' : `Search Results (${searchResults.length})`}
                  </h4>
                  {searchLoading ? (
                    <div className="modal-loading-text">Searching cinema database...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="modal-empty-search">No titles found matching “{searchQuery}”.</div>
                  ) : (
                    <div className="modal-movies-list">
                      {searchResults.map(movie => (
                        <div key={movie.id} className="modal-movie-row" onClick={() => handleAddMovie(movie)}>
                          <img src={movie.poster} alt={movie.title} className="row-poster" />
                          <div className="row-info">
                            <h5 className="row-title">{movie.title}</h5>
                            <span className="row-meta">{movie.year} • {movie.genres.join(', ')} • ★ {movie.rating}</span>
                          </div>
                          <button className="row-select-btn">
                            <Plus size={14} />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Curated Recommendations for 1-click pick */
                <div className="modal-quick-picks">
                  <h4 className="modal-group-title">Recommended Similar Films (1-Click Add)</h4>
                  {recommendedMovies.length === 0 ? (
                    <p className="modal-hint-text">Type above to search any movie from the global TMDB archive.</p>
                  ) : (
                    <div className="modal-movies-list">
                      {recommendedMovies
                        .filter(m => !comparedMovies.some(c => c.id === m.id))
                        .map(movie => (
                          <div key={movie.id} className="modal-movie-row" onClick={() => handleAddMovie(movie)}>
                            <img src={movie.poster} alt={movie.title} className="row-poster" />
                            <div className="row-info">
                              <h5 className="row-title">{movie.title}</h5>
                              <span className="row-meta">{movie.year} • {movie.genres.join(', ')} • ★ {movie.rating}</span>
                            </div>
                            <button className="row-select-btn">
                              <Plus size={14} />
                              <span>Compare</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

MovieComparisonSection.displayName = 'MovieComparisonSection';


