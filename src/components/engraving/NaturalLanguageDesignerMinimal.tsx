import React, { useState, useRef, useEffect } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'
import { 
  Bot, Send, Mic, MicOff, Loader2
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Voice recognition setup
const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsSupported(true)
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'
    }
  }, [])

  const startListening = (onResult: (text: string) => void) => {
    if (recognitionRef.current && isSupported) {
      setIsListening(true)
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript
        onResult(text)
        setIsListening(false)
      }
      recognitionRef.current.onerror = () => setIsListening(false)
      recognitionRef.current.onend = () => setIsListening(false)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return { isListening, isSupported, startListening, stopListening }
}

export default function NaturalLanguageDesignerMinimal() {
  const { setText } = useEngravingStore()
  
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Lithi AI, your intelligent battery design assistant.",
      timestamp: new Date()
    }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    try {
      // Simple text extraction - look for company names, text in quotes, etc.
      const text = input.trim()
      let extractedText = ''
      
      // Try to extract text from common patterns
      const quotedMatch = text.match(/"([^"]+)"|'([^']+)'/)
      if (quotedMatch) {
        extractedText = quotedMatch[1] || quotedMatch[2]
      } else {
        // Look for company name patterns
        const companyMatch = text.match(/(?:put|add|engrave|write)\s+([A-Z][A-Z\s&]+)/i)
        if (companyMatch) {
          extractedText = companyMatch[1].trim()
        } else {
          // Fallback - just use the text as is, removing common command words
          extractedText = text.replace(/(?:put|add|engrave|write|make|create)\s+/gi, '').trim()
        }
      }

      // Apply the extracted text
      if (extractedText) {
        setText(extractedText)
      }

      const responseContent = extractedText 
        ? `Perfect! I've added "${extractedText}" to your battery design.`
        : "I need more detail. Try: 'Put ACME CONSTRUCTION in bold letters'"

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      }

      // Simulate processing delay
      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage])
        setIsProcessing(false)
      }, 800)

    } catch (error) {
      console.error('Error processing request:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: "Could you try rephrasing? For example: 'Put WILSON ELECTRIC in bold letters'",
        timestamp: new Date()
      }
      
      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage])
        setIsProcessing(false)
      }, 500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening((text) => {
        setInput(text)
        setTimeout(() => handleSendMessage(), 500)
      })
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Minimal Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] rounded-2xl px-3 py-2 text-sm
              ${message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'}
            `}>
              {message.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Minimal Input Area */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-end gap-2 bg-gray-100 rounded-full px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you want on your battery..."
            className="flex-1 bg-transparent resize-none outline-none text-sm placeholder-gray-500 min-h-[24px] max-h-[100px]"
            rows={1}
            disabled={isProcessing}
          />
          
          {/* Voice Input Button - Smaller */}
          {isSupported && (
            <button
              onClick={handleVoiceInput}
              disabled={isProcessing}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0
                ${isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          
          {/* Generate Button - Smaller */}
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0
              ${!input.trim() || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'}
            `}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* AI-Powered Badge - Smaller */}
        <div className="flex justify-center mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Bot className="w-3 h-3" />
            <span>AI-Powered</span>
          </div>
        </div>
      </div>
    </div>
  )
}