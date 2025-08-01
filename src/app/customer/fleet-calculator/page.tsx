'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FleetCalculatorRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the configure page which serves as the fleet calculator
    router.replace('/customer/configure')
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
      Redirecting to Fleet Calculator...
    </div>
  )
}