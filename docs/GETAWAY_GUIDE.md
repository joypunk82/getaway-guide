# Getaway Guide Feature

## Overview

Getaway Guide helps you plan your vacation by creating a YouTube playlist of videos for the destinations you want to visit. Build a list of locations and the specific sites you want to see, then let the app search YouTube and compile the best videos into a custom playlist.

## Features

- **Location Management**: Add multiple vacation destinations
- **Site Tracking**: For each location, add specific sites/attractions you want to visit
- **Smart Video Search**: Automatically searches YouTube for relevant videos based on your locations and sites
- **Playlist Creation**: Creates an actual YouTube playlist with your selected videos
- **Session-Based**: Your data is stored in-session, perfect for one-time trip planning
- **Quota-Efficient**: Designed to minimize YouTube API quota usage

## Setup

### 1. YouTube API Key

You need a YouTube Data API v3 key to search for videos.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your `.env` file:

```env
YOUTUBE_API_KEY=your_api_key_here
```

### 2. YouTube OAuth (for Playlist Creation)

To create playlists on behalf of users, you need OAuth credentials.

1. In Google Cloud Console, go to "Credentials"
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:8008/api/getaway-guide/auth/callback` (adjust for your domain)
4. Add OAuth credentials to your `.env` file:

```env
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:8008/api/getaway-guide/auth/callback
```

## Usage Flow

1. **Add Locations**: Start by adding vacation destinations (e.g., "Paris", "Tokyo")
2. **Add Sites**: For each location, add specific sites you want to visit (e.g., "Eiffel Tower", "Louvre Museum")
3. **Search Videos**: Click "Search for Videos" to find YouTube videos for all your locations
4. **Review Results**: Browse the video results organized by location
5. **Select Videos**: Choose which videos you want in your playlist
6. **Create Playlist**: Click "Create Playlist on YouTube" to authenticate and create your playlist

## API Quota Management

The feature is designed to be quota-efficient:

### Search Operation
- **Cost**: 100 units per site
- **Example**: 3 locations with 2 sites each = 600 units
- **Optimization**: Max 2 videos per site by default

### Playlist Creation
- **Cost**: 50 units to create + 50 units per video added
- **Example**: Playlist with 20 videos = 50 + (20 × 50) = 1,050 units

### Daily Quota
- **Default limit**: 10,000 units/day
- **Estimated usage**: Can handle ~15 locations with 2 sites each + playlist creation

## Architecture

### Components
- **LocationCard**: Displays a location with its sites
- **LocationForm**: Simple form to add new locations
- **SiteForm**: Adds sites to a specific location
- **VideoCard**: Displays YouTube video with thumbnail and metadata

### API Routes
- `POST /api/getaway-guide/locations` - Add location
- `DELETE /api/getaway-guide/locations/[id]` - Remove location
- `POST /api/getaway-guide/locations/[id]/sites` - Add site to location
- `POST /api/getaway-guide/search` - Search YouTube for videos
- `POST /api/getaway-guide/playlist` - Create YouTube playlist
- `GET /api/getaway-guide/auth/login` - Initiate YouTube OAuth
- `GET /api/getaway-guide/auth/callback` - OAuth callback handler

### Data Flow
1. User data stored in HTTP-only cookies as session
2. Session expires after 4 hours
3. OAuth tokens stored separately with refresh capability
4. Search results cached in session to avoid redundant API calls

## Security

- Session data stored in HTTP-only cookies
- OAuth state parameter for CSRF protection
- Access tokens automatically refreshed when expired
- No database storage (session-only data)

## Future Enhancements

Potential improvements:
- Add date ranges to locations
- Support for filtering by video duration
- Save favorite locations for future trips
- Export location list to other formats
- Integration with travel planning APIs
