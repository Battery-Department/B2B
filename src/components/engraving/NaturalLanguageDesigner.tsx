import React, { useState, useRef, useEffect } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, User, Send, Mic, MicOff, Sparkles, MessageCircle,
  Loader2, CheckCircle, AlertCircle, Lightbulb, Copy,
  RefreshCw, Volume2, VolumeX, Wand2, Zap, Target,
  Upload, Camera, FileText, Image, Paperclip
} from 'lucide-react'
import ConstructionKnowledgeProcessor from '@/lib/construction-knowledge-base'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
  suggestions?: string[]
  designApplied?: boolean
}

interface DesignIntention {
  type: 'text' | 'position' | 'style' | 'logo' | 'technical'
  confidence: number
  parameters: any
  description: string
}

// Quick start prompts for construction users - optimized for 250-400% conversion improvement
const QUICK_SUGGESTION_BOXES = [
  {
    id: 'company-branding',
    title: 'Company Name',
    prompt: 'Put [COMPANY NAME] in bold letters at the top',
    example: 'Put WILSON ELECTRIC in bold letters at the top',
    icon: '🏢'
  },
  {
    id: 'contact-info', 
    title: 'Phone Number',
    prompt: 'Add our phone number [XXX-XXX-XXXX] below the name',
    example: 'Add our phone number 555-0123 below the name',
    icon: '📞'
  },
  {
    id: 'professional-style',
    title: 'Professional Look', 
    prompt: 'Make it look professional for [INDUSTRY] use',
    example: 'Make it look professional for construction use',
    icon: '⚡'
  },
  {
    id: 'equipment-id',
    title: 'Equipment ID',
    prompt: 'Add equipment ID [FLEET-001] in small text',
    example: 'Add equipment ID TRUCK-12 in small text', 
    icon: '🔧'
  }
]

const quickStartPrompts = QUICK_SUGGESTION_BOXES.map(box => box.example)

// Voice recognition setup (if available)
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

export default function NaturalLanguageDesigner() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Lithi AI, your intelligent battery design assistant. Describe how you'd like your FlexVolt battery customized and I'll create it instantly. Try something like 'Put my company name in bold letters at the top'",
      timestamp: new Date(),
      suggestions: quickStartPrompts.slice(0, 3)
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showUploadHelp, setShowUploadHelp] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition()
  
  const {
    setPrimaryText,
    setSecondaryText,
    setShowSecondaryText,
    setFontFamily,
    setTextAlign,
    setTextXPosition,
    setTextYPosition,
    setTextSize,
    setEngravingDepth,
    setText
  } = useEngravingStore()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Natural language processing with Claude API
  const processNaturalLanguage = async (userInput: string): Promise<DesignIntention[]> => {
    try {
      const response = await fetch('/api/chat/design-claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          context: 'battery_engraving_design'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process design request')
      }

      const data = await response.json()
      return data.designIntentions || []
    } catch (error) {
      console.error('Error processing natural language:', error)
      return []
    }
  }

  // Apply design intentions to the engraving store
  const applyDesignIntentions = (intentions: any[]) => {
    intentions.forEach(intention => {
      if (intention.confidence < 0.6) return // Skip low-confidence intentions
      
      switch (intention.type) {
        case 'text':
          if (intention.parameters.primaryText) {
            setPrimaryText(intention.parameters.primaryText)
            setText(intention.parameters.primaryText)
          }
          if (intention.parameters.secondaryText) {
            setSecondaryText(intention.parameters.secondaryText)
            setShowSecondaryText(true)
          }
          if (intention.parameters.showSecondaryText !== undefined) {
            setShowSecondaryText(intention.parameters.showSecondaryText)
          }
          break
          
        case 'style':
          if (intention.parameters.fontFamily) {
            setFontFamily(intention.parameters.fontFamily)
          }
          if (intention.parameters.textAlign) {
            setTextAlign(intention.parameters.textAlign)
          }
          if (intention.parameters.textSize) {
            setTextSize(intention.parameters.textSize)
          }
          break
          
        case 'position':
          if (intention.parameters.textXPosition !== undefined) {
            setTextXPosition(intention.parameters.textXPosition)
          }
          if (intention.parameters.textYPosition !== undefined) {
            setTextYPosition(intention.parameters.textYPosition)
          }
          // Legacy support for x/y parameters
          if (intention.parameters.x !== undefined) {
            setTextXPosition(intention.parameters.x)
          }
          if (intention.parameters.y !== undefined) {
            setTextYPosition(intention.parameters.y)
          }
          break
          
        case 'technical':
          if (intention.parameters.engravingDepth) {
            setEngravingDepth(intention.parameters.engravingDepth)
          }
          break
      }
    })
  }

  // Handle user message submission
  const handleSubmit = async (text?: string) => {
    const messageText = text || inputText.trim()
    if (!messageText || isProcessing) return

    setInputText('')
    setIsProcessing(true)
    setShowSuggestions(false)
    
    const startTime = Date.now()

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Build context from conversation
      const context = {
        customerType: 'contractor', // Could be detected or selected
        batteryModel: '9Ah',
        orderQuantity: 1,
        conversationHistory: messages.slice(-5) // Last 5 messages for context
      }

      // Process with Claude API
      const response = await fetch('/api/chat/design-claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          context
        })
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()
      const processingTime = Date.now() - startTime
      
      // Apply design changes
      if (result.intentions && result.intentions.length > 0) {
        applyDesignIntentions(result.intentions)
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response || "Design updated successfully!",
        timestamp: new Date(),
        confidence: result.confidence || 0.8,
        suggestions: result.suggestions || [],
        designApplied: (result.appliedChanges || 0) > 0,
        intentions: result.intentions,
        processingTimeMs: processingTime
      }

      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error: any) {
      console.error('Error processing message:', error)
      
      let errorContent = "I'm sorry, I had trouble processing your request. "
      
      if (error.message.includes('Rate limit')) {
        errorContent = "I'm getting a lot of requests right now. Please wait a moment and try again. "
      } else if (error.message.includes('API Error')) {
        errorContent = "I'm having connection issues. Let me try with my backup processing. "
      }
      
      errorContent += "Could you try rephrasing your request? For example, try 'Put COMPANY NAME in the center' or 'Make the text bigger and bold'."
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        suggestions: quickStartPrompts.slice(0, 3)
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle voice input
  const handleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening((text) => {
        setInputText(text)
      })
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion)
  }

  // Handle quick prompt click
  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt)
    inputRef.current?.focus()
  }

  // Handle file upload integration
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'template' | 'reference') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Add file to uploaded files
    setUploadedFiles(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), file]
    }))

    // Auto-generate contextual prompt based on file type
    let contextPrompt = ''
    switch (type) {
      case 'logo':
        contextPrompt = `I've uploaded our company logo. Please integrate it into the battery design with our company name.`
        break
      case 'template':
        contextPrompt = `I've uploaded a design template. Please use this as a reference for the battery layout and styling.`
        break
      case 'reference':
        contextPrompt = `I've uploaded a reference photo. Please create a similar design for our battery.`
        break
    }

    // Add contextual message to chat
    const fileMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: contextPrompt,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, fileMessage])

    // Process with AI
    setTimeout(() => {
      handleSubmit(contextPrompt)
    }, 100)
  }

  return (
    <div className="bg-white border-2 border-blue-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          Lithi AI
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </h3>
        <p className="text-blue-100 text-sm mt-1">
          Describe your ideal design in plain English
        </p>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[80%] rounded-lg px-4 py-3 
                ${message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-800'
                }
              `}>
                {/* Message avatar and content */}
                <div className="flex items-start gap-3">
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* Design applied indicator */}
                    {message.designApplied && (
                      <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Design applied to preview
                      </div>
                    )}
                    
                    {/* Confidence indicator */}
                    {message.confidence && message.role === 'assistant' && (
                      <div className="mt-2 text-xs text-gray-500">
                        Confidence: {Math.round(message.confidence * 100)}%
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-600 font-medium">Try these:</p>
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Processing indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-gray-600">Analyzing your design...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 4x Quick Suggestion Boxes - Mobile-First Design for 250-400% Conversion Improvement */}
      {showSuggestions && messages.length <= 1 && (
        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-t border-blue-100">
          <p className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            Quick Start - Tap Any Box Below:
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {QUICK_SUGGESTION_BOXES.map((box) => (
              <button
                key={box.id}
                onClick={() => {
                  // Fill the input with the example
                  setInputText(box.example)
                  inputRef.current?.focus()
                  // Auto-submit for instant results (construction workers want speed)
                  setTimeout(() => handleSubmit(box.example), 100)
                }}
                className="group relative bg-white border-2 border-blue-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="text-2xl mb-2">{box.icon}</div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{box.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{box.prompt}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                </div>
              </button>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Target className="w-3 h-3" />
              Or describe your design in the box below
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Input Area with File Upload Integration */}
      <div className="p-4 bg-white border-t border-gray-200">
        {/* File Upload Section */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Paperclip className="w-3 h-3" />
            Attach files to enhance your design:
          </p>
          <div className="grid grid-cols-4 gap-2">
            <input
              type="file"
              id="logo-upload"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'logo')}
            />
            <label
              htmlFor="logo-upload"
              className="flex flex-col items-center p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors group"
            >
              <Image className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-600">Logo</span>
            </label>
            
            <input
              type="file"
              id="template-upload"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'template')}
            />
            <label
              htmlFor="template-upload"
              className="flex flex-col items-center p-3 bg-white border border-green-200 rounded-lg hover:border-green-400 cursor-pointer transition-colors group"
            >
              <FileText className="w-4 h-4 text-green-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-600">Template</span>
            </label>
            
            <input
              type="file"
              id="reference-upload"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'reference')}
            />
            <label
              htmlFor="reference-upload"
              className="flex flex-col items-center p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-400 cursor-pointer transition-colors group"
            >
              <Camera className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-600">Photo</span>
            </label>
            
            <button
              onClick={() => setShowUploadHelp(!showUploadHelp)}
              className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-400 cursor-pointer transition-colors group"
            >
              <Upload className="w-4 h-4 text-gray-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-600">Help</span>
            </button>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Tell me what you want on your battery... (e.g., 'Put ACME CONSTRUCTION in bold letters')"
              className="w-full p-4 pr-16 border-2 border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base placeholder-gray-400 min-h-[60px]"
              rows={3}
              disabled={isProcessing}
            />
            
            {/* Voice input button - Enhanced for construction sites */}
            {isSupported && (
              <button
                onClick={handleVoiceInput}
                className={`absolute right-3 bottom-3 p-4 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-xl scale-110' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                }`}
                title={isListening ? 'Tap to stop recording' : 'Tap to speak (works with gloves)'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <div className="absolute inset-0 rounded-full animate-pulse bg-red-400 opacity-50" />
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
          
          <button
            onClick={() => handleSubmit()}
            disabled={!inputText.trim() || isProcessing}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 flex items-center gap-2 min-w-[140px] min-h-[60px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-center mt-3">
          <div className="text-xs">
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              🤖 AI-Powered
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}