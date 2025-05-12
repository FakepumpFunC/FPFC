// src/services/solanaService.js - Service for Solana blockchain interactions
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { updateBalance } from '../gameState';

// Constants
const RECIPIENT_ADDRESS = new PublicKey('BhRzigHmEKFMcPiBuK3RPMFg8n53pg8nRhnh5GuSh9Lf');
const HELIUS_API_KEY = '4fe36116-47f7-4f9a-b04c-ffc8fd735447';
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;
const EXCHANGE_RATE = 1_000_000; // 1 SOL = 1,000,000 $RugDevSol

// Create a connection to the Solana network
const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

/**
 * Sends SOL from the connected wallet to the recipient address
 * @param {PublicKey} senderPublicKey - The sender's public key
 * @param {number} solAmount - Amount of SOL to send
 * @param {Function} sendTransaction - The wallet adapter's sendTransaction function
 * @returns {Promise<string>} Transaction signature
 */
export async function sendSolTransfer(senderPublicKey, solAmount, sendTransaction) {
  try {
    // Convert SOL amount to lamports
    const lamports = solAmount * LAMPORTS_PER_SOL;
    
    // Create a transfer instruction
    const instruction = SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: RECIPIENT_ADDRESS,
      lamports
    });
    
    // Create a transaction and add the instruction
    const transaction = new Transaction().add(instruction);
    
    // Get the latest blockhash
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    
    // Set the fee payer
    transaction.feePayer = senderPublicKey;
    
    // Sign and send the transaction using the wallet adapter
    const signature = await sendTransaction(transaction, connection);
    
    return signature;
  } catch (error) {
    console.error('Error sending SOL transfer:', error);
    throw error;
  }
}

/**
 * Confirms a transaction's status on the blockchain
 * @param {string} signature - Transaction signature
 * @returns {Promise<boolean>} True if confirmed and successful, false otherwise
 */
export async function confirmTransactionStatus(signature) {
  try {
    // First try the basic RPC confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (!confirmation?.value?.err) {
      // For enhanced confirmation, check transaction details with Helius API
      const response = await fetch(`https://api.helius.xyz/v0/transactions?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [signature] })
      });
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the transaction was successful
      if (data.length > 0 && data[0].successful) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error confirming transaction status:', error);
    return false;
  }
}

/**
 * Processes a donation reward after transaction confirmation
 * @param {number} solAmountSent - Amount of SOL sent
 * @param {string} transactionSignature - Transaction signature
 * @returns {Promise<string>} Status ('success', 'failed', etc.)
 */
export async function processDonationReward(solAmountSent, transactionSignature) {
  try {
    // Wait for transaction confirmation
    const isConfirmed = await confirmTransactionStatus(transactionSignature);
    
    if (isConfirmed) {
      // Calculate reward amount
      const rugDevSolReward = solAmountSent * EXCHANGE_RATE;
      
      // Update player balance
      updateBalance(rugDevSolReward);
      
      // Add trade record if needed here
      
      return 'success';
    } else {
      return 'failed';
    }
  } catch (error) {
    console.error('Error processing donation reward:', error);
    return 'error';
  }
} 