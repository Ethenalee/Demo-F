import { NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '../../../lib/api/db';
import { AuditLogService } from '../../../lib/api/services/audit-log.service';
import { AuditLogQueryParamsSchema } from '../../../lib/api/schemas/patient.schema';
import { createValidationHandler } from '../../../lib/api/middleware/validation';
import { AppError } from '../../../lib/api/utils/errors';
import { logger } from '../../../lib/api/utils/logger';

// Initialize service
const auditLogService = new AuditLogService();

// Validation handlers
const validateQueryParams = createValidationHandler(AuditLogQueryParamsSchema);

/**
 * Error handler wrapper
 */
async function handleRequest<T>(
  handler: () => Promise<T>
): Promise<NextResponse<T | { error: string; details?: string; code?: string }>> {
  try {
    // Ensure database is initialized
    const initTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), 5000);
    });
    await Promise.race([ensureDatabaseInitialized(), initTimeout]);
  } catch (error) {
    logger.error('Database initialization error', error);
    return NextResponse.json(
      {
        error: 'Database initialization failed',
        details: String(error),
        message: 'Please check your database connection and try again',
      },
      { status: 500 }
    );
  }

  try {
    const result = await handler();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      logger.error('Application error', error, { statusCode: error.statusCode });
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    logger.error('Unexpected error', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit-logs - Get audit logs, optionally filtered by patientId
 */
export async function GET(request: Request) {
  return handleRequest(async () => {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    // Validate query parameters if patientId is provided
    if (patientId) {
      validateQueryParams({ patientId });
    }

    // Fetch audit logs using service
    const auditLogs = await auditLogService.getAuditLogs(patientId || undefined);

    return auditLogs;
  });
}
