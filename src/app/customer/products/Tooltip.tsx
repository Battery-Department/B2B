'use client';

import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const getPositionStyles = () => {
    const base = {
      position: 'absolute' as const,
      zIndex: 1000,
      backgroundColor: '#1F2937',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '1.5',
      maxWidth: '280px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      opacity: isVisible || isClicked ? 1 : 0,
      transform: isVisible || isClicked ? 'scale(1) translate(0, 0)' : 'scale(0.95) translate(0, 4px)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none' as const,
    };

    switch (position) {
      case 'top':
        return {
          ...base,
          bottom: '100%',
          left: '50%',
          transform: isVisible || isClicked 
            ? 'translateX(-50%) translateY(-8px) scale(1)' 
            : 'translateX(-50%) translateY(-4px) scale(0.95)',
          marginBottom: '8px',
        };
      case 'bottom':
        return {
          ...base,
          top: '100%',
          left: '50%',
          transform: isVisible || isClicked 
            ? 'translateX(-50%) translateY(8px) scale(1)' 
            : 'translateX(-50%) translateY(4px) scale(0.95)',
          marginTop: '8px',
        };
      case 'left':
        return {
          ...base,
          right: '100%',
          top: '50%',
          transform: isVisible || isClicked 
            ? 'translateY(-50%) translateX(-8px) scale(1)' 
            : 'translateY(-50%) translateX(-4px) scale(0.95)',
          marginRight: '8px',
        };
      case 'right':
        return {
          ...base,
          left: '100%',
          top: '50%',
          transform: isVisible || isClicked 
            ? 'translateY(-50%) translateX(8px) scale(1)' 
            : 'translateY(-50%) translateX(4px) scale(0.95)',
          marginLeft: '8px',
        };
      default:
        return base;
    }
  };

  const getArrowStyles = () => {
    const base = {
      position: 'absolute' as const,
      width: '0',
      height: '0',
      borderStyle: 'solid',
    };

    switch (position) {
      case 'top':
        return {
          ...base,
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '8px 8px 0 8px',
          borderColor: '#1F2937 transparent transparent transparent',
        };
      case 'bottom':
        return {
          ...base,
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '0 8px 8px 8px',
          borderColor: 'transparent transparent #1F2937 transparent',
        };
      case 'left':
        return {
          ...base,
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: '8px 0 8px 8px',
          borderColor: 'transparent transparent transparent #1F2937',
        };
      case 'right':
        return {
          ...base,
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: '8px 8px 8px 0',
          borderColor: 'transparent #1F2937 transparent transparent',
        };
      default:
        return base;
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsClicked(!isClicked)}
    >
      {children}
      <div style={getPositionStyles()}>
        <div style={getArrowStyles()} />
        {content}
      </div>
    </div>
  );
};

export default Tooltip;