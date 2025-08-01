'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Home,
  Package,
  MessageCircle,
  Sparkles,
  History,
  Heart,
  Search,
  Bell,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useTheme } from '../../hooks/useTheme'

interface CustomerHeaderProps {
  cartItemCount?: number
  wishlistCount?: number
  notificationCount?: number
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  cartItemCount = 0,
  wishlistCount = 0,
  notificationCount = 0,
}) => {
  const { theme } = useTheme()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    {
      name: 'Home',
      href: '/customer',
      icon: Home,
    },
    {
      name: 'Products',
      href: '/customer/products',
      icon: Package,
    },
    {
      name: 'Design My Battery',
      href: '/customer/engraving',
      icon: Sparkles,
      badge: 'NEW',
    },
    {
      name: 'Product Quiz',
      href: '/quiz',
      icon: Sparkles,
      badge: 'AI',
    },
    {
      name: 'Chat Support',
      href: '/customer/chat',
      icon: MessageCircle,
    },
    {
      name: 'Orders',
      href: '/customer/orders',
      icon: History,
    },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/customer" className="flex items-center space-x-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
              style={{
                background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
              }}
            >
              BD
            </div>
            <span className="font-bold text-xl" style={{ color: theme.colors.textPrimary }}>
              Battery Department
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'font-medium'
                    : 'hover:bg-opacity-10'
                }`}
                style={{
                  color: isActive(item.href) ? theme.colors.primary : theme.colors.textSecondary,
                  backgroundColor: isActive(item.href) ? `${theme.colors.primary}15` : 'transparent',
                }}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
                {item.badge && (
                  <Badge
                    size="sm"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.background,
                    }}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search (Desktop) */}
            <div className="hidden lg:block">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: theme.colors.textMuted }}
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 rounded-lg border w-64 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    '--tw-ring-color': theme.colors.primary,
                  }}
                />
              </div>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge
                  size="sm"
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center"
                  style={{
                    backgroundColor: theme.colors.error,
                    color: 'white',
                  }}
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* Wishlist */}
            <Link href="/customer/wishlist" className="relative">
              <Button variant="ghost" size="sm">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <Badge
                    size="sm"
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                    }}
                  >
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/customer/cart" className="relative">
              <Button variant="ghost" size="sm">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <Badge
                    size="sm"
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                    }}
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Account */}
            <Link href="/customer/account">
              <Button variant="secondary" size="sm" icon={<User className="w-4 h-4" />}>
                <span className="hidden sm:inline">Account</span>
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t" style={{ borderColor: theme.colors.border }}>
            {/* Mobile Search */}
            <div className="px-2 pb-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: theme.colors.textMuted }}
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    '--tw-ring-color': theme.colors.primary,
                  }}
                />
              </div>
            </div>

            {/* Mobile Nav Items */}
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                  isActive(item.href) ? 'font-medium' : ''
                }`}
                style={{
                  color: isActive(item.href) ? theme.colors.primary : theme.colors.textPrimary,
                  backgroundColor: isActive(item.href) ? `${theme.colors.primary}10` : 'transparent',
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge
                    size="sm"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.background,
                    }}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}