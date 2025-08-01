'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Package,
  ShoppingCart,
  Heart,
  Home,
  User,
  MessageCircle,
  LogOut,
  Menu,
  X,
  CreditCard,
  Bell,
  Award,
  Settings,
  ShoppingBag,
  HelpCircle
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: Home },
  { name: 'Product Config', href: '/customer/engraving', icon: Package },
  { name: 'Fleet Calculator', href: '/customer/fleet-calculator', icon: Settings },
  { name: 'Shopping Cart', href: '/customer/cart', icon: ShoppingBag },
  { name: 'Order History', href: '/customer/orders', icon: ShoppingCart },
  { name: 'Saved Items', href: '/customer/saved-items', icon: Heart },
  { name: 'Billing & Invoices', href: '/customer/billing', icon: CreditCard },
  { name: 'Support Center', href: '/customer/support', icon: HelpCircle },
  { name: 'Account Settings', href: '/customer/settings', icon: User },
]

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('customerToken')
    const publicPaths = ['/auth', '/products', '/checkout', '/design-with-ai', '/engraving', '/cart']
    const isPublicPath = publicPaths.some(path => pathname.includes(path))
    
    if (!token && !isPublicPath) {
      router.push('/customer/auth/login')
    } else if (token) {
      setIsAuthenticated(true)
    }
  }, [pathname, router])

  const handleSignOut = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerUser')
    router.push('/customer/auth/login')
  }

  // Don't show navigation on auth pages
  if (pathname.includes('/auth')) {
    return <>{children}</>
  }

  // Hide sidebar on specific pages for unified experience
  const hideSidebar = pathname === '/customer/design-with-ai' || pathname.includes('/checkout')

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Mobile menu */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '260px',
        background: 'linear-gradient(180deg, #E6F4FF 0%, #DEEEFF 50%, #EFF8FF 100%)',
        borderRight: '1px solid rgba(0, 111, 238, 0.1)',
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isSidebarOpen ? '4px 0 16px rgba(0, 111, 238, 0.05)' : 'none'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid rgba(0, 111, 238, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #006FEE 0%, #0084FF 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.3)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" />
              </svg>
            </div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700',
              color: '#003D88'
            }}>Battery Department</h2>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              color: '#003D88',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav style={{ flex: 1, padding: '12px' }}>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                router.push(item.href)
                setIsSidebarOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '10px',
                textDecoration: 'none',
                color: pathname === item.href ? '#006FEE' : '#5B9FFF',
                backgroundColor: pathname === item.href ? 'rgba(0, 111, 238, 0.08)' : 'transparent',
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: pathname === item.href ? '600' : '500',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 111, 238, 0.04)'
                  e.currentTarget.style.borderColor = 'rgba(0, 111, 238, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              <item.icon size={20} style={{ marginRight: '12px' }} />
              {item.name}
            </a>
          ))}
        </nav>

        {isAuthenticated && (
          <div style={{ 
            padding: '16px', 
            borderTop: '1px solid rgba(0, 111, 238, 0.1)'
          }}>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                color: '#5B9FFF',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 111, 238, 0.04)'
                e.currentTarget.style.borderColor = 'rgba(0, 111, 238, 0.08)'
                e.currentTarget.style.color = '#006FEE'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.color = '#5B9FFF'
              }}
            >
              <LogOut size={20} style={{ marginRight: '12px' }} />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      {!hideSidebar && (
        <div style={{
          width: '260px',
          background: 'linear-gradient(180deg, #E6F4FF 0%, #DEEEFF 50%, #EFF8FF 100%)',
          borderRight: '1px solid rgba(0, 111, 238, 0.1)',
          display: 'none',
          flexDirection: 'column',
          boxShadow: '4px 0 16px rgba(0, 111, 238, 0.05)'
        }} className="desktop-sidebar">
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(0, 111, 238, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #006FEE 0%, #0084FF 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 111, 238, 0.3)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h1 style={{ 
                fontSize: '22px', 
                fontWeight: '700',
                color: '#003D88',
                marginBottom: '4px'
              }}>Battery Department</h1>
              <p style={{
                fontSize: '13px',
                color: '#5B9FFF',
                fontWeight: '500'
              }}>Partner Portal</p>
            </div>
          </div>
        </div>
        
        <nav style={{ flex: 1, padding: '12px' }}>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                router.push(item.href)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '10px',
                textDecoration: 'none',
                color: pathname === item.href ? '#006FEE' : '#5B9FFF',
                backgroundColor: pathname === item.href ? 'rgba(0, 111, 238, 0.08)' : 'transparent',
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: pathname === item.href ? '600' : '500',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 111, 238, 0.04)'
                  e.currentTarget.style.borderColor = 'rgba(0, 111, 238, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              <item.icon size={20} style={{ marginRight: '12px' }} />
              {item.name}
            </a>
          ))}
        </nav>

        {isAuthenticated && (
          <div style={{ 
            padding: '16px', 
            borderTop: '1px solid rgba(0, 111, 238, 0.1)'
          }}>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                color: '#5B9FFF',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 111, 238, 0.04)'
                e.currentTarget.style.borderColor = 'rgba(0, 111, 238, 0.08)'
                e.currentTarget.style.color = '#006FEE'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.color = '#5B9FFF'
              }}
            >
              <LogOut size={20} style={{ marginRight: '12px' }} />
              Sign out
            </button>
          </div>
        )}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile header */}
        {!hideSidebar && (
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #E6F4FF',
            boxShadow: '0 1px 3px rgba(0, 111, 238, 0.05)'
          }} className="mobile-header">
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#003D88',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={24} />
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #006FEE 0%, #0084FF 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" />
              </svg>
            </div>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: '700',
              color: '#003D88'
            }}>Battery Department</h1>
          </div>
          <button
            onClick={() => router.push('/customer/notifications')}
            style={{
              position: 'relative',
              padding: '8px',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#003D88',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell size={20} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              backgroundColor: '#EF4444',
              borderRadius: '50%'
            }} />
          </button>
          </header>
        )}

        {/* Page content */}
        <main style={{ 
          flex: 1, 
          overflowY: 'auto',
          backgroundColor: '#F8FAFC'
        }}>
          {children}
        </main>
      </div>

      {/* Mobile menu overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 30
          }}
        />
      )}

      {/* Desktop styles */}
      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-sidebar {
            display: ${hideSidebar ? 'none' : 'flex'} !important;
          }
          .mobile-header {
            display: ${hideSidebar ? 'none' : 'none'} !important;
          }
        }
      `}</style>
    </div>
  )
}