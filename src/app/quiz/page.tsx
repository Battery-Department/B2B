'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import QuizV2 from '@/components/quiz/QuizV2'

function QuizContent() {
  const searchParams = useSearchParams()
  
  // Capture UTM parameters
  const utmParams = {
    utm_source: searchParams.get('utm_source') || '',
    utm_medium: searchParams.get('utm_medium') || '',
    utm_campaign: searchParams.get('utm_campaign') || '',
    utm_content: searchParams.get('utm_content') || '',
    utm_term: searchParams.get('utm_term') || '',
    content_id: searchParams.get('content_id') || '',
    campaign_id: searchParams.get('campaign_id') || ''
  }
  
  // Use the new QuizV2 component
  return <QuizV2 utmParams={utmParams} />
}

export default function QuizLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#006FEE] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}