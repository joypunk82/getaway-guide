export type LocationID = string;
export type SiteID = string;
export type VideoID = string;

export interface Site {
	id: SiteID;
	name: string;
}

export interface Location {
	id: LocationID;
	name: string;
	sites: Site[];
}

export interface YouTubeVideo {
	id: VideoID;
	title: string;
	channelTitle: string;
	thumbnailUrl: string;
	description: string;
	publishedAt: string;
	duration: string; // ISO 8601 duration format (e.g., "PT4M13S")
	viewCount: number;
}

export interface LocationWithVideos extends Location {
	videos: YouTubeVideo[];
}

export interface PlaylistInfo {
	id: string;
	title: string;
	url: string;
	videoCount: number;
}

// In-memory session storage structure
export interface GetawayGuideSession {
	locations: Location[];
	searchResults: LocationWithVideos[];
	playlist: PlaylistInfo | null;
}
