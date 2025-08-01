import { MetaAudience, MetaCustomAudience, MetaLookalikeAudience, MetaWebsiteAudience } from '@/types/meta';
import { getConversionsAPI } from './conversions-api';
import { EnhancedAnalytics } from '../analytics/enhanced-analytics';

export interface AudienceRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  rules: AudienceRule[];
  userCount: number;
  lastUpdated: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  metaAudienceId?: string;
}

export class AudienceManager {
  private isTestMode: boolean;
  private audiences: Map<string, AudienceSegment> = new Map();
  private analytics: EnhancedAnalytics;
  private syncInterval: number = 3600000; // 1 hour
  private syncTimer?: NodeJS.Timeout;

  constructor(testMode: boolean = true) {
    this.isTestMode = testMode;
    this.analytics = new EnhancedAnalytics();
    this.startSyncScheduler();
  }

  // Create custom audience from rules
  async createCustomAudience(
    name: string,
    description: string,
    rules: AudienceRule[]
  ): Promise<AudienceSegment> {
    const audienceId = this.generateAudienceId(name);
    
    // Calculate user count based on rules
    const userCount = await this.calculateAudienceSize(rules);
    
    const audience: AudienceSegment = {
      id: audienceId,
      name,
      description,
      rules,
      userCount,
      lastUpdated: new Date(),
      syncStatus: 'pending'
    };

    this.audiences.set(audienceId, audience);

    if (this.isTestMode) {
      console.log('[Audience Manager - Test Mode] Created audience:', audience);
      // Simulate successful sync
      setTimeout(() => {
        audience.syncStatus = 'synced';
        audience.metaAudienceId = `TEST_${audienceId}`;
      }, 2000);
    } else {
      await this.syncAudienceToMeta(audience);
    }

    return audience;
  }

  // Create lookalike audience
  async createLookalikeAudience(
    sourceAudienceId: string,
    name: string,
    country: string = 'US',
    ratio: number = 0.01 // 1% similarity
  ): Promise<AudienceSegment> {
    const sourceAudience = this.audiences.get(sourceAudienceId);
    if (!sourceAudience) {
      throw new Error('Source audience not found');
    }

    const audienceId = this.generateAudienceId(name);
    const estimatedSize = Math.floor(sourceAudience.userCount * (ratio * 100));

    const audience: AudienceSegment = {
      id: audienceId,
      name,
      description: `Lookalike of ${sourceAudience.name} (${ratio * 100}% similarity in ${country})`,
      rules: [
        {
          field: 'lookalike_source',
          operator: 'equals',
          value: sourceAudienceId
        },
        {
          field: 'lookalike_country',
          operator: 'equals',
          value: country
        },
        {
          field: 'lookalike_ratio',
          operator: 'equals',
          value: ratio
        }
      ],
      userCount: estimatedSize,
      lastUpdated: new Date(),
      syncStatus: 'pending'
    };

    this.audiences.set(audienceId, audience);

    if (this.isTestMode) {
      console.log('[Audience Manager - Test Mode] Created lookalike audience:', audience);
      setTimeout(() => {
        audience.syncStatus = 'synced';
        audience.metaAudienceId = `TEST_LOOKALIKE_${audienceId}`;
      }, 3000);
    } else {
      await this.syncLookalikeToMeta(audience, sourceAudience.metaAudienceId!);
    }

    return audience;
  }

  // Create website custom audience based on pixel events
  async createWebsiteAudience(
    name: string,
    description: string,
    eventRules: Array<{
      event: string;
      timeframe: number; // days
      frequency?: number;
    }>
  ): Promise<AudienceSegment> {
    const audienceId = this.generateAudienceId(name);
    
    // Build Meta rule format
    const rules: AudienceRule[] = eventRules.map(rule => ({
      field: `event_${rule.event}`,
      operator: 'greater_than' as const,
      value: {
        timeframe: rule.timeframe,
        frequency: rule.frequency || 1
      }
    }));

    const userCount = await this.calculateWebsiteAudienceSize(eventRules);

    const audience: AudienceSegment = {
      id: audienceId,
      name,
      description,
      rules,
      userCount,
      lastUpdated: new Date(),
      syncStatus: 'pending'
    };

    this.audiences.set(audienceId, audience);

    if (this.isTestMode) {
      console.log('[Audience Manager - Test Mode] Created website audience:', audience);
      setTimeout(() => {
        audience.syncStatus = 'synced';
        audience.metaAudienceId = `TEST_WEBSITE_${audienceId}`;
      }, 2000);
    } else {
      await this.syncWebsiteAudienceToMeta(audience);
    }

    return audience;
  }

  // Dynamic audience with auto-updating rules
  async createDynamicAudience(
    name: string,
    description: string,
    rules: AudienceRule[],
    autoUpdate: boolean = true
  ): Promise<AudienceSegment> {
    const audience = await this.createCustomAudience(name, description, rules);
    
    if (autoUpdate) {
      // Schedule periodic updates
      setInterval(async () => {
        await this.updateAudience(audience.id);
      }, this.syncInterval);
    }

    return audience;
  }

  // Update audience user count and sync
  async updateAudience(audienceId: string): Promise<void> {
    const audience = this.audiences.get(audienceId);
    if (!audience) return;

    const newUserCount = await this.calculateAudienceSize(audience.rules);
    audience.userCount = newUserCount;
    audience.lastUpdated = new Date();

    if (!this.isTestMode && audience.metaAudienceId) {
      await this.syncAudienceToMeta(audience);
    }
  }

  // Calculate audience size based on rules
  private async calculateAudienceSize(rules: AudienceRule[]): Promise<number> {
    if (this.isTestMode) {
      // Generate realistic test numbers
      const baseSize = 10000;
      const reduction = rules.length * 0.2; // Each rule reduces audience by 20%
      return Math.floor(baseSize * Math.pow(0.8, rules.length));
    }

    // In production, query analytics data
    const query = this.buildAnalyticsQuery(rules);
    const result = await this.analytics.queryUsers(query);
    return result.count;
  }

  // Calculate website audience size
  private async calculateWebsiteAudienceSize(
    eventRules: Array<{ event: string; timeframe: number; frequency?: number }>
  ): Promise<number> {
    if (this.isTestMode) {
      // Simulate based on event type
      const eventMultipliers: Record<string, number> = {
        'PageView': 0.8,
        'ViewContent': 0.5,
        'AddToCart': 0.2,
        'Purchase': 0.05,
        'Lead': 0.15
      };
      
      let baseSize = 10000;
      eventRules.forEach(rule => {
        const multiplier = eventMultipliers[rule.event] || 0.1;
        baseSize = Math.floor(baseSize * multiplier);
      });
      
      return baseSize;
    }

    // In production, query event data
    return 0; // Placeholder
  }

  // Sync audience to Meta
  private async syncAudienceToMeta(audience: AudienceSegment): Promise<void> {
    try {
      const capi = getConversionsAPI();
      if (!capi) {
        throw new Error('Conversions API not initialized');
      }

      // In production, this would make actual API calls to Meta
      // For now, simulate the sync
      audience.syncStatus = 'synced';
      audience.metaAudienceId = `META_${audience.id}`;
      
      console.log(`Synced audience ${audience.name} to Meta`);
    } catch (error) {
      audience.syncStatus = 'error';
      console.error('Failed to sync audience:', error);
    }
  }

  // Sync lookalike audience to Meta
  private async syncLookalikeToMeta(
    audience: AudienceSegment,
    sourceAudienceId: string
  ): Promise<void> {
    try {
      // In production, create lookalike via Meta API
      audience.syncStatus = 'synced';
      audience.metaAudienceId = `META_LOOKALIKE_${audience.id}`;
      
      console.log(`Synced lookalike audience ${audience.name} to Meta`);
    } catch (error) {
      audience.syncStatus = 'error';
      console.error('Failed to sync lookalike audience:', error);
    }
  }

  // Sync website audience to Meta
  private async syncWebsiteAudienceToMeta(audience: AudienceSegment): Promise<void> {
    try {
      // In production, create website custom audience via Meta API
      audience.syncStatus = 'synced';
      audience.metaAudienceId = `META_WEBSITE_${audience.id}`;
      
      console.log(`Synced website audience ${audience.name} to Meta`);
    } catch (error) {
      audience.syncStatus = 'error';
      console.error('Failed to sync website audience:', error);
    }
  }

  // Build analytics query from rules
  private buildAnalyticsQuery(rules: AudienceRule[]): any {
    const query: any = { filters: [] };

    rules.forEach(rule => {
      switch (rule.operator) {
        case 'equals':
          query.filters.push({ [rule.field]: rule.value });
          break;
        case 'contains':
          query.filters.push({ [rule.field]: { $regex: rule.value } });
          break;
        case 'greater_than':
          query.filters.push({ [rule.field]: { $gt: rule.value } });
          break;
        case 'less_than':
          query.filters.push({ [rule.field]: { $lt: rule.value } });
          break;
        case 'in':
          query.filters.push({ [rule.field]: { $in: rule.value } });
          break;
        case 'not_in':
          query.filters.push({ [rule.field]: { $nin: rule.value } });
          break;
      }
    });

    return query;
  }

  // Start automatic sync scheduler
  private startSyncScheduler(): void {
    this.syncTimer = setInterval(async () => {
      const pendingAudiences = Array.from(this.audiences.values())
        .filter(a => a.syncStatus === 'pending');

      for (const audience of pendingAudiences) {
        await this.updateAudience(audience.id);
      }
    }, this.syncInterval);
  }

  // Get all audiences
  getAudiences(): AudienceSegment[] {
    return Array.from(this.audiences.values());
  }

  // Get audience by ID
  getAudience(audienceId: string): AudienceSegment | undefined {
    return this.audiences.get(audienceId);
  }

  // Delete audience
  async deleteAudience(audienceId: string): Promise<boolean> {
    const audience = this.audiences.get(audienceId);
    if (!audience) return false;

    if (!this.isTestMode && audience.metaAudienceId) {
      // In production, delete from Meta
      console.log(`Deleting audience ${audience.name} from Meta`);
    }

    this.audiences.delete(audienceId);
    return true;
  }

  // Generate unique audience ID
  private generateAudienceId(name: string): string {
    const timestamp = Date.now();
    const cleanName = name.toLowerCase().replace(/\s+/g, '_');
    return `${cleanName}_${timestamp}`;
  }

  // Get audience insights
  async getAudienceInsights(audienceId: string): Promise<any> {
    const audience = this.audiences.get(audienceId);
    if (!audience) return null;

    return {
      audience,
      demographics: {
        ageRanges: [
          { range: '18-24', percentage: 15 },
          { range: '25-34', percentage: 35 },
          { range: '35-44', percentage: 25 },
          { range: '45-54', percentage: 15 },
          { range: '55+', percentage: 10 }
        ],
        gender: [
          { type: 'male', percentage: 55 },
          { type: 'female', percentage: 45 }
        ],
        topLocations: [
          { location: 'California', percentage: 20 },
          { location: 'Texas', percentage: 15 },
          { location: 'Florida', percentage: 10 },
          { location: 'New York', percentage: 8 },
          { location: 'Other', percentage: 47 }
        ]
      },
      interests: [
        { name: 'Technology', affinity: 0.85 },
        { name: 'Business', affinity: 0.72 },
        { name: 'E-commerce', affinity: 0.68 },
        { name: 'Sustainability', affinity: 0.61 },
        { name: 'Innovation', affinity: 0.58 }
      ],
      behaviors: [
        { type: 'High Purchase Intent', percentage: 42 },
        { type: 'Mobile Shoppers', percentage: 68 },
        { type: 'Early Adopters', percentage: 35 },
        { type: 'Price Conscious', percentage: 28 }
      ]
    };
  }

  // Export audience data
  async exportAudience(audienceId: string, format: 'csv' | 'json' = 'json'): Promise<string> {
    const audience = this.audiences.get(audienceId);
    if (!audience) throw new Error('Audience not found');

    const insights = await this.getAudienceInsights(audienceId);

    if (format === 'json') {
      return JSON.stringify(insights, null, 2);
    } else {
      // CSV format
      const csv = [
        'Audience Export',
        `Name,${audience.name}`,
        `Description,${audience.description}`,
        `User Count,${audience.userCount}`,
        `Last Updated,${audience.lastUpdated.toISOString()}`,
        `Sync Status,${audience.syncStatus}`,
        '',
        'Demographics',
        'Age Range,Percentage',
        ...insights.demographics.ageRanges.map((a: any) => `${a.range},${a.percentage}%`),
        '',
        'Top Interests,Affinity Score',
        ...insights.interests.map((i: any) => `${i.name},${i.affinity}`)
      ].join('\n');

      return csv;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}

// Singleton instance
let audienceManager: AudienceManager | null = null;

export const initializeAudienceManager = (testMode: boolean = true): AudienceManager => {
  if (!audienceManager) {
    audienceManager = new AudienceManager(testMode);
  }
  return audienceManager;
};

export const getAudienceManager = (): AudienceManager | null => {
  return audienceManager;
};