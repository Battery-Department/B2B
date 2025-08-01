import { CompanyData } from './company-analyzer';

export interface DynamicContent {
  headline: string;
  subheadline: string;
  bulletPoints: string[];
  urgencyMessage: string;
  socialProof: string;
  priceAnchor: string;
}

// Industry-specific content templates
const industryTemplates = {
  electrical: {
    painPoints: ['tool theft from service vans', 'apprentice tool mix-ups', 'insurance claims for lost equipment'],
    tools: ['impact drivers', 'voltage testers', 'wire strippers', 'multimeters'],
    priceAnchors: ['Less than a Klein Tools set', 'Costs less than one service call', 'Under 0.5% of van inventory'],
    urgency: ['Copper theft season approaching', 'Insurance renewal coming up', 'New apprentice season starting']
  },
  plumbing: {
    painPoints: ['tools disappearing from trucks', 'equipment left at job sites', 'crew tool confusion'],
    tools: ['pipe wrenches', 'drain snakes', 'press tools', 'inspection cameras'],
    priceAnchors: ['Less than a ProPress jaw set', 'Under one emergency callout', 'Fraction of a camera system'],
    urgency: ['Freeze season = more calls & theft', 'Holiday rush approaching', 'New construction boom']
  },
  hvac: {
    painPoints: ['expensive gauges going missing', 'tools left in attics/basements', 'fleet management chaos'],
    tools: ['refrigerant gauges', 'combustion analyzers', 'vacuum pumps', 'recovery machines'],
    priceAnchors: ['Less than one gauge manifold', 'Under monthly refrigerant costs', 'Fraction of one compressor'],
    urgency: ['Peak AC season security', 'Heating season prep time', 'Fleet expansion period']
  },
  roofing: {
    painPoints: ['tools stolen from job sites', 'equipment falling off trucks', 'crew accountability'],
    tools: ['nail guns', 'compressors', 'safety harnesses', 'tear-off tools'],
    priceAnchors: ['Less than one square of shingles', 'Under a safety harness set', 'Fraction of a compressor'],
    urgency: ['Storm season approaching', 'Insurance audit season', 'Busy season prep']
  },
  general: {
    painPoints: ['multi-trade tool confusion', 'subcontractor tool mix-ups', 'job site security'],
    tools: ['circular saws', 'laser levels', 'hammer drills', 'generators'],
    priceAnchors: ['Less than one change order', 'Under weekly fuel costs', 'Fraction of job site theft'],
    urgency: ['Construction season starting', 'Year-end tax benefits', 'Theft reports increasing']
  }
};

export const generateDynamicContent = (companyData: CompanyData): DynamicContent => {
  const template = industryTemplates[companyData.type] || industryTemplates.general;
  const isLargeFleet = companyData.indicators.fleetSize === 'large';
  const isPremium = companyData.indicators.pricePoint === 'premium';
  
  // Select appropriate pain point based on fleet size
  const painPoint = isLargeFleet 
    ? template.painPoints[2] // fleet management focus
    : template.painPoints[0]; // theft focus
  
  // Generate customized content
  return {
    headline: `Protect ${companyData.name}'s ${template.tools[0]}`,
    subheadline: `Stop ${painPoint} with laser-engraved identification`,
    bulletPoints: [
      `Permanent ${companyData.name} branding`,
      `Insurance approved - reduce premiums`,
      `${companyData.location} crews stay organized`
    ],
    urgencyMessage: template.urgency[0],
    socialProof: `Trusted by ${Math.floor(companyData.reviewCount / 10)} ${companyData.type} contractors in Greater Boston`,
    priceAnchor: isPremium ? template.priceAnchors[2] : template.priceAnchors[0]
  };
};

// Generate content for the engraving section
export const generateEngravingContent = (companyData: CompanyData): {
  title: string;
  description: string;
  features: Array<{ title: string; description: string; icon?: string }>;
} => {
  const template = industryTemplates[companyData.type] || industryTemplates.general;
  
  return {
    title: 'USA Custom Engraving & Assembly',
    description: `Hand-assembled in Boston with theft-stopping laser engraving designed for ${companyData.type} contractors like ${companyData.name}.`,
    features: [
      {
        title: 'Permanent Theft Deterrent',
        description: `Stop ${template.painPoints[0]} with deep engraving that can't be removed`,
        icon: 'shield'
      },
      {
        title: 'Premium Samsung 21700 Cells',
        description: '40% more runtime than standard batteries—powers your tools longer',
        icon: 'battery'
      },
      {
        title: companyData.indicators.fleetSize === 'large' ? '85% Fleet Recovery Rate' : '85% Recovery Rate',
        description: companyData.indicators.fleetSize === 'large' 
          ? 'Track tools across your entire fleet with proven results'
          : 'Engraved batteries are returned vs. 15% for unmarked',
        icon: 'lock'
      }
    ]
  };
};