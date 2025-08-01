export interface CompanyData {
  name: string;
  url: string;
  type: 'electrical' | 'plumbing' | 'hvac' | 'roofing' | 'carpentry' | 'landscaping' | 'concrete' | 'general';
  rating: number;
  reviewCount: number;
  reviews: Array<{ text: string; rating: number }>;
  websiteText: string;
  aboutContent: string;
  services: string[];
  location: string;
  indicators: {
    fleetSize: 'small' | 'medium' | 'large';
    techSavvy: 'low' | 'medium' | 'high';
    pricePoint: 'budget' | 'mid' | 'premium';
  };
}

export const classifyBusiness = (text: string): CompanyData['type'] => {
  const lowerText = text.toLowerCase();
  const classifications = {
    'electrical': ['electrician', 'electrical', 'wiring', 'circuit', 'breaker', 'voltage'],
    'plumbing': ['plumber', 'plumbing', 'pipe', 'drain', 'water heater', 'fixture'],
    'hvac': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'ductwork'],
    'roofing': ['roof', 'shingle', 'gutter', 'siding', 'flashing', 'soffit'],
    'carpentry': ['carpenter', 'framing', 'trim', 'cabinet', 'millwork', 'woodwork'],
    'landscaping': ['landscape', 'lawn', 'tree', 'irrigation', 'hardscape', 'garden'],
    'concrete': ['concrete', 'foundation', 'masonry', 'cement', 'slab', 'paving'],
    'general': ['general contractor', 'construction', 'remodeling', 'renovation', 'building']
  };
  
  for (const [type, keywords] of Object.entries(classifications)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return type as CompanyData['type'];
    }
  }
  return 'general';
};

export const detectFleetSize = (text: string): 'small' | 'medium' | 'large' => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('fleet') || lowerText.includes('vehicles') || lowerText.includes('trucks')) {
    const numbers = text.match(/\d+/g);
    const maxNum = Math.max(...(numbers?.map(Number) || [0]));
    if (maxNum > 20) return 'large';
    if (maxNum > 5) return 'medium';
  }
  return 'small';
};

export const assessTechLevel = (websiteData: any): 'low' | 'medium' | 'high' => {
  // Simple assessment based on various factors
  const indicators = {
    hasOnlineBooking: false,
    hasMobileApp: false,
    usesModernDesign: true,
    hasAPIIntegration: false
  };
  
  const score = Object.values(indicators).filter(Boolean).length;
  if (score >= 3) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
};

export const detectPricePoint = (reviews: Array<{ text: string }>): 'budget' | 'mid' | 'premium' => {
  const priceIndicators = {
    budget: ['affordable', 'cheap', 'budget', 'value', 'economical'],
    premium: ['expensive', 'premium', 'high-end', 'luxury', 'professional']
  };
  
  const allReviewText = reviews.map(r => r.text.toLowerCase()).join(' ');
  
  const budgetCount = priceIndicators.budget.filter(term => allReviewText.includes(term)).length;
  const premiumCount = priceIndicators.premium.filter(term => allReviewText.includes(term)).length;
  
  if (premiumCount > budgetCount) return 'premium';
  if (budgetCount > premiumCount) return 'budget';
  return 'mid';
};

// Parse company data from CSV/JSON
export const parseCompanyFromCSV = (csvRow: any): CompanyData => {
  return {
    name: csvRow.name || 'Unknown Company',
    url: csvRow.website || '',
    type: classifyBusiness(csvRow.types || ''),
    rating: parseFloat(csvRow.rating) || 0,
    reviewCount: parseInt(csvRow.reviews) || 0,
    reviews: [], // Would need to fetch separately
    websiteText: '',
    aboutContent: '',
    services: (csvRow.types || '').split(',').map((s: string) => s.trim()),
    location: csvRow.address || '',
    indicators: {
      fleetSize: 'small',
      techSavvy: 'medium',
      pricePoint: 'mid'
    }
  };
};