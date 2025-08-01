import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Clock, Award, Zap, TrendingUp, Battery, Lock } from 'lucide-react';
import { CompanyData } from '@/lib/company-analyzer';
import { generateEngravingContent, generateDynamicContent } from '@/lib/ai-content-generator';

interface DynamicEngravingSectionProps {
  companyData?: CompanyData;
  subtotal: number;
  quantities: { [key: string]: number };
}

export default function DynamicEngravingSection({ 
  companyData, 
  subtotal, 
  quantities 
}: DynamicEngravingSectionProps) {
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (companyData) {
      // Generate dynamic content based on company data
      const engravingContent = generateEngravingContent(companyData);
      const dynamicContent = generateDynamicContent(companyData);
      setContent({ ...engravingContent, dynamic: dynamicContent });
    }
  }, [companyData]);
  
  // Calculate total batteries
  const totalBatteries = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  
  // Default content if no company data
  const defaultContent = {
    title: 'USA Custom Engraving & Assembly',
    description: 'Hand-assembled in Boston with theft-stopping laser engraving that makes your batteries impossible to sell and easy to recover.',
    features: [
      {
        title: 'Permanent Theft Deterrent',
        description: 'Deep engraving that can\'t be filed off or removed',
        icon: 'shield'
      },
      {
        title: 'Premium Samsung 21700 Cells',
        description: '40% more runtime than standard replacement batteries—same cells Tesla uses',
        icon: 'battery'
      },
      {
        title: '85% Recovery Rate',
        description: 'Engraved batteries are returned vs. 15% for unmarked',
        icon: 'lock'
      }
    ]
  };
  
  const displayContent = content || defaultContent;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="engraving-section bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      {/* Enhanced Header with Dynamic Content */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h3 className="text-lg font-bold text-white text-center">
          {displayContent.title}
        </h3>
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        {/* Dynamic Description */}
        <p className="text-gray-700 mb-6 leading-relaxed text-center">
          {displayContent.description}
        </p>
        
        {/* Dynamic Features Grid */}
        <div className="space-y-4">
          {displayContent.features.map((feature, index) => {
            // Determine which icon to use
            const IconComponent = feature.icon === 'shield' ? Shield : 
                                 feature.icon === 'battery' ? Battery : 
                                 feature.icon === 'lock' ? Lock :
                                 index === 0 ? Shield :
                                 index === 1 ? Battery : Lock;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <IconComponent className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-1">
                      {feature.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {feature.description}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Order Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{totalBatteries}</div>
            <div className="text-xs text-gray-600">Batteries Selected</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">${(subtotal * 0.1).toFixed(0)}</div>
            <div className="text-xs text-gray-600">Deposit Only</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}