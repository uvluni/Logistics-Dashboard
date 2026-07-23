export interface RoadnetClientOptions {
  baseUrl: string;
  username: string;
  password: string;
}

/**
 * Thin, read-only client for the Roadnet Anywhere (RNA) / Omnitracs REST API.
 * Mirrors the auth flow already used in the main routes-report app
 * (POST /v1/login -> bearer token, retried once on 401), but keeps the
 * token in memory inside this process only - it is never exposed to
 * MCP tool callers.
 */
export class RoadnetClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private token: string | null = null;

  constructor(options: RoadnetClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.username = options.username;
    this.password = options.password;
  }

  private async login(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.password }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`RNA login failed: ${res.status} ${res.statusText} ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as { token: string; customerIdentifier: string };
    this.token = data.token;
  }

  private async request(path: string, init: RequestInit = {}, allowRetry = true): Promise<Response> {
    if (!this.token) {
      await this.login();
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        ...(init.headers || {}),
      },
    });

    if (res.status === 401 && allowRetry) {
      this.token = null;
      return this.request(path, init, false);
    }

    return res;
  }

  /**
   * GET /v1/dailyplan/routes for a session date.
   * expandAll pulls full stop-level detail (heavier payload); leave it
   * false for a lightweight route list. Region parameter is ignored (not used by this endpoint).
   */
  async getRoutes(region: string, sessionDate: string, expandAll = false): Promise<any[]> {
    const params = new URLSearchParams({ sessionDate, pageSize: '1000' });
    if (expandAll) params.set('expand', 'All');

    const res = await this.request(`/v1/dailyplan/routes?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to fetch routes: ${res.status} ${res.statusText} ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    return data.items || data.routes || [];
  }

  /** GET /v1/admin/equipmentTypes - vehicle/equipment definitions incl. capacity. */
  async getEquipmentTypes(): Promise<any[]> {
    const res = await this.request(`/v1/admin/equipmentTypes?pageSize=1000`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to fetch equipment types: ${res.status} ${res.statusText} ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    return data.equipmentTypes || data.items || [];
  }
}
