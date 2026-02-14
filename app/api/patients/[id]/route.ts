import { NextResponse } from 'next/server';
import { sql, ensureDatabaseInitialized } from '../../../../lib/api/db';
import type { Patient, PatientFormData } from '../../../../lib/api/types';

// GET /api/patients/[id] - Get a single patient
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Ensure database is initialized before handling requests
  try {
    const initTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), 5000);
    });
    await Promise.race([ensureDatabaseInitialized(), initTimeout]);
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      error: 'Database initialization failed',
      details: String(error),
      message: 'Please check your database connection and try again'
    }, { status: 500 });
  }

  try {
    const { id } = await params;
    const result = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const patient: Patient = {
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

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}

// PATCH /api/patients/[id] - Update a patient
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Ensure database is initialized before handling requests
  try {
    const initTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), 5000);
    });
    await Promise.race([ensureDatabaseInitialized(), initTimeout]);
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      error: 'Database initialization failed',
      details: String(error),
      message: 'Please check your database connection and try again'
    }, { status: 500 });
  }

  try {
    const { id } = await params;
    // Parse request body - Next.js Request.json() works correctly
    const data: Partial<PatientFormData> = await request.json();

    // First, get the current patient to compare changes
    const currentResult = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const current = currentResult.rows[0];

    // Reconstruct the full patient object with updates
    const updatedData = {
      firstName: data.firstName !== undefined ? data.firstName : current.first_name,
      middleName: data.middleName !== undefined ? data.middleName : current.middle_name,
      lastName: data.lastName !== undefined ? data.lastName : current.last_name,
      dateOfBirth: data.dateOfBirth !== undefined ? data.dateOfBirth : current.date_of_birth,
      status: data.status !== undefined ? data.status : current.status,
      email: data.email !== undefined ? data.email : current.email,
      phone: data.phone !== undefined ? data.phone : current.phone,
      address: {
        street: data.address?.street !== undefined ? data.address.street : current.address_street,
        city: data.address?.city !== undefined ? data.address.city : current.address_city,
        state: data.address?.state !== undefined ? data.address.state : current.address_state,
        zipCode: data.address?.zipCode !== undefined ? data.address.zipCode : current.address_zip_code,
        country: data.address?.country !== undefined ? data.address.country : current.address_country,
      }
    };

    const result = await sql`
      UPDATE patients
      SET
        first_name = ${updatedData.firstName},
        middle_name = ${updatedData.middleName || null},
        last_name = ${updatedData.lastName},
        date_of_birth = ${updatedData.dateOfBirth},
        status = ${updatedData.status},
        email = ${updatedData.email || null},
        phone = ${updatedData.phone || null},
        address_street = ${updatedData.address.street},
        address_city = ${updatedData.address.city},
        address_state = ${updatedData.address.state},
        address_zip_code = ${updatedData.address.zipCode},
        address_country = ${updatedData.address.country}
      WHERE id = ${id}
      RETURNING *
    `;
    const row = result.rows[0];

    const patient: Patient = {
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

    // Create audit logs for changes
    const now = new Date().toISOString();

    if (data.firstName && data.firstName !== current.first_name) {
      await sql`
        INSERT INTO audit_logs (patient_id, action, field_name, old_value, new_value, performed_by, performed_at)
        VALUES (${id}, 'UPDATE', 'firstName', ${current.first_name}, ${data.firstName}, 'Current User', ${now})
      `;
    }

    if (data.lastName && data.lastName !== current.last_name) {
      await sql`
        INSERT INTO audit_logs (patient_id, action, field_name, old_value, new_value, performed_by, performed_at)
        VALUES (${id}, 'UPDATE', 'lastName', ${current.last_name}, ${data.lastName}, 'Current User', ${now})
      `;
    }

    if (data.status && data.status !== current.status) {
      await sql`
        INSERT INTO audit_logs (patient_id, action, field_name, old_value, new_value, performed_by, performed_at)
        VALUES (${id}, 'STATUS_CHANGE', 'status', ${current.status}, ${data.status}, 'Current User', ${now})
      `;
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

// DELETE /api/patients/[id] - Delete a patient
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Ensure database is initialized before handling requests
  try {
    const initTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), 5000);
    });
    await Promise.race([ensureDatabaseInitialized(), initTimeout]);
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      error: 'Database initialization failed',
      details: String(error),
      message: 'Please check your database connection and try again'
    }, { status: 500 });
  }

  try {
    const { id } = await params;
    // Get patient info before deletion for audit log
    const currentResult = await sql`
      SELECT first_name, last_name FROM patients WHERE id = ${id}
    `;

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const current = currentResult.rows[0];

    // Create audit log for deletion before deleting
    await sql`
      INSERT INTO audit_logs (patient_id, action, performed_by, notes)
      VALUES (${id}, 'DELETE', 'Current User', ${`Deleted patient ${current.first_name} ${current.last_name}`})
    `;

    // Delete patient (cascade will delete audit logs, but we already created the delete log)
    await sql`
      DELETE FROM patients WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
