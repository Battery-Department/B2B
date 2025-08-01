'use client';

import React from 'react';

interface SimpleFallbackNameplateProps {
  batteryData?: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    website?: string;
  };
  text?: string;
  isDesignUpdating?: boolean;
  width?: string;
  height?: string;
}

const SimpleFallbackNameplate: React.FC<SimpleFallbackNameplateProps> = ({ 
  batteryData = {}, 
  text = '', 
  width = '100%',
  height = '200px'
}) => {
  return (
    <div 
      style={{ width, height }} 
      className="rounded-lg overflow-hidden bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 flex items-center justify-center shadow-lg border-2 border-gray-400"
    >
      <div className="text-center p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-inner border border-gray-300 max-w-sm">
        <div className="text-gray-700 font-medium mb-3 text-lg">Stainless Steel Nameplate</div>
        
        {/* Preview of engraved text */}
        <div className="space-y-2">
          {batteryData.companyName && (
            <div className="text-gray-800 font-bold text-lg tracking-wide">
              {batteryData.companyName}
            </div>
          )}
          
          {(batteryData.firstName || batteryData.lastName) && (
            <div className="text-gray-700 font-medium">
              {batteryData.firstName} {batteryData.lastName}
            </div>
          )}
          
          {batteryData.phoneNumber && (
            <div className="text-gray-600 text-sm">
              {batteryData.phoneNumber}
            </div>
          )}
          
          {batteryData.website && (
            <div className="text-gray-600 text-sm">
              {batteryData.website}
            </div>
          )}
          
          {text && !Object.values(batteryData).some(value => value) && (
            <div className="text-gray-700 font-medium">
              {text}
            </div>
          )}
          
          {/* Theft Proof Engraving subtitle */}
          <div className="text-gray-500 text-xs mt-3 font-medium">
            Theft Proof Engraving
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-3">
          2D Preview (3D unavailable)
        </div>
      </div>
    </div>
  );
};

export default SimpleFallbackNameplate;