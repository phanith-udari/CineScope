import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { moodCategories } from '../data/moviesData';
import { MovieCard } from './MovieCard';
import { MovieGridSkeleton } from './MovieSkeleton';
import { ErrorState } from './ErrorState';
import { fetchMoviesByMood } from '../services/tmdb';
import './BrowseMoodSection.css';

export const BrowseMoodSection = ({ 
  watchlist = [], 
  onToggleWatchlist, 
  onSelectMovie,
  selectedMood = 'Feel Good',
  onSelectMood
}) => {
  const [activeMoodId, setActiveMoodId] = useState(selectedMood);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMoodMovies = async (moodId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMoviesByMood(moodId);
      setMovies(data);
    } catch (err) {
      console.error(`Failed to load mood movies for ${moodId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveMoodId(selectedMood);
    loadMoodMovies(selectedMood);
  }, [selectedMood]);

  const handleMoodSelect = (moodName) => {
    setActiveMoodId(moodName);
    if (onSelectMood) onSelectMood(moodName);
    loadMoodMovies(moodName);
  };

  const currentMoodObj = moodCategories.find(m => m.id === activeMoodId) || moodCategories[0];

  return (
    <section id="moods" className="moods-section">
      <div className="container">
        {/* Section Header */}
        <div className="moods-header-center">
          <span className="pill-badge badge-lavender">
            <Sparkles size={12} />
            <span>Emotional TMDB Discovery</span>
          </span>
          <h2 className="moods-main-title">
            Browse by Mood
          </h2>
          <p className="moods-main-subtitle">
            What does your soul feel like watching tonight? Choose a feeling, 
            and our journal will fetch real, critically rated cinema from The Movie Database.
          </p>
        </div>

        {/* 6 Mood Cards Grid */}
        <div className="mood-cards-grid">
          {moodCategories.map(mood => {
            const isSelected = activeMoodId === mood.id;
            return (
              <div
                key={mood.id}
                className={`mood-card-item ${isSelected ? 'selected' : ''}`}
                style={{
                  '--mood-bg': mood.bgColor,
                  '--mood-border': mood.borderColor,
                  '--mood-accent': mood.accentColor,
                  '--mood-card-pill': mood.color
                }}
                onClick={() => handleMoodSelect(mood.id)}
              >
                <div className="mood-card-top">
                  <div className="mood-icon-bubble">
                    <span className="mood-emoji">{mood.emoji}</span>
                  </div>
                  <span className="mood-count-tag">{mood.name}</span>
                </div>

                <div className="mood-card-text">
                  <h3 className="mood-title">{mood.name}</h3>
                  <p className="mood-tagline">{mood.tagline}</p>
                </div>

                <div className="mood-card-footer">
                  <span className="mood-explore-btn">
                    {isSelected ? 'Live TMDB Showcase' : 'Explore Mood'}
                    {isSelected ? <Check size={14} /> : <ArrowRight size={14} />}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtered Mood Showcase Reel */}
        <div className="mood-results-showcase">
          <div className="showcase-header">
            <div className="showcase-title-wrap">
              <span className="showcase-emoji">{currentMoodObj.emoji}</span>
              <div>
                <h3 className="showcase-title">
                  {currentMoodObj.name} Selection
                </h3>
                <p className="showcase-tagline">
                  {currentMoodObj.tagline} · {loading ? 'Fetching live films...' : `${movies.length} real TMDB titles`}
                </p>
              </div>
            </div>

            <div className="showcase-pills-wrap">
              <span className="aesthetic-quote-pill">
                ✦ TMDB Genre Discovery: {currentMoodObj.name}
              </span>
            </div>
          </div>

          {/* Loading / Error / Grid */}
          {loading ? (
            <MovieGridSkeleton count={8} />
          ) : error ? (
            <ErrorState 
              error={error} 
              onRetry={() => loadMoodMovies(activeMoodId)} 
              title={`Couldn't load ${activeMoodId} movies from TMDB`} 
            />
          ) : movies.length === 0 ? (
            <div className="no-movies-box">
              <p className="no-movies-text">No movies found for this mood filter.</p>
            </div>
          ) : (
            <div className="mood-movies-grid">
              {movies.slice(0, 8).map(movie => (
                <MovieCard 
                  key={movie.id}
                  movie={movie}
                  isInWatchlist={watchlist.some(w => w.id === movie.id)}
                  onToggleWatchlist={onToggleWatchlist}
                  onSelectMovie={onSelectMovie}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
