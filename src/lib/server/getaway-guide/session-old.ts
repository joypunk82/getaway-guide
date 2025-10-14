import type { Cookies } from '@sveltejs/kit';
import type {
	Location,
	GetawayGuideSession,
	LocationWithVideos,
	PlaylistInfo
} from '$lib/types/getaway-guide';
import { randomUUID } from 'crypto';
import { getSession, saveSession, deleteSession } from '$lib/server/db/client';

const SESSION_COOKIE_KEY = 'getaway-guide-session-id';
const SESSION_DURATION = 1000 * 60 * 60 * 4; // 4 hours

function createEmptySession(): GetawayGuideSession {
	return {
		locations: [],
		searchResults: [],
		playlist: null
	};
}

// Clean up expired sessions
async function cleanupExpiredSessions(): Promise<void> {
	const now = new Date(Date.now());
	await db.delete(getawayGuideSessions).where(lt(getawayGuideSessions.expiresAt, now)).run();
}

export async function getGetawayGuideSession(cookies: Cookies): Promise<GetawayGuideSession> {
	const sessionId = cookies.get(SESSION_COOKIE_KEY);
	
	if (!sessionId) {
		return createEmptySession();
	}

	try {
		// Cleanup old sessions periodically (10% chance)
		if (Math.random() < 0.1) {
			cleanupExpiredSessions().catch(console.error);
		}

		const session = await db.query.getawayGuideSessions.findFirst({
			where: eq(getawayGuideSessions.id, sessionId)
		});

		if (!session) {
			return createEmptySession();
		}

		// Check if expired
		if (session.expiresAt.getTime() < Date.now()) {
			await db.delete(getawayGuideSessions).where(eq(getawayGuideSessions.id, sessionId)).run();
			cookies.delete(SESSION_COOKIE_KEY, { path: '/' });
			return createEmptySession();
		}

		return JSON.parse(session.sessionData) as GetawayGuideSession;
	} catch (error) {
		console.error('Error loading session:', error);
		return createEmptySession();
	}
}

export async function saveGetawayGuideSession(
	cookies: Cookies,
	session: GetawayGuideSession
): Promise<void> {
	let sessionId = cookies.get(SESSION_COOKIE_KEY);

	// Create new session ID if doesn't exist
	if (!sessionId) {
		sessionId = randomUUID();
		cookies.set(SESSION_COOKIE_KEY, sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: SESSION_DURATION / 1000 // in seconds
		});
	}

	const now = Date.now();
	const expiresAt = new Date(now + SESSION_DURATION);
	const sessionData = JSON.stringify(session);

	try {
		// Try to update existing session first
		const existing = await db.query.getawayGuideSessions.findFirst({
			where: eq(getawayGuideSessions.id, sessionId)
		});

		if (existing) {
			await db
				.update(getawayGuideSessions)
				.set({
					sessionData,
					updatedAt: new Date(now),
					expiresAt
				})
				.where(eq(getawayGuideSessions.id, sessionId))
				.run();
		} else {
			// Insert new session
			await db
				.insert(getawayGuideSessions)
				.values({
					id: sessionId,
					sessionData,
					createdAt: new Date(now),
					updatedAt: new Date(now),
					expiresAt
				})
				.run();
		}
	} catch (error) {
		console.error('Error saving session:', error);
		throw error;
	}
}

// Location management
export function addLocation(session: GetawayGuideSession, name: string): Location {
	const location: Location = {
		id: randomUUID(),
		name,
		sites: []
	};
	session.locations.push(location);
	return location;
}

export function removeLocation(session: GetawayGuideSession, locationId: string): boolean {
	const index = session.locations.findIndex((l) => l.id === locationId);
	if (index === -1) return false;
	session.locations.splice(index, 1);
	return true;
}

export function addSiteToLocation(
	session: GetawayGuideSession,
	locationId: string,
	siteName: string
): boolean {
	const location = session.locations.find((l) => l.id === locationId);
	if (!location) return false;

	location.sites.push({
		id: randomUUID(),
		name: siteName
	});
	return true;
}

// Search results management
export function setSearchResults(
	session: GetawayGuideSession,
	results: LocationWithVideos[]
): void {
	session.searchResults = results;
}

export function getSearchResults(session: GetawayGuideSession): LocationWithVideos[] {
	return session.searchResults;
}

// Playlist management
export function setPlaylist(session: GetawayGuideSession, playlist: PlaylistInfo): void {
	session.playlist = playlist;
}
