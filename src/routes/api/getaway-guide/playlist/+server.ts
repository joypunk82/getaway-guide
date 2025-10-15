import { getAccessToken, validateAccessToken } from '$lib/server/getaway-guide/oauth';
import {
	getGetawayGuideSession,
	saveGetawayGuideSession,
	setPlaylist
} from '$lib/server/getaway-guide/session';
import {
	addVideosToPlaylist,
	createPlaylist,
	estimatePlaylistQuotaCost
} from '$lib/server/getaway-guide/youtube';
import { createPlaylistSchema } from '$lib/server/validation/getaway-guide';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('[DEBUG] Playlist creation request started');

	try {
		// Check if user is authenticated with YouTube
		const accessToken = await getAccessToken(cookies);
		if (!accessToken) {
			console.log('[DEBUG] No access token found');
			return json(
				{ success: false, message: 'YouTube authentication required', requiresAuth: true },
				{ status: 401 }
			);
		}

		console.log('[DEBUG] Access token found, validating...');

		// Validate the access token
		const isValidToken = await validateAccessToken(accessToken);
		if (!isValidToken) {
			console.log('[DEBUG] Access token validation failed');
			return json(
				{
					success: false,
					message: 'YouTube authentication expired. Please reconnect.',
					requiresAuth: true
				},
				{ status: 401 }
			);
		}

		console.log('[DEBUG] Access token validated successfully');

		const body = await request.json();
		console.log('[DEBUG] Request body parsed:', {
			title: body.title,
			videoCount: body.videoIds?.length
		});

		const validated = createPlaylistSchema.parse(body);

		console.log('[DEBUG] Playlist data validated:', {
			title: validated.title,
			videoCount: validated.videoIds.length
		});

		// Calculate quota cost
		const estimatedCost = estimatePlaylistQuotaCost(validated.videoIds.length);
		console.log('[DEBUG] Estimated quota cost:', estimatedCost);

		// Create the playlist
		console.log('[DEBUG] Creating playlist...');
		const playlist = await createPlaylist(validated.title, validated.description, accessToken);
		console.log('[DEBUG] Playlist created:', { id: playlist.id, title: playlist.title });

		// Add videos to the playlist
		console.log('[DEBUG] Adding videos to playlist...');
		const { added, failed } = await addVideosToPlaylist(playlist.id, validated.videoIds, accessToken);
		console.log('[DEBUG] Videos added:', { added, failed });

		// Save playlist info to session
		const session = await getGetawayGuideSession(cookies);
		setPlaylist(session, {
			id: playlist.id,
			title: playlist.title,
			url: `https://www.youtube.com/playlist?list=${playlist.id}`,
			videoCount: added
		});
		await saveGetawayGuideSession(cookies, session);

		console.log('[DEBUG] Playlist creation completed successfully');

		return json({
			success: true,
			playlist: {
				id: playlist.id,
				title: playlist.title,
				url: `https://www.youtube.com/playlist?list=${playlist.id}`,
				added,
				failed
			},
			playlistUrl: `https://www.youtube.com/playlist?list=${playlist.id}`
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.log('[DEBUG] Validation error:', error.issues);
			return json({ success: false, errors: error.issues }, { status: 400 });
		}

		console.error('[ERROR] Playlist creation error:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			error
		});

		// Determine appropriate status code based on error type
		let statusCode = 500;
		let errorMessage = 'Failed to create playlist';

		if (error instanceof Error) {
			if (error.message.includes('authentication') || error.message.includes('401')) {
				statusCode = 401;
				errorMessage = 'YouTube authentication required. Please reconnect your account.';
			} else if (error.message.includes('quota') || error.message.includes('403')) {
				statusCode = 403;
				errorMessage = 'YouTube API quota exceeded. Please try again later.';
			} else if (error.message.includes('400') || error.message.includes('Invalid')) {
				statusCode = 400;
				errorMessage = error.message;
			} else {
				errorMessage = error.message;
			}
		}

		return json(
			{
				success: false,
				message: errorMessage
			},
			{ status: statusCode }
		);
	}
};
