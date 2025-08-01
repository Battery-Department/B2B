'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  FileText,
  Clock,
  User,
  MessageCircle,
  Send,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Calendar,
  Tag,
  Flag
} from 'lucide-react'

// Design System Colors (matching products page)
const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#059669',
  
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#6B7280',
  gray500: '#9CA3AF',
  gray400: '#D1D5DB',
  gray300: '#E5E7EB',
  gray200: '#F3F4F6',
  gray100: '#F9FAFB',
  
  white: '#FFFFFF',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7'
}

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
}

const typography = {
  title: { fontSize: '24px', fontWeight: '700', color: colors.gray900 },
  sectionTitle: { fontSize: '20px', fontWeight: '600', color: colors.gray900 },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: colors.gray900 },
  body: { fontSize: '14px', fontWeight: '400', color: colors.gray700 },
  label: { fontSize: '12px', fontWeight: '500', color: colors.gray600 },
  small: { fontSize: '12px', fontWeight: '400', color: colors.gray500 }
}

interface Message {
  id: string
  sender: 'customer' | 'support'
  content: string
  timestamp: string
  attachments?: string[]
}

interface Ticket {
  id: string
  subject: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  date: string
  lastUpdate: string
  description: string
  messages: Message[]
}

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    // Load ticket from localStorage
    const tickets = localStorage.getItem('supportTickets')
    if (tickets) {
      const allTickets = JSON.parse(tickets)
      const foundTicket = allTickets.find((t: Ticket) => t.id === params.id)
      
      if (foundTicket) {
        // Initialize messages if not present
        if (!foundTicket.messages) {
          foundTicket.messages = [
            {
              id: '1',
              sender: 'customer',
              content: foundTicket.description,
              timestamp: foundTicket.date,
              attachments: []
            }
          ]
        }
        setTicket(foundTicket)
      }
    }
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return colors.primary
      case 'in-progress': return colors.warning
      case 'resolved': return colors.success
      case 'closed': return colors.gray500
      default: return colors.gray500
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error
      case 'high': return colors.warning
      case 'medium': return colors.primary
      case 'low': return colors.gray500
      default: return colors.gray500
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !ticket) return

    setIsSending(true)

    // Add customer message
    const customerMessage: Message = {
      id: Date.now().toString(),
      sender: 'customer',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    }

    const updatedTicket = {
      ...ticket,
      messages: [...ticket.messages, customerMessage],
      lastUpdate: new Date().toISOString()
    }

    // Generate contextual support response after a delay
    setTimeout(async () => {
      // Generate contextual response based on message content
      let responseContent = ''
      const lowerMessage = newMessage.toLowerCase()
      
      if (lowerMessage.includes('missing') || lowerMessage.includes('lost') || lowerMessage.includes('tracking')) {
        responseContent = `I understand your concern about the missing parcel. I've immediately escalated this to our shipping team.

Here's what I'm doing for you:
1. **Initiated a trace request** with our carrier for your package
2. **Filed a missing package claim** on your behalf
3. **Prepared a replacement order** ready to ship immediately

Since the package has been missing for 5 days and tracking isn't updating, we'll proceed with sending a replacement right away. You should receive:
- Replacement tracking number within 2 hours
- Express shipping at no extra cost (1-2 business days)
- Full refund if the original package arrives

No action needed from your end. We'll handle everything and keep you updated via email.`
      } else if (lowerMessage.includes('warranty') || lowerMessage.includes('defect') || lowerMessage.includes('broken')) {
        responseContent = `I'm sorry to hear about the issue with your FlexVolt battery. Our 3-year warranty has you covered!

**Warranty Claim Approved** ✓

Here's what happens next:
1. I've generated a prepaid return label (check your email)
2. Ship the defective battery back using the label
3. Replacement will ship immediately upon tracking scan
4. You'll receive the new battery in 2-3 business days

**Important**: Keep using the battery safely if possible - the replacement will arrive quickly. If it's completely non-functional, dispose of it at a certified battery recycling center.

Your warranty claim reference: #WC-${Date.now().toString().slice(-6)}`
      } else if (lowerMessage.includes('order') || lowerMessage.includes('status') || lowerMessage.includes('delivery')) {
        responseContent = `I've pulled up your order details and checked with our fulfillment center.

**Your Order Status**:
- Current location: In transit - ${['Denver, CO', 'Chicago, IL', 'Atlanta, GA'][Math.floor(Math.random() * 3)]}
- Expected delivery: ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
- Carrier: UPS Ground

The slight delay is due to high demand this week. However, I've:
✓ Upgraded your shipping to UPS 2-Day Air at no charge
✓ Added priority handling to ensure first-out delivery
✓ Applied a 10% credit to your account for the inconvenience

You'll receive updated tracking within the next hour.`
      } else if (lowerMessage.includes('refund') || lowerMessage.includes('return') || lowerMessage.includes('cancel')) {
        responseContent = `I'll help you with the return/refund process right away.

**Return Authorization Approved**
Return Auth #: RA-${Date.now().toString().slice(-6)}

I've initiated the refund process:
- Prepaid return label sent to your email
- Refund will process within 24 hours of receipt
- Expect funds in 2-3 business days

**Or if you prefer**: I can offer an instant 15% credit to keep the batteries, as many customers find uses for extras. Just let me know!

No questions asked - your satisfaction is our priority.`
      } else {
        responseContent = `Thank you for providing those additional details. I've carefully reviewed your message and I'm taking immediate action.

Based on what you've shared, I've:
1. Documented all the information in your case file
2. Escalated this to our specialist team
3. Set this as high priority for resolution

I'll personally monitor this ticket and ensure you get a resolution quickly. You can expect:
- A detailed update within 2 hours
- Direct contact from our specialist team if needed
- Resolution within 24 hours maximum

Is there anything specific you'd like me to prioritize while handling this issue?`
      }
      
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        content: responseContent,
        timestamp: new Date().toISOString()
      }

      const finalTicket = {
        ...updatedTicket,
        messages: [...updatedTicket.messages, supportMessage],
        status: 'in-progress' as const
      }

      // Update ticket in localStorage
      const tickets = localStorage.getItem('supportTickets')
      if (tickets) {
        const allTickets = JSON.parse(tickets)
        const index = allTickets.findIndex((t: Ticket) => t.id === ticket.id)
        if (index !== -1) {
          allTickets[index] = finalTicket
          localStorage.setItem('supportTickets', JSON.stringify(allTickets))
        }
      }

      setTicket(finalTicket)
      setIsSending(false)
    }, 1500)

    setTicket(updatedTicket)
    setNewMessage('')
  }

  if (!ticket) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.gray100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={colors.primary} style={{ 
            marginBottom: spacing.md,
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ ...typography.body }}>Loading ticket...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.gray100,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        <div style={{ 
          padding: `${spacing.lg} ${spacing.xl}`, 
          display: 'flex', 
          alignItems: 'center', 
          gap: spacing.md 
        }}>
          <button
            onClick={() => router.push('/customer/support')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: colors.white,
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
          >
            <ArrowLeft size={16} />
            Back to Support
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: colors.white }}>
            Ticket #{ticket.id}
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: spacing.xl }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Ticket Header */}
          <div style={{
            background: colors.white,
            borderRadius: '12px',
            padding: spacing.lg,
            marginBottom: spacing.lg,
            boxShadow: `0 4px 12px ${colors.gray400}40`,
            border: `2px solid ${colors.gray200}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: spacing.md
            }}>
              <div>
                <h2 style={{
                  ...typography.title,
                  marginBottom: spacing.sm
                }}>
                  {ticket.subject}
                </h2>
                <div style={{
                  display: 'flex',
                  gap: spacing.md,
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: `${getStatusColor(ticket.status)}15`,
                    color: getStatusColor(ticket.status),
                    padding: `${spacing.xs} ${spacing.md}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs
                  }}>
                    {ticket.status === 'open' && <AlertCircle size={14} />}
                    {ticket.status === 'in-progress' && <Clock size={14} />}
                    {ticket.status === 'resolved' && <CheckCircle size={14} />}
                    {ticket.status.replace('-', ' ')}
                  </span>
                  <span style={{
                    background: `${getPriorityColor(ticket.priority)}15`,
                    color: getPriorityColor(ticket.priority),
                    padding: `${spacing.xs} ${spacing.md}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs
                  }}>
                    <Flag size={14} />
                    {ticket.priority} Priority
                  </span>
                  <span style={{
                    ...typography.body,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs
                  }}>
                    <Tag size={14} />
                    {ticket.category}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  ...typography.small,
                  marginBottom: spacing.xs,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs
                }}>
                  <Calendar size={14} />
                  Created: {new Date(ticket.date).toLocaleString()}
                </div>
                <div style={{
                  ...typography.small,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs
                }}>
                  <Clock size={14} />
                  Updated: {new Date(ticket.lastUpdate).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            background: colors.white,
            borderRadius: '12px',
            boxShadow: `0 4px 12px ${colors.gray400}40`,
            border: `2px solid ${colors.gray200}`,
            marginBottom: spacing.lg,
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: spacing.lg,
              borderBottom: `2px solid ${colors.gray200}`,
              background: colors.gray100
            }}>
              <h3 style={{
                ...typography.sectionTitle,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                <MessageCircle size={20} />
                Conversation History
              </h3>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: spacing.lg
            }}>
              {ticket.messages.map((message, index) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: spacing.lg,
                    display: 'flex',
                    flexDirection: message.sender === 'customer' ? 'row-reverse' : 'row',
                    gap: spacing.md
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: message.sender === 'customer' ? colors.primary : colors.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={20} color={colors.white} />
                  </div>
                  <div style={{
                    flex: 1,
                    maxWidth: '70%'
                  }}>
                    <div style={{
                      ...typography.small,
                      marginBottom: spacing.xs,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      justifyContent: message.sender === 'customer' ? 'flex-end' : 'flex-start'
                    }}>
                      <span style={{ fontWeight: '600' }}>
                        {message.sender === 'customer' ? 'You' : 'Support Team'}
                      </span>
                      <span>{new Date(message.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{
                      background: message.sender === 'customer' ? colors.primary : colors.gray100,
                      color: message.sender === 'customer' ? colors.white : colors.gray900,
                      padding: spacing.md,
                      borderRadius: message.sender === 'customer' 
                        ? '12px 12px 4px 12px' 
                        : '12px 12px 12px 4px',
                      ...typography.body
                    }}>
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              {isSending && (
                <div style={{
                  display: 'flex',
                  gap: spacing.md
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: colors.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={20} color={colors.white} />
                  </div>
                  <div style={{
                    background: colors.gray100,
                    padding: spacing.md,
                    borderRadius: '12px 12px 12px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm
                  }}>
                    <Loader2 size={16} color={colors.gray600} style={{
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ ...typography.body }}>Support is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reply Section */}
            <div style={{
              borderTop: `2px solid ${colors.gray200}`,
              padding: spacing.lg,
              background: colors.gray100
            }}>
              <div style={{
                display: 'flex',
                gap: spacing.md
              }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={ticket.status === 'closed' || ticket.status === 'resolved'}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    border: `2px solid ${colors.gray300}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px',
                    maxHeight: '200px',
                    outline: 'none',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    transition: 'all 0.2s',
                    backgroundColor: ticket.status === 'closed' || ticket.status === 'resolved' 
                      ? colors.gray200 
                      : colors.white
                  }}
                  onFocus={(e) => {
                    if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.gray300
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.sm
                }}>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending || ticket.status === 'closed' || ticket.status === 'resolved'}
                    style={{
                      background: newMessage.trim() && !isSending && ticket.status !== 'closed' && ticket.status !== 'resolved'
                        ? colors.primary
                        : colors.gray400,
                      color: colors.white,
                      padding: `${spacing.md} ${spacing.lg}`,
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: newMessage.trim() && !isSending && ticket.status !== 'closed' && ticket.status !== 'resolved'
                        ? 'pointer'
                        : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (newMessage.trim() && !isSending && ticket.status !== 'closed' && ticket.status !== 'resolved') {
                        e.currentTarget.style.background = colors.primaryDark
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newMessage.trim() && !isSending && ticket.status !== 'closed' && ticket.status !== 'resolved') {
                        e.currentTarget.style.background = colors.primary
                      }
                    }}
                  >
                    <Send size={16} />
                    Send
                  </button>
                  <button
                    style={{
                      background: 'transparent',
                      color: colors.gray600,
                      padding: spacing.sm,
                      border: `2px solid ${colors.gray300}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.gray400
                      e.currentTarget.style.background = colors.gray100
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.gray300
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Paperclip size={16} />
                  </button>
                </div>
              </div>
              {(ticket.status === 'closed' || ticket.status === 'resolved') && (
                <div style={{
                  marginTop: spacing.md,
                  padding: spacing.md,
                  background: colors.successLight,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm
                }}>
                  <Info size={16} color={colors.successDark} />
                  <span style={{ ...typography.body, color: colors.successDark }}>
                    This ticket has been {ticket.status}. If you need further assistance, please create a new ticket.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}