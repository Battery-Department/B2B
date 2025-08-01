/**
 * RHY_049 - Advanced Inventory Features: Export Utilities
 * Enterprise-grade inventory export functionality with multiple formats
 * Integrates with Batch 1 authentication and audit systems
 */

import * as XLSX from 'xlsx'
import { logger } from '@/lib/logger'

// Types
export interface ExportOptions {
  format: 'CSV' | 'EXCEL' | 'JSON'
  includeHeaders: boolean
  filters?: InventoryFilter
  customFields?: string[]
  warehouseId?: string
}

export interface InventoryFilter {
  category?: string[]
  stockLevel?: 'all' | 'low' | 'out' | 'adequate' | 'overstocked'
  priceRange?: [number, number]
  searchTerm?: string
  dateRange?: [Date, Date]
}

export interface InventoryExportData {
  sku: string
  name: string
  description?: string
  category: string
  quantity: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  status: string
  supplier?: string
  location?: string
  warehouseId: string
  warehouseName: string
  lastUpdated: string
  barcode?: string
  weight?: number
  dimensions?: string
  turnoverRate?: number
  demandTrend?: string
  reservedStock?: number
  availableStock?: number
  reorderPoint?: number
  safetyStock?: number
  leadTime?: number
  abcClass?: string
  seasonality?: string
  notes?: string
}

export interface ExportResult {
  success: boolean
  filename?: string
  data?: Blob | string
  error?: string
  recordCount?: number
  fileSize?: number
  exportId?: string
}

export interface ExportSession {
  id: string
  userId: string
  warehouseId?: string
  format: ExportOptions['format']
  status: 'PREPARING' | 'EXPORTING' | 'COMPLETED' | 'FAILED'
  recordCount: number
  processedCount: number
  filename: string
  fileSize?: number
  downloadUrl?: string
  createdAt: Date
  completedAt?: Date
  error?: string
  filters?: InventoryFilter
}

/**
 * InventoryExporter - Handles all inventory export operations
 */
export class InventoryExporter {
  private static instance: InventoryExporter

  public static getInstance(): InventoryExporter {
    if (!InventoryExporter.instance) {
      InventoryExporter.instance = new InventoryExporter()
    }
    return InventoryExporter.instance
  }

  /**
   * Export inventory data to specified format
   */
  async exportInventory(
    data: InventoryExportData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      logger.info('Starting inventory export', {
        format: options.format,
        recordCount: data.length,
        warehouseId: options.warehouseId
      })

      // Apply filters if specified
      const filteredData = this.applyFilters(data, options.filters)
      
      // Select fields based on options
      const processedData = this.selectFields(filteredData, options.customFields)

      // Generate export based on format
      switch (options.format) {
        case 'CSV':
          return await this.exportToCSV(processedData, options)
        case 'EXCEL':
          return await this.exportToExcel(processedData, options)
        case 'JSON':
          return await this.exportToJSON(processedData, options)
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

    } catch (error) {
      logger.error('Export failed', { error, options })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(
    data: InventoryExportData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const headers = this.getHeaders(data[0], options.customFields)
      const rows = data.map(item => this.convertToCSVRow(item, headers))

      let csvContent = ''
      
      if (options.includeHeaders) {
        csvContent += headers.join(',') + '\n'
      }
      
      csvContent += rows.join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const filename = this.generateFilename('csv', options.warehouseId)

      logger.info('CSV export completed', {
        recordCount: data.length,
        fileSize: blob.size,
        filename
      })

      return {
        success: true,
        filename,
        data: blob,
        recordCount: data.length,
        fileSize: blob.size
      }

    } catch (error) {
      logger.error('CSV export failed', { error })
      throw error
    }
  }

  /**
   * Export to Excel format
   */
  private async exportToExcel(
    data: InventoryExportData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Prepare data with headers
      const headers = this.getHeaders(data[0], options.customFields)
      const worksheetData = [
        ...(options.includeHeaders ? [headers] : []),
        ...data.map(item => this.convertToExcelRow(item, headers))
      ]

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Apply formatting
      this.formatExcelWorksheet(worksheet, headers, data.length)

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')

      // Add summary sheet
      if (data.length > 0) {
        const summarySheet = this.createSummarySheet(data)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      }

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const filename = this.generateFilename('xlsx', options.warehouseId)

      logger.info('Excel export completed', {
        recordCount: data.length,
        fileSize: blob.size,
        filename
      })

      return {
        success: true,
        filename,
        data: blob,
        recordCount: data.length,
        fileSize: blob.size
      }

    } catch (error) {
      logger.error('Excel export failed', { error })
      throw error
    }
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(
    data: InventoryExportData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const headers = this.getHeaders(data[0], options.customFields)
      const processedData = data.map(item => this.selectObjectFields(item, headers))

      const exportObject = {
        metadata: {
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          warehouseId: options.warehouseId,
          filters: options.filters,
          version: '1.0'
        },
        data: processedData
      }

      const jsonString = JSON.stringify(exportObject, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
      const filename = this.generateFilename('json', options.warehouseId)

      logger.info('JSON export completed', {
        recordCount: data.length,
        fileSize: blob.size,
        filename
      })

      return {
        success: true,
        filename,
        data: blob,
        recordCount: data.length,
        fileSize: blob.size
      }

    } catch (error) {
      logger.error('JSON export failed', { error })
      throw error
    }
  }

  /**
   * Apply filters to data
   */
  private applyFilters(
    data: InventoryExportData[],
    filters?: InventoryFilter
  ): InventoryExportData[] {
    if (!filters) return data

    return data.filter(item => {
      // Category filter
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(item.category)) return false
      }

      // Stock level filter
      if (filters.stockLevel && filters.stockLevel !== 'all') {
        const stockStatus = this.getStockStatus(item)
        if (stockStatus !== filters.stockLevel) return false
      }

      // Price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange
        if (item.unitPrice < min || item.unitPrice > max) return false
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        const searchableFields = [
          item.sku,
          item.name,
          item.description,
          item.category,
          item.supplier,
          item.location
        ].filter(Boolean)

        const matches = searchableFields.some(field =>
          field?.toLowerCase().includes(searchTerm)
        )
        if (!matches) return false
      }

      // Date range filter
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange
        const itemDate = new Date(item.lastUpdated)
        if (itemDate < startDate || itemDate > endDate) return false
      }

      return true
    })
  }

  /**
   * Get stock status for filtering
   */
  private getStockStatus(item: InventoryExportData): string {
    if (item.quantity === 0) return 'out'
    if (item.quantity <= item.minStock) return 'low'
    if (item.quantity >= item.maxStock) return 'overstocked'
    return 'adequate'
  }

  /**
   * Select fields based on custom field list
   */
  private selectFields(
    data: InventoryExportData[],
    customFields?: string[]
  ): InventoryExportData[] {
    if (!customFields || customFields.length === 0) return data

    return data.map(item => this.selectObjectFields(item, customFields))
  }

  /**
   * Select specific fields from object
   */
  private selectObjectFields(
    item: InventoryExportData,
    fields: string[]
  ): Partial<InventoryExportData> {
    const result: Partial<InventoryExportData> = {}
    
    fields.forEach(field => {
      if (field in item) {
        (result as any)[field] = (item as any)[field]
      }
    })

    return result
  }

  /**
   * Get headers for export
   */
  private getHeaders(
    sampleItem: InventoryExportData,
    customFields?: string[]
  ): string[] {
    if (customFields && customFields.length > 0) {
      return customFields
    }

    return Object.keys(sampleItem)
  }

  /**
   * Convert item to CSV row
   */
  private convertToCSVRow(item: InventoryExportData, headers: string[]): string {
    return headers.map(header => {
      const value = (item as any)[header]
      
      if (value === null || value === undefined) {
        return ''
      }
      
      // Escape commas and quotes
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      
      return stringValue
    }).join(',')
  }

  /**
   * Convert item to Excel row
   */
  private convertToExcelRow(item: InventoryExportData, headers: string[]): any[] {
    return headers.map(header => {
      const value = (item as any)[header]
      
      // Handle dates
      if (header === 'lastUpdated' && value) {
        return new Date(value)
      }
      
      // Handle numbers
      if (typeof value === 'number') {
        return value
      }
      
      return value || ''
    })
  }

  /**
   * Format Excel worksheet
   */
  private formatExcelWorksheet(
    worksheet: XLSX.WorkSheet,
    headers: string[],
    dataRows: number
  ): void {
    // Auto-size columns
    const columnWidths = headers.map(header => ({
      wch: Math.max(header.length, 15)
    }))
    worksheet['!cols'] = columnWidths

    // Format header row
    if (dataRows > 0) {
      const headerRange = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: headers.length - 1, r: 0 }
      })
      
      if (!worksheet['!merges']) worksheet['!merges'] = []
      // Add header styling (basic)
    }
  }

  /**
   * Create summary sheet for Excel export
   */
  private createSummarySheet(data: InventoryExportData[]): XLSX.WorkSheet {
    const totalValue = data.reduce((sum, item) => sum + item.totalValue, 0)
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0)
    const lowStockItems = data.filter(item => item.quantity <= item.minStock).length
    const outOfStockItems = data.filter(item => item.quantity === 0).length

    const categories = data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const summaryData = [
      ['Inventory Summary', ''],
      ['', ''],
      ['Total Items', data.length],
      ['Total Quantity', totalQuantity],
      ['Total Value', totalValue],
      ['Low Stock Items', lowStockItems],
      ['Out of Stock Items', outOfStockItems],
      ['', ''],
      ['Category Breakdown', ''],
      ...Object.entries(categories).map(([category, count]) => [category, count]),
      ['', ''],
      ['Export Date', new Date().toISOString()],
    ]

    return XLSX.utils.aoa_to_sheet(summaryData)
  }

  /**
   * Generate filename for export
   */
  private generateFilename(extension: string, warehouseId?: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const warehouse = warehouseId ? `_${warehouseId}` : ''
    return `inventory_export${warehouse}_${timestamp}.${extension}`
  }

  /**
   * Get export templates for different use cases
   */
  getExportTemplates(): Record<string, ExportOptions> {
    return {
      'basic': {
        format: 'CSV',
        includeHeaders: true,
        customFields: ['sku', 'name', 'category', 'quantity', 'unitPrice', 'warehouseName']
      },
      'detailed': {
        format: 'EXCEL',
        includeHeaders: true,
        customFields: [
          'sku', 'name', 'description', 'category', 'quantity', 'minStock', 'maxStock',
          'unitPrice', 'totalValue', 'status', 'supplier', 'location', 'warehouseName',
          'lastUpdated', 'turnoverRate', 'demandTrend'
        ]
      },
      'financial': {
        format: 'EXCEL',
        includeHeaders: true,
        customFields: [
          'sku', 'name', 'category', 'quantity', 'unitPrice', 'totalValue',
          'turnoverRate', 'abcClass', 'warehouseName'
        ]
      },
      'operations': {
        format: 'CSV',
        includeHeaders: true,
        customFields: [
          'sku', 'name', 'location', 'quantity', 'minStock', 'maxStock',
          'reorderPoint', 'safetyStock', 'status', 'warehouseName'
        ]
      },
      'analytics': {
        format: 'JSON',
        includeHeaders: true
      }
    }
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: ExportOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate format
    if (!['CSV', 'EXCEL', 'JSON'].includes(options.format)) {
      errors.push('Invalid export format')
    }

    // Validate custom fields
    if (options.customFields && options.customFields.length === 0) {
      errors.push('Custom fields cannot be empty when specified')
    }

    // Validate filters
    if (options.filters?.priceRange) {
      const [min, max] = options.filters.priceRange
      if (min < 0 || max < 0 || min > max) {
        errors.push('Invalid price range')
      }
    }

    if (options.filters?.dateRange) {
      const [start, end] = options.filters.dateRange
      if (start > end) {
        errors.push('Invalid date range')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Export utilities
export const inventoryExporter = InventoryExporter.getInstance()

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const validateExportData = (data: InventoryExportData[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!Array.isArray(data)) {
    errors.push('Data must be an array')
    return { valid: false, errors }
  }

  if (data.length === 0) {
    errors.push('No data to export')
    return { valid: false, errors }
  }

  // Check required fields
  const requiredFields = ['sku', 'name', 'category', 'quantity', 'unitPrice', 'warehouseId']
  const missingFields = requiredFields.filter(field => 
    !data[0].hasOwnProperty(field)
  )

  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}