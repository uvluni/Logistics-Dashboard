import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('roadnet_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Rate limiting: 10 requests per minute per token
    if (!checkRateLimit(token, 10, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { routesData, language = 'en', stopsData } = body;

    if (!routesData || !Array.isArray(routesData)) {
      return NextResponse.json(
        { error: 'Invalid routesData: must be an array of routes' },
        { status: 400 }
      );
    }

    // Analyze stops data if provided
    let stopsAnalysis = '';
    if (stopsData && Array.isArray(stopsData)) {
      stopsAnalysis = generateStopsAnalysis(stopsData, language);
    }

    // Prepare prompt for Claude API
    const prompt = generatePrompt(routesData, language, stopsAnalysis);

    // Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: Generate insights locally
      const insights = generateLocalInsights(routesData, language, stopsAnalysis);
      return NextResponse.json({
        success: true,
        insights: insights,
        generatedAt: new Date().toISOString(),
        source: 'local',
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Insights] Calling Claude API');
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Insights] Claude API error:', claudeResponse.status, errorText.substring(0, 200));
      }
      return NextResponse.json(
        { error: `Claude API error: ${claudeResponse.status}` },
        { status: 500 }
      );
    }

    const claudeData = await claudeResponse.json();
    const insights = claudeData.content?.[0]?.text || '';

    return NextResponse.json({
      success: true,
      insights: insights.trim(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Insights generation error:', error instanceof Error ? error.message : String(error));
    }
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

function generateStopsAnalysis(stopsData: any[], language: string): string {
  if (!stopsData || stopsData.length === 0) {
    return '';
  }

  const isHebrew = language === 'he';

  // Analyze stops data
  let totalStops = 0;
  let emptyStops = 0;
  let lowDeliveryStops = 0; // stops with qty < 5
  let highDeliveryStops = 0; // stops with qty >= 20
  const routeStops: Record<string, number> = {};
  const routeEmptyStops: Record<string, number> = {};
  const routeDeliveryQty: Record<string, number> = {};

  stopsData.forEach((stop) => {
    totalStops++;
    const routeId = stop['Route ID'] || 'Unknown';
    const qty = stop['Total Delivery Quantities'] || 0;

    routeStops[routeId] = (routeStops[routeId] || 0) + 1;
    routeDeliveryQty[routeId] = (routeDeliveryQty[routeId] || 0) + qty;

    if (!qty || qty === 0) {
      emptyStops++;
      routeEmptyStops[routeId] = (routeEmptyStops[routeId] || 0) + 1;
    } else if (qty < 5) {
      lowDeliveryStops++;
    } else if (qty >= 20) {
      highDeliveryStops++;
    }
  });

  const maxStopsPerRoute = Math.max(...Object.values(routeStops));
  const minStopsPerRoute = Math.min(...Object.values(routeStops));
  const avgQtyPerStop = (Object.values(routeDeliveryQty).reduce((a, b) => a + b, 0) / totalStops).toFixed(1);

  // Find problematic routes
  const routesWithManyEmptyStops = Object.entries(routeEmptyStops)
    .filter(([_, count]) => count >= 2)
    .length;

  const unbalancedRoutes = Object.values(routeStops).filter(count => count === 1).length;

  if (isHebrew) {
    return `📍 תובנות נוספות מניתוח דו"ח התחנות:

🚨 בעיות שזוהו:
• ${emptyStops} תחנות ללא הזמנות (עלות עודפת!)
• ${routesWithManyEmptyStops} מסלולים עם 2+ תחנות ריקות
• ${unbalancedRoutes} מסלולים עם תחנה בודדת בלבד (סכנת איזון)
• ${lowDeliveryStops} תחנות עם מעט הזמנות (< 5)

📊 סטטיסטיקות התחנות:
• סך הכל תחנות: ${totalStops}
• ממוצע הזמנות לתחנה: ${avgQtyPerStop}
• מקסימום תחנות למסלול: ${maxStopsPerRoute}
• מינימום תחנות למסלול: ${minStopsPerRoute}

💡 המלצות מהתחנות:
• בדוק תחנות ריקות - האם צריך להסיר אותן מהמסלול?
• בצע בדיקה של מסלולים עם תחנה בודדת - האם אפשר לצרף לאחר?
• תחנות עם מעט הזמנות - שקול לאחד עם תחנה קרובה`;
  }

  return `📍 New Insights from Stops Report Analysis:

🚨 Issues Identified:
• ${emptyStops} stops with no orders (wasted cost!)
• ${routesWithManyEmptyStops} routes with 2+ empty stops
• ${unbalancedRoutes} routes with only 1 stop (balance risk)
• ${lowDeliveryStops} stops with low orders (< 5 units)

📊 Stops Statistics:
• Total stops: ${totalStops}
• Avg orders per stop: ${avgQtyPerStop}
• Max stops per route: ${maxStopsPerRoute}
• Min stops per route: ${minStopsPerRoute}

💡 Recommendations from Stops Analysis:
• Review empty stops - should they be removed from routes?
• Check single-stop routes - can they be merged with others?
• Low-delivery stops - consider consolidating with nearby locations`;
}

function generateLocalInsights(routesData: any[], language: string, stopsAnalysis: string = ''): string {
  if (!routesData || routesData.length === 0) {
    return language === 'he' ? 'אין נתונים לניתוח' : 'No data to analyze';
  }

  const isHebrew = language === 'he';

  // Calculate metrics
  let totalWeight = 0;
  let totalCapacity = 0;
  let totalTime = 0;
  let maxTime = 0;
  let lowUtilization = 0;
  let highUtilization = 0;

  routesData.forEach((route) => {
    const weight = parseFloat(route['Weight Utilization (%)']) || 0;
    totalWeight += weight;
    totalCapacity += 100;
    totalTime += parseFloat(route['Total Duration (min)']) || 0;
    maxTime = Math.max(maxTime, parseFloat(route['Total Duration (min)']) || 0);

    if (weight < 50) lowUtilization++;
    if (weight > 85) highUtilization++;
  });

  const avgWeight = (totalWeight / routesData.length).toFixed(1);
  const avgTime = (totalTime / routesData.length).toFixed(0);

  if (isHebrew) {
    return `📊 ניתוח תכנון הפצה - ${new Date().toLocaleDateString('he-IL')}

🔍 סיכום כללי:
• מספר מסלולים: ${routesData.length}
• ניצול משקל ממוצע: ${avgWeight}%
• זמן עבודה ממוצע: ${avgTime} דקות
• זמן עבודה מקסימום: ${maxTime} דקות

⚠️ בעיות שזוהו:
• ${lowUtilization} מסלולים עם ניצול נמוך (< 50%)
• ${highUtilization} מסלולים עם ניצול גבוה (> 85%)

💡 המלצות:
• שקול לשלב מסלולים עם ניצול נמוך כדי לשפר יעילות
• בדוק אם ניתן להוסיף עוד תחנות למסלולים קטנים
• אם זמן העבודה חורג מ-9 שעות, קחו בחשבון חלוקה לשני מסלולים
• הקפד על הפרוצדורות של חברה בתכנון

${stopsAnalysis}

🔬 שיטת החישוב:
• ניצול משקל = סכום ניצול משקל כל מסלול / מספר המסלולים
• בעיות זוהו על סמך סף של 50% ו-85% ניצול
• זמן עבודה ממוצע חושב מהעמודה "Total Duration (min)" בדוח`;
  }

  return `📊 Distribution Planning Analysis - ${new Date().toLocaleDateString('en-US')}

🔍 Summary:
• Number of routes: ${routesData.length}
• Average weight utilization: ${avgWeight}%
• Average work time: ${avgTime} minutes
• Maximum work time: ${maxTime} minutes

⚠️ Issues Identified:
• ${lowUtilization} routes with low utilization (< 50%)
• ${highUtilization} routes with high utilization (> 85%)

💡 Recommendations:
• Consider combining routes with low utilization to improve efficiency
• Check if additional stops can be added to smaller routes
• If work time exceeds 9 hours, consider splitting into two routes
• Review company procedures for route planning
• Monitor driver feedback on route efficiency

${stopsAnalysis}

🔬 Calculation Method:
• Weight utilization = sum of all routes' weight utilization / number of routes
• Issues identified based on thresholds: < 50% (low) and > 85% (high)
• Average work time calculated from "Total Duration (min)" column in report`;
}

function generatePrompt(routesData: any[], language: string): string {
  const routesSummary = routesData
    .slice(0, 10)
    .map((route, idx) => {
      return `
Route ${idx + 1}:
- Route ID: ${route['Route ID'] || 'N/A'}
- Driver: ${route['Driver Name'] || 'N/A'}
- Vehicle: ${route['Vehicle Type'] || 'N/A'}
- Total Duration: ${route['Total Duration (min)'] || 0} min
- Travel Time: ${route['Travel Time (min)'] || 0} min
- Service Time: ${route['Service Time (min)'] || 0} min
- Stops: ${route['Stops'] || 0}
- Weight Utilization: ${route['Weight Utilization (%)'] || 0}%
- Time Utilization: ${route['Time Utilization (%)'] || 0}%`;
    })
    .join('\n');

  const isHebrew = language === 'he';

  if (isHebrew) {
    return `אתה מנתח תכנון הפצה מקצועי. בדוק את הנתונים הבאים של מסלולים וספק 3-4 פסקאות קצרות ומעשיות:

${routesSummary}

אנא ספק:
1. סיכום כללי של יעילות ההפצה
2. 2-3 בעיות עיקריות שצריך לטפל בהן
3. המלצות מעשיות לשיפור הנתוב

כתוב בעברית, בצורה פשוטה וישירה.`;
  }

  return `You are a professional distribution planning analyst. Analyze the following route data and provide 3-4 short, practical paragraphs:

${routesSummary}

Please provide:
1. Overall efficiency summary
2. 2-3 key issues to address
3. Practical recommendations for route optimization

Write in clear, concise language focusing on actionable insights.`;
}
