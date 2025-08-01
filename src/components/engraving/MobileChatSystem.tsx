'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import {
  Bot, User, Send, Mic, MicOff, Sparkles, 
  Battery, ChevronUp, ChevronDown, Maximize2,
  Minimize2, RotateCcw, Share2, Download,
  MessageCircle, Loader2, CheckCircle, Zap
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
  designApplied?: boolean
}

interface MobileChatSystemProps {
  isMobile?: boolean
}

export default function MobileChatSystem({ isMobile = true }: MobileChatSystemProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'll design your battery instantly. Try: 'Put ACME CONSTRUCTION in bold letters'",
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showFullChat, setShowFullChat] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { text, primaryText, secondaryText, showSecondaryText } = useEngravingStore()

  // Get display text for battery
  const displayText = showSecondaryText 
    ? `${primaryText}\n${secondaryText}`
    : text || primaryText || 'YOUR COMPANY'

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle message submission
  const handleSubmit = async (customText?: string) => {
    const messageText = customText || inputText.trim()
    if (!messageText || isProcessing) return

    setInputText('')
    setIsProcessing(true)

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    // Simulate AI processing
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Perfect! I've updated your battery design. You can see the preview above showing exactly how "${messageText}" will look when engraved.`,
        timestamp: new Date(),
        confidence: 0.95,
        designApplied: true
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsProcessing(false)
    }, 1500)
  }

  // Voice input simulation
  const handleVoiceInput = () => {
    setIsListening(!isListening)
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setInputText("Put Wilson Electric in bold letters at the top")
        setIsListening(false)
      }, 2000)
    }
  }

  // Quick suggestions for contractors
  const quickSuggestions = [
    "Put my company name in bold",
    "Add phone number below",
    "Make it look professional",
    "Add equipment ID number"
  ]

  // Get recent messages (last 2 for mobile display)
  const recentMessages = messages.slice(-2)

  if (!isMobile) {
    // Desktop fallback - return null or standard chat
    return null
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col overflow-hidden">
      {/* Battery Preview Section - Always at Top */}
      <motion.div 
        className="bg-white border-b-2 border-gray-200 shadow-sm"
        animate={{ height: previewExpanded ? 400 : 200 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="font-semibold flex items-center gap-2">
            <Battery className="w-5 h-5" />
            Your Battery Design
          </h2>
          <div className="flex items-center gap-2">
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Live Preview
            </div>
            <button
              onClick={() => setPreviewExpanded(!previewExpanded)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              {previewExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Battery Preview Container */}
        <div className="p-4 flex items-center justify-center bg-gray-50 h-full relative">
          <div className="relative">
            {/* Simulated Battery with Text Overlay */}
            <div className="w-48 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg flex items-center justify-center relative border-4 border-gray-300">
              {/* DeWalt-style battery design */}
              <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full" />
              
              {/* Engraved text preview */}
              <div className="text-center">
                <div className="text-black font-bold text-sm leading-tight drop-shadow-sm">
                  {displayText.split('\n').map((line, index) => (
                    <div key={index} className="mb-1">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Battery specifications */}
              <div className="absolute bottom-1 left-2 text-xs text-black/70 font-medium">
                20V MAX
              </div>
              <div className="absolute bottom-1 right-2 text-xs text-black/70 font-medium">
                9Ah
              </div>
            </div>

            {/* Preview Controls */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all">
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all">
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all">
                <Download className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Confidence & Timing Indicator */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-xs text-gray-600">Confidence</div>
            <div className="text-xs text-blue-600 mt-1">0.8s</div>
          </div>
        </div>
      </motion.div>

      {/* Recent Chat Messages Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-600" />
            Recent Conversation
          </h3>
          <button
            onClick={() => setShowFullChat(!showFullChat)}
            className="text-blue-600 text-sm font-medium flex items-center gap-1"
          >
            {showFullChat ? 'Hide' : 'Show All'}
            {showFullChat ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Recent Messages Display */}
        <div className="space-y-3 max-h-24 overflow-y-auto">
          {recentMessages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {message.role === 'assistant' ? (
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-blue-600" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 line-clamp-2">{message.content}</p>
                {message.designApplied && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">Design updated</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Chat Overlay */}
      <AnimatePresence>
        {showFullChat && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            {/* Full Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <h2 className="font-semibold">Full Conversation</h2>
              <button
                onClick={() => setShowFullChat(false)}
                className="p-2 rounded-full hover:bg-white/20"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* All Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[80%] rounded-lg px-4 py-3 
                    ${message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}>
                    <p className="text-sm">{message.content}</p>
                    {message.confidence && (
                      <div className="text-xs opacity-70 mt-1">
                        Confidence: {Math.round(message.confidence * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Suggestions */}
      <div className="bg-white p-3 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSubmit(suggestion)}
              className="flex-shrink-0 px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input Section - Bottom Fixed */}
      <div className="bg-white p-4 border-t border-gray-200 safe-bottom">
        <div className="flex items-end gap-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tell me what you want on your battery..."
              className="w-full p-3 pr-12 border-2 border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400"
              rows={1}
              disabled={isProcessing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            
            {/* Voice Input Button - Large for Mobile */}
            <button
              onClick={handleVoiceInput}
              className={`absolute right-2 bottom-2 p-3 rounded-full transition-all ${
                isListening 
                  ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
              }`}
              title={isListening ? 'Tap to stop' : 'Tap to speak'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Send Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={!inputText.trim() || isProcessing}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="hidden sm:block">Creating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:block">Generate</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Helper Text */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Tap microphone or type your design
          </p>
          <div className="text-xs">
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              🤖 AI Ready
            </span>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-800 font-medium">Designing your battery...</p>
            <p className="text-sm text-gray-500 mt-1">This will take just a moment</p>
          </div>
        </div>
      )}

      {/* Safe Area Styles */}
      <style jsx>{`
        .safe-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}