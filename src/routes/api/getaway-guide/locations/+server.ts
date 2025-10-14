import {
	addLocation,
	getGetawayGuideSession,
	saveGetawayGuideSession
} from '$lib/server/getaway-guide/session';
import { createLocationSchema } from '$lib/server/validation/getaway-guide';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		console.log('[DEBUG] GET /api/getaway-guide/locations - fetching session');
		const session = await getGetawayGuideSession(cookies);
		console.log('[DEBUG] Session loaded - locations count:', session.locations.length);
		console.log(
			'[DEBUG] Location details:',
			session.locations.map((l) => ({ id: l.id, name: l.name, sites: l.sites.length }))
		);
		return json({ success: true, locations: session.locations });
	} catch (error) {
		console.error('Failed to get locations:', error);
		return json({ success: false, message: 'Failed to get locations' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const validated = createLocationSchema.parse(body);

		const session = await getGetawayGuideSession(cookies);
		const location = addLocation(session, validated.name);
		await saveGetawayGuideSession(cookies, session);

		return json({ success: true, location });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json({ success: false, errors: error.issues }, { status: 400 });
		}
		return json({ success: false, message: 'Failed to add location' }, { status: 500 });
	}
};
