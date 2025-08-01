// RHY Audit Service - Enterprise audit logging service
// Provides comprehensive audit logging for compliance and security

export interface AuditLogEntry {
  action: string;
  resource: string;
  userId: string;
  userType: 'SUPPLIER' | 'ADMIN' | 'SYSTEM';
  warehouse?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export class AuditService {
  async log(entry: AuditLogEntry): Promise<void> {
    // Production implementation would write to secure audit log
    console.log('AUDIT:', {
      ...entry,
      timestamp: entry.timestamp || new Date()
    });
  }
}

export const auditService = new AuditService();