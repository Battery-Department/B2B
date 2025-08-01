'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SavedItemsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the favorites page which serves as saved items
    router.replace('/customer/favorites')
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
      Redirecting to Saved Items...
    </div>
  )
}