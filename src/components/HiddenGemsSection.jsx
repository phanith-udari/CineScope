import React, { useState, useEffect } from 'react';
import { Gem, Quote } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { MovieGridSkeleton } from './MovieSkeleton';
import { ErrorState } from './ErrorState';
import { fetchHiddenGems } from '../services/tmdb';
import './HiddenGemsSection.css';

export const HiddenGemsSection = ({ 
  watchlist = [], 
  onToggleWatchlist, 
  onSelectMovie 
}) => {
  const [gems, setGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHiddenGems(1);
      setGems(data);
    } catch (err) {
      console.error('Failed to load hidden gems from TMDB:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGems();
  }, []);

  return (
    <section id="hidden-gems" className="gems-section">
      <div className="container">
        {/* Curated Journal Envelope Banner */}
        <div className="gems-banner-card">
          <div className="banner-left">
            <div className="gems-badge-row">
              <span className="pill-badge badge-sage">
                <Gem size={13} />
                <span>The Curator's TMDB Vault</span>
              </span>
              <span className="gems-whisper">underrated & high-rated treasures</span>
            </div>

            <h2 className="gems-title">
              Hidden Gems & Quiet Masterpieces
            </h2>

            <p className="gems-subtitle">
              Queried directly from The Movie Database's critical archive. These films hold 
              exceptional user ratings (7.8+) without the commercial marketing noise. 
              Intimate frames, poetic truths, and deep cinephile love.
            </p>

            <div className="gems-quote-box">
              <Quote size={20} className="gems-quote-icon" />
              <p className="gems-quote-text">
                “Sometimes the most breathtaking films are not the loudest ones in the theater, 
                but the quiet whispers that make the world pause.”
              </p>
              <span className="gems-quote-author">— CineScope Curators</span>
            </div>
          </div>

          <div className="banner-right-card">
            <div className="gems-ticket-stub">
              <div className="ticket-top">
                <span className="ticket-brand">TMDB VAULT VERIFIED</span>
                <span className="ticket-number">NO. 884-G</span>
              </div>
              <div className="ticket-body">
                <h4 className="ticket-highlight-title">Curator's TMDB Filter</h4>
                <p className="ticket-desc">
                  Real film ratings, authentic user evaluations, and zero fabricated recommendations.
                </p>
                <div className="ticket-badges">
                  <span className="ticket-pill">✦ Rating ≥ 7.8</span>
                  <span className="ticket-pill">✦ Genuine Votes</span>
                  <span className="ticket-pill">✦ Indie Gems</span>
                </div>
              </div>
              <div className="ticket-cutout" />
            </div>
          </div>
        </div>

        {/* Loading / Error / Gems Grid */}
        {loading ? (
          <MovieGridSkeleton count={8} />
        ) : error ? (
          <ErrorState 
            error={error} 
            onRetry={loadGems} 
            title="Couldn't retrieve hidden gems from TMDB" 
          />
        ) : gems.length === 0 ? (
          <div className="no-movies-box">
            <p className="no-movies-text">No hidden gems found right now.</p>
          </div>
        ) : (
          <div className="gems-grid">
            {gems.slice(0, 8).map(movie => (
              <MovieCard 
                key={movie.id}
                movie={movie}
                variant="gem"
                isInWatchlist={watchlist.some(w => w.id === movie.id)}
                onToggleWatchlist={onToggleWatchlist}
                onSelectMovie={onSelectMovie}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
