import { AuthResponse, Route, Equipment } from '@/types';

class RoadnetClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data: AuthResponse = await response.json();
      this.token = data.token;
      return data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Login error:', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  setToken(token: string): void {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    };
  }

  async getDailyPlanRoutes(region: string, sessionDate: string): Promise<Route[]> {
    try {
      const params = new URLSearchParams({
        region,
        sessionDate,
        pageSize: '1000',
      });

      const response = await fetch(
        `${this.baseUrl}/dailyplan/routes?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error('Token expired');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch routes: ${response.statusText}`);
      }

      const data = await response.json();
      return data.routes || [];
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Get routes error:', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  async getEquipmentTypes(): Promise<Equipment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/equipmentTypes`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error('Token expired');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch equipment: ${response.statusText}`);
      }

      const data = await response.json();
      return data.equipmentTypes || [];
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Get equipment error:', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }
}

export default RoadnetClient;
