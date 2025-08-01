'use client'

// Meta Pixel script loader component
import React, { useEffect } from 'react';
import { useMetaPixel } from '../hooks/useMetaPixel';

interface MetaPixelScriptProps {
  pixelId: string;
  testMode?: boolean;
  debug?: boolean;
  autoPageView?: boolean;
  children?: React.ReactNode;
}

export const MetaPixelScript: React.FC<MetaPixelScriptProps> = ({
  pixelId,
  testMode = process.env.NODE_ENV !== 'production',
  debug = false,
  autoPageView = true,
  children,
}) => {
  const { isInitialized } = useMetaPixel({
    pixelId,
    testMode,
    debug,
    autoPageView,
  });

  useEffect(() => {
    if (isInitialized && debug) {
      console.log('[MetaPixelScript] Meta Pixel initialized');
    }
  }, [isInitialized, debug]);

  // This component doesn't render anything visible
  return <>{children}</>;
};

// NoScript fallback for Meta Pixel
export const MetaPixelNoScript: React.FC<{ pixelId: string }> = ({ pixelId }) => {
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
};