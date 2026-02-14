// Re-export types for API routes
export type PatientStatus = 'Inquiry' | 'Onboarding' | 'Active' | 'Churned';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface Patient {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  status: PatientStatus;
  address: Address;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  patientId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  performedAt: string;
  notes?: string;
}

export interface PatientFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  status: PatientStatus;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}
