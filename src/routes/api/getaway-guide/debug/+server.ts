import { getGetawayGuideSession } from '$lib/server/getaway-guide/session';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		console.log('[DEBUG] Session debug endpoint called');
		const session = await getGetawayGuideSession(cookies);
		console.log('[DEBUG] Current session state:');
		console.log('[DEBUG] - Total locations:', session.locations.length);
		session.locations.forEach((loc, index) => {
			console.log(
				`[DEBUG] - Location ${index}: ID=${loc.id}, Name=${loc.name}, Sites=${loc.sites.length}`
			);
		});

		return json({
			success: true,
			sessionState: {
				locationCount: session.locations.length,
				locations: session.locations.map((loc) => ({
					id: loc.id,
					name: loc.name,
					siteCount: loc.sites.length
				}))
			}
		});
	} catch (error) {
		console.error('Failed to get session debug info:', error);
		return json({ success: false, message: 'Failed to get session debug info' }, { status: 500 });
	}
};
