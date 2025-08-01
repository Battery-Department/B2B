'use client'

import React, { useState } from 'react'
import { 
  User, 
  Building, 
  Settings, 
  Shield, 
  Download,
  Camera,
  Edit,
  Save,
  X,
  Bell,
  Globe,
  Clock,
  Key,
  Smartphone,
  Database
} from 'lucide-react'

interface TabData {
  id: string
  label: string
  icon: React.ReactNode
  count?: number
}

const tabs: TabData[] = [
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  { id: 'company', label: 'Company', icon: <Building size={20} /> },
  { id: 'preferences', label: 'Preferences', icon: <Settings size={20} /> },
  { id: 'security', label: 'Security', icon: <Shield size={20} /> },
  { id: 'data', label: 'Data Export', icon: <Download size={20} /> }
]

interface AccountTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const AccountTabs: React.FC<AccountTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '2px solid #F3F4F6',
      marginBottom: '32px',
      overflowX: 'auto'
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderBottom: activeTab === tab.id ? '3px solid #006FEE' : '3px solid transparent',
            color: activeTab === tab.id ? '#006FEE' : '#5B6B7D',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.color = '#006FEE'
              e.currentTarget.style.backgroundColor = '#F8FBFF'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.color = '#5B6B7D'
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {tab.icon}
          {tab.label}
          {tab.count && (
            <span style={{
              backgroundColor: '#EF4444',
              color: 'white',
              fontSize: '12px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Profile Tab Component
interface ProfileTabProps {
  user: any
  onUpdate: (data: any) => void
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, onUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user.firstName || 'Mike',
    lastName: user.lastName || 'Johnson',
    email: user.email || 'mike@constructionco.com',
    phone: user.phone || '+1 (555) 123-4567',
    jobTitle: user.jobTitle || 'Project Manager',
    department: user.department || 'Operations'
  })

  const handleSave = () => {
    onUpdate(formData)
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Avatar Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #E6F4FF',
        boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #006FEE 0%, #0084FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '36px',
            fontWeight: '700',
            border: '4px solid white',
            boxShadow: '0 4px 12px rgba(0, 111, 238, 0.2)'
          }}>
            {formData.firstName[0]}{formData.lastName[0]}
          </div>
          <button style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#006FEE',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0059D1'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#006FEE'}
          >
            <Camera size={16} color="white" />
          </button>
        </div>
        
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0A051E', marginBottom: '8px' }}>
            {formData.firstName} {formData.lastName}
          </h2>
          <p style={{ fontSize: '16px', color: '#5B6B7D', marginBottom: '4px' }}>
            {formData.jobTitle} • {formData.department}
          </p>
          <p style={{ fontSize: '14px', color: '#10B981', fontWeight: '600' }}>
            Gold Partner Member
          </p>
        </div>

        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: editing ? '#10B981' : '#006FEE',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = editing ? '#059669' : '#0059D1'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = editing ? '#10B981' : '#006FEE'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {editing ? <Save size={16} /> : <Edit size={16} />}
          {editing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      {/* Personal Information */}
      <div style={{
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #E6F4FF',
        boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0A051E', marginBottom: '20px' }}>
          Personal Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[
            { key: 'firstName', label: 'First Name', type: 'text' },
            { key: 'lastName', label: 'Last Name', type: 'text' },
            { key: 'email', label: 'Email Address', type: 'email' },
            { key: 'phone', label: 'Phone Number', type: 'tel' },
            { key: 'jobTitle', label: 'Job Title', type: 'text' },
            { key: 'department', label: 'Department', type: 'text' }
          ].map((field) => (
            <div key={field.key}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0A051E',
                marginBottom: '8px'
              }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: editing ? '2px solid #E6F4FF' : '2px solid #F3F4F6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: editing ? 'white' : '#F9FAFB',
                  color: '#0A051E',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  if (editing) {
                    e.currentTarget.style.borderColor = '#006FEE'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = editing ? '#E6F4FF' : '#F3F4F6'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Company Tab Component
const CompanyTab: React.FC = () => {
  const [editing, setEditing] = useState(false)
  const [companyData, setCompanyData] = useState({
    companyName: 'Johnson Construction Co.',
    industry: 'Commercial Construction',
    employees: '50-100',
    taxId: '12-3456789',
    address: '123 Construction Ave',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    website: 'www.johnsonconstruction.com'
  })

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '16px',
      border: '1px solid #E6F4FF',
      boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0A051E' }}>
          Company Information
        </h3>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: editing ? '#EF4444' : '#006FEE',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {editing ? <X size={16} /> : <Edit size={16} />}
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {Object.entries(companyData).map(([key, value]) => (
          <div key={key}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#0A051E',
              marginBottom: '8px',
              textTransform: 'capitalize'
            }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setCompanyData(prev => ({ ...prev, [key]: e.target.value }))}
              disabled={!editing}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: editing ? '2px solid #E6F4FF' : '2px solid #F3F4F6',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: editing ? 'white' : '#F9FAFB',
                color: '#0A051E',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Preferences Tab Component  
const PreferencesTab: React.FC = () => {
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      orderUpdates: true,
      promotions: false,
      newsletter: true
    },
    display: {
      language: 'English',
      timezone: 'Mountain Time (MT)',
      currency: 'USD',
      theme: 'light'
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Notifications */}
      <div style={{
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #E6F4FF',
        boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Bell size={20} color="#006FEE" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0A051E' }}>
            Notification Preferences
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {Object.entries(preferences.notifications).map(([key, enabled]) => (
            <label key={key} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              border: '1px solid #F3F4F6',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FBFF'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#0A051E', textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, [key]: e.target.checked }
                }))}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#006FEE',
                  cursor: 'pointer'
                }}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Display Settings */}
      <div style={{
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #E6F4FF',
        boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Globe size={20} color="#10B981" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0A051E' }}>
            Display Settings
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {Object.entries(preferences.display).map(([key, value]) => (
            <div key={key}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0A051E',
                marginBottom: '8px',
                textTransform: 'capitalize'
              }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <select
                value={value}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  display: { ...prev.display, [key]: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E6F4FF',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: '#0A051E',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {key === 'language' && (
                  <>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                  </>
                )}
                {key === 'timezone' && (
                  <>
                    <option value="Mountain Time (MT)">Mountain Time (MT)</option>
                    <option value="Pacific Time (PT)">Pacific Time (PT)</option>
                    <option value="Central Time (CT)">Central Time (CT)</option>
                    <option value="Eastern Time (ET)">Eastern Time (ET)</option>
                  </>
                )}
                {key === 'currency' && (
                  <>
                    <option value="USD">USD</option>
                    <option value="CAD">CAD</option>
                  </>
                )}
                {key === 'theme' && (
                  <>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </>
                )}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { AccountTabs, ProfileTab, CompanyTab, PreferencesTab }