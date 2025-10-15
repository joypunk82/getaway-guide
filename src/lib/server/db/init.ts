import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Initialize the database schema
 * Creates the sessions table if it doesn't exist
 */
export async function initializeDatabase(): Promise<void> {
	try {
		console.log('[DEBUG] Initializing database schema...');
		
		// Create sessions table
		await sql`
			CREATE TABLE IF NOT EXISTS sessions (
				id VARCHAR(255) PRIMARY KEY,
				session_data JSONB NOT NULL,
				expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			)
		`;

		// Create indexes
		await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`;
		await sql`CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id)`;

		console.log('[DEBUG] Database schema initialized successfully');
	} catch (error) {
		console.error('[ERROR] Failed to initialize database schema:', error);
		throw new Error('Database initialization failed');
	}
}