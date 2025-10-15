import { YOUTUBE_API_KEY } from '$env/static/private';
import { getAccessToken } from '$lib/server/getaway-guide/oauth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	const checks = {
		apiKey: !!YOUTUBE_API_KEY,
		apiKeyValid: false,
		userAuthenticated: false,
		userTokenValid: false,
		databaseConnection: true // We'll assume this is working if the endpoint responds
	};

	let systemHealthy = true; // Track if core system components are healthy

	// Test API key (required for system functionality)
	if (checks.apiKey) {
		try {
			const response = await fetch(
				`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${YOUTUBE_API_KEY}`
			);
			checks.apiKeyValid = response.ok;
			if (!checks.apiKeyValid) {
				systemHealthy = false; // API key issues are system problems
			}
		} catch (error) {
			console.error('API key test failed:', error);
			systemHealthy = false;
		}
	} else {
		systemHealthy = false; // No API key is a system problem
	}

	// Test access token if available (user-specific, not system health)
	try {
		const accessToken = await getAccessToken(cookies);
		checks.userAuthenticated = !!accessToken;

		if (accessToken) {
			const response = await fetch(
				'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
				{
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				}
			);
			checks.userTokenValid = response.ok;
			// Note: User token issues don't affect system health
		}
	} catch (error) {
		console.error('Access token test failed:', error);
		// User auth errors don't make the system unhealthy
	}

	// Determine overall status
	const status = systemHealthy ? 'healthy' : 'degraded';
	const httpStatus = systemHealthy ? 200 : 503;

	return json(
		{
			status,
			timestamp: new Date().toISOString(),
			checks,
			message: systemHealthy
				? 'All core systems operational'
				: 'Core system components have issues - check API key and configuration'
		},
		{
			status: httpStatus
		}
	);
};
