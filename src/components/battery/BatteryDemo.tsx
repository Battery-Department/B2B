'use client';

import React, { useState } from 'react';
import BatteryImageWithOverlay from './BatteryImageWithOverlay';

const BatteryDemo: React.FC = () => {
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [textRow1, setTextRow1] = useState('ACME CONSTRUCTION');
  const [textRow2, setTextRow2] = useState('(555) 123-4567 • acme.com');

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setCompanyLogo('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">DeWalt FlexVolt Battery Customizer</h2>
          <p className="text-blue-100">Design your custom nameplate with modular positioning system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Controls Panel */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customize Your Battery</h3>
              
              {/* Logo Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Company Logo
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {companyLogo && (
                    <button
                      onClick={clearLogo}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {companyLogo && (
                  <div className="mt-2">
                    <img src={companyLogo} alt="Logo preview" className="h-12 w-12 object-contain border rounded" />
                  </div>
                )}
              </div>

              {/* Text Row 1 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Company Name (Row 1)
                  <span className="text-gray-500 text-xs ml-1">(Max 25 characters)</span>
                </label>
                <input
                  type="text"
                  value={textRow1}
                  onChange={(e) => setTextRow1(e.target.value.slice(0, 25))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company name"
                />
                <div className="text-xs text-gray-500">{textRow1.length}/25 characters</div>
              </div>

              {/* Text Row 2 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Info (Row 2)
                  <span className="text-gray-500 text-xs ml-1">(Max 35 characters)</span>
                </label>
                <input
                  type="text"
                  value={textRow2}
                  onChange={(e) => setTextRow2(e.target.value.slice(0, 35))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Phone • Website"
                />
                <div className="text-xs text-gray-500">{textRow2.length}/35 characters</div>
              </div>
            </div>

            {/* Layout Guide */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Layout Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <strong>Logo Area:</strong> Left 25% of nameplate</p>
                <p>• <strong>Text Row 1:</strong> Primary company name (larger font)</p>
                <p>• <strong>Text Row 2:</strong> Contact information (smaller font)</p>
                <p>• <strong>Positioning:</strong> Fixed modular layout optimized for readability</p>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Preview</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center min-h-[400px]">
              <BatteryImageWithOverlay
                companyLogo={companyLogo || undefined}
                textRow1={textRow1}
                textRow2={textRow2}
                width={320}
                height={320}
              />
            </div>

            {/* Export Options */}
            <div className="mt-4 flex space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Save Design
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Download Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryDemo;