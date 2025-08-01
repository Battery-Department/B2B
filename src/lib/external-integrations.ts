/**
 * RHY Supplier Portal - External Integrations Library
 * Enterprise-grade external system integrations for order processing
 * Handles warehouse management systems, shipping providers, and third-party APIs
 */

import { z } from 'zod'

// Integration configuration interfaces
export interface IntegrationConfig {
  enabled: boolean
  apiKey: string
  baseUrl: string
  timeout: number
  retryAttempts: number
  webhookSecret?: string
}

export interface WarehouseIntegration {
  warehouseId: string
  systemType: 'WMS' | 'ERP' | 'CUSTOM'
  config: IntegrationConfig
  endpoints: {
    inventory: string
    orders: string
    status: string
    sync: string
  }
}

export interface ShippingIntegration {
  carrier: string
  config: IntegrationConfig
  capabilities: {
    tracking: boolean
    labeling: boolean
    rateQuoting: boolean
    pickupScheduling: boolean
  }
}

// Validation schemas
const IntegrationConfigSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
  timeout: z.number().positive(),
  retryAttempts: z.number().min(1).max(5),
  webhookSecret: z.string().optional()
})

const WarehouseIntegrationSchema = z.object({
  warehouseId: z.string().min(1),
  systemType: z.enum(['WMS', 'ERP', 'CUSTOM']),
  config: IntegrationConfigSchema,
  endpoints: z.object({
    inventory: z.string().min(1),
    orders: z.string().min(1),
    status: z.string().min(1),
    sync: z.string().min(1)
  })
})

/**
 * External Integrations Manager
 * Manages all external system integrations with proper error handling and retry logic
 */
export class ExternalIntegrationsManager {
  private warehouseIntegrations: Map<string, WarehouseIntegration> = new Map()
  private shippingIntegrations: Map<string, ShippingIntegration> = new Map()

  constructor() {
    this.initializeIntegrations()
  }

  /**
   * Initialize all external integrations
   */
  private initializeIntegrations(): void {
    // Initialize warehouse integrations
    this.initializeWarehouseIntegrations()
    
    // Initialize shipping integrations
    this.initializeShippingIntegrations()
  }

  /**
   * Initialize warehouse management system integrations
   */
  private initializeWarehouseIntegrations(): void {
    // US Warehouse - Manhattan WMS Integration
    this.warehouseIntegrations.set('US', {
      warehouseId: 'US',
      systemType: 'WMS',
      config: {
        enabled: true,
        apiKey: process.env.US_WMS_API_KEY || 'us_wms_key',
        baseUrl: 'https://api.manhattan-wms.us.flexvolt.com',
        timeout: 30000,
        retryAttempts: 3,
        webhookSecret: process.env.US_WMS_WEBHOOK_SECRET
      },
      endpoints: {
        inventory: '/api/v1/inventory',
        orders: '/api/v1/orders',
        status: '/api/v1/status',
        sync: '/api/v1/sync'
      }
    })

    // Japan Warehouse - SAP ERP Integration
    this.warehouseIntegrations.set('JP', {
      warehouseId: 'JP',
      systemType: 'ERP',
      config: {
        enabled: true,
        apiKey: process.env.JP_ERP_API_KEY || 'jp_erp_key',
        baseUrl: 'https://api.sap-erp.jp.flexvolt.com',
        timeout: 45000,
        retryAttempts: 3,
        webhookSecret: process.env.JP_ERP_WEBHOOK_SECRET
      },
      endpoints: {
        inventory: '/api/v2/materials',
        orders: '/api/v2/sales-orders',
        status: '/api/v2/order-status',
        sync: '/api/v2/sync'
      }
    })

    // EU Warehouse - Infor WMS Integration
    this.warehouseIntegrations.set('EU', {
      warehouseId: 'EU',
      systemType: 'WMS',
      config: {
        enabled: true,
        apiKey: process.env.EU_WMS_API_KEY || 'eu_wms_key',
        baseUrl: 'https://api.infor-wms.eu.flexvolt.com',
        timeout: 35000,
        retryAttempts: 3,
        webhookSecret: process.env.EU_WMS_WEBHOOK_SECRET
      },
      endpoints: {
        inventory: '/api/v1/stock',
        orders: '/api/v1/orders',
        status: '/api/v1/tracking',
        sync: '/api/v1/synchronize'
      }
    })

    // Australia Warehouse - Custom Integration
    this.warehouseIntegrations.set('AU', {
      warehouseId: 'AU',
      systemType: 'CUSTOM',
      config: {
        enabled: true,
        apiKey: process.env.AU_CUSTOM_API_KEY || 'au_custom_key',
        baseUrl: 'https://api.custom-wms.au.flexvolt.com',
        timeout: 40000,
        retryAttempts: 3,
        webhookSecret: process.env.AU_CUSTOM_WEBHOOK_SECRET
      },
      endpoints: {
        inventory: '/warehouse/inventory',
        orders: '/warehouse/orders',
        status: '/warehouse/status',
        sync: '/warehouse/sync'
      }
    })
  }

  /**
   * Initialize shipping provider integrations
   */
  private initializeShippingIntegrations(): void {
    // FedEx Integration
    this.shippingIntegrations.set('FEDEX', {
      carrier: 'FedEx',
      config: {
        enabled: true,
        apiKey: process.env.FEDEX_API_KEY || 'fedex_key',
        baseUrl: 'https://api.fedex.com',
        timeout: 30000,
        retryAttempts: 3
      },
      capabilities: {
        tracking: true,
        labeling: true,
        rateQuoting: true,
        pickupScheduling: true
      }
    })

    // UPS Integration
    this.shippingIntegrations.set('UPS', {
      carrier: 'UPS',
      config: {
        enabled: true,
        apiKey: process.env.UPS_API_KEY || 'ups_key',
        baseUrl: 'https://api.ups.com',
        timeout: 30000,
        retryAttempts: 3
      },
      capabilities: {
        tracking: true,
        labeling: true,
        rateQuoting: true,
        pickupScheduling: true
      }
    })

    // DHL Integration
    this.shippingIntegrations.set('DHL', {
      carrier: 'DHL',
      config: {
        enabled: true,
        apiKey: process.env.DHL_API_KEY || 'dhl_key',
        baseUrl: 'https://api.dhl.com',
        timeout: 35000,
        retryAttempts: 3
      },
      capabilities: {
        tracking: true,
        labeling: true,
        rateQuoting: true,
        pickupScheduling: false
      }
    })
  }

  /**
   * Send order to warehouse management system
   */
  async sendOrderToWarehouse(
    warehouseId: string,
    orderData: any
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    const integration = this.warehouseIntegrations.get(warehouseId)
    
    if (!integration) {
      return {
        success: false,
        error: `No integration configured for warehouse ${warehouseId}`
      }
    }

    if (!integration.config.enabled) {
      return {
        success: false,
        error: `Integration disabled for warehouse ${warehouseId}`
      }
    }

    try {
      const response = await this.makeApiRequest(
        integration.config,
        'POST',
        integration.endpoints.orders,
        orderData
      )

      return {
        success: true,
        response: response.data
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to send order to warehouse ${warehouseId}: ${error.message}`
      }
    }
  }

  /**
   * Get inventory levels from warehouse
   */
  async getWarehouseInventory(
    warehouseId: string,
    sku?: string
  ): Promise<{ success: boolean; inventory?: any; error?: string }> {
    const integration = this.warehouseIntegrations.get(warehouseId)
    
    if (!integration) {
      return {
        success: false,
        error: `No integration configured for warehouse ${warehouseId}`
      }
    }

    try {
      const endpoint = sku 
        ? `${integration.endpoints.inventory}/${sku}`
        : integration.endpoints.inventory

      const response = await this.makeApiRequest(
        integration.config,
        'GET',
        endpoint
      )

      return {
        success: true,
        inventory: response.data
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to get inventory from warehouse ${warehouseId}: ${error.message}`
      }
    }
  }

  /**
   * Sync order status from warehouse
   */
  async syncOrderStatus(
    warehouseId: string,
    orderId: string
  ): Promise<{ success: boolean; status?: any; error?: string }> {
    const integration = this.warehouseIntegrations.get(warehouseId)
    
    if (!integration) {
      return {
        success: false,
        error: `No integration configured for warehouse ${warehouseId}`
      }
    }

    try {
      const response = await this.makeApiRequest(
        integration.config,
        'GET',
        `${integration.endpoints.status}/${orderId}`
      )

      return {
        success: true,
        status: response.data
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to sync order status from warehouse ${warehouseId}: ${error.message}`
      }
    }
  }

  /**
   * Get shipping rates from carrier
   */
  async getShippingRates(
    carrier: string,
    shipmentData: any
  ): Promise<{ success: boolean; rates?: any; error?: string }> {
    const integration = this.shippingIntegrations.get(carrier.toUpperCase())
    
    if (!integration) {
      return {
        success: false,
        error: `No integration configured for carrier ${carrier}`
      }
    }

    if (!integration.capabilities.rateQuoting) {
      return {
        success: false,
        error: `Rate quoting not supported for carrier ${carrier}`
      }
    }

    try {
      const response = await this.makeApiRequest(
        integration.config,
        'POST',
        '/api/v1/rates',
        shipmentData
      )

      return {
        success: true,
        rates: response.data
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to get shipping rates from ${carrier}: ${error.message}`
      }
    }
  }

  /**
   * Track shipment with carrier
   */
  async trackShipment(
    carrier: string,
    trackingNumber: string
  ): Promise<{ success: boolean; tracking?: any; error?: string }> {
    const integration = this.shippingIntegrations.get(carrier.toUpperCase())
    
    if (!integration) {
      return {
        success: false,
        error: `No integration configured for carrier ${carrier}`
      }
    }

    if (!integration.capabilities.tracking) {
      return {
        success: false,
        error: `Tracking not supported for carrier ${carrier}`
      }
    }

    try {
      const response = await this.makeApiRequest(
        integration.config,
        'GET',
        `/api/v1/track/${trackingNumber}`
      )

      return {
        success: true,
        tracking: response.data
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to track shipment with ${carrier}: ${error.message}`
      }
    }
  }

  /**
   * Create shipping label
   */
  async createShippingLabel(
    carrier: string,
    shipmentData: any
  ): Promise<{ success: boolean; label?: any; error?: string }> {
    const integration = this.shippingIntegrations.get(carrier.toUpperCase())
    
    if (!integration) {
      return {
        success: false,
        error: `No integration configured for carrier ${carrier}`
      }
    }

    if (!integration.capabilities.labeling) {
      return {
        success: false,
        error: `Label creation not supported for carrier ${carrier}`
      }
    }

    try {
      const response = await this.makeApiRequest(
        integration.config,
        'POST',
        '/api/v1/labels',
        shipmentData
      )

      return {
        success: true,
        label: response.data
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to create shipping label with ${carrier}: ${error.message}`
      }
    }
  }

  /**
   * Make authenticated API request with retry logic
   */
  private async makeApiRequest(
    config: IntegrationConfig,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<any> {
    const url = `${config.baseUrl}${endpoint}`
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
            'User-Agent': 'RHY-Supplier-Portal/1.0'
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(config.timeout)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const responseData = await response.json()
        
        // Log successful request
        console.log(`External API request successful: ${method} ${url} (attempt ${attempt})`)
        
        return responseData

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        console.warn(`External API request failed: ${method} ${url} (attempt ${attempt}/${config.retryAttempts}):`, error)
        
        if (attempt === config.retryAttempts) {
          break
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000)
      }
    }

    throw lastError || new Error('All retry attempts failed')
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Health check for all integrations
   */
  async performHealthCheck(): Promise<{
    warehouses: Record<string, { status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }>
    shipping: Record<string, { status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }>
  }> {
    const results = {
      warehouses: {} as Record<string, any>,
      shipping: {} as Record<string, any>
    }

    // Check warehouse integrations
    for (const [warehouseId, integration] of this.warehouseIntegrations) {
      const startTime = Date.now()
      try {
        await this.makeApiRequest(
          integration.config,
          'GET',
          '/health'
        )
        
        results.warehouses[warehouseId] = {
          status: 'healthy',
          responseTime: Date.now() - startTime
        }
      } catch (error) {
        results.warehouses[warehouseId] = {
          status: 'unhealthy',
          error: error.message
        }
      }
    }

    // Check shipping integrations
    for (const [carrier, integration] of this.shippingIntegrations) {
      const startTime = Date.now()
      try {
        await this.makeApiRequest(
          integration.config,
          'GET',
          '/health'
        )
        
        results.shipping[carrier] = {
          status: 'healthy',
          responseTime: Date.now() - startTime
        }
      } catch (error) {
        results.shipping[carrier] = {
          status: 'unhealthy',
          error: error.message
        }
      }
    }

    return results
  }

  /**
   * Get integration configuration for a warehouse
   */
  getWarehouseIntegration(warehouseId: string): WarehouseIntegration | undefined {
    return this.warehouseIntegrations.get(warehouseId)
  }

  /**
   * Get integration configuration for a shipping carrier
   */
  getShippingIntegration(carrier: string): ShippingIntegration | undefined {
    return this.shippingIntegrations.get(carrier.toUpperCase())
  }

  /**
   * Update integration configuration
   */
  updateWarehouseIntegration(warehouseId: string, integration: WarehouseIntegration): void {
    // Validate configuration
    WarehouseIntegrationSchema.parse(integration)
    
    this.warehouseIntegrations.set(warehouseId, integration)
    console.log(`Updated warehouse integration for ${warehouseId}`)
  }
}

export const externalIntegrationsManager = new ExternalIntegrationsManager()