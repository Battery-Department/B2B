/**
 * RHY Supplier Portal - Order Workflow Utilities
 * Enterprise-grade order workflow management with Batch 1 integration
 * Supports intelligent order routing and approval workflows
 */

import { rhyPrisma } from '@/lib/rhy-database'
import { logAuthEvent } from '@/lib/security'
import { SupplierAuthData, SecurityContext } from '@/types/auth'
import { 
  OrderWorkflow, 
  OrderWorkflowStep, 
  UrgencyLevel, 
  ConsolidationPreference,
  ShippingMethod 
} from '@/types/order_features'
import { ComplianceRegion } from '@/types/warehouse'
import { v4 as uuidv4 } from 'uuid'

// Order Context for Workflow Evaluation
export interface OrderContext {
  orderId: string
  supplierId: string
  warehouseId: string
  totalValue: number
  itemCount: number
  urgencyLevel: UrgencyLevel
  consolidationPreference: ConsolidationPreference
  shippingMethod: ShippingMethod
  productCategories: string[]
  customerType: string
  supplierTier: string
  region: ComplianceRegion
  hasHazmat: boolean
  requiresCompliance: boolean
  isRecurringOrder: boolean
  metadata?: Record<string, any>
}

// Workflow Execution Result
export interface WorkflowExecutionResult {
  workflowId: string
  executionId: string
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  currentStep: number
  totalSteps: number
  completedSteps: OrderWorkflowStepExecution[]
  nextActions: WorkflowAction[]
  estimatedCompletionTime?: Date
  errorDetails?: {
    stepNumber: number
    error: string
    resolution?: string
  }
}

export interface OrderWorkflowStepExecution {
  stepId: string
  stepNumber: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  assignedTo?: string[]
  startedAt?: Date
  completedAt?: Date
  result?: any
  notes?: string
  escalationLevel: number
  retryCount: number
}

export interface WorkflowAction {
  type: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'REQUEST_INFO' | 'NOTIFY' | 'PROCESS'
  title: string
  description: string
  assignedTo: string[]
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date
  metadata?: any
}

// Intelligent Workflow Router
export class OrderWorkflowEngine {
  private readonly logger = console // In production, use proper logger

  /**
   * Evaluate order context and select appropriate workflow
   */
  async selectWorkflow(
    orderContext: OrderContext,
    supplier: SupplierAuthData
  ): Promise<OrderWorkflow | null> {
    try {
      // Get all active workflows for the supplier
      const workflows = await rhyPrisma.orderWorkflow.findMany({
        where: {
          supplierId: supplier.id,
          isActive: true
        },
        include: {
          steps: true
        },
        orderBy: { version: 'desc' }
      })

      // Score each workflow based on trigger conditions
      const scoredWorkflows = workflows.map(workflow => ({
        workflow: workflow as OrderWorkflow,
        score: this.calculateWorkflowScore(workflow as OrderWorkflow, orderContext)
      }))

      // Sort by score and return the best match
      scoredWorkflows.sort((a, b) => b.score - a.score)
      
      const bestMatch = scoredWorkflows[0]
      return bestMatch && bestMatch.score > 0 ? bestMatch.workflow : null

    } catch (error) {
      this.logger.error('Failed to select workflow:', error)
      return null
    }
  }

  /**
   * Calculate workflow score based on trigger conditions
   */
  private calculateWorkflowScore(workflow: OrderWorkflow, context: OrderContext): number {
    let score = 0
    const triggers = workflow.triggers

    // Order value matching
    if (triggers.orderValue) {
      if (triggers.orderValue.min && context.totalValue >= triggers.orderValue.min) {
        score += 20
      }
      if (triggers.orderValue.max && context.totalValue <= triggers.orderValue.max) {
        score += 20
      }
    }

    // Product categories matching
    if (triggers.productCategories && triggers.productCategories.length > 0) {
      const matchingCategories = context.productCategories.filter(cat => 
        triggers.productCategories!.includes(cat)
      )
      score += (matchingCategories.length / triggers.productCategories.length) * 30
    }

    // Warehouse matching
    if (triggers.warehouses && triggers.warehouses.length > 0) {
      if (triggers.warehouses.includes(context.warehouseId)) {
        score += 15
      }
    }

    // Customer type matching
    if (triggers.customerTypes && triggers.customerTypes.length > 0) {
      if (triggers.customerTypes.includes(context.customerType)) {
        score += 10
      }
    }

    // Urgency level matching
    if (triggers.urgencyLevels && triggers.urgencyLevels.length > 0) {
      if (triggers.urgencyLevels.includes(context.urgencyLevel)) {
        score += 15
      }
    }

    // Supplier tier matching
    if (triggers.supplierTiers && triggers.supplierTiers.length > 0) {
      if (triggers.supplierTiers.includes(context.supplierTier)) {
        score += 10
      }
    }

    return score
  }

  /**
   * Execute workflow for an order
   */
  async executeWorkflow(
    workflowId: string,
    orderContext: OrderContext,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<WorkflowExecutionResult> {
    const executionId = uuidv4()
    
    try {
      // Get workflow with steps
      const workflow = await rhyPrisma.orderWorkflow.findUnique({
        where: { id: workflowId },
        include: { steps: true }
      })

      if (!workflow) {
        throw new Error('Workflow not found')
      }

      // Create workflow execution record
      const execution = await rhyPrisma.workflowExecution.create({
        data: {
          id: executionId,
          workflowId,
          orderId: orderContext.orderId,
          supplierId: supplier.id,
          status: 'INITIATED',
          context: orderContext,
          createdAt: new Date()
        }
      })

      // Sort steps by step number
      const sortedSteps = (workflow.steps as OrderWorkflowStep[]).sort((a, b) => a.stepNumber - b.stepNumber)

      // Initialize step executions
      const stepExecutions: OrderWorkflowStepExecution[] = sortedSteps.map(step => ({
        stepId: step.id,
        stepNumber: step.stepNumber,
        status: 'PENDING',
        assignedTo: step.config.assignedTo,
        escalationLevel: 0,
        retryCount: 0
      }))

      // Execute first step if possible
      const firstStep = sortedSteps[0]
      if (firstStep && this.canAutoExecuteStep(firstStep, orderContext)) {
        stepExecutions[0] = await this.executeStep(firstStep, orderContext, supplier, securityContext)
      }

      // Generate next actions
      const nextActions = this.generateNextActions(sortedSteps, stepExecutions, orderContext)

      // Audit logging
      await logAuthEvent('WORKFLOW_EXECUTION_STARTED', true, securityContext, supplier.id, {
        workflowId,
        executionId,
        orderId: orderContext.orderId,
        stepCount: sortedSteps.length
      })

      return {
        workflowId,
        executionId,
        status: 'IN_PROGRESS',
        currentStep: 1,
        totalSteps: sortedSteps.length,
        completedSteps: stepExecutions.filter(step => step.status === 'COMPLETED'),
        nextActions,
        estimatedCompletionTime: this.calculateEstimatedCompletion(sortedSteps, orderContext)
      }

    } catch (error) {
      await logAuthEvent('WORKFLOW_EXECUTION_ERROR', false, securityContext, supplier.id, {
        workflowId,
        executionId,
        orderId: orderContext.orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      this.logger.error('Failed to execute workflow:', error)

      return {
        workflowId,
        executionId,
        status: 'FAILED',
        currentStep: 0,
        totalSteps: 0,
        completedSteps: [],
        nextActions: [],
        errorDetails: {
          stepNumber: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          resolution: 'Please contact support for assistance'
        }
      }
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: OrderWorkflowStep,
    context: OrderContext,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<OrderWorkflowStepExecution> {
    const stepExecution: OrderWorkflowStepExecution = {
      stepId: step.id,
      stepNumber: step.stepNumber,
      status: 'IN_PROGRESS',
      assignedTo: step.config.assignedTo,
      startedAt: new Date(),
      escalationLevel: 0,
      retryCount: 0
    }

    try {
      switch (step.type) {
        case 'APPROVAL':
          return await this.executeApprovalStep(step, context, stepExecution)
        
        case 'NOTIFICATION':
          return await this.executeNotificationStep(step, context, stepExecution)
        
        case 'VALIDATION':
          return await this.executeValidationStep(step, context, stepExecution)
        
        case 'PROCESSING':
          return await this.executeProcessingStep(step, context, stepExecution)
        
        case 'SHIPPING':
          return await this.executeShippingStep(step, context, stepExecution)
        
        default:
          throw new Error(`Unknown step type: ${step.type}`)
      }

    } catch (error) {
      stepExecution.status = 'FAILED'
      stepExecution.completedAt = new Date()
      stepExecution.notes = error instanceof Error ? error.message : 'Step execution failed'
      
      return stepExecution
    }
  }

  /**
   * Execute approval step
   */
  private async executeApprovalStep(
    step: OrderWorkflowStep,
    context: OrderContext,
    execution: OrderWorkflowStepExecution
  ): Promise<OrderWorkflowStepExecution> {
    // Check if auto-approval conditions are met
    if (step.config.autoApprove) {
      const conditions = step.config.conditions || []
      let allConditionsMet = true

      for (const condition of conditions) {
        const contextValue = this.getContextValue(context, condition.field)
        if (!this.evaluateCondition(contextValue, condition.operator, condition.value)) {
          allConditionsMet = false
          break
        }
      }

      if (allConditionsMet) {
        execution.status = 'COMPLETED'
        execution.completedAt = new Date()
        execution.result = { approved: true, method: 'auto' }
        execution.notes = 'Auto-approved based on conditions'
        return execution
      }
    }

    // Requires manual approval
    execution.status = 'PENDING'
    execution.notes = 'Pending manual approval'
    
    return execution
  }

  /**
   * Execute notification step
   */
  private async executeNotificationStep(
    step: OrderWorkflowStep,
    context: OrderContext,
    execution: OrderWorkflowStepExecution
  ): Promise<OrderWorkflowStepExecution> {
    try {
      // Send notifications based on config
      const notifications = step.config.notifications || {}
      const recipients = step.config.assignedTo || []

      if (notifications.email && recipients.length > 0) {
        // In production, send actual emails
        this.logger.info(`Would send email notifications to: ${recipients.join(', ')}`)
      }

      if (notifications.sms && recipients.length > 0) {
        // In production, send SMS notifications
        this.logger.info(`Would send SMS notifications to: ${recipients.join(', ')}`)
      }

      if (notifications.webhook) {
        // In production, send webhook notification
        this.logger.info(`Would send webhook notification to: ${notifications.webhook}`)
      }

      execution.status = 'COMPLETED'
      execution.completedAt = new Date()
      execution.result = { 
        notificationsSent: Object.keys(notifications).length,
        recipients: recipients.length
      }
      execution.notes = 'Notifications sent successfully'

    } catch (error) {
      execution.status = 'FAILED'
      execution.notes = `Notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return execution
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(
    step: OrderWorkflowStep,
    context: OrderContext,
    execution: OrderWorkflowStepExecution
  ): Promise<OrderWorkflowStepExecution> {
    try {
      const conditions = step.config.conditions || []
      const validationResults = []

      for (const condition of conditions) {
        const contextValue = this.getContextValue(context, condition.field)
        const isValid = this.evaluateCondition(contextValue, condition.operator, condition.value)
        
        validationResults.push({
          field: condition.field,
          expected: condition.value,
          actual: contextValue,
          isValid
        })
      }

      const allValid = validationResults.every(result => result.isValid)

      execution.status = allValid ? 'COMPLETED' : 'FAILED'
      execution.completedAt = new Date()
      execution.result = { 
        validationResults,
        allValid,
        validCount: validationResults.filter(r => r.isValid).length,
        totalCount: validationResults.length
      }
      execution.notes = allValid 
        ? 'All validations passed' 
        : `${validationResults.filter(r => !r.isValid).length} validation(s) failed`

    } catch (error) {
      execution.status = 'FAILED'
      execution.notes = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return execution
  }

  /**
   * Execute processing step
   */
  private async executeProcessingStep(
    step: OrderWorkflowStep,
    context: OrderContext,
    execution: OrderWorkflowStepExecution
  ): Promise<OrderWorkflowStepExecution> {
    try {
      // Simulate order processing
      const processingTime = this.calculateProcessingTime(context)
      
      // In production, this would trigger actual order processing
      this.logger.info(`Processing order ${context.orderId} - estimated time: ${processingTime}ms`)

      execution.status = 'COMPLETED'
      execution.completedAt = new Date()
      execution.result = { 
        processed: true,
        processingTime,
        orderId: context.orderId
      }
      execution.notes = 'Order processing completed'

    } catch (error) {
      execution.status = 'FAILED'
      execution.notes = `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return execution
  }

  /**
   * Execute shipping step
   */
  private async executeShippingStep(
    step: OrderWorkflowStep,
    context: OrderContext,
    execution: OrderWorkflowStepExecution
  ): Promise<OrderWorkflowStepExecution> {
    try {
      // Generate shipping label and tracking
      const trackingNumber = `RHY${Date.now()}`
      const carrierInfo = this.selectCarrier(context.shippingMethod, context.region)

      execution.status = 'COMPLETED'
      execution.completedAt = new Date()
      execution.result = { 
        trackingNumber,
        carrier: carrierInfo.name,
        service: carrierInfo.service,
        estimatedDelivery: carrierInfo.estimatedDelivery
      }
      execution.notes = `Shipping label created - Tracking: ${trackingNumber}`

    } catch (error) {
      execution.status = 'FAILED'
      execution.notes = `Shipping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return execution
  }

  /**
   * Check if step can be auto-executed
   */
  private canAutoExecuteStep(step: OrderWorkflowStep, context: OrderContext): boolean {
    if (step.type === 'NOTIFICATION' || step.type === 'VALIDATION' || step.type === 'PROCESSING') {
      return true
    }

    if (step.type === 'APPROVAL' && step.config.autoApprove) {
      return true
    }

    return false
  }

  /**
   * Generate next actions for workflow
   */
  private generateNextActions(
    steps: OrderWorkflowStep[],
    executions: OrderWorkflowStepExecution[],
    context: OrderContext
  ): WorkflowAction[] {
    const actions: WorkflowAction[] = []
    const currentExecution = executions.find(exec => exec.status === 'PENDING' || exec.status === 'IN_PROGRESS')

    if (currentExecution) {
      const currentStep = steps.find(step => step.id === currentExecution.stepId)
      
      if (currentStep) {
        switch (currentStep.type) {
          case 'APPROVAL':
            actions.push({
              type: 'APPROVE',
              title: 'Approve Order',
              description: `Approve ${currentStep.name}`,
              assignedTo: currentStep.config.assignedTo || [],
              priority: this.getPriorityForUrgency(context.urgencyLevel),
              dueDate: currentStep.config.timeoutHours ? 
                new Date(Date.now() + currentStep.config.timeoutHours * 60 * 60 * 1000) : undefined
            })
            
            actions.push({
              type: 'REJECT',
              title: 'Reject Order',
              description: `Reject ${currentStep.name}`,
              assignedTo: currentStep.config.assignedTo || [],
              priority: this.getPriorityForUrgency(context.urgencyLevel)
            })
            break

          case 'VALIDATION':
            if (currentExecution.status === 'FAILED') {
              actions.push({
                type: 'REQUEST_INFO',
                title: 'Request Additional Information',
                description: 'Request missing or corrected information',
                assignedTo: [context.supplierId],
                priority: 'MEDIUM'
              })
            }
            break
        }

        // Add escalation action if timeout is approaching
        if (currentStep.config.timeoutHours && currentStep.config.escalationPath) {
          actions.push({
            type: 'ESCALATE',
            title: 'Escalate',
            description: `Escalate ${currentStep.name} to next level`,
            assignedTo: currentStep.config.escalationPath,
            priority: 'HIGH'
          })
        }
      }
    }

    return actions
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(steps: OrderWorkflowStep[], context: OrderContext): Date {
    let totalHours = 0

    steps.forEach(step => {
      const baseTime = step.config.timeoutHours || this.getDefaultStepTime(step.type)
      const urgencyMultiplier = this.getUrgencyMultiplier(context.urgencyLevel)
      totalHours += baseTime * urgencyMultiplier
    })

    return new Date(Date.now() + totalHours * 60 * 60 * 1000)
  }

  /**
   * Helper methods
   */
  private getContextValue(context: OrderContext, field: string): any {
    const fieldMap: Record<string, any> = {
      'totalValue': context.totalValue,
      'itemCount': context.itemCount,
      'urgencyLevel': context.urgencyLevel,
      'supplierTier': context.supplierTier,
      'hasHazmat': context.hasHazmat,
      'requiresCompliance': context.requiresCompliance,
      'isRecurringOrder': context.isRecurringOrder,
      'warehouseId': context.warehouseId,
      'region': context.region
    }

    return fieldMap[field]
  }

  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected
      case 'greater_than':
        return Number(actual) > Number(expected)
      case 'less_than':
        return Number(actual) < Number(expected)
      case 'contains':
        return String(actual).includes(String(expected))
      case 'in':
        return Array.isArray(expected) ? expected.includes(actual) : false
      default:
        return false
    }
  }

  private calculateProcessingTime(context: OrderContext): number {
    let baseTime = 1000 // 1 second base
    
    // Adjust for urgency
    const urgencyMultipliers = {
      'STANDARD': 1.0,
      'EXPRESS': 0.7,
      'PRIORITY': 0.5,
      'EMERGENCY': 0.3
    }
    
    baseTime *= urgencyMultipliers[context.urgencyLevel]
    
    // Adjust for complexity
    baseTime += context.itemCount * 100 // 100ms per item
    
    return Math.round(baseTime)
  }

  private selectCarrier(shippingMethod: ShippingMethod, region: ComplianceRegion) {
    const carriers = {
      'STANDARD': { name: 'Standard Delivery', service: 'Ground', days: 5 },
      'EXPRESS': { name: 'Express Delivery', service: 'Express', days: 2 },
      'OVERNIGHT': { name: 'Overnight Express', service: 'Overnight', days: 1 },
      'FREIGHT': { name: 'Freight Service', service: 'LTL', days: 7 }
    }

    const carrier = carriers[shippingMethod]
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + carrier.days)

    return {
      ...carrier,
      estimatedDelivery
    }
  }

  private getPriorityForUrgency(urgency: UrgencyLevel): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const priorityMap = {
      'STANDARD': 'LOW' as const,
      'EXPRESS': 'MEDIUM' as const,
      'PRIORITY': 'HIGH' as const,
      'EMERGENCY': 'URGENT' as const
    }
    
    return priorityMap[urgency]
  }

  private getDefaultStepTime(stepType: string): number {
    const defaultTimes = {
      'APPROVAL': 24,
      'NOTIFICATION': 0.1,
      'VALIDATION': 1,
      'PROCESSING': 8,
      'SHIPPING': 4
    }
    
    return defaultTimes[stepType] || 2
  }

  private getUrgencyMultiplier(urgency: UrgencyLevel): number {
    const multipliers = {
      'STANDARD': 1.0,
      'EXPRESS': 0.5,
      'PRIORITY': 0.3,
      'EMERGENCY': 0.1
    }
    
    return multipliers[urgency]
  }
}

// Singleton instance
export const orderWorkflowEngine = new OrderWorkflowEngine()

// Utility functions for workflow management
export const workflowUtils = {
  /**
   * Create default approval workflow for a supplier
   */
  async createDefaultApprovalWorkflow(supplierId: string): Promise<OrderWorkflow> {
    const workflowId = uuidv4()
    
    const workflow: Omit<OrderWorkflow, 'createdAt' | 'updatedAt' | 'lastExecutedAt'> = {
      id: workflowId,
      supplierId,
      name: 'Standard Order Approval',
      description: 'Default workflow for order approval and processing',
      steps: [
        {
          id: uuidv4(),
          workflowId,
          stepNumber: 1,
          name: 'Order Validation',
          type: 'VALIDATION',
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
          id: uuidv4(),
          workflowId,
          stepNumber: 2,
          name: 'Manager Approval',
          type: 'APPROVAL',
          config: {
            assignedTo: ['manager'],
            timeoutHours: 24,
            autoApprove: false,
            escalationPath: ['senior_manager']
          },
          isRequired: true,
          canSkip: false,
          retryCount: 0,
          maxRetries: 1
        },
        {
          id: uuidv4(),
          workflowId,
          stepNumber: 3,
          name: 'Order Processing',
          type: 'PROCESSING',
          config: {
            assignedTo: ['operations'],
            timeoutHours: 8
          },
          isRequired: true,
          canSkip: false,
          retryCount: 0,
          maxRetries: 2
        },
        {
          id: uuidv4(),
          workflowId,
          stepNumber: 4,
          name: 'Shipping Preparation',
          type: 'SHIPPING',
          config: {
            assignedTo: ['shipping'],
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
      ],
      triggers: {
        orderValue: { min: 100 }
      },
      conditions: {
        businessHoursOnly: true,
        excludeHolidays: true,
        timeZone: 'UTC',
        autoEscalationHours: 48
      },
      isActive: true,
      version: 1,
      executionCount: 0
    }

    return workflow
  },

  /**
   * Calculate workflow efficiency metrics
   */
  calculateWorkflowEfficiency(executions: WorkflowExecutionResult[]): {
    averageCompletionTime: number
    successRate: number
    bottleneckSteps: Array<{ stepNumber: number; averageTime: number }>
    escalationRate: number
  } {
    if (executions.length === 0) {
      return {
        averageCompletionTime: 0,
        successRate: 0,
        bottleneckSteps: [],
        escalationRate: 0
      }
    }

    const completedExecutions = executions.filter(exec => exec.status === 'COMPLETED')
    const successRate = completedExecutions.length / executions.length

    // Calculate average completion time (simplified)
    const averageCompletionTime = completedExecutions.reduce((sum, exec) => {
      const duration = exec.estimatedCompletionTime ? 
        exec.estimatedCompletionTime.getTime() - Date.now() : 0
      return sum + duration
    }, 0) / completedExecutions.length

    // Find bottleneck steps (simplified)
    const stepTimes: Record<number, number[]> = {}
    completedExecutions.forEach(exec => {
      exec.completedSteps.forEach(step => {
        if (step.startedAt && step.completedAt) {
          const duration = step.completedAt.getTime() - step.startedAt.getTime()
          if (!stepTimes[step.stepNumber]) {
            stepTimes[step.stepNumber] = []
          }
          stepTimes[step.stepNumber].push(duration)
        }
      })
    })

    const bottleneckSteps = Object.entries(stepTimes)
      .map(([stepNumber, times]) => ({
        stepNumber: Number(stepNumber),
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 3)

    // Calculate escalation rate (simplified)
    const escalatedExecutions = executions.filter(exec => 
      exec.completedSteps.some(step => step.escalationLevel > 0)
    )
    const escalationRate = escalatedExecutions.length / executions.length

    return {
      averageCompletionTime,
      successRate,
      bottleneckSteps,
      escalationRate
    }
  }
}