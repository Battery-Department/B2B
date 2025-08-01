import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    
    // Calculate dates
    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + 30)
    
    // Extract order data
    const { items, customer, subtotal, depositAmount, batteryPreview } = data
    
    // Create invoice object
    const invoice = {
      invoiceNumber,
      createdAt: today.toISOString(),
      dueDate: dueDate.toISOString(),
      customer: {
        name: customer.companyName || customer.firstName + ' ' + customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || ''
      },
      items: items.map((item: any) => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        retailPrice: item.retailPrice,
        total: item.quantity * item.price,
        customization: item.customization || null,
        previewImage: item.previewImage || batteryPreview
      })),
      subtotal,
      depositAmount,
      depositPercentage: 10,
      balanceDue: subtotal - depositAmount,
      status: 'pending',
      paymentUrl: `/api/stripe/checkout?invoice=${invoiceNumber}`
    }
    
    // In a real app, save to database here
    // await prisma.invoice.create({ data: invoice })
    
    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice generated successfully'
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const invoiceNumber = searchParams.get('invoiceNumber')
  
  if (!invoiceNumber) {
    return NextResponse.json(
      { error: 'Invoice number required' },
      { status: 400 }
    )
  }
  
  // In a real app, fetch from database
  // const invoice = await prisma.invoice.findUnique({ where: { invoiceNumber } })
  
  // For now, return mock data
  return NextResponse.json({
    success: true,
    invoice: {
      invoiceNumber,
      // ... rest of invoice data
    }
  })
}