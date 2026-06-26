import { formatMinutesAsTime } from '@/lib/kpiCalculator';
import { RouteKPI } from '@/types';

interface KPICardProps {
  kpi: RouteKPI;
}

export default function KPICard({ kpi }: KPICardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <div className="text-center flex-1">
          <p className="text-gray-600 text-xs">מסלול</p>
          <p className="text-lg font-semibold text-gray-900">RT{kpi.routeId}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-gray-600 text-xs">נהג</p>
          <p className="text-lg font-semibold text-gray-900 blur-sm">{kpi.driverName}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-gray-600 text-xs">סוג רכב</p>
          <p className="text-lg font-semibold text-gray-900">{kpi.vehicleType}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4 pb-4 border-b">
        <div className="bg-blue-50 rounded p-2">
          <p className="text-gray-600 text-xs">זמן כולל</p>
          <p className="text-sm font-semibold text-blue-700">
            {formatMinutesAsTime(kpi.totalDurationMinutes)}
          </p>
        </div>
        <div className="bg-green-50 rounded p-2">
          <p className="text-gray-600 text-xs">נסיעה</p>
          <p className="text-sm font-semibold text-green-700">
            {formatMinutesAsTime(kpi.travelTimeMinutes)}
          </p>
        </div>
        <div className="bg-purple-50 rounded p-2">
          <p className="text-gray-600 text-xs">שירות</p>
          <p className="text-sm font-semibold text-purple-700">
            {formatMinutesAsTime(kpi.serviceTimeMinutes)}
          </p>
        </div>
        <div className="bg-indigo-50 rounded p-2">
          <p className="text-gray-600 text-xs">ניצול זמן ({(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} שעות)</p>
          <p className="text-sm font-semibold text-indigo-700">
            {kpi.timeUtilization}%
          </p>
        </div>
        <div className="bg-amber-50 rounded p-2">
          <p className="text-gray-600 text-xs">ניצול משקל כללי</p>
          <p className="text-sm font-semibold text-amber-700">
            {kpi.weightUtilization}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <p className="text-gray-600 text-xs">תחנות</p>
          <p className="text-lg font-semibold text-gray-900">{kpi.stopCount}</p>
        </div>
        <div>
          <p className="text-gray-600 text-xs">משקל</p>
          <p className="text-lg font-semibold text-gray-900">{kpi.totalWeight.toLocaleString('he-IL')} ק&quot;ג</p>
        </div>
        <div>
          <p className="text-gray-600 text-xs">קיבולה</p>
          <p className="text-lg font-semibold text-gray-900">{kpi.vehicleCapacity.toLocaleString('he-IL')} ק&quot;ג</p>
        </div>
      </div>

      {kpi.rounds && kpi.rounds.length > 1 ? (
        <div className="mb-4">
          <p className="text-gray-600 text-sm font-semibold mb-3">ניצול משקל סבבים:</p>
          <div className="space-y-3">
            {kpi.rounds.map((round, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-600 text-xs">סבב {round.roundNumber} - {round.weight.toLocaleString('he-IL')} ק&quot;ג | {round.stopCount} תחנות</p>
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
            <p className="text-gray-600 text-sm">ניצול משקל סבב {kpi.totalWeight.toLocaleString('he-IL')} ק&quot;ג</p>
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
          <p className="text-gray-600 text-sm">ניצול זמן (מ-{(kpi.normalWorkDayMinutes || 540) === 300 ? '5' : '9'} שעות) {formatMinutesAsTime(kpi.totalDurationMinutes)}</p>
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

      <div className="space-y-1">
        <p className="text-gray-600 text-xs font-semibold">תובנות:</p>
        {kpi.insights.map((insight, idx) => (
          <p key={idx} className="text-gray-700 text-sm flex items-start">
            <span className="mr-2">•</span>
            <span>{insight}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
