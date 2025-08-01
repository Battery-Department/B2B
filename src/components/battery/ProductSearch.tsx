'use client';

import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: string) => void;
  currentSort: string;
  placeholder?: string;
}

export function ProductSearch({
  searchQuery,
  onSearchChange,
  onSortChange,
  currentSort,
  placeholder = "Search batteries..."
}: ProductSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'power', label: 'Power Output' },
  ];

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border-2 border-[#E6F4FF] rounded-xl text-base focus:border-[#006FEE] focus:outline-none transition-colors duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X size={20} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-white border-2 border-[#E6F4FF] rounded-xl px-4 py-3 pr-10 font-medium text-gray-700 hover:border-[#006FEE] focus:border-[#006FEE] focus:outline-none transition-colors duration-200 cursor-pointer"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <SlidersHorizontal size={18} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {searchQuery && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Searching for:</span>
          <span className="bg-[#E6F4FF] text-[#006FEE] px-3 py-1 rounded-full font-medium">
            "{searchQuery}"
          </span>
        </div>
      )}
    </div>
  );
}