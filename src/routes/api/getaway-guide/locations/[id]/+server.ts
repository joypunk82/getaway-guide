import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import {
	getGetawayGuideSession,
	saveGetawayGuideSession,
	removeLocation,
	addSiteToLocation
} from '$lib/server/getaway-guide/session';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	const { id } = params;

	try {
		console.log('[DEBUG] Deleting location:', id);
		const session = await getGetawayGuideSession(cookies);
		console.log('[DEBUG] Session before delete - locations:', session.locations.length);
		console.log('[DEBUG] Location IDs before delete:', session.locations.map(l => l.id));
		
		const success = removeLocation(session, id);
		console.log('[DEBUG] Remove location success:', success);
		
		if (!success) {
			console.log('[DEBUG] Location not found for deletion');
			return json({ success: false, message: 'Location not found' }, { status: 404 });
		}

		console.log('[DEBUG] Session after delete - locations:', session.locations.length);
		console.log('[DEBUG] Location IDs after delete:', session.locations.map(l => l.id));
		
		console.log('[DEBUG] Saving session after location deletion...');
		await saveGetawayGuideSession(cookies, session);
		console.log('[DEBUG] Location deleted and session saved successfully');
		return json({ success: true });
	} catch (error) {
		console.error('[ERROR] Failed to delete location:', error);
		return json({ success: false, message: 'Failed to delete location' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const { id } = params;

	try {
		const body = await request.json();
		const { siteName } = body;

		if (!siteName || typeof siteName !== 'string') {
			return json({ success: false, message: 'Site name is required' }, { status: 400 });
		}

		const session = await getGetawayGuideSession(cookies);
		const success = addSiteToLocation(session, id, siteName);

		if (!success) {
			return json({ success: false, message: 'Location not found' }, { status: 404 });
		}

		await saveGetawayGuideSession(cookies, session);
		return json({ success: true });
	} catch (error) {
		return json({ success: false, message: 'Failed to add site' }, { status: 500 });
	}
};
