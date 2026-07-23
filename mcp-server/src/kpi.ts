export interface RouteKPI {
  routeId: string;
  totalDurationMinutes: number;
  travelTimeMinutes: number;
  serviceTimeMinutes: number;
  stopCount: number;
  totalWeight: number;
  vehicleCapacity: number;
  weightUtilization: number;
  insights: string[];
}

export interface DashboardSummary {
  totalRoutes: number;
  totalStops: number;
  weightUtilization: number;
  timeUtilization: number;
  totalWorkMinutes: number;
  overUtilizedRoutes: number;
  underUtilizedRoutes: number;
  recommendation: string;
}

/**
 * Same shape of logic as src/lib/kpiCalculator.ts in the main app,
 * reduced to plain English output and no i18n dependency so this
 * package can run standalone as an MCP server.
 */
export function calculateRouteKPI(route: any, equipment: any, normalWorkDayMinutes = 540): RouteKPI {
  const stops = (route.stops || []) as any[];
  // Only count ServiceableStop (actual customer deliveries), ignore DEPOT stops
  const serviceableStops = stops.filter((s) => s.stopType === 'ServiceableStop');

  // Get total weight from OriginDepotStop's runningQuantityAfter[0]
  // This is the total load at the start of the route
  let totalWeight = 0;
  const originDepot = stops.find((s) => s.stopType === 'OriginDepotStop');
  if (originDepot?.originDepotStopInfo?.runningQuantityAfter) {
    totalWeight = originDepot.originDepotStopInfo.runningQuantityAfter[0] || 0;
  }
  const serviceTimeMinutes = serviceableStops.reduce((sum, s) => {
    const info = s.serviceableStopInfo;
    const arrivalTime = new Date(info?.arrivalTimestamp).getTime();
    const departureTime = new Date(info?.departureTimestamp).getTime();
    return sum + (departureTime - arrivalTime) / (1000 * 60); // Convert ms to minutes
  }, 0);
  const vehicleCapacity = equipment?.capacity?.size1 || 0;
  const weightUtilization = vehicleCapacity > 0 ? (totalWeight / vehicleCapacity) * 100 : 0;
  const totalTime = route.totalTime || 0;

  const insights: string[] = [];
  if (vehicleCapacity > 0 && weightUtilization < 50) {
    insights.push('Low weight utilization - consider consolidating with another route.');
  } else if (weightUtilization > 90) {
    insights.push('High weight utilization - near or over vehicle capacity.');
  }
  if (totalTime > normalWorkDayMinutes * 1.1) {
    insights.push('Route runs significantly longer than a normal work day.');
  } else if (totalTime > 0 && totalTime < normalWorkDayMinutes * 0.7) {
    insights.push('Route is notably shorter than a normal work day.');
  }
  if (serviceableStops.length === 0) {
    insights.push('No serviceable stops on this route.');
  } else if (serviceableStops.length > 20) {
    insights.push('High stop count - review for a potential split.');
  }
  if (insights.length === 0) {
    insights.push('Route looks balanced.');
  }

  return {
    routeId: route.identity?.identifier || route.id || '',
    totalDurationMinutes: totalTime,
    travelTimeMinutes: route.travelTime || 0,
    serviceTimeMinutes,
    stopCount: serviceableStops.length,
    totalWeight,
    vehicleCapacity,
    weightUtilization: Math.round(weightUtilization * 10) / 10,
    insights,
  };
}

export function calculateDashboardSummary(kpis: RouteKPI[], normalWorkDayMinutes = 540): DashboardSummary {
  if (kpis.length === 0) {
    return {
      totalRoutes: 0,
      totalStops: 0,
      weightUtilization: 0,
      timeUtilization: 0,
      totalWorkMinutes: 0,
      overUtilizedRoutes: 0,
      underUtilizedRoutes: 0,
      recommendation: 'No routes found for this region and date.',
    };
  }

  const totalStops = kpis.reduce((sum, k) => sum + k.stopCount, 0);
  const avgWeightUtil = kpis.reduce((sum, k) => sum + k.weightUtilization, 0) / kpis.length;
  const totalWorkMinutes = kpis.reduce((sum, k) => sum + k.totalDurationMinutes, 0);
  const avgTimePerRoute = totalWorkMinutes / kpis.length;
  const timeUtil = (avgTimePerRoute / normalWorkDayMinutes) * 100;
  const overUtilized = kpis.filter((k) => k.weightUtilization > 85).length;
  const underUtilized = kpis.filter((k) => k.weightUtilization < 50).length;

  let recommendation = `Average time utilization: ${Math.round(timeUtil)}%. Average weight utilization: ${Math.round(avgWeightUtil)}%.`;
  if (overUtilized > 0) recommendation += ` ${overUtilized} route(s) are over 85% weight utilization.`;
  if (underUtilized > 0) recommendation += ` ${underUtilized} route(s) are under 50% weight utilization - consider consolidating.`;

  return {
    totalRoutes: kpis.length,
    totalStops,
    weightUtilization: Math.round(avgWeightUtil * 10) / 10,
    timeUtilization: Math.round(timeUtil * 10) / 10,
    totalWorkMinutes,
    overUtilizedRoutes: overUtilized,
    underUtilizedRoutes: underUtilized,
    recommendation,
  };
}
