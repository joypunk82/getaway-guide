import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { parseVacationGuide, validateGuideFile } from '$lib/utils/getaway-guide-parser';
import { getGetawayGuideSession, saveGetawayGuideSession, addLocation, addSiteToLocation } from '$lib/server/getaway-guide/session';

/**
 * POST /api/getaway-guide/import
 * Upload and parse a vacation guide file to import locations and sites
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'No file uploaded' }, { status: 400 });
		}

		// Validate file
		const validationError = validateGuideFile(file);
		if (validationError) {
			return json({ error: validationError }, { status: 400 });
		}

		// Read file content
		const fileContent = await file.text();

		// Parse the guide
		const { locations, errors } = parseVacationGuide(fileContent);

		if (locations.length === 0) {
			return json(
				{
					error: 'No locations could be parsed from the file',
					details: errors
				},
				{ status: 400 }
			);
		}

		// Get current session and add locations
		let session = await getGetawayGuideSession(cookies);

		// Add each location to the session
		for (const location of locations) {
			// Add location (returns the created location object)
			const newLocation = addLocation(session, location.name);
			
			// Add each site to the location
			for (const site of location.sites) {
				addSiteToLocation(session, newLocation.id, site.name);
			}
		}

		// Save updated session
		await saveGetawayGuideSession(cookies, session);

		return json({
			success: true,
			locationsAdded: locations.length,
			sitesAdded: locations.reduce((sum, loc) => sum + loc.sites.length, 0),
			locations: locations.map(loc => ({
				name: loc.name,
				siteCount: loc.sites.length
			})),
			warnings: errors.length > 0 ? errors : undefined
		});

	} catch (error) {
		console.error('Import error:', error);
		return json(
			{
				error: 'Failed to import guide file',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
