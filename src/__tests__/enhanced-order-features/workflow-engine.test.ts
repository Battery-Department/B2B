/**
 * RHY Supplier Portal - Order Workflow Engine Tests
 * Comprehensive test suite for intelligent workflow routing and execution
 * Tests FlexVolt battery order processing workflows and automation
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { OrderWorkflowEngine, OrderContext, workflowUtils } from '@/lib/order-workflows'
import { rhyPrisma } from '@/lib/rhy-database'
import { SupplierAuthData, SecurityContext } from '@/types/auth'
import { 
  OrderWorkflow,
  OrderWorkflowStep,
  UrgencyLevel,
  ConsolidationPreference,
  ShippingMethod,
  WorkflowStepType
} from '@/types/order_features'
import { ComplianceRegion } from '@/types/warehouse'

// Type the mocked database
const mockRhyPrisma = {
  orderWorkflow: {
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  workflowExecution: {
    create: jest.fn()
  }
};

// Mock the database
jest.mock('@/lib/rhy-database', () => ({
  rhyPrisma: mockRhyPrisma
}))

// Mock security functions
jest.mock('@/lib/security', () => ({
  logAuthEvent: jest.fn()
}))

describe('Order Workflow Engine', () => {
  let workflowEngine: OrderWorkflowEngine
  let mockSupplier: SupplierAuthData
  let mockSecurityContext: SecurityContext
  let mockOrderContext: OrderContext

  beforeEach(() => {
    jest.clearAllMocks()
    workflowEngine = new OrderWorkflowEngine()
    
    mockSupplier = {
      id: 'supplier-123',
      email: 'contractor@flexvolt.com',
      companyName: 'FlexVolt Contractors LLC',
      contactName: 'John Smith',
      phoneNumber: '+1-555-0123',
      status: 'ACTIVE',
      tier: 'PREMIUM',
      warehouseAccess: [
        {
          warehouse: 'US',
          role: 'OPERATOR',
          permissions: ['CREATE_ORDERS', 'VIEW_ORDERS'],
          grantedAt: new Date('2024-01-01'),
          expiresAt: new Date('2025-01-01')
        }
      ],
      mfaEnabled: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }

    mockSecurityContext = {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(),
      deviceFingerprint: 'test-device-fingerprint'
    }

    mockOrderContext = {
      orderId: 'order-123',
      supplierId: mockSupplier.id,
      warehouseId: 'US',
      totalValue: 1250.00,
      itemCount: 3,
      urgencyLevel: 'EXPRESS' as UrgencyLevel,
      consolidationPreference: 'CONSOLIDATED' as ConsolidationPreference,
      shippingMethod: 'EXPRESS' as ShippingMethod,
      productCategories: ['Battery', 'Charger'],
      customerType: 'CONTRACTOR',
      supplierTier: 'PREMIUM',
      region: 'US' as ComplianceRegion,
      hasHazmat: false,
      requiresCompliance: true,
      isRecurringOrder: false,
      metadata: {
        projectCode: 'PROJ-2024-001',
        siteLocation: 'Construction Site Alpha'
      }
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Workflow Selection Algorithm', () => {
    test('should select best matching workflow based on order value', async () => {
      const mockWorkflows: OrderWorkflow[] = [
        {
          id: 'workflow-standard',
          supplierId: mockSupplier.id,
          name: 'Standard Order Processing',
          description: 'For orders under $1000',
          steps: [],
          triggers: {
            orderValue: { min: 0, max: 999 },
            productCategories: ['Battery'],
            urgencyLevels: ['STANDARD', 'EXPRESS']
          },
          conditions: {
            businessHoursOnly: true,
            excludeHolidays: true,
            timeZone: 'America/New_York'
          },
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          executionCount: 0
        },
        {
          id: 'workflow-premium',
          supplierId: mockSupplier.id,
          name: 'Premium Order Processing',
          description: 'For orders over $1000',
          steps: [],
          triggers: {
            orderValue: { min: 1000 },
            productCategories: ['Battery', 'Charger'],
            urgencyLevels: ['EXPRESS', 'PRIORITY', 'EMERGENCY'],
            supplierTiers: ['PREMIUM', 'ENTERPRISE']
          },
          conditions: {
            businessHoursOnly: false,
            excludeHolidays: false,
            timeZone: 'America/New_York',
            autoEscalationHours: 24
          },
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          executionCount: 0
        }
      ]

      mockRhyPrisma.orderWorkflow.findMany.mockResolvedValue(mockWorkflows)

      const selectedWorkflow = await workflowEngine.selectWorkflow(mockOrderContext, mockSupplier)

      expect(selectedWorkflow).toBeDefined()
      expect(selectedWorkflow!.id).toBe('workflow-premium')
      expect(selectedWorkflow!.name).toBe('Premium Order Processing')
    })

    test('should score workflows correctly based on trigger conditions', async () => {
      const mockWorkflows: OrderWorkflow[] = [
        {
          id: 'workflow-exact-match',
          supplierId: mockSupplier.id,
          name: 'Exact Match Workflow',
          description: 'Perfect match for the order',
          steps: [],
          triggers: {
            orderValue: { min: 1200, max: 1300 },
            productCategories: ['Battery', 'Charger'],
            warehouses: ['US'],
            customerTypes: ['CONTRACTOR'],
            urgencyLevels: ['EXPRESS'],
            supplierTiers: ['PREMIUM']
          },
          conditions: {},
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          executionCount: 0
        },
        {
          id: 'workflow-partial-match',
          supplierId: mockSupplier.id,
          name: 'Partial Match Workflow',
          description: 'Partial match for the order',
          steps: [],
          triggers: {
            orderValue: { min: 1000 },
            productCategories: ['Battery']
          },
          conditions: {},
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          executionCount: 0
        }
      ]

      mockRhyPrisma.orderWorkflow.findMany.mockResolvedValue(mockWorkflows)

      const selectedWorkflow = await workflowEngine.selectWorkflow(mockOrderContext, mockSupplier)

      expect(selectedWorkflow).toBeDefined()
      expect(selectedWorkflow!.id).toBe('workflow-exact-match')
    })

    test('should return null when no suitable workflow found', async () => {
      const mockWorkflows: OrderWorkflow[] = [
        {
          id: 'workflow-incompatible',
          supplierId: mockSupplier.id,
          name: 'Incompatible Workflow',
          description: 'Does not match order criteria',
          steps: [],
          triggers: {
            orderValue: { min: 5000 }, // Too high
            productCategories: ['Tools'], // Wrong category
            urgencyLevels: ['STANDARD'] // Wrong urgency
          },
          conditions: {},
          isActive: true,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          executionCount: 0
        }
      ]

      mockRhyPrisma.orderWorkflow.findMany.mockResolvedValue(mockWorkflows)

      const selectedWorkflow = await workflowEngine.selectWorkflow(mockOrderContext, mockSupplier)

      expect(selectedWorkflow).toBeNull()
    })
  })

  describe('Workflow Execution', () => {
    test('should execute complete FlexVolt order workflow successfully', async () => {
      const mockWorkflowSteps: OrderWorkflowStep[] = [
        {
          id: 'step-1',
          workflowId: 'workflow-123',
          stepNumber: 1,
          name: 'Order Validation',
          description: 'Validate order details and inventory',
          type: 'VALIDATION' as WorkflowStepType,
          config: {
            conditions: [
              { field: 'totalValue', operator: 'greater_than', value: 0 },
              { field: 'itemCount', operator: 'greater_than', value: 0 }
            ]
          },
          isRequired: true,
          canSkip: false,
          retryCount: 0,
          maxRetries: 3
        },
        {
          id: 'step-2',
          workflowId: 'workflow-123',
          stepNumber: 2,
          name: 'Manager Approval',
          description: 'Require manager approval for premium orders',
          type: 'APPROVAL' as WorkflowStepType,
          config: {
            assignedTo: ['manager@company.com'],
            timeoutHours: 24,
            autoApprove: false,
            escalationPath: ['senior_manager@company.com']
          },
          isRequired: true,
          canSkip: false,
          retryCount: 0,
          maxRetries: 1
        },
        {
          id: 'step-3',
          workflowId: 'workflow-123',
          stepNumber: 3,
          name: 'FlexVolt Processing',
          description: 'Process FlexVolt battery order',
          type: 'PROCESSING' as WorkflowStepType,
          config: {
            assignedTo: ['operations@company.com'],
            timeoutHours: 8
          },
          isRequired: true,
          canSkip: false,
          retryCount: 0,
          maxRetries: 2
        },
        {
          id: 'step-4',
          workflowId: 'workflow-123',
          stepNumber: 4,
          name: 'Express Shipping',
          description: 'Prepare express shipment',
          type: 'SHIPPING' as WorkflowStepType,
          config: {
            assignedTo: ['shipping@company.com'],
            timeoutHours: 4,
            notifications: {
              email: true,
              sms: false
            }
          },
          isRequired: true,
          canSkip: false,
          retryCount: 0,
          maxRetries: 2
        }
      ]

      const mockWorkflow: OrderWorkflow & { steps: OrderWorkflowStep[] } = {
        id: 'workflow-123',
        supplierId: mockSupplier.id,
        name: 'FlexVolt Premium Workflow',
        description: 'Premium processing for FlexVolt battery orders',
        steps: mockWorkflowSteps,
        triggers: {},
        conditions: {},
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0
      }

      const mockExecution = {
        id: 'execution-123',
        workflowId: 'workflow-123',
        orderId: mockOrderContext.orderId,
        supplierId: mockSupplier.id,
        status: 'INITIATED',
        context: mockOrderContext,
        createdAt: new Date()
      }

      mockRhyPrisma.orderWorkflow.findUnique.mockResolvedValue(mockWorkflow)
      mockRhyPrisma.workflowExecution.create.mockResolvedValue(mockExecution)

      const result = await workflowEngine.executeWorkflow(
        'workflow-123',
        mockOrderContext,
        mockSupplier,
        mockSecurityContext
      )

      expect(result.status).toBe('IN_PROGRESS')
      expect(result.totalSteps).toBe(4)
      expect(result.currentStep).toBe(1)
      expect(result.nextActions).toBeDefined()
      expect(result.estimatedCompletionTime).toBeDefined()
      expect(result.executionId).toBeDefined()
    })

    test('should handle workflow execution failure gracefully', async () => {
      mockRhyPrisma.orderWorkflow.findUnique.mockResolvedValue(null)

      const result = await workflowEngine.executeWorkflow(
        'non-existent-workflow',
        mockOrderContext,
        mockSupplier,
        mockSecurityContext
      )

      expect(result.status).toBe('FAILED')
      expect(result.errorDetails).toBeDefined()
      expect(result.errorDetails!.error).toContain('Workflow not found')
    })

    test('should auto-execute validation steps', async () => {
      const validationStep: OrderWorkflowStep = {
        id: 'validation-step',
        workflowId: 'workflow-123',
        stepNumber: 1,
        name: 'Auto Validation',
        description: 'Automatically validate order',
        type: 'VALIDATION' as WorkflowStepType,
        config: {
          conditions: [
            { field: 'totalValue', operator: 'greater_than', value: 100 },
            { field: 'urgencyLevel', operator: 'in', value: ['EXPRESS', 'PRIORITY'] }
          ]
        },
        isRequired: true,
        canSkip: false,
        retryCount: 0,
        maxRetries: 3
      }

      const mockWorkflow: OrderWorkflow & { steps: OrderWorkflowStep[] } = {
        id: 'workflow-123',
        supplierId: mockSupplier.id,
        name: 'Auto Validation Workflow',
        description: 'Workflow with auto-validation',
        steps: [validationStep],
        triggers: {},
        conditions: {},
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0
      }

      const mockExecution = {
        id: 'execution-123',
        workflowId: 'workflow-123',
        orderId: mockOrderContext.orderId,
        supplierId: mockSupplier.id,
        status: 'INITIATED',
        context: mockOrderContext,
        createdAt: new Date()
      }

      mockRhyPrisma.orderWorkflow.findUnique.mockResolvedValue(mockWorkflow)
      mockRhyPrisma.workflowExecution.create.mockResolvedValue(mockExecution)

      const result = await workflowEngine.executeWorkflow(
        'workflow-123',
        mockOrderContext,
        mockSupplier,
        mockSecurityContext
      )

      expect(result.status).toBe('IN_PROGRESS')
      expect(result.completedSteps).toHaveLength(1)
      expect(result.completedSteps[0].status).toBe('COMPLETED')
    })
  })

  describe('Step Execution Logic', () => {
    test('should execute approval step with auto-approval conditions', async () => {
      const approvalStep: OrderWorkflowStep = {
        id: 'approval-step',
        workflowId: 'workflow-123',
        stepNumber: 1,
        name: 'Auto Approval',
        description: 'Auto-approve small orders',
        type: 'APPROVAL' as WorkflowStepType,
        config: {
          autoApprove: true,
          conditions: [
            { field: 'totalValue', operator: 'less_than', value: 2000 },
            { field: 'supplierTier', operator: 'in', value: ['PREMIUM', 'ENTERPRISE'] }
          ]
        },
        isRequired: true,
        canSkip: false,
        retryCount: 0,
        maxRetries: 1
      }

      const workflowEngine = new OrderWorkflowEngine()
      const stepExecution = await (workflowEngine as any).executeApprovalStep(
        approvalStep,
        mockOrderContext,
        {
          stepId: 'approval-step',
          stepNumber: 1,
          status: 'PENDING',
          escalationLevel: 0,
          retryCount: 0
        }
      )

      expect(stepExecution.status).toBe('COMPLETED')
      expect(stepExecution.result.approved).toBe(true)
      expect(stepExecution.result.method).toBe('auto')
    })

    test('should execute notification step successfully', async () => {
      const notificationStep: OrderWorkflowStep = {
        id: 'notification-step',
        workflowId: 'workflow-123',
        stepNumber: 1,
        name: 'Order Notifications',
        description: 'Send order notifications',
        type: 'NOTIFICATION' as WorkflowStepType,
        config: {
          assignedTo: ['manager@company.com', 'operations@company.com'],
          notifications: {
            email: true,
            sms: true,
            webhook: 'https://api.company.com/webhooks/order'
          }
        },
        isRequired: true,
        canSkip: false,
        retryCount: 0,
        maxRetries: 3
      }

      const workflowEngine = new OrderWorkflowEngine()
      const stepExecution = await (workflowEngine as any).executeNotificationStep(
        notificationStep,
        mockOrderContext,
        {
          stepId: 'notification-step',
          stepNumber: 1,
          status: 'PENDING',
          escalationLevel: 0,
          retryCount: 0
        }
      )

      expect(stepExecution.status).toBe('COMPLETED')
      expect(stepExecution.result.notificationsSent).toBe(3) // email, sms, webhook
      expect(stepExecution.result.recipients).toBe(2)
    })

    test('should execute processing step with estimated time', async () => {
      const processingStep: OrderWorkflowStep = {
        id: 'processing-step',
        workflowId: 'workflow-123',
        stepNumber: 1,
        name: 'Order Processing',
        description: 'Process FlexVolt order',
        type: 'PROCESSING' as WorkflowStepType,
        config: {
          assignedTo: ['operations@company.com']
        },
        isRequired: true,
        canSkip: false,
        retryCount: 0,
        maxRetries: 2
      }

      const workflowEngine = new OrderWorkflowEngine()
      const stepExecution = await (workflowEngine as any).executeProcessingStep(
        processingStep,
        mockOrderContext,
        {
          stepId: 'processing-step',
          stepNumber: 1,
          status: 'PENDING',
          escalationLevel: 0,
          retryCount: 0
        }
      )

      expect(stepExecution.status).toBe('COMPLETED')
      expect(stepExecution.result.processed).toBe(true)
      expect(stepExecution.result.processingTime).toBeGreaterThan(0)
      expect(stepExecution.result.orderId).toBe(mockOrderContext.orderId)
    })

    test('should execute shipping step with tracking information', async () => {
      const shippingStep: OrderWorkflowStep = {
        id: 'shipping-step',
        workflowId: 'workflow-123',
        stepNumber: 1,
        name: 'Express Shipping',
        description: 'Prepare express shipment',
        type: 'SHIPPING' as WorkflowStepType,
        config: {
          assignedTo: ['shipping@company.com']
        },
        isRequired: true,
        canSkip: false,
        retryCount: 0,
        maxRetries: 2
      }

      const workflowEngine = new OrderWorkflowEngine()
      const stepExecution = await (workflowEngine as any).executeShippingStep(
        shippingStep,
        mockOrderContext,
        {
          stepId: 'shipping-step',
          stepNumber: 1,
          status: 'PENDING',
          escalationLevel: 0,
          retryCount: 0
        }
      )

      expect(stepExecution.status).toBe('COMPLETED')
      expect(stepExecution.result.trackingNumber).toMatch(/^RHY\d+$/)
      expect(stepExecution.result.carrier).toBeDefined()
      expect(stepExecution.result.estimatedDelivery).toBeDefined()
    })
  })

  describe('Workflow Utilities', () => {
    test('should create default approval workflow for FlexVolt suppliers', async () => {
      const defaultWorkflow = await workflowUtils.createDefaultApprovalWorkflow(mockSupplier.id)

      expect(defaultWorkflow.supplierId).toBe(mockSupplier.id)
      expect(defaultWorkflow.name).toBe('Standard Order Approval')
      expect(defaultWorkflow.steps).toHaveLength(4)
      expect(defaultWorkflow.steps[0].type).toBe('VALIDATION')
      expect(defaultWorkflow.steps[1].type).toBe('APPROVAL')
      expect(defaultWorkflow.steps[2].type).toBe('PROCESSING')
      expect(defaultWorkflow.steps[3].type).toBe('SHIPPING')
      expect(defaultWorkflow.isActive).toBe(true)
    })

    test('should calculate workflow efficiency metrics', () => {
      const mockExecutions = [
        {
          workflowId: 'workflow-123',
          executionId: 'exec-1',
          status: 'COMPLETED' as const,
          currentStep: 4,
          totalSteps: 4,
          completedSteps: [
            {
              stepId: 'step-1',
              stepNumber: 1,
              status: 'COMPLETED' as const,
              startedAt: new Date('2024-06-24T09:00:00Z'),
              completedAt: new Date('2024-06-24T09:05:00Z'),
              escalationLevel: 0,
              retryCount: 0
            },
            {
              stepId: 'step-2',
              stepNumber: 2,
              status: 'COMPLETED' as const,
              startedAt: new Date('2024-06-24T09:05:00Z'),
              completedAt: new Date('2024-06-24T10:00:00Z'),
              escalationLevel: 0,
              retryCount: 0
            }
          ],
          nextActions: [],
          estimatedCompletionTime: new Date('2024-06-24T12:00:00Z')
        },
        {
          workflowId: 'workflow-123',
          executionId: 'exec-2',
          status: 'FAILED' as const,
          currentStep: 2,
          totalSteps: 4,
          completedSteps: [],
          nextActions: [],
          errorDetails: {
            stepNumber: 2,
            error: 'Approval timeout',
            resolution: 'Manual intervention required'
          }
        }
      ]

      const efficiency = workflowUtils.calculateWorkflowEfficiency(mockExecutions)

      expect(efficiency.successRate).toBe(0.5) // 1 out of 2 succeeded
      expect(efficiency.averageCompletionTime).toBeGreaterThanOrEqual(0)
      expect(efficiency.escalationRate).toBe(0) // No escalations in test data
      expect(efficiency.bottleneckSteps).toBeDefined()
    })

    test('should handle empty execution array gracefully', () => {
      const efficiency = workflowUtils.calculateWorkflowEfficiency([])

      expect(efficiency.successRate).toBe(0)
      expect(efficiency.averageCompletionTime).toBe(0)
      expect(efficiency.bottleneckSteps).toHaveLength(0)
      expect(efficiency.escalationRate).toBe(0)
    })
  })

  describe('Context Evaluation and Conditions', () => {
    test('should evaluate context values correctly', () => {
      const workflowEngine = new OrderWorkflowEngine()
      
      const totalValue = (workflowEngine as any).getContextValue(mockOrderContext, 'totalValue')
      const urgencyLevel = (workflowEngine as any).getContextValue(mockOrderContext, 'urgencyLevel')
      const hasHazmat = (workflowEngine as any).getContextValue(mockOrderContext, 'hasHazmat')

      expect(totalValue).toBe(1250.00)
      expect(urgencyLevel).toBe('EXPRESS')
      expect(hasHazmat).toBe(false)
    })

    test('should evaluate different condition operators correctly', () => {
      const workflowEngine = new OrderWorkflowEngine()
      
      const greaterThan = (workflowEngine as any).evaluateCondition(1250, 'greater_than', 1000)
      const lessThan = (workflowEngine as any).evaluateCondition(500, 'less_than', 1000)
      const equals = (workflowEngine as any).evaluateCondition('EXPRESS', 'equals', 'EXPRESS')
      const contains = (workflowEngine as any).evaluateCondition('FlexVolt Battery', 'contains', 'Battery')
      const inArray = (workflowEngine as any).evaluateCondition('PREMIUM', 'in', ['STANDARD', 'PREMIUM', 'ENTERPRISE'])

      expect(greaterThan).toBe(true)
      expect(lessThan).toBe(true)
      expect(equals).toBe(true)
      expect(contains).toBe(true)
      expect(inArray).toBe(true)
    })

    test('should calculate processing time based on urgency and complexity', () => {
      const workflowEngine = new OrderWorkflowEngine()
      
      const standardTime = (workflowEngine as any).calculateProcessingTime({
        ...mockOrderContext,
        urgencyLevel: 'STANDARD',
        itemCount: 2
      })
      
      const emergencyTime = (workflowEngine as any).calculateProcessingTime({
        ...mockOrderContext,
        urgencyLevel: 'EMERGENCY',
        itemCount: 5
      })

      expect(standardTime).toBeGreaterThan(emergencyTime)
      expect(emergencyTime).toBeGreaterThan(0)
    })
  })

  describe('Performance and Edge Cases', () => {
    test('should handle high-volume workflow execution efficiently', async () => {
      const mockWorkflow: OrderWorkflow & { steps: OrderWorkflowStep[] } = {
        id: 'workflow-performance',
        supplierId: mockSupplier.id,
        name: 'Performance Test Workflow',
        description: 'Workflow for performance testing',
        steps: [
          {
            id: 'validation-step',
            workflowId: 'workflow-performance',
            stepNumber: 1,
            name: 'Quick Validation',
            type: 'VALIDATION' as WorkflowStepType,
            config: { conditions: [] },
            isRequired: true,
            canSkip: false,
            retryCount: 0,
            maxRetries: 1
          }
        ],
        triggers: {},
        conditions: {},
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0
      }

      const mockExecution = {
        id: 'execution-performance',
        workflowId: 'workflow-performance',
        orderId: mockOrderContext.orderId,
        supplierId: mockSupplier.id,
        status: 'INITIATED',
        context: mockOrderContext,
        createdAt: new Date()
      }

      mockRhyPrisma.orderWorkflow.findUnique.mockResolvedValue(mockWorkflow)
      mockRhyPrisma.workflowExecution.create.mockResolvedValue(mockExecution)

      const startTime = Date.now()
      const result = await workflowEngine.executeWorkflow(
        'workflow-performance',
        mockOrderContext,
        mockSupplier,
        mockSecurityContext
      )
      const executionTime = Date.now() - startTime

      expect(result.status).toBe('IN_PROGRESS')
      expect(executionTime).toBeLessThan(500) // Should complete within 500ms
    })

    test('should handle missing workflow gracefully', async () => {
      mockRhyPrisma.orderWorkflow.findMany.mockResolvedValue([])

      const selectedWorkflow = await workflowEngine.selectWorkflow(mockOrderContext, mockSupplier)

      expect(selectedWorkflow).toBeNull()
    })

    test('should handle database errors during workflow execution', async () => {
      mockRhyPrisma.orderWorkflow.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await workflowEngine.executeWorkflow(
        'workflow-123',
        mockOrderContext,
        mockSupplier,
        mockSecurityContext
      )

      expect(result.status).toBe('FAILED')
      expect(result.errorDetails?.error).toContain('Database connection failed')
    })
  })
})