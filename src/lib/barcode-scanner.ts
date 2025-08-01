/**
 * RHY_050: Barcode Scanner Library
 * Enterprise-grade barcode scanning for mobile inventory management
 * Supports multiple scan types with offline capabilities and validation
 */

import { QuickScanResult, ScanItemRequest, MobileInventoryError } from '@/types/inventory_mobile';

// ===================================
// SCANNER CONFIGURATION
// ===================================

export interface ScannerConfig {
  enableSound: boolean;
  enableVibration: boolean;
  enableFlashlight: boolean;
  scanTimeout: number; // milliseconds
  retryAttempts: number;
  supportedFormats: ScanFormat[];
  resolution: 'low' | 'medium' | 'high';
  focusMode: 'auto' | 'macro' | 'continuous';
  whiteBalance: 'auto' | 'daylight' | 'fluorescent';
}

export type ScanFormat = 
  | 'CODE_128' 
  | 'CODE_39' 
  | 'EAN_13' 
  | 'EAN_8' 
  | 'UPC_A' 
  | 'UPC_E' 
  | 'QR_CODE' 
  | 'DATA_MATRIX' 
  | 'PDF_417'
  | 'AZTEC'
  | 'CODABAR'
  | 'ITF';

export interface ScannerCapabilities {
  hasCamera: boolean;
  hasTorch: boolean;
  hasAutofocus: boolean;
  supportsZoom: boolean;
  maxZoomLevel: number;
  supportedResolutions: string[];
  supportedFormats: ScanFormat[];
}

export interface ScannerMetrics {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  averageScanTime: number;
  accuracyRate: number;
  lastScanTime?: Date;
}

// ===================================
// BARCODE SCANNER CLASS
// ===================================

export class BarcodeScanner {
  private config: ScannerConfig;
  private capabilities: ScannerCapabilities | null = null;
  private isScanning = false;
  private metrics: ScannerMetrics = {
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    averageScanTime: 0,
    accuracyRate: 0
  };

  constructor(config?: Partial<ScannerConfig>) {
    this.config = {
      enableSound: true,
      enableVibration: true,
      enableFlashlight: false,
      scanTimeout: 10000, // 10 seconds
      retryAttempts: 3,
      supportedFormats: [
        'CODE_128',
        'CODE_39', 
        'EAN_13',
        'EAN_8',
        'UPC_A',
        'UPC_E',
        'QR_CODE',
        'DATA_MATRIX'
      ],
      resolution: 'medium',
      focusMode: 'auto',
      whiteBalance: 'auto',
      ...config
    };
  }

  /**
   * Initialize scanner and check device capabilities
   */
  public async initialize(): Promise<void> {
    try {
      // Check for camera permissions
      const hasPermission = await this.checkCameraPermission();
      if (!hasPermission) {
        throw new MobileInventoryError('Camera permission denied', 'PERMISSION_DENIED', 403);
      }

      // Detect device capabilities
      this.capabilities = await this.detectCapabilities();
      
      console.log('Barcode scanner initialized', {
        capabilities: this.capabilities,
        config: this.config
      });

    } catch (error) {
      console.error('Failed to initialize barcode scanner', error);
      throw new MobileInventoryError('Scanner initialization failed', 'SCANNER_INIT_ERROR', 500, error);
    }
  }

  /**
   * Start scanning with advanced error handling and validation
   */
  public async startScan(
    onSuccess: (result: QuickScanResult) => void,
    onError: (error: Error) => void,
    options?: {
      single?: boolean;
      formats?: ScanFormat[];
      timeout?: number;
    }
  ): Promise<void> {
    if (this.isScanning) {
      throw new MobileInventoryError('Scanner already active', 'SCANNER_BUSY', 400);
    }

    const scanStartTime = Date.now();
    this.isScanning = true;
    this.metrics.totalScans++;

    try {
      console.log('Starting barcode scan', {
        formats: options?.formats || this.config.supportedFormats,
        timeout: options?.timeout || this.config.scanTimeout,
        single: options?.single ?? true
      });

      // Create scan session
      const scanSession = await this.createScanSession(options);
      
      // Start camera and scanning process
      await this.activateCamera();
      
      // Set up scan detection with timeout
      const timeoutId = setTimeout(() => {
        this.stopScan();
        onError(new MobileInventoryError('Scan timeout', 'SCAN_TIMEOUT', 408));
      }, options?.timeout || this.config.scanTimeout);

      // Mock scan result for demo (in real app, this would use camera API)
      setTimeout(() => {
        clearTimeout(timeoutId);
        
        const mockResult: QuickScanResult = {
          success: true,
          scannedCode: this.generateMockBarcode(),
          codeType: 'BARCODE',
          scanDuration: Date.now() - scanStartTime,
          confidence: 95,
          timestamp: new Date()
        };

        this.handleScanSuccess(mockResult, scanStartTime);
        onSuccess(mockResult);
        
        if (options?.single !== false) {
          this.stopScan();
        }
      }, 2000); // Simulate 2-second scan time

    } catch (error) {
      this.handleScanError(error as Error, scanStartTime);
      onError(error as Error);
      this.stopScan();
    }
  }

  /**
   * Stop scanning and cleanup resources
   */
  public stopScan(): void {
    if (!this.isScanning) return;

    this.isScanning = false;
    this.deactivateCamera();
    
    console.log('Barcode scan stopped', {
      metrics: this.metrics
    });
  }

  /**
   * Scan from image file (for offline or uploaded images)
   */
  public async scanFromImage(
    imageFile: File | Blob,
    formats?: ScanFormat[]
  ): Promise<QuickScanResult> {
    const scanStartTime = Date.now();
    this.metrics.totalScans++;

    try {
      console.log('Scanning from image file', {
        fileSize: imageFile.size,
        fileType: imageFile.type,
        formats: formats || this.config.supportedFormats
      });

      // Validate image file
      if (!this.isValidImageFile(imageFile)) {
        throw new MobileInventoryError('Invalid image file', 'INVALID_IMAGE', 400);
      }

      // Process image (mock implementation)
      const result = await this.processImageFile(imageFile, formats);
      
      this.handleScanSuccess(result, scanStartTime);
      return result;

    } catch (error) {
      this.handleScanError(error as Error, scanStartTime);
      throw error;
    }
  }

  /**
   * Validate scanned code format and content
   */
  public validateScanResult(code: string, format: ScanFormat): {
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Basic length validation
    if (code.length === 0) {
      errors.push('Empty code');
      return { isValid: false, errors };
    }

    // Format-specific validation
    switch (format) {
      case 'EAN_13':
        if (!/^\d{13}$/.test(code)) {
          errors.push('EAN-13 must be exactly 13 digits');
          suggestions.push('Check if barcode is fully visible and try again');
        }
        break;
        
      case 'EAN_8':
        if (!/^\d{8}$/.test(code)) {
          errors.push('EAN-8 must be exactly 8 digits');
        }
        break;
        
      case 'UPC_A':
        if (!/^\d{12}$/.test(code)) {
          errors.push('UPC-A must be exactly 12 digits');
        }
        break;
        
      case 'CODE_128':
        if (code.length < 1 || code.length > 80) {
          errors.push('Code 128 length must be between 1 and 80 characters');
        }
        break;
        
      case 'QR_CODE':
        if (code.length > 2953) {
          errors.push('QR code content too long');
        }
        break;
        
      default:
        // Generic validation for other formats
        if (code.length > 100) {
          errors.push('Code content too long');
        }
    }

    // Content validation
    if (!/^[\x20-\x7E]*$/.test(code)) {
      errors.push('Code contains invalid characters');
      suggestions.push('Ensure barcode is not damaged or corrupted');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Get scanner performance metrics
   */
  public getMetrics(): ScannerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get scanner capabilities
   */
  public getCapabilities(): ScannerCapabilities | null {
    return this.capabilities ? { ...this.capabilities } : null;
  }

  /**
   * Update scanner configuration
   */
  public updateConfig(config: Partial<ScannerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Scanner configuration updated', this.config);
  }

  /**
   * Enable/disable flashlight
   */
  public async toggleFlashlight(enabled?: boolean): Promise<void> {
    try {
      const shouldEnable = enabled ?? !this.config.enableFlashlight;
      this.config.enableFlashlight = shouldEnable;
      
      // In real implementation, this would control device flashlight
      console.log(`Flashlight ${shouldEnable ? 'enabled' : 'disabled'}`);
      
    } catch (error) {
      throw new MobileInventoryError('Failed to toggle flashlight', 'FLASHLIGHT_ERROR', 500, error);
    }
  }

  /**
   * Take a still photo for manual processing
   */
  public async capturePhoto(): Promise<Blob> {
    try {
      if (!this.isScanning) {
        throw new MobileInventoryError('Scanner not active', 'SCANNER_INACTIVE', 400);
      }

      // Mock photo capture (in real app, this would use camera API)
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      
      // Fill with mock camera image
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.fillText('Mock Camera Capture', 200, 240);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.8);
      });

    } catch (error) {
      throw new MobileInventoryError('Failed to capture photo', 'CAPTURE_ERROR', 500, error);
    }
  }

  // ===================================
  // PRIVATE HELPER METHODS
  // ===================================

  private async checkCameraPermission(): Promise<boolean> {
    try {
      // Check if running in browser environment
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      return true;
      
    } catch (error) {
      console.warn('Camera permission check failed', error);
      return false;
    }
  }

  private async detectCapabilities(): Promise<ScannerCapabilities> {
    try {
      const hasCamera = typeof navigator !== 'undefined' && 
                       navigator.mediaDevices && 
                       navigator.mediaDevices.getUserMedia;

      return {
        hasCamera: !!hasCamera,
        hasTorch: false, // Would detect actual torch capability
        hasAutofocus: true,
        supportsZoom: false,
        maxZoomLevel: 1,
        supportedResolutions: ['640x480', '1280x720', '1920x1080'],
        supportedFormats: this.config.supportedFormats
      };

    } catch (error) {
      console.error('Failed to detect scanner capabilities', error);
      return {
        hasCamera: false,
        hasTorch: false,
        hasAutofocus: false,
        supportsZoom: false,
        maxZoomLevel: 1,
        supportedResolutions: [],
        supportedFormats: []
      };
    }
  }

  private async createScanSession(options?: any): Promise<string> {
    const sessionId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Created scan session', {
      sessionId,
      options,
      timestamp: new Date().toISOString()
    });
    
    return sessionId;
  }

  private async activateCamera(): Promise<void> {
    try {
      // In real implementation, this would start camera stream
      console.log('Camera activated with config', {
        resolution: this.config.resolution,
        focusMode: this.config.focusMode,
        whiteBalance: this.config.whiteBalance
      });
      
    } catch (error) {
      throw new MobileInventoryError('Failed to activate camera', 'CAMERA_ERROR', 500, error);
    }
  }

  private deactivateCamera(): void {
    try {
      // In real implementation, this would stop camera stream
      console.log('Camera deactivated');
      
    } catch (error) {
      console.error('Failed to deactivate camera', error);
    }
  }

  private isValidImageFile(file: File | Blob): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file instanceof File) {
      return validTypes.includes(file.type) && file.size <= maxSize;
    }
    
    return file.size <= maxSize;
  }

  private async processImageFile(
    imageFile: File | Blob, 
    formats?: ScanFormat[]
  ): Promise<QuickScanResult> {
    // Mock image processing (real implementation would use barcode detection library)
    const mockBarcode = this.generateMockBarcode();
    
    return {
      success: true,
      scannedCode: mockBarcode,
      codeType: 'BARCODE',
      scanDuration: 1500, // Mock processing time
      confidence: 88,
      timestamp: new Date()
    };
  }

  private generateMockBarcode(): string {
    // Generate realistic FlexVolt battery barcode
    const categories = ['6AH', '9AH', '15AH'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const serialNumber = Math.floor(Math.random() * 900000) + 100000;
    
    return `FV${category}${serialNumber}`;
  }

  private handleScanSuccess(result: QuickScanResult, startTime: number): void {
    this.metrics.successfulScans++;
    this.metrics.lastScanTime = new Date();
    
    // Update average scan time
    const scanTime = Date.now() - startTime;
    this.metrics.averageScanTime = 
      (this.metrics.averageScanTime * (this.metrics.successfulScans - 1) + scanTime) / 
      this.metrics.successfulScans;
    
    // Update accuracy rate
    this.metrics.accuracyRate = 
      (this.metrics.successfulScans / this.metrics.totalScans) * 100;

    // Play success feedback
    this.playSuccessFeedback();
    
    console.log('Scan successful', {
      result,
      scanTime,
      metrics: this.metrics
    });
  }

  private handleScanError(error: Error, startTime: number): void {
    this.metrics.failedScans++;
    
    // Update accuracy rate
    this.metrics.accuracyRate = 
      (this.metrics.successfulScans / this.metrics.totalScans) * 100;

    // Play error feedback
    this.playErrorFeedback();
    
    console.error('Scan failed', {
      error: error.message,
      scanTime: Date.now() - startTime,
      metrics: this.metrics
    });
  }

  private playSuccessFeedback(): void {
    if (this.config.enableSound) {
      // Play success sound
      this.playSound('success');
    }
    
    if (this.config.enableVibration) {
      this.vibrate(200); // 200ms vibration
    }
  }

  private playErrorFeedback(): void {
    if (this.config.enableSound) {
      // Play error sound
      this.playSound('error');
    }
    
    if (this.config.enableVibration) {
      this.vibrate([100, 50, 100]); // Double vibration pattern
    }
  }

  private playSound(type: 'success' | 'error'): void {
    try {
      // In real implementation, this would play actual sounds
      console.log(`Playing ${type} sound`);
      
    } catch (error) {
      console.warn('Failed to play sound', error);
    }
  }

  private vibrate(pattern: number | number[]): void {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Failed to vibrate', error);
    }
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Create barcode scanner instance with default configuration
 */
export function createBarcodeScanner(config?: Partial<ScannerConfig>): BarcodeScanner {
  return new BarcodeScanner(config);
}

/**
 * Validate barcode format and content
 */
export function validateBarcode(code: string, format: ScanFormat): boolean {
  const scanner = new BarcodeScanner();
  const result = scanner.validateScanResult(code, format);
  return result.isValid;
}

/**
 * Extract product information from FlexVolt barcode
 */
export function parseFlexVoltBarcode(barcode: string): {
  isFlexVolt: boolean;
  category?: 'FLEXVOLT_6AH' | 'FLEXVOLT_9AH' | 'FLEXVOLT_15AH';
  serialNumber?: string;
  formatted?: string;
} {
  // FlexVolt barcode pattern: FV{category}{serial}
  const flexVoltPattern = /^FV(6AH|9AH|15AH)(\d{6})$/;
  const match = barcode.match(flexVoltPattern);
  
  if (!match) {
    return { isFlexVolt: false };
  }
  
  const [, categoryCode, serialNumber] = match;
  const categoryMap: Record<string, 'FLEXVOLT_6AH' | 'FLEXVOLT_9AH' | 'FLEXVOLT_15AH'> = {
    '6AH': 'FLEXVOLT_6AH',
    '9AH': 'FLEXVOLT_9AH',
    '15AH': 'FLEXVOLT_15AH'
  };
  
  return {
    isFlexVolt: true,
    category: categoryMap[categoryCode],
    serialNumber,
    formatted: `FlexVolt ${categoryCode} - ${serialNumber}`
  };
}

/**
 * Generate QR code for inventory item
 */
export function generateInventoryQRCode(item: {
  sku: string;
  warehouseId: string;
  location: string;
}): string {
  const qrData = {
    type: 'INVENTORY_ITEM',
    sku: item.sku,
    warehouse: item.warehouseId,
    location: item.location,
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(qrData);
}

/**
 * Parse inventory QR code data
 */
export function parseInventoryQRCode(qrCode: string): {
  isValid: boolean;
  data?: {
    type: string;
    sku: string;
    warehouse: string;
    location: string;
    timestamp: string;
  };
  error?: string;
} {
  try {
    const data = JSON.parse(qrCode);
    
    if (data.type !== 'INVENTORY_ITEM') {
      return { isValid: false, error: 'Not an inventory QR code' };
    }
    
    if (!data.sku || !data.warehouse || !data.location) {
      return { isValid: false, error: 'Missing required fields' };
    }
    
    return { isValid: true, data };
    
  } catch (error) {
    return { isValid: false, error: 'Invalid QR code format' };
  }
}

// ===================================
// SCANNER ERROR TYPES
// ===================================

export class ScannerError extends MobileInventoryError {
  constructor(message: string, details?: any) {
    super(message, 'SCANNER_ERROR', 500, details);
    this.name = 'ScannerError';
  }
}

export class CameraError extends ScannerError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.name = 'CameraError';
  }
}

export class PermissionError extends ScannerError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.name = 'PermissionError';
  }
}

// Export main scanner class and utilities
export { BarcodeScanner };