import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { getYouTubeAuthUrl } from '$lib/server/getaway-guide/oauth';
import { randomUUID } from 'crypto';

export const GET: RequestHandler = async ({ cookies, url }) => {
	// Generate state for CSRF protection
	const state = randomUUID();
	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10 // 10 minutes
	});

	// Store the redirect URL if provided
	const redirectTo = url.searchParams.get('redirect') || '/getaway-guide/videos';
	cookies.set('oauth_redirect', redirectTo, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10 // 10 minutes
	});

	const authUrl = getYouTubeAuthUrl(state);
	throw redirect(302, authUrl);
};
