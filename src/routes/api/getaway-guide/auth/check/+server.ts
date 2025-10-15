import { getAccessToken, validateAccessToken } from '$lib/server/getaway-guide/oauth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const accessToken = await getAccessToken(cookies);
		
		if (!accessToken) {
			return json({
				authenticated: false,
				message: 'No YouTube authentication found. Please connect your YouTube account.'
			}, { status: 401 });
		}

		// Validate the token
		const isValid = await validateAccessToken(accessToken);
		
		if (!isValid) {
			return json({
				authenticated: true,
				valid: false,
				message: 'YouTube authentication expired. Please reconnect your account.'
			}, { status: 401 });
		}

		// Test playlist creation permissions
		let canCreatePlaylists = false;
		try {
			const response = await fetch(
				'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
				{
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				}
			);
			canCreatePlaylists = response.ok;
		} catch (error) {
			console.error('Playlist permission test failed:', error);
		}

		return json({
			authenticated: true,
			valid: true,
			canCreatePlaylists,
			message: canCreatePlaylists 
				? 'YouTube authentication is working correctly'
				: 'YouTube authentication valid but playlist creation may not work'
		});

	} catch (error) {
		console.error('Auth check error:', error);
		return json({
			authenticated: false,
			message: 'Error checking authentication status'
		}, { status: 500 });
	}
};