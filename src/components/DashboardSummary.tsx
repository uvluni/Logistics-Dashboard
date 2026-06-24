import { DashboardSummary as Summary } from '@/types';
import { formatMinutesAsTime } from '@/lib/kpiCalculator';

interface DashboardSummaryProps {
  summary: Summary;
}

export default function DashboardSummary({ summary }: DashboardSummaryProps) {
  const utilizationColor =
    summary.averageWeightUtilization > 85
      ? 'text-orange-600'
      : summary.averageWeightUtilization > 60
        ? 'text-green-600'
        : 'text-red-600';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-right">סיכום כללי</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm text-right">סך מסלולים</p>
          <p className="text-3xl font-bold text-blue-600 text-right">
            {summary.totalRoutes}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm text-right">סך תחנות</p>
          <p className="text-3xl font-bold text-green-600 text-right">
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
          <p className="text-gray-600 text-sm text-right">ניצול זמן (מ-9 שעות)</p>
          <p className="text-3xl font-bold text-indigo-600 text-right">
            {summary.timeUtilization}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 md:hidden">
        <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
          <p className="text-gray-600 text-sm text-right">סך זמן עבודה</p>
          <p className="text-3xl font-bold text-purple-600 text-right">
            {formatMinutesAsTime(summary.totalWorkMinutes)}
          </p>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-1 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm text-right">סך זמן עבודה</p>
          <p className="text-3xl font-bold text-purple-600 text-right">
            {formatMinutesAsTime(summary.totalWorkMinutes)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm text-right">עומסים (&gt;85%)</p>
            <p className="text-2xl font-bold text-orange-600 text-right">
              {summary.overUtilizedRoutes}
            </p>
          </div>
          <div className="text-center border-r border-l border-gray-200">
            <p className="text-gray-600 text-sm text-right">תת-ניצול (&lt;50%)</p>
            <p className="text-2xl font-bold text-red-600 text-right">
              {summary.underUtilizedRoutes}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm text-right">חרוגים משקל (&gt;100%)</p>
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
                <span className="font-semibold">חורגים משקל:</span> {summary.overWeightRoutes.join(', ')}
              </p>
            </div>
          )}
          {summary.overTimeRoutes.length > 0 && (
            <div className="text-right mt-3">
              <p className="text-red-700">
                <span className="font-semibold">חורגים זמן (מ-9 שעות):</span> {summary.overTimeRoutes.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-gray-600 text-sm text-right font-semibold mb-3">
          💡 חוות דעת על התכנון:
        </p>
        <div
          className={`text-lg font-semibold text-right whitespace-pre-line ${
            summary.recommendation.includes('טוב')
              ? 'text-green-700'
              : summary.recommendation.includes('התערבות')
                ? 'text-red-700'
                : 'text-orange-700'
          }`}
        >
          {summary.recommendation}
        </div>
        <p className="text-gray-600 text-sm text-right mt-3">
          יום עבודה רגיל: {formatMinutesAsTime(summary.normalWorkDay)}
        </p>
      </div>
    </div>
  );
}
