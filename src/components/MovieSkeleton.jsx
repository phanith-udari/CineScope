import React from 'react';
import './MovieSkeleton.css';

export const MovieCardSkeleton = () => {
  return (
    <div className="movie-skeleton-card">
      <div className="skeleton-media shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line meta shimmer" />
        <div className="skeleton-line title shimmer" />
        <div className="skeleton-line text shimmer" />
        <div className="skeleton-pills-row">
          <div className="skeleton-pill shimmer" />
          <div className="skeleton-pill shimmer" />
        </div>
      </div>
    </div>
  );
};

export const MovieGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="movies-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <MovieCardSkeleton key={idx} />
      ))}
    </div>
  );
};
