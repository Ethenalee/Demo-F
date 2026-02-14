/**
 * Audit Log Repository
 * Abstracts database operations for audit logs
 */

import { sql } from '@vercel/postgres';
import type { AuditLog } from '../types';

export class AuditLogRepository {
  /**
   * Map database row to AuditLog entity
   */
  private mapRowToAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      patientId: row.patient_id,
      action: row.action,
      fieldName: row.field_name || undefined,
      oldValue: row.old_value || undefined,
      newValue: row.new_value || undefined,
      performedBy: row.performed_by,
      performedAt: row.performed_at,
      notes: row.notes || undefined,
    };
  }

  /**
   * Find audit logs, optionally filtered by patientId
   */
  async findMany(patientId?: string): Promise<AuditLog[]> {
    let result;
    if (patientId) {
      result = await sql`
        SELECT
          id,
          patient_id,
          action,
          field_name,
          old_value,
          new_value,
          performed_by,
          performed_at,
          notes
        FROM audit_logs
        WHERE patient_id = ${patientId}
        ORDER BY performed_at DESC
      `;
    } else {
      result = await sql`
        SELECT
          id,
          patient_id,
          action,
          field_name,
          old_value,
          new_value,
          performed_by,
          performed_at,
          notes
        FROM audit_logs
        ORDER BY performed_at DESC
      `;
    }

    return result.rows.map((row) => this.mapRowToAuditLog(row));
  }

  /**
   * Create an audit log entry
   */
  async create(data: {
    patientId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    performedBy?: string;
    notes?: string;
  }): Promise<AuditLog> {
    const result = await sql`
      INSERT INTO audit_logs (
        patient_id,
        action,
        field_name,
        old_value,
        new_value,
        performed_by,
        notes
      ) VALUES (
        ${data.patientId},
        ${data.action},
        ${data.fieldName || null},
        ${data.oldValue || null},
        ${data.newValue || null},
        ${data.performedBy || 'System'},
        ${data.notes || null}
      )
      RETURNING *
    `;

    return this.mapRowToAuditLog(result.rows[0]);
  }
}
