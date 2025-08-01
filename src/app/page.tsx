import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Battery } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Battery className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Battery Department Portal
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete B2B E-commerce Platform with AI-Powered Analytics
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Link href="/customer/dashboard">
              <div className="p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Customer Portal</h3>
                <p className="text-blue-700">Access your dashboard, orders, and product catalog</p>
              </div>
            </Link>
            <Link href="/supplier/dashboard">
              <div className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Supplier Portal</h3>
                <p className="text-green-700">Manage inventory, orders, and analytics</p>
              </div>
            </Link>
            <Link href="/admin/dashboard">
              <div className="p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Admin Portal</h3>
                <p className="text-purple-700">Enterprise management and ML operations</p>
              </div>
            </Link>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            ✅ MobileDashboard Component Created<br/>
            ✅ All Portal Systems Active<br/>
            ✅ Complete Battery Dashboard Deployed
          </div>
        </div>
      </div>
    </div>
  )
}