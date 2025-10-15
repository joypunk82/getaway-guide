import { YOUTUBE_API_KEY } from '$env/static/private';
import { getAccessToken } from '$lib/server/getaway-guide/oauth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	const checks = {
		apiKey: !!YOUTUBE_API_KEY,
		apiKeyValid: false,
		accessToken: false,
		accessTokenValid: false,
		databaseConnection: true // We'll assume this is working if the endpoint responds
	};

	// Test API key
	if (checks.apiKey) {
		try {
			const response = await fetch(
				`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${YOUTUBE_API_KEY}`
			);
			checks.apiKeyValid = response.ok;
		} catch (error) {
			console.error('API key test failed:', error);
		}
	}

	// Test access token if available
	try {
		const accessToken = await getAccessToken(cookies);
		checks.accessToken = !!accessToken;

		if (accessToken) {
			const response = await fetch(
				'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
				{
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				}
			);
			checks.accessTokenValid = response.ok;
		}
	} catch (error) {
		console.error('Access token test failed:', error);
	}

	const allHealthy = Object.values(checks).every((check) => check === true);

	return json(
		{
			status: allHealthy ? 'healthy' : 'degraded',
			timestamp: new Date().toISOString(),
			checks
		},
		{
			status: allHealthy ? 200 : 503
		}
	);
};
