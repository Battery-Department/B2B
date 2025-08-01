'use client';

// Business Intelligence & Reporting - Automated report generation and analytics
// Handles executive dashboards, custom reports, and data visualization

import { metricsCalculator } from '../analytics/metrics-calculator';
import { analyticsDataLayer } from '../database/analytics-data-layer';
import { realTimeAnalyticsEngine } from '../analytics/real-time-engine';

export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'operational' | 'financial' | 'customer' | 'product' | 'custom';
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'dashboard' | 'pdf' | 'excel' | 'csv' | 'json';
  recipients: string[];
  lastGenerated: Date;
  nextScheduled: Date;
  isActive: boolean;
  config: {
    dateRange: 'last_24h' | 'last_7d' | 'last_30d' | 'last_90d' | 'custom';
    metrics: string[];
    filters: { [key: string]: any };
    visualizations: string[];
  };
}

export interface ReportData {
  reportId: string;
  generatedAt: Date;
  timeRange: { start: Date; end: Date };
  summary: {
    totalRevenue: number;
    orderCount: number;
    customerCount: number;
    conversionRate: number;
    keyInsights: string[];
  };
  sections: Array<{
    title: string;
    type: 'chart' | 'table' | 'kpi' | 'text';
    data: any;
    insights: string[];
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    expectedImpact: string;
    actionItems: string[];
  }>;
}

export interface ExecutiveDashboard {
  timestamp: Date;
  kpis: {
    revenue: { value: number; change: number; status: 'up' | 'down' | 'stable' };
    orders: { value: number; change: number; status: 'up' | 'down' | 'stable' };
    customers: { value: number; change: number; status: 'up' | 'down' | 'stable' };
    margin: { value: number; change: number; status: 'up' | 'down' | 'stable' };
  };
  trends: Array<{
    metric: string;
    data: Array<{ date: Date; value: number }>;
    trend: 'increasing' | 'decreasing' | 'stable';
    forecast: Array<{ date: Date; value: number; confidence: number }>;
  }>;
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    timestamp: Date;
  }>;
  insights: Array<{
    type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
    title: string;
    description: string;
    impact: number;
    confidence: number;
  }>;
}

export interface CustomReportBuilder {
  id: string;
  name: string;
  metrics: Array<{
    id: string;
    name: string;
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    filters: { [key: string]: any };
  }>;
  dimensions: Array<{
    id: string;
    name: string;
    type: 'time' | 'category' | 'geography' | 'product';
  }>;
  visualizations: Array<{
    type: 'line' | 'bar' | 'pie' | 'table' | 'gauge' | 'heatmap';
    config: any;
  }>;
  scheduling: {
    frequency: string;
    recipients: string[];
    format: string;
  };
}

export class BusinessIntelligence {
  private reports: Map<string, Report> = new Map();
  private reportCache: Map<string, ReportData> = new Map();
  private customReports: Map<string, CustomReportBuilder> = new Map();
  private executiveDashboard: ExecutiveDashboard | null = null;
  private isGenerating = false;

  constructor() {
    this.initializeStandardReports();
    this.startReportScheduler();
    this.updateExecutiveDashboard();
  }

  /**
   * Initialize standard business reports
   */
  private initializeStandardReports(): void {
    const standardReports: Omit<Report, 'id'>[] = [
      {
        name: 'Executive Summary',
        description: 'High-level business performance overview for executives',
        type: 'executive',
        frequency: 'daily',
        format: 'dashboard',
        recipients: ['ceo@company.com', 'cfo@company.com'],
        lastGenerated: new Date(),
        nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        config: {
          dateRange: 'last_30d',
          metrics: ['revenue', 'orders', 'customers', 'margin', 'growth'],
          filters: {},
          visualizations: ['kpi_cards', 'trend_charts', 'performance_matrix']
        }
      },
      {
        name: 'Revenue Analysis',
        description: 'Detailed revenue breakdown and analysis',
        type: 'financial',
        frequency: 'weekly',
        format: 'pdf',
        recipients: ['cfo@company.com', 'finance@company.com'],
        lastGenerated: new Date(),
        nextScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        config: {
          dateRange: 'last_90d',
          metrics: ['revenue', 'profit', 'costs', 'margin', 'roi'],
          filters: {},
          visualizations: ['revenue_trends', 'profit_breakdown', 'cost_analysis']
        }
      },
      {
        name: 'Customer Insights',
        description: 'Customer behavior and satisfaction analysis',
        type: 'customer',
        frequency: 'weekly',
        format: 'dashboard',
        recipients: ['marketing@company.com', 'sales@company.com'],
        lastGenerated: new Date(),
        nextScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        config: {
          dateRange: 'last_30d',
          metrics: ['clv', 'cac', 'churn', 'satisfaction', 'retention'],
          filters: {},
          visualizations: ['customer_segments', 'behavior_flow', 'satisfaction_trends']
        }
      },
      {
        name: 'Product Performance',
        description: 'Product sales and inventory analysis',
        type: 'product',
        frequency: 'weekly',
        format: 'excel',
        recipients: ['product@company.com', 'inventory@company.com'],
        lastGenerated: new Date(),
        nextScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        config: {
          dateRange: 'last_30d',
          metrics: ['sales', 'inventory', 'turnover', 'margin', 'returns'],
          filters: {},
          visualizations: ['product_matrix', 'inventory_levels', 'sales_trends']
        }
      },
      {
        name: 'Operational Metrics',
        description: 'Operational efficiency and performance tracking',
        type: 'operational',
        frequency: 'daily',
        format: 'dashboard',
        recipients: ['operations@company.com', 'support@company.com'],
        lastGenerated: new Date(),
        nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        config: {
          dateRange: 'last_7d',
          metrics: ['fulfillment', 'shipping', 'support', 'uptime', 'performance'],
          filters: {},
          visualizations: ['operational_kpis', 'efficiency_trends', 'sla_tracking']
        }
      }
    ];

    standardReports.forEach((report, index) => {
      const reportWithId: Report = {
        id: `report_${index + 1}`,
        ...report
      };
      this.reports.set(reportWithId.id, reportWithId);
    });

    console.log('Initialized', standardReports.length, 'standard reports');
  }

  /**
   * Generate report data
   */
  public async generateReport(reportId: string): Promise<ReportData> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    // Check cache first
    const cached = this.reportCache.get(reportId);
    if (cached && this.isCacheValid(cached, report.frequency)) {
      return cached;
    }

    this.isGenerating = true;

    try {
      console.log(`Generating report: ${report.name}`);

      // Calculate time range
      const timeRange = this.calculateTimeRange(report.config.dateRange);

      // Get metrics based on report type
      const metrics = await this.getReportMetrics(report, timeRange);

      // Generate insights and recommendations
      const insights = await this.generateInsights(metrics, report.type);
      const recommendations = await this.generateRecommendations(metrics, insights);

      // Create report sections
      const sections = await this.createReportSections(report, metrics);

      const reportData: ReportData = {
        reportId,
        generatedAt: new Date(),
        timeRange,
        summary: {
          totalRevenue: metrics.revenue?.totalRevenue || 0,
          orderCount: metrics.customer?.totalCustomers || 0,
          customerCount: metrics.customer?.totalCustomers || 0,
          conversionRate: metrics.performance?.conversionRate || 0,
          keyInsights: insights.slice(0, 3).map(i => i.title)
        },
        sections,
        recommendations
      };

      // Cache the report
      this.reportCache.set(reportId, reportData);

      // Update last generated timestamp
      report.lastGenerated = new Date();
      report.nextScheduled = this.calculateNextScheduled(report.frequency);

      console.log(`Report generated: ${report.name}`);
      return reportData;

    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Generate executive dashboard
   */
  public async generateExecutiveDashboard(): Promise<ExecutiveDashboard> {
    try {
      const timeRange = this.calculateTimeRange('last_30d');
      const previousPeriodRange = {
        start: new Date(timeRange.start.getTime() - (timeRange.end.getTime() - timeRange.start.getTime())),
        end: timeRange.start
      };

      // Get current and previous period metrics
      const [currentMetrics, previousMetrics] = await Promise.all([
        metricsCalculator.getAllMetrics(timeRange),
        metricsCalculator.getAllMetrics(previousPeriodRange)
      ]);

      // Calculate KPIs with changes
      const kpis = {
        revenue: {
          value: currentMetrics.revenue.totalRevenue,
          change: this.calculateChange(
            currentMetrics.revenue.totalRevenue,
            previousMetrics.revenue.totalRevenue
          ),
          status: this.determineStatus(currentMetrics.revenue.revenueGrowth)
        },
        orders: {
          value: currentMetrics.customer.totalCustomers, // Using customers as proxy for orders
          change: this.calculateChange(
            currentMetrics.customer.totalCustomers,
            previousMetrics.customer.totalCustomers
          ),
          status: this.determineStatus(currentMetrics.customer.customerGrowthRate)
        },
        customers: {
          value: currentMetrics.customer.totalCustomers,
          change: this.calculateChange(
            currentMetrics.customer.totalCustomers,
            previousMetrics.customer.totalCustomers
          ),
          status: this.determineStatus(currentMetrics.customer.customerGrowthRate)
        },
        margin: {
          value: currentMetrics.revenue.grossMargin,
          change: this.calculateChange(
            currentMetrics.revenue.grossMargin,
            previousMetrics.revenue.grossMargin
          ),
          status: this.determineStatus(
            currentMetrics.revenue.grossMargin - previousMetrics.revenue.grossMargin
          )
        }
      };

      // Generate trends and forecasts
      const trends = await this.generateTrends(timeRange);

      // Get real-time alerts
      const liveData = await new Promise<any>((resolve) => {
        const unsubscribe = realTimeAnalyticsEngine.subscribe((data) => {
          unsubscribe();
          resolve(data);
        });
      });

      const alerts = liveData.alerts.map((alert: any) => ({
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        timestamp: alert.timestamp
      }));

      // Generate business insights
      const insights = await this.generateBusinessInsights(currentMetrics, trends);

      this.executiveDashboard = {
        timestamp: new Date(),
        kpis,
        trends,
        alerts,
        insights
      };

      return this.executiveDashboard;

    } catch (error) {
      console.error('Executive dashboard generation error:', error);
      throw error;
    }
  }

  /**
   * Create custom report
   */
  public async createCustomReport(builder: Omit<CustomReportBuilder, 'id'>): Promise<string> {
    const reportId = `custom_${Date.now()}`;
    const customReport: CustomReportBuilder = {
      id: reportId,
      ...builder
    };

    this.customReports.set(reportId, customReport);

    // If scheduling is configured, add to standard reports
    if (customReport.scheduling.frequency && customReport.scheduling.frequency !== 'manual') {
      const report: Report = {
        id: reportId,
        name: customReport.name,
        description: `Custom report: ${customReport.name}`,
        type: 'custom',
        frequency: customReport.scheduling.frequency as any,
        format: customReport.scheduling.format as any,
        recipients: customReport.scheduling.recipients,
        lastGenerated: new Date(),
        nextScheduled: this.calculateNextScheduled(customReport.scheduling.frequency as any),
        isActive: true,
        config: {
          dateRange: 'last_30d',
          metrics: customReport.metrics.map(m => m.id),
          filters: {},
          visualizations: customReport.visualizations.map(v => v.type)
        }
      };

      this.reports.set(reportId, report);
    }

    console.log('Custom report created:', customReport.name);
    return reportId;
  }

  /**
   * Export report in specified format
   */
  public async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv' | 'json'): Promise<{
    filename: string;
    data: any;
    mimeType: string;
  }> {
    const reportData = await this.generateReport(reportId);
    const report = this.reports.get(reportId);

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${report.name.replace(/\s+/g, '_').toLowerCase()}_${timestamp}`;

    switch (format) {
      case 'json':
        return {
          filename: `${filename}.json`,
          data: JSON.stringify(reportData, null, 2),
          mimeType: 'application/json'
        };

      case 'csv':
        const csvData = this.convertToCSV(reportData);
        return {
          filename: `${filename}.csv`,
          data: csvData,
          mimeType: 'text/csv'
        };

      case 'excel':
        const excelData = this.convertToExcel(reportData);
        return {
          filename: `${filename}.xlsx`,
          data: excelData,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };

      case 'pdf':
        const pdfData = this.convertToPDF(reportData);
        return {
          filename: `${filename}.pdf`,
          data: pdfData,
          mimeType: 'application/pdf'
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Schedule report delivery
   */
  public async scheduleReportDelivery(reportId: string, recipients: string[]): Promise<void> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    report.recipients = recipients;
    console.log(`Scheduled delivery for report: ${report.name} to ${recipients.length} recipients`);

    // In production, this would integrate with email service
    // await emailService.scheduleReport(report, recipients);
  }

  // Private helper methods

  private calculateTimeRange(dateRange: string): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;

    switch (dateRange) {
      case 'last_24h':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last_7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90d':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  private async getReportMetrics(report: Report, timeRange: { start: Date; end: Date }): Promise<any> {
    switch (report.type) {
      case 'executive':
        return await metricsCalculator.getAllMetrics(timeRange);
      case 'financial':
        return {
          revenue: await metricsCalculator.calculateRevenueMetrics(timeRange),
          financial: await metricsCalculator.calculateFinancialKPIs(timeRange)
        };
      case 'customer':
        return {
          customer: await metricsCalculator.calculateCustomerMetrics(timeRange)
        };
      case 'product':
        return {
          product: await metricsCalculator.calculateProductMetrics(timeRange)
        };
      case 'operational':
        return {
          operational: await metricsCalculator.calculateOperationalMetrics(timeRange),
          performance: await metricsCalculator.calculatePerformanceMetrics(timeRange)
        };
      default:
        return await metricsCalculator.getAllMetrics(timeRange);
    }
  }

  private async generateInsights(metrics: any, reportType: string): Promise<Array<{
    type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
    title: string;
    description: string;
    impact: number;
    confidence: number;
  }>> {
    const insights = [];

    // Revenue growth insight
    if (metrics.revenue?.revenueGrowth > 15) {
      insights.push({
        type: 'opportunity' as const,
        title: 'Strong Revenue Growth',
        description: `Revenue is growing at ${metrics.revenue.revenueGrowth.toFixed(1)}% which is above industry average`,
        impact: 85,
        confidence: 92
      });
    }

    // Customer acquisition insight
    if (metrics.customer?.customerGrowthRate > 10) {
      insights.push({
        type: 'trend' as const,
        title: 'Customer Base Expansion',
        description: `Customer growth rate of ${metrics.customer.customerGrowthRate.toFixed(1)}% indicates strong market traction`,
        impact: 78,
        confidence: 87
      });
    }

    // Churn risk insight
    if (metrics.customer?.churnRate > 8) {
      insights.push({
        type: 'risk' as const,
        title: 'Elevated Churn Risk',
        description: `Churn rate of ${metrics.customer.churnRate.toFixed(1)}% is above optimal threshold`,
        impact: 65,
        confidence: 83
      });
    }

    // Inventory optimization insight
    if (metrics.product?.stockoutRate > 5) {
      insights.push({
        type: 'risk' as const,
        title: 'Inventory Management Concern',
        description: `Stockout rate of ${metrics.product.stockoutRate.toFixed(1)}% may impact customer satisfaction`,
        impact: 70,
        confidence: 89
      });
    }

    return insights;
  }

  private async generateRecommendations(metrics: any, insights: any[]): Promise<Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    expectedImpact: string;
    actionItems: string[];
  }>> {
    const recommendations = [];

    // High-priority recommendations based on insights
    if (insights.some(i => i.type === 'risk' && i.impact > 70)) {
      recommendations.push({
        priority: 'high' as const,
        category: 'Risk Mitigation',
        title: 'Address High-Impact Risks',
        description: 'Immediate action required to mitigate identified risks',
        expectedImpact: '15-25% improvement in key metrics',
        actionItems: [
          'Implement customer retention program',
          'Optimize inventory management system',
          'Enhance customer support processes'
        ]
      });
    }

    // Growth opportunity recommendations
    if (metrics.revenue?.revenueGrowth > 10) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'Growth Opportunity',
        title: 'Scale Successful Initiatives',
        description: 'Capitalize on current growth momentum',
        expectedImpact: '10-20% additional revenue growth',
        actionItems: [
          'Increase marketing spend in high-performing channels',
          'Expand product line based on demand patterns',
          'Enhance customer acquisition strategies'
        ]
      });
    }

    // Operational efficiency recommendations
    recommendations.push({
      priority: 'medium' as const,
      category: 'Operational Excellence',
      title: 'Improve Operational Efficiency',
      description: 'Streamline operations to reduce costs and improve service',
      expectedImpact: '5-15% cost reduction',
      actionItems: [
        'Automate manual processes',
        'Optimize supply chain operations',
        'Implement performance monitoring tools'
      ]
    });

    return recommendations;
  }

  private async createReportSections(report: Report, metrics: any): Promise<Array<{
    title: string;
    type: 'chart' | 'table' | 'kpi' | 'text';
    data: any;
    insights: string[];
  }>> {
    const sections = [];

    // KPI section
    if (report.config.visualizations.includes('kpi_cards')) {
      sections.push({
        title: 'Key Performance Indicators',
        type: 'kpi' as const,
        data: {
          revenue: metrics.revenue?.totalRevenue || 0,
          growth: metrics.revenue?.revenueGrowth || 0,
          customers: metrics.customer?.totalCustomers || 0,
          conversion: metrics.performance?.conversionRate || 0
        },
        insights: [
          'Revenue performance is tracking above target',
          'Customer acquisition remains strong',
          'Conversion optimization opportunities identified'
        ]
      });
    }

    // Trend charts section
    if (report.config.visualizations.includes('trend_charts')) {
      sections.push({
        title: 'Performance Trends',
        type: 'chart' as const,
        data: {
          type: 'line',
          series: [
            {
              name: 'Revenue',
              data: this.generateMockTrendData('revenue', 30)
            },
            {
              name: 'Orders',
              data: this.generateMockTrendData('orders', 30)
            }
          ]
        },
        insights: [
          'Revenue shows consistent upward trend',
          'Seasonal patterns align with historical data',
          'Growth acceleration expected in Q4'
        ]
      });
    }

    // Product performance section
    if (metrics.product && report.config.visualizations.includes('product_matrix')) {
      sections.push({
        title: 'Product Performance Analysis',
        type: 'table' as const,
        data: {
          headers: ['Product', 'Revenue', 'Units Sold', 'Conversion Rate', 'Trend'],
          rows: metrics.product.topSellingProducts?.map((product: any) => [
            product.name,
            `$${product.revenue.toLocaleString()}`,
            product.unitsSold.toLocaleString(),
            `${product.conversionRate.toFixed(1)}%`,
            '↗️'
          ]) || []
        },
        insights: [
          '9Ah FlexVolt Battery leads in both revenue and units',
          'All products show positive conversion trends',
          'Inventory optimization opportunities identified'
        ]
      });
    }

    return sections;
  }

  private generateMockTrendData(metric: string, days: number): Array<{ x: string; y: number }> {
    const data = [];
    const baseValue = metric === 'revenue' ? 1500 : 45;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const trend = 1 + (Math.sin((days - i) / 10) * 0.1);
      const noise = 1 + (Math.random() - 0.5) * 0.2;
      const value = Math.round(baseValue * trend * noise);
      
      data.push({
        x: date.toISOString().split('T')[0],
        y: value
      });
    }
    
    return data;
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private determineStatus(change: number): 'up' | 'down' | 'stable' {
    if (Math.abs(change) < 1) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private async generateTrends(timeRange: { start: Date; end: Date }): Promise<Array<{
    metric: string;
    data: Array<{ date: Date; value: number }>;
    trend: 'increasing' | 'decreasing' | 'stable';
    forecast: Array<{ date: Date; value: number; confidence: number }>;
  }>> {
    return [
      {
        metric: 'revenue',
        data: this.generateMockTimeSeriesData('revenue', 30),
        trend: 'increasing',
        forecast: this.generateMockForecast('revenue', 7)
      },
      {
        metric: 'orders',
        data: this.generateMockTimeSeriesData('orders', 30),
        trend: 'increasing',
        forecast: this.generateMockForecast('orders', 7)
      }
    ];
  }

  private generateMockTimeSeriesData(metric: string, days: number): Array<{ date: Date; value: number }> {
    const data = [];
    const baseValue = metric === 'revenue' ? 1500 : 45;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const trend = 1 + (i / days) * 0.3; // Upward trend
      const noise = 1 + (Math.random() - 0.5) * 0.15;
      const value = Math.round(baseValue * trend * noise);
      
      data.push({ date, value });
    }
    
    return data;
  }

  private generateMockForecast(metric: string, days: number): Array<{ date: Date; value: number; confidence: number }> {
    const data = [];
    const baseValue = metric === 'revenue' ? 1800 : 55; // Higher than current trend
    
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const trend = 1 + (i / days) * 0.2;
      const confidence = Math.max(60, 95 - (i * 5)); // Decreasing confidence over time
      const value = Math.round(baseValue * trend);
      
      data.push({ date, value, confidence });
    }
    
    return data;
  }

  private async generateBusinessInsights(metrics: any, trends: any[]): Promise<Array<{
    type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
    title: string;
    description: string;
    impact: number;
    confidence: number;
  }>> {
    return [
      {
        type: 'opportunity',
        title: 'Market Expansion Opportunity',
        description: 'Current growth trajectory indicates readiness for market expansion',
        impact: 85,
        confidence: 78
      },
      {
        type: 'trend',
        title: 'Customer Loyalty Improvement',
        description: 'Customer retention rates are improving month-over-month',
        impact: 72,
        confidence: 85
      },
      {
        type: 'risk',
        title: 'Inventory Management Alert',
        description: 'Some products approaching stockout levels',
        impact: 65,
        confidence: 92
      }
    ];
  }

  private isCacheValid(cached: ReportData, frequency: string): boolean {
    const now = Date.now();
    const cacheAge = now - cached.generatedAt.getTime();
    
    const validityPeriods = {
      'realtime': 1 * 60 * 1000,      // 1 minute
      'hourly': 60 * 60 * 1000,       // 1 hour
      'daily': 24 * 60 * 60 * 1000,   // 1 day
      'weekly': 7 * 24 * 60 * 60 * 1000, // 1 week
      'monthly': 30 * 24 * 60 * 60 * 1000, // 1 month
      'quarterly': 90 * 24 * 60 * 60 * 1000 // 3 months
    };
    
    return cacheAge < (validityPeriods[frequency as keyof typeof validityPeriods] || validityPeriods.daily);
  }

  private calculateNextScheduled(frequency: string): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  private convertToCSV(reportData: ReportData): string {
    // Simple CSV conversion - in production this would be more sophisticated
    let csv = 'Metric,Value,Change\n';
    csv += `Revenue,${reportData.summary.totalRevenue},\n`;
    csv += `Orders,${reportData.summary.orderCount},\n`;
    csv += `Customers,${reportData.summary.customerCount},\n`;
    csv += `Conversion Rate,${reportData.summary.conversionRate}%,\n`;
    return csv;
  }

  private convertToExcel(reportData: ReportData): string {
    // Mock Excel conversion - in production this would use a proper library
    return JSON.stringify(reportData);
  }

  private convertToPDF(reportData: ReportData): string {
    // Mock PDF conversion - in production this would use a PDF library
    return JSON.stringify(reportData);
  }

  private startReportScheduler(): void {
    // Check for scheduled reports every hour
    setInterval(() => {
      this.processScheduledReports();
    }, 60 * 60 * 1000);
  }

  private async processScheduledReports(): Promise<void> {
    const now = new Date();
    
    for (const [reportId, report] of this.reports.entries()) {
      if (report.isActive && report.nextScheduled <= now) {
        try {
          await this.generateReport(reportId);
          console.log(`Scheduled report generated: ${report.name}`);
          
          // In production, this would send the report to recipients
          // await this.deliverReport(reportId, report.recipients);
          
        } catch (error) {
          console.error(`Failed to generate scheduled report ${report.name}:`, error);
        }
      }
    }
  }

  private async updateExecutiveDashboard(): void {
    // Update executive dashboard every 5 minutes
    setInterval(async () => {
      try {
        await this.generateExecutiveDashboard();
      } catch (error) {
        console.error('Failed to update executive dashboard:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Get all reports
   */
  public getReports(): Report[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get report by ID
   */
  public getReport(reportId: string): Report | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get executive dashboard
   */
  public getExecutiveDashboard(): ExecutiveDashboard | null {
    return this.executiveDashboard;
  }

  /**
   * Delete report
   */
  public deleteReport(reportId: string): boolean {
    const deleted = this.reports.delete(reportId);
    this.reportCache.delete(reportId);
    this.customReports.delete(reportId);
    return deleted;
  }

  /**
   * Toggle report active status
   */
  public toggleReportStatus(reportId: string): boolean {
    const report = this.reports.get(reportId);
    if (report) {
      report.isActive = !report.isActive;
      return true;
    }
    return false;
  }

  /**
   * Clear report cache
   */
  public clearCache(): void {
    this.reportCache.clear();
    console.log('Report cache cleared');
  }

  /**
   * Get business intelligence status
   */
  public getStatus(): {
    totalReports: number;
    activeReports: number;
    customReports: number;
    cacheSize: number;
    isGenerating: boolean;
    lastDashboardUpdate: Date | null;
  } {
    return {
      totalReports: this.reports.size,
      activeReports: Array.from(this.reports.values()).filter(r => r.isActive).length,
      customReports: this.customReports.size,
      cacheSize: this.reportCache.size,
      isGenerating: this.isGenerating,
      lastDashboardUpdate: this.executiveDashboard?.timestamp || null
    };
  }
}

// Export singleton instance
export const businessIntelligence = new BusinessIntelligence();