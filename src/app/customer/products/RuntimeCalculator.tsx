'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  consumption: number;
}

interface Battery {
  [key: string]: number;
}

interface RuntimeCalculatorProps {
  tools: Tool[];
  batteries: Battery;
  selectedBattery: string;
  setSelectedBattery: (battery: string) => void;
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  isMobile: boolean;
}

const RuntimeCalculator: React.FC<RuntimeCalculatorProps> = ({
  tools,
  batteries,
  selectedBattery,
  setSelectedBattery,
  selectedTool,
  setSelectedTool,
  isMobile
}) => {
  // Calculate runtime based on battery and tool selection
  const calculateRuntime = (batteryAh: number, toolConsumption: number) => {
    return batteryAh / toolConsumption;
  };

  const selectedToolObj = tools.find(t => t.id === selectedTool);
  const runtimes = Object.entries(batteries).map(([battery, ah]) => ({
    battery,
    runtime: calculateRuntime(ah, selectedToolObj?.consumption || 1)
  }));

  // Find the max runtime for scaling the chart
  const maxRuntime = Math.max(...runtimes.map(item => item.runtime));

  return (
    <div style={{ padding: '24px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div style={{ marginBottom: isMobile ? '16px' : '0' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#111827', 
            marginBottom: '8px' 
          }}>
            Select Battery
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {Object.keys(batteries).map(battery => (
              <button
                key={battery}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
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
                {battery}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#111827', 
            marginBottom: '8px' 
          }}>
            Select Tool
          </label>
          <select 
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '14px',
              color: '#111827',
              background: 'white',
              minWidth: '180px'
            }}
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
          >
            {tools.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Chart */}
      <div style={{ height: '320px', marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#111827', 
          marginBottom: '16px' 
        }}>
          Runtime Comparison ({selectedToolObj?.name})
        </h3>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px', 
          height: '250px', 
          justifyContent: 'flex-end' 
        }}>
          {runtimes.map(item => (
            <div 
              key={item.battery} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                height: '36px'
              }}
            >
              <div style={{ 
                width: '60px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: item.battery === selectedBattery ? '#2563EB' : '#6B7280',
                textAlign: 'right'
              }}>
                {item.battery}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  height: '24px',
                  width: `${(item.runtime / maxRuntime) * 100}%`,
                  background: 'linear-gradient(90deg, #93C5FD 0%, #2563EB 100%)',
                  borderRadius: '4px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '12px',
                  boxShadow: item.battery === selectedBattery ? '0 1px 3px rgba(37, 99, 235, 0.2)' : 'none',
                  border: item.battery === selectedBattery ? '1px solid #2563EB' : 'none'
                }}>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: 'white' 
                  }}>
                    {item.runtime.toFixed(1)} hrs
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
        gap: '16px', 
        textAlign: 'center' 
      }}>
        <div style={{ 
          padding: '16px', 
          background: '#F9FAFB', 
          borderRadius: '8px', 
          border: '1px solid #E5E7EB' 
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            Total Battery Capacity
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
            {batteries[selectedBattery]}Ah
          </div>
        </div>
        
        <div style={{ 
          padding: '16px', 
          background: '#F9FAFB', 
          borderRadius: '8px', 
          border: '1px solid #E5E7EB' 
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            {selectedToolObj?.name} Runtime
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
            {calculateRuntime(
              batteries[selectedBattery], 
              selectedToolObj?.consumption || 1
            ).toFixed(1)} hrs
          </div>
        </div>
        
        <div style={{ 
          padding: '16px', 
          background: '#F9FAFB', 
          borderRadius: '8px', 
          border: '1px solid #E5E7EB' 
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            Power Consumption
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
            {selectedToolObj?.consumption}Ah/hr
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuntimeCalculator;