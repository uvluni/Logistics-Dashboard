# Vercel Deployment Checklist

## Pre-Deployment (Do These First)

### Phase 1: Generate Secrets (5 min)
- [ ] Open terminal/PowerShell
- [ ] Run: `openssl rand -hex 32`
- [ ] Copy the output to a text file (you'll need it)
- [ ] Label it: `CSRF_SECRET`

### Phase 2: Set Up Upstash Redis (3 min)
- [ ] Visit https://upstash.com
- [ ] Click "Sign Up" (free account)
- [ ] Verify email
- [ ] Log in to console
- [ ] Click "Create Database"
- [ ] Choose name: `roadnet-prod` (or similar)
- [ ] Region: EU (Europe) or closest to your location
- [ ] Click "Create"
- [ ] Wait for database to be ready
- [ ] Copy: `UPSTASH_REDIS_REST_URL` → save to text file
- [ ] Copy: `UPSTASH_REDIS_REST_TOKEN` → save to text file

### Phase 3: Prepare GitHub (1 min)
- [ ] Push all commits to GitHub
- [ ] Verify all code is on remote: `git push origin master`
- [ ] No local changes should exist

---

## Vercel Deployment (10 min)

### Phase 4: Connect to Vercel (2 min)
- [ ] Visit https://vercel.com
- [ ] Log in (or create account)
- [ ] Click "Add New" button
- [ ] Select "Project"
- [ ] Authorize GitHub access (if needed)
- [ ] Select your `routes-report` repository
- [ ] Click "Import"

### Phase 5: Configure Environment Variables (5 min)

You should see "Environment Variables" section. Add these EXACTLY:

#### Required Variables

**Variable 1: NEXT_PUBLIC_API_BASE_URL**
```
Name: NEXT_PUBLIC_API_BASE_URL
Value: https://apex-prod-eu-integration.eu.roadnet.com/integration
Environments: All
```
- [ ] Name entered correctly
- [ ] Value copied correctly
- [ ] Click "Add"

**Variable 2: CSRF_SECRET**
```
Name: CSRF_SECRET
Value: <paste your 32-hex value from Phase 1>
Environments: All
```
- [ ] Name is CSRF_SECRET (all caps)
- [ ] Value is your 32-character hex string
- [ ] NOT a placeholder
- [ ] Click "Add"

**Variable 3: UPSTASH_REDIS_REST_URL**
```
Name: UPSTASH_REDIS_REST_URL
Value: <paste from Upstash from Phase 2>
Environments: All
```
- [ ] Name is UPSTASH_REDIS_REST_URL
- [ ] Value from Upstash console (starts with https://)
- [ ] Click "Add"

**Variable 4: UPSTASH_REDIS_REST_TOKEN**
```
Name: UPSTASH_REDIS_REST_TOKEN
Value: <paste from Upstash from Phase 2>
Environments: All
```
- [ ] Name is UPSTASH_REDIS_REST_TOKEN
- [ ] Value from Upstash console (starts with AexAAA... or similar)
- [ ] Click "Add"

**Variable 5: FORCE_HTTPS**
```
Name: FORCE_HTTPS
Value: true
Environments: All
```
- [ ] Name is FORCE_HTTPS
- [ ] Value is `true` (lowercase)
- [ ] Click "Add"

#### Optional Variables (Skip if Not Using)

**If using Airtable address verification:**

```
Name: AIRTABLE_TOKEN
Value: <your token>

Name: AIRTABLE_BASE_ID
Value: <your base ID>

Name: AIRTABLE_TABLE_ID
Value: <your table ID>
```
- [ ] All 3 added if using Airtable
- [ ] Skip if not using address verification

### Phase 6: Deploy (2 min)
- [ ] Scroll down
- [ ] Review settings (should show your repo and all env vars)
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Watch the build logs for any errors
- [ ] Build should complete with: "Deployment complete!"

---

## Post-Deployment Verification (5 min)

### Phase 7: Check Deployment Status (1 min)
- [ ] Vercel dashboard shows: "Ready" (not "Building" or "Error")
- [ ] Green checkmark next to latest deployment
- [ ] Copy your deployment URL (e.g., https://your-app.vercel.app)

### Phase 8: Run Security Tests (3 min)

**Test 1: Health Check**
```bash
curl https://YOUR-APP-URL/api/auth/check
```
Expected response:
```json
{"authenticated":false}
```
- [ ] Returns 200 OK with JSON response
- [ ] Does NOT error or timeout

**Test 2: Verify Admin Bypass Removed**
```bash
curl -X POST https://YOUR-APP-URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```
Expected response:
```json
{"error":"Authentication failed"}
```
- [ ] Returns 401 (not authenticated)
- [ ] Message says "Authentication failed"
- [ ] Does NOT return a mock token

**Test 3: Verify CSRF Protection Active**
```bash
curl https://YOUR-APP-URL/api/auth/mock-login \
  -X POST
```
Expected response:
```json
{"error":"Mock login is not available in production"}
```
- [ ] Returns 403 (forbidden)
- [ ] Message mentions production
- [ ] Mock login is blocked

**Test 4: Check Logs for Errors**
- [ ] Open Vercel dashboard
- [ ] Select "Deployments"
- [ ] Click on latest deployment
- [ ] Click "Logs" tab
- [ ] Search for "error" or "CRITICAL"
- [ ] Should find ZERO ERRORS

### Phase 9: Test with Real Credentials (1 min)
- [ ] Navigate to: https://YOUR-APP-URL
- [ ] You should see the login form
- [ ] Login fields should be empty (no hardcoded values)
- [ ] Try login with your ROADNET credentials
- [ ] Should successfully authenticate
- [ ] Should display routes/dashboard

---

## Final Checklist

- [ ] All environment variables added to Vercel
- [ ] Deployment completed successfully
- [ ] No errors in build logs
- [ ] Health check test passed
- [ ] Admin bypass test passed (returns error)
- [ ] CSRF protection test passed (mock-login blocked)
- [ ] Real login works with actual credentials
- [ ] Deployment URL works in browser

---

## Troubleshooting

### Deployment Fails During Build
1. Check Vercel logs for error message
2. Common issues:
   - Missing CSRF_SECRET → Add to Environment Variables
   - Wrong Node.js version → Auto-detected, usually fine
   - Package install failed → Try redeploying

### Health Check Returns Error
1. App is still building → Wait a few minutes and retry
2. Wrong URL → Copy exact URL from Vercel dashboard
3. Network issues → Try from different network/VPN

### Admin Bypass Still Works
- [ ] Verify admin bypass code was removed from:
  - `src/app/api/auth/login/route.ts` (lines 39-51 deleted)
- [ ] Redeploy if code was updated: Vercel → Deployments → Redeploy

### CSRF Secret Error in Logs
1. Check Vercel Environment Variables
2. Verify `CSRF_SECRET` is set (not empty or placeholder)
3. Redeploy: Vercel → Deployments → Redeploy

### Rate Limiting Not Working
1. Check Upstash dashboard:
   - Database is running (status: Ready)
   - Credentials are correct
2. Verify environment variables:
   - `UPSTASH_REDIS_REST_URL` is complete
   - `UPSTASH_REDIS_REST_TOKEN` is not truncated
3. Redeploy if credentials were updated

---

## After Deployment

### Monitor the App (Daily)
- [ ] Check Vercel dashboard for any red alerts
- [ ] Review Vercel logs for errors
- [ ] Test health check: `curl https://your-app.vercel.app/api/auth/check`

### Share with Team
- [ ] Send deployment URL to team
- [ ] Share `.env.example` as reference
- [ ] Document ROADNET credentials location

### Set Up Analytics (Optional)
- [ ] Vercel dashboard → Analytics
- [ ] Review Web Vitals
- [ ] Set up performance alerts

### Schedule Token Rotation (90 days)
- [ ] Calendar reminder: "Rotate CSRF_SECRET"
- [ ] Process: See DEPLOYMENT.md → "Token Rotation"

---

## Success! 🎉

Your ROADNET Dashboard is now deployed to Vercel with all security fixes in place.

**Next Steps:**
1. Bookmark your deployment URL
2. Share with team
3. Monitor logs daily
4. Refer to DEPLOYMENT.md for troubleshooting

**Questions?** See:
- VERCEL_SETUP_QUICK_GUIDE.md (quick reference)
- DEPLOYMENT.md (detailed instructions)
- SECURITY_AUDIT.md (technical details)

---

## Emergency Rollback

If something goes wrong:

1. **Go to Vercel Dashboard**
2. **Deployments** tab
3. **Select previous working deployment**
4. **Click "Redeploy"**

This reverts to the previous version immediately.

---

**Status**: ✅ Ready to Deploy

Start with Phase 1 above!
