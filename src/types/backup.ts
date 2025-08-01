/**
 * RHY Supplier Portal - Backup & Recovery Type Definitions
 * Enterprise-grade backup system types for multi-warehouse operations
 */

// =============================================================================
// BACKUP CONFIGURATION TYPES
// =============================================================================

export interface BackupConfig {
  /** Type of backup to create */
  type: 'full' | 'schema' | 'data-only' | 'incremental';
  
  /** Enable compression (default: true) */
  compression?: boolean;
  
  /** Compression level 1-9 (default: 6) */
  compressionLevel?: number;
  
  /** Enable encryption (default: from environment) */
  encryption?: boolean;
  
  /** Backup retention period in days */
  retention?: number;
  
  /** Include specific schemas only */
  schemas?: string[];
  
  /** Exclude specific tables */
  excludeTables?: string[];
  
  /** Maximum backup size in bytes */
  maxSize?: number;
  
  /** Backup description/notes */
  description?: string;
  
  /** Tags for backup organization */
  tags?: string[];
  
  /** Warehouse-specific backup options */
  warehouseOptions?: WarehouseBackupOptions;
}

export interface WarehouseBackupOptions {
  /** Include only specific warehouse data */
  warehouseIds?: string[];
  
  /** Cross-warehouse consistency check */
  consistencyCheck?: boolean;
  
  /** Regional compliance requirements */
  complianceFlags?: {
    gdpr?: boolean;
    ccpa?: boolean;
    hipaa?: boolean;
  };
  
  /** Multi-region sync validation */
  syncValidation?: boolean;
}

// =============================================================================
// BACKUP STATUS & PROGRESS TYPES
// =============================================================================

export interface BackupStatus {
  /** Unique backup identifier */
  id: string;
  
  /** Current backup status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  /** Backup type */
  type: 'full' | 'schema' | 'data-only' | 'incremental' | 'restore';
  
  /** Backup start time */
  startTime: Date;
  
  /** Backup end time (if completed) */
  endTime?: Date;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Current operation description */
  currentOperation?: string;
  
  /** Generated backup filename */
  filename?: string;
  
  /** Backup file size in bytes */
  size?: number;
  
  /** Error message if failed */
  error?: string;
  
  /** Backup metadata */
  metadata?: BackupMetadata;
  
  /** Performance metrics */
  metrics?: BackupMetrics;
}

export interface BackupMetrics {
  /** Total records processed */
  recordsProcessed?: number;
  
  /** Processing rate (records/second) */
  processingRate?: number;
  
  /** Compression ratio */
  compressionRatio?: number;
  
  /** Network transfer rate (bytes/second) */
  transferRate?: number;
  
  /** Database locks held */
  locksHeld?: number;
  
  /** Memory usage (bytes) */
  memoryUsage?: number;
  
  /** Disk I/O operations */
  diskOps?: number;
}

// =============================================================================
// BACKUP METADATA TYPES
// =============================================================================

export interface BackupMetadata {
  /** Backup format version */
  version: string;
  
  /** Source database name */
  database: string;
  
  /** Backup creation timestamp */
  timestamp: string;
  
  /** Backup file size */
  size: number;
  
  /** File checksum (SHA-256) */
  checksum: string;
  
  /** Compression enabled */
  compressionEnabled: boolean;
  
  /** Encryption enabled */
  encryptionEnabled: boolean;
  
  /** Retention period in days */
  retentionDays: number;
  
  /** Database schema version */
  schemaVersion?: string;
  
  /** Table statistics */
  tableStats?: Array<{
    name: string;
    rowCount: number;
    sizeBytes: number;
  }>;
  
  /** System information */
  systemInfo: {
    nodeVersion: string;
    platform: string;
    hostname: string;
    postgresVersion?: string;
    prismaVersion?: string;
  };
  
  /** Warehouse-specific metadata */
  warehouseMetadata?: WarehouseMetadata;
  
  /** Compliance certifications */
  compliance?: ComplianceMetadata;
}

export interface WarehouseMetadata {
  /** Warehouses included in backup */
  warehouses: Array<{
    id: string;
    location: string;
    recordCount: number;
    lastSync: string;
  }>;
  
  /** Cross-warehouse consistency hash */
  consistencyHash: string;
  
  /** Regional data residency info */
  dataResidency: Record<string, string>;
}

export interface ComplianceMetadata {
  /** GDPR compliance flags */
  gdpr?: {
    dataSubjects: number;
    consentRecords: number;
    rightToErasure: boolean;
  };
  
  /** Data classification levels */
  dataClassification: {
    public: number;
    internal: number;
    confidential: number;
    restricted: number;
  };
  
  /** Audit trail references */
  auditTrail: {
    createdBy: string;
    approvedBy?: string;
    retentionClass: string;
  };
}

// =============================================================================
// RESTORE CONFIGURATION TYPES
// =============================================================================

export interface RestoreOptions {
  /** Target database URL (if different from current) */
  targetDatabase?: string;
  
  /** Perform dry run without actual restore */
  dryRun?: boolean;
  
  /** Force restore even with active connections */
  force?: boolean;
  
  /** Skip backup validation */
  skipValidation?: boolean;
  
  /** Skip post-restore validation */
  skipPostValidation?: boolean;
  
  /** Restore timeout in seconds */
  timeout?: number;
  
  /** Restore specific tables only */
  tables?: string[];
  
  /** Restore specific schemas only */
  schemas?: string[];
  
  /** Point-in-time recovery timestamp */
  pointInTime?: Date;
  
  /** Restore to specific warehouse */
  targetWarehouse?: string;
  
  /** Restoration mode */
  mode?: 'full' | 'schema-only' | 'data-only' | 'selective';
  
  /** Post-restore actions */
  postRestoreActions?: PostRestoreAction[];
}

export interface PostRestoreAction {
  /** Action type */
  type: 'reindex' | 'analyze' | 'vacuum' | 'update-sequences' | 'custom-script';
  
  /** Action parameters */
  parameters?: Record<string, any>;
  
  /** Run action asynchronously */
  async?: boolean;
  
  /** Action timeout */
  timeout?: number;
}

// =============================================================================
// BACKUP SCHEDULING TYPES
// =============================================================================

export interface BackupSchedule {
  /** Schedule identifier */
  id: string;
  
  /** Schedule name */
  name: string;
  
  /** Schedule description */
  description?: string;
  
  /** Cron expression for scheduling */
  cronExpression: string;
  
  /** Backup configuration to use */
  backupConfig: BackupConfig;
  
  /** Schedule enabled */
  enabled: boolean;
  
  /** Timezone for schedule */
  timezone: string;
  
  /** Next execution time */
  nextRun?: Date;
  
  /** Last execution time */
  lastRun?: Date;
  
  /** Last execution status */
  lastStatus?: 'success' | 'failure' | 'skipped';
  
  /** Notification settings */
  notifications?: NotificationConfig;
  
  /** Retry configuration */
  retryConfig?: RetryConfig;
}

export interface NotificationConfig {
  /** Notification channels */
  channels: Array<'email' | 'slack' | 'webhook' | 'sms'>;
  
  /** Notification recipients */
  recipients: string[];
  
  /** Notify on success */
  onSuccess?: boolean;
  
  /** Notify on failure */
  onFailure?: boolean;
  
  /** Notify on warnings */
  onWarning?: boolean;
  
  /** Custom webhook URL */
  webhookUrl?: string;
  
  /** Slack webhook configuration */
  slackConfig?: {
    webhookUrl: string;
    channel: string;
    username?: string;
  };
}

export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  
  /** Retry delay in seconds */
  delay: number;
  
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  
  /** Maximum delay between retries */
  maxDelay?: number;
  
  /** Retry on specific error types */
  retryOnErrors?: string[];
}

// =============================================================================
// BACKUP VALIDATION TYPES
// =============================================================================

export interface BackupValidationResult {
  /** Validation passed */
  valid: boolean;
  
  /** Validation errors */
  errors: ValidationError[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
  
  /** Validation metrics */
  metrics: ValidationMetrics;
  
  /** Validation timestamp */
  timestamp: Date;
}

export interface ValidationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Affected component */
  component?: string;
  
  /** Error severity */
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  /** Suggested resolution */
  resolution?: string;
}

export interface ValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Affected component */
  component?: string;
  
  /** Warning category */
  category: 'performance' | 'compatibility' | 'best-practice' | 'security';
}

export interface ValidationMetrics {
  /** Validation duration (ms) */
  duration: number;
  
  /** Files validated */
  filesValidated: number;
  
  /** Records validated */
  recordsValidated: number;
  
  /** Checksum verification time (ms) */
  checksumTime: number;
  
  /** Schema validation time (ms) */
  schemaTime: number;
  
  /** Data integrity checks time (ms) */
  integrityTime: number;
}

// =============================================================================
// RECOVERY POINT OBJECTIVE (RPO) TYPES
// =============================================================================

export interface RecoveryPointObjective {
  /** RPO identifier */
  id: string;
  
  /** Maximum acceptable data loss (minutes) */
  maxDataLoss: number;
  
  /** Backup frequency required */
  backupFrequency: 'continuous' | 'hourly' | 'daily' | 'weekly';
  
  /** Business criticality level */
  criticalityLevel: 'critical' | 'high' | 'medium' | 'low';
  
  /** Associated business processes */
  businessProcesses: string[];
  
  /** Compliance requirements */
  complianceRequirements: string[];
  
  /** Recovery time objective (RTO) */
  recoveryTimeObjective?: number; // minutes
}

// =============================================================================
// DISASTER RECOVERY TYPES
// =============================================================================

export interface DisasterRecoveryPlan {
  /** Plan identifier */
  id: string;
  
  /** Plan name */
  name: string;
  
  /** Plan version */
  version: string;
  
  /** Recovery strategies */
  strategies: RecoveryStrategy[];
  
  /** Emergency contacts */
  emergencyContacts: EmergencyContact[];
  
  /** Recovery procedures */
  procedures: RecoveryProcedure[];
  
  /** Testing schedule */
  testingSchedule: TestingSchedule;
  
  /** Last tested date */
  lastTested?: Date;
  
  /** Plan approval */
  approval: {
    approvedBy: string;
    approvedDate: Date;
    nextReview: Date;
  };
}

export interface RecoveryStrategy {
  /** Strategy name */
  name: string;
  
  /** Recovery scenario */
  scenario: 'hardware-failure' | 'data-corruption' | 'natural-disaster' | 'cyber-attack' | 'human-error';
  
  /** Recovery steps */
  steps: RecoveryStep[];
  
  /** Estimated recovery time */
  estimatedRTO: number; // minutes
  
  /** Maximum data loss */
  maxRPO: number; // minutes
  
  /** Resource requirements */
  resources: string[];
}

export interface RecoveryStep {
  /** Step order */
  order: number;
  
  /** Step description */
  description: string;
  
  /** Responsible role */
  responsibleRole: string;
  
  /** Estimated duration */
  estimatedDuration: number; // minutes
  
  /** Prerequisites */
  prerequisites: string[];
  
  /** Success criteria */
  successCriteria: string[];
  
  /** Rollback procedure */
  rollbackProcedure?: string;
}

export interface EmergencyContact {
  /** Contact name */
  name: string;
  
  /** Role/title */
  role: string;
  
  /** Primary phone */
  primaryPhone: string;
  
  /** Secondary phone */
  secondaryPhone?: string;
  
  /** Email address */
  email: string;
  
  /** Escalation level */
  escalationLevel: number;
  
  /** Available hours */
  availability: '24x7' | 'business-hours' | 'on-call';
}

export interface RecoveryProcedure {
  /** Procedure name */
  name: string;
  
  /** Procedure type */
  type: 'backup' | 'restore' | 'failover' | 'communication' | 'testing';
  
  /** Detailed steps */
  steps: string[];
  
  /** Required tools */
  tools: string[];
  
  /** Dependencies */
  dependencies: string[];
  
  /** Estimated time */
  estimatedTime: number; // minutes
}

export interface TestingSchedule {
  /** Test frequency */
  frequency: 'monthly' | 'quarterly' | 'semi-annually' | 'annually';
  
  /** Test types */
  testTypes: Array<'tabletop' | 'walkthrough' | 'simulation' | 'full-recovery'>;
  
  /** Next test date */
  nextTest: Date;
  
  /** Test participants */
  participants: string[];
  
  /** Success criteria */
  successCriteria: string[];
}

// =============================================================================
// AUDIT & COMPLIANCE TYPES
// =============================================================================

export interface BackupAuditLog {
  /** Log entry ID */
  id: string;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Event type */
  eventType: 'backup-started' | 'backup-completed' | 'backup-failed' | 'restore-started' | 'restore-completed' | 'restore-failed' | 'validation-performed' | 'cleanup-performed';
  
  /** User who initiated the action */
  userId?: string;
  
  /** System component */
  component: string;
  
  /** Resource affected */
  resource: string;
  
  /** Resource ID */
  resourceId?: string;
  
  /** Event details */
  details: Record<string, any>;
  
  /** IP address */
  ipAddress?: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Compliance tags */
  complianceTags?: string[];
}

export interface ComplianceReport {
  /** Report ID */
  id: string;
  
  /** Report type */
  type: 'backup-compliance' | 'retention-compliance' | 'access-audit' | 'data-residency';
  
  /** Reporting period */
  period: {
    start: Date;
    end: Date;
  };
  
  /** Compliance findings */
  findings: ComplianceFinding[];
  
  /** Overall compliance status */
  overallStatus: 'compliant' | 'non-compliant' | 'at-risk';
  
  /** Generated by */
  generatedBy: string;
  
  /** Generation timestamp */
  generatedAt: Date;
  
  /** Report approval */
  approval?: {
    approvedBy: string;
    approvedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export interface ComplianceFinding {
  /** Finding ID */
  id: string;
  
  /** Compliance rule */
  rule: string;
  
  /** Finding severity */
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  /** Finding status */
  status: 'open' | 'in-progress' | 'resolved' | 'accepted-risk';
  
  /** Finding description */
  description: string;
  
  /** Evidence */
  evidence: string[];
  
  /** Recommended actions */
  recommendedActions: string[];
  
  /** Assigned to */
  assignedTo?: string;
  
  /** Due date */
  dueDate?: Date;
  
  /** Resolution notes */
  resolutionNotes?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type BackupOperationType = 'backup' | 'restore' | 'validate' | 'cleanup' | 'schedule';

export type BackupPriority = 'critical' | 'high' | 'normal' | 'low';

export type BackupTrigger = 'manual' | 'scheduled' | 'automatic' | 'event-driven';

export type StorageType = 'local' | 's3' | 'azure-blob' | 'gcs' | 'ftp' | 'sftp';

// =============================================================================
// ERROR TYPES
// =============================================================================

export class BackupError extends Error {
  constructor(
    message: string,
    public code: string,
    public component?: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'BackupError';
  }
}

export class RestoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public component?: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'RestoreError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'critical' | 'high' | 'medium' | 'low' = 'medium',
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}