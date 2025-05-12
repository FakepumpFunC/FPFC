import React, { useState, useEffect, Suspense, useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TopNavBar from './TopNavBar'
import HomePage from './HomePage'
import TradingPage from './TradingPage'
import RecordsPage from './RecordsPage'
import TitlePage, { HAS_ENTERED_KEY } from './TitlePage'
import PixelDialog from './components/PixelDialog'
import DonateModal from './components/DonateModal'
import { loadGameState } from './gameState'
import './App.css'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { 
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets'

// Add console log to verify imports
console.log('App component loaded', { RecordsPage });

function App() {
  // Dialog state for managing the PixelDialog
  const [dialogState, setDialogState] = useState({ 
    isOpen: false, 
    title: '', 
    message: '' 
  });
  
  // State for managing the DonateModal
  const [donateModalOpen, setDonateModalOpen] = useState(false);

  // Function to show the pixel dialog
  const showPixelDialog = (title, message) => {
    setDialogState({ isOpen: true, title, message });
  };

  // Function to hide the pixel dialog
  const hidePixelDialog = () => {
    setDialogState({ ...dialogState, isOpen: false });
  };
  
  // Function to show the donate modal
  const showDonateModal = () => {
    setDonateModalOpen(true);
  };
  
  // Function to hide the donate modal
  const hideDonateModal = () => {
    setDonateModalOpen(false);
  };

  // Initialize global game state on app startup
  useEffect(() => {
    loadGameState();
    console.log('Loaded game state');
  }, []);
  
  // Check if user has entered the game before
  const hasEntered = useMemo(() => {
    return localStorage.getItem(HAS_ENTERED_KEY) === 'true';
  }, []);

  // Define the Solana network to use (Use Mainnet for production)
  const network = WalletAdapterNetwork.Mainnet;

  // Helius API Key
  const HELIUS_API_KEY = '4fe36116-47f7-4f9a-b04c-ffc8fd735447';
  
  // Use Helius RPC endpoint instead of default clusterApiUrl
  const endpoint = useMemo(() => 
    `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`,
    [HELIUS_API_KEY]
  );

  // Memoize the list of wallet adapters to support
  const wallets = useMemo(() => [
    // 不要添加PhantomWalletAdapter，因为它已经被注册为标准钱包
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
  ], [network]);

  return (
    // Wrap the app with Solana wallet providers
    <ConnectionProvider endpoint={endpoint}> {/* Provides Solana RPC connection */}
      <WalletProvider wallets={wallets} autoConnect={true}> {/* Manages wallet state and auto-connect */}
        <WalletModalProvider> {/* Provides wallet modal UI */}
          <div className="app-wrapper">
            <TopNavBar 
              showPixelDialog={showPixelDialog}
              showDonateModal={showDonateModal}
            />
            <main className="app-content">
              <Routes>
                <Route path="/" element={hasEntered ? <Navigate to="/home" replace /> : <TitlePage />} />
                <Route path="/home" element={<HomePage showPixelDialog={showPixelDialog} />} />
                <Route path="/home/*" element={<HomePage showPixelDialog={showPixelDialog} />} />
                <Route path="/trading/:contractAddress" element={<TradingPage showPixelDialog={showPixelDialog} />} />
                <Route path="/trading" element={<TradingPage showPixelDialog={showPixelDialog} />} />
                <Route path="/trading/*" element={<TradingPage showPixelDialog={showPixelDialog} />} />
                <Route 
                  path="/records" 
                  element={
                    <Suspense fallback={<div>Loading Records...</div>}>
                      <RecordsPage showPixelDialog={showPixelDialog} />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/records/*" 
                  element={
                    <Suspense fallback={<div>Loading Records...</div>}>
                      <RecordsPage showPixelDialog={showPixelDialog} />
                    </Suspense>
                  } 
                />
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            {/* Render the PixelDialog component */}
            <PixelDialog 
              isOpen={dialogState.isOpen} 
              title={dialogState.title} 
              message={dialogState.message} 
              onClose={hidePixelDialog} 
              buttonText="OK" 
            />
            {/* Render the DonateModal component */}
            <DonateModal
              isOpen={donateModalOpen}
              onClose={hideDonateModal}
            />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
