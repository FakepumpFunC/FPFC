import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TitlePage.css';

// Constant for localStorage key to track if user has entered the game
export const HAS_ENTERED_KEY = 'fakePumpFunHasEntered';

function TitlePage() {
  const navigate = useNavigate();

  // Handle start game button click
  const handleStartGame = () => {
    // Set flag in localStorage to indicate user has entered the game
    localStorage.setItem(HAS_ENTERED_KEY, 'true');
    // Navigate to the main game
    navigate('/home');
  };

  // Handle Meme God button click
  const handleMemeGodClick = () => {
    window.open('https://x.com/FakePumpFun', '_blank');
  };

  return (
    <div className="title-page-container">
      <div className="title-content">
        <div className="logo-container">
          <img src="/assets/logo.png" alt="FakePumpFun" className="logo-image" />
        </div>
        <div className="pixel-icon">🚀</div>
        <h2 className="game-subtitle">Meme Coin Arcade</h2>
        <p className="game-intro">
          Practice trading with virtual $RugDevSol tokens.<br />
          No real money involved - just pixelated fun!
        </p>
        
        <div className="title-buttons">
          <button 
            className="start-game-button"
            onClick={handleStartGame}
          >
            Start Game
          </button>
          
          <button 
            className="meme-god-button"
            onClick={handleMemeGodClick}
          >
            Meme God
          </button>
        </div>
        
        <div className="disclaimer">
          Educational simulation only. Not financial advice.
        </div>
      </div>
    </div>
  );
}

export default TitlePage; 