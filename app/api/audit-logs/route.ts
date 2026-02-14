import { NextResponse } from 'next/server';
import { sql, ensureDatabaseInitialized } from '../../../lib/api/db';
import type { AuditLog } from '../../../lib/api/types';

// GET /api/audit-logs - Get audit logs, optionally filtered by patientId
export async function GET(request: Request) {
  // Ensure database is initialized before handling requests
  try {
    const initTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), 5000);
    });
    await Promise.race([ensureDatabaseInitialized(), initTimeout]);
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      error: 'Database initialization failed',
      details: String(error),
      message: 'Please check your database connection and try again'
    }, { status: 500 });
  }

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

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
