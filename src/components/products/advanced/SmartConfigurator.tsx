'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Settings, Zap, Calculator, Clock, DollarSign, Target, Brain, 
  BarChart3, Gauge, Battery, Wrench, Calendar, TrendingUp,
  CheckCircle, AlertTriangle, Info, ArrowRight, Sparkles,
  RotateCcw, Share2, Download, Play, Pause, RefreshCw
} from 'lucide-react';
import { useSmartRecommendations } from '@/hooks/useSmartRecommendations';
import { performancePredictor } from '@/services/product-intelligence/PerformancePredictor';

interface Product {
  id: string;
  name: string;
  capacity: string;
  voltage: string;
  price: number;
  specs: {
    runtime: string;
    weight: string;
    chargingTime: string;
  };
}

interface CustomerProfile {
  id?: string;
  segment: 'residential' | 'commercial' | 'industrial';
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  budgetRange: [number, number];
  priorityFactors: string[];
  previousPurchases: string[];
}

interface UsageRequirements {
  dailyUsageHours: number;
  peakPowerNeeds: number;
  toolCompatibility: string[];
  workEnvironment: 'indoor' | 'outdoor' | 'mixed';
  temperatureRange: [number, number];
  mobilityNeeds: 'stationary' | 'portable' | 'highly_mobile';
  backupRequirements: boolean;
}

interface ProductConfiguration {
  primaryBattery: Product;
  backupBatteries: Product[];
  chargers: number;
  accessories: string[];
  totalCost: number;
  estimatedRoi: number;
  paybackPeriod: number;
}

interface PerformanceMetrics {
  dailyRuntime: number;
  weeklyProductivity: number;
  annualSavings: number;
  maintenanceCost: number;
  replacementSchedule: Array<{
    item: string;
    date: Date;
    cost: number;
  }>;
  efficiencyScore: number;
}

interface ConfigurationSuggestion {
  id: string;
  type: 'optimization' | 'alternative' | 'upgrade' | 'cost_saving';
  title: string;
  description: string;
  impact: number;
  savings?: number;
  implementation: string;
  confidence: number;
}

interface SmartConfiguratorProps {
  baseProduct?: Product;
  customerProfile?: CustomerProfile;
  usageRequirements?: UsageRequirements;
  onConfigurationChange?: (config: ProductConfiguration) => void;
  className?: string;
}

export function SmartConfigurator({
  baseProduct,
  customerProfile,
  usageRequirements,
  onConfigurationChange,
  className = ''
}: SmartConfiguratorProps) {
  const [configuration, setConfiguration] = useState<ProductConfiguration | null>(null);
  const [suggestions, setSuggestions] = useState<ConfigurationSuggestion[]>([]);
  const [performanceSimulation, setPerformanceSimulation] = useState<PerformanceMetrics | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentView, setCurrentView] = useState<'configure' | 'simulate' | 'analyze' | 'share'>('configure');
  const [isLoading, setIsLoading] = useState(false);

  // Form state for configuration
  const [profile, setProfile] = useState<CustomerProfile>(customerProfile || {
    segment: 'commercial',
    experienceLevel: 'intermediate',
    budgetRange: [500, 2000],
    priorityFactors: ['runtime', 'reliability'],
    previousPurchases: []
  });

  const [requirements, setRequirements] = useState<UsageRequirements>(usageRequirements || {
    dailyUsageHours: 8,
    peakPowerNeeds: 1500,
    toolCompatibility: ['drill', 'saw', 'grinder'],
    workEnvironment: 'mixed',
    temperatureRange: [40, 100],
    mobilityNeeds: 'portable',
    backupRequirements: true
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const simulationRef = useRef<HTMLDivElement>(null);

  const { trackAction } = useSmartRecommendations();

  // Available products database
  const availableProducts: Product[] = [
    {
      id: '6Ah',
      name: '6Ah FlexVolt Battery',
      capacity: '6Ah',
      voltage: '20V/60V',
      price: 95,
      specs: {
        runtime: '4 hours',
        weight: '1.9 lbs',
        chargingTime: '60 minutes'
      }
    },
    {
      id: '9Ah',
      name: '9Ah FlexVolt Battery',
      capacity: '9Ah',
      voltage: '20V/60V',
      price: 125,
      specs: {
        runtime: '6.5 hours',
        weight: '2.4 lbs',
        chargingTime: '90 minutes'
      }
    },
    {
      id: '15Ah',
      name: '15Ah FlexVolt Battery',
      capacity: '15Ah',
      voltage: '20V/60V',
      price: 245,
      specs: {
        runtime: '10 hours',
        weight: '3.2 lbs',
        chargingTime: '120 minutes'
      }
    }
  ];

  // Generate AI-powered configuration recommendations
  const generateConfiguration = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // AI algorithm to determine optimal battery configuration
      const optimalConfig = await calculateOptimalConfiguration(profile, requirements);
      setConfiguration(optimalConfig);
      
      // Generate intelligent suggestions
      const aiSuggestions = await generateAISuggestions(optimalConfig, profile, requirements);
      setSuggestions(aiSuggestions);
      
      // Run performance simulation
      const performanceResults = await simulatePerformance(optimalConfig, requirements);
      setPerformanceSimulation(performanceResults);
      
      // Track configuration generation
      trackAction({
        type: 'configure',
        metadata: {
          segment: profile.segment,
          dailyUsage: requirements.dailyUsageHours,
          budgetRange: profile.budgetRange
        }
      });
      
      onConfigurationChange?.(optimalConfig);
      
    } catch (error) {
      console.error('Configuration generation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile, requirements, trackAction, onConfigurationChange]);

  // Calculate optimal configuration using AI algorithms
  const calculateOptimalConfiguration = async (
    customerProfile: CustomerProfile,
    usageReqs: UsageRequirements
  ): Promise<ProductConfiguration> => {
    
    // Calculate required capacity based on usage
    const requiredCapacity = usageReqs.dailyUsageHours * (usageReqs.peakPowerNeeds / 1000);
    
    // Select primary battery based on requirements and budget
    let primaryBattery = availableProducts[1]; // Default to 9Ah
    
    if (requiredCapacity > 8 || customerProfile.segment === 'industrial') {
      primaryBattery = availableProducts[2]; // 15Ah
    } else if (requiredCapacity < 5 || customerProfile.budgetRange[1] < 150) {
      primaryBattery = availableProducts[0]; // 6Ah
    }

    // Calculate backup batteries
    const backupBatteries: Product[] = [];
    if (usageReqs.backupRequirements) {
      if (customerProfile.segment === 'industrial') {
        backupBatteries.push(primaryBattery, primaryBattery); // 2 backups for industrial
      } else if (customerProfile.segment === 'commercial') {
        backupBatteries.push(primaryBattery); // 1 backup for commercial
      }
    }

    // Calculate chargers needed
    const totalBatteries = 1 + backupBatteries.length;
    const chargersNeeded = Math.min(totalBatteries, customerProfile.segment === 'industrial' ? 3 : 2);

    // Select accessories based on usage
    const accessories = [];
    if (usageReqs.workEnvironment === 'outdoor') {
      accessories.push('Weather Protection Case');
    }
    if (usageReqs.mobilityNeeds === 'highly_mobile') {
      accessories.push('Portable Charging Station');
    }
    if (customerProfile.experienceLevel === 'expert') {
      accessories.push('Battery Analyzer');
    }

    // Calculate total cost
    const batteryCost = primaryBattery.price + backupBatteries.reduce((sum, b) => sum + b.price, 0);
    const chargerCost = chargersNeeded * 50; // $50 per charger
    const accessoryCost = accessories.length * 25; // $25 per accessory
    const totalCost = batteryCost + chargerCost + accessoryCost;

    // Calculate ROI and payback period
    const annualSavings = calculateAnnualSavings(primaryBattery, usageReqs);
    const estimatedRoi = (annualSavings / totalCost) * 100;
    const paybackPeriod = totalCost / annualSavings;

    return {
      primaryBattery,
      backupBatteries,
      chargers: chargersNeeded,
      accessories,
      totalCost,
      estimatedRoi,
      paybackPeriod
    };
  };

  // Calculate annual savings from battery investment
  const calculateAnnualSavings = (battery: Product, usageReqs: UsageRequirements): number => {
    // Simplified calculation based on productivity gains and reduced downtime
    const dailyProductivityValue = 200; // $200 per day base productivity
    const efficiencyGain = battery.capacity === '15Ah' ? 0.15 : battery.capacity === '9Ah' ? 0.10 : 0.05;
    const downtimeReduction = usageReqs.backupRequirements ? 0.95 : 0.8; // 95% vs 80% uptime
    
    const workDaysPerYear = 250;
    const annualSavings = dailyProductivityValue * efficiencyGain * downtimeReduction * workDaysPerYear;
    
    return annualSavings;
  };

  // Generate AI-powered suggestions for optimization
  const generateAISuggestions = async (
    config: ProductConfiguration,
    customerProfile: CustomerProfile,
    usageReqs: UsageRequirements
  ): Promise<ConfigurationSuggestion[]> => {
    
    const suggestions: ConfigurationSuggestion[] = [];

    // Budget optimization suggestion
    if (config.totalCost > customerProfile.budgetRange[1]) {
      suggestions.push({
        id: 'budget_optimization',
        type: 'cost_saving',
        title: 'Budget Optimization Available',
        description: `Reduce costs by ${((config.totalCost - customerProfile.budgetRange[1]) / config.totalCost * 100).toFixed(0)}% while maintaining 90% performance`,
        impact: 0.9,
        savings: config.totalCost - customerProfile.budgetRange[1],
        implementation: 'Switch to 6Ah primary with single backup',
        confidence: 0.85
      });
    }

    // Performance upgrade suggestion
    if (config.primaryBattery.capacity !== '15Ah' && customerProfile.budgetRange[1] > config.totalCost + 100) {
      suggestions.push({
        id: 'performance_upgrade',
        type: 'upgrade',
        title: 'Performance Upgrade Opportunity',
        description: 'Upgrade to 15Ah for 40% longer runtime and increased productivity',
        impact: 1.4,
        implementation: 'Upgrade primary battery to 15Ah FlexVolt',
        confidence: 0.92
      });
    }

    // Seasonal optimization
    if (usageReqs.workEnvironment === 'outdoor') {
      suggestions.push({
        id: 'seasonal_optimization',
        type: 'optimization',
        title: 'Seasonal Performance Optimization',
        description: 'Add cold-weather accessories for consistent winter performance',
        impact: 1.15,
        implementation: 'Include heated battery cases for sub-freezing conditions',
        confidence: 0.78
      });
    }

    // Maintenance optimization
    suggestions.push({
      id: 'maintenance_optimization',
      type: 'optimization',
      title: 'Predictive Maintenance Integration',
      description: 'Reduce maintenance costs by 25% with AI-powered battery health monitoring',
      impact: 1.25,
      savings: config.totalCost * 0.05, // 5% annual savings
      implementation: 'Add smart battery monitoring system',
      confidence: 0.88
    });

    return suggestions;
  };

  // Simulate performance with the current configuration
  const simulatePerformance = async (
    config: ProductConfiguration,
    usageReqs: UsageRequirements
  ): Promise<PerformanceMetrics> => {
    
    // Calculate daily runtime
    const batteryCapacity = parseInt(config.primaryBattery.capacity);
    const powerConsumption = usageReqs.peakPowerNeeds / 1000; // Convert to kW
    const dailyRuntime = (batteryCapacity * 0.8) / powerConsumption; // 80% usable capacity

    // Calculate weekly productivity
    const dailyProductivity = Math.min(dailyRuntime, usageReqs.dailyUsageHours) / usageReqs.dailyUsageHours;
    const weeklyProductivity = dailyProductivity * 5; // 5 work days

    // Calculate annual savings
    const annualSavings = calculateAnnualSavings(config.primaryBattery, usageReqs);

    // Calculate maintenance costs
    const maintenanceCost = config.totalCost * 0.08; // 8% annual maintenance

    // Generate replacement schedule
    const replacementSchedule = [
      {
        item: 'Battery Health Check',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        cost: 50
      },
      {
        item: 'Charger Maintenance',
        date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        cost: 25
      },
      {
        item: 'Battery Replacement',
        date: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years
        cost: config.primaryBattery.price
      }
    ];

    // Calculate efficiency score
    const efficiencyScore = Math.min(100, (dailyProductivity * weeklyProductivity * 20));

    return {
      dailyRuntime,
      weeklyProductivity,
      annualSavings,
      maintenanceCost,
      replacementSchedule,
      efficiencyScore
    };
  };

  // Run real-time simulation
  const runSimulation = useCallback(async () => {
    if (!configuration) return;
    
    setIsSimulating(true);
    
    // Simulate progressive performance metrics
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (performanceSimulation) {
        setPerformanceSimulation(prev => prev ? {
          ...prev,
          efficiencyScore: (prev.efficiencyScore * i) / 100
        } : null);
      }
    }
    
    setIsSimulating(false);
  }, [configuration, performanceSimulation]);

  // Generate configuration on mount and when inputs change
  useEffect(() => {
    generateConfiguration();
  }, [generateConfiguration]);

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Brain size={24} className="text-[#006FEE]" />
              Smart Battery Configurator
            </h2>
            <p className="text-gray-600">AI-powered configuration with performance simulation and ROI analysis</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={generateConfiguration}
              disabled={isLoading}
              className="px-4 py-2 bg-[#006FEE] text-white rounded-lg hover:bg-[#0059D1] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isLoading ? 'Configuring...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {/* View Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'configure', label: 'Configure', icon: Settings },
            { id: 'simulate', label: 'Simulate', icon: Play },
            { id: 'analyze', label: 'Analyze', icon: BarChart3 },
            { id: 'share', label: 'Share', icon: Share2 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                currentView === id
                  ? 'bg-white text-[#006FEE] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Configure Tab */}
        {currentView === 'configure' && (
          <div className="space-y-8">
            {/* Customer Profile Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target size={20} className="text-[#006FEE]" />
                  Customer Profile
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Segment</label>
                    <select
                      value={profile.segment}
                      onChange={(e) => setProfile(prev => ({ ...prev, segment: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006FEE]"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                    <select
                      value={profile.experienceLevel}
                      onChange={(e) => setProfile(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006FEE]"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range: ${profile.budgetRange[0]} - ${profile.budgetRange[1]}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="3000"
                      value={profile.budgetRange[1]}
                      onChange={(e) => setProfile(prev => ({ 
                        ...prev, 
                        budgetRange: [prev.budgetRange[0], parseInt(e.target.value)] 
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Wrench size={20} className="text-[#006FEE]" />
                  Usage Requirements
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Usage: {requirements.dailyUsageHours} hours
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      value={requirements.dailyUsageHours}
                      onChange={(e) => setRequirements(prev => ({ 
                        ...prev, 
                        dailyUsageHours: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peak Power: {requirements.peakPowerNeeds}W
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="3000"
                      step="100"
                      value={requirements.peakPowerNeeds}
                      onChange={(e) => setRequirements(prev => ({ 
                        ...prev, 
                        peakPowerNeeds: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Environment</label>
                    <select
                      value={requirements.workEnvironment}
                      onChange={(e) => setRequirements(prev => ({ ...prev, workEnvironment: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006FEE]"
                    >
                      <option value="indoor">Indoor</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="backup"
                      checked={requirements.backupRequirements}
                      onChange={(e) => setRequirements(prev => ({ ...prev, backupRequirements: e.target.checked }))}
                      className="w-4 h-4 text-[#006FEE] border-gray-300 rounded focus:ring-[#006FEE]"
                    />
                    <label htmlFor="backup" className="text-sm font-medium text-gray-700">
                      Backup Batteries Required
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Results */}
            {configuration && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-[#006FEE]" />
                  Recommended Configuration
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">Primary Battery</h4>
                    <div className="flex items-center gap-3 mb-2">
                      <Battery size={20} className="text-[#006FEE]" />
                      <span className="font-medium">{configuration.primaryBattery.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Runtime: {configuration.primaryBattery.specs.runtime}</p>
                      <p>Weight: {configuration.primaryBattery.specs.weight}</p>
                      <p>Price: {formatCurrency(configuration.primaryBattery.price)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">Complete Setup</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Backup Batteries: {configuration.backupBatteries.length}</p>
                      <p>Chargers: {configuration.chargers}</p>
                      <p>Accessories: {configuration.accessories.length}</p>
                      <p className="font-semibold text-lg text-[#006FEE]">
                        Total: {formatCurrency(configuration.totalCost)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">ROI Analysis</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Annual ROI: {formatPercent(configuration.estimatedRoi)}</p>
                      <p>Payback Period: {configuration.paybackPeriod.toFixed(1)} years</p>
                      <div className="mt-2 p-2 bg-green-100 rounded text-green-800 text-xs">
                        <CheckCircle size={14} className="inline mr-1" />
                        Excellent investment opportunity
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">AI Optimization Suggestions</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {suggestions.slice(0, 4).map((suggestion) => (
                        <div key={suggestion.id} className="bg-white rounded-lg p-4 border">
                          <div className="flex items-start gap-3">
                            <div className={`p-1 rounded-full ${
                              suggestion.type === 'optimization' ? 'bg-blue-100' :
                              suggestion.type === 'upgrade' ? 'bg-purple-100' :
                              suggestion.type === 'cost_saving' ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                              {suggestion.type === 'optimization' && <Target size={14} className="text-blue-600" />}
                              {suggestion.type === 'upgrade' && <TrendingUp size={14} className="text-purple-600" />}
                              {suggestion.type === 'cost_saving' && <DollarSign size={14} className="text-green-600" />}
                              {suggestion.type === 'alternative' && <RotateCcw size={14} className="text-orange-600" />}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 text-sm">{suggestion.title}</h5>
                              <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="text-[#006FEE]">Impact: +{formatPercent((suggestion.impact - 1) * 100)}</span>
                                {suggestion.savings && (
                                  <span className="text-green-600">Saves: {formatCurrency(suggestion.savings)}</span>
                                )}
                                <span className="text-gray-500">
                                  Confidence: {formatPercent(suggestion.confidence * 100)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Simulate Tab */}
        {currentView === 'simulate' && performanceSimulation && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Performance Simulation</h3>
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="px-4 py-2 bg-[#006FEE] text-white rounded-lg hover:bg-[#0059D1] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>

            {/* Real-time Performance Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <Clock size={20} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Runtime</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{performanceSimulation.dailyRuntime.toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Daily capacity</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp size={20} className="text-green-600" />
                  <span className="text-sm font-medium text-green-600">Productivity</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(performanceSimulation.weeklyProductivity * 20)}</p>
                <p className="text-sm text-gray-600">Weekly efficiency</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign size={20} className="text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Savings</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(performanceSimulation.annualSavings)}</p>
                <p className="text-sm text-gray-600">Annual value</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <Gauge size={20} className="text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Efficiency</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{performanceSimulation.efficiencyScore.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Overall score</p>
              </div>
            </div>

            {/* 3D Battery Visualization Placeholder */}
            <div ref={simulationRef} className="bg-gray-900 rounded-xl p-8 h-64 flex items-center justify-center relative overflow-hidden">
              <div className="text-center text-white">
                <Battery size={48} className="mx-auto mb-4 text-[#006FEE]" />
                <p className="text-lg font-semibold">3D Battery Visualization</p>
                <p className="text-sm text-gray-300 mt-2">Interactive 3D model showing battery performance</p>
                {isSimulating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse" />
                )}
              </div>
            </div>

            {/* Maintenance Schedule */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-[#006FEE]" />
                Maintenance Schedule
              </h4>
              <div className="space-y-3">
                {performanceSimulation.replacementSchedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-900">{item.item}</p>
                      <p className="text-sm text-gray-600">{item.date.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(item.cost)}</p>
                      <p className="text-xs text-gray-500">Estimated cost</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analyze Tab */}
        {currentView === 'analyze' && configuration && performanceSimulation && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configuration Analysis</h3>
            
            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Primary Battery</span>
                    <span className="font-medium">{formatCurrency(configuration.primaryBattery.price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Backup Batteries ({configuration.backupBatteries.length})</span>
                    <span className="font-medium">
                      {formatCurrency(configuration.backupBatteries.reduce((sum, b) => sum + b.price, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Chargers ({configuration.chargers})</span>
                    <span className="font-medium">{formatCurrency(configuration.chargers * 50)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Accessories ({configuration.accessories.length})</span>
                    <span className="font-medium">{formatCurrency(configuration.accessories.length * 25)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center font-semibold text-lg">
                    <span>Total Investment</span>
                    <span className="text-[#006FEE]">{formatCurrency(configuration.totalCost)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">ROI Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Annual Savings</span>
                    <span className="font-medium text-green-600">{formatCurrency(performanceSimulation.annualSavings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Annual Maintenance</span>
                    <span className="font-medium text-red-600">-{formatCurrency(performanceSimulation.maintenanceCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Net Annual Benefit</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(performanceSimulation.annualSavings - performanceSimulation.maintenanceCost)}
                    </span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">ROI</span>
                      <span className="font-semibold text-[#006FEE]">{formatPercent(configuration.estimatedRoi)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Payback Period</span>
                      <span className="font-semibold text-[#006FEE]">{configuration.paybackPeriod.toFixed(1)} years</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Performance vs Alternatives</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {availableProducts.map((product) => (
                  <div key={product.id} className={`p-4 rounded-lg border-2 ${
                    product.id === configuration.primaryBattery.id 
                      ? 'border-[#006FEE] bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{product.name}</h5>
                      {product.id === configuration.primaryBattery.id && (
                        <CheckCircle size={16} className="text-[#006FEE]" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Runtime: {product.specs.runtime}</p>
                      <p>Weight: {product.specs.weight}</p>
                      <p>Price: {formatCurrency(product.price)}</p>
                      <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-full rounded-full ${
                            product.id === configuration.primaryBattery.id ? 'bg-[#006FEE]' : 'bg-gray-400'
                          }`}
                          style={{ 
                            width: `${(parseInt(product.capacity) / 15) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Share Tab */}
        {currentView === 'share' && configuration && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Share Configuration</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Export Options</h4>
                <div className="space-y-3">
                  <button className="w-full p-3 text-left border border-gray-300 rounded-lg hover:border-[#006FEE] transition-colors flex items-center gap-3">
                    <Download size={16} className="text-[#006FEE]" />
                    <div>
                      <p className="font-medium text-gray-900">Download PDF Report</p>
                      <p className="text-sm text-gray-600">Complete configuration and ROI analysis</p>
                    </div>
                  </button>
                  
                  <button className="w-full p-3 text-left border border-gray-300 rounded-lg hover:border-[#006FEE] transition-colors flex items-center gap-3">
                    <Share2 size={16} className="text-[#006FEE]" />
                    <div>
                      <p className="font-medium text-gray-900">Share Link</p>
                      <p className="text-sm text-gray-600">Send configuration to colleagues</p>
                    </div>
                  </button>
                  
                  <button className="w-full p-3 text-left border border-gray-300 rounded-lg hover:border-[#006FEE] transition-colors flex items-center gap-3">
                    <Calculator size={16} className="text-[#006FEE]" />
                    <div>
                      <p className="font-medium text-gray-900">Export to Spreadsheet</p>
                      <p className="text-sm text-gray-600">Detailed cost and performance data</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Configuration Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Battery:</span>
                    <span className="font-medium">{configuration.primaryBattery.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Investment:</span>
                    <span className="font-medium">{formatCurrency(configuration.totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual ROI:</span>
                    <span className="font-medium text-green-600">{formatPercent(configuration.estimatedRoi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payback Period:</span>
                    <span className="font-medium">{configuration.paybackPeriod.toFixed(1)} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Segment:</span>
                    <span className="font-medium capitalize">{profile.segment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Usage:</span>
                    <span className="font-medium">{requirements.dailyUsageHours} hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}