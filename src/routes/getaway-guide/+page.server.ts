import type { PageServerLoad } from './$types';
import { getGetawayGuideSession } from '$lib/server/getaway-guide/session';

export const load: PageServerLoad = async ({ cookies }) => {
	console.log('[DEBUG] Loading getaway-guide page...');
	const session = await getGetawayGuideSession(cookies);
	console.log('[DEBUG] Session loaded for page - locations:', session.locations.length);
	console.log('[DEBUG] Location IDs on page load:', session.locations.map(l => l.id));
	
	// Log sites for each location
	session.locations.forEach((location, index) => {
		console.log(`[DEBUG] Location ${index} (${location.name}) has ${location.sites.length} sites:`, location.sites.map(s => s.name));
	});
	
	return {
		locations: session.locations
	};
};
