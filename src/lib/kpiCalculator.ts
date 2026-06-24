import { Route, RouteKPI, DashboardSummary, Equipment } from '@/types';

export function calculateRouteKPI(
  route: Route,
  equipment: Equipment | undefined,
  normalWorkDayMinutes: number = 540
): RouteKPI {
  const serviceableStops = route.stops.filter(s => s.type === 'SERVICEABLE_STOP');

  const totalWeight = serviceableStops.reduce((sum, stop) => sum + (stop.weight || 0), 0);
  const serviceTimeMinutes = serviceableStops.reduce((sum, stop) => sum + (stop.serviceTime || 0), 0);

  const vehicleCapacity = equipment?.capacity?.size1 || 0;
  const weightUtilization = vehicleCapacity > 0 ? (totalWeight / vehicleCapacity) * 100 : 0;

  const insights = generateInsights(
    weightUtilization,
    route.totalTime,
    normalWorkDayMinutes,
    serviceableStops.length,
    totalWeight,
    vehicleCapacity
  );

  return {
    routeId: route.id,
    vehicleId: route.vehicleId,
    totalDurationMinutes: route.totalTime,
    travelTimeMinutes: route.travelTime,
    serviceTimeMinutes,
    stopCount: serviceableStops.length,
    totalWeight,
    vehicleCapacity,
    weightUtilization: Math.round(weightUtilization * 10) / 10,
    insights,
  };
}

function generateInsights(
  utilization: number,
  totalTime: number,
  normalDay: number,
  stopCount: number,
  totalWeight: number,
  capacity: number
): string[] {
  const insights: string[] = [];

  if (utilization < 50 && capacity > 0) {
    insights.push('ניצול משקל נמוך - אפשר לשלב מסלולים');
  } else if (utilization > 90) {
    insights.push('משקל כמעט בקיבולת המירבית');
  }

  if (totalTime > normalDay * 1.1) {
    insights.push('זמן עבודה ארוך יותר מיום עבודה רגיל');
  } else if (totalTime < normalDay * 0.7) {
    insights.push('זמן עבודה קצר - יכול לכלול עוד תחנות');
  }

  if (stopCount === 0) {
    insights.push('אין תחנות בזימון זה');
  } else if (stopCount > 20) {
    insights.push('מספר גבוה של תחנות - תוקפנות בניתוב');
  }

  if (insights.length === 0) {
    insights.push('מסלול מאוזן וטוב');
  }

  return insights;
}

export function calculateDashboardSummary(
  kpis: RouteKPI[],
  normalWorkDayMinutes: number = 540,
  sessionDate?: string,
  weatherData?: any,
  trafficInsights?: any,
  isHoliday: boolean = false,
  holidayName: string = ''
): DashboardSummary {
  if (kpis.length === 0) {
    return {
      totalRoutes: 0,
      totalStops: 0,
      weightUtilization: 0,
      timeUtilization: 0,
      totalWorkMinutes: 0,
      normalWorkDay: normalWorkDayMinutes,
      overUtilizedRoutes: 0,
      underUtilizedRoutes: 0,
      overTimeRoutes: [],
      overWeightRoutes: [],
      recommendation: 'אין נתונים להצגה',
      weatherNote: '',
      trafficNote: '',
    };
  }

  const totalStops = kpis.reduce((sum, k) => sum + k.stopCount, 0);
  const averageWeightUtil =
    kpis.reduce((sum, k) => sum + k.weightUtilization, 0) / kpis.length;
  const totalWorkMinutes = kpis.reduce((sum, k) => sum + k.totalDurationMinutes, 0);
  const averageTimePerRoute = totalWorkMinutes / kpis.length;
  const timeUtil = (averageTimePerRoute / normalWorkDayMinutes) * 100;
  const overUtilized = kpis.filter(k => k.weightUtilization > 85).length;
  const underUtilized = kpis.filter(k => k.weightUtilization < 50).length;

  // נהגים החורגים מקיבולת משקל (>100%)
  const overWeightRoutes = kpis
    .filter(k => k.weightUtilization > 100)
    .map(k => k.driverName);

  // נהגים החורגים מ-9 שעות עבודה
  const overTimeRoutes = kpis
    .filter(k => k.totalDurationMinutes > normalWorkDayMinutes)
    .map(k => k.driverName);

  // Build weather note
  let weatherNote = '';
  if (weatherData?.daily) {
    const weatherCode = weatherData.daily.weather_code?.[0];
    const maxTemp = Math.round(weatherData.daily.temperature_2m_max?.[0] || 0);
    const rainProbability = weatherData.daily.precipitation_probability_max?.[0] || 0;

    let weatherDesc = 'בתנאים נורמליים';
    let weatherImpact = 'אין השפעה צפויה על התכנון';
    let hasExtremeConditions = false;

    if (rainProbability > 50 || (weatherCode && weatherCode >= 80)) {
      weatherDesc = 'עם סיכוי לגשם';
      weatherImpact = 'צריך להתכונן לתנאים רטובים - זמנים עלולים להתארך בגלל החליקות ותנועה איטית';
      hasExtremeConditions = true;
    } else if (maxTemp > 32) {
      weatherDesc = 'בחום קיצוני';
      weatherImpact = 'צריך להתכונן לחום קיצוני - זמנים עלולים להתארך בגלל עומסים במערכות קירור';
      hasExtremeConditions = true;
    } else if (maxTemp > 30) {
      weatherDesc = 'בחום גבוה';
      weatherImpact = 'זמנים עלולים להתארך מעט בגלל חום';
      hasExtremeConditions = true;
    } else if (maxTemp < 0) {
      weatherDesc = 'בקור קיצוני';
      weatherImpact = 'צריך להתכונן לקור קיצוני - זמנים עלולים להתארך בגלל תנאי דרך קשים';
      hasExtremeConditions = true;
    }

    weatherNote = `\n⛅ מזג אויר: ${weatherDesc} (${maxTemp}°C, גשם ${rainProbability}%) - ${weatherImpact}`;
  }

  // Build combined conditions note (weather + traffic + holidays)
  let conditionsNote = '';
  const parts = [];

  if (weatherNote) {
    parts.push(weatherNote.replace('\n⛅ מזג אויר: ', ''));
  }

  if (trafficNote) {
    parts.push(trafficNote.replace('\n🚗 תנועה: ', ''));
  }

  if (parts.length > 0) {
    conditionsNote = parts.join(' | ');
  }

  let recommendation = 'התכנון טוב';

  if (overWeightRoutes.length > 0 && overTimeRoutes.length > 0) {
    recommendation = `חורגים משקל: ${overWeightRoutes.join(', ')}\nחורגים זמן: ${overTimeRoutes.join(', ')}`;
  } else if (overWeightRoutes.length > 0) {
    recommendation = `נהגים ${overWeightRoutes.join(', ')} חורגים מקיבולת משקל`;
  } else if (overTimeRoutes.length > 0) {
    recommendation = `נהגים ${overTimeRoutes.join(', ')} חורגים מ-9 שעות עבודה`;
  } else if (overUtilized > kpis.length * 0.3) {
    recommendation = 'רוב המסלולים עמוסים - בחן אפשרות הוספת רכב';
  } else if (underUtilized > kpis.length * 0.4) {
    recommendation = 'חלק גדול מהמסלולים תחת ניצול - חפש דרך לשלב';
  } else {
    recommendation = 'התכנון טוב';
  }

  return {
    totalRoutes: kpis.length,
    totalStops,
    weightUtilization: Math.round(averageWeightUtil * 10) / 10,
    timeUtilization: Math.round(timeUtil * 10) / 10,
    totalWorkMinutes,
    normalWorkDay: normalWorkDayMinutes,
    overUtilizedRoutes: overUtilized,
    underUtilizedRoutes: underUtilized,
    overTimeRoutes,
    overWeightRoutes,
    recommendation,
    weatherNote: conditionsNote.trim(),
    trafficNote: '',
  };
}

export function formatMinutesAsTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
