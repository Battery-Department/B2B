"use client"

import { 
  Bell, 
  HelpCircle, 
  Menu, 
  Plus, 
  Search, 
  Shield, 
  Globe,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Zap,
  AlertTriangle,
  Wifi
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { useState, useEffect } from "react"

interface HeaderProps {
  onMenuClick: () => void
}

interface Warehouse {
  id: string
  name: string
  region: string
  timezone: string
  currency: string
  status: 'online' | 'maintenance' | 'offline'
}

const warehouses: Warehouse[] = [
  { id: 'us-west', name: 'US West Coast', region: 'Los Angeles, CA', timezone: 'PST', currency: 'USD', status: 'online' },
  { id: 'japan', name: 'Japan', region: 'Tokyo, Japan', timezone: 'JST', currency: 'JPY', status: 'online' },
  { id: 'eu', name: 'European Union', region: 'Berlin, Germany', timezone: 'CET', currency: 'EUR', status: 'maintenance' },
  { id: 'australia', name: 'Australia', region: 'Sydney, Australia', timezone: 'AEDT', currency: 'AUD', status: 'online' },
]

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0])
  const [notifications, setNotifications] = useState(7)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const navItems = [
    { name: "Dashboard", href: "/supplier/dashboard" },
    { name: "Inventory", href: "/supplier/inventory" },
    { name: "Orders", href: "/supplier/orders" },
    { name: "Analytics", href: "/supplier/analytics" },
    { name: "Compliance", href: "/supplier/compliance" },
  ]

  const getWarehouseStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500'
      case 'maintenance': return 'bg-amber-500'
      case 'offline': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTime = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone === 'PST' ? 'America/Los_Angeles' : 
                timezone === 'JST' ? 'Asia/Tokyo' :
                timezone === 'CET' ? 'Europe/Berlin' :
                timezone === 'AEDT' ? 'Australia/Sydney' : 'UTC',
      hour12: false
    }).format(date)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-white/95 border-b-2 border-blue-100 z-50 backdrop-blur-md shadow-md transition-all duration-300">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Logo & Navigation */}
        <div className="flex items-center space-x-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/supplier/dashboard"
              className="flex items-center space-x-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-0.5">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#006FEE] to-[#0050B3] bg-clip-text text-transparent">
                  RHY Supplier Portal
                </h1>
                <p className="text-xs text-gray-500 font-medium">FlexVolt Operations</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-[#006FEE] shadow-sm" 
                      : "text-gray-600 hover:text-[#006FEE] hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Center Section - Warehouse Selector & Search */}
        <div className="hidden md:flex items-center space-x-4 flex-1 max-w-2xl mx-8">
          {/* Warehouse Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 min-w-[200px] border-2 border-blue-100 hover:border-[#006FEE] transition-colors">
                <Globe className="h-4 w-4 text-[#006FEE]" />
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getWarehouseStatusColor(selectedWarehouse.status)}`} />
                  <span className="font-medium text-sm">{selectedWarehouse.name}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel className="text-center py-3">
                <div className="font-semibold text-[#006FEE]">Global Warehouse Network</div>
                <div className="text-xs text-gray-500 mt-1">Select operational warehouse</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {warehouses.map((warehouse) => (
                <DropdownMenuItem
                  key={warehouse.id}
                  onClick={() => setSelectedWarehouse(warehouse)}
                  className="flex items-center justify-between p-3 hover:bg-blue-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getWarehouseStatusColor(warehouse.status)}`} />
                    <div>
                      <div className="font-medium">{warehouse.name}</div>
                      <div className="text-xs text-gray-500">{warehouse.region}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatTime(currentTime, warehouse.timezone)}</div>
                    <div className="text-xs text-gray-500">{warehouse.timezone} • {warehouse.currency}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search SKUs, orders, compliance docs..."
              className="pl-10 bg-gray-50 border-2 border-gray-200 focus:border-[#006FEE] focus:bg-white transition-all duration-200 focus:shadow-lg"
            />
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-50 border">
            <Wifi className={`h-3 w-3 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className="text-xs font-medium text-gray-600">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Quick Actions */}
          <Button
            variant="default"
            size="sm"
            className="hidden md:flex bg-gradient-to-r from-[#006FEE] to-[#0050B3] hover:from-[#0050B3] hover:to-[#003A82] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600 text-xs">
                {notifications > 9 ? '9+' : notifications}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5 text-gray-600" />
            <span className="sr-only">Help & Support</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 rounded-xl hover:bg-gray-50 transition-colors p-2">
                <Avatar className="h-9 w-9 ring-2 ring-blue-100">
                  <AvatarImage src="/placeholder.svg" alt={user?.name || "Supplier"} />
                  <AvatarFallback className="bg-gradient-to-r from-[#006FEE] to-[#0050B3] text-white font-semibold">
                    {getInitials(user?.name || "Supplier")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-semibold text-gray-900">{user?.name || "Supplier"}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Supplier
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="py-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" alt={user?.name || "Supplier"} />
                    <AvatarFallback className="bg-gradient-to-r from-[#006FEE] to-[#0050B3] text-white">
                      {getInitials(user?.name || "Supplier")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{user?.name || "Supplier"}</div>
                    <div className="text-xs text-gray-500">{user?.email || "supplier@company.com"}</div>
                    <div className="text-xs text-emerald-600 font-medium">Premium Supplier</div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link href="/supplier/profile" className="flex items-center">
                  <User className="mr-3 h-4 w-4" />
                  Profile & Settings
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/supplier/compliance" className="flex items-center">
                  <Shield className="mr-3 h-4 w-4" />
                  Compliance Center
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/supplier/integrations" className="flex items-center">
                  <Zap className="mr-3 h-4 w-4" />
                  API & Integrations
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/supplier/help" className="flex items-center">
                  <HelpCircle className="mr-3 h-4 w-4" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => logout()}>
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Emergency Alert Bar */}
      {selectedWarehouse.status === 'maintenance' && (
        <div className="h-8 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-medium animate-pulse">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Warehouse maintenance scheduled • Limited operations until 15:00 {selectedWarehouse.timezone}
        </div>
      )}
    </header>
  )
}