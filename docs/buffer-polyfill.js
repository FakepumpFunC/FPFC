// Buffer polyfill script for Solana Web3.js compatibility
(function() {
  try {
    // Make sure Buffer is defined globally
    if (typeof Buffer === 'undefined') {
      // Create a simple Buffer-like object for polyfill
      window.Buffer = {
        from: function(data, encoding) {
          if (encoding === 'hex') {
            return Array.from(data.match(/.{1,2}/g) || [], byte => parseInt(byte, 16));
          }
          return Array.from(data);
        },
        alloc: function(size) {
          return new Uint8Array(size);
        },
        isBuffer: function() {
          return false;
        }
      };
    }
    
    // Set up global for modules that expect it
    if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
      window.global = window;
    }
    
    console.log('Buffer polyfill loaded successfully');
  } catch (err) {
    console.error('Failed to load Buffer polyfill:', err);
  }
})(); 