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
		const session = await getGetawayGuideSession(cookies);
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
