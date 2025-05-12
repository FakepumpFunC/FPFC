import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, BeakerIcon, ChartBarIcon, CogIcon, QuestionMarkCircleIcon, CurrencyDollarIcon, ShieldExclamationIcon, ChartBarSquareIcon, TrophyIcon, ClockIcon, ArrowsRightLeftIcon, WalletIcon as WalletIconSolid, ListBulletIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { getGameState, subscribe } from './gameState'; // Import from gameState
import './HomePage.css';
// 导入背景图片
import homeBackground from './assets/home3.png';

// Console log to verify proper loading
console.log('HomePage component loaded');

// --- NEW: Dummy Data for Leaderboard (prefixed with underscore to avoid linter error) ---
const _leaderboardData = [
    { id: 1, player: 'ProTrader99', pnl: '+1500%' },
    { id: 2, player: 'PixelWhale', pnl: '+1200%' },
    { id: 3, player: 'MemeLord', pnl: '+900%' },
];
// --- END Dummy Data ---

function HomePage({ showPixelDialog }) {
  const [contractAddress, setContractAddress] = useState('');
  const [currentHoldings, setCurrentHoldings] = useState({});
  const [tradeHistory, setTradeHistory] = useState([]);
  const navigate = useNavigate();
  
  // Add state for performance metrics
  const [performanceStats, setPerformanceStats] = useState({
    totalInput: 0,
    totalReceived: 0,
    netResult: 0,
    percentageResult: 0,
    totalTrades: 0,
    buyCount: 0,
    sellCount: 0,
    buySellRatio: '0/0'
  });
  
  console.log('HomePage rendering, navigate function:', typeof navigate);
  console.log('Background image path:', homeBackground);

  // Subscribe to game state changes
  useEffect(() => {
    // Get initial state
    const gameState = getGameState();
    if (gameState && gameState.tokenHoldings) {
      setCurrentHoldings(gameState.tokenHoldings);
    }
    
    // Get initial trade history
    if (gameState && gameState.tradeHistory) {
      setTradeHistory(gameState.tradeHistory);
    }
    
    // Get initial performance stats
    if (gameState && gameState.performanceStats) {
      setPerformanceStats(gameState.performanceStats);
    }
    
    // Subscribe to state changes
    const unsubscribe = subscribe((newState) => {
      if (newState && newState.tokenHoldings) {
        setCurrentHoldings(newState.tokenHoldings);
      }
      if (newState && newState.tradeHistory) {
        setTradeHistory(newState.tradeHistory);
      }
      if (newState && newState.performanceStats) {
        setPerformanceStats(newState.performanceStats);
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Apply custom background for home page
  useEffect(() => {
    // Add class to body when component mounts
    document.body.classList.add('homepage-body-background');
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('homepage-body-background');
      // 移除时恢复默认渐变背景
      document.body.style.removeProperty('background-image');
      document.body.style.removeProperty('background-size');
      document.body.style.removeProperty('background-position');
      document.body.style.removeProperty('background-repeat');
    };
  }, []);

  // Process recent trades from global history, sorted by timestamp (newest first)
  const recentTrades = useMemo(() => {
    // Make a fresh copy of trade history to avoid modifying the original
    return [...tradeHistory]
      // Sort by timestamp (newest first)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      // Take only the 5 most recent trades
      .slice(0, 5);
  }, [tradeHistory]);

  // Format time for display in history
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format currency value with flexible precision
  const formatCurrencyValue = (value) => {
    if (typeof value !== 'number') return '0.00';
    
    // For smaller values, show more decimal places
    if (Math.abs(value) < 0.01) return value.toFixed(6);
    if (Math.abs(value) < 1) return value.toFixed(4);
    
    // For larger values, show fewer decimal places
    return value.toFixed(2);
  };

  const handleStartTrading = () => {
    if (contractAddress.trim() === '') {
      showPixelDialog('Input Required', 'Pixel Punter! Thou must enter a contract address!');
      return;
    }
    navigate(`/trading/${contractAddress.trim()}`);
  };

  // Navigate to trading page for a specific token
  const handleTokenTrade = (contractAddress) => {
    navigate(`/trading/${contractAddress}`);
  };

  // Helper to truncate contract address for display
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper to calculate total amount and cost for a token
  const calculateTokenStats = (buys) => {
    if (!Array.isArray(buys) || buys.length === 0) {
      return { totalAmount: 0, totalCost: 0, avgCost: 0 };
    }
    
    let totalAmount = 0;
    let totalCost = 0;
    
    for (const buy of buys) {
      totalAmount += buy.amount;
      totalCost += buy.amount * buy.price;
    }
    
    const avgCost = totalAmount > 0 ? totalCost / totalAmount : 0;
    
    return { totalAmount, totalCost, avgCost };
  };

  // Format currency value
  const formatCurrency = (value) => {
    return value.toFixed(2);
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    return value.toFixed(2);
  };

  // Determine if a value is positive (for styling)
  const isPositive = (value) => {
    return value >= 0;
  };

  return (
    <div 
      className="homepage-layout-wrapper"
      style={{
        backgroundImage: `url(${homeBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed', /* 固定背景，不随页面滚动 */
        minHeight: '100vh',
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Main Content Container - 限制高度以确保不会过度滚动 */}
      <div className="homepage-container main-content">
        <header className="homepage-header">
          <div className="game-title">
            <img src="/assets/logo5.png" alt="FakePumpFun" className="header-logo" />
          </div>
          <div className="master-image-container">
            <img src="/assets/Master.png" alt="Master Meme Coin trading in a risk-free arcade" className="master-image" />
          </div>
        </header>

        <main className="homepage-main">
          <section className="input-section">
            <div className="load-image-container">
              <img src="/assets/Load.png" alt="Load Token Data" className="load-token-image" />
            </div>
            <div className="input-group">
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="Paste Solana Contract Address Here..."
                aria-label="Solana Contract Address"
              />
              <button onClick={handleStartTrading} className="start-button">
                <img src="/assets/Beam.png" alt="Beam Me Up!" className="beam-button-image" />
              </button>
            </div>
          </section>

          <section className="info-section">
            <div className="play-image-container">
              <img src="/assets/Play.png" alt="How to Play Instructions" className="play-instructions-image" />
            </div>
          </section>

          <section className="current-holdings-section">
            <div className="holdings-image-container">
              <img src="/assets/CurrentHoldings.png" alt="Current Holdings" className="current-holdings-image" />
            </div>
            {Object.keys(currentHoldings).length === 0 ? (
              <div className="no-holdings-message">
                No holdings yet. Start trading to get some tokens!
              </div>
            ) : (
              <ul className="holdings-list">
                {Object.entries(currentHoldings).map(([address, buys]) => {
                  // Skip if there are no buys for this token
                  if (!Array.isArray(buys) || buys.length === 0) return null;
                  
                  // Calculate token stats (amount, cost, etc.)
                  const { totalAmount, totalCost, avgCost } = calculateTokenStats(buys);
                  
                  // Skip tokens with zero amount
                  if (totalAmount <= 0) return null;
                  
                  return (
                    <li key={address} className="holding-list-item">
                      <div className="holding-info">
                        <span className="holding-address">{truncateAddress(address)}</span>
                        <div className="holding-details">
                          <span className="holding-amount">{totalAmount} tokens</span>
                          <span className="holding-cost">
                            Avg: ${avgCost.toFixed(6)} | Total: ${formatCurrency(totalCost)} $RDS
                          </span>
                        </div>
                      </div>
                      <button 
                        className="holding-trade-button" 
                        onClick={() => handleTokenTrade(address)}
                      >
                        Trade
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </main>

        <footer className="homepage-footer">
          <p>© {new Date().getFullYear()} FakePumpFun Devs. Simulation only. Play responsibly!</p>
        </footer>
      </div>

      {/* Player Stats Panel - Left Bottom Fixed */}
      <aside className="bottom-panel left-panel">
        <div className="panel-title">
          <img src="/assets/PlayerStats.png" alt="Player Stats" className="panel-title-logo" />
        </div>
        <div className="panel-content">
          <div className="stat-item">
            <span className="stat-label">Total Trades:</span>
            <span className="stat-value">{performanceStats.totalTrades}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Trading Ratio:</span>
            <span className="stat-value">{performanceStats.buySellRatio}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Current PnL (%):</span>
            <span className={`stat-value ${isPositive(performanceStats.percentageResult) ? 'green' : 'red'}`}>
              {isPositive(performanceStats.percentageResult) ? '+' : ''}
              {formatPercentage(performanceStats.percentageResult)}%
            </span>
          </div>
        </div>
        <button 
          className="panel-button" 
          onClick={() => navigate('/records')}
        >
          View Details
        </button>
      </aside>

      {/* Right side container for both panels */}
      <div className="bottom-right-area-container">
        {/* Recent Activity Panel (formerly Buy History) */}
        <section className="bottom-panel recent-activity-panel">
          <div className="panel-title">
            <img src="/assets/RecentActivity.png" alt="Recent Activity" className="panel-title-logo" />
          </div>
          {recentTrades.length === 0 ? (
            <div className="no-trades-message">
              No trades yet. Start trading!
            </div>
          ) : (
            <ul className="recent-trades-list">
              {recentTrades.map(trade => (
                <li key={trade.id || `${trade.timestamp}-${trade.amount}-${Math.random()}`} className="trade-list-item">
                  {/* First row: Time and Action */}
                  <div className="trade-info-group time-type">
                    <span className="history-time">{formatTime(trade.timestamp)}</span>
                    <span className={`history-action ${trade.type === 'BUY' ? 'buy-action' : 'sell-action'}`}>
                      {trade.type}
                    </span>
                  </div>
                  
                  {/* Second row: Token amount very visible */}
                  <div className="trade-info-group token-amount">
                    <span className="history-amount-label">Amount:</span>
                    <span className="history-amount">{trade.amount}</span>
                    <span className="history-token">{trade.token}</span>
                  </div>
                  
                  {/* Third row: Price and value - simplified layout */}
                  <div className="trade-info-group price-value">
                    <div className="price-wrapper">
                      <span className="history-price-label">Price:</span>
                      <span className="history-price">${parseFloat(trade.price).toFixed(6)}</span>
                    </div>
                    <span className="history-value">
                      Total: ${formatCurrencyValue(trade.amount * trade.price)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button 
            className="panel-button" 
            onClick={() => {
              console.log('Navigating to full history');
              // 先尝试React Router导航
              try {
                navigate('/records');
              } catch (e) {
                console.error('Navigate error:', e);
                // 如果React Router导航失败，使用硬导航作为后备方案
                window.location.href = '/records';
              }
            }}
          >
            View Full History
          </button>
        </section>
      </div>
    </div>
  );
}

export default HomePage; 