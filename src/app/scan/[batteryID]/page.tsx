import React from 'react'
import { Metadata } from 'next'
import { Shield, Building, Phone, Mail, MapPin, AlertCircle, Calendar, Hash, Package, Flag, Check } from 'lucide-react'

// This would come from your database
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

interface PageProps {
  params: {
    batteryID: string
  }
}

// Mock function - replace with actual API call
async function getBatteryData(batteryId: string): Promise<BatteryData | null> {
  // This would be your actual database query
  return {
    batteryId: batteryId,
    companyName: "Boston Construction Co.",
    phoneNumber: "(617) 555-0123",
    email: "info@bostonconstructionco.com",
    address: "123 Main St, Boston, MA 02111",
    registrationDate: "January 15, 2024",
    warrantyDate: "January 15, 2026",
    serialNumber: "FV-2024-001234",
    batteryModel: "FlexVolt 9Ah",
    status: "active"
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const battery = await getBatteryData(params.batteryID)
  
  return {
    title: battery ? `Battery Verification - ${battery.companyName} | Battery Department` : 'Battery Verification | Battery Department',
    description: 'This battery is registered and protected by Battery Department\'s theft-proof system',
    openGraph: {
      images: [`/api/og-image/${params.batteryID}`],
    },
  }
}

export default async function BatteryScanPage({ params }: PageProps) {
  const battery = await getBatteryData(params.batteryID)
  
  if (!battery) {
    return <NotFoundView batteryId={params.batteryID} />
  }

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
        padding: '16px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <a href="https://batterydpt.com" style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#006FEE',
            textDecoration: 'none'
          }}>
            Battery Department
          </a>
          
          <div style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Shield size={16} />
            Verified Protected Battery
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
        padding: '60px 20px 40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '16px',
          lineHeight: 1.2
        }}>
          This Battery is Protected
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#6B7280',
          marginBottom: '32px'
        }}>
          Scanned on {scanDate} at {scanTime}
        </p>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          border: '2px solid #E5E7EB',
          fontSize: '16px',
          fontFamily: 'monospace'
        }}>
          <span style={{ color: '#6B7280' }}>Battery ID:</span>
          <strong style={{ color: '#111827' }}>{battery.batteryId}</strong>
        </div>
      </section>

      {/* Ownership Card */}
      <section style={{ 
        maxWidth: '800px',
        margin: '0 auto -40px',
        position: 'relative',
        zIndex: 10,
        padding: '0 20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          padding: '48px',
          border: '1px solid #E5E7EB'
        }}>
          {/* Owner Section */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: '#EFF6FF',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Building size={48} color="#006FEE" />
            </div>
            
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              Registered Owner
            </p>
            
            <h2 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '8px'
            }}>
              {battery.companyName}
            </h2>
            
            <p style={{
              fontSize: '16px',
              color: '#6B7280'
            }}>
              Protected since {battery.registrationDate}
            </p>
          </div>

          {/* Contact Section */}
          <div style={{
            marginTop: '40px',
            paddingTop: '40px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '24px'
            }}>
              Contact Information
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {/* Phone Card */}
              <ContactCard
                icon={<Phone size={20} />}
                label="Phone"
                value={battery.phoneNumber}
                link={`tel:${battery.phoneNumber}`}
                action="Call Now"
              />
              
              {/* Email Card */}
              <ContactCard
                icon={<Mail size={20} />}
                label="Email"
                value={battery.email}
                link={`mailto:${battery.email}`}
                action="Send Email"
              />
              
              {/* Address Card */}
              <ContactCard
                icon={<MapPin size={20} />}
                label="Address"
                value={battery.address}
                link={`https://maps.google.com/?q=${encodeURIComponent(battery.address)}`}
                action="Get Directions"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Action Section */}
      <section style={{
        background: '#F9FAFB',
        padding: '80px 20px',
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#FEF3C7',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <AlertCircle size={32} color="#F59E0B" />
          </div>
          
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '16px'
          }}>
            Found This Battery?
          </h2>
          
          <p style={{
            fontSize: '16px',
            color: '#6B7280',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            If you've found this battery, please contact the owner using the information above. 
            This battery is protected by our theft-prevention system.
          </p>
          
          <button
            onClick={() => {/* Open report modal */}}
            style={{
              background: '#10B981',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Flag size={20} />
            Report Found Battery
          </button>
        </div>
      </section>

      {/* Verification Details */}
      <section style={{
        background: 'white',
        padding: '60px 20px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Verification Details
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <VerificationCard
              icon={<Shield size={24} />}
              title="Protected Status"
              value="Active"
              status="success"
            />
            
            <VerificationCard
              icon={<Calendar size={24} />}
              title="Warranty Status"
              value={`Valid until ${battery.warrantyDate}`}
              status="active"
            />
            
            <VerificationCard
              icon={<Hash size={24} />}
              title="Serial Number"
              value={battery.serialNumber}
              status="neutral"
            />
            
            <VerificationCard
              icon={<Package size={24} />}
              title="Battery Model"
              value={battery.batteryModel}
              status="neutral"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #006FEE 0%, #0050B3 100%)',
        padding: '80px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          Protect Your Tools
        </h2>
        
        <p style={{
          fontSize: '18px',
          marginBottom: '32px',
          opacity: 0.9
        }}>
          Join thousands of contractors using our theft-proof battery system
        </p>
        
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a
            href="/order"
            style={{
              background: 'white',
              color: '#006FEE',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Order Protected Batteries
          </a>
          
          <a
            href="/how-it-works"
            style={{
              background: 'transparent',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              border: '2px solid white',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#111827',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '8px'
        }}>
          Battery Department LLC
        </p>
        
        <p style={{
          fontSize: '14px',
          color: '#9CA3AF',
          marginBottom: '24px'
        }}>
          © 2024 Battery Department. All rights reserved.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          fontSize: '14px'
        }}>
          <a href="/privacy" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
            Privacy Policy
          </a>
          <a href="/terms" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
            Terms of Service
          </a>
          <a href="/support" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
            Contact Support
          </a>
        </div>
      </footer>
    </div>
  )
}

// Contact Card Component
function ContactCard({ icon, label, value, link, action }: {
  icon: React.ReactNode
  label: string
  value: string
  link: string
  action: string
}) {
  return (
    <div style={{
      background: '#F9FAFB',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          color: '#006FEE',
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
            marginBottom: '4px'
          }}>
            {label}
          </p>
          
          <p style={{
            fontSize: '16px',
            color: '#111827',
            fontWeight: 500,
            marginBottom: '8px'
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
          color: '#006FEE',
          fontSize: '14px',
          fontWeight: 500,
          textDecoration: 'none'
        }}
      >
        {action} →
      </a>
    </div>
  )
}

// Verification Card Component
function VerificationCard({ icon, title, value, status }: {
  icon: React.ReactNode
  title: string
  value: string
  status: 'success' | 'active' | 'neutral'
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
      padding: '24px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center'
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
        marginBottom: '4px'
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

// Not Found View
function NotFoundView({ batteryId }: { batteryId: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div>
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
          The battery ID <strong>{batteryId}</strong> is not registered in our system.
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
            display: 'inline-block'
          }}
        >
          Return to Home
        </a>
      </div>
    </div>
  )
}