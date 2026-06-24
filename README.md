# ROADNET - דוח תכנון הפצה

דוח ממשי של תכנון מסלולי הפצה עם KPIs וניתוח עצמי של יעילות התכנון.

## דרישות מקדימות

- Node.js 18+ 
- npm או yarn

## התקנה

```bash
npm install
```

## הגדרה

1. ערוך את `.env.local` והוסף את credentials של ROADNET API:

```env
NEXT_PUBLIC_API_BASE_URL=https://apex-prod-eu-integration.eu.roadnet.com/integration
ROADNET_API_USERNAME=api@harash.co.il
ROADNET_API_PASSWORD=Harash!123
```

## הפעלה

### Development

```bash
npm run dev
```

פתח את [http://localhost:3000](http://localhost:3000) בדפדפן.

### Production

```bash
npm run build
npm start
```

## תכונות

### Authentication
- BEARER token authentication עם ROADNET API
- Token מאוחסן בhttpOnly cookie (secure)
- Auto-refresh כשה-token פקע

### KPIs לכל מסלול
- ⏱️ זמן כולל, נסיעה, שירות
- 📍 כמות תחנות (SERVICEABLE STOP בלבד)
- ⚖️ משקל כולל ותחנות
- 📊 ניצול משקל (%)
- 💡 תובנות אוטומטיות

### דשבורד כללי
- סיכום של כל המסלולים
- מדדי ביצוע כללי
- ניצול ממוצע
- חוות דעת ועצות שיפור

## מבנה הפרויקט

```
src/
├── app/
│   ├── api/              # API routes (server-side)
│   │   ├── auth/         # Authentication
│   │   └── routes/       # Routes & KPI calculation
│   ├── page.tsx          # Main dashboard
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── KPICard.tsx       # Individual route KPI card
│   └── DashboardSummary.tsx  # Overall summary
├── lib/
│   ├── roadnetClient.ts  # ROADNET API client
│   └── kpiCalculator.ts  # KPI logic & insights
└── types/
    └── index.ts          # TypeScript types
```

## הערות אבטחה

⚠️ **חשוב:**
- Credentials ל-ROADNET נשמרים בקובץ `.env.local` בלבד
- Token מאוחסן בhttpOnly cookie (לא ב-localStorage)
- כל הקריאות ל-ROADNET API הן דרך server-side routes
- לעולם אל תחזיק credentials בclient-side code

## שם של קובץ זיכרון אבטחה בפרויקט

ראה `memory/feedback_security.md` לפרטים מלאים על השיקולים האבטחה שלנו.

## רישיון

Private - Harash Co.
