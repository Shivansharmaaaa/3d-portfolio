import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

export default function LoadingScreen({ progress, onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (progress >= 100 && !fadeOut) {
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }, 500);
    }
  }, [progress, fadeOut, onComplete]);

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="loading-logo">
          <div className="logo-circle"></div>
          <h1>Shivansh Sharma</h1>
          <p>3D Developer</p>
        </div>
        <p className="loading-text">Loading your portfolio city...</p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">{Math.round(progress)}%</div>
      </div>
    </div>
  );
}

