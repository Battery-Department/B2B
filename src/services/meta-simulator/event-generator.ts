import { 
  MetaEvent, 
  UserProfile, 
  EventType, 
  DeviceInfo,
  SimulatorConfig 
} from './types';

export class EventGenerator {
  private config: SimulatorConfig;
  private eventWeights: Record<EventType, number> = {
    'PageView': 0.35,
    'ViewContent': 0.25,
    'AddToCart': 0.15,
    'InitiateCheckout': 0.08,
    'Purchase': 0.05,
    'Search': 0.05,
    'Lead': 0.03,
    'CompleteRegistration': 0.02,
    'Subscribe': 0.01,
    'Contact': 0.01
  };

  // Time-based patterns (hour of day weights)
  private hourlyPatterns: number[] = [
    0.3, 0.2, 0.1, 0.1, 0.1, 0.2, // 12am-6am
    0.4, 0.7, 0.9, 1.0, 0.9, 0.8, // 6am-12pm
    0.7, 0.8, 0.9, 1.0, 0.9, 0.8, // 12pm-6pm
    0.7, 0.6, 0.5, 0.4, 0.3, 0.3  // 6pm-12am
  ];

  // Browser market share (approximate)
  private browsers = [
    { name: 'Chrome', share: 0.65, versions: ['119', '120', '121'] },
    { name: 'Safari', share: 0.20, versions: ['17.0', '17.1', '17.2'] },
    { name: 'Firefox', share: 0.10, versions: ['120', '121', '122'] },
    { name: 'Edge', share: 0.05, versions: ['119', '120', '121'] }
  ];

  // Geographic distribution (US states)
  private geoDistribution = [
    { state: 'CA', weight: 0.12 },
    { state: 'TX', weight: 0.09 },
    { state: 'FL', weight: 0.07 },
    { state: 'NY', weight: 0.06 },
    { state: 'PA', weight: 0.04 },
    { state: 'IL', weight: 0.04 },
    { state: 'OH', weight: 0.03 },
    { state: 'GA', weight: 0.03 },
    { state: 'NC', weight: 0.03 },
    { state: 'MI', weight: 0.03 }
  ];

  constructor(config: SimulatorConfig) {
    this.config = config;
  }

  generateEvent(user: UserProfile, eventType?: EventType): MetaEvent {
    const type = eventType || this.selectEventType(user);
    const timestamp = this.generateTimestamp();
    const device = this.enhanceDeviceInfo(user.device);
    
    const event: MetaEvent = {
      eventId: this.generateEventId(),
      eventName: type,
      timestamp,
      userId: user.id,
      sourceUrl: this.generateSourceUrl(type),
      userData: {
        email: user.email,
        phone: user.phone,
        firstName: user.demographics.firstName,
        lastName: user.demographics.lastName,
        dateOfBirth: user.demographics.dateOfBirth,
        city: user.location.city,
        state: user.location.state,
        zip: user.location.zip,
        country: user.location.country,
        ipAddress: this.generateIpAddress(user.location.state),
        userAgent: this.generateUserAgent(device),
        fbc: this.generateFbc(),
        fbp: this.generateFbp(user.id)
      },
      customData: this.generateCustomData(type, user),
      device,
      actionSource: 'website'
    };

    return event;
  }

  private selectEventType(user: UserProfile): EventType {
    // Adjust weights based on user behavior
    const adjustedWeights = { ...this.eventWeights };
    
    // High engagement users more likely to convert
    if (user.engagementScore > 0.7) {
      adjustedWeights.Purchase *= 2;
      adjustedWeights.AddToCart *= 1.5;
    }
    
    // Recent visitors more likely to view content
    const lastVisit = user.behaviorPatterns.lastVisit;
    const daysSinceVisit = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceVisit < 1) {
      adjustedWeights.ViewContent *= 1.5;
    }
    
    // New users more likely to browse
    if (user.lifecycleStage === 'new') {
      adjustedWeights.PageView *= 1.5;
      adjustedWeights.Purchase *= 0.5;
    }
    
    // Calculate cumulative weights
    const totalWeight = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);
    const random = Math.random() * totalWeight;
    
    let cumulative = 0;
    for (const [event, weight] of Object.entries(adjustedWeights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return event as EventType;
      }
    }
    
    return 'PageView';
  }

  private generateTimestamp(): Date {
    const now = new Date();
    const hour = now.getHours();
    
    // Apply hourly pattern
    const hourWeight = this.hourlyPatterns[hour];
    if (Math.random() > hourWeight) {
      // Shift to a more active hour
      const activeHour = this.weightedRandom(
        this.hourlyPatterns.map((w, i) => ({ value: i, weight: w }))
      );
      now.setHours(activeHour);
    }
    
    // Add some randomness to minutes and seconds
    now.setMinutes(Math.floor(Math.random() * 60));
    now.setSeconds(Math.floor(Math.random() * 60));
    
    return now;
  }

  private enhanceDeviceInfo(baseDevice: DeviceInfo): DeviceInfo {
    const browser = this.weightedRandom(
      this.browsers.map(b => ({ value: b, weight: b.share }))
    );
    
    const version = browser.versions[Math.floor(Math.random() * browser.versions.length)];
    
    return {
      ...baseDevice,
      browser: browser.name,
      browserVersion: version,
      screenResolution: this.generateScreenResolution(baseDevice.type),
      viewport: this.generateViewport(baseDevice.type),
      deviceMemory: baseDevice.type === 'mobile' ? 4 : 8,
      hardwareConcurrency: baseDevice.type === 'mobile' ? 4 : 8,
      platform: this.getPlatform(baseDevice.os)
    };
  }

  private generateSourceUrl(eventType: EventType): string {
    const baseUrl = 'https://www.lithiumbatterystore.com';
    const urls: Record<EventType, string[]> = {
      'PageView': ['/', '/products', '/quiz', '/about', '/contact'],
      'ViewContent': [
        '/products/mk-48-11-2460',
        '/products/mk-48-11-2462',
        '/products/mk-48-11-2420',
        '/products/mk-48-11-2440'
      ],
      'AddToCart': ['/products/mk-48-11-2460', '/products/mk-48-11-2462'],
      'InitiateCheckout': ['/checkout'],
      'Purchase': ['/checkout/success'],
      'Search': ['/search'],
      'Lead': ['/contact', '/quote'],
      'CompleteRegistration': ['/register/success'],
      'Subscribe': ['/newsletter'],
      'Contact': ['/contact']
    };
    
    const paths = urls[eventType] || ['/'];
    const path = paths[Math.floor(Math.random() * paths.length)];
    
    // Add UTM parameters occasionally
    if (Math.random() < 0.3) {
      const utmSources = ['google', 'facebook', 'email', 'direct'];
      const utmMediums = ['cpc', 'social', 'email', 'none'];
      const source = utmSources[Math.floor(Math.random() * utmSources.length)];
      const medium = utmMediums[Math.floor(Math.random() * utmMediums.length)];
      
      return `${baseUrl}${path}?utm_source=${source}&utm_medium=${medium}`;
    }
    
    return `${baseUrl}${path}`;
  }

  private generateCustomData(eventType: EventType, user: UserProfile): any {
    const customData: any = {};
    
    switch (eventType) {
      case 'ViewContent':
        customData.content_ids = [this.generateProductId()];
        customData.content_type = 'product';
        customData.content_name = this.generateProductName();
        customData.content_category = 'Batteries';
        customData.value = this.generateProductPrice();
        customData.currency = 'USD';
        break;
        
      case 'AddToCart':
        customData.content_ids = [this.generateProductId()];
        customData.content_type = 'product';
        customData.content_name = this.generateProductName();
        customData.value = this.generateProductPrice();
        customData.currency = 'USD';
        customData.quantity = Math.floor(Math.random() * 3) + 1;
        break;
        
      case 'Purchase':
        const numItems = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let totalValue = 0;
        
        for (let i = 0; i < numItems; i++) {
          const price = this.generateProductPrice();
          const quantity = Math.floor(Math.random() * 3) + 1;
          items.push({
            id: this.generateProductId(),
            quantity,
            price
          });
          totalValue += price * quantity;
        }
        
        customData.content_ids = items.map(i => i.id);
        customData.contents = items;
        customData.content_type = 'product';
        customData.value = totalValue;
        customData.currency = 'USD';
        customData.num_items = numItems;
        break;
        
      case 'Search':
        customData.search_string = this.generateSearchQuery();
        break;
        
      case 'Lead':
        customData.lead_type = 'quote_request';
        customData.value = 100;
        customData.currency = 'USD';
        break;
    }
    
    // Add common custom parameters
    customData.user_type = user.customerType;
    customData.engagement_score = user.engagementScore;
    customData.lifecycle_stage = user.lifecycleStage;
    
    return customData;
  }

  private generateIpAddress(state: string): string {
    // Generate realistic IP ranges based on state
    const stateIpRanges: Record<string, string[]> = {
      'CA': ['192.168', '172.16', '10.0'],
      'TX': ['192.169', '172.17', '10.1'],
      'FL': ['192.170', '172.18', '10.2'],
      'NY': ['192.171', '172.19', '10.3']
    };
    
    const ranges = stateIpRanges[state] || ['192.168'];
    const range = ranges[Math.floor(Math.random() * ranges.length)];
    
    return `${range}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  private generateUserAgent(device: DeviceInfo): string {
    const templates: Record<string, string[]> = {
      'Chrome': [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36'
      ],
      'Safari': [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{version} Safari/605.1.15',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{version} Mobile/15E148 Safari/604.1'
      ],
      'Firefox': [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/{version}',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/{version}'
      ],
      'Edge': [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36 Edg/{version}'
      ]
    };
    
    const browserTemplates = templates[device.browser] || templates['Chrome'];
    const template = browserTemplates[Math.floor(Math.random() * browserTemplates.length)];
    
    return template.replace(/{version}/g, device.browserVersion || '120.0.0.0');
  }

  private generateFbc(): string {
    // Facebook click ID format
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `fb.1.${timestamp}.${random}`;
  }

  private generateFbp(userId: string): string {
    // Facebook pixel ID format
    const version = '1';
    const subdomainIndex = Math.floor(Math.random() * 1000);
    const creationTime = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
    const randomId = userId.substring(0, 8);
    
    return `fb.${version}.${subdomainIndex}.${creationTime}.${randomId}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateProductId(): string {
    const products = ['MK-48-11-2460', 'MK-48-11-2462', 'MK-48-11-2420', 'MK-48-11-2440'];
    return products[Math.floor(Math.random() * products.length)];
  }

  private generateProductName(): string {
    const names = [
      'M18 REDLITHIUM XC5.0 Battery Pack',
      'M18 REDLITHIUM HIGH OUTPUT XC6.0 Battery Pack',
      'M18 REDLITHIUM CP2.0 Battery Pack',
      'M18 REDLITHIUM XC4.0 Battery Pack'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateProductPrice(): number {
    const prices = [89.99, 119.99, 149.99, 179.99, 199.99];
    return prices[Math.floor(Math.random() * prices.length)];
  }

  private generateSearchQuery(): string {
    const queries = [
      'milwaukee battery',
      'm18 battery',
      'power tool battery',
      'lithium battery',
      'battery pack',
      'redlithium battery',
      'high capacity battery',
      'tool battery replacement'
    ];
    return queries[Math.floor(Math.random() * queries.length)];
  }

  private generateScreenResolution(deviceType: string): string {
    const resolutions = {
      desktop: ['1920x1080', '2560x1440', '1366x768', '1440x900'],
      mobile: ['390x844', '414x896', '360x800', '375x812'],
      tablet: ['1024x768', '768x1024', '1280x800', '2048x1536']
    };
    
    const options = resolutions[deviceType] || resolutions.desktop;
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateViewport(deviceType: string): string {
    const viewports = {
      desktop: ['1920x937', '1536x722', '1366x625', '1280x580'],
      mobile: ['390x664', '414x736', '360x640', '375x667'],
      tablet: ['1024x1366', '768x1024', '834x1194', '810x1080']
    };
    
    const options = viewports[deviceType] || viewports.desktop;
    return options[Math.floor(Math.random() * options.length)];
  }

  private getPlatform(os: string): string {
    const platforms: Record<string, string> = {
      'Windows': 'Win32',
      'macOS': 'MacIntel',
      'iOS': 'iPhone',
      'Android': 'Linux armv8l'
    };
    
    return platforms[os] || 'Win32';
  }

  private weightedRandom<T>(items: { value: T; weight: number }[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;
    
    let cumulative = 0;
    for (const item of items) {
      cumulative += item.weight;
      if (random <= cumulative) {
        return item.value;
      }
    }
    
    return items[0].value;
  }
}