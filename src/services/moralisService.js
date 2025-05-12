/**
 * This service provides functions for fetching token data from external APIs.
 * It includes functions to fetch token prices from Ave.ai and Birdeye.
 */

// API key for Ave.ai - In a production application, this should be stored in an environment variable
// and not directly in the code for security reasons
const AVE_API_KEY = '0H7NicjOftzKAEUF4WeUbSUm0Jct3OFv5q6jNHOW0Gf1NAZrOazfKGY7zJR4Eaft';

// API key for Birdeye
const BIRDEYE_API_KEY = 'a1373453dfe44a7f9286911dcca3d763';

// Cache for Birdeye API responses to avoid rate limits
const BIRDEYE_CACHE = {
  data: {},
  timestamps: {},
  ttl: 60000, // 60 seconds cache TTL
  lastRequestTime: 0,
  minRequestInterval: 10000 // Minimum 10 seconds between requests to avoid rate limits
};

/**
 * Fetches token price data from Birdeye API
 * @param {string} contractAddress - The contract address of the token on Solana
 * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh data
 * @returns {Promise<Object>} - Object containing price data or error
 */
export const fetchBirdeyeTokenPrice = async (contractAddress, forceRefresh = false) => {
  try {
    // Check cache first (skip if forceRefresh is true)
    const now = Date.now();
    if (!forceRefresh && BIRDEYE_CACHE.data[contractAddress]) {
      if (now - BIRDEYE_CACHE.timestamps[contractAddress] < BIRDEYE_CACHE.ttl) {
        console.log('Using cached Birdeye price data for', contractAddress);
        return BIRDEYE_CACHE.data[contractAddress];
      }
    }
    
    // If forceRefresh is true, log that we're bypassing cache
    if (forceRefresh) {
      console.log('Manual refresh requested - bypassing cache for', contractAddress);
    }
    
    // Check if we need to wait before making another request
    const timeSinceLastRequest = now - BIRDEYE_CACHE.lastRequestTime;
    if (timeSinceLastRequest < BIRDEYE_CACHE.minRequestInterval) {
      const waitTime = BIRDEYE_CACHE.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: Waiting ${waitTime}ms before next Birdeye request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    console.log('Attempting to fetch Birdeye price for token address:', contractAddress);
    
    // Update last request time
    BIRDEYE_CACHE.lastRequestTime = Date.now();
    
    // Send request to Birdeye API using the Vite proxy
    // Using the correct endpoint from the documentation
    const response = await fetch(`https://public-api.birdeye.so/defi/price?address=${contractAddress}`, {
      headers: {
        'X-API-KEY': 'a1373453dfe44a7f9286911dcca3d763',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Log the response status
    console.log('Birdeye API response status:', response.status);
    
    // Check if the response is successful
    if (!response.ok) {
      // Differentiate between different types of errors
      if (response.status === 400) {
        throw new Error(`Invalid contract address: The token may not exist on Solana`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded: Too many requests to Birdeye API`);
      } else {
        throw new Error(`API request failed with status ${response.status}`);
      }
    }

    // Parse the response
    const data = await response.json();
    console.log('Birdeye API response data:', data);
    
    // If no data is returned or success is false, throw an error
    if (!data || !data.success || !data.data) {
      throw new Error('No price data available for this token');
    }

    const tokenData = data.data;
    console.log('Birdeye token data:', tokenData);
    
    // Extract and format the data
    const result = {
      price: tokenData.value || tokenData.price || 0,
      priceChange24h: (tokenData.priceChange24h || tokenData.change24h || 0) / 100, // Convert percentage to decimal
      priceNative: tokenData.priceInNative || tokenData.priceNative || 0,
      liquidity: tokenData.liquidity || 0,
      lastUpdated: tokenData.updateUnixTime ? tokenData.updateUnixTime * 1000 : Date.now(), // Convert to milliseconds
      error: null
    };
    
    // Cache the result
    BIRDEYE_CACHE.data[contractAddress] = result;
    BIRDEYE_CACHE.timestamps[contractAddress] = Date.now();
    
    return result;
  } catch (error) {
    console.error('Error fetching Birdeye token price:', error);
    
    // Return error object with specific error type
    return {
      price: null,
      priceChange24h: null,
      priceNative: null,
      liquidity: null,
      lastUpdated: null,
      error: error.message || 'Error fetching price data',
      errorType: error.message.includes('Invalid contract') ? 'invalid_contract' :
                error.message.includes('Rate limit') ? 'rate_limit' : 'general_error'
    };
  }
};

/**
 * Main function to fetch token price data
 * This is the recommended function to use for price fetching
 * @param {string} contractAddress - The contract address of the token on Solana
 * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh data
 * @returns {Promise<Object>} - Object containing price data or error
 */
export const fetchSolanaTokenPrice = async (contractAddress, forceRefresh = false) => {
  // Try Birdeye first as the preferred source
  const birdeyeData = await fetchBirdeyeTokenPrice(contractAddress, forceRefresh);
  
  // If Birdeye was successful, return that data
  if (!birdeyeData.error) {
    return birdeyeData;
  }
  
  console.log('Birdeye API failed, falling back to Ave.ai');
  
  // If Birdeye failed, try Ave.ai as a fallback
  const aveData = await fetchAveTokenPrice(contractAddress);
  
  // If Ave.ai was successful, return that data
  if (!aveData.error) {
    return aveData;
  }
  
  console.log('All APIs failed, returning error state');
  
  // If both APIs failed, return an error state with the most specific error
  // Prioritize invalid_contract errors over rate_limit errors
  const errorType = 
    birdeyeData.errorType === 'invalid_contract' || aveData.errorType === 'invalid_contract' 
      ? 'invalid_contract' 
      : birdeyeData.errorType === 'rate_limit' || aveData.errorType === 'rate_limit'
        ? 'rate_limit'
        : 'general_error';
  
  const errorMessage = 
    errorType === 'invalid_contract' 
      ? 'The contract address does not exist or is not a valid Solana token'
      : errorType === 'rate_limit'
        ? 'API rate limit exceeded. Please try again later.'
        : 'Could not fetch price data from any source';
  
  return {
    price: null,
    priceChange24h: null,
    priceNative: null,
    liquidity: null,
    lastUpdated: null,
    error: errorMessage,
    errorType: errorType
  };
};

/**
 * Fetches token price data from Ave.ai API
 * @param {string} contractAddress - The contract address of the token on Solana
 * @returns {Promise<Object>} - Object containing price data or error
 */
export const fetchAveTokenPrice = async (contractAddress) => {
  try {
    // Format the token ID as {contractAddress}-solana for Ave.ai API
    const tokenId = `${contractAddress}-solana`;
    console.log('Attempting to fetch price for token ID:', tokenId);
    
    // Prepare request data
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '0H7NicjOftzKAEUF4WeUbSUm0Jct3OFv5q6jNHOW0Gf1NAZrOazfKGY7zJR4Eaft'
      },
      body: JSON.stringify({
        token_ids: [tokenId]
      })
    };

    console.log('Making request to Ave.ai API with options:', JSON.stringify({
      headers: requestOptions.headers,
      body: JSON.stringify({
        token_ids: [tokenId]
      })
    }));

    // Send request to Ave.ai API using the Vite proxy
    const response = await fetch('https://prod.ave-api.com/v2/tokens/price', requestOptions);
    
    // Log the response status
    console.log('Ave.ai API response status:', response.status);
    
    // Check if the response is successful
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: Too many requests to Ave.ai API`);
      } else {
        throw new Error(`API request failed with status ${response.status}`);
      }
    }

    // Parse the response
    const data = await response.json();
    console.log('Ave.ai API response data:', data);
    
    // More detailed debugging
    console.log('API response structure:', {
      status: data.status,
      message: data.msg,
      dataType: data.data_type,
      dataKeys: data.data ? Object.keys(data.data) : [],
      hasTokenData: data.data && data.data[tokenId] ? true : false
    });
    
    // If no data is returned or status is not successful, throw an error
    if (!data || data.status !== 1 || !data.data) {
      throw new Error('No price data available for this token');
    }

    // Get the token data - sometimes the API returns an empty object or null
    const tokenData = data.data[tokenId];
    if (!tokenData) {
      console.log('Token data not found for ID:', tokenId);
      throw new Error('Invalid contract address: Token not found in Ave.ai database');
    }

    // Return the price data
    return {
      price: tokenData.current_price_usd,
      priceChange24h: tokenData.price_change_24h || null,
      priceChange1d: tokenData.price_change_1d || null,
      error: null
    };
  } catch (error) {
    console.error('Error fetching Ave.ai token price:', error);
    
    // Return error with specific type
    return {
      price: null,
      priceChange24h: null,
      priceChange1d: null,
      error: error.message || 'Error fetching price data',
      errorType: error.message.includes('Invalid contract') ? 'invalid_contract' : 
               error.message.includes('Rate limit') ? 'rate_limit' : 'general_error'
    };
  }
};

/**
 * Formats a price value to 6 decimal places
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string with 6 decimal places
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '--';
  return price.toFixed(6);
};

/**
 * Formats price change as a percentage with a + or - sign
 * @param {number} priceChange - The price change value
 * @returns {string} - Formatted price change with appropriate sign
 */
export const formatPriceChange = (priceChange) => {
  if (priceChange === null || priceChange === undefined) return null;
  
  const sign = priceChange >= 0 ? '+' : '';
  return `${sign}${(priceChange * 100).toFixed(2)}%`;
};

/**
 * Formats a unix timestamp to a readable date/time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date/time string
 */
export const formatLastUpdated = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Formats liquidity value with commas and 2 decimal places
 * @param {number} liquidity - Liquidity value
 * @returns {string} - Formatted liquidity string
 */
export const formatLiquidity = (liquidity) => {
  if (liquidity === null || liquidity === undefined) return '--';
  return liquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}; 