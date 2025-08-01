// Terminal 3 Integration: Real Inventory Management Service
// Database-connected inventory tracking with multi-warehouse support

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface InventoryItem {
  productId: string
  warehouseId: string
  available: number
  reserved: number
  onOrder: number
  reorderLevel: number
  reorderQuantity: number
  lastUpdated: Date
}

export interface InventoryAvailability {
  available: boolean
  warehouse: string
  quantity: number
  estimatedDelivery?: Date
  alternativeWarehouses?: AlternativeWarehouse[]
}

export interface AlternativeWarehouse {
  warehouseId: string
  warehouseName: string
  available: number
  estimatedDelivery: Date
  shippingCost: number
}

export interface WarehouseInfo {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  isPrimary: boolean
  transitDays: Record<string, number> // state -> days
}

export class OutOfStockError extends Error {
  constructor(
    public productId: string,
    public requestedQuantity: number,
    public availableQuantity: number
  ) {
    super(`Product ${productId} out of stock. Requested: ${requestedQuantity}, Available: ${availableQuantity}`)
  }
}

export class InventoryService {
  // Check inventory availability
  async checkAvailability(productId: string, quantity: number): Promise<InventoryAvailability> {
    try {
      // Check primary warehouse first
      const primaryInventory = await prisma.inventory.findFirst({
        where: {
          productId,
          warehouse: {
            isPrimary: true
          }
        },
        include: {
          warehouse: true
        }
      })

      const availableInPrimary = primaryInventory ? 
        primaryInventory.available - primaryInventory.reserved : 0

      if (availableInPrimary >= quantity) {
        return {
          available: true,
          warehouse: primaryInventory!.warehouse.name,
          quantity: availableInPrimary,
          estimatedDelivery: this.calculateDeliveryDate(2) // 2 days for primary
        }
      }

      // Check alternative warehouses
      const alternativeStock = await this.checkAlternativeWarehouses(productId, quantity)
      
      if (alternativeStock.length > 0) {
        const bestOption = alternativeStock[0] // Already sorted by delivery time
        return {
          available: true,
          warehouse: bestOption.warehouseName,
          quantity: bestOption.available,
          estimatedDelivery: bestOption.estimatedDelivery,
          alternativeWarehouses: alternativeStock
        }
      }

      // Not enough stock anywhere
      throw new OutOfStockError(productId, quantity, availableInPrimary)
    } catch (error) {
      if (error instanceof OutOfStockError) {
        throw error
      }
      console.error('Failed to check inventory availability:', error)
      throw new Error('Inventory check failed')
    }
  }

  // Check alternative warehouses
  async checkAlternativeWarehouses(
    productId: string, 
    quantity: number
  ): Promise<AlternativeWarehouse[]> {
    const inventories = await prisma.inventory.findMany({
      where: {
        productId,
        available: {
          gte: quantity
        }
      },
      include: {
        warehouse: true
      }
    })

    const alternatives: AlternativeWarehouse[] = []

    for (const inventory of inventories) {
      const available = inventory.available - inventory.reserved
      
      if (available >= quantity) {
        alternatives.push({
          warehouseId: inventory.warehouseId,
          warehouseName: inventory.warehouse.name,
          available,
          estimatedDelivery: this.calculateDeliveryDate(
            inventory.warehouse.isPrimary ? 2 : 5
          ),
          shippingCost: inventory.warehouse.isPrimary ? 0 : 15
        })
      }
    }

    // Sort by delivery time, then by shipping cost
    alternatives.sort((a, b) => {
      const timeDiff = a.estimatedDelivery.getTime() - b.estimatedDelivery.getTime()
      return timeDiff !== 0 ? timeDiff : a.shippingCost - b.shippingCost
    })

    return alternatives
  }

  // Reserve inventory
  async reserveInventory(
    productId: string, 
    quantity: number, 
    orderId: string,
    warehouseId?: string
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Find inventory to reserve from
        const inventory = warehouseId
          ? await tx.inventory.findUnique({
              where: {
                productId_warehouseId: {
                  productId,
                  warehouseId
                }
              }
            })
          : await tx.inventory.findFirst({
              where: {
                productId,
                available: {
                  gte: quantity
                }
              },
              orderBy: {
                warehouse: {
                  isPrimary: 'desc'
                }
              }
            })

        if (!inventory) {
          throw new Error('No inventory available to reserve')
        }

        const availableQuantity = inventory.available - inventory.reserved
        if (availableQuantity < quantity) {
          throw new OutOfStockError(productId, quantity, availableQuantity)
        }

        // Update inventory
        await tx.inventory.update({
          where: {
            id: inventory.id
          },
          data: {
            reserved: inventory.reserved + quantity
          }
        })

        // Create reservation record
        await tx.inventoryReservation.create({
          data: {
            inventoryId: inventory.id,
            orderId,
            quantity,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        })

        // Check if reorder needed
        if (inventory.available - inventory.reserved <= inventory.reorderLevel) {
          await this.createReorderRequest(productId, inventory.reorderQuantity)
        }
      })
    } catch (error) {
      console.error('Failed to reserve inventory:', error)
      throw error
    }
  }

  // Release inventory reservation
  async releaseInventory(productId: string, quantity: number, orderId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Find reservation
        const reservation = await tx.inventoryReservation.findFirst({
          where: {
            orderId,
            inventory: {
              productId
            }
          },
          include: {
            inventory: true
          }
        })

        if (!reservation) {
          console.warn(`No reservation found for order ${orderId}`)
          return
        }

        // Update inventory
        await tx.inventory.update({
          where: {
            id: reservation.inventoryId
          },
          data: {
            reserved: {
              decrement: reservation.quantity
            }
          }
        })

        // Delete reservation
        await tx.inventoryReservation.delete({
          where: {
            id: reservation.id
          }
        })
      })
    } catch (error) {
      console.error('Failed to release inventory:', error)
      throw error
    }
  }

  // Commit inventory (when order ships)
  async commitInventory(orderId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Find all reservations for order
        const reservations = await tx.inventoryReservation.findMany({
          where: { orderId },
          include: { inventory: true }
        })

        for (const reservation of reservations) {
          // Update inventory
          await tx.inventory.update({
            where: {
              id: reservation.inventoryId
            },
            data: {
              available: {
                decrement: reservation.quantity
              },
              reserved: {
                decrement: reservation.quantity
              }
            }
          })

          // Create inventory movement record
          await tx.inventoryMovement.create({
            data: {
              inventoryId: reservation.inventoryId,
              type: 'sale',
              quantity: -reservation.quantity,
              orderId,
              createdAt: new Date()
            }
          })
        }

        // Delete reservations
        await tx.inventoryReservation.deleteMany({
          where: { orderId }
        })
      })
    } catch (error) {
      console.error('Failed to commit inventory:', error)
      throw error
    }
  }

  // Update inventory levels
  async updateInventoryLevel(
    productId: string, 
    warehouseId: string, 
    quantity: number, 
    type: 'add' | 'set'
  ): Promise<void> {
    try {
      if (type === 'set') {
        await prisma.inventory.update({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId
            }
          },
          data: {
            available: quantity,
            lastUpdated: new Date()
          }
        })
      } else {
        await prisma.inventory.update({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId
            }
          },
          data: {
            available: {
              increment: quantity
            },
            lastUpdated: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Failed to update inventory level:', error)
      throw error
    }
  }

  // Get inventory level
  async getInventoryLevel(productId: string): Promise<number> {
    const inventories = await prisma.inventory.findMany({
      where: { productId }
    })

    return inventories.reduce((total, inv) => 
      total + (inv.available - inv.reserved), 0
    )
  }

  // Create reorder request
  private async createReorderRequest(productId: string, quantity: number): Promise<void> {
    // In production, would integrate with purchasing system
    console.log(`Creating reorder request for product ${productId}, quantity: ${quantity}`)
    
    // Create purchase order
    await prisma.purchaseOrder.create({
      data: {
        productId,
        quantity,
        status: 'pending',
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })
  }

  // Calculate delivery date
  private calculateDeliveryDate(transitDays: number): Date {
    const date = new Date()
    date.setDate(date.getDate() + transitDays)
    
    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1)
    }
    
    return date
  }

  // Clean up expired reservations
  async cleanupExpiredReservations(): Promise<void> {
    try {
      const expired = await prisma.inventoryReservation.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })

      for (const reservation of expired) {
        await this.releaseInventory(
          reservation.inventory.productId,
          reservation.quantity,
          reservation.orderId
        )
      }
    } catch (error) {
      console.error('Failed to cleanup expired reservations:', error)
    }
  }
}

// Singleton instance
export const inventoryService = new InventoryService()

// Run cleanup job every hour
setInterval(() => {
  inventoryService.cleanupExpiredReservations()
}, 60 * 60 * 1000)

export default inventoryService