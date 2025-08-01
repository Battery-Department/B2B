'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, X, Mic, MicOff, Camera, Filter, Sparkles, Brain, Zap, Clock,
  TrendingUp, Star, MapPin, User, ChevronRight, History, Award
} from 'lucide-react';
import { useSmartRecommendations } from '@/hooks/useSmartRecommendations';
import { useRealTimePersonalization } from '@/hooks/useRealTimePersonalization';

interface SearchResult {
  id: string;
  type: 'product' | 'category' | 'feature' | 'application';
  title: string;
  description: string;
  relevanceScore: number;
  context?: string;
  metadata?: any;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'product' | 'intent' | 'correction';
  score: number;
  context?: string;
}

interface NLPQuery {
  originalQuery: string;
  processedQuery: string;
  intent: 'find_product' | 'compare' | 'learn' | 'troubleshoot' | 'configure';
  entities: Array<{
    type: 'product' | 'feature' | 'price' | 'brand' | 'application';
    value: string;
    confidence: number;
  }>;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
}

interface SmartSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  enableVoiceSearch?: boolean;
  enableVisualSearch?: boolean;
  enableNLP?: boolean;
  showAdvancedFilters?: boolean;
  className?: string;
}

export function SmartSearch({
  onResultSelect,
  onQueryChange,
  placeholder = "Search batteries, tools, or ask a question...",
  enableVoiceSearch = true,
  enableVisualSearch = true,
  enableNLP = true,
  showAdvancedFilters = true,
  className = ''
}: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [nlpAnalysis, setNlpAnalysis] = useState<NLPQuery | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 500] as [number, number],
    capacity: 'all' as 'all' | '6Ah' | '9Ah' | '15Ah',
    application: 'all' as 'all' | 'residential' | 'commercial' | 'industrial',
    features: [] as string[]
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);

  const { trackSearchQuery } = useSmartRecommendations();
  const { trackProductInteraction, personalizedContent, userSegment } = useRealTimePersonalization();

  // Initialize speech recognition
  useEffect(() => {
    if (enableVoiceSearch && typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleSearch(transcript);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, [enableVoiceSearch]);

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  // Natural Language Processing
  const processNLPQuery = useCallback((query: string): NLPQuery => {
    const lowerQuery = query.toLowerCase();
    
    // Intent detection
    let intent: NLPQuery['intent'] = 'find_product';
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('difference')) {
      intent = 'compare';
    } else if (lowerQuery.includes('how') || lowerQuery.includes('why') || lowerQuery.includes('what')) {
      intent = 'learn';
    } else if (lowerQuery.includes('problem') || lowerQuery.includes('issue') || lowerQuery.includes('fix')) {
      intent = 'troubleshoot';
    } else if (lowerQuery.includes('configure') || lowerQuery.includes('setup') || lowerQuery.includes('calculator')) {
      intent = 'configure';
    }

    // Entity extraction
    const entities: NLPQuery['entities'] = [];
    
    // Product entities
    if (lowerQuery.includes('6ah') || lowerQuery.includes('6 ah')) {
      entities.push({ type: 'product', value: '6Ah', confidence: 0.9 });
    }
    if (lowerQuery.includes('9ah') || lowerQuery.includes('9 ah')) {
      entities.push({ type: 'product', value: '9Ah', confidence: 0.9 });
    }
    if (lowerQuery.includes('15ah') || lowerQuery.includes('15 ah')) {
      entities.push({ type: 'product', value: '15Ah', confidence: 0.9 });
    }

    // Feature entities
    const features = ['runtime', 'charging time', 'weight', 'power', 'voltage', 'flexvolt', 'dewalt'];
    features.forEach(feature => {
      if (lowerQuery.includes(feature)) {
        entities.push({ type: 'feature', value: feature, confidence: 0.8 });
      }
    });

    // Application entities
    const applications = ['construction', 'residential', 'commercial', 'industrial', 'professional', 'contractor'];
    applications.forEach(app => {
      if (lowerQuery.includes(app)) {
        entities.push({ type: 'application', value: app, confidence: 0.7 });
      }
    });

    // Price entities
    const priceMatch = lowerQuery.match(/\$?\d+/);
    if (priceMatch || lowerQuery.includes('cheap') || lowerQuery.includes('budget') || lowerQuery.includes('affordable')) {
      entities.push({ 
        type: 'price', 
        value: priceMatch ? priceMatch[0] : 'budget', 
        confidence: priceMatch ? 0.9 : 0.6 
      });
    }

    // Sentiment analysis (basic)
    let sentiment: NLPQuery['sentiment'] = 'neutral';
    const positiveWords = ['great', 'good', 'excellent', 'best', 'love', 'perfect', 'amazing'];
    const negativeWords = ['bad', 'worst', 'hate', 'terrible', 'problem', 'issue', 'broken'];
    
    if (positiveWords.some(word => lowerQuery.includes(word))) {
      sentiment = 'positive';
    } else if (negativeWords.some(word => lowerQuery.includes(word))) {
      sentiment = 'negative';
    }

    // Urgency detection
    let urgency: NLPQuery['urgency'] = 'low';
    if (lowerQuery.includes('urgent') || lowerQuery.includes('asap') || lowerQuery.includes('immediately')) {
      urgency = 'high';
    } else if (lowerQuery.includes('soon') || lowerQuery.includes('quickly') || lowerQuery.includes('fast')) {
      urgency = 'medium';
    }

    return {
      originalQuery: query,
      processedQuery: lowerQuery,
      intent,
      entities,
      sentiment,
      urgency
    };
  }, []);

  // Enhanced search with semantic understanding using real AI service
  const searchProducts = useCallback(async (query: string, nlpData?: NLPQuery): Promise<{ results: SearchResult[], searchResult: any }> => {
    try {
      // Import enhanced product service
      const { enhancedProductService } = await import('@/services/enhanced-product-service');
      
      // Apply filters from the search filters
      const searchFilters = {
        priceRange: filters.priceRange,
        capacity: filters.capacity !== 'all' ? filters.capacity : undefined,
        application: filters.application !== 'all' ? filters.application : undefined,
        inStock: true
      };

      // Use the AI-powered intelligent search
      const searchResult = await enhancedProductService.intelligentSearch(query, searchFilters);
      
      // Convert to our SearchResult format
      const results: SearchResult[] = searchResult.products.map(product => ({
        id: product.id,
        type: 'product' as const,
        title: product.name,
        description: `${product.specifications.runtime} runtime • ${product.specifications.weight} • $${product.price}`,
        relevanceScore: product.aiScore,
        context: product.recommendations.length > 0 
          ? `AI Insights: ${product.recommendations[0].reason}` 
          : `${product.performanceMetrics.conversionRate.toFixed(1)}% conversion rate`,
        metadata: { 
          product, 
          aiScore: product.aiScore,
          predictedDemand: product.predictedDemand,
          performanceMetrics: product.performanceMetrics
        }
      }));

      // Add special results for non-product queries
      if (query.toLowerCase().includes('configure') || query.toLowerCase().includes('calculator')) {
        results.unshift({
          id: 'configurator',
          type: 'feature',
          title: 'Smart Battery Configurator',
          description: 'AI-powered tool to find the perfect battery configuration for your needs',
          relevanceScore: 95,
          context: 'AI Smart Tool'
        });
      }

      if (query.toLowerCase().includes('compare')) {
        results.unshift({
          id: 'comparison',
          type: 'feature',
          title: 'Battery Comparison Tool',
          description: 'Compare all FlexVolt batteries side-by-side with AI insights',
          relevanceScore: 90,
          context: 'Analysis Tool'
        });
      }

      // Add category result if no specific products found but query contains battery terms
      const batteryTerms = ['battery', 'power', 'flexvolt', 'dewalt'];
      if (results.length === 0 && batteryTerms.some(term => query.toLowerCase().includes(term))) {
        results.push({
          id: 'batteries',
          type: 'category',
          title: 'FlexVolt Batteries',
          description: 'Professional 20V/60V batteries for all your contractor needs',
          relevanceScore: 60,
          context: 'Product Category'
        });
      }

      return { results: results.slice(0, 8), searchResult };
      
    } catch (error) {
      console.error('Enhanced search failed, falling back to basic search:', error);
      
      // Fallback to basic search if AI service fails
      return {
        results: [{
          id: 'error',
          type: 'category',
          title: 'Search temporarily unavailable',
          description: 'Please try again or browse our product catalog',
          relevanceScore: 50,
          context: 'System Message'
        }],
        searchResult: null
      };
    }
  }, [filters]);

  // Generate intelligent suggestions using AI service
  const generateSuggestions = useCallback(async (query: string, searchResult?: any): Promise<SearchSuggestion[]> => {
    try {
      // Use suggestions from the enhanced product service if available
      const aiSuggestions = searchResult?.suggestions || [];
      const suggestions: SearchSuggestion[] = [];

      // Convert AI suggestions to our format
      aiSuggestions.forEach((suggestion: string, index: number) => {
        suggestions.push({
          id: `ai_suggestion_${index}`,
          text: suggestion,
          type: 'query',
          score: 90 - (index * 5), // Decrease score for lower priority suggestions
          context: 'AI Suggested'
        });
      });

      // Add fallback suggestions if no AI suggestions
      if (suggestions.length === 0) {
        const lowerQuery = query.toLowerCase();
        
        // Query completion suggestions
        const queryCompletions = [
          '6ah battery runtime',
          '9ah vs 15ah comparison',
          'best battery for construction',
          'smart battery configurator',
          'professional contractor batteries',
          'heavy duty battery pack',
          'budget battery options',
          'long runtime batteries'
        ];

        queryCompletions.forEach(completion => {
          if (completion.includes(lowerQuery) && completion !== lowerQuery) {
            suggestions.push({
              id: `completion_${completion}`,
              text: completion,
              type: 'query',
              score: completion.startsWith(lowerQuery) ? 90 : 60,
              context: 'Popular search'
            });
          }
        });
      }

      // Product suggestions based on current products
      if (query.length > 1) {
        const products = ['6Ah FlexVolt Battery', '9Ah FlexVolt Battery', '15Ah FlexVolt Battery'];
        products.forEach(product => {
          if (product.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              id: `product_${product}`,
              text: product,
              type: 'product',
              score: product.toLowerCase().startsWith(query.toLowerCase()) ? 85 : 70,
              context: 'Product'
            });
          }
        });
      }

      // Intent-based suggestions
      if (query.toLowerCase().includes('compare')) {
        suggestions.push({
          id: 'intent_compare',
          text: 'Compare all battery models',
          type: 'intent',
          score: 75,
          context: 'AI Comparison'
        });
      }

      if (query.toLowerCase().includes('help') || query.toLowerCase().includes('how')) {
        suggestions.push({
          id: 'intent_help',
          text: 'Battery selection guide',
          type: 'intent',
          score: 70,
          context: 'AI Assistant'
        });
      }

      // Use "did you mean" from enhanced service if available
      if (searchResult?.didYouMean) {
        suggestions.unshift({
          id: 'did_you_mean',
          text: searchResult.didYouMean,
          type: 'correction',
          score: 95,
          context: 'Did you mean?'
        });
      }

      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
        
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }, []);

  // Handle search
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      setNlpAnalysis(null);
      return;
    }

    setIsLoading(true);

    try {
      // Process with NLP if enabled
      let nlpData: NLPQuery | null = null;
      if (enableNLP) {
        nlpData = processNLPQuery(searchQuery);
        setNlpAnalysis(nlpData);
      }

      // Get search results (now async)
      const { results: searchResults, searchResult } = await searchProducts(searchQuery, nlpData || undefined);
      setResults(searchResults);

      // Generate suggestions using the search result data
      const searchSuggestions = await generateSuggestions(searchQuery, searchResult);
      setSuggestions(searchSuggestions);

      // Track the search
      trackSearchQuery(searchQuery);

      // Update search history
      if (searchQuery.trim().length > 2) {
        const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
        setSearchHistory(newHistory);
        if (typeof window !== 'undefined') {
          localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        }
      }

    } catch (error) {
      console.error('Search error:', error);
      // Set error state for results
      setResults([{
        id: 'error',
        type: 'category',
        title: 'Search Error',
        description: 'Unable to perform search. Please try again.',
        relevanceScore: 0,
        context: 'Error'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [enableNLP, processNLPQuery, searchProducts, generateSuggestions, trackSearchQuery, searchHistory]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        handleSearch(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, handleSearch]);

  // Handle query change
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    onQueryChange?.(newQuery);
    
    if (!newQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      setNlpAnalysis(null);
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    setIsExpanded(false);
    onResultSelect?.(result);
    
    if (result.type === 'product') {
      trackProductInteraction(result.id, 'click');
    }
  };

  // Voice search
  const startVoiceSearch = () => {
    if (recognition.current && !isListening) {
      recognition.current.start();
    }
  };

  // Visual search (placeholder)
  const startVisualSearch = () => {
    // This would typically open camera or file picker
    console.log('Visual search activated');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`relative bg-white rounded-2xl border-2 transition-all duration-300 ${
        isExpanded ? 'border-[#006FEE] shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex items-center p-4">
          <Search size={20} className="text-gray-400 mr-3" />
          
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder={placeholder}
            className="flex-1 text-gray-900 placeholder-gray-500 focus:outline-none text-lg"
          />

          {/* AI Processing Indicator */}
          {enableNLP && nlpAnalysis && (
            <div className="flex items-center gap-2 mr-3">
              <Brain size={16} className="text-[#006FEE]" />
              <span className="text-xs text-[#006FEE] font-medium">AI</span>
            </div>
          )}

          {/* Voice Search */}
          {enableVoiceSearch && (
            <button
              onClick={startVoiceSearch}
              disabled={isListening}
              className={`p-2 rounded-lg transition-colors mr-2 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-gray-400 hover:text-[#006FEE] hover:bg-blue-50'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          {/* Visual Search */}
          {enableVisualSearch && (
            <button
              onClick={startVisualSearch}
              className="p-2 text-gray-400 hover:text-[#006FEE] hover:bg-blue-50 rounded-lg transition-colors mr-2"
            >
              <Camera size={18} />
            </button>
          )}

          {/* Advanced Filters Toggle */}
          {showAdvancedFilters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-[#006FEE] text-white' : 'text-gray-400 hover:text-[#006FEE] hover:bg-blue-50'
              }`}
            >
              <Filter size={18} />
            </button>
          )}

          {/* Clear Search */}
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* NLP Analysis Display */}
        {enableNLP && nlpAnalysis && isExpanded && (
          <div className="px-4 pb-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Intent:</span>
                <span className="font-medium text-[#006FEE] capitalize">{nlpAnalysis.intent.replace('_', ' ')}</span>
              </div>
              {nlpAnalysis.entities.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Found:</span>
                  <div className="flex gap-1">
                    {nlpAnalysis.entities.slice(0, 3).map((entity, index) => (
                      <span key={index} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                        {entity.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50">
          <h4 className="font-semibold text-gray-900 mb-3">Advanced Filters</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <input
                type="range"
                min="0"
                max="500"
                value={filters.priceRange[1]}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [0, parseInt(e.target.value)] }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
              <select
                value={filters.capacity}
                onChange={(e) => setFilters(prev => ({ ...prev, capacity: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006FEE]"
              >
                <option value="all">All Capacities</option>
                <option value="6Ah">6Ah</option>
                <option value="9Ah">9Ah</option>
                <option value="15Ah">15Ah</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isExpanded && (query || searchHistory.length > 0) && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 flex items-center justify-center">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-[#006FEE] border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">Suggestions</div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleQueryChange(suggestion.text)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {suggestion.type === 'query' && <Search size={14} className="text-gray-400" />}
                    {suggestion.type === 'product' && <Sparkles size={14} className="text-[#006FEE]" />}
                    {suggestion.type === 'intent' && <Brain size={14} className="text-purple-500" />}
                    {suggestion.type === 'correction' && <Zap size={14} className="text-orange-500" />}
                    <span className="text-gray-900">{suggestion.text}</span>
                  </div>
                  {suggestion.context && (
                    <span className="text-xs text-gray-400">{suggestion.context}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {!isLoading && results.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">Results</div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      {result.type === 'product' && <Award size={16} className="text-[#006FEE]" />}
                      {result.type === 'category' && <Filter size={16} className="text-green-500" />}
                      {result.type === 'feature' && <Brain size={16} className="text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-[#006FEE] rounded-full opacity-60" />
                          <span className="text-xs text-gray-500">{Math.round(result.relevanceScore)}% match</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{result.description}</p>
                      {result.context && (
                        <p className="text-xs text-[#006FEE] mt-1">{result.context}</p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {!isLoading && !query && searchHistory.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">Recent Searches</div>
              {searchHistory.slice(0, 5).map((historyItem, index) => (
                <button
                  key={index}
                  onClick={() => handleQueryChange(historyItem)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <History size={14} className="text-gray-400" />
                  <span className="text-gray-700">{historyItem}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query && results.length === 0 && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <Search size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No results found for "{query}"</p>
              <p className="text-sm text-gray-400">Try a different search term or check our product categories</p>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}