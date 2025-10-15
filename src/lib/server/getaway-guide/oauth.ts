import {
	YOUTUBE_CLIENT_ID,
	YOUTUBE_CLIENT_SECRET,
	YOUTUBE_REDIRECT_URI
} from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
	'https://www.googleapis.com/auth/youtube',
	'https://www.googleapis.com/auth/youtube.force-ssl'
];

const TOKEN_COOKIE_KEY = 'yt_access_token';
const REFRESH_TOKEN_COOKIE_KEY = 'yt_refresh_token';
const TOKEN_EXPIRY_COOKIE_KEY = 'yt_token_expiry';

interface TokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
}

/**
 * Generate the YouTube OAuth URL for user authentication
 */
export function getYouTubeAuthUrl(state: string): string {
	const url = new URL(GOOGLE_OAUTH_URL);
	url.searchParams.set('client_id', YOUTUBE_CLIENT_ID);
	url.searchParams.set('redirect_uri', YOUTUBE_REDIRECT_URI);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('scope', SCOPES.join(' '));
	url.searchParams.set('access_type', 'offline');
	url.searchParams.set('prompt', 'consent');
	url.searchParams.set('state', state);

	return url.toString();
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
	const response = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			code,
			client_id: YOUTUBE_CLIENT_ID,
			client_secret: YOUTUBE_CLIENT_SECRET,
			redirect_uri: YOUTUBE_REDIRECT_URI,
			grant_type: 'authorization_code'
		})
	});

	if (!response.ok) {
		const error = await response.json();
		console.error('Token exchange failed:', error);
		throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
	}

	const tokenData = await response.json();
	return tokenData;
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
	const response = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			refresh_token: refreshToken,
			client_id: YOUTUBE_CLIENT_ID,
			client_secret: YOUTUBE_CLIENT_SECRET,
			grant_type: 'refresh_token'
		})
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
	}

	return response.json();
}

/**
 * Save tokens to cookies
 */
export function saveTokens(cookies: Cookies, tokenData: TokenResponse): void {
	const expiryTime = Date.now() + tokenData.expires_in * 1000;

	cookies.set(TOKEN_COOKIE_KEY, tokenData.access_token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: tokenData.expires_in
	});

	if (tokenData.refresh_token) {
		cookies.set(REFRESH_TOKEN_COOKIE_KEY, tokenData.refresh_token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365 // 1 year
		});
	}

	cookies.set(TOKEN_EXPIRY_COOKIE_KEY, expiryTime.toString(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: tokenData.expires_in
	});
}

/**
 * Get access token from cookies, refreshing if necessary
 */
export async function getAccessToken(cookies: Cookies): Promise<string | null> {
	const accessToken = cookies.get(TOKEN_COOKIE_KEY);
	const expiryTime = cookies.get(TOKEN_EXPIRY_COOKIE_KEY);
	const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE_KEY);

	// If no access token, return null
	if (!accessToken) {
		return null;
	}

	// Check if token is expired
	if (expiryTime && Date.now() >= parseInt(expiryTime)) {
		// Try to refresh
		if (refreshToken) {
			try {
				const newTokenData = await refreshAccessToken(refreshToken);
				saveTokens(cookies, newTokenData);
				return newTokenData.access_token;
			} catch (error) {
				console.error('Token refresh failed:', error);
				clearTokens(cookies);
				return null;
			}
		}
		// Token expired and no refresh token
		clearTokens(cookies);
		return null;
	}

	return accessToken;
}

/**
 * Clear all auth tokens
 */
export function clearTokens(cookies: Cookies): void {
	cookies.delete(TOKEN_COOKIE_KEY, { path: '/' });
	cookies.delete(REFRESH_TOKEN_COOKIE_KEY, { path: '/' });
	cookies.delete(TOKEN_EXPIRY_COOKIE_KEY, { path: '/' });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(cookies: Cookies): boolean {
	return cookies.get(TOKEN_COOKIE_KEY) !== undefined;
}

/**
 * Validate access token by making a test API call to YouTube
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
	try {
		const response = await fetch(
			'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/json'
				}
			}
		);

		return response.ok;
	} catch (error) {
		console.error('Token validation failed:', error);
		return false;
	}
}
