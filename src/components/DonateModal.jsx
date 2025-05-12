import React, { useState, useEffect } from 'react';
import './DonateModal.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { sendSolTransfer, processDonationReward } from '../services/solanaService';

function DonateModal({ isOpen, onClose }) {
  // Get wallet state from Wallet Adapter
  const { publicKey, connected, sendTransaction } = useWallet();

  // State for the SOL amount input
  const [solAmountInput, setSolAmountInput] = useState('0.1');
  
  // State for the calculated $RugDevSol amount
  const [rugDevSolReceiveAmount, setRugDevSolReceiveAmount] = useState(100000);
  
  // State for transaction status
  const [transactionStatus, setTransactionStatus] = useState('idle'); // 'idle', 'prompting_wallet', 'sending', 'confirming', 'success', 'failed', 'cancelled'
  
  // State for error message
  const [transactionError, setTransactionError] = useState(null);
  
  // Define the exchange rate constant
  const EXCHANGE_RATE = 1_000_000; // 1 SOL = 1,000,000 $RugDevSol

  // Calculate the $RugDevSol amount whenever the input changes
  useEffect(() => {
    const sol = parseFloat(solAmountInput);
    if (!isNaN(sol) && sol >= 0) {
      const received = sol * EXCHANGE_RATE;
      setRugDevSolReceiveAmount(received.toFixed(0));
    } else {
      setRugDevSolReceiveAmount(0);
    }
  }, [solAmountInput]);

  // Reset transaction status when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTransactionStatus('idle');
      setTransactionError(null);
    }
  }, [isOpen]);

  const handleDonate = async () => {
    // Validate input
    const solAmount = parseFloat(solAmountInput);
    
    if (isNaN(solAmount) || solAmount <= 0) {
      setTransactionError('Please enter a valid SOL amount');
      setTransactionStatus('failed');
      return;
    }
    
    // Check if wallet is connected
    if (!connected || !publicKey) {
      setTransactionError('Please connect your wallet first');
      setTransactionStatus('failed');
      return;
    }
    
    try {
      // Update status to prompting wallet
      setTransactionStatus('prompting_wallet');
      setTransactionError(null);
      
      // Send the transaction
      const signature = await sendSolTransfer(
        publicKey,
        solAmount,
        sendTransaction
      );
      
      // Update status to confirming
      setTransactionStatus('confirming');
      
      // Process the reward
      const result = await processDonationReward(solAmount, signature);
      
      // Update status based on result
      if (result === 'success') {
        setTransactionStatus('success');
        // Close modal after 3 seconds on success
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setTransactionStatus('failed');
        setTransactionError('Transaction failed to confirm on the blockchain');
      }
    } catch (error) {
      console.error('Donation error:', error);
      setTransactionStatus('failed');
      
      // Detect if user rejected the transaction
      if (error.message?.includes('User rejected')) {
        setTransactionError('Transaction was cancelled');
        setTransactionStatus('cancelled');
      } else {
        setTransactionError(error.message || 'Unknown error occurred');
      }
    }
  };
  
  // Handle quick button clicks
  const handleQuickButtonClick = (amount) => {
    setSolAmountInput(amount);
  };

  // Get appropriate status message
  const getStatusMessage = () => {
    switch (transactionStatus) {
      case 'prompting_wallet':
        return 'Please confirm in your wallet...';
      case 'sending':
        return 'Sending transaction...';
      case 'confirming':
        return 'Confirming transaction on blockchain...';
      case 'success':
        return `Success! You received ${Number(rugDevSolReceiveAmount).toLocaleString()} $RugDevSol!`;
      case 'failed':
        return `Transaction failed: ${transactionError || 'Unknown error'}`;
      case 'cancelled':
        return 'Transaction was cancelled';
      default:
        return null;
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="donate-modal-overlay">
      <div className="donate-modal-box">
        <h2 className="donate-modal-title">Offering to the Meme Gods</h2>
        
        <div className="donate-modal-content">
          <p className="donate-modal-text">
            Make an offering to the Meme Gods to receive virtual $RugDevSol tokens.
            These tokens can be used for trading in our pixel market.
          </p>
          
          <div className="donate-rate">
            <span className="donate-rate-text">Exchange Rate:</span>
            <span className="donate-rate-value">1 SOL = 1,000,000 $RugDevSol</span>
          </div>
          
          <div className="donate-input-group">
            <label htmlFor="sol-amount">SOL Amount:</label>
            <input 
              type="number" 
              id="sol-amount" 
              className="donate-input" 
              placeholder="0.1" 
              min="0"
              step="any"
              value={solAmountInput}
              onChange={(e) => setSolAmountInput(e.target.value)}
              disabled={transactionStatus !== 'idle' && transactionStatus !== 'failed' && transactionStatus !== 'cancelled'}
            />
            
            <div className="quick-donate-buttons">
              <button 
                className="quick-donate-button"
                onClick={() => handleQuickButtonClick('0.1')}
                disabled={transactionStatus !== 'idle' && transactionStatus !== 'failed' && transactionStatus !== 'cancelled'}
              >
                0.1 SOL
              </button>
              <button 
                className="quick-donate-button"
                onClick={() => handleQuickButtonClick('0.5')}
                disabled={transactionStatus !== 'idle' && transactionStatus !== 'failed' && transactionStatus !== 'cancelled'}
              >
                0.5 SOL
              </button>
              <button 
                className="quick-donate-button"
                onClick={() => handleQuickButtonClick('1')}
                disabled={transactionStatus !== 'idle' && transactionStatus !== 'failed' && transactionStatus !== 'cancelled'}
              >
                1 SOL
              </button>
            </div>
          </div>
          
          <div className="donate-result">
            <span>You will receive:</span>
            <span className="donate-result-value">
              {Number(rugDevSolReceiveAmount).toLocaleString()} $RugDevSol
            </span>
          </div>
          
          {/* Transaction status message */}
          {getStatusMessage() && (
            <div className={`transaction-status ${transactionStatus}`}>
              {getStatusMessage()}
            </div>
          )}
          
          <div className="donate-buttons">
            <button 
              className="donate-button"
              onClick={handleDonate}
              disabled={
                !connected || 
                (transactionStatus !== 'idle' && 
                 transactionStatus !== 'failed' && 
                 transactionStatus !== 'cancelled')
              }
            >
              {!connected ? 'Connect Wallet First' : 'Make Offering'}
            </button>
            <button 
              className="donate-cancel-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonateModal; 