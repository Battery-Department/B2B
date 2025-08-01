// Terminal 3 Phase 2: Intelligent Order Management System
// Advanced order processing, tracking, and management capabilities

export interface Order {
  id: string
  customerId: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingAmount: number
  total: number
  currency: string
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: PaymentMethodSummary
  createdAt: string
  updatedAt: string
  estimatedDelivery?: string
  actualDelivery?: string
  trackingNumber?: string
  notes?: string
  metadata: Record<string, any>
}

export interface OrderItem {
  id: string
  productId: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  batterySpecs?: {
    voltage: string
    capacity: string
    runtime: string
    compatibility: string[]
  }
}

export interface Address {
  firstName: string
  lastName: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  email?: string
  isResidential: boolean
  deliveryInstructions?: string
}

export interface PaymentMethodSummary {
  type: string
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'fulfillment'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned'

export interface Warehouse {
  id: string
  name: string
  address: Address
  inventory: InventoryItem[]
  shippingZones: string[]
  capabilities: string[]
  operatingHours: {
    start: string
    end: string
    timezone: string
  }
}

export interface InventoryItem {
  productId: string
  quantity: number
  reserved: number
  available: number
  reorderLevel: number
  lastUpdated: string
}

export interface ShippingOption {
  id: string
  name: string
  description: string
  estimatedDays: number
  cost: number
  carrier: string
  serviceLevel: 'standard' | 'express' | 'overnight' | 'same_day'
  trackingIncluded: boolean
  insuranceIncluded: boolean
  signatureRequired: boolean
}

export interface OrderModification {
  type: 'add_item' | 'remove_item' | 'update_quantity' | 'change_address' | 'upgrade_shipping' | 'apply_discount'
  data: any
  reason?: string
  requestedBy: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export class OrderOrchestrator {
  private warehouses: Warehouse[] = []
  private shippingProviders: string[] = ['UPS', 'FedEx', 'USPS', 'DHL']

  constructor() {
    this.initializeWarehouses()
  }

  // Initialize demo warehouses
  private initializeWarehouses(): void {
    this.warehouses = [
      {
        id: 'wh_west',
        name: 'West Coast Distribution Center',
        address: {
          firstName: 'Warehouse',
          lastName: 'Manager',
          line1: '1234 Industrial Blvd',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isResidential: false
        },
        inventory: [
          { productId: '6Ah', quantity: 500, reserved: 50, available: 450, reorderLevel: 100, lastUpdated: new Date().toISOString() },
          { productId: '9Ah', quantity: 300, reserved: 30, available: 270, reorderLevel: 75, lastUpdated: new Date().toISOString() },
          { productId: '15Ah', quantity: 150, reserved: 15, available: 135, reorderLevel: 50, lastUpdated: new Date().toISOString() }
        ],
        shippingZones: ['CA', 'NV', 'AZ', 'OR', 'WA'],
        capabilities: ['same_day', 'express', 'standard'],
        operatingHours: { start: '08:00', end: '18:00', timezone: 'America/Los_Angeles' }
      },
      {
        id: 'wh_east',
        name: 'East Coast Distribution Center',
        address: {
          firstName: 'Warehouse',
          lastName: 'Manager',
          line1: '5678 Commerce Dr',
          city: 'Atlanta',
          state: 'GA',
          postalCode: '30309',
          country: 'US',
          isResidential: false
        },
        inventory: [
          { productId: '6Ah', quantity: 400, reserved: 40, available: 360, reorderLevel: 100, lastUpdated: new Date().toISOString() },
          { productId: '9Ah', quantity: 250, reserved: 25, available: 225, reorderLevel: 75, lastUpdated: new Date().toISOString() },
          { productId: '15Ah', quantity: 100, reserved: 10, available: 90, reorderLevel: 50, lastUpdated: new Date().toISOString() }
        ],
        shippingZones: ['GA', 'FL', 'SC', 'NC', 'TN', 'AL', 'MS', 'LA'],
        capabilities: ['express', 'standard'],
        operatingHours: { start: '07:00', end: '19:00', timezone: 'America/New_York' }
      }
    ]
  }

  // Intelligent order routing and processing
  async processOrder(orderData: Partial<Order>): Promise<Order> {
    try {
      // Generate order ID
      const orderId = `ORD-${Date.now()}`

      // Apply business rules
      const processedOrder = await this.applyBusinessRules(orderData)

      // Find optimal warehouse
      const assignedWarehouse = await this.assignWarehouse(processedOrder)

      // Check inventory availability
      const inventoryCheck = await this.checkInventory(processedOrder.items!, assignedWarehouse)
      if (!inventoryCheck.available) {
        throw new Error(`Insufficient inventory: ${inventoryCheck.missingItems.join(', ')}`)
      }

      // Calculate shipping options
      const shippingOptions = await this.calculateShipping(processedOrder)

      // Create final order
      const order: Order = {
        id: orderId,
        customerId: processedOrder.customerId!,
        status: 'confirmed',
        items: processedOrder.items!,
        subtotal: processedOrder.subtotal!,
        discountAmount: processedOrder.discountAmount || 0,
        taxAmount: this.calculateTax(processedOrder),
        shippingAmount: processedOrder.shippingAmount || 0,
        total: processedOrder.total!,
        currency: processedOrder.currency || 'usd',
        shippingAddress: processedOrder.shippingAddress!,
        billingAddress: processedOrder.billingAddress!,
        paymentMethod: processedOrder.paymentMethod!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDelivery: this.calculateEstimatedDelivery(processedOrder.shippingAddress!, assignedWarehouse),
        metadata: {
          ...processedOrder.metadata,
          assignedWarehouse: assignedWarehouse.id,
          shippingOptions,
          businessRulesApplied: true,
          processingTimestamp: new Date().toISOString()
        }
      }

      // Reserve inventory
      await this.reserveInventory(order.items, assignedWarehouse)

      // Generate shipping label
      await this.generateShippingLabel(order)

      // Save order
      this.saveOrder(order)

      // Send confirmation
      await this.sendOrderConfirmation(order)

      return order
    } catch (error) {
      console.error('Order processing failed:', error)
      throw new Error(`Order processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Apply business rules (rush orders, bulk discounts, etc.)
  private async applyBusinessRules(orderData: Partial<Order>): Promise<Partial<Order>> {
    const processed = { ...orderData }

    // Rush order detection
    if (processed.metadata?.rushOrder) {
      processed.metadata.priority = 'high'
      processed.shippingAmount = (processed.shippingAmount || 0) * 1.5 // 50% rush fee
    }

    // Bulk order discounts
    const totalQuantity = processed.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    if (totalQuantity >= 50) {
      const bulkDiscount = (processed.subtotal || 0) * 0.05 // 5% bulk discount
      processed.discountAmount = (processed.discountAmount || 0) + bulkDiscount
      processed.total = (processed.subtotal || 0) - (processed.discountAmount || 0)
    }

    // Fleet customer benefits
    if (processed.metadata?.isFleetCustomer) {
      processed.metadata.expeditedProcessing = true
      processed.metadata.dedicatedSupport = true
    }

    return processed
  }

  // Find optimal warehouse based on location and inventory
  private async assignWarehouse(orderData: Partial<Order>): Promise<Warehouse> {
    const shippingState = orderData.shippingAddress?.state

    // Find warehouses that serve this state
    const availableWarehouses = this.warehouses.filter(wh => 
      wh.shippingZones.includes(shippingState || '')
    )

    if (availableWarehouses.length === 0) {
      // Default to nearest warehouse
      return this.warehouses[0]
    }

    // Check inventory availability
    for (const warehouse of availableWarehouses) {
      const hasInventory = orderData.items?.every(item => {
        const inventoryItem = warehouse.inventory.find(inv => inv.productId === item.productId)
        return inventoryItem && inventoryItem.available >= item.quantity
      })

      if (hasInventory) {
        return warehouse
      }
    }

    // If no warehouse has complete inventory, return the one with most items
    return availableWarehouses[0]
  }

  // Check inventory across locations
  private async checkInventory(
    items: OrderItem[], 
    warehouse: Warehouse
  ): Promise<{ available: boolean; missingItems: string[] }> {
    const missingItems: string[] = []

    for (const item of items) {
      const inventoryItem = warehouse.inventory.find(inv => inv.productId === item.productId)
      
      if (!inventoryItem || inventoryItem.available < item.quantity) {
        missingItems.push(`${item.name} (need ${item.quantity}, have ${inventoryItem?.available || 0})`)
      }
    }

    return {
      available: missingItems.length === 0,
      missingItems
    }
  }

  // Calculate shipping options
  private async calculateShipping(orderData: Partial<Order>): Promise<ShippingOption[]> {
    const totalWeight = orderData.items?.reduce((sum, item) => sum + (item.weight * item.quantity), 0) || 0
    const destination = orderData.shippingAddress?.state || ''

    const baseShippingCost = this.calculateBaseShippingCost(totalWeight, destination)

    return [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '5-7 business days',
        estimatedDays: 6,
        cost: baseShippingCost,
        carrier: 'UPS',
        serviceLevel: 'standard',
        trackingIncluded: true,
        insuranceIncluded: false,
        signatureRequired: false
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: '2-3 business days',
        estimatedDays: 2,
        cost: baseShippingCost * 2,
        carrier: 'FedEx',
        serviceLevel: 'express',
        trackingIncluded: true,
        insuranceIncluded: true,
        signatureRequired: false
      },
      {
        id: 'overnight',
        name: 'Next Day Delivery',
        description: '1 business day',
        estimatedDays: 1,
        cost: baseShippingCost * 4,
        carrier: 'FedEx',
        serviceLevel: 'overnight',
        trackingIncluded: true,
        insuranceIncluded: true,
        signatureRequired: true
      }
    ]
  }

  // Calculate base shipping cost
  private calculateBaseShippingCost(weight: number, destination: string): number {
    let baseCost = 0

    // Weight-based pricing
    if (weight <= 5) baseCost = 999 // $9.99
    else if (weight <= 15) baseCost = 1499 // $14.99
    else if (weight <= 30) baseCost = 1999 // $19.99
    else baseCost = 2999 // $29.99

    // Distance modifier
    const highCostStates = ['AK', 'HI', 'PR']
    if (highCostStates.includes(destination)) {
      baseCost *= 1.5
    }

    return baseCost
  }

  // Calculate tax based on shipping address
  private calculateTax(orderData: Partial<Order>): number {
    const state = orderData.shippingAddress?.state
    const subtotal = orderData.subtotal || 0

    // State tax rates (simplified)
    const taxRates: Record<string, number> = {
      'CA': 0.0875,
      'NY': 0.08,
      'TX': 0.0625,
      'FL': 0.06,
      'WA': 0.065,
      'OR': 0.0, // No sales tax
      'NH': 0.0, // No sales tax
      'MT': 0.0, // No sales tax
      'DE': 0.0  // No sales tax
    }

    const taxRate = taxRates[state || ''] || 0.05 // Default 5%
    return Math.round(subtotal * taxRate)
  }

  // Calculate estimated delivery date
  private calculateEstimatedDelivery(shippingAddress: Address, warehouse: Warehouse): string {
    const baseDeliveryDays = this.calculateDeliveryDays(shippingAddress.state, warehouse)
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + baseDeliveryDays)
    
    // Skip weekends
    while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
      deliveryDate.setDate(deliveryDate.getDate() + 1)
    }

    return deliveryDate.toISOString()
  }

  private calculateDeliveryDays(state: string, warehouse: Warehouse): number {
    if (warehouse.shippingZones.includes(state)) {
      return 3 // Local zone
    }
    return 5 // Cross-country
  }

  // Reserve inventory
  private async reserveInventory(items: OrderItem[], warehouse: Warehouse): Promise<void> {
    for (const item of items) {
      const inventoryItem = warehouse.inventory.find(inv => inv.productId === item.productId)
      if (inventoryItem) {
        inventoryItem.reserved += item.quantity
        inventoryItem.available -= item.quantity
        inventoryItem.lastUpdated = new Date().toISOString()
      }
    }

    // Save updated warehouse inventory
    this.saveWarehouse(warehouse)
  }

  // Generate shipping label
  private async generateShippingLabel(order: Order): Promise<void> {
    // In production, this would integrate with shipping carriers
    const trackingNumber = `1Z${Date.now()}`
    
    order.trackingNumber = trackingNumber
    order.status = 'processing'
    order.updatedAt = new Date().toISOString()
    
    console.log(`Shipping label generated for order ${order.id}: ${trackingNumber}`)
  }

  // Real-time order tracking
  async trackOrder(orderId: string): Promise<{
    order: Order
    trackingEvents: TrackingEvent[]
    estimatedDelivery: string
    currentLocation?: string
  }> {
    try {
      const order = this.getOrder(orderId)
      if (!order) {
        throw new Error('Order not found')
      }

      // Generate mock tracking events
      const trackingEvents = this.generateTrackingEvents(order)

      return {
        order,
        trackingEvents,
        estimatedDelivery: order.estimatedDelivery || '',
        currentLocation: this.getCurrentLocation(trackingEvents)
      }
    } catch (error) {
      console.error('Order tracking failed:', error)
      throw new Error(`Tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate mock tracking events
  private generateTrackingEvents(order: Order): TrackingEvent[] {
    const events: TrackingEvent[] = [
      {
        timestamp: order.createdAt,
        status: 'order_placed',
        description: 'Order has been placed and confirmed',
        location: 'Online'
      }
    ]

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      events.push({
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'processing',
        description: 'Order is being prepared for shipment',
        location: 'Fulfillment Center'
      })
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      events.push({
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'shipped',
        description: 'Package has been shipped',
        location: 'Origin Facility'
      })

      events.push({
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit',
        description: 'Package is in transit',
        location: 'Transit Hub'
      })
    }

    if (order.status === 'delivered') {
      events.push({
        timestamp: order.actualDelivery || new Date().toISOString(),
        status: 'delivered',
        description: 'Package has been delivered',
        location: order.shippingAddress.city
      })
    }

    return events
  }

  private getCurrentLocation(events: TrackingEvent[]): string {
    return events[events.length - 1]?.location || 'Unknown'
  }

  // Advanced order modifications
  async modifyOrder(orderId: string, modification: OrderModification): Promise<Order> {
    try {
      const order = this.getOrder(orderId)
      if (!order) {
        throw new Error('Order not found')
      }

      // Check if order can be modified
      if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
        throw new Error('Order cannot be modified in current status')
      }

      // Apply modification based on type
      const updatedOrder = await this.applyModification(order, modification)

      // Update order
      updatedOrder.updatedAt = new Date().toISOString()
      this.saveOrder(updatedOrder)

      return updatedOrder
    } catch (error) {
      console.error('Order modification failed:', error)
      throw new Error(`Modification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async applyModification(order: Order, modification: OrderModification): Promise<Order> {
    const updated = { ...order }

    switch (modification.type) {
      case 'add_item':
        updated.items.push(modification.data.item)
        break
      case 'remove_item':
        updated.items = updated.items.filter(item => item.id !== modification.data.itemId)
        break
      case 'update_quantity':
        const itemIndex = updated.items.findIndex(item => item.id === modification.data.itemId)
        if (itemIndex >= 0) {
          updated.items[itemIndex].quantity = modification.data.quantity
          updated.items[itemIndex].totalPrice = updated.items[itemIndex].unitPrice * modification.data.quantity
        }
        break
      case 'change_address':
        updated.shippingAddress = modification.data.address
        break
      case 'upgrade_shipping':
        updated.metadata.shippingUpgrade = modification.data.newShippingOption
        break
      case 'apply_discount':
        updated.discountAmount += modification.data.discountAmount
        break
    }

    // Recalculate totals
    updated.subtotal = updated.items.reduce((sum, item) => sum + item.totalPrice, 0)
    updated.total = updated.subtotal - updated.discountAmount + updated.taxAmount + updated.shippingAmount

    return updated
  }

  // Helper methods for data persistence (localStorage for demo)
  private saveOrder(order: Order): void {
    localStorage.setItem(`order_${order.id}`, JSON.stringify(order))
    
    // Also save to orders list
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    const orderIndex = existingOrders.findIndex((o: Order) => o.id === order.id)
    
    if (orderIndex >= 0) {
      existingOrders[orderIndex] = order
    } else {
      existingOrders.unshift(order)
    }
    
    localStorage.setItem('orders', JSON.stringify(existingOrders))
  }

  private getOrder(orderId: string): Order | null {
    const orderData = localStorage.getItem(`order_${orderId}`)
    return orderData ? JSON.parse(orderData) : null
  }

  private saveWarehouse(warehouse: Warehouse): void {
    localStorage.setItem(`warehouse_${warehouse.id}`, JSON.stringify(warehouse))
  }

  private async sendOrderConfirmation(order: Order): Promise<void> {
    // In production, send email/SMS confirmation
    console.log(`Order confirmation sent for order ${order.id}`)
  }
}

export interface TrackingEvent {
  timestamp: string
  status: string
  description: string
  location: string
}

// Export singleton instance
export const orderOrchestrator = new OrderOrchestrator()