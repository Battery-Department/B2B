/**
 * Navigation Utilities for RHY Supplier Portal
 * 
 * Provides utility functions for navigation, routing, warehouse context,
 * and navigation state management across the application.
 */

import { type LucideIcon } from 'lucide-react'

/**
 * Warehouse interface for global operations
 */
export interface Warehouse {
  id: string
  name: string
  region: string
  country: string
  timezone: string
  currency: string
  locale: string
  status: 'online' | 'maintenance' | 'offline'
  operatingHours: {
    start: string
    end: string
    timezone: string
  }
  compliance: {
    gdpr?: boolean
    osha?: boolean
    jis?: boolean
    ce?: boolean
  }
  coordinates?: {
    lat: number
    lng: number
  }
}

/**
 * Navigation item interface with extended metadata
 */
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
  description?: string
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'error'
    color?: string
  }
  children?: NavigationItem[]
  metadata?: {
    category?: string
    priority?: number
    lastAccessed?: Date
    accessCount?: number
    permissions?: string[]
    warehouse?: string[]
    beta?: boolean
    new?: boolean
    deprecated?: boolean
  }
}

/**
 * Route configuration with access control
 */
export interface RouteConfig {
  path: string
  title: string
  description?: string
  component?: string
  layout?: string
  permissions?: string[]
  warehouse?: string[]
  metadata?: {
    breadcrumbs?: boolean
    navigation?: boolean
    search?: boolean
    cache?: boolean
    preload?: boolean
  }
}

/**
 * Navigation context state
 */
export interface NavigationContext {
  currentPath: string
  warehouse?: Warehouse
  breadcrumbs: Array<{
    label: string
    href: string
    icon?: LucideIcon
  }>
  activeSection?: string
  userPermissions: string[]
  navigationHistory: string[]
}

/**
 * Default warehouse configurations for RHY global operations
 */
export const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 'us-west',
    name: 'US West Coast',
    region: 'Los Angeles, CA',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    locale: 'en-US',
    status: 'online',
    operatingHours: {
      start: '06:00',
      end: '18:00',
      timezone: 'America/Los_Angeles',
    },
    compliance: {
      osha: true,
    },
    coordinates: {
      lat: 34.0522,
      lng: -118.2437,
    },
  },
  {
    id: 'japan',
    name: 'Japan Operations',
    region: 'Tokyo, Japan',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    locale: 'ja-JP',
    status: 'online',
    operatingHours: {
      start: '09:00',
      end: '18:00',
      timezone: 'Asia/Tokyo',
    },
    compliance: {
      jis: true,
    },
    coordinates: {
      lat: 35.6762,
      lng: 139.6503,
    },
  },
  {
    id: 'eu',
    name: 'European Union',
    region: 'Berlin, Germany',
    country: 'Germany',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    locale: 'de-DE',
    status: 'online',
    operatingHours: {
      start: '08:00',
      end: '17:00',
      timezone: 'Europe/Berlin',
    },
    compliance: {
      gdpr: true,
      ce: true,
    },
    coordinates: {
      lat: 52.5200,
      lng: 13.4050,
    },
  },
  {
    id: 'australia',
    name: 'Australia Operations',
    region: 'Sydney, Australia',
    country: 'Australia',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    locale: 'en-AU',
    status: 'online',
    operatingHours: {
      start: '08:00',
      end: '17:00',
      timezone: 'Australia/Sydney',
    },
    compliance: {},
    coordinates: {
      lat: -33.8688,
      lng: 151.2093,
    },
  },
]

/**
 * Route configurations for the RHY Supplier Portal
 */
export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  '/supplier': {
    path: '/supplier',
    title: 'Supplier Portal',
    description: 'RHY Supplier Portal Dashboard',
    metadata: {
      breadcrumbs: true,
      navigation: true,
      search: true,
    },
  },
  '/supplier/dashboard': {
    path: '/supplier/dashboard',
    title: 'Dashboard',
    description: 'Overview of operations and key metrics',
    metadata: {
      breadcrumbs: true,
      navigation: true,
      cache: true,
    },
  },
  '/supplier/inventory': {
    path: '/supplier/inventory',
    title: 'Inventory Management',
    description: 'Manage FlexVolt battery inventory across warehouses',
    permissions: ['inventory_read'],
    metadata: {
      breadcrumbs: true,
      navigation: true,
      preload: true,
    },
  },
  '/supplier/orders': {
    path: '/supplier/orders',
    title: 'Order Management',
    description: 'Process and track customer orders',
    permissions: ['orders_read'],
    metadata: {
      breadcrumbs: true,
      navigation: true,
    },
  },
  '/supplier/customers': {
    path: '/supplier/customers',
    title: 'Customer Relations',
    description: 'Manage customer relationships and support',
    permissions: ['customers_read'],
    metadata: {
      breadcrumbs: true,
      navigation: true,
    },
  },
  '/supplier/analytics': {
    path: '/supplier/analytics',
    title: 'Analytics & Reports',
    description: 'Business intelligence and performance metrics',
    permissions: ['analytics_read'],
    metadata: {
      breadcrumbs: true,
      navigation: true,
      cache: true,
    },
  },
  '/supplier/compliance': {
    path: '/supplier/compliance',
    title: 'Compliance & Security',
    description: 'Global compliance and audit management',
    permissions: ['compliance_read'],
    warehouse: ['all'],
    metadata: {
      breadcrumbs: true,
      navigation: true,
    },
  },
  '/supplier/settings': {
    path: '/supplier/settings',
    title: 'Settings',
    description: 'System configuration and preferences',
    permissions: ['settings_write'],
    metadata: {
      breadcrumbs: true,
      navigation: true,
    },
  },
}

/**
 * Permission levels for role-based access control
 */
export const PERMISSION_LEVELS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
} as const

/**
 * User roles with associated permissions
 */
export const USER_ROLES = {
  SUPPLIER_ADMIN: {
    name: 'Supplier Administrator',
    permissions: [
      'inventory_read',
      'inventory_write',
      'orders_read',
      'orders_write',
      'customers_read',
      'customers_write',
      'analytics_read',
      'compliance_read',
      'settings_write',
    ],
    warehouses: ['all'],
  },
  SUPPLIER_MANAGER: {
    name: 'Supplier Manager',
    permissions: [
      'inventory_read',
      'inventory_write',
      'orders_read',
      'orders_write',
      'customers_read',
      'analytics_read',
      'compliance_read',
    ],
    warehouses: ['assigned'],
  },
  SUPPLIER_OPERATOR: {
    name: 'Supplier Operator',
    permissions: [
      'inventory_read',
      'orders_read',
      'orders_write',
      'customers_read',
    ],
    warehouses: ['assigned'],
  },
  SUPPLIER_VIEWER: {
    name: 'Supplier Viewer',
    permissions: [
      'inventory_read',
      'orders_read',
      'customers_read',
      'analytics_read',
    ],
    warehouses: ['assigned'],
  },
} as const

/**
 * Generate breadcrumb trail from pathname
 */
export function generateBreadcrumbs(
  pathname: string,
  warehouse?: Warehouse,
  customLabels?: Record<string, string>
): Array<{ label: string; href: string; icon?: LucideIcon }> {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: Array<{ label: string; href: string; icon?: LucideIcon }> = []

  // Add home
  breadcrumbs.push({
    label: 'Home',
    href: '/supplier',
  })

  // Add warehouse context if available
  if (warehouse && segments.includes('warehouse')) {
    breadcrumbs.push({
      label: warehouse.name,
      href: `/supplier/warehouse/${warehouse.id}`,
    })
  }

  // Process path segments
  let currentPath = ''
  segments.forEach((segment, index) => {
    if (segment === 'supplier') {
      currentPath += `/${segment}`
      return
    }

    currentPath += `/${segment}`
    const config = ROUTE_CONFIGS[currentPath]
    const customLabel = customLabels?.[segment]

    const label = customLabel || config?.title || formatSegmentLabel(segment)

    breadcrumbs.push({
      label,
      href: currentPath,
    })
  })

  return breadcrumbs
}

/**
 * Format path segment into readable label
 */
export function formatSegmentLabel(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if user has permission for a route
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermissions?: string[]
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  )
}

/**
 * Check if user has access to warehouse
 */
export function hasWarehouseAccess(
  userWarehouses: string[],
  requiredWarehouses?: string[]
): boolean {
  if (!requiredWarehouses || requiredWarehouses.length === 0) {
    return true
  }

  if (requiredWarehouses.includes('all')) {
    return userWarehouses.includes('all')
  }

  return requiredWarehouses.some(warehouse => 
    userWarehouses.includes(warehouse) || userWarehouses.includes('all')
  )
}

/**
 * Get warehouse by ID
 */
export function getWarehouse(warehouseId: string): Warehouse | undefined {
  return DEFAULT_WAREHOUSES.find(warehouse => warehouse.id === warehouseId)
}

/**
 * Get warehouses by status
 */
export function getWarehousesByStatus(
  status: Warehouse['status']
): Warehouse[] {
  return DEFAULT_WAREHOUSES.filter(warehouse => warehouse.status === status)
}

/**
 * Format warehouse time
 */
export function formatWarehouseTime(
  warehouse: Warehouse,
  date = new Date()
): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: warehouse.timezone,
    hour12: false,
  }).format(date)
}

/**
 * Check if warehouse is currently operating
 */
export function isWarehouseOperating(warehouse: Warehouse): boolean {
  const now = new Date()
  const currentTime = formatWarehouseTime(warehouse, now)
  const [currentHour, currentMinute] = currentTime.split(':').map(Number)
  const currentTotalMinutes = currentHour * 60 + currentMinute

  const [startHour, startMinute] = warehouse.operatingHours.start
    .split(':')
    .map(Number)
  const [endHour, endMinute] = warehouse.operatingHours.end
    .split(':')
    .map(Number)

  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute

  return (
    currentTotalMinutes >= startTotalMinutes &&
    currentTotalMinutes <= endTotalMinutes
  )
}

/**
 * Get navigation context from pathname and warehouse
 */
export function getNavigationContext(
  pathname: string,
  warehouse?: Warehouse,
  userPermissions: string[] = []
): NavigationContext {
  const breadcrumbs = generateBreadcrumbs(pathname, warehouse)
  const segments = pathname.split('/').filter(Boolean)
  const activeSection = segments[1] // First segment after 'supplier'

  return {
    currentPath: pathname,
    warehouse,
    breadcrumbs,
    activeSection,
    userPermissions,
    navigationHistory: [], // This would be managed by a context provider
  }
}

/**
 * Filter navigation items by permissions and warehouse access
 */
export function filterNavigationItems(
  items: NavigationItem[],
  userPermissions: string[],
  userWarehouses: string[] = ['all']
): NavigationItem[] {
  return items.filter(item => {
    // Check permissions
    if (item.metadata?.permissions) {
      if (!hasPermission(userPermissions, item.metadata.permissions)) {
        return false
      }
    }

    // Check warehouse access
    if (item.metadata?.warehouse) {
      if (!hasWarehouseAccess(userWarehouses, item.metadata.warehouse)) {
        return false
      }
    }

    // Recursively filter children
    if (item.children) {
      item.children = filterNavigationItems(
        item.children,
        userPermissions,
        userWarehouses
      )
    }

    return true
  })
}

/**
 * Search navigation items
 */
export function searchNavigationItems(
  items: NavigationItem[],
  query: string
): NavigationItem[] {
  const searchTerm = query.toLowerCase().trim()
  
  if (!searchTerm) {
    return items
  }

  return items.reduce((filtered: NavigationItem[], item) => {
    const matchesQuery = 
      item.label.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.id.toLowerCase().includes(searchTerm)

    const filteredChildren = item.children 
      ? searchNavigationItems(item.children, query)
      : []

    if (matchesQuery || filteredChildren.length > 0) {
      filtered.push({
        ...item,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      })
    }

    return filtered
  }, [])
}

/**
 * Get route configuration
 */
export function getRouteConfig(pathname: string): RouteConfig | undefined {
  return ROUTE_CONFIGS[pathname]
}

/**
 * Build navigation URL with warehouse context
 */
export function buildNavigationUrl(
  basePath: string,
  warehouse?: Warehouse,
  params?: Record<string, string>
): string {
  let url = basePath

  // Add warehouse context if needed
  if (warehouse && basePath.includes('/warehouse/')) {
    url = url.replace('/warehouse/', `/warehouse/${warehouse.id}/`)
  }

  // Add query parameters
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  return url
}

/**
 * Navigation analytics helpers
 */
export const NavigationAnalytics = {
  /**
   * Track navigation event
   */
  track: (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, {
        event_category: 'Navigation',
        ...properties,
      })
    }
  },

  /**
   * Track page view
   */
  pageView: (pathname: string, warehouse?: Warehouse) => {
    NavigationAnalytics.track('page_view', {
      page_path: pathname,
      warehouse_id: warehouse?.id,
      warehouse_region: warehouse?.region,
    })
  },

  /**
   * Track warehouse switch
   */
  warehouseSwitch: (fromWarehouse: string, toWarehouse: string) => {
    NavigationAnalytics.track('warehouse_switch', {
      from_warehouse: fromWarehouse,
      to_warehouse: toWarehouse,
    })
  },

  /**
   * Track navigation item click
   */
  navigationClick: (item: NavigationItem, level: number = 0) => {
    NavigationAnalytics.track('navigation_click', {
      item_id: item.id,
      item_label: item.label,
      item_href: item.href,
      navigation_level: level,
      has_children: !!item.children,
    })
  },
}

/**
 * Export types for external use
 */
export type {
  NavigationItem,
  NavigationContext,
  RouteConfig,
  Warehouse,
}

/**
 * Export constants
 */
export {
  DEFAULT_WAREHOUSES,
  ROUTE_CONFIGS,
  PERMISSION_LEVELS,
  USER_ROLES,
}