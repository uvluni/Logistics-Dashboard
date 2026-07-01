import { formatMinutesAsTime } from '@/lib/kpiCalculator';
import { RouteKPI } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface KPICardProps {
  kpi: RouteKPI;
}

export default function KPICard({ kpi }: KPICardProps) {
  const { language, isRTL } = useLanguage();
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <div className="text-center flex-1">
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.route', language)}</p>
          <p className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{kpi.routeId}</p>
        </div>
        <div className="text-center flex-1">
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.driver', language)}</p>
          <p className={`text-lg font-semibold text-gray-900 blur-sm ${isRTL ? 'text-right' : 'text-left'}`}>{kpi.driverName}</p>
        </div>
        <div className="text-center flex-1">
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.vehicle_type', language)}</p>
          <p className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{kpi.vehicleType}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4 pb-4 border-b">
        <div className="bg-blue-50 rounded p-2">
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.total_time', language)}</p>
          <p className={`text-sm font-semibold text-blue-700 ${isRTL ? 'text-right' : 'text-left'}`}>
            {formatMinutesAsTime(kpi.totalDurationMinutes)}
          </p>
        </div>
        <div className="bg-green-50 rounded p-2">
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.travel_time', language)}</p>
          <p className={`text-sm font-semibold text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>
            {formatMinutesAsTime(kpi.travelTimeMinutes)}
          </p>
        </div>
        <div className="bg-purple-50 rounded p-2">
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.service_time', language)}</p>
          <p className={`text-sm font-semibold text-purple-700 ${isRTL ? 'text-right' : 'text-left'}`}>
            {formatMinutesAsTime(kpi.serviceTimeMinutes)}
          </p>
        </div>
        <div className="bg-indigo-50 rounded p-2">
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.time_utilization', language)} ({(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} {t('summary.time_hours', language)})</p>
          <p className={`text-sm font-semibold text-indigo-700 ${isRTL ? 'text-right' : 'text-left'}`}>
            {kpi.timeUtilization}%
          </p>
        </div>
        <div className="bg-amber-50 rounded p-2">
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.weight_utilization', language)}</p>
          <p className={`text-sm font-semibold text-amber-700 ${isRTL ? 'text-right' : 'text-left'}`}>
            {kpi.weightUtilization}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.stops', language)}</p>
          <p className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{kpi.stopCount}</p>
        </div>
        <div>
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.weight', language)}</p>
          <p className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{kpi.totalWeight.toLocaleString(language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US')} {t('kpi.kg', language)}</p>
        </div>
        <div>
          <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.capacity', language)}</p>
          <p className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{kpi.vehicleCapacity.toLocaleString(language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US')} {t('kpi.kg', language)}</p>
        </div>
      </div>

      {kpi.rounds && kpi.rounds.length > 1 ? (
        <div className="mb-4">
          <p className={`text-gray-600 text-sm font-semibold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.weight_utilization_rounds', language)}</p>
          <div className="space-y-3">
            {kpi.rounds.map((round, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <p className={`text-gray-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.round', language)} {round.roundNumber} - {round.weight.toLocaleString(language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US')} {t('kpi.kg', language)} | {round.stopCount} {t('kpi.stops', language)}</p>
                  <p
                    className={`text-xs font-semibold ${
                      round.weightUtilization > 100
                        ? 'text-red-600'
                        : round.weightUtilization > 85
                          ? 'text-orange-600'
                          : 'text-green-600'
                    }`}
                  >
                    {round.weightUtilization}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      round.weightUtilization > 100
                        ? 'bg-red-500'
                        : round.weightUtilization > 85
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(round.weightUtilization, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.weight_utilization_round', language)} {kpi.totalWeight.toLocaleString(language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US')} {t('kpi.kg', language)}</p>
            <p
              className={`text-sm font-semibold ${
                kpi.weightUtilization > 100
                  ? 'text-red-600'
                  : kpi.weightUtilization > 85
                    ? 'text-orange-600'
                    : 'text-green-600'
              }`}
            >
              {kpi.weightUtilization}%
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                kpi.weightUtilization > 100
                  ? 'bg-red-500'
                  : kpi.weightUtilization > 85
                    ? 'bg-orange-500'
                    : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(kpi.weightUtilization, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.time_utilization_label', language)} {language === 'he' ? `(מ-${(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} ${t('summary.time_hours', language)})` : language === 'es' ? `(de ${(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} ${t('summary.time_hours', language)})` : `(${(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} ${t('summary.time_hours', language)})`} {formatMinutesAsTime(kpi.totalDurationMinutes)}</p>
          <p
            className={`text-sm font-semibold ${
              kpi.timeUtilization > 100
                ? 'text-red-600'
                : kpi.timeUtilization > 85
                  ? 'text-orange-600'
                  : 'text-green-600'
            }`}
          >
            {kpi.timeUtilization}%
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              kpi.timeUtilization > 100
                ? 'bg-red-500'
                : kpi.timeUtilization > 85
                  ? 'bg-orange-500'
                  : 'bg-green-500'
            }`}
            style={{
              width: `${Math.min(kpi.timeUtilization, 100)}%`,
            }}
          />
        </div>
      </div>

      <div className={`space-y-1 ${isRTL ? 'text-right' : ''}`}>
        <p className={`text-gray-600 text-xs font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('kpi.insights', language)}</p>
        {kpi.insights.map((insight, idx) => (
          <p key={idx} className='text-gray-700 text-sm'>
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
}
