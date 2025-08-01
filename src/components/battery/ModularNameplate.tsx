'use client';

import React from 'react';
import LogoPlacement from './LogoPlacement';
import TextRowSystem from './TextRowSystem';

interface NameplateArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ModularNameplateProps {
  containerWidth: number;
  containerHeight: number;
  nameplateArea: NameplateArea;
  companyLogo?: string;
  textRow1?: string;
  textRow2?: string;
}

const ModularNameplate: React.FC<ModularNameplateProps> = ({
  containerWidth,
  containerHeight,
  nameplateArea,
  companyLogo,
  textRow1 = 'YOUR COMPANY',
  textRow2 = 'Phone • Website'
}) => {
  // Calculate positioning for logo and text areas
  const logoArea = {
    x: nameplateArea.x + nameplateArea.width * 0.05,  // 5% padding from left
    y: nameplateArea.y + nameplateArea.height * 0.2,  // 20% from top
    width: nameplateArea.width * 0.25,                // 25% of nameplate width
    height: nameplateArea.height * 0.6                // 60% of nameplate height
  };

  const textArea = {
    x: nameplateArea.x + nameplateArea.width * 0.35,  // Start after logo area + gap
    y: nameplateArea.y + nameplateArea.height * 0.15, // 15% from top
    width: nameplateArea.width * 0.6,                 // 60% of nameplate width
    height: nameplateArea.height * 0.7                // 70% of nameplate height
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        width: containerWidth,
        height: containerHeight
      }}
    >
      {/* Development helper - show nameplate boundary */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="absolute border border-red-300 opacity-30"
          style={{
            left: nameplateArea.x,
            top: nameplateArea.y,
            width: nameplateArea.width,
            height: nameplateArea.height
          }}
        />
      )}

      {/* Logo Area */}
      <LogoPlacement
        area={logoArea}
        logoUrl={companyLogo}
      />

      {/* Text Area */}
      <TextRowSystem
        area={textArea}
        textRow1={textRow1}
        textRow2={textRow2}
      />
    </div>
  );
};

export default ModularNameplate;