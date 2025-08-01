'use client'

// React hook for Meta Pixel integration
import { useEffect, useCallback, useRef } from 'react';
import { MetaPixel as MetaPixelService } from '../services/meta/pixel';
import { EventData, UserData } from '../services/meta/types';

interface UseMetaPixelOptions {
  pixelId: string;
  testMode?: boolean;
  debug?: boolean;
  autoPageView?: boolean;
}

export function useMetaPixel(options: UseMetaPixelOptions) {
  const pixelServiceRef = useRef<MetaPixelService>();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      const config = {
        pixelId: options.pixelId,
        testMode: options.testMode ?? process.env.NODE_ENV !== 'production',
        debug: options.debug,
        autoConfig: true,
      };

      pixelServiceRef.current = MetaPixelService.getInstance(config);
      pixelServiceRef.current.initialize().then(() => {
        isInitializedRef.current = true;
        
        if (options.autoPageView !== false) {
          // Page view is automatically tracked on initialization
        }
      });
    }
  }, [options.pixelId, options.testMode, options.debug, options.autoPageView]);

  const track = useCallback((eventName: string, data?: EventData) => {
    if (pixelServiceRef.current) {
      pixelServiceRef.current.track(eventName, data);
    }
  }, []);

  const trackCustom = useCallback((eventName: string, data?: any) => {
    if (pixelServiceRef.current) {
      pixelServiceRef.current.trackCustom(eventName, data);
    }
  }, []);

  const setUserData = useCallback((userData: UserData) => {
    if (pixelServiceRef.current) {
      pixelServiceRef.current.setUserData(userData);
    }
  }, []);

  const updateDataLayer = useCallback((key: string, value: any) => {
    if (pixelServiceRef.current) {
      pixelServiceRef.current.updateDataLayer(key, value);
    }
  }, []);

  const enableAdvancedMatching = useCallback((userData: UserData) => {
    if (pixelServiceRef.current) {
      pixelServiceRef.current.enableAdvancedMatching(userData);
    }
  }, []);

  const setDataProcessingOptions = useCallback(
    (options: string[] = [], country?: number, state?: number) => {
      if (pixelServiceRef.current) {
        pixelServiceRef.current.setDataProcessingOptions(options, country, state);
      }
    },
    []
  );

  const getTestModeEvents = useCallback(() => {
    if (pixelServiceRef.current) {
      return pixelServiceRef.current.getTestModeEvents();
    }
    return [];
  }, []);

  const clearTestModeEvents = useCallback(() => {
    if (pixelServiceRef.current) {
      pixelServiceRef.current.clearTestModeEvents();
    }
  }, []);

  return {
    track,
    trackCustom,
    setUserData,
    updateDataLayer,
    enableAdvancedMatching,
    setDataProcessingOptions,
    getTestModeEvents,
    clearTestModeEvents,
    isInitialized: isInitializedRef.current,
  };
}