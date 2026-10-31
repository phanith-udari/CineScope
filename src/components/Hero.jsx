import React from 'react';
import { Search, Sparkles, Heart, Star, Film } from 'lucide-react';
import { FALLBACK_POSTER } from '../services/tmdb';
import './Hero.css';

export const Hero = ({
  searchQuery,
  onSearchChange,
  onQuickFilter,
  onMovieClick,
  heroMovie
}) => {
  const quickPillTags = [
    { label: 'Feel Good', mood: 'Feel Good', icon: '🌸' },
    { label: 'Mind Bending', mood: 'Mind Bending', icon: '🌀' },
    { label: 'Indie Romance', mood: 'Romantic', icon: '💌' },
    { label: 'Studio Ghibli', query: 'Spirited Away', icon: '🌿' },
    { label: 'Hidden Gems', section: 'hidden-gems', icon: '✨' }
  ];

  const handlePillClick = (item) => {
    if (item.mood) {
      if (onQuickFilter) {
        onQuickFilter({ type: 'mood', value: item.mood });
      }
    } else if (item.query) {
      window.location.hash = `#/search?q=${encodeURIComponent(item.query)}`;
    } else if (item.section) {
      const el = document.getElementById(item.section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero-section">
      {/* Decorative ambient background blurs */}
      <div className="hero-blur blur-lavender" />
      <div className="hero-blur blur-blush" />
      <div className="hero-blur blur-sage" />

      <div className="container hero-container">
        {/* Left Column: Hero Copy & Search */}
        <div className="hero-content">
          {/* Aesthetic Journal Label */}
          <div className="hero-badge-wrap">
            <span className="pill-badge badge-lavender">
              <Sparkles size={13} className="badge-sparkle-icon" />
              <span>Issue No. 12 · Digital Film Journal</span>
            </span>
            <span className="hero-journal-note">handpicked stories ✦</span>
          </div>

          <h1 className="hero-title">
            Find your next <br />
            <span className="highlight-text-curve">favourite story.</span>
          </h1>

          <p className="hero-subtitle">
            A little place for your movie obsession. Track your cinematic moods,
            uncover poetic gems, and keep notes on the films that stay with you forever.
          </p>

          {/* Prominent Search Bar */}
          <div className="hero-search-wrapper">
            <div className="hero-search-bar">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by title, director, feeling, or vibe..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (searchQuery.trim()) {
                      window.location.hash = `#/search?q=${encodeURIComponent(searchQuery.trim())}`;
                    } else {
                      window.location.hash = '#/search';
                    }
                  }
                }}
                className="hero-search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <button
                className="hero-search-submit"
                onClick={() => {
                  if (searchQuery.trim()) {
                    window.location.hash = `#/search?q=${encodeURIComponent(searchQuery.trim())}`;
                  } else {
                    window.location.hash = '#/search';
                  }
                }}
              >
                <span>Explore</span>
                <Sparkles size={16} />
              </button>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="hero-quick-tags">
              <span className="quick-label">Try searching:</span>
              <div className="tags-row">
                {quickPillTags.map((tag, idx) => (
                  <button
                    key={idx}
                    className="quick-tag-pill"
                    onClick={() => handlePillClick(tag)}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mini Stats or Journal Highlights */}
          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="stat-number">100%</span>
              <span className="stat-desc">Carefully curated</span>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat">
              <span className="stat-number">6+</span>
              <span className="stat-desc">Emotional vibes</span>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat">
              <span className="stat-number">Zero</span>
              <span className="stat-desc">Commercial clutter</span>
            </div>
          </div>
        </div>

        {/* Right Column: Decorative Cinematic Visual */}
        <div className="hero-visual-area">
          <div className="cinematic-composition">
            {/* Ambient Back Glow */}
            <div className="visual-halo-glow" />

            {/* Film Strip Border Decoration */}
            <div className="film-strip-accent top-strip">
              <span className="film-hole" /><span className="film-hole" /><span className="film-hole" /><span className="film-hole" />
            </div>

            {/* Primary Journal Movie Polaroid Card */}
            <div
              className="journal-polaroid-card"
              onClick={() => heroMovie && onMovieClick && onMovieClick(heroMovie)}
              title="Click to view featured journal film"
            >
              {/* Cute Washi Tape at Top */}
              <div className="washi-tape" />

              {/* Card Header Stamp */}
              <div className="card-journal-stamp">
                <span className="stamp-title">DAILY JOURNAL ENTRY</span>
                <span className="stamp-rating">
                  <Star size={13} fill="#E07A9F" color="#E07A9F" />
                  <span>{heroMovie ? heroMovie.rating.toFixed(1) : '8.8'} / 10</span>
                </span>
              </div>

              {/* Poster Image Container */}
              <div className="polaroid-image-frame">
                <img
                  src={heroMovie ? heroMovie.poster : "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=700&q=80"}
                  alt={heroMovie ? heroMovie.title : "Past Lives"}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_POSTER;
                  }}
                  className="polaroid-image"
                />
                <div className="polaroid-overlay">
                  <span className="overlay-pill">
                    <Sparkles size={12} />
                    <span>Featured Film</span>
                  </span>
                </div>
              </div>

              {/* Journal Note Section */}
              <div className="polaroid-caption">
                <div className="caption-top">
                  <h3 className="polaroid-film-title">
                    {heroMovie ? heroMovie.title : 'Past Lives'}
                  </h3>
                  <span className="polaroid-year">
                    {heroMovie ? heroMovie.year : '2023'}
                  </span>
                </div>
                <p className="polaroid-handwritten">
                  “{heroMovie ? heroMovie.journalNote : 'A gentle ache of destiny and what-ifs.'}”
                </p>
                <div className="polaroid-tags">
                  {heroMovie && heroMovie.genres ? (
                    heroMovie.genres.slice(0, 2).map((g, idx) => (
                      <span key={idx} className="mini-tag">#{g}</span>
                    ))
                  ) : (
                    <>
                      <span className="mini-tag">#Romance</span>
                      <span className="mini-tag">#Emotional</span>
                    </>
                  )}
                  <span className="mini-tag-highlight">✦ Staff Pick</span>
                </div>
              </div>
            </div>

            {/* Floating Mini Card 1: 35mm Aesthetic Sticker */}
            <div className="floating-badge-sticker anim-float">
              <div className="sticker-icon">
                <Film size={18} />
              </div>
              <div className="sticker-text">
                <span className="sticker-primary">35mm Archive</span>
                <span className="sticker-secondary">Warm grain & pastel glow</span>
              </div>
            </div>

            {/* Floating Mini Card 2: Cozy Quote Pill */}
            <div className="floating-quote-pill">
              <Heart size={14} fill="#D9779F" color="#D9779F" />
              <span>“The world is quiet here.”</span>
            </div>

            {/* Floating Mini Badge 3: Mood Indicator */}
            <div className="floating-mood-chip">
              <span className="mood-chip-dot" />
              <span>Now Playing: Quiet Melancholy</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
