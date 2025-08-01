'use client';

import { useState, useEffect, useCallback } from 'react';
import { recommendationEngine } from '@/services/product-intelligence/RecommendationEngine';

interface UseSmartRecommendationsOptions {
  userId?: string;
  context?: {
    currentProduct?: string;
    category?: string;
    priceRange?: [number, number];
    usageIntensity?: 'light' | 'moderate' | 'heavy';
    projectType?: string;
  };
  maxRecommendations?: number;
  enableRealTimeUpdates?: boolean;
}

interface Recommendation {
  productId: string;
  score: number;
  reason: string;
  type: 'behavioral' | 'collaborative' | 'content' | 'hybrid';
  confidence: number;
  expectedConversion: number;
}

interface UserAction {
  type: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'search' | 'compare';
  productId?: string;
  timestamp: Date;
  duration?: number;
  metadata?: any;
}

export function useSmartRecommendations(options: UseSmartRecommendationsOptions = {}) {
  const {
    userId = 'anonymous',
    context = {},
    maxRecommendations = 5,
    enableRealTimeUpdates = true
  } = options;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [complementaryProducts, setComplementaryProducts] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial recommendations
  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const recs = await recommendationEngine.getPersonalizedRecommendations(userId, context);
      setRecommendations(recs.slice(0, maxRecommendations));

      // Load complementary products if current product is specified
      if (context.currentProduct) {
        const userProfile = {
          id: userId,
          segment: 'commercial' as const,
          purchaseHistory: [],
          behaviorScore: 75,
          preferences: {
            pricePreference: 'value' as const,
            brandLoyalty: 0.7,
            environmentalConcern: 0.4
          }
        };

        const complements = await recommendationEngine.getComplementaryProducts(
          context.currentProduct,
          userProfile
        );
        setComplementaryProducts(complements);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      console.error('Recommendation loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, context, maxRecommendations]);

  // Track user action and update recommendations
  const trackAction = useCallback(async (action: Omit<UserAction, 'timestamp'>) => {
    try {
      const fullAction: UserAction = {
        ...action,
        timestamp: new Date(),
        metadata: { ...action.metadata, userId }
      };

      await recommendationEngine.updateRecommendations(fullAction);

      // Reload recommendations if real-time updates are enabled
      if (enableRealTimeUpdates) {
        await loadRecommendations();
      }
    } catch (err) {
      console.error('Action tracking error:', err);
    }
  }, [userId, loadRecommendations, enableRealTimeUpdates]);

  // Convenience methods for common actions
  const trackProductView = useCallback((productId: string, duration?: number) => {
    trackAction({ type: 'view', productId, duration });
  }, [trackAction]);

  const trackProductClick = useCallback((productId: string) => {
    trackAction({ type: 'click', productId });
  }, [trackAction]);

  const trackAddToCart = useCallback((productId: string, quantity?: number) => {
    trackAction({ 
      type: 'add_to_cart', 
      productId, 
      metadata: { quantity } 
    });
  }, [trackAction]);

  const trackPurchase = useCallback((productId: string, amount?: number) => {
    trackAction({ 
      type: 'purchase', 
      productId, 
      metadata: { amount } 
    });
  }, [trackAction]);

  const trackSearch = useCallback((query: string, filters?: any) => {
    trackAction({ 
      type: 'search', 
      metadata: { query, filters } 
    });
  }, [trackAction]);

  const trackComparison = useCallback((productIds: string[]) => {
    trackAction({ 
      type: 'compare', 
      metadata: { productIds } 
    });
  }, [trackAction]);

  // Refresh recommendations manually
  const refresh = useCallback(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Get recommendations by type
  const getRecommendationsByType = useCallback((type: Recommendation['type']) => {
    return recommendations.filter(rec => rec.type === type);
  }, [recommendations]);

  // Get high-confidence recommendations
  const getHighConfidenceRecommendations = useCallback((threshold = 0.7) => {
    return recommendations.filter(rec => rec.confidence >= threshold);
  }, [recommendations]);

  // Get recommendations with high conversion probability
  const getHighConversionRecommendations = useCallback((threshold = 0.15) => {
    return recommendations.filter(rec => rec.expectedConversion >= threshold);
  }, [recommendations]);

  // Load recommendations on mount and when dependencies change
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    // Data
    recommendations,
    complementaryProducts,
    isLoading,
    error,

    // Actions
    trackAction,
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackPurchase,
    trackSearch,
    trackComparison,
    refresh,

    // Utilities
    getRecommendationsByType,
    getHighConfidenceRecommendations,
    getHighConversionRecommendations,

    // Stats
    totalRecommendations: recommendations.length,
    averageConfidence: recommendations.length > 0 
      ? recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length 
      : 0,
    averageConversion: recommendations.length > 0 
      ? recommendations.reduce((sum, rec) => sum + rec.expectedConversion, 0) / recommendations.length 
      : 0
  };
}

// Hook for A/B testing recommendations
export function useRecommendationABTest(testId: string, variants: string[]) {
  const [variant, setVariant] = useState<string>('');
  const [testData, setTestData] = useState<any>({});

  useEffect(() => {
    // Simple A/B test assignment based on user ID hash
    const userId = localStorage.getItem('userId') || 'anonymous';
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const variantIndex = hash % variants.length;
    setVariant(variants[variantIndex]);

    // Load test data
    const savedTestData = localStorage.getItem(`ab_test_${testId}`) || '{}';
    setTestData(JSON.parse(savedTestData));
  }, [testId, variants]);

  const recordEvent = useCallback((event: string, data?: any) => {
    const updatedTestData = {
      ...testData,
      [variant]: {
        ...testData[variant],
        [event]: (testData[variant]?.[event] || 0) + 1,
        lastData: data
      }
    };

    setTestData(updatedTestData);
    localStorage.setItem(`ab_test_${testId}`, JSON.stringify(updatedTestData));
  }, [testId, variant, testData]);

  return {
    variant,
    recordEvent,
    testData: testData[variant] || {}
  };
}

// Hook for recommendation performance metrics
export function useRecommendationMetrics() {
  const [metrics, setMetrics] = useState({
    clickThroughRate: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    revenueAttribution: 0
  });

  const updateMetrics = useCallback((event: {
    type: 'impression' | 'click' | 'conversion';
    recommendationId?: string;
    value?: number;
  }) => {
    // Update metrics based on events
    // This would typically connect to analytics service
    console.log('Recommendation metric event:', event);
  }, []);

  return {
    metrics,
    updateMetrics
  };
}