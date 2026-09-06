# Vercel Deployment - Quick Setup Guide

**⏱️ Time Required**: 10-15 minutes

## Step 1: Generate CSRF Secret (2 min)

```bash
openssl rand -hex 32
```

Copy the output — you'll need it in the next step.

## Step 2: Set Up Upstash Redis (3 min)

1. Visit: https://upstash.com
2. Sign up (free account)
3. Create a new Redis database
4. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## Step 3: Deploy to Vercel (5 min)

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Set Environment Variables (copy the exact names):

```
NEXT_PUBLIC_API_BASE_URL
  → https://apex-prod-eu-integration.eu.roadnet.com/integration

CSRF_SECRET
  → <paste your 32-hex value from Step 1>

UPSTASH_REDIS_REST_URL
  → <paste from Upstash dashboard>

UPSTASH_REDIS_REST_TOKEN
  → <paste from Upstash dashboard>

FORCE_HTTPS
  → true
```

Optional (if using Airtable):
```
AIRTABLE_TOKEN → <your token>
AIRTABLE_BASE_ID → <your base ID>
AIRTABLE_TABLE_ID → <your table ID>
```

5. Click "Deploy"
6. Wait 2-3 minutes for build to complete

## Step 4: Verify Deployment (1 min)

After deployment completes, test:

```bash
curl https://your-app.vercel.app/api/auth/check

# Should return: {"authenticated":false}
```

## Step 5: Test Rate Limiting (2 min)

```bash
# Get your app URL
APP_URL="https://your-app.vercel.app"

# Test rate limiting with rapid requests
for i in {1..35}; do
  curl -s -w "%{http_code}\n" -o /dev/null \
    "$APP_URL/api/routes?sessionDate=2024-01-01" \
    -H "Cookie: roadnet_token=test"
done

# Results:
# - Requests 1-30: 401 (no valid token, but allowed)
# - Requests 31+: 429 (rate limited!)
```

## Verification Checklist

- [ ] App deployed successfully
- [ ] `/api/auth/check` returns 401 (not authenticated)
- [ ] Rate limiting returns 429 after 30 requests
- [ ] No CSRF_SECRET error in logs
- [ ] Login form loads and works with real ROADNET credentials

## What Was Fixed

| Issue | Fix |
|-------|-----|
| In-memory rate limiter | Upstash Redis (distributed) |
| `admin/admin` hardcoded login | Removed |
| CSRF bypass in dev | Removed |
| Missing CSRF secret check | Now required in production |
| Mock token bypass | Removed |

## Next Steps

1. **Share URL** with team
2. **Test login** with real ROADNET credentials
3. **Enable analytics** in Vercel dashboard
4. **Set up alerts** for deployment failures

## Emergency Contacts

- **Vercel Status**: https://www.vercel-status.com
- **Upstash Status**: https://status.upstash.com
- **ROADNET Support**: Your account manager

## Support

For detailed setup instructions, see: `DEPLOYMENT.md`
For troubleshooting, see: `DEPLOYMENT.md` → Troubleshooting section
