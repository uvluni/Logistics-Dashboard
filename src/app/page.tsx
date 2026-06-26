'use client';

import { useEffect, useState } from 'react';
import KPICard from '@/components/KPICard';
import DashboardSummary from '@/components/DashboardSummary';
import { RouteKPI, DashboardSummary as Summary } from '@/types';

function getNextBusinessDay(): string {
  let date = new Date();
  date.setDate(date.getDate() + 1);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split('T')[0];
}

function formatDateForDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  const shortYear = year.slice(-2);
  return `${day}/${month}/${shortYear}`;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [kpis, setKpis] = useState<RouteKPI[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedDate, setSelectedDate] = useState(getNextBusinessDay());
  const [error, setError] = useState('');

  // Removed auto-auth check - user must click login button

  useEffect(() => {
    if (isLoggedIn) {
      loadRoutes();
    }
  }, [selectedDate, isLoggedIn]);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/check', {
        credentials: 'include',
      });
      if (res.ok) {
        setIsLoggedIn(true);
        loadRoutes();
      }
    } catch (err) {
      setIsLoggedIn(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        setIsLoggedIn(true);
        loadRoutes();
      } else {
        setError('שגיאה בהתחברות. בדוק את הקרדנשיאלס.');
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRoutes() {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        sessionDate: selectedDate,
      });

      const res = await fetch(`/api/routes?${params}`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        setIsLoggedIn(false);
        setError('התחברות פקעה. בחברו שוב.');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const details = errorData.details ? ` (routes: ${errorData.details.routesStatus}, equipment: ${errorData.details.equipmentStatus})` : '';
        setError(`שגיאה בטעינת הנתונים${details}`);
        return;
      }

      const data = await res.json();
      setKpis(data.kpis || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError('שגיאה בטעינה. בדוק את החיבור לשרת.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoggedIn(false);
    setKpis([]);
    setSummary(null);
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            ROADNET
          </h1>
          <p className="text-gray-600 text-center mb-8 text-sm">
            דוח תכנון הפצה יומי
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2 text-right">
                שם משתמש
              </label>
              <input
                type="email"
                defaultValue="yuval@rasner.co.il"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                disabled
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2 text-right">
                סיסמא
              </label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                disabled
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isLoading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ROADNET - דוח תכנון הפצה</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            התנתק
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-8 mb-8 shadow-md text-white">
          <h2 className="text-2xl font-bold mb-6 text-right">תכנון הפצה - {formatDateForDisplay(selectedDate)}</h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-3 text-right opacity-90">
              בחר תאריך
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-4 py-3 border-0 rounded-lg text-gray-900 font-semibold text-lg focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
              />
              <div className="text-white text-center font-semibold text-sm px-2 py-3">
                {formatDateForDisplay(selectedDate)}
              </div>
            </div>
          </div>
          {isLoading && (
            <p className="text-center mt-4 text-blue-100 text-sm">טוען מסלולים...</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {summary && (
          <>
            <DashboardSummary summary={summary} normalWorkDayMinutes={kpis[0]?.normalWorkDayMinutes} />

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-right">
                מסלולים - KPIs
              </h2>

              {kpis.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600">אין מסלולים עבור התאריך שנבחר</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {kpis.map((kpi) => (
                    <KPICard key={kpi.routeId} kpi={kpi} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!summary && isLoggedIn && !error && !isLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg">
              בתהליך טעינת מסלולים ל-{selectedDate}...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
