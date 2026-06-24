import { formatMinutesAsTime } from '@/lib/kpiCalculator';
import { RouteKPI } from '@/types';

interface KPICardProps {
  kpi: RouteKPI;
}

export default function KPICard({ kpi }: KPICardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-600 text-sm">מסלול</p>
          <p className="text-lg font-semibold text-gray-900">{kpi.routeId}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">נהג</p>
          <p className="text-lg font-semibold text-gray-900">{kpi.driverName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <p className="text-gray-600 text-sm text-right">סוג רכב</p>
          <p className="text-lg font-semibold text-gray-900 text-right">{kpi.vehicleType}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 pb-4 border-b">
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
          <p className="text-gray-600 text-xs">ניצול זמן</p>
          <p className="text-sm font-semibold text-indigo-700">
            {kpi.timeUtilization}%
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
          <p className="text-lg font-semibold text-gray-900">{kpi.totalWeight.toLocaleString('he-IL')}kg</p>
        </div>
        <div>
          <p className="text-gray-600 text-xs">קיבולה</p>
          <p className="text-lg font-semibold text-gray-900">{kpi.vehicleCapacity.toLocaleString('he-IL')}kg</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <p className="text-gray-600 text-sm">ניצול משקל</p>
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

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <p className="text-gray-600 text-sm">ניצול זמן (מ-9 שעות)</p>
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
