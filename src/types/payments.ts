// Core Payment Types for Terminal 4 Commerce & Payments System

export interface PaymentAmount {
  value: number;
  currency: string;
}

export interface PaymentMethod {
  id?: string;
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'bank_transfer' | 'klarna' | 'gift_card';
  details?: {
    number?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvc?: string;
    holderName?: string;
  };
  token?: string;
  nonce?: string;
  payerId?: string;
  verificationToken?: string;
  issuer?: string;
}

export interface Address {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category?: string;
  description?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  tier?: 'standard' | 'premium' | 'enterprise';
  createdAt?: string;
  stripeCustomerId?: string;
  squareCustomerId?: string;
  paymentMethods?: string[];
}

export interface Geolocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface PaymentContext {
  customer: Customer;
  geolocation?: Geolocation;
  paymentMethod?: PaymentMethod;
  metadata?: {
    ipAddress?: string;
    deviceId?: string;
    userAgent?: string;
    browserInfo?: {
      userAgent: string;
      screenResolution: string;
      timezone: string;
      language: string;
      platform: string;
      plugins: string[];
      webgl: string;
      canvas: string;
    };
    deviceTrust?: number;
    sessionId?: string;
    referrer?: string;
    riskData?: any;
  };
  enrichedAt?: Date;
  deviceFingerprint?: string;
  riskFactors?: any;
  paymentHistory?: any;
}

export interface PaymentRequest {
  amount: PaymentAmount;
  currency?: string;
  paymentMethod: PaymentMethod;
  order?: Order;
  customer?: Customer;
  billingAddress?: Address;
  shippingAddress?: Address;
  metadata?: {
    isRecurring?: boolean;
    subscriptionId?: string;
    orderId?: string;
    customerId?: string;
    sessionId?: string;
    attemptNumber?: number;
    orchestratorVersion?: string;
    [key: string]: any;
  };
}

export interface PaymentResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REQUIRES_ACTION';
  transactionId?: string;
  amount?: PaymentAmount;
  currency?: string;
  timestamp: Date;
  processingTime?: number;
  sessionId?: string;
  fraudScore?: number;
  processorUsed?: string;
  errorCode?: string;
  errorMessage?: string;
  receiptUrl?: string;
  receiptNumber?: string;
  receiptData?: string;
  saleId?: string;
  actionRequired?: {
    type: string;
    nextActionUrl?: string;
    data?: any;
  };
  riskEvaluation?: {
    level: string;
    createdAt: string;
  };
  fraudResult?: {
    score: number;
    results: any[];
  };
  additionalData?: Record<string, string>;
  processorResponse?: any;
  metrics?: {
    preProcessingTime?: number;
    processorSelectionTime?: number;
    fraudDetectionTime?: number;
    paymentProcessingTime?: number;
  };
  metadata?: Record<string, any>;
}

export interface FraudAssessment {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: Array<{
    factor: string;
    value: any;
    weight: number;
    riskScore: number;
    category: string;
    description: string;
  }>;
  processingTime: number;
  recommendation: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface ProcessorConfig {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  capabilities: string[];
  timeoutMs?: number;
}

export interface PaymentProcessor {
  readonly id: string;
  readonly name: string;
  readonly supportedPaymentMethods: string[];
  readonly supportedCurrencies: string[];
  readonly supportedRegions: string[];
  readonly capabilities: string[];
  readonly timeoutMs: number;

  initialize(): Promise<void>;
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  healthCheck?(): Promise<boolean>;
  refund?(transactionId: string, amount?: number): Promise<PaymentResult>;
  shutdown?(): Promise<void>;
}

// Subscription Management Types

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: PaymentAmount;
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number;
  trialPeriodDays?: number;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  metadata?: Record<string, any>;
}

export interface SubscriptionUsage {
  subscriptionId: string;
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Auto-Reorder Types

export interface AutoReorderRule {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  nextOrderDate: Date;
  isActive: boolean;
  thresholds: {
    stockLevel?: number;
    usageRate?: number;
    timeInterval?: number;
  };
  metadata?: Record<string, any>;
}

export interface PredictiveAnalytics {
  customerId: string;
  productId: string;
  predictedNextOrder: Date;
  confidence: number;
  usagePattern: {
    averageConsumption: number;
    seasonality: number;
    trend: number;
  };
  recommendations: string[];
}

// Financial Operations Types

export interface FinancialTransaction {
  id: string;
  type: 'payment' | 'refund' | 'chargeback' | 'fee' | 'adjustment';
  amount: PaymentAmount;
  description: string;
  timestamp: Date;
  accountingCode?: string;
  metadata?: Record<string, any>;
}

export interface AccountingEntry {
  id: string;
  transactionId: string;
  accountCode: string;
  debitAmount?: number;
  creditAmount?: number;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ReconciliationReport {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  totalTransactions: number;
  totalAmount: number;
  discrepancies: Array<{
    transactionId: string;
    expectedAmount: number;
    actualAmount: number;
    difference: number;
    reason: string;
  }>;
  status: 'pending' | 'completed' | 'requires_review';
  createdAt: Date;
}

// Security and Compliance Types

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
}

export interface ComplianceCheck {
  id: string;
  type: 'pci_dss' | 'gdpr' | 'ccpa' | 'sox' | 'regional';
  status: 'compliant' | 'non_compliant' | 'pending_review';
  lastChecked: Date;
  nextCheckDue: Date;
  findings: string[];
  remediationSteps: string[];
}

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: number; // days
  archivalMethod: 'deletion' | 'anonymization' | 'encryption';
  complianceRequirement: string;
  lastApplied: Date;
}

// Performance and Monitoring Types

export interface PerformanceMetric {
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  components: Record<string, {
    status: 'healthy' | 'degraded' | 'down';
    responseTime?: number;
    errorRate?: number;
    lastChecked: Date;
  }>;
  uptime: number; // percentage
  lastIncident?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notification: {
    channels: string[];
    frequency: 'immediate' | 'hourly' | 'daily';
  };
  isActive: boolean;
}

// API Response Types

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    version: string;
  };
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Webhook Types

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  signature: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetry?: Date;
  status: 'pending' | 'delivered' | 'failed' | 'expired';
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
  lastDelivery?: Date;
  failureCount: number;
}

// Testing and Quality Assurance Types

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  steps: Array<{
    action: string;
    expected: string;
    actual?: string;
    status?: 'pass' | 'fail' | 'skip';
  }>;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  createdAt: Date;
  lastRun?: Date;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  status: 'pending' | 'running' | 'passed' | 'failed';
  passRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  createdAt: Date;
  lastRun: Date;
}

// Export all types for easy importing
export * from './payments';