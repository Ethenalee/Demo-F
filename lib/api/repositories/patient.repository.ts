/**
 * Patient Repository
 * Abstracts database operations for patients
 */

import { sql } from '@vercel/postgres';
import type { Patient, PatientFormData } from '../types';
import { PatientQueryBuilder } from '../builders/query-builder';

export class PatientRepository {
  /**
   * Map database row to Patient entity
   */
  private mapRowToPatient(row: any): Patient {
    return {
      id: row.id,
      firstName: row.first_name,
      middleName: row.middle_name || undefined,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      status: row.status,
      email: row.email || undefined,
      phone: row.phone || undefined,
      address: {
        street: row.address_street,
        city: row.address_city,
        state: row.address_state,
        zipCode: row.address_zip_code,
        country: row.address_country,
        latitude: row.address_latitude ? parseFloat(String(row.address_latitude)) : undefined,
        longitude: row.address_longitude ? parseFloat(String(row.address_longitude)) : undefined,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Find patients with filters, sorting, and pagination
   */
  async findMany(
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
  ): Promise<{ patients: Patient[]; totalCount: number }> {
    const queryBuilder = new PatientQueryBuilder(filters, options);

    // Execute count and data queries in parallel
    const [countResult, dataResult] = await Promise.all([
      queryBuilder.buildCountQuery(),
      queryBuilder.buildDataQuery(),
    ]);

    const totalCount = parseInt(countResult.rows[0]?.total || '0', 10);
    const patients = dataResult.rows.map((row) => this.mapRowToPatient(row));

    return { patients, totalCount };
  }

  /**
   * Find a single patient by ID
   */
  async findById(id: string): Promise<Patient | null> {
    const result = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPatient(result.rows[0]);
  }

  /**
   * Create a new patient
   */
  async create(data: PatientFormData): Promise<Patient> {
    const result = await sql`
      INSERT INTO patients (
        first_name, middle_name, last_name, date_of_birth, status,
        email, phone, address_street, address_city, address_state,
        address_zip_code, address_country
      ) VALUES (
        ${data.firstName},
        ${data.middleName || null},
        ${data.lastName},
        ${data.dateOfBirth},
        ${data.status},
        ${data.email || null},
        ${data.phone || null},
        ${data.address.street},
        ${data.address.city},
        ${data.address.state},
        ${data.address.zipCode},
        ${data.address.country}
      )
      RETURNING *
    `;

    return this.mapRowToPatient(result.rows[0]);
  }

  /**
   * Update a patient
   */
  async update(id: string, data: Partial<PatientFormData>): Promise<Patient> {
    // Build dynamic UPDATE query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (data.firstName !== undefined) {
      updates.push('first_name');
      values.push(data.firstName);
    }
    if (data.middleName !== undefined) {
      updates.push('middle_name');
      values.push(data.middleName || null);
    }
    if (data.lastName !== undefined) {
      updates.push('last_name');
      values.push(data.lastName);
    }
    if (data.dateOfBirth !== undefined) {
      updates.push('date_of_birth');
      values.push(data.dateOfBirth);
    }
    if (data.status !== undefined) {
      updates.push('status');
      values.push(data.status);
    }
    if (data.email !== undefined) {
      updates.push('email');
      values.push(data.email || null);
    }
    if (data.phone !== undefined) {
      updates.push('phone');
      values.push(data.phone || null);
    }
    if (data.address) {
      if (data.address.street !== undefined) {
        updates.push('address_street');
        values.push(data.address.street);
      }
      if (data.address.city !== undefined) {
        updates.push('address_city');
        values.push(data.address.city);
      }
      if (data.address.state !== undefined) {
        updates.push('address_state');
        values.push(data.address.state);
      }
      if (data.address.zipCode !== undefined) {
        updates.push('address_zip_code');
        values.push(data.address.zipCode);
      }
      if (data.address.country !== undefined) {
        updates.push('address_country');
        values.push(data.address.country);
      }
    }

    if (updates.length === 0) {
      // No updates provided, return existing patient
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Patient not found');
      }
      return existing;
    }

    // Build UPDATE query with only the fields that are provided
    // We need to handle each field conditionally
    let result;

    if (data.firstName !== undefined && data.lastName !== undefined && data.dateOfBirth !== undefined && data.status !== undefined && data.address) {
      // Full update with all required fields
      result = await sql`
        UPDATE patients SET
          first_name = ${data.firstName},
          middle_name = ${data.middleName || null},
          last_name = ${data.lastName},
          date_of_birth = ${data.dateOfBirth},
          status = ${data.status},
          email = ${data.email || null},
          phone = ${data.phone || null},
          address_street = ${data.address.street},
          address_city = ${data.address.city},
          address_state = ${data.address.state},
          address_zip_code = ${data.address.zipCode},
          address_country = ${data.address.country}
        WHERE id = ${id}
        RETURNING *
      `;
    } else {
      // Partial update - build query dynamically
      // Get current patient first
      const current = await this.getCurrentForComparison(id);
      if (!current) {
        throw new Error('Patient not found');
      }

      // Merge with current values
      const mergedData = {
        firstName: data.firstName !== undefined ? data.firstName : current.first_name,
        middleName: data.middleName !== undefined ? (data.middleName || null) : current.middle_name,
        lastName: data.lastName !== undefined ? data.lastName : current.last_name,
        dateOfBirth: data.dateOfBirth !== undefined ? data.dateOfBirth : current.date_of_birth,
        status: data.status !== undefined ? data.status : current.status,
        email: data.email !== undefined ? (data.email || null) : current.email,
        phone: data.phone !== undefined ? (data.phone || null) : current.phone,
        address: {
          street: data.address?.street !== undefined ? data.address.street : current.address_street,
          city: data.address?.city !== undefined ? data.address.city : current.address_city,
          state: data.address?.state !== undefined ? data.address.state : current.address_state,
          zipCode: data.address?.zipCode !== undefined ? data.address.zipCode : current.address_zip_code,
          country: data.address?.country !== undefined ? data.address.country : current.address_country,
        },
      };

      result = await sql`
        UPDATE patients SET
          first_name = ${mergedData.firstName},
          middle_name = ${mergedData.middleName},
          last_name = ${mergedData.lastName},
          date_of_birth = ${mergedData.dateOfBirth},
          status = ${mergedData.status},
          email = ${mergedData.email},
          phone = ${mergedData.phone},
          address_street = ${mergedData.address.street},
          address_city = ${mergedData.address.city},
          address_state = ${mergedData.address.state},
          address_zip_code = ${mergedData.address.zipCode},
          address_country = ${mergedData.address.country}
        WHERE id = ${id}
        RETURNING *
      `;
    }

    if (result.rows.length === 0) {
      throw new Error('Patient not found');
    }

    return this.mapRowToPatient(result.rows[0]);
  }

  /**
   * Delete a patient
   */
  async delete(id: string): Promise<void> {
    const result = await sql`
      DELETE FROM patients WHERE id = ${id}
    `;

    if (result.rowCount === 0) {
      throw new Error('Patient not found');
    }
  }

  /**
   * Get current patient data for comparison (for audit logs)
   */
  async getCurrentForComparison(id: string): Promise<any | null> {
    const result = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
