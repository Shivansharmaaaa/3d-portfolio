import React, { useState, useEffect } from 'react';
import './UI.css';

export default function UI({ 
  onNavigate, 
  onSpeedChange, 
  onPlayPause, 
  onQualityToggle,
  isPlaying,
  currentSpeed,
  qualityMode
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Top Bar */}
      <div className="ui-top">
        <div className="ui-logo">
          <span className="logo-name">Shivansh Sharma</span>
          <span className="logo-title">| 3D Developer</span>
        </div>
        <nav className={`ui-nav ${isMenuOpen ? 'open' : ''}`}>
          <button onClick={() => { onNavigate('about'); setIsMenuOpen(false); }}>About</button>
          <button onClick={() => { onNavigate('projects'); setIsMenuOpen(false); }}>Projects</button>
          <button onClick={() => { onNavigate('skills'); setIsMenuOpen(false); }}>Skills</button>
          <button onClick={() => { onNavigate('contact'); setIsMenuOpen(false); }}>Contact</button>
          <a 
            href="/resume.pdf" 
            download 
            className="resume-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Resume
          </a>
        </nav>
        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="ui-bottom">
        <div className="ui-controls-left">
          <button 
            className="play-pause-btn"
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className="speed-controls">
            <button 
              className={currentSpeed === 'slow' ? 'active' : ''}
              onClick={() => onSpeedChange('slow')}
            >
              Slow
            </button>
            <button 
              className={currentSpeed === 'normal' ? 'active' : ''}
              onClick={() => onSpeedChange('normal')}
            >
              Normal
            </button>
            <button 
              className={currentSpeed === 'fast' ? 'active' : ''}
              onClick={() => onSpeedChange('fast')}
            >
              Fast
            </button>
          </div>
        </div>
        <div className="ui-controls-right">
          <button 
            className="quality-toggle"
            onClick={onQualityToggle}
          >
            {qualityMode === 'high' ? 'High' : 'Low'} Graphics
          </button>
        </div>
      </div>
    </>
  );
}

