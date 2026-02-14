import { NextResponse } from 'next/server';
import { initDatabase } from '../../../lib/api/db';

// POST /api/init - Initialize database schema
export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: 'Failed to initialize database', details: String(error) }, { status: 500 });
  }
}
