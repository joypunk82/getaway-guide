# YouTube API Troubleshooting Guide

## Common "Internal error encountered" Causes & Solutions

### 1. **OAuth Token Issues**

**Symptom**: `Internal error encountered` when creating playlist
**Causes**:

- Expired access token
- Invalid refresh token
- Revoked app permissions
- Incorrect OAuth scopes

**Solutions**:

- Clear browser cookies and re-authenticate
- Check OAuth consent screen is published (not in testing mode)
- Verify required scopes are granted:
  - `https://www.googleapis.com/auth/youtube`
  - `https://www.googleapis.com/auth/youtube.force-ssl`

**Debug Steps**:

```bash
# Check token validation in server logs
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true"
```

### 2. **API Quota Exceeded**

**Symptom**: 500 errors or quota exceeded messages
**Cause**: Daily YouTube API quota limit reached (10,000 units by default)

**Solutions**:

- Wait until quota resets (midnight Pacific Time)
- Request quota increase in Google Cloud Console
- Optimize API usage (reduce video searches)

**Check Quota Usage**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Enabled APIs
3. Click YouTube Data API v3
4. Check "Quotas" tab

### 3. **Invalid Playlist Data**

**Symptom**: 400 or 500 errors during playlist creation
**Causes**:

- Title too long (>150 characters)
- Description too long (>5000 characters)
- Invalid characters in title/description
- Empty or null title

**Solutions**:

- Validate playlist title length
- Remove special characters from title
- Ensure title is not empty

### 4. **Channel Permissions**

**Symptom**: Permission denied or channel access errors
**Causes**:

- User's YouTube channel not properly set up
- Brand accounts with restricted permissions
- Channel suspended or restricted

**Solutions**:

- Ensure user has an active YouTube channel
- Use personal Google account (not brand account if restricted)
- Check channel status in YouTube Studio

### 5. **Network/Regional Issues**

**Symptom**: Intermittent 500 errors
**Causes**:

- YouTube API regional outages
- Network connectivity issues
- Rate limiting

**Solutions**:

- Implement retry logic with exponential backoff
- Check [YouTube API status](https://developers.google.com/youtube/v3/status)
- Add timeout handling

## Debug Commands

### Test API Connection

```bash
# Test API key
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=YOUR_API_KEY"

# Test OAuth token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true"
```

### Check Quota Usage

```bash
# This uses 1 quota unit
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true"
```

## Server-Side Debugging

Add these debug logs to your YouTube API calls:

```typescript
console.log('[DEBUG] API Request:', {
	url,
	method: 'POST',
	headers: { authorization: 'Bearer [REDACTED]' },
	bodyLength: JSON.stringify(body).length
});

console.log('[DEBUG] API Response:', {
	status: response.status,
	statusText: response.statusText,
	ok: response.ok
});
```

## Common Error Codes

| Code | Meaning        | Solution                           |
| ---- | -------------- | ---------------------------------- |
| 400  | Bad Request    | Check request parameters           |
| 401  | Unauthorized   | Re-authenticate with YouTube       |
| 403  | Forbidden      | Check quotas and permissions       |
| 500  | Internal Error | YouTube server issue - retry later |

## Production Checklist

- [ ] OAuth app is published (not in testing)
- [ ] Privacy policy and terms of service accessible
- [ ] Correct redirect URIs configured
- [ ] API quotas sufficient for expected usage
- [ ] Error handling and retry logic implemented
- [ ] Debug logging enabled (temporarily)

## Environment Variables Check

Ensure all required environment variables are set in production:

```env
YOUTUBE_API_KEY=your_api_key
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=https://yourdomain.com/api/getaway-guide/auth/callback
DATABASE_URL=your_database_url
```
