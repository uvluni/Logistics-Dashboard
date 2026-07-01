export type Language = 'he' | 'en' | 'es';

export const translations: Record<Language, Record<string, string>> = {
  he: {
    // Header & Auth
    'app.title': 'ROADNET',
    'app.subtitle': 'דוח תכנון הפצה יומי',
    'auth.email': 'שם משתמש',
    'auth.password': 'סיסמא',
    'auth.login': 'התחבר',
    'auth.logout': 'התנתק',
    'auth.connecting': 'מתחבר...',
    'auth.error': 'שגיאה בהתחברות. בדוק את הקרדנשיאלס.',
    'auth.connection_error': 'שגיאה בחיבור לשרת',

    // Dashboard Header
    'dashboard.title': 'ROADNET - דוח תכנון הפצה',
    'dashboard.select_date': 'בחר תאריך',
    'dashboard.loading': 'טוען מסלולים...',

    // Summary Section
    'summary.title': 'סיכום כללי',
    'summary.total_routes': 'סך הכל מסלולים',
    'summary.total_stops': 'סך הכל תחנות',
    'summary.weight_utilization': 'ניצול משקל',
    'summary.time_utilization': 'ניצול זמן',
    'summary.time_hours': 'שעות',
    'summary.overweight_routes': '⚠️ מסלולים חורגים',
    'summary.planning_recommendation': '💡 חוות דעת על התכנון',
    'summary.daily_conditions': '⛅ תנאים יומיים',
    'summary.total_work_time': 'סך זמן עבודה',
    'summary.avg_time_per_route': 'זמן ממוצע למסלול',
    'summary.routes_85_100': 'מסלולים שמשקלם 85%-100%',
    'summary.routes_under_50': 'מסלולים שמשקלם קטן מ-50%',
    'summary.overweight_routes_count': 'מסלולים שחורגים מקיבולת המשקל',
    'summary.overweight_label': 'חורגים משקל:',
    'summary.overtime_label': 'חורגים זמן',

    // KPI Cards
    'kpi.title': 'מסלולים - KPIs',
    'kpi.route': 'מסלול',
    'kpi.driver': 'נהג',
    'kpi.vehicle': 'רכב',
    'kpi.total_time': 'זמן כולל',
    'kpi.travel_time': 'זמן נסיעה',
    'kpi.service_time': 'זמן שירות',
    'kpi.stops': 'תחנות',
    'kpi.weight': 'משקל',
    'kpi.capacity': 'קיבולת',
    'kpi.weight_utilization': 'ניצול משקל',
    'kpi.time_utilization': 'ניצול זמן',
    'kpi.rounds': 'סבבים',
    'kpi.no_routes': 'אין מסלולים עבור התאריך שנבחר',

    // Messages
    'message.loading': 'בתהליך טעינת מסלולים ל-',
    'message.no_routes': 'אין מסלולים עבור התאריך שנבחר',
  },
  en: {
    // Header & Auth
    'app.title': 'ROADNET',
    'app.subtitle': 'Daily Distribution Planning Report',
    'auth.email': 'Username',
    'auth.password': 'Password',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.connecting': 'Connecting...',
    'auth.error': 'Login error. Check your credentials.',
    'auth.connection_error': 'Connection error with server',

    // Dashboard Header
    'dashboard.title': 'ROADNET - Daily Distribution Planning Report',
    'dashboard.select_date': 'Select Date',
    'dashboard.loading': 'Loading routes...',

    // Summary Section
    'summary.title': 'Summary',
    'summary.total_routes': 'Total Routes',
    'summary.total_stops': 'Total Stops',
    'summary.weight_utilization': 'Weight Utilization',
    'summary.time_utilization': 'Time Utilization',
    'summary.time_hours': 'hours',
    'summary.overweight_routes': '⚠️ Overweight Routes',
    'summary.planning_recommendation': '💡 Planning Recommendation',
    'summary.daily_conditions': '⛅ Daily Conditions',
    'summary.total_work_time': 'Total Work Time',
    'summary.avg_time_per_route': 'Avg Time per Route',
    'summary.routes_85_100': 'Routes 85%-100% Weight',
    'summary.routes_under_50': 'Routes Under 50% Weight',
    'summary.overweight_routes_count': 'Routes Exceeding Capacity',
    'summary.overweight_label': 'Overweight:',
    'summary.overtime_label': 'Overtime',

    // KPI Cards
    'kpi.title': 'Routes - KPIs',
    'kpi.route': 'Route',
    'kpi.driver': 'Driver',
    'kpi.vehicle': 'Vehicle',
    'kpi.total_time': 'Total Time',
    'kpi.travel_time': 'Travel Time',
    'kpi.service_time': 'Service Time',
    'kpi.stops': 'Stops',
    'kpi.weight': 'Weight',
    'kpi.capacity': 'Capacity',
    'kpi.weight_utilization': 'Weight Utilization',
    'kpi.time_utilization': 'Time Utilization',
    'kpi.rounds': 'Rounds',
    'kpi.no_routes': 'No routes found for selected date',

    // Messages
    'message.loading': 'Loading routes for ',
    'message.no_routes': 'No routes found for selected date',
  },
  es: {
    // Header & Auth
    'app.title': 'ROADNET',
    'app.subtitle': 'Informe de Planificación de Distribución Diaria',
    'auth.email': 'Usuario',
    'auth.password': 'Contraseña',
    'auth.login': 'Iniciar sesión',
    'auth.logout': 'Cerrar sesión',
    'auth.connecting': 'Conectando...',
    'auth.error': 'Error de inicio de sesión. Verifique sus credenciales.',
    'auth.connection_error': 'Error de conexión con el servidor',

    // Dashboard Header
    'dashboard.title': 'ROADNET - Informe de Planificación de Distribución Diaria',
    'dashboard.select_date': 'Seleccionar Fecha',
    'dashboard.loading': 'Cargando rutas...',

    // Summary Section
    'summary.title': 'Resumen',
    'summary.total_routes': 'Total de Rutas',
    'summary.total_stops': 'Total de Paradas',
    'summary.weight_utilization': 'Utilización de Peso',
    'summary.time_utilization': 'Utilización de Tiempo',
    'summary.time_hours': 'horas',
    'summary.overweight_routes': '⚠️ Rutas Sobrecargadas',
    'summary.planning_recommendation': '💡 Recomendación de Planificación',
    'summary.daily_conditions': '⛅ Condiciones Diarias',
    'summary.total_work_time': 'Tiempo Total de Trabajo',
    'summary.avg_time_per_route': 'Tiempo Promedio por Ruta',
    'summary.routes_85_100': 'Rutas 85%-100% Peso',
    'summary.routes_under_50': 'Rutas Bajo 50% Peso',
    'summary.overweight_routes_count': 'Rutas Excediendo Capacidad',
    'summary.overweight_label': 'Sobrecarga:',
    'summary.overtime_label': 'Tiempo Extra',

    // KPI Cards
    'kpi.title': 'Rutas - KPIs',
    'kpi.route': 'Ruta',
    'kpi.driver': 'Conductor',
    'kpi.vehicle': 'Vehículo',
    'kpi.total_time': 'Tiempo Total',
    'kpi.travel_time': 'Tiempo de Viaje',
    'kpi.service_time': 'Tiempo de Servicio',
    'kpi.stops': 'Paradas',
    'kpi.weight': 'Peso',
    'kpi.capacity': 'Capacidad',
    'kpi.weight_utilization': 'Utilización de Peso',
    'kpi.time_utilization': 'Utilización de Tiempo',
    'kpi.rounds': 'Rondas',
    'kpi.no_routes': 'No se encontraron rutas para la fecha seleccionada',

    // Messages
    'message.loading': 'Cargando rutas para ',
    'message.no_routes': 'No se encontraron rutas para la fecha seleccionada',
  },
};

export function t(key: string, lang: Language): string {
  return translations[lang][key] || key;
}
