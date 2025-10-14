import type { RequestHandler } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { exchangeCodeForToken, saveTokens } from '$lib/server/getaway-guide/oauth';

export const GET: RequestHandler = async ({ url, cookies }) => {
	console.log('[DEBUG] OAuth callback reached');
	console.log('[DEBUG] Full URL:', url.toString());
	
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	console.log('[DEBUG] Code:', code ? 'present' : 'missing');
	console.log('[DEBUG] State:', state);
	console.log('[DEBUG] Error param:', errorParam);

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
		console.log('[DEBUG] Attempting token exchange...');
		const tokenData = await exchangeCodeForToken(code);
		console.log('[DEBUG] Token exchange successful');
		
		saveTokens(cookies, tokenData);
		console.log('[DEBUG] Tokens saved');

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
