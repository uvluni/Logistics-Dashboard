# roadnet-rna-mcp

Read-only MCP server that exposes Roadnet Anywhere (RNA) route planning
data as tools for Claude, reusing the same auth flow and KPI logic as
the main `routes-report` app.

## Tools

- `get_routes(region, sessionDate)` - lightweight route list (id, description, start time, stop count).
- `get_route_stops(region, sessionDate, routeId)` - full stop list for one route.
- `get_equipment_types()` - vehicle/equipment definitions and capacity.
- `get_route_kpis(region, sessionDate, normalWorkDayMinutes?)` - per-route KPIs and insights.
- `get_dashboard_summary(region, sessionDate, normalWorkDayMinutes?)` - aggregate KPI summary with a recommendation.

All tools are read-only. Credentials are never accepted as tool
parameters - they live only in the process environment.

## Setup (First Time / For a New User)

```bash
# 1. Navigate to the mcp-server directory
cd mcp-server

# 2. Install dependencies
npm install

# 3. Create .env file from template
cp .env.example .env

# 4. Edit .env with your ROADNET credentials
#    - RNA_API_USERNAME: your ROADNET Anywhere username
#    - RNA_API_PASSWORD: your ROADNET Anywhere password
nano .env

# 5. Build the server
npm run build
```

## Registering with Claude Code

From the project root (wherever you copied `routes-report/` to):

```bash
# This command registers the MCP server with Claude Code
# It will be available in every Claude Code session within this project
claude mcp add roadnet-rna -- node mcp-server/dist/index.js
```

**Important:** The server loads `mcp-server/.env` automatically on startup (via `dotenv`), so:
- ✅ Never pass credentials as tool parameters (they're handled internally)
- ✅ Credentials are loaded from `.env` only
- ✅ Each person gets their own credentials in their own `.env` file
- ✅ The `.env` file should be in `.gitignore` (never commit credentials)

## Local dev loop

```bash
npm run dev
```

runs the server directly against `src/index.ts` with `tsx`, no build
step needed while iterating.

## Notes / open items

- The main app's `src/lib/roadnetClient.ts` calls
  `GET /dailyplan/routes` (no `/v1` prefix), while the working
  `src/app/api/stops/route.ts` endpoint calls
  `GET /v1/dailyplan/routes` (with the prefix). This package follows
  the `/v1` version, matching the endpoint that's actually working in
  production and the versioning rule described in the RNA API guide.
  Worth checking whether the un-prefixed call in `roadnetClient.ts` is
  live code or dead code.
- Phase 2 (write tools - creating/updating orders or routes) should
  add an explicit confirmation step per tool before anything is sent
  to RNA, the same caution already applied to credential handling here.
