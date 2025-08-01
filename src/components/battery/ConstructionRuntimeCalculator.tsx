import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, Calculator, Clock, Battery, Zap, ChevronRight, ShoppingCart, Info, 
  Settings, Check, Minus, Plus, DollarSign, User, Pause, BarChart, Users, Loader, Wrench
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

// Helper function to get battery color
const getBatteryColor = (batteryId: string, isDashed: boolean = false): string => {
  const colors = {
    '6Ah': isDashed ? 'rgba(59, 130, 246, 0.5)' : '#3B82F6', // blue
    '9Ah': isDashed ? 'rgba(99, 102, 241, 0.5)' : '#6366F1', // indigo
    '15Ah': isDashed ? 'rgba(139, 92, 246, 0.5)' : '#8B5CF6', // purple
  };
  return colors[batteryId as keyof typeof colors] || '#3B82F6';
};

// Helper function to calculate job site needs
const calculateJobSiteNeeds = (
  toolId: string, 
  jobDuration: number, 
  workerCount: number, 
  usageType: string,
  toolConsumption: number,
  selectedBatterySize: string
) => {
  // Usage percentage based on pattern
  const usagePercentages = {
    'light': 0.25,
    'moderate': 0.5,
    'heavy': 0.75,
    'continuous': 0.9
  };
  
  const usagePercent = usagePercentages[usageType as keyof typeof usagePercentages];
  
  // Calculate total Ah needed for the job
  const hoursInUse = jobDuration * usagePercent;
  const totalAhNeeded = hoursInUse * toolConsumption * workerCount;
  
  // Battery capacities
  const batterySizes = {
    '6Ah': 6,
    '9Ah': 9,
    '15Ah': 15
  };
  
  // Get selected battery capacity
  const selectedBatteryCapacity = batterySizes[selectedBatterySize as keyof typeof batterySizes];
  
  // Calculate how many batteries needed
  const batteriesNeeded = Math.ceil(totalAhNeeded / selectedBatteryCapacity);
  
  // Determine chargers needed (1 charger for every 2-3 batteries)
  const chargersNeeded = Math.ceil(batteriesNeeded / 3);
  
  // Calculate total runtime with these batteries
  const totalRuntime = (batteriesNeeded * selectedBatteryCapacity / toolConsumption).toFixed(1);
  
  // Generate explanation
  let explanation = `This setup provides enough power for ${workerCount} worker${workerCount > 1 ? 's' : ''} using ${usageType} intensity for a ${jobDuration}-hour job.`;
  
  if (batteriesNeeded > 2) {
    explanation += ` Charger${chargersNeeded > 1 ? 's' : ''} will keep batteries rotating for continuous work.`;
  }
  
  return {
    batteryCount: batteriesNeeded,
    batterySize: selectedBatterySize,
    chargerCount: chargersNeeded,
    totalRuntime,
    explanation
  };
};

// Get job site metrics based on tool and battery
const getJobSiteMetrics = (toolId: string, batterySize: string) => {
  // Mapping of tools to job site metrics
  const metricsMap: any = {
    'circularSaw': {
      '6Ah': [
        { metric: "Cut up to 175", unit: "linear feet", icon: "saw", context: "Standard 2×4 lumber" },
        { metric: "Complete", unit: "1.2 hours of work", icon: "clock", context: "Typical framing tasks" },
        { metric: "Process up to 15", unit: "sheets of plywood", icon: "plywood", context: "Based on standard 4×8 sheets" }
      ],
      '9Ah': [
        { metric: "Cut up to 260", unit: "linear feet", icon: "saw", context: "Standard 2×4 lumber" },
        { metric: "Complete", unit: "1.8 hours of work", icon: "clock", context: "Typical framing tasks" },
        { metric: "Process up to 22", unit: "sheets of plywood", icon: "plywood", context: "Based on standard 4×8 sheets" }
      ],
      '15Ah': [
        { metric: "Cut up to 430", unit: "linear feet", icon: "saw", context: "Standard 2×4 lumber" },
        { metric: "Complete", unit: "3 hours of work", icon: "clock", context: "Typical framing tasks" },
        { metric: "Process up to 36", unit: "sheets of plywood", icon: "plywood", context: "Based on standard 4×8 sheets" }
      ]
    },
    'drill': {
      '6Ah': [
        { metric: "Drill up to 120", unit: "1/2-inch holes", icon: "drill", context: "Through standard lumber" },
        { metric: "Complete", unit: "3 hours of work", icon: "clock", context: "General construction tasks" },
        { metric: "Install up to 30", unit: "door hinges", icon: "hinge", context: "Including pilot holes" }
      ],
      '9Ah': [
        { metric: "Drill up to 180", unit: "1/2-inch holes", icon: "drill", context: "Through standard lumber" },
        { metric: "Complete", unit: "4.5 hours of work", icon: "clock", context: "General construction tasks" },
        { metric: "Install up to 45", unit: "door hinges", icon: "hinge", context: "Including pilot holes" }
      ],
      '15Ah': [
        { metric: "Drill up to 300", unit: "1/2-inch holes", icon: "drill", context: "Through standard lumber" },
        { metric: "Complete", unit: "7.5 hours of work", icon: "clock", context: "General construction tasks" },
        { metric: "Install up to 75", unit: "door hinges", icon: "hinge", context: "Including pilot holes" }
      ]
    },
    'impactDriver': {
      '6Ah': [
        { metric: "Drive up to 225", unit: "3-inch screws", icon: "screw", context: "Typical for framing walls" },
        { metric: "Complete", unit: "2 hours of work", icon: "clock", context: "Half-day job site usage" },
        { metric: "Install up to 40", unit: "sheets of drywall", icon: "drywall", context: "Based on standard 4×8 sheets" }
      ],
      '9Ah': [
        { metric: "Drive up to 340", unit: "3-inch screws", icon: "screw", context: "Typical for framing walls" },
        { metric: "Complete", unit: "3 hours of work", icon: "clock", context: "Half-day job site usage" },
        { metric: "Install up to 60", unit: "sheets of drywall", icon: "drywall", context: "Based on standard 4×8 sheets" }
      ],
      '15Ah': [
        { metric: "Drive up to 560", unit: "3-inch screws", icon: "screw", context: "Typical for framing walls" },
        { metric: "Complete", unit: "5 hours of work", icon: "clock", context: "Full-day job site usage" },
        { metric: "Install up to 100", unit: "sheets of drywall", icon: "drywall", context: "Based on standard 4×8 sheets" }
      ]
    },
    'recip': {
      '6Ah': [
        { metric: "Make up to 85", unit: "demolition cuts", icon: "demo", context: "Through mixed materials" },
        { metric: "Complete", unit: "1.3 hours of work", icon: "clock", context: "Typical demo work" },
        { metric: "Cut up to 40", unit: "PVC pipes", icon: "pipe", context: "Standard 2-inch diameter" }
      ],
      '9Ah': [
        { metric: "Make up to 130", unit: "demolition cuts", icon: "demo", context: "Through mixed materials" },
        { metric: "Complete", unit: "2 hours of work", icon: "clock", context: "Typical demo work" },
        { metric: "Cut up to 60", unit: "PVC pipes", icon: "pipe", context: "Standard 2-inch diameter" }
      ],
      '15Ah': [
        { metric: "Make up to 215", unit: "demolition cuts", icon: "demo", context: "Through mixed materials" },
        { metric: "Complete", unit: "3.3 hours of work", icon: "clock", context: "Typical demo work" },
        { metric: "Cut up to 100", unit: "PVC pipes", icon: "pipe", context: "Standard 2-inch diameter" }
      ]
    },
    'grinder': {
      '6Ah': [
        { metric: "Grind up to 45", unit: "linear feet", icon: "grind", context: "On concrete surfaces" },
        { metric: "Complete", unit: "1.1 hours of work", icon: "clock", context: "Surface prep tasks" },
        { metric: "Cut up to 20", unit: "metal rebar", icon: "metal", context: "Standard #4 rebar" }
      ],
      '9Ah': [
        { metric: "Grind up to 70", unit: "linear feet", icon: "grind", context: "On concrete surfaces" },
        { metric: "Complete", unit: "1.6 hours of work", icon: "clock", context: "Surface prep tasks" },
        { metric: "Cut up to 30", unit: "metal rebar", icon: "metal", context: "Standard #4 rebar" }
      ],
      '15Ah': [
        { metric: "Grind up to 115", unit: "linear feet", icon: "grind", context: "On concrete surfaces" },
        { metric: "Complete", unit: "2.7 hours of work", icon: "clock", context: "Surface prep tasks" },
        { metric: "Cut up to 50", unit: "metal rebar", icon: "metal", context: "Standard #4 rebar" }
      ]
    }
  };
  
  // Return the appropriate metrics or a default if not found
  return metricsMap[toolId]?.[batterySize] || [
    { metric: "Complete", unit: "several hours of work", icon: "clock", context: "Typical job site tasks" },
    { metric: "Perform", unit: "multiple operations", icon: "tool", context: "Various construction tasks" },
    { metric: "Handle", unit: "a half-day project", icon: "project", context: "Common site applications" }
  ];
};

// Comparison table data
const getBatteryComparisonData = (toolId: string) => {
  // Map of runtime data for each tool/battery combination
  const runtimeMap: any = {
    'circularSaw': {
      '6Ah': { runtime: "1.2 hrs", jobSize: "Small", weight: "Light (1.9 lbs)", chargeTime: "45 min", bestFor: "Quick cutting tasks, small framing jobs" },
      '9Ah': { runtime: "1.8 hrs", jobSize: "Medium", weight: "Medium (2.4 lbs)", chargeTime: "55 min", bestFor: "Most framing & cutting work" },
      '15Ah': { runtime: "3.0 hrs", jobSize: "Large", weight: "Heavy (3.2 lbs)", chargeTime: "90 min", bestFor: "High-volume cutting, all-day use" }
    },
    'drill': {
      '6Ah': { runtime: "3.0 hrs", jobSize: "Small-Medium", weight: "Light (1.9 lbs)", chargeTime: "45 min", bestFor: "General drilling, cabinet installation" },
      '9Ah': { runtime: "4.5 hrs", jobSize: "Medium", weight: "Medium (2.4 lbs)", chargeTime: "55 min", bestFor: "All-day drilling tasks" },
      '15Ah': { runtime: "7.5 hrs", jobSize: "Large", weight: "Heavy (3.2 lbs)", chargeTime: "90 min", bestFor: "Heavy-duty drilling in dense materials" }
    },
    'impactDriver': {
      '6Ah': { runtime: "2.0 hrs", jobSize: "Small", weight: "Light (1.9 lbs)", chargeTime: "45 min", bestFor: "Quick fastening tasks, finish work" },
      '9Ah': { runtime: "3.0 hrs", jobSize: "Medium", weight: "Medium (2.4 lbs)", chargeTime: "55 min", bestFor: "Daily construction use" },
      '15Ah': { runtime: "5.0 hrs", jobSize: "Large", weight: "Heavy (3.2 lbs)", chargeTime: "90 min", bestFor: "Full-day heavy duty fastening" }
    },
    'recip': {
      '6Ah': { runtime: "1.3 hrs", jobSize: "Small", weight: "Light (1.9 lbs)", chargeTime: "45 min", bestFor: "Light demolition, small pipe cutting" },
      '9Ah': { runtime: "2.0 hrs", jobSize: "Medium", weight: "Medium (2.4 lbs)", chargeTime: "55 min", bestFor: "General demolition work" },
      '15Ah': { runtime: "3.3 hrs", jobSize: "Large", weight: "Heavy (3.2 lbs)", chargeTime: "90 min", bestFor: "Heavy demolition, continuous cutting" }
    },
    'grinder': {
      '6Ah': { runtime: "1.1 hrs", jobSize: "Small", weight: "Light (1.9 lbs)", chargeTime: "45 min", bestFor: "Touch-up grinding, small cuts" },
      '9Ah': { runtime: "1.6 hrs", jobSize: "Medium", weight: "Medium (2.4 lbs)", chargeTime: "55 min", bestFor: "Standard grinding tasks" },
      '15Ah': { runtime: "2.7 hrs", jobSize: "Large", weight: "Heavy (3.2 lbs)", chargeTime: "90 min", bestFor: "Extended surface prep, heavy cutting" }
    }
  };
  
  return runtimeMap[toolId] || {
    '6Ah': { runtime: "~2 hrs", jobSize: "Small", weight: "Light (1.9 lbs)", chargeTime: "45 min", bestFor: "Light-duty work" },
    '9Ah': { runtime: "~3 hrs", jobSize: "Medium", weight: "Medium (2.4 lbs)", chargeTime: "55 min", bestFor: "Standard job site work" },
    '15Ah': { runtime: "~5 hrs", jobSize: "Large", weight: "Heavy (3.2 lbs)", chargeTime: "90 min", bestFor: "Heavy-duty applications" }
  };
};

const ConstructionRuntimeCalculator: React.FC<RuntimeCalculatorProps> = ({
  selectedBattery,
  setSelectedBattery,
  isMobile,
  runtimeData
}) => {
  const [selectedTool, setSelectedTool] = useState(runtimeData.tools[0].id);
  const [jobDuration, setJobDuration] = useState(8); // Hours
  const [workerCount, setWorkerCount] = useState(1);
  const [usageType, setUsageType] = useState('moderate');
  
  const selectedToolObj = runtimeData.tools.find(t => t.id === selectedTool);
  
  // Calculate runtime based on battery and tool consumption
  function calculateRuntime(batteryAh: number, toolConsumption: number) {
    return batteryAh / toolConsumption;
  }

  return (
    <div className="construction-runtime-calculator">
      {/* Tool and Battery Selection */}
      <div className="selection-container bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-base font-medium text-gray-800 mb-4">Select Your Tool & Battery</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Power Tool</label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-2.5 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedTool}
                onChange={e => setSelectedTool(e.target.value)}
              >
                {runtimeData.tools.map(tool => (
                  <option key={tool.id} value={tool.id}>{tool.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Battery Size</label>
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
      </div>
      
      {/* 1. Job Site-Focused Runtime Context */}
      <div className="job-metrics bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-base font-medium text-gray-800 mb-3">
          Your {selectedToolObj?.name} with {selectedBattery} Battery Can:
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {getJobSiteMetrics(selectedTool, selectedBattery).map((item, idx) => (
            <div key={idx} className="metric-card bg-gray-50 rounded border border-gray-200 p-3">
              <div className="text-base font-bold text-gray-900">{item.metric}</div>
              <div className="text-sm font-medium text-gray-700">{item.unit}</div>
              <div className="text-xs text-gray-500 mt-1">{item.context}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 2. No-Nonsense Comparison Table */}
      <div className="comparison-table-container bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-base font-medium text-gray-800 mb-3">
          Battery Comparison for {selectedToolObj?.name}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 border border-gray-200 font-medium">Battery</th>
                <th className="py-2 px-3 border border-gray-200 font-medium">Runtime</th>
                <th className="py-2 px-3 border border-gray-200 font-medium">Job Size</th>
                <th className="py-2 px-3 border border-gray-200 font-medium">Weight</th>
                <th className="py-2 px-3 border border-gray-200 font-medium">Charge Time</th>
                <th className="py-2 px-3 border border-gray-200 font-medium">Best For</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(getBatteryComparisonData(selectedTool)).map(([battery, data]: [string, any]) => (
                <tr key={battery} className={selectedBattery === battery ? 'bg-blue-50' : ''}>
                  <td className="py-2 px-3 border border-gray-200 font-medium">{battery}</td>
                  <td className="py-2 px-3 border border-gray-200">{data.runtime}</td>
                  <td className="py-2 px-3 border border-gray-200">{data.jobSize}</td>
                  <td className="py-2 px-3 border border-gray-200">{data.weight}</td>
                  <td className="py-2 px-3 border border-gray-200">{data.chargeTime}</td>
                  <td className="py-2 px-3 border border-gray-200">{data.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <strong>Note:</strong> Based on continuous use. Actual runtime may be longer with intermittent use on the job site.
        </div>
      </div>
      
      {/* 3. Job Site Battery Planning Tool */}
      <div className="job-site-planner bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-100 p-3 border-b border-gray-200">
          <h3 className="text-base font-medium">Job Site Battery Planner</h3>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Duration
              </label>
              <div className="flex">
                <select 
                  value={jobDuration} 
                  onChange={e => setJobDuration(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                >
                  <option value={4}>Half Day (4 hrs)</option>
                  <option value={8}>Full Day (8 hrs)</option>
                  <option value={16}>2 Days (16 hrs)</option>
                  <option value={24}>3 Days (24 hrs)</option>
                  <option value={40}>Week (40 hrs)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Workers Using Tool
              </label>
              <input 
                type="number" 
                min="1" 
                max="10"
                value={workerCount} 
                onChange={e => setWorkerCount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Pattern
              </label>
              <select 
                value={usageType} 
                onChange={e => setUsageType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
              >
                <option value="light">Light (25% of time)</option>
                <option value="moderate">Moderate (50% of time)</option>
                <option value="heavy">Heavy (75% of time)</option>
                <option value="continuous">Continuous (90%+ of time)</option>
              </select>
            </div>
          </div>
          
          {selectedToolObj && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Recommended Setup:</h4>
              
              {(() => {
                const recommendation = calculateJobSiteNeeds(
                  selectedTool,
                  jobDuration,
                  workerCount,
                  usageType,
                  selectedToolObj.consumption,
                  selectedBattery
                );
                
                return (
                  <>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="py-1 px-3 bg-blue-100 rounded-full text-sm font-medium text-blue-800 flex items-center">
                        <Battery className="w-4 h-4 mr-1" />
                        {recommendation.batteryCount}× {recommendation.batterySize} Batteries
                      </div>
                      <span className="text-gray-500">+</span>
                      <div className="py-1 px-3 bg-blue-100 rounded-full text-sm font-medium text-blue-800 flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        {recommendation.chargerCount}× Charger{recommendation.chargerCount > 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700">{recommendation.explanation}</p>
                    
                    <div className="mt-3 text-sm">
                      <strong className="font-medium text-gray-800">Total Runtime:</strong> <span className="text-gray-700">{recommendation.totalRuntime} hours</span>
                    </div>
                    
                    <div className="mt-4 p-3 border border-blue-200 bg-white rounded-lg flex items-start">
                      <div className="p-2 bg-blue-100 rounded-full mr-3 flex-shrink-0">
                        <Wrench className="w-4 h-4 text-blue-700" />
                      </div>
                      <div className="text-sm text-blue-800">
                        <strong>Pro Tip:</strong> For job sites without reliable power, add an extra battery and rotate charging during breaks to maximize productivity.
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
      
      {/* Add to Cart Button */}
      <div className="flex justify-center">
        <button className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
          <ShoppingCart className="w-5 h-5" />
          <span>Add Recommended Batteries to Cart</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ConstructionRuntimeCalculator;