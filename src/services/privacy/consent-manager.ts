import { prisma } from '@/lib/prisma';

export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdPartySharing: boolean;
  dataRetention: 'minimum' | 'standard' | 'extended';
  communicationChannels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface ConsentRecord {
  id: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  consentType: 'explicit' | 'implicit';
  preferences: ConsentPreferences;
  consentMethod: 'banner' | 'form' | 'account_settings' | 'api';
  consentVersion: string;
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  withdrawable: boolean;
}

export interface PrivacyPolicy {
  version: string;
  effectiveDate: Date;
  lastUpdated: Date;
  regions: {
    gdpr: boolean;
    ccpa: boolean;
    lgpd: boolean;
    pipeda: boolean;
  };
}

export class ConsentManager {
  private currentPolicyVersion: string = '2.0.0';
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private defaultRetentionDays: Record<string, number> = {
    minimum: 90,
    standard: 365,
    extended: 730
  };

  // Check if user has valid consent
  async hasValidConsent(userId: string, consentType: keyof ConsentPreferences): Promise<boolean> {
    const latestConsent = await this.getLatestConsent(userId);
    if (!latestConsent) return false;

    // Check if consent is still valid
    if (latestConsent.consentVersion !== this.currentPolicyVersion) {
      return false;
    }

    return latestConsent.preferences[consentType] === true;
  }

  // Record new consent
  async recordConsent(
    userId: string,
    preferences: ConsentPreferences,
    metadata: {
      ipAddress: string;
      userAgent: string;
      consentMethod: ConsentRecord['consentMethod'];
      legalBasis?: ConsentRecord['legalBasis'];
    }
  ): Promise<ConsentRecord> {
    const consentRecord: ConsentRecord = {
      id: this.generateConsentId(),
      userId,
      timestamp: new Date(),
      ipAddress: this.hashIpAddress(metadata.ipAddress),
      userAgent: metadata.userAgent,
      consentType: 'explicit',
      preferences,
      consentMethod: metadata.consentMethod,
      consentVersion: this.currentPolicyVersion,
      legalBasis: metadata.legalBasis || 'consent',
      withdrawable: true
    };

    // Store consent record
    const userConsents = this.consentRecords.get(userId) || [];
    userConsents.push(consentRecord);
    this.consentRecords.set(userId, userConsents);

    // In production, store in database
    await this.persistConsent(consentRecord);

    // Update Meta data processing options if needed
    await this.updateDataProcessingOptions(userId, preferences);

    return consentRecord;
  }

  // Withdraw consent
  async withdrawConsent(
    userId: string,
    consentTypes?: Array<keyof ConsentPreferences>
  ): Promise<ConsentRecord> {
    const currentConsent = await this.getLatestConsent(userId);
    if (!currentConsent) {
      throw new Error('No consent record found');
    }

    const updatedPreferences = { ...currentConsent.preferences };
    
    if (consentTypes) {
      // Withdraw specific consents
      consentTypes.forEach(type => {
        updatedPreferences[type] = false;
      });
    } else {
      // Withdraw all consents
      updatedPreferences.analytics = false;
      updatedPreferences.marketing = false;
      updatedPreferences.personalization = false;
      updatedPreferences.thirdPartySharing = false;
    }

    // Record withdrawal as new consent record
    const withdrawalRecord = await this.recordConsent(
      userId,
      updatedPreferences,
      {
        ipAddress: '0.0.0.0', // Privacy-preserved
        userAgent: 'consent-withdrawal',
        consentMethod: 'api',
        legalBasis: 'consent'
      }
    );

    // Trigger data deletion/anonymization if required
    await this.handleDataDeletion(userId, updatedPreferences);

    return withdrawalRecord;
  }

  // Get latest consent for user
  async getLatestConsent(userId: string): Promise<ConsentRecord | null> {
    const userConsents = this.consentRecords.get(userId) || [];
    if (userConsents.length === 0) {
      // Check database in production
      return await this.fetchLatestConsent(userId);
    }
    return userConsents[userConsents.length - 1];
  }

  // Get consent history
  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    return this.consentRecords.get(userId) || [];
  }

  // Check GDPR compliance
  isGDPRCompliant(consent: ConsentRecord): boolean {
    return (
      consent.consentType === 'explicit' &&
      consent.legalBasis !== undefined &&
      consent.withdrawable === true &&
      consent.timestamp !== undefined
    );
  }

  // Check CCPA compliance
  isCCPACompliant(consent: ConsentRecord): boolean {
    return (
      consent.preferences.thirdPartySharing !== undefined &&
      consent.withdrawable === true
    );
  }

  // Get data processing options for Meta
  getDataProcessingOptions(preferences: ConsentPreferences): {
    options: string[];
    country: number;
    state: number;
  } {
    if (!preferences.thirdPartySharing || !preferences.marketing) {
      // Limited Data Use mode
      return {
        options: ['LDU'],
        country: 1, // USA
        state: 1000 // California
      };
    }

    return {
      options: [],
      country: 0,
      state: 0
    };
  }

  // Update Meta data processing options
  private async updateDataProcessingOptions(
    userId: string,
    preferences: ConsentPreferences
  ): Promise<void> {
    const options = this.getDataProcessingOptions(preferences);
    
    // In production, update Meta Pixel and CAPI with these options
    console.log(`Updated data processing options for user ${userId}:`, options);
  }

  // Handle data deletion requests
  private async handleDataDeletion(
    userId: string,
    preferences: ConsentPreferences
  ): Promise<void> {
    const deletionTasks: Promise<void>[] = [];

    // Delete analytics data if consent withdrawn
    if (!preferences.analytics) {
      deletionTasks.push(this.deleteAnalyticsData(userId));
    }

    // Delete marketing data if consent withdrawn
    if (!preferences.marketing) {
      deletionTasks.push(this.deleteMarketingData(userId));
    }

    // Delete personalization data if consent withdrawn
    if (!preferences.personalization) {
      deletionTasks.push(this.deletePersonalizationData(userId));
    }

    await Promise.all(deletionTasks);
  }

  // Delete analytics data
  private async deleteAnalyticsData(userId: string): Promise<void> {
    // In production, delete or anonymize analytics data
    console.log(`Deleting analytics data for user ${userId}`);
  }

  // Delete marketing data
  private async deleteMarketingData(userId: string): Promise<void> {
    // In production, remove from marketing lists, delete Meta custom audiences
    console.log(`Deleting marketing data for user ${userId}`);
  }

  // Delete personalization data
  private async deletePersonalizationData(userId: string): Promise<void> {
    // In production, delete user preferences and recommendations
    console.log(`Deleting personalization data for user ${userId}`);
  }

  // Generate consent banner configuration
  generateConsentBanner(userRegion: string): {
    required: boolean;
    categories: Array<{
      id: keyof ConsentPreferences;
      name: string;
      description: string;
      required: boolean;
    }>;
    legalBasis: ConsentRecord['legalBasis'];
  } {
    const isGDPR = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL'].includes(userRegion);
    const isCCPA = userRegion === 'CA' || userRegion === 'US-CA';

    return {
      required: isGDPR || isCCPA,
      categories: [
        {
          id: 'analytics',
          name: 'Analytics',
          description: 'Help us improve our services by collecting usage data',
          required: false
        },
        {
          id: 'marketing',
          name: 'Marketing',
          description: 'Receive personalized offers and advertisements',
          required: false
        },
        {
          id: 'personalization',
          name: 'Personalization',
          description: 'Customize your experience based on your preferences',
          required: false
        },
        {
          id: 'thirdPartySharing',
          name: 'Third-Party Sharing',
          description: 'Share data with trusted partners for enhanced services',
          required: false
        }
      ],
      legalBasis: isGDPR ? 'consent' : 'legitimate_interest'
    };
  }

  // Export user data (GDPR right to portability)
  async exportUserData(userId: string): Promise<{
    consentHistory: ConsentRecord[];
    currentPreferences: ConsentPreferences | null;
    dataCategories: Record<string, any>;
  }> {
    const consentHistory = await this.getConsentHistory(userId);
    const latestConsent = await this.getLatestConsent(userId);

    return {
      consentHistory,
      currentPreferences: latestConsent?.preferences || null,
      dataCategories: {
        analytics: latestConsent?.preferences.analytics ? 'Collected' : 'Not collected',
        marketing: latestConsent?.preferences.marketing ? 'Collected' : 'Not collected',
        personalization: latestConsent?.preferences.personalization ? 'Collected' : 'Not collected',
        thirdParty: latestConsent?.preferences.thirdPartySharing ? 'Shared' : 'Not shared'
      }
    };
  }

  // Validate consent for specific action
  async validateConsentForAction(
    userId: string,
    action: 'track_event' | 'send_email' | 'create_audience' | 'personalize_content'
  ): Promise<{ allowed: boolean; reason?: string }> {
    const consent = await this.getLatestConsent(userId);
    if (!consent) {
      return { allowed: false, reason: 'No consent record found' };
    }

    const actionRequirements: Record<string, keyof ConsentPreferences> = {
      'track_event': 'analytics',
      'send_email': 'marketing',
      'create_audience': 'thirdPartySharing',
      'personalize_content': 'personalization'
    };

    const requiredConsent = actionRequirements[action];
    if (!consent.preferences[requiredConsent]) {
      return { allowed: false, reason: `User has not consented to ${requiredConsent}` };
    }

    return { allowed: true };
  }

  // Get privacy policy
  getPrivacyPolicy(): PrivacyPolicy {
    return {
      version: this.currentPolicyVersion,
      effectiveDate: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-29'),
      regions: {
        gdpr: true,
        ccpa: true,
        lgpd: true,
        pipeda: true
      }
    };
  }

  // Utility functions
  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashIpAddress(ip: string): string {
    // Simple hash for privacy
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Database operations (stubs for production implementation)
  private async persistConsent(consent: ConsentRecord): Promise<void> {
    // In production, save to database
    console.log('Persisting consent:', consent);
  }

  private async fetchLatestConsent(userId: string): Promise<ConsentRecord | null> {
    // In production, fetch from database
    return null;
  }

  // Check if re-consent is needed
  needsReconsent(consent: ConsentRecord): boolean {
    return consent.consentVersion !== this.currentPolicyVersion;
  }

  // Get consent statistics
  async getConsentStats(): Promise<{
    totalUsers: number;
    consentedUsers: number;
    consentRates: Record<keyof ConsentPreferences, number>;
    averageRetentionDays: number;
  }> {
    const allConsents = Array.from(this.consentRecords.values()).flat();
    const latestConsents = new Map<string, ConsentRecord>();

    // Get latest consent for each user
    allConsents.forEach(consent => {
      const existing = latestConsents.get(consent.userId);
      if (!existing || consent.timestamp > existing.timestamp) {
        latestConsents.set(consent.userId, consent);
      }
    });

    const consentRates: Record<keyof ConsentPreferences, number> = {
      analytics: 0,
      marketing: 0,
      personalization: 0,
      thirdPartySharing: 0,
      dataRetention: 0,
      communicationChannels: 0
    };

    let totalRetentionDays = 0;
    latestConsents.forEach(consent => {
      Object.keys(consentRates).forEach(key => {
        if (key !== 'dataRetention' && key !== 'communicationChannels') {
          if (consent.preferences[key as keyof ConsentPreferences]) {
            consentRates[key as keyof ConsentPreferences]++;
          }
        }
      });
      totalRetentionDays += this.defaultRetentionDays[consent.preferences.dataRetention];
    });

    const totalUsers = latestConsents.size;
    Object.keys(consentRates).forEach(key => {
      if (key !== 'dataRetention' && key !== 'communicationChannels') {
        consentRates[key as keyof ConsentPreferences] = 
          totalUsers > 0 ? (consentRates[key as keyof ConsentPreferences] / totalUsers) * 100 : 0;
      }
    });

    return {
      totalUsers,
      consentedUsers: totalUsers,
      consentRates,
      averageRetentionDays: totalUsers > 0 ? totalRetentionDays / totalUsers : 365
    };
  }
}

// Singleton instance
let consentManager: ConsentManager | null = null;

export const initializeConsentManager = (): ConsentManager => {
  if (!consentManager) {
    consentManager = new ConsentManager();
  }
  return consentManager;
};

export const getConsentManager = (): ConsentManager | null => {
  return consentManager;
};