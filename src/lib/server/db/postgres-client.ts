import type { GetawayGuideSession } from '$lib/types/getaway-guide';
import { neon } from '@neondatabase/serverless';

// Lazy connection - only create when needed
let sql: ReturnType<typeof neon> | null = null;

function getConnection() {
	if (!sql) {
		if (!process.env.DATABASE_URL) {
			throw new Error('DATABASE_URL environment variable is not set');
		}
		sql = neon(process.env.DATABASE_URL);
	}
	return sql;
}

/**
 * PostgreSQL-based session storage for Getaway Guide
 * Replaces the blob storage approach with a proper database
 */

export interface SessionData {
	id: string;
	sessionData: GetawayGuideSession;
	createdAt: Date;
	updatedAt: Date;
	expiresAt: Date;
}

/**
 * Get session from PostgreSQL database
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
	try {
		const sql = getConnection();

		const result = (await sql`
			SELECT id, session_data, created_at, updated_at, expires_at
			FROM sessions 
			WHERE id = ${sessionId} 
			AND expires_at > NOW()
		`) as any[];

		if (result.length === 0) {
			return null;
		}

		const row = result[0];
		const sessionData = {
			id: row.id as string,
			sessionData: row.session_data as GetawayGuideSession,
			createdAt: new Date(row.created_at as string),
			updatedAt: new Date(row.updated_at as string),
			expiresAt: new Date(row.expires_at as string)
		};

		return sessionData;
	} catch (error) {
		console.error('[ERROR] Error getting session from PostgreSQL:', error);
		return null;
	}
}

/**
 * Save session to PostgreSQL database
 */
export async function saveSession(
	sessionId: string,
	sessionData: GetawayGuideSession
): Promise<void> {
	const now = new Date();
	const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours

	try {
		const sql = getConnection();

		// Use UPSERT (INSERT ... ON CONFLICT) for atomic operation
		await sql`
			INSERT INTO sessions (id, session_data, expires_at, created_at, updated_at)
			VALUES (${sessionId}, ${JSON.stringify(sessionData)}, ${expiresAt.toISOString()}, ${now.toISOString()}, ${now.toISOString()})
			ON CONFLICT (id) 
			DO UPDATE SET 
				session_data = EXCLUDED.session_data,
				expires_at = EXCLUDED.expires_at,
				updated_at = EXCLUDED.updated_at
		`;
	} catch (error) {
		console.error('[ERROR] Error saving session to PostgreSQL:', error);
		throw new Error('Failed to save session to database');
	}
}

/**
 * Delete session from PostgreSQL database
 */
export async function deleteSession(sessionId: string): Promise<void> {
	try {
		const sql = getConnection();

		await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
	} catch (error) {
		console.error('[ERROR] Error deleting session from PostgreSQL:', error);
		throw new Error('Failed to delete session from database');
	}
}

/**
 * Clean up expired sessions (optional maintenance function)
 */
export async function cleanupExpiredSessions(): Promise<number> {
	try {
		const sql = getConnection();
		const result = (await sql`DELETE FROM sessions WHERE expires_at < NOW()`) as any[];
		const deletedCount = result.length || 0;
		return deletedCount;
	} catch (error) {
		console.error('[ERROR] Error cleaning up expired sessions:', error);
		return 0;
	}
}
