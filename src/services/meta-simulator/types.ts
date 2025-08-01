export type EventType = 
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Search'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Subscribe'
  | 'Contact';

export type InterestCategory = 
  | 'power_tools'
  | 'construction'
  | 'automotive'
  | 'home_improvement'
  | 'outdoor'
  | 'technology'
  | 'business'
  | 'sustainability';

export interface SimulatorConfig {
  simulationSpeed: number;
  userCount: number;
  eventFrequency: 'low' | 'normal' | 'high';
  enableRealTimeMode: boolean;
  testEventCode?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  model: string;
  manufacturer: string;
  browser: string;
  browserVersion: string;
  screenResolution?: string;
  viewport?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  platform?: string;
}

export interface UserDemographics {
  age: number;
  gender: 'male' | 'female' | 'other';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  income: string;
  education: string;
  occupation: string;
  maritalStatus: string;
  householdSize: number;
  homeOwnership: 'own' | 'rent';
  language: string;
  ethnicity: string;
}

export interface UserLocation {
  city: string;
  state: string;
  zip: string;
  country: string;
  dma: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface BehaviorPatterns {
  purchaseFrequency: string;
  averageOrderValue: number;
  preferredCategories: string[];
  brandAffinity: string[];
  priceRangePreference: string;
  seasonalPatterns: Record<string, number>;
  channelPreference: 'online' | 'offline' | 'hybrid';
  deviceUsagePatterns: Record<string, number>;
  contentPreferences: string[];
  socialMediaUsage: string[];
  influencerFollowing: boolean;
  reviewReading: boolean;
  loyaltyProgramMember: boolean;
  referralSource: string;
  lastVisit: Date;
  visitFrequency: number;
  pageViewsPerSession: number;
  averageSessionDuration: number;
  bounceRate: number;
  cartAbandonmentRate: number;
}

export interface PurchaseHistory {
  firstPurchase: Date;
  lastPurchase: Date;
  orderCount: number;
  totalValue: number;
  averageOrderValue: number;
  favoriteProducts: string[];
  returnRate: number;
  reviewsWritten: number;
}

export interface PropensityScores {
  purchasePropensity: number;
  churnRisk: number;
  upsellPotential: number;
  referralLikelihood: number;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  demographics: UserDemographics;
  location: UserLocation;
  interests: string[];
  behaviorPatterns: BehaviorPatterns;
  device: DeviceInfo;
  purchaseHistory: PurchaseHistory;
  engagementScore: number;
  lifecycleStage: 'new' | 'active' | 'loyal' | 'at_risk' | 'dormant';
  customerValue: 'low' | 'medium' | 'high';
  propensityScores: PropensityScores;
  customAudiences: string[];
  conversionHistory: ConversionEvent[];
  lastTouchpoint: string;
  acquisitionSource: string;
  customerType: 'b2b' | 'b2c';
  businessType: string;
  companySize: string;
  industry: string;
  jobFunction: string;
  decisionMakingRole: boolean;
  budgetAuthority: boolean;
  purchaseTimeframe: string;
  projectType: string[];
  competitorUsage: string[];
  painPoints: string[];
  productInterests: string[];
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    phone: boolean;
    push: boolean;
  };
  marketingConsent: {
    email: boolean;
    sms: boolean;
    phone: boolean;
    retargeting: boolean;
  };
}

export interface MetaEvent {
  eventId: string;
  eventName: EventType;
  timestamp: Date;
  userId: string;
  sourceUrl: string;
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    ipAddress: string;
    userAgent: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook pixel ID
  };
  customData: any;
  device: DeviceInfo;
  actionSource: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store';
}

export interface QuizInteraction {
  eventType: 'quiz_start' | 'quiz_answer' | 'quiz_complete' | 'quiz_abandon';
  userId: string;
  quizId: string;
  timestamp: Date;
  metadata: {
    questionId?: string;
    questionIndex?: number;
    answer?: any;
    timeSpent?: number;
    completionTime?: number;
    recommendedProducts?: string[];
    score?: number;
    lastQuestion?: string;
    reason?: string;
    source?: string;
    device?: DeviceInfo;
  };
}

export interface CustomAudience {
  id: string;
  name: string;
  description: string;
  size: number;
  criteria: any;
  userIds: string[];
  created: Date;
  status: 'active' | 'paused' | 'deleted';
}

export interface ConversionData {
  eventId: string;
  userId: string;
  conversionType: string;
  timestamp: Date;
  value: number;
  currency: string;
  metadata: {
    source: string;
    device: DeviceInfo;
    sessionId: string;
    attributionWindow: string;
    products?: string[];
    quantity?: number;
  };
}

export interface ConversionEvent {
  type: string;
  timestamp: Date;
  value: number;
}