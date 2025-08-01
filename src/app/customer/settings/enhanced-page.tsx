'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  User, Shield, Bell, CreditCard, MapPin, Truck, Eye, EyeOff, Save, 
  AlertCircle, Loader2, Check, QrCode, Copy, CheckCircle, X
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { SettingsService, UserSettings } from '@/services/settings/SettingsService'

export default function EnhancedSettingsPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  
  // 2FA setup state
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const userSettings = await SettingsService.getUserSettings()
      setSettings(userSettings)
    } catch (error) {
      showMessage('error', 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleProfileUpdate = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await SettingsService.updateProfile(settings.profile)
      showMessage('success', 'Profile updated successfully')
    } catch (error) {
      showMessage('error', 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationUpdate = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await SettingsService.updateNotifications(settings.notifications)
      showMessage('success', 'Notification preferences updated')
    } catch (error) {
      showMessage('error', 'Failed to update notifications')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      showMessage('error', 'Passwords do not match')
      return
    }
    
    setSaving(true)
    try {
      await SettingsService.changePassword(passwordForm.current, passwordForm.new)
      showMessage('success', 'Password changed successfully')
      setPasswordForm({ current: '', new: '', confirm: '' })
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleEnable2FA = async () => {
    try {
      const { qrCode, secret } = await SettingsService.enableTwoFactor()
      setQrCode(qrCode)
      setSecret(secret)
      setShow2FASetup(true)
    } catch (error) {
      showMessage('error', 'Failed to setup two-factor authentication')
    }
  }

  const handleVerify2FA = async () => {
    setSaving(true)
    try {
      const success = await SettingsService.verifyTwoFactor(verificationCode)
      if (success) {
        showMessage('success', 'Two-factor authentication enabled')
        setShow2FASetup(false)
        if (settings) {
          settings.security.twoFactorEnabled = true
          setSettings({ ...settings })
        }
      } else {
        showMessage('error', 'Invalid verification code')
      }
    } catch (error) {
      showMessage('error', 'Failed to verify code')
    } finally {
      setSaving(false)
    }
  }

  const handleBillingUpdate = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await SettingsService.updateBilling(settings.billing)
      showMessage('success', 'Billing settings updated')
    } catch (error) {
      showMessage('error', 'Failed to update billing settings')
    } finally {
      setSaving(false)
    }
  }

  const handleShippingUpdate = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await SettingsService.updateShipping(settings.shipping)
      showMessage('success', 'Shipping settings updated')
    } catch (error) {
      showMessage('error', 'Failed to update shipping settings')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showMessage('success', 'Copied to clipboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load settings. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #006FEE, #0050B3)',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0, 111, 238, 0.15)',
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: 'white',
          marginBottom: '8px'
        }}>
          Account Settings
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
          Manage your account preferences and information
        </p>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList style={{
          backgroundColor: 'white',
          padding: '4px',
          borderRadius: '8px',
          border: '2px solid #E6F4FF'
        }}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #E6F4FF',
            padding: '32px'
          }}>
            <CardHeader className="p-0 pb-6">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={settings.profile.firstName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, firstName: e.target.value }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={settings.profile.lastName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, lastName: e.target.value }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, email: e.target.value }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.profile.phone}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, phone: e.target.value }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={settings.profile.company}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, company: e.target.value }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={settings.profile.title}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, title: e.target.value }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  style={{
                    backgroundColor: '#006FEE',
                    color: 'white'
                  }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #E6F4FF',
            padding: '32px'
          }}>
            <CardHeader className="p-0 pb-6">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        style={{
                          borderColor: '#E6F4FF',
                          backgroundColor: '#F9FAFB'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                        style={{
                          borderColor: '#E6F4FF',
                          backgroundColor: '#F9FAFB'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={saving}
                    style={{
                      backgroundColor: '#006FEE',
                      color: 'white'
                    }}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Change Password
                  </Button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={() => {
                      if (!settings.security.twoFactorEnabled) {
                        handleEnable2FA()
                      }
                    }}
                    style={{
                      flexShrink: 0
                    }}
                  />
                </div>
              </div>

              {/* Session Settings */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">Session Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="sessionTimeout" className="flex-shrink-0">Session Timeout (minutes)</Label>
                    <Select
                      value={settings.security.sessionTimeout.toString()}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: parseInt(value) }
                      })}
                    >
                      <SelectTrigger className="w-32" style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                        <SelectItem value="120">120</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Login Notifications</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Get notified when someone logs into your account
                      </p>
                    </div>
                    <Switch
                      checked={settings.security.loginNotifications}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        security: { ...settings.security, loginNotifications: checked }
                      })}
                      style={{
                        flexShrink: 0
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #E6F4FF',
            padding: '32px'
          }}>
            <CardHeader className="p-0 pb-6">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive updates and communications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Updates</Label>
                    <p className="text-sm text-gray-500">
                      Get notified about order status changes
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.orderUpdates}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, orderUpdates: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Promotions & Offers</Label>
                    <p className="text-sm text-gray-500">
                      Receive special deals and discounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.promotions}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, promotions: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Newsletter</Label>
                    <p className="text-sm text-gray-500">
                      Industry news and product updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.newsletter}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, newsletter: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Get text messages for urgent updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, sms: checked }
                    })}
                  />
                </div>
              </div>

              <div className="pt-6 border-t">
                <Label>Email Frequency</Label>
                <Select
                  value={settings.notifications.emailFrequency}
                  onValueChange={(value: any) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailFrequency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleNotificationUpdate}
                disabled={saving}
                style={{
                  backgroundColor: '#006FEE',
                  color: 'white'
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #E6F4FF',
            padding: '32px'
          }}>
            <CardHeader className="p-0 pb-6">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Billing Settings
              </CardTitle>
              <CardDescription>
                Manage payment methods and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Payment Method</Label>
                  <Select
                    value={settings.billing.defaultPaymentMethod}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      billing: { ...settings.billing, defaultPaymentMethod: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="ach">ACH Transfer</SelectItem>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Pay</Label>
                    <p className="text-sm text-gray-500">
                      Automatically pay invoices when due
                    </p>
                  </div>
                  <Switch
                    checked={settings.billing.autoPayEnabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      billing: { ...settings.billing, autoPayEnabled: checked }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Invoice Delivery</Label>
                  <Select
                    value={settings.billing.invoiceDelivery}
                    onValueChange={(value: any) => setSettings({
                      ...settings,
                      billing: { ...settings.billing, invoiceDelivery: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="mail">Mail Only</SelectItem>
                      <SelectItem value="both">Email & Mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={settings.billing.billingEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      billing: { ...settings.billing, billingEmail: e.target.value }
                    })}
                    style={{
                      borderColor: '#E6F4FF',
                      backgroundColor: '#F9FAFB'
                    }}
                  />
                </div>
              </div>

              <Button 
                onClick={handleBillingUpdate}
                disabled={saving}
                style={{
                  backgroundColor: '#006FEE',
                  color: 'white'
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Billing Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #E6F4FF',
            padding: '32px'
          }}>
            <CardHeader className="p-0 pb-6">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Shipping Settings
              </CardTitle>
              <CardDescription>
                Manage your default shipping address and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Default Shipping Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={settings.shipping.defaultAddress.street}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: {
                          ...settings.shipping,
                          defaultAddress: { ...settings.shipping.defaultAddress, street: e.target.value }
                        }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={settings.shipping.defaultAddress.city}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: {
                          ...settings.shipping,
                          defaultAddress: { ...settings.shipping.defaultAddress, city: e.target.value }
                        }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={settings.shipping.defaultAddress.state}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: {
                          ...settings.shipping,
                          defaultAddress: { ...settings.shipping.defaultAddress, state: e.target.value }
                        }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={settings.shipping.defaultAddress.zipCode}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: {
                          ...settings.shipping,
                          defaultAddress: { ...settings.shipping.defaultAddress, zipCode: e.target.value }
                        }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={settings.shipping.defaultAddress.country}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: {
                          ...settings.shipping,
                          defaultAddress: { ...settings.shipping.defaultAddress, country: e.target.value }
                        }
                      })}
                      style={{
                        borderColor: '#E6F4FF',
                        backgroundColor: '#F9FAFB'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="space-y-2">
                  <Label>Preferred Carrier</Label>
                  <Select
                    value={settings.shipping.preferredCarrier}
                    onValueChange={(value: any) => setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, preferredCarrier: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
                  <Textarea
                    id="deliveryInstructions"
                    value={settings.shipping.deliveryInstructions}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, deliveryInstructions: e.target.value }
                    })}
                    placeholder="Leave at front desk, ring doorbell, etc."
                    style={{
                      borderColor: '#E6F4FF',
                      backgroundColor: '#F9FAFB'
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Signature Required</Label>
                    <p className="text-sm text-gray-500">
                      Require signature for all deliveries
                    </p>
                  </div>
                  <Switch
                    checked={settings.shipping.signatureRequired}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, signatureRequired: checked }
                    })}
                  />
                </div>
              </div>

              <Button 
                onClick={handleShippingUpdate}
                disabled={saving}
                style={{
                  backgroundColor: '#006FEE',
                  color: 'white'
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Shipping Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Setup Two-Factor Authentication
                <button onClick={() => setShow2FASetup(false)}>
                  <X className="w-5 h-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="mb-4">Scan this QR code with your authenticator app</p>
                <div className="bg-gray-100 p-4 rounded-lg inline-block">
                  <QrCode className="w-32 h-32" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Or enter this code manually:</Label>
                <div className="flex items-center gap-2">
                  <Input value={secret} readOnly />
                  <Button onClick={() => copyToClipboard(secret)} variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verifyCode">Enter verification code</Label>
                <Input
                  id="verifyCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              
              <Button 
                onClick={handleVerify2FA}
                disabled={saving || verificationCode.length !== 6}
                className="w-full"
                style={{
                  backgroundColor: '#006FEE',
                  color: 'white'
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Verify and Enable
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}