import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/db/init';

async function handleInitialization() {
	try {
		await initializeDatabase();
		return json({ success: true, message: 'Database initialized successfully' });
	} catch (error) {
		console.error('Database initialization failed:', error);
		return json({ 
			success: false, 
			message: 'Failed to initialize database',
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}

export const GET: RequestHandler = handleInitialization;
export const POST: RequestHandler = handleInitialization;