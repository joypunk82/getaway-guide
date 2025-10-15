import {
	addSiteToLocation,
	getGetawayGuideSession,
	saveGetawayGuideSession
} from '$lib/server/getaway-guide/session';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
		console.error('Failed to add site:', error);
		return json({ success: false, message: 'Failed to add site' }, { status: 500 });
	}
};
