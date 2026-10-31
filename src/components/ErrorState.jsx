import React from 'react';
import { RefreshCw, AlertCircle, Key } from 'lucide-react';
import './ErrorState.css';

export const ErrorState = ({ 
  error, 
  onRetry, 
  title = "Couldn't load cinema stories",
  message
}) => {
  const isKeyError = error && (error.message === 'MISSING_API_KEY' || error.message === 'INVALID_API_KEY');

  return (
    <div className="cine-error-card">
      <div className="error-icon-bubble">
        {isKeyError ? <Key size={28} className="error-icon" /> : <AlertCircle size={28} className="error-icon" />}
      </div>

      <h4 className="error-heading">
        {isKeyError ? 'TMDB API Key Setup Required' : title}
      </h4>

      <p className="error-message">
        {message || (
          isKeyError
            ? 'To fetch real movie information, please ensure your TMDB API key is saved in the .env file as VITE_TMDB_API_KEY.'
            : 'A brief connection hitch occurred while requesting films from The Movie Database. Please try again.'
        )}
      </p>

      {onRetry && (
        <button className="btn-primary error-retry-btn" onClick={onRetry}>
          <RefreshCw size={15} />
          <span>Retry Loading</span>
        </button>
      )}

      {isKeyError && (
        <div className="error-hint-box">
          <span className="hint-pill">✦ Quick Setup</span>
          <code>VITE_TMDB_API_KEY=your_key_in_.env</code>
        </div>
      )}
    </div>
  );
};
