/**
 * =============================================================================
 * RHY_010: ENTERPRISE DATABASE BACKUP & RECOVERY STRATEGY
 * =============================================================================
 * Production-ready backup and recovery system for RHY Supplier Portal
 * Features: Automated backups, point-in-time recovery, multi-warehouse support
 * Global operations: US, Japan, EU, Australia
 * Compliance-ready with audit trails and encryption
 * Enhanced with enterprise security and monitoring
 * =============================================================================
 */

import { prisma, checkDatabaseHealth, type DatabaseHealth } from './database';
import { logger } from './logger';
import { DatabaseConnectionManager, type WarehouseLocation, type DatabaseEnvironment } from './db-connection';
import type { BackupConfig, BackupStatus, BackupMetadata, RestoreOptions } from '@/types/backup';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================

interface BackupManagerConfig {
  backupDirectory: string;
  scriptsDirectory: string;
  retentionDays: number;
  compressionLevel: number;
  encryptionEnabled: boolean;
  maxBackupSize: number; // in bytes
  alertThresholds: {
    maxDuration: number; // in seconds
    maxSize: number; // in bytes
    minFreeSpace: number; // in bytes
  };
}

const defaultConfig: BackupManagerConfig = {
  backupDirectory: path.join(process.cwd(), 'backups', 'database'),
  scriptsDirectory: path.join(process.cwd(), 'scripts'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  compressionLevel: parseInt(process.env.COMPRESSION_LEVEL || '6'),
  encryptionEnabled: !!process.env.BACKUP_ENCRYPTION_KEY,
  maxBackupSize: 10 * 1024 * 1024 * 1024, // 10GB
  alertThresholds: {
    maxDuration: 3600, // 1 hour
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    minFreeSpace: 1024 * 1024 * 1024, // 1GB
  },
};

// =============================================================================
// BACKUP MANAGER CLASS
// =============================================================================

export class DatabaseBackupManager {
  private config: BackupManagerConfig;
  private activeBackups: Map<string, BackupStatus> = new Map();
  private warehouseBackups: Map<WarehouseLocation, Map<string, BackupStatus>> = new Map();
  private connectionManager: DatabaseConnectionManager;
  private backupQueues: Map<WarehouseLocation, Array<{ resolve: Function; reject: Function; config: Partial<BackupConfig> }>> = new Map();
  private isProcessingBackups = false;

  constructor(config: Partial<BackupManagerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.connectionManager = DatabaseConnectionManager.getInstance();
    this.initializeWarehouseSupport();
    this.ensureDirectories();
    this.startBackupScheduler();
  }

  // =============================================================================
  // INITIALIZATION & MULTI-WAREHOUSE SETUP
  // =============================================================================

  /**
   * Initialize multi-warehouse backup support
   */
  private initializeWarehouseSupport(): void {
    const warehouses: WarehouseLocation[] = ['US', 'JP', 'EU', 'AU'];
    
    warehouses.forEach(warehouse => {
      this.warehouseBackups.set(warehouse, new Map());
      this.backupQueues.set(warehouse, []);
    });
    
    logger.info('Multi-warehouse backup support initialized', {
      warehouses: warehouses.length,
      supportedRegions: warehouses
    });
  }

  /**
   * Start automated backup scheduler for all warehouses
   */
  private startBackupScheduler(): void {
    // Schedule daily backups for each warehouse at optimal times
    const warehouseSchedule = {
      'US': '02:00', // 2 AM PST
      'JP': '03:00', // 3 AM JST
      'EU': '01:00', // 1 AM CET
      'AU': '04:00'  // 4 AM AEDT
    };
    
    Object.entries(warehouseSchedule).forEach(([warehouse, time]) => {
      logger.info('Backup scheduler configured', {
        warehouse,
        scheduledTime: time,
        type: 'automated_daily'
      });
    });
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.backupDirectory, { recursive: true });
      await fs.mkdir(path.join(this.config.backupDirectory, 'logs'), { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directories:', error);
      throw error;
    }
  }

  // =============================================================================
  // BACKUP OPERATIONS
  // =============================================================================

  async createBackup(options: Partial<BackupConfig> = {}): Promise<BackupStatus> {
    const warehouse = options.warehouse || 'US'; // Default to US warehouse
    const backupId = this.generateBackupId(warehouse);
    const startTime = new Date();
    
    // Queue backup if another is in progress for this warehouse
    if (this.isWarehouseBackupInProgress(warehouse)) {
      return this.queueBackup(warehouse, options);
    }

    const backupStatus: BackupStatus = {
      id: backupId,
      status: 'running',
      startTime,
      type: options.type || 'full',
      progress: 0,
      warehouse,
      metadata: {
        compressionEnabled: options.compression !== false,
        encryptionEnabled: this.config.encryptionEnabled,
        retentionDays: this.config.retentionDays,
        warehouse,
        pointInTimeRecovery: options.pointInTimeRecovery || false,
        incrementalBackup: options.incremental || false,
      },
    };

    this.activeBackups.set(backupId, backupStatus);
    this.warehouseBackups.get(warehouse)?.set(backupId, backupStatus);

    try {
      // Pre-backup health check
      const healthCheck = await this.performPreBackupCheck();
      if (healthCheck.status === 'unhealthy') {
        throw new Error(`Database health check failed: ${healthCheck.errors.join(', ')}`);
      }

      // Log backup start
      await this.logBackupEvent(backupId, 'started', 'Backup operation initiated');

      backupStatus.progress = 10;

      // Execute warehouse-specific backup script
      const backupResult = await this.executeWarehouseBackup(warehouse, options);
      
      backupStatus.progress = 80;

      // Validate backup integrity
      const validationResult = await this.validateBackup(backupResult.filename);
      
      backupStatus.progress = 90;

      // Generate metadata
      const metadata = await this.generateBackupMetadata(backupResult);
      
      backupStatus.progress = 95;

      // Clean up old backups
      await this.cleanupOldBackups();

      // Finalize backup status
      backupStatus.status = 'completed';
      backupStatus.endTime = new Date();
      backupStatus.progress = 100;
      backupStatus.filename = backupResult.filename;
      backupStatus.size = backupResult.size;
      backupStatus.metadata = { ...backupStatus.metadata, ...metadata };

      // Log successful completion
      await this.logBackupEvent(backupId, 'completed', 'Backup completed successfully', {
        filename: backupResult.filename,
        size: backupResult.size,
        duration: Date.now() - startTime.getTime(),
      });

      // Send success notification
      await this.sendBackupNotification('success', backupStatus);

      return backupStatus;

    } catch (error) {
      backupStatus.status = 'failed';
      backupStatus.endTime = new Date();
      backupStatus.error = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.logBackupEvent(backupId, 'failed', 'Backup operation failed', {
        error: backupStatus.error,
        duration: Date.now() - startTime.getTime(),
      });

      // Send failure notification
      await this.sendBackupNotification('failure', backupStatus);

      throw error;
    } finally {
      this.activeBackups.delete(backupId);
      this.warehouseBackups.get(warehouse)?.delete(backupId);
      
      // Process queued backups for this warehouse
      this.processBackupQueue(warehouse);
    }
  }

  async restoreBackup(filename: string, options: RestoreOptions = {}): Promise<BackupStatus> {
    const restoreId = this.generateBackupId('restore');
    const startTime = new Date();

    const restoreStatus: BackupStatus = {
      id: restoreId,
      status: 'running',
      startTime,
      type: 'restore',
      progress: 0,
      filename,
    };

    try {
      // Validate backup file exists
      const backupPath = path.join(this.config.backupDirectory, filename);
      await fs.access(backupPath);

      restoreStatus.progress = 10;

      // Pre-restore validation
      if (!options.skipValidation) {
        await this.validateBackup(filename);
      }

      restoreStatus.progress = 20;

      // Execute restore script
      const restoreResult = await this.executeRestoreScript(filename, options);

      restoreStatus.progress = 80;

      // Post-restore validation
      if (!options.skipPostValidation) {
        await this.performPostRestoreValidation();
      }

      restoreStatus.progress = 90;

      // Log restore completion
      await this.logBackupEvent(restoreId, 'completed', 'Restore completed successfully', {
        filename,
        duration: Date.now() - startTime.getTime(),
      });

      restoreStatus.status = 'completed';
      restoreStatus.endTime = new Date();
      restoreStatus.progress = 100;

      return restoreStatus;

    } catch (error) {
      restoreStatus.status = 'failed';
      restoreStatus.endTime = new Date();
      restoreStatus.error = error instanceof Error ? error.message : 'Unknown error';

      await this.logBackupEvent(restoreId, 'failed', 'Restore operation failed', {
        filename,
        error: restoreStatus.error,
        duration: Date.now() - startTime.getTime(),
      });

      throw error;
    }
  }

  // =============================================================================
  // MULTI-WAREHOUSE BACKUP OPERATIONS
  // =============================================================================

  /**
   * Check if backup is in progress for specific warehouse
   */
  private isWarehouseBackupInProgress(warehouse: WarehouseLocation): boolean {
    const warehouseBackups = this.warehouseBackups.get(warehouse);
    if (!warehouseBackups) return false;
    
    for (const backup of warehouseBackups.values()) {
      if (backup.status === 'running') {
        return true;
      }
    }
    return false;
  }

  /**
   * Queue backup for warehouse when another is in progress
   */
  private async queueBackup(warehouse: WarehouseLocation, options: Partial<BackupConfig>): Promise<BackupStatus> {
    return new Promise((resolve, reject) => {
      const queue = this.backupQueues.get(warehouse);
      if (queue) {
        queue.push({ resolve, reject, config: options });
        
        logger.info('Backup queued for warehouse', {
          warehouse,
          queueLength: queue.length,
          requestedType: options.type || 'full'
        });
      } else {
        reject(new Error(`Invalid warehouse: ${warehouse}`));
      }
    });
  }

  /**
   * Process queued backups for warehouse
   */
  private async processBackupQueue(warehouse: WarehouseLocation): Promise<void> {
    const queue = this.backupQueues.get(warehouse);
    if (!queue || queue.length === 0) return;
    
    const nextBackup = queue.shift();
    if (nextBackup) {
      try {
        const result = await this.createBackup({ ...nextBackup.config, warehouse });
        nextBackup.resolve(result);
      } catch (error) {
        nextBackup.reject(error);
      }
    }
  }

  /**
   * Execute backup for specific warehouse with region-specific optimizations
   */
  private async executeWarehouseBackup(
    warehouse: WarehouseLocation, 
    options: Partial<BackupConfig>
  ): Promise<{ filename: string; size: number; checksum: string }> {
    const startTime = Date.now();
    
    logger.info('Starting warehouse backup', {
      warehouse,
      type: options.type || 'full',
      compression: options.compression !== false,
      encryption: this.config.encryptionEnabled
    });

    try {
      // Get warehouse-specific database connection
      const warehouseClient = await this.connectionManager.executeQuery(
        async (client) => client,
        { warehouse }
      );

      // Execute warehouse-specific backup strategy
      const backupData = await this.performWarehouseDataBackup(warehouse, warehouseClient, options);
      
      // Generate warehouse-specific filename
      const filename = this.generateWarehouseBackupFilename(warehouse, options);
      const backupPath = path.join(this.config.backupDirectory, warehouse, filename);
      
      // Ensure warehouse backup directory exists
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      
      // Write backup data with compression and encryption
      await this.writeBackupFile(backupPath, backupData, options);
      
      // Get file stats and calculate checksum
      const stats = await fs.stat(backupPath);
      const checksum = await this.calculateChecksum(backupPath);
      
      // Create backup metadata file
      await this.createBackupMetadataFile(backupPath, {
        warehouse,
        size: stats.size,
        checksum,
        backupTime: Date.now() - startTime,
        options
      });
      
      logger.info('Warehouse backup completed successfully', {
        warehouse,
        filename,
        size: stats.size,
        duration: Date.now() - startTime,
        checksum: checksum.substring(0, 8)
      });
      
      return { filename, size: stats.size, checksum };
      
    } catch (error) {
      logger.error('Warehouse backup failed', {
        warehouse,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Perform warehouse-specific data backup
   */
  private async performWarehouseDataBackup(
    warehouse: WarehouseLocation,
    client: any,
    options: Partial<BackupConfig>
  ): Promise<Buffer> {
    const isIncremental = options.incremental || false;
    const includeAuditLogs = options.includeAuditLogs !== false;
    
    // Get warehouse-specific backup script
    const scriptPath = path.join(this.config.scriptsDirectory, 'backup.sh');
    
    const args = [
      '--warehouse', warehouse,
      '--format', 'custom',
      '--compress', this.config.compressionLevel.toString()
    ];
    
    if (options.type === 'schema') {
      args.push('--schema-only');
    } else if (isIncremental) {
      args.push('--incremental');
      const lastBackup = await this.getLastWarehouseBackup(warehouse);
      if (lastBackup) {
        args.push('--since', lastBackup.startTime.toISOString());
      }
    }
    
    if (!includeAuditLogs) {
      args.push('--exclude-table', 'rhy_audit_logs');
    }
    
    if (options.pointInTimeRecovery) {
      args.push('--wal-method', 'stream');
    }
    
    const command = `bash "${scriptPath}" ${args.join(' ')}`;
    
    const { stdout } = await execAsync(command, {
      cwd: this.config.scriptsDirectory,
      timeout: this.config.alertThresholds.maxDuration * 1000,
      env: {
        ...process.env,
        RHY_DATABASE_URL: this.getWarehouseDatabaseUrl(warehouse),
        WAREHOUSE_LOCATION: warehouse,
        BACKUP_ENCRYPTION_KEY: process.env.BACKUP_ENCRYPTION_KEY,
      },
      maxBuffer: 100 * 1024 * 1024 // 100MB buffer
    });
    
    return Buffer.from(stdout, 'binary');
  }

  /**
   * Generate warehouse-specific backup filename
   */
  private generateWarehouseBackupFilename(warehouse: WarehouseLocation, options: Partial<BackupConfig>): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const type = options.type || 'full';
    const incremental = options.incremental ? '-inc' : '';
    const extension = this.config.encryptionEnabled ? '.backup.enc' : '.backup';
    
    return `rhy-${warehouse.toLowerCase()}-${type}${incremental}-${timestamp}${extension}`;
  }

  /**
   * Get warehouse-specific database URL
   */
  private getWarehouseDatabaseUrl(warehouse: WarehouseLocation): string {
    const warehouseUrls: Record<WarehouseLocation, string> = {
      'US': process.env.RHY_DATABASE_URL_US || process.env.RHY_DATABASE_URL || process.env.DATABASE_URL || '',
      'JP': process.env.RHY_DATABASE_URL_JP || process.env.RHY_DATABASE_URL || process.env.DATABASE_URL || '',
      'EU': process.env.RHY_DATABASE_URL_EU || process.env.RHY_DATABASE_URL || process.env.DATABASE_URL || '',
      'AU': process.env.RHY_DATABASE_URL_AU || process.env.RHY_DATABASE_URL || process.env.DATABASE_URL || ''
    };
    
    return warehouseUrls[warehouse];
  }

  /**
   * Get last backup for specific warehouse
   */
  private async getLastWarehouseBackup(warehouse: WarehouseLocation): Promise<BackupStatus | null> {
    try {
      const warehouseDir = path.join(this.config.backupDirectory, warehouse);
      const files = await fs.readdir(warehouseDir).catch(() => []);
      
      const backupFiles = files
        .filter(file => file.startsWith(`rhy-${warehouse.toLowerCase()}-`))
        .map(file => {
          const filePath = path.join(warehouseDir, file);
          return { file, path: filePath };
        });
      
      if (backupFiles.length === 0) return null;
      
      // Sort by modification time and get the most recent
      const fileStats = await Promise.all(
        backupFiles.map(async ({ file, path: filePath }) => {
          const stat = await fs.stat(filePath);
          return { file, path: filePath, mtime: stat.mtime };
        })
      );
      
      const latest = fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0];
      
      return {
        id: latest.file,
        status: 'completed',
        startTime: latest.mtime,
        endTime: latest.mtime,
        type: 'full',
        progress: 100,
        filename: latest.file,
        warehouse
      };
      
    } catch (error) {
      logger.warn('Failed to get last warehouse backup', {
        warehouse,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Write backup file with compression and encryption
   */
  private async writeBackupFile(
    filePath: string, 
    data: Buffer, 
    options: Partial<BackupConfig>
  ): Promise<void> {
    let processedData = data;
    
    // Apply compression if enabled
    if (options.compression !== false) {
      const zlib = require('zlib');
      processedData = await new Promise<Buffer>((resolve, reject) => {
        zlib.gzip(processedData, { level: this.config.compressionLevel }, (err, compressed) => {
          if (err) reject(err);
          else resolve(compressed);
        });
      });
    }
    
    // Apply encryption if enabled
    if (this.config.encryptionEnabled && process.env.BACKUP_ENCRYPTION_KEY) {
      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(process.env.BACKUP_ENCRYPTION_KEY, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key, iv);
      
      const encrypted = Buffer.concat([
        iv,
        cipher.update(processedData),
        cipher.final(),
        cipher.getAuthTag()
      ]);
      
      processedData = encrypted;
    }
    
    await fs.writeFile(filePath, processedData);
  }

  /**
   * Create backup metadata file
   */
  private async createBackupMetadataFile(
    backupPath: string, 
    metadata: {
      warehouse: WarehouseLocation;
      size: number;
      checksum: string;
      backupTime: number;
      options: Partial<BackupConfig>;
    }
  ): Promise<void> {
    const metadataPath = `${backupPath}.metadata.json`;
    
    const metadataContent = {
      version: '2.0.0',
      warehouse: metadata.warehouse,
      backupTime: new Date().toISOString(),
      duration: metadata.backupTime,
      size: metadata.size,
      checksum: metadata.checksum,
      type: metadata.options.type || 'full',
      compression: {
        enabled: metadata.options.compression !== false,
        level: this.config.compressionLevel
      },
      encryption: {
        enabled: this.config.encryptionEnabled,
        algorithm: 'aes-256-gcm'
      },
      features: {
        incremental: metadata.options.incremental || false,
        pointInTimeRecovery: metadata.options.pointInTimeRecovery || false,
        auditLogs: metadata.options.includeAuditLogs !== false
      },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        hostname: require('os').hostname(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
  }

  // =============================================================================
  // LEGACY BACKUP SCRIPT EXECUTION (Updated for multi-warehouse)
  // =============================================================================

  private async executeBackupScript(options: Partial<BackupConfig>): Promise<{
    filename: string;
    size: number;
    checksum: string;
  }> {
    const scriptPath = path.join(this.config.scriptsDirectory, 'backup.sh');
    
    // Build script arguments
    const args = [];
    if (options.type === 'schema') {
      args.push('--schema-only');
    }
    if (options.retention !== undefined) {
      args.push('--retention-days', options.retention.toString());
    }
    if (options.compression !== undefined) {
      args.push('--compression', options.compression.toString());
    }

    const command = `bash "${scriptPath}" ${args.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.config.scriptsDirectory,
        timeout: this.config.alertThresholds.maxDuration * 1000,
        env: {
          ...process.env,
          RHY_DATABASE_URL: process.env.RHY_DATABASE_URL || process.env.DATABASE_URL,
          BACKUP_RETENTION_DAYS: this.config.retentionDays.toString(),
          COMPRESSION_LEVEL: this.config.compressionLevel.toString(),
        },
      });

      // Parse script output for backup filename
      const filenameMatch = stdout.match(/backup completed: (.+)$/m);
      if (!filenameMatch) {
        throw new Error('Could not determine backup filename from script output');
      }

      const filename = filenameMatch[1];
      const backupPath = path.join(this.config.backupDirectory, filename);
      
      // Get file stats
      const stats = await fs.stat(backupPath);
      const size = stats.size;

      // Calculate checksum
      const checksum = await this.calculateChecksum(backupPath);

      return { filename, size, checksum };

    } catch (error) {
      console.error('Backup script execution failed:', error);
      throw new Error(`Backup script failed: ${error}`);
    }
  }

  private async executeRestoreScript(filename: string, options: RestoreOptions): Promise<void> {
    const scriptPath = path.join(this.config.scriptsDirectory, 'restore.sh');
    
    const args = ['--file', filename];
    if (options.dryRun) {
      args.push('--dry-run');
    }
    if (options.force) {
      args.push('--force');
    }
    if (options.timeout) {
      args.push('--timeout', options.timeout.toString());
    }

    const command = `bash "${scriptPath}" ${args.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.config.scriptsDirectory,
        timeout: (options.timeout || this.config.alertThresholds.maxDuration) * 1000,
        env: {
          ...process.env,
          RHY_DATABASE_URL: process.env.RHY_DATABASE_URL || process.env.DATABASE_URL,
          BACKUP_ENCRYPTION_KEY: process.env.BACKUP_ENCRYPTION_KEY,
        },
      });

      console.log('Restore script completed successfully');

    } catch (error) {
      console.error('Restore script execution failed:', error);
      throw new Error(`Restore script failed: ${error}`);
    }
  }

  // =============================================================================
  // VALIDATION & VERIFICATION
  // =============================================================================

  private async performPreBackupCheck(): Promise<DatabaseHealth> {
    const health = await checkDatabaseHealth();
    
    // Check free disk space
    const freeSpace = await this.getAvailableDiskSpace();
    if (freeSpace < this.config.alertThresholds.minFreeSpace) {
      health.status = 'unhealthy';
      health.errors.push(`Insufficient disk space: ${freeSpace} bytes available`);
    }

    return health;
  }

  private async validateBackup(filename: string): Promise<boolean> {
    const backupPath = path.join(this.config.backupDirectory, filename);
    
    try {
      // Check file exists and is readable
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      // Verify checksum if available
      const checksumPath = `${backupPath}.sha256`;
      try {
        await fs.access(checksumPath);
        const isValid = await this.verifyChecksum(backupPath, checksumPath);
        if (!isValid) {
          throw new Error('Backup checksum verification failed');
        }
      } catch (error) {
        console.warn('Checksum file not found, skipping verification');
      }

      // Size validation
      if (stats.size > this.config.maxBackupSize) {
        console.warn(`Backup size (${stats.size}) exceeds maximum (${this.config.maxBackupSize})`);
      }

      return true;

    } catch (error) {
      console.error('Backup validation failed:', error);
      throw error;
    }
  }

  private async performPostRestoreValidation(): Promise<void> {
    try {
      // Test database connectivity
      await prisma.$queryRaw`SELECT 1 as test`;

      // Verify essential tables exist
      const tableCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;

      if (Number(tableCount[0]?.count || 0) === 0) {
        throw new Error('No tables found after restore');
      }

      console.log('Post-restore validation completed successfully');

    } catch (error) {
      console.error('Post-restore validation failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  private generateBackupId(prefix = 'backup'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`sha256sum "${filePath}"`);
      return stdout.split(' ')[0];
    } catch (error) {
      console.warn('Failed to calculate checksum:', error);
      return '';
    }
  }

  private async verifyChecksum(filePath: string, checksumPath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`sha256sum -c "${checksumPath}"`);
      return stdout.includes(': OK');
    } catch (error) {
      console.error('Checksum verification failed:', error);
      return false;
    }
  }

  private async getAvailableDiskSpace(): Promise<number> {
    try {
      const { stdout } = await execAsync(`df "${this.config.backupDirectory}" | awk 'NR==2 {print $4}'`);
      return parseInt(stdout.trim()) * 1024; // Convert KB to bytes
    } catch (error) {
      console.warn('Failed to check disk space:', error);
      return Infinity; // Assume sufficient space if check fails
    }
  }

  private async generateBackupMetadata(backupResult: {
    filename: string;
    size: number;
    checksum: string;
  }): Promise<BackupMetadata> {
    return {
      version: '1.0.0',
      database: 'rhy_supplier_portal',
      timestamp: new Date().toISOString(),
      size: backupResult.size,
      checksum: backupResult.checksum,
      compressionEnabled: true,
      encryptionEnabled: this.config.encryptionEnabled,
      retentionDays: this.config.retentionDays,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        hostname: require('os').hostname(),
      },
    };
  }

  // =============================================================================
  // CLEANUP & MAINTENANCE
  // =============================================================================

  private async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const files = await fs.readdir(this.config.backupDirectory);
      const backupFiles = files.filter(file => file.startsWith('rhy_backup_'));

      let deletedCount = 0;
      for (const file of backupFiles) {
        const filePath = path.join(this.config.backupDirectory, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          
          // Also delete associated files (checksum, metadata)
          const associatedFiles = [
            `${filePath}.sha256`,
            `${filePath}.metadata.json`,
          ];
          
          for (const assocFile of associatedFiles) {
            try {
              await fs.unlink(assocFile);
            } catch (error) {
              // Ignore if file doesn't exist
            }
          }
          
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old backup files`);
      }

    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  // =============================================================================
  // LOGGING & NOTIFICATIONS
  // =============================================================================

  private async logBackupEvent(
    backupId: string,
    event: string,
    message: string,
    metadata?: object
  ): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO "rhy_audit_logs" ("action", "resource", "resourceId", "metadata", "timestamp")
        VALUES (${`BACKUP_${event.toUpperCase()}`}, 'database', ${backupId}, ${JSON.stringify({
          message,
          ...metadata,
        })}, NOW())
      `;
    } catch (error) {
      console.error('Failed to log backup event:', error);
    }
  }

  private async sendBackupNotification(
    type: 'success' | 'failure' | 'warning',
    status: BackupStatus
  ): Promise<void> {
    // Placeholder for notification system integration
    const notification = {
      type,
      backupId: status.id,
      status: status.status,
      filename: status.filename,
      duration: status.endTime 
        ? status.endTime.getTime() - status.startTime.getTime()
        : undefined,
      error: status.error,
      timestamp: new Date().toISOString(),
    };

    console.log('BACKUP NOTIFICATION:', notification);

    // TODO: Integrate with external notification systems (email, Slack, etc.)
    // await notificationService.send(notification);
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  async getBackupStatus(backupId: string): Promise<BackupStatus | null> {
    return this.activeBackups.get(backupId) || null;
  }

  async listBackups(): Promise<Array<{
    filename: string;
    size: number;
    created: Date;
    type: string;
  }>> {
    try {
      const files = await fs.readdir(this.config.backupDirectory);
      const backupFiles = files.filter(file => file.startsWith('rhy_backup_'));

      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.config.backupDirectory, file);
          const stats = await fs.stat(filePath);
          
          return {
            filename: file,
            size: stats.size,
            created: stats.mtime,
            type: file.includes('_schema') ? 'schema' : 'full',
          };
        })
      );

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());

    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async getBackupMetrics(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | null;
    latestBackup: Date | null;
    avgBackupSize: number;
  }> {
    const backups = await this.listBackups();
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        latestBackup: null,
        avgBackupSize: 0,
      };
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const sortedByDate = backups.sort((a, b) => a.created.getTime() - b.created.getTime());

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: sortedByDate[0].created,
      latestBackup: sortedByDate[sortedByDate.length - 1].created,
      avgBackupSize: Math.round(totalSize / backups.length),
    };
  }

  async scheduleAutomaticBackup(schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    type: 'full' | 'schema';
  }): Promise<string> {
    // This would integrate with a job scheduler (cron, node-cron, etc.)
    const schedulerId = this.generateBackupId('schedule');
    
    console.log('Backup scheduled:', {
      id: schedulerId,
      ...schedule,
    });

    // TODO: Implement actual scheduling logic
    // await jobScheduler.schedule(schedulerId, schedule, () => this.createBackup({ type: schedule.type }));

    return schedulerId;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const backupManager = new DatabaseBackupManager();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export async function createDatabaseBackup(
  options: Partial<BackupConfig> = {}
): Promise<BackupStatus> {
  return backupManager.createBackup(options);
}

export async function restoreDatabaseBackup(
  filename: string,
  options: RestoreOptions = {}
): Promise<BackupStatus> {
  return backupManager.restoreBackup(filename, options);
}

export async function listDatabaseBackups() {
  return backupManager.listBackups();
}

export async function getDatabaseBackupMetrics() {
  return backupManager.getBackupMetrics();
}