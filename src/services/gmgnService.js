/**
 * Service for fetching price data from GMGN sources.
 * This syncs with what is displayed in the GMGN chart iframe.
 */

// Cache for storing recent price data to prevent excessive API calls
const priceCache = {
  data: {},
  timestamps: {},
  ttl: 5000, // 5 seconds cache TTL
};

/**
 * Attempts to fetch the current price from GMGN API
 * @param {string} contractAddress - Solana contract address
 * @returns {Promise<object>} - Price data or null if unavailable
 */
export const fetchGMGNPrice = async (contractAddress) => {
  try {
    // Check cache first
    if (priceCache.data[contractAddress]) {
      const now = Date.now();
      if (now - priceCache.timestamps[contractAddress] < priceCache.ttl) {
        console.log('Using cached GMGN price data');
        return priceCache.data[contractAddress];
      }
    }

    // If no data in cache or cache expired, fetch new data
    // Note: Since GMGN API specifics aren't available, we'll use their chart URL
    // but add a query parameter to get JSON data instead of HTML
    const response = await fetch(`https://www.gmgn.cc/api/price/sol/${contractAddress}`);
    
    if (!response.ok) {
      throw new Error(`GMGN API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the price data - this structure is assumed based on typical API patterns
    // Adjust based on actual GMGN API response
    const priceData = {
      price: data.price || data.lastPrice || data.current_price,
      change: data.change || data.priceChange || data.change_24h,
      volume: data.volume || data.volume_24h,
      timestamp: Date.now()
    };
    
    // Cache the result
    priceCache.data[contractAddress] = priceData;
    priceCache.timestamps[contractAddress] = Date.now();
    
    return priceData;
  } catch (error) {
    console.error('Error fetching GMGN price:', error);
    return null;
  }
};

/**
 * Extracts price information from the GMGN chart URL parameters
 * This is a fallback method when the API isn't available
 * @param {string} chartUrl - The full URL of the chart iframe
 * @returns {object|null} - Extracted price data or null
 */
export const extractPriceFromChartUrl = (chartUrl) => {
  try {
    const url = new URL(chartUrl);
    
    // Check if price info is included in URL parameters
    const price = url.searchParams.get('price');
    const change = url.searchParams.get('change');
    
    if (price) {
      return {
        price: parseFloat(price),
        change: change ? parseFloat(change) : null,
        timestamp: Date.now()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting price from chart URL:', error);
    return null;
  }
};

/**
 * A fallback method to simulate chart prices for testing
 * @param {string} contractAddress - The contract address
 * @returns {object} - Simulated price data
 */
export const getSimulatedChartPrice = (contractAddress) => {
  // Generate a simple hash value from the contract address
  let hashValue = 0;
  for (let i = 0; i < contractAddress.length; i++) {
    hashValue = (hashValue + contractAddress.charCodeAt(i)) % 1000;
  }
  
  // Use the hash to generate a "consistent" price for the same token
  const basePrice = (hashValue / 10000) + 0.0001;
  
  // Add small random variation to simulate price movement
  const variance = 0.00001 * Math.sin(Date.now() / 10000);
  
  return {
    price: basePrice + variance,
    change: variance > 0 ? 0.05 : -0.03,
    timestamp: Date.now(),
    isSimulated: true
  };
}; 