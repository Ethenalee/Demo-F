import { sql } from '@vercel/postgres';

export { sql };

// Note: checkDatabaseExists is no longer used - we skip the check and just try to create tables
// This is faster and avoids hanging on connection issues

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

    // Create indexes for better query performance (each in separate query)
    await sql`CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON audit_logs(patient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at)`;

    // Create trigger function (must be separate from trigger creation)
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Drop trigger if exists (separate query)
    await sql`DROP TRIGGER IF EXISTS update_patients_updated_at ON patients`;

    // Create trigger (separate query)
    await sql`
      CREATE TRIGGER update_patients_updated_at
      BEFORE UPDATE ON patients
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Auto-initialize database if it doesn't exist
let initPromise: Promise<void> | null = null;
let isInitialized: boolean = false;

export async function ensureDatabaseInitialized(): Promise<void> {
  // If already initialized, return immediately - no database check needed
  if (isInitialized) {
    return;
  }

  // If already initializing, wait for that promise with timeout
  if (initPromise) {
    try {
      // Add timeout to prevent hanging - very short timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Database initialization timeout')), 3000); // 3 seconds
      });
      return await Promise.race([initPromise, timeoutPromise]);
    } catch (error) {
      // If timeout, mark as initialized anyway to prevent infinite retries
      // The tables might already exist, so we'll let queries fail naturally if needed
      console.warn('Database initialization timeout - assuming tables exist');
      isInitialized = true; // Mark as initialized to prevent retries
      initPromise = null;
      return; // Return instead of throwing to allow requests to proceed
    }
  }

  // Skip database check - just try to initialize directly with timeout
  // This is faster and avoids hanging on connection issues
  // If tables exist, CREATE TABLE IF NOT EXISTS will just return
  console.log('Initializing database (tables will be created if needed)...');

  // Add timeout to the initialization itself
  const initWithTimeout = Promise.race([
    initDatabase(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), 3000);
    })
  ]);

  initPromise = initWithTimeout.then(() => {
    isInitialized = true;
    console.log('Database initialization complete');
  }).catch((error) => {
    console.warn('Database initialization failed or timed out:', error);
    // Mark as initialized anyway to prevent infinite retries
    // Tables might already exist, queries will fail naturally if they don't
    isInitialized = true;
    initPromise = null;
    // Don't throw - let requests proceed, they'll fail naturally if DB isn't ready
  });

  return initPromise;
}
