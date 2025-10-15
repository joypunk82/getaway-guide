import { getAccessToken } from '$lib/server/getaway-guide/oauth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const accessToken = await getAccessToken(cookies);
		return json({
			authenticated: !!accessToken
		});
	} catch (error) {
		console.error('Error checking auth status:', error);
		return json({
			authenticated: false
		});
	}
};
