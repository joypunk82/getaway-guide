import { exchangeCodeForToken, saveTokens } from '$lib/server/getaway-guide/oauth';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	// Check for OAuth errors
	if (errorParam) {
		console.error('OAuth error:', errorParam);
		throw redirect(303, '/getaway-guide?auth_error=' + errorParam);
	}

	// Validate state for CSRF protection
	const savedState = cookies.get('oauth_state');
	if (!state || state !== savedState) {
		throw error(400, 'Invalid state parameter');
	}

	// Exchange code for token
	if (!code) {
		throw error(400, 'Missing authorization code');
	}

	try {
		const tokenData = await exchangeCodeForToken(code);
		saveTokens(cookies, tokenData);

		// Clear OAuth cookies
		cookies.delete('oauth_state', { path: '/' });

		// Redirect to saved URL or default
		const redirectTo = cookies.get('oauth_redirect') || '/getaway-guide/videos';
		cookies.delete('oauth_redirect', { path: '/' });

		throw redirect(303, redirectTo);
	} catch (err) {
		console.error('[ERROR] Token exchange failed:', err);
		console.error('[ERROR] Error message:', err instanceof Error ? err.message : 'Unknown error');
		console.error('[ERROR] Full error object:', JSON.stringify(err, null, 2));
		throw redirect(303, '/getaway-guide?auth_error=token_exchange_failed');
	}
};
