import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { RoadnetClient } from './roadnetClient.js';
import { calculateRouteKPI, calculateDashboardSummary } from './kpi.js';

// Load mcp-server/.env regardless of which directory this process was
// launched from (Claude Code may run it from the repo root), so no
// extra env-var wiring is needed when registering the server.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
loadEnv({ path: path.resolve(__dirname, '../.env') });

const baseUrl = process.env.RNA_API_BASE_URL;
const username = process.env.RNA_API_USERNAME;
const password = process.env.RNA_API_PASSWORD;
const defaultWorkDayMinutes = Number(process.env.RNA_NORMAL_WORKDAY_MINUTES || 540);

if (!baseUrl || !username || !password) {
  console.error(
    'Missing RNA_API_BASE_URL, RNA_API_USERNAME or RNA_API_PASSWORD environment variables. ' +
      'Set them in the environment that launches this server (see .env.example) - never pass credentials as tool arguments.'
  );
  process.exit(1);
}

const client = new RoadnetClient({ baseUrl, username, password });

async function getKpisFor(region: string, sessionDate: string, normalWorkDayMinutes: number) {
  const [routes, equipmentTypes] = await Promise.all([
    client.getRoutes(region, sessionDate, true),
    client.getEquipmentTypes(),
  ]);

  const equipmentById = new Map(
    equipmentTypes.map((e: any) => [e.identity?.identifier ?? e.id, e])
  );

  return routes.map((route: any) => {
    const equipment = equipmentById.get(route.equipmentTypeIdentity?.identifier);
    return calculateRouteKPI(route, equipment, normalWorkDayMinutes);
  });
}

const server = new McpServer({ name: 'roadnet-rna', version: '0.1.0' });

server.registerTool(
  'get_routes',
  {
    title: 'Get RNA routes',
    description:
      'Lightweight list of planned routes for a region and date from Roadnet Anywhere: route id, description, start time and stop count. Read-only.',
    inputSchema: {
      region: z.string().describe('RNA region identifier or code'),
      sessionDate: z.string().describe('Date in yyyy-MM-dd format'),
    },
  },
  async ({ region, sessionDate }) => {
    const routes = await client.getRoutes(region, sessionDate, false);
    const summary = routes.map((r: any) => ({
      routeId: r.identity?.identifier,
      description: r.description,
      routeStartTime: r.routeStartTime,
      stopCount: (r.stops || []).length,
    }));
    return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
  }
);

server.registerTool(
  'get_route_stops',
  {
    title: 'Get stops for one route',
    description: 'Full ordered stop list (address, weight, sequence) for a single route on a given region and date. Read-only.',
    inputSchema: {
      region: z.string().describe('RNA region identifier or code'),
      sessionDate: z.string().describe('Date in yyyy-MM-dd format'),
      routeId: z.string().describe('Route identifier as returned by get_routes'),
    },
  },
  async ({ region, sessionDate, routeId }) => {
    const routes = await client.getRoutes(region, sessionDate, true);
    const route = routes.find((r: any) => r.identity?.identifier === routeId);
    if (!route) {
      return {
        content: [{ type: 'text', text: `Route "${routeId}" was not found for ${sessionDate}.` }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(route.stops || [], null, 2) }] };
  }
);

server.registerTool(
  'get_equipment_types',
  {
    title: 'Get equipment types',
    description: 'List all vehicle/equipment types configured in RNA, including capacity. Read-only.',
    inputSchema: {},
  },
  async () => {
    const equipment = await client.getEquipmentTypes();
    return { content: [{ type: 'text', text: JSON.stringify(equipment, null, 2) }] };
  }
);

server.registerTool(
  'get_route_kpis',
  {
    title: 'Get route KPIs',
    description:
      'Compute KPIs (duration, weight utilization, plain-language insights) for every route on a given region and date. Read-only.',
    inputSchema: {
      region: z.string().describe('RNA region identifier or code'),
      sessionDate: z.string().describe('Date in yyyy-MM-dd format'),
      normalWorkDayMinutes: z
        .number()
        .optional()
        .describe(`Normal work day length in minutes, default ${defaultWorkDayMinutes}`),
    },
  },
  async ({ region, sessionDate, normalWorkDayMinutes }) => {
    const kpis = await getKpisFor(region, sessionDate, normalWorkDayMinutes ?? defaultWorkDayMinutes);
    return { content: [{ type: 'text', text: JSON.stringify(kpis, null, 2) }] };
  }
);

server.registerTool(
  'get_dashboard_summary',
  {
    title: 'Get dashboard summary',
    description:
      'Aggregate KPI summary across all routes for a region and date, with a plain-language recommendation. Read-only.',
    inputSchema: {
      region: z.string().describe('RNA region identifier or code'),
      sessionDate: z.string().describe('Date in yyyy-MM-dd format'),
      normalWorkDayMinutes: z
        .number()
        .optional()
        .describe(`Normal work day length in minutes, default ${defaultWorkDayMinutes}`),
    },
  },
  async ({ region, sessionDate, normalWorkDayMinutes }) => {
    const minutes = normalWorkDayMinutes ?? defaultWorkDayMinutes;
    const kpis = await getKpisFor(region, sessionDate, minutes);
    const summary = calculateDashboardSummary(kpis, minutes);
    return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
