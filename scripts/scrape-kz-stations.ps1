# Scrape Kazakhstan radio stations from radiolar.online and test streams
# Output: working stations as JSON for import

$ErrorActionPreference = 'SilentlyContinue'

$baseUrl = "https://radiolar.online/stations/facet/country/kz/"
$results = [System.Collections.Generic.List[object]]::new()
$failed = [System.Collections.Generic.List[string]]::new()

function Get-PageContent($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing -Headers @{
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        return $response.Content
    } catch { return $null }
}

function Test-Stream($url) {
    if (-not $url -or $url -notmatch '^https?://') { return $false }
    # Skip known bad patterns
    if ($url -match 'zeno\.fm|myradio24\.com|t\.me|radio12345\.com') { return $false }
    try {
        $req = [System.Net.HttpWebRequest]::Create($url)
        $req.Method = "HEAD"
        $req.Timeout = 7000
        $req.AllowAutoRedirect = $true
        $req.UserAgent = "Mozilla/5.0"
        $resp = $req.GetResponse()
        $ct = $resp.ContentType
        $sc = [int]$resp.StatusCode
        $resp.Close()
        if ($sc -ge 200 -and $sc -lt 400) {
            # Accept audio streams and m3u8
            if ($ct -match 'audio|mpeg|ogg|aac|mp3|mpegurl|x-mpegurl|octet-stream|stream') { return $true }
            if ($url -match '\.mp3|\.m3u8|\.aac|\.ogg|/stream|/live|/radio|/listen') { return $true }
        }
        return $false
    } catch {
        # Try GET for streams that don't support HEAD
        try {
            $req2 = [System.Net.HttpWebRequest]::Create($url)
            $req2.Method = "GET"
            $req2.Timeout = 7000
            $req2.AllowAutoRedirect = $true
            $req2.UserAgent = "Mozilla/5.0"
            $resp2 = $req2.GetResponse()
            $ct2 = $resp2.ContentType
            $sc2 = [int]$resp2.StatusCode
            $resp2.Close()
            if ($sc2 -ge 200 -and $sc2 -lt 400) {
                if ($ct2 -match 'audio|mpeg|ogg|aac|mp3|mpegurl|x-mpegurl|octet-stream|stream') { return $true }
                if ($url -match '\.mp3|\.m3u8|\.aac|\.ogg|/stream|/live|/radio|/listen') { return $true }
            }
            return $false
        } catch { return $false }
    }
}

function Extract-StreamFromPage($html) {
    # Look for stream URL in JSON-LD or data attributes or onclick
    $patterns = @(
        '"stream"\s*:\s*"([^"]+)"',
        '"streamUrl"\s*:\s*"([^"]+)"',
        '"url"\s*:\s*"(https?://[^"]+\.(?:mp3|m3u8|aac|ogg)[^"]*)"',
        'data-stream="([^"]+)"',
        "data-stream='([^']+)'",
        'src[=:]\s*["\x27](https?://[^"]+(?:\.mp3|\.m3u8|\.aac|/stream|/live)[^"\x27]*)',
        '"contentUrl"\s*:\s*"([^"]+)"',
        'audio\s+src="(https?://[^"]+)"',
        'streamURL\s*=\s*["\x27](https?://[^"]+)["\x27]'
    )
    foreach ($p in $patterns) {
        if ($html -match $p) {
            $u = $Matches[1]
            if ($u -match '^https?://') { return $u }
        }
    }
    return $null
}

function Extract-StationInfo($html, $pageUrl) {
    $info = @{ name = ""; genre = "Радио"; description = "Прямой эфир онлайн."; logoUrl = $null; stream = $null; tags = @("Казахстан", "Прямой эфир") }
    
    # Name from title or h1
    if ($html -match '<h1[^>]*>([^<]+)</h1>') { $info.name = $Matches[1].Trim() }
    elseif ($html -match '<title>([^<|]+)') { $info.name = $Matches[1].Trim() -replace '\s*[-|].*$', '' }
    
    # Logo
    if ($html -match '"image"\s*:\s*"(https?://[^"]+)"') { $info.logoUrl = $Matches[1] }
    elseif ($html -match '<img[^>]+class="[^"]*logo[^"]*"[^>]+src="([^"]+)"') { $info.logoUrl = $Matches[1] }
    
    # Genre from tags/categories on page
    $genreMap = @{
        'поп|pop|хит|hit' = 'Поп'
        'рок|rock' = 'Рок'
        'джаз|jazz' = 'Джаз'
        'электрон|electro|dance|танц|edm' = 'Электронная'
        'классик|classic' = 'Классика'
        'ретро|retro|oldies' = 'Ретро'
        'шансон|chanson' = 'Шансон'
        'новост|news|информ' = 'Новости'
        'детск|kids|children' = 'Детское'
        'казах|qazaq|қазақ' = 'Поп'
        'народ|folk|фолк' = 'Фолк'
        'lounge|chill' = 'Чилаут'
    }
    $htmlLower = $html.ToLower()
    foreach ($pat in $genreMap.Keys) {
        if ($htmlLower -match $pat) { $info.genre = $genreMap[$pat]; break }
    }
    
    $info.stream = Extract-StreamFromPage $html
    return $info
}

# Step 1: Get all KZ station page URLs
Write-Host "Fetching KZ station list..." -ForegroundColor Cyan
$listHtml = Get-PageContent $baseUrl
if (-not $listHtml) { Write-Host "Failed to fetch list page"; exit 1 }

$stationUrls = [regex]::Matches($listHtml, 'href="(https://radiolar\.online/stations/[a-z0-9\-]+/)"') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique |
    Where-Object { $_ -notmatch '/stations/facet/' }

Write-Host "Found $($stationUrls.Count) stations" -ForegroundColor Green

# Step 2: Scrape each station page and test stream
$counter = 0
foreach ($stationUrl in $stationUrls) {
    $counter++
    Write-Host "[$counter/$($stationUrls.Count)] $stationUrl" -ForegroundColor Gray -NoNewline
    
    $html = Get-PageContent $stationUrl
    if (-not $html) { Write-Host " - SKIP (no page)" -ForegroundColor DarkGray; continue }
    
    $info = Extract-StationInfo $html $stationUrl
    
    if (-not $info.stream) { 
        Write-Host " - NO STREAM" -ForegroundColor DarkYellow
        $failed.Add("$($info.name) - no stream found")
        continue 
    }
    
    $works = Test-Stream $info.stream
    if ($works) {
        Write-Host " ✓ $($info.name) => $($info.stream)" -ForegroundColor Green
        $results.Add([PSCustomObject]@{
            name    = $info.name
            stream  = $info.stream
            genre   = $info.genre
            logoUrl = $info.logoUrl
            tags    = $info.tags
        })
    } else {
        Write-Host " ✗ DEAD: $($info.stream)" -ForegroundColor Red
        $failed.Add("$($info.name) - dead stream: $($info.stream)")
    }
    
    Start-Sleep -Milliseconds 200
}

# Save results
$outPath = "C:\Users\Andrey\Desktop\All radio\tmp\kz-stations-working.json"
$failPath = "C:\Users\Andrey\Desktop\All radio\tmp\kz-stations-failed.txt"

$results | ConvertTo-Json -Depth 5 | Set-Content $outPath -Encoding UTF8
$failed | Set-Content $failPath -Encoding UTF8

Write-Host "`n✓ Done: $($results.Count) working, $($failed.Count) failed" -ForegroundColor Cyan
Write-Host "Saved to: $outPath"
