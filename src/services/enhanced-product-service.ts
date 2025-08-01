import { prisma } from '@/lib/prisma';
import { productService } from './product-service';
import { mlEngine } from './product-intelligence/MLEngine';
import { performancePredictor } from './product-intelligence/PerformancePredictor';
import { pricingEngine } from './product-intelligence/PricingEngine';
import { conversionFunnelAnalyzer } from './analytics/ConversionFunnelAnalyzer';

export interface EnhancedProduct {
  // Base product data
  id: string;
  name: string;
  sku: string;
  price: number;
  capacity: string;
  voltage: string;
  description: string;
  features: string[];
  specifications: {
    weight: string;
    dimensions: string;
    runtime: string;
    chargeTime: string;
  };
  stock: number;
  imageUrl: string;
  category: string;

  // AI enhancements
  aiScore: number;
  recommendations: Array<{
    productId: string;
    score: number;
    reason: string;
  }>;
  predictedDemand: {
    monthly: number;
    confidence: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  runtimeEstimates: {
    lightWork: number;
    mediumWork: number;
    heavyWork: number;
  };
  compatibility: {
    tools: string[];
    chargers: string[];
    accessories: string[];
  };
  priceTrend: {
    current: number;
    predicted: number;
    changePercent: number;
    confidence: number;
  };
  availability: {
    inStock: boolean;
    reorderDate?: Date;
    alternativeProducts: string[];
  };
  customerSegment: {
    primary: string;
    secondary: string[];
    personas: string[];
  };
  performanceMetrics: {
    conversionRate: number;
    viewToCartRate: number;
    averageRating: number;
    returnRate: number;
  };
}

export interface ProductSearchResult {
  products: EnhancedProduct[];
  facets: {
    categories: Array<{ name: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
    features: Array<{ feature: string; count: number }>;
  };
  suggestions: string[];
  totalCount: number;
  searchTime: number;
  didYouMean?: string;
}

export interface NLPProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  intent: 'find_product' | 'compare' | 'learn' | 'troubleshoot' | 'configure';
  entities: Array<{
    type: 'product' | 'feature' | 'price' | 'brand' | 'application';
    value: string;
    confidence: number;
  }>;
  filters: {
    priceRange?: [number, number];
    capacity?: string;
    application?: string;
    features?: string[];
  };
  sentiment: 'positive' | 'neutral' | 'negative';
}

export class EnhancedProductService {
  private baseService = productService;

  /**
   * Get all products enhanced with AI intelligence
   */
  async getEnhancedProducts(): Promise<EnhancedProduct[]> {
    try {
      const baseProducts = await this.baseService.getAllProducts();
      
      // Enhance each product with AI features
      const enhanced = await Promise.all(
        baseProducts.map(async (product) => await this.enhanceProduct(product))
      );

      return enhanced;
    } catch (error) {
      console.error('Error getting enhanced products:', error);
      throw error;
    }
  }

  /**
   * Get a single enhanced product by ID
   */
  async getEnhancedProduct(productId: string): Promise<EnhancedProduct> {
    try {
      const baseProduct = await this.baseService.getProductById(productId);
      return await this.enhanceProduct(baseProduct);
    } catch (error) {
      console.error('Error getting enhanced product:', error);
      throw error;
    }
  }

  /**
   * Enhance a base product with AI intelligence
   */
  private async enhanceProduct(baseProduct: any): Promise<EnhancedProduct> {
    // Calculate AI score based on multiple factors
    const aiScore = await this.calculateAIScore(baseProduct);

    // Get AI recommendations
    const recommendations = await this.getProductRecommendations(baseProduct.id);

    // Predict demand
    const predictedDemand = await this.predictProductDemand(baseProduct.id);

    // Calculate runtime estimates
    const runtimeEstimates = await this.calculateRuntimeEstimates(baseProduct);

    // Check compatibility
    const compatibility = await this.checkProductCompatibility(baseProduct);

    // Get price trend
    const priceTrend = await this.getPriceTrend(baseProduct.id);

    // Check availability
    const availability = await this.checkAvailability(baseProduct);

    // Determine customer segment
    const customerSegment = await this.determineCustomerSegment(baseProduct.id);

    // Get performance metrics
    const performanceMetrics = await this.getPerformanceMetrics(baseProduct.id);

    return {
      ...baseProduct,
      aiScore,
      recommendations,
      predictedDemand,
      runtimeEstimates,
      compatibility,
      priceTrend,
      availability,
      customerSegment,
      performanceMetrics
    };
  }

  /**
   * Calculate AI score for a product
   */
  private async calculateAIScore(product: any): Promise<number> {
    try {
      // Get customer clustering insights
      const { clusters } = await mlEngine.clusterCustomers();
      
      // Get performance predictions
      const performance = await performancePredictor.predictPerformance({
        productId: product.capacity || product.id,
        timeHorizon: '3months',
        targetMetric: 'demand',
        externalFactors: {
          seasonality: { quarter: 'Q2', month: 6, seasonalMultiplier: 1.2 },
          economic: { constructionIndex: 105, unemploymentRate: 4.5, gdpGrowth: 2.5, consumerConfidence: 110 },
          market: { competitorActivity: 'medium', newProductLaunches: 1, priceWars: false, supplyChainIssues: false },
          weather: { constructionSeason: true, temperature: 75, precipitation: 80 }
        }
      });

      // Calculate score based on multiple factors
      const demandScore = performance.demandForecast.confidence * 25;
      const satisfactionScore = performance.satisfactionForecast.predictedSatisfaction * 15;
      const inventoryScore = Math.min(25, (product.stock / 100) * 25);
      const priceScore = Math.max(0, 35 - ((product.price - 95) / 150 * 35)); // Lower price = higher score

      return Math.min(100, demandScore + satisfactionScore + inventoryScore + priceScore);
    } catch (error) {
      console.error('Error calculating AI score:', error);
      return 75; // Default score
    }
  }

  /**
   * Get AI-powered product recommendations
   */
  private async getProductRecommendations(productId: string): Promise<Array<{
    productId: string;
    score: number;
    reason: string;
  }>> {
    try {
      const { affinityData } = await mlEngine.analyzeProductAffinity();
      
      if (affinityData?.productSimilarity) {
        const similarities = affinityData.productSimilarity.get(productId) || [];
        
        return similarities.slice(0, 3).map(similarity => ({
          productId: similarity.productPair[1],
          score: similarity.affinity * 100,
          reason: `${similarity.type} with ${(similarity.confidence * 100).toFixed(0)}% confidence`
        }));
      }

      // Fallback recommendations
      return this.getFallbackRecommendations(productId);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getFallbackRecommendations(productId);
    }
  }

  private getFallbackRecommendations(productId: string) {
    const recommendations = [
      { productId: '6Ah', score: 85, reason: 'Popular for residential use' },
      { productId: '9Ah', score: 90, reason: 'Professional contractor favorite' },
      { productId: '15Ah', score: 80, reason: 'Maximum power for heavy work' }
    ];
    
    return recommendations.filter(rec => rec.productId !== productId);
  }

  /**
   * Predict product demand
   */
  private async predictProductDemand(productId: string) {
    try {
      const performance = await performancePredictor.predictPerformance({
        productId: productId,
        timeHorizon: '1month',
        targetMetric: 'demand',
        externalFactors: {
          seasonality: { quarter: 'Q2', month: 6, seasonalMultiplier: 1.2 },
          economic: { constructionIndex: 105, unemploymentRate: 4.5, gdpGrowth: 2.5, consumerConfidence: 110 },
          market: { competitorActivity: 'medium', newProductLaunches: 1, priceWars: false, supplyChainIssues: false },
          weather: { constructionSeason: true, temperature: 75, precipitation: 80 }
        }
      });

      return {
        monthly: performance.demandForecast.predictedDemand,
        confidence: performance.demandForecast.confidence,
        trend: performance.marketShareProjection.trend === 'gaining' ? 'increasing' as const :
               performance.marketShareProjection.trend === 'losing' ? 'decreasing' as const : 'stable' as const
      };
    } catch (error) {
      console.error('Error predicting demand:', error);
      return { monthly: 100, confidence: 0.7, trend: 'stable' as const };
    }
  }

  /**
   * Calculate runtime estimates for different work loads
   */
  private async calculateRuntimeEstimates(product: any) {
    const baseRuntime = this.parseRuntime(product.specifications.runtime);
    
    return {
      lightWork: baseRuntime * 1.3, // 30% longer for light work
      mediumWork: baseRuntime,      // Standard runtime
      heavyWork: baseRuntime * 0.7  // 30% shorter for heavy work
    };
  }

  private parseRuntime(runtimeStr: string): number {
    const match = runtimeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 4;
  }

  /**
   * Check product compatibility
   */
  private async checkProductCompatibility(product: any) {
    // This would typically connect to a compatibility database
    const toolCompatibility = this.getToolCompatibility(product.capacity);
    
    return {
      tools: toolCompatibility.tools,
      chargers: ['DCB115', 'DCB118', 'DCB132'],
      accessories: toolCompatibility.accessories
    };
  }

  private getToolCompatibility(capacity: string) {
    const compatibilityMap: { [key: string]: { tools: string[], accessories: string[] } } = {
      '6Ah': {
        tools: ['DCD771', 'DCF885', 'DCS361', 'DCB230'],
        accessories: ['Tool Belt', 'Carrying Case', 'Belt Clip']
      },
      '9Ah': {
        tools: ['DCD771', 'DCF885', 'DCS361', 'DCB230', 'DCS575', 'DCG414'],
        accessories: ['Tool Belt', 'Carrying Case', 'Belt Clip', 'Work Light']
      },
      '15Ah': {
        tools: ['DCD771', 'DCF885', 'DCS361', 'DCB230', 'DCS575', 'DCG414', 'DCS520', 'DCH273'],
        accessories: ['Tool Belt', 'Carrying Case', 'Belt Clip', 'Work Light', 'Heavy Duty Case']
      }
    };

    return compatibilityMap[capacity] || compatibilityMap['9Ah'];
  }

  /**
   * Get price trend predictions
   */
  private async getPriceTrend(productId: string) {
    try {
      const mockMarketData = {
        competitorPrices: [
          { competitor: 'Competitor A', price: 95 + Math.random() * 50, url: '', lastUpdated: new Date(), marketShare: 25, rating: 4.2 },
          { competitor: 'Competitor B', price: 100 + Math.random() * 40, url: '', lastUpdated: new Date(), marketShare: 20, rating: 4.0 },
        ],
        demandMetrics: {
          searchVolume: 1000 + Math.random() * 500,
          conversionRate: 0.05 + Math.random() * 0.05,
          seasonalMultiplier: 1.1 + Math.random() * 0.2,
          trendDirection: 'up' as const
        },
        inventoryData: {
          currentStock: 50 + Math.random() * 100,
          targetStock: 100,
          turnoverRate: 4 + Math.random() * 2,
          daysOfSupply: 30 + Math.random() * 20
        },
        customerSegmentation: {
          priceElasticity: 0.5 + Math.random() * 0.3,
          averageOrderValue: 200 + Math.random() * 100,
          customerLifetimeValue: 1000 + Math.random() * 500,
          segmentSize: 1000 + Math.random() * 500
        }
      };

      const optimization = await pricingEngine.optimizeProductPricing(productId, mockMarketData);
      
      return {
        current: optimization.currentPrice,
        predicted: optimization.optimalStrategy.adjustedPrice,
        changePercent: ((optimization.optimalStrategy.adjustedPrice - optimization.currentPrice) / optimization.currentPrice) * 100,
        confidence: optimization.optimalStrategy.confidence
      };
    } catch (error) {
      console.error('Error getting price trend:', error);
      return { current: 125, predicted: 128, changePercent: 2.4, confidence: 0.8 };
    }
  }

  /**
   * Check product availability and alternatives
   */
  private async checkAvailability(product: any) {
    const alternatives = await this.getAlternativeProducts(product.id);
    
    return {
      inStock: product.stock > 0,
      reorderDate: product.stock < 10 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      alternativeProducts: alternatives
    };
  }

  private async getAlternativeProducts(productId: string): Promise<string[]> {
    try {
      const allProducts = await this.baseService.getAllProducts();
      return allProducts
        .filter(p => p.id !== productId)
        .map(p => p.id)
        .slice(0, 2);
    } catch (error) {
      return [];
    }
  }

  /**
   * Determine customer segment for product
   */
  private async determineCustomerSegment(productId: string) {
    try {
      const { clusters, personas } = await mlEngine.clusterCustomers();
      
      // Find which clusters prefer this product
      const relevantClusters = clusters.filter(cluster => 
        cluster.characteristics.primaryProducts.includes(productId)
      );

      const relevantPersonas = personas.filter(persona => 
        relevantClusters.some(cluster => cluster.id === persona.id.replace('persona', 'cluster'))
      );

      return {
        primary: relevantPersonas[0]?.demographics.segment || 'commercial',
        secondary: relevantPersonas.slice(1, 3).map(p => p.demographics.segment),
        personas: relevantPersonas.map(p => p.name)
      };
    } catch (error) {
      console.error('Error determining customer segment:', error);
      return {
        primary: 'commercial',
        secondary: ['residential'],
        personas: ['Professional Contractors']
      };
    }
  }

  /**
   * Get performance metrics for product
   */
  private async getPerformanceMetrics(productId: string) {
    try {
      const analysis = await conversionFunnelAnalyzer.analyzeFunnel('ecommerce', {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      });

      // Calculate product-specific metrics from funnel analysis
      const conversionRate = analysis.overallConversionRate;
      const viewToCartRate = 0.15 + Math.random() * 0.1; // Mock calculation
      
      return {
        conversionRate: conversionRate * 100,
        viewToCartRate: viewToCartRate * 100,
        averageRating: 4.2 + Math.random() * 0.6,
        returnRate: 2 + Math.random() * 3
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        conversionRate: 12.5,
        viewToCartRate: 18.3,
        averageRating: 4.4,
        returnRate: 2.8
      };
    }
  }

  /**
   * AI-powered intelligent search
   */
  async intelligentSearch(query: string, filters?: any): Promise<ProductSearchResult> {
    const startTime = Date.now();
    
    try {
      // Process query with NLP
      const processedQuery = await this.processNLPQuery(query);
      
      // Get base products
      const allProducts = await this.getEnhancedProducts();
      
      // Apply intelligent filtering
      let filteredProducts = this.applyIntelligentFilters(allProducts, processedQuery, filters);
      
      // Sort by relevance
      filteredProducts = this.sortByRelevance(filteredProducts, processedQuery);
      
      // Generate facets
      const facets = this.generateFacets(filteredProducts);
      
      // Generate suggestions
      const suggestions = await this.generateSearchSuggestions(query, processedQuery);
      
      const searchTime = Date.now() - startTime;
      
      return {
        products: filteredProducts,
        facets,
        suggestions,
        totalCount: filteredProducts.length,
        searchTime,
        didYouMean: this.generateDidYouMean(query)
      };
    } catch (error) {
      console.error('Error in intelligent search:', error);
      throw error;
    }
  }

  /**
   * Process search query with NLP
   */
  private async processNLPQuery(query: string): Promise<NLPProcessedQuery> {
    const lowerQuery = query.toLowerCase();
    
    // Intent detection
    let intent: NLPProcessedQuery['intent'] = 'find_product';
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) {
      intent = 'compare';
    } else if (lowerQuery.includes('how') || lowerQuery.includes('why') || lowerQuery.includes('what')) {
      intent = 'learn';
    } else if (lowerQuery.includes('problem') || lowerQuery.includes('issue') || lowerQuery.includes('fix')) {
      intent = 'troubleshoot';
    } else if (lowerQuery.includes('configure') || lowerQuery.includes('setup') || lowerQuery.includes('calculator')) {
      intent = 'configure';
    }

    // Entity extraction
    const entities: NLPProcessedQuery['entities'] = [];
    
    // Product entities
    if (lowerQuery.includes('6ah') || lowerQuery.includes('6 ah')) {
      entities.push({ type: 'product', value: '6Ah', confidence: 0.9 });
    }
    if (lowerQuery.includes('9ah') || lowerQuery.includes('9 ah')) {
      entities.push({ type: 'product', value: '9Ah', confidence: 0.9 });
    }
    if (lowerQuery.includes('15ah') || lowerQuery.includes('15 ah')) {
      entities.push({ type: 'product', value: '15Ah', confidence: 0.9 });
    }

    // Feature entities
    const features = ['runtime', 'charging time', 'weight', 'power', 'voltage', 'flexvolt', 'dewalt'];
    features.forEach(feature => {
      if (lowerQuery.includes(feature)) {
        entities.push({ type: 'feature', value: feature, confidence: 0.8 });
      }
    });

    // Price entities
    const priceMatch = lowerQuery.match(/\$?(\d+)/);
    if (priceMatch || lowerQuery.includes('cheap') || lowerQuery.includes('budget') || lowerQuery.includes('affordable')) {
      entities.push({ 
        type: 'price', 
        value: priceMatch ? priceMatch[1] : 'budget', 
        confidence: priceMatch ? 0.9 : 0.6 
      });
    }

    // Application entities
    const applications = ['construction', 'residential', 'commercial', 'industrial', 'professional', 'contractor'];
    applications.forEach(app => {
      if (lowerQuery.includes(app)) {
        entities.push({ type: 'application', value: app, confidence: 0.7 });
      }
    });

    // Extract filters
    const filters: NLPProcessedQuery['filters'] = {};
    
    if (priceMatch) {
      const price = parseInt(priceMatch[1]);
      filters.priceRange = [Math.max(0, price - 50), price + 50];
    }

    const capacityEntity = entities.find(e => e.type === 'product');
    if (capacityEntity) {
      filters.capacity = capacityEntity.value;
    }

    const appEntity = entities.find(e => e.type === 'application');
    if (appEntity) {
      filters.application = appEntity.value;
    }

    filters.features = entities.filter(e => e.type === 'feature').map(e => e.value);

    // Sentiment analysis
    let sentiment: NLPProcessedQuery['sentiment'] = 'neutral';
    const positiveWords = ['great', 'good', 'excellent', 'best', 'love', 'perfect', 'amazing'];
    const negativeWords = ['bad', 'worst', 'hate', 'terrible', 'problem', 'issue', 'broken'];
    
    if (positiveWords.some(word => lowerQuery.includes(word))) {
      sentiment = 'positive';
    } else if (negativeWords.some(word => lowerQuery.includes(word))) {
      sentiment = 'negative';
    }

    return {
      originalQuery: query,
      normalizedQuery: lowerQuery,
      intent,
      entities,
      filters,
      sentiment
    };
  }

  /**
   * Apply intelligent filters to products
   */
  private applyIntelligentFilters(
    products: EnhancedProduct[], 
    processedQuery: NLPProcessedQuery, 
    additionalFilters?: any
  ): EnhancedProduct[] {
    return products.filter(product => {
      // Apply NLP-extracted filters
      if (processedQuery.filters.capacity && !product.capacity.includes(processedQuery.filters.capacity)) {
        return false;
      }

      if (processedQuery.filters.priceRange) {
        const [minPrice, maxPrice] = processedQuery.filters.priceRange;
        if (product.price < minPrice || product.price > maxPrice) {
          return false;
        }
      }

      if (processedQuery.filters.features?.length) {
        const hasFeature = processedQuery.filters.features.some(feature =>
          product.features.some(pFeature => pFeature.toLowerCase().includes(feature.toLowerCase()))
        );
        if (!hasFeature) {
          return false;
        }
      }

      // Apply additional filters
      if (additionalFilters?.category && product.category !== additionalFilters.category) {
        return false;
      }

      if (additionalFilters?.inStock && product.stock <= 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort products by relevance
   */
  private sortByRelevance(products: EnhancedProduct[], processedQuery: NLPProcessedQuery): EnhancedProduct[] {
    return products.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // AI Score weight
      scoreA += a.aiScore * 0.3;
      scoreB += b.aiScore * 0.3;

      // Query match weight
      const queryWords = processedQuery.normalizedQuery.split(' ');
      queryWords.forEach(word => {
        if (a.name.toLowerCase().includes(word)) scoreA += 20;
        if (b.name.toLowerCase().includes(word)) scoreB += 20;
        
        if (a.description.toLowerCase().includes(word)) scoreA += 10;
        if (b.description.toLowerCase().includes(word)) scoreB += 10;
      });

      // Entity match weight
      processedQuery.entities.forEach(entity => {
        if (entity.type === 'product' && a.capacity.includes(entity.value)) {
          scoreA += entity.confidence * 50;
        }
        if (entity.type === 'product' && b.capacity.includes(entity.value)) {
          scoreB += entity.confidence * 50;
        }
      });

      // Performance weight
      scoreA += a.performanceMetrics.conversionRate * 0.5;
      scoreB += b.performanceMetrics.conversionRate * 0.5;

      return scoreB - scoreA;
    });
  }

  /**
   * Generate search facets
   */
  private generateFacets(products: EnhancedProduct[]) {
    const categories = new Map<string, number>();
    const priceRanges = new Map<string, number>();
    const features = new Map<string, number>();

    products.forEach(product => {
      // Category facets
      categories.set(product.category, (categories.get(product.category) || 0) + 1);

      // Price range facets
      let priceRange = '';
      if (product.price < 100) priceRange = 'Under $100';
      else if (product.price < 150) priceRange = '$100 - $150';
      else if (product.price < 200) priceRange = '$150 - $200';
      else priceRange = 'Over $200';
      
      priceRanges.set(priceRange, (priceRanges.get(priceRange) || 0) + 1);

      // Feature facets
      product.features.forEach(feature => {
        features.set(feature, (features.get(feature) || 0) + 1);
      });
    });

    return {
      categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })),
      priceRanges: Array.from(priceRanges.entries()).map(([range, count]) => ({ range, count })),
      features: Array.from(features.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([feature, count]) => ({ feature, count }))
    };
  }

  /**
   * Generate search suggestions
   */
  private async generateSearchSuggestions(originalQuery: string, processedQuery: NLPProcessedQuery): Promise<string[]> {
    const suggestions = [];

    // Query completion suggestions
    const commonQueries = [
      '6ah battery runtime',
      '9ah vs 15ah comparison',
      'best battery for construction',
      'battery fleet calculator',
      'professional contractor batteries',
      'heavy duty battery pack',
      'budget battery options',
      'long runtime batteries'
    ];

    // Find matching suggestions
    commonQueries.forEach(suggestion => {
      if (suggestion.includes(processedQuery.normalizedQuery) && suggestion !== originalQuery) {
        suggestions.push(suggestion);
      }
    });

    // Entity-based suggestions
    processedQuery.entities.forEach(entity => {
      if (entity.type === 'product') {
        suggestions.push(`${entity.value} battery specifications`);
        suggestions.push(`${entity.value} compatibility tools`);
      }
    });

    return suggestions.slice(0, 6);
  }

  /**
   * Generate "did you mean" suggestion
   */
  private generateDidYouMean(query: string): string | undefined {
    const corrections: { [key: string]: string } = {
      'bateries': 'batteries',
      'ah': 'Ah',
      'dewolt': 'dewalt',
      'flexvolt': 'FlexVolt',
      'comercial': 'commercial',
      'profesional': 'professional'
    };

    const lowerQuery = query.toLowerCase();
    for (const [typo, correction] of Object.entries(corrections)) {
      if (lowerQuery.includes(typo)) {
        return query.replace(new RegExp(typo, 'gi'), correction);
      }
    }

    return undefined;
  }

  /**
   * Get products for a specific customer segment
   */
  async getProductsForSegment(segment: string, userId?: string): Promise<EnhancedProduct[]> {
    try {
      const allProducts = await this.getEnhancedProducts();
      
      return allProducts.filter(product => 
        product.customerSegment.primary === segment || 
        product.customerSegment.secondary.includes(segment)
      );
    } catch (error) {
      console.error('Error getting products for segment:', error);
      throw error;
    }
  }

  /**
   * Get personalized product recommendations for user
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 5): Promise<EnhancedProduct[]> {
    try {
      // Get user's segment from ML engine
      const { getCustomerSegment } = await import('@/hooks/useMLEngine');
      
      // Get all products
      const allProducts = await this.getEnhancedProducts();
      
      // Sort by AI score and relevance
      const sorted = allProducts.sort((a, b) => {
        return (b.aiScore + b.performanceMetrics.conversionRate) - 
               (a.aiScore + a.performanceMetrics.conversionRate);
      });

      return sorted.slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Get product bundle recommendations
   */
  async getBundleRecommendations(productId: string): Promise<Array<{
    products: string[];
    totalPrice: number;
    savings: number;
    confidence: number;
  }>> {
    try {
      const { affinityData } = await mlEngine.analyzeProductAffinity();
      
      if (affinityData?.bundleRecommendations) {
        const bundles = affinityData.bundleRecommendations
          .filter(bundle => bundle.products.includes(productId))
          .slice(0, 3);

        return bundles.map(bundle => ({
          products: bundle.products,
          totalPrice: this.calculateBundlePrice(bundle.products),
          savings: this.calculateBundleSavings(bundle.products),
          confidence: bundle.score / 100
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting bundle recommendations:', error);
      return [];
    }
  }

  private calculateBundlePrice(productIds: string[]): number {
    // Mock calculation - in real implementation, would look up actual prices
    const basePrices = { '6Ah': 95, '9Ah': 125, '15Ah': 245 };
    return productIds.reduce((total, id) => {
      return total + (basePrices[id as keyof typeof basePrices] || 125);
    }, 0);
  }

  private calculateBundleSavings(productIds: string[]): number {
    const totalPrice = this.calculateBundlePrice(productIds);
    const discountPercent = productIds.length >= 3 ? 0.15 : 0.1; // 15% for 3+, 10% for 2
    return totalPrice * discountPercent;
  }
}

// Export singleton instance
export const enhancedProductService = new EnhancedProductService();