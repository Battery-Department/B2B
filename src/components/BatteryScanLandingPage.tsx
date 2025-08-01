'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Building, Phone, Mail, MapPin, AlertCircle, Calendar, Hash, Package, Flag, Check, X, ChevronRight } from 'lucide-react'

// Type definitions
interface BatteryData {
  batteryId: string
  companyName: string
  phoneNumber: string
  email: string
  address: string
  registrationDate: string
  warrantyDate: string
  serialNumber: string
  batteryModel: string
  status: 'active' | 'lost' | 'stolen'
}

interface BatteryScanLandingPageProps {
  batteryId?: string
  mockData?: boolean // For demo purposes
}

export default function BatteryScanLandingPage({ 
  batteryId = 'FV-2024-001234',
  mockData = true 
}: BatteryScanLandingPageProps) {
  const [battery, setBattery] = useState<BatteryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)
  
  // Get URL parameters for demo mode
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlParams(new URLSearchParams(window.location.search))
    }
  }, [])
  
  // Responsive breakpoints
  const isMobile = windowWidth <= 640
  const isTablet = windowWidth > 640 && windowWidth <= 1024
  const isDesktop = windowWidth > 1024

  // Check for window size
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch battery data
  useEffect(() => {
    const fetchBatteryData = async () => {
      if (mockData) {
        // Mock data for demo - check URL params first
        setTimeout(() => {
          const companyName = urlParams?.get('company') || "Boston Construction Co."
          const phone = urlParams?.get('phone') || "(617) 555-0123"
          const email = urlParams?.get('email') || "info@bostonconstructionco.com"
          const customBatteryId = urlParams?.get('batteryId') || batteryId
          
          setBattery({
            batteryId: customBatteryId,
            companyName: companyName,
            phoneNumber: phone,
            email: email,
            address: "123 Main St, Boston, MA 02111",
            registrationDate: "January 15, 2024",
            warrantyDate: "January 15, 2026",
            serialNumber: customBatteryId,
            batteryModel: "FlexVolt 9Ah",
            status: "active"
          })
          setLoading(false)
        }, 1000)
      } else {
        // Real API call
        try {
          const response = await fetch(`/api/battery/${batteryId}`)
          const data = await response.json()
          setBattery(data)
        } catch (error) {
          console.error('Error fetching battery data:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchBatteryData()
  }, [batteryId, mockData, urlParams])

  const scanDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
  
  const scanTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })

  if (loading) {
    return <LoadingView />
  }

  if (!battery) {
    return <NotFoundView batteryId={batteryId} />
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#F9FAFB',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: isMobile ? '60px' : isTablet ? '70px' : '80px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: isDesktop ? '1400px' : '100%',
          width: '100%',
          margin: '0 auto',
          padding: isMobile ? '0 12px' : isTablet ? '0 16px' : '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: isMobile ? '18px' : isTablet ? '20px' : '24px',
            fontWeight: 700,
            color: '#006FEE',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            cursor: 'default'
          }}>
            <div style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              background: 'linear-gradient(135deg, #006FEE 0%, #0050B3 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold', color: 'white' }}>B</span>
            </div>
            {!isMobile && 'Battery Department'}
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            padding: isMobile ? '8px 16px' : isTablet ? '10px 20px' : '12px 24px',
            borderRadius: '100px',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
          }}>
            <Shield size={16} />
            {isMobile ? 'Verified' : 'Verified Protected Battery'}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
        padding: isMobile ? '40px 16px 60px' : isTablet ? '60px 20px 80px' : '80px 24px 100px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: isMobile ? '100%' : isTablet ? '700px' : '900px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: isMobile ? '32px' : isTablet ? '42px' : '56px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '16px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em'
          }}>
            This Battery is Owned By {battery.companyName}
          </h1>
          
          <p style={{
            fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
            color: '#6B7280',
            marginBottom: '32px',
            lineHeight: 1.5
          }}>
            Scanned on {scanDate} at {scanTime}
          </p>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: isMobile ? '10px 20px' : isTablet ? '12px 24px' : '14px 28px',
            borderRadius: '12px',
            border: '2px solid #E5E7EB',
            fontSize: isMobile ? '14px' : isTablet ? '16px' : '18px',
            fontFamily: 'monospace',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <span style={{ color: '#6B7280', fontSize: 'inherit' }}>Battery ID:</span>
            <strong style={{ color: '#111827', fontSize: 'inherit' }}>{battery.batteryId}</strong>
          </div>
          
          {/* 360 Battery Video - Only show when loaded in iframe/modal */}
          {urlParams?.get('demo') === 'true' && (
            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                loading="lazy"
                style={{
                  width: isMobile ? '200px' : isTablet ? '250px' : '300px',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                <source src="/dew-plate.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </section>

      {/* Ownership Card */}
      <section style={{ 
        background: 'white',
        paddingTop: '0',
        paddingBottom: isMobile ? '40px' : isTablet ? '60px' : '80px'
      }}>
        <div style={{
          maxWidth: isMobile ? 'calc(100% - 32px)' : isTablet ? '90%' : '900px',
          margin: '0 auto',
          position: 'relative',
          transform: 'translateY(-40px)',
          padding: isMobile ? '0 16px' : '0 20px'
        }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.06)' : '0 10px 40px rgba(0,0,0,0.08)',
          padding: isMobile ? '24px' : isTablet ? '40px' : '56px',
          border: 'none'
        }}>
          {/* Owner Section */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: isMobile ? '56px' : isTablet ? '64px' : '72px',
              height: isMobile ? '56px' : isTablet ? '64px' : '72px',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.15)'
            }}>
              <Building size={isMobile ? 32 : isTablet ? 40 : 48} color="#006FEE" strokeWidth={1.5} />
            </div>
            
            <p style={{
              fontSize: isMobile ? '12px' : '14px',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              fontWeight: 600
            }}>
              Registered Owner
            </p>
            
            <h2 style={{
              fontSize: isMobile ? '24px' : isTablet ? '32px' : '40px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              {battery.companyName}
            </h2>
            
            <p style={{
              fontSize: isMobile ? '14px' : '16px',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Check size={16} color="#10B981" strokeWidth={2.5} />
              Protected since {battery.registrationDate}
            </p>
          </div>

          {/* Contact Section */}
          <div style={{
            marginTop: isMobile ? '32px' : '40px',
            paddingTop: isMobile ? '32px' : '40px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: isMobile ? '20px' : '24px',
              textAlign: 'center'
            }}>
              Contact Information
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: isMobile ? '12px' : isTablet ? '16px' : '20px'
            }}>
              {/* Phone Card */}
              <ContactCard
                icon={<Phone size={isMobile ? 18 : 20} />}
                label="Phone"
                value={battery.phoneNumber}
                link={`tel:${battery.phoneNumber}`}
                action="Call Now"
                primaryColor="#006FEE"
                isMobile={isMobile}
                isTablet={isTablet}
              />
              
              {/* Email Card */}
              <ContactCard
                icon={<Mail size={isMobile ? 18 : 20} />}
                label="Email"
                value={battery.email}
                link={`mailto:${battery.email}`}
                action="Send Email"
                primaryColor="#006FEE"
                isMobile={isMobile}
                isTablet={isTablet}
              />
              
              {/* Address Card */}
              <ContactCard
                icon={<MapPin size={isMobile ? 18 : 20} />}
                label="Address"
                value={battery.address}
                link={`https://maps.google.com/?q=${encodeURIComponent(battery.address)}`}
                action="Get Directions"
                primaryColor="#006FEE"
                isMobile={isMobile}
                isTablet={isTablet}
              />
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Action Section */}
      <section style={{
        background: 'white',
        padding: isMobile ? '40px 16px' : isTablet ? '50px 20px' : '60px 24px',
        marginTop: '0'
      }}>
        <div style={{
          maxWidth: isMobile ? '100%' : isTablet ? '500px' : '600px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '24px',
          padding: isMobile ? '32px 24px' : isTablet ? '40px 32px' : '48px 40px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          border: 'none'
        }}>
          <div style={{
            width: isMobile ? '48px' : isTablet ? '56px' : '64px',
            height: isMobile ? '48px' : isTablet ? '56px' : '64px',
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
          }}>
            <AlertCircle size={isMobile ? 24 : isTablet ? 28 : 32} color="#F59E0B" strokeWidth={2} />
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Found This Battery?
          </h2>
          
          <p style={{
            fontSize: isMobile ? '15px' : isTablet ? '16px' : '18px',
            color: '#6B7280',
            lineHeight: 1.6,
            marginBottom: '32px',
            maxWidth: '500px',
            margin: '0 auto 32px',
            textAlign: 'center'
          }}>
            If you've found this battery, please contact the owner using the information above. 
            This battery is protected by our theft-prevention system.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                padding: isMobile ? '14px 28px' : isTablet ? '16px 32px' : '18px 40px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                width: isMobile ? '100%' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                }
              }}
            >
              <Flag size={20} />
              Report Found Battery
            </button>
          </div>
        </div>
      </section>

      {/* Verification Details */}
      <section style={{
        background: 'white',
        padding: isMobile ? '40px 16px' : isTablet ? '60px 20px' : '80px 24px'
      }}>
        <div style={{ 
          maxWidth: isMobile ? '100%' : isTablet ? '90%' : '1200px', 
          margin: '0 auto' 
        }}>
          <h2 style={{
            fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
            fontWeight: 700,
            color: '#111827',
            textAlign: 'center',
            marginBottom: isMobile ? '32px' : '40px'
          }}>
            Verification Details
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '16px' : isTablet ? '20px' : '24px',
            maxWidth: isDesktop ? '1000px' : '100%',
            margin: '0 auto'
          }}>
            <VerificationCard
              icon={<Shield size={isMobile ? 20 : isTablet ? 22 : 24} />}
              title="Protected Status"
              value="Active"
              status="success"
              isMobile={isMobile}
              isTablet={isTablet}
            />
            
            <VerificationCard
              icon={<Calendar size={isMobile ? 20 : isTablet ? 22 : 24} />}
              title="Warranty Status"
              value={`Valid until ${battery.warrantyDate}`}
              status="active"
              isMobile={isMobile}
              isTablet={isTablet}
            />
            
            <VerificationCard
              icon={<Hash size={isMobile ? 20 : isTablet ? 22 : 24} />}
              title="Serial Number"
              value={battery.serialNumber}
              status="neutral"
              isMobile={isMobile}
              isTablet={isTablet}
            />
            
            <VerificationCard
              icon={<Package size={isMobile ? 20 : isTablet ? 22 : 24} />}
              title="Battery Model"
              value={battery.batteryModel}
              status="neutral"
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </div>
        </div>
      </section>


      {/* Report Modal */}
      {showReportModal && (
        <ReportFoundModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          batteryId={battery.batteryId}
        />
      )}
    </div>
  )
}

// Contact Card Component
function ContactCard({ icon, label, value, link, action, primaryColor, isMobile, isTablet }: {
  icon: React.ReactNode
  label: string
  value: string
  link: string
  action: string
  primaryColor: string
  isMobile?: boolean
  isTablet?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      style={{
        background: '#F9FAFB',
        padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          color: primaryColor,
          flexShrink: 0
        }}>
          {icon}
        </div>
        
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '12px',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
            fontWeight: 600
          }}>
            {label}
          </p>
          
          <p style={{
            fontSize: '16px',
            color: '#111827',
            fontWeight: 500,
            marginBottom: '8px',
            wordBreak: 'break-word'
          }}>
            {value}
          </p>
        </div>
      </div>
      
      <a
        href={link}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: primaryColor,
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'gap 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.gap = '8px'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.gap = '4px'
        }}
      >
        {action} <ChevronRight size={16} />
      </a>
    </div>
  )
}

// Verification Card Component
function VerificationCard({ icon, title, value, status, isMobile, isTablet }: {
  icon: React.ReactNode
  title: string
  value: string
  status: 'success' | 'active' | 'neutral'
  isMobile?: boolean
  isTablet?: boolean
}) {
  const statusColors = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', icon: '#10B981', text: '#059669' },
    active: { bg: '#EFF6FF', border: '#C7D2FE', icon: '#006FEE', text: '#2563EB' },
    neutral: { bg: '#F9FAFB', border: '#E5E7EB', icon: '#6B7280', text: '#374151' }
  }
  
  const colors = statusColors[status]
  
  return (
    <div style={{
      background: colors.bg,
      padding: isMobile ? '20px' : isTablet ? '24px' : '32px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center',
      transition: 'all 0.3s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        color: colors.icon,
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      
      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '4px',
        fontWeight: 500
      }}>
        {title}
      </p>
      
      <p style={{
        fontSize: '16px',
        fontWeight: 600,
        color: colors.text
      }}>
        {value}
      </p>
    </div>
  )
}

// Loading View
function LoadingView() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F9FAFB'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #E5E7EB',
          borderTopColor: '#006FEE',
          borderRadius: '50%',
          margin: '0 auto 24px',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6B7280', fontSize: '16px' }}>Verifying battery...</p>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Not Found View
function NotFoundView({ batteryId }: { batteryId: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
      background: '#F9FAFB'
    }}>
      <div>
        <div style={{
          width: '80px',
          height: '80px',
          background: '#FEE2E2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <X size={40} color="#EF4444" />
        </div>
        
        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '16px'
        }}>
          Battery Not Found
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#6B7280',
          marginBottom: '32px'
        }}>
          The battery ID <strong style={{ fontFamily: 'monospace' }}>{batteryId}</strong> is not registered in our system.
        </p>
        
        <a
          href="/"
          style={{
            background: '#006FEE',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0050B3'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#006FEE'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Return to Home
        </a>
      </div>
    </div>
  )
}

// Report Found Modal Component
function ReportFoundModal({ isOpen, onClose, batteryId }: {
  isOpen: boolean
  onClose: () => void
  batteryId: string
}) {
  const [formData, setFormData] = useState({
    finder_name: '',
    finder_phone: '',
    location_found: '',
    additional_info: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setShowSuccess(true)
      setTimeout(() => {
        onClose()
        setShowSuccess(false)
        setFormData({
          finder_name: '',
          finder_phone: '',
          location_found: '',
          additional_info: ''
        })
      }, 3000)
      setIsSubmitting(false)
    }, 1500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px 24px 0',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #D1FAE5 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Flag size={24} color="#10B981" />
                </div>
                <div>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#111827'
                  }}>
                    Report Found Battery
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>
                    Battery ID: {batteryId}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  transition: 'color 0.2s ease',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#111827'
                  e.currentTarget.style.background = '#F3F4F6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6B7280'
                  e.currentTarget.style.background = 'none'
                }}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #F0FDF4 0%, #D1FAE5 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'scaleIn 0.3s ease-out'
              }}>
                <Check size={40} color="#10B981" strokeWidth={3} />
              </div>
              
              <h3 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '12px'
              }}>
                Thank You!
              </h3>
              
              <p style={{
                fontSize: '16px',
                color: '#6B7280'
              }}>
                The owner has been notified.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {/* Name Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Your Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="finder_name"
                  value={formData.finder_name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: '#F9FAFB',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#006FEE'
                    e.target.style.background = 'white'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB'
                    e.target.style.background = '#F9FAFB'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Phone Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Your Phone Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="finder_phone"
                  value={formData.finder_phone}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: '#F9FAFB',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#006FEE'
                    e.target.style.background = 'white'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB'
                    e.target.style.background = '#F9FAFB'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Location Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Where did you find this battery? <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  name="location_found"
                  value={formData.location_found}
                  onChange={handleChange}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: '#F9FAFB',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#006FEE'
                    e.target.style.background = 'white'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB'
                    e.target.style.background = '#F9FAFB'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Additional Info Field */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Additional Information
                </label>
                <textarea
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: '#F9FAFB',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#006FEE'
                    e.target.style.background = 'white'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB'
                    e.target.style.background = '#F9FAFB'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Submit Button */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#6B7280',
                    background: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB'
                    e.currentTarget.style.borderColor = '#D1D5DB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'white',
                    background: isSubmitting ? '#9CA3AF' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }
                  }}
                >
                  <Flag size={20} />
                  {isSubmitting ? 'Sending...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}