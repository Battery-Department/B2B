'use client';

import React, { useRef, useEffect, useState } from 'react';
import ModularNameplate from './ModularNameplate';

interface BatteryImageWithOverlayProps {
  batteryImage?: string;
  companyLogo?: string;
  textRow1?: string;
  textRow2?: string;
  width?: number;
  height?: number;
}

const BatteryImageWithOverlay: React.FC<BatteryImageWithOverlayProps> = ({
  batteryImage = '/images/flexbat-battery.png',
  companyLogo,
  textRow1 = 'YOUR COMPANY',
  textRow2 = 'Phone • Website',
  width = 400,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [batteryImg, setBatteryImg] = useState<HTMLImageElement | null>(null);
  const [nameplateArea, setNameplateArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Load battery image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setBatteryImg(img);
      setIsLoading(false);
    };
    img.onerror = () => {
      console.error('Failed to load battery image:', batteryImage);
      setIsLoading(false);
    };
    img.src = batteryImage;
  }, [batteryImage]);

  // Render the battery with nameplate overlay
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !batteryImg) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate battery image size to fit canvas while maintaining aspect ratio
    const imgAspect = batteryImg.width / batteryImg.height;
    const canvasAspect = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspect > canvasAspect) {
      // Image is wider - fit to canvas width
      drawWidth = width;
      drawHeight = width / imgAspect;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    } else {
      // Image is taller - fit to canvas height
      drawHeight = height;
      drawWidth = height * imgAspect;
      drawX = (width - drawWidth) / 2;
      drawY = 0;
    }

    // Draw battery image
    ctx.drawImage(batteryImg, drawX, drawY, drawWidth, drawHeight);

    // Define the nameplate area on the battery
    // Based on the DeWalt battery image, the stainless steel nameplate is roughly:
    const calculatedNameplateArea = {
      x: drawX + drawWidth * 0.198,      // 19.8% from left edge of battery
      y: drawY + drawHeight * 0.315,     // 31.5% from top edge of battery  
      width: drawWidth * 0.604,          // 60.4% of battery width
      height: drawHeight * 0.370         // 37% of battery height
    };

    // Update state with calculated nameplate area
    setNameplateArea(calculatedNameplateArea);

    // Add a subtle outline to show the nameplate area (optional - for development)
    if (process.env.NODE_ENV === 'development') {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(calculatedNameplateArea.x, calculatedNameplateArea.y, calculatedNameplateArea.width, calculatedNameplateArea.height);
    }

    return calculatedNameplateArea;
  };

  // Re-render when dependencies change
  useEffect(() => {
    if (batteryImg) {
      renderCanvas();
    }
  }, [batteryImg, width, height, textRow1, textRow2, companyLogo]);

  return (
    <div className="relative inline-block">
      {isLoading ? (
        <div 
          className="flex items-center justify-center bg-gray-100 rounded-lg"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading battery...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Battery Canvas */}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="block"
            style={{
              filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.15))',
              borderRadius: '8px'
            }}
          />
          
          {/* Modular Nameplate Overlay */}
          <ModularNameplate
            containerWidth={width}
            containerHeight={height}
            nameplateArea={nameplateArea}
            companyLogo={companyLogo}
            textRow1={textRow1}
            textRow2={textRow2}
          />
        </>
      )}
    </div>
  );
};

export default BatteryImageWithOverlay;