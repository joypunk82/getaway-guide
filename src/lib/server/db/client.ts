import { put, del, head, list } from '@vercel/blob';
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
			console.log('[DEBUG] No BLOB_READ_WRITE_TOKEN, using in-memory storage');
			return inMemorySessions.get(sessionId) || null;
		}

		console.log('[DEBUG] Getting session from blob storage:', sessionId);
		
		// Try to head the blob first to check if it exists
		try {
			const blob = await head(`sessions/${sessionId}.json`);
			console.log('[DEBUG] Blob exists, fetching content');
			
			const response = await fetch(blob.url);
			if (!response.ok) {
				console.log('[DEBUG] Failed to fetch blob content:', response.status);
				return null;
			}
			
			const data = await response.json();
			console.log('[DEBUG] Successfully retrieved session data - locations count:', data.sessionData.locations.length);
			console.log('[DEBUG] Location IDs in retrieved session:', data.sessionData.locations.map((l: any) => l.id));
			return data;
		} catch (headError) {
			console.log('[DEBUG] Blob does not exist or head failed:', headError);
			return null;
		}
	} catch (error) {
		console.error('[ERROR] Error getting session from blob storage:', error);
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
		console.log('Saving session to in-memory store (no BLOB_READ_WRITE_TOKEN)');
		inMemorySessions.set(sessionId, data);
		return;
	}

	try {
		console.log('[DEBUG] Saving session to blob storage:', sessionId);
		
		// First, try to delete existing blob if it exists
		try {
			await del(`sessions/${sessionId}.json`);
			console.log('[DEBUG] Deleted existing blob');
		} catch {
			// Ignore delete errors - blob might not exist
		}
		
		const result = await put(`sessions/${sessionId}.json`, JSON.stringify(data), {
			access: 'public',
			addRandomSuffix: false
		});
		console.log('[DEBUG] Session saved successfully to blob storage:', result.url);
	} catch (error) {
		console.error('[ERROR] Error saving session to blob storage:', error);
		console.log('[DEBUG] Falling back to in-memory storage for this session');
		inMemorySessions.set(sessionId, data);
	}
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
