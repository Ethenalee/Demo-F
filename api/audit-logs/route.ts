import { sql } from '../db';
import type { AuditLog } from '../types';

// GET /api/audit-logs - Get audit logs, optionally filtered by patientId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

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

    const auditLogs: AuditLog[] = result.rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      action: row.action,
      fieldName: row.field_name || undefined,
      oldValue: row.old_value || undefined,
      newValue: row.new_value || undefined,
      performedBy: row.performed_by,
      performedAt: row.performed_at,
      notes: row.notes || undefined,
    }));

    return Response.json(auditLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return Response.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
