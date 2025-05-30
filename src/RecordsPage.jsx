import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ClockIcon } from '@heroicons/react/24/solid';
import { getGameState, subscribe } from './gameState';
import './RecordsPage.css';

console.log('RecordsPage module loaded');

function RecordsPage() {
  console.log('RecordsPage component rendering');
  const navigate = useNavigate();
  const [tradeHistory, setTradeHistory] = useState([]);
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  // Add state for performance metrics
  const [performanceStats, setPerformanceStats] = useState({
    totalInput: 0,
    totalReceived: 0,
    netResult: 0,
    percentageResult: 0,
    totalTrades: 0,
    buyCount: 0,
    sellCount: 0,
    buySellRatio: '0:0'
  });
  
  // Get initial trade history and subscribe to changes
  useEffect(() => {
    console.log('RecordsPage component mounted');
    setIsLoading(true); // Set loading to true when component mounts
    
    // Get initial state
    const gameState = getGameState();
    if (gameState && gameState.tradeHistory) {
      setTradeHistory(gameState.tradeHistory);
    }
    
    // Get initial performance stats
    if (gameState && gameState.performanceStats) {
      setPerformanceStats(gameState.performanceStats);
    }
    
    // Subscribe to state changes
    const unsubscribe = subscribe((newState) => {
      if (newState && newState.tradeHistory) {
        setTradeHistory(newState.tradeHistory);
      }
      if (newState && newState.performanceStats) {
        setPerformanceStats(newState.performanceStats);
      }
    });
    
    // Set loading to false after a small delay to ensure all content is ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    // Cleanup subscription and timer on unmount
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
  
  // 设置和清理背景样式
  useEffect(() => {
    // 添加类来切换背景
    document.body.classList.add('recordspage-body-background');
    
    // 组件卸载时清理
    return () => {
      document.body.classList.remove('recordspage-body-background');
    };
  }, []);
  
  // Format currency value
  const formatCurrency = (value) => {
    return parseFloat(value).toFixed(2);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return parseFloat(value).toFixed(2);
  };
  
  // Format date and time
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  // Sorted trade history with newest first
  const sortedTradeHistory = useMemo(() => {
    return [...tradeHistory].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [tradeHistory]);
  
  return (
    <div className="records-page-container">
      <header className="records-header">
        <h1 className="records-title">Trading Records</h1>
        <button 
          className="back-button back-image-button"
          onClick={() => {
            console.log('Navigating back to home');
            // 先尝试React Router导航
            try {
              navigate('/home');
            } catch (e) {
              console.error('Navigate error:', e);
              // 如果React Router导航失败，使用硬导航作为后备方案
              window.location.href = '/home';
            }
          }}
        >
          <img src="/assets/Back.png" alt="Back to Home" className="back-home-image" />
        </button>
      </header>
      
      {/* Loading overlay that covers entire content area */}
      {isLoading && (
        <div className="records-loading-overlay">
          <div className="records-loading-content">
            Loading Records...
          </div>
        </div>
      )}
      
      <main className="records-content-wrapper">
        <div className={`records-content ${isLoading ? 'is-loading' : ''}`}>
          {/* Performance Summary Panel */}
          <section className="performance-summary-panel">
            <h2 className="section-title">
              <ChartBarIcon className="section-icon" />
              Overall Performance
            </h2>
            
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Total Input:</span>
                <span className="metric-value">
                  ${formatCurrency(performanceStats.totalInput)} $RDS
                </span>
              </div>
              
              <div className="metric-item">
                <span className="metric-label">Total Received:</span>
                <span className="metric-value">
                  ${formatCurrency(performanceStats.totalReceived)} $RDS
                </span>
              </div>
              
              <div className="metric-item">
                <span className="metric-label">Net Result:</span>
                <span className={`metric-value ${performanceStats.netResult >= 0 ? 'positive' : 'negative'}`}>
                  ${formatCurrency(performanceStats.netResult)} $RDS
                </span>
              </div>
              
              <div className="metric-item">
                <span className="metric-label">Result (%):</span>
                <span className={`metric-value ${performanceStats.percentageResult >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(performanceStats.percentageResult)}%
                </span>
              </div>
              
              <div className="metric-item">
                <span className="metric-label">Total Trades:</span>
                <span className="metric-value">
                  {performanceStats.totalTrades}
                </span>
              </div>
              
              <div className="metric-item">
                <span className="metric-label">Buy/Sell Ratio:</span>
                <span className="metric-value">
                  {performanceStats.buySellRatio}
                </span>
              </div>
            </div>
          </section>
          
          {/* Trade History Panel */}
          <section className="trade-history-panel">
            <h2 className="section-title">
              <ClockIcon className="section-icon" />
              Full Trade History
            </h2>
            
            {sortedTradeHistory.length === 0 ? (
              <div className="no-trades-message">
                <p>No trades yet. Start trading to see your history!</p>
              </div>
            ) : (
              <div className="trade-table-container">
                <table className="trade-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Token</th>
                      <th>Amount</th>
                      <th>Price ($RDS)</th>
                      <th>Value ($RDS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTradeHistory.map((trade) => {
                      return (
                        <tr key={trade.id || `${trade.timestamp}-${Math.random()}`} className={`trade-row ${trade.type.toLowerCase()}-row`}>
                          <td>{formatDateTime(trade.timestamp)}</td>
                          <td className={`trade-type ${trade.type.toLowerCase()}-type`}>
                            {trade.type}
                          </td>
                          <td>{trade.token}</td>
                          <td className="numeric">{trade.amount}</td>
                          <td className="numeric">${parseFloat(trade.price).toFixed(6)}</td>
                          <td className="numeric">${formatCurrency(trade.value)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          
          {/* Reset Button */}
          <section className="data-management-section">
          </section>
        </div>
      </main>
    </div>
  );
}

export default RecordsPage; 