'use client';

import React from 'react';
import { X, Battery, Clock, Zap, Weight, DollarSign, CheckCircle, Star } from 'lucide-react';
import { ProductData } from './ProductCard';

interface ProductComparisonProps {
  products: ProductData[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
}

export function ProductComparison({ products, isOpen, onClose, onAddToCart }: ProductComparisonProps) {
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});

  if (!isOpen || products.length === 0) return null;

  const updateQuantity = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity)
    }));
  };

  const handleAddToCart = (productId: string) => {
    const quantity = quantities[productId] || 1;
    onAddToCart(productId, quantity);
    onClose();
  };

  const comparisonRows = [
    { label: 'Price', key: 'price', icon: DollarSign, format: (value: any) => `$${value}` },
    { label: 'MSRP', key: 'msrp', icon: DollarSign, format: (value: any) => `$${value}`, className: 'text-gray-400 line-through' },
    { label: 'Savings', key: 'savings', icon: CheckCircle, format: (value: any) => `${value}%`, className: 'text-green-600 font-semibold' },
    { label: 'Runtime', key: 'runtime', icon: Clock, format: (value: any) => value },
    { label: 'Charge Time', key: 'chargingTime', icon: Zap, format: (value: any) => value },
    { label: 'Weight', key: 'weight', icon: Weight, format: (value: any) => value },
    { label: 'Work Output', key: 'workOutput', icon: Battery, format: (value: any) => value },
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
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-[#0A051E]">Compare Batteries</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {/* Product Headers */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="hidden md:block"></div> {/* Empty cell for labels */}
              {products.map(product => (
                <div key={product.id} className="text-center">
                  <div className="bg-gradient-to-br from-[#E6F4FF] to-[#F0F9FF] rounded-2xl p-6 mb-4 relative">
                    {product.popular && (
                      <div className="absolute -top-2 right-4 bg-[#FFB800] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star size={12} fill="white" />
                        POPULAR
                      </div>
                    )}
                    <Battery size={48} className="text-[#006FEE] mx-auto mb-3" />
                    <h3 className="font-bold text-lg text-[#0A051E]">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.features}</p>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, (quantities[product.id] || 1) - 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 hover:border-[#006FEE] flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantities[product.id] || 1}
                        onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center border border-gray-300 rounded-lg focus:border-[#006FEE] focus:outline-none"
                        min="1"
                      />
                      <button
                        onClick={() => updateQuantity(product.id, (quantities[product.id] || 1) + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 hover:border-[#006FEE] flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="w-full bg-[#006FEE] text-white py-2 px-4 rounded-xl font-semibold hover:bg-[#0059D1] transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr key={row.key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <row.icon size={16} className="text-[#006FEE]" />
                          {row.label}
                        </div>
                      </td>
                      {products.map(product => (
                        <td key={product.id} className={`px-4 py-3 text-center ${row.className || ''}`}>
                          {row.format(product[row.key as keyof ProductData])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Best For Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-[#0A051E] mb-2">{product.name} - Best For:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {product.id === '6Ah' && (
                      <>
                        <li>• Small residential projects</li>
                        <li>• Light to moderate tool usage</li>
                        <li>• Budget-conscious contractors</li>
                        <li>• Backup power needs</li>
                      </>
                    )}
                    {product.id === '9Ah' && (
                      <>
                        <li>• Medium commercial projects</li>
                        <li>• Daily professional use</li>
                        <li>• Balanced power and weight</li>
                        <li>• Most versatile option</li>
                      </>
                    )}
                    {product.id === '15Ah' && (
                      <>
                        <li>• Large construction projects</li>
                        <li>• Heavy-duty applications</li>
                        <li>• All-day power requirements</li>
                        <li>• High-demand tools</li>
                      </>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}