'use client'

import React from 'react'
import { Info, Play } from 'lucide-react'
import { restartTour } from './OnboardingTourSafe'

export default function ReplayTourButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => {
          if (window.confirm('This will restart the guided tour. Continue?')) {
            restartTour()
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 text-sm font-medium text-gray-700 hover:text-blue-600"
        title="Replay guided tour"
      >
        <Info className="w-4 h-4" />
        <span className="hidden sm:inline">Guided Tour</span>
        <Play className="w-4 h-4" />
      </button>
    </div>
  )
}