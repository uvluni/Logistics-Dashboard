import { Route, RouteKPI, DashboardSummary, Equipment } from '@/types';

export function calculateRouteKPI(
  route: Route,
  equipment: Equipment | undefined,
  normalWorkDayMinutes: number = 540
): RouteKPI {
  const serviceableStops = (route.stops || []).filter(s => s.type === 'SERVICEABLE_STOP');

  const totalWeight = serviceableStops.reduce((sum, stop) => sum + (stop.weight || 0), 0);
  const serviceTimeMinutes = serviceableStops.reduce((sum, stop) => sum + (stop.serviceTime || 0), 0);

  const vehicleCapacity = equipment?.capacity?.size1 || 0;
  const weightUtilization = vehicleCapacity > 0 ? (totalWeight / vehicleCapacity) * 100 : 0;

  const insights = generateInsights(
    weightUtilization,
    route.totalTime || 0,
    normalWorkDayMinutes,
    serviceableStops.length,
    totalWeight,
    vehicleCapacity
  );

  return {
    routeId: route.id || '',
    driverName: '',
    vehicleType: '',
    totalDurationMinutes: route.totalTime || 0,
    travelTimeMinutes: route.travelTime || 0,
    serviceTimeMinutes,
    stopCount: serviceableStops.length,
    totalWeight,
    vehicleCapacity,
    weightUtilization: Math.round(weightUtilization * 10) / 10,
    timeUtilization: 0,
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
  // בדוק אם יש סבב שחורג (לא הסכום הכללי)
  const overWeightRoutes = kpis
    .filter(k => {
      if (k.rounds && k.rounds.length > 0) {
        // אם יש סבבים, בדוק אם סבב כלשהו חורג
        return k.rounds.some(r => r.weightUtilization > 100);
      }
      // אחרת בדוק את הערך הכללי
      return k.weightUtilization > 100;
    })
    .map(k => k.driverName);

  // נהגים החורגים מנורמת יום העבודה
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
  const trafficNote = trafficInsights?.trafficNote || '';
  let conditionsNote = '';
  const parts = [];

  if (weatherNote) {
    parts.push(weatherNote.replace('\n⛅ מזג אויר: ', ''));
  }

  if (trafficNote) {
    parts.push(trafficNote.replace('\n🚗 תנועה: ', ''));
  }

  if (parts.length > 0) {
    conditionsNote = parts.join('\n');
  }

  // Find drivers with underutilized weight (<80%) and short hours (<8 hours)
  const underweightShortHours = kpis
    .filter(k => k.weightUtilization < 80 && k.totalDurationMinutes < 480)
    .map(k => k.driverName);

  // Find drivers with rounds exceeding weight (>100%)
  const overCapacityDrivers = kpis
    .filter(k => k.rounds && k.rounds.some(r => r.weightUtilization > 100))
    .map(k => k.driverName);

  // Find drivers with long hours (>10 hours / 600 minutes)
  const longHoursDrivers = kpis
    .filter(k => k.totalDurationMinutes > 600)
    .map(k => k.driverName);

  // Build recommendation in natural language with line breaks
  let recommendation = '';

  // Line 1: Average metrics
  recommendation += `ניצול זמן ממוצע: ${Math.round(timeUtil)}%\n`;
  recommendation += `ניצול משקל ממוצע: ${Math.round(averageWeightUtil)}%\n\n`;

  // Line 2: Underutilized drivers
  if (underweightShortHours.length > 0) {
    const driverLabel = underweightShortHours.length === 1
      ? `נהג ${underweightShortHours.length}`
      : `${underweightShortHours.length} נהגים`;
    recommendation += `${driverLabel} עם ניצול נמוך וזמן קצר (משקל קטן מ-80%, זמן קטן מ-8 שעות):\n`;
    recommendation += `${underweightShortHours.join(', ')}\n\n`;
  }

  // Line 3: Overutilized drivers (weight)
  if (overCapacityDrivers.length > 0) {
    const driverLabel = overCapacityDrivers.length === 1
      ? `נהג ${overCapacityDrivers.length}`
      : `${overCapacityDrivers.length} נהגים`;
    recommendation += `${driverLabel} עם חריגה מקיבולת משקל (סבב גדול מ-100%):\n`;
    recommendation += `${overCapacityDrivers.join(', ')}\n\n`;
  }

  // Line 4: Long hours drivers
  if (longHoursDrivers.length > 0) {
    const driverLabel = longHoursDrivers.length === 1
      ? `נהג ${longHoursDrivers.length}`
      : `${longHoursDrivers.length} נהגים`;
    recommendation += `${driverLabel} עם חריגה מזמן עבודה (גדול מ-10 שעות):\n`;
    recommendation += `${longHoursDrivers.join(', ')}\n\n`;
  }

  // Line 5: Recommendations
  if (underweightShortHours.length > 0 || overCapacityDrivers.length > 0 || longHoursDrivers.length > 0) {
    recommendation += `דרוש התאמה בהקצאת המשימות.`;
  } else if (averageWeightUtil < 60) {
    recommendation += `משקל ממוצע נמוך - שקול שילוב מסלולים או הוספת תחנות.`;
  } else if (timeUtil > 90) {
    recommendation += `ניצול זמן גבוה - בחן הוספת רכב או חלוקה של מסלולים.`;
  } else {
    recommendation += `התכנון מאוזן וטוב.`;
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
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
