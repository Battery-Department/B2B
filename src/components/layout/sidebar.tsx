"use client"

import { useState } from "react"
import {
  BarChart3,
  MessageSquare,
  Settings,
  Users,
  Zap,
  Home,
  X,
  HelpCircle,
  LogOut,
  FileText,
  Package,
  ShoppingCart,
  CreditCard,
  Layers,
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Truck,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Globe,
  Factory,
  Boxes,
  Target,
  PieChart,
  LineChart,
  Calculator,
  Bell,
  Mail,
  Phone,
  BookOpen,
  Archive,
  Database,
  Webhook,
  Building2,
  MapPin,
  Gauge
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { usePathname } from "next/navigation"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  activeRoute?: string
}

interface NavItem {
  name: string
  icon: any
  href?: string
  badge?: { text: string; variant: "default" | "secondary" | "destructive" | "outline" }
  subItems?: NavItem[]
  status?: "stable" | "beta" | "new" | "maintenance"
}

export default function Sidebar({ open, setOpen, activeRoute }: SidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set([
    "Operations Center", // Default expanded
    "Inventory Management"
  ]))

  const toggleMenu = (menuName: string) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuName)) {
      newExpanded.delete(menuName)
    } else {
      newExpanded.add(menuName)
    }
    setExpandedMenus(newExpanded)
  }

  // Core RHY Supplier Portal Navigation
  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/supplier/dashboard",
      badge: null,
    },
    {
      name: "Warehouse Overview",
      icon: Building2,
      href: "/supplier/warehouses",
      badge: null,
    },
    {
      name: "Operations Center",
      icon: Gauge,
      subItems: [
        {
          name: "Live Operations",
          icon: Clock,
          href: "/supplier/operations/live",
          badge: { text: "Live", variant: "default" }
        },
        {
          name: "Order Processing",
          icon: ShoppingCart,
          href: "/supplier/operations/orders",
        },
        {
          name: "Quality Control",
          icon: CheckCircle2,
          href: "/supplier/operations/quality",
        },
        {
          name: "Shipping Center",
          icon: Truck,
          href: "/supplier/operations/shipping",
        }
      ]
    },
    {
      name: "Inventory Management",
      icon: Package,
      subItems: [
        {
          name: "FlexVolt Inventory",
          icon: Zap,
          href: "/supplier/inventory/flexvolt",
          badge: { text: "6Ah•9Ah•15Ah", variant: "outline" }
        },
        {
          name: "Stock Levels",
          icon: Boxes,
          href: "/supplier/inventory/levels",
        },
        {
          name: "Warehouse Sync",
          icon: Globe,
          href: "/supplier/inventory/sync",
          status: "beta"
        },
        {
          name: "Forecasting",
          icon: TrendingUp,
          href: "/supplier/inventory/forecast",
        }
      ]
    },
    {
      name: "Analytics & Reports",
      icon: BarChart3,
      subItems: [
        {
          name: "Sales Analytics",
          icon: PieChart,
          href: "/supplier/analytics/sales",
        },
        {
          name: "Performance Metrics",
          icon: Target,
          href: "/supplier/analytics/performance",
        },
        {
          name: "Financial Reports",
          icon: Calculator,
          href: "/supplier/analytics/financial",
        },
        {
          name: "Trend Analysis",
          icon: LineChart,
          href: "/supplier/analytics/trends",
        }
      ]
    },
    {
      name: "Compliance & Security",
      icon: Shield,
      subItems: [
        {
          name: "Global Compliance",
          icon: Globe,
          href: "/supplier/compliance/global",
          badge: { text: "GDPR•OSHA•JIS•CE", variant: "outline" }
        },
        {
          name: "Audit Logs",
          icon: FileCheck,
          href: "/supplier/compliance/audit",
        },
        {
          name: "Security Monitoring",
          icon: AlertTriangle,
          href: "/supplier/compliance/security",
        },
        {
          name: "Documentation",
          icon: FileText,
          href: "/supplier/compliance/docs",
        }
      ]
    },
    {
      name: "Customer Relations",
      icon: Users,
      subItems: [
        {
          name: "Customer Portal",
          icon: Building2,
          href: "/supplier/customers/portal",
        },
        {
          name: "Support Tickets",
          icon: MessageSquare,
          href: "/supplier/customers/support",
          badge: { text: "3 Open", variant: "destructive" }
        },
        {
          name: "Contract Management",
          icon: FileText,
          href: "/supplier/customers/contracts",
        }
      ]
    },
    {
      name: "Communication Hub",
      icon: Bell,
      subItems: [
        {
          name: "Notifications",
          icon: Bell,
          href: "/supplier/communications/notifications",
          badge: { text: "12", variant: "destructive" }
        },
        {
          name: "Email Center",
          icon: Mail,
          href: "/supplier/communications/email",
        },
        {
          name: "Emergency Alerts",
          icon: AlertTriangle,
          href: "/supplier/communications/alerts",
        }
      ]
    }
  ]

  // Advanced/Admin Features
  const advancedItems: NavItem[] = [
    {
      name: "Integration APIs",
      icon: Webhook,
      href: "/supplier/integrations",
      badge: { text: "API", variant: "outline" }
    },
    {
      name: "Data Management",
      icon: Database,
      href: "/supplier/data",
    },
    {
      name: "System Settings",
      icon: Settings,
      href: "/supplier/settings",
    }
  ]

  const supportItems: NavItem[] = [
    {
      name: "Documentation",
      icon: BookOpen,
      href: "/supplier/help/docs",
    },
    {
      name: "Contact Support",
      icon: Phone,
      href: "/supplier/help/contact",
    }
  ]

  const isCurrentPath = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isActive = isCurrentPath(item.href)
    const isExpanded = expandedMenus.has(item.name)
    const hasSubItems = item.subItems && item.subItems.length > 0
    const indentClass = level === 0 ? "" : level === 1 ? "ml-6" : "ml-12"

    if (hasSubItems) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleMenu(item.name)}
            className={cn(
              "flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
              indentClass,
              isActive
                ? "bg-gradient-to-r from-blue-50 to-blue-100 text-[#006FEE] shadow-sm border-l-4 border-[#006FEE]"
                : "text-gray-700 hover:bg-gray-50 hover:text-[#006FEE]"
            )}
          >
            <item.icon className={cn(
              "mr-3 h-5 w-5 transition-colors",
              isActive ? "text-[#006FEE]" : "text-gray-400 group-hover:text-[#006FEE]"
            )} />
            <span className="flex-1 text-left font-medium">{item.name}</span>
            {item.badge && (
              <Badge 
                variant={item.badge.variant} 
                className={cn(
                  "mr-3 text-xs",
                  item.badge.variant === "destructive" ? "bg-red-500 text-white" :
                  item.badge.variant === "outline" ? "border-[#006FEE] text-[#006FEE]" :
                  "bg-[#006FEE] text-white"
                )}
              >
                {item.badge.text}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {isExpanded && (
            <div className="space-y-1 pb-2">
              {item.subItems?.map((subItem) => renderNavItem(subItem, level + 1))}
            </div>
          )}
        </div>
      )
    } else {
      return (
        <Link
          key={item.name}
          href={item.href || "#"}
          className={cn(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
            indentClass,
            isActive
              ? "bg-gradient-to-r from-blue-50 to-blue-100 text-[#006FEE] shadow-sm border-l-4 border-[#006FEE]"
              : "text-gray-700 hover:bg-gray-50 hover:text-[#006FEE]"
          )}
          onClick={() => {
            if (open && window.innerWidth < 1024) {
              setOpen(false)
            }
          }}
        >
          <item.icon className={cn(
            "mr-3 h-5 w-5 transition-colors",
            isActive ? "text-[#006FEE]" : "text-gray-400 group-hover:text-[#006FEE]"
          )} />
          <span className="flex-1 font-medium">{item.name}</span>
          {item.badge && (
            <Badge 
              variant={item.badge.variant} 
              className={cn(
                "text-xs",
                item.badge.variant === "destructive" ? "bg-red-500 text-white" :
                item.badge.variant === "outline" ? "border-[#006FEE] text-[#006FEE]" :
                "bg-[#006FEE] text-white"
              )}
            >
              {item.badge.text}
            </Badge>
          )}
          {item.status && (
            <div className={cn(
              "w-2 h-2 rounded-full ml-2",
              item.status === "new" ? "bg-emerald-500" :
              item.status === "beta" ? "bg-amber-500" :
              item.status === "maintenance" ? "bg-red-500" :
              "bg-gray-400"
            )} />
          )}
        </Link>
      )
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" 
          onClick={() => setOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-80 bg-white/95 backdrop-blur-md border-r-2 border-blue-100 transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 shadow-xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ 
          top: open ? '0' : '80px', // Adjust for header height
          height: open ? '100vh' : 'calc(100vh - 80px)',
          paddingTop: open ? '80px' : '0'
        }}
      >
        {/* Mobile Close Button */}
        <div className="absolute top-6 right-6 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex flex-col h-full">
          {/* Quick Status Bar */}
          <div className="px-6 py-4 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">All Systems Operational</span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-6">
              {/* Core Navigation */}
              <div className="space-y-1">
                <div className="px-3 mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Core Operations
                  </h3>
                </div>
                {navItems.map((item) => renderNavItem(item))}
              </div>

              <Separator className="border-blue-100" />

              {/* Advanced Features */}
              <div className="space-y-1">
                <div className="px-3 mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Advanced Tools
                  </h3>
                </div>
                {advancedItems.map((item) => renderNavItem(item))}
              </div>

              <Separator className="border-blue-100" />

              {/* Support */}
              <div className="space-y-1">
                <div className="px-3 mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Support & Help
                  </h3>
                </div>
                {supportItems.map((item) => renderNavItem(item))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="px-4 py-4 border-t border-blue-100">
            {/* Emergency Support Card */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#006FEE]">24/7 Support</h4>
                  <p className="text-xs text-gray-600">Enterprise assistance</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs border-[#006FEE] text-[#006FEE] hover:bg-[#006FEE] hover:text-white">
                Contact Support
              </Button>
            </div>

            {/* Sign Out */}
            <button
              onClick={() => logout()}
              className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}