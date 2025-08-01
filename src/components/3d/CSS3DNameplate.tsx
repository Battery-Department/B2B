'use client';

import React from 'react';

interface CSS3DNameplateProps {
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

const CSS3DNameplate: React.FC<CSS3DNameplateProps> = ({ 
  batteryData = {}, 
  text = '', 
  isDesignUpdating = false,
  width = '100%',
  height = '200px'
}) => {
  // Generate display text
  const displayText = React.useMemo(() => {
    if (batteryData.companyName) return batteryData.companyName;
    const fullName = `${batteryData.firstName || ''} ${batteryData.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (text) return text;
    return 'FlexVolt Battery';
  }, [batteryData, text]);

  return (
    <div 
      style={{ width, height }} 
      className="relative rounded-lg overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200"
    >
      {/* Status indicator */}
      <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded">
        CSS 3D Active
      </div>
      
      {/* 3D Scene Container */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          perspective: '800px',
          perspectiveOrigin: '50% 50%'
        }}
      >
        {/* 3D Nameplate */}
        <div
          className="relative"
          style={{
            width: '280px',
            height: '80px',
            transformStyle: 'preserve-3d',
            transform: 'rotateX(15deg) rotateY(-10deg)',
            animation: 'gentle-float 6s ease-in-out infinite'
          }}
        >
          {/* Main nameplate face */}
          <div
            className="absolute inset-0 rounded-lg shadow-2xl flex items-center justify-center text-center px-4"
            style={{
              background: 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 50%, #a0a0a0 100%)',
              border: '2px solid #b0b0b0',
              borderRadius: '8px',
              transform: 'translateZ(4px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
            }}
          >
            <div className="w-full">
              {/* Company name or main text */}
              <div 
                className="font-bold text-gray-800 leading-tight"
                style={{
                  fontSize: batteryData.companyName ? '16px' : '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  letterSpacing: '0.5px'
                }}
              >
                {displayText}
              </div>
              
              {/* Additional info */}
              {batteryData.companyName && (
                <div className="mt-1">
                  {batteryData.firstName && batteryData.lastName && (
                    <div 
                      className="text-gray-700 text-xs"
                      style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}
                    >
                      {batteryData.firstName} {batteryData.lastName}
                    </div>
                  )}
                  
                  {(batteryData.phoneNumber || batteryData.website) && (
                    <div 
                      className="text-gray-600 text-xs mt-1"
                      style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}
                    >
                      {[batteryData.phoneNumber, batteryData.website].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              )}
              
              {/* Subtitle */}
              <div 
                className="text-gray-500 text-xs mt-2 font-medium"
                style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}
              >
                Theft Proof Engraving
              </div>
            </div>
          </div>
          
          {/* Depth/side faces for 3D effect */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-gradient(90deg, #909090 0%, #707070 100%)',
              transform: 'translateZ(0px) translateY(2px) translateX(2px)',
              borderRadius: '8px',
              opacity: 0.8,
              zIndex: -1
            }}
          />
          
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-gradient(90deg, #808080 0%, #606060 100%)',
              transform: 'translateZ(-2px) translateY(4px) translateX(4px)',
              borderRadius: '8px',
              opacity: 0.6,
              zIndex: -2
            }}
          />
          
          {/* Bottom shadow */}
          <div
            className="absolute rounded-lg"
            style={{
              width: '290px',
              height: '85px',
              left: '50%',
              top: '50%',
              marginLeft: '-145px',
              marginTop: '-42.5px',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
              transform: 'translateZ(-10px) rotateX(90deg)',
              borderRadius: '50%'
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes gentle-float {
          0%, 100% { transform: rotateX(15deg) rotateY(-10deg) translateY(0px); }
          50% { transform: rotateX(15deg) rotateY(-10deg) translateY(-3px); }
        }
        
        /* Additional metallic effect */
        .nameplate-shine {
          position: relative;
          overflow: hidden;
        }
        
        .nameplate-shine::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          transform: rotate(45deg);
          animation: shine 3s ease-in-out infinite;
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50% { transform: translateX(-50%) translateY(-50%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      `}</style>
    </div>
  );
};

export default CSS3DNameplate;