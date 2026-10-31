import React, { useEffect } from 'react';
import { X, Bookmark, Trash2, Heart, Film, ArrowRight, Star } from 'lucide-react';
import './WatchlistDrawer.css';

export const WatchlistDrawer = ({ 
  isOpen, 
  onClose, 
  watchlist = [], 
  onRemoveMovie, 
  onClearWatchlist,
  onSelectMovie 
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

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div 
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-row">
            <div className="drawer-icon-bubble">
              <Bookmark size={20} className="drawer-icon" />
            </div>
            <div>
              <h3 className="drawer-title">My Movie Watchlist</h3>
              <p className="drawer-subtitle">
                {watchlist.length} {watchlist.length === 1 ? 'film' : 'films'} bookmarked in your journal
              </p>
            </div>
          </div>

          <button 
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close watchlist drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content list */}
        <div className="drawer-content">
          {watchlist.length === 0 ? (
            <div className="empty-watchlist-state">
              <div className="empty-icon-wrap">
                <Heart size={36} color="#D9779F" />
              </div>
              <h4 className="empty-title">Your watchlist is empty</h4>
              <p className="empty-desc">
                Tap the heart on any movie card to pin it into your personal cinema journal for your next cozy movie night.
              </p>
              <button 
                className="btn-primary"
                onClick={() => {
                  onClose();
                  const el = document.getElementById('trending');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Browse Trending Films</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="watchlist-items-list">
              {watchlist.map(movie => (
                <div 
                  key={movie.id} 
                  className="watchlist-item-card"
                  onClick={() => {
                    onSelectMovie(movie);
                  }}
                >
                  <img 
                    src={movie.poster} 
                    alt={movie.title} 
                    className="item-poster"
                  />
                  <div className="item-details">
                    <h4 className="item-title">{movie.title}</h4>
                    <div className="item-meta">
                      <span>{movie.year}</span>
                      <span>•</span>
                      <span>{movie.duration}</span>
                      <span>•</span>
                      <span className="item-rating">
                        <Star size={11} fill="#E07A9F" color="#E07A9F" />
                        {movie.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="item-mood-badge">
                      {movie.mood}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button 
                    className="item-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveMovie(movie);
                    }}
                    title="Remove from Watchlist"
                    aria-label={`Remove ${movie.title} from watchlist`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {watchlist.length > 0 && (
          <div className="drawer-footer">
            <button 
              className="clear-all-btn"
              onClick={onClearWatchlist}
            >
              Clear Entire List
            </button>
            <button 
              className="btn-primary start-watching-btn"
              onClick={() => {
                onClose();
                onSelectMovie(watchlist[0]);
              }}
            >
              <span>Watch Top Pick</span>
              <Film size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
