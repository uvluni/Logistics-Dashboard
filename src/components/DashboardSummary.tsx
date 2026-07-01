'use client';

import { DashboardSummary as Summary } from '@/types';
import { formatMinutesAsTime } from '@/lib/kpiCalculator';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface DashboardSummaryProps {
  summary: Summary;
  normalWorkDayMinutes?: number;
}

function formatTotalWorkTime(minutes: number, language: 'he' | 'en' | 'es'): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (language === 'he') return `${hours} ${t('summary.time_hours', language)}, ${mins} ${t('summary.minutes', language)}`;
  if (language === 'es') return `${hours} ${t('summary.time_hours', language)}, ${mins} ${t('summary.minutes', language)}`;
  return `${hours} ${t('summary.time_hours', language)}, ${mins} ${t('summary.minutes', language)}`;
}

export default function DashboardSummary({ summary, normalWorkDayMinutes = 540 }: DashboardSummaryProps) {
  const { language, isRTL } = useLanguage();
  const utilizationColor =
    summary.weightUtilization > 85
      ? 'text-orange-600'
      : summary.weightUtilization > 60
        ? 'text-green-600'
        : 'text-red-600';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h2 className={`text-2xl font-bold text-gray-900 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        {t('summary.title', language)}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('summary.total_routes', language)}
          </p>
          <p className={`text-3xl font-bold text-blue-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {summary.totalRoutes}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('summary.total_stops', language)}
          </p>
          <p className={`text-3xl font-bold text-green-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {summary.totalStops}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('summary.weight_utilization', language)}
          </p>
          <p className={`text-3xl font-bold ${isRTL ? 'text-right' : 'text-left'} ${utilizationColor}`}>
            {summary.weightUtilization}%
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {language === 'he'
              ? `${t('summary.time_utilization', language)} (מ-${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)})`
              : language === 'es'
              ? `${t('summary.time_utilization', language)} (de ${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)})`
              : `${t('summary.time_utilization', language)} (${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)})`}
          </p>
          <p className={`text-3xl font-bold text-indigo-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {summary.timeUtilization}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 md:hidden">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('summary.total_work_time', language)}</p>
          <p className={`text-3xl font-bold text-purple-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {formatTotalWorkTime(summary.totalWorkMinutes, language)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('summary.avg_time_per_route', language)}</p>
          <p className={`text-3xl font-bold text-blue-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {formatTotalWorkTime(Math.round(summary.totalWorkMinutes / summary.totalRoutes), language)}
          </p>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('summary.total_work_time', language)}</p>
          <p className={`text-3xl font-bold text-purple-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {formatTotalWorkTime(summary.totalWorkMinutes, language)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('summary.avg_time_per_route', language)}</p>
          <p className={`text-3xl font-bold text-blue-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {formatTotalWorkTime(Math.round(summary.totalWorkMinutes / summary.totalRoutes), language)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className={`text-center ${isRTL ? '' : ''}`}>
            <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('summary.routes_85_100', language)}</p>
            <p className={`text-2xl font-bold text-orange-600 ${isRTL ? 'text-right' : 'text-left'}`}>
              {summary.overUtilizedRoutes}
            </p>
          </div>
          <div className={`text-center border-r border-l border-gray-200 px-4 ${isRTL ? '' : ''}`}>
            <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('summary.routes_under_50', language)}</p>
            <p className={`text-2xl font-bold text-red-600 ${isRTL ? 'text-right' : 'text-left'}`}>
              {summary.underUtilizedRoutes}
            </p>
          </div>
          <div className={`text-center ${isRTL ? '' : ''}`}>
            <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('summary.overweight_routes_count', language)}</p>
            <p className={`text-2xl font-bold text-red-700 ${isRTL ? 'text-right' : 'text-left'}`}>
              {summary.overWeightRoutes.length}
            </p>
          </div>
        </div>
      </div>

      {(summary.overWeightRoutes.length > 0 || summary.overTimeRoutes.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className={`text-red-800 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('summary.overweight_routes', language)}
          </p>
          {summary.overWeightRoutes.length > 0 && (
            <div className={`mt-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-red-700">
                <span className="font-semibold">{t('summary.overweight_label', language)}</span>{' '}
                <span className="blur-sm">{summary.overWeightRoutes.join(', ')}</span>
              </p>
            </div>
          )}
          {summary.overTimeRoutes.length > 0 && (
            <div className={`mt-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-red-700">
                <span className="font-semibold">{t('summary.overtime_label', language)}</span> {language === 'he' ? `(מ-${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)}):` : language === 'es' ? `(de ${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)}):` : `(${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)}):`}{' '}
                <span className="blur-sm">{summary.overTimeRoutes.join(', ')}</span>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
        <p className={`text-gray-600 text-sm font-semibold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('summary.planning_recommendation', language)}
        </p>
        <div
          className={`text-lg font-semibold whitespace-pre-line ${isRTL ? 'text-right' : 'text-left'} ${
            (language === 'he' && summary.recommendation.includes('טוב')) ||
            (language === 'en' && summary.recommendation.includes('balanced')) ||
            (language === 'es' && summary.recommendation.includes('equilibrada'))
              ? 'text-green-700'
              : (language === 'he' && summary.recommendation.includes('חורגים')) ||
                (language === 'en' && summary.recommendation.includes('exceeding') || summary.recommendation.includes('overload')) ||
                (language === 'es' && summary.recommendation.includes('excede') || summary.recommendation.includes('sobrecarga'))
                ? 'text-red-700'
                : 'text-orange-700'
          }`}
        >
          {summary.recommendation.split('\n').map((line, idx) => {
            const trimmed = line.trim();

            // Check if this is a line with driver names
            // Either: pure driver list (only Hebrew + commas) OR a line after a "נהגים" header
            const isPureDriverList = /^[\s,א-ת]+$/.test(trimmed) && trimmed.length > 0 && !trimmed.includes(':');

            // Check if previous line indicates driver names are coming
            const prevLine = idx > 0 ? summary.recommendation.split('\n')[idx - 1] : '';
            const isAfterDriverHeader = prevLine.includes('נהגים') || prevLine.includes('נהג');

            if (isPureDriverList || (isAfterDriverHeader && trimmed.length > 0)) {
              const blurredLine = line.replace(/[א-ת]+(?:\s[א-ת]+)*/g, (match) => {
                return `<span class="blur-sm">${match}</span>`;
              });
              return (
                <div key={idx} dangerouslySetInnerHTML={{ __html: blurredLine }} />
              );
            }

            return (
              <div key={idx}>{line}</div>
            );
          })}
        </div>
      </div>

      {summary.weatherNote && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className={`text-gray-600 text-sm font-semibold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('summary.daily_conditions', language)}
          </p>
          <p className={`text-gray-700 font-medium whitespace-pre-line ${isRTL ? 'text-right' : 'text-left'}`}>
            {summary.weatherNote}
          </p>
        </div>
      )}
    </div>
  );
}
