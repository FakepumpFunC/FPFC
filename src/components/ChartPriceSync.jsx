import React, { useState, useEffect, useCallback } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import './ChartPriceSync.css';

/**
 * Component that syncs the price display with the chart
 * @param {object} props - Component props
 * @param {string} props.contractAddress - The token contract address
 */
const ChartPriceSync = ({ contractAddress }) => {
  const [syncState, setSyncState] = useState({
    isActive: false,
    lastSynced: null,
    interval: 60000, // 60 seconds between syncs
    status: 'idle'
  });

  // Function to fetch the latest price from the chart
  const syncWithChart = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      setSyncState(prev => ({ ...prev, status: 'syncing' }));
      
      // In a real implementation, we would fetch actual data from the chart iframe
      // For now, we'll just indicate that we're waiting for a real API
      setSyncState(prev => ({ ...prev, status: 'waiting' }));
      
      // We don't simulate or provide fake price data anymore
      console.log('Chart price sync is disabled - waiting for real API integration');
      
    } catch (error) {
      console.error('Error syncing with chart price:', error);
      setSyncState(prev => ({ ...prev, status: 'error' }));
    }
  }, [contractAddress]);
  
  // Initial setup and interval for syncing
  useEffect(() => {
    if (!contractAddress) return;
    
    // Initial state
    setSyncState(prev => ({ 
      ...prev, 
      isActive: true,
      status: 'waiting' 
    }));
    
    // We don't actually need the interval anymore since we're not doing anything
    // but we'll keep it for future real integration
    const intervalId = setInterval(syncWithChart, syncState.interval);
    
    // Cleanup function
    return () => {
      clearInterval(intervalId);
      setSyncState(prev => ({ ...prev, isActive: false }));
    };
  }, [contractAddress, syncState.interval, syncWithChart]);
  
  // Format the time since last sync
  const formatTimeSince = (date) => {
    if (!date) return 'Never';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    return `${Math.floor(seconds / 60)} minutes ago`;
  };
  
  // Render sync status indicator
  return (
    <div className={`chart-price-sync ${syncState.status}`}>
      <div className="sync-info">
        <InformationCircleIcon className="info-icon" />
        <span className="sync-label">Chart Sync:</span>
        <span className="sync-status">
          {syncState.status === 'syncing' ? 'Syncing...' : 
           syncState.status === 'success' ? 'Synced' :
           syncState.status === 'error' ? 'Failed' : 'Waiting for API'}
        </span>
        {syncState.lastSynced && (
          <span className="sync-time">({formatTimeSince(syncState.lastSynced)})</span>
        )}
      </div>
    </div>
  );
};

export default ChartPriceSync; 