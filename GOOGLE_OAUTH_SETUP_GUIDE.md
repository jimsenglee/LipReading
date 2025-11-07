# Google OAuth Setup Guide

## Issue: redirect_uri_mismatch Error

This error occurs when the redirect URI in your Google Cloud Console doesn't match exactly what your application sends to Google.

## Step-by-Step Fix

### 1. Check Your Current Backend Configuration

Your backend is configured with:
- **Redirect URI**: `http://127.0.0.1:5000/api/auth/google/callback`
- **Client ID**: `74789830583-i43e13l6f6qml4d1nr05iks17f4b45mb.apps.googleusercontent.com`
- **Client Secret**: `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`

These are in: `backend/app/config.py` (lines 40-42)

### 2. Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project: **LipReadingProject-477315**
3. Navigate to: **APIs & Services** > **Credentials**

### 3. Find or Create OAuth 2.0 Client ID

**If you see "No OAuth clients to display":**
1. Click **"+ Create credentials"** > **"OAuth client ID"**
2. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (for testing)
   - App name: **LipReading**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through the steps

**If OAuth client already exists:**
1. Click on your OAuth 2.0 Client ID to edit it

### 4. Configure Authorized Redirect URIs

In the OAuth client configuration, under **"Authorized redirect URIs"**, add these EXACT URIs (one per line):

```
http://127.0.0.1:5000/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

**Important Notes:**
- `127.0.0.1` and `localhost` are treated as DIFFERENT by Google, so add both
- The path must be EXACT: `/api/auth/google/callback`
- No trailing slashes
- Must match the protocol (`http://` not `https://` for localhost)

### 5. Save and Update Your Backend

After saving in Google Console, your backend should work. The redirect URI is already configured in `backend/app/config.py`.

### 6. Test the Configuration

1. Start your backend: `python run.py` (should run on port 5000)
2. Start your frontend: `npm run dev` (should run on port 8080)
3. Try logging in with Google
4. Check backend logs for any errors

### 7. Common Issues

**Issue: Still getting redirect_uri_mismatch**
- Double-check the redirect URI in Google Console matches EXACTLY
- Make sure you saved the changes in Google Console
- Wait a few minutes for changes to propagate
- Clear browser cache and try again

**Issue: OAuth consent screen not configured**
- You must configure the OAuth consent screen before creating OAuth clients
- Go to **APIs & Services** > **OAuth consent screen**
- Complete all required fields

**Issue: Client ID/Secret not working**
- Make sure you're using the correct Client ID and Secret
- Check that the OAuth client is enabled in Google Console
- Verify the project is correct

## Current Configuration Summary

**Backend Config** (`backend/app/config.py`):
```python
GOOGLE_CLIENT_ID = '74789830583-i43e13l6f6qml4d1nr05iks17f4b45mb.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = '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'
GOOGLE_REDIRECT_URI = 'http://127.0.0.1:5000/api/auth/google/callback'
```

**What to add in Google Console:**
- Authorized redirect URI: `http://127.0.0.1:5000/api/auth/google/callback`
- Also add: `http://localhost:5000/api/auth/google/callback` (for compatibility)

## Debugging

If issues persist, check backend logs when clicking "Sign in with Google":
- Look for `[DEBUG]` messages in the OAuth flow
- Check for any error messages about redirect URI mismatch
- Verify the authorization URL being generated

