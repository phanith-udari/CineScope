import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Sparkles, BookOpen, Eye, Heart, 
  Feather, Check 
} from 'lucide-react';
import { fetchSpoilerFreeStory } from '../services/aiStory';
import './SpoilerFreeStorySection.css';

export const SpoilerFreeStorySection = ({ movie }) => {
  const [storyData, setStoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRawOverview, setShowRawOverview] = useState(false);

  const loadStory = async () => {
    if (!movie) return;
    setLoading(true);
    try {
      const data = await fetchSpoilerFreeStory(movie);
      setStoryData(data);
    } catch (err) {
      console.warn('Error loading spoiler-free story:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShowRawOverview(false);
    loadStory();
  }, [movie?.id]);

  if (!movie) return null;

  return (
    <section className="spoiler-free-story-section">
      {/* Header with Title and Spoiler-Free Safety Badge */}
      <div className="story-section-header">
        <div className="header-title-wrap">
          <div className="section-pill-row">
            <span className="pill-badge badge-lavender">
              <ShieldCheck size={13} className="shield-icon" />
              <span>100% Spoiler Protected</span>
            </span>
            <span className="safe-curator-whisper">safe for first-time viewers</span>
          </div>
          <h2 className="story-main-title">
            The Story, Without the Spoilers
          </h2>
        </div>

        {/* Action Toggle to view original TMDB overview if desired */}
        <button 
          className="toggle-overview-btn"
          onClick={() => setShowRawOverview(!showRawOverview)}
          title="Toggle between AI spoiler-free narrative and original TMDB synopsis"
        >
          {showRawOverview ? (
            <>
              <ShieldCheck size={14} />
              <span>Show Spoiler-Free Version</span>
            </>
          ) : (
            <>
              <Eye size={14} />
              <span>Compare Original TMDB Synopsis</span>
            </>
          )}
        </button>
      </div>

      {/* Main Story Content Card */}
      <div className="story-card-wrapper">
        {loading ? (
          <div className="story-loading-state">
            <div className="skeleton-line shimmer" style={{ width: '90%', height: '18px' }} />
            <div className="skeleton-line shimmer" style={{ width: '96%', height: '18px', marginTop: '0.6rem' }} />
            <div className="skeleton-line shimmer" style={{ width: '88%', height: '18px', marginTop: '0.6rem' }} />
            <div className="skeleton-line shimmer" style={{ width: '70%', height: '18px', marginTop: '0.6rem' }} />
          </div>
        ) : showRawOverview ? (
          /* Raw TMDB Overview View */
          <div className="raw-overview-box">
            <div className="raw-box-header">
              <span className="raw-badge">Original TMDB Synopsis</span>
              <span className="raw-note">Standard distributor overview</span>
            </div>
            <p className="raw-overview-text">
              {movie.overview || 'No synopsis provided.'}
            </p>
          </div>
        ) : (
          /* Curated Spoiler-Free Story Narrative */
          <div className="story-narrative-box">
            <div className="narrative-meta-bar">
              <span className="narrative-tag">
                <Feather size={13} />
                <span>
                  {storyData?.isFallback 
                    ? 'Verified TMDB Premise Guide' 
                    : 'AI-Crafted Spoiler-Free Journey'}
                </span>
              </span>
              <span className="word-count-note">~120 words · premise only</span>
            </div>

            <p className="story-paragraph">
              {storyData?.spoilerFreeStory || movie.overview}
            </p>

            <div className="story-pledge-footer">
              <span className="pledge-item">
                <Check size={12} className="check-icon" /> Zero ending reveals
              </span>
              <span className="pledge-dot">•</span>
              <span className="pledge-item">
                <Check size={12} className="check-icon" /> No plot twists spoiled
              </span>
              <span className="pledge-dot">•</span>
              <span className="pledge-item">
                <Check size={12} className="check-icon" /> Pure opening premise
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Additional Section: What Makes It Special? / Why You Might Love It */}
      <div className="why-love-it-section">
        <div className="why-love-header">
          <Sparkles size={16} className="sparkle-accent" />
          <h3 className="why-love-title">Why You Might Love It</h3>
        </div>

        <div className="why-love-grid">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="why-card-skeleton shimmer" />
            ))
          ) : storyData && storyData.whyYouMightLoveIt && storyData.whyYouMightLoveIt.length > 0 ? (
            storyData.whyYouMightLoveIt.map((item, idx) => {
              // Icon mapping
              const IconComp = idx === 0 ? BookOpen : idx === 1 ? Eye : Heart;
              const palette = idx === 0 ? 'lavender' : idx === 1 ? 'blush' : 'sage';

              return (
                <div key={idx} className={`why-card item-${palette}`}>
                  <div className="why-card-icon-wrap">
                    <IconComp size={18} />
                  </div>
                  <div className="why-card-content">
                    <h4 className="why-card-title">{item.title}</h4>
                    <p className="why-card-desc">{item.description}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              <div className="why-card item-lavender">
                <div className="why-card-icon-wrap">
                  <BookOpen size={18} />
                </div>
                <div className="why-card-content">
                  <h4 className="why-card-title">Storytelling Craft</h4>
                  <p className="why-card-desc">
                    Tightly paced and character-focused, drawing you immediately into its world.
                  </p>
                </div>
              </div>
              <div className="why-card item-blush">
                <div className="why-card-icon-wrap">
                  <Eye size={18} />
                </div>
                <div className="why-card-content">
                  <h4 className="why-card-title">Visual Experience</h4>
                  <p className="why-card-desc">
                    Artful framing and deliberate aesthetic composition designed for immersion.
                  </p>
                </div>
              </div>
              <div className="why-card item-sage">
                <div className="why-card-icon-wrap">
                  <Heart size={18} />
                </div>
                <div className="why-card-content">
                  <h4 className="why-card-title">Emotional Depth</h4>
                  <p className="why-card-desc">
                    Explores authentic human choices and motivations that linger well after watching.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
