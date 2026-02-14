import { sql } from '@vercel/postgres';

export { sql };

// Database schema initialization
export async function initDatabase() {
  try {
    // Create patients table
    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        last_name VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Inquiry', 'Onboarding', 'Active', 'Churned')),
        email VARCHAR(255),
        phone VARCHAR(50),
        address_street VARCHAR(255) NOT NULL,
        address_city VARCHAR(255) NOT NULL,
        address_state VARCHAR(100) NOT NULL,
        address_zip_code VARCHAR(20) NOT NULL,
        address_country VARCHAR(100) NOT NULL DEFAULT 'USA',
        address_latitude DECIMAL(10, 8),
        address_longitude DECIMAL(11, 8),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create audit_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
        field_name VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        performed_by VARCHAR(255) NOT NULL DEFAULT 'System',
        performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `;

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON audit_logs(patient_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at)
    `;

    // Create trigger to update updated_at timestamp
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
      CREATE TRIGGER update_patients_updated_at
      BEFORE UPDATE ON patients
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
