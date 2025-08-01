import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
  Percent,
  Eye,
  MousePointer,
  RotateCcw
} from 'lucide-react'
import { useQuizAnalytics } from '@/services/analytics/quiz-analytics'

interface AnalyticsMetric {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  description: string
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])
  const [funnelData, setFunnelData] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [isLoading, setIsLoading] = useState(true)
  
  const { getFunnelMetrics, getInsights } = useQuizAnalytics()

  // Sample data for charts
  const conversionData = [
    { name: 'Quiz Started', value: 1250, fill: '#3b82f6' },
    { name: 'Quiz Completed', value: 875, fill: '#10b981' },
    { name: 'Results Viewed', value: 798, fill: '#f59e0b' },
    { name: 'Added to Cart', value: 456, fill: '#ef4444' },
    { name: 'Checkout', value: 312, fill: '#8b5cf6' },
    { name: 'Purchase', value: 234, fill: '#06b6d4' }
  ]

  const userTypeData = [
    { name: 'Professional', value: 65, fill: '#3b82f6' },
    { name: 'DIY Enthusiast', value: 35, fill: '#10b981' }
  ]

  const timeSeriesData = [
    { date: '2024-01-01', quizStarts: 45, completions: 32, conversions: 18 },
    { date: '2024-01-02', quizStarts: 52, completions: 38, conversions: 22 },
    { date: '2024-01-03', quizStarts: 48, completions: 35, conversions: 19 },
    { date: '2024-01-04', quizStarts: 61, completions: 44, conversions: 26 },
    { date: '2024-01-05', quizStarts: 55, completions: 41, conversions: 24 },
    { date: '2024-01-06', quizStarts: 58, completions: 42, conversions: 25 },
    { date: '2024-01-07', quizStarts: 67, completions: 48, conversions: 29 }
  ]

  const hesitationData = [
    { questionId: 'team-size', question: 'Team Size', avgHesitation: 3.2, responses: 1200 },
    { questionId: 'budget', question: 'Budget Range', avgHesitation: 2.8, responses: 980 },
    { questionId: 'tools', question: 'Primary Tools', avgHesitation: 2.1, responses: 850 },
    { questionId: 'work-type', question: 'Work Type', avgHesitation: 1.9, responses: 1100 },
    { questionId: 'timeline', question: 'Purchase Timeline', avgHesitation: 1.5, responses: 750 }
  ]

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    
    try {
      // Load funnel metrics
      const funnel = await getFunnelMetrics()
      setFunnelData(funnel)
      
      // Load insights
      const analyticsInsights = await getInsights()
      setInsights(analyticsInsights)
      
      // Calculate key metrics
      const calculatedMetrics: AnalyticsMetric[] = [
        {
          title: 'Quiz Completion Rate',
          value: `${funnel.conversionRates.completionRate.toFixed(1)}%`,
          change: 5.2,
          changeType: 'increase',
          icon: <CheckCircle className="h-4 w-4" />,
          description: 'Users who complete the full quiz'
        },
        {
          title: 'Quiz to Cart Conversion',
          value: `${funnel.conversionRates.addToCartRate.toFixed(1)}%`,
          change: -2.1,
          changeType: 'decrease',
          icon: <ShoppingCart className="h-4 w-4" />,
          description: 'Quiz completers who add items to cart'
        },
        {
          title: 'Average Order Value',
          value: `$${funnel.averageOrderValue.toFixed(0)}`,
          change: 12.3,
          changeType: 'increase',
          icon: <DollarSign className="h-4 w-4" />,
          description: 'Average value of quiz-driven orders'
        },
        {
          title: 'Quiz Sessions',
          value: funnel.quizStarted.toLocaleString(),
          change: 8.7,
          changeType: 'increase',
          icon: <Users className="h-4 w-4" />,
          description: 'Total quiz sessions started'
        },
        {
          title: 'Avg Completion Time',
          value: `${(analyticsInsights.averageCompletionTime / 1000 / 60).toFixed(1)}m`,
          change: -5.4,
          changeType: 'increase', // Faster is better
          icon: <Clock className="h-4 w-4" />,
          description: 'Average time to complete quiz'
        },
        {
          title: 'Revenue from Quiz',
          value: `$${funnel.totalRevenue.toLocaleString()}`,
          change: 18.9,
          changeType: 'increase',
          icon: <Target className="h-4 w-4" />,
          description: 'Total revenue attributed to quiz'
        }
      ]
      
      setMetrics(calculatedMetrics)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getChangeIcon = (changeType: string) => {
    return changeType === 'increase' ? (
      <TrendingUp className="h-3 w-3 text-green-600" />
    ) : changeType === 'decrease' ? (
      <TrendingDown className="h-3 w-3 text-red-600" />
    ) : (
      <Activity className="h-3 w-3 text-gray-600" />
    )
  }

  const getChangeColor = (changeType: string) => {
    return changeType === 'increase' ? 'text-green-600' : 
           changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track quiz performance, conversion rates, and user insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <Button onClick={loadAnalyticsData} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {getChangeIcon(metric.changeType)}
                <span className={`ml-1 ${getChangeColor(metric.changeType)}`}>
                  {Math.abs(metric.change)}%
                </span>
                <span className="ml-1">vs previous period</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Conversion rates */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate:</span>
                <span className="font-medium">
                  {funnelData?.conversionRates.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overall Conversion:</span>
                <span className="font-medium">
                  {funnelData?.conversionRates.overallConversionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Conversion by user type */}
            <div className="mt-4 space-y-2">
              {insights?.conversionRateByUserType && Object.entries(insights.conversionRateByUserType).map(([type, rate]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="capitalize">{type} Conversion:</span>
                  <span className="font-medium">{(rate as number).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="quizStarts" 
                  stroke="#3b82f6" 
                  name="Quiz Starts"
                />
                <Line 
                  type="monotone" 
                  dataKey="completions" 
                  stroke="#10b981" 
                  name="Completions"
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#f59e0b" 
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hesitation Points Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Question Difficulty Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hesitationData.map((item, index) => (
                <div key={item.questionId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.question}</div>
                    <div className="text-xs text-gray-600">
                      {item.responses.toLocaleString()} responses
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {item.avgHesitation.toFixed(1)}s
                      </div>
                      <div className="text-xs text-gray-600">avg. hesitation</div>
                    </div>
                    <Badge 
                      variant={item.avgHesitation > 3 ? "destructive" : 
                              item.avgHesitation > 2 ? "secondary" : "default"}
                    >
                      {item.avgHesitation > 3 ? 'High' : 
                       item.avgHesitation > 2 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">High Professional Engagement</div>
                    <div className="text-xs text-gray-600">
                      Professional contractors show 23% higher completion rates
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Budget Question Friction</div>
                    <div className="text-xs text-gray-600">
                      Users hesitate most on budget selection ({insights?.hesitationPoints?.[0]?.avgHesitation.toFixed(1)}s avg)
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Strong Weekend Performance</div>
                    <div className="text-xs text-gray-600">
                      Weekend sessions show 15% higher conversion rates
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900">
                    Optimize Budget Question
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Add price range examples or visual aids to reduce hesitation time
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-900">
                    Expand Professional Features
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    Add team management and bulk pricing features for contractors
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-sm font-medium text-yellow-900">
                    A/B Test DIY Flow
                  </div>
                  <div className="text-xs text-yellow-700 mt-1">
                    Test simplified question flow for DIY users to improve completion
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}