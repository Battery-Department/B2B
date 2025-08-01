'use client';

import React, { useState } from 'react';

interface LogoArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LogoPlacementProps {
  area: LogoArea;
  logoUrl?: string;
}

const LogoPlacement: React.FC<LogoPlacementProps> = ({
  area,
  logoUrl
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Default company icon when no logo is provided
  const DefaultLogoIcon = () => (
    <svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-600"
    >
      <path 
        d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" 
        fill="currentColor"
        opacity="0.6"
      />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    </svg>
  );

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height
      }}
    >
      {/* Development helper - show logo boundary */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute inset-0 border border-blue-300 opacity-30 rounded" />
      )}

      {/* Logo Content */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{
          padding: '4px' // Small padding to prevent logo from touching edges
        }}
      >
        {logoUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={logoUrl}
              alt="Company Logo"
              className="max-w-full max-h-full object-contain"
              style={{
                filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))', // Engraved effect
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          // Default logo placeholder
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
              maxWidth: '80%',
              maxHeight: '80%'
            }}
          >
            <DefaultLogoIcon />
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoPlacement;