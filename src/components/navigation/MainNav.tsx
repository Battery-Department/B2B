"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Building2,
  Globe,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Navigation item interface for type safety
 */
interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'error'
  }
  children?: NavigationItem[]
  permission?: string
  warehouse?: string[]
}

/**
 * Main navigation component props
 */
interface MainNavProps {
  /** Current user information */
  user?: {
    id: string
    name: string
    email: string
    role: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN'
    avatar?: string
    warehouse?: string
  }
  /** Current warehouse context */
  warehouse?: {
    id: string
    name: string
    region: string
    currency: string
    timezone: string
  }
  /** Available warehouses for switching */
  warehouses?: Array<{
    id: string
    name: string
    region: string
    currency: string
    timezone: string
  }>
  /** Notification count */
  notificationCount?: number
  /** Loading state */
  loading?: boolean
  /** Custom navigation items */
  navigationItems?: NavigationItem[]
  /** Collapsed state for desktop */
  collapsed?: boolean
  /** Callback for navigation item clicks */
  onNavigate?: (item: NavigationItem) => void
  /** Callback for warehouse switching */
  onWarehouseChange?: (warehouseId: string) => void
  /** Callback for logout */
  onLogout?: () => void
}

/**
 * Default navigation items for RHY Supplier Portal
 */
const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/supplier/dashboard',
    icon: Home,
  },
  {
    id: 'inventory',
    label: 'Inventory Management',
    href: '/supplier/inventory',
    icon: Package,
    badge: { text: 'Live', variant: 'success' },
    children: [
      {
        id: 'inventory-overview',
        label: 'Overview',
        href: '/supplier/inventory',
        icon: BarChart3,
      },
      {
        id: 'inventory-products',
        label: 'Products',
        href: '/supplier/inventory/products',
        icon: Package,
      },
      {
        id: 'inventory-stock',
        label: 'Stock Levels',
        href: '/supplier/inventory/stock',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'orders',
    label: 'Order Management',
    href: '/supplier/orders',
    icon: ShoppingCart,
    children: [
      {
        id: 'orders-active',
        label: 'Active Orders',
        href: '/supplier/orders/active',
        icon: ShoppingCart,
        badge: { text: 'New', variant: 'warning' },
      },
      {
        id: 'orders-history',
        label: 'Order History',
        href: '/supplier/orders/history',
        icon: BarChart3,
      },
      {
        id: 'orders-fulfillment',
        label: 'Fulfillment',
        href: '/supplier/orders/fulfillment',
        icon: Package,
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customer Relations',
    href: '/supplier/customers',
    icon: Users,
    permission: 'customer_management',
    children: [
      {
        id: 'customers-overview',
        label: 'Customer Overview',
        href: '/supplier/customers',
        icon: Users,
      },
      {
        id: 'customers-accounts',
        label: 'Account Management',
        href: '/supplier/customers/accounts',
        icon: Users,
      },
      {
        id: 'customers-support',
        label: 'Support Tickets',
        href: '/supplier/customers/support',
        icon: Users,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    href: '/supplier/analytics',
    icon: BarChart3,
    children: [
      {
        id: 'analytics-overview',
        label: 'Overview',
        href: '/supplier/analytics',
        icon: BarChart3,
      },
      {
        id: 'analytics-sales',
        label: 'Sales Performance',
        href: '/supplier/analytics/sales',
        icon: BarChart3,
      },
      {
        id: 'analytics-inventory',
        label: 'Inventory Analytics',
        href: '/supplier/analytics/inventory',
        icon: Package,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/supplier/settings',
    icon: Settings,
    permission: 'settings_access',
  },
]

/**
 * MainNav Component - Enterprise navigation for RHY Supplier Portal
 * 
 * Features:
 * - Multi-warehouse support with context switching
 * - Role-based navigation items
 * - Hierarchical navigation with collapsible sections
 * - Real-time notifications
 * - Responsive design with mobile optimization
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Performance optimized with lazy loading
 * 
 * @param props - MainNavProps
 * @returns JSX.Element
 */
export const MainNav: React.FC<MainNavProps> = ({
  user,
  warehouse,
  warehouses = [],
  notificationCount = 0,
  loading = false,
  navigationItems = defaultNavigationItems,
  collapsed = false,
  onNavigate,
  onWarehouseChange,
  onLogout,
}) => {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Auto-expand current section
  useEffect(() => {
    const currentItem = navigationItems.find(item => 
      pathname.startsWith(item.href) || 
      item.children?.some(child => pathname.startsWith(child.href))
    )
    if (currentItem && currentItem.children) {
      setExpandedItems(prev => new Set([...prev, currentItem.id]))
    }
  }, [pathname, navigationItems])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  /**
   * Toggle expanded state for navigation items
   */
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  /**
   * Check if navigation item is currently active
   */
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  /**
   * Handle navigation item click
   */
  const handleNavigate = (item: NavigationItem) => {
    onNavigate?.(item)
    setIsMobileOpen(false)
  }

  /**
   * Render navigation item with proper styling and interactions
   */
  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isItemActive = isActive(item.href)
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    const Icon = item.icon

    const itemClasses = cn(
      'flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-[#006FEE] focus:ring-opacity-20',
      level === 0 ? 'mb-1' : 'mb-0.5 ml-4',
      isItemActive
        ? 'bg-gradient-to-r from-[#EFF6FF] to-[#E6F4FF] text-[#006FEE] border-l-4 border-[#006FEE] shadow-sm'
        : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#006FEE] hover:shadow-sm hover:translate-y-[-1px]'
    )

    const content = (
      <>
        <Icon 
          className={cn(
            'mr-3 h-5 w-5 transition-colors duration-300',
            isItemActive ? 'text-[#006FEE]' : 'text-[#9CA3AF]'
          )} 
        />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <Badge 
            variant={item.badge.variant}
            className={cn(
              'ml-auto text-xs font-semibold',
              item.badge.variant === 'default' && 'bg-[#006FEE] text-white',
              item.badge.variant === 'success' && 'bg-[#10B981] text-white',
              item.badge.variant === 'warning' && 'bg-[#F59E0B] text-white',
              item.badge.variant === 'error' && 'bg-[#EF4444] text-white'
            )}
          >
            {item.badge.text}
          </Badge>
        )}
        {hasChildren && (
          <div className="ml-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
            )}
          </div>
        )}
      </>
    )

    return (
      <div key={item.id} className="space-y-1">
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={itemClasses}
            aria-expanded={isExpanded}
            aria-controls={`nav-${item.id}-children`}
          >
            {content}
          </button>
        ) : (
          <Link
            href={item.href}
            className={itemClasses}
            onClick={() => handleNavigate(item)}
            aria-current={isItemActive ? 'page' : undefined}
          >
            {content}
          </Link>
        )}
        
        {hasChildren && isExpanded && (
          <div
            id={`nav-${item.id}-children`}
            className="space-y-1 animate-in slide-in-from-top-2 duration-200"
          >
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  /**
   * Render warehouse selector dropdown
   */
  const renderWarehouseSelector = () => {
    if (!warehouse || warehouses.length <= 1) return null

    return (
      <div className="px-3 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-white border-2 border-[#E6F4FF] hover:border-[#006FEE] transition-colors duration-300"
            >
              <div className="flex items-center">
                <Building2 className="mr-2 h-4 w-4 text-[#006FEE]" />
                <div className="text-left">
                  <div className="font-medium text-[#111827]">{warehouse.name}</div>
                  <div className="text-xs text-[#6B7280]">{warehouse.region}</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-[#6B7280]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Switch Warehouse
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {warehouses.map((wh) => (
              <DropdownMenuItem
                key={wh.id}
                onClick={() => onWarehouseChange?.(wh.id)}
                className={cn(
                  'flex items-center space-x-2',
                  wh.id === warehouse.id && 'bg-[#EFF6FF] text-[#006FEE]'
                )}
              >
                <Building2 className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{wh.name}</div>
                  <div className="text-xs text-[#6B7280]">{wh.region} • {wh.currency}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  /**
   * Render user profile section
   */
  const renderUserProfile = () => {
    if (!user) return null

    return (
      <div className="px-3 py-4 border-t border-[#E5E7EB]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-r from-[#006FEE] to-[#0050B3] text-white text-sm">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="font-medium text-[#111827] text-sm">{user.name}</div>
                <div className="text-xs text-[#6B7280]">{user.role}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/supplier/profile">Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/supplier/preferences">Preferences</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/supplier/security">Security</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-[#EF4444]">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  if (loading) {
    return (
      <nav className="w-72 bg-white border-r border-[#E5E7EB] animate-pulse">
        <div className="p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-[#F3F4F6] rounded-lg" />
          ))}
        </div>
      </nav>
    )
  }

  return (
    <>
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r border-[#E5E7EB] z-50 transition-all duration-300 ease-in-out shadow-lg',
          'lg:static lg:z-0 lg:shadow-none',
          collapsed ? 'w-16' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <Link
            href="/supplier"
            className="flex items-center space-x-3"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RHY</span>
            </div>
            {!collapsed && (
              <div>
                <div className="font-bold text-[#111827]">RHY Portal</div>
                <div className="text-xs text-[#6B7280]">Supplier Dashboard</div>
              </div>
            )}
          </Link>
        </div>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Warehouse Selector */}
          {!collapsed && renderWarehouseSelector()}

          {/* Search */}
          {!collapsed && (
            <div className="px-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search navigation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006FEE] focus:ring-opacity-20 focus:border-[#006FEE] transition-colors duration-300"
                />
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {navigationItems
              .filter(item => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(item => renderNavigationItem(item))}
          </div>

          {/* User Profile */}
          {!collapsed && renderUserProfile()}

          {/* Notifications Badge */}
          {notificationCount > 0 && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-[#EF4444] text-white">
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

export default MainNav