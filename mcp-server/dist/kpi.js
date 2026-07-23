/**
 * Same shape of logic as src/lib/kpiCalculator.ts in the main app,
 * reduced to plain English output and no i18n dependency so this
 * package can run standalone as an MCP server.
 */
export function calculateRouteKPI(route, equipment, normalWorkDayMinutes = 540) {
    const stops = (route.stops || []);
    const serviceableStops = stops.filter((s) => s.type === 'SERVICEABLE_STOP');
    const totalWeight = serviceableStops.reduce((sum, s) => sum + (s.weight || 0), 0);
    const serviceTimeMinutes = serviceableStops.reduce((sum, s) => sum + (s.serviceTime || 0), 0);
    const vehicleCapacity = equipment?.capacity?.size1 || 0;
    const weightUtilization = vehicleCapacity > 0 ? (totalWeight / vehicleCapacity) * 100 : 0;
    const totalTime = route.totalTime || 0;
    const insights = [];
    if (vehicleCapacity > 0 && weightUtilization < 50) {
        insights.push('Low weight utilization - consider consolidating with another route.');
    }
    else if (weightUtilization > 90) {
        insights.push('High weight utilization - near or over vehicle capacity.');
    }
    if (totalTime > normalWorkDayMinutes * 1.1) {
        insights.push('Route runs significantly longer than a normal work day.');
    }
    else if (totalTime > 0 && totalTime < normalWorkDayMinutes * 0.7) {
        insights.push('Route is notably shorter than a normal work day.');
    }
    if (serviceableStops.length === 0) {
        insights.push('No serviceable stops on this route.');
    }
    else if (serviceableStops.length > 20) {
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
export function calculateDashboardSummary(kpis, normalWorkDayMinutes = 540) {
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
    if (overUtilized > 0)
        recommendation += ` ${overUtilized} route(s) are over 85% weight utilization.`;
    if (underUtilized > 0)
        recommendation += ` ${underUtilized} route(s) are under 50% weight utilization - consider consolidating.`;
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
