/**
 * Patient Service
 * Contains business logic for patient operations
 */

import { PatientRepository } from '../repositories/patient.repository';
import { AuditLogService } from './audit-log.service';
import type { Patient, PatientFormData } from '../types';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

export class PatientService {
  private repository: PatientRepository;
  private auditLogService: AuditLogService;

  constructor() {
    this.repository = new PatientRepository();
    this.auditLogService = new AuditLogService();
  }

  /**
   * List patients with filtering, sorting, and pagination
   */
  async listPatients(
    filters: {
      searchQuery?: string | null;
      status?: string | null;
      dateFrom?: string | null;
      dateTo?: string | null;
    },
    options: {
      sortField: string;
      sortDirection: 'asc' | 'desc';
      page: number;
      pageSize: number;
    }
  ) {
    try {
      const result = await this.repository.findMany(filters, options);
      return result;
    } catch (error) {
      logger.error('Error listing patients', error, { filters, options });
      throw new DatabaseError('Failed to fetch patients', error);
    }
  }

  /**
   * Get a single patient by ID
   */
  async getPatientById(id: string): Promise<Patient> {
    try {
      const patient = await this.repository.findById(id);
      if (!patient) {
        throw new NotFoundError('Patient');
      }
      return patient;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching patient', error, { id });
      throw new DatabaseError('Failed to fetch patient', error);
    }
  }

  /**
   * Create a new patient
   */
  async createPatient(data: PatientFormData): Promise<Patient> {
    try {
      const patient = await this.repository.create(data);

      // Create audit log
      try {
        await this.auditLogService.createAuditLog({
          patientId: patient.id,
          action: 'CREATE',
          performedBy: 'System',
          notes: `Created patient ${patient.firstName} ${patient.lastName}`,
        });
      } catch (auditError) {
        // Log but don't fail the request if audit log fails
        logger.warn('Failed to create audit log', { patientId: patient.id, error: auditError });
      }

      return patient;
    } catch (error) {
      logger.error('Error creating patient', error, { data });
      throw new DatabaseError('Failed to create patient', error);
    }
  }

  /**
   * Update a patient
   */
  async updatePatient(id: string, data: Partial<PatientFormData>): Promise<Patient> {
    try {
      // Get current patient for comparison
      const current = await this.repository.getCurrentForComparison(id);
      if (!current) {
        throw new NotFoundError('Patient');
      }

      // Update patient
      const updated = await this.repository.update(id, data);

      // Create audit logs for changed fields
      try {
        const changes: Array<{ field: string; oldValue: any; newValue: any; isStatusChange: boolean }> = [];

        if (data.firstName !== undefined && data.firstName !== current.first_name) {
          changes.push({ field: 'firstName', oldValue: current.first_name, newValue: data.firstName, isStatusChange: false });
        }
        if (data.lastName !== undefined && data.lastName !== current.last_name) {
          changes.push({ field: 'lastName', oldValue: current.last_name, newValue: data.lastName, isStatusChange: false });
        }
        if (data.status !== undefined && data.status !== current.status) {
          changes.push({ field: 'status', oldValue: current.status, newValue: data.status, isStatusChange: true });
        }
        if (data.dateOfBirth !== undefined && data.dateOfBirth !== current.date_of_birth) {
          changes.push({ field: 'dateOfBirth', oldValue: current.date_of_birth, newValue: data.dateOfBirth, isStatusChange: false });
        }
        if (data.email !== undefined && data.email !== current.email) {
          changes.push({ field: 'email', oldValue: current.email, newValue: data.email, isStatusChange: false });
        }
        if (data.phone !== undefined && data.phone !== current.phone) {
          changes.push({ field: 'phone', oldValue: current.phone, newValue: data.phone, isStatusChange: false });
        }
        if (data.address) {
          if (data.address.street !== undefined && data.address.street !== current.address_street) {
            changes.push({ field: 'address.street', oldValue: current.address_street, newValue: data.address.street, isStatusChange: false });
          }
          if (data.address.city !== undefined && data.address.city !== current.address_city) {
            changes.push({ field: 'address.city', oldValue: current.address_city, newValue: data.address.city, isStatusChange: false });
          }
          if (data.address.state !== undefined && data.address.state !== current.address_state) {
            changes.push({ field: 'address.state', oldValue: current.address_state, newValue: data.address.state, isStatusChange: false });
          }
          if (data.address.zipCode !== undefined && data.address.zipCode !== current.address_zip_code) {
            changes.push({ field: 'address.zipCode', oldValue: current.address_zip_code, newValue: data.address.zipCode, isStatusChange: false });
          }
          if (data.address.country !== undefined && data.address.country !== current.address_country) {
            changes.push({ field: 'address.country', oldValue: current.address_country, newValue: data.address.country, isStatusChange: false });
          }
        }

        // Create audit log entries
        for (const change of changes) {
          await this.auditLogService.createAuditLog({
            patientId: id,
            action: change.isStatusChange ? 'STATUS_CHANGE' : 'UPDATE',
            fieldName: change.field,
            oldValue: String(change.oldValue || ''),
            newValue: String(change.newValue || ''),
            performedBy: 'System',
            notes: `Updated ${change.field}`,
          });
        }
      } catch (auditError) {
        logger.warn('Failed to create audit logs', { patientId: id, error: auditError });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating patient', error, { id, data });
      throw new DatabaseError('Failed to update patient', error);
    }
  }

  /**
   * Delete a patient
   */
  async deletePatient(id: string): Promise<void> {
    try {
      // Check if patient exists
      const patient = await this.repository.findById(id);
      if (!patient) {
        throw new NotFoundError('Patient');
      }

      // Create audit log before deletion
      try {
        await this.auditLogService.createAuditLog({
          patientId: id,
          action: 'DELETE',
          performedBy: 'System',
          notes: `Deleted patient ${patient.firstName} ${patient.lastName}`,
        });
      } catch (auditError) {
        logger.warn('Failed to create audit log', { patientId: id, error: auditError });
      }

      // Delete patient (cascade will handle audit logs)
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting patient', error, { id });
      throw new DatabaseError('Failed to delete patient', error);
    }
  }
}
