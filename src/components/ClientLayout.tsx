'use client'

import { useAnalytics } from '@/hooks/useAnalytics'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useAnalytics()
  
  return <>{children}</>
}