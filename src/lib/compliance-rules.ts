/**
 * RHY Compliance Rules Engine - Multi-Region Regulation Validation
 * Defines and executes compliance rules for global warehouse operations
 * Supports automated validation of regulatory requirements
 * 
 * Performance Target: <10ms rule execution
 * Coverage: US (OSHA, DOT), Japan (JIS), EU (GDPR, CE), Australia (ACL)
 */

export interface ComplianceRule {
  id: string
  name: string
  description: string
  region: 'US_WEST' | 'JAPAN' | 'EU_GERMANY' | 'AUSTRALIA' | 'GLOBAL'
  regulation: string
  checkpointId: string
  ruleType: 'THRESHOLD' | 'PRESENCE' | 'FORMAT' | 'CALCULATION' | 'CUSTOM'
  parameters: Record<string, any>
  errorMessage: string
  remediation: string
  automationLevel: 'FULL' | 'PARTIAL' | 'MANUAL'
  validate: (request: any, checkpoint: any) => Promise<ValidationResult>
}

export interface ValidationResult {
  passed: boolean
  actualValue?: any
  expectedValue?: any
  variance?: number
  reason?: string
  remediation?: string
  metadata?: Record<string, any>
}

export class ComplianceRules {
  private rules: Map<string, ComplianceRule> = new Map()

  constructor() {
    this.initializeRules()
  }

  /**
   * Get compliance rule by region and checkpoint ID
   */
  getRule(region: string, checkpointId: string): ComplianceRule | undefined {
    const key = `${region}-${checkpointId}`
    return this.rules.get(key)
  }

  /**
   * Get all rules for a specific region
   */
  getRulesByRegion(region: string): ComplianceRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.region === region || rule.region === 'GLOBAL')
  }

  /**
   * Add or update a compliance rule
   */
  addRule(rule: ComplianceRule): void {
    const key = `${rule.region}-${rule.checkpointId}`
    this.rules.set(key, rule)
  }

  /**
   * Remove a compliance rule
   */
  removeRule(region: string, checkpointId: string): boolean {
    const key = `${region}-${checkpointId}`
    return this.rules.delete(key)
  }

  /**
   * Initialize all compliance rules
   */
  private initializeRules(): void {
    // US (OSHA) Rules
    this.addUSRules()
    
    // Japan (JIS) Rules
    this.addJapanRules()
    
    // EU (GDPR, CE) Rules
    this.addEURules()
    
    // Australia (ACL) Rules
    this.addAustraliaRules()
    
    // Global (ISO) Rules
    this.addGlobalRules()
  }

  /**
   * US Warehouse Compliance Rules
   */
  private addUSRules(): void {
    // OSHA PPE Availability Rule
    this.addRule({
      id: 'US_OSHA_PPE_AVAILABILITY',
      name: 'OSHA PPE Equipment Availability',
      description: 'Verify personal protective equipment is available and accessible',
      region: 'US_WEST',
      regulation: 'OSHA_29CFR1910',
      checkpointId: 'PPE_AVAILABILITY',
      ruleType: 'PRESENCE',
      parameters: {
        requiredEquipment: ['safety_glasses', 'gloves', 'hard_hat', 'safety_shoes'],
        minimumQuantity: 10,
        accessibilityRadius: 50 // meters
      },
      errorMessage: 'Required PPE equipment not available or not accessible',
      remediation: 'Ensure all required PPE is stocked and within 50m of work areas',
      automationLevel: 'FULL',
      validate: async (request: any, checkpoint: any): Promise<ValidationResult> => {
        const warehouseData = request.metadata?.warehouseData
        const requiredEquipment = ['safety_glasses', 'gloves', 'hard_hat', 'safety_shoes']
        
        if (!warehouseData?.ppeInventory) {
          return {
            passed: false,
            reason: 'PPE inventory data not available',
            remediation: 'Update warehouse inventory system with PPE tracking',
            metadata: { missingData: 'ppeInventory' }
          }
        }

        const missingEquipment = requiredEquipment.filter(item => {
          const inventory = warehouseData.ppeInventory[item]
          return !inventory || inventory.quantity < 10 || !inventory.accessible
        })

        if (missingEquipment.length > 0) {
          return {
            passed: false,
            actualValue: warehouseData.ppeInventory,
            expectedValue: requiredEquipment.map(item => ({ [item]: { quantity: 10, accessible: true } })),
            reason: `Missing or insufficient PPE: ${missingEquipment.join(', ')}`,
            remediation: `Restock the following PPE items: ${missingEquipment.join(', ')}`,
            metadata: { missingEquipment }
          }
        }

        return {
          passed: true,
          actualValue: warehouseData.ppeInventory,
          metadata: { allEquipmentAvailable: true }
        }
      }
    })

    // DOT UN3480 Packaging Compliance Rule
    this.addRule({
      id: 'US_DOT_UN3480_PACKAGING',
      name: 'DOT UN3480 Packaging Compliance',
      description: 'Verify lithium battery packaging meets UN3480 standards',
      region: 'US_WEST',
      regulation: 'DOT_49CFR',
      checkpointId: 'UN3480_COMPLIANCE',
      ruleType: 'CUSTOM',
      parameters: {
        requiredCertifications: ['UN3480', 'ISTA_7D'],
        maxBatteryCapacity: 300, // Wh
        packagingStandards: ['4G', '4GV']
      },
      errorMessage: 'Battery packaging does not meet UN3480 requirements',
      remediation: 'Use UN3480 certified packaging and ensure proper documentation',
      automationLevel: 'PARTIAL',
      validate: async (request: any, checkpoint: any): Promise<ValidationResult> => {
        const shipmentData = request.metadata?.shipmentData
        const productType = request.productType

        if (!shipmentData?.packaging) {
          return {
            passed: false,
            reason: 'Packaging information not available',
            remediation: 'Provide complete packaging documentation for shipment',
            metadata: { missingData: 'packaging' }
          }
        }

        // Check if product is a lithium battery
        const isLithiumBattery = ['FLEXVOLT_6AH', 'FLEXVOLT_9AH', 'FLEXVOLT_15AH'].includes(productType)
        
        if (!isLithiumBattery) {
          return {
            passed: true,
            reason: 'UN3480 not applicable to non-lithium battery products',
            metadata: { exemption: 'non_lithium_product' }
          }
        }

        // Check UN3480 certification
        const hasUN3480Cert = shipmentData.packaging.certifications?.includes('UN3480')
        const hasProperMarkings = shipmentData.packaging.markings?.includes('LITHIUM BATTERY')
        const hasProperDocumentation = shipmentData.packaging.documentation?.includes('shipping_paper')

        const violations = []
        if (!hasUN3480Cert) violations.push('Missing UN3480 certification')
        if (!hasProperMarkings) violations.push('Missing lithium battery markings')
        if (!hasProperDocumentation) violations.push('Missing shipping documentation')

        if (violations.length > 0) {
          return {
            passed: false,
            actualValue: shipmentData.packaging,
            expectedValue: {
              certifications: ['UN3480'],
              markings: ['LITHIUM BATTERY'],
              documentation: ['shipping_paper']
            },
            reason: violations.join('; '),
            remediation: 'Obtain proper UN3480 certification and complete all required documentation',
            metadata: { violations }
          }
        }

        return {
          passed: true,
          actualValue: shipmentData.packaging,
          metadata: { un3480Compliant: true }
        }
      }
    })
  }

  /**
   * Japan (JIS) Compliance Rules
   */
  private addJapanRules(): void {
    // JIS Quality Control Documentation Rule
    this.addRule({
      id: 'JP_JIS_QUALITY_DOCUMENTATION',
      name: 'JIS Quality Control Documentation',
      description: 'Verify quality control documentation meets JIS C 8712 requirements',
      region: 'JAPAN',
      regulation: 'JIS_C8712',
      checkpointId: 'QUALITY_DOCUMENTATION',
      ruleType: 'PRESENCE',
      parameters: {
        requiredDocuments: ['quality_manual', 'test_procedures', 'calibration_records', 'training_records'],
        documentRetentionPeriod: 1095, // 3 years in days
        languageRequirement: 'japanese'
      },
      errorMessage: 'Quality control documentation incomplete or not in compliance with JIS standards',
      remediation: 'Complete all required quality documentation in Japanese and ensure proper retention',
      automationLevel: 'PARTIAL',
      validate: async (request: any, checkpoint: any): Promise<ValidationResult> => {
        const qualityData = request.metadata?.qualityData
        const requiredDocs = ['quality_manual', 'test_procedures', 'calibration_records', 'training_records']

        if (!qualityData?.documentation) {
          return {
            passed: false,
            reason: 'Quality documentation data not available',
            remediation: 'Upload all required quality control documentation',
            metadata: { missingData: 'qualityDocumentation' }
          }
        }

        const missingDocs = requiredDocs.filter(doc => {
          const docInfo = qualityData.documentation[doc]
          return !docInfo || !docInfo.present || docInfo.language !== 'japanese'
        })

        const expiredDocs = requiredDocs.filter(doc => {
          const docInfo = qualityData.documentation[doc]
          if (!docInfo?.lastUpdated) return false
          
          const daysSinceUpdate = (Date.now() - new Date(docInfo.lastUpdated).getTime()) / (24 * 60 * 60 * 1000)
          return daysSinceUpdate > 1095 // 3 years
        })

        const violations = []
        if (missingDocs.length > 0) violations.push(`Missing documents: ${missingDocs.join(', ')}`)
        if (expiredDocs.length > 0) violations.push(`Expired documents: ${expiredDocs.join(', ')}`)

        if (violations.length > 0) {
          return {
            passed: false,
            actualValue: qualityData.documentation,
            expectedValue: {
              documents: requiredDocs,
              language: 'japanese',
              maxAge: '3 years'
            },
            reason: violations.join('; '),
            remediation: 'Update missing or expired quality documentation in Japanese',
            metadata: { missingDocs, expiredDocs }
          }
        }

        return {
          passed: true,
          actualValue: qualityData.documentation,
          metadata: { allDocumentsCompliant: true }
        }
      }
    })
  }

  /**
   * EU (GDPR, CE) Compliance Rules
   */
  private addEURules(): void {
    // GDPR Data Retention Policy Rule
    this.addRule({
      id: 'EU_GDPR_DATA_RETENTION',
      name: 'GDPR Data Retention Policy',
      description: 'Verify data retention policies comply with GDPR Article 5(1)(e)',
      region: 'EU_GERMANY',
      regulation: 'GDPR_2016_679',
      checkpointId: 'RETENTION_POLICY',
      ruleType: 'CUSTOM',
      parameters: {
        maxRetentionPeriods: {
          'customer_data': 2555, // 7 years in days
          'order_data': 2555, // 7 years in days
          'employee_data': 365, // 1 year after employment ends
          'marketing_data': 1095 // 3 years or until consent withdrawn
        },
        dataCategories: ['personal', 'sensitive', 'commercial'],
        consentTypes: ['explicit', 'implied', 'legitimate_interest']
      },
      errorMessage: 'Data retention policies do not comply with GDPR requirements',
      remediation: 'Implement automated data retention policies with proper consent management',
      automationLevel: 'FULL',
      validate: async (request: any, checkpoint: any): Promise<ValidationResult> => {
        const dataGovernance = request.metadata?.dataGovernance
        
        if (!dataGovernance?.retentionPolicies) {
          return {
            passed: false,
            reason: 'Data retention policies not defined',
            remediation: 'Implement comprehensive data retention policies per GDPR requirements',
            metadata: { missingData: 'retentionPolicies' }
          }
        }

        const maxRetentionPeriods = {
          'customer_data': 2555,
          'order_data': 2555,
          'employee_data': 365,
          'marketing_data': 1095
        }

        const violations = []
        
        for (const [dataType, maxDays] of Object.entries(maxRetentionPeriods)) {
          const policy = dataGovernance.retentionPolicies[dataType]
          
          if (!policy) {
            violations.push(`No retention policy for ${dataType}`)
            continue
          }

          if (policy.retentionDays > maxDays) {
            violations.push(`${dataType} retention period (${policy.retentionDays} days) exceeds maximum (${maxDays} days)`)
          }

          if (!policy.automaticDeletion) {
            violations.push(`${dataType} lacks automatic deletion mechanism`)
          }

          if (dataType === 'marketing_data' && !policy.consentBasedDeletion) {
            violations.push(`${dataType} lacks consent-based deletion capability`)
          }
        }

        // Check for data subject rights implementation
        const requiredRights = ['access', 'rectification', 'erasure', 'portability']
        const implementedRights = dataGovernance.dataSubjectRights || []
        const missingRights = requiredRights.filter(right => !implementedRights.includes(right))
        
        if (missingRights.length > 0) {
          violations.push(`Missing data subject rights: ${missingRights.join(', ')}`)
        }

        if (violations.length > 0) {
          return {
            passed: false,
            actualValue: dataGovernance.retentionPolicies,
            expectedValue: maxRetentionPeriods,
            reason: violations.join('; '),
            remediation: 'Update data retention policies to comply with GDPR limits and implement missing features',
            metadata: { violations, missingRights }
          }
        }

        return {
          passed: true,
          actualValue: dataGovernance.retentionPolicies,
          metadata: { gdprCompliant: true }
        }
      }
    })

    // CE Marking Certificate Validation Rule
    this.addRule({
      id: 'EU_CE_CERTIFICATE_VALIDATION',
      name: 'CE Marking Certificate Validation',
      description: 'Verify CE marking certificates are valid and current',
      region: 'EU_GERMANY',
      regulation: 'CE_2014_30_EU',
      checkpointId: 'CE_CERTIFICATE',
      ruleType: 'PRESENCE',
      parameters: {
        requiredDocuments: ['ce_certificate', 'declaration_of_conformity', 'technical_documentation'],
        certificateValidityPeriod: 1095, // 3 years in days
        requiredStandards: ['EN 55032', 'EN 55035', 'EN 61000-3-2', 'EN 61000-3-3']
      },
      errorMessage: 'CE marking certificate invalid or expired',
      remediation: 'Obtain valid CE marking certificate and declaration of conformity',
      automationLevel: 'PARTIAL',
      validate: async (request: any, checkpoint: any): Promise<ValidationResult> => {
        const certificationData = request.metadata?.certificationData
        const productType = request.productType

        if (!certificationData?.ceCertificate) {
          return {
            passed: false,
            reason: 'CE certificate not available',
            remediation: 'Obtain CE marking certificate for products sold in EU',
            metadata: { missingData: 'ceCertificate' }
          }
        }

        const cert = certificationData.ceCertificate
        const violations = []

        // Check certificate validity
        if (cert.expiryDate && new Date(cert.expiryDate) <= new Date()) {
          violations.push('CE certificate has expired')
        }

        // Check required documents
        const requiredDocs = ['ce_certificate', 'declaration_of_conformity', 'technical_documentation']
        const missingDocs = requiredDocs.filter(doc => !cert.documents?.includes(doc))
        
        if (missingDocs.length > 0) {
          violations.push(`Missing documents: ${missingDocs.join(', ')}`)
        }

        // Check applicable standards for battery products
        const isBattery = ['FLEXVOLT_6AH', 'FLEXVOLT_9AH', 'FLEXVOLT_15AH'].includes(productType)
        if (isBattery) {
          const requiredStandards = ['EN 55032', 'EN 55035', 'EN 61000-3-2', 'EN 61000-3-3']
          const missingStandards = requiredStandards.filter(std => !cert.standards?.includes(std))
          
          if (missingStandards.length > 0) {
            violations.push(`Missing conformity to standards: ${missingStandards.join(', ')}`)
          }
        }

        // Check notified body approval if required
        if (cert.requiresNotifiedBody && !cert.notifiedBodyNumber) {
          violations.push('Missing notified body approval number')
        }

        if (violations.length > 0) {
          return {
            passed: false,
            actualValue: cert,
            expectedValue: {
              valid: true,
              documents: requiredDocs,
              standards: ['EN 55032', 'EN 55035', 'EN 61000-3-2', 'EN 61000-3-3']
            },
            reason: violations.join('; '),
            remediation: 'Renew CE certificate and ensure all required documentation is complete',
            metadata: { violations }
          }
        }

        return {
          passed: true,
          actualValue: cert,
          metadata: { ceCompliant: true }
        }
      }
    })
  }

  /**
   * Australia (ACL) Compliance Rules
   */
  private addAustraliaRules(): void {
    // Australian Consumer Law Product Safety Rule
    this.addRule({
      id: 'AU_ACL_PRODUCT_SAFETY',
      name: 'Australian Consumer Law Product Safety',
      description: 'Verify products meet Australian safety standards',
      region: 'AUSTRALIA',
      regulation: 'ACL_2010',
      checkpointId: 'SAFETY_COMPLIANCE',
      ruleType: 'PRESENCE',
      parameters: {
        requiredStandards: ['AS/NZS 62133.2', 'AS/NZS 4755.1'],
        safetyDocuments: ['safety_certificate', 'test_report', 'user_manual'],
        warningRequirements: ['voltage_warning', 'disposal_instructions', 'age_restrictions']
      },
      errorMessage: 'Product does not meet Australian safety standards',
      remediation: 'Obtain Australian safety certification and ensure proper documentation',
      automationLevel: 'PARTIAL',
      validate: async (request: any, checkpoint: any): Promise<ValidationResult> => {
        const safetyData = request.metadata?.safetyData
        const productType = request.productType

        if (!safetyData?.certifications) {
          return {
            passed: false,
            reason: 'Safety certification data not available',
            remediation: 'Provide Australian safety certification documentation',
            metadata: { missingData: 'safetyCertifications' }
          }
        }

        const violations = []
        
        // Check required standards for battery products
        const isBattery = ['FLEXVOLT_6AH', 'FLEXVOLT_9AH', 'FLEXVOLT_15AH'].includes(productType)
        if (isBattery) {
          const requiredStandards = ['AS/NZS 62133.2', 'AS/NZS 4755.1']
          const certifiedStandards = safetyData.certifications.standards || []
          const missingStandards = requiredStandards.filter(std => !certifiedStandards.includes(std))
          
          if (missingStandards.length > 0) {
            violations.push(`Missing safety standards: ${missingStandards.join(', ')}`)
          }
        }

        // Check required safety documents
        const requiredDocs = ['safety_certificate', 'test_report', 'user_manual']
        const availableDocs = safetyData.documents || []
        const missingDocs = requiredDocs.filter(doc => !availableDocs.includes(doc))
        
        if (missingDocs.length > 0) {
          violations.push(`Missing documents: ${missingDocs.join(', ')}`)
        }

        // Check warning requirements
        const requiredWarnings = ['voltage_warning', 'disposal_instructions', 'age_restrictions']
        const presentWarnings = safetyData.warnings || []
        const missingWarnings = requiredWarnings.filter(warning => !presentWarnings.includes(warning))
        
        if (missingWarnings.length > 0) {
          violations.push(`Missing safety warnings: ${missingWarnings.join(', ')}`)
        }

        // Check certificate validity
        if (safetyData.certifications.expiryDate && 
            new Date(safetyData.certifications.expiryDate) <= new Date()) {
          violations.push('Safety certificate has expired')
        }

        if (violations.length > 0) {
          return {
            passed: false,
            actualValue: safetyData,
            expectedValue: {
              standards: ['AS/NZS 62133.2', 'AS/NZS 4755.1'],
              documents: requiredDocs,
              warnings: requiredWarnings
            },
            reason: violations.join('; '),
            remediation: 'Obtain required Australian safety certifications and complete documentation',
            metadata: { violations }
          }
        }

        return {
          passed: true,
          actualValue: safetyData,
          metadata: { australianCompliant: true }
        }
      }
    })
  }

  /**
   * Global (ISO) Compliance Rules
   */
  private addGlobalRules(): void {
    // ISO 14001 Environmental Management System Rule
    this.addRule({
      id: 'GLOBAL_ISO14001_EMS',
      name: 'ISO 14001 Environmental Management System',
      description: 'Verify environmental management system implementation',
      region: 'GLOBAL',
      regulation: 'ISO_14001',
      checkpointId: 'EMS_IMPLEMENTATION',
      ruleType: 'CUSTOM',
      parameters: {
        requiredElements: ['environmental_policy', 'objectives_targets', 'procedures', 'monitoring', 'audit'],
        documentationRequirements: ['manual', 'procedures', 'records'],
        reviewPeriod: 365 // annual review
      },
      errorMessage: 'Environmental management system not fully implemented',
      remediation: 'Complete ISO 14001 EMS implementation and documentation',
      automationLevel: 'MANUAL',
      validate: async (request: any, checkpoint: any): Promise<ValidationResult> => {
        const emsData = request.metadata?.environmentalData
        
        if (!emsData?.managementSystem) {
          return {
            passed: false,
            reason: 'Environmental management system data not available',
            remediation: 'Implement ISO 14001 environmental management system',
            metadata: { missingData: 'environmentalManagementSystem' }
          }
        }

        const ems = emsData.managementSystem
        const violations = []

        // Check required elements
        const requiredElements = ['environmental_policy', 'objectives_targets', 'procedures', 'monitoring', 'audit']
        const missingElements = requiredElements.filter(element => !ems.elements?.includes(element))
        
        if (missingElements.length > 0) {
          violations.push(`Missing EMS elements: ${missingElements.join(', ')}`)
        }

        // Check documentation
        const requiredDocs = ['manual', 'procedures', 'records']
        const availableDocs = ems.documentation || []
        const missingDocs = requiredDocs.filter(doc => !availableDocs.includes(doc))
        
        if (missingDocs.length > 0) {
          violations.push(`Missing documentation: ${missingDocs.join(', ')}`)
        }

        // Check last review date
        if (ems.lastReview) {
          const daysSinceReview = (Date.now() - new Date(ems.lastReview).getTime()) / (24 * 60 * 60 * 1000)
          if (daysSinceReview > 365) {
            violations.push('EMS review overdue (must be annual)')
          }
        } else {
          violations.push('No EMS review date recorded')
        }

        // Check certification status
        if (ems.certificationRequired && !ems.certified) {
          violations.push('ISO 14001 certification required but not obtained')
        }

        if (violations.length > 0) {
          return {
            passed: false,
            actualValue: ems,
            expectedValue: {
              elements: requiredElements,
              documentation: requiredDocs,
              reviewFrequency: 'annual'
            },
            reason: violations.join('; '),
            remediation: 'Complete ISO 14001 EMS implementation and obtain certification',
            metadata: { violations }
          }
        }

        return {
          passed: true,
          actualValue: ems,
          metadata: { iso14001Compliant: true }
        }
      }
    })
  }
}

export const complianceRules = new ComplianceRules()