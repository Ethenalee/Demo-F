import { sql } from '../../db';
import type { Patient, PatientFormData } from '../../types';

// Helper to extract ID from URL
function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/patients\/([^\/]+)/);
  return match ? match[1] : null;
}

// GET /api/patients/[id] - Get a single patient
export async function GET(request: Request) {
  try {
    const id = getIdFromUrl(request.url);
    if (!id) {
      return Response.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
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

    return Response.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return Response.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PATCH /api/patients/[id] - Update a patient
export async function PATCH(request: Request) {
  try {
    const id = getIdFromUrl(request.url);
    if (!id) {
      return Response.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const data: Partial<PatientFormData> = await request.json();

    // First, get the current patient to compare changes
    const currentResult = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (currentResult.rows.length === 0) {
      return Response.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    const current = currentResult.rows[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (data.firstName !== undefined) {
      updates.push(`first_name = $${values.length + 1}`);
      values.push(data.firstName);
    }
    if (data.middleName !== undefined) {
      updates.push(`middle_name = $${values.length + 1}`);
      values.push(data.middleName || null);
    }
    if (data.lastName !== undefined) {
      updates.push(`last_name = $${values.length + 1}`);
      values.push(data.lastName);
    }
    if (data.dateOfBirth !== undefined) {
      updates.push(`date_of_birth = $${values.length + 1}`);
      values.push(data.dateOfBirth);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(data.status);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${values.length + 1}`);
      values.push(data.email || null);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${values.length + 1}`);
      values.push(data.phone || null);
    }
    if (data.address) {
      if (data.address.street !== undefined) {
        updates.push(`address_street = $${values.length + 1}`);
        values.push(data.address.street);
      }
      if (data.address.city !== undefined) {
        updates.push(`address_city = $${values.length + 1}`);
        values.push(data.address.city);
      }
      if (data.address.state !== undefined) {
        updates.push(`address_state = $${values.length + 1}`);
        values.push(data.address.state);
      }
      if (data.address.zipCode !== undefined) {
        updates.push(`address_zip_code = $${values.length + 1}`);
        values.push(data.address.zipCode);
      }
      if (data.address.country !== undefined) {
        updates.push(`address_country = $${values.length + 1}`);
        values.push(data.address.country);
      }
    }

    if (updates.length === 0) {
      return Response.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);
    const updateQuery = `
      UPDATE patients
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await sql.unsafe(updateQuery, values);
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

    return Response.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return Response.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete a patient
export async function DELETE(request: Request) {
  try {
    const id = getIdFromUrl(request.url);
    if (!id) {
      return Response.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Get patient info before deletion for audit log
    const currentResult = await sql`
      SELECT first_name, last_name FROM patients WHERE id = ${id}
    `;

    if (currentResult.rows.length === 0) {
      return Response.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
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

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return Response.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
