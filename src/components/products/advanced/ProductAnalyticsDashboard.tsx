'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Eye, ShoppingCart, Users, Star, 
  Download, RefreshCw, Filter, Calendar, BarChart3, PieChart, LineChart,
  AlertTriangle, CheckCircle, Info, Target, Zap, Package
} from 'lucide-react';
import { useProductAnalytics, useRealTimeAnalytics, useCompetitiveAnalysis } from '@/hooks/useProductAnalytics';

interface ProductAnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  productIds?: string[];
  className?: string;
}

export function ProductAnalyticsDashboard({ 
  timeRange = '30d', 
  productIds,
  className = ''
}: ProductAnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedView, setSelectedView] = useState<'overview' | 'products' | 'behavior' | 'trends'>('overview');
  
  const { 
    metrics, 
    insights, 
    summaryStats, 
    productComparison,
    behaviorData,
    seasonalTrends,
    isLoading, 
    refresh, 
    exportData 
  } = useProductAnalytics({ timeRange: selectedTimeRange, productIds });
  
  const liveMetrics = useRealTimeAnalytics();
  const competitiveData = useCompetitiveAnalysis();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl p-8 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Intelligence Dashboard</h2>
            <p className="text-gray-600">Advanced analytics and performance insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006FEE]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={refresh}
              className="p-2 text-gray-600 hover:text-[#006FEE] hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => exportData('csv')}
              className="px-4 py-2 bg-[#006FEE] text-white rounded-lg hover:bg-[#0059D1] transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* View Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'behavior', label: 'Behavior', icon: Users },
            { id: 'trends', label: 'Trends', icon: LineChart }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedView(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                selectedView === id
                  ? 'bg-white text-[#006FEE] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Metrics Bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Live Metrics</span>
            </div>
            <div className="text-sm text-gray-600">
              Active Users: <span className="font-semibold text-gray-900">{liveMetrics.activeUsers}</span>
            </div>
            <div className="text-sm text-gray-600">
              Revenue Today: <span className="font-semibold text-green-600">{formatCurrency(liveMetrics.currentRevenue)}</span>
            </div>
            <div className="text-sm text-gray-600">
              Conversions: <span className="font-semibold text-blue-600">{liveMetrics.conversionsToday}</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Top Product: <span className="font-semibold text-purple-600">{liveMetrics.topProduct}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Eye size={20} className="text-white" />
                  </div>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats?.totalViews.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+12.3% vs last period</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <DollarSign size={20} className="text-white" />
                  </div>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats?.totalRevenue || 0)}</p>
                <p className="text-xs text-green-600 mt-1">+{summaryStats?.revenueGrowth}% growth</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Target size={20} className="text-white" />
                  </div>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(summaryStats?.averageConversionRate || 0)}</p>
                <p className="text-xs text-green-600 mt-1">Above industry avg</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Star size={20} className="text-white" />
                  </div>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats?.averageCustomerSatisfaction.toFixed(1)}/5</p>
                <p className="text-xs text-green-600 mt-1">Excellent rating</p>
              </div>
            </div>

            {/* Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-[#006FEE]" />
                  Performance Insights
                </h3>
                <div className="space-y-4">
                  {insights.slice(0, 4).map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                      <div className={`p-1 rounded-full ${
                        insight.type === 'success' ? 'bg-green-100' :
                        insight.type === 'warning' ? 'bg-yellow-100' :
                        insight.type === 'opportunity' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {insight.type === 'success' && <CheckCircle size={16} className="text-green-600" />}
                        {insight.type === 'warning' && <AlertTriangle size={16} className="text-yellow-600" />}
                        {insight.type === 'opportunity' && <Target size={16} className="text-blue-600" />}
                        {insight.type === 'trend' && <Info size={16} className="text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{insight.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        {insight.recommendation && (
                          <p className="text-xs text-[#006FEE] mt-2 font-medium">💡 {insight.recommendation}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {insight.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#006FEE]" />
                  Product Performance
                </h3>
                <div className="space-y-3">
                  {productComparison.map((product) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.productId} FlexVolt</p>
                          <p className="text-sm text-gray-600">{formatPercent(product.conversionRate)} conversion</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#006FEE] rounded-full transition-all duration-500"
                              style={{ width: `${(product.performanceScore / 100) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{product.performanceScore.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {selectedView === 'products' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {metrics.map((metric) => (
                <div key={metric.productId} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{metric.productId} FlexVolt</h3>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{metric.customerSatisfaction.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Revenue</p>
                      <p className="font-bold text-gray-900">{formatCurrency(metric.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Conversion</p>
                      <p className="font-bold text-gray-900">{formatPercent(metric.conversionRate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Views</p>
                      <p className="font-bold text-gray-900">{metric.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Purchases</p>
                      <p className="font-bold text-gray-900">{metric.purchases}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Profit Margin</span>
                      <span className="font-medium">{formatPercent(metric.profitMargin)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${metric.profitMargin}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Competitive Analysis */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Analysis</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Market Position</h4>
                  <div className="space-y-3">
                    {competitiveData.competitorData.map((competitor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{competitor.competitor}</p>
                          <p className="text-sm text-gray-600">{competitor.marketShare}% market share</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(competitor.price)}</p>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500 fill-current" />
                            <span className="text-sm">{competitor.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Price Recommendations</h4>
                  <div className="bg-white rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Optimal Price</span>
                        <span className="font-semibold text-green-600">{formatCurrency(competitiveData.priceRecommendations.optimal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Competitive Price</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(competitiveData.priceRecommendations.competitive)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Premium Price</span>
                        <span className="font-semibold text-purple-600">{formatCurrency(competitiveData.priceRecommendations.premium)}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{competitiveData.priceRecommendations.reasoning}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Behavior Tab */}
        {selectedView === 'behavior' && behaviorData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Scroll Depth</h4>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(behaviorData.scrollDepth)}</p>
                <p className="text-sm text-gray-600">Average page engagement</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Time on Page</h4>
                <p className="text-2xl font-bold text-gray-900">{Math.round(behaviorData.timeOnPage)}s</p>
                <p className="text-sm text-gray-600">Average session duration</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Bounce Rate</h4>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(behaviorData.bounceRate)}</p>
                <p className="text-sm text-gray-600">Single page visits</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Exit Rate</h4>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(behaviorData.exitRate)}</p>
                <p className="text-sm text-gray-600">Page exit frequency</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Behavior Heatmap</h3>
              <div className="relative w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0 p-4">
                  <p className="text-sm text-gray-600 mb-2">Click & Interaction Density</p>
                  <div className="grid grid-cols-10 gap-1 h-full">
                    {Array.from({ length: 50 }, (_, i) => (
                      <div
                        key={i}
                        className="rounded-sm transition-all duration-300"
                        style={{
                          backgroundColor: `rgba(0, 111, 238, ${Math.random() * 0.8 + 0.2})`,
                          height: `${Math.random() * 100}%`
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Low Activity</span>
                    <span>High Activity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {selectedView === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Sales Trends</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Monthly Sales Volume</h4>
                  <div className="space-y-2">
                    {seasonalTrends.map((trend, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-8">{trend.period}</span>
                        <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#006FEE] to-[#0084FF] rounded-full transition-all duration-500"
                            style={{ width: `${(trend.sales / 2000) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-16 text-right">{trend.sales.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Price Optimization Trends</h4>
                  <div className="space-y-3">
                    {seasonalTrends.slice(0, 6).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{trend.period}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{formatCurrency(trend.priceOptimization)}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            trend.priceOptimization > 100 ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Growth Opportunity</h4>
                <p className="text-sm text-green-700 mb-3">Spring season shows 40% demand increase for 6Ah batteries</p>
                <button className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors">
                  View Details
                </button>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Market Insight</h4>
                <p className="text-sm text-blue-700 mb-3">Commercial segment shows strongest conversion rates</p>
                <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors">
                  Explore
                </button>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">Price Optimization</h4>
                <p className="text-sm text-purple-700 mb-3">15Ah battery has room for 8% price increase</p>
                <button className="text-sm bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors">
                  Optimize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}