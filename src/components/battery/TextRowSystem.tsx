'use client';

import React from 'react';

interface TextArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextRowSystemProps {
  area: TextArea;
  textRow1?: string;
  textRow2?: string;
}

const TextRowSystem: React.FC<TextRowSystemProps> = ({
  area,
  textRow1 = 'YOUR COMPANY',
  textRow2 = 'Phone • Website'
}) => {
  // Calculate row positioning
  const row1Area = {
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height * 0.45 // 45% of text area height
  };

  const row2Area = {
    x: area.x,
    y: area.y + area.height * 0.55, // Start after row 1 + gap
    width: area.width,
    height: area.height * 0.35 // 35% of text area height
  };

  // Calculate responsive font sizes based on area size
  const baseFontSize = Math.min(area.width, area.height) * 0.08; // Base size as percentage of area
  const row1FontSize = Math.max(baseFontSize, 12); // Minimum 12px
  const row2FontSize = Math.max(baseFontSize * 0.75, 10); // Smaller for row 2, minimum 10px

  return (
    <div
      className="absolute"
      style={{
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height
      }}
    >
      {/* Development helper - show text area boundary */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute inset-0 border border-green-300 opacity-30 rounded" />
      )}

      {/* Text Row 1 - Primary (Company Name) */}
      <div
        className="absolute flex items-center"
        style={{
          left: 0,
          top: 0,
          width: row1Area.width,
          height: row1Area.height
        }}
      >
        {/* Development helper */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute inset-0 border border-green-500 opacity-20" />
        )}
        
        <div
          className="w-full text-center font-bold text-black leading-tight"
          style={{
            fontSize: `${row1FontSize}px`,
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)', // Engraved effect
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '0.5px',
            wordBreak: 'break-word',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2, // Max 2 lines
            WebkitBoxOrient: 'vertical' as const
          }}
        >
          {textRow1.toUpperCase()}
        </div>
      </div>

      {/* Text Row 2 - Secondary (Contact Info) */}
      <div
        className="absolute flex items-center"
        style={{
          left: 0,
          top: row2Area.y - area.y,
          width: row2Area.width,
          height: row2Area.height
        }}
      >
        {/* Development helper */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute inset-0 border border-green-600 opacity-20" />
        )}
        
        <div
          className="w-full text-center font-medium text-gray-800 leading-tight"
          style={{
            fontSize: `${row2FontSize}px`,
            textShadow: '1px 1px 1px rgba(0, 0, 0, 0.25)', // Subtle engraved effect
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '0.3px',
            wordBreak: 'break-word',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2, // Max 2 lines
            WebkitBoxOrient: 'vertical' as const
          }}
        >
          {textRow2}
        </div>
      </div>
    </div>
  );
};

export default TextRowSystem;