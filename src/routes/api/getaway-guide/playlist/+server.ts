import { getAccessToken } from '$lib/server/getaway-guide/oauth';
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
	try {
		// Check if user is authenticated with YouTube
		const accessToken = await getAccessToken(cookies);
		if (!accessToken) {
			return json(
				{ success: false, message: 'YouTube authentication required', requiresAuth: true },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const validated = createPlaylistSchema.parse(body);

		// Calculate quota cost
		const estimatedCost = estimatePlaylistQuotaCost(validated.videoIds.length);

		// Create the playlist
		const playlist = await createPlaylist(validated.title, validated.description, accessToken);

		// Add videos to the playlist
		const { added, failed } = await addVideosToPlaylist(playlist.id, validated.videoIds, accessToken);

		// Save playlist info to session
		const session = await getGetawayGuideSession(cookies);
		setPlaylist(session, {
			id: playlist.id,
			title: playlist.title,
			url: `https://www.youtube.com/playlist?list=${playlist.id}`,
			videoCount: added
		});
		await saveGetawayGuideSession(cookies, session);

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
			return json({ success: false, errors: error.issues }, { status: 400 });
		}
		console.error('Playlist creation error:', error);
		return json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to create playlist'
			},
			{ status: 500 }
		);
	}
};
