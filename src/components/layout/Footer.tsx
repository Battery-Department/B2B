"use client"

import Link from "next/link"
import { 
  Shield, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ExternalLink,
  FileText,
  Building2,
  Zap,
  Users,
  Heart,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Github
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"

const Footer = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const warehouseInfo = [
    {
      region: "US West Coast",
      location: "Los Angeles, CA",
      timezone: "PST",
      phone: "+1 (555) 123-4567",
      email: "us-west@rhy-portal.com",
      hours: "6 AM - 6 PM PST"
    },
    {
      region: "Japan",
      location: "Tokyo, Japan",
      timezone: "JST",
      phone: "+81 3-1234-5678",
      email: "japan@rhy-portal.com",
      hours: "9 AM - 6 PM JST"
    },
    {
      region: "European Union",
      location: "Berlin, Germany",
      timezone: "CET",
      phone: "+49 30 12345678",
      email: "eu@rhy-portal.com",
      hours: "8 AM - 5 PM CET"
    },
    {
      region: "Australia",
      location: "Sydney, Australia",
      timezone: "AEDT",
      phone: "+61 2 1234 5678",
      email: "aus@rhy-portal.com",
      hours: "8 AM - 5 PM AEDT"
    }
  ]

  const complianceLinks = [
    { name: "GDPR Compliance", href: "/compliance/gdpr", icon: FileText },
    { name: "OSHA Standards", href: "/compliance/osha", icon: Shield },
    { name: "JIS Certification", href: "/compliance/jis", icon: FileText },
    { name: "CE Marking", href: "/compliance/ce", icon: Shield },
    { name: "Privacy Policy", href: "/legal/privacy", icon: FileText },
    { name: "Terms of Service", href: "/legal/terms", icon: FileText },
    { name: "Security Policy", href: "/legal/security", icon: Shield },
    { name: "Audit Reports", href: "/compliance/audits", icon: FileText }
  ]

  const quickLinks = [
    { name: "Dashboard", href: "/supplier/dashboard", icon: Building2 },
    { name: "FlexVolt Inventory", href: "/supplier/inventory/flexvolt", icon: Zap },
    { name: "Order Processing", href: "/supplier/operations/orders", icon: Users },
    { name: "Analytics", href: "/supplier/analytics/sales", icon: Building2 },
    { name: "Support Center", href: "/supplier/help/contact", icon: Phone },
    { name: "Documentation", href: "/supplier/help/docs", icon: FileText },
    { name: "API Reference", href: "/supplier/integrations", icon: FileText },
    { name: "System Status", href: "/status", icon: Globe }
  ]

  const formatTime = (date: Date, timezone: string) => {
    const timeZoneMap: { [key: string]: string } = {
      'PST': 'America/Los_Angeles',
      'JST': 'Asia/Tokyo',
      'CET': 'Europe/Berlin',
      'AEDT': 'Australia/Sydney'
    }
    
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZoneMap[timezone] || 'UTC',
      hour12: false
    }).format(date)
  }

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Emergency Contact Bar */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 py-3">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center space-x-6 text-center">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span className="text-sm font-semibold">24/7 Emergency: +1 (800) RHY-HELP</span>
            </div>
            <Separator orientation="vertical" className="h-4 bg-red-300" />
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-semibold">emergency@rhy-portal.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Company Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-xl flex items-center justify-center">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">RHY Supplier Portal</h3>
                <p className="text-gray-400 text-sm">FlexVolt Operations</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed">
              Enterprise FlexVolt battery supply chain management across global warehouses. 
              Empowering professional contractors and fleet managers worldwide with 20V/60V MAX compatibility.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">4 Global Warehouses</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">Trusted by 10,000+ Suppliers</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">Enterprise Security Certified</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-blue-600">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-blue-600">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-blue-600">
                <Youtube className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-blue-600">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Quick Access</h4>
            <div className="grid grid-cols-1 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors group"
                >
                  <link.icon className="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
                  <span className="text-sm">{link.name}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          {/* Global Warehouses */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Global Operations</h4>
            <div className="space-y-4">
              {warehouseInfo.map((warehouse) => (
                <div key={warehouse.region} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-white">{warehouse.region}</h5>
                    <span className="text-xs text-blue-400 font-mono">
                      {formatTime(currentTime, warehouse.timezone)} {warehouse.timezone}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{warehouse.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span>{warehouse.hours}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3" />
                      <span>{warehouse.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance & Legal */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Compliance & Legal</h4>
            <div className="grid grid-cols-1 gap-3">
              {complianceLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors group"
                >
                  <link.icon className="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
                  <span className="text-sm">{link.name}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>

            {/* Certification Badges */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-300">SOC 2 Type II Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-300">ISO 27001 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-300">GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FlexVolt Product Information Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-white mb-4">FlexVolt Battery Lineup</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-800/50 rounded-lg p-4 border border-blue-700">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <span className="font-bold text-white">FlexVolt 6Ah</span>
                </div>
                <p className="text-blue-200 text-sm">Professional Grade • 2hr Runtime • $95.00</p>
                <p className="text-xs text-blue-300 mt-1">20V/60V MAX Compatible</p>
              </div>
              <div className="bg-blue-800/50 rounded-lg p-4 border border-blue-700">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <span className="font-bold text-white">FlexVolt 9Ah</span>
                </div>
                <p className="text-blue-200 text-sm">Heavy-duty Grade • 3hr Runtime • $125.00</p>
                <p className="text-xs text-blue-300 mt-1">20V/60V MAX Compatible</p>
              </div>
              <div className="bg-blue-800/50 rounded-lg p-4 border border-blue-700">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <span className="font-bold text-white">FlexVolt 15Ah</span>
                </div>
                <p className="text-blue-200 text-sm">Industrial Grade • 5hr Runtime • $245.00</p>
                <p className="text-xs text-blue-300 mt-1">20V/60V MAX Compatible</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-900 border-t border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>© 2025 RHY Supplier Portal. All rights reserved.</span>
              <Separator orientation="vertical" className="h-4 bg-gray-600" />
              <span>Enterprise-grade FlexVolt operations platform</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>All Systems Operational</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-gray-600" />
              <div className="flex items-center space-x-2">
                <Globe className="h-3 w-3" />
                <span>Global Uptime: 99.9%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Built with <Heart className="inline h-3 w-3 text-red-500 mx-1" /> for professional contractors and fleet managers worldwide. 
                Powered by enterprise-grade infrastructure across 4 global regions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer