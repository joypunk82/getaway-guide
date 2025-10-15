import type { GetawayGuideSession } from '$lib/types/getaway-guide';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

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
		console.log('[DEBUG] Getting session from PostgreSQL:', sessionId);

		const result = await sql`
			SELECT id, session_data, created_at, updated_at, expires_at
			FROM sessions 
			WHERE id = ${sessionId} 
			AND expires_at > NOW()
		`;

		if (result.length === 0) {
			console.log('[DEBUG] Session not found or expired');
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

		console.log(
			'[DEBUG] Successfully retrieved session - locations count:',
			sessionData.sessionData.locations.length
		);

		// Log details for each location retrieved
		sessionData.sessionData.locations.forEach((location: any, index: number) => {
			console.log(
				`[DEBUG] Retrieved location ${index}: ID=${location.id}, Name=${location.name}, Sites=${location.sites.length}`
			);
		});

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
		console.log('[DEBUG] Saving session to PostgreSQL:', sessionId);
		console.log('[DEBUG] Session data being saved - locations count:', sessionData.locations.length);

		// Log details for each location being saved
		sessionData.locations.forEach((location: any, index: number) => {
			console.log(
				`[DEBUG] Saving location ${index}: ID=${location.id}, Name=${location.name}, Sites=${location.sites.length}`
			);
		});

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

		console.log('[DEBUG] Session saved successfully to PostgreSQL');
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
		console.log('[DEBUG] Deleting session from PostgreSQL:', sessionId);

		await sql`DELETE FROM sessions WHERE id = ${sessionId}`;

		console.log('[DEBUG] Session deleted successfully from PostgreSQL');
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
		const result = await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
		const deletedCount = result.length || 0;
		console.log('[DEBUG] Cleaned up expired sessions:', deletedCount);
		return deletedCount;
	} catch (error) {
		console.error('[ERROR] Error cleaning up expired sessions:', error);
		return 0;
	}
}
