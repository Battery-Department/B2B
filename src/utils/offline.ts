/**
 * Offline utility functions for RHY Batch 2
 * Provides offline detection and data synchronization capabilities
 */

'use client';

import { useState, useEffect } from 'react';

export interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
  connectionType: string | null;
}

/**
 * Hook to detect online/offline status
 */
export function useOfflineStatus(): OfflineState {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online && isOnline) {
        setLastOnline(new Date());
      }
      
      // Check connection type if available
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    // Initial check
    updateOnlineStatus();

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnline,
    connectionType,
  };
}

/**
 * Store data for offline access
 */
export function storeOfflineData(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    const offlineData = {
      data,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(`offline_${key}`, JSON.stringify(offlineData));
  } catch (error) {
    console.warn('Failed to store offline data:', error);
  }
}

/**
 * Retrieve offline data
 */
export function getOfflineData(key: string): any | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(`offline_${key}`);
    if (!stored) return null;
    
    const offlineData = JSON.parse(stored);
    return offlineData.data;
  } catch (error) {
    console.warn('Failed to retrieve offline data:', error);
    return null;
  }
}

/**
 * Clear offline data
 */
export function clearOfflineData(key?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (key) {
      localStorage.removeItem(`offline_${key}`);
    } else {
      // Clear all offline data
      const keys = Object.keys(localStorage).filter(k => k.startsWith('offline_'));
      keys.forEach(k => localStorage.removeItem(k));
    }
  } catch (error) {
    console.warn('Failed to clear offline data:', error);
  }
}

/**
 * Check if data should be refreshed
 */
export function shouldRefreshData(key: string, maxAge: number = 300000): boolean {
  if (typeof window === 'undefined') return true;
  
  try {
    const stored = localStorage.getItem(`offline_${key}`);
    if (!stored) return true;
    
    const offlineData = JSON.parse(stored);
    const storedTime = new Date(offlineData.timestamp).getTime();
    const now = new Date().getTime();
    
    return (now - storedTime) > maxAge;
  } catch (error) {
    return true;
  }
}

// Export alias for compatibility
export const useOnlineStatus = useOfflineStatus;