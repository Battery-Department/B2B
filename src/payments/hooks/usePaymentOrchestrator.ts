import { useState, useCallback, useRef } from 'react';
import { PaymentRequest, PaymentResult, PaymentContext } from '@/types/payments';
import { PaymentOrchestrator } from '../advanced/PaymentOrchestrator';
import { MultiProcessorManager } from '../advanced/MultiProcessorManager';

interface UsePaymentOrchestratorReturn {
  processPayment: (request: PaymentRequest, context?: Partial<PaymentContext>) => Promise<PaymentResult>;
  isLoading: boolean;
  error: string | null;
  lastResult: PaymentResult | null;
  resetState: () => void;
  getProcessorHealth: () => Promise<Record<string, any>>;
  getAnalytics: () => Promise<any>;
}

interface PaymentOrchestratorConfig {
  enableFraudDetection?: boolean;
  enableAnalytics?: boolean;
  performanceTargets?: {
    maxProcessingTime: number;
    maxFraudDetectionTime: number;
    maxPreProcessingTime: number;
  };
}

export const usePaymentOrchestrator = (
  config: PaymentOrchestratorConfig = {}
): UsePaymentOrchestratorReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PaymentResult | null>(null);
  
  // Use refs to persist orchestrator instances across re-renders
  const orchestratorRef = useRef<PaymentOrchestrator | null>(null);
  const processorManagerRef = useRef<MultiProcessorManager | null>(null);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize the payment system
  const initializePaymentSystem = useCallback(async (): Promise<void> => {
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    initializationPromiseRef.current = (async () => {
      try {
        console.log('[usePaymentOrchestrator] Initializing payment system...');

        // Initialize MultiProcessorManager with mock configuration
        const processorConfig = {
          stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key',
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_secret',
            apiVersion: '2023-10-16'
          },
          paypal: {
            clientId: process.env.PAYPAL_CLIENT_ID || 'mock_paypal_client_id',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'mock_paypal_secret',
            environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
            webhookId: process.env.PAYPAL_WEBHOOK_ID || 'mock_webhook_id'
          },
          square: {
            accessToken: process.env.SQUARE_ACCESS_TOKEN || 'mock_square_token',
            applicationId: process.env.SQUARE_APPLICATION_ID || 'mock_app_id',
            environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
            webhookSignatureKey: process.env.SQUARE_WEBHOOK_KEY || 'mock_webhook_key'
          },
          adyen: {
            apiKey: process.env.ADYEN_API_KEY || 'mock_adyen_key',
            merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT || 'mock_merchant',
            environment: (process.env.NODE_ENV === 'production' ? 'live' : 'test') as 'test' | 'live',
            hmacKey: process.env.ADYEN_HMAC_KEY || 'mock_hmac_key'
          }
        };

        const globalConfig = {
          healthCheckIntervalMs: 30000,
          timeoutMs: 8000,
          retryAttempts: 3,
          loadBalancingStrategy: 'performance_based' as const
        };

        processorManagerRef.current = new MultiProcessorManager(processorConfig, globalConfig);
        await processorManagerRef.current.initialize();

        // Initialize PaymentOrchestrator
        const orchestratorConfig = {
          primaryProcessor: await processorManagerRef.current.getOptimalProcessor({
            amount: { value: 100, currency: 'USD' },
            paymentMethod: { type: 'card' as const }
          } as PaymentRequest),
          fallbackProcessors: processorManagerRef.current.getAvailableProcessors()
            .slice(1, 4)
            .map(p => ({
              id: p.id,
              name: p.name,
              processPayment: async () => ({ status: 'SUCCESS' as const, timestamp: new Date() }),
              supportedPaymentMethods: p.supportedMethods,
              supportedCurrencies: p.supportedCurrencies,
              supportedRegions: p.supportedRegions,
              capabilities: p.capabilities,
              timeoutMs: 8000
            })),
          fraudDetectionLevel: 'high' as const,
          routingRules: [],
          complianceRequirements: [],
          performanceTargets: {
            maxProcessingTime: config.performanceTargets?.maxProcessingTime || 2000,
            maxFraudDetectionTime: config.performanceTargets?.maxFraudDetectionTime || 200,
            maxPreProcessingTime: config.performanceTargets?.maxPreProcessingTime || 100,
            ...config.performanceTargets
          }
        };

        orchestratorRef.current = new PaymentOrchestrator(orchestratorConfig);

        console.log('[usePaymentOrchestrator] Payment system initialized successfully');
      } catch (error) {
        console.error('[usePaymentOrchestrator] Failed to initialize payment system:', error);
        throw error;
      }
    })();

    return initializationPromiseRef.current;
  }, [config]);

  // Process payment with full orchestration
  const processPayment = useCallback(async (
    request: PaymentRequest,
    contextOverrides: Partial<PaymentContext> = {}
  ): Promise<PaymentResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure payment system is initialized
      await initializePaymentSystem();

      if (!orchestratorRef.current) {
        throw new Error('Payment orchestrator not initialized');
      }

      // Build payment context
      const context: PaymentContext = {
        customer: request.customer || { id: 'anonymous', email: 'customer@example.com' },
        geolocation: {
          country: 'US',
          region: 'California',
          city: 'San Francisco',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...contextOverrides.geolocation
        },
        paymentMethod: request.paymentMethod,
        metadata: {
          ipAddress: '192.168.1.1', // Would be real IP in production
          deviceId: generateDeviceId(),
          userAgent: navigator.userAgent,
          sessionId: request.metadata?.sessionId || generateSessionId(),
          browserInfo: {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            plugins: Array.from(navigator.plugins).map(p => p.name),
            webgl: getWebGLInfo(),
            canvas: getCanvasFingerprint()
          },
          deviceTrust: 0.8, // Mock device trust score
          ...request.metadata,
          ...contextOverrides.metadata
        },
        ...contextOverrides
      };

      console.log('[usePaymentOrchestrator] Processing payment request:', {
        amount: request.amount,
        paymentMethod: request.paymentMethod.type,
        customerId: context.customer.id
      });

      // Process payment through orchestrator
      const result = await orchestratorRef.current.processPayment(request, context);

      setLastResult(result);

      if (result.status === 'FAILED') {
        setError(result.errorMessage || 'Payment failed');
      }

      console.log('[usePaymentOrchestrator] Payment processing completed:', {
        status: result.status,
        processingTime: result.processingTime,
        transactionId: result.transactionId
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      console.error('[usePaymentOrchestrator] Payment processing error:', err);

      const failureResult: PaymentResult = {
        status: 'FAILED',
        errorMessage,
        timestamp: new Date(),
        processingTime: 0
      };

      setLastResult(failureResult);
      return failureResult;

    } finally {
      setIsLoading(false);
    }
  }, [initializePaymentSystem]);

  // Get processor health status
  const getProcessorHealth = useCallback(async (): Promise<Record<string, any>> => {
    try {
      await initializePaymentSystem();
      
      if (!processorManagerRef.current) {
        throw new Error('Processor manager not initialized');
      }

      return processorManagerRef.current.getProcessorHealth();
    } catch (error) {
      console.error('[usePaymentOrchestrator] Failed to get processor health:', error);
      return {};
    }
  }, [initializePaymentSystem]);

  // Get analytics summary
  const getAnalytics = useCallback(async (): Promise<any> => {
    try {
      await initializePaymentSystem();
      
      if (!orchestratorRef.current) {
        throw new Error('Payment orchestrator not initialized');
      }

      return orchestratorRef.current.getAnalyticsSummary();
    } catch (error) {
      console.error('[usePaymentOrchestrator] Failed to get analytics:', error);
      return null;
    }
  }, [initializePaymentSystem]);

  // Reset hook state
  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setLastResult(null);
  }, []);

  return {
    processPayment,
    isLoading,
    error,
    lastResult,
    resetState,
    getProcessorHealth,
    getAnalytics
  };
};

// Utility functions for device fingerprinting and session management

function generateDeviceId(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `device_${Math.abs(hash).toString(36)}`;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getWebGLInfo(): string {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return 'not_supported';
  
  try {
    const vendor = gl.getParameter(gl.VENDOR);
    const renderer = gl.getParameter(gl.RENDERER);
    return `${vendor}_${renderer}`.replace(/\s+/g, '_');
  } catch {
    return 'webgl_error';
  }
}

function getCanvasFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return 'no_canvas';
  
  try {
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Canvas fingerprint 🔒💳', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas fingerprint 🔒💳', 4, 17);
    
    return canvas.toDataURL().slice(-20); // Last 20 chars as fingerprint
  } catch {
    return 'canvas_error';
  }
}

// Performance monitoring for the hook
export const usePaymentPerformance = () => {
  const [metrics, setMetrics] = useState({
    averageProcessingTime: 0,
    successRate: 0,
    lastProcessingTime: 0,
    totalTransactions: 0,
    successfulTransactions: 0
  });

  const recordTransaction = useCallback((result: PaymentResult) => {
    setMetrics(prev => {
      const newTotal = prev.totalTransactions + 1;
      const newSuccessful = prev.successfulTransactions + (result.status === 'SUCCESS' ? 1 : 0);
      const newAverageTime = (prev.averageProcessingTime * prev.totalTransactions + (result.processingTime || 0)) / newTotal;

      return {
        averageProcessingTime: newAverageTime,
        successRate: newSuccessful / newTotal,
        lastProcessingTime: result.processingTime || 0,
        totalTransactions: newTotal,
        successfulTransactions: newSuccessful
      };
    });
  }, []);

  return { metrics, recordTransaction };
};