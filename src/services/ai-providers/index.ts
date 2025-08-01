import { EventEmitter } from 'events';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

// Provider interfaces
export interface AIProvider {
  name: string;
  type: 'image' | 'text' | 'both';
  priority: number;
  isAvailable: boolean;
  costPerRequest: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  generate(params: GenerationParams): Promise<GenerationResult>;
  healthCheck(): Promise<boolean>;
}

export interface GenerationParams {
  type: 'image' | 'text';
  prompt: string;
  parameters: {
    style?: string;
    aspectRatio?: string;
    quality?: 'standard' | 'hd' | '4k';
    iterations?: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  baselineAssets?: string[]; // URLs to reference images
  userId: string;
  onProgress?: (progress: number) => void;
}

export interface GenerationResult {
  success: boolean;
  assets: GeneratedAsset[];
  metadata: {
    provider: string;
    cost: number;
    processingTime: number;
    model: string;
    parameters: any;
  };
  error?: string;
}

export interface GeneratedAsset {
  id: string;
  url: string;
  type: 'image' | 'text';
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    prompt: string;
  };
}

// Provider usage tracking
interface ProviderUsage {
  provider: string;
  requestsToday: number;
  requestsThisHour: number;
  lastRequest: Date;
  totalCost: number;
  failureCount: number;
  lastFailure?: Date;
}

export class AIProviderManager extends EventEmitter {
  private providers: Map<string, AIProvider> = new Map();
  private usage: Map<string, ProviderUsage> = new Map();
  private failoverOrder: string[] = [];
  private isInitialized = false;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      // Initialize providers in order of preference
      await this.initializeStableDiffusion();
      await this.initializeDallE();
      await this.initializeClaude();
      await this.initializeMidjourney();

      // Set failover order based on reliability and cost
      this.failoverOrder = [
        'stable_diffusion',
        'dall_e',
        'claude',
        'midjourney'
      ];

      // Run initial health checks
      await this.runHealthChecks();

      this.isInitialized = true;
      this.emit('ready');
      
      console.log('✅ AI Provider Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AI Provider Manager:', error);
      this.emit('error', error);
    }
  }

  private async initializeStableDiffusion() {
    const provider: AIProvider = {
      name: 'Stable Diffusion',
      type: 'image',
      priority: 1,
      isAvailable: !!process.env.STABLE_DIFFUSION_API_KEY,
      costPerRequest: 0.02, // $0.02 per image
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
      },
      generate: async (params: GenerationParams) => {
        return this.generateWithStableDiffusion(params);
      },
      healthCheck: async () => {
        return this.checkStableDiffusionHealth();
      }
    };

    this.providers.set('stable_diffusion', provider);
    this.initializeUsageTracking('stable_diffusion');
  }

  private async initializeDallE() {
    const provider: AIProvider = {
      name: 'DALL-E 3',
      type: 'image',
      priority: 2,
      isAvailable: !!process.env.OPENAI_API_KEY,
      costPerRequest: 0.04, // $0.04 per image
      rateLimit: {
        requestsPerMinute: 50,
        requestsPerHour: 500,
      },
      generate: async (params: GenerationParams) => {
        return this.generateWithDallE(params);
      },
      healthCheck: async () => {
        return this.checkDallEHealth();
      }
    };

    this.providers.set('dall_e', provider);
    this.initializeUsageTracking('dall_e');
  }

  private async initializeClaude() {
    const provider: AIProvider = {
      name: 'Claude',
      type: 'text',
      priority: 1,
      isAvailable: !!process.env.ANTHROPIC_API_KEY,
      costPerRequest: 0.001, // $0.001 per request
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 1000,
      },
      generate: async (params: GenerationParams) => {
        return this.generateWithClaude(params);
      },
      healthCheck: async () => {
        return this.checkClaudeHealth();
      }
    };

    this.providers.set('claude', provider);
    this.initializeUsageTracking('claude');
  }

  private async initializeMidjourney() {
    const provider: AIProvider = {
      name: 'Midjourney',
      type: 'image',
      priority: 3,
      isAvailable: !!process.env.MIDJOURNEY_API_KEY,
      costPerRequest: 0.08, // $0.08 per image (premium)
      rateLimit: {
        requestsPerMinute: 20,
        requestsPerHour: 200,
      },
      generate: async (params: GenerationParams) => {
        return this.generateWithMidjourney(params);
      },
      healthCheck: async () => {
        return this.checkMidjourneyHealth();
      }
    };

    this.providers.set('midjourney', provider);
    this.initializeUsageTracking('midjourney');
  }

  private initializeUsageTracking(providerName: string) {
    this.usage.set(providerName, {
      provider: providerName,
      requestsToday: 0,
      requestsThisHour: 0,
      lastRequest: new Date(0),
      totalCost: 0,
      failureCount: 0,
    });
  }

  // Main generation method with failover
  async generateContent(params: GenerationParams): Promise<GenerationResult> {
    const { type, prompt } = params;
    
    // Filter providers by type
    const availableProviders = this.failoverOrder
      .map(name => this.providers.get(name))
      .filter(provider => 
        provider && 
        provider.isAvailable && 
        (provider.type === type || provider.type === 'both') &&
        this.canUseProvider(provider.name)
      );

    if (availableProviders.length === 0) {
      throw new Error(`No available providers for ${type} generation`);
    }

    // Try providers in order
    let lastError: Error | null = null;
    
    for (const provider of availableProviders) {
      try {
        console.log(`🎨 Attempting generation with ${provider.name}...`);
        
        const startTime = Date.now();
        const result = await provider.generate(params);
        const processingTime = Date.now() - startTime;

        // Update usage tracking
        this.updateUsageStats(provider.name, provider.costPerRequest, true);

        // Store generated assets in database
        await this.storeGeneratedAssets(result.assets, params.userId, provider.name);

        this.emit('generationSuccess', { 
          provider: provider.name, 
          type, 
          processingTime,
          cost: provider.costPerRequest 
        });

        return {
          ...result,
          metadata: {
            ...result.metadata,
            provider: provider.name,
            processingTime,
          }
        };

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ${provider.name} generation failed:`, error);
        
        this.updateUsageStats(provider.name, 0, false);
        this.emit('generationFailure', { 
          provider: provider.name, 
          error: lastError.message 
        });

        // If this isn't the last provider, continue to next
        if (provider !== availableProviders[availableProviders.length - 1]) {
          console.log(`🔄 Failing over to next provider...`);
          continue;
        }
      }
    }

    // All providers failed
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  // Provider-specific generation methods
  private async generateWithStableDiffusion(params: GenerationParams): Promise<GenerationResult> {
    if (!process.env.STABLE_DIFFUSION_API_KEY) {
      throw new Error('Stable Diffusion API key not configured');
    }

    const { prompt, parameters, onProgress } = params;
    onProgress?.(10);

    try {
      // Stable Diffusion API call
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 50,
          samples: 1,
        }),
      });

      onProgress?.(50);

      if (!response.ok) {
        throw new Error(`Stable Diffusion API error: ${response.status}`);
      }

      const data = await response.json();
      onProgress?.(80);

      // Process and upload generated images
      const assets: GeneratedAsset[] = [];
      
      for (const artifact of data.artifacts) {
        const imageBuffer = Buffer.from(artifact.base64, 'base64');
        const filename = `ai-generated-${uuidv4()}.png`;
        const blobPath = `ai-generated/${params.userId}/${Date.now()}/${filename}`;

        const blob = await put(blobPath, imageBuffer, {
          access: 'public',
          contentType: 'image/png',
        });

        assets.push({
          id: uuidv4(),
          url: blob.url,
          type: 'image',
          metadata: {
            width: 1024,
            height: 1024,
            format: 'png',
            size: imageBuffer.length,
            prompt,
          }
        });
      }

      onProgress?.(100);

      return {
        success: true,
        assets,
        metadata: {
          provider: 'stable_diffusion',
          cost: 0.02,
          processingTime: 0,
          model: 'stable-diffusion-xl-1024-v1-0',
          parameters,
        }
      };

    } catch (error) {
      throw new Error(`Stable Diffusion generation failed: ${error.message}`);
    }
  }

  private async generateWithDallE(params: GenerationParams): Promise<GenerationResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt, parameters, onProgress } = params;
    onProgress?.(10);

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: parameters.quality === '4k' ? 'hd' : 'standard',
        }),
      });

      onProgress?.(50);

      if (!response.ok) {
        throw new Error(`DALL-E API error: ${response.status}`);
      }

      const data = await response.json();
      onProgress?.(80);

      // Download and upload generated images
      const assets: GeneratedAsset[] = [];
      
      for (const image of data.data) {
        const imageResponse = await fetch(image.url);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        
        const filename = `dall-e-${uuidv4()}.png`;
        const blobPath = `ai-generated/${params.userId}/${Date.now()}/${filename}`;

        const blob = await put(blobPath, imageBuffer, {
          access: 'public',
          contentType: 'image/png',
        });

        assets.push({
          id: uuidv4(),
          url: blob.url,
          type: 'image',
          metadata: {
            width: 1024,
            height: 1024,
            format: 'png',
            size: imageBuffer.length,
            prompt: image.revised_prompt || prompt,
          }
        });
      }

      onProgress?.(100);

      return {
        success: true,
        assets,
        metadata: {
          provider: 'dall_e',
          cost: 0.04,
          processingTime: 0,
          model: 'dall-e-3',
          parameters,
        }
      };

    } catch (error) {
      throw new Error(`DALL-E generation failed: ${error.message}`);
    }
  }

  private async generateWithClaude(params: GenerationParams): Promise<GenerationResult> {
    // Use existing Claude integration for text generation
    const { claudeIntegration } = await import('@/services/integrations/claude-integration');
    
    try {
      const { prompt, onProgress } = params;
      onProgress?.(30);

      const generatedText = await claudeIntegration.sendMessage(prompt);
      onProgress?.(100);

      const assets: GeneratedAsset[] = [{
        id: uuidv4(),
        url: '', // Text doesn't have a URL
        type: 'text',
        metadata: {
          prompt,
        }
      }];

      return {
        success: true,
        assets,
        metadata: {
          provider: 'claude',
          cost: 0.001,
          processingTime: 0,
          model: 'claude-3-haiku',
          parameters: params.parameters,
        }
      };

    } catch (error) {
      throw new Error(`Claude generation failed: ${error.message}`);
    }
  }

  private async generateWithMidjourney(params: GenerationParams): Promise<GenerationResult> {
    // Placeholder for Midjourney integration
    throw new Error('Midjourney integration not yet implemented');
  }

  // Health check methods
  private async checkStableDiffusionHealth(): Promise<boolean> {
    if (!process.env.STABLE_DIFFUSION_API_KEY) return false;
    
    try {
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: {
          'Authorization': `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkDallEHealth(): Promise<boolean> {
    if (!process.env.OPENAI_API_KEY) return false;
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkClaudeHealth(): Promise<boolean> {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  private async checkMidjourneyHealth(): Promise<boolean> {
    return !!process.env.MIDJOURNEY_API_KEY;
  }

  private async runHealthChecks() {
    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await provider.healthCheck();
        provider.isAvailable = isHealthy;
        console.log(`${provider.name}: ${isHealthy ? '✅' : '❌'}`);
      } catch (error) {
        provider.isAvailable = false;
        console.log(`${provider.name}: ❌ (${error.message})`);
      }
    }
  }

  // Usage tracking and rate limiting
  private canUseProvider(providerName: string): boolean {
    const usage = this.usage.get(providerName);
    const provider = this.providers.get(providerName);
    
    if (!usage || !provider) return false;

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const minuteAgo = new Date(now.getTime() - 60 * 1000);

    // Reset counters if needed
    if (usage.lastRequest < hourAgo) {
      usage.requestsThisHour = 0;
    }
    if (usage.lastRequest < minuteAgo) {
      usage.requestsToday = 0; // Simplified - would need proper daily reset
    }

    // Check rate limits
    if (usage.requestsThisHour >= provider.rateLimit.requestsPerHour) {
      return false;
    }
    if (usage.requestsToday >= provider.rateLimit.requestsPerMinute) {
      return false;
    }

    // Check failure rate (disable if too many recent failures)
    if (usage.failureCount > 5 && usage.lastFailure && 
        (now.getTime() - usage.lastFailure.getTime()) < 5 * 60 * 1000) {
      return false;
    }

    return true;
  }

  private updateUsageStats(providerName: string, cost: number, success: boolean) {
    const usage = this.usage.get(providerName);
    if (!usage) return;

    usage.lastRequest = new Date();
    usage.requestsThisHour++;
    usage.requestsToday++;
    usage.totalCost += cost;

    if (!success) {
      usage.failureCount++;
      usage.lastFailure = new Date();
    } else {
      // Reset failure count on success
      usage.failureCount = Math.max(0, usage.failureCount - 1);
    }
  }

  private async storeGeneratedAssets(assets: GeneratedAsset[], userId: string, provider: string) {
    const { prisma } = await import('@/lib/prisma');
    
    for (const asset of assets) {
      await prisma.contentAsset.create({
        data: {
          id: asset.id,
          tenantId: userId,
          assetType: 'ai_generated',
          fileUrl: asset.url,
          metadata: {
            ...asset.metadata,
            provider,
            generatedAt: new Date().toISOString(),
          }
        }
      });
    }
  }

  // Public API methods
  async getProviderStatus() {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      displayName: provider.name,
      type: provider.type,
      isAvailable: provider.isAvailable,
      priority: provider.priority,
      costPerRequest: provider.costPerRequest,
      usage: this.usage.get(name),
    }));
  }

  async getUsageStats() {
    return Array.from(this.usage.entries()).map(([name, usage]) => ({
      provider: name,
      ...usage,
    }));
  }

  async runHealthCheck() {
    await this.runHealthChecks();
    return this.getProviderStatus();
  }
}

// Export singleton instance
export const aiProviderManager = new AIProviderManager();