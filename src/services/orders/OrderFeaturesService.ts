/**
 * RHY_054: Order Features Enhancement Service
 * Advanced order features including templates, scheduling, and automation
 * Enterprise-grade functionality for improved order management
 */

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { authService } from '@/services/auth/AuthService'
import { inventoryService } from '@/services/inventory-service'
import { orderService } from '@/services/order-service'
import { analyticsService } from '@/services/analytics/commerce-analytics'
import type { 
  OrderTemplate,
  ScheduledOrder,
  OrderAutomationRule,
  OrderAnalysis,
  ReorderSuggestion,
  OrderValidationRule,
  OrderFeatureSettings
} from '@/types/order_features'
import type { SupplierAuthData, SecurityContext } from '@/types/auth'

/**
 * Order Features Enhancement Service
 * Provides advanced order management capabilities
 */
export class OrderFeaturesService {
  private static instance: OrderFeaturesService
  private readonly cacheTimeout = 300000 // 5 minutes

  private constructor() {}

  public static getInstance(): OrderFeaturesService {
    if (!OrderFeaturesService.instance) {
      OrderFeaturesService.instance = new OrderFeaturesService()
    }
    return OrderFeaturesService.instance
  }

  /**
   * Order Templates Management
   */
  public async createOrderTemplate(
    template: Omit<OrderTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<OrderTemplate> {
    try {
      logger.info('Creating order template', {
        supplierId: supplier.id,
        templateName: template.name,
        itemCount: template.items.length
      })

      // Validate template items
      await this.validateTemplateItems(template.items, supplier)

      const orderTemplate = await prisma.orderTemplate.create({
        data: {
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          supplierId: supplier.id,
          name: template.name,
          description: template.description,
          category: template.category,
          items: template.items as any,
          settings: template.settings as any,
          isActive: template.isActive,
          isPublic: template.isPublic,
          tags: template.tags,
          metadata: {
            createdBy: supplier.id,
            securityContext,
            version: 1
          }
        }
      })

      logger.info('Order template created successfully', {
        templateId: orderTemplate.id,
        supplierId: supplier.id
      })

      return this.mapOrderTemplate(orderTemplate)

    } catch (error) {
      logger.error('Failed to create order template', {
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  public async getOrderTemplates(
    supplierId: string,
    filters: {
      category?: string
      isActive?: boolean
      search?: string
      tags?: string[]
    } = {}
  ): Promise<OrderTemplate[]> {
    try {
      const where: any = {
        supplierId,
        ...(filters.category && { category: filters.category }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
          ]
        }),
        ...(filters.tags && filters.tags.length > 0 && {
          tags: { hasSome: filters.tags }
        })
      }

      const templates = await prisma.orderTemplate.findMany({
        where,
        orderBy: { updatedAt: 'desc' }
      })

      return templates.map(template => this.mapOrderTemplate(template))

    } catch (error) {
      logger.error('Failed to fetch order templates', {
        supplierId,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  public async createOrderFromTemplate(
    templateId: string,
    customizations: {
      quantities?: Record<string, number>
      deliveryDate?: Date
      shippingAddress?: any
      notes?: string
    },
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<any> {
    try {
      const template = await prisma.orderTemplate.findUnique({
        where: { id: templateId, supplierId: supplier.id }
      })

      if (!template) {
        throw new Error('Order template not found')
      }

      // Apply customizations to template items
      const items = (template.items as any[]).map(item => ({
        ...item,
        quantity: customizations.quantities?.[item.productId] || item.quantity
      }))

      // Create order using standard order service
      const orderData = {
        customerId: supplier.id,
        items,
        shippingAddress: customizations.shippingAddress || supplier.defaultShippingAddress,
        notes: customizations.notes,
        metadata: {
          templateId,
          templateName: template.name,
          createdFromTemplate: true
        }
      }

      const order = await orderService.createOrder(orderData)

      // Update template usage statistics
      await this.updateTemplateUsageStats(templateId)

      logger.info('Order created from template', {
        templateId,
        orderId: order.id,
        supplierId: supplier.id
      })

      return order

    } catch (error) {
      logger.error('Failed to create order from template', {
        templateId,
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Scheduled Orders Management
   */
  public async createScheduledOrder(
    scheduledOrder: Omit<ScheduledOrder, 'id' | 'createdAt' | 'updatedAt'>,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<ScheduledOrder> {
    try {
      logger.info('Creating scheduled order', {
        supplierId: supplier.id,
        scheduleType: scheduledOrder.schedule.type,
        nextExecution: scheduledOrder.nextExecutionDate
      })

      const scheduled = await prisma.scheduledOrder.create({
        data: {
          id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          supplierId: supplier.id,
          name: scheduledOrder.name,
          description: scheduledOrder.description,
          orderData: scheduledOrder.orderData as any,
          schedule: scheduledOrder.schedule as any,
          isActive: scheduledOrder.isActive,
          nextExecutionDate: scheduledOrder.nextExecutionDate,
          lastExecutionDate: scheduledOrder.lastExecutionDate,
          executionCount: scheduledOrder.executionCount || 0,
          maxExecutions: scheduledOrder.maxExecutions,
          endDate: scheduledOrder.endDate,
          metadata: {
            createdBy: supplier.id,
            securityContext
          }
        }
      })

      logger.info('Scheduled order created successfully', {
        scheduledOrderId: scheduled.id,
        supplierId: supplier.id
      })

      return this.mapScheduledOrder(scheduled)

    } catch (error) {
      logger.error('Failed to create scheduled order', {
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  public async processScheduledOrders(): Promise<void> {
    try {
      const now = new Date()
      
      const pendingOrders = await prisma.scheduledOrder.findMany({
        where: {
          isActive: true,
          nextExecutionDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ],
          OR: [
            { maxExecutions: null },
            { executionCount: { lt: prisma.raw('maxExecutions') } }
          ]
        }
      })

      logger.info('Processing scheduled orders', {
        pendingCount: pendingOrders.length
      })

      for (const scheduledOrder of pendingOrders) {
        try {
          await this.executeScheduledOrder(scheduledOrder)
        } catch (error) {
          logger.error('Failed to execute scheduled order', {
            scheduledOrderId: scheduledOrder.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

    } catch (error) {
      logger.error('Failed to process scheduled orders', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Order Automation Rules
   */
  public async createAutomationRule(
    rule: Omit<OrderAutomationRule, 'id' | 'createdAt' | 'updatedAt'>,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<OrderAutomationRule> {
    try {
      logger.info('Creating automation rule', {
        supplierId: supplier.id,
        trigger: rule.trigger.type,
        action: rule.action.type
      })

      const automationRule = await prisma.orderAutomationRule.create({
        data: {
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          supplierId: supplier.id,
          name: rule.name,
          description: rule.description,
          trigger: rule.trigger as any,
          conditions: rule.conditions as any,
          action: rule.action as any,
          isActive: rule.isActive,
          priority: rule.priority,
          executionCount: 0,
          lastExecutionDate: null,
          metadata: {
            createdBy: supplier.id,
            securityContext
          }
        }
      })

      logger.info('Automation rule created successfully', {
        ruleId: automationRule.id,
        supplierId: supplier.id
      })

      return this.mapAutomationRule(automationRule)

    } catch (error) {
      logger.error('Failed to create automation rule', {
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Order Analysis and Suggestions
   */
  public async analyzeOrderPatterns(
    supplierId: string,
    options: {
      dateRange?: { start: Date; end: Date }
      productCategories?: string[]
      includeReorderSuggestions?: boolean
    } = {}
  ): Promise<OrderAnalysis> {
    try {
      const { dateRange, productCategories, includeReorderSuggestions = true } = options
      
      // Get historical order data
      const orders = await prisma.order.findMany({
        where: {
          supplierId,
          ...(dateRange && {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end
            }
          }),
          status: { in: ['completed', 'delivered'] }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Analyze patterns
      const analysis = this.performOrderAnalysis(orders, productCategories)

      // Generate reorder suggestions if requested
      let reorderSuggestions: ReorderSuggestion[] = []
      if (includeReorderSuggestions) {
        reorderSuggestions = await this.generateReorderSuggestions(supplierId, analysis)
      }

      const result: OrderAnalysis = {
        supplierId,
        analysisDate: new Date(),
        periodAnalyzed: dateRange || {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
          end: new Date()
        },
        totalOrders: orders.length,
        totalValue: orders.reduce((sum, order) => sum + order.total, 0),
        averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
        patterns: analysis.patterns,
        trends: analysis.trends,
        seasonality: analysis.seasonality,
        productInsights: analysis.productInsights,
        reorderSuggestions,
        recommendations: this.generateRecommendations(analysis)
      }

      logger.info('Order analysis completed', {
        supplierId,
        ordersAnalyzed: orders.length,
        suggestionsGenerated: reorderSuggestions.length
      })

      return result

    } catch (error) {
      logger.error('Failed to analyze order patterns', {
        supplierId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Smart Reorder Suggestions
   */
  public async generateSmartReorderSuggestions(
    supplierId: string,
    options: {
      predictiveDays?: number
      confidenceThreshold?: number
      includeSeasonality?: boolean
    } = {}
  ): Promise<ReorderSuggestion[]> {
    try {
      const { predictiveDays = 30, confidenceThreshold = 0.7, includeSeasonality = true } = options

      // Get recent order history
      const recentOrders = await prisma.order.findMany({
        where: {
          supplierId,
          createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }, // 6 months
          status: { in: ['completed', 'delivered'] }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Calculate consumption patterns
      const productConsumption = this.calculateProductConsumption(recentOrders)

      // Generate predictive suggestions
      const suggestions: ReorderSuggestion[] = []

      for (const [productId, consumption] of Object.entries(productConsumption)) {
        const prediction = this.predictFutureNeed(consumption, predictiveDays, includeSeasonality)
        
        if (prediction.confidence >= confidenceThreshold) {
          const currentInventory = await inventoryService.getProductInventory(productId)
          const daysUntilStockout = this.calculateDaysUntilStockout(currentInventory, consumption.averageDaily)

          if (daysUntilStockout <= predictiveDays) {
            suggestions.push({
              productId,
              productName: consumption.productName,
              productSku: consumption.productSku,
              suggestedQuantity: Math.ceil(prediction.predictedQuantity),
              confidence: prediction.confidence,
              urgency: this.calculateUrgency(daysUntilStockout),
              reasoning: prediction.reasoning,
              estimatedStockoutDate: new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000),
              recommendedOrderDate: new Date(Date.now() + Math.max(0, daysUntilStockout - 7) * 24 * 60 * 60 * 1000),
              costAnalysis: {
                unitPrice: consumption.averageUnitPrice,
                totalCost: Math.ceil(prediction.predictedQuantity) * consumption.averageUnitPrice,
                potentialSavings: 0 // Could calculate bulk discount savings
              }
            })
          }
        }
      }

      // Sort by urgency and confidence
      suggestions.sort((a, b) => {
        if (a.urgency !== b.urgency) {
          const urgencyOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
        }
        return b.confidence - a.confidence
      })

      logger.info('Smart reorder suggestions generated', {
        supplierId,
        suggestionsCount: suggestions.length,
        highUrgencyCount: suggestions.filter(s => s.urgency === 'HIGH').length
      })

      return suggestions

    } catch (error) {
      logger.error('Failed to generate smart reorder suggestions', {
        supplierId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Order Validation Rules
   */
  public async createValidationRule(
    rule: Omit<OrderValidationRule, 'id' | 'createdAt' | 'updatedAt'>,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<OrderValidationRule> {
    try {
      const validationRule = await prisma.orderValidationRule.create({
        data: {
          id: `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          supplierId: supplier.id,
          name: rule.name,
          description: rule.description,
          ruleType: rule.ruleType,
          conditions: rule.conditions as any,
          action: rule.action as any,
          severity: rule.severity,
          isActive: rule.isActive,
          metadata: {
            createdBy: supplier.id,
            securityContext
          }
        }
      })

      return this.mapValidationRule(validationRule)

    } catch (error) {
      logger.error('Failed to create validation rule', {
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  public async validateOrder(
    orderData: any,
    supplier: SupplierAuthData
  ): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  }> {
    try {
      const rules = await prisma.orderValidationRule.findMany({
        where: {
          supplierId: supplier.id,
          isActive: true
        }
      })

      const errors: string[] = []
      const warnings: string[] = []
      const suggestions: string[] = []

      for (const rule of rules) {
        const result = this.executeValidationRule(rule, orderData)
        
        if (result.triggered) {
          switch (rule.severity) {
            case 'ERROR':
              errors.push(result.message)
              break
            case 'WARNING':
              warnings.push(result.message)
              break
            case 'INFO':
              suggestions.push(result.message)
              break
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      }

    } catch (error) {
      logger.error('Failed to validate order', {
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  // Private helper methods

  private mapOrderTemplate(template: any): OrderTemplate {
    return {
      id: template.id,
      supplierId: template.supplierId,
      name: template.name,
      description: template.description,
      category: template.category,
      items: template.items,
      settings: template.settings,
      isActive: template.isActive,
      isPublic: template.isPublic,
      tags: template.tags,
      usageCount: template.usageCount || 0,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }
  }

  private mapScheduledOrder(scheduled: any): ScheduledOrder {
    return {
      id: scheduled.id,
      supplierId: scheduled.supplierId,
      name: scheduled.name,
      description: scheduled.description,
      orderData: scheduled.orderData,
      schedule: scheduled.schedule,
      isActive: scheduled.isActive,
      nextExecutionDate: scheduled.nextExecutionDate,
      lastExecutionDate: scheduled.lastExecutionDate,
      executionCount: scheduled.executionCount,
      maxExecutions: scheduled.maxExecutions,
      endDate: scheduled.endDate,
      createdAt: scheduled.createdAt,
      updatedAt: scheduled.updatedAt
    }
  }

  private mapAutomationRule(rule: any): OrderAutomationRule {
    return {
      id: rule.id,
      supplierId: rule.supplierId,
      name: rule.name,
      description: rule.description,
      trigger: rule.trigger,
      conditions: rule.conditions,
      action: rule.action,
      isActive: rule.isActive,
      priority: rule.priority,
      executionCount: rule.executionCount,
      lastExecutionDate: rule.lastExecutionDate,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    }
  }

  private mapValidationRule(rule: any): OrderValidationRule {
    return {
      id: rule.id,
      supplierId: rule.supplierId,
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      conditions: rule.conditions,
      action: rule.action,
      severity: rule.severity,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    }
  }

  private async validateTemplateItems(items: any[], supplier: SupplierAuthData): Promise<void> {
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product || !product.isActive) {
        throw new Error(`Product ${item.productId} is not available`)
      }

      // Additional validation logic here
    }
  }

  private async updateTemplateUsageStats(templateId: string): Promise<void> {
    await prisma.orderTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    })
  }

  private async executeScheduledOrder(scheduledOrder: any): Promise<void> {
    try {
      // Create order from scheduled order data
      const order = await orderService.createOrder(scheduledOrder.orderData)

      // Calculate next execution date
      const nextExecution = this.calculateNextExecution(scheduledOrder.schedule, new Date())

      // Update scheduled order
      await prisma.scheduledOrder.update({
        where: { id: scheduledOrder.id },
        data: {
          lastExecutionDate: new Date(),
          executionCount: { increment: 1 },
          nextExecutionDate: nextExecution
        }
      })

      logger.info('Scheduled order executed successfully', {
        scheduledOrderId: scheduledOrder.id,
        orderId: order.id,
        nextExecution
      })

    } catch (error) {
      logger.error('Failed to execute scheduled order', {
        scheduledOrderId: scheduledOrder.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  private calculateNextExecution(schedule: any, currentDate: Date): Date | null {
    const { type, interval, dayOfWeek, dayOfMonth, time } = schedule

    switch (type) {
      case 'DAILY':
        return new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000)
      
      case 'WEEKLY':
        const nextWeekly = new Date(currentDate)
        nextWeekly.setDate(nextWeekly.getDate() + (7 - nextWeekly.getDay() + dayOfWeek) % 7)
        return nextWeekly
      
      case 'MONTHLY':
        const nextMonthly = new Date(currentDate)
        nextMonthly.setMonth(nextMonthly.getMonth() + 1)
        nextMonthly.setDate(dayOfMonth)
        return nextMonthly
      
      default:
        return null
    }
  }

  private performOrderAnalysis(orders: any[], productCategories?: string[]): any {
    // Complex analysis logic would go here
    return {
      patterns: {},
      trends: {},
      seasonality: {},
      productInsights: {}
    }
  }

  private generateReorderSuggestions(supplierId: string, analysis: any): Promise<ReorderSuggestion[]> {
    // Generate suggestions based on analysis
    return Promise.resolve([])
  }

  private generateRecommendations(analysis: any): string[] {
    // Generate actionable recommendations
    return []
  }

  private calculateProductConsumption(orders: any[]): Record<string, any> {
    const consumption: Record<string, any> = {}
    
    for (const order of orders) {
      for (const item of order.items) {
        if (!consumption[item.productId]) {
          consumption[item.productId] = {
            productName: item.product.name,
            productSku: item.product.sku,
            totalQuantity: 0,
            totalOrders: 0,
            averageUnitPrice: 0,
            orderDates: []
          }
        }
        
        consumption[item.productId].totalQuantity += item.quantity
        consumption[item.productId].totalOrders += 1
        consumption[item.productId].averageUnitPrice = item.unitPrice
        consumption[item.productId].orderDates.push(order.createdAt)
      }
    }

    // Calculate average daily consumption
    for (const productId in consumption) {
      const data = consumption[productId]
      const daysBetween = this.calculateDaysBetweenDates(data.orderDates)
      data.averageDaily = daysBetween > 0 ? data.totalQuantity / daysBetween : 0
    }

    return consumption
  }

  private predictFutureNeed(consumption: any, days: number, includeSeasonality: boolean): any {
    // Simplified prediction logic
    const predictedQuantity = consumption.averageDaily * days
    
    return {
      predictedQuantity,
      confidence: 0.8, // Would be calculated based on historical accuracy
      reasoning: `Based on average daily consumption of ${consumption.averageDaily.toFixed(2)} units`
    }
  }

  private calculateDaysUntilStockout(inventory: any, dailyConsumption: number): number {
    const availableQuantity = inventory?.availableQuantity || 0
    return dailyConsumption > 0 ? Math.floor(availableQuantity / dailyConsumption) : 999
  }

  private calculateUrgency(daysUntilStockout: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (daysUntilStockout <= 7) return 'HIGH'
    if (daysUntilStockout <= 14) return 'MEDIUM'
    return 'LOW'
  }

  private calculateDaysBetweenDates(dates: Date[]): number {
    if (dates.length < 2) return 0
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
    const firstDate = sortedDates[0]
    const lastDate = sortedDates[sortedDates.length - 1]
    return Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  private executeValidationRule(rule: any, orderData: any): { triggered: boolean; message: string } {
    // Execute validation rule logic
    // This would implement the rule conditions and return appropriate result
    return {
      triggered: false,
      message: ''
    }
  }
}

// Export singleton instance
export const orderFeaturesService = OrderFeaturesService.getInstance()