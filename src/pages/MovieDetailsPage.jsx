import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, Star, Clock, Calendar, Bookmark, Heart, 
  Sparkles, User, ExternalLink, RefreshCw, Film, BookOpen 
} from 'lucide-react';
import { fetchMovieDetails, fetchMovieRecommendationsAndSimilar, FALLBACK_POSTER, FALLBACK_BACKDROP } from '../services/tmdb';
import { MovieCardSkeleton } from '../components/MovieSkeleton';
import { ErrorState } from '../components/ErrorState';
import { RatingComparisonSection } from '../components/RatingComparisonSection';
import { SpoilerFreeStorySection } from '../components/SpoilerFreeStorySection';
import { SimilarRecommendationsSection } from '../components/SimilarRecommendationsSection';
import { MovieComparisonSection } from '../components/MovieComparisonSection';
import './MovieDetailsPage.css';

export const MovieDetailsPage = ({ 
  movieId, 
  onBack, 
  isInWatchlist, 
  onToggleWatchlist,
  onSelectMovie,
  onLogFilmInDiary 
}) => {
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [comparedMovieIds, setComparedMovieIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const comparisonRef = useRef(null);

  const loadDetails = async () => {
    if (!movieId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMovieDetails(movieId);
      setMovie(data);
    } catch (err) {
      console.error('Failed to load movie details:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadDetails();
  }, [movieId]);

  if (loading) {
    return (
      <div className="movie-details-page loading-view">
        <div className="container">
          <button className="back-link-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Journal</span>
          </button>
          <div className="details-skeleton-wrap">
            <div className="skeleton-backdrop shimmer" />
            <div className="skeleton-content-grid">
              <div className="skeleton-poster-col shimmer" />
              <div className="skeleton-text-col">
                <div className="skeleton-line shimmer" style={{ width: '60%', height: '36px' }} />
                <div className="skeleton-line shimmer" style={{ width: '40%', height: '20px', marginTop: '1rem' }} />
                <div className="skeleton-line shimmer" style={{ width: '100%', height: '80px', marginTop: '1.5rem' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="movie-details-page error-view">
        <div className="container">
          <button className="back-link-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Journal</span>
          </button>
          <ErrorState 
            error={error} 
            onRetry={loadDetails} 
            title="Couldn't open movie details" 
          />
        </div>
      </div>
    );
  }

  const isSaved = isInWatchlist(movie);

  return (
    <article className="movie-details-page">
      {/* High-res Backdrop Banner */}
      <div className="details-hero-banner">
        <img 
          src={movie.backdrop || FALLBACK_BACKDROP} 
          alt={movie.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_BACKDROP;
          }}
          className="hero-backdrop-img"
        />
        <div className="details-hero-gradient" />

        <div className="container banner-nav-container">
          <button className="back-link-btn glass" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Return to CineScope</span>
          </button>
        </div>
      </div>

      <div className="container details-main-container">
        <div className="details-layout-grid">
          {/* Left Column: Poster & Quick Actions */}
          <div className="details-left-col">
            <div className="details-poster-card">
              <img 
                src={movie.poster || FALLBACK_POSTER} 
                alt={movie.title} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_POSTER;
                }}
                className="details-poster-img"
              />
              <div className="details-rating-badge">
                <Star size={16} fill="#E07A9F" color="#E07A9F" />
                <span className="rating-num">{movie.rating.toFixed(1)}</span>
                <span className="rating-denom">/ 10</span>
              </div>
            </div>

            {/* Watchlist toggle button */}
            <button 
              className={`details-watchlist-btn ${isSaved ? 'saved' : ''}`}
              onClick={() => onToggleWatchlist(movie)}
            >
              <Heart 
                size={18} 
                fill={isSaved ? "#FFF" : "none"} 
                color={isSaved ? "#FFF" : "#D9779F"} 
              />
              <span>{isSaved ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
            </button>

            {/* Log in Film Diary button */}
            <button 
              className="details-diary-btn"
              onClick={() => onLogFilmInDiary && onLogFilmInDiary(movie)}
              title="Record this film in your personal diary"
            >
              <BookOpen size={18} />
              <span>Record in Film Diary</span>
            </button>

            {/* TMDB Verified Badge */}
            <div className="tmdb-verified-box">
              <div className="tmdb-pill">
                <span className="tmdb-dot" />
                <span>Verified TMDB Film</span>
              </div>
              <a 
                href={`https://www.themoviedb.org/movie/${movie.id}`}
                target="_blank" 
                rel="noreferrer"
                className="tmdb-link"
              >
                <span>View on TMDB</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Right Column: Title, Metadata, Overview, Cast */}
          <div className="details-right-col">
            {/* Meta Row */}
            <div className="details-meta-pills">
              <span className="pill-badge badge-lavender">
                <Calendar size={13} />
                <span>{movie.year}</span>
              </span>
              <span className="pill-badge badge-blush">
                <Clock size={13} />
                <span>{movie.duration}</span>
              </span>
              {movie.director && (
                <span className="pill-badge badge-sage">
                  <User size={13} />
                  <span>Dir. {movie.director}</span>
                </span>
              )}
            </div>

            <h1 className="details-movie-title">{movie.title}</h1>

            {movie.tagline && (
              <p className="details-tagline">“{movie.tagline}”</p>
            )}

            {/* Genres */}
            <div className="details-genres-row">
              {movie.genres.map((g, idx) => (
                <span key={idx} className="genre-tag-pill">{g}</span>
              ))}
            </div>

            {/* Side-by-side Dual Rating Section (TMDB + IMDb) */}
            <RatingComparisonSection 
              tmdbRating={movie.rating}
              tmdbVoteCount={movie.voteCount}
              imdbId={movie.imdbId}
            />

            {/* The Story, Without the Spoilers & Why You Might Love It */}
            <SpoilerFreeStorySection movie={movie} />

            {/* Cast section */}
            {movie.castList && movie.castList.length > 0 && (
              <div className="details-cast-section">
                <h3 className="section-subheading">Leading Cast</h3>
                <div className="cast-bubbles-grid">
                  {movie.castList.map(actor => (
                    <div key={actor.id} className="cast-card">
                      {actor.profilePath ? (
                        <img 
                          src={actor.profilePath} 
                          alt={actor.name} 
                          className="cast-avatar" 
                        />
                      ) : (
                        <div className="cast-avatar-fallback">
                          <User size={18} color="#8C7AB6" />
                        </div>
                      )}
                      <div className="cast-info">
                        <span className="actor-name">{actor.name}</span>
                        <span className="actor-char">{actor.character || 'Character'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Movie Recommendations */}
        <SimilarRecommendationsSection 
          movieId={movie.id} 
          currentMovieTitle={movie.title}
          onSelectMovie={onSelectMovie}
          onAddMovieToCompare={(recMovie) => comparisonRef.current?.addMovie(recMovie)}
          onRecommendationsLoaded={setRecommendations}
          comparedMovieIds={comparedMovieIds}
        />

        {/* Compare the Stories & What Makes Them Different */}
        <MovieComparisonSection 
          ref={comparisonRef}
          baseMovie={movie}
          recommendedMovies={recommendations}
          onSelectMovie={onSelectMovie}
          onComparedMoviesChange={(movies) => setComparedMovieIds(movies.map(m => m.id))}
        />
      </div>
    </article>
  );
};
