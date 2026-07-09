# ROADNET Distribution Dashboard — Project Context

## What this is
A Next.js web dashboard that connects to the ROADNET API (Harash Ceramics / חרש קרמיקה) and displays distribution planning data: routes, KPIs per route, stop details, and export reports.

Built by Yuvi (יובי לוני) with Claude Code. Production version: v4.x.

## Tech stack
- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Languages**: Hebrew (default), English, Spanish — full i18n via `src/i18n/`
- **External integrations**: ROADNET API, Airtable (address verification)

## How to run
```bash
npm install
npm run dev        # → http://localhost:3000
```

Requires `.env.local` with:
```
NEXT_PUBLIC_API_BASE_URL=https://apex-prod-eu-integration.eu.roadnet.com/integration
ROADNET_API_USERNAME=...
ROADNET_API_PASSWORD=...
```

## Key files
```
src/
  app/
    api/           # API routes (proxy to ROADNET, Airtable)
    page.tsx       # Main dashboard page
    layout.tsx
  components/      # UI components (KPI cards, route table, date picker, etc.)
  context/         # Language context (i18n)
  i18n/            # Translations (he, en, es)
  lib/
    kpiCalculator.ts    # Core KPI logic — total time, utilization %, insights
    roadnetClient.ts    # ROADNET API client with bearer token auth
    rateLimiter.ts
    sanitize.ts
  types/           # TypeScript types
.claude/
  settings.local.json  # Claude Code allowed commands (Bash, PowerShell, etc.)
  launch.json          # Dev server config (npm run dev → port 3000)
presentation.html      # Standalone HTML presentation for client demos
```

## Authentication flow
- Login → POST to ROADNET API → bearer token stored in httpOnly cookie (`roadnet_token`)
- Token auto-refreshes on expiry
- All API routes validate cookie before proxying to ROADNET

## Current features (v4.x)
- Route KPI cards: total time, travel time, service time, stops, weight, utilization %
- Automatic Hebrew insights per route (from `kpiCalculator.ts`)
- Dashboard summary across all routes
- Stops report export (Excel/CSV)
- Orders report export
- Airtable address verification table
- Multilingual UI (he/en/es) with language switcher

## Working conventions
- The project is in: `C:\Users\yuval\OneDrive - Aman Computers\Claude\Code\routes-report`
- Git is initialized — commit after each meaningful change
- API credentials are in `.env.local` (not committed to git)
- Hebrew is the primary language; RTL layout throughout
- Run `npm run dev` to test locally before committing

## Notes for Claude Code
- `.claude/settings.local.json` already has pre-approved Bash/PowerShell commands — no need to ask for permission on standard operations
- The ROADNET API requires a real session token from login — use `curl` with cookie for local testing
- Airtable integration uses a separate API key stored in env vars
- If the dev server is already running on port 3000, kill it first: `pkill -9 -f node` or `fuser -k 3000/tcp`
