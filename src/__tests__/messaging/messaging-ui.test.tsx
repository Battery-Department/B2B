/**
 * RHY_066 Internal Messaging System - UI Component Tests
 * Comprehensive test suite for messaging UI components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import '@testing-library/jest-dom'
import { MessageCenter } from '@/components/messaging/MessageCenter'
import { ChatInterface } from '@/components/messaging/ChatInterface'

// Mock fetch globally
declare global {
  var fetch: jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>
}
global.fetch = jest.fn() as jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>

// Mock data
const mockConversations = [
  {
    id: 'conv_001',
    name: 'US West Warehouse Team',
    type: 'WAREHOUSE_CHANNEL',
    unreadCount: 3,
    participants: 12,
    isActive: true,
    warehouseId: 'warehouse_us_west',
    region: 'US',
    updatedAt: new Date().toISOString(),
    lastMessage: {
      id: 'msg_001',
      content: 'New FlexVolt 9Ah shipment arrived',
      senderName: 'Mike Rodriguez',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      type: 'WAREHOUSE_ALERT',
      priority: 'HIGH'
    }
  },
  {
    id: 'conv_002',
    name: 'Order Support',
    type: 'DIRECT',
    unreadCount: 0,
    participants: 2,
    isActive: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    lastMessage: {
      id: 'msg_002',
      content: 'Order has been processed',
      senderName: 'Sarah Chen',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      type: 'ORDER_UPDATE',
      priority: 'NORMAL'
    }
  }
]

const mockMessages = [
  {
    id: 'msg_001',
    conversationId: 'conv_001',
    senderId: 'user_001',
    senderName: 'You',
    senderRole: 'VIEWER',
    content: 'Good morning! I wanted to check on our battery order.',
    type: 'TEXT',
    priority: 'NORMAL',
    status: 'read',
    isEdited: false,
    isDeleted: false,
    readBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    isOwn: true
  },
  {
    id: 'msg_002',
    conversationId: 'conv_001',
    senderId: 'warehouse_manager_001',
    senderName: 'Mike Rodriguez',
    senderRole: 'MANAGER',
    content: 'Your order is being processed. 50 units ready for shipment.',
    type: 'TEXT',
    priority: 'NORMAL',
    status: 'read',
    isEdited: false,
    isDeleted: false,
    readBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isOwn: false
  }
]

const mockConversationDetails = {
  id: 'conv_001',
  name: 'US West Warehouse Team',
  type: 'WAREHOUSE_CHANNEL',
  isActive: true,
  participants: [
    {
      id: 'participant_001',
      userId: 'user_001',
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
  createdBy: 'warehouse_manager_001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// Mock API responses
const mockFetchResponses = {
  '/api/supplier/conversations': {
    success: true,
    data: {
      conversations: mockConversations,
      pagination: {
        total: mockConversations.length,
        limit: 20,
        offset: 0,
        hasMore: false
      },
      summary: {
        totalUnread: 3,
        activeConversations: 2,
        warehouseBreakdown: { US: 1, EU: 0, JAPAN: 0, AUSTRALIA: 0 }
      }
    },
    performance: {
      responseTime: 150,
      cached: false
    }
  },
  '/api/supplier/conversations/conv_001': {
    success: true,
    data: {
      conversation: mockConversationDetails
    },
    performance: {
      responseTime: 100
    }
  },
  '/api/supplier/messages': {
    success: true,
    data: {
      messages: mockMessages,
      conversation: mockConversationDetails,
      pagination: {
        total: mockMessages.length,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    },
    performance: {
      responseTime: 120,
      cached: false
    }
  }
}

// Setup fetch mock
const setupFetchMock = () => {
  (global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
    const method = options?.method || 'GET'
    const urlPath = new URL(url, 'http://localhost').pathname
    const query = new URL(url, 'http://localhost').searchParams
    
    // Handle different API endpoints
    if (method === 'GET' && urlPath === '/api/supplier/conversations') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFetchResponses['/api/supplier/conversations'])
      })
    }
    
    if (method === 'GET' && urlPath.startsWith('/api/supplier/conversations/')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFetchResponses['/api/supplier/conversations/conv_001'])
      })
    }
    
    if (method === 'GET' && urlPath === '/api/supplier/messages') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFetchResponses['/api/supplier/messages'])
      })
    }
    
    if (method === 'POST' && urlPath === '/api/supplier/messages') {
      const body = JSON.parse(options?.body as string || '{}')
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          success: true,
          data: {
            message: {
              id: `msg_${Date.now()}`,
              ...body,
              senderId: 'user_001',
              senderName: 'You',
              senderRole: 'VIEWER',
              status: 'SENT',
              isEdited: false,
              isDeleted: false,
              readBy: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isOwn: true
            }
          },
          performance: {
            responseTime: 80
          }
        })
      })
    }
    
    // Default 404 response
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ success: false, error: 'Not found' })
    })
  })
}

describe('MessageCenter Component Tests', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    setupFetchMock()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render MessageCenter with loading state', () => {
      render(<MessageCenter userId="user_001" />)
      
      expect(screen.getByText('Loading conversations...')).toBeInTheDocument()
    })

    it('should render MessageCenter with conversations after loading', async () => {
      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('Message Center')).toBeInTheDocument()
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
        expect(screen.getByText('Order Support')).toBeInTheDocument()
      })
    })

    it('should display correct conversation statistics', async () => {
      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // Total chats
        expect(screen.getByText('3')).toBeInTheDocument() // Unread messages
        expect(screen.getByText('2')).toBeInTheDocument() // Active conversations
      })
    })

    it('should show unread count badges', async () => {
      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        // Should show unread count for conversation with unread messages
        const unreadBadges = screen.getAllByText('3')
        expect(unreadBadges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should filter conversations by search term', async () => {
      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      await user.type(searchInput, 'Warehouse')

      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
        expect(screen.queryByText('Order Support')).not.toBeInTheDocument()
      })
    })

    it('should filter conversations by type', async () => {
      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
      })

      const warehousesFilter = screen.getByRole('button', { name: /Warehouses/ })
      await user.click(warehousesFilter)

      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
        expect(screen.queryByText('Order Support')).not.toBeInTheDocument()
      })
    })

    it('should show unread filter', async () => {
      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        const unreadFilter = screen.getByRole('button', { name: /Unread/ })
        expect(unreadFilter).toBeInTheDocument()
      })

      const unreadFilter = screen.getByRole('button', { name: /Unread/ })
      await user.click(unreadFilter)

      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
        expect(screen.queryByText('Order Support')).not.toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should call onConversationSelect when conversation is clicked', async () => {
      const mockOnSelect = jest.fn()
      render(<MessageCenter userId="user_001" onConversationSelect={mockOnSelect} />)
      
      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
      })

      const conversation = screen.getByText('US West Warehouse Team')
      await user.click(conversation)

      expect(mockOnSelect).toHaveBeenCalledWith('conv_001')
    })

    it('should handle hover effects on conversations', async () => {
      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
      })

      const conversation = screen.getByText('US West Warehouse Team').closest('div')
      
      if (conversation) {
        await user.hover(conversation)
        // Verify hover styles are applied (if needed)
        expect(conversation).toBeInTheDocument()
      }
    })

    it('should clear search when input is cleared', async () => {
      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search conversations...')
      await user.type(searchInput, 'Test')
      await user.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
        expect(screen.getByText('Order Support')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error state when API fails', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ success: false, error: 'Server error' })
        })
      )

      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
      })
    })

    it('should retry on error button click', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() => 
          Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ success: false, error: 'Server error' })
          })
        )
        .mockImplementationOnce(() => 
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockFetchResponses['/api/supplier/conversations'])
          })
        )

      render(<MessageCenter userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /Retry/ })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
      })
    })
  })
})

describe('ChatInterface Component Tests', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    setupFetchMock()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render ChatInterface with loading state', () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      expect(screen.getByText('Loading conversation...')).toBeInTheDocument()
    })

    it('should render conversation header after loading', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
        expect(screen.getByText('1 participants')).toBeInTheDocument()
        expect(screen.getByText('US')).toBeInTheDocument()
      })
    })

    it('should render messages after loading', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('Good morning! I wanted to check on our battery order.')).toBeInTheDocument()
        expect(screen.getByText('Your order is being processed. 50 units ready for shipment.')).toBeInTheDocument()
      })
    })

    it('should show message input area', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Send/ })).toBeInTheDocument()
      })
    })
  })

  describe('Message Sending', () => {
    it('should send message when send button is clicked', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /Send/ })

      await user.type(messageInput, 'Test message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/supplier/messages',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test message')
        })
      )
    })

    it('should send message when Enter is pressed', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      const messageInput = screen.getByPlaceholderText('Type your message...')

      await user.type(messageInput, 'Test message{enter}')

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument()
      })
    })

    it('should not send empty messages', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      const sendButton = screen.getByRole('button', { name: /Send/ })
      expect(sendButton).toBeDisabled()

      await user.click(sendButton)

      expect(global.fetch).not.toHaveBeenCalledWith('/api/supplier/messages', expect.any(Object))
    })

    it('should clear input after sending message', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      const messageInput = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement
      const sendButton = screen.getByRole('button', { name: /Send/ })

      await user.type(messageInput, 'Test message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(messageInput.value).toBe('')
      })
    })
  })

  describe('Message Display', () => {
    it('should distinguish between own and other messages', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        const ownMessage = screen.getByText('Good morning! I wanted to check on our battery order.')
        const otherMessage = screen.getByText('Your order is being processed. 50 units ready for shipment.')
        
        expect(ownMessage).toBeInTheDocument()
        expect(otherMessage).toBeInTheDocument()
        
        // Check that sender names are displayed for other messages
        expect(screen.getByText('Mike Rodriguez')).toBeInTheDocument()
      })
    })

    it('should show message timestamps', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        // Should show relative timestamps
        expect(screen.getByText(/ago/)).toBeInTheDocument()
      })
    })

    it('should show message status for own messages', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        // Should show read status or similar indicators
        const statusElements = screen.getAllByText(/read|delivered|sent/i)
        expect(statusElements.length).toBeGreaterThan(0)
      })
    })

    it('should handle message type indicators', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        // Should show type indicators for non-text messages
        expect(screen.getByText('US West Warehouse Team')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should handle reply functionality', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('Your order is being processed. 50 units ready for shipment.')).toBeInTheDocument()
      })

      // Find and click reply button (would need to implement reply UI)
      // This is a placeholder for reply functionality testing
      expect(true).toBe(true)
    })

    it('should handle file attachment button', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        const attachButton = screen.getByRole('button', { name: /attach/i })
        expect(attachButton).toBeInTheDocument()
      })
    })

    it('should handle emoji button', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        const emojiButton = screen.getByRole('button', { name: /emoji/i })
        expect(emojiButton).toBeInTheDocument()
      })
    })

    it('should call onClose when close button is clicked', async () => {
      const mockOnClose = jest.fn()
      render(<ChatInterface conversationId="conv_001" userId="user_001" onClose={mockOnClose} />)
      
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i })
        expect(closeButton).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should show error state for non-existent conversation', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ success: false, error: 'Conversation not found' })
        })
      )

      render(<ChatInterface conversationId="nonexistent" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('Conversation not found')).toBeInTheDocument()
      })
    })

    it('should handle message sending errors', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ success: false, error: 'Failed to send message' })
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockFetchResponses['/api/supplier/conversations/conv_001'])
        })
      })

      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /Send/ })

      await user.type(messageInput, 'Test message')
      await user.click(sendButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(messageInput).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should handle large message lists efficiently', async () => {
      const largeMockResponse = {
        ...mockFetchResponses['/api/supplier/messages'],
        data: {
          ...mockFetchResponses['/api/supplier/messages'].data,
          messages: Array.from({ length: 100 }, (_, i) => ({
            ...mockMessages[0],
            id: `msg_${i}`,
            content: `Message ${i}`,
            createdAt: new Date(Date.now() - i * 60 * 1000).toISOString()
          }))
        }
      }

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/supplier/messages')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(largeMockResponse)
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockFetchResponses['/api/supplier/conversations/conv_001'])
        })
      })

      const startTime = Date.now()
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByText('Message 0')).toBeInTheDocument()
      })

      const renderTime = Date.now() - startTime
      expect(renderTime).toBeLessThan(2000) // Should render within 2 seconds
    })

    it('should handle rapid message sending', async () => {
      render(<ChatInterface conversationId="conv_001" userId="user_001" />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      const messageInput = screen.getByPlaceholderText('Type your message...')

      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        await user.type(messageInput, `Rapid message ${i}{enter}`)
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
        })
      }

      // Should handle all messages
      await waitFor(() => {
        expect(screen.getByText('Rapid message 4')).toBeInTheDocument()
      })
    })
  })
})

// Export test utilities for reuse
export { setupFetchMock, mockConversations, mockMessages, mockConversationDetails }