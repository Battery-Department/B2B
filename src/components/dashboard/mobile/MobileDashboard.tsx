'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Battery, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  User,
  Settings,
  Bell,
  Search,
  RefreshCw,
  Calculator,
  Grid,
  Download,
  Plus,
  Minus,
  Heart,
  Eye,
  Zap,
  Clock,
  Activity,
  Award,
  Gift,
  Truck,
  Shield,
  Star,
  AlertCircle,
  FileText,
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface MobileDashboardProps {
  className?: string;
  onSync?: () => void;
  onNotificationRead?: (notificationId: string) => void;
}

export default function MobileDashboard({ 
  className, 
  onSync, 
  onNotificationRead 
}: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [cart, setCart] = useState<{[key: string]: number}>({
    '6Ah': 0,
    '9Ah': 2,
    '15Ah': 1
  });
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Order Shipped', message: 'Your FlexVolt 9Ah order is on the way', time: '2 min ago', unread: true },
    { id: '2', title: 'New Promotion', message: '15% off bulk orders this week', time: '1 hour ago', unread: true },
    { id: '3', title: 'Fleet Update', message: 'Battery #247 needs replacement', time: '3 hours ago', unread: false }
  ]);

  // User data
  const user = {
    name: 'Mike Johnson',
    email: 'mike@constructionco.com',
    tier: 'Gold Partner',
    savings: 12456.00
  };

  const stats = {
    totalOrders: 3,
    monthlySpend: 4875,
    fleetSize: 247,
    discountTier: 15
  };

  const recentOrders = [
    {
      id: 'ORD-BD-2405-001',
      date: 'May 22, 2025',
      product: '9Ah FlexVolt Battery × 24 units',
      total: 3000.00,
      status: 'Delivered',
      savings: 1500.00
    },
    {
      id: 'ORD-BD-2405-002',
      date: 'May 20, 2025',
      product: 'Mid-Size Crew Package',
      total: 4425.00,
      status: 'In Transit',
      savings: 1105.00
    },
    {
      id: 'ORD-BD-2405-003',
      date: 'May 18, 2025',
      product: '15Ah FlexVolt Battery × 12 units',
      total: 2940.00,
      status: 'Processing',
      savings: 1008.00
    }
  ];

  const batteryProducts = [
    {
      id: '6Ah',
      name: '6Ah FlexVolt Battery',
      runtime: 'Up to 4 hours',
      weight: '1.9 lbs',
      price: 95,
      msrp: 169,
      savings: 44,
      workOutput: '225 screws / 175 ft cuts',
      chargingTime: '45 minutes',
      popular: false
    },
    {
      id: '9Ah',
      name: '9Ah FlexVolt Battery',
      runtime: 'Up to 6.5 hours',
      weight: '2.4 lbs',
      price: 125,
      msrp: 249,
      savings: 50,
      workOutput: '340 screws / 260 ft cuts',
      chargingTime: '55 minutes',
      popular: true
    },
    {
      id: '15Ah',
      name: '15Ah FlexVolt Battery',
      runtime: 'Up to 10 hours',
      weight: '3.2 lbs',
      price: 245,
      msrp: 379,
      savings: 35,
      workOutput: '560 screws / 430 ft cuts',
      chargingTime: '90 minutes',
      popular: false
    }
  ];

  const updateQuantity = (batteryId: string, delta: number) => {
    setCart(prev => ({
      ...prev,
      [batteryId]: Math.max(0, prev[batteryId] + delta)
    }));
  };

  const subtotal = Object.entries(cart).reduce((sum, [battery, qty]) => {
    const batteryData = batteryProducts.find(b => b.id === battery);
    return sum + (batteryData ? batteryData.price * qty : 0);
  }, 0);

  const discountPercentage = subtotal >= 5000 ? 20 : subtotal >= 2500 ? 15 : subtotal >= 1000 ? 10 : 0;
  const discountAmount = subtotal * (discountPercentage / 100);
  const total = subtotal - discountAmount;
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'In Transit':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    if (onNotificationRead) {
      onNotificationRead(notificationId);
    }
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
    );
  };

  const renderDashboardTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white shadow-sm border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cart Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                <p className="text-xs text-green-600">Ready to order</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cart Value</p>
                <p className="text-2xl font-bold text-gray-900">${total.toFixed(0)}</p>
                <p className="text-xs text-green-600">{discountPercentage}% discount</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Battery className="h-5 w-5 text-blue-600" />
            Fleet Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.fleetSize}</p>
              <p className="text-sm text-gray-600">Total Batteries</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.totalOrders}</p>
              <p className="text-sm text-gray-600">Active Orders</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.discountTier}%</p>
              <p className="text-sm text-gray-600">Bulk Discount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Quick Reorder
          </Button>
          <Button className="w-full justify-start" variant="outline" size="lg">
            <Calculator className="h-4 w-4 mr-2" />
            Runtime Calculator
          </Button>
          <Button className="w-full justify-start" variant="outline" size="lg">
            <Grid className="h-4 w-4 mr-2" />
            Browse Products
          </Button>
          <Button className="w-full justify-start" variant="outline" size="lg">
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderProductsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">FlexVolt Batteries</h2>
        <Button variant="outline" size="sm">
          <Grid className="h-4 w-4" />
        </Button>
      </div>
      
      {batteryProducts.map(battery => (
        <Card key={battery.id} className="relative">
          {battery.popular && (
            <Badge className="absolute -top-2 right-4 bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Popular
            </Badge>
          )}
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{battery.name}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-blue-600">${battery.price}</span>
                  <span className="text-sm text-gray-500 line-through">${battery.msrp}</span>
                  <Badge variant="secondary" className="text-xs">
                    -{battery.savings}%
                  </Badge>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Battery className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{battery.runtime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>{battery.chargingTime} charge</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>{battery.workOutput}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(battery.id, -1)}
                  disabled={cart[battery.id] === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-8 text-center">
                  {cart[battery.id] || 0}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(battery.id, 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>
      
      {recentOrders.map(order => (
        <Card key={order.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{order.id}</p>
                <p className="text-xs text-gray-600">{order.date}</p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{order.product}</p>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                <p className="text-xs text-green-600">
                  Saved ${order.savings.toFixed(2)}
                </p>
              </div>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-1" />
                Reorder
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <Button variant="outline" size="sm" onClick={onSync}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {notifications.map(notification => (
        <Card 
          key={notification.id}
          className={`cursor-pointer transition-colors ${
            notification.unread ? 'bg-blue-50 border-blue-200' : 'bg-white'
          }`}
          onClick={() => handleNotificationClick(notification.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                notification.unread ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className || ''}`}>
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Battery className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">Battery Department</h1>
                <p className="text-blue-100 text-sm">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs" />
                )}
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search FlexVolt batteries..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        {/* User Tier Banner */}
        <div className="px-4 pb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">{user.tier}</p>
                <p className="text-xs opacity-90">{stats.discountTier}% Bulk Discount</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">${user.savings.toFixed(0)}</p>
              <p className="text-xs opacity-90">Total Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 pb-20">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'products' && renderProductsTab()}
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
      </div>

      {/* Cart Summary (if items in cart) */}
      {totalItems > 0 && (
        <div className="fixed top-16 right-4 left-4 z-40">
          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{totalItems} items in cart</p>
                  <p className="text-lg font-bold text-blue-600">${total.toFixed(2)}</p>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {[
            { id: 'dashboard', icon: Grid, label: 'Dashboard' },
            { id: 'products', icon: Battery, label: 'Products' },
            { id: 'orders', icon: ShoppingCart, label: 'Orders' },
            { id: 'notifications', icon: Bell, label: 'Alerts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                activeTab === tab.id 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <tab.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.id === 'notifications' && notifications.filter(n => n.unread).length > 0 && (
                <div className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
