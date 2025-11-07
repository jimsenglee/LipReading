# Authentication Features Implementation Plan

## User Rules to Follow
- Always use lowercase for comments, write proper comments like real world developer
- DO NOT oversimplify—follow the existing workflow, including data preparation and navigation
- Don't stop at errors, check linter/build. Keep fixing until functionally correct
- Add debug code for better traceability
- Follow the README.txt workflow and DRY, Reusability, Consistency, Readability
- Read files line by line and check the seed, model, backend API, etc. for the root cause, not just frontend
- Do not make assumptions on database patterns or code structure—always check and refer to model/schema/API/service
- Never duplicate logic—always reuse or call utilities/components if they exist
- Do not add new files or structures without checking for similar code patterns in other modules first

## Priority Order (Implementation Sequence)

### Phase 1: Remember Me Feature (Highest Priority - Simple)
### Phase 2: Forgot Password Feature (High Priority - Email Required)
### Phase 3: Google OAuth Login (Medium Priority - External Integration)
### Phase 4: Two-Factor Authentication (Medium Priority - Security Enhancement)

---

## PHASE 1: REMEMBER ME FEATURE

### Backend Tasks

#### 1.1 Update AuthService.login_user
**File**: `backend/app/services/auth_service.py`
- Add `remember_me: bool = False` parameter
- Update token expiration logic:
  - If `remember_me=True`: `expires_delta=timedelta(days=30)` (30 days)
  - If `remember_me=False`: `expires_delta=timedelta(hours=24)` (24 hours)
- Log login activity to `LoginActivity` table:
  - Extract IP address from request (`request.remote_addr`)
  - Extract device info from User-Agent header
  - Create new `LoginActivity` record with user_id, timestamp, ip_address, device_info

#### 1.2 Update auth.py API endpoint
**File**: `backend/app/api/auth.py`
- Update `/login` route to accept `remember_me` from request JSON
- Pass `remember_me` to `AuthService.login_user()`

#### 1.3 Log Login Activity
**File**: `backend/app/services/auth_service.py`
- Import `LoginActivity` model
- Create `log_login_activity(user_id, ip_address, device_info)` method
- Call this method in `login_user()` after successful authentication

### Frontend Tasks

#### 1.4 Update Login Component
**File**: `frontend/src/pages/auth/Login.tsx`
- Add checkbox: "Remember Me" below password field
- Add state: `const [rememberMe, setRememberMe] = useState(false)`
- Pass `remember_me: rememberMe` to `loginMutation.mutateAsync()`

#### 1.5 Update useLogin Mutation
**File**: `frontend/src/services/auth/authMutations.ts`
- Update mutation function to accept `remember_me` parameter
- Pass `remember_me` to `apiClient.login()`

#### 1.6 Update API Client
**File**: `frontend/src/lib/api.ts`
- Update `login()` method to accept `remember_me?: boolean`
- Include `remember_me` in request body

---

## PHASE 2: FORGOT PASSWORD FEATURE

### Backend Tasks

#### 2.1 Create Password Reset Token Model
**File**: `backend/app/models/password_reset_token.py` (NEW)
```python
class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    
    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), nullable=False, index=True)
    token: so.Mapped[str] = so.mapped_column(sa.String(255), unique=True, nullable=False, index=True)
    expires_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False)
    used: so.Mapped[bool] = so.mapped_column(sa.Boolean(), nullable=False, default=False)
    created_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    
    user: so.Mapped['Account'] = so.relationship()
```

#### 2.2 Create Email Service
**File**: `backend/app/utils/email_service.py` (NEW)
- Use Flask-Mail or smtplib
- Configure Gmail SMTP:
  - SMTP server: `smtp.gmail.com`
  - Port: `587` (TLS) or `465` (SSL)
  - Email: `chikiongboon@gmail.com`
  - Password: `ehyizsqusmaqujvz` (app password)
- Methods:
  - `send_password_reset_email(email: str, reset_link: str)`
  - `send_2fa_code_email(email: str, code: str)`

#### 2.3 Update Config
**File**: `backend/app/config.py`
- Add email configuration:
```python
MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT = 587
MAIL_USE_TLS = True
MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'chikiongboon@gmail.com')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'ehyizsqusmaqujvz')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
```

#### 2.4 Add AuthService Methods
**File**: `backend/app/services/auth_service.py`
- `request_password_reset(email: str)`:
  - Find user by email
  - Generate secure token (use `secrets.token_urlsafe(32)`)
  - Create `PasswordResetToken` record (expires in 1 hour)
  - Generate reset link: `{FRONTEND_URL}/reset-password?token={token}`
  - Send email via `EmailService.send_password_reset_email()`
  
- `verify_reset_token(token: str)`:
  - Find token in database
  - Check if expired (`expires_at > datetime.utcnow()`)
  - Check if already used (`used == False`)
  - Return user_id if valid
  
- `reset_password(token: str, new_password: str)`:
  - Verify token using `verify_reset_token()`
  - Validate new password strength
  - Update user's password_hash
  - Mark token as used (`used = True`)
  - Delete expired tokens (cleanup)

#### 2.5 Add API Endpoints
**File**: `backend/app/api/auth.py`
- `POST /auth/forgot-password`: Accept email, call `AuthService.request_password_reset()`
- `GET /auth/verify-reset-token?token=xxx`: Verify token validity
- `POST /auth/reset-password`: Accept token and new_password, call `AuthService.reset_password()`

#### 2.6 Create Schemas
**File**: `backend/app/schemas/auth_schemas.py` (NEW)
- `PasswordResetRequestSchema`: email (required)
- `PasswordResetSchema`: token (required), password (required, min 6 chars)

#### 2.7 Database Migration
**Command**: `flask db migrate -m "add_password_reset_token_table"`
**Command**: `flask db upgrade`

### Frontend Tasks

#### 2.8 Update ForgotPassword Component
**File**: `frontend/src/pages/auth/ForgotPassword.tsx`
- Replace mock API call with real API
- Use `useRequestPasswordReset` mutation
- Handle success/error states properly
- Show loading state during API call

#### 2.9 Update ResetPassword Component
**File**: `frontend/src/pages/auth/ResetPassword.tsx`
- On mount, verify token using `useVerifyResetToken` query
- Replace mock API call with `useResetPassword` mutation
- Handle token expiration/validation errors
- Show proper error messages

#### 2.10 Add API Methods
**File**: `frontend/src/lib/api.ts`
- `requestPasswordReset(email: string)`
- `verifyResetToken(token: string)`
- `resetPassword(token: string, password: string)`

#### 2.11 Add React Query Hooks
**File**: `frontend/src/services/auth/authQueries.ts`
- `useVerifyResetToken(token: string)` - Query to verify token on mount

**File**: `frontend/src/services/auth/authMutations.ts`
- `useRequestPasswordReset()` - Mutation for forgot password
- `useResetPassword()` - Mutation for reset password

---

## PHASE 3: GOOGLE OAUTH LOGIN

### Backend Tasks

#### 3.1 Update Account Model
**File**: `backend/app/models/account.py`
- Add `google_id: so.Mapped[Optional[str]]` field (nullable, for OAuth users)
- Add index on `google_id` for faster lookups

#### 3.2 Install OAuth Library
**File**: `backend/requirements.txt`
- Add: `requests-oauthlib==1.3.1`

#### 3.3 Add Google OAuth Service
**File**: `backend/app/services/oauth_service.py` (NEW)
- Configure Google OAuth:
  - Client ID: `74789830583-i43e13l6f6qml4d1nr05iks17f4b45mb.apps.googleusercontent.com`
  - Client Secret: `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`
  - Redirect URI: `{BACKEND_URL}/api/auth/google/callback`
- Methods:
  - `get_google_auth_url()`: Generate Google OAuth authorization URL
  - `handle_google_callback(code: str)`: Exchange code for user info, create/update user

#### 3.4 Add AuthService Methods
**File**: `backend/app/services/auth_service.py`
- `login_with_google(google_user_info: dict)`:
  - Check if user exists by `google_id` or `email`
  - If exists: Update `google_id` if missing, create `ThirdPartyApp` record for Google
  - If not exists: Create new user with Google info, set `google_id`, create `ThirdPartyApp` record
  - Generate JWT token (same as regular login)
  - Log login activity

#### 3.5 Add API Endpoints
**File**: `backend/app/api/auth.py`
- `GET /auth/google/login`: Redirect to Google OAuth URL
- `GET /auth/google/callback`: Handle OAuth callback, exchange code, call `AuthService.login_with_google()`, redirect to frontend with token

#### 3.6 Update Config
**File**: `backend/app/config.py`
```python
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '74789830583-i43e13l6f6qml4d1nr05iks17f4b45mb.apps.googleusercontent.com')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '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')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/api/auth/google/callback')
```

#### 3.7 Database Migration
**Command**: `flask db migrate -m "add_google_id_to_accounts"`
**Command**: `flask db upgrade`

### Frontend Tasks

#### 3.8 Redesign Login Page
**File**: `frontend/src/pages/auth/Login.tsx`
- Add Google login button below email/password form
- Style: White button with Google logo, "Sign in with Google" text
- Add divider: "OR" between email/password and Google button
- On click: Redirect to `/api/auth/google/login` (backend endpoint)

#### 3.9 Handle OAuth Callback
**File**: `frontend/src/pages/auth/GoogleCallback.tsx` (NEW)
- Extract token from URL query params (backend redirects with `?token=xxx`)
- Store token in localStorage
- Set user in AuthContext
- Redirect to dashboard/admin based on role

#### 3.10 Update App Routes
**File**: `frontend/src/App.tsx`
- Add route: `/auth/google/callback` → `GoogleCallback` component

---

## PHASE 4: TWO-FACTOR AUTHENTICATION (2FA)

### Backend Tasks

#### 4.1 Update User Model
**File**: `backend/app/models/user.py`
- Add `_2fa_secret: so.Mapped[Optional[str]]` field (nullable, stores TOTP secret)
- Keep existing `is_2fa_enabled` field (boolean)

#### 4.2 Install TOTP Library
**File**: `backend/requirements.txt`
- Add: `pyotp==2.9.0`
- Add: `qrcode[pil]==7.4.2` (for QR code generation)

#### 4.3 Add 2FA Service Methods
**File**: `backend/app/services/auth_service.py`
- `generate_2fa_secret(user_id: int)`:
  - Generate TOTP secret using `pyotp.random_base32()`
  - Generate QR code URI: `otpauth://totp/{app_name}:{email}?secret={secret}&issuer={app_name}`
  - Return secret and QR code URI (don't save yet - user must verify first)
  
- `enable_2fa(user_id: int, secret: str, verification_code: str)`:
  - Verify code using `pyotp.TOTP(secret).verify(verification_code, valid_window=1)`
  - If valid: Save secret to `_2fa_secret`, set `is_2fa_enabled=True`
  - Return success
  
- `disable_2fa(user_id: int, password: str)`:
  - Verify user's password
  - Clear `_2fa_secret`, set `is_2fa_enabled=False`
  - Return success
  
- `verify_2fa_code(user_id: int, code: str)`:
  - Get user's `_2fa_secret`
  - Verify code using `pyotp.TOTP(secret).verify(code, valid_window=1)`
  - Return True/False
  
- `send_2fa_code_email(user_id: int)`:
  - Generate 6-digit random code
  - Store code temporarily (in-memory cache with 5-minute expiration) or database
  - Send email via `EmailService.send_2fa_code_email()`
  - Return success (for email-based 2FA alternative)

#### 4.4 Update Login Flow for 2FA
**File**: `backend/app/services/auth_service.py`
- Modify `login_user()`:
  - After password verification, check if `is_2fa_enabled=True`
  - If enabled: Return special response `{"requires_2fa": True, "temp_token": "xxx"}` (not full JWT)
  - Frontend should prompt for 2FA code
  - After 2FA verification, generate full JWT token

#### 4.5 Add API Endpoints
**File**: `backend/app/api/auth.py`
- `POST /auth/2fa/generate`: Generate 2FA secret and QR code URI
- `POST /auth/2fa/enable`: Enable 2FA with verification code
- `POST /auth/2fa/disable`: Disable 2FA (requires password)
- `POST /auth/2fa/verify`: Verify 2FA code during login
- `POST /auth/2fa/send-code`: Send 2FA code via email (alternative method)

#### 4.6 Create Schemas
**File**: `backend/app/schemas/auth_schemas.py`
- `Enable2FASchema`: secret (required), verification_code (required, 6 digits)
- `Disable2FASchema`: password (required)
- `Verify2FASchema`: code (required, 6 digits), temp_token (optional)

#### 4.7 Database Migration
**Command**: `flask db migrate -m "add_2fa_secret_to_users"`
**Command**: `flask db upgrade`

### Frontend Tasks

#### 4.8 Update SecuritySettings Component
**File**: `frontend/src/components/security/SecuritySettings.tsx`
- Connect to real 2FA API endpoints
- Implement `handleEnable2FA()`:
  - Call `useGenerate2FASecret()` to get secret and QR code URI
  - Display QR code using `qrcode.react` library
  - Prompt user to enter verification code
  - Call `useEnable2FA()` with secret and code
- Implement `handleDisable2FA()`:
  - Prompt for password confirmation
  - Call `useDisable2FA()` with password

#### 4.9 Update TwoFactorModal Component
**File**: `frontend/src/components/auth/TwoFactorModal.tsx`
- Connect to real 2FA verification API
- Support both TOTP codes (from authenticator app) and email codes
- Call `useVerify2FA()` mutation
- On success: Complete login flow

#### 4.10 Update Login Flow
**File**: `frontend/src/pages/auth/Login.tsx`
- Handle `requires_2fa` response from login API
- Show `TwoFactorModal` when 2FA is required
- After 2FA verification, complete login with full token

#### 4.11 Add React Query Hooks
**File**: `frontend/src/services/auth/authQueries.ts`
- `useGenerate2FASecret()` - Query to get secret and QR code

**File**: `frontend/src/services/auth/authMutations.ts`
- `useEnable2FA()` - Mutation to enable 2FA
- `useDisable2FA()` - Mutation to disable 2FA
- `useVerify2FA()` - Mutation to verify 2FA code
- `useSend2FACode()` - Mutation to send email code

#### 4.12 Add API Methods
**File**: `frontend/src/lib/api.ts`
- `generate2FASecret()`
- `enable2FA(secret, verificationCode)`
- `disable2FA(password)`
- `verify2FA(code, tempToken?)`
- `send2FACode()`

---

## Testing Checklist

### Remember Me
- [ ] Login with Remember Me unchecked → Token expires in 24 hours
- [ ] Login with Remember Me checked → Token expires in 30 days
- [ ] Verify LoginActivity records are created on each login
- [ ] Verify IP address and device info are logged correctly

### Forgot Password
- [ ] Request password reset with valid email → Email sent
- [ ] Request password reset with invalid email → Error message
- [ ] Click reset link → Token verified, reset form shown
- [ ] Use expired token → Error message
- [ ] Use used token → Error message
- [ ] Reset password with valid token → Password updated, redirected to login

### Google OAuth
- [ ] Click "Sign in with Google" → Redirected to Google
- [ ] Complete Google login → User created/updated, redirected back
- [ ] Verify `google_id` is stored in database
- [ ] Verify `ThirdPartyApp` record is created
- [ ] Verify login activity is logged

### 2FA
- [ ] Generate 2FA secret → QR code displayed
- [ ] Scan QR code in authenticator app → Code generated
- [ ] Enable 2FA with valid code → 2FA enabled
- [ ] Enable 2FA with invalid code → Error message
- [ ] Login with 2FA enabled → 2FA code prompt shown
- [ ] Verify with valid code → Login successful
- [ ] Verify with invalid code → Error message
- [ ] Disable 2FA with password → 2FA disabled
- [ ] Send email code → Code received in email

---

## Files to Create

### Backend
1. `backend/app/models/password_reset_token.py`
2. `backend/app/utils/email_service.py`
3. `backend/app/services/oauth_service.py`
4. `backend/app/schemas/auth_schemas.py`

### Frontend
1. `frontend/src/pages/auth/GoogleCallback.tsx`

---

## Files to Modify

### Backend
1. `backend/app/models/account.py` - Add `google_id` field
2. `backend/app/models/user.py` - Add `_2fa_secret` field
3. `backend/app/services/auth_service.py` - Add all new methods
4. `backend/app/api/auth.py` - Add all new endpoints
5. `backend/app/config.py` - Add email and OAuth config
6. `backend/requirements.txt` - Add new dependencies

### Frontend
1. `frontend/src/pages/auth/Login.tsx` - Add Remember Me, Google button
2. `frontend/src/pages/auth/ForgotPassword.tsx` - Connect to real API
3. `frontend/src/pages/auth/ResetPassword.tsx` - Connect to real API
4. `frontend/src/components/security/SecuritySettings.tsx` - Connect to real 2FA API
5. `frontend/src/components/auth/TwoFactorModal.tsx` - Connect to real API
6. `frontend/src/services/auth/authQueries.ts` - Add new queries
7. `frontend/src/services/auth/authMutations.ts` - Add new mutations
8. `frontend/src/lib/api.ts` - Add new API methods
9. `frontend/src/App.tsx` - Add Google callback route

---

## Dependencies to Add

### Backend
```txt
Flask-Mail==0.9.1  # or use smtplib (built-in)
pyotp==2.9.0  # TOTP generation
qrcode[pil]==7.4.2  # QR code generation
requests-oauthlib==1.3.1  # Google OAuth
```

### Frontend
```json
"qrcode.react": "^3.1.0"  // QR code display
```

---

## Notes

1. **Email Service**: Use Flask-Mail for simplicity, or smtplib for more control. Gmail requires app password (already provided).

2. **Password Reset Tokens**: Store in database with expiration (1 hour). Clean up expired tokens periodically.

3. **2FA Implementation**: Support both TOTP (authenticator apps) and email codes. TOTP is more secure, email is easier for users.

4. **Google OAuth**: Need to configure redirect URI in Google Cloud Console. Use `http://127.0.0.1:5000/api/auth/google/callback` for local development.

5. **Remember Me**: Extend token expiration only if user explicitly checks the box. This is a security vs convenience trade-off.

6. **Login Activity**: Log all login attempts (successful and failed) for security monitoring.

7. **Error Handling**: All API endpoints should return consistent error formats using `ResponseService.error_response()`.

8. **Security**: 
   - Use secure random tokens for password reset
   - Hash passwords with werkzeug (already done)
   - Validate all inputs on backend
   - Rate limit password reset requests (prevent abuse)

