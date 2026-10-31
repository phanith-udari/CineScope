import React, { useState, useEffect } from 'react';
import { Compass, Star, Plus, ArrowRight, Check } from 'lucide-react';
import { fetchMovieRecommendationsAndSimilar } from '../services/tmdb';
import './SimilarRecommendationsSection.css';

export const SimilarRecommendationsSection = ({ 
  movieId, 
  currentMovieTitle,
  onSelectMovie,
  onAddMovieToCompare,
  onRecommendationsLoaded,
  comparedMovieIds = []
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRecs() {
      if (!movieId) return;
      setLoading(true);
      try {
        const data = await fetchMovieRecommendationsAndSimilar(movieId);
        if (isMounted) {
          setRecommendations(data);
          if (onRecommendationsLoaded) {
            onRecommendationsLoaded(data);
          }
        }
      } catch (err) {
        console.warn('Could not load similar recommendations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRecs();
    return () => { isMounted = false; };
  }, [movieId, onRecommendationsLoaded]);

  if (!loading && recommendations.length === 0) return null;

  return (
    <section className="similar-recs-section">
      <div className="similar-recs-header">
        <div className="recs-title-group">
          <span className="pill-badge badge-lavender">
            <Compass size={13} />
            <span>Spiritual Kin & Similar Journeys</span>
          </span>
          <h3 className="similar-main-title">
            If You Loved {currentMovieTitle || 'This Story'}
          </h3>
          <p className="similar-sub">
            Curated from TMDB's recommendation intelligence and cinematic similarity algorithms.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="recs-carousel-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rec-card-skeleton shimmer" />
          ))}
        </div>
      ) : (
        <div className="recs-carousel-grid">
          {recommendations.slice(0, 8).map(movie => {
            const isAlreadyCompared = comparedMovieIds.includes(movie.id);

            return (
              <div key={movie.id} className="rec-mini-card">
                <div 
                  className="rec-poster-box"
                  onClick={() => onSelectMovie && onSelectMovie(movie)}
                >
                  <img src={movie.poster} alt={movie.title} className="rec-poster-img" />
                  <div className="rec-rating-badge">
                    <Star size={11} fill="#E07A9F" color="#E07A9F" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="rec-body">
                  <span className="rec-year">{movie.year}</span>
                  <h4 
                    className="rec-title" 
                    title={movie.title}
                    onClick={() => onSelectMovie && onSelectMovie(movie)}
                  >
                    {movie.title}
                  </h4>

                  <div className="rec-actions-row">
                    <button 
                      className="rec-action-btn view-btn"
                      onClick={() => onSelectMovie && onSelectMovie(movie)}
                      title="View movie details"
                    >
                      <span>View</span>
                      <ArrowRight size={11} />
                    </button>

                    {onAddMovieToCompare && (
                      <button 
                        className={`rec-action-btn compare-btn ${isAlreadyCompared ? 'already-compared' : ''}`}
                        onClick={() => !isAlreadyCompared && onAddMovieToCompare(movie)}
                        title={isAlreadyCompared ? 'Already in comparison' : 'Add to story comparison'}
                        disabled={isAlreadyCompared}
                      >
                        {isAlreadyCompared ? (
                          <>
                            <Check size={11} />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus size={11} />
                            <span>Compare</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
