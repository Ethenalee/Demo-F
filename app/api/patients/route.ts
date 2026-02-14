import { NextResponse } from 'next/server';
import { sql, ensureDatabaseInitialized } from '../../../lib/api/db';
import type { Patient, PatientFormData } from '../../../lib/api/types';

// GET /api/patients - List patients with filtering, sorting, and pagination
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);

    const searchQuery = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const sortField = searchParams.get('sortField') || 'name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const searchPattern = searchQuery ? `%${searchQuery}%` : null;
    const statusFilter = status !== 'ALL' ? status : null;
    const offset = (page - 1) * pageSize;
    const isAsc = sortDirection.toLowerCase() === 'asc';

    // Get total count
    let countResult;
    if (searchPattern && statusFilter) {
      countResult = await sql`
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
      countResult = await sql`
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
      countResult = await sql`
        SELECT COUNT(*) as total FROM patients WHERE status = ${statusFilter}
      `;
    } else {
      countResult = await sql`
        SELECT COUNT(*) as total FROM patients
      `;
    }

    const totalCount = parseInt(countResult.rows[0].total);

    // Execute query based on sort field - build separate queries for each case
    let result;

    if (searchPattern && statusFilter) {
      if (sortField === 'name') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY last_name ASC, first_name ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY last_name DESC, first_name DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else if (sortField === 'status') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY status ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY status DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else if (sortField === 'dateOfBirth') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY date_of_birth ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY date_of_birth DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY created_at ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) AND status = ${statusFilter} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
      }
    } else if (searchPattern) {
      if (sortField === 'name') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY last_name ASC, first_name ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY last_name DESC, first_name DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else if (sortField === 'status') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY status ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY status DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else if (sortField === 'dateOfBirth') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY date_of_birth ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY date_of_birth DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY created_at ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE (LOWER(first_name) LIKE LOWER(${searchPattern}) OR LOWER(last_name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(middle_name, '')) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(email, '')) LIKE LOWER(${searchPattern}) OR COALESCE(phone, '') LIKE ${searchPattern}) ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
      }
    } else if (statusFilter) {
      if (sortField === 'name') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY last_name ASC, first_name ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY last_name DESC, first_name DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else if (sortField === 'status') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY status ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY status DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else if (sortField === 'dateOfBirth') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY date_of_birth ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY date_of_birth DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY created_at ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients WHERE status = ${statusFilter} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
      }
    } else {
      if (sortField === 'name') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY last_name ASC, first_name ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY last_name DESC, first_name DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else if (sortField === 'status') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY status ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY status DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else if (sortField === 'dateOfBirth') {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY date_of_birth ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY date_of_birth DESC LIMIT ${pageSize} OFFSET ${offset}`;
      } else {
        result = isAsc
          ? await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY created_at ASC LIMIT ${pageSize} OFFSET ${offset}`
          : await sql`SELECT id, first_name, middle_name, last_name, date_of_birth, status, email, phone, address_street, address_city, address_state, address_zip_code, address_country, address_latitude, address_longitude, created_at, updated_at FROM patients ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
      }
    }

    // Handle empty results - return empty array if no patients
    const patients: Patient[] = result.rows.length > 0
      ? result.rows.map((row) => ({
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
        }))
      : []; // Return empty array if no patients

    return NextResponse.json({
      patients,
      pagination: {
        page,
        pageSize,
        totalCount: totalCount || 0, // Ensure totalCount is always a number
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients', details: String(error) }, { status: 500 });
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: Request) {
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
    // Parse request body - Next.js Request.json() works correctly
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

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient', details: String(error) }, { status: 500 });
  }
}
