# Bulk data collection from ROADNET for all dates 2026-07-29 to 2026-08-05
# This script navigates through each date and collects complete data

param(
    [string]$StartDate = "2026-07-29",
    [string]$EndDate = "2026-08-05"
)

Write-Host "🔄 Starting bulk data collection for $StartDate to $EndDate"
Write-Host ""
Write-Host "⚠️  IMPORTANT: This requires manual navigation through ROADNET dashboard"
Write-Host "    Please ensure you are logged in and dashboard is ready."
Write-Host ""

# Generate all dates in range
$start = [datetime]::ParseExact($StartDate, "yyyy-MM-dd", $null)
$end = [datetime]::ParseExact($EndDate, "yyyy-MM-dd", $null)
$dates = @()

$current = $start
while ($current -le $end) {
    $dates += $current.ToString("yyyy-MM-dd")
    $current = $current.AddDays(1)
}

Write-Host "📅 Dates to collect: $($dates.Count) days"
$dates | ForEach-Object { Write-Host "  - $_" }

Write-Host ""
Write-Host "🚀 Manual Collection Steps:"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "For EACH date, you will:"
Write-Host "  1. Navigate to date in dashboard"
Write-Host "  2. Copy the full page content"
Write-Host "  3. Extract: routes, drivers, weight, stops, addresses"
Write-Host "  4. Paste into roadnet_api_dump.json under daily_routes"
Write-Host ""
Write-Host "Alternative (Faster):"
Write-Host "  💡 Use browser DevTools (F12) → Network tab"
Write-Host "  💡 Call to /api/routes/route?sessionDate=YYYY-MM-DD&language=he"
Write-Host "  💡 Copy JSON response directly"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
