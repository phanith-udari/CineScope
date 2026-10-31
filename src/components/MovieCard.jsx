import React from 'react';
import { Star, Heart, Clock, Calendar, Sparkles, Eye } from 'lucide-react';
import { FALLBACK_POSTER } from '../services/tmdb';
import './MovieCard.css';

export const MovieCard = ({ 
  movie, 
  isInWatchlist, 
  onToggleWatchlist, 
  onSelectMovie,
  variant = 'standard' // 'standard', 'gem', 'compact'
}) => {
  const handleWatchlistClick = (e) => {
    e.stopPropagation();
    onToggleWatchlist(movie);
  };

  return (
    <div 
      className={`movie-card-item card-${movie.palette || 'lavender'} ${variant === 'gem' ? 'card-gem-style' : ''}`}
      onClick={() => onSelectMovie(movie)}
    >
      {/* Poster Image Container */}
      <div className="card-media-wrapper">
        <img 
          src={movie.poster} 
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_POSTER;
          }}
          className="card-poster-img"
        />

        {/* Top Badges overlay */}
        <div className="card-top-overlay">
          {/* Rating stamp */}
          <div className="rating-pill">
            <Star size={13} fill="#E07A9F" color="#E07A9F" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>

          {/* Watchlist toggle heart button */}
          <button 
            className={`card-bookmark-btn ${isInWatchlist ? 'active' : ''}`}
            onClick={handleWatchlistClick}
            title={isInWatchlist ? "Remove from Watchlist" : "Save to Watchlist"}
            aria-label={isInWatchlist ? "Remove from Watchlist" : "Save to Watchlist"}
          >
            <Heart 
              size={17} 
              fill={isInWatchlist ? "#D9779F" : "none"} 
              color={isInWatchlist ? "#D9779F" : "#5E4E85"} 
            />
          </button>
        </div>

        {/* Feature badge pill if any */}
        {movie.badge && (
          <div className="card-editorial-badge">
            <Sparkles size={11} />
            <span>{movie.badge}</span>
          </div>
        )}

        {/* Quick View Hover Button */}
        <div className="card-hover-action">
          <button className="quick-view-action">
            <Eye size={15} />
            <span>Quick Look</span>
          </button>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="card-body">
        {/* Meta row: Year & Duration */}
        <div className="card-meta-line">
          <span className="card-year">
            <Calendar size={12} className="meta-icon" />
            {movie.year}
          </span>
          <span className="meta-dot">•</span>
          <span className="card-duration">
            <Clock size={12} className="meta-icon" />
            {movie.duration}
          </span>
          <span className="meta-dot">•</span>
          <span className="card-director">Dir. {(movie.director || 'Director').split(',')[0]}</span>
        </div>

        {/* Title */}
        <h4 className="card-title" title={movie.title}>
          {movie.title}
        </h4>

        {/* Journal snippet quote */}
        {movie.journalNote && (
          <p className="card-journal-snip">
            “{movie.journalNote}”
          </p>
        )}

        {/* Why it's a gem note if gem style */}
        {variant === 'gem' && movie.gemReason && (
          <div className="gem-reason-box">
            <span className="gem-reason-label">✦ Curator's Gem Note:</span>
            <p className="gem-reason-text">{movie.gemReason}</p>
          </div>
        )}

        {/* Genre Tags */}
        <div className="card-genres">
          {movie.genres.map((g, idx) => (
            <span key={idx} className="genre-pill">
              {g}
            </span>
          ))}
          {movie.mood && (
            <span className="mood-pill">
              {movie.mood}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
