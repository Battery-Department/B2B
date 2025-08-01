// Quiz Brand Configuration - Text-based display (no logos)
import { QuizBrand } from '@/types/quiz-v2';

export const QUIZ_BRANDS: QuizBrand[] = [
  // Tier 1 - Most Popular (Professional)
  {
    id: 'dewalt',
    name: 'dewalt',
    displayName: 'DeWalt',
    color: '#FEBD17', // DeWalt yellow
    voltage: '20V MAX / FLEXVOLT',
    voltageOptions: ['12V MAX', '20V MAX', '60V MAX', 'FLEXVOLT'],
    marketShare: '44%',
    popularWith: ['Carpenters', 'General Contractors'],
    category: 'professional'
  },
  {
    id: 'milwaukee',
    name: 'milwaukee',
    displayName: 'Milwaukee',
    color: '#EE0000', // Milwaukee red
    voltage: 'M18 / M12',
    voltageOptions: ['M12', 'M18', 'MX FUEL'],
    marketShare: '38%',
    popularWith: ['Electricians', 'Plumbers'],
    category: 'professional'
  },
  {
    id: 'makita',
    name: 'makita',
    displayName: 'Makita',
    color: '#00A4B4', // Makita teal
    voltage: '18V LXT / 40V XGT',
    voltageOptions: ['12V max CXT', '18V LXT', '36V (18V X2)', '40V max XGT'],
    marketShare: '28%',
    popularWith: ['Framers', 'Finish Carpenters'],
    category: 'professional'
  },
  
  // Tier 2 - Professional/Prosumer
  {
    id: 'bosch',
    name: 'bosch',
    displayName: 'Bosch',
    color: '#0A5EB0', // Bosch blue
    voltage: '18V',
    voltageOptions: ['12V', '18V', '36V'],
    category: 'professional'
  },
  {
    id: 'ridgid',
    name: 'ridgid',
    displayName: 'RIDGID',
    color: '#F36F21', // RIDGID orange
    voltage: '18V',
    voltageOptions: ['12V', '18V'],
    popularWith: ['Plumbers', 'HVAC'],
    category: 'professional'
  },
  {
    id: 'metabo',
    name: 'metabo',
    displayName: 'Metabo HPT',
    color: '#00A651', // Metabo green
    voltage: '18V / 36V MultiVolt',
    voltageOptions: ['12V', '18V', '36V MultiVolt'],
    category: 'professional'
  },
  
  // Tier 3 - DIY/Consumer Focused
  {
    id: 'ryobi',
    name: 'ryobi',
    displayName: 'Ryobi',
    color: '#95C11F', // Ryobi green
    voltage: '18V ONE+',
    voltageOptions: ['18V ONE+', '40V'],
    category: 'diy'
  },
  {
    id: 'craftsman',
    name: 'craftsman',
    displayName: 'Craftsman',
    color: '#E31837', // Craftsman red
    voltage: '20V MAX',
    voltageOptions: ['20V MAX'],
    category: 'diy'
  },
  
  // Outdoor Power Equipment
  {
    id: 'ego',
    name: 'ego',
    displayName: 'EGO',
    color: '#76BC21', // EGO green
    voltage: '56V',
    voltageOptions: ['56V'],
    category: 'outdoor'
  },
  {
    id: 'greenworks',
    name: 'greenworks',
    displayName: 'Greenworks',
    color: '#78BE20', // Greenworks green
    voltage: '40V / 60V / 80V',
    voltageOptions: ['24V', '40V', '60V', '80V'],
    category: 'outdoor'
  },
  
  // Additional Brands
  {
    id: 'worx',
    name: 'worx',
    displayName: 'WORX',
    color: '#F37021', // WORX orange
    voltage: '20V PowerShare',
    voltageOptions: ['20V PowerShare', '40V'],
    category: 'diy'
  },
  {
    id: 'aeg',
    name: 'aeg',
    displayName: 'AEG',
    color: '#E30613', // AEG red
    voltage: '18V',
    voltageOptions: ['12V', '18V'],
    category: 'professional'
  },
  {
    id: 'hikoki',
    name: 'hikoki',
    displayName: 'HiKOKI',
    color: '#00A0E9', // HiKOKI blue
    voltage: '18V / 36V MultiVolt',
    voltageOptions: ['12V', '18V', '36V MultiVolt'],
    category: 'professional'
  },
  {
    id: 'kobalt',
    name: 'kobalt',
    displayName: 'Kobalt',
    color: '#0066CC', // Kobalt blue
    voltage: '24V / 40V / 80V',
    voltageOptions: ['24V', '40V', '80V'],
    category: 'diy'
  }
];

// Helper functions
export const getBrandById = (id: string): QuizBrand | undefined => {
  return QUIZ_BRANDS.find(brand => brand.id === id);
};

export const getBrandsByCategory = (category: 'professional' | 'diy' | 'outdoor'): QuizBrand[] => {
  return QUIZ_BRANDS.filter(brand => brand.category === category);
};

export const sortBrandsByRelevance = (userType: 'professional' | 'personal'): QuizBrand[] => {
  if (userType === 'professional') {
    // Show professional brands first, sorted by market share
    const professionalBrands = QUIZ_BRANDS.filter(b => b.category === 'professional')
      .sort((a, b) => {
        const aShare = parseFloat(a.marketShare || '0');
        const bShare = parseFloat(b.marketShare || '0');
        return bShare - aShare;
      });
    const otherBrands = QUIZ_BRANDS.filter(b => b.category !== 'professional');
    return [...professionalBrands, ...otherBrands];
  } else {
    // Show DIY brands first
    const diyBrands = QUIZ_BRANDS.filter(b => b.category === 'diy');
    const outdoorBrands = QUIZ_BRANDS.filter(b => b.category === 'outdoor');
    const professionalBrands = QUIZ_BRANDS.filter(b => b.category === 'professional');
    return [...diyBrands, ...outdoorBrands, ...professionalBrands];
  }
};