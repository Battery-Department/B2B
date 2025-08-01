'use client';

import React, { useState, useEffect } from 'react';
import { FileText, BarChart3, Wrench, Shield, Truck, ChevronDown, ChevronRight, Clock, ExternalLink, LifeBuoy, Package } from 'lucide-react';
import BatteryComparisonTable from './BatteryComparisonTable';
import ConstructionRuntimeCalculator from './ConstructionRuntimeCalculator';
import EnhancedToolCompatibilityTable from './EnhancedToolCompatibilityTable';

// Types for the component
interface WarrantyFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: string;
  delivery: string;
  recommended: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface ToolRuntime {
  sixAh: number;
  nineAh: number;
  fifteenAh: number;
}

interface Tool {
  id: string;
  model: string;
  description: string;
  category: string;
  categoryId: string;
  runtime: ToolRuntime;
  powerConsumption: number;
  compatibility: string;
}

interface ProductTabsProps {
  isMobile: boolean;
}

// Data for the component
const batterySpecs = [
  { name: "Voltage", value6Ah: "20V/60V FlexVolt", value9Ah: "20V/60V FlexVolt", value15Ah: "20V/60V FlexVolt" },
  { name: "Amp Hours", value6Ah: "6.0Ah", value9Ah: "9.0Ah", value15Ah: "15.0Ah" },
  { name: "Weight", value6Ah: "1.9 lbs (0.86 kg)", value9Ah: "2.4 lbs (1.09 kg)", value15Ah: "3.2 lbs (1.45 kg)" },
  { name: "Dimensions", value6Ah: '4.5" x 3" x 3.5"', value9Ah: '4.5" x 3" x 4.2"', value15Ah: '4.5" x 3" x 5.8"' },
  { name: "Charge Time (Fast Charger)", value6Ah: "45 minutes", value9Ah: "55 minutes", value15Ah: "90 minutes" },
  { name: "Charge Time (Standard)", value6Ah: "90 minutes", value9Ah: "120 minutes", value15Ah: "180 minutes" },
  { name: "Cell Type", value6Ah: "Lithium-Ion", value9Ah: "Lithium-Ion", value15Ah: "Lithium-Ion" },
  { name: "Cell Configuration", value6Ah: "15 cells", value9Ah: "20 cells", value15Ah: "30 cells" },
  { name: "Charge Cycles", value6Ah: "1000+", value9Ah: "1000+", value15Ah: "1000+" },
  { name: "Operating Temperature", value6Ah: "0°F to 104°F", value9Ah: "0°F to 104°F", value15Ah: "0°F to 104°F" },
  { name: "Fuel Gauge", value6Ah: "3-LED Indicator", value9Ah: "3-LED Indicator", value15Ah: "3-LED Indicator" },
  { name: "Warranty", value6Ah: "12 Months", value9Ah: "12 Months", value15Ah: "12 Months" },
  { name: "Made In", value6Ah: "USA", value9Ah: "USA", value15Ah: "USA" }
];

const categories: Category[] = [
  { id: "all", name: "All Tools" },
  { id: "drills", name: "Drills" },
  { id: "saws", name: "Saws" },
  { id: "grinders", name: "Grinders" },
  { id: "impacts", name: "Impact Drivers" },
  { id: "nailers", name: "Nailers" }
];

// Enhanced tool data with more descriptive information
const toolsData: Tool[] = [
  {
    id: "drill1",
    model: "DCD999",
    description: "Cordless Drill/Driver with FLEXVOLT ADVANTAGE™ Technology",
    category: "Drills",
    categoryId: "drills",
    runtime: {
      sixAh: 1.3,
      nineAh: 1.9,
      fifteenAh: 3.2
    },
    powerConsumption: 4.6,
    compatibility: "compatible"
  },
  {
    id: "drill2",
    model: "DCD996",
    description: "20V MAX* XR® 3-Speed Hammerdrill Kit",
    category: "Drills",
    categoryId: "drills",
    runtime: {
      sixAh: 1.2,
      nineAh: 1.8,
      fifteenAh: 3.0
    },
    powerConsumption: 5.0,
    compatibility: "compatible"
  },
  {
    id: "drill3", 
    model: "DCD740",
    description: "Right Angle Drill with Extended Run Time",
    category: "Drills",
    categoryId: "drills",
    runtime: {
      sixAh: 2.3,
      nineAh: 3.4,
      fifteenAh: 5.7
    },
    powerConsumption: 2.6,
    compatibility: "compatible"
  },
  {
    id: "drill4", 
    model: "DCD460",
    description: "60V MAX* VSR Stud and Joist Drill with E-Clutch® System",
    category: "Drills",
    categoryId: "drills",
    runtime: {
      sixAh: 0.8,
      nineAh: 1.2,
      fifteenAh: 2.0
    },
    powerConsumption: 7.5,
    compatibility: "compatible"
  },
  {
    id: "saw1", 
    model: "DCS573",
    description: "7-1/4 in. FLEXVOLT® 60V MAX* Brushless Circular Saw with Brake",
    category: "Saws",
    categoryId: "saws",
    runtime: {
      sixAh: 0.7,
      nineAh: 1.1,
      fifteenAh: 1.8
    },
    powerConsumption: 8.5,
    compatibility: "compatible"
  },
  {
    id: "saw2", 
    model: "DCS389",
    description: "FLEXVOLT® 60V MAX* Brushless Cordless Reciprocating Saw",
    category: "Saws",
    categoryId: "saws",
    runtime: {
      sixAh: 0.8,
      nineAh: 1.2,
      fifteenAh: 2.0
    },
    powerConsumption: 7.5,
    compatibility: "compatible"
  },
  {
    id: "saw3", 
    model: "DCS334",
    description: "20V MAX* XR® Brushless Cordless Jig Saw",
    category: "Saws",
    categoryId: "saws",
    runtime: {
      sixAh: 1.6,
      nineAh: 2.4,
      fifteenAh: 4.0
    },
    powerConsumption: 3.75,
    compatibility: "compatible"
  },
  {
    id: "saw4", 
    model: "DCS727",
    description: "FLEXVOLT® 60V MAX* 12 in. Brushless Dual Bevel Sliding Miter Saw",
    category: "Saws",
    categoryId: "saws",
    runtime: {
      sixAh: 0.4,
      nineAh: 0.6,
      fifteenAh: 1.0
    },
    powerConsumption: 15.0,
    compatibility: "compatible"
  },
  {
    id: "saw5", 
    model: "DCS7485",
    description: "FLEXVOLT® 60V MAX* 8-1/4 in. Table Saw",
    category: "Saws",
    categoryId: "saws",
    runtime: {
      sixAh: 0.5,
      nineAh: 0.75,
      fifteenAh: 1.25
    },
    powerConsumption: 12.0,
    compatibility: "compatible"
  },
  {
    id: "grind1", 
    model: "DCG414",
    description: "FLEXVOLT® 60V MAX* 4-1/2 in. - 6 in. Cordless Grinder with Kickback Brake®",
    category: "Grinders",
    categoryId: "grinders",
    runtime: {
      sixAh: 0.9,
      nineAh: 1.4,
      fifteenAh: 2.3
    },
    powerConsumption: 6.6,
    compatibility: "compatible"
  },
  {
    id: "grind2", 
    model: "DCG426",
    description: "20V MAX* XR® 1-1/2 in. Cordless Die Grinder",
    category: "Grinders",
    categoryId: "grinders",
    runtime: {
      sixAh: 1.5,
      nineAh: 2.3,
      fifteenAh: 3.8
    },
    powerConsumption: 4.0,
    compatibility: "compatible"
  },
  {
    id: "impact1", 
    model: "DCF887",
    description: "20V MAX* XR® 1/4 in. 3-Speed Impact Driver",
    category: "Impact Drivers",
    categoryId: "impacts",
    runtime: {
      sixAh: 1.6,
      nineAh: 2.4,
      fifteenAh: 4.0
    },
    powerConsumption: 3.75,
    compatibility: "compatible"
  },
  {
    id: "impact2", 
    model: "DCF894",
    description: "20V MAX* XR® 1/2 in. Mid-Range Cordless Impact Wrench with Detent Pin Anvil",
    category: "Impact Drivers",
    categoryId: "impacts",
    runtime: {
      sixAh: 1.2,
      nineAh: 1.8,
      fifteenAh: 3.0
    },
    powerConsumption: 5.0,
    compatibility: "compatible"
  },
  {
    id: "impact3", 
    model: "DCF899",
    description: "20V MAX* XR® High Torque 1/2 in. Impact Wrench with Detent Pin Anvil",
    category: "Impact Drivers",
    categoryId: "impacts",
    runtime: {
      sixAh: 0.8,
      nineAh: 1.2,
      fifteenAh: 2.0
    },
    powerConsumption: 7.5,
    compatibility: "compatible"
  },
  {
    id: "nail1", 
    model: "DCN692",
    description: "20V MAX* XR® Dual Speed Framing Nailer",
    category: "Nailers",
    categoryId: "nailers",
    runtime: {
      sixAh: 1.1,
      nineAh: 1.7,
      fifteenAh: 2.8
    },
    powerConsumption: 5.5,
    compatibility: "compatible"
  },
  {
    id: "nail2", 
    model: "DCN680",
    description: "20V MAX* XR® 18 GA Cordless Brad Nailer",
    category: "Nailers",
    categoryId: "nailers",
    runtime: {
      sixAh: 1.5,
      nineAh: 2.3,
      fifteenAh: 3.8
    },
    powerConsumption: 4.0,
    compatibility: "compatible"
  },
  {
    id: "nail3", 
    model: "DCN660",
    description: "20V MAX* XR® 16 GA Cordless Angled Finish Nailer",
    category: "Nailers",
    categoryId: "nailers",
    runtime: {
      sixAh: 1.3,
      nineAh: 2.0,
      fifteenAh: 3.3
    },
    powerConsumption: 4.6,
    compatibility: "compatible"
  },
];

const warrantyFeatures: WarrantyFeature[] = [
  { 
    id: "hassle-free", 
    title: "No-Hassle Replacement", 
    description: "If your battery stops working, we'll replace it - no questions asked.",
    icon: <LifeBuoy size={24} className="text-green-600" />
  },
  { 
    id: "full-coverage", 
    title: "Full Coverage", 
    description: "Covers all manufacturing defects and performance issues for 12 months.",
    icon: <Shield size={24} className="text-green-600" />
  },
  { 
    id: "fast-shipping", 
    title: "Fast Shipping", 
    description: "Replacement batteries ship within 1 business day after approval.",
    icon: <Package size={24} className="text-green-600" />
  }
];

const faqs: FAQ[] = [
  { 
    id: "faq1", 
    question: "How do I register my battery for warranty?", 
    answer: "Registration is automatic when you purchase direct from Battery Department. You only need your order number for warranty claims. No additional registration required."
  },
  { 
    id: "faq2", 
    question: "What's covered under the warranty?", 
    answer: "Our warranty covers all manufacturing defects, premature battery failure, and performance issues. It does not cover physical damage, water damage, or normal capacity degradation over time."
  },
  { 
    id: "faq3", 
    question: "How do I make a warranty claim?", 
    answer: "Simply contact our customer service team with your order number and a brief description of the issue. We'll process your claim within 24 hours and ship a replacement if approved."
  },
  { 
    id: "faq4", 
    question: "Will using these batteries void my DeWalt tool warranty?", 
    answer: "No. Using Battery Department FlexVolt batteries will not void your DeWalt tool warranty. Our batteries are fully compatible with all DeWalt 20V/60V tools."
  }
];

const shippingMethods: ShippingMethod[] = [
  { 
    id: "standard", 
    name: "Standard Shipping", 
    price: "Free", 
    delivery: "3-5 Business Days", 
    recommended: false
  },
  { 
    id: "express", 
    name: "Express Shipping", 
    price: "$9.99", 
    delivery: "2 Business Days", 
    recommended: true
  },
  { 
    id: "overnight", 
    name: "Overnight Shipping", 
    price: "$24.99", 
    delivery: "Next Business Day", 
    recommended: false
  }
];

// Runtime data for calculator
const runtimeData = {
  tools: [
    { id: "circularSaw", name: "Circular Saw", consumption: 5 },
    { id: "drill", name: "Drill", consumption: 2 },
    { id: "impactDriver", name: "Impact Driver", consumption: 3 },
    { id: "recip", name: "Reciprocating Saw", consumption: 4.5 },
    { id: "grinder", name: "Angle Grinder", consumption: 5.5 }
  ],
  batteries: {
    "6Ah": 6,
    "9Ah": 9,
    "15Ah": 15
  }
};

const ProductTabs: React.FC<ProductTabsProps> = ({ isMobile = false }) => {
  const [activeTab, setActiveTab] = useState("specs");
  const [selectedBattery, setSelectedBattery] = useState("9Ah");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFAQ, setExpandedFAQ] = useState("");
  const [selectedTool, setSelectedTool] = useState(runtimeData.tools[0].id);
  const [isClient, setIsClient] = useState(false);
  
  // For responsive behavior
  const [windowIsMobile, setWindowIsMobile] = useState(isMobile);
  
  useEffect(() => {
    setIsClient(true);
    const handleResize = () => {
      setWindowIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Toggle FAQ expansion
  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? "" : id);
  };
  
  // Calculate runtime based on battery and tool selection
  const calculateRuntime = (batteryAh: number, toolConsumption: number) => {
    return batteryAh / toolConsumption;
  };
  
  const selectedToolObj = runtimeData.tools.find(t => t.id === selectedTool);
  
  const tabs = [
    { id: "specs", label: "Technical Specs", icon: <FileText size={16} /> },
    { id: "runtime", label: "Job Site Calculator", icon: <BarChart3 size={16} /> },
    { id: "compatibility", label: "Tool Compatibility", icon: <Wrench size={16} /> },
    { id: "warranty", label: "Warranty", icon: <Shield size={16} /> },
    { id: "shipping", label: "Shipping & Delivery", icon: <Truck size={16} /> }
  ];

  // Handle selecting a tool from compatibility table for runtime calculator
  const handleSelectToolForRuntime = (toolId: string) => {
    // Find corresponding runtime calculator tool
    const compatibilityTool = toolsData.find(t => t.id === toolId);
    if (compatibilityTool) {
      // Find the closest matching tool in the runtime calculator
      const matchingTool = runtimeData.tools.find(t => 
        t.name.toLowerCase().includes(compatibilityTool.description.toLowerCase()) ||
        compatibilityTool.description.toLowerCase().includes(t.name.toLowerCase())
      );
      
      if (matchingTool) {
        setSelectedTool(matchingTool.id);
      }
    }
  };

  // Switch to a specific tab
  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  if (!isClient) {
    return null; // Prevent hydration errors
  }

  // Convert our battery specs format to the one expected by BatteryComparisonTable
  const formattedBatterySpecs = batterySpecs.map(spec => ({
    name: spec.name,
    values: [spec.value6Ah, spec.value9Ah, spec.value15Ah]
  }));

  return (
    <div className="product-tabs my-8">
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        overflowX: 'auto', 
        marginBottom: '24px',
        borderBottom: '1px solid #E5E7EB'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 24px',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              borderBottom: '2px solid',
              borderColor: activeTab === tab.id ? '#2563EB' : 'transparent',
              color: activeTab === tab.id ? '#2563EB' : '#6B7280',
              background: 'transparent',
              transition: 'all 0.15s ease-in-out',
              cursor: 'pointer',
              border: 'none',
              outline: 'none'
            }}
            onClick={() => switchTab(tab.id)}
          >
            <span style={{ marginRight: '8px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ 
        background: 'white', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.15s ease-in-out'
      }}>
        {/* Technical Specs Tab */}
        {activeTab === "specs" && (
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
            
            {/* Render the new BatteryComparisonTable component */}
            <BatteryComparisonTable 
              batteries={[
                { id: "6ah", name: "6Ah Battery" },
                { id: "9ah", name: "9Ah Battery" },
                { id: "15ah", name: "15Ah Battery" }
              ]}
              specs={formattedBatterySpecs}
              selectedBattery={selectedBattery.toLowerCase().replace('ah', 'ah')}
            />
          </div>
        )}

        {/* Runtime Calculator Tab */}
        {activeTab === "runtime" && (
          <div style={{ padding: '24px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            {/* Render the new RuntimeCalculator component */}
            <ConstructionRuntimeCalculator 
              selectedBattery={selectedBattery}
              setSelectedBattery={setSelectedBattery}
              isMobile={windowIsMobile}
              runtimeData={runtimeData}
            />
          </div>
        )}

        {/* Enhanced Tool Compatibility Tab */}
        {activeTab === "compatibility" && (
          <div style={{ padding: '24px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <EnhancedToolCompatibilityTable 
              tools={toolsData}
              categories={categories}
              isMobile={windowIsMobile}
              onSelectToolForRuntimeCalculator={handleSelectToolForRuntime}
              switchTab={switchTab}
            />
          </div>
        )}

        {/* Warranty Tab */}
        {activeTab === "warranty" && (
          <div style={{ padding: '24px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <div style={{ 
                padding: '12px', 
                background: '#ECFDF5', 
                borderRadius: '9999px', 
                marginRight: '16px' 
              }}>
                <Shield size={24} style={{ color: '#059669' }} />
              </div>
              
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  color: '#111827', 
                  marginBottom: '4px' 
                }}>
                  12-Month Zero-Hassle Warranty
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6B7280', 
                  margin: '0' 
                }}>
                  Comprehensive coverage for your FlexVolt batteries
                </p>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: windowIsMobile ? '1fr' : 'repeat(3, 1fr)', 
              gap: '16px', 
              marginBottom: '32px' 
            }}>
              {warrantyFeatures.map(feature => (
                <div
                  key={feature.id}
                  style={{
                    padding: '16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '12px' 
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#ECFDF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      {feature.icon}
                    </div>
                    
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                    }}>
                      {feature.title}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280',
                  }}>
                    {feature.description}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Frequently Asked Questions
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqs.map(faq => (
                  <div
                    key={faq.id}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      style={{
                        width: '100%',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#111827',
                        background: expandedFAQ === faq.id ? '#F9FAFB' : 'white',
                        border: 'none',
                        borderBottom: expandedFAQ === faq.id ? '1px solid #E5E7EB' : 'none',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleFAQ(faq.id)}
                    >
                      {faq.question}
                      {expandedFAQ === faq.id ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                    
                    {expandedFAQ === faq.id && (
                      <div style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#4B5563',
                        background: 'white'
                      }}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              background: '#EFF6FF',
              borderRadius: '8px',
              border: '1px solid #BFDBFE',
              display: 'flex',
              flexDirection: windowIsMobile ? 'column' : 'row',
              alignItems: windowIsMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1E40AF', 
                  marginBottom: '4px' 
                }}>
                  Need to register a warranty?
                </h4>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#3B82F6', 
                  margin: '0' 
                }}>
                  All purchases are automatically registered. You're covered!
                </p>
              </div>
              
              <button style={{
                padding: '10px 20px',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <LifeBuoy size={16} />
                Contact Support
              </button>
            </div>
          </div>
        )}

        {/* Shipping & Delivery Tab */}
        {activeTab === "shipping" && (
          <div style={{ padding: '24px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Shipping Methods
              </h3>
              
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #E5E7EB'
              }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th style={{ 
                      padding: '12px 16px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      textAlign: 'left',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      Method
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      textAlign: 'center',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      Cost
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      textAlign: 'center',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      Delivery Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shippingMethods.map((method, index) => (
                    <tr 
                      key={method.id}
                      style={{ 
                        background: method.recommended ? '#F0F9FF' : (index % 2 === 0 ? 'white' : '#F9FAFB')
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = method.recommended 
                          ? '#E0F2FE' 
                          : (index % 2 === 0 ? '#F9FAFB' : '#F3F4F6');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = method.recommended 
                          ? '#F0F9FF' 
                          : (index % 2 === 0 ? 'white' : '#F9FAFB');
                      }}
                    >
                      <td style={{ 
                        padding: '16px', 
                        fontSize: '14px', 
                        color: '#111827',
                        borderBottom: '1px solid #E5E7EB'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px' 
                        }}>
                          {method.name}
                          {method.recommended && (
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#3B82F6',
                              background: '#DBEAFE',
                              padding: '2px 8px',
                              borderRadius: '9999px'
                            }}>
                              Recommended
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px', 
                        fontSize: '14px', 
                        color: method.price === "Free" ? '#10B981' : '#6B7280',
                        fontWeight: method.price === "Free" ? '600' : '400',
                        textAlign: 'center',
                        borderBottom: '1px solid #E5E7EB'
                      }}>
                        {method.price}
                      </td>
                      <td style={{ 
                        padding: '16px', 
                        fontSize: '14px', 
                        color: '#6B7280',
                        textAlign: 'center',
                        borderBottom: '1px solid #E5E7EB'
                      }}>
                        {method.delivery}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Delivery Timeline
              </h3>
              
              <div style={{ position: 'relative', paddingBottom: '16px' }}>
                {/* Timeline Track */}
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  left: '24px',
                  right: '24px',
                  height: '2px',
                  background: '#E5E7EB',
                  zIndex: 1
                }}/>
                
                {/* Timeline Points */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowIsMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: windowIsMobile ? '40px' : '0',
                  position: 'relative',
                  zIndex: 2
                }}>
                  {/* Order Received */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#2563EB',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <span>1</span>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      textAlign: 'center'
                    }}>
                      Order Received
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      textAlign: 'center'
                    }}>
                      Immediate
                    </div>
                  </div>
                  
                  {/* Processing */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#2563EB',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <span>2</span>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      textAlign: 'center'
                    }}>
                      Processing
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      textAlign: 'center'
                    }}>
                      1-2 Hours
                    </div>
                  </div>
                  
                  {/* Shipped */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#2563EB',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <span>3</span>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      textAlign: 'center'
                    }}>
                      Shipped
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      textAlign: 'center'
                    }}>
                      Same Day
                    </div>
                  </div>
                  
                  {/* Delivered */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#2563EB',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <span>4</span>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      textAlign: 'center'
                    }}>
                      Delivered
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      textAlign: 'center'
                    }}>
                      1-3 Days
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              background: '#F0F9FF',
              borderRadius: '8px',
              border: '1px solid #BAE6FD',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'white',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={24} />
              </div>
              
              <div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#0C4A6E', 
                  marginBottom: '4px' 
                }}>
                  Same-Day Shipping on All Orders
                </h4>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#0369A1', 
                  margin: '0' 
                }}>
                  Place your order before 2:00 PM EST for same-day shipping. Orders placed after 2:00 PM will ship next business day.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;