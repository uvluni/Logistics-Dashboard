import { formatMinutesAsTime } from '@/lib/kpiCalculator';
import { RouteKPI } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface KPICardProps {
  kpi: RouteKPI;
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 100) return '#dc2626';
  if (utilization > 85) return '#ea580c';
  return '#16a34a';
}

export default function KPICard({ kpi }: KPICardProps) {
  const { language, isRTL } = useLanguage();

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.route', language)}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{kpi.routeId}</p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.driver', language)}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0, filter: 'blur(4px)', textAlign: isRTL ? 'right' : 'left' }}>{kpi.driverName}</p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.vehicle_type', language)}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{kpi.vehicleType}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-primary)' }}>
        {[
          { label: t('kpi.total_time', language), value: formatMinutesAsTime(kpi.totalDurationMinutes) },
          { label: t('kpi.travel_time', language), value: formatMinutesAsTime(kpi.travelTimeMinutes) },
          { label: t('kpi.service_time', language), value: formatMinutesAsTime(kpi.serviceTimeMinutes) },
          { label: `${t('kpi.time_utilization', language)} (${(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} ${t('summary.time_hours', language)})`, value: `${kpi.timeUtilization}%` },
          { label: t('kpi.weight_utilization', language), value: `${kpi.weightUtilization}%` },
        ].map((metric, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--bg-metric)', border: '1px solid var(--border-metric)', borderRadius: '6px', padding: '8px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '10px', margin: '0 0 4px 0', textAlign: isRTL ? 'right' : 'left' }}>{metric.label}</p>
            <p style={{ color: 'var(--color-data)', fontSize: '12px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{metric.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.stops', language)}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{kpi.stopCount}</p>
        </div>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.weight', language)}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{kpi.totalWeight.toLocaleString(language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US')} {t('kpi.kg', language)}</p>
        </div>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.capacity', language)}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{kpi.vehicleCapacity.toLocaleString(language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US')} {t('kpi.kg', language)}</p>
        </div>
      </div>

      {kpi.rounds && kpi.rounds.length > 1 ? (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, margin: '0 0 12px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.weight_utilization_rounds', language)}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {kpi.rounds.map((round, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.round', language)} {round.roundNumber} - {round.weight.toLocaleString(language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US')} {t('kpi.kg', language)} | {round.stopCount} {t('kpi.stops', language)}</p>
                  <p style={{ color: getUtilizationColor(round.weightUtilization), fontSize: '11px', fontWeight: 600, margin: 0 }}>{round.weightUtilization}%</p>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--border-primary)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: getUtilizationColor(round.weightUtilization), width: `${Math.min(round.weightUtilization, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.weight_utilization_round', language)} {kpi.totalWeight.toLocaleString(language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US')} {t('kpi.kg', language)}</p>
            <p style={{ color: getUtilizationColor(kpi.weightUtilization), fontSize: '12px', fontWeight: 600, margin: 0 }}>{kpi.weightUtilization}%</p>
          </div>
          <div style={{ width: '100%', backgroundColor: 'var(--border-primary)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: getUtilizationColor(kpi.weightUtilization), width: `${Math.min(kpi.weightUtilization, 100)}%` }} />
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
            {t('kpi.time_utilization_label', language)} {language === 'he' ? `(מ-${(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} ${t('summary.time_hours', language)})` : language === 'es' ? `(de ${(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} ${t('summary.time_hours', language)})` : `(${(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} ${t('summary.time_hours', language)})`} {formatMinutesAsTime(kpi.totalDurationMinutes)}
          </p>
          <p style={{ color: getUtilizationColor(kpi.timeUtilization), fontSize: '12px', fontWeight: 600, margin: 0 }}>{kpi.timeUtilization}%</p>
        </div>
        <div style={{ width: '100%', backgroundColor: 'var(--border-primary)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
          <div style={{ height: '100%', backgroundColor: getUtilizationColor(kpi.timeUtilization), width: `${Math.min(kpi.timeUtilization, 100)}%` }} />
        </div>
      </div>

      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, margin: '0 0 8px 0', textAlign: isRTL ? 'right' : 'left' }}>{t('kpi.insights', language)}</p>
        {kpi.insights.map((insight, idx) => (
          <p key={idx} style={{ color: 'var(--text-primary)', fontSize: '13px', margin: '4px 0', textAlign: isRTL ? 'right' : 'left' }}>
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
}
