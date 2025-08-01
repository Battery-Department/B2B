'use client';

import React, { useState } from 'react';

// Types for the component
interface BatterySpec {
  name: string;
  value6Ah: string;
  value9Ah: string;
  value15Ah: string;
}

interface BatteryComparisonTableProps {
  batterySpecs: BatterySpec[];
  selectedBattery: string;
  setSelectedBattery: (battery: string) => void;
}

const BatteryComparisonTable: React.FC<BatteryComparisonTableProps> = ({ 
  batterySpecs, 
  selectedBattery, 
  setSelectedBattery 
}) => {
  return (
    <div style={{ overflow: 'hidden', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
      {/* Battery Selector */}
      <div style={{ background: '#F9FAFB', padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {["6Ah", "9Ah", "15Ah"].map(battery => (
            <button
              key={battery}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '500',
                background: selectedBattery === battery ? '#2563EB' : 'white',
                color: selectedBattery === battery ? 'white' : '#6B7280',
                border: selectedBattery === battery ? 'none' : '1px solid #D1D5DB',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onClick={() => setSelectedBattery(battery)}
            >
              {battery} Battery
            </button>
          ))}
        </div>
      </div>
      
      {/* Specifications Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {batterySpecs.map((spec, index) => (
            <tr 
              key={spec.name} 
              style={{ background: index % 2 === 0 ? 'white' : '#F9FAFB' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = index % 2 === 0 ? '#F9FAFB' : '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#F9FAFB';
              }}
            >
              <td style={{ 
                padding: '16px 24px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#111827',
                width: '33.333%',
                borderBottom: '1px solid #E5E7EB'
              }}>
                {spec.name}
              </td>
              <td style={{ 
                padding: '16px 24px', 
                fontSize: '14px', 
                color: '#4B5563',
                width: '66.666%',
                borderBottom: '1px solid #E5E7EB'
              }}>
                {selectedBattery === "6Ah" 
                  ? spec.value6Ah 
                  : selectedBattery === "9Ah" 
                    ? spec.value9Ah 
                    : spec.value15Ah}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BatteryComparisonTable;