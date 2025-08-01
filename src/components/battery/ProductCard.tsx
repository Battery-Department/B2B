'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { 
  Battery, Clock, Zap, Activity, CheckCircle, Star, Plus, Minus
} from 'lucide-react';
import { QuizBadge, useQuizBadges, QuizMatchExplanation } from './QuizBadge';

export interface ProductData {
  id: string;
  name: string;
  runtime: string;
  weight: string;
  price: number;
  msrp: number;
  voltage: string;
  features: string;
  workOutput: string;
  chargingTime: string;
  savings: number;
  popular?: boolean;
}

interface ProductCardProps {
  product: ProductData;
  quantity: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onQuickView?: (product: ProductData) => void;
}

export function ProductCard({ 
  product, 
  quantity, 
  onUpdateQuantity,
  onQuickView 
}: ProductCardProps) {
  const quizBadges = useQuizBadges(product.id);
  const [showQuizExplanation, setShowQuizExplanation] = React.useState(false);

  return (
    <Card
      variant="interactive"
      className="relative h-full flex flex-col overflow-hidden"
      onClick={() => onQuickView?.(product)}
    >
      {product.popular && !quizBadges.length && (
        <div className="absolute top-3 right-3 z-10 bg-[#FFB800] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
          <Star size={12} fill="white" />
          MOST POPULAR
        </div>
      )}

      {/* Quiz Badges */}
      {quizBadges.map((badge, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: `${8 + (index * 28)}px`,
            right: '12px',
            zIndex: 20
          }}
        >
          <QuizBadge
            {...badge}
            onClick={(e) => {
              e?.stopPropagation();
              setShowQuizExplanation(!showQuizExplanation);
            }}
          />
        </div>
      ))}

      <CardContent className="flex-1 pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#0A051E] mb-2">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-extrabold text-[#006FEE]">
                ${product.price}
              </span>
              <span className="text-lg text-gray-400 line-through">
                ${product.msrp}
              </span>
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                Save {product.savings}%
              </span>
            </div>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-[#E6F4FF] to-[#F0F9FF] rounded-xl flex items-center justify-center">
            <Battery size={32} className="text-[#006FEE]" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
            <span>{product.features}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400 flex-shrink-0" />
            <span>Runtime: {product.runtime} of continuous operation</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-gray-400 flex-shrink-0" />
            <span>Charge Time: Full charge in {product.chargingTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-gray-400 flex-shrink-0" />
            <span>Perfect for: {product.workOutput}</span>
          </div>
        </div>

        {/* Quiz Match Explanation */}
        {showQuizExplanation && (
          <QuizMatchExplanation productId={product.id} badges={quizBadges} />
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        {/* Quick add buttons */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[5, 10, 25].map(qty => (
            <button
              key={qty}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQuantity(product.id, qty);
              }}
              className="py-2 px-3 border border-[#E6F4FF] rounded-lg bg-white text-[#006FEE] text-sm font-semibold hover:bg-[#F0F9FF] hover:border-[#006FEE] transition-all duration-200"
            >
              +{qty}
            </button>
          ))}
        </div>

        {/* Custom quantity controls */}
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQuantity(product.id, -1);
            }}
            className="w-10 h-10 rounded-lg border border-[#E6F4FF] bg-white flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <Minus size={16} className="text-gray-600" />
          </button>
          
          <div className="flex-1 text-center py-2 px-4 bg-gray-50 rounded-lg font-semibold text-gray-900">
            {quantity || 0} units
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQuantity(product.id, 1);
            }}
            className="w-10 h-10 rounded-lg border border-[#E6F4FF] bg-white flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition-all duration-200"
          >
            <Plus size={16} className="text-gray-600" />
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}