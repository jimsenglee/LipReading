# Google OAuth Redirect Fix

## Problem
After selecting a Google account, you were being redirected to `http://localhost:5173/auth/google/callback` but your frontend is running on `http://localhost:8080`, causing `ERR_CONNECTION_REFUSED`.

## Root Cause
The backend was configured to redirect to `http://localhost:5173` (the default Vite port) but your frontend is actually running on `http://localhost:8080`.

## Solution Applied

### 1. Updated Backend Configuration
- **File**: `backend/app/config.py`
- **Change**: Updated default `FRONTEND_URL` from `http://localhost:5173` to `http://localhost:8080`

### 2. Added Environment Variable
- **File**: `backend/.flaskenv`
- **Added**: `FRONTEND_URL=http://localhost:8080`
- This ensures the backend always uses the correct frontend URL

## Important: Google Console Configuration

**You do NOT need to change your Google Console settings!**

The redirect URI in Google Console should remain:
- `http://127.0.0.1:5000/api/auth/google/callback` (backend callback)

This is correct because:
1. Google redirects to the **backend** callback URL (`/api/auth/google/callback`)
2. The backend then processes the OAuth and redirects to the **frontend** (`/auth/google/callback`)
3. The frontend URL is controlled by `FRONTEND_URL` in the backend config, not Google Console

## How It Works

```
User clicks "Sign in with Google"
    ↓
Frontend redirects to: http://127.0.0.1:5000/api/auth/google/login
    ↓
Backend redirects to: Google OAuth page
    ↓
User selects account
    ↓
Google redirects to: http://127.0.0.1:5000/api/auth/google/callback (backend)
    ↓
Backend processes OAuth, generates token
    ↓
Backend redirects to: http://localhost:8080/auth/google/callback?token=... (frontend)
    ↓
Frontend GoogleCallback component handles the token
    ↓
User is logged in and redirected to dashboard
```

## Testing

1. **Restart your backend** to load the new configuration:
   ```bash
   cd backend
   # Stop current server (Ctrl+C)
   # Start again
   python run.py
   ```

2. **Test Google Login**:
   - Go to `http://localhost:8080/login`
   - Click "Sign in with Google"
   - Select your account
   - Should redirect to `http://localhost:8080/auth/google/callback` (not 5173)
   - Should successfully log you in

3. **Check Backend Logs**:
   - Look for `[DEBUG] Google OAuth:` messages
   - Should show the correct redirect URL

## If Issues Persist

1. **Clear browser cache** - old redirects might be cached
2. **Check backend logs** - look for `[DEBUG]` messages about redirect URLs
3. **Verify frontend is running** on `http://localhost:8080`
4. **Verify backend is running** on `http://127.0.0.1:5000`

## Summary

✅ **Fixed**: Backend now redirects to `http://localhost:8080` instead of `http://localhost:5173`
✅ **No Google Console changes needed**: The backend callback URL is correct
✅ **Frontend route exists**: `/auth/google/callback` is already configured in your React Router

Just restart your backend and try again!

