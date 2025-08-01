import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia' as Stripe.LatestApiVersion,
})

export async function POST(request: NextRequest) {
  try {
    const { invoice, amount } = await request.json()
    
    if (!invoice || !amount) {
      return NextResponse.json(
        { error: 'Invoice and amount are required' },
        { status: 400 }
      )
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Custom Battery Order - 10% Deposit',
            description: `Invoice ${invoice} - 10% deposit to secure your custom battery order`,
            images: ['https://battery-dashboard-clean-repo.vercel.app/9Ah%20FlexVolt%20(4).png'],
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/checkout/success?session_id={CHECKOUT_SESSION_ID}&invoice=${invoice}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/invoice?id=${invoice}`,
      metadata: {
        invoiceNumber: invoice,
        type: 'deposit',
        depositPercentage: '10',
      },
    })
    
    return NextResponse.json({ 
      success: true,
      checkoutUrl: session.url 
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const invoice = searchParams.get('invoice')
  const amount = searchParams.get('amount')
  
  if (!invoice || !amount) {
    return NextResponse.json(
      { error: 'Invoice and amount are required' },
      { status: 400 }
    )
  }
  
  try {
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Custom Battery Order - 10% Deposit',
            description: `Invoice ${invoice} - 10% deposit to secure your custom battery order`,
            images: ['https://battery-dashboard-clean-repo.vercel.app/9Ah%20FlexVolt%20(4).png'],
          },
          unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/checkout/success?session_id={CHECKOUT_SESSION_ID}&invoice=${invoice}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/invoice?id=${invoice}`,
      metadata: {
        invoiceNumber: invoice,
        type: 'deposit',
        depositPercentage: '10',
      },
    })
    
    // Redirect to Stripe checkout
    return NextResponse.redirect(session.url as string)
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}