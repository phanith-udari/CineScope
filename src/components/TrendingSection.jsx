import React, { useState, useEffect } from 'react';
import { Flame, Star, Calendar, TrendingUp } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { MovieGridSkeleton } from './MovieSkeleton';
import { ErrorState } from './ErrorState';
import { 
  fetchTrendingMovies, 
  fetchPopularMovies, 
  fetchTopRatedMovies, 
  fetchUpcomingMovies 
} from '../services/tmdb';
import './TrendingSection.css';

export const TrendingSection = ({ 
  watchlist = [], 
  onToggleWatchlist, 
  onSelectMovie 
}) => {
  const [activeTab, setActiveTab] = useState('trending'); // 'trending', 'popular', 'top_rated', 'upcoming'
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMovies = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (tab === 'trending') {
        data = await fetchTrendingMovies('week');
      } else if (tab === 'popular') {
        data = await fetchPopularMovies();
      } else if (tab === 'top_rated') {
        data = await fetchTopRatedMovies();
      } else if (tab === 'upcoming') {
        data = await fetchUpcomingMovies();
      }
      setMovies(data);
    } catch (err) {
      console.error(`Failed to load ${tab} movies from TMDB:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies(activeTab);
  }, [activeTab]);

  return (
    <section id="trending" className="trending-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-head-wrap">
          <div className="head-text-group">
            <div className="section-tag-row">
              <span className="pill-badge badge-blush">
                <Flame size={12} />
                <span>Real-Time TMDB Reel</span>
              </span>
              <span className="curator-whisper">live global cinema pulses</span>
            </div>
            <h2 className="section-main-title">
              Trending Stories in the Journal
            </h2>
            <p className="section-desc">
              Synchronized directly with The Movie Database. Discover what global audiences 
              are streaming, falling in love with, and celebrating on the big screen right now.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="trending-filter-tabs">
            <button 
              className={`filter-tab ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              <TrendingUp size={13} />
              <span>Trending Weekly</span>
            </button>
            <button 
              className={`filter-tab ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              <Flame size={13} />
              <span>Popular Now</span>
            </button>
            <button 
              className={`filter-tab ${activeTab === 'top_rated' ? 'active' : ''}`}
              onClick={() => setActiveTab('top_rated')}
            >
              <Star size={13} fill={activeTab === 'top_rated' ? '#FFF' : '#E07A9F'} />
              <span>Top Rated</span>
            </button>
            <button 
              className={`filter-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <Calendar size={13} />
              <span>Upcoming</span>
            </button>
          </div>
        </div>

        {/* Loading / Error / Movies Grid */}
        {loading ? (
          <MovieGridSkeleton count={8} />
        ) : error ? (
          <ErrorState 
            error={error} 
            onRetry={() => loadMovies(activeTab)} 
            title="Unable to load trending TMDB films" 
          />
        ) : movies.length === 0 ? (
          <div className="no-movies-box">
            <p className="no-movies-text">No trending films found right now.</p>
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map(movie => (
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
    </section>
  );
};
