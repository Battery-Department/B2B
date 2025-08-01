'use client';

import React from 'react';
import { X, Battery, Clock, Zap, Activity, CheckCircle, Weight, Truck, Shield, Award } from 'lucide-react';
import { ProductData } from './ProductCard';

interface QuickViewModalProps {
  product: ProductData | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
}

export function QuickViewModal({ product, isOpen, onClose, onAddToCart }: QuickViewModalProps) {
  const [quantity, setQuantity] = React.useState(1);

  if (!isOpen || !product) return null;

  const specifications = [
    { label: 'Voltage', value: product.voltage, icon: Zap },
    { label: 'Weight', value: product.weight, icon: Weight },
    { label: 'Runtime', value: product.runtime, icon: Clock },
    { label: 'Charge Time', value: product.chargingTime, icon: Battery },
  ];

  const benefits = [
    'Compatible with all DeWalt 20V/60V tools',
    'Industry-leading battery life',
    'Fast charging technology',
    'Weather-resistant construction',
    '3-year manufacturer warranty',
    'Free shipping on orders over $1,000'
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-[#0A051E]">{product.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Product Image and Basic Info */}
              <div>
                <div className="bg-gradient-to-br from-[#E6F4FF] to-[#F0F9FF] rounded-2xl p-12 mb-6 relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    {product.popular && (
                      <span className="bg-[#FFB800] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star size={12} fill="white" />
                        MOST POPULAR
                      </span>
                    )}
                  </div>
                  <Battery size={120} className="text-[#006FEE] mx-auto" />
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-extrabold text-[#006FEE]">
                      ${product.price}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      ${product.msrp}
                    </span>
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Save {product.savings}%
                    </span>
                  </div>
                  <p className="text-gray-600">{product.features}</p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-[#006FEE] flex items-center justify-center transition-colors"
                    >
                      <span className="text-xl">−</span>
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-12 text-center border-2 border-gray-200 rounded-lg font-semibold text-lg focus:border-[#006FEE] focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-[#006FEE] flex items-center justify-center transition-colors"
                    >
                      <span className="text-xl">+</span>
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    onAddToCart(product.id, quantity);
                    onClose();
                  }}
                  className="w-full bg-[#006FEE] text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-[#0059D1] transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Add {quantity} to Cart - ${(product.price * quantity).toFixed(2)}
                </button>
              </div>

              {/* Right Column - Specifications and Details */}
              <div>
                {/* Specifications */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[#0A051E] mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {specifications.map((spec) => (
                      <div key={spec.label} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <spec.icon size={16} className="text-[#006FEE]" />
                          <span className="text-sm font-medium text-gray-600">{spec.label}</span>
                        </div>
                        <p className="font-semibold text-[#0A051E]">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Work Output */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[#0A051E] mb-4">Work Output</h3>
                  <div className="bg-[#F0F9FF] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#006FEE]">
                      <Activity size={20} />
                      <span className="font-semibold">{product.workOutput}</span>
                    </div>
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[#0A051E] mb-4">Key Benefits</h3>
                  <div className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & Warranty */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Truck size={24} className="text-[#006FEE] mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-600">Fast Shipping</p>
                  </div>
                  <div className="text-center">
                    <Shield size={24} className="text-[#006FEE] mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-600">3-Year Warranty</p>
                  </div>
                  <div className="text-center">
                    <Award size={24} className="text-[#006FEE] mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-600">Top Rated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}