# Helper script to check what dates are cached and what needs fetching
# Usage: .\check_data_cache.ps1 -StartDate "2026-08-06" -EndDate "2026-08-12"

param(
    [string]$StartDate,
    [string]$EndDate
)

$dataFile = "C:\Users\yuval\OneDrive - Aman Computers\Claude Aman\Code\routes-report\data\drivers_weekly_data.json"

# Load cache
$cache = Get-Content $dataFile | ConvertFrom-Json

# Parse dates
$start = [datetime]::ParseExact($StartDate, "yyyy-MM-dd", $null)
$end = [datetime]::ParseExact($EndDate, "yyyy-MM-dd", $null)

# Get all dates in range
$requestedDates = @()
$current = $start
while ($current -le $end) {
    $requestedDates += $current.ToString("yyyy-MM-dd")
    $current = $current.AddDays(1)
}

# Get cached dates
$cachedDates = @($cache.metadata.dates_with_data)
$noDatesData = @($cache.metadata.dates_with_no_routes)

# Find missing
$missingDates = @()
foreach ($date in $requestedDates) {
    if ($date -notin $cachedDates -and $date -notin $noDatesData) {
        $missingDates += $date
    }
}

# Output results
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "📊 ROADNET Data Cache Status"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "📅 Requested Period: $StartDate to $EndDate"
Write-Host "💾 Cached Data: $($cachedDates.Count) dates"
Write-Host "📆 Last Updated: $($cache.metadata.last_updated)"
Write-Host ""

if ($missingDates.Count -eq 0) {
    Write-Host "✅ ALL DATA CACHED - No API calls needed!"
    Write-Host ""
    Write-Host "Cached dates:"
    $cachedDates | ForEach-Object { Write-Host "  ✓ $_" }
}
else {
    Write-Host "⚠️  MISSING DATES - Need to fetch from API:"
    Write-Host ""
    $missingDates | ForEach-Object { Write-Host "  ⏳ $_" }
    Write-Host ""
    Write-Host "💾 Cached dates (will use):"
    $cachedDates | Where-Object { $_ -in $requestedDates } | ForEach-Object { Write-Host "  ✓ $_" }
    Write-Host ""
    Write-Host "🚫 No-route dates (skip):"
    $noDatesData | Where-Object { $_ -in $requestedDates } | ForEach-Object { Write-Host "  ⊗ $_" }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "Active Drivers: $($cache.drivers.PSObject.Properties.Count)"
Write-Host "═══════════════════════════════════════════════════════════"
