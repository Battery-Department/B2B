export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitorInterval: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new APIError('Service temporarily unavailable', 503, 'CIRCUIT_OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

export class RetryManager {
  async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: 'linear' | 'exponential';
      onRetry?: (attempt: number, error: any) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 'exponential',
      onRetry
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          const waitTime = backoff === 'exponential' 
            ? delay * Math.pow(2, attempt - 1)
            : delay * attempt;
            
          if (onRetry) {
            onRetry(attempt, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError;
  }
}

export interface FallbackConfig {
  primary: () => Promise<any>;
  fallback: () => Promise<any>;
  condition?: (error: any) => boolean;
}

export class FallbackHandler {
  async execute(config: FallbackConfig): Promise<any> {
    try {
      return await config.primary();
    } catch (error) {
      if (!config.condition || config.condition(error)) {
        console.warn('Primary failed, using fallback:', error);
        return await config.fallback();
      }
      throw error;
    }
  }
}

export class HealthChecker {
  private endpoints: Map<string, {
    url: string;
    interval: number;
    lastCheck?: Date;
    status?: 'healthy' | 'unhealthy';
    lastError?: string;
  }> = new Map();

  addEndpoint(name: string, url: string, interval: number = 30000) {
    this.endpoints.set(name, { url, interval });
    this.startChecking(name);
  }

  private async startChecking(name: string) {
    const endpoint = this.endpoints.get(name);
    if (!endpoint) return;

    const check = async () => {
      try {
        const response = await fetch(endpoint.url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        endpoint.status = response.ok ? 'healthy' : 'unhealthy';
        endpoint.lastCheck = new Date();
        
        if (!response.ok) {
          endpoint.lastError = `HTTP ${response.status}`;
        }
      } catch (error) {
        endpoint.status = 'unhealthy';
        endpoint.lastCheck = new Date();
        endpoint.lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    };

    // Initial check
    await check();

    // Schedule periodic checks
    setInterval(check, endpoint.interval);
  }

  getStatus(name?: string) {
    if (name) {
      return this.endpoints.get(name);
    }
    
    const statuses: any = {};
    this.endpoints.forEach((endpoint, name) => {
      statuses[name] = {
        status: endpoint.status,
        lastCheck: endpoint.lastCheck,
        lastError: endpoint.lastError
      };
    });
    
    return statuses;
  }

  isHealthy(name: string): boolean {
    const endpoint = this.endpoints.get(name);
    return endpoint?.status === 'healthy';
  }
}

export class OfflineQueue {
  private queue: any[] = [];
  private processing = false;

  async add(request: {
    url: string;
    method: string;
    body?: any;
    headers?: any;
  }) {
    this.queue.push({
      ...request,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });

    // Store in localStorage for persistence
    localStorage.setItem('offline_queue', JSON.stringify(this.queue));

    // Try to process immediately
    this.process();
  }

  async process() {
    if (this.processing || !navigator.onLine) return;

    this.processing = true;

    while (this.queue.length > 0 && navigator.onLine) {
      const request = this.queue[0];
      
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined
        });

        if (response.ok) {
          this.queue.shift();
          localStorage.setItem('offline_queue', JSON.stringify(this.queue));
        } else {
          // If not successful, stop processing
          break;
        }
      } catch (error) {
        // Network error, stop processing
        break;
      }
    }

    this.processing = false;
  }

  getQueueSize() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    localStorage.removeItem('offline_queue');
  }
}

// Global error handler for unhandled API errors
export function setupGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason instanceof APIError) {
        console.error('Unhandled API Error:', event.reason);
        
        // Show user-friendly error message
        if (event.reason.statusCode === 502 || event.reason.statusCode === 503) {
          showErrorToast('Service temporarily unavailable. Please try again later.');
        } else if (event.reason.statusCode >= 500) {
          showErrorToast('An unexpected error occurred. Please try again.');
        } else if (event.reason.statusCode === 401) {
          showErrorToast('Your session has expired. Please log in again.');
          // Redirect to login
        } else if (event.reason.statusCode === 403) {
          showErrorToast('You do not have permission to perform this action.');
        }
        
        event.preventDefault();
      }
    });

    // Monitor online/offline status
    window.addEventListener('online', () => {
      showSuccessToast('Connection restored');
      // Process offline queue
      const queue = new OfflineQueue();
      queue.process();
    });

    window.addEventListener('offline', () => {
      showWarningToast('You are offline. Changes will be saved when connection is restored.');
    });
  }
}

// Toast notification helpers (implement based on your UI framework)
function showErrorToast(message: string) {
  console.error('Toast:', message);
  // Implement with your toast library
}

function showSuccessToast(message: string) {
  console.log('Toast:', message);
  // Implement with your toast library
}

function showWarningToast(message: string) {
  console.warn('Toast:', message);
  // Implement with your toast library
}

// Enhanced fetch with error handling
export async function enhancedFetch(
  url: string,
  options: RequestInit & {
    retry?: boolean;
    fallbackUrl?: string;
    timeout?: number;
  } = {}
): Promise<Response> {
  const {
    retry = true,
    fallbackUrl,
    timeout = 30000,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const doFetch = async (targetUrl: string) => {
      const response = await fetch(targetUrl, {
        ...fetchOptions,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          `HTTP_${response.status}`
        );
      }

      return response;
    };

    if (retry) {
      const retryManager = new RetryManager();
      return await retryManager.withRetry(
        () => doFetch(url),
        {
          maxAttempts: 3,
          backoff: 'exponential',
          onRetry: (attempt, error) => {
            console.warn(`Retry attempt ${attempt} for ${url}:`, error);
          }
        }
      );
    } else {
      return await doFetch(url);
    }
  } catch (error) {
    if (fallbackUrl && error instanceof APIError && error.statusCode >= 500) {
      console.warn(`Using fallback URL: ${fallbackUrl}`);
      return await fetch(fallbackUrl, fetchOptions);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Export singleton instances
export const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitorInterval: 10000 // 10 seconds
});

export const healthChecker = new HealthChecker();
export const offlineQueue = new OfflineQueue();
export const retryManager = new RetryManager();
export const fallbackHandler = new FallbackHandler();