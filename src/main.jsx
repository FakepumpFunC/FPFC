import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App.jsx'

// Import and configure Buffer polyfill
import { Buffer } from 'buffer';

// Ensure Buffer is properly defined globally to resolve "Buffer is not defined" errors
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)
