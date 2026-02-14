import { NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '../../../lib/api/db';
import { PatientService } from '../../../lib/api/services/patient.service';
import { PatientQueryParamsSchema, PatientFormDataSchema, type PatientFormDataInput } from '../../../lib/api/schemas/patient.schema';
import { createValidationHandler } from '../../../lib/api/middleware/validation';
import { AppError, ValidationError } from '../../../lib/api/utils/errors';
import { logger } from '../../../lib/api/utils/logger';
import type { PatientFormData } from '../../../lib/api/types';

// Initialize service
const patientService = new PatientService();

// Validation handlers
const validateQueryParams = createValidationHandler(PatientQueryParamsSchema);
const validatePatientData = createValidationHandler(PatientFormDataSchema);

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
 * GET /api/patients - List patients with filtering, sorting, and pagination
 */
export async function GET(request: Request) {
  return handleRequest(async () => {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = validateQueryParams({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'ALL',
      sortField: searchParams.get('sortField') || 'name',
      sortDirection: searchParams.get('sortDirection') || 'asc',
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '10',
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    });

    // Fetch patients using service
    const result = await patientService.listPatients(
      {
        searchQuery: queryParams.search || null,
        status: queryParams.status === 'ALL' ? null : queryParams.status,
        dateFrom: queryParams.dateFrom || null,
        dateTo: queryParams.dateTo || null,
      },
      {
        sortField: queryParams.sortField,
        sortDirection: queryParams.sortDirection,
        page: queryParams.page,
        pageSize: queryParams.pageSize,
      }
    );

    return {
      patients: result.patients,
      pagination: {
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        totalCount: result.totalCount,
      },
    };
  });
}

/**
 * POST /api/patients - Create a new patient
 */
export async function POST(request: Request) {
  return handleRequest(async () => {
    // Parse and validate request body
    const rawData = await request.json();
    const data = validatePatientData(rawData);

    // Create patient using service
    // Convert optional fields to match PatientFormData type
    const patientData: PatientFormData = {
      ...data,
      middleName: data.middleName || '',
      email: data.email || '',
      phone: data.phone || '',
    };
    const patient = await patientService.createPatient(patientData);

    return patient;
  });
}
