import { UserProfile, DeviceInfo, InterestCategory } from './types';

export class UserProfileGenerator {
  // Name data
  private firstNames = {
    male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Charles', 'Thomas'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen']
  };
  
  private lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  // Business types
  private businessTypes = [
    { type: 'construction', weight: 0.35 },
    { type: 'automotive', weight: 0.20 },
    { type: 'home_improvement', weight: 0.15 },
    { type: 'landscaping', weight: 0.10 },
    { type: 'electrical', weight: 0.10 },
    { type: 'plumbing', weight: 0.05 },
    { type: 'diy_enthusiast', weight: 0.05 }
  ];
  
  // Interest categories with weights
  private interestCategories: Record<InterestCategory, string[]> = {
    'power_tools': ['milwaukee_tools', 'dewalt', 'makita', 'tool_reviews', 'tool_deals'],
    'construction': ['concrete_work', 'framing', 'roofing', 'general_contracting', 'building_materials'],
    'automotive': ['car_repair', 'auto_detailing', 'classic_cars', 'car_maintenance', 'racing'],
    'home_improvement': ['diy_projects', 'home_renovation', 'woodworking', 'home_repair', 'interior_design'],
    'outdoor': ['camping', 'hiking', 'fishing', 'hunting', 'outdoor_gear'],
    'technology': ['smart_home', 'gadgets', 'electronics', 'computers', 'mobile_devices'],
    'business': ['entrepreneurship', 'small_business', 'b2b_sales', 'business_growth', 'marketing'],
    'sustainability': ['renewable_energy', 'solar_power', 'green_building', 'eco_friendly', 'recycling']
  };
  
  // Location data
  private cities = [
    { city: 'Los Angeles', state: 'CA', zip: '90001' },
    { city: 'Houston', state: 'TX', zip: '77001' },
    { city: 'Miami', state: 'FL', zip: '33101' },
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Philadelphia', state: 'PA', zip: '19019' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Columbus', state: 'OH', zip: '43201' },
    { city: 'Atlanta', state: 'GA', zip: '30301' },
    { city: 'Charlotte', state: 'NC', zip: '28201' },
    { city: 'Detroit', state: 'MI', zip: '48201' }
  ];
  
  // Device profiles
  private deviceProfiles = [
    { type: 'desktop', os: 'Windows', weight: 0.45 },
    { type: 'desktop', os: 'macOS', weight: 0.15 },
    { type: 'mobile', os: 'iOS', weight: 0.20 },
    { type: 'mobile', os: 'Android', weight: 0.15 },
    { type: 'tablet', os: 'iOS', weight: 0.03 },
    { type: 'tablet', os: 'Android', weight: 0.02 }
  ];

  generateUser(): UserProfile {
    const gender = Math.random() < 0.7 ? 'male' : 'female'; // 70% male for this industry
    const age = this.generateAge();
    const businessType = this.selectWeighted(this.businessTypes);
    const location = this.cities[Math.floor(Math.random() * this.cities.length)];
    const device = this.generateDevice();
    
    const user: UserProfile = {
      id: this.generateUserId(),
      email: this.generateEmail(),
      phone: this.generatePhone(),
      demographics: {
        age,
        gender,
        firstName: this.selectRandom(this.firstNames[gender]),
        lastName: this.selectRandom(this.lastNames),
        dateOfBirth: this.generateDateOfBirth(age),
        income: this.generateIncome(businessType),
        education: this.generateEducation(),
        occupation: this.generateOccupation(businessType),
        maritalStatus: this.generateMaritalStatus(age),
        householdSize: Math.floor(Math.random() * 4) + 1,
        homeOwnership: Math.random() < 0.65 ? 'own' : 'rent',
        language: 'en',
        ethnicity: this.generateEthnicity()
      },
      location: {
        city: location.city,
        state: location.state,
        zip: location.zip,
        country: 'US',
        dma: this.generateDMA(location.state),
        latitude: this.generateLatitude(),
        longitude: this.generateLongitude(),
        timezone: this.getTimezone(location.state)
      },
      interests: this.generateInterests(businessType),
      behaviorPatterns: {
        purchaseFrequency: this.generatePurchaseFrequency(businessType),
        averageOrderValue: this.generateAverageOrderValue(businessType),
        preferredCategories: this.generatePreferredCategories(businessType),
        brandAffinity: this.generateBrandAffinity(),
        priceRangePreference: this.generatePriceRange(businessType),
        seasonalPatterns: this.generateSeasonalPatterns(businessType),
        channelPreference: Math.random() < 0.7 ? 'online' : 'hybrid',
        deviceUsagePatterns: this.generateDeviceUsagePatterns(device),
        contentPreferences: this.generateContentPreferences(),
        socialMediaUsage: this.generateSocialMediaUsage(age),
        influencerFollowing: Math.random() < 0.3,
        reviewReading: Math.random() < 0.8,
        loyaltyProgramMember: Math.random() < 0.4,
        referralSource: this.generateReferralSource(),
        lastVisit: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
        visitFrequency: Math.floor(Math.random() * 10) + 1,
        pageViewsPerSession: Math.floor(Math.random() * 20) + 3,
        averageSessionDuration: Math.floor(Math.random() * 600) + 60,
        bounceRate: Math.random() * 0.5,
        cartAbandonmentRate: Math.random() * 0.7
      },
      device,
      purchaseHistory: this.generatePurchaseHistory(businessType),
      engagementScore: Math.random(),
      lifecycleStage: this.generateLifecycleStage(),
      customerValue: this.generateCustomerValue(businessType),
      propensityScores: {
        purchasePropensity: Math.random(),
        churnRisk: Math.random() * 0.3,
        upsellPotential: Math.random(),
        referralLikelihood: Math.random()
      },
      customAudiences: this.generateCustomAudiences(businessType),
      conversionHistory: [],
      lastTouchpoint: this.generateLastTouchpoint(),
      acquisitionSource: this.generateAcquisitionSource(),
      customerType: Math.random() < 0.8 ? 'b2b' : 'b2c',
      businessType,
      companySize: this.generateCompanySize(businessType),
      industry: this.generateIndustry(businessType),
      jobFunction: this.generateJobFunction(businessType),
      decisionMakingRole: Math.random() < 0.6,
      budgetAuthority: Math.random() < 0.4,
      purchaseTimeframe: this.generatePurchaseTimeframe(),
      projectType: this.generateProjectType(businessType),
      competitorUsage: this.generateCompetitorUsage(),
      painPoints: this.generatePainPoints(businessType),
      productInterests: this.generateProductInterests(businessType),
      communicationPreferences: {
        email: Math.random() < 0.8,
        sms: Math.random() < 0.3,
        phone: Math.random() < 0.2,
        push: Math.random() < 0.4
      },
      marketingConsent: {
        email: Math.random() < 0.7,
        sms: Math.random() < 0.2,
        phone: Math.random() < 0.1,
        retargeting: Math.random() < 0.8
      }
    };
    
    return user;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEmail(): string {
    const providers = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com'];
    const username = `user${Math.floor(Math.random() * 100000)}`;
    const provider = this.selectRandom(providers);
    return `${username}@${provider}`;
  }

  private generatePhone(): string {
    const areaCodes = ['212', '310', '415', '312', '713', '404', '305', '215', '617', '202'];
    const areaCode = this.selectRandom(areaCodes);
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `${areaCode}${prefix}${lineNumber}`;
  }

  private generateAge(): number {
    // Weighted age distribution for tool buyers
    const ageRanges = [
      { min: 18, max: 24, weight: 0.10 },
      { min: 25, max: 34, weight: 0.25 },
      { min: 35, max: 44, weight: 0.30 },
      { min: 45, max: 54, weight: 0.20 },
      { min: 55, max: 64, weight: 0.10 },
      { min: 65, max: 75, weight: 0.05 }
    ];
    
    const range = this.selectWeighted(ageRanges);
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  private generateDateOfBirth(age: number): string {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  private generateIncome(businessType: string): string {
    const incomeRanges = {
      'construction': ['50k-75k', '75k-100k', '100k-150k'],
      'automotive': ['40k-60k', '60k-80k', '80k-100k'],
      'home_improvement': ['60k-80k', '80k-100k', '100k-150k'],
      'landscaping': ['35k-50k', '50k-75k', '75k-100k'],
      'electrical': ['60k-80k', '80k-100k', '100k-150k'],
      'plumbing': ['50k-75k', '75k-100k', '100k-125k'],
      'diy_enthusiast': ['40k-60k', '60k-80k', '80k-120k']
    };
    
    const ranges = incomeRanges[businessType] || ['50k-75k', '75k-100k'];
    return this.selectRandom(ranges);
  }

  private generateEducation(): string {
    const levels = [
      { level: 'high_school', weight: 0.30 },
      { level: 'some_college', weight: 0.25 },
      { level: 'associates', weight: 0.15 },
      { level: 'bachelors', weight: 0.20 },
      { level: 'masters', weight: 0.08 },
      { level: 'doctorate', weight: 0.02 }
    ];
    
    return this.selectWeighted(levels);
  }

  private generateOccupation(businessType: string): string {
    const occupations: Record<string, string[]> = {
      'construction': ['General Contractor', 'Construction Manager', 'Carpenter', 'Electrician', 'Mason'],
      'automotive': ['Mechanic', 'Auto Technician', 'Shop Owner', 'Service Manager', 'Parts Manager'],
      'home_improvement': ['Handyman', 'Remodeler', 'Interior Designer', 'Property Manager', 'Contractor'],
      'landscaping': ['Landscaper', 'Lawn Care Specialist', 'Arborist', 'Garden Designer', 'Irrigation Specialist'],
      'electrical': ['Master Electrician', 'Electrical Contractor', 'Journeyman Electrician', 'Electrical Engineer'],
      'plumbing': ['Master Plumber', 'Plumbing Contractor', 'Pipefitter', 'Service Plumber'],
      'diy_enthusiast': ['Hobbyist', 'Homeowner', 'Maker', 'Craftsperson', 'Weekend Warrior']
    };
    
    const options = occupations[businessType] || ['Professional'];
    return this.selectRandom(options);
  }

  private generateMaritalStatus(age: number): string {
    if (age < 25) {
      return Math.random() < 0.8 ? 'single' : 'married';
    } else if (age < 35) {
      return Math.random() < 0.5 ? 'single' : 'married';
    } else {
      const statuses = ['married', 'single', 'divorced', 'widowed'];
      const weights = [0.6, 0.2, 0.15, 0.05];
      return this.selectWeighted(statuses.map((s, i) => ({ value: s, weight: weights[i] })));
    }
  }

  private generateEthnicity(): string {
    const ethnicities = [
      { value: 'caucasian', weight: 0.60 },
      { value: 'hispanic', weight: 0.18 },
      { value: 'african_american', weight: 0.13 },
      { value: 'asian', weight: 0.06 },
      { value: 'other', weight: 0.03 }
    ];
    
    return this.selectWeighted(ethnicities);
  }

  private generateDMA(state: string): string {
    const dmaMap: Record<string, string> = {
      'CA': '803', // Los Angeles
      'TX': '618', // Houston
      'FL': '528', // Miami
      'NY': '501', // New York
      'PA': '504', // Philadelphia
      'IL': '602', // Chicago
      'OH': '535', // Columbus
      'GA': '524', // Atlanta
      'NC': '517', // Charlotte
      'MI': '505'  // Detroit
    };
    
    return dmaMap[state] || '501';
  }

  private generateLatitude(): number {
    // US latitude range
    return 25 + Math.random() * 24;
  }

  private generateLongitude(): number {
    // US longitude range
    return -125 + Math.random() * 55;
  }

  private getTimezone(state: string): string {
    const timezones: Record<string, string> = {
      'CA': 'America/Los_Angeles',
      'TX': 'America/Chicago',
      'FL': 'America/New_York',
      'NY': 'America/New_York',
      'PA': 'America/New_York',
      'IL': 'America/Chicago',
      'OH': 'America/New_York',
      'GA': 'America/New_York',
      'NC': 'America/New_York',
      'MI': 'America/Detroit'
    };
    
    return timezones[state] || 'America/New_York';
  }

  private generateDevice(): DeviceInfo {
    const deviceProfile = this.selectWeighted(this.deviceProfiles);
    
    return {
      type: deviceProfile.type as 'desktop' | 'mobile' | 'tablet',
      os: deviceProfile.os,
      model: this.generateDeviceModel(deviceProfile.type, deviceProfile.os),
      manufacturer: this.getManufacturer(deviceProfile.os),
      browser: '',
      browserVersion: ''
    };
  }

  private generateDeviceModel(type: string, os: string): string {
    const models: Record<string, string[]> = {
      'desktop_Windows': ['Desktop PC', 'Laptop', 'Workstation'],
      'desktop_macOS': ['MacBook Pro', 'MacBook Air', 'iMac', 'Mac mini'],
      'mobile_iOS': ['iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone SE'],
      'mobile_Android': ['Samsung Galaxy S23', 'Google Pixel 7', 'OnePlus 11', 'Motorola Edge'],
      'tablet_iOS': ['iPad Pro', 'iPad Air', 'iPad', 'iPad mini'],
      'tablet_Android': ['Samsung Galaxy Tab S8', 'Google Pixel Tablet', 'Amazon Fire HD']
    };
    
    const key = `${type}_${os}`;
    const options = models[key] || ['Generic Device'];
    return this.selectRandom(options);
  }

  private getManufacturer(os: string): string {
    const manufacturers: Record<string, string> = {
      'Windows': 'Microsoft',
      'macOS': 'Apple',
      'iOS': 'Apple',
      'Android': 'Google'
    };
    
    return manufacturers[os] || 'Unknown';
  }

  private generateInterests(businessType: string): string[] {
    const interests: string[] = [];
    
    // Primary interests based on business type
    const primaryCategories: Record<string, InterestCategory[]> = {
      'construction': ['power_tools', 'construction', 'business'],
      'automotive': ['power_tools', 'automotive', 'technology'],
      'home_improvement': ['power_tools', 'home_improvement', 'outdoor'],
      'landscaping': ['power_tools', 'outdoor', 'business'],
      'electrical': ['power_tools', 'technology', 'construction'],
      'plumbing': ['power_tools', 'home_improvement', 'business'],
      'diy_enthusiast': ['power_tools', 'home_improvement', 'technology']
    };
    
    const categories = primaryCategories[businessType] || ['power_tools'];
    
    // Add interests from primary categories
    categories.forEach(category => {
      const categoryInterests = this.interestCategories[category];
      const numInterests = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numInterests; i++) {
        const interest = this.selectRandom(categoryInterests);
        if (!interests.includes(interest)) {
          interests.push(interest);
        }
      }
    });
    
    // Add some random interests
    const allCategories = Object.keys(this.interestCategories) as InterestCategory[];
    const randomCategory = this.selectRandom(allCategories);
    const randomInterests = this.interestCategories[randomCategory];
    interests.push(this.selectRandom(randomInterests));
    
    return interests;
  }

  private generatePurchaseFrequency(businessType: string): string {
    const frequencies: Record<string, string[]> = {
      'construction': ['weekly', 'bi-weekly', 'monthly'],
      'automotive': ['monthly', 'quarterly'],
      'home_improvement': ['monthly', 'quarterly', 'seasonal'],
      'landscaping': ['seasonal', 'monthly'],
      'electrical': ['weekly', 'monthly'],
      'plumbing': ['weekly', 'monthly'],
      'diy_enthusiast': ['quarterly', 'seasonal', 'yearly']
    };
    
    const options = frequencies[businessType] || ['monthly'];
    return this.selectRandom(options);
  }

  private generateAverageOrderValue(businessType: string): number {
    const ranges: Record<string, [number, number]> = {
      'construction': [200, 800],
      'automotive': [150, 500],
      'home_improvement': [100, 400],
      'landscaping': [100, 300],
      'electrical': [150, 600],
      'plumbing': [100, 400],
      'diy_enthusiast': [50, 200]
    };
    
    const [min, max] = ranges[businessType] || [100, 300];
    return Math.floor(Math.random() * (max - min)) + min;
  }

  private generatePreferredCategories(businessType: string): string[] {
    const categories: Record<string, string[]> = {
      'construction': ['Batteries', 'Power Tools', 'Hand Tools', 'Safety Equipment'],
      'automotive': ['Batteries', 'Impact Tools', 'Diagnostic Equipment', 'Shop Equipment'],
      'home_improvement': ['Batteries', 'Drills', 'Saws', 'Measuring Tools'],
      'landscaping': ['Batteries', 'Outdoor Power Equipment', 'Hand Tools', 'Trimmers'],
      'electrical': ['Batteries', 'Test Equipment', 'Wire Tools', 'Safety Gear'],
      'plumbing': ['Batteries', 'Pipe Tools', 'Inspection Equipment', 'Hand Tools'],
      'diy_enthusiast': ['Batteries', 'Basic Tools', 'Project Kits', 'Accessories']
    };
    
    return categories[businessType] || ['Batteries', 'Power Tools'];
  }

  private generateBrandAffinity(): string[] {
    const brands = ['Milwaukee', 'DeWalt', 'Makita', 'Bosch', 'Ryobi', 'Craftsman', 'Rigid'];
    const numBrands = Math.floor(Math.random() * 3) + 1;
    const selected: string[] = [];
    
    for (let i = 0; i < numBrands; i++) {
      const brand = this.selectRandom(brands);
      if (!selected.includes(brand)) {
        selected.push(brand);
      }
    }
    
    return selected;
  }

  private generatePriceRange(businessType: string): string {
    const ranges: Record<string, string[]> = {
      'construction': ['mid', 'premium'],
      'automotive': ['mid', 'premium'],
      'home_improvement': ['budget', 'mid', 'premium'],
      'landscaping': ['budget', 'mid'],
      'electrical': ['mid', 'premium'],
      'plumbing': ['mid', 'premium'],
      'diy_enthusiast': ['budget', 'mid']
    };
    
    const options = ranges[businessType] || ['mid'];
    return this.selectRandom(options);
  }

  private generateSeasonalPatterns(businessType: string): Record<string, number> {
    const patterns: Record<string, Record<string, number>> = {
      'construction': { spring: 1.2, summer: 1.5, fall: 1.3, winter: 0.8 },
      'automotive': { spring: 1.1, summer: 1.2, fall: 1.1, winter: 1.0 },
      'home_improvement': { spring: 1.4, summer: 1.3, fall: 0.9, winter: 0.7 },
      'landscaping': { spring: 1.8, summer: 1.6, fall: 0.8, winter: 0.3 },
      'electrical': { spring: 1.1, summer: 1.2, fall: 1.1, winter: 1.0 },
      'plumbing': { spring: 1.0, summer: 1.1, fall: 1.0, winter: 1.2 },
      'diy_enthusiast': { spring: 1.3, summer: 1.4, fall: 0.9, winter: 0.8 }
    };
    
    return patterns[businessType] || { spring: 1.0, summer: 1.0, fall: 1.0, winter: 1.0 };
  }

  private generateDeviceUsagePatterns(device: DeviceInfo): Record<string, number> {
    if (device.type === 'mobile') {
      return { morning: 0.3, afternoon: 0.4, evening: 0.3 };
    } else if (device.type === 'desktop') {
      return { morning: 0.4, afternoon: 0.5, evening: 0.1 };
    } else {
      return { morning: 0.2, afternoon: 0.3, evening: 0.5 };
    }
  }

  private generateContentPreferences(): string[] {
    const preferences = [
      'product_reviews',
      'how_to_guides',
      'comparison_charts',
      'video_demos',
      'technical_specs',
      'customer_testimonials',
      'project_ideas',
      'industry_news'
    ];
    
    const numPreferences = Math.floor(Math.random() * 4) + 2;
    const selected: string[] = [];
    
    for (let i = 0; i < numPreferences; i++) {
      const pref = this.selectRandom(preferences);
      if (!selected.includes(pref)) {
        selected.push(pref);
      }
    }
    
    return selected;
  }

  private generateSocialMediaUsage(age: number): string[] {
    const platforms = ['Facebook', 'Instagram', 'YouTube', 'LinkedIn', 'Twitter', 'TikTok'];
    const usage: string[] = [];
    
    // Age-based platform preferences
    if (age < 30) {
      usage.push('Instagram', 'TikTok', 'YouTube');
    } else if (age < 45) {
      usage.push('Facebook', 'Instagram', 'LinkedIn');
    } else {
      usage.push('Facebook', 'LinkedIn');
    }
    
    // Add YouTube for most users
    if (!usage.includes('YouTube') && Math.random() < 0.8) {
      usage.push('YouTube');
    }
    
    return usage;
  }

  private generateReferralSource(): string {
    const sources = [
      { value: 'search_engine', weight: 0.35 },
      { value: 'social_media', weight: 0.20 },
      { value: 'word_of_mouth', weight: 0.15 },
      { value: 'email_marketing', weight: 0.10 },
      { value: 'direct', weight: 0.10 },
      { value: 'paid_advertising', weight: 0.05 },
      { value: 'affiliate', weight: 0.05 }
    ];
    
    return this.selectWeighted(sources);
  }

  private generatePurchaseHistory(businessType: string) {
    const orderCount = Math.floor(Math.random() * 20) + 1;
    const avgValue = this.generateAverageOrderValue(businessType);
    const totalValue = orderCount * avgValue * (0.8 + Math.random() * 0.4);
    
    return {
      firstPurchase: new Date(Date.now() - Math.floor(Math.random() * 730 * 24 * 60 * 60 * 1000)),
      lastPurchase: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)),
      orderCount,
      totalValue: Math.round(totalValue),
      averageOrderValue: avgValue,
      favoriteProducts: this.generateFavoriteProducts(),
      returnRate: Math.random() * 0.1,
      reviewsWritten: Math.floor(Math.random() * orderCount * 0.3)
    };
  }

  private generateFavoriteProducts(): string[] {
    const products = [
      'MK-48-11-2460',
      'MK-48-11-2462',
      'MK-48-11-2420',
      'MK-48-11-2440',
      'MK-48-59-1852',
      'MK-48-59-2463'
    ];
    
    const numFavorites = Math.floor(Math.random() * 3) + 1;
    const favorites: string[] = [];
    
    for (let i = 0; i < numFavorites; i++) {
      const product = this.selectRandom(products);
      if (!favorites.includes(product)) {
        favorites.push(product);
      }
    }
    
    return favorites;
  }

  private generateLifecycleStage(): string {
    const stages = [
      { value: 'new', weight: 0.20 },
      { value: 'active', weight: 0.40 },
      { value: 'loyal', weight: 0.25 },
      { value: 'at_risk', weight: 0.10 },
      { value: 'dormant', weight: 0.05 }
    ];
    
    return this.selectWeighted(stages);
  }

  private generateCustomerValue(businessType: string): string {
    const value = this.generateAverageOrderValue(businessType) * (Math.random() * 10 + 5);
    
    if (value > 2000) return 'high';
    if (value > 500) return 'medium';
    return 'low';
  }

  private generateCustomAudiences(businessType: string): string[] {
    const audiences = [
      'high_value_customers',
      'frequent_buyers',
      'cart_abandoners',
      'newsletter_subscribers',
      'seasonal_shoppers',
      'tool_enthusiasts',
      'contractors',
      'diy_homeowners',
      'battery_replacement_due',
      'competitive_shoppers'
    ];
    
    const selected: string[] = [];
    const numAudiences = Math.floor(Math.random() * 4) + 1;
    
    // Always include business type relevant audience
    if (businessType === 'construction' || businessType === 'electrical' || businessType === 'plumbing') {
      selected.push('contractors');
    } else if (businessType === 'diy_enthusiast' || businessType === 'home_improvement') {
      selected.push('diy_homeowners');
    }
    
    // Add random audiences
    while (selected.length < numAudiences) {
      const audience = this.selectRandom(audiences);
      if (!selected.includes(audience)) {
        selected.push(audience);
      }
    }
    
    return selected;
  }

  private generateLastTouchpoint(): string {
    const touchpoints = ['organic_search', 'paid_search', 'social_media', 'email', 'direct', 'referral'];
    return this.selectRandom(touchpoints);
  }

  private generateAcquisitionSource(): string {
    const sources = ['google_ads', 'facebook_ads', 'organic_search', 'referral', 'direct', 'email_campaign'];
    return this.selectRandom(sources);
  }

  private generateCompanySize(businessType: string): string {
    if (businessType === 'diy_enthusiast') {
      return 'individual';
    }
    
    const sizes = [
      { value: '1-10', weight: 0.60 },
      { value: '11-50', weight: 0.25 },
      { value: '51-200', weight: 0.10 },
      { value: '201-500', weight: 0.04 },
      { value: '500+', weight: 0.01 }
    ];
    
    return this.selectWeighted(sizes);
  }

  private generateIndustry(businessType: string): string {
    const industries: Record<string, string> = {
      'construction': 'Construction & Building',
      'automotive': 'Automotive Services',
      'home_improvement': 'Home Services',
      'landscaping': 'Landscaping & Lawn Care',
      'electrical': 'Electrical Services',
      'plumbing': 'Plumbing Services',
      'diy_enthusiast': 'Consumer'
    };
    
    return industries[businessType] || 'Other';
  }

  private generateJobFunction(businessType: string): string {
    if (businessType === 'diy_enthusiast') {
      return 'Individual/Hobbyist';
    }
    
    const functions = ['Owner', 'Manager', 'Technician', 'Purchasing', 'Operations'];
    return this.selectRandom(functions);
  }

  private generatePurchaseTimeframe(): string {
    const timeframes = [
      { value: 'immediate', weight: 0.15 },
      { value: '1_week', weight: 0.25 },
      { value: '1_month', weight: 0.30 },
      { value: '3_months', weight: 0.20 },
      { value: '6_months', weight: 0.10 }
    ];
    
    return this.selectWeighted(timeframes);
  }

  private generateProjectType(businessType: string): string[] {
    const projects: Record<string, string[]> = {
      'construction': ['Commercial Build', 'Residential Construction', 'Renovation', 'Infrastructure'],
      'automotive': ['Fleet Maintenance', 'Shop Equipment', 'Customer Repairs', 'Racing/Performance'],
      'home_improvement': ['Kitchen Remodel', 'Bathroom Update', 'Deck Building', 'General Repairs'],
      'landscaping': ['Commercial Grounds', 'Residential Yards', 'Hardscaping', 'Tree Service'],
      'electrical': ['New Construction', 'Service Upgrades', 'Commercial Wiring', 'Residential Service'],
      'plumbing': ['New Installation', 'Repair Service', 'Commercial Projects', 'Remodels'],
      'diy_enthusiast': ['Weekend Projects', 'Home Repairs', 'Hobby Work', 'Furniture Making']
    };
    
    const options = projects[businessType] || ['General Projects'];
    const numProjects = Math.floor(Math.random() * 2) + 1;
    const selected: string[] = [];
    
    for (let i = 0; i < numProjects; i++) {
      const project = this.selectRandom(options);
      if (!selected.includes(project)) {
        selected.push(project);
      }
    }
    
    return selected;
  }

  private generateCompetitorUsage(): string[] {
    const competitors = ['DeWalt', 'Makita', 'Bosch', 'Ryobi', 'Craftsman'];
    const numCompetitors = Math.floor(Math.random() * 3);
    const selected: string[] = [];
    
    for (let i = 0; i < numCompetitors; i++) {
      const competitor = this.selectRandom(competitors);
      if (!selected.includes(competitor)) {
        selected.push(competitor);
      }
    }
    
    return selected;
  }

  private generatePainPoints(businessType: string): string[] {
    const painPoints: Record<string, string[]> = {
      'construction': ['Battery Life', 'Tool Downtime', 'Charging Speed', 'Durability', 'Cost'],
      'automotive': ['Power Output', 'Reliability', 'Compatibility', 'Warranty', 'Price'],
      'home_improvement': ['Ease of Use', 'Battery Life', 'Tool Selection', 'Value', 'Storage'],
      'landscaping': ['Runtime', 'Weather Resistance', 'Power', 'Weight', 'Maintenance'],
      'electrical': ['Consistency', 'Safety Features', 'Compatibility', 'Certification', 'Support'],
      'plumbing': ['Portability', 'Water Resistance', 'Power', 'Durability', 'Service'],
      'diy_enthusiast': ['Cost', 'Ease of Use', 'Versatility', 'Storage', 'Learning Curve']
    };
    
    const options = painPoints[businessType] || ['Cost', 'Quality', 'Availability'];
    const numPainPoints = Math.floor(Math.random() * 3) + 2;
    const selected: string[] = [];
    
    for (let i = 0; i < numPainPoints; i++) {
      const painPoint = this.selectRandom(options);
      if (!selected.includes(painPoint)) {
        selected.push(painPoint);
      }
    }
    
    return selected;
  }

  private generateProductInterests(businessType: string): string[] {
    const interests: Record<string, string[]> = {
      'construction': ['High Capacity Batteries', 'Fast Chargers', 'Multi-Bay Chargers', 'Tool Kits'],
      'automotive': ['Impact Rated Batteries', 'Compact Batteries', 'Diagnostic Tools', 'Chargers'],
      'home_improvement': ['Starter Kits', 'Combo Packs', 'Compact Tools', 'Storage Solutions'],
      'landscaping': ['Extended Runtime', 'Weather Resistant', 'Lightweight Options', 'Quick Charge'],
      'electrical': ['Certified Products', 'Test Equipment', 'Safety Gear', 'Precision Tools'],
      'plumbing': ['Waterproof Options', 'Compact Design', 'Inspection Cameras', 'Pipe Tools'],
      'diy_enthusiast': ['Value Packs', 'Entry Level', 'Multi-Tool Compatible', 'Accessories']
    };
    
    return interests[businessType] || ['Batteries', 'Chargers', 'Tools'];
  }

  // Utility methods
  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private selectWeighted<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;
    
    let cumulative = 0;
    for (const item of items) {
      cumulative += item.weight;
      if (random <= cumulative) {
        return item;
      }
    }
    
    return items[0];
  }
}