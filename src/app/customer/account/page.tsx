'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Shield, 
  Key, 
  Smartphone, 
  Download, 
  Database,
  Clock,
  FileText,
  Lock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { AccountTabs, ProfileTab, CompanyTab, PreferencesTab } from '@/components/account/AccountTabs'

export default function AccountPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState({
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@constructionco.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Project Manager',
    department: 'Operations',
    joinDate: '2023-01-15',
    tier: 'Gold Partner'
  })

  const handleUserUpdate = (updatedData: any) => {
    setUser(prev => ({ ...prev, ...updatedData }))
    // Here you would typically call an API to update the user data
    console.log('User updated:', updatedData)
  }

  // Security Tab Component
  const SecurityTab = () => {
    const [securitySettings, setSecuritySettings] = useState({
      twoFactorEnabled: true,
      loginAlerts: true,
      sessionTimeout: 30,
      lastPasswordChange: '2024-11-15'
    })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Security Overview */}
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #E6F4FF',
          boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Shield size={20} color="#10B981" />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0A051E' }}>
              Security Overview
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: securitySettings.twoFactorEnabled ? '#F0FDF4' : '#FEF2F2',
              borderRadius: '12px',
              border: `1px solid ${securitySettings.twoFactorEnabled ? '#D1FAE5' : '#FECACA'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Smartphone size={16} color={securitySettings.twoFactorEnabled ? '#10B981' : '#EF4444'} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                  Two-Factor Authentication
                </span>
              </div>
              <p style={{ 
                fontSize: '13px', 
                color: securitySettings.twoFactorEnabled ? '#10B981' : '#EF4444',
                fontWeight: '600'
              }}>
                {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#F0F9FF',
              borderRadius: '12px',
              border: '1px solid #E0F2FE'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Key size={16} color="#0284C7" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                  Password Security
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#0284C7', fontWeight: '600' }}>
                Strong
              </p>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#FEF3C7',
              borderRadius: '12px',
              border: '1px solid #FDE68A'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={16} color="#F59E0B" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                  Session Timeout
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '600' }}>
                {securitySettings.sessionTimeout} minutes
              </p>
            </div>
          </div>
        </div>

        {/* Password Management */}
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #E6F4FF',
          boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
            Password Management
          </h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#0A051E', marginBottom: '4px' }}>
                Last password change: {new Date(securitySettings.lastPasswordChange).toLocaleDateString()}
              </p>
              <p style={{ fontSize: '13px', color: '#5B6B7D' }}>
                We recommend changing your password every 90 days
              </p>
            </div>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#006FEE',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0059D1'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#006FEE'}
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #E6F4FF',
          boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
            Two-Factor Authentication
          </h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#0A051E', marginBottom: '4px' }}>
                Add an extra layer of security to your account
              </p>
              <p style={{ fontSize: '13px', color: '#5B6B7D' }}>
                {securitySettings.twoFactorEnabled ? 
                  'Two-factor authentication is currently enabled' : 
                  'Two-factor authentication is currently disabled'
                }
              </p>
            </div>
            <button 
              onClick={() => setSecuritySettings(prev => ({ 
                ...prev, 
                twoFactorEnabled: !prev.twoFactorEnabled 
              }))}
              style={{
                padding: '10px 20px',
                backgroundColor: securitySettings.twoFactorEnabled ? '#EF4444' : '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Data Export Tab Component
  const DataExportTab = () => {
    const [exportHistory, setExportHistory] = useState([
      { id: 1, type: 'Account Data', date: '2024-11-01', status: 'completed', size: '2.4 MB' },
      { id: 2, type: 'Order History', date: '2024-10-15', status: 'completed', size: '890 KB' },
      { id: 3, type: 'Usage Analytics', date: '2024-10-01', status: 'processing', size: '-' }
    ])

    const handleExport = (type: string) => {
      console.log(`Exporting ${type}...`)
      // Add to export history
      setExportHistory(prev => [
        {
          id: Date.now(),
          type,
          date: new Date().toISOString().split('T')[0],
          status: 'processing',
          size: '-'
        },
        ...prev
      ])
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Export Options */}
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #E6F4FF',
          boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Download size={20} color="#006FEE" />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0A051E' }}>
              Export Your Data
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {[
              { type: 'Account Data', description: 'Personal information, preferences, and settings', icon: <Database size={20} /> },
              { type: 'Order History', description: 'Complete history of orders, invoices, and payments', icon: <FileText size={20} /> },
              { type: 'Usage Analytics', description: 'Battery usage patterns and performance data', icon: <Clock size={20} /> }
            ].map((item) => (
              <div key={item.type} style={{
                padding: '20px',
                border: '1px solid #F3F4F6',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#006FEE'
                e.currentTarget.style.backgroundColor = '#F8FBFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#F3F4F6'
                e.currentTarget.style.backgroundColor = 'white'
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#E6F4FF',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {React.cloneElement(item.icon, { color: '#006FEE' })}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#0A051E', marginBottom: '4px' }}>
                      {item.type}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#5B6B7D' }}>
                      {item.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(item.type)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#006FEE',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0059D1'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#006FEE'}
                >
                  Export {item.type}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Export History */}
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #E6F4FF',
          boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
            Export History
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {exportHistory.map((item) => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                border: '1px solid #F3F4F6',
                borderRadius: '8px'
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E', marginBottom: '4px' }}>
                    {item.type}
                  </p>
                  <p style={{ fontSize: '13px', color: '#5B6B7D' }}>
                    {new Date(item.date).toLocaleDateString()} • {item.size}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.status === 'completed' ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <AlertTriangle size={16} color="#F59E0B" />
                  )}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: item.status === 'completed' ? '#10B981' : '#F59E0B',
                    textTransform: 'capitalize'
                  }}>
                    {item.status}
                  </span>
                  {item.status === 'completed' && (
                    <button style={{
                      marginLeft: '12px',
                      padding: '6px 12px',
                      backgroundColor: '#F3F4F6',
                      color: '#5B6B7D',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E6F4FF'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab user={user} onUpdate={handleUserUpdate} />
      case 'company':
        return <CompanyTab />
      case 'preferences':
        return <PreferencesTab />
      case 'security':
        return <SecurityTab />
      case 'data':
        return <DataExportTab />
      default:
        return <ProfileTab user={user} onUpdate={handleUserUpdate} />
    }
  }

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0048AC 0%, #006FEE 50%, #0084FF 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 24px rgba(0, 111, 238, 0.15)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button
              onClick={() => router.push('/customer/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>
          </div>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '8px'
          }}>
            Account Settings
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>
            Manage your profile, company information, and preferences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <AccountTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {renderTabContent()}
      </div>
    </div>
  )
}