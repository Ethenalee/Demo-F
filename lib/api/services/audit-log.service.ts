/**
 * Audit Log Service
 * Contains business logic for audit log operations
 */

import { AuditLogRepository } from '../repositories/audit-log.repository';
import type { AuditLog } from '../types';
import { DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AuditLogService {
  private repository: AuditLogRepository;

  constructor() {
    this.repository = new AuditLogRepository();
  }

  /**
   * Get audit logs, optionally filtered by patientId
   */
  async getAuditLogs(patientId?: string): Promise<AuditLog[]> {
    try {
      return await this.repository.findMany(patientId);
    } catch (error) {
      logger.error('Error fetching audit logs', error, { patientId });
      throw new DatabaseError('Failed to fetch audit logs', error);
    }
  }

  /**
   * Create an audit log entry
   */
  async createAuditLog(data: {
    patientId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    performedBy?: string;
    notes?: string;
  }): Promise<AuditLog> {
    try {
      return await this.repository.create(data);
    } catch (error) {
      logger.error('Error creating audit log', error, { data });
      throw new DatabaseError('Failed to create audit log', error);
    }
  }
}
