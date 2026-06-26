export interface AuthResponse {
  token: string;
  customerIdentifier: string;
}

export interface Stop {
  id: string;
  name: string;
  type: 'SERVICEABLE_STOP' | 'DEPOT' | 'ORIGIN_DEPOT_STOP' | 'DESTINATION_DEPOT_STOP' | 'MIDROUTE_DEPOT_STOP';
  weight?: number;
  serviceTime?: number;
  sequence: number;
  originDepotStopInfo?: any;
  destinationDepotStopInfo?: any;
  serviceableStopInfo?: any;
  [key: string]: any;
}

export interface Route {
  // ROADNET fields that are actually provided
  identity?: {
    identifier: string;
    entityKey: number;
  };
  routeStartTime?: string;
  description?: string;
  workersInfo?: any[];
  stops?: Stop[];

  // Computed/extracted fields for compatibility
  id?: string;
  vehicleId?: string;
  driverId?: string;
  totalTime?: number;
  travelTime?: number;
  plannedDate?: string;

  // Allow any other ROADNET fields
  [key: string]: any;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  capacity: {
    size1?: number;
    [key: string]: number | undefined;
  };
}

export interface RouteRound {
  roundNumber: number;
  weight: number;
  stopCount: number;
  weightUtilization: number;
}

export interface RouteKPI {
  routeId: string;
  driverName: string;
  vehicleType: string;
  totalDurationMinutes: number;
  travelTimeMinutes: number;
  serviceTimeMinutes: number;
  stopCount: number;
  totalWeight: number;
  vehicleCapacity: number;
  weightUtilization: number;
  timeUtilization: number;
  insights: string[];
  rounds?: RouteRound[];
  normalWorkDayMinutes?: number;
}

export interface DashboardSummary {
  totalRoutes: number;
  totalStops: number;
  weightUtilization: number;
  timeUtilization: number;
  totalWorkMinutes: number;
  normalWorkDay: number;
  overUtilizedRoutes: number;
  underUtilizedRoutes: number;
  overTimeRoutes: string[];
  overWeightRoutes: string[];
  recommendation: string;
  weatherNote: string;
  trafficNote: string;
}
