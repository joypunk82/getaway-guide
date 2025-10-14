import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { YOUTUBE_REDIRECT_URI } from '$env/static/private';

export const GET: RequestHandler = async () => {
	return json({
		redirect_uri: YOUTUBE_REDIRECT_URI,
		timestamp: new Date().toISOString(),
		message: 'OAuth config test endpoint'
	});
};