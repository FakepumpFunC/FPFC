import React from 'react';
import './PixelDialog.css';

// PixelDialog component - Custom pixel-art styled dialog to replace native browser alerts
function PixelDialog({ isOpen, title, message, onClose, buttonText = 'OK' }) {
  // Only render the dialog if isOpen is true
  if (!isOpen) return null;

  return (
    <div className="pixel-dialog-overlay">
      <div className="pixel-dialog-box">
        {/* Optional title - only render if provided */}
        {title && <div className="dialog-title">{title}</div>}
        
        {/* Message content */}
        <div className="dialog-message">{message}</div>
        
        {/* Close button */}
        <button className="dialog-button" onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default PixelDialog; 