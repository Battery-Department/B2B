/**
 * Navigation Components Export Index
 * 
 * This file exports all navigation components for easy importing throughout the application.
 * 
 * @example
 * ```tsx
 * import { MainNav, Breadcrumbs, MobileNav } from '@/components/navigation'
 * 
 * export default function Layout() {
 *   return (
 *     <div>
 *       <MainNav />
 *       <Breadcrumbs />
 *       <MobileNav />
 *     </div>
 *   )
 * }
 * ```
 */

export { MainNav as default, MainNav } from './MainNav'
export { Breadcrumbs, WarehouseBreadcrumbs, useWarehouseBreadcrumbs } from './Breadcrumbs'
export { MobileNav } from './MobileNav'

// Re-export navigation utilities
export {
  generateBreadcrumbs,
  formatSegmentLabel,
  hasPermission,
  hasWarehouseAccess,
  getWarehouse,
  getWarehousesByStatus,
  formatWarehouseTime,
  isWarehouseOperating,
  getNavigationContext,
  filterNavigationItems,
  searchNavigationItems,
  getRouteConfig,
  buildNavigationUrl,
  NavigationAnalytics,
  DEFAULT_WAREHOUSES,
  ROUTE_CONFIGS,
  PERMISSION_LEVELS,
  USER_ROLES,
} from '@/lib/navigation'

// Re-export types
export type {
  NavigationItem,
  NavigationContext,
  RouteConfig,
  Warehouse,
} from '@/lib/navigation'