# ROADNET Dashboard - Security Audit & Hardening Report

**Audit Date**: 2026-09-06
**Status**: ✅ All Critical Issues Fixed
**Ready for Vercel Deployment**: YES

---

## Executive Summary

The ROADNET dashboard has been hardened for production deployment with 4 critical security fixes implemented. All issues blocking Vercel deployment have been resolved.

### Key Improvements
- **Rate Limiting**: Upgraded from in-memory to distributed Redis (Upstash)
- **Authentication**: Removed hardcoded admin bypass, mock tokens, and CSRF bypass
- **Secrets Management**: All credentials moved to Vercel Environment Variables
- **Security Headers**: Enhanced headers for HSTS, XSS, and framing protection

---

## Vulnerability Assessment

### CRITICAL Issues (Fixed)

#### 1. In-Memory Rate Limiter ✅ FIXED
**Severity**: CRITICAL
**Status**: Fixed - Upstash Redis implemented

**Problem**:
- In-memory rate limiter uses `Map<string, RateLimitEntry>` stored in process memory
- Each Vercel serverless instance has its own memory space
- Request to Instance A followed by request to Instance B = no rate limiting
- Attacker can bypass rate limits with parallel requests to different instances

**Previous Code**:
```typescript
// ❌ Vulnerable: in-memory only
const requestCounts = new Map<string, RateLimitEntry>();
export function checkRateLimit(identifier: string, ...): boolean {
  // Checks only this instance's memory
}
```

**Fix Applied**:
```typescript
// ✅ Secure: uses distributed Redis
async function redisIncrement(key: string, windowMs: number): Promise<number> {
  const response = await fetch(`${redisUrl}/incr/${key}`, {
    headers: { 'Authorization': `Bearer ${redisToken}` }
  });
  // ... set expiration with TTL
}
```

**Verification**:
- [x] Rate limit checks are now async
- [x] Uses Upstash REST API for distributed counting
- [x] Automatic TTL expiration (no data leak)
- [x] Fallback to in-memory for development

**Deployment Requirement**:
```env
UPSTASH_REDIS_REST_URL=https://YOUR-NAME.upstash.io
UPSTASH_REDIS_REST_TOKEN=AexAAA...
```

---

#### 2. Hardcoded Admin Login ✅ FIXED
**Severity**: CRITICAL
**Status**: Fixed - admin/admin completely removed

**Problem**:
- `admin/admin` login allowed in non-production environments
- Anyone knowing this credential could bypass ROADNET authentication
- Hardcoded bypass in `/api/auth/login` route

**Previous Code**:
```typescript
// ❌ Vulnerable: hardcoded bypass
if (process.env.NODE_ENV !== 'production' && username === 'admin' && password === 'admin') {
  const res = NextResponse.json({ token: 'mock-token-dev', success: true });
  res.cookies.set('roadnet_token', 'mock-token-dev', { ... });
  return res; // ← Direct auth bypass!
}
```

**Fix Applied**:
```typescript
// ✅ Secure: removed entirely
// Now flows directly to real ROADNET authentication
const response = await fetch(`${baseUrl}/v1/login`, {
  method: 'POST',
  body: JSON.stringify({ username, password })
  // Must authenticate against real API
});
```

**Verification**:
- [x] No `admin` username check in login route
- [x] No mock token generation in login route
- [x] All authentication flows through real ROADNET API

---

#### 3. CSRF Token Bypass ✅ FIXED
**Severity**: CRITICAL
**Status**: Fixed - bypass removed, validation enforced

**Problem**:
- Development bypass in mock-login route skipped CSRF validation
- `isDev && !csrfValid` = access granted without CSRF check
- Any attacker could forge requests in development environment
- Mock endpoint bypassed CSRF on every environment

**Previous Code**:
```typescript
// ❌ Vulnerable: CSRF can be bypassed in dev
const isDev = process.env.NODE_ENV !== 'production';
const csrfValid = csrfToken && csrfHeader && verifyCSRFToken(...);

if (!isDev && !csrfValid) { // ← CSRF check skipped if isDev=true!
  return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
}
```

**Fix Applied**:
```typescript
// ✅ Secure: always require CSRF validation
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json(
    { error: 'Mock login is not available in production' },
    { status: 403 }
  );
}

// Even in dev, require CSRF validation
if (!csrfToken || !csrfHeader || !verifyCSRFToken(csrfHeader) || csrfHeader !== csrfToken) {
  return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
}
```

**Verification**:
- [x] CSRF validation always enforced (no bypass)
- [x] Mock login disabled in production with 403 error
- [x] Development mode still requires valid CSRF token

---

#### 4. Weak/Missing CSRF Secret ✅ FIXED
**Severity**: CRITICAL
**Status**: Fixed - required in production, error thrown on startup

**Problem**:
- Default fallback: `'dev-insecure-secret-change-in-production'`
- If `CSRF_SECRET` env var missing in production, insecure default used
- No startup validation to catch missing secret before deployment
- Silent failure = all CSRF tokens could be forged

**Previous Code**:
```typescript
// ❌ Vulnerable: insecure default, no validation
const CSRF_SECRET = process.env.CSRF_SECRET || 'dev-insecure-secret-change-in-production';
// If env var missing, defaults to hardcoded secret!
```

**Fix Applied**:
```typescript
// ✅ Secure: required in production, fails loudly if missing
const CSRF_SECRET = process.env.CSRF_SECRET || getDefaultCSRFSecret();

function getDefaultCSRFSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL: CSRF_SECRET environment variable is required in production. ' +
      'Generate with: openssl rand -hex 32'
    );
  }
  // Development only: generate temporary secret
  return crypto.randomBytes(32).toString('hex');
}
```

**Verification**:
- [x] Production deployment fails immediately if CSRF_SECRET missing
- [x] Development generates temporary random secret (no hardcoded default)
- [x] Clear error message with remediation instructions

**Deployment Requirement**:
```bash
# Generate once per deployment environment
CSRF_SECRET=$(openssl rand -hex 32)
# Add to Vercel Environment Variables
```

---

## Additional Security Enhancements

### Security Headers
- ✅ **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- ✅ **X-Frame-Options: DENY** - Prevents clickjacking
- ✅ **X-XSS-Protection: 1; mode=block** - XSS protection
- ✅ **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer leakage
- ✅ **Permissions-Policy** - Disables geolocation, microphone, camera
- ✅ **Strict-Transport-Security: max-age=31536000** - HSTS for HTTPS enforcement

**Config Locations**:
- `vercel.json` (Vercel-specific headers)
- `next.config.js` (Next.js headers)

### Environment Variable Security
- ✅ All secrets moved to Vercel Environment Variables
- ✅ No secrets in `.env.local` committed to git
- ✅ `.env.example` documents required variables (NO VALUES)
- ✅ Clear comments about which vars are secrets

### Mock Token Removal
- ✅ Removed mock-token-dev acceptance from `/api/routes`
- ✅ Mock login endpoint disabled in production
- ✅ Development mode still usable with valid CSRF tokens

---

## Files Modified

| File | Changes | Risk |
|------|---------|------|
| `src/lib/rateLimiter.ts` | Upstash Redis async client | Low - backward compatible fallback |
| `src/app/api/auth/login/route.ts` | Removed admin bypass | None - feature removal |
| `src/app/api/auth/mock-login/route.ts` | Enforce CSRF, disable in prod | None - stricter security |
| `src/app/api/routes/route.ts` | Await async rate limit, remove mock token | Low - behavioral improvement |
| `src/lib/csrf.ts` | Require secret in production | Low - development unaffected |
| `.env.example` | Added comprehensive documentation | None - documentation only |
| `vercel.json` | NEW - Vercel deployment config | None - deployment file |
| `DEPLOYMENT.md` | NEW - Setup & verification guide | None - documentation |

---

## Deployment Checklist

Before deploying to Vercel:

- [ ] **CSRF_SECRET generated**: `openssl rand -hex 32`
- [ ] **Upstash Redis created**: Database and credentials obtained
- [ ] **Vercel Environment Variables set**:
  - [ ] `NEXT_PUBLIC_API_BASE_URL`
  - [ ] `CSRF_SECRET`
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`
  - [ ] `FORCE_HTTPS=true`
- [ ] **Optional Airtable variables** (if using address verification):
  - [ ] `AIRTABLE_TOKEN`
  - [ ] `AIRTABLE_BASE_ID`
  - [ ] `AIRTABLE_TABLE_ID`
- [ ] **No credentials in git**: Verify `.env.local` not committed

## Post-Deployment Verification

After deployment to Vercel:

```bash
APP_URL="https://your-app.vercel.app"

# Test 1: Verify rate limiting works
echo "Testing rate limiting..."
for i in {1..35}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/routes?sessionDate=2024-01-01" \
    -H "Cookie: roadnet_token=test")
  [ $i -le 30 ] && [ "$STATUS" != "429" ] && echo "✓ Request $i: $STATUS (allowed)" || \
  [ $i -gt 30 ] && [ "$STATUS" == "429" ] && echo "✓ Request $i: $STATUS (rate limited)" || \
  echo "✗ Request $i: $STATUS (unexpected)"
done

# Test 2: Verify admin bypass removed
echo "Testing admin bypass removed..."
curl -X POST "$APP_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | grep -q "Authentication failed" && \
echo "✓ Admin bypass removed" || echo "✗ Admin bypass still present"

# Test 3: Verify mock login disabled
echo "Testing mock login disabled..."
curl -X POST "$APP_URL/api/auth/mock-login" -s | grep -q "not available" && \
echo "✓ Mock login disabled in production" || echo "✗ Mock login still accessible"
```

---

## Monitoring & Maintenance

### Rate Limiter Health
- Monitor Upstash dashboard for Redis commands
- Check for unusual patterns (potential bot attacks)
- Alert if rate limit hits exceed 5% of requests

### CSRF Token Health
- Monitor CSRF validation failures in logs
- Should be < 0.1% of login attempts
- Sudden spike indicates potential attack

### Secret Rotation
- Rotate CSRF_SECRET every 90 days
- Generate new value: `openssl rand -hex 32`
- Update Vercel Environment Variables and redeploy

---

## Conclusion

All 4 critical security issues have been fixed:

1. ✅ **In-memory rate limiter** → Upstash Redis
2. ✅ **Hardcoded admin login** → Removed
3. ✅ **CSRF token bypass** → Enforcement added
4. ✅ **Weak/missing CSRF secret** → Required with validation

The dashboard is now **ready for secure Vercel deployment**.

**Next Step**: Follow `VERCEL_SETUP_QUICK_GUIDE.md` or `DEPLOYMENT.md` for deployment instructions.

---

**Document Version**: 1.0  
**Last Updated**: 2026-09-06  
**Status**: ✅ All Issues Resolved
