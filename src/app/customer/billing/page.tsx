'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the payment page which serves as billing & invoices
    router.replace('/customer/payment')
  }, [router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: '16px',
      color: '#374151'
    }}>
      Redirecting to Billing & Invoices...
    </div>
  )
}