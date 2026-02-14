import { NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '../../../../lib/api/db';
import { PatientService } from '../../../../lib/api/services/patient.service';
import { PatientIdParamsSchema, PatientUpdateSchema } from '../../../../lib/api/schemas/patient.schema';
import { createValidationHandler } from '../../../../lib/api/middleware/validation';
import { AppError } from '../../../../lib/api/utils/errors';
import { logger } from '../../../../lib/api/utils/logger';

// Initialize service
const patientService = new PatientService();

// Validation handlers
const validatePatientId = createValidationHandler(PatientIdParamsSchema);
const validatePatientUpdate = createValidationHandler(PatientUpdateSchema);

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
 * GET /api/patients/[id] - Get a single patient
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRequest(async () => {
    // Validate and extract patient ID
    const { id } = await params;
    const validatedParams = validatePatientId({ id });

    // Fetch patient using service
    const patient = await patientService.getPatientById(validatedParams.id);

    return patient;
  });
}

/**
 * PATCH /api/patients/[id] - Update a patient
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRequest(async () => {
    // Validate and extract patient ID
    const { id } = await params;
    const validatedParams = validatePatientId({ id });

    // Parse and validate request body
    const rawData = await request.json();
    const data = validatePatientUpdate(rawData);

    // Update patient using service
    const patient = await patientService.updatePatient(validatedParams.id, data);

    return patient;
  });
}

/**
 * DELETE /api/patients/[id] - Delete a patient
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRequest(async () => {
    // Validate and extract patient ID
    const { id } = await params;
    const validatedParams = validatePatientId({ id });

    // Delete patient using service
    await patientService.deletePatient(validatedParams.id);

    return { success: true };
  });
}
