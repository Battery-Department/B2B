'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Clock,
  BarChart3, PieChart, LineChart, Zap, Package, Calendar, RefreshCw,
  ArrowUp, ArrowDown, Minus, Star, DollarSign, Users, ShoppingCart,
  Brain, Activity, Gauge
} from 'lucide-react';
import { usePerformancePrediction, useProductComparison } from '@/hooks/usePerformancePrediction';

interface PerformancePredictionDashboardProps {
  productId?: string;
  timeHorizon?: '1month' | '3months' | '6months' | '1year';
  showComparison?: boolean;
  className?: string;
}

export function PerformancePredictionDashboard({
  productId = '9Ah',
  timeHorizon = '3months',
  showComparison = true,
  className = ''
}: PerformancePredictionDashboardProps) {
  const [selectedProduct, setSelectedProduct] = useState(productId);
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState(timeHorizon);
  const [selectedView, setSelectedView] = useState<'overview' | 'demand' | 'satisfaction' | 'inventory' | 'scenarios'>('overview');

  const {
    predictions,
    insights,
    scenarios,
    summaryMetrics,
    riskAssessment,
    recommendations,
    isLoading,
    error,
    updateFilters,
    refresh
  } = usePerformancePrediction({
    productId: selectedProduct,
    timeHorizon: selectedTimeHorizon,
    targetMetric: 'demand'
  });

  const { comparisons, isLoading: isLoadingComparison } = useProductComparison(
    showComparison ? ['6Ah', '9Ah', '15Ah'] : [],
    selectedTimeHorizon
  );

  const handleProductChange = (newProductId: string) => {
    setSelectedProduct(newProductId);
    updateFilters({ productId: newProductId });
  };

  const handleTimeHorizonChange = (newTimeHorizon: '1month' | '3months' | '6months' | '1year') => {
    setSelectedTimeHorizon(newTimeHorizon);
    updateFilters({ timeHorizon: newTimeHorizon });
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing':
      case 'improving':
      case 'gaining':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'declining':
      case 'losing':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Minus size={16} className="text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl p-8 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl p-8 ${className}`}>
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Prediction Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-[#006FEE] text-white rounded-lg hover:bg-[#0059D1] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Brain size={24} className="text-[#006FEE]" />
              Performance Prediction Engine
            </h2>
            <p className="text-gray-600">AI-powered forecasting and performance insights</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedProduct}
              onChange={(e) => handleProductChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006FEE]"
            >
              <option value="6Ah">6Ah FlexVolt</option>
              <option value="9Ah">9Ah FlexVolt</option>
              <option value="15Ah">15Ah FlexVolt</option>
            </select>
            
            <select
              value={selectedTimeHorizon}
              onChange={(e) => handleTimeHorizonChange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006FEE]"
            >
              <option value="1month">1 Month</option>
              <option value="3months">3 Months</option>
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
            </select>
            
            <button
              onClick={refresh}
              className="p-2 text-gray-600 hover:text-[#006FEE] hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* View Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'demand', label: 'Demand', icon: TrendingUp },
            { id: 'satisfaction', label: 'Satisfaction', icon: Star },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'scenarios', label: 'Scenarios', icon: Activity }
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

      <div className="p-6">
        {/* Overview Tab */}
        {selectedView === 'overview' && summaryMetrics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  {getTrendIcon(insights?.demandTrend)}
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Demand Growth</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(summaryMetrics.demandGrowth)}</p>
                <p className="text-xs text-blue-600 mt-1">{insights?.demandTrend || 'stable'}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <DollarSign size={20} className="text-white" />
                  </div>
                  <ArrowUp size={16} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Revenue Projection</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryMetrics.revenueProjection)}</p>
                <p className="text-xs text-green-600 mt-1">{selectedTimeHorizon} forecast</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Star size={20} className="text-white" />
                  </div>
                  {getTrendIcon(insights?.satisfactionTrend)}
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Satisfaction Score</p>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.satisfactionScore.toFixed(1)}/5</p>
                <p className="text-xs text-purple-600 mt-1">{insights?.satisfactionTrend || 'stable'}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Package size={20} className="text-white" />
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    summaryMetrics.inventoryHealth === 'Optimal' ? 'bg-green-500' :
                    summaryMetrics.inventoryHealth === 'Low Stock' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Inventory Status</p>
                <p className="text-lg font-bold text-gray-900">{summaryMetrics.inventoryHealth}</p>
                <p className="text-xs text-orange-600 mt-1">Current level</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gray-500 rounded-lg">
                    <Gauge size={20} className="text-white" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(summaryMetrics.confidence)}`}>
                    {(summaryMetrics.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Confidence Level</p>
                <p className="text-2xl font-bold text-gray-900">{(summaryMetrics.confidence * 100).toFixed(0)}%</p>
                <p className="text-xs text-gray-600 mt-1">Prediction accuracy</p>
              </div>
            </div>

            {/* Predictions Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-[#006FEE]" />
                  Key Predictions
                </h3>
                <div className="space-y-4">
                  {predictions?.demandForecast && (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Demand Forecast</h4>
                        <span className="text-sm text-gray-500">{selectedTimeHorizon}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-2xl font-bold text-[#006FEE]">{predictions.demandForecast.predictedDemand.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Units</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Range: {predictions.demandForecast.demandRange.min.toLocaleString()} - {predictions.demandForecast.demandRange.max.toLocaleString()}</p>
                          <p>Confidence: {(predictions.demandForecast.confidence * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {predictions?.revenueProjection && (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Revenue Projection</h4>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={14} className="text-green-500" />
                          <span className="text-sm text-green-600">{formatPercent(predictions.revenueProjection.growthRate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(predictions.revenueProjection.predicted)}</p>
                          <p className="text-sm text-gray-600">Projected</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Min: {formatCurrency(predictions.revenueProjection.range.min)}</p>
                          <p>Max: {formatCurrency(predictions.revenueProjection.range.max)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {predictions?.marketShareProjection && (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Market Share</h4>
                        {getTrendIcon(predictions.marketShareProjection.trend)}
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{formatPercent(predictions.marketShareProjection.predicted * 100)}</p>
                          <p className="text-sm text-gray-600">Projected share</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Trend: {predictions.marketShareProjection.trend}</p>
                          <p>Pressure: {(predictions.marketShareProjection.competitivePressure * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target size={20} className="text-[#006FEE]" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {recommendations.slice(0, 5).map((rec, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border">
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-blue-100 rounded">
                          <CheckCircle size={14} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{rec.action}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span>Impact: {formatPercent(rec.expectedImpact * 100)}</span>
                            <span>Time: {rec.timeToImpact}</span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              rec.cost === 'low' ? 'bg-green-100 text-green-700' :
                              rec.cost === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {rec.cost} cost
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            {riskAssessment && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    Risk Factors
                  </h3>
                  <div className="space-y-3">
                    {riskAssessment.risks.slice(0, 3).map((risk, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            risk.severity === 'high' ? 'bg-red-500' :
                            risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{risk.description}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Type: {risk.type} • Severity: {risk.severity}
                            </p>
                            {risk.mitigation && (
                              <p className="text-xs text-blue-600 mt-1">💡 {risk.mitigation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-600" />
                    Opportunities
                  </h3>
                  <div className="space-y-3">
                    {riskAssessment.opportunities.slice(0, 3).map((opportunity, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            opportunity.potential === 'high' ? 'bg-green-500' :
                            opportunity.potential === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{opportunity.description}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Type: {opportunity.type} • Potential: {opportunity.potential}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Comparison */}
        {showComparison && !isLoadingComparison && comparisons.length > 0 && (
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-[#006FEE]" />
              Product Performance Comparison
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {comparisons.map((comparison) => (
                <div key={comparison.productId} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{comparison.productId} FlexVolt</h4>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#006FEE] rounded-full transition-all duration-500"
                          style={{ width: `${comparison.score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 ml-1">{(comparison.score * 100).toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Predicted Demand:</span>
                      <span className="font-medium">{comparison.prediction.demandForecast.predictedDemand.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-medium">{formatCurrency(comparison.prediction.revenueProjection.predicted)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Satisfaction:</span>
                      <span className="font-medium">{comparison.prediction.satisfactionForecast.predictedSatisfaction.toFixed(1)}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(comparison.insights.demandTrend)}
                        <span className="font-medium capitalize">{comparison.insights.demandTrend}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}