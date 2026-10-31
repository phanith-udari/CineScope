import React from 'react';
import { Heart, Sparkles, Bookmark } from 'lucide-react';
import './Toast.css';

export const Toast = ({ message, type = 'info', isVisible, onDismiss }) => {
  if (!isVisible) return null;

  return (
    <div className={`cine-toast toast-${type}`}>
      <div className="toast-icon-wrap">
        {type === 'saved' ? (
          <Heart size={16} fill="#D9779F" color="#D9779F" />
        ) : type === 'removed' ? (
          <Bookmark size={16} color="#8C7AB6" />
        ) : (
          <Sparkles size={16} color="#4E756C" />
        )}
      </div>
      <span className="toast-message">{message}</span>
      <button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss toast">
        ✕
      </button>
    </div>
  );
};
