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

function getUtilizationColor(utilization: number): string {
  if (utilization > 85) return 'var(--color-orange, #ea580c)';
  if (utilization > 60) return 'var(--color-green, #16a34a)';
  return 'var(--color-red, #dc2626)';
}

export default function DashboardSummary({ summary, normalWorkDayMinutes = 540 }: DashboardSummaryProps) {
  const { language, isRTL } = useLanguage();

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', textAlign: isRTL ? 'right' : 'left' }}>
        {t('summary.title', language)}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: t('summary.total_routes', language), value: summary.totalRoutes },
          { label: t('summary.total_stops', language), value: summary.totalStops },
          { label: t('summary.weight_utilization', language), value: `${summary.weightUtilization}%` },
          { label: language === 'he' ? `${t('summary.time_utilization', language)} (מ-${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)})` : language === 'es' ? `${t('summary.time_utilization', language)} (de ${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)})` : `${t('summary.time_utilization', language)} (${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)})`, value: `${summary.timeUtilization}%` },
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0' }}>{stat.label}</p>
            <p style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('summary.total_work_time', language)}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
            {formatTotalWorkTime(summary.totalWorkMinutes, language)}
          </p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('summary.avg_time_per_route', language)}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
            {formatTotalWorkTime(Math.round(summary.totalWorkMinutes / summary.totalRoutes), language)}
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('summary.routes_85_100', language)}</p>
            <p style={{ color: 'var(--color-orange, #ea580c)', fontSize: '18px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
              {summary.overUtilizedRoutes}
            </p>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-primary)', borderRight: '1px solid var(--border-primary)', paddingLeft: '12px', paddingRight: '12px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('summary.routes_under_50', language)}</p>
            <p style={{ color: 'var(--color-red, #dc2626)', fontSize: '18px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
              {summary.underUtilizedRoutes}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('summary.overweight_routes_count', language)}</p>
            <p style={{ color: 'var(--color-red, #dc2626)', fontSize: '18px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
              {summary.overWeightRoutes.length}
            </p>
          </div>
        </div>
      </div>

      {(summary.overWeightRoutes.length > 0 || summary.overTimeRoutes.length > 0) && (
        <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
          <p style={{ color: 'var(--color-red, #dc2626)', fontWeight: 600, margin: '0 0 12px 0', textAlign: isRTL ? 'right' : 'left' }}>
            {t('summary.overweight_routes', language)}
          </p>
          {summary.overWeightRoutes.length > 0 && (
            <div style={{ marginBottom: '12px', textAlign: isRTL ? 'right' : 'left' }}>
              <p style={{ color: 'var(--color-red, #dc2626)', margin: 0, fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>{t('summary.overweight_label', language)}</span> <span style={{ filter: 'blur(4px)' }}>{summary.overWeightRoutes.join(', ')}</span>
              </p>
            </div>
          )}
          {summary.overTimeRoutes.length > 0 && (
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <p style={{ color: 'var(--color-red, #dc2626)', margin: 0, fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>{t('summary.overtime_label', language)}</span> {language === 'he' ? `(מ-${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)}):` : language === 'es' ? `(de ${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)}):` : `(${normalWorkDayMinutes === 300 ? '5' : '9'} ${t('summary.time_hours', language)}):`}{' '}
                <span style={{ filter: 'blur(4px)' }}>{summary.overTimeRoutes.join(', ')}</span>
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, margin: '0 0 12px 0', textAlign: isRTL ? 'right' : 'left' }}>
          {t('summary.planning_recommendation', language)}
        </p>
        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
          {summary.recommendation.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            const isPureDriverList = /^[\s,א-ת\d\-]+$/.test(trimmed) && trimmed.length > 0 && !trimmed.includes(':');
            const prevLine = idx > 0 ? summary.recommendation.split('\n')[idx - 1] : '';
            const isAfterDriverHeader = prevLine.includes('נהגים') || prevLine.includes('נהג') || prevLine.includes('drivers') || prevLine.includes('driver') || prevLine.includes('conductores') || prevLine.includes('conductor');

            if (isPureDriverList || (isAfterDriverHeader && trimmed.length > 0)) {
              const parts: (string | React.ReactNode)[] = [];
              let lastIndex = 0;
              const hebrewNameRegex = /[א-ת]+(?:\s[א-ת]+)*/g;
              let match;

              while ((match = hebrewNameRegex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                  parts.push(line.substring(lastIndex, match.index));
                }
                parts.push(
                  <span key={`${idx}-${match.index}`} style={{ filter: 'blur(4px)' }}>{match[0]}</span>
                );
                lastIndex = match.index + match[0].length;
              }

              if (lastIndex < line.length) {
                parts.push(line.substring(lastIndex));
              }

              return (
                <div key={idx} style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '4px 0' }}>{parts.length > 0 ? parts : line}</div>
              );
            }

            const recommendationColor = (language === 'he' && trimmed.includes('טוב')) || (language === 'en' && trimmed.includes('balanced')) || (language === 'es' && trimmed.includes('equilibrada')) ? 'var(--color-green, #16a34a)' : (language === 'he' && trimmed.includes('חורגים')) || (language === 'en' && (trimmed.includes('exceeding') || trimmed.includes('overload'))) || (language === 'es' && (trimmed.includes('excede') || trimmed.includes('sobrecarga'))) ? 'var(--color-red, #dc2626)' : 'var(--color-orange, #ea580c)';

            return (
              <div key={idx} style={{ fontSize: '13px', color: recommendationColor, margin: '4px 0' }}>{line}</div>
            );
          })}
        </div>
      </div>

      {summary.weatherNote && (
        <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, margin: '0 0 8px 0', textAlign: isRTL ? 'right' : 'left' }}>
            {t('summary.daily_conditions', language)}
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: '13px', margin: 0, whiteSpace: 'pre-line', textAlign: isRTL ? 'right' : 'left' }}>
            {summary.weatherNote}
          </p>
        </div>
      )}
    </div>
  );
}
