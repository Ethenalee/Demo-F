import { sql, ensureDatabaseInitialized } from '../db.js';
import type { Patient, PatientFormData } from '../types.js';
import { jsonResponse } from '../utils.js';

// Helper to extract ID from URL
function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/patients\/([^\/\?]+)/);
  return match ? match[1] : null;
}

export default async function handler(req: Request) {
  // Ensure database is initialized before handling requests
  try {
    const initTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), 5000);
    });
    await Promise.race([ensureDatabaseInitialized(), initTimeout]);
  } catch (error) {
    console.error('Database initialization error:', error);
    return jsonResponse({
      error: 'Database initialization failed',
      details: String(error),
      message: 'Please check your database connection and try again'
    }, 500);
  }
  const id = getIdFromUrl(req.url);
  if (!id) {
    return jsonResponse({ error: 'Patient ID is required' }, 400);
  }

  if (req.method === 'GET') {
    return handleGET(req, id);
  } else if (req.method === 'PATCH') {
    return handlePATCH(req, id);
  } else if (req.method === 'DELETE') {
    return handleDELETE(req, id);
  } else {
    return new Response('Method not allowed', { status: 405 });
  }
}

// GET /api/patients/[id] - Get a single patient
async function handleGET(request: Request, id: string) {
  try {
    const result = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return jsonResponse({ error: 'Patient not found' }, 404);
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

    return jsonResponse(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return jsonResponse({ error: 'Failed to fetch patient' }, 500);
  }
}

// PATCH /api/patients/[id] - Update a patient
async function handlePATCH(request: Request, id: string) {
  try {
    // Parse request body - Vercel serverless functions use standard Request API
    let data: Partial<PatientFormData>;
    try {
      const req = request as any;

      if (req.body && typeof req.body === 'object' && !(req.body instanceof ReadableStream)) {
        // Body is already parsed
        data = req.body as Partial<PatientFormData>;
      } else {
        // Try standard Request.json()
        data = await request.json();
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return jsonResponse({
        error: 'Invalid request body',
        details: String(parseError),
        hint: 'Make sure Content-Type is application/json and body is valid JSON'
      }, 400);
    }

    // First, get the current patient to compare changes
    const currentResult = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (currentResult.rows.length === 0) {
      return jsonResponse({ error: 'Patient not found' }, 404);
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
      return jsonResponse({ error: 'No fields to update' }, 400);
    }

    // Build update query using template literals
    // This is a simplified approach - for complex updates, we'd need to build the query differently
    // For now, let's update fields one by one or use a different approach
    let result;

    // Since we can't easily build dynamic UPDATE queries with Vercel Postgres template literals,
    // we'll update the patient using individual field updates or a different strategy
    // For now, let's reconstruct the full patient object and update all fields
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

    result = await sql`
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

    return jsonResponse(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return jsonResponse({ error: 'Failed to update patient' }, 500);
  }
}

// DELETE /api/patients/[id] - Delete a patient
async function handleDELETE(request: Request, id: string) {
  try {
    // Get patient info before deletion for audit log
    const currentResult = await sql`
      SELECT first_name, last_name FROM patients WHERE id = ${id}
    `;

    if (currentResult.rows.length === 0) {
      return jsonResponse({ error: 'Patient not found' }, 404);
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

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return jsonResponse({ error: 'Failed to delete patient' }, 500);
  }
}
