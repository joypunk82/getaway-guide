import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getGetawayGuideSession, saveGetawayGuideSession } from '$lib/server/getaway-guide/session';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		console.log('[DEBUG] Reset - clearing all session data');
		const session = await getGetawayGuideSession(cookies);
		
		// Clear all locations and sites
		session.locations = [];
		session.searchResults = [];
		
		await saveGetawayGuideSession(cookies, session);
		console.log('[DEBUG] Reset - session cleared successfully');
		
		return json({ success: true });
	} catch (error) {
		console.error('Failed to reset session:', error);
		return json({ success: false, message: 'Failed to reset data' }, { status: 500 });
	}
};