'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, 
  Clock, 
  Users, 
  Zap, 
  Target,
  CheckCircle
} from 'lucide-react'

interface QuizEntryCardProps {
  variant?: 'hero' | 'sidebar' | 'inline'
  className?: string
}

export default function QuizEntryCard({ variant = 'inline', className = '' }: QuizEntryCardProps) {
  const router = useRouter()

  const handleStartQuiz = () => {
    // Track quiz start event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'quiz_started', {
        event_category: 'engagement',
        event_label: variant
      })
    }
    
    router.push('/customer/quiz')
  }

  if (variant === 'hero') {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white ${className}`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white"></div>
          <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white"></div>
        </div>
        
        <div className="relative space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
              <Target size={16} />
              Personalized Recommendations
            </div>
            <h2 className="text-3xl font-bold leading-tight">
              Find Your Perfect Battery Fleet in 60 Seconds
            </h2>
            <p className="text-blue-100 text-lg">
              Get a customized recommendation based on your team size, daily usage, and budget. 
              No guesswork, just the right power solution for your jobsite.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Clock size={16} />
              </div>
              <span className="text-sm font-medium">2-minute quiz</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Users size={16} />
              </div>
              <span className="text-sm font-medium">Team-based sizing</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Zap size={16} />
              </div>
              <span className="text-sm font-medium">Usage optimization</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <CheckCircle size={16} />
              </div>
              <span className="text-sm font-medium">Instant results</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStartQuiz}
            className="group w-full rounded-2xl bg-white py-4 px-6 font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-50 active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg">Start Battery Quiz</span>
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          <div className="text-center text-sm text-blue-200">
            Join 300+ contractors who found their perfect battery solution
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <div className={`rounded-2xl bg-white p-6 shadow-lg border-2 border-blue-100 ${className}`}>
        <div className="space-y-4">
          {/* Icon */}
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Target size={24} className="text-blue-600" />
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h3 className="font-bold text-gray-900 text-lg">Find Your Perfect Batteries</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Take our 2-minute quiz to get personalized battery recommendations for your team
            </p>
          </div>

          {/* Quick benefits */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Customized for your team size</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Based on your daily usage</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Fits your budget</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStartQuiz}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 px-4 font-semibold text-white transition-all duration-200 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Start Quiz</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Default inline variant
  return (
    <div className={`rounded-2xl bg-gradient-to-r from-blue-50 to-green-50 p-6 border border-blue-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-900">Not sure which batteries you need?</h3>
          </div>
          
          <p className="text-gray-600 text-sm pr-4">
            Take our quick 2-minute quiz to get personalized recommendations based on your team size and daily usage.
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>2 min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>Team-based</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={12} />
              <span>Personalized</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleStartQuiz}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 font-semibold text-white transition-all duration-200 active:scale-[0.95] flex items-center gap-2"
          >
            <span>Take Quiz</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Utility function to add quiz entry to existing pages
export function QuizFloatingButton() {
  const router = useRouter()
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3000) // Show after 3 seconds
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <button
        onClick={() => router.push('/customer/quiz')}
        className="group rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white shadow-2xl transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/25 active:scale-95"
      >
        <div className="flex items-center gap-3">
          <Target size={20} />
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold">Find Your Batteries</div>
            <div className="text-xs opacity-90">2-min quiz</div>
          </div>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </div>
      </button>
    </div>
  )
}