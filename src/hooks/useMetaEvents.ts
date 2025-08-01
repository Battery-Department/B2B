'use client'

// React hook for unified Meta event tracking
import { useEffect, useCallback, useRef } from 'react';
import { MetaEventManager } from '../services/meta/event-manager';
import { EventData, UserData, ServerEvent } from '../services/meta/types';

interface UseMetaEventsOptions {
  pixelId: string;
  accessToken?: string;
  testMode?: boolean;
  debug?: boolean;
  enablePixel?: boolean;
  enableCAPI?: boolean;
  testEventCode?: string;
}

export function useMetaEvents(options: UseMetaEventsOptions) {
  const eventManagerRef = useRef<MetaEventManager>();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      const config = {
        enablePixel: options.enablePixel !== false,
        enableCAPI: !!options.accessToken && options.enableCAPI !== false,
        pixelConfig: options.enablePixel !== false ? {
          pixelId: options.pixelId,
          testMode: options.testMode ?? process.env.NODE_ENV !== 'production',
          debug: options.debug,
        } : undefined,
        capiConfig: options.accessToken && options.enableCAPI !== false ? {
          accessToken: options.accessToken,
          pixelId: options.pixelId,
          testMode: options.testMode ?? process.env.NODE_ENV !== 'production',
          testEventCode: options.testEventCode,
          debug: options.debug,
        } : undefined,
      };

      eventManagerRef.current = MetaEventManager.getInstance(config);
      isInitializedRef.current = true;
    }
  }, [
    options.pixelId,
    options.accessToken,
    options.testMode,
    options.debug,
    options.enablePixel,
    options.enableCAPI,
    options.testEventCode,
  ]);

  const track = useCallback(
    async (
      eventName: string,
      data?: EventData,
      options?: {
        source?: 'pixel' | 'capi' | 'both';
        userData?: UserData;
        actionSource?: ServerEvent['action_source'];
      }
    ) => {
      if (eventManagerRef.current) {
        await eventManagerRef.current.track(eventName, data, options);
      }
    },
    []
  );

  const trackCustom = useCallback(
    async (
      eventName: string,
      data?: any,
      options?: {
        source?: 'pixel' | 'capi' | 'both';
        userData?: UserData;
      }
    ) => {
      if (eventManagerRef.current) {
        await eventManagerRef.current.trackCustom(eventName, data, options);
      }
    },
    []
  );

  const setUserData = useCallback((userData: UserData) => {
    if (eventManagerRef.current) {
      eventManagerRef.current.setUserData(userData);
    }
  }, []);

  const updateDataLayer = useCallback((key: string, value: any) => {
    if (eventManagerRef.current) {
      eventManagerRef.current.updateDataLayer(key, value);
    }
  }, []);

  const setDataProcessingOptions = useCallback(
    (options: string[], country?: number, state?: number) => {
      if (eventManagerRef.current) {
        eventManagerRef.current.setDataProcessingOptions(options, country, state);
      }
    },
    []
  );

  const enableLimitedDataUse = useCallback(() => {
    if (eventManagerRef.current) {
      eventManagerRef.current.enableLimitedDataUse();
    }
  }, []);

  const disableDataProcessing = useCallback(() => {
    if (eventManagerRef.current) {
      eventManagerRef.current.disableDataProcessing();
    }
  }, []);

  const getEventHistory = useCallback(() => {
    if (eventManagerRef.current) {
      return eventManagerRef.current.getEventHistory();
    }
    return [];
  }, []);

  const getMatchedEvents = useCallback((timeWindow?: number) => {
    if (eventManagerRef.current) {
      return eventManagerRef.current.getMatchedEvents(timeWindow);
    }
    return [];
  }, []);

  const flush = useCallback(async () => {
    if (eventManagerRef.current) {
      await eventManagerRef.current.flush();
    }
  }, []);

  const getStatus = useCallback(() => {
    if (eventManagerRef.current) {
      return eventManagerRef.current.getStatus();
    }
    return {
      pixel: { enabled: false, initialized: false },
      capi: { enabled: false },
      eventHistory: 0,
    };
  }, []);

  const exportEvents = useCallback((format: 'json' | 'csv' = 'json') => {
    if (eventManagerRef.current) {
      return eventManagerRef.current.exportEvents(format);
    }
    return format === 'json' ? '[]' : '';
  }, []);

  return {
    track,
    trackCustom,
    setUserData,
    updateDataLayer,
    setDataProcessingOptions,
    enableLimitedDataUse,
    disableDataProcessing,
    getEventHistory,
    getMatchedEvents,
    flush,
    getStatus,
    exportEvents,
    isInitialized: isInitializedRef.current,
  };
}