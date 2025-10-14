import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import {
	getGetawayGuideSession,
	saveGetawayGuideSession,
	setSearchResults
} from '$lib/server/getaway-guide/session';
import { searchVideosForLocation, estimateSearchQuotaCost } from '$lib/server/getaway-guide/youtube';
import type { LocationWithVideos } from '$lib/types/getaway-guide';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const session = await getGetawayGuideSession(cookies);

		if (session.locations.length === 0) {
			return json({ success: false, message: 'No locations to search' }, { status: 400 });
		}

		// Calculate quota cost
		const totalSites = session.locations.reduce((sum, loc) => sum + loc.sites.length, 0);
		const estimatedCost = estimateSearchQuotaCost(1, totalSites);
		console.log(`Estimated quota cost: ${estimatedCost} units`);

		const searchResults: LocationWithVideos[] = [];

		// Search for videos for each location
		for (const location of session.locations) {
			if (location.sites.length === 0) {
				continue;
			}

			const videos = await searchVideosForLocation(
				location.name,
				location.sites.map((s) => s.name),
				2 // Max 2 videos per site
			);

			searchResults.push({
				...location,
				videos
			});
		}

		// Save search results to session
		setSearchResults(session, searchResults);
		await saveGetawayGuideSession(cookies, session);

		return json({ success: true, results: searchResults });
	} catch (error) {
		console.error('Search error:', error);
		return json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to search for videos'
			},
			{ status: 500 }
		);
	}
};
