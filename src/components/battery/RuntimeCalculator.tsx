import React, { useState, useEffect } from 'react';

interface Tool {
  id: string;
  name: string;
  consumption: number;
}

interface RuntimeCalculatorProps {
  selectedBattery: string;
  setSelectedBattery: (battery: string) => void;
  isMobile: boolean;
  runtimeData: {
    tools: Tool[];
    batteries: {
      [key: string]: number;
    };
  };
}

const RuntimeCalculator: React.FC<RuntimeCalculatorProps> = ({
  selectedBattery,
  setSelectedBattery,
  isMobile,
  runtimeData
}) => {
  const [selectedTool, setSelectedTool] = useState(runtimeData.tools[0].id);
  const [barWidths, setBarWidths] = useState<number[]>([]);
  const [hoursNeeded, setHoursNeeded] = useState(4);
  
  const selectedToolObj = runtimeData.tools.find(t => t.id === selectedTool);
  
  // Calculate runtimes for each battery with the selected tool
  const runtimes = Object.entries(runtimeData.batteries).map(([battery, ah]) => ({
    battery,
    runtime: calculateRuntime(ah, selectedToolObj?.consumption || 1)
  }));
  
  // Find the max runtime for scaling the chart
  const maxRuntime = Math.max(...runtimes.map(item => item.runtime));
  
  // Calculate runtime based on battery and tool consumption
  function calculateRuntime(batteryAh: number, toolConsumption: number) {
    return batteryAh / toolConsumption;
  }
  
  // Function to calculate and recommend batteries for a job
  const calculateRecommendedBatteries = () => {
    if (!selectedToolObj) return null;
    
    const powerPerHour = selectedToolObj.consumption;
    const totalPowerNeeded = hoursNeeded * powerPerHour;
    
    // Logic to recommend optimal battery combination
    let recommendation = { sixAh: 0, nineAh: 0, fifteenAh: 0 };
    
    // Simple recommendation algorithm - prioritize the largest batteries first
    // for maximum runtime, then fill in with smaller batteries as needed
    let remainingPower = totalPowerNeeded;
    
    // Calculate how many 15Ah batteries needed
    const fifteenAhCount = Math.floor(remainingPower / 15);
    recommendation.fifteenAh = fifteenAhCount;
    remainingPower -= fifteenAhCount * 15;
    
    // Calculate how many 9Ah batteries needed
    const nineAhCount = Math.floor(remainingPower / 9);
    recommendation.nineAh = nineAhCount;
    remainingPower -= nineAhCount * 9;
    
    // Calculate how many 6Ah batteries needed
    const sixAhCount = Math.ceil(remainingPower / 6);
    recommendation.sixAh = sixAhCount;
    
    return recommendation;
  };
  
  // Animate the runtime bars when tool or battery changes
  useEffect(() => {
    // First set width to 0
    setBarWidths(runtimes.map(() => 0));
    
    // Then animate to full width
    const timer = setTimeout(() => {
      setBarWidths(runtimes.map(battery => (battery.runtime / maxRuntime) * 100));
    }, 50);
    
    return () => clearTimeout(timer);
  }, [selectedTool, selectedBattery, maxRuntime]);
  
  return (
    <>
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
            {["6Ah", "9Ah", "15Ah"].map(battery => (
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
            {runtimeData.tools.map(tool => (
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
          {runtimes.map((item, index) => (
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
                  width: `${barWidths[index]}%`,
                  background: 'linear-gradient(90deg, #93C5FD 0%, #2563EB 100%)',
                  borderRadius: '4px',
                  transition: 'all 0.5s ease',
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
        textAlign: 'center',
        marginBottom: '24px'
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
            {runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries]}Ah
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
              runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries], 
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

      {/* Battery Recommendation */}
      <div style={{
        padding: '16px',
        background: '#F0F7FF',
        borderRadius: '8px',
        border: '1px solid #BFDBFE'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1E40AF',
          marginBottom: '16px'
        }}>
          Recommend batteries for my job
        </h4>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="number"
              min="1"
              max="24"
              value={hoursNeeded}
              onChange={(e) => setHoursNeeded(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
              style={{
                width: '80px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px'
              }}
            />
            <span style={{ fontSize: '14px', color: '#4B5563' }}>hours of runtime</span>
          </div>

          <button
            onClick={() => {
              const recommendation = calculateRecommendedBatteries();
              if (recommendation) {
                alert(`Recommended batteries for ${hoursNeeded} hours of ${selectedToolObj?.name} use:\n\n${recommendation.sixAh} x 6Ah Batteries\n${recommendation.nineAh} x 9Ah Batteries\n${recommendation.fifteenAh} x 15Ah Batteries`);
              }
            }}
            style={{
              background: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1D4ED8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2563EB';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Add to Cart
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '13px',
          color: '#3B82F6',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Our intelligent algorithm suggests the optimal battery combination for your needs
        </div>
      </div>

      {/* Common Tools Section */}
      <div style={{ marginTop: '32px' }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Common Tools Runtime
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '16px'
        }}>
          {runtimeData.tools.map(tool => {
            const isSelected = selectedTool === tool.id;
            const sixAhRuntime = runtimeData.batteries["6Ah"] / tool.consumption;
            const nineAhRuntime = runtimeData.batteries["9Ah"] / tool.consumption;
            const fifteenAhRuntime = runtimeData.batteries["15Ah"] / tool.consumption;

            return (
              <div
                key={tool.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${isSelected ? '#BFDBFE' : '#E5E7EB'}`,
                  background: isSelected ? '#F0F7FF' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedTool(tool.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#BFDBFE';
                  e.currentTarget.style.background = isSelected ? '#F0F7FF' : '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isSelected ? '#BFDBFE' : '#E5E7EB';
                  e.currentTarget.style.background = isSelected ? '#F0F7FF' : 'white';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: isSelected ? '#DBEAFE' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? '#2563EB' : '#6B7280',
                    flexShrink: 0
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>

                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isSelected ? '#1E40AF' : '#111827',
                      marginBottom: '4px'
                    }}>
                      {tool.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280'
                    }}>
                      <span style={{ display: 'inline-block', marginRight: '8px' }}>
                        6Ah: <span style={{ fontWeight: '600' }}>{sixAhRuntime.toFixed(1)} hrs</span>
                      </span>
                      <span style={{ display: 'inline-block', marginRight: '8px' }}>
                        9Ah: <span style={{ fontWeight: '600' }}>{nineAhRuntime.toFixed(1)} hrs</span>
                      </span>
                      <span style={{ display: 'inline-block' }}>
                        15Ah: <span style={{ fontWeight: '600' }}>{fifteenAhRuntime.toFixed(1)} hrs</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default RuntimeCalculator;