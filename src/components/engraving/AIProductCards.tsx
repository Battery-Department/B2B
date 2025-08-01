import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, TrendingUp, Zap, Clock, Award, CheckCircle } from 'lucide-react';
import { CompanyData } from '@/lib/company-analyzer';
import { generateDynamicContent } from '@/lib/ai-content-generator';

interface AIProductCardsProps {
  companyData?: CompanyData;
  quantities: { [key: string]: number };
  subtotal: number;
}

interface ProductCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight: string;
  color: string;
}

export default function AIProductCards({ companyData, quantities, subtotal }: AIProductCardsProps) {
  const [cards, setCards] = useState<ProductCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Calculate total batteries
  const totalBatteries = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  
  useEffect(() => {
    if (companyData) {
      generateCards();
    } else {
      // Default cards when no company data
      setDefaultCards();
    }
  }, [companyData, totalBatteries]);
  
  const setDefaultCards = () => {
    setCards([
      {
        title: "Tool Security",
        description: "Permanent laser engraving prevents theft and mix-ups on job sites",
        icon: <Shield className="w-5 h-5" />,
        highlight: "Insurance Approved",
        color: "blue"
      },
      {
        title: "Fleet Management",
        description: "Track batteries across multiple crews and vehicles with custom IDs",
        icon: <TrendingUp className="w-5 h-5" />,
        highlight: "Save $1000s/year",
        color: "green"
      },
      {
        title: "Fast Turnaround",
        description: "30-day delivery on all custom engraved FlexVolt batteries",
        icon: <Clock className="w-5 h-5" />,
        highlight: "USA Made",
        color: "purple"
      }
    ]);
  };
  
  const generateCards = async () => {
    if (!companyData) return;
    
    setIsGenerating(true);
    
    // Generate dynamic content based on company data
    const content = generateDynamicContent(companyData);
    
    // Industry-specific cards
    const industryCards: Record<string, ProductCard[]> = {
      electrical: [
        {
          title: "Electrical Contractor Protection",
          description: `Stop tool theft from ${companyData.name}'s service vans with permanent ID`,
          icon: <Zap className="w-5 h-5" />,
          highlight: content.priceAnchor,
          color: "yellow"
        },
        {
          title: "Apprentice Management",
          description: "Track tools across your electrical crews - no more mix-ups",
          icon: <Award className="w-5 h-5" />,
          highlight: "Reduce Loss by 80%",
          color: "blue"
        },
        {
          title: "Insurance Benefits",
          description: "Engraved tools qualify for lower premiums - save monthly",
          icon: <Shield className="w-5 h-5" />,
          highlight: "Insurance Approved",
          color: "green"
        }
      ],
      plumbing: [
        {
          title: "Plumbing Fleet Security",
          description: `Protect ${companyData.name}'s expensive tools from truck theft`,
          icon: <Shield className="w-5 h-5" />,
          highlight: content.priceAnchor,
          color: "blue"
        },
        {
          title: "Job Site Organization",
          description: "Never leave tools behind - instant crew accountability",
          icon: <CheckCircle className="w-5 h-5" />,
          highlight: "Zero Tools Lost",
          color: "green"
        },
        {
          title: "Emergency Ready",
          description: "24/7 service calls need organized tools - be prepared",
          icon: <Clock className="w-5 h-5" />,
          highlight: content.urgencyMessage,
          color: "red"
        }
      ],
      hvac: [
        {
          title: "HVAC Equipment Protection",
          description: `Secure ${companyData.name}'s gauges and analyzers permanently`,
          icon: <Shield className="w-5 h-5" />,
          highlight: content.priceAnchor,
          color: "blue"
        },
        {
          title: "Fleet Efficiency",
          description: `Manage tools across ${companyData.indicators.fleetSize === 'large' ? 'your fleet' : 'multiple trucks'}`,
          icon: <TrendingUp className="w-5 h-5" />,
          highlight: "ROI in 30 days",
          color: "green"
        },
        {
          title: "Seasonal Prep",
          description: content.urgencyMessage,
          icon: <Clock className="w-5 h-5" />,
          highlight: "Limited Time",
          color: "orange"
        }
      ],
      roofing: [
        {
          title: "Roofing Crew Security",
          description: `Stop nail gun theft at ${companyData.location} job sites`,
          icon: <Shield className="w-5 h-5" />,
          highlight: content.priceAnchor,
          color: "red"
        },
        {
          title: "Storm Season Ready",
          description: "Track tools when demand spikes - never lose equipment",
          icon: <Zap className="w-5 h-5" />,
          highlight: content.urgencyMessage,
          color: "orange"
        },
        {
          title: "Crew Accountability",
          description: "Each roofer's tools marked - reduce replacement costs",
          icon: <Award className="w-5 h-5" />,
          highlight: "Save 70% on tools",
          color: "green"
        }
      ],
      general: [
        {
          title: "Multi-Trade Management",
          description: `Organize ${companyData.name}'s tools across all trades`,
          icon: <TrendingUp className="w-5 h-5" />,
          highlight: content.priceAnchor,
          color: "blue"
        },
        {
          title: "Subcontractor Control",
          description: "Track which sub has which tools - instant accountability",
          icon: <CheckCircle className="w-5 h-5" />,
          highlight: "Zero Disputes",
          color: "green"
        },
        {
          title: "Project Efficiency",
          description: "Organized tools = faster job completion = more profit",
          icon: <Zap className="w-5 h-5" />,
          highlight: "Finish Jobs 20% Faster",
          color: "purple"
        }
      ]
    };
    
    const selectedCards = industryCards[companyData.type] || industryCards.general;
    
    // Customize based on order size
    if (totalBatteries > 20) {
      selectedCards[1].highlight = "Fleet Discount Active";
    }
    
    if (subtotal > 2500) {
      selectedCards[0].highlight = "15% Volume Savings";
    }
    
    setCards(selectedCards);
    setIsGenerating(false);
  };
  
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-900', icon: 'text-yellow-600' },
      red: { bg: 'bg-red-50', text: 'text-red-900', icon: 'text-red-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-900', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-900', icon: 'text-orange-600' }
    };
    return colors[color] || colors.blue;
  };
  
  return (
    <div className="space-y-4">
      {/* AI Generation Indicator */}
      {companyData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>AI-customized for {companyData.name}</span>
        </motion.div>
      )}
      
      {/* Product Cards */}
      <div className="grid gap-4">
        <AnimatePresence mode="wait">
          {cards.map((card, index) => {
            const colors = getColorClasses(card.color);
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`${colors.bg} rounded-xl p-5 border border-${card.color}-200 relative overflow-hidden`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-current"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`${colors.icon}`}>
                        {card.icon}
                      </div>
                      <h4 className={`font-semibold ${colors.text}`}>
                        {card.title}
                      </h4>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/80 ${colors.text}`}>
                      {card.highlight}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${colors.text} opacity-80 leading-relaxed`}>
                    {card.description}
                  </p>
                  
                  {/* Quantity indicator */}
                  {totalBatteries > 0 && index === 0 && (
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${colors.text} opacity-60`}>
                          {totalBatteries} batteries selected
                        </span>
                        <span className={`font-medium ${colors.text}`}>
                          ${(subtotal * 0.1).toFixed(0)} deposit only
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Trust Indicator */}
      {companyData && companyData.reviewCount > 50 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-500 mt-4"
        >
          Trusted by {Math.floor(companyData.reviewCount / 10)} {companyData.type} contractors in {companyData.location}
        </motion.div>
      )}
    </div>
  );
}