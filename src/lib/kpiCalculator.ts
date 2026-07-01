import { Route, RouteKPI, DashboardSummary, Equipment } from '@/types';
import { translations, Language } from '@/i18n/translations';
import { sanitizeDriverName } from '@/lib/sanitize';

// Helper function to translate text
function t(key: string, lang: Language): string {
  return translations[lang]?.[key] || key;
}

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
    vehicleCapacity,
    'he' // Default to Hebrew for backward compatibility
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
  capacity: number,
  language: Language = 'he'
): string[] {
  const insights: string[] = [];

  if (utilization < 50 && capacity > 0) {
    insights.push(t('insight.low_weight', language));
  } else if (utilization > 90) {
    insights.push(t('insight.high_weight', language));
  }

  if (totalTime > normalDay * 1.1) {
    insights.push(t('insight.long_hours', language));
  } else if (totalTime < normalDay * 0.7) {
    insights.push(t('insight.short_hours', language));
  }

  if (stopCount === 0) {
    insights.push(t('insight.no_stops', language));
  } else if (stopCount > 20) {
    insights.push(t('insight.many_stops', language));
  }

  if (insights.length === 0) {
    insights.push(t('insight.balanced_route', language));
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
  holidayName: string = '',
  language: Language = 'he'
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
      recommendation: t('summary.no_data', language),
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
    .map(k => sanitizeDriverName(k.driverName));

  // נהגים החורגים מנורמת יום העבודה
  const overTimeRoutes = kpis
    .filter(k => k.totalDurationMinutes > normalWorkDayMinutes)
    .map(k => sanitizeDriverName(k.driverName));

  // Build weather note
  let weatherNote = '';
  if (weatherData?.daily) {
    const weatherCode = weatherData.daily.weather_code?.[0];
    const maxTemp = Math.round(weatherData.daily.temperature_2m_max?.[0] || 0);
    const rainProbability = weatherData.daily.precipitation_probability_max?.[0] || 0;

    let weatherDesc = t('weather.normal', language);
    let weatherImpact = t('weather.no_impact', language);
    let hasExtremeConditions = false;

    if (rainProbability > 50 || (weatherCode && weatherCode >= 80)) {
      weatherDesc = t('weather.rain', language);
      weatherImpact = t('weather.rain_impact', language);
      hasExtremeConditions = true;
    } else if (maxTemp > 32) {
      weatherDesc = t('weather.extreme_heat', language);
      weatherImpact = t('weather.extreme_heat_impact', language);
      hasExtremeConditions = true;
    } else if (maxTemp > 30) {
      weatherDesc = t('weather.high_heat', language);
      weatherImpact = t('weather.high_heat_impact', language);
      hasExtremeConditions = true;
    } else if (maxTemp < 0) {
      weatherDesc = t('weather.extreme_cold', language);
      weatherImpact = t('weather.extreme_cold_impact', language);
      hasExtremeConditions = true;
    }

    const weatherCodeLabel = t('weather.code', language);
    weatherNote = `\n${weatherCodeLabel}: ${weatherDesc} (${maxTemp}°C, ${language === 'he' ? 'גשם' : language === 'es' ? 'lluvia' : 'rain'} ${rainProbability}%) - ${weatherImpact}`;
  }

  // Build combined conditions note (weather + traffic + holidays)
  const trafficNote = trafficInsights?.trafficNote || '';
  let conditionsNote = '';
  const parts = [];

  if (weatherNote) {
    const weatherCodeLabel = t('weather.code', language);
    const prefix = `\n${weatherCodeLabel}: `;
    parts.push(weatherNote.replace(prefix, ''));
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
    .map(k => sanitizeDriverName(k.driverName));

  // Find drivers with rounds exceeding weight (>100%)
  const overCapacityDrivers = kpis
    .filter(k => k.rounds && k.rounds.some(r => r.weightUtilization > 100))
    .map(k => sanitizeDriverName(k.driverName));

  // Find drivers with long hours (>10 hours / 600 minutes)
  const longHoursDrivers = kpis
    .filter(k => k.totalDurationMinutes > 600)
    .map(k => sanitizeDriverName(k.driverName));

  // Build recommendation in natural language with line breaks
  let recommendation = '';

  // Line 1: Average metrics
  recommendation += `${t('recommendation.avg_time_util', language)}: ${Math.round(timeUtil)}%\n`;
  recommendation += `${t('recommendation.avg_weight_util', language)}: ${Math.round(averageWeightUtil)}%\n\n`;

  // Line 2: Underutilized drivers
  if (underweightShortHours.length > 0) {
    const driverLabelKey = underweightShortHours.length === 1
      ? 'recommendation.driver_singular'
      : 'recommendation.drivers_plural';
    const driverLabel = `${underweightShortHours.length} ${t(driverLabelKey, language)}`;
    recommendation += `${driverLabel} ${t('recommendation.low_weight_short_hours', language)}:\n`;
    recommendation += `${underweightShortHours.join(', ')}\n\n`;
  }

  // Line 3: Overutilized drivers (weight)
  if (overCapacityDrivers.length > 0) {
    const driverLabelKey = overCapacityDrivers.length === 1
      ? 'recommendation.driver_singular'
      : 'recommendation.drivers_plural';
    const driverLabel = `${overCapacityDrivers.length} ${t(driverLabelKey, language)}`;
    recommendation += `${driverLabel} ${t('recommendation.weight_overload', language)}:\n`;
    recommendation += `${overCapacityDrivers.join(', ')}\n\n`;
  }

  // Line 4: Long hours drivers
  if (longHoursDrivers.length > 0) {
    const driverLabelKey = longHoursDrivers.length === 1
      ? 'recommendation.driver_singular'
      : 'recommendation.drivers_plural';
    const driverLabel = `${longHoursDrivers.length} ${t(driverLabelKey, language)}`;
    recommendation += `${driverLabel} ${t('recommendation.overtime', language)}:\n`;
    recommendation += `${longHoursDrivers.join(', ')}\n\n`;
  }

  // Line 5: Recommendations
  if (underweightShortHours.length > 0 || overCapacityDrivers.length > 0 || longHoursDrivers.length > 0) {
    recommendation += t('recommendation.task_adjustment', language);
  } else if (averageWeightUtil < 60) {
    recommendation += t('recommendation.low_average_weight', language);
  } else if (timeUtil > 90) {
    recommendation += t('recommendation.high_time_util', language);
  } else {
    recommendation += t('recommendation.balanced', language);
  }

  // Capitalize first letter for English and Spanish
  let finalWeatherNote = conditionsNote.trim();
  if ((language === 'en' || language === 'es') && finalWeatherNote.length > 0) {
    finalWeatherNote = finalWeatherNote.charAt(0).toUpperCase() + finalWeatherNote.slice(1);
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
    weatherNote: finalWeatherNote,
    trafficNote: '',
  };
}

export function formatMinutesAsTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
