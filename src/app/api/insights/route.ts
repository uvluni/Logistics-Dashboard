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
    const { routesData, language = 'en' } = body;

    if (!routesData || !Array.isArray(routesData)) {
      return NextResponse.json(
        { error: 'Invalid routesData: must be an array of routes' },
        { status: 400 }
      );
    }

    // Prepare prompt for Claude API
    const prompt = generatePrompt(routesData, language);

    // Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: Generate insights locally
      const insights = generateLocalInsights(routesData, language);
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

function generateLocalInsights(routesData: any[], language: string): string {
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
