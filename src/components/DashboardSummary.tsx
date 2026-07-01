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
  if (language === 'he') return `${hours} שעות, ${mins} דקות`;
  if (language === 'es') return `${hours} horas, ${mins} minutos`;
  return `${hours} hours, ${mins} minutes`;
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
          <p className="text-gray-600 text-sm text-right">ניצול משקל</p>
          <p className={`text-3xl font-bold text-right ${utilizationColor}`}>
            {summary.weightUtilization}%
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm text-right">ניצול זמן (מ-{normalWorkDayMinutes === 300 ? '5' : '9'} שעות)</p>
          <p className="text-3xl font-bold text-indigo-600 text-right">
            {summary.timeUtilization}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 md:hidden">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm text-right">סך זמן עבודה</p>
          <p className="text-3xl font-bold text-purple-600 text-right">
            {formatTotalWorkTime(summary.totalWorkMinutes)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm text-right">זמן ממוצע למסלול</p>
          <p className="text-3xl font-bold text-blue-600 text-right">
            {formatTotalWorkTime(Math.round(summary.totalWorkMinutes / summary.totalRoutes))}
          </p>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm text-right">סך זמן עבודה</p>
          <p className="text-3xl font-bold text-purple-600 text-right">
            {formatTotalWorkTime(summary.totalWorkMinutes)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm text-right">זמן ממוצע למסלול</p>
          <p className="text-3xl font-bold text-blue-600 text-right">
            {formatTotalWorkTime(Math.round(summary.totalWorkMinutes / summary.totalRoutes))}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm text-right">מסלולים שמשקלם 85%-100%</p>
            <p className="text-2xl font-bold text-orange-600 text-right">
              {summary.overUtilizedRoutes}
            </p>
          </div>
          <div className="text-center border-r border-l border-gray-200 px-4">
            <p className="text-gray-600 text-sm text-right">מסלולים שמשקלם קטן מ-50%</p>
            <p className="text-2xl font-bold text-red-600 text-right">
              {summary.underUtilizedRoutes}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm text-right">מסלולים שחורגים מקיבולת המשקל</p>
            <p className="text-2xl font-bold text-red-700 text-right">
              {summary.overWeightRoutes.length}
            </p>
          </div>
        </div>
      </div>

      {(summary.overWeightRoutes.length > 0 || summary.overTimeRoutes.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-semibold text-right">
            ⚠️ מסלולים חורגים:
          </p>
          {summary.overWeightRoutes.length > 0 && (
            <div className="text-right mt-3">
              <p className="text-red-700">
                <span className="font-semibold">חורגים משקל:</span>{' '}
                <span className="blur-sm">{summary.overWeightRoutes.join(', ')}</span>
              </p>
            </div>
          )}
          {summary.overTimeRoutes.length > 0 && (
            <div className="text-right mt-3">
              <p className="text-red-700">
                <span className="font-semibold">חורגים זמן (מ-{normalWorkDayMinutes === 300 ? '5' : '9'} שעות):</span>{' '}
                <span className="blur-sm">{summary.overTimeRoutes.join(', ')}</span>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
        <p className="text-gray-600 text-sm text-right font-semibold mb-3">
          💡 חוות דעת על התכנון:
        </p>
        <div
          className={`text-lg font-semibold text-right whitespace-pre-line ${
            summary.recommendation.includes('טוב')
              ? 'text-green-700'
              : summary.recommendation.includes('חורגים')
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
          <p className="text-gray-600 text-sm text-right font-semibold mb-3">
            ⛅ תנאים יומיים:
          </p>
          <p className="text-gray-700 text-right font-medium whitespace-pre-line">
            {summary.weatherNote}
          </p>
        </div>
      )}
    </div>
  );
}
