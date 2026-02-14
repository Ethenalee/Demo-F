'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  Patient,
  AuditLog,
  PatientFilter,
  SortOption,
  PaginationState,
  PatientFormData
} from '@/types';

// API base URL - use relative path for vercel dev
const API_BASE = '/api';

// Helper function to add timeout to fetch
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - the server took too long to respond');
    }
    throw error;
  }
}

export function usePatientStore() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilterState] = useState<PatientFilter>({
    searchQuery: '',
    status: 'ALL',
    dateRange: {}
  });
  const [sort, setSortState] = useState<SortOption>({
    field: 'name',
    direction: 'asc'
  });
  const [pagination, setPaginationState] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0
  });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients from API
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search: filter.searchQuery,
        status: filter.status,
        sortField: sort.field,
        sortDirection: sort.direction,
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (filter.dateRange.from) {
        params.append('dateFrom', filter.dateRange.from.toISOString());
      }
      if (filter.dateRange.to) {
        params.append('dateTo', filter.dateRange.to.toISOString());
      }

      const url = `${API_BASE}/patients?${params.toString()}`;
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch patients: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setPatients(data.patients);
      setPaginationState(prev => ({
        ...prev,
        totalCount: data.pagination.totalCount
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, sort, pagination.page, pagination.pageSize]);

  // Fetch patients when filters, sort, or pagination changes
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = useCallback(async (data: PatientFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to create patient: ${response.status} ${response.statusText}`);
      }

      const newPatient = await response.json();

      // Refresh the patient list
      await fetchPatients();

      return newPatient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating patient:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients]);

  const updatePatient = useCallback(async (id: string, data: Partial<PatientFormData>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/patients/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to update patient: ${response.status} ${response.statusText}`);
      }

      const updatedPatient = await response.json();

      // Refresh the patient list
      await fetchPatients();

      return updatedPatient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating patient:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients]);

  const deletePatient = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/patients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to delete patient: ${response.status} ${response.statusText}`);
      }

      // Refresh the patient list
      await fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error deleting patient:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients]);

  const getPatientById = useCallback(async (id: string): Promise<Patient | null> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/patients/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch patient');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching patient:', err);
      return null;
    }
  }, []);

  const setFilter = useCallback((newFilter: Partial<PatientFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, []);

  const setSort = useCallback((newSort: SortOption) => {
    setSortState(newSort);
  }, []);

  const setPagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }));
  }, []);

  const getAuditLogsForPatient = useCallback(async (patientId: string): Promise<AuditLog[]> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/audit-logs?patientId=${patientId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch audit logs: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data.auditLogs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      return [];
    }
  }, []);

  const getAllAuditLogs = useCallback(async (): Promise<AuditLog[]> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/audit-logs`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch audit logs: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data.auditLogs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      return [];
    }
  }, []);

  const getFilteredPatients = useCallback(() => {
    // For now, return all patients (filtering is done server-side)
    // This is kept for backward compatibility with components
    return patients;
  }, [patients]);

  const getPaginatedPatients = useCallback(() => {
    // Pagination is done server-side, so return all fetched patients
    return patients;
  }, [patients]);

  const exportToCSV = useCallback(() => {
    // Fetch all patients for export (without pagination)
    const params = new URLSearchParams({
      search: filter.searchQuery,
      status: filter.status,
      sortField: sort.field,
      sortDirection: sort.direction,
      page: '1',
      pageSize: '10000', // Large number to get all results
    });

    if (filter.dateRange.from) {
      params.append('dateFrom', filter.dateRange.from.toISOString());
    }
    if (filter.dateRange.to) {
      params.append('dateTo', filter.dateRange.to.toISOString());
    }

    // Return a promise that fetches and formats CSV
    return fetch(`${API_BASE}/patients?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        const headers = [
          'ID',
          'First Name',
          'Middle Name',
          'Last Name',
          'Date of Birth',
          'Status',
          'Email',
          'Phone',
          'Street',
          'City',
          'State',
          'ZIP Code',
          'Country',
          'Created At',
          'Updated At'
        ];

        const rows = data.patients.map((p: Patient) => [
          p.id,
          p.firstName,
          p.middleName || '',
          p.lastName,
          p.dateOfBirth,
          p.status,
          p.email || '',
          p.phone || '',
          p.address.street,
          p.address.city,
          p.address.state,
          p.address.zipCode,
          p.address.country,
          p.createdAt,
          p.updatedAt
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row: any[]) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          )
        ].join('\n');

        return csvContent;
      });
  }, [filter, sort]);

  return {
    patients,
    filter,
    sort,
    pagination,
    selectedPatient,
    loading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    setSelectedPatient,
    setFilter,
    setSort,
    setPagination,
    getAuditLogsForPatient,
    getAllAuditLogs,
    getFilteredPatients,
    getPaginatedPatients,
    exportToCSV,
    refreshPatients: fetchPatients,
  };
}
