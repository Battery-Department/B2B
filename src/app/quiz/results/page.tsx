'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import QuizResultsV2 from './QuizResultsV2'

function QuizResultsContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  
  return <QuizResultsV2 sessionId={sessionId} />
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#006FEE] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    }>
      <QuizResultsContent />
    </Suspense>
  )
}