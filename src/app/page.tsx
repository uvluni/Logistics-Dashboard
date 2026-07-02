'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import KPICard from '@/components/KPICard';
import DashboardSummary from '@/components/DashboardSummary';
import { RouteKPI, DashboardSummary as Summary } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

function getTodayDate(): string {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

function getNextBusinessDay(): string {
  let date = new Date();
  const today = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // If today is Thursday (4), Friday (5), or Saturday (6), jump to next Sunday
  // Otherwise advance by 1 day (including Sunday → Monday)
  if (today === 4 || today === 5 || today === 6) {
    // Calculate days until next Sunday
    const daysUntilNextSunday = (7 - today);
    date.setDate(date.getDate() + daysUntilNextSunday);
  } else {
    // Otherwise just go to next day (Sun→Mon, Mon→Tue, Tue→Wed, Wed→Thu)
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
  const { language, setLanguage, isRTL } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [kpis, setKpis] = useState<RouteKPI[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const datePickerRef = useRef<DatePicker>(null);

  const loadRoutes = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        sessionDate: selectedDate,
        language: language,
      });

      const res = await fetch(`/api/routes?${params}`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        setIsLoggedIn(false);
        setError(t('error.session_expired', language));
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const details = errorData.details ? ` (routes: ${errorData.details.routesStatus}, equipment: ${errorData.details.equipmentStatus})` : '';
        setError(t('error.load_data_failed', language) + details);
        return;
      }

      const data = await res.json();
      setKpis(data.kpis || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(t('error.connection_failed', language));
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, language, setIsLoading, setError, setIsLoggedIn, setKpis, setSummary]);

  // Initialize date on client only to avoid hydration mismatch
  useEffect(() => {
    setSelectedDate(getTodayDate());
    setMounted(true);
    // Clear session on page load to return to login screen on refresh
    const initAuth = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (err) {
        // Silently fail
      }
      // Check auth after clearing session
      try {
        const res = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        if (res.ok) {
          setIsLoggedIn(true);
        }
      } catch (err) {
        setIsLoggedIn(false);
      }
    };
    initAuth();
  }, []);

  // Reset date to today when logged in
  useEffect(() => {
    if (isLoggedIn) {
      setSelectedDate(getTodayDate());
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && selectedDate) {
      loadRoutes();
    }
  }, [selectedDate, isLoggedIn, loadRoutes]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get CSRF token first
      const csrfRes = await fetch('/api/auth/csrf', { credentials: 'include' });
      if (!csrfRes.ok) {
        setError(t('auth.connection_error', language));
        setIsLoading(false);
        return;
      }

      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.token;

      // Login with CSRF token
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      if (res.ok) {
        setIsLoggedIn(true);
        loadRoutes();
      } else {
        setError(t('auth.error', language));
      }
    } catch (err) {
      setError(t('auth.connection_error', language));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoggedIn(false);
    setKpis([]);
    setSummary(null);
  }

  async function handleDownloadReport() {
    if (!selectedDate) {
      setError(t('error.select_date_first', language));
      return;
    }

    try {
      const params = new URLSearchParams({
        sessionDate: selectedDate,
        language: language,
      });

      const res = await fetch(`/api/routes?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        setError(t('error.download_failed', language));
        return;
      }

      const data = await res.json();

      // Create Excel file from KPI data
      const kpis = data.kpis || [];

      // Prepare data for Excel
      const excelData = kpis.map(kpi => ({
        'Route ID': kpi.routeId,
        'Driver Name': kpi.driverName,
        'Vehicle Type': kpi.vehicleType,
        'Total Duration (min)': kpi.totalDurationMinutes,
        'Travel Time (min)': kpi.travelTimeMinutes,
        'Service Time (min)': kpi.serviceTimeMinutes,
        'Stops': kpi.stopCount,
        'Total Weight (kg)': kpi.totalWeight,
        'Vehicle Capacity (kg)': kpi.vehicleCapacity,
        'Weight Utilization (%)': kpi.weightUtilization,
        'Time Utilization (%)': kpi.timeUtilization,
        'Insights': kpi.insights?.join('; ') || '',
        'Rounds': kpi.rounds?.length || 0,
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Routes');

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Route ID
        { wch: 15 }, // Driver Name
        { wch: 15 }, // Vehicle Type
        { wch: 16 }, // Total Duration
        { wch: 14 }, // Travel Time
        { wch: 14 }, // Service Time
        { wch: 8 },  // Stops
        { wch: 14 }, // Total Weight
        { wch: 16 }, // Vehicle Capacity
        { wch: 16 }, // Weight Utilization
        { wch: 14 }, // Time Utilization
        { wch: 40 }, // Insights
        { wch: 8 },  // Rounds
      ];
      worksheet['!cols'] = colWidths;

      // Download file
      XLSX.writeFile(workbook, `routes-report-${selectedDate}.xlsx`);
    } catch (err) {
      setError(t('error.download_failed', language));
    }
  }

  async function handleDownloadStopsReport() {
    if (!selectedDate) {
      setError(t('error.select_date_first', language));
      return;
    }

    try {
      const params = new URLSearchParams({
        sessionDate: selectedDate,
      });

      const res = await fetch(`/api/stops?${params}`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        setError(t('error.session_expired', language));
        setIsLoggedIn(false);
        return;
      }

      if (!res.ok) {
        setError(t('error.download_failed', language));
        return;
      }

      const data = await res.json();

      // Extract stops data from ROADNET API response
      const routes = data.items || data.routes || data.data || [];
      const stopsData: any[] = [];

      routes.forEach((route: any) => {
        const routeId = route.identity?.identifier || '';
        const workerFirstName = route.workersInfo?.[0]?.name?.firstName || '';
        const equipmentIdentifier = route.equipmentInfo?.[0]?.specificEquipmentInfo?.identity?.identifier || '';

        // Process each ServiceableStop in the route (excluding depot stops)
        if (route.stops && Array.isArray(route.stops)) {
          route.stops.forEach((stop: any) => {
            // Only include ServiceableStop, not DEPOT or MidrouteDepotStop
            if (stop.stopType === 'ServiceableStop') {
              const ssi = stop.serviceableStopInfo || {};
              const locationInfo = ssi.locationInfo || {};
              const address = locationInfo.address || {};

              stopsData.push({
                'Route ID': routeId,
                'Session Date': selectedDate,
                'Worker First Name': workerFirstName,
                'Equipment Identifier': equipmentIdentifier,
                'Stop Description': ssi.specialInstructions || locationInfo.description || '',
                'Arrival Timestamp': ssi.arrivalTimestamp || '',
                'Departure Timestamp': ssi.departureTimestamp || '',
                'Location Identifier': locationInfo.identity?.identifier || '',
                'Location Description': locationInfo.description || '',
                'Address Line 1': address.addressLine1 || '',
                'State Or Province': address.stateOrProvince || '',
                'Total Delivery Quantities': ssi.totalDeliveryQuantities?.[0] || 0,
              });
            }
          });
        }
      });

      // Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(stopsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stops');

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Route ID
        { wch: 13 }, // Session Date
        { wch: 15 }, // Worker First Name
        { wch: 18 }, // Equipment Identifier
        { wch: 20 }, // Stop Description
        { wch: 20 }, // Arrival Timestamp
        { wch: 20 }, // Departure Timestamp
        { wch: 18 }, // Location Identifier
        { wch: 20 }, // Location Description
        { wch: 18 }, // Address Line 1
        { wch: 16 }, // State Or Province
        { wch: 14 }, // Total Delivery Quantities
      ];
      worksheet['!cols'] = colWidths;

      // Download file
      XLSX.writeFile(workbook, `stops-report-${selectedDate}.xlsx`);
    } catch (err) {
      setError(t('error.download_failed', language));
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setLanguage('he')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              language === 'he'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            עב
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              language === 'en'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('es')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              language === 'es'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            ES
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            {t('app.title', language)}
          </h1>
          <p className="text-gray-600 text-center mb-8 text-sm">
            {t('app.subtitle', language)}
          </p>

          <form onSubmit={handleLogin} className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className={`block text-gray-700 text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('auth.email', language)}
              </label>
              <input
                type="email"
                defaultValue="yuval@rasner.co.il"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                disabled
              />
            </div>

            <div>
              <label className={`block text-gray-700 text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('auth.password', language)}
              </label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                disabled
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isLoading ? t('auth.connecting', language) : t('auth.login', language)}
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
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title', language)}</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setLanguage('he')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                language === 'he'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              עב
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                language === 'es'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              ES
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              {t('auth.logout', language)}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-8 mb-8 shadow-md text-white">
          <h2 className={`text-2xl font-bold mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.planning_header', language)} - {selectedDate ? formatDateForDisplay(selectedDate) : '...'}</h2>
          <div className="max-w-md">
            <label className={`block text-sm font-medium mb-3 opacity-90 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('dashboard.select_date', language)}
            </label>
            <div className="flex gap-2 items-center flex-wrap">
              <div
                onClick={() => datePickerRef.current?.setOpen(true)}
                className="bg-white hover:bg-gray-50 cursor-pointer rounded-lg px-2 py-2 flex items-center gap-2 transition-colors focus-within:ring-2 focus-within:ring-blue-300 focus-within:ring-offset-2 flex-1 min-w-40"
                suppressHydrationWarning
              >
                <span className="text-2xl">📅</span>
                {selectedDate && (
                  <DatePicker
                    ref={datePickerRef}
                    selected={new Date(selectedDate + 'T00:00:00')}
                    onChange={(date: Date | null) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setSelectedDate(`${year}-${month}-${day}`);
                      }
                    }}
                    onSelect={() => {
                      setTimeout(() => {
                        datePickerRef.current?.setOpen(false);
                      }, 0);
                    }}
                    dateFormat="dd/MM/yy"
                    className="flex-1 border-0 bg-transparent text-gray-900 font-semibold text-lg focus:outline-none"
                    wrapperClassName="flex-1"
                  />
                )}
              </div>
              <button
                onClick={handleDownloadReport}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                דוח מסלולים
              </button>
              <button
                onClick={handleDownloadStopsReport}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                דוח תחנות
              </button>
            </div>
          </div>
          {isLoading && (
            <p className="text-center mt-4 text-blue-100 text-sm">{t('dashboard.loading_routes', language)}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {summary && kpis.length > 0 && (
          <>
            <DashboardSummary summary={summary} normalWorkDayMinutes={kpis[0]?.normalWorkDayMinutes} />

            <div className="mb-8">
              <h2 className={`text-2xl font-bold text-gray-900 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('kpi.title', language)}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {kpis.map((kpi) => (
                  <KPICard key={kpi.routeId} kpi={kpi} />
                ))}
              </div>
            </div>
          </>
        )}

        {summary && kpis.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg">{t('dashboard.no_routes_message', language)}</p>
          </div>
        )}

        {!summary && isLoggedIn && !error && !isLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className={`text-gray-600 text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('dashboard.loading_message', language)}{selectedDate}...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
