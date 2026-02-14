/**
 * Query Builder for dynamic SQL construction
 * Eliminates code duplication in patient queries
 */

import { sql } from '@vercel/postgres';

export interface PatientQueryFilters {
  searchQuery?: string | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface PatientQueryOptions {
  sortField: string;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export class PatientQueryBuilder {
  private filters: PatientQueryFilters = {};
  private options: PatientQueryOptions = {
    sortField: 'name',
    sortDirection: 'asc',
    page: 1,
    pageSize: 10,
  };

  constructor(filters: PatientQueryFilters, options: PatientQueryOptions) {
    this.filters = filters;
    this.options = options;
  }

  /**
   * Build ORDER BY clause SQL fragment
   */
  private getOrderByClause(): string {
    const { sortField, sortDirection } = this.options;
    const isAsc = sortDirection.toLowerCase() === 'asc';

    switch (sortField) {
      case 'name':
        return isAsc
          ? 'ORDER BY last_name ASC, first_name ASC'
          : 'ORDER BY last_name DESC, first_name DESC';
      case 'status':
        return isAsc ? 'ORDER BY status ASC' : 'ORDER BY status DESC';
      case 'dateOfBirth':
        return isAsc ? 'ORDER BY date_of_birth ASC' : 'ORDER BY date_of_birth DESC';
      case 'createdAt':
      default:
        return isAsc ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';
    }
  }

  /**
   * Build count query
   */
  buildCountQuery() {
    const searchPattern = this.filters.searchQuery ? `%${this.filters.searchQuery}%` : null;
    const statusFilter = this.filters.status;

    if (searchPattern && statusFilter) {
      return sql`
        SELECT COUNT(*) as total FROM patients
        WHERE (
          LOWER(first_name) LIKE LOWER(${searchPattern}) OR
          LOWER(last_name) LIKE LOWER(${searchPattern}) OR
          LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR
          LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR
          COALESCE(phone, '') LIKE ${searchPattern}
        ) AND status = ${statusFilter}
      `;
    } else if (searchPattern) {
      return sql`
        SELECT COUNT(*) as total FROM patients
        WHERE (
          LOWER(first_name) LIKE LOWER(${searchPattern}) OR
          LOWER(last_name) LIKE LOWER(${searchPattern}) OR
          LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR
          LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR
          COALESCE(phone, '') LIKE ${searchPattern}
        )
      `;
    } else if (statusFilter) {
      return sql`SELECT COUNT(*) as total FROM patients WHERE status = ${statusFilter}`;
    } else {
      return sql`SELECT COUNT(*) as total FROM patients`;
    }
  }

  /**
   * Build data query with pagination
   */
  buildDataQuery() {
    const searchPattern = this.filters.searchQuery ? `%${this.filters.searchQuery}%` : null;
    const statusFilter = this.filters.status;
    const offset = (this.options.page - 1) * this.options.pageSize;
    const limit = this.options.pageSize;
    const orderBy = this.getOrderByClause();

    // Build query based on filters
    if (searchPattern && statusFilter) {
      if (orderBy.includes('last_name')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY last_name ASC, first_name ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY last_name DESC, first_name DESC LIMIT ${limit} OFFSET ${offset}`;
      } else if (orderBy.includes('status')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY status ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY status DESC LIMIT ${limit} OFFSET ${offset}`;
      } else if (orderBy.includes('date_of_birth')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY date_of_birth ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY date_of_birth DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      }
    } else if (searchPattern) {
      if (orderBy.includes('last_name')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY last_name ASC, first_name ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY last_name DESC, first_name DESC LIMIT ${limit} OFFSET ${offset}`;
      } else if (orderBy.includes('status')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY status ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY status DESC LIMIT ${limit} OFFSET ${offset}`;
      } else if (orderBy.includes('date_of_birth')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY date_of_birth ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY date_of_birth DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      }
    } else if (statusFilter) {
      if (orderBy.includes('last_name')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY last_name ASC, first_name ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY last_name DESC, first_name DESC LIMIT ${limit} OFFSET ${offset}`;
      } else if (orderBy.includes('status')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY status ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY status DESC LIMIT ${limit} OFFSET ${offset}`;
      } else if (orderBy.includes('date_of_birth')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY date_of_birth ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY date_of_birth DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      }
    } else {
      if (orderBy.includes('last_name')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY last_name ASC, first_name ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY last_name DESC, first_name DESC LIMIT ${limit} OFFSET ${offset}`;
      } else if (orderBy.includes('status')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY status ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY status DESC LIMIT ${limit} OFFSET ${offset}`;
      } else if (orderBy.includes('date_of_birth')) {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY date_of_birth ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY date_of_birth DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        return orderBy.includes('ASC')
          ? sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      }
    }
  }
}
