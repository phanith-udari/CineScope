import React, { useEffect } from 'react';
import { X, Star, Clock, Calendar, Heart, Sparkles, Quote, User } from 'lucide-react';
import './MovieModal.css';

export const MovieModal = ({ 
  movie, 
  isOpen, 
  onClose, 
  isInWatchlist, 
  onToggleWatchlist 
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !movie) return null;

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div 
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="modal-backdrop-hero">
          <img 
            src={movie.backdrop || movie.poster} 
            alt={movie.title}
            className="modal-backdrop-img"
          />
          <div className="modal-backdrop-gradient" />

          {/* Quick badge on backdrop */}
          <div className="backdrop-badge-row">
            <span className="pill-badge badge-lavender">
              <Sparkles size={12} />
              <span>{movie.badge || 'CineScope Entry'}</span>
            </span>
          </div>
        </div>

        {/* Main Details Body */}
        <div className="modal-body">
          <div className="modal-layout">
            {/* Left: Poster Polaroid */}
            <div className="modal-poster-col">
              <div className="modal-polaroid-frame">
                <img 
                  src={movie.poster} 
                  alt={movie.title} 
                  className="modal-poster-img"
                />
                <div className="modal-poster-stamp">
                  <Star size={14} fill="#E07A9F" color="#E07A9F" />
                  <span>{movie.rating.toFixed(1)} / 10</span>
                </div>
              </div>

              {/* Watchlist toggle in modal */}
              <button 
                className={`modal-watchlist-btn ${isInWatchlist ? 'active' : ''}`}
                onClick={() => onToggleWatchlist(movie)}
              >
                <Heart 
                  size={18} 
                  fill={isInWatchlist ? "#FFF" : "none"} 
                  color={isInWatchlist ? "#FFF" : "#D9779F"} 
                />
                <span>{isInWatchlist ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>

            {/* Right: Film Info & Journal Notes */}
            <div className="modal-info-col">
              <div className="modal-meta-row">
                <span className="meta-pill">
                  <Calendar size={13} />
                  <span>{movie.year}</span>
                </span>
                <span className="meta-pill">
                  <Clock size={13} />
                  <span>{movie.duration}</span>
                </span>
                <span className="meta-pill">
                  <User size={13} />
                  <span>{movie.director}</span>
                </span>
              </div>

              <h2 className="modal-film-title">{movie.title}</h2>

              {/* Genre Pills */}
              <div className="modal-genres">
                {movie.genres.map((g, i) => (
                  <span key={i} className="genre-pill">{g}</span>
                ))}
                {movie.mood && (
                  <span className="mood-pill">Mood: {movie.mood}</span>
                )}
              </div>

              {/* Journal handwritten quote */}
              <div className="modal-journal-entry">
                <div className="journal-entry-head">
                  <Quote size={16} className="quote-icon" />
                  <span className="entry-label">Curator's Journal Log</span>
                </div>
                <p className="journal-entry-text">
                  “{movie.journalNote}”
                </p>
              </div>

              {/* Synopsis */}
              <div className="modal-synopsis-section">
                <h4 className="synopsis-heading">Story Overview</h4>
                <p className="synopsis-text">{movie.synopsis}</p>
              </div>

              {/* Why it's special / Gem note */}
              {movie.gemReason && (
                <div className="modal-gem-highlight">
                  <span className="highlight-tag">✦ What makes it special:</span>
                  <p className="highlight-text">{movie.gemReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
