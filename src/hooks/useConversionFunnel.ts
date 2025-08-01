'use client';

import { useState, useEffect, useCallback } from 'react';
import { conversionFunnelAnalyzer } from '@/services/analytics/ConversionFunnelAnalyzer';

interface FunnelMetrics {
  stepId: string;
  stepName: string;
  totalEntries: number;
  completions: number;
  dropoffs: number;
  conversionRate: number;
  averageTimeToComplete: number;
  averageTimeOnStep: number;
  revenue?: number;
  topDropoffReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

interface FunnelAnalysis {
  funnelId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  totalSessions: number;
  overallConversionRate: number;
  stepMetrics: FunnelMetrics[];
  bottlenecks: Array<{
    stepId: string;
    severity: 'low' | 'medium' | 'high';
    impact: number;
    recommendations: string[];
  }>;
  cohortAnalysis: {
    [cohort: string]: {
      conversionRate: number;
      averageRevenue: number;
      completionTime: number;
    };
  };
  segmentPerformance: {
    [segment: string]: FunnelMetrics[];
  };
}

interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  targetMetric: string;
  variants: Array<{
    id: string;
    name: string;
    description: string;
    trafficAllocation: number;
  }>;
}

interface ABTestResult {
  testId: string;
  status: 'running' | 'completed' | 'inconclusive';
  participants: number;
  variants: Array<{
    id: string;
    name: string;
    participants: number;
    conversionRate: number;
    isWinner?: boolean;
    lift?: number;
    pValue?: number;
  }>;
  statistics: {
    hasWinner: boolean;
    winningVariant?: string;
  };
  insights: string[];
  recommendations: string[];
}

export function useConversionFunnel(
  funnelId: string = 'ecommerce',
  timeRange: { start: Date; end: Date } = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  }
) {
  const [analysis, setAnalysis] = useState<FunnelAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run funnel analysis
  const runAnalysis = useCallback(async (segmentBy?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await conversionFunnelAnalyzer.analyzeFunnel(funnelId, timeRange, segmentBy);
      setAnalysis(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze funnel');
      console.error('Funnel analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [funnelId, timeRange]);

  // Update time range
  const updateTimeRange = useCallback((newTimeRange: { start: Date; end: Date }) => {
    // This would trigger a re-analysis with the new time range
    runAnalysis();
  }, [runAnalysis]);

  // Get conversion rate for specific step
  const getStepConversionRate = useCallback((stepId: string): number => {
    if (!analysis) return 0;
    const step = analysis.stepMetrics.find(s => s.stepId === stepId);
    return step?.conversionRate || 0;
  }, [analysis]);

  // Get bottlenecks by severity
  const getBottlenecksBySeverity = useCallback((severity: 'low' | 'medium' | 'high') => {
    if (!analysis) return [];
    return analysis.bottlenecks.filter(b => b.severity === severity);
  }, [analysis]);

  // Get total revenue
  const getTotalRevenue = useCallback((): number => {
    if (!analysis) return 0;
    return analysis.stepMetrics
      .filter(step => step.revenue !== undefined)
      .reduce((sum, step) => sum + (step.revenue || 0), 0);
  }, [analysis]);

  // Calculate funnel efficiency
  const getFunnelEfficiency = useCallback((): {
    efficiency: number;
    improvementPotential: number;
    biggestDropoff: string | null;
  } => {
    if (!analysis || analysis.stepMetrics.length === 0) {
      return { efficiency: 0, improvementPotential: 0, biggestDropoff: null };
    }

    // Calculate overall efficiency as geometric mean of step conversion rates
    const stepRates = analysis.stepMetrics.map(step => step.conversionRate);
    const efficiency = Math.pow(stepRates.reduce((product, rate) => product * rate, 1), 1 / stepRates.length);

    // Find biggest dropoff
    const dropoffs = analysis.stepMetrics.map(step => ({
      stepId: step.stepId,
      dropoffRate: 1 - step.conversionRate
    }));
    const biggestDropoff = dropoffs.reduce((max, current) => 
      current.dropoffRate > max.dropoffRate ? current : max
    );

    // Calculate improvement potential if biggest dropoff was fixed
    const improvementPotential = biggestDropoff.dropoffRate * 50; // Assume 50% improvement possible

    return {
      efficiency: efficiency * 100,
      improvementPotential,
      biggestDropoff: biggestDropoff.stepId
    };
  }, [analysis]);

  // Run analysis on mount
  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  return {
    // Data
    analysis,
    isLoading,
    error,

    // Actions
    runAnalysis,
    updateTimeRange,

    // Utilities
    getStepConversionRate,
    getBottlenecksBySeverity,
    getTotalRevenue,
    getFunnelEfficiency
  };
}

// Hook for A/B testing
export function useABTesting() {
  const [abTests, setAbTests] = useState<ABTestConfig[]>([]);
  const [testResults, setTestResults] = useState<Map<string, ABTestResult>>(new Map());
  const [userTests, setUserTests] = useState<Array<{ testId: string; variant: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all A/B tests
  const loadABTests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tests = conversionFunnelAnalyzer.getAllABTests();
      setAbTests(tests);

      // Load results for each test
      const results = new Map<string, ABTestResult>();
      for (const test of tests) {
        const result = await conversionFunnelAnalyzer.getABTestResults(test.id);
        if (result) {
          results.set(test.id, result);
        }
      }
      setTestResults(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load A/B tests');
      console.error('A/B test loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new A/B test
  const createABTest = useCallback(async (config: Omit<ABTestConfig, 'id' | 'status'>) => {
    try {
      const testId = await conversionFunnelAnalyzer.createABTest({
        ...config,
        id: '',
        status: 'draft'
      });
      
      await loadABTests(); // Refresh list
      return testId;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create A/B test');
      throw err;
    }
  }, [loadABTests]);

  // Start A/B test
  const startABTest = useCallback(async (testId: string) => {
    try {
      await conversionFunnelAnalyzer.startABTest(testId);
      await loadABTests(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start A/B test');
      throw err;
    }
  }, [loadABTests]);

  // Stop A/B test
  const stopABTest = useCallback(async (testId: string) => {
    try {
      await conversionFunnelAnalyzer.stopABTest(testId);
      await loadABTests(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop A/B test');
      throw err;
    }
  }, [loadABTests]);

  // Get user's active tests
  const getUserActiveTests = useCallback((userId: string) => {
    const activeTests = conversionFunnelAnalyzer.getActiveTests(userId);
    setUserTests(activeTests);
    return activeTests;
  }, []);

  // Track A/B test event
  const trackABTestEvent = useCallback(async (
    userId: string,
    testId: string,
    eventType: string,
    value?: number
  ) => {
    try {
      await conversionFunnelAnalyzer.trackABTestEvent(userId, testId, eventType, value);
    } catch (err) {
      console.error('Failed to track A/B test event:', err);
    }
  }, []);

  // Get test result by ID
  const getTestResult = useCallback((testId: string): ABTestResult | undefined => {
    return testResults.get(testId);
  }, [testResults]);

  // Get running tests
  const getRunningTests = useCallback((): ABTestConfig[] => {
    return abTests.filter(test => test.status === 'running');
  }, [abTests]);

  // Get completed tests
  const getCompletedTests = useCallback((): ABTestConfig[] => {
    return abTests.filter(test => test.status === 'completed');
  }, [abTests]);

  // Calculate test performance metrics
  const getTestPerformanceMetrics = useCallback(() => {
    const totalTests = abTests.length;
    const runningTests = getRunningTests().length;
    const completedTests = getCompletedTests().length;
    
    const completedResults = Array.from(testResults.values())
      .filter(result => result.status === 'completed');
    
    const testsWithWinner = completedResults.filter(result => result.statistics.hasWinner).length;
    const successRate = completedResults.length > 0 ? (testsWithWinner / completedResults.length) * 100 : 0;
    
    const averageLift = completedResults
      .flatMap(result => result.variants.filter(v => v.lift))
      .reduce((sum, v, _, arr) => sum + (v.lift || 0) / arr.length, 0);

    return {
      totalTests,
      runningTests,
      completedTests,
      successRate,
      averageLift,
      testsWithWinner
    };
  }, [abTests, testResults, getRunningTests, getCompletedTests]);

  // Load data on mount
  useEffect(() => {
    loadABTests();
  }, [loadABTests]);

  return {
    // Data
    abTests,
    testResults,
    userTests,
    isLoading,
    error,

    // Actions
    createABTest,
    startABTest,
    stopABTest,
    trackABTestEvent,
    loadABTests,

    // Utilities
    getUserActiveTests,
    getTestResult,
    getRunningTests,
    getCompletedTests,
    getTestPerformanceMetrics
  };
}

// Hook for funnel optimization recommendations
export function useFunnelOptimization(funnelId: string = 'ecommerce') {
  const [recommendations, setRecommendations] = useState<Array<{
    priority: 'high' | 'medium' | 'low';
    type: 'ui_change' | 'content' | 'process' | 'ab_test';
    title: string;
    description: string;
    expectedImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
    suggestedABTest?: any;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recommendations
  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const recs = await conversionFunnelAnalyzer.getFunnelOptimizationRecommendations(funnelId);
      setRecommendations(recs);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      console.error('Recommendations loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [funnelId]);

  // Get recommendations by priority
  const getRecommendationsByPriority = useCallback((priority: 'high' | 'medium' | 'low') => {
    return recommendations.filter(rec => rec.priority === priority);
  }, [recommendations]);

  // Get recommendations by type
  const getRecommendationsByType = useCallback((type: string) => {
    return recommendations.filter(rec => rec.type === type);
  }, [recommendations]);

  // Calculate implementation score
  const getImplementationScore = useCallback(() => {
    const effortScores = { low: 1, medium: 2, high: 3 };
    const priorityScores = { high: 3, medium: 2, low: 1 };
    
    const scores = recommendations.map(rec => {
      const priorityScore = priorityScores[rec.priority];
      const effortScore = effortScores[rec.implementationEffort];
      return priorityScore / effortScore; // Higher priority, lower effort = higher score
    });
    
    return scores.sort((a, b) => b - a);
  }, [recommendations]);

  // Load on mount
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    // Data
    recommendations,
    isLoading,
    error,

    // Actions
    loadRecommendations,

    // Utilities
    getRecommendationsByPriority,
    getRecommendationsByType,
    getImplementationScore
  };
}