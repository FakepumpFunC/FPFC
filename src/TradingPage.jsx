import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  CurrencyDollarIcon, 
  WalletIcon, 
  ClockIcon,
  QuestionMarkCircleIcon,
  ClockIcon as ClockIconSolid,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/solid';
import { 
  fetchSolanaTokenPrice, 
  formatPrice, 
  formatPriceChange, 
  formatLastUpdated,
  formatLiquidity 
} from './services/moralisService';
import { 
  getGameState, 
  updateBalance, 
  updateHolding, 
  addTrade, 
  subscribe,
  addBuyTransaction,
  getTotalTokenHolding
} from './gameState';
import ChartPriceSync from './components/ChartPriceSync';
import './TradingPage.css';

// Define transaction fee rate (5%)
const TRANSACTION_FEE_RATE = 0.05;

function TradingPage({ showPixelDialog }) {
  // Get contract address from URL params 
  const { contractAddress } = useParams();
  const navigate = useNavigate(); // Add navigate function
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
  const [isTrading, setIsTrading] = useState(false); // Add loading state for trades
  
  // Price data state
  const [priceData, setPriceData] = useState({
    loading: true,
    price: null,
    priceChange: null,
    liquidity: null,
    lastUpdated: null,
    error: null,
    errorType: null,
    source: 'api', // 'api' or 'chart'
    rawPrice: null // Raw numerical price value for calculations
  });
  
  // Basic token data - in a real app, this would come from an API based on the contract
  const [tokenData, setTokenData] = useState({
    name: 'Token',
    symbol: 'TKN',
    volume: '432,100',
    marketCap: '1,345,000',
  });
  
  // Player data state for trading - now using global state
  const [playerBalance, setPlayerBalance] = useState(0);
  const [playerTokenHolding, setPlayerTokenHolding] = useState(0);
  const [tradeInputValue, setTradeInputValue] = useState('');
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // Load initial state and subscribe to changes
  useEffect(() => {
    if (!contractAddress) return;
    
    // Get initial state
    const gameState = getGameState();
    
    // Set initial balance
    if (gameState && 'rugDevSolBalance' in gameState) {
      setPlayerBalance(gameState.rugDevSolBalance);
    }
    
    // Set initial token holding for this contract using getTotalTokenHolding
    setPlayerTokenHolding(getTotalTokenHolding(contractAddress));
    
    // Set initial trade history for this contract
    if (gameState && gameState.tradeHistory && Array.isArray(gameState.tradeHistory)) {
      // Filter history for this contract
      const filteredHistory = gameState.tradeHistory.filter(
        trade => trade.contractAddress === contractAddress
      );
      setTradeHistory(filteredHistory);
    }
    
    // Subscribe to state changes
    const unsubscribe = subscribe((newState) => {
      if (newState && 'rugDevSolBalance' in newState) {
        setPlayerBalance(newState.rugDevSolBalance);
      }
      
      // Get total token holding from the new state structure
      setPlayerTokenHolding(getTotalTokenHolding(contractAddress));
      
      if (newState && newState.tradeHistory && Array.isArray(newState.tradeHistory)) {
        // Filter history for this contract
        const filteredHistory = newState.tradeHistory.filter(
          trade => trade.contractAddress === contractAddress
        );
        setTradeHistory(filteredHistory);
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [contractAddress]);
  
  // Function to fetch price data - using useCallback so it can be referenced in the refresh button
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!contractAddress) return;
    
    try {
      // Call our service function to fetch the token price
      setPriceData(prev => ({...prev, loading: true, error: null, errorType: null}));
      
      // Pass forceRefresh parameter to fetchSolanaTokenPrice
      const priceResult = await fetchSolanaTokenPrice(contractAddress, forceRefresh);
      
      if (priceResult.error) {
        // If there's an error from the API call but we already have data, keep it
        setPriceData(prev => ({
          ...prev,
          loading: false,
          error: priceResult.error,
          errorType: priceResult.errorType || 'general_error',
          // Keep existing price data if we had it
          price: prev.price || null,
          priceChange: prev.priceChange || null,
          liquidity: prev.liquidity || null,
          lastUpdated: prev.lastUpdated || null,
          source: prev.source || 'api',
          rawPrice: prev.rawPrice || null
        }));
      } else {
        // Format the price and price change data
        const formattedPrice = formatPrice(priceResult.price);
        const formattedPriceChange = formatPriceChange(priceResult.priceChange24h);
        
        // Update state with the formatted data
        setPriceData({
          loading: false,
          price: formattedPrice,
          priceChange: formattedPriceChange,
          liquidity: priceResult.liquidity,
          lastUpdated: priceResult.lastUpdated,
          error: null,
          errorType: null,
          source: 'api',
          rawPrice: priceResult.price // Store raw price for calculations
        });
        
        // Update token market data if available
        if (priceResult.liquidity) {
          setTokenData(prev => ({
            ...prev,
            volume: formatLiquidity(priceResult.liquidity),
            marketCap: formatLiquidity(priceResult.liquidity * 2) // Simple estimate
          }));
        }
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      // Generic error handling - keep existing data if we have it
      setPriceData(prev => ({
        ...prev,
        loading: false,
        error: "Error fetching price data: " + (err.message || 'Unknown error'),
        errorType: 'general_error',
        // Only clear price data if we don't already have some
        price: prev.price || null,
        priceChange: prev.priceChange || null,
        liquidity: prev.liquidity || null,
        lastUpdated: prev.lastUpdated || null,
        rawPrice: prev.rawPrice || null
      }));
    }
  }, [contractAddress]);
  
  // Function to manually refresh price data
  const handleRefresh = useCallback(() => {
    console.log('Manual refresh triggered');
    // Pass true to fetchData to force refresh and bypass cache
    fetchData(true);
  }, [fetchData]);
  
  // Function to fetch price data from API
  useEffect(() => {
    if (!contractAddress) return;
    
    // Set loading state
    setPriceData(prev => ({...prev, loading: true, error: null, errorType: null}));
    
    // Initial delay before first fetch to avoid potential rate limits
    const initialDelay = Math.random() * 3000; // Random delay up to 3 seconds
    let initialTimer = null;
    let refreshInterval = null;
    
    // Use initial delay to avoid hitting rate limits on page load
    initialTimer = setTimeout(() => {
      // Don't force refresh on initial load to allow using cached data if available
      fetchData(false);
      
      // Set up a refresh interval (every 120 seconds)
      // Don't force refresh on interval to avoid excessive API calls
      refreshInterval = setInterval(() => fetchData(false), 120000);
    }, initialDelay);
    
    // Update token symbol based on contract address (in a real app, this would be from API)
    // For now just using a simple mock
    if (contractAddress) {
      const shortAddr = truncateAddress(contractAddress);
      setTokenData(prev => ({
        ...prev,
        name: `Token ${shortAddr}`,
        symbol: shortAddr.slice(0, 4).toUpperCase()
      }));
    }
    
    // Cleanup function to clear the interval and timer
    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [contractAddress, fetchData]);
  
  // Handle input change for trade amount
  const handleInputChange = (e) => {
    // Only allow numeric input with decimal
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTradeInputValue(value);
    }
  };
  
  // Set quick percentages of balance/holdings
  const handleQuickPercentage = (percentage) => {
    if (activeTab === 'buy') {
      // Calculate percentage of player's balance
      const amount = (playerBalance * percentage / 100).toFixed(2);
      setTradeInputValue(amount);
    } else {
      // Calculate percentage of player's token holdings
      const amount = Math.floor(playerTokenHolding * percentage / 100);
      setTradeInputValue(amount.toString());
    }
  };
  
  // Set max amount
  const handleMaxAmount = () => {
    if (activeTab === 'buy') {
      setTradeInputValue(playerBalance.toFixed(2));
    } else {
      setTradeInputValue(playerTokenHolding.toString());
    }
  };
  
  // Handle buy transaction
  const handleBuy = async () => {
    // Set trading state to true at the beginning
    setIsTrading(true);
    
    try {
      // Get the current price (raw value for calculations)
      const currentPrice = priceData.rawPrice;
      
      if (!currentPrice) {
        // Replace alert with custom dialog
        showPixelDialog('Transaction Failed', "Cannot complete transaction: Price data unavailable");
        return;
      }
      
      // Get value to spend from input
      const valueToSpend = parseFloat(tradeInputValue);
      
      // Validate input
      if (isNaN(valueToSpend) || valueToSpend <= 0) {
        // Replace alert with custom dialog
        showPixelDialog('Invalid Input', "Please enter a valid amount");
        return;
      }
      
      // Calculate the transaction fee
      const buyFee = valueToSpend * TRANSACTION_FEE_RATE;
      const totalCostWithFee = valueToSpend + buyFee;
      
      // Check if player has enough balance (including fee)
      if (totalCostWithFee > playerBalance) {
        // Replace alert with custom dialog
        showPixelDialog('Insufficient Balance', `Not enough $RDS balance (including 5% fee of $${buyFee.toFixed(2)})`);
        return;
      }
      
      // Calculate token amount to buy (based on the pre-fee value)
      const amountToBuy = valueToSpend / currentPrice;
      const tokenAmount = Math.floor(amountToBuy);
      
      // Update player balance (deduct total cost including fee)
      updateBalance(-totalCostWithFee);
      
      // Add buy transaction with price information
      addBuyTransaction(contractAddress, tokenAmount, currentPrice);
      
      // Add to global trade history
      const timestamp = new Date();
      const newTrade = {
        type: 'buy',
        amount: tokenAmount,
        price: currentPrice,
        value: totalCostWithFee.toFixed(2), // Include fee in the recorded value
        fee: buyFee.toFixed(2), // Store fee separately for record-keeping
        timestamp: timestamp,
        formattedTime: timestamp.toLocaleString(),
        contractAddress: contractAddress // Important for filtering history
      };
      
      addTrade(newTrade);
      
      // Clear input
      setTradeInputValue('');
      
      // Show success message with custom dialog instead of alert
      showPixelDialog(
        'Trade Successful', 
        `Successfully bought ${tokenAmount} ${tokenData.symbol} for $${valueToSpend.toFixed(2)} $RDS + $${buyFee.toFixed(2)} fee (total: $${totalCostWithFee.toFixed(2)} $RDS)`
      );
    } catch (error) {
      console.error("Buy transaction error:", error);
      showPixelDialog('Transaction Error', "An unexpected error occurred during the buy transaction.");
    } finally {
      // Set trading state to false at the end (always)
      setIsTrading(false);
    }
  };
  
  // Handle sell transaction
  const handleSell = async () => {
    // Set trading state to true at the beginning
    setIsTrading(true);
    
    try {
      // Attempt to refresh price before selling
      let currentPrice = priceData.rawPrice;
      
      if (!currentPrice) {
        // Replace alert with custom dialog
        showPixelDialog('Transaction Failed', "Cannot complete transaction: Price data unavailable");
        return;
      }
      
      try {
        console.log("Attempting price refresh before sell...");
        // Get the latest price directly from the API instead of relying on state updates
        const priceResult = await fetchSolanaTokenPrice(contractAddress, true);
        
        if (priceResult && !priceResult.error && priceResult.price) {
          // Update the current price with the fresh data
          currentPrice = priceResult.price;
          console.log("Price refreshed successfully before sell:", currentPrice);
        } else {
          console.warn("Failed to refresh price before sell, using last known price:", currentPrice);
        }
        
        // Also trigger the UI update through fetchData, but don't wait for it
        fetchData(true);
      } catch (e) {
        console.error("Error during price refresh before sell:", e);
        console.warn("Using last known price for sell due to refresh error:", currentPrice);
      }
      
      // Get token amount to sell from input
      const amountToSell = parseInt(tradeInputValue);
      
      // Validate input
      if (isNaN(amountToSell) || amountToSell <= 0) {
        // Replace alert with custom dialog
        showPixelDialog('Invalid Input', "Please enter a valid amount");
        return;
      }
      
      // Check if player has enough tokens
      if (amountToSell > playerTokenHolding) {
        // Replace alert with custom dialog
        showPixelDialog('Insufficient Tokens', `Not enough ${tokenData.symbol} tokens`);
        return;
      }
      
      // Calculate value to receive using the current price (which may have been refreshed)
      const baseSellValue = amountToSell * currentPrice;
      
      // Calculate the fee
      const sellFee = baseSellValue * TRANSACTION_FEE_RATE;
      const valueToReceiveAfterFee = baseSellValue - sellFee;
      
      // Update global state (which will update local state via subscription)
      updateBalance(valueToReceiveAfterFee); // Add value after fee
      updateHolding(contractAddress, -amountToSell);
      
      // Add to global trade history
      const timestamp = new Date();
      const newTrade = {
        type: 'sell',
        amount: amountToSell,
        price: currentPrice,
        value: valueToReceiveAfterFee.toFixed(2), // Record the after-fee value
        fee: sellFee.toFixed(2), // Store fee separately for record-keeping
        timestamp: timestamp,
        formattedTime: timestamp.toLocaleString(),
        contractAddress: contractAddress // Important for filtering history
      };
      
      addTrade(newTrade);
      
      // Clear input
      setTradeInputValue('');
      
      // Show success message with custom dialog instead of alert
      showPixelDialog(
        'Trade Successful', 
        `Successfully sold ${amountToSell} ${tokenData.symbol} for $${baseSellValue.toFixed(2)} $RDS - $${sellFee.toFixed(2)} fee (net: $${valueToReceiveAfterFee.toFixed(2)} $RDS)`
      );
    } catch (error) {
      console.error("Sell transaction error:", error);
      showPixelDialog('Transaction Error', "An unexpected error occurred during the sell transaction.");
    } finally {
      // Set trading state to false at the end (always)
      setIsTrading(false);
    }
  };
  
  // Function to truncate contract address for display
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Render trade history
  const renderTradeHistory = () => {
    if (tradeHistory.length === 0) {
      return <div className="no-trades-message">No trades yet. Start trading to see your history!</div>;
    }
    
    return (
      <div className="trade-history-list">
        {tradeHistory.map((trade, index) => (
          <div 
            key={index} 
            className={`trade-history-item ${trade.type === 'buy' ? 'buy' : 'sell'}`}
          >
            <div className="trade-type">
              {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount} {tokenData.symbol}
            </div>
            <div className="trade-details">
              <span className="trade-price">Price: ${formatPrice(trade.price)}</span>
              <span className="trade-value">Value: ${trade.value} $RDS</span>
              {trade.fee && (
                <span className="trade-fee">Fee: ${trade.fee} $RDS</span>
              )}
              <span className="trade-time">{trade.formattedTime}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render price display based on state
  const renderPriceDisplay = () => {
    if (priceData.loading) {
      return (
        <div className="token-price-loading-container">
          <span className="token-price loading">Loading price data...</span>
          <div className="loading-spinner"></div>
        </div>
      );
    }
    
    // If we have price data, display it (even if there's an error, show the price if we have it)
    if (priceData.price) {
      return (
        <>
          <div className="token-price-row">
            <span className="token-price">${priceData.price}</span>
            {priceData.priceChange && (
              <span className={`token-price-change ${priceData.priceChange.startsWith('+') ? 'positive' : 'negative'}`}>
                {priceData.priceChange.startsWith('+') ? 
                  <ArrowTrendingUpIcon className="price-icon" /> : 
                  <ArrowTrendingDownIcon className="price-icon" />
                }
                {priceData.priceChange}
              </span>
            )}
            {priceData.source === 'chart' && (
              <span className="price-source">Chart Data</span>
            )}
            {priceData.source === 'simulated' && (
              <span className="price-source simulated">Simulated</span>
            )}
            {priceData.error && (
              <span className="price-refresh-error" title={priceData.error}>⚠️</span>
            )}
          </div>
          {priceData.lastUpdated && (
            <div className="price-last-updated">
              <ClockIconSolid className="time-icon" />
              <span>Updated: {formatLastUpdated(priceData.lastUpdated)}</span>
            </div>
          )}
          <div className="manual-refresh-container">
            <button 
              className="manual-refresh-button" 
              onClick={handleRefresh} 
              title="Refresh price data now"
              disabled={priceData.loading}
            >
              <ArrowPathIcon className={`manual-refresh-icon ${priceData.loading ? 'spinning' : ''}`} />
              <span>{priceData.loading ? 'Refreshing...' : 'Refresh Price'}</span>
            </button>
          </div>
        </>
      );
    }
    
    // If we have no price data and there's an error, show specialized error message by type
    if (priceData.error) {
      return (
        <div className="token-price-error-container">
          <div className="token-price-error-header">
            <ExclamationCircleIcon className="error-icon" />
            <span className="token-price error">
              {priceData.errorType === 'invalid_contract' ? 'Invalid Contract' : 
               priceData.errorType === 'rate_limit' ? 'Rate Limit Exceeded' : 
               'Error Loading Price'}
            </span>
            <button className="refresh-button" onClick={handleRefresh} title="Retry loading price data">
              <ArrowPathIcon className="refresh-icon" />
            </button>
          </div>
          <span className="token-price-error-message">{priceData.error}</span>
        </div>
      );
    }
    
    // Fallback case
    return <span className="token-price error">No price data available</span>;
  };
  
  return (
    <div className="trading-page-container">
      {/* Trading loading overlay */}
      {isTrading && (
        <div className="trading-loading-overlay">
          <div className="trading-loading-content">
            <div className="pixel-loading-animation"></div>
            <span className="loading-text">Processing Trade...</span>
          </div>
        </div>
      )}
      
      {/* Top Token Info Area */}
      <section className="token-info-header">
        <div className="token-icon">🪙</div>
        <div className="token-details">
          <div className="token-title-row">
            <h1>{tokenData.name} <span className="token-symbol">({tokenData.symbol})</span></h1>
            <button 
              className="back-button back-image-button"
              onClick={() => navigate('/home')}
            >
              <img src="/assets/Back.png" alt="Back to Home" className="back-home-image" />
            </button>
          </div>
          <div className="token-price-container">
            {renderPriceDisplay()}
          </div>
          <div className="contract-address">
            <span className="address-label">Contract:</span>
            <span className="address-value">{truncateAddress(contractAddress)}</span>
          </div>
          
          {/* Chart price sync indicator */}
          <ChartPriceSync 
            contractAddress={contractAddress}
          />
        </div>
      </section>
      
      {/* Main Content Area */}
      <div className="main-content-area">
        {/* Price Chart Section */}
        <section className="price-chart-section">
          <h2 className="section-title">Price Chart</h2>
          <div className="chart-container">
            <iframe 
              src={`https://www.gmgn.cc/kline/sol/${contractAddress}`}
              width="100%" 
              height="500" 
              frameBorder="0"
              title="GMGN Price Chart"
            ></iframe>
          </div>
        </section>
        
        {/* Trading Panel Section */}
        <section className="trading-panel-section">
          <h2 className="section-title">Trade {tokenData.symbol}</h2>
          
          {/* Buy/Sell Toggle */}
          <div className="trade-mode-toggle">
            <button 
              className={`toggle-button ${activeTab === 'buy' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('buy');
                setTradeInputValue('');
              }}
            >
              Buy
            </button>
            <button 
              className={`toggle-button ${activeTab === 'sell' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('sell');
                setTradeInputValue('');
              }}
            >
              Sell
            </button>
          </div>
          
          {/* Player Assets */}
          <div className="player-assets">
            <div className="asset-item">
              <WalletIcon className="asset-icon" />
              <span className="asset-label">Your Balance:</span>
              <span className="asset-value">${playerBalance.toFixed(2)} $RDS</span>
            </div>
            <div className="asset-item">
              <CurrencyDollarIcon className="asset-icon" />
              <span className="asset-label">Your {tokenData.symbol}:</span>
              <span className="asset-value">{playerTokenHolding.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Trade Input */}
          <div className="trade-input-container">
            <label className="input-label">
              {activeTab === 'buy' ? 'Amount to Buy' : 'Amount to Sell'}:
            </label>
            <div className="input-with-unit">
              <input 
                type="text" 
                className="trade-input" 
                placeholder="0.00"
                value={tradeInputValue}
                onChange={handleInputChange}
              />
              <span className="input-unit">
                {activeTab === 'buy' ? '$RDS' : tokenData.symbol}
              </span>
            </div>
          </div>
          
          {/* Quick Input Buttons */}
          <div className="quick-input-buttons">
            <button className="quick-button" onClick={() => handleQuickPercentage(25)} disabled={isTrading}>25%</button>
            <button className="quick-button" onClick={() => handleQuickPercentage(50)} disabled={isTrading}>50%</button>
            <button className="quick-button" onClick={() => handleQuickPercentage(75)} disabled={isTrading}>75%</button>
            <button className="quick-button" onClick={handleMaxAmount} disabled={isTrading}>Max</button>
          </div>
          
          {/* Trade Button */}
          <button 
            className={`trade-button ${activeTab === 'buy' ? 'buy' : 'sell'}`}
            onClick={activeTab === 'buy' ? handleBuy : handleSell}
            disabled={priceData.loading || !priceData.rawPrice || isTrading}
          >
            {isTrading ? 
              `Processing ${activeTab === 'buy' ? 'Buy' : 'Sell'}...` : 
              `${activeTab === 'buy' ? `Buy ${tokenData.symbol}` : `Sell ${tokenData.symbol}`}`
            }
          </button>
          
          {/* Market Data */}
          <div className="market-data">
            <div className="market-data-item">
              <span className="data-label">24h Volume:</span>
              <span className="data-value">${tokenData.volume}</span>
            </div>
            <div className="market-data-item">
              <span className="data-label">Market Cap:</span>
              <span className="data-value">${tokenData.marketCap}</span>
            </div>
          </div>
        </section>
      </div>
      
      {/* Trade History Section */}
      <section className="trade-history-section">
        <h2 className="section-title">
          <ClockIcon className="section-icon" />
          Your Trade History
        </h2>
        <div className="trade-history-container">
          {renderTradeHistory()}
        </div>
      </section>
    </div>
  );
}

export default TradingPage; 