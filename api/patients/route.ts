import { sql } from '../db';
import type { Patient, PatientFormData } from '../types';

// GET /api/patients - List patients with filtering, sorting, and pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const searchQuery = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const sortField = searchParams.get('sortField') || 'name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build WHERE conditions
    let whereConditions = '';
    const queryParams: any[] = [];

    if (searchQuery) {
      whereConditions += `WHERE (
        LOWER(first_name) LIKE LOWER($${queryParams.length + 1}) OR
        LOWER(last_name) LIKE LOWER($${queryParams.length + 1}) OR
        LOWER(COALESCE(middle_name, '')) LIKE LOWER($${queryParams.length + 1}) OR
        LOWER(COALESCE(email, '')) LIKE LOWER($${queryParams.length + 1}) OR
        COALESCE(phone, '') LIKE $${queryParams.length + 1}
      )`;
      queryParams.push(`%${searchQuery}%`);
    }

    if (status !== 'ALL') {
      whereConditions += whereConditions ? ' AND ' : 'WHERE ';
      whereConditions += `status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    if (dateFrom) {
      whereConditions += whereConditions ? ' AND ' : 'WHERE ';
      whereConditions += `created_at >= $${queryParams.length + 1}::timestamp`;
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions += whereConditions ? ' AND ' : 'WHERE ';
      whereConditions += `created_at <= $${queryParams.length + 1}::timestamp`;
      queryParams.push(dateTo);
    }

    // Build ORDER BY clause
    let orderBy = 'ORDER BY ';
    switch (sortField) {
      case 'name':
        orderBy += `last_name ${sortDirection}, first_name ${sortDirection}`;
        break;
      case 'status':
        orderBy += `status ${sortDirection}`;
        break;
      case 'dateOfBirth':
        orderBy += `date_of_birth ${sortDirection}`;
        break;
      case 'createdAt':
        orderBy += `created_at ${sortDirection}`;
        break;
      default:
        orderBy += `last_name ${sortDirection}, first_name ${sortDirection}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM patients ${whereConditions}`;
    const countResult = await sql.unsafe(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    queryParams.push(pageSize, offset);

    const dataQuery = `
      SELECT
        id,
        first_name,
        middle_name,
        last_name,
        date_of_birth,
        status,
        email,
        phone,
        address_street,
        address_city,
        address_state,
        address_zip_code,
        address_country,
        address_latitude,
        address_longitude,
        created_at,
        updated_at
      FROM patients
      ${whereConditions}
      ${orderBy}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const result = await sql.unsafe(dataQuery, queryParams);

    const patients: Patient[] = result.rows.map((row) => ({
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
    }));

    return Response.json({
      patients,
      pagination: {
        page,
        pageSize,
        totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return Response.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: Request) {
  try {
    const data: PatientFormData = await request.json();

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

    // Create audit log
    await sql`
      INSERT INTO audit_logs (patient_id, action, performed_by, notes)
      VALUES (${patient.id}, 'CREATE', 'Current User', ${`Created patient ${patient.firstName} ${patient.lastName}`})
    `;

    return Response.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return Response.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
