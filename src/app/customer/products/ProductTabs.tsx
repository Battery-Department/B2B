'use client';

import React, { useState, useEffect } from 'react';
import { FileText, BarChart3, Wrench, Shield, Truck, ChevronDown, ChevronRight, Clock, ExternalLink, LifeBuoy, Package } from 'lucide-react';
import BatteryComparisonTable from './BatteryComparisonTable';
import RuntimeCalculator from './RuntimeCalculator';

// Types for the component
interface BatterySpec {
  name: string;
  value6Ah: string;
  value9Ah: string;
  value15Ah: string;
}

interface ToolItem {
  id: string;
  name: string;
  model: string;
  category: string;
  icon: React.ReactNode;
}

interface Category {
  id: string;
  name: string;
}

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

// Data for the component
const batterySpecs: BatterySpec[] = [
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

const tools: ToolItem[] = [
  // Drills Category
  { id: "drill1", name: "Cordless Drill/Driver", model: "DCD999", category: "drills", icon: <Wrench size={24} /> },
  { id: "drill2", name: "Hammer Drill", model: "DCD996", category: "drills", icon: <Wrench size={24} /> },
  { id: "drill3", name: "Right Angle Drill", model: "DCD740", category: "drills", icon: <Wrench size={24} /> },
  { id: "drill4", name: "Stud & Joist Drill", model: "DCD460", category: "drills", icon: <Wrench size={24} /> },
  
  // Saws Category
  { id: "saw1", name: "Circular Saw", model: "DCS573", category: "saws", icon: <Wrench size={24} /> },
  { id: "saw2", name: "Reciprocating Saw", model: "DCS389", category: "saws", icon: <Wrench size={24} /> },
  { id: "saw3", name: "Jigsaw", model: "DCS334", category: "saws", icon: <Wrench size={24} /> },
  { id: "saw4", name: "Miter Saw", model: "DCS727", category: "saws", icon: <Wrench size={24} /> },
  { id: "saw5", name: "Table Saw", model: "DCS7485", category: "saws", icon: <Wrench size={24} /> },
  
  // Grinders Category
  { id: "grind1", name: "Angle Grinder", model: "DCG414", category: "grinders", icon: <Wrench size={24} /> },
  { id: "grind2", name: "Die Grinder", model: "DCG426", category: "grinders", icon: <Wrench size={24} /> },
  
  // Impact Drivers Category
  { id: "impact1", name: "Impact Driver", model: "DCF887", category: "impacts", icon: <Wrench size={24} /> },
  { id: "impact2", name: "Impact Wrench", model: "DCF894", category: "impacts", icon: <Wrench size={24} /> },
  { id: "impact3", name: "High Torque Impact", model: "DCF899", category: "impacts", icon: <Wrench size={24} /> },
  
  // Nailers Category
  { id: "nail1", name: "Framing Nailer", model: "DCN692", category: "nailers", icon: <Wrench size={24} /> },
  { id: "nail2", name: "Brad Nailer", model: "DCN680", category: "nailers", icon: <Wrench size={24} /> },
  { id: "nail3", name: "Finish Nailer", model: "DCN660", category: "nailers", icon: <Wrench size={24} /> },
];

const categories: Category[] = [
  { id: "all", name: "All Tools" },
  { id: "drills", name: "Drills" },
  { id: "saws", name: "Saws" },
  { id: "grinders", name: "Grinders" },
  { id: "impacts", name: "Impact Drivers" },
  { id: "nailers", name: "Nailers" }
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

export default function ProductTabs() {
  const [activeTab, setActiveTab] = useState("specs");
  const [selectedBattery, setSelectedBattery] = useState("9Ah");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFAQ, setExpandedFAQ] = useState("");
  const [selectedTool, setSelectedTool] = useState(runtimeData.tools[0].id);
  const [isClient, setIsClient] = useState(false);
  
  // For responsive behavior
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Filter tools based on active category
  const filteredTools = tools.filter(tool => 
    activeCategory === "all" || tool.category === activeCategory
  );
  
  // Toggle FAQ expansion
  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? "" : id);
  };
  
  const selectedToolObj = runtimeData.tools.find(t => t.id === selectedTool);
  
  const tabs = [
    { id: "specs", label: "Technical Specs", icon: <FileText size={16} /> },
    { id: "runtime", label: "Runtime Calculator", icon: <BarChart3 size={16} /> },
    { id: "compatibility", label: "Tool Compatibility", icon: <Wrench size={16} /> },
    { id: "warranty", label: "Warranty", icon: <Shield size={16} /> },
    { id: "shipping", label: "Shipping & Delivery", icon: <Truck size={16} /> }
  ];

  if (!isClient) {
    return null; // Prevent hydration errors
  }

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
            onClick={() => setActiveTab(tab.id)}
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
          <BatteryComparisonTable 
            batterySpecs={batterySpecs}
            selectedBattery={selectedBattery}
            setSelectedBattery={setSelectedBattery}
          />
        )}

        {/* Runtime Calculator Tab */}
        {activeTab === "runtime" && (
          <RuntimeCalculator
            tools={runtimeData.tools}
            batteries={runtimeData.batteries}
            selectedBattery={selectedBattery}
            setSelectedBattery={setSelectedBattery}
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            isMobile={isMobile}
          />
        )}

        {/* Tool Compatibility Tab */}
        {activeTab === "compatibility" && (
          <div style={{ padding: '24px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              marginBottom: '24px', 
              paddingBottom: '8px'
            }}>
              {categories.map(category => (
                <button
                  key={category.id}
                  style={{
                    padding: '8px 16px',
                    marginRight: '12px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    background: activeCategory === category.id ? '#2563EB' : 'white',
                    color: activeCategory === category.id ? 'white' : '#6B7280',
                    border: activeCategory === category.id ? 'none' : '1px solid #D1D5DB',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', 
              gap: '16px' 
            }}>
              {filteredTools.map(tool => (
                <div
                  key={tool.id}
                  style={{
                    padding: '16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#BFDBFE';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  <div style={{ 
                    marginBottom: '12px', 
                    display: 'flex', 
                    justifyContent: 'center' 
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4B5563'
                    }}>
                      {tool.icon}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}>
                    {tool.model}
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    textAlign: 'center'
                  }}>
                    {tool.name}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: '#EFF6FF',
              borderRadius: '8px',
              border: '1px solid #BFDBFE',
              fontSize: '14px',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ 
                flexShrink: 0, 
                background: 'white', 
                borderRadius: '9999px', 
                width: '32px', 
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB'
              }}>
                <ExternalLink size={16} />
              </div>
              <div>
                <strong>Need more details?</strong> Check the complete compatibility guide for all DeWalt 20V/60V FlexVolt tools.
              </div>
            </div>
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
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
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
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
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
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: isMobile ? '40px' : '0',
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
}