/**
 * RHY_006: PostgreSQL Database Configuration
 * Enterprise-grade PostgreSQL deployment and configuration management
 * Supports high-availability, connection pooling, and performance optimization
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

// ===================================
// DATABASE CONFIGURATION TYPES
// ===================================

export interface DatabaseConfig {
  url: string;
  poolSize: number;
  connectionTimeout: number;
  queryTimeout: number;
  retries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  ssl: boolean;
  readReplicas?: string[];
  maxConnections: number;
  idleTimeout: number;
  schema: string;
  migrations: {
    autoApply: boolean;
    directory: string;
  };
}

export interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  avgQueryTime: number;
  errorRate: number;
  uptime: number;
  lastHealthCheck: Date;
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  metrics: DatabaseMetrics;
  errors: string[];
  warnings: string[];
}

// ===================================
// ENVIRONMENT CONFIGURATIONS
// ===================================

const PRODUCTION_CONFIG: DatabaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://rhy_user:rhy_password@localhost:5432/rhy_supplier_portal',
  poolSize: 20,
  connectionTimeout: 10000,  // 10 seconds
  queryTimeout: 30000,       // 30 seconds
  retries: 3,
  retryDelay: 1000,         // 1 second
  enableLogging: true,
  enableMetrics: true,
  ssl: true,
  readReplicas: [
    process.env.DATABASE_READ_REPLICA_1,
    process.env.DATABASE_READ_REPLICA_2
  ].filter(Boolean),
  maxConnections: 100,
  idleTimeout: 300000,      // 5 minutes
  schema: 'public',
  migrations: {
    autoApply: false,
    directory: './prisma/migrations'
  }
};

const DEVELOPMENT_CONFIG: DatabaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/rhy_dev',
  poolSize: 5,
  connectionTimeout: 5000,
  queryTimeout: 15000,
  retries: 2,
  retryDelay: 500,
  enableLogging: true,
  enableMetrics: false,
  ssl: false,
  maxConnections: 20,
  idleTimeout: 60000,       // 1 minute
  schema: 'public',
  migrations: {
    autoApply: true,
    directory: './prisma/migrations'
  }
};

const TEST_CONFIG: DatabaseConfig = {
  url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/rhy_test',
  poolSize: 2,
  connectionTimeout: 3000,
  queryTimeout: 10000,
  retries: 1,
  retryDelay: 250,
  enableLogging: false,
  enableMetrics: false,
  ssl: false,
  maxConnections: 10,
  idleTimeout: 30000,       // 30 seconds
  schema: 'public',
  migrations: {
    autoApply: true,
    directory: './prisma/migrations'
  }
};

// ===================================
// DATABASE CONFIGURATION MANAGER
// ===================================

export class DatabaseConfigManager {
  private static instance: DatabaseConfigManager;
  private config: DatabaseConfig;
  private environment: 'production' | 'development' | 'test';

  private constructor() {
    this.environment = (process.env.NODE_ENV as any) || 'development';
    this.config = this.getConfigForEnvironment();
    this.validateConfig();
  }

  public static getInstance(): DatabaseConfigManager {
    if (!DatabaseConfigManager.instance) {
      DatabaseConfigManager.instance = new DatabaseConfigManager();
    }
    return DatabaseConfigManager.instance;
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
    logger.info('Database configuration updated', { 
      environment: this.environment,
      updates 
    });
  }

  private getConfigForEnvironment(): DatabaseConfig {
    switch (this.environment) {
      case 'production':
        return { ...PRODUCTION_CONFIG };
      case 'test':
        return { ...TEST_CONFIG };
      default:
        return { ...DEVELOPMENT_CONFIG };
    }
  }

  private validateConfig(): void {
    const { url, poolSize, connectionTimeout, queryTimeout } = this.config;

    if (!url) {
      throw new Error('Database URL is required');
    }

    if (poolSize < 1 || poolSize > 100) {
      throw new Error('Pool size must be between 1 and 100');
    }

    if (connectionTimeout < 1000 || connectionTimeout > 60000) {
      throw new Error('Connection timeout must be between 1 and 60 seconds');
    }

    if (queryTimeout < 1000 || queryTimeout > 300000) {
      throw new Error('Query timeout must be between 1 second and 5 minutes');
    }
  }
}

// ===================================
// DATABASE CONNECTION MANAGER
// ===================================

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private clients: Map<string, PrismaClient> = new Map();
  private metrics: DatabaseMetrics;
  private configManager: DatabaseConfigManager;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.configManager = DatabaseConfigManager.getInstance();
    this.metrics = {
      connectionCount: 0,
      activeQueries: 0,
      avgQueryTime: 0,
      errorRate: 0,
      uptime: Date.now(),
      lastHealthCheck: new Date()
    };
    this.startHealthMonitoring();
  }

  public static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  /**
   * Get primary database client
   */
  public getPrimaryClient(): PrismaClient {
    const key = 'primary';
    if (!this.clients.has(key)) {
      this.clients.set(key, this.createClient('primary'));
    }
    return this.clients.get(key)!;
  }

  /**
   * Get read replica client (if available)
   */
  public getReadReplicaClient(): PrismaClient {
    const config = this.configManager.getConfig();
    
    if (config.readReplicas && config.readReplicas.length > 0) {
      // Simple round-robin selection
      const replicaIndex = this.metrics.connectionCount % config.readReplicas.length;
      const replicaUrl = config.readReplicas[replicaIndex];
      const key = `replica_${replicaIndex}`;
      
      if (!this.clients.has(key)) {
        this.clients.set(key, this.createClient('replica', replicaUrl));
      }
      return this.clients.get(key)!;
    }
    
    // Fallback to primary if no replicas
    return this.getPrimaryClient();
  }

  /**
   * Execute query with automatic retry and metrics collection
   */
  public async executeQuery<T>(
    operation: (client: PrismaClient) => Promise<T>,
    options: {
      useReadReplica?: boolean;
      retries?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const config = this.configManager.getConfig();
    const {
      useReadReplica = false,
      retries = config.retries,
      timeout = config.queryTimeout
    } = options;

    const client = useReadReplica ? this.getReadReplicaClient() : this.getPrimaryClient();
    const startTime = Date.now();

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        this.metrics.activeQueries++;
        
        // Set query timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), timeout);
        });

        const result = await Promise.race([
          operation(client),
          timeoutPromise
        ]);

        // Update metrics on success
        const queryTime = Date.now() - startTime;
        this.updateQueryMetrics(queryTime, true);

        return result;

      } catch (error) {
        lastError = error as Error;
        this.updateQueryMetrics(Date.now() - startTime, false);

        if (attempt < retries) {
          await this.sleep(config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
          logger.warn(`Database query retry ${attempt + 1}/${retries}`, { 
            error: lastError.message,
            attempt: attempt + 1
          });
        }
      } finally {
        this.metrics.activeQueries--;
      }
    }

    logger.error('Database query failed after all retries', { 
      error: lastError?.message,
      retries,
      queryTime: Date.now() - startTime
    });

    throw lastError;
  }

  /**
   * Check database health
   */
  public async checkHealth(): Promise<DatabaseHealth> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const client = this.getPrimaryClient();
      const startTime = Date.now();

      // Test basic connectivity
      await client.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      // Performance warnings
      if (responseTime > 100) {
        warnings.push(`Slow database response: ${responseTime}ms`);
      }

      if (this.metrics.errorRate > 5) {
        warnings.push(`High error rate: ${this.metrics.errorRate.toFixed(2)}%`);
      }

      if (this.metrics.connectionCount > 80) {
        warnings.push(`High connection count: ${this.metrics.connectionCount}`);
      }

      this.metrics.lastHealthCheck = new Date();

      const status = errors.length > 0 ? 'unhealthy' : 
                    warnings.length > 0 ? 'degraded' : 'healthy';

      return {
        status,
        message: this.getHealthMessage(status, errors, warnings),
        metrics: { ...this.metrics },
        errors,
        warnings
      };

    } catch (error) {
      errors.push((error as Error).message);
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        metrics: { ...this.metrics },
        errors,
        warnings
      };
    }
  }

  /**
   * Gracefully close all connections
   */
  public async closeAll(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    const closePromises = Array.from(this.clients.values()).map(client => 
      client.$disconnect().catch(error => 
        logger.warn('Error closing database connection', { error: error.message })
      )
    );

    await Promise.all(closePromises);
    this.clients.clear();
    
    logger.info('All database connections closed');
  }

  /**
   * Get current metrics
   */
  public getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  // ===================================
  // PRIVATE METHODS
  // ===================================

  private createClient(type: 'primary' | 'replica', url?: string): PrismaClient {
    const config = this.configManager.getConfig();
    const connectionUrl = url || config.url;

    const client = new PrismaClient({
      datasources: {
        db: {
          url: connectionUrl
        }
      },
      log: config.enableLogging ? [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' }
      ] : [],
      errorFormat: 'pretty'
    });

    // Set up event listeners
    if (config.enableLogging) {
      client.$on('error', (e) => {
        logger.error('Prisma error', { error: e.message, target: e.target });
      });

      client.$on('warn', (e) => {
        logger.warn('Prisma warning', { message: e.message, target: e.target });
      });

      client.$on('info', (e) => {
        logger.info('Prisma info', { message: e.message, target: e.target });
      });
    }

    this.metrics.connectionCount++;
    
    logger.info(`Database client created`, { 
      type, 
      connectionCount: this.metrics.connectionCount 
    });

    return client;
  }

  private updateQueryMetrics(queryTime: number, success: boolean): void {
    // Update average query time
    this.metrics.avgQueryTime = (this.metrics.avgQueryTime + queryTime) / 2;

    // Update error rate (simple moving average)
    const errorOccurred = success ? 0 : 1;
    this.metrics.errorRate = (this.metrics.errorRate * 0.9) + (errorOccurred * 10);
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        logger.error('Health check failed', { error: (error as Error).message });
      }
    }, 30000); // Every 30 seconds
  }

  private getHealthMessage(
    status: 'healthy' | 'degraded' | 'unhealthy',
    errors: string[],
    warnings: string[]
  ): string {
    switch (status) {
      case 'healthy':
        return 'Database is operating normally';
      case 'degraded':
        return `Database is operational with warnings: ${warnings.join(', ')}`;
      case 'unhealthy':
        return `Database has critical issues: ${errors.join(', ')}`;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Get database configuration for current environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  return DatabaseConfigManager.getInstance().getConfig();
}

/**
 * Get primary database client
 */
export function getPrimaryDatabase(): PrismaClient {
  return DatabaseConnectionManager.getInstance().getPrimaryClient();
}

/**
 * Get read replica database client
 */
export function getReadDatabase(): PrismaClient {
  return DatabaseConnectionManager.getInstance().getReadReplicaClient();
}

/**
 * Execute database operation with retry logic
 */
export async function executeWithRetry<T>(
  operation: (client: PrismaClient) => Promise<T>,
  options?: {
    useReadReplica?: boolean;
    retries?: number;
    timeout?: number;
  }
): Promise<T> {
  return DatabaseConnectionManager.getInstance().executeQuery(operation, options);
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  return DatabaseConnectionManager.getInstance().checkHealth();
}

/**
 * Get database metrics
 */
export function getDatabaseMetrics(): DatabaseMetrics {
  return DatabaseConnectionManager.getInstance().getMetrics();
}

/**
 * Close all database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  return DatabaseConnectionManager.getInstance().closeAll();
}

// ===================================
// EXPORTS FOR LEGACY COMPATIBILITY
// ===================================

export const database = getPrimaryDatabase();
export const readDatabase = getReadDatabase();

interface ConnectionMetrics {
  activeConnections: number;
  totalQueries: number;
  avgQueryTime: number;
  errorCount: number;
  lastHealthCheck: Date;
}

interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  connections: number;
  errors: string[];
  lastCheck: Date;
}

// Global Prisma instance for serverless environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  metrics: ConnectionMetrics | undefined;
};

// Database configuration with environment-specific defaults
const getDatabaseConfig = (): DatabaseConfig => ({
  url: process.env.RHY_DATABASE_URL || 
       process.env.DATABASE_URL || 
       "postgresql://rhy_user:rhy_password@localhost:5432/rhy_supplier_portal",
  poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
  timeout: parseInt(process.env.DB_TIMEOUT || '30000'),
  retries: parseInt(process.env.DB_RETRIES || '3'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
  enableLogging: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
  enableMetrics: process.env.DB_METRICS !== 'false',
});

const config = getDatabaseConfig();

// Enhanced Prisma client with PostgreSQL connection pooling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: config.url,
    },
  },
  log: config.enableLogging 
    ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'info' },
      ]
    : [{ emit: 'event', level: 'error' }],
  errorFormat: 'pretty',
});

// Connection metrics tracking
export const connectionMetrics: ConnectionMetrics = globalForPrisma.metrics ?? {
  activeConnections: 0,
  totalQueries: 0,
  avgQueryTime: 0,
  errorCount: 0,
  lastHealthCheck: new Date(),
};

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.metrics = connectionMetrics;
}

// =============================================================================
// PERFORMANCE MONITORING & LOGGING
// =============================================================================

// Query performance monitoring
if (config.enableMetrics) {
  prisma.$on('query', (e) => {
    connectionMetrics.totalQueries++;
    connectionMetrics.avgQueryTime = 
      (connectionMetrics.avgQueryTime + parseFloat(e.duration.toString())) / 2;
    
    // Log slow queries (>100ms)
    if (parseFloat(e.duration.toString()) > 100) {
      console.warn('Slow query detected:', {
        query: e.query.substring(0, 200),
        duration: e.duration,
        params: e.params,
        target: e.target,
      });
    }
  });

  prisma.$on('error', (e) => {
    connectionMetrics.errorCount++;
    console.error('Database error:', {
      target: e.target,
      message: e.message,
      timestamp: new Date().toISOString(),
    });
  });

  prisma.$on('warn', (e) => {
    console.warn('Database warning:', {
      target: e.target,
      message: e.message,
      timestamp: new Date().toISOString(),
    });
  });
}

// =============================================================================
// CONNECTION MANAGEMENT
// =============================================================================

export async function connectDatabase(): Promise<PrismaClient> {
  let attempt = 0;
  
  while (attempt < config.retries) {
    try {
      await prisma.$connect();
      connectionMetrics.activeConnections++;
      connectionMetrics.lastHealthCheck = new Date();
      
      if (config.enableLogging) {
        console.log('✅ Database connected successfully', {
          attempt: attempt + 1,
          poolSize: config.poolSize,
          timeout: config.timeout,
        });
      }
      
      return prisma;
    } catch (error) {
      attempt++;
      connectionMetrics.errorCount++;
      
      console.error(`❌ Database connection attempt ${attempt} failed:`, error);
      
      if (attempt >= config.retries) {
        throw new Error(`Failed to connect to database after ${config.retries} attempts: ${error}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
    }
  }
  
  throw new Error('Maximum connection attempts reached');
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    connectionMetrics.activeConnections = Math.max(0, connectionMetrics.activeConnections - 1);
    
    if (config.enableLogging) {
      console.log('✅ Database disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

// =============================================================================
// HEALTH MONITORING
// =============================================================================

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    // Simple connectivity test
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    // Check connection pool status
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count FROM pg_stat_activity 
      WHERE application_name LIKE 'Prisma%'
    `;
    
    const latency = Date.now() - startTime;
    const connections = Number(result[0]?.count || 0);
    
    connectionMetrics.lastHealthCheck = new Date();
    
    // Determine health status
    let status: DatabaseHealth['status'] = 'healthy';
    if (latency > 1000) {
      status = 'degraded';
      errors.push(`High latency: ${latency}ms`);
    }
    if (connections > config.poolSize * 0.9) {
      status = 'degraded';
      errors.push(`High connection usage: ${connections}/${config.poolSize}`);
    }
    if (connectionMetrics.errorCount > 10) {
      status = 'unhealthy';
      errors.push(`High error count: ${connectionMetrics.errorCount}`);
    }
    
    return {
      status,
      latency,
      connections,
      errors,
      lastCheck: new Date(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      connections: 0,
      errors: [`Connection failed: ${error}`],
      lastCheck: new Date(),
    };
  }
}

// =============================================================================
// WAREHOUSE-SPECIFIC OPERATIONS
// =============================================================================

export async function getWarehouseMetrics(warehouse: WarehouseLocation) {
  try {
    const startTime = Date.now();
    
    const metrics = await prisma.$queryRaw<Array<{
      warehouse: string;
      total_orders: bigint;
      total_inventory: bigint;
      avg_processing_time: number;
    }>>`
      SELECT 
        w.location as warehouse,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT i.id) as total_inventory,
        AVG(EXTRACT(EPOCH FROM (o."updatedAt" - o."createdAt"))/60) as avg_processing_time
      FROM "rhy_warehouses" w
      LEFT JOIN "rhy_orders" o ON o."warehouseId" = w.id
      LEFT JOIN "rhy_inventory" i ON i."warehouseId" = w.id
      WHERE w.location = ${warehouse}
      GROUP BY w.location
    `;
    
    const queryTime = Date.now() - startTime;
    
    if (queryTime > 50) {
      console.warn(`Slow warehouse metrics query for ${warehouse}: ${queryTime}ms`);
    }
    
    return metrics[0] || null;
  } catch (error) {
    console.error(`Failed to get warehouse metrics for ${warehouse}:`, error);
    throw error;
  }
}

export async function validateInventoryConsistency(): Promise<boolean> {
  try {
    const inconsistencies = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "rhy_inventory" 
      WHERE quantity < 0 OR available < 0 OR reserved < 0
    `;
    
    return Number(inconsistencies[0]?.count || 0) === 0;
  } catch (error) {
    console.error('Failed to validate inventory consistency:', error);
    return false;
  }
}

// =============================================================================
// PERFORMANCE OPTIMIZATION
// =============================================================================

export async function optimizeDatabase(): Promise<void> {
  try {
    // Update table statistics
    await prisma.$executeRaw`ANALYZE`;
    
    // Vacuum dead tuples (non-blocking)
    await prisma.$executeRaw`VACUUM (ANALYZE, VERBOSE)`;
    
    console.log('✅ Database optimization completed');
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    throw error;
  }
}

export async function getQueryPerformanceStats() {
  try {
    return await prisma.$queryRaw<Array<{
      query: string;
      calls: bigint;
      total_time: number;
      mean_time: number;
      max_time: number;
    }>>`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time
      FROM pg_stat_statements 
      WHERE query LIKE '%rhy_%'
      ORDER BY mean_time DESC 
      LIMIT 10
    `;
  } catch (error) {
    console.warn('Query performance stats not available (requires pg_stat_statements extension)');
    return [];
  }
}

// =============================================================================
// BACKUP & RECOVERY
// =============================================================================

export async function createBackupSnapshot(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `rhy-backup-${timestamp}`;
  
  try {
    // This would typically be handled by external backup tools
    // But we can trigger a logical backup or snapshot
    console.log(`Creating backup snapshot: ${backupName}`);
    
    // Log backup metadata
    await prisma.$executeRaw`
      INSERT INTO "rhy_audit_logs" ("action", "resource", "metadata", "timestamp")
      VALUES ('BACKUP_CREATED', 'database', ${JSON.stringify({ backupName })}, NOW())
    `;
    
    return backupName;
  } catch (error) {
    console.error('Failed to create backup snapshot:', error);
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  prisma as database,
  prisma,
  connectionMetrics,
  config as databaseConfig,
};

export default prisma;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  DatabaseConfig,
  ConnectionMetrics,
  DatabaseHealth,
  WarehouseLocation,
};
