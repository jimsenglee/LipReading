# Authentication Testing Guide

## Prerequisites

1. **Backend Running**: Make sure Flask backend is running on `http://127.0.0.1:5000`
2. **Frontend Running**: Make sure React frontend is running on `http://localhost:8080`
3. **Database**: Ensure database is properly set up and seeded

## Test 1: Forgot Password

### Steps:
1. Navigate to `http://localhost:8080/login`
2. Click "Forgot your password?" link
3. Enter a **valid registered email** in the forgot password form
4. Click "Send Reset Link"
5. Check backend console logs for `[DEBUG]` messages
6. Check your email inbox (and spam folder) for the reset link

### Expected Backend Logs:
```
[DEBUG] password reset requested for email: user@example.com
[DEBUG] password reset: user found - user_id: X, email: user@example.com
[DEBUG] password reset: generated token (first 10 chars): ...
[DEBUG] password reset: token saved to database for user_id: X
[DEBUG] password reset: generated reset link: http://localhost:5173/reset-password?token=...
[DEBUG] password reset: attempting to send email to: user@example.com
[DEBUG] email service: preparing to send email to user@example.com
[DEBUG] email service: SMTP server: smtp.gmail.com, port: 587, use_tls: True
[DEBUG] email service: connecting to SMTP server...
[DEBUG] email service: starting TLS...
[DEBUG] email service: logging in...
[DEBUG] email service: sending message...
[DEBUG] email service: email sent successfully to user@example.com
[DEBUG] password reset: email sent successfully to user@example.com
```

### Test with Invalid Email:
1. Enter a **non-existent email** (e.g., `nonexistent@example.com`)
2. Click "Send Reset Link"
3. Should show success message (security - doesn't reveal if email exists)
4. Check backend logs - should show:
```
[DEBUG] password reset: user not found for email: nonexistent@example.com
```

### Troubleshooting:
- **No email received**: Check SMTP credentials in `backend/app/config.py`
- **SMTP errors**: Check backend logs for authentication errors
- **Token not working**: Verify `FRONTEND_URL` in backend config matches your frontend URL

## Test 2: Remember Me Functionality

### Steps:
1. Navigate to `http://localhost:8080/login`
2. Enter valid credentials
3. **Check** the "Remember Me" checkbox
4. Click "Sign In"
5. Check backend console logs

### Expected Backend Logs (with Remember Me):
```
[DEBUG] login: remember_me=True, token expires in 30 days
[DEBUG] login: JWT token generated successfully for user_id: X
```

### Test Without Remember Me:
1. Navigate to `http://localhost:8080/login`
2. Enter valid credentials
3. **Uncheck** the "Remember Me" checkbox (or leave it unchecked)
4. Click "Sign In"
5. Check backend console logs

### Expected Backend Logs (without Remember Me):
```
[DEBUG] login: remember_me=False, token expires in 24 hours
[DEBUG] login: JWT token generated successfully for user_id: X
```

### Verify Token Expiration:
1. Open browser DevTools (F12)
2. Go to Application/Storage > Local Storage
3. Find the `token` key
4. Copy the token value
5. Use a JWT decoder (e.g., jwt.io) to decode the token
6. Check the `exp` field - should be:
   - **With Remember Me**: ~30 days from now
   - **Without Remember Me**: ~24 hours from now

## Test 3: Google OAuth Login

### Prerequisites:
- Google OAuth must be configured in Google Cloud Console (see `GOOGLE_OAUTH_SETUP_GUIDE.md`)
- Redirect URIs must match exactly

### Steps:
1. Navigate to `http://localhost:8080/login`
2. Click "Sign in with Google" button
3. Should redirect to Google login page
4. After authentication, should redirect back to your app
5. Check backend console logs

### Expected Backend Logs:
```
[DEBUG] Google OAuth: client_id: 74789830583-i43e13l6...
[DEBUG] Google OAuth: redirect_uri: http://127.0.0.1:5000/api/auth/google/callback
[DEBUG] Google OAuth: generated authorization URL (first 100 chars): https://accounts.google.com/o/oauth2/v2/auth?...
[DEBUG] Google OAuth callback: received authorization code (first 10 chars): ...
[DEBUG] Google OAuth callback: using redirect_uri: http://127.0.0.1:5000/api/auth/google/callback
[DEBUG] Google OAuth callback: exchanging code for token...
[DEBUG] Google OAuth callback: successfully exchanged code for token
[DEBUG] Google OAuth callback: retrieved user info - email: user@gmail.com
```

### Troubleshooting:
- **redirect_uri_mismatch**: Check Google Cloud Console - redirect URI must match exactly
- **OAuth client not found**: Create OAuth 2.0 Client ID in Google Cloud Console
- **Consent screen not configured**: Configure OAuth consent screen first

## Test 4: Check Debug Logs

### All Authentication Flows Should Include Debug Messages:

1. **Login Flow**: Look for `[DEBUG] login:` messages
2. **Password Reset Flow**: Look for `[DEBUG] password reset:` messages
3. **Email Sending**: Look for `[DEBUG] email service:` messages
4. **Google OAuth**: Look for `[DEBUG] Google OAuth:` messages

### How to View Logs:

**Backend (Flask):**
- Check the terminal/console where Flask is running
- All `[DEBUG]` messages will appear in real-time

**Frontend (React):**
- Open browser DevTools (F12)
- Go to Console tab
- Look for any error messages or debug logs

## Common Issues and Solutions

### Issue: Email Not Sending
**Solution:**
1. Check SMTP credentials in `backend/app/config.py`
2. Verify Gmail app password is correct (not regular password)
3. Check backend logs for SMTP authentication errors
4. Ensure `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` are set correctly

### Issue: Remember Me Not Working
**Solution:**
1. Check backend logs to verify `remember_me` value is received
2. Verify token expiration in JWT token (decode it)
3. Check browser localStorage for token persistence
4. Clear browser cache and try again

### Issue: Google OAuth Not Working
**Solution:**
1. Follow `GOOGLE_OAUTH_SETUP_GUIDE.md` step-by-step
2. Verify redirect URI matches exactly in Google Console
3. Check backend logs for OAuth errors
4. Ensure OAuth consent screen is configured

### Issue: No Debug Logs Appearing
**Solution:**
1. Ensure Flask is running in debug mode (`FLASK_DEBUG=1` in `.flaskenv`)
2. Check that logger level is set to DEBUG
3. Verify backend code has `[DEBUG]` log statements

## Success Criteria

✅ **Forgot Password**: Email sent successfully, reset link works, debug logs appear
✅ **Remember Me**: Token expiration matches (30 days vs 24 hours), debug logs show correct values
✅ **Google OAuth**: Login works, redirects properly, debug logs show OAuth flow
✅ **Debug Logs**: All flows include comprehensive `[DEBUG]` messages

## Next Steps

After successful testing:
1. Document any issues found
2. Verify all features work as expected
3. Check email delivery (may take a few minutes)
4. Test on different browsers if needed

