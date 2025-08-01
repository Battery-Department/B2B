import { CompanyData, classifyBusiness, detectFleetSize, detectPricePoint } from './company-analyzer';
import fs from 'fs';
import path from 'path';

// Interface for the raw JSON data from Google Places API
interface GooglePlacesData {
  business_status: string;
  formatted_address: string;
  formatted_phone_number?: string;
  name: string;
  rating?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  types: string[];
  user_ratings_total?: number;
  website?: string;
}

// Convert Google Places data to our CompanyData format
export const convertGooglePlacesToCompanyData = (googleData: GooglePlacesData): CompanyData => {
  // Combine types and name for better classification
  const combinedText = `${googleData.name} ${googleData.types.join(' ')}`;
  const businessType = classifyBusiness(combinedText);
  
  // Extract reviews
  const reviews = (googleData.reviews || []).map(review => ({
    text: review.text,
    rating: review.rating
  }));
  
  // Detect indicators based on available data
  const fleetSize = detectFleetSize(reviews.map(r => r.text).join(' '));
  const pricePoint = detectPricePoint(reviews);
  
  // Extract location from address
  const addressParts = googleData.formatted_address.split(',');
  const location = addressParts.length >= 2 
    ? `${addressParts[addressParts.length - 3]?.trim()}, ${addressParts[addressParts.length - 2]?.trim()}`
    : googleData.formatted_address;
  
  // Create URL slug from name
  const urlSlug = googleData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return {
    name: googleData.name,
    url: googleData.website || `${urlSlug}.com`,
    type: businessType,
    rating: googleData.rating || 0,
    reviewCount: googleData.user_ratings_total || 0,
    reviews: reviews.slice(0, 5), // Take top 5 reviews
    websiteText: `${googleData.name} - Professional ${businessType} contractor serving Greater Boston`,
    aboutContent: `${googleData.name} is a trusted ${businessType} contractor located in ${location}`,
    services: googleData.types
      .filter(type => !['establishment', 'point_of_interest'].includes(type))
      .map(type => type.replace(/_/g, ' ').replace(/contractor|company/g, '').trim()),
    location: location,
    indicators: {
      fleetSize: fleetSize,
      techSavvy: googleData.website ? 'medium' : 'low',
      pricePoint: pricePoint
    }
  };
};

// Load all companies from the JSON file
export const loadMassachusettsContractors = async (): Promise<CompanyData[]> => {
  try {
    const filePath = path.join(
      process.cwd(),
      'massachusetts-construction-scraper',
      'output',
      'exports',
      'CLEAN_MA_CONSTRUCTION_711_20250729_152752.json'
    );
    
    // For client-side, we'll need to fetch this data via an API endpoint
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/massachusetts-contractors');
      const data = await response.json();
      return data.map((item: GooglePlacesData) => convertGooglePlacesToCompanyData(item));
    }
    
    // Server-side file reading
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const googlePlacesData: GooglePlacesData[] = JSON.parse(fileContent);
    
    return googlePlacesData.map(convertGooglePlacesToCompanyData);
  } catch (error) {
    console.error('Error loading Massachusetts contractors:', error);
    return [];
  }
};

// Get a specific company by matching name or ID
export const getCompanyByIdentifier = async (identifier: string): Promise<CompanyData | null> => {
  const companies = await loadMassachusettsContractors();
  
  // Try exact name match first
  let company = companies.find(c => c.name.toLowerCase() === identifier.toLowerCase());
  
  // Try partial match
  if (!company) {
    company = companies.find(c => 
      c.name.toLowerCase().includes(identifier.toLowerCase()) ||
      identifier.toLowerCase().includes(c.name.toLowerCase())
    );
  }
  
  // Try URL slug match
  if (!company) {
    const urlSlug = identifier.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    company = companies.find(c => 
      c.url.toLowerCase().includes(urlSlug) ||
      c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(urlSlug)
    );
  }
  
  return company || null;
};

// Get random companies for testing
export const getRandomCompanies = async (count: number = 5): Promise<CompanyData[]> => {
  const companies = await loadMassachusettsContractors();
  const shuffled = [...companies].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Get companies by type
export const getCompaniesByType = async (type: CompanyData['type']): Promise<CompanyData[]> => {
  const companies = await loadMassachusettsContractors();
  return companies.filter(company => company.type === type);
};