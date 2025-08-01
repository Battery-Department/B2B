'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, ArrowLeft, ArrowRight, Clock, Hammer, Weight, Battery, Plus, Minus, Check, 
  Zap, Package, Users, Target, Truck, Shield, DollarSign, Star, ChevronDown, 
  ChevronUp, ChevronRight, Settings, Calculator, AlertCircle, CheckCircle,
  Lock, MapPin, Wrench, HardHat, Calendar, Briefcase, Activity, Brain,
  Info, Sparkles, Building, Timer, FileText, CreditCard, Save, Mail, Download,
  Upload, Search, Filter
} from 'lucide-react';
import { ToolSearch } from '@/components/configuration/ToolSearch';
import { ConfigurationService } from '@/services/configuration-service';

// Force dynamic rendering with no cache
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Tool categories and data
const toolCategories = [
  { id: 'drills', name: 'Drills & Drivers', icon: Wrench },
  { id: 'saws', name: 'Saws & Cutters', icon: Hammer },
  { id: 'grinders', name: 'Grinders & Sanders', icon: Settings },
  { id: 'nailers', name: 'Nailers & Staplers', icon: Hammer },
  { id: 'lights', name: 'Lights & Fans', icon: Zap },
  { id: 'other', name: 'Other Tools', icon: Package }
];

const commonTools = {
  drills: [
    { name: 'Drill/Driver', powerDraw: 'medium', avgUsage: 30 },
    { name: 'Hammer Drill', powerDraw: 'high', avgUsage: 20 },
    { name: 'Impact Driver', powerDraw: 'medium', avgUsage: 40 },
    { name: 'SDS Rotary Hammer', powerDraw: 'high', avgUsage: 15 }
  ],
  saws: [
    { name: 'Circular Saw', powerDraw: 'high', avgUsage: 25 },
    { name: 'Reciprocating Saw', powerDraw: 'high', avgUsage: 20 },
    { name: 'Miter Saw', powerDraw: 'high', avgUsage: 30 },
    { name: 'Jigsaw', powerDraw: 'medium', avgUsage: 15 }
  ],
  grinders: [
    { name: 'Angle Grinder', powerDraw: 'high', avgUsage: 20 },
    { name: 'Die Grinder', powerDraw: 'medium', avgUsage: 15 },
    { name: 'Belt Sander', powerDraw: 'medium', avgUsage: 25 },
    { name: 'Orbital Sander', powerDraw: 'low', avgUsage: 30 }
  ],
  nailers: [
    { name: 'Framing Nailer', powerDraw: 'medium', avgUsage: 40 },
    { name: 'Brad Nailer', powerDraw: 'low', avgUsage: 30 },
    { name: 'Crown Stapler', powerDraw: 'low', avgUsage: 25 }
  ],
  lights: [
    { name: 'Work Light', powerDraw: 'low', avgUsage: 90 },
    { name: 'Area Light', powerDraw: 'medium', avgUsage: 80 },
    { name: 'Fan', powerDraw: 'medium', avgUsage: 70 }
  ],
  other: [
    { name: 'Heat Gun', powerDraw: 'high', avgUsage: 10 },
    { name: 'Vacuum', powerDraw: 'medium', avgUsage: 20 },
    { name: 'Radio/Charger', powerDraw: 'low', avgUsage: 90 }
  ]
};

// Battery specifications
const batterySpecs = {
  '6Ah': { 
    wattHours: 120, 
    price: 149, 
    runtime: 4,
    weight: 1.9,
    chargeTime: 45
  },
  '9Ah': { 
    wattHours: 180, 
    price: 239, 
    runtime: 6.5,
    weight: 2.4,
    chargeTime: 55
  },
  '15Ah': { 
    wattHours: 300, 
    price: 359, 
    runtime: 10,
    weight: 3.2,
    chargeTime: 90
  }
};

// Power draw multipliers
const powerDrawMultipliers = {
  low: 0.7,
  medium: 1.0,
  high: 1.5
};

// Usage intensity multipliers
const usageIntensityMultipliers = {
  light: 0.7,
  moderate: 1.0,
  heavy: 1.3
};

export default function ConfigurePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // Job Details
    projectName: '',
    jobDuration: 5,
    workHoursPerDay: 8,
    startDate: '',
    
    // Site Details
    jobsiteCount: 1,
    primaryLocation: '',
    environment: 'indoor',
    
    // Crew Details
    crewSize: 4,
    shiftPattern: 'single',
    experienceLevel: 'professional',
    
    // Tool Selection
    selectedTools: {} as Record<string, number>,
    usageIntensity: 'moderate' as 'light' | 'moderate' | 'heavy',
    
    // Special Requirements
    requireBackup: true,
    requireFastCharging: true,
    budgetLimit: 0
  });

  // Calculation results
  const [results, setResults] = useState({
    totalBatteriesNeeded: 0,
    recommendedConfig: {
      '6Ah': 0,
      '9Ah': 0,
      '15Ah': 0
    },
    totalCost: 0,
    totalRuntime: 0,
    chargersNeeded: 0,
    dailyPowerRequirement: 0,
    peakPowerDemand: 0,
    savings: 0
  });

  const [showResults, setShowResults] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [powerFilter, setPowerFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', name: '', includeQuote: true });
  const [isSaving, setIsSaving] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);

  // Calculate power requirements and battery configuration
  const calculateConfiguration = useCallback(() => {
    // Calculate total power draw from selected tools
    let totalPowerDraw = 0;
    let peakPowerDraw = 0;
    
    Object.entries(formData.selectedTools).forEach(([toolName, count]) => {
      // Find tool in categories
      let toolData: any = null;
      Object.values(commonTools).forEach(category => {
        const found = category.find(t => t.name === toolName);
        if (found) toolData = found;
      });
      
      if (toolData && count > 0) {
        const basePower = 300; // Base wattage
        const powerMultiplier = powerDrawMultipliers[toolData.powerDraw as keyof typeof powerDrawMultipliers];
        const usagePercent = toolData.avgUsage / 100;
        const intensityMultiplier = usageIntensityMultipliers[formData.usageIntensity];
        
        const toolPowerDraw = basePower * powerMultiplier * usagePercent * intensityMultiplier * count;
        totalPowerDraw += toolPowerDraw;
        
        // Peak power is when all tools might be used simultaneously
        peakPowerDraw += basePower * powerMultiplier * count;
      }
    });
    
    // Calculate daily power requirement (watt-hours)
    const dailyPowerRequirement = totalPowerDraw * formData.workHoursPerDay;
    
    // Add buffer for safety and inefficiencies
    const bufferMultiplier = formData.requireBackup ? 1.5 : 1.2;
    const bufferedPowerRequirement = dailyPowerRequirement * bufferMultiplier;
    
    // Calculate optimal battery configuration
    let remainingPower = bufferedPowerRequirement;
    const config = { '6Ah': 0, '9Ah': 0, '15Ah': 0 };
    
    // Prioritize 15Ah for heavy usage, 9Ah for moderate, mix for light
    if (formData.usageIntensity === 'heavy' || peakPowerDraw > 2000) {
      // Heavy usage - prioritize 15Ah batteries
      config['15Ah'] = Math.floor(remainingPower / batterySpecs['15Ah'].wattHours);
      remainingPower -= config['15Ah'] * batterySpecs['15Ah'].wattHours;
      
      if (remainingPower > 0) {
        config['9Ah'] = Math.ceil(remainingPower / batterySpecs['9Ah'].wattHours);
      }
    } else if (formData.usageIntensity === 'light') {
      // Light usage - mix of smaller batteries
      config['9Ah'] = Math.floor(remainingPower / batterySpecs['9Ah'].wattHours / 2);
      remainingPower -= config['9Ah'] * batterySpecs['9Ah'].wattHours;
      
      config['6Ah'] = Math.ceil(remainingPower / batterySpecs['6Ah'].wattHours);
    } else {
      // Moderate usage - primarily 9Ah batteries
      config['9Ah'] = Math.floor(remainingPower / batterySpecs['9Ah'].wattHours);
      remainingPower -= config['9Ah'] * batterySpecs['9Ah'].wattHours;
      
      if (remainingPower > batterySpecs['6Ah'].wattHours) {
        config['15Ah'] = Math.ceil(remainingPower / batterySpecs['15Ah'].wattHours);
      } else if (remainingPower > 0) {
        config['6Ah'] = Math.ceil(remainingPower / batterySpecs['6Ah'].wattHours);
      }
    }
    
    // Multiply by crew shifts and jobsites
    const shiftMultiplier = formData.shiftPattern === 'double' ? 2 : formData.shiftPattern === 'triple' ? 3 : 1;
    Object.keys(config).forEach(key => {
      config[key as keyof typeof config] *= shiftMultiplier * formData.jobsiteCount;
    });
    
    // Ensure minimum batteries for crew size
    const totalBatteries = config['6Ah'] + config['9Ah'] + config['15Ah'];
    const minBatteriesNeeded = Math.ceil(formData.crewSize * 1.5); // 1.5 batteries per crew member minimum
    
    if (totalBatteries < minBatteriesNeeded) {
      const additionalNeeded = minBatteriesNeeded - totalBatteries;
      config['9Ah'] += additionalNeeded; // Add 9Ah as default
    }
    
    // Calculate total cost
    const totalCost = 
      config['6Ah'] * batterySpecs['6Ah'].price +
      config['9Ah'] * batterySpecs['9Ah'].price +
      config['15Ah'] * batterySpecs['15Ah'].price;
    
    // Calculate chargers needed (1 charger per 4 batteries)
    const totalBatteriesNeeded = config['6Ah'] + config['9Ah'] + config['15Ah'];
    const chargersNeeded = Math.ceil(totalBatteriesNeeded / 4);
    
    // Calculate total runtime
    const totalRuntime = 
      config['6Ah'] * batterySpecs['6Ah'].runtime +
      config['9Ah'] * batterySpecs['9Ah'].runtime +
      config['15Ah'] * batterySpecs['15Ah'].runtime;
    
    // Calculate savings (compared to MSRP)
    const msrpTotal = 
      config['6Ah'] * 169 +
      config['9Ah'] * 249 +
      config['15Ah'] * 379;
    const savings = msrpTotal - totalCost;
    
    setResults({
      totalBatteriesNeeded,
      recommendedConfig: config,
      totalCost,
      totalRuntime,
      chargersNeeded,
      dailyPowerRequirement: Math.round(dailyPowerRequirement),
      peakPowerDemand: Math.round(peakPowerDraw),
      savings
    });
    
    setShowResults(true);
  }, [formData]);

  // Handle tool selection
  const handleToolToggle = (tool: any) => {
    setFormData(prev => ({
      ...prev,
      selectedTools: {
        ...prev.selectedTools,
        [tool.name]: (prev.selectedTools[tool.name] || 0) + 1
      }
    }));
  };

  // Get all tools for search
  const allTools = useMemo(() => {
    const tools: any[] = [];
    Object.entries(commonTools).forEach(([categoryId, categoryTools]) => {
      const category = toolCategories.find(c => c.id === categoryId);
      categoryTools.forEach(tool => {
        tools.push({
          ...tool,
          category: category?.name || categoryId
        });
      });
    });
    return tools;
  }, []);

  // Get real-time price updates
  const getRealTimePrice = useMemo(() => {
    const basePrice = results.totalCost;
    const discountTiers = [
      { threshold: 1000, percentage: 10 },
      { threshold: 2500, percentage: 15 },
      { threshold: 5000, percentage: 20 }
    ];
    
    let discountPercentage = 0;
    for (const tier of [...discountTiers].reverse()) {
      if (basePrice >= tier.threshold) {
        discountPercentage = tier.percentage;
        break;
      }
    }
    
    const discountAmount = basePrice * (discountPercentage / 100);
    const finalPrice = basePrice - discountAmount;
    
    return {
      basePrice,
      discountPercentage,
      discountAmount,
      finalPrice,
      nextTier: discountTiers.find(t => t.threshold > basePrice)
    };
  }, [results.totalCost]);

  const updateToolCount = (toolName: string, delta: number) => {
    setFormData(prev => ({
      ...prev,
      selectedTools: {
        ...prev.selectedTools,
        [toolName]: Math.max(0, (prev.selectedTools[toolName] || 0) + delta)
      }
    }));
  };

  // Add configuration to cart
  const addToCart = () => {
    // Calculate volume discount
    const discountTiers = [
      { threshold: 1000, percentage: 10 },
      { threshold: 2500, percentage: 15 },
      { threshold: 5000, percentage: 20 }
    ];
    
    let discountPercentage = 0;
    for (const tier of [...discountTiers].reverse()) {
      if (results.totalCost >= tier.threshold) {
        discountPercentage = tier.percentage;
        break;
      }
    }
    
    const discountAmount = results.totalCost * (discountPercentage / 100);
    const total = results.totalCost - discountAmount;
    
    const cartData = {
      items: results.recommendedConfig,
      subtotal: results.totalCost,
      discount: discountAmount,
      total,
      discountPercentage,
      configDetails: {
        projectName: formData.projectName,
        crewSize: formData.crewSize,
        duration: formData.jobDuration,
        chargers: results.chargersNeeded,
        configId: Date.now().toString()
      }
    };
    sessionStorage.setItem('orderData', JSON.stringify(cartData));
    // Option to go directly to checkout or review in products page
    const goDirectToCheckout = window.confirm('Would you like to go directly to checkout, or review your configuration in the products page first?\\n\\nOK = Direct to Checkout\\nCancel = Review in Products');
    
    if (goDirectToCheckout) {
      router.push('/customer/checkout');
    } else {
      router.push('/customer/products');
    }
  };

  // Save configuration
  const saveConfiguration = async () => {
    if (!formData.projectName.trim()) {
      alert('Please enter a project name before saving.');
      return;
    }
    
    setIsSaving(true);
    try {
      const configData = {
        ...formData,
        ...results
      };
      
      const configId = ConfigurationService.saveConfiguration(configData);
      setSavedConfigs(ConfigurationService.getAllConfigurations());
      setShowSaveModal(false);
      alert('Configuration saved successfully!');
    } catch (error) {
      alert('Error saving configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Email configuration
  const emailConfiguration = async () => {
    if (!emailData.email.trim()) {
      alert('Please enter an email address.');
      return;
    }
    
    setIsEmailSending(true);
    try {
      const configData = {
        ...formData,
        ...results
      };
      
      const success = await ConfigurationService.emailConfiguration({
        configuration: configData,
        recipientEmail: emailData.email,
        recipientName: emailData.name,
        includeQuote: emailData.includeQuote
      });
      
      if (success) {
        setShowEmailModal(false);
        setEmailData({ email: '', name: '', includeQuote: true });
        alert('Configuration sent successfully!');
      } else {
        alert('Error sending email. Please try again.');
      }
    } catch (error) {
      alert('Error sending email. Please try again.');
    } finally {
      setIsEmailSending(false);
    }
  };

  // Load saved configurations on mount
  useEffect(() => {
    setSavedConfigs(ConfigurationService.getAllConfigurations());
  }, []);

  // Progress indicator
  const steps = [
    { id: 1, name: 'Job Details', icon: Briefcase },
    { id: 2, name: 'Tool Selection', icon: Wrench },
    { id: 3, name: 'Get Results', icon: Brain }
  ];

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0048AC 0%, #006FEE 50%, #0084FF 100%)',
        color: 'white',
        padding: '48px 24px',
        borderRadius: '0 0 24px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '8px 20px',
            borderRadius: '100px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <Brain size={20} />
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              AI-POWERED FLEET GENERATOR
            </span>
          </div>

          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: '16px',
            lineHeight: '1.1'
          }}>
            Smart Fleet Configuration
          </h1>
          
          <p style={{ 
            fontSize: '20px', 
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Get the exact batteries you need based on your job requirements
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span>AI-Powered Recommendations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span>Save 30% on Average</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span>No More Guesswork</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '32px auto',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: currentStep >= step.id ? 'pointer' : 'default'
              }}
              onClick={() => currentStep >= step.id && setCurrentStep(step.id)}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: currentStep >= step.id ? '#006FEE' : '#E6F4FF',
                  color: currentStep >= step.id ? 'white' : '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '700',
                  border: currentStep === step.id ? '3px solid #0059D1' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {currentStep > step.id ? <Check size={24} /> : <step.icon size={24} />}
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: currentStep >= step.id ? '#0A051E' : '#9CA3AF'
                }}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: currentStep > step.id ? '#006FEE' : '#E6F4FF',
                  margin: '0 16px',
                  marginBottom: '28px',
                  transition: 'background-color 0.3s ease'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 48px' }}>
        
        {/* Step 1: Job Details */}
        {currentStep === 1 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Project Information */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#E6F4FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Briefcase size={20} color="#006FEE" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E' }}>
                  Project Information
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Downtown Office Complex"
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#006FEE'}
                    onBlur={(e) => e.target.style.borderColor = '#E6F4FF'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Job Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.jobDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobDuration: parseInt(e.target.value) || 1 }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#006FEE'}
                    onBlur={(e) => e.target.style.borderColor = '#E6F4FF'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Work Hours Per Day
                  </label>
                  <select
                    value={formData.workHoursPerDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, workHoursPerDay: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="4">4 hours (Half day)</option>
                    <option value="6">6 hours</option>
                    <option value="8">8 hours (Full day)</option>
                    <option value="10">10 hours (Extended)</option>
                    <option value="12">12 hours (Long shift)</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#006FEE'}
                    onBlur={(e) => e.target.style.borderColor = '#E6F4FF'}
                  />
                </div>
              </div>
            </div>

            {/* Site Details */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#E6F4FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building size={20} color="#006FEE" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E' }}>
                  Site Details
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Number of Job Sites
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.jobsiteCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobsiteCount: parseInt(e.target.value) || 1 }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#006FEE'}
                    onBlur={(e) => e.target.style.borderColor = '#E6F4FF'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Primary Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Chicago, IL"
                    value={formData.primaryLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryLocation: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#006FEE'}
                    onBlur={(e) => e.target.style.borderColor = '#E6F4FF'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Work Environment
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['indoor', 'outdoor', 'mixed', 'extreme'].map(env => (
                      <button
                        key={env}
                        onClick={() => setFormData(prev => ({ ...prev, environment: env }))}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: `2px solid ${formData.environment === env ? '#006FEE' : '#E6F4FF'}`,
                          backgroundColor: formData.environment === env ? '#F0F9FF' : 'white',
                          color: formData.environment === env ? '#006FEE' : '#5B6B7D',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textTransform: 'capitalize'
                        }}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Crew Details */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#E6F4FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={20} color="#006FEE" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E' }}>
                  Crew Details
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Crew Size
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, crewSize: Math.max(1, prev.crewSize - 1) }))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid #E6F4FF',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Minus size={20} color="#5B6B7D" />
                    </button>
                    <div style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#0A051E'
                    }}>
                      {formData.crewSize} workers
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, crewSize: Math.min(50, prev.crewSize + 1) }))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid #E6F4FF',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Plus size={20} color="#5B6B7D" />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Shift Pattern
                  </label>
                  <select
                    value={formData.shiftPattern}
                    onChange={(e) => setFormData(prev => ({ ...prev, shiftPattern: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="single">Single Shift</option>
                    <option value="double">Double Shift</option>
                    <option value="triple">24/7 Operation</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="apprentice">Apprentice Crew</option>
                    <option value="professional">Professional Crew</option>
                    <option value="expert">Expert Crew</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#E6F4FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={20} color="#006FEE" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E' }}>
                  Special Requirements
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E6F4FF',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  <input
                    type="checkbox"
                    checked={formData.requireBackup}
                    onChange={(e) => setFormData(prev => ({ ...prev, requireBackup: e.target.checked }))}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <div>
                    <p style={{ fontWeight: '600', color: '#0A051E' }}>Backup Power Required</p>
                    <p style={{ fontSize: '14px', color: '#5B6B7D' }}>
                      Add 50% buffer for emergencies
                    </p>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E6F4FF',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  <input
                    type="checkbox"
                    checked={formData.requireFastCharging}
                    onChange={(e) => setFormData(prev => ({ ...prev, requireFastCharging: e.target.checked }))}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <div>
                    <p style={{ fontWeight: '600', color: '#0A051E' }}>Fast Charging Needed</p>
                    <p style={{ fontSize: '14px', color: '#5B6B7D' }}>
                      Include rapid chargers in quote
                    </p>
                  </div>
                </label>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#5B6B7D'
                  }}>
                    Budget Limit (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.budgetLimit || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, budgetLimit: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      transition: 'border-color 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#006FEE'}
                    onBlur={(e) => e.target.style.borderColor = '#E6F4FF'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tool Selection */}
        {currentStep === 2 && (
          <div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              marginBottom: '24px',
              border: '1px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#0A051E', marginBottom: '8px' }}>
                Select Your Tools
              </h3>
              <p style={{ fontSize: '16px', color: '#5B6B7D', marginBottom: '24px' }}>
                Choose the tools your crew will be using and specify quantities
              </p>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#0A051E'
                }}>
                  Usage Intensity
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { value: 'light', label: 'Light (30%)', desc: 'Occasional use' },
                    { value: 'moderate', label: 'Moderate (60%)', desc: 'Regular use' },
                    { value: 'heavy', label: 'Heavy (90%)', desc: 'Continuous use' }
                  ].map(intensity => (
                    <button
                      key={intensity.value}
                      onClick={() => setFormData(prev => ({ ...prev, usageIntensity: intensity.value as any }))}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${formData.usageIntensity === intensity.value ? '#006FEE' : '#E6F4FF'}`,
                        backgroundColor: formData.usageIntensity === intensity.value ? '#F0F9FF' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: formData.usageIntensity === intensity.value ? '#006FEE' : '#0A051E',
                        marginBottom: '4px'
                      }}>
                        {intensity.label}
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: '#5B6B7D'
                      }}>
                        {intensity.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Search */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#0A051E', marginBottom: '16px' }}>
                  Search Tools
                </h4>
                <ToolSearch
                  tools={allTools}
                  searchQuery={toolSearchQuery}
                  onSearchChange={setToolSearchQuery}
                  onToolSelect={handleToolToggle}
                  selectedTools={formData.selectedTools}
                  powerFilter={powerFilter}
                  onPowerFilterChange={setPowerFilter}
                />
              </div>

              {!toolSearchQuery && toolCategories.map(category => (
                <div key={category.id} style={{ marginBottom: '32px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#E6F4FF',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <category.icon size={20} color="#006FEE" />
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#0A051E' }}>
                      {category.name}
                    </h4>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px'
                  }}>
                    {commonTools[category.id as keyof typeof commonTools]?.map(tool => {
                      const count = formData.selectedTools[tool.name] || 0;
                      return (
                        <div
                          key={tool.name}
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: `2px solid ${count > 0 ? '#006FEE' : '#E6F4FF'}`,
                            backgroundColor: count > 0 ? '#F0F9FF' : 'white',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <p style={{
                              fontWeight: '600',
                              color: '#0A051E',
                              fontSize: '15px'
                            }}>
                              {tool.name}
                            </p>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: 
                                tool.powerDraw === 'high' ? '#FFE6E6' :
                                tool.powerDraw === 'medium' ? '#FFF7E6' : '#E6F9F0',
                              color: 
                                tool.powerDraw === 'high' ? '#DC2626' :
                                tool.powerDraw === 'medium' ? '#F59E0B' : '#10B981'
                            }}>
                              {tool.powerDraw.toUpperCase()}
                            </span>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <button
                              onClick={() => updateToolCount(tool.name, -1)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid #E6F4FF',
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Minus size={16} color="#5B6B7D" />
                            </button>
                            <div style={{
                              flex: 1,
                              textAlign: 'center',
                              padding: '6px',
                              backgroundColor: count > 0 ? '#006FEE' : '#F8FAFC',
                              color: count > 0 ? 'white' : '#5B6B7D',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {count} units
                            </div>
                            <button
                              onClick={() => updateToolCount(tool.name, 1)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid #E6F4FF',
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Plus size={16} color="#5B6B7D" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && !showResults && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            border: '1px solid #E6F4FF',
            boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#E6F4FF',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Brain size={40} color="#006FEE" />
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
              Ready to Generate Your Fleet Configuration
            </h3>
            <p style={{ fontSize: '18px', color: '#5B6B7D', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
              Our AI will analyze your requirements and recommend the optimal battery configuration for your project
            </p>
            <button
              onClick={calculateConfiguration}
              style={{
                padding: '16px 48px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#006FEE',
                color: 'white',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0059D1';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#006FEE';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Sparkles size={20} />
              Calculate My Fleet
            </button>
          </div>
        )}

        {/* Results Display */}
        {currentStep === 3 && showResults && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Configuration Summary */}
            <div style={{
              gridColumn: 'span 2',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#E6F4FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={20} color="#006FEE" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#0A051E' }}>
                  Recommended Configuration
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {Object.entries(results.recommendedConfig).map(([battery, count]) => {
                  if (count === 0) return null;
                  const spec = batterySpecs[battery as keyof typeof batterySpecs];
                  return (
                    <div
                      key={battery}
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        border: '2px solid #E6F4FF',
                        backgroundColor: '#F8FAFC',
                        textAlign: 'center'
                      }}
                    >
                      <Battery size={32} color="#006FEE" style={{ marginBottom: '12px' }} />
                      <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E', marginBottom: '4px' }}>
                        {count}× {battery} Battery
                      </h4>
                      <p style={{ fontSize: '14px', color: '#5B6B7D' }}>
                        ${spec.price} each
                      </p>
                    </div>
                  );
                })}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                padding: '20px',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px'
              }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '4px' }}>
                    Total Batteries
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#0A051E' }}>
                    {results.totalBatteriesNeeded} units
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '4px' }}>
                    Total Runtime
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#0A051E' }}>
                    {results.totalRuntime} hours
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '4px' }}>
                    Daily Power Need
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#0A051E' }}>
                    {results.dailyPowerRequirement} Wh
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '4px' }}>
                    Chargers Needed
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#0A051E' }}>
                    {results.chargersNeeded} units
                  </p>
                </div>
              </div>
            </div>

            {/* Cost Summary */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#E6F4FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarSign size={20} color="#006FEE" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E' }}>
                  Cost Summary
                </h3>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '16px', color: '#5B6B7D' }}>Battery Cost</span>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#0A051E' }}>
                    ${results.totalCost.toFixed(2)}
                  </span>
                </div>
                {formData.requireFastCharging && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontSize: '16px', color: '#5B6B7D' }}>Fast Chargers</span>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#0A051E' }}>
                      ${(results.chargersNeeded * 99).toFixed(2)}
                    </span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '2px solid #E6F4FF'
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#0A051E' }}>Total</span>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#006FEE' }}>
                    ${(results.totalCost + (formData.requireFastCharging ? results.chargersNeeded * 99 : 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{
                backgroundColor: '#E6F9F0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle size={16} color="#059669" />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                    You're saving ${results.savings.toFixed(2)}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#047857' }}>
                  Compared to retail pricing
                </p>
              </div>

              {/* Real-time Price Display */}
              <div style={{
                backgroundColor: '#F0F9FF',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#5B6B7D' }}>Base Price</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#0A051E' }}>
                    ${getRealTimePrice.basePrice.toFixed(2)}
                  </span>
                </div>
                {getRealTimePrice.discountPercentage > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#059669' }}>
                      Volume Discount ({getRealTimePrice.discountPercentage}%)
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>
                      -${getRealTimePrice.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E6F4FF' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E' }}>Final Price</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#006FEE' }}>
                    ${getRealTimePrice.finalPrice.toFixed(2)}
                  </span>
                </div>
                {getRealTimePrice.nextTier && (
                  <p style={{ fontSize: '12px', color: '#5B6B7D', marginTop: '8px' }}>
                    Add ${(getRealTimePrice.nextTier.threshold - getRealTimePrice.basePrice).toFixed(0)} more to save {getRealTimePrice.nextTier.percentage}%
                  </p>
                )}
              </div>

              <button
                onClick={addToCart}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#006FEE',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  marginBottom: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0059D1';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#006FEE';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <ShoppingCart size={18} />
                Add Configuration to Cart
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => setShowSaveModal(true)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #006FEE',
                    backgroundColor: 'white',
                    color: '#006FEE',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0F9FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #006FEE',
                    backgroundColor: 'white',
                    color: '#006FEE',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0F9FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <Mail size={16} />
                  Email
                </button>
              </div>

              <button
                onClick={() => {
                  setCurrentStep(1);
                  setShowResults(false);
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #006FEE',
                  backgroundColor: 'white',
                  color: '#006FEE',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F0F9FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Start New Configuration
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {!showResults && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '32px'
          }}>
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                border: '2px solid #E6F4FF',
                backgroundColor: 'white',
                color: currentStep === 1 ? '#9CA3AF' : '#006FEE',
                fontSize: '16px',
                fontWeight: '600',
                cursor: currentStep === 1 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                opacity: currentStep === 1 ? 0.5 : 1
              }}
            >
              <ArrowLeft size={18} />
              Previous
            </button>
            
            {currentStep < 3 && (
              <button
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                style={{
                  padding: '14px 28px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#006FEE',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0059D1';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#006FEE';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Next
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}

        {/* Save Configuration Modal */}
        {showSaveModal && (
          <>
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }} onClick={() => setShowSaveModal(false)}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                position: 'relative'
              }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
                  Save Configuration
                </h3>
                <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '20px' }}>
                  Your configuration will be saved locally for easy access later.
                </p>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#5B6B7D' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="Enter project name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowSaveModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      backgroundColor: 'white',
                      color: '#5B6B7D',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveConfiguration}
                    disabled={isSaving || !formData.projectName.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSaving || !formData.projectName.trim() ? '#9CA3AF' : '#006FEE',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: isSaving || !formData.projectName.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Email Configuration Modal */}
        {showEmailModal && (
          <>
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }} onClick={() => setShowEmailModal(false)}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                position: 'relative'
              }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
                  Email Configuration
                </h3>
                <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '20px' }}>
                  Send this configuration summary to your email.
                </p>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#5B6B7D' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={emailData.email}
                    onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#5B6B7D' }}>
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={emailData.name}
                    onChange={(e) => setEmailData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#5B6B7D'
                  }}>
                    <input
                      type="checkbox"
                      checked={emailData.includeQuote}
                      onChange={(e) => setEmailData(prev => ({ ...prev, includeQuote: e.target.checked }))}
                      style={{ cursor: 'pointer' }}
                    />
                    Include detailed quote (PDF)
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E6F4FF',
                      backgroundColor: 'white',
                      color: '#5B6B7D',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={emailConfiguration}
                    disabled={isEmailSending || !emailData.email.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isEmailSending || !emailData.email.trim() ? '#9CA3AF' : '#006FEE',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: isEmailSending || !emailData.email.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isEmailSending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}