'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSmartRecommendations } from './useSmartRecommendations';

interface PersonalizationContext {
  userId?: string;
  sessionId: string;
  currentPage: string;
  userSegment?: 'residential' | 'commercial' | 'industrial';
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  location?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface UserBehavior {
  timeOnPage: number;
  scrollDepth: number;
  clickPatterns: Array<{
    element: string;
    timestamp: number;
    coordinates: { x: number; y: number };
  }>;
  searchQueries: string[];
  productInteractions: Array<{
    productId: string;
    action: 'view' | 'hover' | 'click' | 'add_to_cart';
    timestamp: number;
    duration?: number;
  }>;
}

interface PersonalizedContent {
  heroMessage: string;
  productSorting: 'price' | 'popularity' | 'relevance' | 'newest';
  promotions: Array<{
    id: string;
    message: string;
    type: 'discount' | 'feature' | 'urgency';
    priority: number;
  }>;
  uiVariant: 'default' | 'professional' | 'budget' | 'premium';
  colorScheme: 'blue' | 'green' | 'orange' | 'purple';
}

interface BehavioralTrigger {
  id: string;
  condition: (behavior: UserBehavior, context: PersonalizationContext) => boolean;
  action: {
    type: 'modal' | 'banner' | 'highlight' | 'recommendation';
    content: any;
    priority: number;
    delay?: number;
  };
  cooldown: number; // Minutes before trigger can fire again
  lastTriggered?: number;
}

export function useRealTimePersonalization(initialContext: Partial<PersonalizationContext> = {}) {
  const [context, setContext] = useState<PersonalizationContext>({
    sessionId: `session_${Date.now()}`,
    currentPage: '/',
    deviceType: 'desktop',
    timeOfDay: 'afternoon',
    ...initialContext
  });

  const [behavior, setBehavior] = useState<UserBehavior>({
    timeOnPage: 0,
    scrollDepth: 0,
    clickPatterns: [],
    searchQueries: [],
    productInteractions: []
  });

  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent>({
    heroMessage: 'Professional FlexVolt Batteries for Your Projects',
    productSorting: 'relevance',
    promotions: [],
    uiVariant: 'default',
    colorScheme: 'blue'
  });

  const [activeTriggers, setActiveTriggers] = useState<string[]>([]);
  const [isPersonalizationEnabled, setIsPersonalizationEnabled] = useState(true);

  const timeOnPageRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { trackAction, trackProductView, trackSearch } = useSmartRecommendations({
    userId: context.userId,
    enableRealTimeUpdates: true
  });

  // Behavioral triggers configuration
  const triggers: BehavioralTrigger[] = [
    {
      id: 'exit_intent',
      condition: (behavior) => behavior.scrollDepth < 30 && behavior.timeOnPage > 10,
      action: {
        type: 'modal',
        content: {
          title: 'Wait! Don\'t miss out',
          message: 'Get 10% off your first battery order',
          cta: 'Get Discount'
        },
        priority: 100
      },
      cooldown: 1440 // 24 hours
    },
    {
      id: 'deep_engagement',
      condition: (behavior) => behavior.scrollDepth > 80 && behavior.timeOnPage > 30,
      action: {
        type: 'recommendation',
        content: {
          title: 'Based on your interest',
          type: 'personalized'
        },
        priority: 80
      },
      cooldown: 30 // 30 minutes
    },
    {
      id: 'price_sensitive',
      condition: (behavior) => behavior.searchQueries.some(q => 
        q.toLowerCase().includes('cheap') || 
        q.toLowerCase().includes('budget') || 
        q.toLowerCase().includes('affordable')
      ),
      action: {
        type: 'banner',
        content: {
          message: 'Great value: 6Ah batteries starting at $95',
          type: 'discount'
        },
        priority: 90
      },
      cooldown: 60 // 1 hour
    },
    {
      id: 'professional_focus',
      condition: (behavior, context) => 
        context.userSegment === 'commercial' && 
        behavior.productInteractions.filter(i => i.productId === '9Ah').length > 2,
      action: {
        type: 'highlight',
        content: {
          productId: '9Ah',
          message: 'Most popular with professional contractors'
        },
        priority: 70
      },
      cooldown: 120 // 2 hours
    },
    {
      id: 'cart_abandonment',
      condition: (behavior) => behavior.productInteractions.some(i => i.action === 'add_to_cart') && 
                               behavior.timeOnPage > 180, // 3 minutes after adding to cart
      action: {
        type: 'modal',
        content: {
          title: 'Complete your order',
          message: 'Your batteries are waiting! Free shipping on orders over $1,000',
          cta: 'Complete Order'
        },
        priority: 95
      },
      cooldown: 60 // 1 hour
    }
  ];

  // Update time on page
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      timeOnPageRef.current += 1;
      setBehavior(prev => ({ ...prev, timeOnPage: timeOnPageRef.current }));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Determine user segment based on behavior
  const determineUserSegment = useCallback((behavior: UserBehavior): PersonalizationContext['userSegment'] => {
    const commercialIndicators = [
      behavior.productInteractions.filter(i => i.productId === '9Ah').length > 2,
      behavior.searchQueries.some(q => q.includes('commercial') || q.includes('contractor')),
      behavior.timeOnPage > 120 // Extended engagement
    ].filter(Boolean).length;

    const industrialIndicators = [
      behavior.productInteractions.filter(i => i.productId === '15Ah').length > 1,
      behavior.searchQueries.some(q => q.includes('industrial') || q.includes('heavy')),
    ].filter(Boolean).length;

    if (industrialIndicators >= 1) return 'industrial';
    if (commercialIndicators >= 2) return 'commercial';
    return 'residential';
  }, []);

  // Generate personalized content based on context and behavior
  const generatePersonalizedContent = useCallback((
    context: PersonalizationContext, 
    behavior: UserBehavior
  ): PersonalizedContent => {
    const segment = context.userSegment || determineUserSegment(behavior);
    
    let heroMessage = 'Professional FlexVolt Batteries for Your Projects';
    let productSorting: PersonalizedContent['productSorting'] = 'relevance';
    let uiVariant: PersonalizedContent['uiVariant'] = 'default';
    let colorScheme: PersonalizedContent['colorScheme'] = 'blue';

    // Segment-based personalization
    switch (segment) {
      case 'industrial':
        heroMessage = 'Heavy-Duty Power Solutions for Industrial Applications';
        productSorting = 'power';
        uiVariant = 'professional';
        colorScheme = 'orange';
        break;
      case 'commercial':
        heroMessage = 'Trusted by Professional Contractors Nationwide';
        productSorting = 'popularity';
        uiVariant = 'professional';
        colorScheme = 'blue';
        break;
      case 'residential':
        heroMessage = 'Perfect Batteries for Your Home Projects';
        productSorting = 'price';
        uiVariant = 'default';
        colorScheme = 'green';
        break;
    }

    // Behavior-based adjustments
    const isPriceSensitive = behavior.searchQueries.some(q => 
      q.toLowerCase().includes('cheap') || 
      q.toLowerCase().includes('budget') || 
      q.toLowerCase().includes('price')
    );

    if (isPriceSensitive) {
      productSorting = 'price';
      uiVariant = 'budget';
    }

    // Time-based personalization
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      heroMessage = `Good morning! ${heroMessage}`;
    } else if (currentHour < 17) {
      heroMessage = `${heroMessage} - Available Now`;
    } else {
      heroMessage = `${heroMessage} - Order Today`;
    }

    // Generate contextual promotions
    const promotions = [];
    
    if (segment === 'commercial' && behavior.timeOnPage > 60) {
      promotions.push({
        id: 'commercial_bulk',
        message: 'Bulk pricing available for 10+ batteries',
        type: 'feature' as const,
        priority: 80
      });
    }

    if (isPriceSensitive) {
      promotions.push({
        id: 'budget_friendly',
        message: '6Ah batteries starting at just $95',
        type: 'discount' as const,
        priority: 90
      });
    }

    if (behavior.productInteractions.length > 3) {
      promotions.push({
        id: 'engaged_user',
        message: 'Free shipping on your next order',
        type: 'feature' as const,
        priority: 70
      });
    }

    return {
      heroMessage,
      productSorting,
      promotions,
      uiVariant,
      colorScheme
    };
  }, [determineUserSegment]);

  // Check and trigger behavioral responses
  const checkTriggers = useCallback(() => {
    if (!isPersonalizationEnabled) return;

    const now = Date.now();
    
    for (const trigger of triggers) {
      // Check cooldown
      if (trigger.lastTriggered && (now - trigger.lastTriggered) < trigger.cooldown * 60 * 1000) {
        continue;
      }

      // Check if already active
      if (activeTriggers.includes(trigger.id)) {
        continue;
      }

      // Check condition
      if (trigger.condition(behavior, context)) {
        // Trigger action
        setActiveTriggers(prev => [...prev, trigger.id]);
        trigger.lastTriggered = now;

        // Handle different trigger types
        switch (trigger.action.type) {
          case 'modal':
            // This would typically show a modal component
            console.log('Trigger modal:', trigger.action.content);
            break;
          case 'banner':
            // This would show a banner notification
            console.log('Trigger banner:', trigger.action.content);
            break;
          case 'highlight':
            // This would highlight specific elements
            console.log('Trigger highlight:', trigger.action.content);
            break;
          case 'recommendation':
            // This would show personalized recommendations
            console.log('Trigger recommendations:', trigger.action.content);
            break;
        }

        // Track the trigger event
        trackAction({
          type: 'view',
          metadata: {
            triggerType: trigger.action.type,
            triggerId: trigger.id,
            priority: trigger.action.priority
          }
        });
      }
    }
  }, [behavior, context, activeTriggers, isPersonalizationEnabled, trackAction]);

  // Track user interactions
  const trackClick = useCallback((element: string, coordinates: { x: number; y: number }) => {
    const clickData = {
      element,
      timestamp: Date.now(),
      coordinates
    };

    setBehavior(prev => ({
      ...prev,
      clickPatterns: [...prev.clickPatterns.slice(-20), clickData] // Keep last 20 clicks
    }));

    trackAction({
      type: 'click',
      metadata: { element, coordinates }
    });
  }, [trackAction]);

  const trackScroll = useCallback((scrollPercentage: number) => {
    setBehavior(prev => ({
      ...prev,
      scrollDepth: Math.max(prev.scrollDepth, scrollPercentage)
    }));
  }, []);

  const trackProductInteraction = useCallback((
    productId: string, 
    action: 'view' | 'hover' | 'click' | 'add_to_cart',
    duration?: number
  ) => {
    const interaction = {
      productId,
      action,
      timestamp: Date.now(),
      duration
    };

    setBehavior(prev => ({
      ...prev,
      productInteractions: [...prev.productInteractions.slice(-50), interaction] // Keep last 50 interactions
    }));

    // Track with recommendation engine
    if (action === 'view') {
      trackProductView(productId, duration);
    } else {
      trackAction({
        type: action === 'add_to_cart' ? 'add_to_cart' : 'click',
        productId,
        duration
      });
    }
  }, [trackProductView, trackAction]);

  const trackSearchQuery = useCallback((query: string) => {
    setBehavior(prev => ({
      ...prev,
      searchQueries: [...prev.searchQueries.slice(-10), query] // Keep last 10 searches
    }));

    trackSearch(query);
  }, [trackSearch]);

  // Update context
  const updateContext = useCallback((updates: Partial<PersonalizationContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  // Update personalized content when behavior or context changes
  useEffect(() => {
    const content = generatePersonalizedContent(context, behavior);
    setPersonalizedContent(content);
  }, [context, behavior, generatePersonalizedContent]);

  // Check triggers periodically
  useEffect(() => {
    const triggerInterval = setInterval(checkTriggers, 5000); // Check every 5 seconds
    return () => clearInterval(triggerInterval);
  }, [checkTriggers]);

  // Update user segment based on behavior
  useEffect(() => {
    const detectedSegment = determineUserSegment(behavior);
    if (detectedSegment !== context.userSegment) {
      updateContext({ userSegment: detectedSegment });
    }
  }, [behavior, context.userSegment, determineUserSegment, updateContext]);

  // Dismiss trigger
  const dismissTrigger = useCallback((triggerId: string) => {
    setActiveTriggers(prev => prev.filter(id => id !== triggerId));
  }, []);

  // Reset personalization
  const resetPersonalization = useCallback(() => {
    setBehavior({
      timeOnPage: 0,
      scrollDepth: 0,
      clickPatterns: [],
      searchQueries: [],
      productInteractions: []
    });
    setActiveTriggers([]);
    timeOnPageRef.current = 0;
  }, []);

  // Get personalization insights
  const getInsights = useCallback(() => {
    const insights = {
      userSegment: context.userSegment || determineUserSegment(behavior),
      engagementLevel: behavior.timeOnPage > 60 ? 'high' : behavior.timeOnPage > 30 ? 'medium' : 'low',
      isPriceSensitive: behavior.searchQueries.some(q => 
        q.toLowerCase().includes('cheap') || 
        q.toLowerCase().includes('budget')
      ),
      preferredProducts: behavior.productInteractions
        .reduce((acc, interaction) => {
          acc[interaction.productId] = (acc[interaction.productId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      conversionLikelihood: behavior.productInteractions.filter(i => i.action === 'add_to_cart').length > 0 ? 'high' :
                            behavior.timeOnPage > 120 ? 'medium' : 'low'
    };

    return insights;
  }, [context, behavior, determineUserSegment]);

  return {
    // State
    context,
    behavior,
    personalizedContent,
    activeTriggers,
    isPersonalizationEnabled,

    // Actions
    trackClick,
    trackScroll,
    trackProductInteraction,
    trackSearchQuery,
    updateContext,
    dismissTrigger,
    resetPersonalization,
    setIsPersonalizationEnabled,

    // Utilities
    getInsights,
    
    // Computed values
    userSegment: context.userSegment || determineUserSegment(behavior),
    engagementScore: Math.min(100, (behavior.timeOnPage / 3) + (behavior.scrollDepth / 2) + (behavior.productInteractions.length * 5)),
    isHighlyEngaged: behavior.timeOnPage > 60 && behavior.scrollDepth > 50,
    isPriceSensitive: behavior.searchQueries.some(q => 
      q.toLowerCase().includes('cheap') || 
      q.toLowerCase().includes('budget') || 
      q.toLowerCase().includes('price')
    )
  };
}

// Hook for A/B testing personalization strategies
export function usePersonalizationABTest(testName: string) {
  const [variant, setVariant] = useState<string>('');
  const [testData, setTestData] = useState<any>({});

  useEffect(() => {
    // Simple A/B test assignment
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'anonymous' : 'anonymous';
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const variants = ['control', 'personalized', 'aggressive'];
    const variantIndex = hash % variants.length;
    setVariant(variants[variantIndex]);

    // Load test data
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(`personalization_test_${testName}`) || '{}';
      setTestData(JSON.parse(savedData));
    }
  }, [testName]);

  const recordEvent = useCallback((event: string, data?: any) => {
    if (typeof window === 'undefined') return;

    const updatedData = {
      ...testData,
      [event]: (testData[event] || 0) + 1,
      lastEventData: data,
      variant
    };

    setTestData(updatedData);
    localStorage.setItem(`personalization_test_${testName}`, JSON.stringify(updatedData));
  }, [testName, variant, testData]);

  return {
    variant,
    recordEvent,
    isPersonalizationEnabled: variant !== 'control'
  };
}