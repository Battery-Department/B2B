/**
 * RHY_043 - Stock Calculation Utilities
 * Advanced stock level calculations and analytics for FlexVolt battery inventory
 * Enterprise-grade algorithms for stock optimization and forecasting
 */

import { logger } from '@/lib/logger';

// ===================================
// STOCK LEVEL CLASSIFICATION
// ===================================

export interface StockLevelClassification {
  level: 'critical' | 'low' | 'adequate' | 'high' | 'overstock';
  severity: 'normal' | 'warning' | 'danger' | 'critical';
  percentage: number;
  daysUntilStockout?: number;
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Classify stock level based on current quantity and thresholds
 */
export function classifyStockLevel(
  currentStock: number,
  minStock: number,
  maxStock: number,
  averageDailyUsage: number = 0
): StockLevelClassification {
  const percentage = minStock > 0 ? (currentStock / minStock) * 100 : 0;
  
  // Calculate days until stockout
  let daysUntilStockout: number | undefined;
  if (averageDailyUsage > 0 && currentStock > 0) {
    daysUntilStockout = Math.floor(currentStock / averageDailyUsage);
  }

  // Classification logic
  if (currentStock === 0) {
    return {
      level: 'critical',
      severity: 'critical',
      percentage: 0,
      daysUntilStockout: 0,
      recommendedAction: 'Emergency reorder required - Out of stock',
      urgency: 'critical'
    };
  }
  
  if (currentStock <= minStock * 0.1) {
    return {
      level: 'critical',
      severity: 'critical',
      percentage,
      daysUntilStockout,
      recommendedAction: 'Immediate reorder required - Critical level',
      urgency: 'critical'
    };
  }
  
  if (currentStock <= minStock * 0.25) {
    return {
      level: 'low',
      severity: 'danger',
      percentage,
      daysUntilStockout,
      recommendedAction: 'Reorder soon - Very low stock',
      urgency: 'high'
    };
  }
  
  if (currentStock <= minStock * 0.5) {
    return {
      level: 'low',
      severity: 'warning',
      percentage,
      daysUntilStockout,
      recommendedAction: 'Plan reorder - Low stock',
      urgency: 'medium'
    };
  }
  
  if (currentStock >= maxStock) {
    return {
      level: 'overstock',
      severity: 'warning',
      percentage,
      daysUntilStockout,
      recommendedAction: 'Consider reducing orders - Overstocked',
      urgency: 'low'
    };
  }
  
  if (currentStock >= minStock * 2) {
    return {
      level: 'high',
      severity: 'normal',
      percentage,
      daysUntilStockout,
      recommendedAction: 'Stock levels good',
      urgency: 'low'
    };
  }
  
  return {
    level: 'adequate',
    severity: 'normal',
    percentage,
    daysUntilStockout,
    recommendedAction: 'Monitor stock levels',
    urgency: 'low'
  };
}

// ===================================
// REORDER CALCULATIONS
// ===================================

export interface ReorderCalculation {
  shouldReorder: boolean;
  suggestedQuantity: number;
  reorderPoint: number;
  safetyStock: number;
  economicOrderQuantity: number;
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string[];
}

/**
 * Calculate optimal reorder quantity and timing
 */
export function calculateReorder(
  currentStock: number,
  minStock: number,
  maxStock: number,
  averageDailyUsage: number,
  leadTimeDays: number,
  unitCost: number,
  holdingCostRate: number = 0.25, // 25% annual holding cost
  orderCost: number = 50 // Fixed cost per order
): ReorderCalculation {
  const reasoning: string[] = [];
  
  // Calculate safety stock (buffer for demand variation)
  const safetyStock = Math.ceil(averageDailyUsage * leadTimeDays * 0.5);
  reasoning.push(`Safety stock: ${safetyStock} units (50% of lead time demand)`);
  
  // Calculate reorder point
  const reorderPoint = Math.max(
    (averageDailyUsage * leadTimeDays) + safetyStock,
    minStock
  );
  reasoning.push(`Reorder point: ${reorderPoint} units`);
  
  // Economic Order Quantity (EOQ) calculation
  const annualDemand = averageDailyUsage * 365;
  const economicOrderQuantity = Math.ceil(
    Math.sqrt((2 * annualDemand * orderCost) / (unitCost * holdingCostRate))
  );
  reasoning.push(`EOQ: ${economicOrderQuantity} units`);
  
  // Determine if reorder is needed
  const shouldReorder = currentStock <= reorderPoint;
  
  // Calculate suggested quantity
  let suggestedQuantity = 0;
  if (shouldReorder) {
    // Order enough to reach max stock level
    suggestedQuantity = Math.max(
      maxStock - currentStock,
      economicOrderQuantity,
      minStock * 2 // At least 2x minimum stock
    );
    reasoning.push(`Suggested quantity: ${suggestedQuantity} units`);
  }
  
  // Determine priority
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (currentStock === 0) {
    priority = 'critical';
    reasoning.push('Priority: CRITICAL - Out of stock');
  } else if (currentStock <= reorderPoint * 0.5) {
    priority = 'high';
    reasoning.push('Priority: HIGH - Below 50% of reorder point');
  } else if (currentStock <= reorderPoint) {
    priority = 'medium';
    reasoning.push('Priority: MEDIUM - At reorder point');
  }
  
  const estimatedCost = suggestedQuantity * unitCost + orderCost;
  
  return {
    shouldReorder,
    suggestedQuantity,
    reorderPoint,
    safetyStock,
    economicOrderQuantity,
    estimatedCost,
    priority,
    reasoning
  };
}

// ===================================
// DEMAND FORECASTING
// ===================================

export interface DemandForecast {
  nextWeek: number;
  nextMonth: number;
  nextQuarter: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number; // 0-100%
  seasonalityFactor: number;
  growthRate: number; // % per month
}

/**
 * Forecast demand using historical data
 */
export function forecastDemand(
  historicalUsage: Array<{ date: Date; quantity: number }>,
  seasonalityData?: Array<{ month: number; factor: number }>
): DemandForecast {
  if (historicalUsage.length < 7) {
    // Not enough data for reliable forecast
    return {
      nextWeek: 0,
      nextMonth: 0,
      nextQuarter: 0,
      trend: 'stable',
      confidence: 0,
      seasonalityFactor: 1,
      growthRate: 0
    };
  }

  // Sort by date
  const sortedData = historicalUsage.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate moving averages
  const last7Days = sortedData.slice(-7);
  const last30Days = sortedData.slice(-30);
  const last90Days = sortedData.slice(-90);
  
  const avg7 = last7Days.reduce((sum, d) => sum + d.quantity, 0) / 7;
  const avg30 = last30Days.reduce((sum, d) => sum + d.quantity, 0) / 30;
  const avg90 = last90Days.reduce((sum, d) => sum + d.quantity, 0) / 90;
  
  // Determine trend
  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  const trendThreshold = 0.1; // 10% change threshold
  
  if (avg7 > avg30 * (1 + trendThreshold)) {
    trend = 'increasing';
  } else if (avg7 < avg30 * (1 - trendThreshold)) {
    trend = 'decreasing';
  }
  
  // Calculate growth rate
  const growthRate = last30Days.length >= 30 && avg90 > 0 ? 
    ((avg30 - avg90) / avg90) * 100 : 0;
  
  // Get seasonality factor
  const currentMonth = new Date().getMonth() + 1;
  const seasonalityFactor = seasonalityData?.find(s => s.month === currentMonth)?.factor || 1;
  
  // Calculate confidence based on data consistency
  const variance = calculateVariance(last30Days.map(d => d.quantity));
  const mean = avg30;
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const confidence = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));
  
  // Apply trend and seasonality to forecasts
  const baseDailyDemand = avg30;
  const trendFactor = trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1;
  const adjustedDailyDemand = baseDailyDemand * trendFactor * seasonalityFactor;
  
  return {
    nextWeek: Math.ceil(adjustedDailyDemand * 7),
    nextMonth: Math.ceil(adjustedDailyDemand * 30),
    nextQuarter: Math.ceil(adjustedDailyDemand * 90),
    trend,
    confidence: Math.round(confidence),
    seasonalityFactor,
    growthRate: Math.round(growthRate * 100) / 100
  };
}

// ===================================
// INVENTORY OPTIMIZATION
// ===================================

export interface InventoryOptimization {
  optimalStock: number;
  reorderPoint: number;
  maxStock: number;
  safetyStock: number;
  turnoverRate: number;
  carryingCost: number;
  stockoutRisk: number; // 0-100%
  recommendations: string[];
}

/**
 * Optimize inventory levels for maximum efficiency
 */
export function optimizeInventory(
  currentStock: number,
  averageDailyUsage: number,
  leadTimeDays: number,
  unitCost: number,
  holdingCostRate: number,
  targetServiceLevel: number = 0.95, // 95% service level
  stockoutCost: number = 0
): InventoryOptimization {
  const recommendations: string[] = [];
  
  // Calculate safety stock for target service level
  const demandVariability = averageDailyUsage * 0.3; // Assume 30% variability
  const zScore = getZScoreForServiceLevel(targetServiceLevel);
  const safetyStock = Math.ceil(zScore * demandVariability * Math.sqrt(leadTimeDays));
  
  // Calculate reorder point
  const reorderPoint = (averageDailyUsage * leadTimeDays) + safetyStock;
  
  // Calculate optimal stock level (EOQ-based)
  const annualDemand = averageDailyUsage * 365;
  const eoq = Math.sqrt((2 * annualDemand * 50) / (unitCost * holdingCostRate)); // Assume $50 order cost
  const optimalStock = Math.ceil(eoq / 2 + safetyStock); // Average inventory
  
  // Calculate max stock (reorder up to level)
  const maxStock = reorderPoint + eoq;
  
  // Calculate turnover rate
  const turnoverRate = annualDemand / optimalStock;
  
  // Calculate carrying cost
  const carryingCost = optimalStock * unitCost * holdingCostRate;
  
  // Calculate stockout risk
  const stockoutRisk = currentStock <= reorderPoint ? 
    Math.max(0, Math.min(100, (reorderPoint - currentStock) / reorderPoint * 100)) : 0;
  
  // Generate recommendations
  if (currentStock < optimalStock * 0.8) {
    recommendations.push('Consider increasing stock levels for better availability');
  }
  if (currentStock > optimalStock * 1.5) {
    recommendations.push('Stock levels are high - consider reducing orders to optimize costs');
  }
  if (turnoverRate < 4) {
    recommendations.push('Low turnover rate - review demand patterns and stock levels');
  }
  if (turnoverRate > 12) {
    recommendations.push('High turnover rate - consider increasing safety stock');
  }
  if (stockoutRisk > 20) {
    recommendations.push('High stockout risk - immediate reorder recommended');
  }
  
  return {
    optimalStock: Math.ceil(optimalStock),
    reorderPoint: Math.ceil(reorderPoint),
    maxStock: Math.ceil(maxStock),
    safetyStock: Math.ceil(safetyStock),
    turnoverRate: Math.round(turnoverRate * 100) / 100,
    carryingCost: Math.round(carryingCost * 100) / 100,
    stockoutRisk: Math.round(stockoutRisk),
    recommendations
  };
}

// ===================================
// ABC ANALYSIS
// ===================================

export interface ABCAnalysisItem {
  itemId: string;
  category: 'A' | 'B' | 'C';
  annualValue: number;
  cumulativePercentage: number;
  managementStrategy: string;
}

/**
 * Perform ABC analysis for inventory prioritization
 */
export function performABCAnalysis(
  items: Array<{
    itemId: string;
    annualUsage: number;
    unitCost: number;
  }>
): ABCAnalysisItem[] {
  // Calculate annual values and sort
  const itemsWithValue = items.map(item => ({
    ...item,
    annualValue: item.annualUsage * item.unitCost
  })).sort((a, b) => b.annualValue - a.annualValue);
  
  const totalValue = itemsWithValue.reduce((sum, item) => sum + item.annualValue, 0);
  
  // Calculate cumulative percentages and assign categories
  let cumulativeValue = 0;
  return itemsWithValue.map(item => {
    cumulativeValue += item.annualValue;
    const cumulativePercentage = (cumulativeValue / totalValue) * 100;
    
    let category: 'A' | 'B' | 'C';
    let managementStrategy: string;
    
    if (cumulativePercentage <= 80) {
      category = 'A';
      managementStrategy = 'Tight control, frequent review, high service level';
    } else if (cumulativePercentage <= 95) {
      category = 'B';
      managementStrategy = 'Moderate control, periodic review, good service level';
    } else {
      category = 'C';
      managementStrategy = 'Loose control, bulk orders, acceptable service level';
    }
    
    return {
      itemId: item.itemId,
      category,
      annualValue: item.annualValue,
      cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
      managementStrategy
    };
  });
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Calculate variance for demand forecasting
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
}

/**
 * Get Z-score for service level
 */
function getZScoreForServiceLevel(serviceLevel: number): number {
  const zScores: { [key: number]: number } = {
    0.90: 1.28,
    0.95: 1.65,
    0.975: 1.96,
    0.99: 2.33,
    0.995: 2.58
  };
  
  return zScores[serviceLevel] || 1.65; // Default to 95% service level
}

// ===================================
// STOCK VALUATION
// ===================================

export interface StockValuation {
  totalValue: number;
  averageUnitCost: number;
  slowMovingValue: number;
  deadStockValue: number;
  turnoverRatio: number;
  daysOfInventory: number;
}

/**
 * Calculate comprehensive stock valuation
 */
export function calculateStockValuation(
  items: Array<{
    quantity: number;
    unitCost: number;
    lastMovementDate: Date;
    annualUsage: number;
  }>
): StockValuation {
  const now = Date.now();
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const averageUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
  
  // Identify slow-moving stock (no movement in 90 days)
  const slowMovingItems = items.filter(item => 
    (now - item.lastMovementDate.getTime()) > 90 * 24 * 60 * 60 * 1000
  );
  const slowMovingValue = slowMovingItems.reduce((sum, item) => 
    sum + (item.quantity * item.unitCost), 0
  );
  
  // Identify dead stock (no movement in 180 days)
  const deadStockItems = items.filter(item => 
    (now - item.lastMovementDate.getTime()) > 180 * 24 * 60 * 60 * 1000
  );
  const deadStockValue = deadStockItems.reduce((sum, item) => 
    sum + (item.quantity * item.unitCost), 0
  );
  
  // Calculate turnover ratio
  const totalAnnualUsage = items.reduce((sum, item) => sum + item.annualUsage, 0);
  const turnoverRatio = totalValue > 0 ? (totalAnnualUsage * averageUnitCost) / totalValue : 0;
  
  // Calculate days of inventory
  const daysOfInventory = turnoverRatio > 0 ? 365 / turnoverRatio : 0;
  
  return {
    totalValue: Math.round(totalValue * 100) / 100,
    averageUnitCost: Math.round(averageUnitCost * 100) / 100,
    slowMovingValue: Math.round(slowMovingValue * 100) / 100,
    deadStockValue: Math.round(deadStockValue * 100) / 100,
    turnoverRatio: Math.round(turnoverRatio * 100) / 100,
    daysOfInventory: Math.round(daysOfInventory)
  };
}

// ===================================
// EXPORT MAIN FUNCTIONS
// ===================================

export const stockCalculations = {
  classifyStockLevel,
  calculateReorder,
  forecastDemand,
  optimizeInventory,
  performABCAnalysis,
  calculateStockValuation
};