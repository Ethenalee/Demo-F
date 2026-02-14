import { initDatabase } from '../db';

// POST /api/init - Initialize database schema
export async function POST() {
  try {
    await initDatabase();
    return Response.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return Response.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}
