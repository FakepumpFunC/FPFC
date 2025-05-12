// src/TopNavBar.jsx
import React, { useState, useEffect } from 'react';
import { UserCircleIcon, BanknotesIcon, WalletIcon } from '@heroicons/react/24/outline';
import { getGameState, subscribe } from './gameState';
import { HAS_ENTERED_KEY } from './TitlePage';
import './TopNavBar.css';
// Import wallet hooks for Solana wallet connection
import { useWallet } from '@solana/wallet-adapter-react'; // Hook for wallet state
import { useWalletModal } from '@solana/wallet-adapter-react-ui'; // Hook for wallet modal

function TopNavBar({ showPixelDialog, showDonateModal }) {
  const playerName = "PixelPunter";
  const [rugDevSolBalance, setRugDevSolBalance] = useState("0.00");

  // Initialize balance from global state and subscribe to changes
  useEffect(() => {
    // Set initial balance from global state
    const gameState = getGameState();
    if (gameState && 'rugDevSolBalance' in gameState) {
      setRugDevSolBalance(gameState.rugDevSolBalance.toFixed(2));
    }

    // Subscribe to state changes
    const unsubscribe = subscribe(newState => {
      if (newState && 'rugDevSolBalance' in newState) {
        setRugDevSolBalance(newState.rugDevSolBalance.toFixed(2));
      }
    });

    // Cleanup subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  // Get wallet state and modal controls from Solana wallet adapter
  const { publicKey, connected, disconnect } = useWallet(); // Wallet state and disconnect function
  const { setVisible } = useWalletModal(); // Function to open wallet modal

  // Helper function to truncate the wallet address for display
  const getTruncatedAddress = (address) => {
    if (!address) return '';
    const base58 = address.toBase58();
    return base58.substring(0, 4) + '...' + base58.slice(-4);
  };

  const handleLogoClick = () => {
    // 清除已进入游戏的标记，这样才能显示标题页面
    localStorage.removeItem(HAS_ENTERED_KEY);
    // 直接刷新页面，而不是使用navigate
    window.location.href = '/';
  };

  // Handle player info click based on wallet connection status
  const handlePlayerInfoClick = () => {
    if (connected && publicKey) {
      // Wallet is connected - show the donate modal
      showDonateModal();
    } else {
      // Wallet is NOT connected - show pixel dialog prompt
      showPixelDialog(
        'Connection Required!', // Dialog Title
        'Oh, brave pixel punter! Your wallet seems adrift in the cosmos. Connect it via the top-right button to unlock your full trading potential and perhaps... make a legendary offering to the Meme Gods!', // Creative Message
      );
    }
  };

  // Handle Connect/Disconnect button click
  const handleConnectWallet = () => {
    if (connected) {
      disconnect(); // Disconnect wallet if already connected
    } else {
      setVisible(true); // Open wallet modal if not connected
      console.log('Opening wallet modal'); // Add debug log
    }
  };

  // Handle social media click
  const handleSocialMediaClick = () => {
    window.open('https://x.com/FakePumpFun', '_blank');
  };

  return (
    <nav className="top-nav-bar">
      <div className="nav-section nav-left">
        <div 
          className="game-logo" 
          onClick={handleLogoClick} 
          role="button" 
          tabIndex={0} 
          onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
        >
          <img 
            src="/assets/Logo8.png" 
            alt="FakePumpFun" 
            className="logo-image" 
          />
        </div>
        <div 
          className="player-info" 
          onClick={handlePlayerInfoClick} 
          role="button" 
          tabIndex={0} 
          onKeyDown={(e) => e.key === 'Enter' && handlePlayerInfoClick()}
        >
          <UserCircleIcon className="nav-icon player-avatar" />
          <span className="player-name">
            {connected && publicKey ? getTruncatedAddress(publicKey) : playerName}
          </span>
        </div>
      </div>

      <div className="nav-section nav-center">
        <BanknotesIcon className="nav-icon currency-icon" />
        <span className="currency-balance">$RugDevSol: {rugDevSolBalance}</span>
      </div>

      <div className="nav-section nav-right">
        <button 
          className="social-media-btn" 
          onClick={handleSocialMediaClick}
          aria-label="Visit our X/Twitter page"
        >
          <img 
            src="/assets/Floow.png" 
            alt="Follow us on X/Twitter" 
            className="social-media-icon" 
          />
        </button>
        <button 
          className={`connect-wallet-btn${connected ? ' connected' : ''}`} 
          onClick={handleConnectWallet}
        >
          <WalletIcon className="nav-icon btn-icon" />
          {connected && publicKey ? 'Disconnect' : 'Connect Wallet'}
        </button>
      </div>
    </nav>
  );
}

export default TopNavBar;