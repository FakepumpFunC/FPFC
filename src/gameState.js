// src/gameState.js - Global game state management with LocalStorage persistence
import { HAS_ENTERED_KEY } from './TitlePage';

// Storage key for localStorage
const STORAGE_KEY = 'fakePumpFunGameState';

// Default initial state
const defaultState = {
  rugDevSolBalance: 1000.00, // Initial player balance
  tokenHoldings: {}, // Now stores buy transactions: { contractAddress: [{ buyId, amount, price, time }, ...] }
  tradeHistory: [], // Array of trade objects
  performanceStats: { // Performance metrics
    totalInput: 0,
    totalReceived: 0,
    netResult: 0,
    percentageResult: 0,
    totalTrades: 0,
    buyCount: 0,
    sellCount: 0,
    buySellRatio: '0/0'
  }
};

// Subscribers list for state changes (simple pub/sub implementation)
let subscribers = [];

// Current state (will be loaded from localStorage or initialized with default)
let currentState = null;

/**
 * Calculate performance metrics from trade history
 * @param {Array} tradeHistory - Array of trade objects
 * @returns {Object} Calculated performance stats
 */
export function calculatePerformanceMetrics(tradeHistory) {
  let totalInput = 0;
  let totalReceived = 0;
  let buyCount = 0;
  let sellCount = 0;
  
  // Process each trade
  if (tradeHistory && Array.isArray(tradeHistory)) {
    tradeHistory.forEach(trade => {
      // Make sure to convert string values to numbers and handle missing values
      const tradeValue = trade.value ? parseFloat(trade.value) : 
                        (trade.amount && trade.price ? parseFloat(trade.amount) * parseFloat(trade.price) : 0);
      
      if (trade.type === 'buy' || trade.type === 'BUY') {
        totalInput += tradeValue;
        buyCount++;
      } else if (trade.type === 'sell' || trade.type === 'SELL') {
        totalReceived += tradeValue;
        sellCount++;
      }
    });
  }
  
  // Calculate net result and percentage
  const netResult = totalReceived - totalInput;
  const percentageResult = totalInput > 0 ? (netResult / totalInput) * 100 : 0;
  const totalTrades = tradeHistory ? tradeHistory.length : 0;
  const buySellRatio = `${buyCount}/${sellCount}`;
  
  return {
    totalInput,
    totalReceived,
    netResult,
    percentageResult,
    totalTrades,
    buyCount,
    sellCount,
    buySellRatio
  };
}

/**
 * Load game state from localStorage
 * @returns {Object} Current game state
 */
export function loadGameState() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      
      // Convert ISO string timestamps back to Date objects for trade history
      if (parsedData.tradeHistory && Array.isArray(parsedData.tradeHistory)) {
        parsedData.tradeHistory = parsedData.tradeHistory.map(trade => ({
          ...trade,
          timestamp: new Date(trade.timestamp)
        }));
      }
      
      // Convert ISO string timestamps back to Date objects for buy transactions
      if (parsedData.tokenHoldings) {
        Object.keys(parsedData.tokenHoldings).forEach(contractAddress => {
          if (Array.isArray(parsedData.tokenHoldings[contractAddress])) {
            parsedData.tokenHoldings[contractAddress] = parsedData.tokenHoldings[contractAddress].map(buy => ({
              ...buy,
              time: new Date(buy.time)
            }));
          } else {
            // Handle legacy data structure - convert from old format to new
            const amount = parsedData.tokenHoldings[contractAddress];
            if (typeof amount === 'number' && amount > 0) {
              parsedData.tokenHoldings[contractAddress] = [{
                buyId: 'legacy-' + Date.now(),
                amount: amount,
                price: 0, // We don't know the original price
                time: new Date()
              }];
            } else {
              parsedData.tokenHoldings[contractAddress] = [];
            }
          }
        });
      }
      
      // Initialize performanceStats if not present (for backward compatibility)
      if (!parsedData.performanceStats) {
        parsedData.performanceStats = calculatePerformanceMetrics(parsedData.tradeHistory);
      }
      
      currentState = parsedData;
      return currentState;
    }
  } catch (error) {
    console.error('Error loading game state from localStorage:', error);
  }
  
  // If no valid data found or error occurred, use default state
  currentState = {...defaultState};
  return currentState;
}

/**
 * Save current game state to localStorage
 * @param {Object} state - State object to save
 */
export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving game state to localStorage:', error);
  }
}

/**
 * Get current game state
 * @returns {Object} Current game state
 */
export function getGameState() {
  if (!currentState) {
    return loadGameState();
  }
  return currentState;
}

/**
 * Update player balance
 * @param {number} amountChange - Amount to add to balance (negative for subtraction)
 */
export function updateBalance(amountChange) {
  if (!currentState) loadGameState();
  
  currentState.rugDevSolBalance = parseFloat((currentState.rugDevSolBalance + amountChange).toFixed(2));
  saveGameState(currentState);
  notifyListeners();
}

/**
 * Get the total tokens held for a contract
 * @param {string} contractAddress - Token contract address
 * @returns {number} Total amount of tokens held
 */
export function getTotalTokenHolding(contractAddress) {
  if (!currentState) loadGameState();
  
  if (!currentState.tokenHoldings[contractAddress]) {
    return 0;
  }
  
  // Sum up all buy transactions for this token
  return currentState.tokenHoldings[contractAddress].reduce((total, buy) => total + buy.amount, 0);
}

/**
 * Add a buy transaction for a token
 * @param {string} contractAddress - Token contract address
 * @param {number} amount - Amount of tokens bought
 * @param {number} price - Price per token in $RDS
 * @returns {Object} The new buy transaction object
 */
export function addBuyTransaction(contractAddress, amount, price) {
  if (!currentState) loadGameState();
  
  // Initialize array for this token if it doesn't exist
  if (!currentState.tokenHoldings[contractAddress]) {
    currentState.tokenHoldings[contractAddress] = [];
  }
  
  // Create a new buy transaction
  const buyTransaction = {
    buyId: `buy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Generate unique ID
    amount: amount,
    price: price,
    time: new Date()
  };
  
  // Add to the token's buy transactions
  currentState.tokenHoldings[contractAddress].push(buyTransaction);
  
  saveGameState(currentState);
  notifyListeners();
  
  return buyTransaction;
}

/**
 * Update token holding - Legacy function, now uses the new data structure internally
 * @param {string} contractAddress - Token contract address
 * @param {number} amountChange - Amount to change (positive for addition, negative for subtraction)
 */
export function updateHolding(contractAddress, amountChange) {
  if (!currentState) loadGameState();
  
  if (amountChange > 0) {
    // For buy transactions, use addBuyTransaction with price 0 (unknown)
    // This should not be called directly for buys, use addBuyTransaction instead
    console.warn('Using legacy updateHolding for buy - price information will be lost');
    addBuyTransaction(contractAddress, amountChange, 0);
  } else if (amountChange < 0) {
    // For sell transactions, reduce the holdings
    // This is simplified and doesn't track which specific buy transactions were sold
    const sellAmount = Math.abs(amountChange);
    let remainingSellAmount = sellAmount;
    
    if (!currentState.tokenHoldings[contractAddress]) {
      console.error(`Cannot sell ${sellAmount} tokens of ${contractAddress}: no holdings found`);
      return;
    }
    
    // Get the total amount held
    const totalHeld = getTotalTokenHolding(contractAddress);
    
    if (sellAmount > totalHeld) {
      console.error(`Cannot sell ${sellAmount} tokens of ${contractAddress}: only have ${totalHeld}`);
      return;
    }
    
    // Create a copy of the buy transactions to modify
    const buyTransactions = [...currentState.tokenHoldings[contractAddress]];
    const updatedBuyTransactions = [];
    
    // Reduce buy transactions, starting from the oldest (FIFO)
    for (const buy of buyTransactions) {
      if (remainingSellAmount <= 0) {
        // No more tokens to sell, keep the remaining buy transaction as is
        updatedBuyTransactions.push(buy);
      } else if (buy.amount <= remainingSellAmount) {
        // This buy transaction is completely sold
        remainingSellAmount -= buy.amount;
        // Don't add to updatedBuyTransactions (it's fully sold)
      } else {
        // This buy transaction is partially sold
        const updatedBuy = {
          ...buy,
          amount: buy.amount - remainingSellAmount
        };
        remainingSellAmount = 0;
        updatedBuyTransactions.push(updatedBuy);
      }
    }
    
    // Update the token holdings
    currentState.tokenHoldings[contractAddress] = updatedBuyTransactions;
    
    saveGameState(currentState);
    notifyListeners();
  }
}

/**
 * Add trade to history
 * @param {Object} trade - Trade object to add
 */
export function addTrade(trade) {
  if (!currentState) loadGameState();
  
  // Ensure timestamp is a Date object and can be serialized
  const newTrade = {
    ...trade,
    timestamp: trade.timestamp || new Date(), // Use provided timestamp or current time
  };

  // Make sure formattedTime is included
  if (!newTrade.formattedTime) {
    newTrade.formattedTime = newTrade.timestamp.toLocaleString();
  }
  
  currentState.tradeHistory.unshift(newTrade);
  
  // Recalculate and update performance metrics
  currentState.performanceStats = calculatePerformanceMetrics(currentState.tradeHistory);
  
  saveGameState(currentState);
  notifyListeners();
}

/**
 * Subscribe to state changes
 * @param {Function} listener - Callback function to be called on state changes
 */
export function subscribe(listener) {
  subscribers.push(listener);
  return () => {
    subscribers = subscribers.filter(sub => sub !== listener);
  };
}

/**
 * Unsubscribe from state changes
 * @param {Function} listener - Listener function to remove
 */
export function unsubscribe(listener) {
  subscribers = subscribers.filter(sub => sub !== listener);
}

/**
 * Notify all listeners of state changes
 */
function notifyListeners() {
  subscribers.forEach(listener => {
    try {
      listener(currentState);
    } catch (error) {
      console.error('Error in state change listener:', error);
    }
  });
}

/**
 * Reset game state to default values
 * Clears all tokenHoldings, tradeHistory, resets balance, and clears the has-entered flag
 * @returns {Object} Reset game state
 */
export function resetGameState() {
  // Reset current state to a fresh copy of defaultState
  currentState = {...defaultState};
  
  // Save the reset state to localStorage
  saveGameState(currentState);
  
  // Clear the "has entered" flag so user sees the title page again
  localStorage.removeItem(HAS_ENTERED_KEY);
  
  // Notify all subscribers about the reset
  notifyListeners();
  
  return currentState;
}

// Initialize state on module load
loadGameState(); 