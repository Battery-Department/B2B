'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface Tool {
  name: string;
  powerDraw: 'low' | 'medium' | 'high';
  avgUsage: number;
  category: string;
}

interface ToolSearchProps {
  tools: Tool[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToolSelect: (tool: Tool) => void;
  selectedTools: Record<string, number>;
  powerFilter?: 'all' | 'low' | 'medium' | 'high';
  onPowerFilterChange?: (filter: 'all' | 'low' | 'medium' | 'high') => void;
}

export function ToolSearch({
  tools,
  searchQuery,
  onSearchChange,
  onToolSelect,
  selectedTools,
  powerFilter = 'all',
  onPowerFilterChange
}: ToolSearchProps) {
  const [showFilters, setShowFilters] = React.useState(false);

  // Filter tools based on search and power filter
  const filteredTools = React.useMemo(() => {
    let filtered = tools;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
    }

    // Power filter
    if (powerFilter !== 'all') {
      filtered = filtered.filter(tool => tool.powerDraw === powerFilter);
    }

    return filtered;
  }, [tools, searchQuery, powerFilter]);

  const powerFilterOptions = [
    { value: 'all', label: 'All Power Levels', count: tools.length },
    { value: 'low', label: 'Low Power', count: tools.filter(t => t.powerDraw === 'low').length },
    { value: 'medium', label: 'Medium Power', count: tools.filter(t => t.powerDraw === 'medium').length },
    { value: 'high', label: 'High Power', count: tools.filter(t => t.powerDraw === 'high').length }
  ];

  const getPowerColor = (powerDraw: string) => {
    switch (powerDraw) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tools (e.g., drill, saw, grinder...)"
          className="w-full pl-10 pr-12 py-3 border-2 border-[#E6F4FF] rounded-xl text-base focus:border-[#006FEE] focus:outline-none transition-colors duration-200"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-2 text-gray-400 hover:text-gray-600 mr-1"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 mr-2 rounded-lg transition-colors ${
              showFilters ? 'text-[#006FEE] bg-blue-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Power Filter */}
      {showFilters && onPowerFilterChange && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Filter by Power Draw</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {powerFilterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onPowerFilterChange(option.value as any)}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${
                  powerFilter === option.value
                    ? 'bg-[#006FEE] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div>{option.label}</div>
                <div className="text-xs opacity-75">({option.count})</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          Found {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
        </div>
      )}

      {/* Tool Results */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {filteredTools.map(tool => {
            const isSelected = (selectedTools[tool.name] || 0) > 0;
            return (
              <button
                key={tool.name}
                onClick={() => onToolSelect(tool)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-[#006FEE] bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-[#006FEE] hover:bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{tool.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPowerColor(tool.powerDraw)}`}>
                    {tool.powerDraw.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {tool.category}
                </div>
                <div className="text-xs text-gray-500">
                  Avg. usage: {tool.avgUsage}%
                </div>
                {isSelected && (
                  <div className="mt-2 text-sm font-semibold text-[#006FEE]">
                    {selectedTools[tool.name]} selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        searchQuery && (
          <div className="text-center py-8 text-gray-500">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No tools found matching "{searchQuery}"</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )
      )}
    </div>
  );
}