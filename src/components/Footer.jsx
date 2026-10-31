import React, { useState } from 'react';
import { Film, Sparkles, Mail, Check, Coffee, ArrowUp } from 'lucide-react';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="about" className="cinescope-footer">
      <div className="container">
        {/* Top Wave / Curved Badge Card */}
        <div className="footer-top-card">
          <div className="footer-manifesto">
            <span className="manifesto-tag">✦ Our Philosophy</span>
            <h3 className="manifesto-heading">
              A gentle counterweight to infinite scrolling.
            </h3>
            <p className="manifesto-text">
              We built CineScope as a quiet sanctuary for film lovers. No algorithms yelling at you, 
              no commercial clutter. Just beautifully framed stories, honest journal notes, 
              and the joy of discovering cinema that touches your spirit.
            </p>
          </div>

          <div className="footer-newsletter">
            <div className="newsletter-box">
              <span className="newsletter-pill">
                <Mail size={13} />
                <span>The Sunday Matinee</span>
              </span>
              <h4 className="newsletter-title">Receive our weekly film dispatch</h4>
              <p className="newsletter-desc">
                One poetic movie recommendation, a curated soundtrack, and director notes in your inbox every Sunday morning.
              </p>

              {isSubscribed ? (
                <div className="subscribe-success">
                  <Check size={18} className="success-icon" />
                  <span>You're on our guest list! Check your inbox soon 💌</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="newsletter-form">
                  <input
                    type="email"
                    placeholder="Enter your cute email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="newsletter-input"
                  />
                  <button type="submit" className="newsletter-btn">
                    <span>Subscribe</span>
                    <Sparkles size={15} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Links & Brand Columns */}
        <div className="footer-links-grid">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="logo-icon-wrap">
                <Film className="logo-icon" size={20} />
                <Sparkles className="logo-sparkle" size={13} />
              </div>
              <div className="brand-text-wrap">
                <span className="brand-name">Cine<span className="brand-highlight">Scope</span></span>
                <span className="brand-tag">film journal & sanctuary</span>
              </div>
            </div>
            <p className="footer-brand-bio">
              A cute, aesthetic, and thoughtful home for your movie thoughts, watchlist, 
              and cinema wanderlust.
            </p>
            <div className="footer-stamp-chip">
              <span>EST. 2024 · HANDCRAFTED WITH SOUL</span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="footer-col">
            <h5 className="footer-col-title">Navigation</h5>
            <ul className="footer-nav-list">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home Journal</a></li>
              <li><a href="#trending" onClick={(e) => { e.preventDefault(); onNavigate('trending'); }}>Trending Reel</a></li>
              <li><a href="#hidden-gems" onClick={(e) => { e.preventDefault(); onNavigate('hidden-gems'); }}>Hidden Gems Vault</a></li>
              <li><a href="#moods" onClick={(e) => { e.preventDefault(); onNavigate('moods'); }}>Browse by Mood</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }}>About CineScope</a></li>
            </ul>
          </div>

          {/* Mood Journeys Column */}
          <div className="footer-col">
            <h5 className="footer-col-title">Curated Moods</h5>
            <ul className="footer-nav-list">
              <li><span className="mood-link">🌸 Feel Good Sanctuary</span></li>
              <li><span className="mood-link">🌀 Mind Bending Realities</span></li>
              <li><span className="mood-link">💌 Heartfelt & Emotional</span></li>
              <li><span className="mood-link">🗝️ Cozy Whodunnits & Thrills</span></li>
              <li><span className="mood-link">🌿 Boundless Adventure</span></li>
              <li><span className="mood-link">🕊️ Midnight Romance</span></li>
            </ul>
          </div>

          {/* TMDB Official Attribution Column */}
          <div className="footer-col tmdb-attribution-col">
            <h5 className="footer-col-title">API Attribution</h5>
            <div className="tmdb-brand-card">
              <div className="tmdb-logo-wrapper">
                {/* Official TMDB SVG logo */}
                <svg className="tmdb-svg-logo" viewBox="0 0 185 16" width="135" height="15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#01b4e4" d="M11.667 0H0v16h11.667V0zm24.5 0H24.5v16h11.667V0zm24.5 0H49v16h11.667V0zm24.5 0H73.5v16h11.667V0zm24.5 0H98v16h11.667V0zm24.5 0h-11.667v16H147V0zm24.5 0h-11.667v16H171.5V0z"/>
                  <path fill="#90cea1" d="M22.5 4h-7v2h7v10h2V6h7V4h-9zm25 0h-11v12h2v-5h9V4zm-2 2v3h-7V6h7zm28.5-2H61v12h13V4zm-2 10h-9V6h9v8zm27.5-10h-11v12h11c3.3 0 6-2.7 6-6s-2.7-6-6-6zm0 10h-9V6h9c2.2 0 4 1.8 4 4s-1.8 4-4 4z"/>
                </svg>
              </div>
              <p className="tmdb-notice-text">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
              <a 
                href="https://www.themoviedb.org/" 
                target="_blank" 
                rel="noreferrer"
                className="tmdb-learn-link"
              >
                <span>Visit The Movie Database</span>
                <Sparkles size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="bottom-copy">
            <span>© {CURRENT_YEAR} CineScope. Designed with gentle pastel aesthetics.</span>
            <span className="bullet-sep">•</span>
            <span className="bottom-note">Made with <Coffee size={13} className="inline-icon" /> & 35mm film love</span>
          </div>

          <button 
            className="back-to-top-btn"
            onClick={scrollToTop}
            title="Scroll to top"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </footer>
  );
};
