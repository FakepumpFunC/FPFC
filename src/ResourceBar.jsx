// src/ResourceBar.jsx
import React from 'react';
import './ResourceBar.css';

function ResourceBar() {
  // For now, a static value. This will be dynamic later.
  const funTokens = "100.00"; 

  return (
    <div className="resource-bar-container">
      <span className="resource-label">Fun Tokens:</span>
      <span className="resource-value">{funTokens} 🪙</span>
    </div>
  );
}

export default ResourceBar; 