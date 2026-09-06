# ROADNET Dashboard - Vercel Deployment Guide

This guide covers deploying the ROADNET Distribution Dashboard to Vercel with all security hardening measures in place.

## Prerequisites

- GitHub repository with this codebase committed
- Vercel account (free tier works)
- Upstash Redis account (free tier: 10,000 commands/day)
- ROADNET API credentials (username/password)
- Airtable API token (optional, for address verification)

## Step 1: Prepare Your Environment

### 1a. Generate CSRF Secret

Generate a secure 32-character hex secret:

```bash
openssl rand -hex 32
```

Save this value — you'll need it in Vercel settings.

Example output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 1b. Set Up Upstash Redis (Required for Production)

1. Go to https://upstash.com
2. Sign up for free account
3. Create a new Redis database
4. Copy the REST URL and REST Token from the console
5. Save both values for Vercel setup

Example values:
```
UPSTASH_REDIS_REST_URL=https://my-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=AexAAA...
```

> **Why Redis?** The in-memory rate limiter does not work with Vercel's serverless architecture (new instance per request). Redis provides distributed rate limiting across all instances.

## Step 2: Deploy to Vercel

### 2a. Connect Repository

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

### 2b. Set Environment Variables

In the "Environment Variables" section, add ALL of these:

| Variable | Value | Required | Source |
|----------|-------|----------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://apex-prod-eu-integration.eu.roadnet.com/integration` | Yes | ROADNET |
| `CSRF_SECRET` | Your 32-hex value from Step 1a | Yes | Generate |
| `UPSTASH_REDIS_REST_URL` | From Upstash dashboard | Yes | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash dashboard | Yes | Upstash |
| `AIRTABLE_TOKEN` | Your Airtable PAT token | No | Airtable (if using) |
| `AIRTABLE_BASE_ID` | Your Airtable base ID | No | Airtable (if using) |
| `AIRTABLE_TABLE_ID` | Your Airtable table ID | No | Airtable (if using) |
| `FORCE_HTTPS` | `true` | No | Default |

**CRITICAL**: Do NOT paste credentials into git. Add them ONLY to Vercel's Environment Variables UI.

### 2c. Deploy

1. Leave build settings as default (Vercel auto-detects Next.js)
2. Click "Deploy"
3. Wait for build to complete (2-3 minutes)

## Step 3: Verify Security Hardening

After deployment, test these security measures:

### 3a. Rate Limiting Test

```bash
# Get your deployed URL from Vercel
VERCEL_URL="https://your-app.vercel.app"

# Login first
curl -X POST "$VERCEL_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' \
  -c cookies.txt

# Extract token from response or cookies
# Then make 31+ rapid requests to test rate limiting
for i in {1..35}; do
  curl -X GET "$VERCEL_URL/api/routes?sessionDate=2024-01-01" \
    -b cookies.txt \
    -w "Request $i: %{http_code}\n"
done

# You should see:
# Requests 1-30: HTTP 200 (success)
# Requests 31+: HTTP 429 (rate limited)
```

### 3b. Admin Bypass Test (Should Fail)

```bash
curl -X POST "$VERCEL_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Should return: { "error": "Authentication failed" }
# NOT a mock token
```

### 3c. CSRF Bypass Test (Should Fail)

```bash
# Try accessing mock-login in production (should be blocked)
curl -X POST "$VERCEL_URL/api/auth/mock-login" \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return: { "error": "Mock login is not available in production" }
```

### 3d. CSRF Secret Test

In your Vercel Function logs (Vercel dashboard → Deployments → Logs), there should be NO errors about missing CSRF_SECRET. If you see:
```
Error: CRITICAL: CSRF_SECRET environment variable is required in production
```

Then the variable was not set correctly in Vercel.

## Step 4: Airtable Token Rotation (If Using)

If you use the address verification feature with Airtable:

### 4a. Create New Token

1. Go to https://airtable.com/create/tokens
2. Create a new personal access token
3. Set scopes: `data.records:read`, `data.records:write`
4. Add base and table to token permissions
5. Copy the new token

### 4b. Update Vercel

1. In Vercel dashboard: Settings → Environment Variables
2. Update `AIRTABLE_TOKEN` with new token
3. Redeploy: Deployments → Select latest → Redeploy

### 4c. Revoke Old Token

1. Go to https://airtable.com/create/tokens
2. Find the old token and click "Revoke"

## Security Checklist

- [x] **Rate Limiter**: Replaced with Upstash Redis (distributed)
- [x] **Admin Bypass**: Removed `admin/admin` hardcoded login
- [x] **CSRF Bypass**: Removed development bypass
- [x] **CSRF Secret**: Required in production, error thrown if missing
- [x] **Mock Token**: Removed from routes endpoint (no demo mode in prod)
- [x] **Env Vars**: All secrets in Vercel, none in git
- [x] **Security Headers**: Configured in vercel.json and next.config.js
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: geolocation, microphone, camera disabled
  - Strict-Transport-Security: max-age=31536000

## Troubleshooting

### Issue: "CSRF_SECRET environment variable is required in production"

**Solution**: Add `CSRF_SECRET` to Vercel Environment Variables and redeploy.

### Issue: "Rate limit exceeded" errors appear immediately

**Cause**: Upstash Redis URL or Token is incorrect/expired.

**Solution**:
1. Check Upstash dashboard for valid credentials
2. Update in Vercel Environment Variables
3. Redeploy: Deployments → Redeploy

### Issue: Airtable API calls fail (404 or 403)

**Cause**: Token is invalid or doesn't have correct base/table access.

**Solution**:
1. Check Airtable base ID and table ID are correct
2. Create new token with proper scopes and permissions
3. Update all three variables in Vercel

### Issue: Login works locally but fails on Vercel

**Cause**: ROADNET API endpoint or credentials issue.

**Solution**:
1. Verify `NEXT_PUBLIC_API_BASE_URL` is correct in Vercel
2. Test ROADNET API directly: `curl https://apex-prod-eu-integration.eu.roadnet.com/integration/v1/login`
3. Check Vercel Function logs for ROADNET response errors

## Monitoring & Maintenance

### Set Up Error Alerts

1. Vercel dashboard → Settings → Integrations
2. Connect Slack or email for deployment failures
3. Enable function error notifications

### Monitor Rate Limiter Health

Check Upstash dashboard:
1. Go to https://console.upstash.com
2. Select your Redis database
3. View Commands/Requests to ensure rate limiter is working

### Regular Token Rotation

- **CSRF_SECRET**: Rotate every 90 days
  - Generate new secret
  - Update Vercel Environment Variables
  - Redeploy
  - Old tokens in flight will fail (expected)

- **Airtable Token**: Rotate every 90 days (same process as CSRF_SECRET)

## Production Monitoring

### Key Metrics to Track

1. **Rate Limit Hits**: Should be rare for legitimate traffic
   - Check Upstash dashboard for patterns
   - If excessive, may indicate bot attack

2. **API Response Times**: Monitor from Vercel dashboard
   - Should be <200ms for ROADNET calls
   - If >1s, may indicate ROADNET API issues

3. **Error Rate**: Keep < 1%
   - Monitor from Vercel Logs
   - Set up alerts for sudden increases

### Health Check Endpoint

Add to your monitoring:
```bash
curl https://your-app.vercel.app/api/auth/check
```

Should return:
```json
{"authenticated": false}
```

(No session = not authenticated, which is correct when no token present)

## Next Steps

- [ ] Set up Vercel Analytics (Vercel dashboard → Analytics)
- [ ] Configure GitHub branch protection rules
- [ ] Document rollback procedure for emergency
- [ ] Schedule quarterly security review
- [ ] Set up automated backups for Airtable data
