import { initDatabase } from './db.js';
import { jsonResponse } from './utils.js';

export default async function handler(req: Request) {
  if (req.method === 'POST') {
    return handlePOST();
  } else {
    return new Response('Method not allowed', { status: 405 });
  }
}

// POST /api/init - Initialize database schema
async function handlePOST() {
  try {
    await initDatabase();
    return jsonResponse({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return jsonResponse({ error: 'Failed to initialize database', details: String(error) }, 500);
  }
}
