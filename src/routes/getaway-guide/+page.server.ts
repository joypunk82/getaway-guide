import type { PageServerLoad } from './$types';
import { getGetawayGuideSession } from '$lib/server/getaway-guide/session';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = await getGetawayGuideSession(cookies);
	
	return {
		locations: session.locations
	};
};
