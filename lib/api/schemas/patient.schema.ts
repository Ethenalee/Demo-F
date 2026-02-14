/**
 * Zod validation schemas for Patient API
 * Provides runtime type safety and validation
 */

import { z } from 'zod';

export const PatientStatusSchema = z.enum(['Inquiry', 'Onboarding', 'Active', 'Churned']);

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(255),
  city: z.string().min(1, 'City is required').max(255),
  state: z.string().min(1, 'State is required').max(100),
  zipCode: z.string().min(1, 'ZIP/Postal code is required').max(20),
  country: z.string().min(1, 'Country is required').max(100).default('USA'),
});

export const PatientFormDataSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(255),
  middleName: z.string().max(255).optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').max(255),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  status: PatientStatusSchema,
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  address: AddressSchema,
});

export const PatientUpdateSchema = PatientFormDataSchema.partial();

export const PatientQueryParamsSchema = z.object({
  search: z.string().optional().default(''),
  status: z.enum(['ALL', 'Inquiry', 'Onboarding', 'Active', 'Churned']).optional().default('ALL'),
  sortField: z.enum(['name', 'status', 'dateOfBirth', 'createdAt']).optional().default('name'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const PatientIdParamsSchema = z.object({
  id: z.string().uuid('Invalid patient ID format'),
});

export const AuditLogQueryParamsSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format').optional(),
});

// Type exports for use in API routes
export type PatientFormDataInput = z.infer<typeof PatientFormDataSchema>;
export type PatientUpdateInput = z.infer<typeof PatientUpdateSchema>;
export type PatientQueryParams = z.infer<typeof PatientQueryParamsSchema>;
export type PatientIdParams = z.infer<typeof PatientIdParamsSchema>;
export type AuditLogQueryParams = z.infer<typeof AuditLogQueryParamsSchema>;
