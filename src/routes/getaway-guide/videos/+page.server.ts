import type { PageServerLoad } from './$types';
import { getGetawayGuideSession, getSearchResults } from '$lib/server/getaway-guide/session';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = await getGetawayGuideSession(cookies);
	const searchResults = getSearchResults(session);

	// Redirect back if no search results
	if (searchResults.length === 0) {
		throw redirect(303, '/getaway-guide');
	}

	return {
		searchResults
	};
};
