import { put, del, head } from '@vercel/blob';
import type { GetawayGuideSession } from '$lib/types/getaway-guide';

/**
 * Blob-based session storage for Getaway Guide
 * Uses Vercel Blob storage instead of a database
 */

export interface SessionData {
	id: string;
	sessionData: GetawayGuideSession;
	createdAt: number;
	updatedAt: number;
	expiresAt: number;
}

/**
 * Get session from blob storage
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
	try {
		// For development, use a simple in-memory store as fallback
		if (!process.env.BLOB_READ_WRITE_TOKEN) {
			return inMemorySessions.get(sessionId) || null;
		}

		const response = await fetch(`https://blob.vercel-storage.com/sessions/${sessionId}.json`, {
			headers: {
				'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
			}
		});
		
		if (!response.ok) {
			return null;
		}
		return await response.json();
	} catch {
		return null;
	}
}

// In-memory fallback for development
const inMemorySessions = new Map<string, SessionData>();

/**
 * Save session to blob storage
 */
export async function saveSession(sessionId: string, sessionData: GetawayGuideSession): Promise<void> {
	const now = Date.now();
	const expiresAt = now + (4 * 60 * 60 * 1000); // 4 hours

	const data: SessionData = {
		id: sessionId,
		sessionData,
		createdAt: now,
		updatedAt: now,
		expiresAt
	};

	// For development, use in-memory store as fallback
	if (!process.env.BLOB_READ_WRITE_TOKEN) {
		inMemorySessions.set(sessionId, data);
		return;
	}

	await put(`sessions/${sessionId}.json`, JSON.stringify(data), {
		access: 'public'
	});
}

/**
 * Delete session from blob storage
 */
export async function deleteSession(sessionId: string): Promise<void> {
	try {
		// For development, use in-memory store as fallback
		if (!process.env.BLOB_READ_WRITE_TOKEN) {
			inMemorySessions.delete(sessionId);
			return;
		}

		await del(`sessions/${sessionId}.json`);
	} catch {
		// Ignore errors - session might not exist
	}
}

/**
 * Check if session exists and is not expired
 */
export async function sessionExists(sessionId: string): Promise<boolean> {
	try {
		const headResponse = await head(`sessions/${sessionId}.json`);
		return !!headResponse;
	} catch {
		return false;
	}
}
