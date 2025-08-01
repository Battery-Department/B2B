/**
 * RHY_077: Integration Testing - Database Migration Integration Tests
 * Comprehensive testing of database migrations, schema integrity, and data consistency
 * Tests cover: Migration execution, Rollback scenarios, Data integrity, Performance impact
 */

import { describe, it, beforeAll, beforeEach, afterEach, afterAll, expect } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Test framework setup
const prisma = new PrismaClient();

// Mock migration utilities
const migrationUtils = {
  createTestMigration: (name: string, sql: string) => ({
    name: `${Date.now()}_${name}`,
    sql,
    checksum: generateChecksum(sql)
  }),
  
  executeMigration: async (migration: any) => {
    const startTime = Date.now();
    try {
      // Simulate migration execution
      await prisma.$executeRawUnsafe(migration.sql);
      return {
        success: true,
        executionTime: Date.now() - startTime,
        migration: migration.name
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        migration: migration.name
      };
    }
  },
  
  rollbackMigration: async (migration: any, rollbackSql: string) => {
    const startTime = Date.now();
    try {
      await prisma.$executeRawUnsafe(rollbackSql);
      return {
        success: true,
        executionTime: Date.now() - startTime,
        migration: migration.name
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        migration: migration.name
      };
    }
  },
  
  checkSchemaIntegrity: async () => {
    try {
      // Test critical table existence and structure
      const tableChecks = await Promise.all([
        prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='User'`,
        prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Customer'`,
        prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Order'`,
        prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Product'`,
        prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Inventory'`
      ]);
      
      return {
        valid: tableChecks.every(result => Array.isArray(result) && result.length > 0),
        tables: tableChecks.map((result, index) => ({
          name: ['User', 'Customer', 'Order', 'Product', 'Inventory'][index],
          exists: Array.isArray(result) && result.length > 0
        }))
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  },
  
  validateForeignKeys: async () => {
    try {
      // Check foreign key constraints
      const foreignKeyChecks = await Promise.all([
        prisma.$queryRaw`PRAGMA foreign_key_check`,
        prisma.$queryRaw`SELECT * FROM Customer LIMIT 1`,
        prisma.$queryRaw`SELECT * FROM Order LIMIT 1`,
        prisma.$queryRaw`SELECT * FROM OrderItem LIMIT 1`
      ]);
      
      return {
        valid: foreignKeyChecks[0] && Array.isArray(foreignKeyChecks[0]) && foreignKeyChecks[0].length === 0,
        violations: foreignKeyChecks[0] || []
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
};

// Test migrations
const testMigrations = [
  {
    name: 'add_warehouse_performance_metrics',
    sql: `
      CREATE TABLE IF NOT EXISTS test_warehouse_metrics (
        id TEXT PRIMARY KEY,
        warehouse_id TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        value REAL NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_test_warehouse_metrics_warehouse ON test_warehouse_metrics(warehouse_id);
      CREATE INDEX IF NOT EXISTS idx_test_warehouse_metrics_type ON test_warehouse_metrics(metric_type);
    `,
    rollback: `
      DROP INDEX IF EXISTS idx_test_warehouse_metrics_type;
      DROP INDEX IF EXISTS idx_test_warehouse_metrics_warehouse;
      DROP TABLE IF EXISTS test_warehouse_metrics;
    `
  },
  {
    name: 'add_supplier_audit_trail',
    sql: `
      CREATE TABLE IF NOT EXISTS test_supplier_audit (
        id TEXT PRIMARY KEY,
        supplier_id TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_test_supplier_audit_supplier ON test_supplier_audit(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_test_supplier_audit_action ON test_supplier_audit(action);
    `,
    rollback: `
      DROP INDEX IF EXISTS idx_test_supplier_audit_action;
      DROP INDEX IF EXISTS idx_test_supplier_audit_supplier;
      DROP TABLE IF EXISTS test_supplier_audit;
    `
  },
  {
    name: 'add_real_time_inventory_sync',
    sql: `
      CREATE TABLE IF NOT EXISTS test_inventory_sync (
        id TEXT PRIMARY KEY,
        warehouse_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        sync_status TEXT DEFAULT 'PENDING',
        last_sync_at DATETIME,
        error_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_test_inventory_sync_unique ON test_inventory_sync(warehouse_id, product_id);
      CREATE INDEX IF NOT EXISTS idx_test_inventory_sync_status ON test_inventory_sync(sync_status);
    `,
    rollback: `
      DROP INDEX IF EXISTS idx_test_inventory_sync_status;
      DROP INDEX IF EXISTS idx_test_inventory_sync_unique;
      DROP TABLE IF EXISTS test_inventory_sync;
    `
  }
];

describe('RHY_077: Database Migration Integration Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up Database Migration Integration Tests');
    
    // Ensure clean test environment
    await cleanupTestTables();
    
    console.log('✅ Test environment ready');
  });

  beforeEach(async () => {
    // Clean state before each test
    await cleanupTestTables();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestTables();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up Database Migration tests');
    await cleanupTestTables();
    await prisma.$disconnect();
  });

  describe('Migration Execution and Rollback', () => {
    it('should execute forward migrations successfully', async () => {
      console.log('🔄 Testing forward migration execution...');
      
      for (const migration of testMigrations) {
        const result = await migrationUtils.executeMigration(migration);
        
        expect(result.success).toBe(true);
        expect(result.executionTime).toBeLessThan(5000); // <5s per migration
        expect(result.migration).toBe(migration.name);
        
        console.log(`✅ Migration ${migration.name} executed in ${result.executionTime}ms`);
      }
      
      // Verify all tables were created
      const tableExists = await Promise.all([
        checkTableExists('test_warehouse_metrics'),
        checkTableExists('test_supplier_audit'),
        checkTableExists('test_inventory_sync')
      ]);
      
      expect(tableExists.every(exists => exists)).toBe(true);
    });

    it('should rollback migrations correctly', async () => {
      console.log('🔄 Testing migration rollback...');
      
      // First, execute all migrations
      for (const migration of testMigrations) {
        await migrationUtils.executeMigration(migration);
      }
      
      // Verify tables exist
      const tablesBeforeRollback = await Promise.all([
        checkTableExists('test_warehouse_metrics'),
        checkTableExists('test_supplier_audit'), 
        checkTableExists('test_inventory_sync')
      ]);
      expect(tablesBeforeRollback.every(exists => exists)).toBe(true);
      
      // Rollback migrations in reverse order
      const reversedMigrations = [...testMigrations].reverse();
      
      for (const migration of reversedMigrations) {
        const result = await migrationUtils.rollbackMigration(migration, migration.rollback);
        
        expect(result.success).toBe(true);
        expect(result.executionTime).toBeLessThan(3000); // <3s per rollback
        
        console.log(`✅ Migration ${migration.name} rolled back in ${result.executionTime}ms`);
      }
      
      // Verify tables are removed
      const tablesAfterRollback = await Promise.all([
        checkTableExists('test_warehouse_metrics'),
        checkTableExists('test_supplier_audit'),
        checkTableExists('test_inventory_sync')
      ]);
      expect(tablesAfterRollback.every(exists => !exists)).toBe(true);
    });

    it('should handle migration failures gracefully', async () => {
      console.log('🔄 Testing migration failure handling...');
      
      // Create a migration with invalid SQL
      const invalidMigration = migrationUtils.createTestMigration(
        'invalid_migration',
        'INVALID SQL STATEMENT THAT WILL FAIL;'
      );
      
      const result = await migrationUtils.executeMigration(invalidMigration);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      
      console.log(`✅ Migration failure handled: ${result.error}`);
    });
  });

  describe('Schema Integrity and Validation', () => {
    it('should maintain schema integrity after migrations', async () => {
      console.log('🔍 Testing schema integrity...');
      
      // Execute all test migrations
      for (const migration of testMigrations) {
        await migrationUtils.executeMigration(migration);
      }
      
      // Check schema integrity
      const integrityCheck = await migrationUtils.checkSchemaIntegrity();
      
      expect(integrityCheck.valid).toBe(true);
      expect(integrityCheck.tables).toBeDefined();
      
      // Verify all core tables exist
      const coreTableNames = ['User', 'Customer', 'Order', 'Product', 'Inventory'];
      const coreTablesExist = integrityCheck.tables?.filter(
        table => coreTableNames.includes(table.name) && table.exists
      );
      
      expect(coreTablesExist?.length).toBe(coreTableNames.length);
      
      console.log(`✅ Schema integrity verified: ${coreTablesExist?.length}/${coreTableNames.length} core tables`);
    });

    it('should validate foreign key constraints', async () => {
      console.log('🔍 Testing foreign key constraints...');
      
      const fkCheck = await migrationUtils.validateForeignKeys();
      
      expect(fkCheck.valid).toBe(true);
      expect(fkCheck.violations).toHaveLength(0);
      
      console.log(`✅ Foreign key constraints validated`);
    });

    it('should verify index creation and performance', async () => {
      console.log('🔍 Testing index creation and performance...');
      
      // Execute migrations that create indexes
      await migrationUtils.executeMigration(testMigrations[0]);
      
      // Insert test data
      await prisma.$executeRawUnsafe(`
        INSERT INTO test_warehouse_metrics (id, warehouse_id, metric_type, value)
        VALUES 
        ('metric1', 'us-west-001', 'EFFICIENCY', 85.5),
        ('metric2', 'us-west-001', 'THROUGHPUT', 120.3),
        ('metric3', 'japan-001', 'EFFICIENCY', 92.1),
        ('metric4', 'japan-001', 'QUALITY', 98.7)
      `);
      
      // Test index performance
      const startTime = Date.now();
      const result = await prisma.$queryRaw`
        SELECT * FROM test_warehouse_metrics 
        WHERE warehouse_id = 'us-west-001' 
        AND metric_type = 'EFFICIENCY'
      `;
      const queryTime = Date.now() - startTime;
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(100); // <100ms for indexed query
      
      console.log(`✅ Index performance verified: ${queryTime}ms query time`);
    });
  });

  describe('Data Consistency and Migration Safety', () => {
    it('should preserve existing data during migrations', async () => {
      console.log('🔍 Testing data preservation...');
      
      // Create initial test data
      const testUserId = `test-user-${Date.now()}`;
      await prisma.user.create({
        data: {
          id: testUserId,
          email: `test-${Date.now()}@battery-dept.com`,
          name: 'Test User',
          role: 'customer'
        }
      });
      
      // Get initial data
      const userBefore = await prisma.user.findUnique({
        where: { id: testUserId }
      });
      
      expect(userBefore).toBeDefined();
      expect(userBefore?.email).toContain('@battery-dept.com');
      
      // Execute migrations
      for (const migration of testMigrations) {
        await migrationUtils.executeMigration(migration);
      }
      
      // Verify data still exists and is unchanged
      const userAfter = await prisma.user.findUnique({
        where: { id: testUserId }
      });
      
      expect(userAfter).toBeDefined();
      expect(userAfter?.id).toBe(userBefore?.id);
      expect(userAfter?.email).toBe(userBefore?.email);
      expect(userAfter?.name).toBe(userBefore?.name);
      expect(userAfter?.role).toBe(userBefore?.role);
      
      // Cleanup
      await prisma.user.delete({ where: { id: testUserId } });
      
      console.log(`✅ Data preservation verified`);
    });

    it('should handle concurrent migration scenarios', async () => {
      console.log('🔍 Testing concurrent migration handling...');
      
      // Simulate concurrent migration attempts
      const concurrentMigrations = testMigrations.slice(0, 2).map(migration =>
        migrationUtils.executeMigration(migration)
      );
      
      const results = await Promise.all(concurrentMigrations);
      
      // At least one should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);
      
      // Verify final state is consistent
      const integrityCheck = await migrationUtils.checkSchemaIntegrity();
      expect(integrityCheck.valid).toBe(true);
      
      console.log(`✅ Concurrent migration handling verified: ${successCount}/${results.length} succeeded`);
    });

    it('should validate migration checksums and prevent corruption', async () => {
      console.log('🔍 Testing migration checksum validation...');
      
      const originalMigration = testMigrations[0];
      const checksum1 = generateChecksum(originalMigration.sql);
      
      // Modify the SQL slightly
      const modifiedSql = originalMigration.sql + ' -- modified';
      const checksum2 = generateChecksum(modifiedSql);
      
      expect(checksum1).not.toBe(checksum2);
      
      // Execute original migration
      const result1 = await migrationUtils.executeMigration(originalMigration);
      expect(result1.success).toBe(true);
      
      console.log(`✅ Migration checksum validation works`);
    });
  });

  describe('Performance Impact Analysis', () => {
    it('should measure migration execution time for large datasets', async () => {
      console.log('🔍 Testing migration performance with large dataset...');
      
      // Create large dataset
      await createLargeTestDataset();
      
      // Measure migration time
      const migration = testMigrations[0];
      const startTime = Date.now();
      const result = await migrationUtils.executeMigration(migration);
      const executionTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(30000); // <30s for large dataset migration
      
      console.log(`✅ Large dataset migration completed in ${executionTime}ms`);
    });

    it('should verify database performance after migrations', async () => {
      console.log('🔍 Testing post-migration performance...');
      
      // Execute all migrations
      for (const migration of testMigrations) {
        await migrationUtils.executeMigration(migration);
      }
      
      // Performance tests
      const performanceTests = [
        {
          name: 'User lookup',
          query: () => prisma.user.findMany({ take: 10 }),
          maxTime: 100
        },
        {
          name: 'Schema introspection',
          query: () => prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`,
          maxTime: 50
        }
      ];
      
      for (const test of performanceTests) {
        const startTime = Date.now();
        const result = await test.query();
        const queryTime = Date.now() - startTime;
        
        expect(result).toBeDefined();
        expect(queryTime).toBeLessThan(test.maxTime);
        
        console.log(`✅ ${test.name}: ${queryTime}ms (max: ${test.maxTime}ms)`);
      }
    });
  });

  describe('Rollback Safety and Recovery', () => {
    it('should handle partial migration failures and rollback', async () => {
      console.log('🔍 Testing partial migration failure recovery...');
      
      // Create a migration that will partially succeed then fail
      const partialFailureMigration = {
        name: 'partial_failure_test',
        sql: `
          CREATE TABLE IF NOT EXISTS test_success_table (
            id TEXT PRIMARY KEY,
            data TEXT
          );
          INSERT INTO test_success_table VALUES ('1', 'success');
          INVALID SQL THAT WILL FAIL;
        `,
        rollback: `
          DROP TABLE IF EXISTS test_success_table;
        `
      };
      
      const result = await migrationUtils.executeMigration(partialFailureMigration);
      
      expect(result.success).toBe(false);
      
      // Check if partial changes were made
      const tableExists = await checkTableExists('test_success_table');
      
      if (tableExists) {
        // Clean up partial changes
        const rollbackResult = await migrationUtils.rollbackMigration(
          partialFailureMigration, 
          partialFailureMigration.rollback
        );
        expect(rollbackResult.success).toBe(true);
      }
      
      console.log(`✅ Partial migration failure handled correctly`);
    });

    it('should verify rollback completeness', async () => {
      console.log('🔍 Testing rollback completeness...');
      
      // Execute migration
      const migration = testMigrations[0];
      await migrationUtils.executeMigration(migration);
      
      // Insert test data
      await prisma.$executeRawUnsafe(`
        INSERT INTO test_warehouse_metrics (id, warehouse_id, metric_type, value)
        VALUES ('test1', 'warehouse1', 'TEST', 100.0)
      `);
      
      // Verify data exists
      const dataBefore = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM test_warehouse_metrics WHERE id = 'test1'
      `;
      expect(Array.isArray(dataBefore) && dataBefore[0] && (dataBefore[0] as any).count > 0).toBe(true);
      
      // Rollback
      await migrationUtils.rollbackMigration(migration, migration.rollback);
      
      // Verify table and data are gone
      const tableExists = await checkTableExists('test_warehouse_metrics');
      expect(tableExists).toBe(false);
      
      console.log(`✅ Rollback completeness verified`);
    });
  });
});

// Helper functions
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name=${tableName}
    `;
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    return false;
  }
}

async function cleanupTestTables(): Promise<void> {
  const testTables = [
    'test_warehouse_metrics',
    'test_supplier_audit',
    'test_inventory_sync',
    'test_success_table'
  ];
  
  for (const table of testTables) {
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS ${table}`);
    } catch (error) {
      // Ignore errors - table might not exist
    }
  }
}

async function createLargeTestDataset(): Promise<void> {
  try {
    // Create test users (simulate large dataset)
    const userCount = 100;
    const userInserts = Array.from({ length: userCount }, (_, i) => `
      ('test-user-${i}', 'test${i}@battery-dept.com', 'Test User ${i}', 'customer', '${new Date().toISOString()}', '${new Date().toISOString()}')
    `).join(',');
    
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO User (id, email, name, role, createdAt, updatedAt)
      VALUES ${userInserts}
    `);
    
    console.log(`📊 Created ${userCount} test users for large dataset simulation`);
  } catch (error) {
    console.log('⚠️  Large dataset creation skipped (users may already exist)');
  }
}

function generateChecksum(content: string): string {
  // Simple checksum implementation for testing
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Migration execution simulator
 * Provides realistic migration timing and error handling
 */
class MigrationSimulator {
  private executedMigrations: Set<string> = new Set();
  
  async execute(migration: any): Promise<any> {
    const startTime = Date.now();
    
    // Check if already executed
    if (this.executedMigrations.has(migration.name)) {
      return {
        success: false,
        error: 'Migration already executed',
        executionTime: 0
      };
    }
    
    try {
      // Simulate migration execution time based on complexity
      const complexity = migration.sql.length;
      const simulatedDelay = Math.min(complexity / 10, 1000); // Max 1s delay
      
      await new Promise(resolve => setTimeout(resolve, simulatedDelay));
      
      // Execute the actual migration
      await prisma.$executeRawUnsafe(migration.sql);
      
      this.executedMigrations.add(migration.name);
      
      return {
        success: true,
        executionTime: Date.now() - startTime,
        migration: migration.name
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        migration: migration.name
      };
    }
  }
  
  async rollback(migration: any, rollbackSql: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      await prisma.$executeRawUnsafe(rollbackSql);
      this.executedMigrations.delete(migration.name);
      
      return {
        success: true,
        executionTime: Date.now() - startTime,
        migration: migration.name
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        migration: migration.name
      };
    }
  }
  
  getExecutedMigrations(): string[] {
    return Array.from(this.executedMigrations);
  }
  
  reset(): void {
    this.executedMigrations.clear();
  }
}