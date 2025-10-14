import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import {
	getGetawayGuideSession,
	saveGetawayGuideSession,
	addSiteToLocation
} from '$lib/server/getaway-guide/session';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const { id } = params;

	try {
		console.log('[DEBUG] Adding site to location:', id);
		const body = await request.json();
		const { siteName } = body;
		console.log('[DEBUG] Site name:', siteName);

		if (!siteName || typeof siteName !== 'string') {
			console.log('[DEBUG] Invalid site name');
			return json({ success: false, message: 'Site name is required' }, { status: 400 });
		}

		console.log('[DEBUG] Getting session...');
		const session = await getGetawayGuideSession(cookies);
		console.log('[DEBUG] Session locations:', session.locations.length);
		console.log('[DEBUG] Location IDs:', session.locations.map(l => l.id));
		
		// Log sites before adding
		const targetLocation = session.locations.find(l => l.id === id);
		if (targetLocation) {
			console.log('[DEBUG] Target location sites before adding:', targetLocation.sites.length);
			console.log('[DEBUG] Existing site names:', targetLocation.sites.map(s => s.name));
		}
		
		const success = addSiteToLocation(session, id, siteName);
		console.log('[DEBUG] Add site success:', success);

		if (!success) {
			console.log('[DEBUG] Location not found in session');
			return json({ success: false, message: 'Location not found' }, { status: 404 });
		}

		// Log sites after adding
		if (targetLocation) {
			console.log('[DEBUG] Target location sites after adding:', targetLocation.sites.length);
			console.log('[DEBUG] Updated site names:', targetLocation.sites.map(s => s.name));
		}

		console.log('[DEBUG] Saving session...');
		await saveGetawayGuideSession(cookies, session);
		console.log('[DEBUG] Site added and session saved successfully');
		return json({ success: true });
	} catch (error) {
		console.error('[ERROR] Failed to add site:', error);
		return json({ success: false, message: 'Failed to add site' }, { status: 500 });
	}
};
