import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default admin user
  const adminPassword = await bcryptjs.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@battery-dashboard.com' },
    update: {},
    create: {
      email: 'admin@battery-dashboard.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin'
    }
  })

  console.log('Created admin user:', admin?.email || 'admin@battery-dashboard.com')

  // Create sample customer
  const customerPassword = await bcryptjs.hash('customer123', 10)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Doe',
      password: customerPassword,
      role: 'customer'
    }
  })

  console.log('Created customer user:', customer?.email || 'customer@example.com')

  // Create products
  const products = [
    {
      id: 'flexvolt-6ah',
      sku: 'DCB606',
      name: 'DEWALT 20V/60V MAX FLEXVOLT 6Ah Battery',
      category: 'battery',
      basePrice: 149,
      description: 'High-capacity battery compatible with 20V MAX and 60V MAX tools',
      images: ['/images/flexvolt-6ah.jpg'],
      specifications: {
        voltage: '20V/60V',
        capacity: '6Ah',
        chemistry: 'Lithium-Ion',
        weight: '2.0 lbs',
        dimensions: '5.5 x 3.7 x 2.7 inches'
      }
    },
    {
      id: 'flexvolt-9ah',
      sku: 'DCB609',
      name: 'DEWALT 20V/60V MAX FLEXVOLT 9Ah Battery',
      category: 'battery',
      basePrice: 199,
      description: 'Maximum runtime battery for demanding applications',
      images: ['/images/flexvolt-9ah.jpg'],
      specifications: {
        voltage: '20V/60V',
        capacity: '9Ah',
        chemistry: 'Lithium-Ion',
        weight: '2.8 lbs',
        dimensions: '5.5 x 3.7 x 3.2 inches'
      }
    },
    {
      id: 'flexvolt-12ah',
      sku: 'DCB612',
      name: 'DEWALT 20V/60V MAX FLEXVOLT 12Ah Battery',
      category: 'battery',
      basePrice: 279,
      description: 'Ultimate power and runtime for professional use',
      images: ['/images/flexvolt-12ah.jpg'],
      specifications: {
        voltage: '20V/60V',
        capacity: '12Ah',
        chemistry: 'Lithium-Ion',
        weight: '3.6 lbs',
        dimensions: '5.5 x 3.7 x 3.7 inches'
      }
    }
  ]

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { id: productData.id },
      update: productData,
      create: productData
    })
    console.log('Created product:', product.name)

    // Create inventory for each product
    await prisma.inventory.upsert({
      where: {
        productId_location: {
          productId: product.id,
          location: 'main-warehouse'
        }
      },
      update: {},
      create: {
        productId: product.id,
        location: 'main-warehouse',
        quantity: productData.id === 'flexvolt-6ah' ? 100 : productData.id === 'flexvolt-9ah' ? 75 : 50,
        reservedQuantity: 0,
        availableQuantity: productData.id === 'flexvolt-6ah' ? 100 : productData.id === 'flexvolt-9ah' ? 75 : 50,
        reorderPoint: 10,
        reorderQuantity: 50
      }
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })