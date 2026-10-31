import React, { useState, useEffect } from 'react';
import { Film, Sparkles, Bookmark, Search, Menu, X, Heart } from 'lucide-react';
import './Navbar.css';

export const Navbar = ({ 
  watchlistCount = 0, 
  onOpenWatchlist, 
  onNavigate, 
  activeSection = 'home',
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(sectionId);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        {/* CineScope Logo */}
        <a 
          href="#home" 
          className="navbar-brand"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
        >
          <div className="logo-icon-wrap">
            <Film className="logo-icon" size={22} />
            <Sparkles className="logo-sparkle" size={14} />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-name">Cine<span className="brand-highlight">Scope</span></span>
            <span className="brand-tag">film journal</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <button 
            className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button 
            className={`nav-link ${activeSection === 'diary' ? 'active' : ''}`}
            onClick={() => handleNavClick('diary')}
          >
            My Diary
          </button>
          <button 
            className={`nav-link ${activeSection === 'search' ? 'active' : ''}`}
            onClick={() => handleNavClick('search')}
          >
            Discover
          </button>
          <button 
            className={`nav-link ${activeSection === 'trending' ? 'active' : ''}`}
            onClick={() => handleNavClick('trending')}
          >
            Explore
          </button>
          <button 
            className={`nav-link ${activeSection === 'hidden-gems' ? 'active' : ''}`}
            onClick={() => handleNavClick('hidden-gems')}
          >
            Hidden Gems
          </button>
          <button 
            className={`nav-link ${activeSection === 'moods' ? 'active' : ''}`}
            onClick={() => handleNavClick('moods')}
          >
            Moods
          </button>
          <button 
            className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
            onClick={() => handleNavClick('about')}
          >
            About
          </button>
        </nav>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* Quick Search toggle on header */}
          <div className={`nav-search-box ${searchOpen ? 'open' : ''}`}>
            <input 
              type="text" 
              placeholder="Search cute films..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchSubmit && onSearchSubmit();
                }
              }}
              className="nav-search-input"
            />
            <button 
              className="nav-action-btn search-toggle" 
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search films"
              aria-label="Toggle search input"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Watchlist Button with cute badge */}
          <button 
            className="nav-watchlist-btn"
            onClick={onOpenWatchlist}
            title="Open Watchlist"
            aria-label="View Watchlist"
          >
            <Bookmark size={18} className="watchlist-icon" />
            <span className="watchlist-label">Watchlist</span>
            <span className="watchlist-count-badge">
              {watchlistCount}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-nav-links">
            <button 
              className={`mobile-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              Home
            </button>
            <button 
              className={`mobile-link ${activeSection === 'diary' ? 'active' : ''}`}
              onClick={() => handleNavClick('diary')}
            >
              My Film Diary & Collections
            </button>
            <button 
              className={`mobile-link ${activeSection === 'search' ? 'active' : ''}`}
              onClick={() => handleNavClick('search')}
            >
              Search & Discover
            </button>
            <button 
              className={`mobile-link ${activeSection === 'trending' ? 'active' : ''}`}
              onClick={() => handleNavClick('trending')}
            >
              Explore Trending
            </button>
            <button 
              className={`mobile-link ${activeSection === 'hidden-gems' ? 'active' : ''}`}
              onClick={() => handleNavClick('hidden-gems')}
            >
              Hidden Gems
            </button>
            <button 
              className={`mobile-link ${activeSection === 'moods' ? 'active' : ''}`}
              onClick={() => handleNavClick('moods')}
            >
              Browse by Mood
            </button>
            <button 
              className={`mobile-link ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => handleNavClick('about')}
            >
              About CineScope
            </button>
            <button 
              className="mobile-watchlist-trigger"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWatchlist();
              }}
            >
              <Heart size={18} fill="#D9779F" color="#D9779F" />
              <span>My Watchlist ({watchlistCount})</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
