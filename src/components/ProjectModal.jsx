import React, { useEffect } from 'react';
import './ProjectModal.css';

export default function ProjectModal({ project, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className="modal-title">{project.name}</h2>
        <p className="modal-subtitle">{project.description}</p>
        <div className="modal-tags">
          {project.tags.map((tag, index) => (
            <span key={index} className="modal-tag">{tag}</span>
          ))}
        </div>
        <div className="modal-actions">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-btn modal-btn-secondary"
            >
              View Code
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-btn modal-btn-primary"
            >
              View Live
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

