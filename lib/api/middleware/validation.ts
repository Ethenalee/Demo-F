/**
 * Request validation middleware
 * Validates request data using Zod schemas
 */

import { NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return {
        success: false,
        error: new ValidationError('Validation failed', details),
      };
    }
    return {
      success: false,
      error: new ValidationError('Invalid request data'),
    };
  }
}

export function createValidationHandler<T>(schema: ZodSchema<T>) {
  return (data: unknown): T => {
    const result = validateRequest(schema, data);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  };
}
