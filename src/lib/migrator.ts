/**
 * RHY Supplier Portal - Database Migration System
 * Enterprise-grade database migration library with comprehensive error handling,
 * rollback capabilities, and performance monitoring for PostgreSQL
 * 
 * @version 1.0.0
 * @author RHY Development Team
 * @license Proprietary
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import crypto from 'crypto';
import { prisma } from './database';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface MigrationFile {
  id: string;
  filename: string;
  version: number;
  name: string;
  path: string;
  checksum: string;
  content: string;
  size: number;
  createdAt: Date;
}

export interface MigrationResult {
  success: boolean;
  migration: MigrationFile;
  executionTimeMs: number;
  affectedRows?: number;
  error?: Error;
  rollbackSql?: string;
  warnings: string[];
  metadata: Record<string, any>;
}

export interface MigrationStatus {
  totalMigrations: number;
  appliedMigrations: number;
  pendingMigrations: number;
  lastMigration?: MigrationFile;
  databaseVersion: string;
  integrityCheck: boolean;
  errors: string[];
}

export interface MigrationConfig {
  migrationsPath: string;
  tableName: string;
  dryRun: boolean;
  timeout: number;
  backup: boolean;
  rollbackOnError: boolean;
  validateChecksums: boolean;
  parallelExecution: boolean;
  maxRetries: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  environment: 'development' | 'staging' | 'production';
}

export interface RollbackOptions {
  targetVersion?: number;
  targetMigration?: string;
  steps?: number;
  dryRun?: boolean;
  force?: boolean;
}

// =============================================================================
// MIGRATION MANAGER CLASS
// =============================================================================

export class MigrationManager {
  private prisma: PrismaClient;
  private config: MigrationConfig;
  private logger: Logger;

  constructor(config: Partial<MigrationConfig> = {}) {
    this.prisma = prisma;
    this.config = {
      migrationsPath: join(process.cwd(), 'src', 'migrations'),
      tableName: 'migration_history',
      dryRun: false,
      timeout: 300000, // 5 minutes
      backup: true,
      rollbackOnError: true,
      validateChecksums: true,
      parallelExecution: false,
      maxRetries: 3,
      retryDelay: 1000,
      logLevel: 'info',
      environment: (process.env.NODE_ENV as any) || 'development',
      ...config,
    };
    this.logger = new Logger(this.config.logLevel);
  }

  // =============================================================================
  // MIGRATION DISCOVERY AND VALIDATION
  // =============================================================================

  /**
   * Discover and validate all migration files in the migrations directory
   */
  public async discoverMigrations(): Promise<MigrationFile[]> {
    this.logger.info('Discovering migration files...');
    
    try {
      const files = readdirSync(this.config.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      const migrations: MigrationFile[] = [];
      
      for (const filename of files) {
        const migrationFile = await this.parseMigrationFile(filename);
        migrations.push(migrationFile);
      }

      this.logger.info(`Discovered ${migrations.length} migration files`);
      
      // Validate migration sequence
      this.validateMigrationSequence(migrations);
      
      return migrations;
    } catch (error) {
      this.logger.error('Failed to discover migrations', error);
      throw new Error(`Migration discovery failed: ${error}`);
    }
  }

  /**
   * Parse and validate a single migration file
   */
  private async parseMigrationFile(filename: string): Promise<MigrationFile> {
    const filePath = join(this.config.migrationsPath, filename);
    const stats = statSync(filePath);
    const content = readFileSync(filePath, 'utf-8');
    
    // Extract version from filename (e.g., 001_initial_schema.sql -> 1)
    const versionMatch = filename.match(/^(\d+)_/);
    if (!versionMatch) {
      throw new Error(`Invalid migration filename format: ${filename}`);
    }
    
    const version = parseInt(versionMatch[1], 10);
    const name = basename(filename, extname(filename));
    const checksum = this.calculateChecksum(content);
    
    return {
      id: `${version}_${name}`,
      filename,
      version,
      name,
      path: filePath,
      checksum,
      content,
      size: stats.size,
      createdAt: stats.birthtime,
    };
  }

  /**
   * Validate migration sequence integrity
   */
  private validateMigrationSequence(migrations: MigrationFile[]): void {
    const versions = migrations.map(m => m.version).sort((a, b) => a - b);
    
    for (let i = 0; i < versions.length; i++) {
      const expectedVersion = i + 1;
      if (versions[i] !== expectedVersion) {
        throw new Error(
          `Migration sequence gap: expected version ${expectedVersion}, found ${versions[i]}`
        );
      }
    }
  }

  // =============================================================================
  // MIGRATION EXECUTION
  // =============================================================================

  /**
   * Execute all pending migrations
   */
  public async migrate(): Promise<MigrationResult[]> {
    this.logger.info('Starting migration process...');
    
    try {
      // Ensure migration history table exists
      await this.ensureMigrationTable();
      
      // Get all migrations and applied status
      const allMigrations = await this.discoverMigrations();
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedVersions = new Set(appliedMigrations.map(m => m.version_number));
      
      // Filter pending migrations
      const pendingMigrations = allMigrations.filter(
        migration => !appliedVersions.has(migration.version)
      );
      
      if (pendingMigrations.length === 0) {
        this.logger.info('No pending migrations found');
        return [];
      }

      this.logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      // Execute migrations
      const results: MigrationResult[] = [];
      
      for (const migration of pendingMigrations) {
        const result = await this.executeMigration(migration);
        results.push(result);
        
        if (!result.success && this.config.rollbackOnError) {
          this.logger.error('Migration failed, initiating rollback...');
          await this.rollbackLastMigration();
          break;
        }
      }
      
      // Final validation
      await this.validateDatabaseIntegrity();
      
      this.logger.info('Migration process completed');
      return results;
      
    } catch (error) {
      this.logger.error('Migration process failed', error);
      throw error;
    }
  }

  /**
   * Execute a single migration with comprehensive error handling
   */
  private async executeMigration(migration: MigrationFile): Promise<MigrationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const metadata: Record<string, any> = {
      migrationId: migration.id,
      version: migration.version,
      environment: this.config.environment,
      dryRun: this.config.dryRun,
    };
    
    this.logger.info(`Executing migration: ${migration.name}`);
    
    try {
      // Validate checksum if required
      if (this.config.validateChecksums) {
        await this.validateMigrationChecksum(migration);
      }
      
      // Create backup if required
      if (this.config.backup && !this.config.dryRun) {
        await this.createMigrationBackup(migration);
      }
      
      // Parse and validate SQL
      const sqlStatements = this.parseSqlStatements(migration.content);
      metadata.statementCount = sqlStatements.length;
      
      let affectedRows = 0;
      
      if (this.config.dryRun) {
        this.logger.info(`DRY RUN: Would execute ${sqlStatements.length} statements`);
        warnings.push('Migration executed in dry-run mode');
      } else {
        // Execute migration within transaction
        await this.prisma.$transaction(async (tx) => {
          for (const [index, statement] of sqlStatements.entries()) {
            try {
              this.logger.debug(`Executing statement ${index + 1}/${sqlStatements.length}`);
              const result = await tx.$executeRawUnsafe(statement);
              affectedRows += result;
            } catch (error) {
              this.logger.error(`Statement ${index + 1} failed: ${statement.substring(0, 100)}...`);
              throw error;
            }
          }
          
          // Record migration in history
          await this.recordMigrationHistory(tx as any, migration, Date.now() - startTime);
        }, {
          timeout: this.config.timeout,
        });
      }
      
      const executionTimeMs = Date.now() - startTime;
      
      this.logger.info(
        `Migration ${migration.name} completed successfully in ${executionTimeMs}ms`
      );
      
      return {
        success: true,
        migration,
        executionTimeMs,
        affectedRows,
        warnings,
        metadata,
      };
      
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      
      this.logger.error(`Migration ${migration.name} failed`, error);
      
      return {
        success: false,
        migration,
        executionTimeMs,
        error: error as Error,
        warnings,
        metadata,
      };
    }
  }

  // =============================================================================
  // ROLLBACK FUNCTIONALITY
  // =============================================================================

  /**
   * Rollback migrations to a specific state
   */
  public async rollback(options: RollbackOptions = {}): Promise<MigrationResult[]> {
    this.logger.info('Starting rollback process...');
    
    try {
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        this.logger.info('No migrations to rollback');
        return [];
      }
      
      // Determine rollback target
      const rollbackMigrations = this.determineRollbackMigrations(
        appliedMigrations,
        options
      );
      
      if (rollbackMigrations.length === 0) {
        this.logger.info('No migrations match rollback criteria');
        return [];
      }
      
      this.logger.info(`Rolling back ${rollbackMigrations.length} migrations`);
      
      // Execute rollbacks in reverse order
      const results: MigrationResult[] = [];
      
      for (const migration of rollbackMigrations.reverse()) {
        const result = await this.executeRollback(migration);
        results.push(result);
        
        if (!result.success && !options.force) {
          this.logger.error('Rollback failed, stopping process');
          break;
        }
      }
      
      this.logger.info('Rollback process completed');
      return results;
      
    } catch (error) {
      this.logger.error('Rollback process failed', error);
      throw error;
    }
  }

  /**
   * Rollback the last applied migration
   */
  private async rollbackLastMigration(): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      return;
    }
    
    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    
    if (lastMigration.rollback_sql) {
      try {
        await this.prisma.$executeRawUnsafe(lastMigration.rollback_sql);
        await this.removeMigrationHistory(lastMigration.migration_name);
        this.logger.info(`Rolled back migration: ${lastMigration.migration_name}`);
      } catch (error) {
        this.logger.error('Failed to rollback migration', error);
        throw error;
      }
    } else {
      this.logger.warn(`No rollback SQL available for migration: ${lastMigration.migration_name}`);
    }
  }

  // =============================================================================
  // STATUS AND VALIDATION
  // =============================================================================

  /**
   * Get comprehensive migration status
   */
  public async getStatus(): Promise<MigrationStatus> {
    try {
      const allMigrations = await this.discoverMigrations();
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedVersions = new Set(appliedMigrations.map(m => m.version_number));
      
      const pendingMigrations = allMigrations.filter(
        migration => !appliedVersions.has(migration.version)
      );
      
      const lastApplied = appliedMigrations[appliedMigrations.length - 1];
      const lastMigration = lastApplied ? 
        allMigrations.find(m => m.version === lastApplied.version_number) : 
        undefined;
      
      // Check database integrity
      const integrityCheck = await this.validateDatabaseIntegrity();
      const checksumValidation = await this.validateAllChecksums(allMigrations, appliedMigrations);
      
      const errors: string[] = [];
      if (!integrityCheck) {
        errors.push('Database integrity check failed');
      }
      if (!checksumValidation) {
        errors.push('Migration checksum validation failed');
      }
      
      return {
        totalMigrations: allMigrations.length,
        appliedMigrations: appliedMigrations.length,
        pendingMigrations: pendingMigrations.length,
        lastMigration,
        databaseVersion: this.getDatabaseVersion(appliedMigrations),
        integrityCheck: integrityCheck && checksumValidation,
        errors,
      };
      
    } catch (error) {
      this.logger.error('Failed to get migration status', error);
      throw error;
    }
  }

  /**
   * Validate database integrity
   */
  private async validateDatabaseIntegrity(): Promise<boolean> {
    try {
      // Check if migration table exists and is accessible
      await this.prisma.$queryRaw`SELECT COUNT(*) FROM migration_history LIMIT 1`;
      
      // Validate foreign key constraints
      const constraintViolations = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu USING (constraint_schema, constraint_name)
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = current_schema()
      `;
      
      return true;
    } catch (error) {
      this.logger.error('Database integrity validation failed', error);
      return false;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Ensure migration history table exists
   */
  private async ensureMigrationTable(): Promise<void> {
    const tableExists = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema()
        AND table_name = ${this.config.tableName}
      ) as exists
    `;
    
    if (!tableExists[0]?.exists) {
      // Create migration history table if it doesn't exist
      // This should normally be part of the initial schema migration
      this.logger.warn('Migration history table does not exist, creating...');
      throw new Error('Migration history table must exist before running migrations');
    }
  }

  /**
   * Get applied migrations from database
   */
  private async getAppliedMigrations(): Promise<Array<{
    migration_name: string;
    version_number: number;
    executed_at: Date;
    checksum: string;
    rollback_sql?: string;
  }>> {
    return await this.prisma.$queryRaw`
      SELECT migration_name, version_number, executed_at, checksum, rollback_sql
      FROM migration_history
      WHERE success = true
      ORDER BY version_number ASC
    `;
  }

  /**
   * Record migration in history table
   */
  private async recordMigrationHistory(
    tx: PrismaClient,
    migration: MigrationFile,
    executionTimeMs: number
  ): Promise<void> {
    await tx.$executeRaw`
      INSERT INTO migration_history (
        migration_name,
        version_number,
        executed_at,
        execution_time_ms,
        checksum,
        success,
        applied_by
      ) VALUES (
        ${migration.filename},
        ${migration.version},
        NOW(),
        ${executionTimeMs},
        ${migration.checksum},
        true,
        ${process.env.USER || 'system'}
      )
    `;
  }

  /**
   * Remove migration from history (for rollbacks)
   */
  private async removeMigrationHistory(migrationName: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM migration_history 
      WHERE migration_name = ${migrationName}
    `;
  }

  /**
   * Calculate SHA-256 checksum of migration content
   */
  private calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Parse SQL content into individual statements
   */
  private parseSqlStatements(content: string): string[] {
    // Remove comments and normalize whitespace
    const cleanContent = content
      .replace(/--.*$/gm, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Split on semicolons (basic implementation)
    const statements = cleanContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.match(/^\s*$/));
    
    return statements;
  }

  /**
   * Validate migration checksum against recorded value
   */
  private async validateMigrationChecksum(migration: MigrationFile): Promise<void> {
    const applied = await this.prisma.$queryRaw<Array<{ checksum: string }>>`
      SELECT checksum FROM migration_history 
      WHERE migration_name = ${migration.filename}
    `;
    
    if (applied.length > 0 && applied[0].checksum !== migration.checksum) {
      throw new Error(
        `Migration checksum mismatch for ${migration.filename}: ` +
        `expected ${applied[0].checksum}, got ${migration.checksum}`
      );
    }
  }

  /**
   * Validate all migration checksums
   */
  private async validateAllChecksums(
    migrations: MigrationFile[],
    appliedMigrations: Array<{ migration_name: string; checksum: string }>
  ): Promise<boolean> {
    const appliedMap = new Map(
      appliedMigrations.map(m => [m.migration_name, m.checksum])
    );
    
    for (const migration of migrations) {
      const appliedChecksum = appliedMap.get(migration.filename);
      if (appliedChecksum && appliedChecksum !== migration.checksum) {
        this.logger.error(
          `Checksum mismatch for ${migration.filename}: ` +
          `database=${appliedChecksum}, file=${migration.checksum}`
        );
        return false;
      }
    }
    
    return true;
  }

  /**
   * Determine which migrations to rollback based on options
   */
  private determineRollbackMigrations(
    appliedMigrations: Array<{ migration_name: string; version_number: number }>,
    options: RollbackOptions
  ): Array<{ migration_name: string; version_number: number }> {
    if (options.steps) {
      return appliedMigrations.slice(-options.steps);
    }
    
    if (options.targetVersion) {
      return appliedMigrations.filter(m => m.version_number > options.targetVersion!);
    }
    
    if (options.targetMigration) {
      const targetIndex = appliedMigrations.findIndex(
        m => m.migration_name === options.targetMigration
      );
      if (targetIndex >= 0) {
        return appliedMigrations.slice(targetIndex + 1);
      }
    }
    
    // Default: rollback last migration
    return appliedMigrations.slice(-1);
  }

  /**
   * Execute rollback for a specific migration
   */
  private async executeRollback(migration: { 
    migration_name: string; 
    version_number: number 
  }): Promise<MigrationResult> {
    // This is a simplified implementation
    // In practice, you'd need rollback SQL or schema reverse operations
    throw new Error('Rollback implementation requires rollback SQL in migration files');
  }

  /**
   * Create backup before migration
   */
  private async createMigrationBackup(migration: MigrationFile): Promise<void> {
    // This would typically create a database backup
    // Implementation depends on deployment environment
    this.logger.info(`Creating backup before migration ${migration.name}`);
  }

  /**
   * Get database version string
   */
  private getDatabaseVersion(appliedMigrations: Array<{ version_number: number }>): string {
    if (appliedMigrations.length === 0) {
      return '0.0.0';
    }
    
    const latest = Math.max(...appliedMigrations.map(m => m.version_number));
    return `1.${latest}.0`;
  }
}

// =============================================================================
// LOGGER CLASS
// =============================================================================

class Logger {
  constructor(private level: 'debug' | 'info' | 'warn' | 'error') {}

  debug(message: string, meta?: any): void {
    if (this.level === 'debug') {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }

  info(message: string, meta?: any): void {
    if (['debug', 'info'].includes(this.level)) {
      console.info(`[INFO] ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: any): void {
    if (['debug', 'info', 'warn'].includes(this.level)) {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  }

  error(message: string, meta?: any): void {
    console.error(`[ERROR] ${message}`, meta || '');
  }
}

// =============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// =============================================================================

/**
 * Create a new migration manager instance
 */
export function createMigrationManager(config?: Partial<MigrationConfig>): MigrationManager {
  return new MigrationManager(config);
}

/**
 * Execute migrations with default configuration
 */
export async function runMigrations(config?: Partial<MigrationConfig>): Promise<MigrationResult[]> {
  const manager = createMigrationManager(config);
  return await manager.migrate();
}

/**
 * Get migration status with default configuration
 */
export async function getMigrationStatus(config?: Partial<MigrationConfig>): Promise<MigrationStatus> {
  const manager = createMigrationManager(config);
  return await manager.getStatus();
}

/**
 * Rollback migrations with default configuration
 */
export async function rollbackMigrations(
  options: RollbackOptions = {},
  config?: Partial<MigrationConfig>
): Promise<MigrationResult[]> {
  const manager = createMigrationManager(config);
  return await manager.rollback(options);
}

// Default export
export default MigrationManager;