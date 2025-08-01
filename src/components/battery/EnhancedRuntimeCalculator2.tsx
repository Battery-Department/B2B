import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, Calculator, Clock, Battery, Zap, ChevronRight, ShoppingCart, Info, 
  Settings, Check, Minus, Plus, DollarSign, User, Pause, BarChart
} from 'lucide-react';

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

// Helper function to get efficiency color based on percentage
const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency >= 90) return '#10B981'; // green
  if (efficiency >= 75) return '#3B82F6'; // blue
  if (efficiency >= 60) return '#F59E0B'; // amber
  return '#EF4444'; // red
};

// Helper function to get battery color
const getBatteryColor = (batteryId: string, isDashed: boolean = false): string => {
  const colors = {
    '6Ah': isDashed ? 'rgba(59, 130, 246, 0.5)' : '#3B82F6', // blue
    '9Ah': isDashed ? 'rgba(99, 102, 241, 0.5)' : '#6366F1', // indigo
    '15Ah': isDashed ? 'rgba(139, 92, 246, 0.5)' : '#8B5CF6', // purple
  };
  return colors[batteryId as keyof typeof colors] || '#3B82F6';
};

// Helper function to get battery description
const getBatteryDescription = (capacity: string): string => {
  const descriptions = {
    '6Ah': 'Standard Capacity',
    '9Ah': 'High Capacity',
    '15Ah': 'Maximum Capacity'
  };
  return descriptions[capacity as keyof typeof descriptions] || '';
};

const EnhancedRuntimeCalculator2: React.FC<RuntimeCalculatorProps> = ({
  selectedBattery,
  setSelectedBattery,
  isMobile,
  runtimeData
}) => {
  const [selectedTool, setSelectedTool] = useState(runtimeData.tools[0].id);
  const [hoursNeeded, setHoursNeeded] = useState(4);
  const [animatedBars, setAnimatedBars] = useState<boolean>(false);
  const [useCase, setUseCase] = useState('continuous');
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState('optimal');
  const [selectionStep, setSelectionStep] = useState(1); // For guided selection

  const chartRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  
  const selectedToolObj = runtimeData.tools.find(t => t.id === selectedTool);
  
  // Calculate runtimes for each battery with the selected tool
  const runtimes = Object.entries(runtimeData.batteries).map(([battery, ah]) => ({
    battery,
    hours: calculateRuntime(ah, selectedToolObj?.consumption || 1),
    color: getBatteryColor(battery),
    // Adding efficiency rating (simulated for demo)
    efficiency: battery === '6Ah' ? 85 : battery === '9Ah' ? 92 : 88,
    // Adding comparison text
    comparisonText: battery === selectedBattery ? 
      "This is your selected battery" :
      battery === '6Ah' ? 
        "More cost-effective but shorter runtime" :
      battery === '9Ah' ? 
        "Balanced option with good efficiency" :
        "Maximum runtime but heaviest option"
  }));
  
  // Find the max runtime for scaling the chart
  const maxRuntime = Math.max(...runtimes.map(item => item.hours));
  
  // Calculate runtime based on battery and tool consumption
  function calculateRuntime(batteryAh: number, toolConsumption: number) {
    return batteryAh / toolConsumption;
  }
  
  // Different configuration options based on calculation
  const configurations = [
    { 
      id: 'optimal', 
      label: 'Optimal', 
      batteries: `1× ${selectedBattery}`, 
      runtime: calculateRuntime(runtimeData.batteries[selectedBattery], selectedToolObj?.consumption || 1).toFixed(1) + ' hrs',
      cost: selectedBattery === '6Ah' ? '$95' : selectedBattery === '9Ah' ? '$125' : '$196',
      efficiency: selectedBattery === '6Ah' ? 85 : selectedBattery === '9Ah' ? 92 : 88,
      weight: selectedBattery === '15Ah' ? 'Heavy' : selectedBattery === '9Ah' ? 'Medium' : 'Light' 
    },
    { 
      id: 'economy', 
      label: 'Economy', 
      batteries: '2× 6Ah', 
      runtime: (2 * calculateRuntime(runtimeData.batteries['6Ah'], selectedToolObj?.consumption || 1)).toFixed(1) + ' hrs',
      cost: '$190',
      efficiency: 85,
      weight: 'Medium' 
    },
    { 
      id: 'maxRuntime', 
      label: 'Max Runtime', 
      batteries: '1× 15Ah', 
      runtime: calculateRuntime(runtimeData.batteries['15Ah'], selectedToolObj?.consumption || 1).toFixed(1) + ' hrs',
      cost: '$196',
      efficiency: 88,
      weight: 'Heavy' 
    }
  ];

  const getConfigById = (id: string) => {
    return configurations.find(config => config.id === id) || configurations[0];
  };

  const getConfigContext = (configId: string) => {
    const contexts = {
      'optimal': `The optimal configuration for ${selectedToolObj?.name} balances runtime and cost efficiency.`,
      'economy': 'This economy configuration offers good value with slightly more battery swapping.',
      'maxRuntime': 'The maximum runtime configuration minimizes battery changes but is heavier to carry.'
    };
    return contexts[configId as keyof typeof contexts] || '';
  };
  
  // Function to calculate and recommend batteries for a job
  const calculateRecommendedBatteries = () => {
    if (!selectedToolObj) return null;
    
    const powerPerHour = selectedToolObj.consumption;
    const totalPowerNeeded = hoursNeeded * powerPerHour;
    
    // Adjust for use case (continuous vs intermittent)
    const efficiencyFactor = useCase === 'continuous' ? 1 : 0.8; // Intermittent use is more efficient
    const adjustedPowerNeeded = totalPowerNeeded * efficiencyFactor;
    
    // Different recommendation logics based on adjusted power
    let recommendation = { sixAh: 0, nineAh: 0, fifteenAh: 0 };
    
    // Simple recommendation algorithm - prioritize the largest batteries first for maximum runtime
    let remainingPower = adjustedPowerNeeded;
    
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

  // Generate scenario-based recommendations
  const getScenarioRecommendations = () => {
    if (!selectedToolObj) return [];
    
    // Base calculations
    const powerConsumption = selectedToolObj.consumption;
    const totalPowerNeeded = hoursNeeded * powerConsumption;
    
    // Factor in use case efficiency
    const efficiencyFactor = useCase === 'continuous' ? 1 : 0.8; // Intermittent use is more efficient
    const adjustedPowerNeeded = totalPowerNeeded * efficiencyFactor;
    
    // Calculate single battery recommendation
    const singleBatteryOption = () => {
      if (adjustedPowerNeeded <= 6) return "1× 6Ah Battery";
      if (adjustedPowerNeeded <= 9) return "1× 9Ah Battery";
      if (adjustedPowerNeeded <= 15) return "1× 15Ah Battery";
      return "Multiple batteries required";
    };

    // Calculate multiple same-size batteries
    const multipleSameSizeBatteries = () => {
      const sixAhCount = Math.ceil(adjustedPowerNeeded / 6);
      const nineAhCount = Math.ceil(adjustedPowerNeeded / 9);
      const fifteenAhCount = Math.ceil(adjustedPowerNeeded / 15);
      
      // Return the option with fewest batteries
      if (fifteenAhCount <= nineAhCount && fifteenAhCount <= sixAhCount) {
        return `${fifteenAhCount}× 15Ah Batteries`;
      } else if (nineAhCount <= sixAhCount) {
        return `${nineAhCount}× 9Ah Batteries`;
      } else {
        return `${sixAhCount}× 6Ah Batteries`;
      }
    };

    // Calculate mixed battery sizes
    const mixedBatterySizes = () => {
      let remainingPower = adjustedPowerNeeded;
      let result = [];
      
      // Try to use one 15Ah first if it covers most of the need
      if (remainingPower > 12) {
        result.push("1× 15Ah Battery");
        remainingPower -= 15;
      }
      
      // Then add 9Ah if needed
      if (remainingPower > 4.5) {
        const nineAhCount = Math.floor(remainingPower / 9);
        if (nineAhCount > 0) {
          result.push(`${nineAhCount}× 9Ah Battery`);
          remainingPower -= nineAhCount * 9;
        }
      }
      
      // Finally add 6Ah for remainder
      if (remainingPower > 0) {
        const sixAhCount = Math.ceil(remainingPower / 6);
        if (sixAhCount > 0) {
          result.push(`${sixAhCount}× 6Ah Battery`);
        }
      }
      
      return result.join(" + ");
    };

    // Determine which scenario is optimal for this specific case
    const determineIfOptimal = (scenario: string) => {
      // For demo purposes, let's determine optimal based on simpler logic
      if (adjustedPowerNeeded <= 6 && scenario === "Single Battery") return true;
      if (adjustedPowerNeeded > 6 && adjustedPowerNeeded <= 15 && scenario === "Single Battery") return true;
      if (adjustedPowerNeeded > 15 && adjustedPowerNeeded <= 30 && scenario === "Multiple Same-Size Batteries") return true;
      if (adjustedPowerNeeded > 30 && scenario === "Mixed Battery Sizes") return true;
      return false;
    };
    
    // Generate recommendations
    const recommendations = [
      {
        scenario: "Single Battery",
        configuration: singleBatteryOption(),
        benefits: ["Simplest solution", "Lightweight", "No swapping needed"],
        limitations: ["May be insufficient for long jobs"],
        idealFor: ["Quick tasks", "Maximum mobility"],
        optimal: determineIfOptimal("Single Battery")
      },
      {
        scenario: "Multiple Same-Size Batteries",
        configuration: multipleSameSizeBatteries(),
        benefits: ["Balanced performance", "Flexibility for other tools"],
        limitations: ["Requires battery changes"],
        idealFor: ["Most common workshop scenarios", "Multiple tool users"],
        optimal: determineIfOptimal("Multiple Same-Size Batteries")
      },
      {
        scenario: "Mixed Battery Sizes",
        configuration: mixedBatterySizes(),
        benefits: ["Optimized for runtime and cost", "Maximum flexibility"],
        limitations: ["More complex to manage"],
        idealFor: ["Professional users", "Full day projects"],
        optimal: determineIfOptimal("Mixed Battery Sizes")
      }
    ];
    
    return recommendations;
  };

  // Get tool details
  const getToolDetails = (toolId: string) => {
    const tool = runtimeData.tools.find(t => t.id === toolId);
    if (!tool) return { powerDraw: '0Ah/hr', efficiency: 'Low' };
    
    let efficiency = 'Medium';
    if (tool.consumption < 3) efficiency = 'High';
    if (tool.consumption > 5) efficiency = 'Low';
    
    return {
      powerDraw: `${tool.consumption}Ah/hr`,
      efficiency
    };
  };

  // Get runtime for a tool/battery combination
  const getRuntimeForTool = (toolId: string, batteryCapacity: string) => {
    const tool = runtimeData.tools.find(t => t.id === toolId);
    if (!tool) return '0';
    
    const ah = parseInt(batteryCapacity);
    return (ah / tool.consumption).toFixed(1);
  };

  // Get recommendation
  const getRecommendation = (toolId: string, batteryId: string) => {
    const tool = runtimeData.tools.find(t => t.id === toolId);
    if (!tool) return '';
    
    // Recommendations based on tool consumption and battery capacity
    const consumption = tool.consumption;
    const capacity = parseInt(batteryId);
    const runtime = capacity / consumption;
    
    if (consumption > 5 && capacity < 9) {
      return "Consider upgrading to a 9Ah or 15Ah battery for this high-drain tool.";
    }
    
    if (runtime < 1) {
      return "For longer operation, consider multiple batteries or a higher capacity option.";
    }
    
    if (capacity === 15 && consumption < 3) {
      return "You could use a 9Ah battery for this tool and save weight.";
    }
    
    return "";
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

  // Render battery configuration visual
  const renderBatteryVisual = (configId: string) => {
    const config = getConfigById(configId);
    const batteryCount = parseInt(config.batteries.split('×')[0].trim());
    const batteryType = config.batteries.split('×')[1].trim();
    
    return (
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: batteryCount }).map((_, i) => (
          <div 
            key={i} 
            className="battery-visual w-12 h-16 rounded-md border border-gray-300 relative overflow-hidden"
            style={{ borderRadius: '3px 3px 6px 6px' }}
          >
            <div 
              className="absolute bottom-0 left-0 right-0 transition-all duration-500"
              style={{ 
                height: `${(parseInt(batteryType) / 15) * 100}%`,
                backgroundColor: getBatteryColor(batteryType),
                transition: 'height 0.5s ease-out'
              }}
            ></div>
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800 rounded-t-sm"></div>
          </div>
        ))}
      </div>
    );
  };

  // Tooltip component
  const InfoTooltip: React.FC<{ term: string; explanation: string }> = ({ term, explanation }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
      <div className="relative inline-block">
        <span 
          className="cursor-help border-b border-dotted border-gray-500"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {term}
        </span>
        
        {isVisible && (
          <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
            {explanation}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="runtime-calculator">
      {/* Guided Selection Experience */}
      <div className="selection-process mb-8 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-700">Configure Your Power Requirements</h3>
          
          {/* Progress indicator */}
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-24 h-1 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                style={{ width: `${selectionStep === 1 ? '50%' : '100%'}` }}
              ></div>
            </div>
            <span className="ml-2">Step {selectionStep}/2</span>
          </div>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool selection */}
            <div className="selection-card">
              <label className="block text-sm font-medium text-gray-700 mb-2">1. Select your primary tool</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-2.5 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedTool}
                  onChange={(e) => {
                    setSelectedTool(e.target.value);
                    setSelectionStep(2); // Move to next step after selection
                  }}
                >
                  {runtimeData.tools.map(tool => (
                    <option key={tool.id} value={tool.id}>{tool.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Tool details that appear after selection */}
              {selectedTool && (
                <div className="mt-3 text-xs text-gray-600 p-2 bg-gray-50 rounded-md">
                  <div className="font-medium mb-1">Tool power profile:</div>
                  <div className="flex justify-between">
                    <span>Power draw: {getToolDetails(selectedTool).powerDraw}</span>
                    <span>Efficiency: {getToolDetails(selectedTool).efficiency}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Battery selection - shown as cards with visual information */}
            <div className="selection-card">
              <label className="block text-sm font-medium text-gray-700 mb-2">2. Choose battery capacity</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(runtimeData.batteries).map(([battery]) => (
                  <div
                    key={battery}
                    className={`battery-option relative p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedBattery === battery
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedBattery(battery)}
                  >
                    <div className="flex flex-col items-center">
                      <div className="battery-icon mb-2" style={{ color: getBatteryColor(battery) }}>
                        <Battery className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium">{battery}</span>
                      
                      {/* Show runtime for selected tool */}
                      {selectedTool && (
                        <div className="mt-1 text-xs text-blue-800 font-medium">
                          {calculateRuntime(
                            runtimeData.batteries[battery as keyof typeof runtimeData.batteries],
                            selectedToolObj?.consumption || 1
                          ).toFixed(1)} hrs
                        </div>
                      )}
                    </div>
                    
                    {selectedBattery === battery && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Real-time runtime summary that updates with selections */}
          <div className="runtime-summary mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-1">Runtime Summary</h4>
                <p className="text-sm text-gray-600">
                  With a <span className="font-medium">{selectedBattery}</span> battery,
                  your <span className="font-medium">{selectedToolObj?.name}</span> will run for approximately&nbsp;
                  <span className="font-medium text-blue-700">
                    {calculateRuntime(
                      runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries],
                      selectedToolObj?.consumption || 1
                    ).toFixed(1)} hours
                  </span>.
                </p>
                
                {/* Dynamic recommendation */}
                {getRecommendation(selectedTool, selectedBattery) && (
                  <div className="mt-2 text-xs text-blue-700">
                    <span className="font-medium">Recommendation:</span> {getRecommendation(selectedTool, selectedBattery)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics with context */}
      <div className="metrics-container grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="metric-card bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-all">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-500 mr-3">
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Battery Capacity</div>
              <div className="text-xl font-bold">
                {runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries]}Ah
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Powers up to {(runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries] / 2).toFixed(1)} hours of average use
              </div>
            </div>
          </div>
        </div>
        
        <div className="metric-card bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-all">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-500 mr-3">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{selectedToolObj?.name} Runtime</div>
              <div className="text-xl font-bold">
                {calculateRuntime(
                  runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries],
                  selectedToolObj?.consumption || 1
                ).toFixed(1)} hrs
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {selectedToolObj?.name === "Circular Saw" ? "Cut approximately 250 linear feet" :
                 selectedToolObj?.name === "Drill" ? "Drive up to 500 screws" :
                 selectedToolObj?.name === "Impact Driver" ? "Complete a full framing project" :
                 selectedToolObj?.name === "Reciprocating Saw" ? "Make 100+ cuts through lumber" :
                 "Complete a full grinding job"}
              </div>
            </div>
          </div>
        </div>
        
        <div className="metric-card bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-all">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-500 mr-3">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Power Consumption <InfoTooltip 
                  term="What's this?" 
                  explanation="Power consumption rate indicates how quickly the battery drains while using this tool. Lower values mean longer runtime." 
                />
              </div>
              <div className="text-xl font-bold">
                {selectedToolObj?.consumption}Ah/hr
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {selectedToolObj && selectedToolObj.consumption > 4 ? "High-demand tool category" : 
                 selectedToolObj && selectedToolObj.consumption > 2 ? "Medium-demand tool category" : 
                 "Low-demand tool category"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Runtime Visualization with Dual-Axis System */}
      <div className="runtime-chart relative pt-8 pb-4 px-4 bg-white rounded-xl shadow-sm mb-6" ref={chartRef}>
        <div className="absolute top-0 left-0 right-0 flex justify-between px-6 py-2 border-b">
          <div className="text-xs text-gray-500">Runtime</div>
          <div className="text-xs text-gray-500">Efficiency Rating</div>
        </div>
        
        {/* For each battery option */}
        {runtimes.map(battery => (
          <div key={battery.battery} className="relative mb-4">
            <div className="grid grid-cols-12 items-center gap-4">
              {/* Battery label */}
              <div className="col-span-1">
                <div className={`w-full font-medium ${battery.battery === selectedBattery ? 'text-blue-700' : 'text-gray-700'}`}>
                  {battery.battery}
                </div>
              </div>
              
              {/* Runtime bar */}
              <div className="col-span-7 relative h-12">
                <div className="absolute inset-0 bg-gray-100 rounded-lg"></div>
                <div 
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out flex items-center pl-2"
                  style={{ 
                    width: animatedBars ? `${(battery.hours / maxRuntime) * 100}%` : '0%',
                    backgroundColor: battery.battery === selectedBattery ? battery.color : `${battery.color}80`, 
                  }}
                >
                  <span className={`text-sm font-medium ${battery.hours / maxRuntime > 0.35 ? 'text-white' : 'text-gray-800'}`}>
                    {battery.hours.toFixed(1)} hrs
                  </span>
                </div>
                
                {/* Add visual comparison indicators */}
                {battery.battery === selectedBattery && (
                  <div className="absolute -top-2 left-0 right-0 flex justify-between text-xs">
                    <span className="text-blue-600 font-medium">0 hrs</span>
                    <span className="text-blue-600 font-medium">{maxRuntime.toFixed(1)} hrs</span>
                  </div>
                )}
              </div>
              
              {/* Efficiency indicator */}
              <div className="col-span-4 flex items-center">
                <div className="w-full bg-gray-100 h-2 rounded-full">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: animatedBars ? `${battery.efficiency}%` : '0%', 
                      backgroundColor: getEfficiencyColor(battery.efficiency),
                      transition: 'width 0.8s ease-out'
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-sm text-gray-600">{battery.efficiency}%</span>
              </div>
            </div>
            
            {/* Add contextual comparison */}
            {battery.battery === selectedBattery && (
              <div className="mt-1 text-xs text-blue-600 italic">
                {battery.comparisonText}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tool Runtime Comparison Chart */}
      <div className="comparison-chart mb-8" ref={chartContainerRef}>
        <h3 className="text-base font-medium text-gray-700 mb-4">Common Tools Runtime ({selectedBattery} Battery)</h3>
        
        <div className="chart-container relative h-64 overflow-x-auto md:overflow-visible px-8">
          {/* Y-axis with clear labels */}
          <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between">
            <div className="text-xs text-gray-500 -translate-y-2">8 hrs</div>
            <div className="text-xs text-gray-500">6 hrs</div>
            <div className="text-xs text-gray-500">4 hrs</div>
            <div className="text-xs text-gray-500">2 hrs</div>
            <div className="text-xs text-gray-500 translate-y-2">0 hrs</div>
          </div>
          
          {/* Grid lines */}
          <div className="absolute left-10 right-0 top-0 bottom-0">
            {[0, 2, 4, 6, 8].map(hrs => (
              <div 
                key={hrs} 
                className="absolute left-0 right-0 border-t border-gray-100"
                style={{ bottom: `${(hrs / 8) * 100}%` }}
              ></div>
            ))}
          </div>
          
          {/* Tool bars with stacked battery comparisons */}
          <div className="absolute left-12 right-4 top-0 bottom-0 flex justify-around">
            {runtimeData.tools.map((tool, index) => {
              // Calculate runtime for the selected battery
              const runtime = calculateRuntime(
                runtimeData.batteries[selectedBattery as keyof typeof runtimeData.batteries],
                tool.consumption
              );
              
              // Calculate runtimes for other batteries
              const otherBatteryRuntimes = Object.entries(runtimeData.batteries)
                .filter(([battery]) => battery !== selectedBattery)
                .map(([battery, ah]) => ({
                  battery,
                  runtime: calculateRuntime(ah, tool.consumption)
                }));
              
              const maxPossibleRuntime = 8; // Setting a fixed max for better visualization
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
                  
                  {/* Comparison lines for other batteries */}
                  {otherBatteryRuntimes.map((otherBattery) => (
                    <div 
                      key={otherBattery.battery}
                      className="absolute left-0 right-0 border-t-2 border-dashed pointer-events-none"
                      style={{ 
                        bottom: `${(otherBattery.runtime / maxPossibleRuntime) * 100}%`, 
                        borderColor: getBatteryColor(otherBattery.battery, true),
                        width: barWidth,
                        maxWidth: '80px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}
                    ></div>
                  ))}
                  
                  <div className={`text-xs font-medium mt-2 text-center transition-colors ${
                    isSelected ? 'text-blue-700' : 'text-gray-700'
                  }`} style={{ width: barWidth, maxWidth: '80px' }}>
                    {tool.name}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Battery legend */}
          <div className="absolute top-2 right-2 flex items-center text-xs">
            <div className="flex items-center mr-3">
              <div className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: getBatteryColor(selectedBattery) }}></div>
              <span>Selected Battery</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-0 border-t-2 border-dashed mr-1" style={{ borderColor: getBatteryColor(Object.keys(runtimeData.batteries).find(b => b !== selectedBattery) || '6Ah', true) }}></div>
              <span>Other Batteries</span>
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-500 mt-4">
          Click on a tool to select it and see detailed runtime information
        </div>
      </div>

      {/* Interactive Calculator with Scenario-Based Recommendations */}
      <div className="calculator-container bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 mb-8">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <h3 className="font-medium flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Battery Calculator
          </h3>
          <p className="text-xs text-blue-100 mt-1">
            Find the perfect battery combination for your specific needs
          </p>
        </div>
        
        <div className="p-5">
          <div className="mb-5">
            <div className="text-sm font-medium text-gray-700 mb-2">
              How will you use your {selectedToolObj ? selectedToolObj.name : 'tool'}?
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { id: 'continuous', label: 'Continuous Use', icon: Clock },
                { id: 'intermittent', label: 'Intermittent Use', icon: Pause }
              ].map(option => (
                <div
                  key={option.id}
                  className={`use-case-option flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    useCase === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setUseCase(option.id)}
                >
                  <div className={`p-2 rounded-full mr-3 ${
                    useCase === option.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <option.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm ${useCase === option.id ? 'font-medium text-blue-800' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                How many total hours do you need to run your tool?
              </label>
              
              <div className="flex items-center">
                <button 
                  className="p-2 rounded-l-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  onClick={() => setHoursNeeded(Math.max(1, hoursNeeded - 1))}
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <input
                  type="number"
                  value={hoursNeeded}
                  onChange={e => setHoursNeeded(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-16 text-center py-2 border-t border-b border-gray-300 text-gray-800"
                />
                
                <button 
                  className="p-2 rounded-r-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  onClick={() => setHoursNeeded(hoursNeeded + 1)}
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <span className="ml-2 text-sm text-gray-600">hours</span>
              </div>
            </div>
          </div>
          
          <button
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
            onClick={() => setShowRecommendation(true)}
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate Recommendation
          </button>
          
          {/* Recommendation result */}
          {showRecommendation && (
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-800 mb-3">
                Based on your needs, we recommend:
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-4">
                {getScenarioRecommendations().map((rec, i) => (
                  <div 
                    key={i}
                    className={`recommendation p-4 rounded-lg border-2 ${
                      rec.optimal ? 'border-green-300 bg-green-50' : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        rec.optimal ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <Battery className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-800">{rec.scenario}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{rec.configuration}</div>
                      </div>
                      
                      {rec.optimal && (
                        <div className="ml-auto py-1 px-2 bg-green-500 text-white text-xs rounded-full">
                          Optimal
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Benefits:</div>
                        <ul className="space-y-1 text-gray-600">
                          {rec.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start">
                              <Check className="w-3 h-3 text-green-500 mt-0.5 mr-1 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Ideal for:</div>
                        <ul className="space-y-1 text-gray-600">
                          {rec.idealFor.map((ideal, i) => (
                            <li key={i} className="flex items-start">
                              <User className="w-3 h-3 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                              <span>{ideal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-start">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 mr-2" />
                <div>
                  Our intelligent algorithm calculates the optimal battery combination based on your tool's power consumption ({selectedToolObj?.consumption}Ah/hr) and your runtime needs.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Battery Configuration Comparison */}
      <div className="comparison-tool bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-8">
        <h3 className="text-base font-medium text-gray-700 mb-4">Compare Configuration Options</h3>
        
        <div className="config-selector flex gap-2 mb-5">
          {configurations.map(config => (
            <button
              key={config.id}
              className={`flex-1 p-2 text-sm rounded-lg transition-all ${
                selectedConfig === config.id
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedConfig(config.id)}
            >
              {config.label}
            </button>
          ))}
        </div>
        
        <div className="selected-config p-4 border border-blue-100 rounded-lg bg-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="config-details">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                {getConfigById(selectedConfig).label} Configuration
              </h4>
              
              <div className="text-lg font-bold text-gray-900 mb-1">
                {getConfigById(selectedConfig).batteries}
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3 text-sm">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Runtime: <strong>{getConfigById(selectedConfig).runtime}</strong></span>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Cost: <strong>{getConfigById(selectedConfig).cost}</strong></span>
                </div>
                
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Efficiency: <strong>{getConfigById(selectedConfig).efficiency}%</strong></span>
                </div>
                
                <div className="flex items-center">
                  <BarChart className="w-4 h-4 text-gray-500 mr-2" />
                  <span>Weight: <strong>{getConfigById(selectedConfig).weight}</strong></span>
                </div>
              </div>
            </div>
            
            <div className="config-visualization flex justify-center items-center">
              {/* Visual representation of the selected battery configuration */}
              <div className="relative">
                {/* Render different battery combinations based on selection */}
                {renderBatteryVisual(selectedConfig)}
                
                <div className="text-center mt-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {getConfigById(selectedConfig).runtime} total runtime
                </div>
              </div>
            </div>
          </div>
          
          {/* Context for this configuration */}
          <div className="mt-4 text-sm text-blue-700 flex items-start">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 mr-2" />
            <p>{getConfigContext(selectedConfig)}</p>
          </div>
        </div>
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

export default EnhancedRuntimeCalculator2;