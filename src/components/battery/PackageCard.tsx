'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Award, Gift, CheckCircle, Clock, Users, Star, Plus
} from 'lucide-react';

export interface PackageData {
  id: string;
  name: string;
  teamSize: string;
  details: string[];
  price: number;
  msrp: number;
  savings: number;
  hours: number;
  description: string;
  purchases: number;
  isPopular: boolean;
  features: string[];
  quantities: Record<string, number>;
}

interface PackageCardProps {
  package: PackageData;
  onAddToCart: (quantities: Record<string, number>) => void;
}

export function PackageCard({ package: pkg, onAddToCart }: PackageCardProps) {
  return (
    <Card
      variant="interactive"
      className="relative h-full flex flex-col"
    >
      {pkg.isPopular && (
        <div className="absolute -top-3 right-6 bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-10">
          <Award size={14} fill="white" />
          BEST VALUE
        </div>
      )}

      <CardContent className="flex-1 pt-6">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-[#0A051E] mb-1">
            {pkg.name}
          </h3>
          <p className="text-gray-600 text-sm">
            {pkg.teamSize}
          </p>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-extrabold text-[#006FEE]">
            ${pkg.price.toLocaleString()}
          </span>
          <span className="text-lg text-gray-400 line-through">
            ${pkg.msrp.toLocaleString()}
          </span>
        </div>

        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold mb-5">
          <Gift size={14} />
          Save ${pkg.savings.toLocaleString()}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-[#0A051E] mb-3">
            Package includes:
          </p>
          {pkg.details.map((detail, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2 text-sm text-gray-700">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              <span>{detail}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-sm font-semibold text-[#006FEE]">
            <Clock size={14} />
            <span>{pkg.hours} hours total runtime</span>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          {pkg.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users size={14} />
            <span>{pkg.purchases} purchased this month</span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} size={14} fill="#FFB800" className="text-[#FFB800]" />
            ))}
          </div>
        </div>

        <button
          onClick={() => onAddToCart(pkg.quantities)}
          className="w-full mt-4 py-3 px-6 bg-[#006FEE] text-white rounded-xl font-semibold hover:bg-[#0059D1] transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Package to Cart
        </button>
      </CardContent>
    </Card>
  );
}