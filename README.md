# Solana Pixel Trader

A retro-style pixel art trading simulator for Solana tokens with real-time price data.

## 🎮 Project Overview

Solana Pixel Trader (also known as "Pixel Pump Arcade") is a browser-based game that allows users to:

- Enter Solana token contract addresses
- View simulated price charts for those tokens
- Practice trading with virtual SOL
- Track performance and trading history

The application features a nostalgic pixel-art UI with retro gaming aesthetics, using the "Press Start 2P" font and pixel-perfect design elements.

## 📋 Features

- **Token Loading**: Enter a Solana contract address to load token data
- **Simulated Trading**: Practice buying and selling with virtual SOL
- **Pixel Art Interface**: Enjoy a retro gaming aesthetic
- **Performance Tracking**: View your trading history and results (coming soon)
- **Settings Customization**: Adjust game parameters (coming soon)

## 🎨 Pixel Art Implementation

The application features a stylized pixel art cityscape background:

- **Gradient Sunset Sky**: A vibrant gradient from deep purple to bright orange creates a sunset effect
- **Building Silhouettes**: Vector-based city skyline silhouettes create depth at the bottom of the screen
- **Window Lights**: Yellow/orange pixel lights in buildings provide a nighttime city feel
- **Semi-transparent Elements**: Main content container uses transparency and backdrop blur for a modern retro look

The background is implemented using fixed positioning to create a non-scrolling backdrop while allowing the main content to scroll independently, ensuring proper display on various device sizes.

## 🛠️ Tech Stack

- **Frontend Framework**: React with Vite
- **UI Components**: Custom CSS with pixel art styling
- **Icons**: Heroicons
- **Font**: "Press Start 2P" from Google Fonts

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/solana-pixel-trader.git
   cd solana-pixel-trader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## 📱 Project Structure

- `src/`
  - `main.jsx` - Application entry point
  - `App.jsx` - Main application component
  - `HomePage.jsx` - Landing page component
  - `HomePage.css` - Styles for the homepage
  - `index.css` - Global styles including background implementation
  - `assets/` - Static assets

## 🎨 Design System

The project follows a retro pixel art aesthetic with:

- **Color Palette**:
  - Dark blue/purple backgrounds (`#1a1a2e`, `#2c2c44`)
  - Sunset gradient from purple (`#2b0f44`) to orange (`#ffc833`)
  - Retro orange for buttons (`#f0a04b`)
  - Green for action buttons (`#5cb85c`)
  - Light gray for text (`#e0e0e0`)

- **Typography**:
  - Primary Font: "Press Start 2P" (Google Fonts)
  - Pixel-perfect rendering

- **UI Elements**:
  - Pixelated borders (2-4px)
  - Simple pixel shadows (2px offset)
  - Retro button designs with hover/active states
  - Fixed position info panels for stats and market data

## ⚠️ Disclaimer

This application does not involve real cryptocurrency and is intended for educational and entertainment purposes only. No actual trading occurs, and no real money is used or at risk.

## 📄 License

MIT

## Features

### Real-time Price Data
- **Ave.ai Integration**: Integrated with Ave.ai API for real-time USD price data
- **Chart Price Synchronization**: Displays price data from GMGN charts for consistent display
- **Fallback Mechanisms**: Graceful handling when external APIs are unavailable

### Trading Page
- **Live Price Display**: Shows current token price with change indicators
- **Interactive Chart**: Embedded GMGN chart for technical analysis
- **Buy/Sell Interface**: Simulated trading interface with pixel art styling

## Chart Price Sync Implementation

The TradingPage features price synchronization between the header display and the embedded GMGN chart:

1. **Price Source Indicator**: Shows whether price data is from API or chart
2. **Sync Status**: Visual indicator showing when prices were last synchronized
3. **Fallback System**: If API prices cannot be fetched, chart prices are used instead

### Technical Implementation

Due to cross-origin restrictions that prevent direct access to iframe content:

- **Simulated Chart Data**: For development, we use a simulation that generates prices consistent with the chart
- **Periodic Sync**: Price data is refreshed every 5 seconds to stay consistent with chart
- **Visual Feedback**: Users can see when prices were last synced from the chart

In a production environment, this would be enhanced with:
- Direct API access to GMGN's price data
- Server-side proxy for secure API key handling
- WebSocket implementation for real-time updates

## Development

```
npm install
npm run dev
```

Visit the trading page by navigating to `/trading/{contractAddress}` where `contractAddress` is any valid Solana token address.

## Styling

All components use pixel art styling for a retro gaming aesthetic, with responsive design for all device sizes.

## 🔑 Solana Wallet Connection (NEW)

You can now connect your Solana wallet (e.g., Phantom, OKX) to the game for a more immersive experience. This feature uses the official Solana Wallet Adapter libraries.

### How to Use
- Click the "Connect Wallet" button in the top-right of the navigation bar.
- A modal will appear allowing you to select and connect your wallet (Phantom, OKX, etc.).
- Once connected, the button changes to "Disconnect" and shows a green border.
- Your connected wallet address (truncated) will appear in the top-left player info area, replacing the default player name.
- Click "Disconnect" to disconnect your wallet at any time.

### Libraries Used
- `@solana/wallet-adapter-react`
- `@solana/wallet-adapter-react-ui`
- `@solana/wallet-adapter-base`
- `@solana/web3.js`
- `@solana/wallet-standard`
- `@solana/wallet-adapter-wallets`

### Styling
- The connect button turns green when connected.
- The wallet modal uses the default Solana Wallet Adapter UI theme.
