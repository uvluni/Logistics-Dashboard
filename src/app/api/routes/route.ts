import { NextRequest, NextResponse } from 'next/server';
import { calculateRouteKPI, calculateDashboardSummary } from '@/lib/kpiCalculator';
import { Route, Equipment, RouteKPI } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('roadnet_token')?.value;

    // Debug: Log all cookies and token info
    const cookieString = request.headers.get('cookie') || '';
    console.log('DEBUG - Cookies received:', {
      hasCookie: !!token,
      tokenLength: token?.length,
      allCookies: cookieString.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const { searchParams } = new URL(request.url);
    const sessionDate = searchParams.get('sessionDate') || new Date().toISOString().split('T')[0];

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Missing API base URL' },
        { status: 500 }
      );
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const routesUrl = `${baseUrl}/v1/dailyplan/routes?expand=All&sessionDate=${sessionDate}`;

    const routesResponse = await fetch(routesUrl, { headers });

    console.log('ROADNET API Response:', {
      url: routesUrl,
      status: routesResponse.status,
      statusText: routesResponse.statusText,
      contentType: routesResponse.headers.get('content-type'),
    });

    if (routesResponse.status === 401) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    if (!routesResponse.ok) {
      const errorText = await routesResponse.text();
      return NextResponse.json(
        {
          error: 'Failed to fetch data from ROADNET',
          details: {
            routesStatus: routesResponse.status,
            errorText: errorText.substring(0, 500),
          }
        },
        { status: 500 }
      );
    }

    let routesData;
    try {
      routesData = await routesResponse.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse ROADNET response', parseError: String(parseError) },
        { status: 500 }
      );
    }

    console.log('ROADNET Response Raw:', {
      status: routesResponse.status,
      hasItems: !!routesData.items,
      itemsLength: routesData.items?.length || 0,
      dataKeys: Object.keys(routesData).slice(0, 3),
    });

    const rawRoutes: Route[] = routesData.items || routesData.routes || routesData.data || [];

    // Fetch equipment types for vehicle capacity
    let equipmentTypes: Record<string, any> = {};
    let equipmentMap: Record<string, any> = {}; // specific equipment ID -> equipment type info

    try {
      const equipmentTypeUrl = `${baseUrl}/v1/admin/equipmentType?expand=All`;
      const equipmentTypeResponse = await fetch(equipmentTypeUrl, { headers });
      if (equipmentTypeResponse.ok) {
        const equipmentTypeData = await equipmentTypeResponse.json();
        if (equipmentTypeData.items && Array.isArray(equipmentTypeData.items)) {
          equipmentTypes = Object.fromEntries(
            equipmentTypeData.items.map((eq: any) => [eq.identity?.identifier, eq])
          );
        }
      }

      // Fetch specific equipment (e.g., "1.5" -> maps to PEUGEOT equipment type)
      const equipmentUrl = `${baseUrl}/v1/admin/equipment?expand=All`;
      const equipmentResponse = await fetch(equipmentUrl, { headers });
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        if (equipmentData.items && Array.isArray(equipmentData.items)) {
          equipmentMap = Object.fromEntries(
            equipmentData.items.map((eq: any) => [
              eq.identity?.identifier,
              {
                name: eq.identity?.identifier,
                equipmentTypeIdentity: eq.equipmentTypeIdentity?.identifier,
                equipment: equipmentTypes[eq.equipmentTypeIdentity?.identifier]
              }
            ])
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    }

    // Map ROADNET routes to our RouteKPI format
    const kpis: RouteKPI[] = rawRoutes.map((route, index) => {
      let totalWeight = 0;
      let stopCount = 0;
      let totalDurationMinutes = 0;
      let serviceTimeMinutes = 0;
      let travelTimeMinutes = 0;

      if (route.stops && Array.isArray(route.stops)) {
        // Count only ServiceableStop, not DEPOT
        stopCount = route.stops.filter((stop: any) =>
          stop.stopType === 'ServiceableStop'
        ).length;

        // Calculate times from stops: startTimestamp of first stop to completeTimestamp of last stop
        const firstStop = route.stops[0];
        const lastStop = route.stops[route.stops.length - 1];

        // Get startTimestamp from OriginDepotStop or fallback to route.routeStartTime
        let routeStart = new Date(route.routeStartTime).getTime();
        if (firstStop?.originDepotStopInfo?.startTimestamp) {
          routeStart = new Date(firstStop.originDepotStopInfo.startTimestamp).getTime();
        }

        // Get completeTimestamp from DestinationDepotStop
        let routeEnd = routeStart;
        if (lastStop?.destinationDepotStopInfo?.completeTimestamp) {
          routeEnd = new Date(lastStop.destinationDepotStopInfo.completeTimestamp).getTime();
        }

        // Total duration in minutes
        totalDurationMinutes = Math.round((routeEnd - routeStart) / 60000);

        // Sum weights and service times
        totalWeight = route.stops.reduce((sum: number, stop: any) => {
          let weight = 0;
          const deliveryQuantities = stop.serviceableStopInfo?.totalDeliveryQuantities ||
                                   stop.totalDeliveryQuantities;

          if (deliveryQuantities) {
            if (Array.isArray(deliveryQuantities)) {
              weight = deliveryQuantities[0] || 0;
            } else if (typeof deliveryQuantities === 'number') {
              weight = deliveryQuantities;
            }
          }

          // Add service time
          const serviceTime = stop.serviceableStopInfo?.totalPlannedServiceTime?.value?.minutes ||
                            stop.totalPlannedServiceTime?.value?.minutes || 0;
          serviceTimeMinutes += serviceTime;

          return sum + weight;
        }, 0);

        // Travel time = Total Time - Service Time
        travelTimeMinutes = Math.max(0, totalDurationMinutes - serviceTimeMinutes);
      }

      // Get vehicle type and capacity from equipment
      const specificEquipmentId = route.equipmentInfo?.[0]?.specificEquipmentInfo?.identity?.identifier;
      const specificEquipment = equipmentMap[specificEquipmentId];
      const equipmentType = specificEquipment?.equipment;
      const vehicleType = specificEquipment?.equipmentTypeIdentity || specificEquipmentId || 'unknown';
      const vehicleCapacity = equipmentType?.operational?.capacity?.[0] || 0;

      if (index === 0 || route.identity?.identifier === '1008') {
        const fs = require('fs');
        const path = require('path');
        const debugPath = path.join(process.env.TEMP || '/tmp', 'roadnet-equipment.log');
        const debugMsg = `ROUTE ${route.identity?.identifier}:\nspecificEquipmentId="${specificEquipmentId}"\nequipmentTypeIdentity="${vehicleType}"\ncapacity=${vehicleCapacity}\nequipment found: ${!!specificEquipment}\n\n`;
        fs.appendFileSync(debugPath, debugMsg);
      }

      const weightUtilization = vehicleCapacity > 0 ? Math.round((totalWeight / vehicleCapacity) * 100) : 0;
      const timeUtilization = Math.round((totalDurationMinutes / 540) * 100); // 540 minutes = 9 hours

      const insights: string[] = [];
      insights.push(`${weightUtilization}% משקל, ${stopCount} תחנות`);

      if (timeUtilization > 100) {
        insights.push('⚠️ חוגר זמן - יותר מ-9 שעות');
      } else if (timeUtilization < 70 && weightUtilization >= 50) {
        // רק הצע להוסיף תחנות אם הזמן נמוך והמשקל לא נמוך
        insights.push('יכול לכלול עוד תחנות');
      }

      if (weightUtilization > 100) {
        insights.push('⚠️ חוגר משקל - עליית הקיבולה');
      } else if (weightUtilization < 50 && timeUtilization < 80) {
        // רק אמור על משקל נמוך אם הזמן גם לא גבוה
        insights.push('משקל נמוך - אפשר לשלב');
      }

      const driverName = route.workersInfo?.[0]?.name?.firstName || 'ללא נהג';

      return {
        routeId: route.identity?.identifier || `route-${index}`,
        driverName,
        vehicleType,
        totalDurationMinutes,
        travelTimeMinutes,
        serviceTimeMinutes,
        stopCount,
        totalWeight,
        vehicleCapacity,
        weightUtilization,
        timeUtilization,
        insights,
      };
    });

    const summary = calculateDashboardSummary(kpis, 540);

    return NextResponse.json({
      routes: kpis,
      kpis,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Routes fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}
