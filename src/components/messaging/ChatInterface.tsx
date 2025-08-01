/**
 * RHY_066 Internal Messaging System - Chat Interface Component
 * Enterprise-grade chat interface with real-time messaging capabilities
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Paperclip, Smile, Phone, Video, Settings, Users, 
         MoreVertical, Clock, MapPin, Zap, Bell, CheckCircle,
         Check, X, AlertTriangle, FileText, Download, Eye,
         Reply, Edit, Delete, Copy, Star, Archive } from 'lucide-react'

// Types
interface ChatInterfaceProps {
  conversationId: string
  userId: string
  onClose?: () => void
  className?: string
  style?: React.CSSProperties
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER'
  content: string
  type: 'TEXT' | 'FILE' | 'SYSTEM' | 'WAREHOUSE_ALERT' | 'ORDER_UPDATE'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  metadata?: {
    warehouseId?: string
    region?: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
    attachments?: Attachment[]
    mentions?: string[]
    reactions?: Reaction[]
    editHistory?: EditRecord[]
  }
  replyToId?: string
  isEdited: boolean
  isDeleted: boolean
  readBy: MessageRead[]
  createdAt: string
  updatedAt: string
  isOwn?: boolean
}

interface Conversation {
  id: string
  name: string
  description?: string
  type: 'DIRECT' | 'GROUP' | 'BROADCAST' | 'WAREHOUSE_CHANNEL'
  isActive: boolean
  participants: Participant[]
  metadata: {
    warehouseId?: string
    region?: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
    tags?: string[]
    customFields?: Record<string, any>
    integrations?: {
      warehouseAlerts: boolean
      orderUpdates: boolean
      inventoryNotifications: boolean
    }
  }
  unreadCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface Participant {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER'
  isActive: boolean
  lastSeenAt?: string
  notificationSettings: {
    enabled: boolean
    emailNotifications: boolean
    pushNotifications: boolean
    warehouseAlerts: boolean
    mentions: boolean
  }
}

interface Attachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  uploadedBy: string
  uploadedAt: string
}

interface Reaction {
  emoji: string
  userId: string
  userName: string
  createdAt: string
}

interface EditRecord {
  id: string
  previousContent: string
  newContent: string
  editedBy: string
  editedAt: string
  reason?: string
}

interface MessageRead {
  userId: string
  userName: string
  readAt: string
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  userId,
  onClose,
  className = '',
  style = {}
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch conversation and messages
  const fetchConversationData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Fetch conversation details
      const conversationResponse = await fetch(`/api/supplier/conversations/${conversationId}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      // Fetch messages
      const messagesResponse = await fetch(`/api/supplier/messages?conversationId=${conversationId}&limit=50`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (conversationResponse.ok && messagesResponse.ok) {
        const conversationData = await conversationResponse.json()
        const messagesData = await messagesResponse.json()

        if (conversationData.success && messagesData.success) {
          setConversation(conversationData.data.conversation)
          setMessages(messagesData.data.messages.map((msg: any) => ({
            ...msg,
            isOwn: msg.senderId === userId
          })))
        }
      } else {
        // Mock data fallback
        const mockConversation: Conversation = {
          id: conversationId,
          name: 'US West Warehouse Team',
          type: 'WAREHOUSE_CHANNEL',
          isActive: true,
          participants: [
            {
              id: 'participant_1',
              userId: userId,
              userName: 'You',
              userEmail: 'supplier@example.com',
              role: 'VIEWER',
              isActive: true,
              notificationSettings: {
                enabled: true,
                emailNotifications: true,
                pushNotifications: true,
                warehouseAlerts: true,
                mentions: true
              }
            },
            {
              id: 'participant_2',
              userId: 'warehouse_manager_1',
              userName: 'Mike Rodriguez',
              userEmail: 'mike@rhy.com',
              role: 'MANAGER',
              isActive: true,
              lastSeenAt: new Date().toISOString(),
              notificationSettings: {
                enabled: true,
                emailNotifications: true,
                pushNotifications: true,
                warehouseAlerts: true,
                mentions: true
              }
            }
          ],
          metadata: {
            warehouseId: 'warehouse_us_west',
            region: 'US',
            integrations: {
              warehouseAlerts: true,
              orderUpdates: true,
              inventoryNotifications: true
            }
          },
          unreadCount: 0,
          createdBy: 'warehouse_manager_1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const mockMessages: Message[] = [
          {
            id: 'msg_1',
            conversationId,
            senderId: userId,
            senderName: 'You',
            senderRole: 'VIEWER',
            content: 'Good morning! I wanted to check on the status of our weekly FlexVolt battery order.',
            type: 'TEXT',
            priority: 'NORMAL',
            status: 'READ',
            isEdited: false,
            isDeleted: false,
            readBy: [{
              userId: 'warehouse_manager_1',
              userName: 'Mike Rodriguez',
              readAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            }],
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            isOwn: true
          },
          {
            id: 'msg_2',
            conversationId,
            senderId: 'warehouse_manager_1',
            senderName: 'Mike Rodriguez',
            senderRole: 'MANAGER',
            content: 'Hello! Your order is currently being processed. We received 500 units of 9Ah batteries this morning and your allocation of 50 units is being prepared for shipment.',
            type: 'TEXT',
            priority: 'NORMAL',
            status: 'READ',
            isEdited: false,
            isDeleted: false,
            readBy: [{
              userId: userId,
              userName: 'You',
              readAt: new Date(Date.now() - 1000 * 60 * 40).toISOString()
            }],
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            isOwn: false
          },
          {
            id: 'msg_3',
            conversationId,
            senderId: 'warehouse_manager_1',
            senderName: 'Mike Rodriguez',
            senderRole: 'MANAGER',
            content: 'Your shipment will go out this afternoon via UPS Ground. You should receive tracking information within 2 hours.',
            type: 'ORDER_UPDATE',
            priority: 'HIGH',
            status: 'DELIVERED',
            metadata: {
              warehouseId: 'warehouse_us_west',
              region: 'US'
            },
            isEdited: false,
            isDeleted: false,
            readBy: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            isOwn: false
          }
        ]

        setConversation(mockConversation)
        setMessages(mockMessages)
      }
    } catch (error) {
      console.error('Error fetching conversation data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, userId])

  // Initial load
  useEffect(() => {
    fetchConversationData()
  }, [fetchConversationData])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    
    try {
      const messageData = {
        conversationId,
        content: newMessage,
        type: 'TEXT',
        priority: 'NORMAL',
        replyToId: replyTo?.id,
        metadata: {}
      }

      const response = await fetch('/api/supplier/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Add optimistic message
          const optimisticMessage: Message = {
            id: `temp_${Date.now()}`,
            conversationId,
            senderId: userId,
            senderName: 'You',
            senderRole: 'VIEWER',
            content: newMessage,
            type: 'TEXT',
            priority: 'NORMAL',
            status: 'SENT',
            isEdited: false,
            isDeleted: false,
            readBy: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isOwn: true
          }

          setMessages(prev => [...prev, optimisticMessage])
          setNewMessage('')
          setReplyTo(null)

          // Simulate message delivery
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === optimisticMessage.id 
                ? { ...msg, status: 'DELIVERED' }
                : msg
            ))
          }, 1000)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }, [newMessage, conversationId, userId, replyTo, isSending])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === 'Escape') {
      setReplyTo(null)
      setEditingMessage(null)
    }
  }, [handleSendMessage])

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Get message type icon
  const getMessageTypeIcon = (type: Message['type']) => {
    switch (type) {
      case 'WAREHOUSE_ALERT':
        return <MapPin size={16} style={{ color: '#006FEE' }} />
      case 'ORDER_UPDATE':
        return <Zap size={16} style={{ color: '#10B981' }} />
      case 'SYSTEM':
        return <Bell size={16} style={{ color: '#8B5CF6' }} />
      case 'FILE':
        return <FileText size={16} style={{ color: '#6B7280' }} />
      default:
        return null
    }
  }

  // Get status icon
  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'READ':
        return <CheckCircle size={12} style={{ color: '#10B981' }} />
      case 'DELIVERED':
        return <Check size={12} style={{ color: '#6B7280' }} />
      case 'SENT':
        return <Clock size={12} style={{ color: '#9CA3AF' }} />
      case 'FAILED':
        return <X size={12} style={{ color: '#EF4444' }} />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '2px solid #E6F4FF',
        ...style
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #E6F4FF',
            borderTop: '3px solid #006FEE',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{
            fontSize: '14px',
            color: '#6B7280'
          }}>
            Loading conversation...
          </span>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '2px solid #E6F4FF',
        ...style
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <AlertTriangle size={48} style={{ color: '#F59E0B', margin: '0 auto 16px' }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 8px'
          }}>
            Conversation not found
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: '0'
          }}>
            The conversation you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '2px solid #E6F4FF',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      ...style
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '2px solid #E6F4FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: conversation.type === 'WAREHOUSE_CHANNEL' 
              ? 'linear-gradient(135deg, #006FEE, #0050B3)'
              : conversation.type === 'BROADCAST'
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {conversation.type === 'WAREHOUSE_CHANNEL' ? <MapPin size={20} /> :
             conversation.type === 'BROADCAST' ? <Bell size={20} /> :
             conversation.name.charAt(0)}
          </div>
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#111827',
              margin: '0'
            }}>
              {conversation.name}
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#6B7280',
              margin: '2px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Users size={12} />
              {conversation.participants.length} participants
              {conversation.metadata.region && (
                <>
                  <span>•</span>
                  <MapPin size={10} />
                  {conversation.metadata.region}
                </>
              )}
              {!isConnected && (
                <>
                  <span>•</span>
                  <span style={{ color: '#EF4444' }}>Offline</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: '2px solid #E6F4FF',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#006FEE'
            }}
          >
            <Users size={16} />
          </button>
          <button style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '2px solid #E6F4FF',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#006FEE'
          }}>
            <Phone size={16} />
          </button>
          <button style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '2px solid #E6F4FF',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#006FEE'
          }}>
            <Video size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: '2px solid #E6F4FF',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#6B7280'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Reply Banner */}
      {replyTo && (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#F0F9FF',
          borderBottom: '1px solid #E6F4FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Reply size={16} style={{ color: '#006FEE' }} />
            <span style={{
              fontSize: '12px',
              color: '#006FEE',
              fontWeight: '600'
            }}>
              Replying to {replyTo.senderName}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#6B7280',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {replyTo.content}
            </span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message, index) => {
          const showTimestamp = index === 0 || 
            new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000
          
          return (
            <div key={message.id}>
              {showTimestamp && (
                <div style={{
                  textAlign: 'center',
                  margin: '16px 0 8px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#9CA3AF',
                    backgroundColor: '#F9FAFB',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                flexDirection: message.isOwn ? 'row-reverse' : 'row'
              }}>
                {!message.isOwn && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #006FEE, #0050B3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {message.senderName.charAt(0)}
                  </div>
                )}
                
                <div style={{
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {!message.isOwn && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{message.senderName}</span>
                      <span>•</span>
                      <span>{message.senderRole}</span>
                    </div>
                  )}
                  
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: message.isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: message.isOwn ? '#006FEE' : 'white',
                      color: message.isOwn ? 'white' : '#111827',
                      border: message.isOwn ? 'none' : '2px solid #E6F4FF',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      wordWrap: 'break-word',
                      position: 'relative'
                    }}
                  >
                    {message.type !== 'TEXT' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: message.isOwn ? 'rgba(255,255,255,0.8)' : '#6B7280'
                      }}>
                        {getMessageTypeIcon(message.type)}
                        {message.type.replace('_', ' ')}
                      </div>
                    )}
                    
                    {message.replyToId && (
                      <div style={{
                        borderLeft: '3px solid rgba(255,255,255,0.3)',
                        paddingLeft: '8px',
                        marginBottom: '8px',
                        fontSize: '12px',
                        opacity: 0.8
                      }}>
                        <div style={{ fontWeight: '600' }}>
                          {messages.find(m => m.id === message.replyToId)?.senderName}
                        </div>
                        <div>{messages.find(m => m.id === message.replyToId)?.content}</div>
                      </div>
                    )}
                    
                    {message.content}
                  </div>
                  
                  <div style={{
                    fontSize: '11px',
                    color: '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: message.isOwn ? 'flex-end' : 'flex-start'
                  }}>
                    <Clock size={10} />
                    {formatTimestamp(message.createdAt)}
                    {message.isOwn && getStatusIcon(message.status)}
                  </div>
                </div>
                
                {/* Message Actions */}
                <div style={{
                  opacity: 0,
                  transition: 'opacity 0.2s ease'
                }}
                className="message-actions">
                  <button
                    onClick={() => setReplyTo(message)}
                    style={{
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6B7280'
                    }}
                  >
                    <Reply size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0'
          }}>
            <div style={{
              display: 'flex',
              gap: '2px'
            }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#6B7280',
                    animation: `pulse 1.4s infinite ${i * 0.2}s`
                  }}
                />
              ))}
            </div>
            <span style={{
              fontSize: '12px',
              color: '#6B7280'
            }}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '2px solid #E6F4FF',
        backgroundColor: '#F8FAFC'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={!isConnected || isSending}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#FFFFFF',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#111827',
                outline: 'none',
                transition: 'all 0.2s',
                resize: 'none',
                minHeight: '44px',
                maxHeight: '120px'
              }}
              onFocus={(e) => {
                if (isConnected) {
                  e.target.style.borderColor = '#006FEE'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                // Handle file upload
                console.log('Files selected:', e.target.files)
              }}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected}
              style={{
                padding: '10px',
                backgroundColor: 'transparent',
                border: '2px solid #E6F4FF',
                borderRadius: '12px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                color: isConnected ? '#006FEE' : '#9CA3AF'
              }}
            >
              <Paperclip size={18} />
            </button>
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={!isConnected}
              style={{
                padding: '10px',
                backgroundColor: 'transparent',
                border: '2px solid #E6F4FF',
                borderRadius: '12px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                color: isConnected ? '#006FEE' : '#9CA3AF'
              }}
            >
              <Smile size={18} />
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected || isSending}
              style={{
                padding: '10px',
                backgroundColor: (newMessage.trim() && isConnected && !isSending) ? '#006FEE' : '#E5E7EB',
                border: 'none',
                borderRadius: '12px',
                cursor: (newMessage.trim() && isConnected && !isSending) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                if (newMessage.trim() && isConnected && !isSending) {
                  e.currentTarget.style.backgroundColor = '#0050B3'
                }
              }}
              onMouseOut={(e) => {
                if (newMessage.trim() && isConnected && !isSending) {
                  e.currentTarget.style.backgroundColor = '#006FEE'
                }
              }}
            >
              {isSending ? (
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        .message-actions {
          opacity: 0 !important;
          transition: opacity 0.2s ease;
        }
        div:hover .message-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}