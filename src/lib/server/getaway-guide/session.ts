import type { Cookies } from '@sveltejs/kit';
import type {
	Location,
	GetawayGuideSession,
	LocationWithVideos,
	PlaylistInfo
} from '$lib/types/getaway-guide';
import { randomUUID } from 'crypto';
import { getSession, saveSession, deleteSession } from '$lib/server/db/postgres-client';

const SESSION_COOKIE_KEY = 'getaway-guide-session-id';
const SESSION_DURATION = 1000 * 60 * 60 * 4; // 4 hours

function createEmptySession(): GetawayGuideSession {
	return {
		locations: [],
		searchResults: [],
		playlist: null
	};
}

export async function getGetawayGuideSession(cookies: Cookies): Promise<GetawayGuideSession> {
	const sessionId = cookies.get(SESSION_COOKIE_KEY);
	
	if (!sessionId) {
		return createEmptySession();
	}

	try {
		const sessionData = await getSession(sessionId);

		if (!sessionData) {
			return createEmptySession();
		}

		// Check if expired
		if (sessionData.expiresAt.getTime() < Date.now()) {
			await deleteSession(sessionId);
			cookies.delete(SESSION_COOKIE_KEY, { path: '/' });
			return createEmptySession();
		}

		return sessionData.sessionData;
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

	try {
		await saveSession(sessionId, session);
	} catch (error) {
		console.error('Error saving session:', error);
		throw new Error('Failed to save session');
	}
}

export async function clearGetawayGuideSession(cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE_KEY);
	
	if (sessionId) {
		await deleteSession(sessionId);
	}
	
	cookies.delete(SESSION_COOKIE_KEY, { path: '/' });
}

// Session data management functions
export function getLocations(session: GetawayGuideSession): Location[] {
	return session.locations;
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