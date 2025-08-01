import { CompanyData, parseCompanyFromCSV } from './company-analyzer';

// This would be loaded from the CSV file in production
// For now, we'll create some sample data based on the Massachusetts contractors
export const massachusettsContractors: Record<string, CompanyData> = {
  "mikes-electrical": {
    name: "Mike's Electrical Services",
    url: "mikeselectrical.com",
    type: "electrical",
    rating: 4.8,
    reviewCount: 127,
    reviews: [
      { text: "Mike's team secured all our tools after we had theft issues on the job site", rating: 5 },
      { text: "Professional work, tools are always organized now. Great investment!", rating: 5 },
      { text: "Lost $5000 in tools last year. Mike recommended these batteries - game changer", rating: 5 }
    ],
    websiteText: "Serving Greater Boston with professional electrical services. Licensed and insured electrical contractor.",
    aboutContent: "Family-owned electrical contractor since 1998. Specializing in residential and commercial electrical work.",
    services: ["Residential wiring", "Commercial electrical", "Emergency service", "Panel upgrades", "EV charger installation"],
    location: "Medford, MA",
    indicators: {
      fleetSize: "medium",
      techSavvy: "medium", 
      pricePoint: "mid"
    }
  },
  "boston-plumbing-hvac": {
    name: "Boston Plumbing & HVAC",
    url: "bostonplumbinghvac.com",
    type: "hvac",
    rating: 4.9,
    reviewCount: 342,
    reviews: [
      { text: "Their fleet of vans is always well-equipped. Very professional", rating: 5 },
      { text: "Had issues with tools going missing from trucks. They solved it!", rating: 5 },
      { text: "24/7 emergency service - always reliable", rating: 5 }
    ],
    websiteText: "Boston's premier HVAC and plumbing contractor. 24/7 emergency service available.",
    aboutContent: "Serving Greater Boston for over 20 years with a fleet of 15 service vehicles.",
    services: ["HVAC installation", "Plumbing repairs", "Emergency service", "Boiler service", "AC maintenance"],
    location: "Boston, MA",
    indicators: {
      fleetSize: "large",
      techSavvy: "high",
      pricePoint: "premium"
    }
  },
  "ace-roofing": {
    name: "Ace Roofing & Construction",
    url: "aceroofingma.com", 
    type: "roofing",
    rating: 4.7,
    reviewCount: 89,
    reviews: [
      { text: "Lost expensive nail guns twice last month. Need better security", rating: 4 },
      { text: "Great roofing work but noticed tools left behind", rating: 4 },
      { text: "Professional crew, could use better tool organization", rating: 5 }
    ],
    websiteText: "Commercial and residential roofing contractor. Storm damage specialists.",
    aboutContent: "Veteran-owned roofing company serving all of Massachusetts.",
    services: ["Roof installation", "Storm damage repair", "Gutter installation", "Siding", "Emergency tarping"],
    location: "Quincy, MA",
    indicators: {
      fleetSize: "small",
      techSavvy: "low",
      pricePoint: "budget"
    }
  },
  "precision-carpentry": {
    name: "Precision Carpentry LLC",
    url: "precisioncarpentryma.com",
    type: "carpentry",
    rating: 5.0,
    reviewCount: 56,
    reviews: [
      { text: "High-end custom work. They take tool security seriously", rating: 5 },
      { text: "Expensive but worth it. Very organized crew", rating: 5 }
    ],
    websiteText: "Custom millwork and high-end carpentry. Specializing in historic renovations.",
    aboutContent: "Master carpenters with 30+ years experience in fine woodworking.",
    services: ["Custom millwork", "Historic restoration", "Trim carpentry", "Cabinet installation"],
    location: "Cambridge, MA",
    indicators: {
      fleetSize: "small",
      techSavvy: "medium",
      pricePoint: "premium"
    }
  },
  "general-construction-ma": {
    name: "General Construction MA",
    url: "generalconstructionma.com",
    type: "general",
    rating: 4.5,
    reviewCount: 203,
    reviews: [
      { text: "Multiple crews means tools get mixed up constantly", rating: 4 },
      { text: "Big company, sometimes tools go missing between jobs", rating: 3 },
      { text: "Would benefit from better tool tracking system", rating: 4 }
    ],
    websiteText: "Full-service general contractor for commercial and residential projects.",
    aboutContent: "One of Boston's largest general contractors with 50+ employees.",
    services: ["General contracting", "Project management", "Design-build", "Commercial construction"],
    location: "Waltham, MA",
    indicators: {
      fleetSize: "large",
      techSavvy: "high",
      pricePoint: "mid"
    }
  }
};

// Function to get company data by ID
export const getCompanyData = (companyId: string): CompanyData | null => {
  return massachusettsContractors[companyId] || null;
};

// Function to get all companies
export const getAllCompanies = (): CompanyData[] => {
  return Object.values(massachusettsContractors);
};

// Function to get companies by type
export const getCompaniesByType = (type: CompanyData['type']): CompanyData[] => {
  return Object.values(massachusettsContractors).filter(company => company.type === type);
};