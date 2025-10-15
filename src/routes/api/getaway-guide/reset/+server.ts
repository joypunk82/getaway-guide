import { getGetawayGuideSession, saveGetawayGuideSession } from '$lib/server/getaway-guide/session';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const session = await getGetawayGuideSession(cookies);

		// Clear all locations and sites
		session.locations = [];
		session.searchResults = [];

		await saveGetawayGuideSession(cookies, session);
		return json({ success: true });
	} catch (error) {
		console.error('Failed to reset session:', error);
		return json({ success: false, message: 'Failed to reset data' }, { status: 500 });
	}
};
