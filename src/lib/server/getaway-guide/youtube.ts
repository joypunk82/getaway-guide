import type { YouTubeVideo } from '$lib/types/getaway-guide';
import { YOUTUBE_API_KEY } from '$env/static/private';

// YouTube Data API v3 quota costs:
// - search.list: 100 units per call
// - playlists.insert: 50 units per call
// - playlistItems.insert: 50 units per call
// Daily quota: 10,000 units
//
// Strategy to minimize quota usage:
// - Batch site searches into single query when possible
// - Limit max results per search
// - Cache results in session

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSearchResult {
	id: { videoId: string };
	snippet: {
		title: string;
		description: string;
		channelTitle: string;
		publishedAt: string;
		thumbnails: {
			medium: { url: string };
			high: { url: string };
		};
	};
}

interface YouTubeSearchResponse {
	items: YouTubeSearchResult[];
}

interface YouTubeVideoDetails {
	id: string;
	contentDetails: {
		duration: string; // ISO 8601 format
	};
	statistics: {
		viewCount: string;
	};
}

interface YouTubeVideoDetailsResponse {
	items: YouTubeVideoDetails[];
}

interface YouTubePlaylistResponse {
	id: string;
	snippet: {
		title: string;
	};
}

/**
 * Get video details (duration, view count) for a list of video IDs
 * Cost: 1 unit per call (can fetch up to 50 videos per call)
 * 
 * @param videoIds - Array of YouTube video IDs
 */
async function getVideoDetails(videoIds: string[]): Promise<Map<string, { duration: string; viewCount: number }>> {
	if (!YOUTUBE_API_KEY || videoIds.length === 0) {
		return new Map();
	}

	const details = new Map<string, { duration: string; viewCount: number }>();

	// YouTube API allows up to 50 IDs per request
	const chunks = [];
	for (let i = 0; i < videoIds.length; i += 50) {
		chunks.push(videoIds.slice(i, i + 50));
	}

	for (const chunk of chunks) {
		try {
			const url = new URL(`${YOUTUBE_API_BASE}/videos`);
			url.searchParams.set('part', 'contentDetails,statistics');
			url.searchParams.set('id', chunk.join(','));
			url.searchParams.set('key', YOUTUBE_API_KEY);

			const response = await fetch(url.toString());
			
			if (!response.ok) {
				const error = await response.json();
				console.error('YouTube API error (video details):', error);
				continue; // Skip this chunk if it fails
			}

			const data: YouTubeVideoDetailsResponse = await response.json();

			for (const item of data.items) {
				details.set(item.id, {
					duration: item.contentDetails.duration,
					viewCount: parseInt(item.statistics.viewCount, 10) || 0
				});
			}
		} catch (error) {
			console.error('Failed to fetch video details:', error);
			// Continue with other chunks
		}
	}

	return details;
}

/**
 * Search YouTube for videos related to a location and its sites
 * Cost: 100 units per call
 * 
 * @param locationName - The location name (e.g., "Paris")
 * @param sites - Array of site names (e.g., ["Eiffel Tower", "Louvre"])
 * @param maxResultsPerSite - Max videos to return per site (default: 2)
 */
export async function searchVideosForLocation(
	locationName: string,
	sites: string[],
	maxResultsPerSite: number = 2
): Promise<YouTubeVideo[]> {
	if (!YOUTUBE_API_KEY) {
		throw new Error('YouTube API key not configured');
	}

	if (sites.length === 0) {
		return [];
	}

	// Temporary storage for videos without details
	const tempVideos: Array<Omit<YouTubeVideo, 'duration' | 'viewCount'>> = [];
	const seenVideoIds = new Set<string>();

	// Search for each site individually to get more relevant results
	// This uses more quota but provides better results
	for (const site of sites) {
		const query = `${locationName} ${site}`;
		
		try {
			const url = new URL(`${YOUTUBE_API_BASE}/search`);
			url.searchParams.set('part', 'snippet');
			url.searchParams.set('q', query);
			url.searchParams.set('type', 'video');
			url.searchParams.set('maxResults', maxResultsPerSite.toString());
			url.searchParams.set('key', YOUTUBE_API_KEY);
			url.searchParams.set('order', 'relevance');
			url.searchParams.set('videoEmbeddable', 'true');
			url.searchParams.set('videoSyndicated', 'true');
			url.searchParams.set('relevanceLanguage', 'en');
			url.searchParams.set('regionCode', 'US');

			const response = await fetch(url.toString());
			
			if (!response.ok) {
				const error = await response.json();
				console.error('YouTube API error:', error);
				throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
			}

			const data: YouTubeSearchResponse = await response.json();

			for (const item of data.items) {
				// Avoid duplicate videos
				if (seenVideoIds.has(item.id.videoId)) continue;
				
				seenVideoIds.add(item.id.videoId);
				tempVideos.push({
					id: item.id.videoId,
					title: item.snippet.title,
					channelTitle: item.snippet.channelTitle,
					thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url,
					description: item.snippet.description,
					publishedAt: item.snippet.publishedAt
				});
			}
		} catch (error) {
			console.error(`Failed to search for "${query}":`, error);
			// Continue with other sites even if one fails
		}
	}

	// Fetch video details (duration, view count) for all videos
	// Cost: 1 unit per 50 videos
	const videoIds = tempVideos.map(v => v.id);
	const videoDetails = await getVideoDetails(videoIds);

	// Merge details into videos
	const allVideos: YouTubeVideo[] = tempVideos.map(video => ({
		...video,
		duration: videoDetails.get(video.id)?.duration || 'PT0S',
		viewCount: videoDetails.get(video.id)?.viewCount || 0
	}));

	return allVideos;
}

/**
 * Create a new YouTube playlist
 * Cost: 50 units
 * 
 * @param title - Playlist title
 * @param description - Playlist description
 * @param accessToken - YouTube OAuth access token
 */
export async function createPlaylist(
	title: string,
	description: string | undefined,
	accessToken: string
): Promise<{ id: string; title: string }> {
	const url = `${YOUTUBE_API_BASE}/playlists?part=snippet,status`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			snippet: {
				title,
				description: description || `Created with Getaway Guide`
			},
			status: {
				privacyStatus: 'public' // Can be 'public', 'private', or 'unlisted'
			}
		})
	});

	if (!response.ok) {
		const error = await response.json();
		console.error('YouTube playlist creation error:', error);
		throw new Error(`Failed to create playlist: ${error.error?.message || 'Unknown error'}`);
	}

	const data: YouTubePlaylistResponse = await response.json();
	return {
		id: data.id,
		title: data.snippet.title
	};
}

/**
 * Add a video to a playlist
 * Cost: 50 units per call
 * 
 * @param playlistId - The playlist ID
 * @param videoId - The video ID to add
 * @param accessToken - YouTube OAuth access token
 */
export async function addVideoToPlaylist(
	playlistId: string,
	videoId: string,
	accessToken: string
): Promise<void> {
	const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			snippet: {
				playlistId,
				resourceId: {
					kind: 'youtube#video',
					videoId
				}
			}
		})
	});

	if (!response.ok) {
		const error = await response.json();
		console.error('YouTube add video error:', error);
		throw new Error(`Failed to add video: ${error.error?.message || 'Unknown error'}`);
	}
}

/**
 * Add multiple videos to a playlist (batch operation)
 * Cost: 50 units per video
 * 
 * Note: YouTube API doesn't have true batch insert for playlist items,
 * so we need to make individual calls. To minimize quota impact, we
 * could add error handling to stop if quota is exceeded.
 * 
 * @param playlistId - The playlist ID
 * @param videoIds - Array of video IDs to add
 * @param accessToken - YouTube OAuth access token
 */
export async function addVideosToPlaylist(
	playlistId: string,
	videoIds: string[],
	accessToken: string
): Promise<{ added: number; failed: number }> {
	let added = 0;
	let failed = 0;

	for (const videoId of videoIds) {
		try {
			await addVideoToPlaylist(playlistId, videoId, accessToken);
			added++;
		} catch (error) {
			console.error(`Failed to add video ${videoId}:`, error);
			failed++;
		}
	}

	return { added, failed };
}

/**
 * Calculate estimated quota cost for a search operation
 */
export function estimateSearchQuotaCost(locationCount: number, sitesPerLocation: number): number {
	// Each site requires a separate search (100 units each)
	return locationCount * sitesPerLocation * 100;
}

/**
 * Calculate estimated quota cost for playlist creation
 */
export function estimatePlaylistQuotaCost(videoCount: number): number {
	// Create playlist (50) + add each video (50 each)
	return 50 + (videoCount * 50);
}
