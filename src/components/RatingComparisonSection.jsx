import React, { useEffect, useState } from 'react';
import { Star, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchImdbData } from '../services/omdb';
import './RatingComparisonSection.css';

export const RatingComparisonSection = ({ 
  tmdbRating = 0, 
  tmdbVoteCount = 0, 
  imdbId = null 
}) => {
  const [imdbData, setImdbData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadImdb() {
      if (!imdbId) {
        setImdbData({ available: false, imdbId: null, reason: 'No IMDb ID linked' });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchImdbData(imdbId);
        if (isMounted) {
          setImdbData(data);
        }
      } catch {
        if (isMounted) {
          setImdbData({ available: false, imdbId, reason: 'IMDb rating unavailable' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadImdb();

    return () => {
      isMounted = false;
    };
  }, [imdbId]);

  return (
    <div className="rating-comparison-wrapper">
      <div className="rating-section-header">
        <h3 className="rating-heading">Audience & Critic Ratings</h3>
        <span className="rating-sub">
          Verified side-by-side evaluation from TMDB and IMDb
        </span>
      </div>

      <div className="rating-cards-grid">
        {/* TMDB Rating Card */}
        <div className="rating-card tmdb-rating-card">
          <div className="rating-card-top">
            <div className="brand-badge tmdb-brand">
              <span className="brand-dot tmdb-dot" />
              <span className="brand-name">TMDB Score</span>
            </div>
            <span className="card-source-tag">The Movie Database</span>
          </div>

          <div className="rating-score-display">
            <div className="rating-stars-bubble">
              <Star size={24} fill="#01b4e4" color="#01b4e4" />
            </div>
            <div className="score-numbers">
              <span className="main-score tmdb-accent">
                {tmdbRating > 0 ? tmdbRating.toFixed(1) : 'N/A'}
              </span>
              <span className="score-base">/ 10</span>
            </div>
          </div>

          <div className="rating-card-footer">
            <div className="votes-line">
              <span className="votes-count">
                {tmdbVoteCount > 0 ? tmdbVoteCount.toLocaleString() : 'Few'}
              </span>
              <span className="votes-label">cinephile ratings</span>
            </div>
            <span className="rating-status-chip">
              <CheckCircle2 size={12} />
              <span>Community Verified</span>
            </span>
          </div>
        </div>

        {/* IMDb Rating Card */}
        <div className="rating-card imdb-rating-card">
          <div className="rating-card-top">
            <div className="brand-badge imdb-brand">
              <span className="imdb-logo-text">IMDb</span>
            </div>
            {imdbId && (
              <span className="imdb-id-chip" title="Official IMDb Title ID">
                {imdbId}
              </span>
            )}
            <span className="card-source-tag">Internet Movie Database</span>
          </div>

          {loading ? (
            <div className="imdb-loading-box">
              <div className="shimmer skeleton-score" />
              <div className="shimmer skeleton-votes" />
            </div>
          ) : imdbData && imdbData.available ? (
            <>
              <div className="rating-score-display">
                <div className="rating-stars-bubble imdb-bubble">
                  <Star size={24} fill="#F5C518" color="#F5C518" />
                </div>
                <div className="score-numbers">
                  <span className="main-score imdb-accent">
                    {imdbData.imdbRating.toFixed(1)}
                  </span>
                  <span className="score-base">/ 10</span>
                </div>
              </div>

              <div className="rating-card-footer">
                <div className="votes-line">
                  <span className="votes-count">
                    {imdbData.imdbVotes || 'Recorded'}
                  </span>
                  <span className="votes-label">global votes</span>
                </div>

                <a 
                  href={imdbData.imdbUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="imdb-external-link"
                  title="Open title page on IMDb"
                >
                  <span>View on IMDb</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Extra critic scores if available from OMDb */}
              {(imdbData.metascore || imdbData.rottenTomatoes) && (
                <div className="imdb-extra-ratings">
                  {imdbData.rottenTomatoes && (
                    <span className="extra-rating-pill rt">
                      🍅 {imdbData.rottenTomatoes}
                    </span>
                  )}
                  {imdbData.metascore && (
                    <span className="extra-rating-pill meta">
                      Metascore {imdbData.metascore}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="imdb-unavailable-box">
              <div className="unavailable-icon-bubble">
                <AlertCircle size={20} />
              </div>
              <div className="unavailable-text">
                <h5 className="unavailable-title">IMDb rating unavailable</h5>
                <p className="unavailable-desc">
                  {imdbData?.reason || 'No verified IMDb rating currently found for this title.'}
                </p>
              </div>

              {imdbId && (
                <a 
                  href={`https://www.imdb.com/title/${imdbId}/`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="imdb-external-link direct-link"
                >
                  <span>Check IMDb Listing</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
