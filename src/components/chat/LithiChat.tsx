'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, X, Minimize2, Maximize2, Bot, User } from 'lucide-react'
import { lithiIntegration } from '@/services/integrations/lithi-integration'
import { eventBus, EventTypes } from '@/services/events/event-bus'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: string
  metadata?: any
}

export function LithiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const inputRef = useRef<null | HTMLInputElement>(null)

  useEffect(() => {
    // Initialize chat integration
    const initializeChat = async () => {
      await lithiIntegration.initialize()
      const available = await lithiIntegration.isChatbotAvailable()
      setIsConnected(available)
      
      // Load chat history
      const history = await lithiIntegration.getChatHistory()
      setMessages(history.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
        metadata: msg.metadata
      })))
    }

    initializeChat()

    // Subscribe to chat events
    const unsubscribeChat = eventBus.subscribe(EventTypes.CHAT_MESSAGE, (event) => {
      const message: Message = {
        id: event.data.id || generateId(),
        content: event.data.message,
        role: event.data.role,
        timestamp: event.data.timestamp || new Date().toISOString(),
        metadata: event.data.metadata
      }
      
      setMessages(prev => [...prev, message])
      setIsTyping(false)
    })

    // Subscribe to typing events
    const unsubscribeTyping = eventBus.subscribe(EventTypes.CHAT_TYPING, (event) => {
      setIsTyping(event.data.isTyping)
    })

    return () => {
      eventBus.unsubscribe(unsubscribeChat)
      eventBus.unsubscribe(unsubscribeTyping)
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isConnected) return

    const userMessage: Message = {
      id: generateId(),
      content: inputValue,
      role: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      await lithiIntegration.sendChatMessage(inputValue)
    } catch (error) {
      console.error('Error sending message:', error)
      setIsTyping(false)
      
      const errorMessage: Message = {
        id: generateId(),
        content: 'Sorry, there was an error sending your message. Please try again.',
        role: 'system',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#6366f1',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.backgroundColor = '#5558e3'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.backgroundColor = '#6366f1'
        }}
      >
        <MessageSquare size={24} />
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '380px',
        height: isMinimized ? '60px' : '600px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'height 0.3s ease',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#6366f1',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={toggleMinimize}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bot size={20} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Lithi Assistant
            </h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleMinimize()
            }}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleChat()
            }}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#9ca3af',
                padding: '40px 20px'
              }}>
                <Bot size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Hi! I'm your Lithi assistant. How can I help you today?</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: message.role === 'user' ? '#6366f1' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {message.role === 'user' ? (
                    <User size={16} style={{ color: '#ffffff' }} />
                  ) : (
                    <Bot size={16} style={{ color: '#6b7280' }} />
                  )}
                </div>
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: message.role === 'user' ? '#6366f1' : '#f3f4f6',
                    color: message.role === 'user' ? '#ffffff' : '#374151'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                    {message.content}
                  </p>
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '11px',
                    opacity: 0.7
                  }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bot size={16} style={{ color: '#6b7280' }} />
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#f3f4f6'
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span className="typing-dot">•</span>
                    <span className="typing-dot" style={{ animationDelay: '0.2s' }}>•</span>
                    <span className="typing-dot" style={{ animationDelay: '0.4s' }}>•</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !isConnected}
              style={{
                padding: '10px 16px',
                backgroundColor: inputValue.trim() && isConnected ? '#6366f1' : '#e5e7eb',
                color: inputValue.trim() && isConnected ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderRadius: '8px',
                cursor: inputValue.trim() && isConnected ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                if (inputValue.trim() && isConnected) {
                  e.currentTarget.style.backgroundColor = '#5558e3'
                }
              }}
              onMouseLeave={(e) => {
                if (inputValue.trim() && isConnected) {
                  e.currentTarget.style.backgroundColor = '#6366f1'
                }
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .typing-dot {
          animation: typing 1.4s infinite;
          font-size: 20px;
          color: #6b7280;
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}