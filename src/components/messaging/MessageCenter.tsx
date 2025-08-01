/**
 * RHY_066 Internal Messaging System - Message Center Component
 * Enterprise-grade messaging hub with real-time capabilities
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Bell, Users, Search, Filter, Archive, Star, 
         MoreVertical, Clock, MapPin, Zap, AlertTriangle, CheckCircle,
         XCircle, Loader2, Wifi, WifiOff } from 'lucide-react'

// Types
interface MessageCenterProps {
  userId: string
  onConversationSelect?: (conversationId: string) => void
  className?: string
  style?: React.CSSProperties
}

interface ConversationSummary {
  id: string
  name: string
  type: 'DIRECT' | 'GROUP' | 'BROADCAST' | 'WAREHOUSE_CHANNEL'
  lastMessage?: {
    id: string
    content: string
    senderName: string
    timestamp: string
    type: 'TEXT' | 'FILE' | 'SYSTEM' | 'WAREHOUSE_ALERT' | 'ORDER_UPDATE'
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  }
  unreadCount: number
  participants: number
  warehouseId?: string
  region?: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
  updatedAt: string
  isActive: boolean
}

interface MessageCenterStats {
  totalConversations: number
  unreadMessages: number
  activeConversations: number
  warehouseBreakdown: Record<string, number>
}

export const MessageCenter: React.FC<MessageCenterProps> = ({
  userId,
  onConversationSelect,
  className = '',
  style = {}
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [stats, setStats] = useState<MessageCenterStats>({
    totalConversations: 0,
    unreadMessages: 0,
    activeConversations: 0,
    warehouseBreakdown: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'warehouses' | 'support'>('all')
  const [error, setError] = useState<string | null>(null)

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/supplier/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setConversations(data.data.conversations)
        setStats(data.data.summary)
      } else {
        throw new Error(data.error || 'Failed to fetch conversations')
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      
      // Mock data fallback for development
      const mockConversations: ConversationSummary[] = [
        {
          id: 'conv_1',
          name: 'US West Warehouse Team',
          type: 'WAREHOUSE_CHANNEL',
          unreadCount: 3,
          participants: 12,
          isActive: true,
          warehouseId: 'warehouse_us_west',
          region: 'US',
          updatedAt: new Date().toISOString(),
          lastMessage: {
            id: 'msg_1',
            content: 'New FlexVolt 9Ah shipment arrived - 500 units ready for distribution',
            senderName: 'Mike Rodriguez',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            type: 'WAREHOUSE_ALERT',
            priority: 'HIGH'
          }
        },
        {
          id: 'conv_2',
          name: 'Order #ORD-2024-0156 Support',
          type: 'DIRECT',
          unreadCount: 0,
          participants: 2,
          isActive: true,
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          lastMessage: {
            id: 'msg_2',
            content: 'Order has been processed and will ship tomorrow via UPS Next Day Air',
            senderName: 'Sarah Chen',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            type: 'ORDER_UPDATE',
            priority: 'NORMAL'
          }
        },
        {
          id: 'conv_3',
          name: 'FlexVolt Product Updates',
          type: 'BROADCAST',
          unreadCount: 1,
          participants: 150,
          isActive: true,
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          lastMessage: {
            id: 'msg_3',
            content: 'New 15Ah FlexVolt batteries now available with 25% volume discount for orders over $5000',
            senderName: 'Product Team',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            type: 'SYSTEM',
            priority: 'NORMAL'
          }
        }
      ]

      setConversations(mockConversations)
      setStats({
        totalConversations: mockConversations.length,
        unreadMessages: mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
        activeConversations: mockConversations.filter(conv => conv.isActive).length,
        warehouseBreakdown: {
          'US': 1,
          'EU': 0,
          'JAPAN': 0,
          'AUSTRALIA': 0
        }
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Real-time connection simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.1) // 90% uptime simulation
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Filter conversations based on search and filter
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = searchTerm === '' || 
      conversation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = 
      selectedFilter === 'all' ||
      (selectedFilter === 'unread' && conversation.unreadCount > 0) ||
      (selectedFilter === 'warehouses' && conversation.type === 'WAREHOUSE_CHANNEL') ||
      (selectedFilter === 'support' && conversation.type === 'DIRECT')

    return matchesSearch && matchesFilter
  })

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

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'WAREHOUSE_ALERT':
        return <MapPin size={14} className="text-blue-500" />
      case 'ORDER_UPDATE':
        return <Zap size={14} className="text-green-500" />
      case 'SYSTEM':
        return <Bell size={14} className="text-purple-500" />
      default:
        return <MessageSquare size={14} className="text-gray-500" />
    }
  }

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
      case 'HIGH':
        return <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
      default:
        return null
    }
  }

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'WAREHOUSE_CHANNEL':
        return <MapPin size={20} />
      case 'BROADCAST':
        return <Bell size={20} />
      case 'GROUP':
        return <Users size={20} />
      default:
        return <MessageSquare size={20} />
    }
  }

  return (
    <div 
      className={className}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '2px solid #E6F4FF',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '2px solid #E6F4FF',
        background: 'linear-gradient(to right, #006FEE, #0050B3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={24} style={{ color: 'white' }} />
            <h2 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              margin: '0'
            }}>
              Message Center
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isConnected ? (
              <Wifi size={16} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            ) : (
              <WifiOff size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
            )}
            <span style={{
              fontSize: '12px',
              color: isConnected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'white'
            }}>
              {stats.totalConversations}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Total Chats
            </div>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              {stats.unreadMessages}
              {stats.unreadMessages > 0 && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FBB024',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Unread
            </div>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'white'
            }}>
              {stats.activeConversations}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Active
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6B7280'
          }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              backgroundColor: '#F9FAFB',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#111827',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#006FEE'
              e.target.style.backgroundColor = 'white'
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB'
              e.target.style.backgroundColor = '#F9FAFB'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {[
            { key: 'all', label: 'All', count: conversations.length },
            { key: 'unread', label: 'Unread', count: stats.unreadMessages },
            { key: 'warehouses', label: 'Warehouses', count: conversations.filter(c => c.type === 'WAREHOUSE_CHANNEL').length },
            { key: 'support', label: 'Support', count: conversations.filter(c => c.type === 'DIRECT').length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as any)}
              style={{
                padding: '6px 12px',
                backgroundColor: selectedFilter === filter.key ? '#006FEE' : 'transparent',
                color: selectedFilter === filter.key ? 'white' : '#6B7280',
                border: '2px solid #E6F4FF',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                if (selectedFilter !== filter.key) {
                  e.currentTarget.style.backgroundColor = '#F0F9FF'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedFilter !== filter.key) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {filter.label}
              {filter.count > 0 && (
                <span style={{
                  backgroundColor: selectedFilter === filter.key ? 'rgba(255,255,255,0.3)' : '#E6F4FF',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          margin: '16px 20px',
          padding: '12px',
          backgroundColor: '#FEE2E2',
          border: '2px solid #FECACA',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} style={{ color: '#EF4444' }} />
          <span style={{ fontSize: '12px', color: '#991B1B' }}>
            {error}
          </span>
          <button
            onClick={fetchConversations}
            style={{
              marginLeft: 'auto',
              padding: '4px 8px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Loader2 size={24} style={{ 
              color: '#006FEE', 
              animation: 'spin 1s linear infinite' 
            }} />
            <span style={{
              fontSize: '14px',
              color: '#6B7280'
            }}>
              Loading conversations...
            </span>
          </div>
        </div>
      )}

      {/* Conversations List */}
      {!isLoading && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '400px'
        }}>
          {filteredConversations.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center'
            }}>
              <MessageSquare size={48} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 8px'
              }}>
                No conversations found
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: '0'
              }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Start a conversation to get began'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onConversationSelect?.(conversation.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #F3F4F6',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
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
                    fontSize: '14px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {getConversationIcon(conversation.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conversation.name}
                      </h4>
                      {conversation.unreadCount > 0 && (
                        <div style={{
                          backgroundColor: '#006FEE',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          minWidth: '18px',
                          textAlign: 'center'
                        }}>
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '6px'
                    }}>
                      <Users size={12} />
                      {conversation.participants} participants
                      {conversation.region && (
                        <>
                          <span>•</span>
                          <span>{conversation.region}</span>
                        </>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <div>
                        <p style={{
                          fontSize: '13px',
                          color: '#4B5563',
                          margin: '0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {getMessageTypeIcon(conversation.lastMessage.type)}
                          {getPriorityIndicator(conversation.lastMessage.priority)}
                          {conversation.lastMessage.content}
                        </p>
                        <p style={{
                          fontSize: '11px',
                          color: '#9CA3AF',
                          margin: '4px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={10} />
                          {formatTimestamp(conversation.lastMessage.timestamp)}
                          <span>•</span>
                          <span>{conversation.lastMessage.senderName}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}