// Data enrichment service for user data enhancement and match quality scoring
import { UserData, EnrichedUserData, MatchQualityScore } from './types';
import { createHash } from 'crypto';

// SHA-256 hashing function for PII data
export function hashData(data: string): string {
  // In browser environment, use Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // This is handled async in browser, but for simplicity we'll use a sync fallback
    return simpleHash(data);
  }
  
  // In Node.js environment
  try {
    return createHash('sha256').update(data).digest('hex');
  } catch (error) {
    // Fallback to simple hash
    return simpleHash(data);
  }
}

// Simple hash function as fallback
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export class DataEnrichmentService {
  private static instance: DataEnrichmentService;
  private customParameters: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): DataEnrichmentService {
    if (!DataEnrichmentService.instance) {
      DataEnrichmentService.instance = new DataEnrichmentService();
    }
    return DataEnrichmentService.instance;
  }

  enrichUserData(userData: UserData): EnrichedUserData {
    const enriched: EnrichedUserData = { ...userData };

    // Calculate match quality
    enriched.matchQuality = this.calculateMatchQuality(userData);

    // Hash PII data
    enriched.hashedData = this.hashUserData(userData);

    // Add any custom parameters
    this.customParameters.forEach((value, key) => {
      (enriched as any)[key] = value;
    });

    return enriched;
  }

  calculateMatchQuality(userData: UserData): MatchQualityScore {
    const fieldScores: MatchQualityScore['fields'] = {};
    let totalScore = 0;
    let fieldCount = 0;

    // Email - highest quality signal
    if (userData.email) {
      const emailScore = this.scoreEmail(userData.email);
      fieldScores.email = emailScore;
      totalScore += emailScore * 2; // Double weight
      fieldCount += 2;
    }

    // Phone - high quality signal
    if (userData.phone) {
      const phoneScore = this.scorePhone(userData.phone);
      fieldScores.phone = phoneScore;
      totalScore += phoneScore * 1.5; // 1.5x weight
      fieldCount += 1.5;
    }

    // Name fields
    if (userData.firstName) {
      fieldScores.firstName = userData.firstName.length >= 2 ? 1 : 0.5;
      totalScore += fieldScores.firstName;
      fieldCount++;
    }

    if (userData.lastName) {
      fieldScores.lastName = userData.lastName.length >= 2 ? 1 : 0.5;
      totalScore += fieldScores.lastName;
      fieldCount++;
    }

    // Date of birth
    if (userData.dateOfBirth) {
      fieldScores.dateOfBirth = this.scoreDateOfBirth(userData.dateOfBirth);
      totalScore += fieldScores.dateOfBirth;
      fieldCount++;
    }

    // Gender
    if (userData.gender) {
      fieldScores.gender = ['m', 'f', 'male', 'female'].includes(userData.gender.toLowerCase()) ? 1 : 0.5;
      totalScore += fieldScores.gender;
      fieldCount++;
    }

    // Location fields
    if (userData.city) {
      fieldScores.city = userData.city.length >= 2 ? 0.8 : 0.4;
      totalScore += fieldScores.city;
      fieldCount++;
    }

    if (userData.state) {
      fieldScores.state = userData.state.length >= 2 ? 0.8 : 0.4;
      totalScore += fieldScores.state;
      fieldCount++;
    }

    if (userData.zip) {
      fieldScores.zip = this.scoreZip(userData.zip);
      totalScore += fieldScores.zip;
      fieldCount++;
    }

    if (userData.country) {
      fieldScores.country = userData.country.length === 2 ? 1 : 0.8;
      totalScore += fieldScores.country;
      fieldCount++;
    }

    // External ID - high quality if properly formatted
    if (userData.externalId) {
      fieldScores.externalId = 1;
      totalScore += 1.5; // 1.5x weight
      fieldCount += 1.5;
    }

    // Calculate overall score
    const overall = fieldCount > 0 ? totalScore / fieldCount : 0;

    return {
      overall: Math.round(overall * 100) / 100,
      fields: fieldScores,
    };
  }

  private scoreEmail(email: string): number {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 0;

    // Check for common patterns that indicate low quality
    const lowQualityPatterns = [
      /test@/i,
      /example@/i,
      /^[a-z]@/i, // Single letter before @
      /\+\d+@/, // Plus addressing with just numbers
    ];

    for (const pattern of lowQualityPatterns) {
      if (pattern.test(email)) return 0.5;
    }

    return 1;
  }

  private scorePhone(phone: string): number {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');

    // Check length (US phone numbers)
    if (digits.length === 10 || digits.length === 11) {
      return 1;
    }

    // International numbers
    if (digits.length >= 7 && digits.length <= 15) {
      return 0.8;
    }

    return 0.3;
  }

  private scoreDateOfBirth(dob: string): number {
    // Try to parse the date
    const date = new Date(dob);
    if (isNaN(date.getTime())) return 0;

    // Check if it's a reasonable age (13-120 years old)
    const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age >= 13 && age <= 120) {
      return 1;
    }

    return 0.3;
  }

  private scoreZip(zip: string): number {
    // US ZIP codes
    if (/^\d{5}(-\d{4})?$/.test(zip)) {
      return 1;
    }

    // International postal codes (basic check)
    if (zip.length >= 3 && zip.length <= 10) {
      return 0.7;
    }

    return 0.3;
  }

  private hashUserData(userData: UserData): Record<string, string> {
    const hashed: Record<string, string> = {};

    if (userData.email) {
      hashed.em = hashData(userData.email.toLowerCase().trim());
    }
    if (userData.phone) {
      hashed.ph = hashData(userData.phone.replace(/\D/g, ''));
    }
    if (userData.firstName) {
      hashed.fn = hashData(userData.firstName.toLowerCase().trim());
    }
    if (userData.lastName) {
      hashed.ln = hashData(userData.lastName.toLowerCase().trim());
    }
    if (userData.dateOfBirth) {
      // Format as YYYYMMDD
      const date = new Date(userData.dateOfBirth);
      if (!isNaN(date.getTime())) {
        const formatted = date.toISOString().split('T')[0].replace(/-/g, '');
        hashed.db = hashData(formatted);
      }
    }
    if (userData.gender) {
      hashed.ge = hashData(userData.gender.toLowerCase().charAt(0));
    }
    if (userData.city) {
      hashed.ct = hashData(userData.city.toLowerCase().trim());
    }
    if (userData.state) {
      hashed.st = hashData(userData.state.toLowerCase().trim());
    }
    if (userData.zip) {
      hashed.zp = hashData(userData.zip.replace(/\s/g, ''));
    }
    if (userData.country) {
      hashed.country = hashData(userData.country.toLowerCase().trim());
    }
    if (userData.externalId) {
      hashed.external_id = hashData(userData.externalId);
    }

    return hashed;
  }

  // Set custom parameters that will be added to all enriched data
  setCustomParameter(key: string, value: any): void {
    this.customParameters.set(key, value);
  }

  removeCustomParameter(key: string): void {
    this.customParameters.delete(key);
  }

  getCustomParameters(): Record<string, any> {
    return Object.fromEntries(this.customParameters);
  }

  // Validate and format user data
  validateUserData(userData: UserData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (userData.email && !this.scoreEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    if (userData.phone && this.scorePhone(userData.phone) < 0.5) {
      errors.push('Invalid phone number format');
    }

    if (userData.dateOfBirth && !this.scoreDateOfBirth(userData.dateOfBirth)) {
      errors.push('Invalid date of birth');
    }

    if (userData.gender && !['m', 'f', 'male', 'female'].includes(userData.gender.toLowerCase())) {
      errors.push('Invalid gender value (use m/f or male/female)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Format user data for optimal matching
  formatUserData(userData: UserData): UserData {
    const formatted: UserData = {};

    if (userData.email) {
      formatted.email = userData.email.toLowerCase().trim();
    }

    if (userData.phone) {
      // Remove all non-digits and format
      formatted.phone = userData.phone.replace(/\D/g, '');
    }

    if (userData.firstName) {
      formatted.firstName = userData.firstName.trim();
    }

    if (userData.lastName) {
      formatted.lastName = userData.lastName.trim();
    }

    if (userData.dateOfBirth) {
      // Try to parse and format as YYYY-MM-DD
      const date = new Date(userData.dateOfBirth);
      if (!isNaN(date.getTime())) {
        formatted.dateOfBirth = date.toISOString().split('T')[0];
      }
    }

    if (userData.gender) {
      // Normalize to single letter
      const gender = userData.gender.toLowerCase();
      formatted.gender = gender.startsWith('m') ? 'm' : gender.startsWith('f') ? 'f' : gender;
    }

    if (userData.city) {
      formatted.city = userData.city.trim();
    }

    if (userData.state) {
      formatted.state = userData.state.toUpperCase().trim();
    }

    if (userData.zip) {
      formatted.zip = userData.zip.replace(/\s/g, '');
    }

    if (userData.country) {
      // Convert to 2-letter code if possible
      formatted.country = userData.country.length === 2 
        ? userData.country.toUpperCase() 
        : userData.country;
    }

    if (userData.externalId) {
      formatted.externalId = userData.externalId.trim();
    }

    return formatted;
  }
}