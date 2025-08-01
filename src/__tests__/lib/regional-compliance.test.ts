// RHY Enterprise Regional Compliance Tests
// Comprehensive test suite for multi-warehouse compliance management

import { RegionalComplianceManager } from '@/lib/regional-compliance';
import { WarehouseLocation } from '@/types/warehouse-metrics';
import { performanceMonitor } from '@/lib/performance';

// Mock dependencies
jest.mock('@/lib/performance');

const mockPerformanceMonitor = performanceMonitor as jest.Mocked<typeof performanceMonitor>;

describe('RegionalComplianceManager', () => {
  let complianceManager: RegionalComplianceManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    complianceManager = new RegionalComplianceManager();
    mockPerformanceMonitor.track = jest.fn();
  });

  const createMockWarehouse = (region: 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA'): WarehouseLocation => ({
    id: `warehouse-${region.toLowerCase()}`,
    name: `${region} Distribution Center`,
    code: `DC-${region}`,
    region,
    address: {
      street: '123 Main St',
      city: 'Test City',
      state: 'Test State',
      country: region === 'US_WEST' ? 'USA' : region === 'JAPAN' ? 'Japan' : region === 'EU' ? 'Germany' : 'Australia',
      postalCode: '12345',
      timezone: region === 'US_WEST' ? 'America/Los_Angeles' : region === 'JAPAN' ? 'Asia/Tokyo' : region === 'EU' ? 'Europe/Berlin' : 'Australia/Sydney'
    },
    compliance: {
      standards: [],
      certifications: [],
      lastAudit: new Date('2024-01-01'),
      nextAudit: new Date('2024-04-01')
    },
    capacity: {
      maxUnits: 10000,
      currentUnits: 7500,
      utilizationRate: 0.75
    },
    contact: {
      manager: 'Test Manager',
      email: 'manager@test.com',
      phone: '+1-555-0123'
    }
  });

  describe('assessWarehouseCompliance', () => {
    it('should assess US West warehouse compliance with OSHA standards', async () => {
      const usWarehouse = createMockWarehouse('US_WEST');
      
      const assessment = await complianceManager.assessWarehouseCompliance(usWarehouse);

      expect(assessment).toBeDefined();
      expect(assessment.warehouseId).toBe(usWarehouse.id);
      expect(assessment.region).toBe('US_WEST');
      expect(assessment.standards).toBeDefined();
      expect(assessment.standards.length).toBeGreaterThan(0);
      expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
      expect(assessment.overallScore).toBeLessThanOrEqual(100);
      expect(assessment.overallStatus).toMatch(/^(COMPLIANT|WARNING|NON_COMPLIANT)$/);

      // Verify OSHA standard is included
      const oshaStandard = assessment.standards.find(s => s.standardId === 'OSHA_GENERAL_INDUSTRY');
      expect(oshaStandard).toBeDefined();

      expect(mockPerformanceMonitor.track).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'assessWarehouseCompliance',
          success: true,
          warehouseId: usWarehouse.id,
          region: 'US_WEST'
        })
      );
    });

    it('should assess Japan warehouse compliance with JIS standards', async () => {
      const japanWarehouse = createMockWarehouse('JAPAN');
      
      const assessment = await complianceManager.assessWarehouseCompliance(japanWarehouse);

      expect(assessment.region).toBe('JAPAN');
      
      // Verify JIS standard is included
      const jisStandard = assessment.standards.find(s => s.standardId === 'JIS_QUALITY');
      expect(jisStandard).toBeDefined();
    });

    it('should assess EU warehouse compliance with GDPR', async () => {
      const euWarehouse = createMockWarehouse('EU');
      
      const assessment = await complianceManager.assessWarehouseCompliance(euWarehouse);

      expect(assessment.region).toBe('EU');
      
      // Verify GDPR standard is included
      const gdprStandard = assessment.standards.find(s => s.standardId === 'GDPR');
      expect(gdprStandard).toBeDefined();
      expect(gdprStandard?.status).toMatch(/^(COMPLIANT|WARNING|NON_COMPLIANT)$/);
    });

    it('should assess Australia warehouse compliance with WHS Act', async () => {
      const auWarehouse = createMockWarehouse('AUSTRALIA');
      
      const assessment = await complianceManager.assessWarehouseCompliance(auWarehouse);

      expect(assessment.region).toBe('AUSTRALIA');
      
      // Verify WHS standard is included
      const whsStandard = assessment.standards.find(s => s.standardId === 'WHS_ACT');
      expect(whsStandard).toBeDefined();
    });

    it('should generate action items for non-compliant findings', async () => {
      const warehouse = createMockWarehouse('US_WEST');
      
      const assessment = await complianceManager.assessWarehouseCompliance(warehouse);

      expect(assessment.actionItems).toBeDefined();
      expect(Array.isArray(assessment.actionItems)).toBe(true);

      // If there are action items, verify their structure
      assessment.actionItems.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.priority).toMatch(/^(LOW|MEDIUM|HIGH|URGENT)$/);
        expect(item.status).toMatch(/^(OPEN|IN_PROGRESS|COMPLETED|OVERDUE)$/);
        expect(item.dueDate).toBeInstanceOf(Date);
        expect(item.assignedTo).toBeDefined();
        expect(typeof item.estimatedEffort).toBe('number');
      });
    });

    it('should calculate next assessment date based on audit frequency', async () => {
      const warehouse = createMockWarehouse('EU');
      const assessmentDate = new Date('2024-06-01');
      
      const assessment = await complianceManager.assessWarehouseCompliance(warehouse, assessmentDate);

      expect(assessment.nextAssessment).toBeInstanceOf(Date);
      expect(assessment.nextAssessment.getTime()).toBeGreaterThan(assessmentDate.getTime());
    });

    it('should handle assessment errors gracefully', async () => {
      const warehouse = createMockWarehouse('US_WEST');
      
      // Mock a failure in assessment
      jest.spyOn(complianceManager as any, 'assessStandard').mockRejectedValue(
        new Error('Assessment service unavailable')
      );

      await expect(complianceManager.assessWarehouseCompliance(warehouse))
        .rejects.toThrow('Assessment service unavailable');

      expect(mockPerformanceMonitor.track).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Assessment service unavailable'
        })
      );
    });
  });

  describe('getRegionalCompliance', () => {
    it('should return US West compliance requirements', async () => {
      const compliance = await complianceManager.getRegionalCompliance('US_WEST');

      expect(compliance).toBeDefined();
      expect(compliance.region).toBe('US_WEST');
      expect(compliance.standards).toBeDefined();
      expect(compliance.requirements).toBeDefined();
      expect(compliance.requirements.reportingFrequency).toBe('QUARTERLY');
      expect(compliance.requirements.dataRetention).toBe(2190); // Non-GDPR retention
    });

    it('should return EU compliance with GDPR requirements', async () => {
      const compliance = await complianceManager.getRegionalCompliance('EU');

      expect(compliance.region).toBe('EU');
      expect(compliance.requirements.dataRetention).toBe(2555); // GDPR retention
      expect(compliance.requirements.privacyRules).toContain('GDPR Article 6 lawful basis');
      expect(compliance.requirements.privacyRules).toContain('GDPR Article 17 right to erasure');
    });

    it('should return Japan compliance requirements', async () => {
      const compliance = await complianceManager.getRegionalCompliance('JAPAN');

      expect(compliance.region).toBe('JAPAN');
      expect(compliance.requirements.reportingFrequency).toBe('MONTHLY');
    });

    it('should return Australia compliance requirements', async () => {
      const compliance = await complianceManager.getRegionalCompliance('AUSTRALIA');

      expect(compliance.region).toBe('AUSTRALIA');
      expect(compliance.requirements.reportingFrequency).toBe('MONTHLY');
    });
  });

  describe('getComplianceStandards', () => {
    it('should return all standards when no region specified', () => {
      const standards = complianceManager.getComplianceStandards();

      expect(standards).toBeDefined();
      expect(Array.isArray(standards)).toBe(true);
      expect(standards.length).toBeGreaterThan(0);

      // Should include standards from all regions
      const regions = new Set(standards.map(s => s.region));
      expect(regions.has('US_WEST')).toBe(true);
      expect(regions.has('JAPAN')).toBe(true);
      expect(regions.has('EU')).toBe(true);
      expect(regions.has('AUSTRALIA')).toBe(true);
    });

    it('should filter standards by region when specified', () => {
      const usStandards = complianceManager.getComplianceStandards('US_WEST');

      expect(usStandards).toBeDefined();
      expect(usStandards.length).toBeGreaterThan(0);
      
      // All standards should be US_WEST
      usStandards.forEach(standard => {
        expect(standard.region).toBe('US_WEST');
      });
    });

    it('should include mandatory standards for each region', () => {
      const regions: Array<'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA'> = ['US_WEST', 'JAPAN', 'EU', 'AUSTRALIA'];

      regions.forEach(region => {
        const standards = complianceManager.getComplianceStandards(region);
        const mandatoryStandards = standards.filter(s => s.mandatory);
        
        expect(mandatoryStandards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Compliance Standard Validation', () => {
    it('should validate OSHA standard structure', () => {
      const oshaStandards = complianceManager.getComplianceStandards('US_WEST');
      const osha = oshaStandards.find(s => s.id === 'OSHA_GENERAL_INDUSTRY');

      expect(osha).toBeDefined();
      expect(osha?.name).toBe('OSHA General Industry Standards');
      expect(osha?.type).toBe('SAFETY');
      expect(osha?.version).toBe('29 CFR 1910');
      expect(osha?.mandatory).toBe(true);
      expect(osha?.requirements).toBeDefined();
      expect(osha?.requirements.length).toBeGreaterThan(0);
    });

    it('should validate GDPR standard structure', () => {
      const euStandards = complianceManager.getComplianceStandards('EU');
      const gdpr = euStandards.find(s => s.id === 'GDPR');

      expect(gdpr).toBeDefined();
      expect(gdpr?.name).toBe('General Data Protection Regulation');
      expect(gdpr?.type).toBe('DATA_PRIVACY');
      expect(gdpr?.version).toBe('Regulation (EU) 2016/679');
      expect(gdpr?.penalties.critical).toContain('€20M or 4% annual turnover');
    });

    it('should validate JIS standard structure', () => {
      const japanStandards = complianceManager.getComplianceStandards('JAPAN');
      const jis = japanStandards.find(s => s.id === 'JIS_QUALITY');

      expect(jis).toBeDefined();
      expect(jis?.type).toBe('QUALITY');
      expect(jis?.auditFrequency).toBe('QUARTERLY');
    });

    it('should validate WHS standard structure', () => {
      const auStandards = complianceManager.getComplianceStandards('AUSTRALIA');
      const whs = auStandards.find(s => s.id === 'WHS_ACT');

      expect(whs).toBeDefined();
      expect(whs?.type).toBe('SAFETY');
      expect(whs?.penalties.critical).toContain('AUD $3M fine');
    });
  });

  describe('Compliance Scoring', () => {
    it('should calculate overall compliance scores correctly', async () => {
      const warehouse = createMockWarehouse('US_WEST');
      
      const assessment = await complianceManager.assessWarehouseCompliance(warehouse);

      // Overall score should be average of individual standard scores
      const standardScores = assessment.standards.map(s => s.score);
      const expectedAverage = standardScores.reduce((sum, score) => sum + score, 0) / standardScores.length;
      
      expect(assessment.overallScore).toBeCloseTo(expectedAverage, 1);
    });

    it('should map scores to compliance status correctly', async () => {
      const warehouse = createMockWarehouse('EU');
      
      const assessment = await complianceManager.assessWarehouseCompliance(warehouse);

      // Verify status mapping logic
      if (assessment.overallScore >= 90) {
        expect(assessment.overallStatus).toBe('COMPLIANT');
      } else if (assessment.overallScore >= 70) {
        expect(assessment.overallStatus).toBe('WARNING');
      } else {
        expect(assessment.overallStatus).toBe('NON_COMPLIANT');
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete assessments within performance targets', async () => {
      const warehouse = createMockWarehouse('US_WEST');
      
      const startTime = performance.now();
      await complianceManager.assessWarehouseCompliance(warehouse);
      const endTime = performance.now();

      // Should complete within reasonable time (100ms target)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle multiple concurrent assessments', async () => {
      const warehouses = [
        createMockWarehouse('US_WEST'),
        createMockWarehouse('JAPAN'),
        createMockWarehouse('EU'),
        createMockWarehouse('AUSTRALIA')
      ];

      const startTime = performance.now();
      const assessments = await Promise.all(
        warehouses.map(wh => complianceManager.assessWarehouseCompliance(wh))
      );
      const endTime = performance.now();

      expect(assessments).toHaveLength(4);
      expect(endTime - startTime).toBeLessThan(500); // Should handle concurrency well

      // Verify all assessments are valid
      assessments.forEach((assessment, index) => {
        expect(assessment.region).toBe(warehouses[index].region);
        expect(assessment.warehouseId).toBe(warehouses[index].id);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid warehouse data', async () => {
      const invalidWarehouse = {
        ...createMockWarehouse('US_WEST'),
        region: 'INVALID_REGION' as any
      };

      // Should handle gracefully or throw appropriate error
      await expect(complianceManager.assessWarehouseCompliance(invalidWarehouse))
        .rejects.toThrow();
    });

    it('should handle assessment date edge cases', async () => {
      const warehouse = createMockWarehouse('EU');
      
      // Future date
      const futureDate = new Date('2025-12-31');
      const assessment = await complianceManager.assessWarehouseCompliance(warehouse, futureDate);
      
      expect(assessment.assessmentDate).toEqual(futureDate);
      expect(assessment.nextAssessment.getTime()).toBeGreaterThan(futureDate.getTime());
    });

    it('should validate compliance standard data integrity', () => {
      const allStandards = complianceManager.getComplianceStandards();

      allStandards.forEach(standard => {
        // Validate required fields
        expect(standard.id).toBeDefined();
        expect(standard.name).toBeDefined();
        expect(standard.region).toMatch(/^(US_WEST|JAPAN|EU|AUSTRALIA)$/);
        expect(standard.type).toMatch(/^(SAFETY|DATA_PRIVACY|ENVIRONMENTAL|QUALITY|LABOR)$/);
        expect(standard.version).toBeDefined();
        expect(Array.isArray(standard.requirements)).toBe(true);
        expect(standard.auditFrequency).toMatch(/^(MONTHLY|QUARTERLY|ANNUALLY|BIANNUALLY)$/);
        expect(typeof standard.mandatory).toBe('boolean');

        // Validate penalties structure
        expect(standard.penalties.minor).toBeDefined();
        expect(standard.penalties.major).toBeDefined();
        expect(standard.penalties.critical).toBeDefined();

        // Validate requirements structure
        standard.requirements.forEach(requirement => {
          expect(requirement.id).toBeDefined();
          expect(requirement.description).toBeDefined();
          expect(requirement.category).toBeDefined();
          expect(Array.isArray(requirement.checkpoints)).toBe(true);
          expect(Array.isArray(requirement.evidence)).toBe(true);
          expect(requirement.frequency).toMatch(/^(DAILY|WEEKLY|MONTHLY|QUARTERLY|ANNUALLY)$/);
        });
      });
    });
  });
});