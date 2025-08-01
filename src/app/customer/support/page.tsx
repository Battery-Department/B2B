'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  HelpCircle,
  MessageCircle,
  FileText,
  Mail,
  Clock,
  ChevronDown,
  ChevronRight,
  Star,
  Send,
  Paperclip,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Shield,
  Truck,
  Package,
  CreditCard,
  User,
  Plus,
  Battery,
  ExternalLink,
  ThumbsUp,
  ThumbsDown
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

interface Ticket {
  id: string
  subject: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  date: string
  lastUpdate: string
  description: string
}

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  helpful: number
  notHelpful: number
  expanded?: boolean
}

export default function SupportPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('tickets')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: ''
  })
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Load tickets from localStorage
  const [tickets, setTickets] = useState<Ticket[]>([])

  // FAQ data
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: 1,
      question: 'What is the warranty period for FlexVolt batteries?',
      answer: 'All FlexVolt batteries come with a comprehensive 12-month warranty covering manufacturing defects and performance issues. The warranty includes free replacement and covers normal wear and tear.',
      category: 'Warranty',
      helpful: 24,
      notHelpful: 2
    },
    {
      id: 2,
      question: 'How do volume discounts work?',
      answer: 'Volume discounts are automatically applied based on your order total: 10% off at $1,000+, 15% off at $2,500+, and 20% off at $5,000+. Discounts apply to the entire order and can be combined with promotional offers.',
      category: 'Pricing',
      helpful: 31,
      notHelpful: 1
    },
    {
      id: 3,
      question: 'What tools are compatible with FlexVolt batteries?',
      answer: 'FlexVolt batteries are compatible with all DeWalt 20V MAX and 60V MAX tools. They automatically switch between 20V and 60V depending on the tool, providing maximum versatility for your projects.',
      category: 'Technical',
      helpful: 18,
      notHelpful: 0
    },
    {
      id: 4,
      question: 'How long does shipping take?',
      answer: 'We offer free standard shipping (3-5 business days) on all orders over $500. Expedited shipping options include 2-day ($15) and overnight ($35) delivery. Orders placed before 2 PM EST ship the same day.',
      category: 'Shipping',
      helpful: 27,
      notHelpful: 3
    },
    {
      id: 5,
      question: 'Can I return or exchange batteries?',
      answer: 'Yes, we offer a 30-day return policy for unused batteries in original packaging. Defective batteries can be exchanged under warranty. Return shipping is free for defective items.',
      category: 'Returns',
      helpful: 15,
      notHelpful: 1
    },
    {
      id: 6,
      question: 'How do I track my order?',
      answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also check your order status in the Order History section of your account dashboard.',
      category: 'Orders',
      helpful: 22,
      notHelpful: 0
    }
  ])

  useEffect(() => {
    setIsVisible(true)
    
    // Load tickets from localStorage
    const savedTickets = localStorage.getItem('supportTickets')
    if (savedTickets) {
      setTickets(JSON.parse(savedTickets))
    }
  }, [])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return colors.error
      case 'in-progress': return colors.warning
      case 'resolved': return colors.success
      case 'closed': return colors.gray600
      default: return colors.gray600
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626'
      case 'high': return '#EA580C'
      case 'medium': return '#CA8A04'
      case 'low': return '#65A30D'
      default: return colors.gray600
    }
  }

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFaq = (id: number) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
    ))
  }

  const submitTicket = () => {
    const ticket: Ticket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: newTicket.subject,
      status: 'open',
      priority: newTicket.priority as any,
      category: newTicket.category,
      date: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString().split('T')[0],
      description: newTicket.description
    }
    
    const updatedTickets = [ticket, ...tickets]
    setTickets(updatedTickets)
    localStorage.setItem('supportTickets', JSON.stringify(updatedTickets))
    
    setNewTicket({ subject: '', category: '', priority: 'medium', description: '' })
    setShowNewTicket(false)
  }

  const voteFaq = (id: number, helpful: boolean) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === id 
        ? { 
            ...faq, 
            helpful: helpful ? faq.helpful + 1 : faq.helpful,
            notHelpful: !helpful ? faq.notHelpful + 1 : faq.notHelpful
          } 
        : faq
    ))
  }

  return (
    <div style={{ 
      backgroundColor: colors.gray100,
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.8s ease-in-out'
    }}>
      {/* Blue Gradient Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        color: colors.white,
        padding: `${spacing.xxl} ${spacing.lg} ${spacing.xl}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.md
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: spacing.md,
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <HelpCircle size={28} />
            </div>
            <h1 style={{
              ...typography.title,
              fontSize: '36px',
              color: colors.white,
              marginBottom: '0'
            }}>
              Support Center
            </h1>
          </div>

          <p style={{
            fontSize: '18px',
            opacity: 0.9,
            lineHeight: '1.6',
            marginBottom: '0',
            color: colors.white
          }}>
            Get help with your FlexVolt battery orders and technical questions
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: spacing.xl
      }}>
        {/* Support Options Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xl
        }}>
          <div style={{
            background: colors.white,
            borderRadius: '12px',
            padding: spacing.lg,
            boxShadow: `0 4px 12px ${colors.gray400}40`,
            border: `2px solid ${colors.gray200}`,
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = `0 8px 24px ${colors.gray400}60`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray400}40`
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: `0 auto ${spacing.md}`,
              boxShadow: `0 4px 12px ${colors.primary}40`
            }}>
              <Mail size={28} color={colors.white} />
            </div>
            <h3 style={{
              ...typography.cardTitle,
              marginBottom: spacing.sm
            }}>
              Email Support
            </h3>
            <p style={{
              ...typography.body,
              marginBottom: spacing.md
            }}>
              Get detailed technical assistance
            </p>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.primary,
              marginBottom: spacing.sm
            }}>
              support@batterydepartment.com
            </div>
            <div style={{
              ...typography.small
            }}>
              Response within 2 hours
            </div>
          </div>

          <div style={{
            background: colors.white,
            borderRadius: '12px',
            padding: spacing.lg,
            boxShadow: `0 4px 12px ${colors.gray400}40`,
            border: `2px solid ${colors.gray200}`,
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = `0 8px 24px ${colors.gray400}60`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray400}40`
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.successDark} 100%)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: `0 auto ${spacing.md}`,
              boxShadow: `0 4px 12px ${colors.success}40`
            }}>
              <FileText size={28} color={colors.white} />
            </div>
            <h3 style={{
              ...typography.cardTitle,
              marginBottom: spacing.sm
            }}>
              Support Tickets
            </h3>
            <p style={{
              ...typography.body,
              marginBottom: spacing.md
            }}>
              Track and manage your support requests
            </p>
            <button
              onClick={() => setActiveTab('tickets')}
              style={{
                background: colors.success,
                color: colors.white,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.successDark
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.success
              }}
            >
              View Tickets
            </button>
            <div style={{
              ...typography.small,
              marginTop: spacing.sm
            }}>
              {tickets.filter(t => t.status === 'open').length} open tickets
            </div>
          </div>

          <div style={{
            background: colors.white,
            borderRadius: '12px',
            padding: spacing.lg,
            boxShadow: `0 4px 12px ${colors.gray400}40`,
            border: `2px solid ${colors.gray200}`,
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = `0 8px 24px ${colors.gray400}60`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray400}40`
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: `linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: `0 auto ${spacing.md}`,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
            }}>
              <MessageCircle size={28} color={colors.white} />
            </div>
            <h3 style={{
              ...typography.cardTitle,
              marginBottom: spacing.sm
            }}>
              Live Chat
            </h3>
            <p style={{
              ...typography.body,
              marginBottom: spacing.md
            }}>
              Instant help from our AI assistant
            </p>
            <button
              onClick={() => router.push('/customer/chat')}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                color: colors.white,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                transition: 'all 0.3s ease',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <MessageCircle size={16} />
              Start Chat
            </button>
            <div style={{
              ...typography.small,
              marginTop: spacing.sm
            }}>
              Available 24/7
            </div>
          </div>
        </div>

        {/* Main Support Content */}
        <div style={{
          background: colors.white,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.gray400}40`,
          border: `2px solid ${colors.gray200}`,
          overflow: 'hidden'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: `2px solid ${colors.gray200}`
          }}>
            <button
              onClick={() => setActiveTab('tickets')}
              style={{
                flex: 1,
                padding: spacing.lg,
                background: activeTab === 'tickets' ? colors.gray100 : 'transparent',
                color: activeTab === 'tickets' ? colors.primary : colors.gray600,
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                transition: 'all 0.2s',
                borderBottom: activeTab === 'tickets' ? `3px solid ${colors.primary}` : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              <FileText size={20} />
              Support Tickets
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              style={{
                flex: 1,
                padding: spacing.lg,
                background: activeTab === 'faq' ? colors.gray100 : 'transparent',
                color: activeTab === 'faq' ? colors.primary : colors.gray600,
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                transition: 'all 0.2s',
                borderBottom: activeTab === 'faq' ? `3px solid ${colors.primary}` : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              <HelpCircle size={20} />
              FAQ
            </button>
          </div>

          {/* Support Tickets Tab */}
          {activeTab === 'tickets' && (
            <div style={{ padding: spacing.xl }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg
              }}>
                <h2 style={{
                  ...typography.sectionTitle,
                  margin: 0
                }}>
                  Your Support Tickets
                </h2>
                <button
                  onClick={() => setShowNewTicket(true)}
                  style={{
                    background: colors.primary,
                    color: colors.white,
                    padding: `${spacing.md} ${spacing.lg}`,
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.primaryDark
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}40`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.primary
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Plus size={16} />
                  New Ticket
                </button>
              </div>

              {/* New Ticket Form */}
              {showNewTicket && (
                <div style={{
                  background: colors.gray100,
                  borderRadius: '12px',
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  border: `2px solid ${colors.gray200}`
                }}>
                  <h3 style={{
                    ...typography.cardTitle,
                    marginBottom: spacing.md
                  }}>
                    Create New Support Ticket
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr',
                    gap: spacing.md,
                    marginBottom: spacing.md
                  }}>
                    <div>
                      <label style={{
                        ...typography.label,
                        display: 'block',
                        marginBottom: spacing.xs
                      }}>
                        Subject *
                      </label>
                      <input
                        type="text"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket(prev => ({...prev, subject: e.target.value}))}
                        placeholder="Brief description of your issue"
                        style={{
                          width: '100%',
                          padding: spacing.md,
                          border: `2px solid ${colors.gray200}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: colors.white,
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.primary
                          e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.gray200
                          e.target.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        ...typography.label,
                        display: 'block',
                        marginBottom: spacing.xs
                      }}>
                        Category *
                      </label>
                      <select
                        value={newTicket.category}
                        onChange={(e) => setNewTicket(prev => ({...prev, category: e.target.value}))}
                        style={{
                          width: '100%',
                          padding: spacing.md,
                          border: `2px solid ${colors.gray200}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: colors.white,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Select Category</option>
                        <option value="Technical">Technical</option>
                        <option value="Billing">Billing</option>
                        <option value="Shipping">Shipping</option>
                        <option value="Returns">Returns</option>
                        <option value="Orders">Orders</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{
                        ...typography.label,
                        display: 'block',
                        marginBottom: spacing.xs
                      }}>
                        Priority
                      </label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket(prev => ({...prev, priority: e.target.value}))}
                        style={{
                          width: '100%',
                          padding: spacing.md,
                          border: `2px solid ${colors.gray200}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: colors.white,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: spacing.md }}>
                    <label style={{
                      ...typography.label,
                      display: 'block',
                      marginBottom: spacing.xs
                    }}>
                      Description *
                    </label>
                    <textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({...prev, description: e.target.value}))}
                      placeholder="Please provide detailed information about your issue..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: spacing.md,
                        border: `2px solid ${colors.gray200}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        background: colors.white,
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primary
                        e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.gray200
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: spacing.md
                  }}>
                    <button
                      onClick={submitTicket}
                      disabled={!newTicket.subject || !newTicket.category || !newTicket.description}
                      style={{
                        background: newTicket.subject && newTicket.category && newTicket.description
                          ? colors.success
                          : colors.gray400,
                        color: colors.white,
                        padding: `${spacing.md} ${spacing.lg}`,
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: newTicket.subject && newTicket.category && newTicket.description ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (newTicket.subject && newTicket.category && newTicket.description) {
                          e.currentTarget.style.background = colors.successDark
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newTicket.subject && newTicket.category && newTicket.description) {
                          e.currentTarget.style.background = colors.success
                        }
                      }}
                    >
                      <Send size={16} />
                      Submit Ticket
                    </button>
                    <button
                      onClick={() => setShowNewTicket(false)}
                      style={{
                        background: 'transparent',
                        color: colors.gray700,
                        padding: `${spacing.md} ${spacing.lg}`,
                        borderRadius: '8px',
                        border: `2px solid ${colors.gray300}`,
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
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
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Tickets List */}
              {tickets.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: `${spacing.xxl} ${spacing.lg}`,
                  color: colors.gray500
                }}>
                  <FileText size={48} style={{ marginBottom: spacing.md, opacity: 0.5 }} />
                  <p style={{ ...typography.body }}>No support tickets yet</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.md
                }}>
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => router.push(`/customer/support/ticket/${ticket.id}`)}
                      style={{
                        background: colors.gray100,
                        borderRadius: '12px',
                        padding: spacing.lg,
                        border: `2px solid ${colors.gray200}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.primary
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray400}40`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.gray200
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: spacing.md
                      }}>
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.md,
                            marginBottom: spacing.sm
                          }}>
                            <span style={{
                              ...typography.cardTitle,
                              fontSize: '16px'
                            }}>
                              {ticket.subject}
                            </span>
                            <span style={{
                              background: `${getStatusColor(ticket.status)}15`,
                              color: getStatusColor(ticket.status),
                              padding: `${spacing.xs} ${spacing.sm}`,
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {ticket.status.replace('-', ' ')}
                            </span>
                            <span style={{
                              background: `${getPriorityColor(ticket.priority)}15`,
                              color: getPriorityColor(ticket.priority),
                              padding: `${spacing.xs} ${spacing.sm}`,
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {ticket.priority}
                            </span>
                          </div>
                          <div style={{
                            ...typography.body,
                            marginBottom: spacing.sm
                          }}>
                            {ticket.description}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.md,
                            ...typography.small
                          }}>
                            <span>#{ticket.id}</span>
                            <span>{ticket.category}</span>
                            <span>Created: {new Date(ticket.date).toLocaleDateString()}</span>
                            <span>Updated: {new Date(ticket.lastUpdate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight size={20} color={colors.gray500} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div style={{ padding: spacing.xl }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg
              }}>
                <h2 style={{
                  ...typography.sectionTitle,
                  margin: 0
                }}>
                  Frequently Asked Questions
                </h2>
              </div>

              {/* Search and Filter */}
              <div style={{
                display: 'flex',
                gap: spacing.md,
                marginBottom: spacing.lg
              }}>
                <div style={{
                  position: 'relative',
                  flex: 1
                }}>
                  <Search 
                    size={20} 
                    color={colors.gray500}
                    style={{
                      position: 'absolute',
                      left: spacing.md,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search FAQs..."
                    style={{
                      width: '100%',
                      padding: `${spacing.md} ${spacing.md} ${spacing.md} ${spacing.xxl}`,
                      border: `2px solid ${colors.gray200}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.gray200
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: spacing.md,
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    minWidth: '150px',
                    cursor: 'pointer',
                    background: colors.white
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="Technical">Technical</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Warranty">Warranty</option>
                  <option value="Returns">Returns</option>
                  <option value="Orders">Orders</option>
                </select>
              </div>

              {/* FAQ Items */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.md
              }}>
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    style={{
                      background: colors.gray100,
                      borderRadius: '12px',
                      border: `2px solid ${colors.gray200}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      style={{
                        width: '100%',
                        padding: spacing.lg,
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.gray200
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span style={{
                        ...typography.body,
                        fontWeight: '600',
                        color: colors.gray900
                      }}>
                        {faq.question}
                      </span>
                      {faq.expanded ? (
                        <ChevronDown size={20} color={colors.primary} />
                      ) : (
                        <ChevronRight size={20} color={colors.gray500} />
                      )}
                    </button>
                    
                    {faq.expanded && (
                      <div style={{
                        padding: `0 ${spacing.lg} ${spacing.lg}`,
                        borderTop: `1px solid ${colors.gray200}`
                      }}>
                        <p style={{
                          ...typography.body,
                          lineHeight: '1.6',
                          marginBottom: spacing.md,
                          paddingTop: spacing.md
                        }}>
                          {faq.answer}
                        </p>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.md
                        }}>
                          <span style={{
                            ...typography.small
                          }}>
                            Was this helpful?
                          </span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.sm
                          }}>
                            <button 
                              onClick={() => voteFaq(faq.id, true)}
                              style={{
                                background: 'none',
                                border: `1px solid ${colors.gray300}`,
                                borderRadius: '6px',
                                padding: `${spacing.xs} ${spacing.sm}`,
                                cursor: 'pointer',
                                color: colors.success,
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.xs,
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = colors.successLight
                                e.currentTarget.style.borderColor = colors.success
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none'
                                e.currentTarget.style.borderColor = colors.gray300
                              }}
                            >
                              <ThumbsUp size={14} />
                              {faq.helpful}
                            </button>
                            <button 
                              onClick={() => voteFaq(faq.id, false)}
                              style={{
                                background: 'none',
                                border: `1px solid ${colors.gray300}`,
                                borderRadius: '6px',
                                padding: `${spacing.xs} ${spacing.sm}`,
                                cursor: 'pointer',
                                color: colors.error,
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.xs,
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = colors.errorLight
                                e.currentTarget.style.borderColor = colors.error
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none'
                                e.currentTarget.style.borderColor = colors.gray300
                              }}
                            >
                              <ThumbsDown size={14} />
                              {faq.notHelpful}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Help Section */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.primary}05 100%)`,
          borderRadius: '12px',
          padding: spacing.xl,
          marginTop: spacing.xl,
          border: `2px solid ${colors.primary}20`
        }}>
          <h3 style={{
            ...typography.sectionTitle,
            textAlign: 'center',
            marginBottom: spacing.md
          }}>
            Need Quick Help?
          </h3>
          <p style={{
            ...typography.body,
            textAlign: 'center',
            marginBottom: spacing.lg
          }}>
            Get instant answers to common questions about FlexVolt batteries
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: spacing.md
          }}>
            {[
              { 
                icon: Package, 
                title: 'Battery Compatibility', 
                desc: 'Check tool compatibility guide',
                tooltip: 'All FlexVolt batteries work with DeWalt 20V/60V MAX tools. Click to view full compatibility chart.',
                action: () => {
                  setShowToast(true)
                  setToastMessage('🔋 FlexVolt batteries are compatible with ALL DeWalt 20V MAX and 60V MAX tools. The voltage automatically switches based on the tool!')
                }
              },
              { 
                icon: Truck, 
                title: 'Shipping Information', 
                desc: 'Track orders and delivery',
                tooltip: 'Free shipping on orders $500+. Standard delivery 3-5 days. Click to track your order.',
                action: () => {
                  router.push('/customer/orders')
                }
              },
              { 
                icon: Shield, 
                title: 'Warranty Claims', 
                desc: 'File warranty claims',
                tooltip: '3-year warranty on all batteries. No questions asked. Click to start a warranty claim.',
                action: () => {
                  setActiveTab('tickets')
                  setShowNewTicket(true)
                  setNewTicket({
                    ...newTicket,
                    category: 'Warranty',
                    subject: 'Warranty Claim Request'
                  })
                }
              },
              { 
                icon: CreditCard, 
                title: 'Billing Support', 
                desc: 'Payment and invoice help',
                tooltip: 'NET 30 terms available. View invoices or update payment methods.',
                action: () => {
                  router.push('/customer/payment')
                }
              }
            ].map((item, index) => (
              <div key={index} style={{
                background: colors.white,
                borderRadius: '12px',
                padding: spacing.lg,
                border: `2px solid ${colors.gray200}`,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onClick={item.action}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${colors.gray400}40`
                e.currentTarget.style.borderColor = colors.primary
                // Show tooltip
                const tooltip = e.currentTarget.querySelector('.tooltip') as HTMLElement
                if (tooltip) {
                  tooltip.style.opacity = '1'
                  tooltip.style.visibility = 'visible'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = colors.gray200
                // Hide tooltip
                const tooltip = e.currentTarget.querySelector('.tooltip') as HTMLElement
                if (tooltip) {
                  tooltip.style.opacity = '0'
                  tooltip.style.visibility = 'hidden'
                }
              }}>
                <item.icon size={24} color={colors.primary} style={{ margin: `0 auto ${spacing.md}` }} />
                <h4 style={{
                  ...typography.label,
                  color: colors.gray900,
                  marginBottom: spacing.xs
                }}>
                  {item.title}
                </h4>
                <p style={{
                  ...typography.small
                }}>
                  {item.desc}
                </p>
                {/* Tooltip */}
                <div className="tooltip" style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: colors.gray900,
                  color: colors.white,
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                  textAlign: 'center',
                  marginBottom: spacing.sm,
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'all 0.3s ease',
                  zIndex: 10,
                  boxShadow: `0 4px 12px ${colors.gray900}40`
                }}>
                  {item.tooltip}
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `6px solid ${colors.gray900}`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: spacing.xl,
          right: spacing.xl,
          background: colors.gray900,
          color: colors.white,
          padding: `${spacing.md} ${spacing.lg}`,
          borderRadius: '12px',
          boxShadow: `0 8px 24px ${colors.gray900}40`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          maxWidth: '400px',
          animation: 'slideInUp 0.3s ease',
          zIndex: 1000
        }}>
          <CheckCircle size={20} color={colors.success} />
          <p style={{ ...typography.body, color: colors.white, margin: 0 }}>
            {toastMessage}
          </p>
          <button
            onClick={() => setShowToast(false)}
            style={{
              background: 'none',
              border: 'none',
              color: colors.white,
              cursor: 'pointer',
              padding: spacing.xs,
              marginLeft: 'auto'
            }}
          >
            ×
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}