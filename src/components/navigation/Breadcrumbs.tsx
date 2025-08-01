"use client"

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChevronRight, 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Building2,
  Globe,
  FileText,
  Truck,
  CreditCard,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Breadcrumb item interface
 */
interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
  isDropdown?: boolean
  dropdownItems?: Array<{
    label: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

/**
 * Breadcrumbs component props
 */
interface BreadcrumbsProps {
  /** Custom breadcrumb items override */
  items?: BreadcrumbItem[]
  /** Current warehouse context */
  warehouse?: {
    id: string
    name: string
    region: string
  }
  /** Maximum number of items to show before collapsing */
  maxItems?: number
  /** Show home link */
  showHome?: boolean
  /** Show warehouse context */
  showWarehouse?: boolean
  /** Custom separator */
  separator?: React.ReactNode
  /** Custom classes */
  className?: string
  /** Loading state */
  loading?: boolean
}

/**
 * Default icon mapping for common routes
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'dashboard': Home,
  'inventory': Package,
  'orders': ShoppingCart,
  'customers': Users,
  'analytics': BarChart3,
  'reports': BarChart3,
  'settings': Settings,
  'warehouses': Building2,
  'regions': Globe,
  'products': Package,
  'stock': Package,
  'active': ShoppingCart,
  'history': FileText,
  'fulfillment': Truck,
  'accounts': Users,
  'support': HelpCircle,
  'sales': BarChart3,
  'overview': BarChart3,
  'billing': CreditCard,
  'shipping': Truck,
}

/**
 * Route label mapping for better UX
 */
const labelMap: Record<string, string> = {
  'dashboard': 'Dashboard',
  'inventory': 'Inventory',
  'orders': 'Orders',
  'customers': 'Customer Relations',
  'analytics': 'Analytics & Reports',
  'reports': 'Reports',
  'settings': 'Settings',
  'warehouses': 'Warehouses',
  'regions': 'Regions',
  'products': 'Products',
  'stock': 'Stock Levels',
  'active': 'Active Orders',
  'history': 'Order History',
  'fulfillment': 'Fulfillment',
  'accounts': 'Account Management',
  'support': 'Support Tickets',
  'sales': 'Sales Performance',
  'overview': 'Overview',
  'billing': 'Billing',
  'shipping': 'Shipping',
  'profile': 'Profile',
  'preferences': 'Preferences',
  'security': 'Security',
  'notifications': 'Notifications',
}

/**
 * Special handling for dynamic routes
 */
const dynamicRouteHandlers: Record<string, (segment: string) => { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  'warehouse': (id: string) => ({ 
    label: `Warehouse ${id.toUpperCase()}`, 
    icon: Building2 
  }),
  'order': (id: string) => ({ 
    label: `Order #${id.slice(0, 8)}`, 
    icon: ShoppingCart 
  }),
  'customer': (id: string) => ({ 
    label: `Customer ${id.slice(0, 8)}`, 
    icon: Users 
  }),
  'product': (id: string) => ({ 
    label: `Product ${id.slice(0, 8)}`, 
    icon: Package 
  }),
}

/**
 * Breadcrumbs Component - Dynamic navigation breadcrumbs for RHY Supplier Portal
 * 
 * Features:
 * - Auto-generates breadcrumbs from current pathname
 * - Warehouse context awareness
 * - Collapsible breadcrumbs for long paths
 * - Custom icons and labels
 * - Dropdown support for intermediate levels
 * - Responsive design with mobile optimization
 * - Accessibility compliant (ARIA navigation)
 * - Performance optimized with memoization
 * 
 * @param props - BreadcrumbsProps
 * @returns JSX.Element
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items: customItems,
  warehouse,
  maxItems = 4,
  showHome = true,
  showWarehouse = true,
  separator,
  className,
  loading = false,
}) => {
  const pathname = usePathname()

  /**
   * Generate breadcrumb items from pathname
   */
  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    if (customItems) {
      return customItems
    }

    const segments = pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []

    // Add home if requested
    if (showHome) {
      items.push({
        label: 'Home',
        href: '/supplier',
        icon: Home,
        isActive: pathname === '/supplier',
      })
    }

    // Add warehouse context if available and requested
    if (showWarehouse && warehouse) {
      items.push({
        label: warehouse.name,
        href: `/supplier/warehouse/${warehouse.id}`,
        icon: Building2,
        isActive: false,
      })
    }

    // Process path segments
    let currentPath = ''
    segments.forEach((segment, index) => {
      // Skip 'supplier' in path as it's implicit
      if (segment === 'supplier') {
        currentPath += `/${segment}`
        return
      }

      currentPath += `/${segment}`
      const isLast = index === segments.length - 1

      // Check for dynamic route handlers
      const previousSegment = segments[index - 1]
      if (previousSegment && dynamicRouteHandlers[previousSegment]) {
        const handler = dynamicRouteHandlers[previousSegment]
        const { label, icon } = handler(segment)
        items.push({
          label,
          href: currentPath,
          icon,
          isActive: isLast,
        })
        return
      }

      // Use mapped label or format segment
      const label = labelMap[segment] || segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      const icon = iconMap[segment]

      items.push({
        label,
        href: currentPath,
        icon,
        isActive: isLast,
      })
    })

    return items
  }, [pathname, customItems, warehouse, showHome, showWarehouse])

  /**
   * Handle breadcrumb collapsing for long paths
   */
  const displayItems = useMemo((): BreadcrumbItem[] => {
    if (breadcrumbItems.length <= maxItems) {
      return breadcrumbItems
    }

    const result: BreadcrumbItem[] = []
    const firstItem = breadcrumbItems[0]
    const lastItems = breadcrumbItems.slice(-2) // Always show last 2 items
    const collapsedItems = breadcrumbItems.slice(1, -2) // Items to collapse

    result.push(firstItem)

    // Add dropdown for collapsed items
    if (collapsedItems.length > 0) {
      result.push({
        label: '...',
        href: '#',
        isDropdown: true,
        dropdownItems: collapsedItems.map(item => ({
          label: item.label,
          href: item.href,
          icon: item.icon,
        })),
      })
    }

    result.push(...lastItems)
    return result
  }, [breadcrumbItems, maxItems])

  /**
   * Render breadcrumb item
   */
  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number) => {
    const isLast = index === displayItems.length - 1
    const Icon = item.icon

    const itemContent = (
      <span className="flex items-center">
        {Icon && (
          <Icon className={cn(
            'mr-2 h-4 w-4',
            item.isActive ? 'text-[#006FEE]' : 'text-[#9CA3AF]'
          )} />
        )}
        <span className={cn(
          'transition-colors duration-200',
          item.isActive 
            ? 'text-[#006FEE] font-medium' 
            : 'text-[#6B7280] hover:text-[#006FEE]'
        )}>
          {item.label}
        </span>
      </span>
    )

    if (item.isDropdown && item.dropdownItems) {
      return (
        <DropdownMenu key={index}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto p-1 font-normal hover:bg-transparent"
            >
              {itemContent}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            {item.dropdownItems.map((dropdownItem, idx) => (
              <DropdownMenuItem key={idx} asChild>
                <Link
                  href={dropdownItem.href}
                  className="flex items-center w-full"
                >
                  {dropdownItem.icon && (
                    <dropdownItem.icon className="mr-2 h-4 w-4 text-[#9CA3AF]" />
                  )}
                  {dropdownItem.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    if (item.isActive || isLast) {
      return (
        <span key={index} aria-current="page">
          {itemContent}
        </span>
      )
    }

    return (
      <Link
        key={index}
        href={item.href}
        className="hover:bg-[#F9FAFB] px-2 py-1 rounded-md transition-colors duration-200"
      >
        {itemContent}
      </Link>
    )
  }

  /**
   * Render separator
   */
  const renderSeparator = (index: number) => {
    if (separator) {
      return (
        <span key={`sep-${index}`} className="mx-2 text-[#D1D5DB]">
          {separator}
        </span>
      )
    }

    return (
      <ChevronRight
        key={`sep-${index}`}
        className="mx-2 h-4 w-4 text-[#D1D5DB]"
        aria-hidden="true"
      />
    )
  }

  if (loading) {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1', className)}>
        <div className="flex items-center space-x-2 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="h-4 w-16 bg-[#F3F4F6] rounded" />
              {i < 2 && <ChevronRight className="h-4 w-4 text-[#E5E7EB]" />}
            </React.Fragment>
          ))}
        </div>
      </nav>
    )
  }

  if (displayItems.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
      role="navigation"
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && renderSeparator(index)}
            {renderBreadcrumbItem(item, index)}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Warehouse-aware breadcrumbs hook for context integration
 */
export const useWarehouseBreadcrumbs = (warehouse?: { id: string; name: string; region: string }) => {
  const pathname = usePathname()

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    
    // Check if we're in a warehouse-specific context
    const isWarehouseContext = segments.includes('warehouse') || segments.includes('region')
    
    return {
      showWarehouse: isWarehouseContext && !!warehouse,
      warehouse,
    }
  }, [pathname, warehouse])
}

/**
 * Breadcrumbs with automatic warehouse context
 */
export const WarehouseBreadcrumbs: React.FC<Omit<BreadcrumbsProps, 'showWarehouse'>> = (props) => {
  const { showWarehouse, warehouse } = useWarehouseBreadcrumbs(props.warehouse)

  return (
    <Breadcrumbs
      {...props}
      showWarehouse={showWarehouse}
      warehouse={warehouse}
    />
  )
}

export default Breadcrumbs