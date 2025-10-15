# OAuth Production Setup Guide

## Problem

Your app is currently in "Testing" mode, which only allows pre-approved test users to authenticate. Production users get `access_denied` errors.

## Solution: Publish Your OAuth App

### Step 1: Complete OAuth Consent Screen Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Complete ALL required fields:

#### Required Information:

- **App name**: "Getaway Guide" (or your preferred name)
- **User support email**: Your email address
- **App logo**: Optional but recommended (120x120px)
- **App domain**: Your production domain (e.g., `getawayguide.vercel.app`)
- **Authorized domains**:
  - Add your production domain: `getawayguide.vercel.app`
  - Add your development domain if needed: `localhost`
- **Developer contact information**: Your email address

#### App Description (Required):

```
Getaway Guide helps you plan vacations by creating custom YouTube playlists for your destinations. Add locations and attractions you want to visit, then we'll search YouTube for the best travel videos and compile them into a personalized playlist for your trip planning.
```

#### Privacy Policy URL (Required):

You need to create and host a privacy policy. Example URL:
`https://getawayguide.vercel.app/privacy-policy`

#### Terms of Service URL (Recommended):

Example URL: `https://getawayguide.vercel.app/terms-of-service`

### Step 2: Configure OAuth Scopes

1. In **OAuth consent screen**, go to **Scopes**
2. Add the scopes your app needs:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.force-ssl`

### Step 3: Publish Your App

1. After completing all fields, click **PUBLISH APP**
2. Google will review your app (this can take a few days to weeks)
3. During review, your app will show a "verification required" warning but will still work

### Step 4: Update OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Update **Authorized redirect URIs**:
   - Production: `https://getawayguide.vercel.app/api/getaway-guide/auth/callback`
   - Development: `http://localhost:5173/api/getaway-guide/auth/callback`

### Step 5: Update Environment Variables

Update your production environment variables in Vercel:

```env
YOUTUBE_REDIRECT_URI=https://getawayguide.vercel.app/api/getaway-guide/auth/callback
```

## Quick Fix for Immediate Testing

If you need immediate access for more users while waiting for verification:

1. Go to **OAuth consent screen** → **Test users**
2. Add email addresses of users who need access
3. This allows up to 100 test users

## Verification Process

Google's verification process checks:

- ✅ Privacy Policy exists and is accessible
- ✅ App description accurately describes functionality
- ✅ Scopes are appropriate for app functionality
- ✅ Domain ownership is verified
- ✅ App follows Google's OAuth policies

## Common Issues

**Issue**: "This app isn't verified" warning
**Solution**: This is normal during review. Users can click "Advanced" → "Go to Getaway Guide (unsafe)" to continue.

**Issue**: Domain verification fails
**Solution**: Ensure your domain is added to "Authorized domains" and you have control over it.

**Issue**: Privacy policy not accessible
**Solution**: Create and host a privacy policy at the URL you specified.
