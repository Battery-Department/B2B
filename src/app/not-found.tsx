'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { Search, Home, ArrowLeft, MapPin, Package, Users, Wrench, Phone, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const metadata: Metadata = {
  title: 'Page Not Found | RHY Supplier Portal',
  description: 'The requested page could not be found in the RHY FlexVolt supplier portal.',
  robots: {
    index: false,
    follow: false
  }
}

export default function NotFoundPage() {
  const quickActions = [
    {
      title: 'FlexVolt Product Catalog',
      description: 'Browse 6Ah, 9Ah, and 15Ah FlexVolt batteries',
      href: '/customer/products',
      icon: Package,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Supplier Portal Dashboard',
      description: 'Access warehouse management and analytics',
      href: '/portal/dashboard',
      icon: Users,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Customer Portal',
      description: 'Order management and account settings',
      href: '/customer',
      icon: Wrench,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'System Status',
      description: 'Check operational status across warehouses',
      href: '/api/status',
      icon: MapPin,
      color: 'bg-orange-500 hover:bg-orange-600',
      external: true
    }
  ]

  const warehouseLocations = [
    {
      name: 'US West Coast',
      location: 'Los Angeles, CA',
      status: 'Operational',
      timezone: 'PST',
      hours: '6 AM - 6 PM'
    },
    {
      name: 'Japan Operations',
      location: 'Tokyo, Japan',
      status: 'Operational',
      timezone: 'JST',
      hours: '9 AM - 6 PM'
    },
    {
      name: 'EU Distribution',
      location: 'Berlin, Germany',
      status: 'Operational',
      timezone: 'CET',
      hours: '8 AM - 5 PM'
    },
    {
      name: 'Australia Pacific',
      location: 'Sydney, Australia',
      status: 'Operational',
      timezone: 'AEDT',
      hours: '8 AM - 5 PM'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b-2 border-lithi-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-lithi-primary to-lithi-primary-dark rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RHY Supplier Portal</h1>
                <p className="text-sm text-gray-600">FlexVolt Battery Operations</p>
              </div>
            </div>
            <Link href="/">
              <Button 
                variant="outline"
                className="border-2 border-lithi-primary text-lithi-primary hover:bg-lithi-primary hover:text-white transition-all duration-300"
              >
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main 404 Content */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-lithi-primary bg-opacity-10 rounded-full mb-6">
            <Search className="h-12 w-12 text-lithi-primary" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            The page you're looking for doesn't exist in the RHY Supplier Portal. 
            This could be due to a mistyped URL, an outdated link, or the page may have been moved.
          </p>

          <Alert className="max-w-2xl mx-auto mb-8 border-lithi-primary bg-blue-50">
            <Search className="h-4 w-4 text-lithi-primary" />
            <AlertTitle className="text-gray-900">
              Looking for FlexVolt Resources?
            </AlertTitle>
            <AlertDescription className="text-gray-700">
              Use the quick access links below to navigate to the most common pages in our 
              enterprise battery supply chain management system.
            </AlertDescription>
          </Alert>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Quick Access to Portal Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index}
                className="group bg-white border-2 border-gray-200 hover:border-lithi-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-lithi-lg cursor-pointer"
              >
                {action.external ? (
                  <a
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 ${action.color} rounded-lg mb-4 transition-transform duration-300 group-hover:scale-110`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      {action.title}
                      <ExternalLink className="h-4 w-4" />
                    </h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </a>
                ) : (
                  <Link href={action.href} className="block p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 ${action.color} rounded-lg mb-4 transition-transform duration-300 group-hover:scale-110`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Warehouse Status */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Global Warehouse Operations Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {warehouseLocations.map((warehouse, index) => (
              <Card key={index} className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-gray-900">{warehouse.name}</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{warehouse.location}</span>
                  </div>
                  <div>
                    <strong>Status:</strong> <span className="text-green-600">{warehouse.status}</span>
                  </div>
                  <div>
                    <strong>Hours:</strong> {warehouse.hours} {warehouse.timezone}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            <Link href="/">
              <Button className="bg-lithi-primary hover:bg-lithi-primary-dark text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lithi-button">
                <Home className="h-4 w-4 mr-2" />
                Return to Homepage
              </Button>
            </Link>

            <Link href="/customer/products">
              <Button 
                variant="outline"
                className="border-2 border-lithi-primary text-lithi-primary hover:bg-lithi-primary hover:text-white transition-all duration-300"
              >
                <Package className="h-4 w-4 mr-2" />
                Browse FlexVolt Products
              </Button>
            </Link>
          </div>

          {/* Support Information */}
          <Card className="max-w-2xl mx-auto bg-gray-50 border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <Phone className="h-6 w-6 text-lithi-primary flex-shrink-0 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Need Help Finding Something?
                </h4>
                <p className="text-gray-700 text-sm mb-3">
                  Our technical support team can help you navigate the RHY Supplier Portal 
                  and locate the specific FlexVolt battery resources you need.
                </p>
                <div className="space-y-1 text-sm">
                  <div><strong>Support:</strong> support@rhy-portal.com</div>
                  <div><strong>Phone:</strong> 1-800-FLEXVOLT (1-800-353-9865)</div>
                  <div><strong>Hours:</strong> 24/7 for critical operations</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              © 2024 RHY Global Warehouses. FlexVolt is a registered trademark.
            </p>
            <p>
              Enterprise-grade battery supply chain management across 4 global locations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}