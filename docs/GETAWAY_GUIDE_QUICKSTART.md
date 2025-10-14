# Getaway Guide - Quick Start Guide

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory (you can copy from `.env.example`):

```bash
cp .env.example .env
```

Then fill in the required YouTube API credentials:

```env
YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:5173/api/getaway-guide/auth/callback
```

### 2. Get YouTube API Credentials

#### API Key (for searching videos):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key to `.env`

#### OAuth Credentials (for creating playlists):
1. In Google Cloud Console, go to Credentials
2. Create Credentials → OAuth 2.0 Client ID
3. Application type: Web application
4. Add authorized redirect URI: `http://localhost:5173/api/getaway-guide/auth/callback`
5. Copy Client ID and Client Secret to `.env`

### 3. Run the Application

```bash
npm run dev
```

Navigate to `http://localhost:5173/getaway-guide`

## Usage

### Step 1: Add Locations
- Enter a destination name (e.g., "Paris", "Rome", "Tokyo")
- Click "Add Location"

### Step 2: Add Sites
- For each location, click "+ Site"
- Add specific attractions or sites you want to see
- Examples: "Eiffel Tower", "Louvre Museum", "Notre Dame"

### Step 3: Search for Videos
- Once you have locations with sites, click "Search for Videos"
- The app will search YouTube and find relevant videos
- This uses API quota: ~100 units per site

### Step 4: Review and Select Videos
- Browse videos organized by location
- Click on videos to select them for your playlist
- Use "Select All" / "Deselect All" for quick selection

### Step 5: Create Playlist
- Enter a title for your playlist
- Optionally add a description
- Click "Create Playlist on YouTube"
- You'll be redirected to sign in to YouTube (first time only)
- After authentication, your playlist will be created automatically

## API Quota Notes

YouTube API has a daily quota of 10,000 units by default:
- **Search**: 100 units per site
- **Create Playlist**: 50 units
- **Add Video**: 50 units per video

**Example calculation**:
- 3 locations with 2 sites each = 600 units (search)
- Playlist with 12 selected videos = 50 + (12 × 50) = 650 units
- **Total**: 1,250 units

You can process multiple vacations per day within the quota!

## Troubleshooting

### "Module has no exported member" errors
- Make sure you've created a `.env` file with the required variables
- Restart the dev server after adding environment variables

### "Authentication required" when creating playlist
- This is normal! Click the button and you'll be redirected to sign in
- Grant the necessary YouTube permissions
- You'll be redirected back with the playlist created

### No videos found
- Check that your API key is valid and the YouTube Data API is enabled
- Try more specific site names
- Ensure you have sites added to your locations

### Quota exceeded
- Wait until the next day (quotas reset at midnight Pacific Time)
- Or request a quota increase in Google Cloud Console

## Tips

- Be specific with site names for better video results
- Limit to 2-3 sites per location to conserve quota
- Select your favorite videos to keep playlist length manageable
- Session data expires after 4 hours of inactivity
