import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Calculator, Clock, Battery, Zap, ChevronRight, ShoppingCart, Info, Settings } from 'lucide-react';

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

const EnhancedRuntimeCalculator: React.FC<RuntimeCalculatorProps> = ({
  selectedBattery,
  setSelectedBattery,
  isMobile,
  runtimeData
}) => {
  const [selectedTool, setSelectedTool] = useState(runtimeData.tools[0].id);
  const [hoursNeeded, setHoursNeeded] = useState(4);
  const [animatedBars, setAnimatedBars] = useState<boolean>(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  
  const selectedToolObj = runtimeData.tools.find(t => t.id === selectedTool);
  
  // Calculate runtimes for each battery with the selected tool
  const runtimes = Object.entries(runtimeData.batteries).map(([battery, ah]) => ({
    battery,
    hours: calculateRuntime(ah, selectedToolObj?.consumption || 1),
    color: battery === "6Ah" ? "#3B82F6" : battery === "9Ah" ? "#6366F1" : "#8B5CF6"
  }));
  
  // Find the max runtime for scaling the chart
  const maxRuntime = Math.max(...runtimes.map(item => item.hours));
  
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

  // For responsive chart sizing
  useEffect(() => {
    // Set initial chart width
    if (chartContainerRef.current) {
      setChartWidth(chartContainerRef.current.offsetWidth);
    }
    
    // Update chart width on window resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Animate the runtime bars when tool or battery changes
  useEffect(() => {
    setAnimatedBars(false);
    
    const timer = setTimeout(() => {
      setAnimatedBars(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedTool, selectedBattery, maxRuntime]);

  return (
    <div className="runtime-calculator">
      {/* Battery and Tool Selectors */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="battery-selector">
          <h3 className="text-base font-medium text-gray-700 mb-3">Select Battery</h3>
          
          <div className="flex gap-2">
            {["6Ah", "9Ah", "15Ah"].map(battery => (
              <button 
                key={battery}
                className={`py-2 px-4 rounded-lg transition-all ${
                  selectedBattery === battery 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedBattery(battery)}
              >
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  {battery}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="tool-selector">
          <h3 className="text-base font-medium text-gray-700 mb-3">Select Tool</h3>
          
          <div className="relative">
            <select
              value={selectedTool}
              onChange={e => setSelectedTool(e.target.value)}
              className="w-full py-2 px-3 pr-10 appearance-none bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {runtimeData.tools.map(tool => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="key-metrics grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="metric p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-4 h-4 text-blue-500" />
            <div className="text-xs text-gray-500">Total Battery Capacity</div>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries]}Ah
          </div>
        </div>
        
        <div className="metric p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <div className="text-xs text-gray-500">{selectedToolObj?.name} Runtime</div>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {calculateRuntime(
              runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries], 
              selectedToolObj?.consumption || 1
            ).toFixed(1)} hrs
          </div>
        </div>
        
        <div className="metric p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <div className="text-xs text-gray-500">Power Consumption</div>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {selectedToolObj?.consumption}Ah/hr
          </div>
        </div>
      </div>

      {/* Runtime Visualization */}
      <div className="runtime-visualization mb-8" ref={chartRef}>
        <h3 className="text-base font-medium text-gray-700 mb-4">Runtime Comparison</h3>
        
        <div className="space-y-5">
          {runtimes.map((data, index) => (
            <div key={data.battery} className="runtime-item">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">{data.battery}</span>
                <span className="text-sm font-medium text-gray-900">{data.hours.toFixed(1)} hrs</span>
              </div>
              
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    backgroundColor: data.color,
                    width: animatedBars ? `${(data.hours / maxRuntime) * 100}%` : '0%',
                    transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Calculator */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 mb-8 border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-medium text-blue-800">Battery Calculator</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              How many hours do you need to run your {selectedToolObj?.name}?
            </label>
            <div className="flex items-center mt-2">
              <input
                type="number"
                min="1"
                max="24"
                value={hoursNeeded}
                onChange={(e) => setHoursNeeded(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                className="py-2 px-3 border border-gray-300 rounded-l-lg w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="bg-gray-100 text-gray-700 py-2 px-3 rounded-r-lg border border-l-0 border-gray-300">
                hours
              </span>
            </div>
          </div>
          
          <div>
            <button
              onClick={() => {
                const recommendation = calculateRecommendedBatteries();
                if (recommendation) {
                  // Create recommendation message
                  const total = recommendation.sixAh + recommendation.nineAh + recommendation.fifteenAh;
                  
                  // Create UI element instead of alert
                  const recommendationElement = document.getElementById('battery-recommendation');
                  if (recommendationElement) {
                    recommendationElement.innerHTML = `
                      <div class="p-4 bg-white rounded-lg border border-blue-200 mt-4">
                        <div class="text-sm font-medium text-blue-800 mb-2">
                          We recommend the following for ${hoursNeeded} hours of ${selectedToolObj.name} use:
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                          ${recommendation.sixAh > 0 ? `<div class="flex items-center gap-2 bg-blue-50 p-2 rounded"><Battery size=16 /> <span>${recommendation.sixAh} × 6Ah</span></div>` : ''}
                          ${recommendation.nineAh > 0 ? `<div class="flex items-center gap-2 bg-indigo-50 p-2 rounded"><Battery size=16 /> <span>${recommendation.nineAh} × 9Ah</span></div>` : ''}
                          ${recommendation.fifteenAh > 0 ? `<div class="flex items-center gap-2 bg-purple-50 p-2 rounded"><Battery size=16 /> <span>${recommendation.fifteenAh} × 15Ah</span></div>` : ''}
                        </div>
                      </div>
                    `;
                  }
                }
              }}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Calculator size={16} />
              Calculate Recommendation
            </button>
          </div>
        </div>
        
        <div id="battery-recommendation" className="mt-2"></div>
        
        <div className="mt-4 text-xs text-blue-700 flex items-start gap-2">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Our intelligent algorithm calculates the optimal battery combination based on your tool's power consumption
            ({selectedToolObj?.consumption}Ah/hr) and your runtime needs.
          </span>
        </div>
      </div>

      {/* Tool Runtime Comparison Chart */}
      <div className="comparison-chart mb-8" ref={chartContainerRef}>
        <h3 className="text-base font-medium text-gray-700 mb-4">Common Tools Runtime ({selectedBattery} Battery)</h3>
        
        <div className="chart-container relative h-64 overflow-x-auto md:overflow-visible">
          {runtimeData.tools.map((tool, index) => {
            const runtime = calculateRuntime(
              runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries],
              tool.consumption
            );
            const maxPossibleRuntime = 5; // Setting a fixed max for better visualization
            const barHeight = `${Math.min((runtime / maxPossibleRuntime) * 100, 100)}%`;
            const barWidth = chartWidth ? (chartWidth / runtimeData.tools.length) - 16 : 50;
            const isSelected = selectedTool === tool.id;
            
            return (
              <div 
                key={tool.id}
                className="absolute bottom-0 flex flex-col items-center"
                style={{ 
                  left: `${(index / runtimeData.tools.length) * 100}%`,
                  width: `${100 / runtimeData.tools.length}%`,
                  transform: 'translateX(-50%)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedTool(tool.id)}
              >
                <div className="text-xs text-gray-500 mb-1">{runtime.toFixed(1)} hrs</div>
                
                <div 
                  className={`rounded-t-lg transition-all duration-300 ${isSelected ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-blue-500 to-blue-400'}`}
                  style={{ 
                    height: animatedBars ? barHeight : '0%',
                    width: barWidth,
                    maxWidth: '80px',
                    transition: 'height 0.5s ease-out, background-color 0.3s',
                    boxShadow: isSelected ? '0 0 0 2px #2563EB' : 'none'
                  }}
                />
                
                <div className={`text-xs font-medium mt-2 text-center transition-colors ${
                  isSelected ? 'text-blue-700' : 'text-gray-700'
                }`} style={{ width: barWidth, maxWidth: '80px' }}>
                  {tool.name}
                </div>
              </div>
            );
          })}
          
          {/* Horizontal grid lines */}
          {[0, 1, 2, 3, 4, 5].map(value => (
            <div 
              key={value}
              className="absolute w-full border-t border-gray-100 flex items-center"
              style={{ bottom: `${(value / 5) * 100}%` }}
            >
              <span className="text-xs text-gray-400 absolute -left-6">{value}</span>
            </div>
          ))}
        </div>
        
        <div className="text-center text-xs text-gray-500 mt-4">
          Click on a tool to select it and see detailed runtime information
        </div>
      </div>

      {/* Tool-Specific Runtime Info Cards */}
      <div className="tool-runtime-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {runtimeData.tools.map(tool => {
          const sixAhRuntime = calculateRuntime(runtimeData.batteries["6Ah"], tool.consumption);
          const nineAhRuntime = calculateRuntime(runtimeData.batteries["9Ah"], tool.consumption); 
          const fifteenAhRuntime = calculateRuntime(runtimeData.batteries["15Ah"], tool.consumption);
          const isSelected = selectedTool === tool.id;
          
          return (
            <div
              key={tool.id}
              className={`tool-card p-4 border rounded-lg shadow-sm cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedTool(tool.id)}
            >
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-full mr-3 ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Settings className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                <h4 className={`font-medium ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>
                  {tool.name}
                </h4>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`runtime-data text-center p-2 rounded ${
                  selectedBattery === "6Ah" && isSelected ? 'bg-blue-100' : 'bg-gray-50'
                }`}>
                  <div className="text-gray-500 mb-1">6Ah</div>
                  <div className={`font-bold ${
                    selectedBattery === "6Ah" && isSelected ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {sixAhRuntime.toFixed(1)} hrs
                  </div>
                </div>
                
                <div className={`runtime-data text-center p-2 rounded ${
                  selectedBattery === "9Ah" && isSelected ? 'bg-blue-100' : 'bg-gray-50'
                }`}>
                  <div className="text-gray-500 mb-1">9Ah</div>
                  <div className={`font-bold ${
                    selectedBattery === "9Ah" && isSelected ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {nineAhRuntime.toFixed(1)} hrs
                  </div>
                </div>
                
                <div className={`runtime-data text-center p-2 rounded ${
                  selectedBattery === "15Ah" && isSelected ? 'bg-blue-100' : 'bg-gray-50'
                }`}>
                  <div className="text-gray-500 mb-1">15Ah</div>
                  <div className={`font-bold ${
                    selectedBattery === "15Ah" && isSelected ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {fifteenAhRuntime.toFixed(1)} hrs
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Add to Cart Button */}
      <div className="flex justify-center">
        <button className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
          <ShoppingCart className="w-5 h-5" />
          <span>Add Batteries to Cart</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default EnhancedRuntimeCalculator;