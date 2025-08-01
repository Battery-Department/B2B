import React, { useState } from 'react';

interface Battery {
  id: string;
  name: string;
}

interface Spec {
  name: string;
  values: string[];
}

interface BatteryComparisonTableProps {
  batteries: Battery[];
  specs: Spec[];
  selectedBattery?: string;
}

const BatteryComparisonTable: React.FC<BatteryComparisonTableProps> = ({ 
  batteries, 
  specs,
  selectedBattery = ''
}) => {
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null);
  
  // Function to determine if a value is the best in its row
  const isBestValue = (index: number, rowIndex: number) => {
    // For weight (lighter is better)
    if (specs[rowIndex].name === "Weight") return index === 0;
    // For amp hours (higher is better)
    if (specs[rowIndex].name === "Amp Hours") return index === 2;
    // For charge time (faster is better)
    if (specs[rowIndex].name.includes("Charge Time")) return index === 0;
    // For cell configuration (more cells might be better for certain applications)
    if (specs[rowIndex].name === "Cell Configuration") return index === 2;
    return false;
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {specs.map((spec, index) => (
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
              {/* For simplified view mode, show only the selected battery value */}
              {selectedBattery ? (
                // Find the correct battery index
                (() => {
                  const batteryIndex = batteries.findIndex(b => b.id === selectedBattery);
                  const value = spec.values[batteryIndex >= 0 ? batteryIndex : 0];
                  
                  // Highlight best values
                  const best = isBestValue(batteryIndex, index);
                  
                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: best ? '#2563EB' : '#4B5563',
                      fontWeight: best ? '600' : '400'
                    }}>
                      {value}
                      {best && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '12px', 
                          color: '#10B981',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          Best
                        </span>
                      )}
                    </div>
                  );
                })()
              ) : (
                // Full comparison mode - show all battery values
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  {batteries.map((battery, i) => {
                    // Check if this column is highlighted
                    const isHighlighted = highlightedColumn === i;
                    
                    // Check if this is the best value
                    const best = isBestValue(i, index);
                    
                    return (
                      <div 
                        key={battery.id}
                        style={{ 
                          flex: 1, 
                          backgroundColor: isHighlighted ? '#F0F9FF' : 'transparent',
                          padding: '8px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s ease',
                          color: best ? '#2563EB' : '#4B5563',
                          fontWeight: best ? '600' : '400',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                        onMouseEnter={() => setHighlightedColumn(i)}
                        onMouseLeave={() => setHighlightedColumn(null)}
                      >
                        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>
                          {battery.name}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          {spec.values[i]}
                          {best && (
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#10B981',
                              marginTop: '2px'
                            }}>
                              (Best)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BatteryComparisonTable;