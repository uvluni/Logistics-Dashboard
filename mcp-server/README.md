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

## Setup

```bash
cd mcp-server
npm install
cp .env.example .env
# edit .env with the real RNA_API_USERNAME / RNA_API_PASSWORD
npm run build
```

## Registering with Claude Code

From the `routes-report` project root:

```bash
claude mcp add roadnet-rna -- node mcp-server/dist/index.js
```

The server loads `mcp-server/.env` itself on startup (via `dotenv`),
so no environment variables need to be passed through the `claude mcp
add` command or your shell profile - just make sure `.env` exists
with real values before registering.

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
