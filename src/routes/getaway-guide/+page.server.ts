import { getGetawayGuideSession } from '$lib/server/getaway-guide/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = await getGetawayGuideSession(cookies);

	return {
		locations: session.locations
	};
};
