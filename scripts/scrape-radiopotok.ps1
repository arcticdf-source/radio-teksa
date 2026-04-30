param(
  [string]$OutputPath = "c:\Users\Andrey\Desktop\All radio\stations-data.js"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$baseUrl = "https://radiopotok.ru"

function Get-StationPayload {
  param(
    [string]$StationId
  )

  $scriptUrl = "$baseUrl/f/script6.1/$StationId.js"
  $scriptContent = Invoke-WebRequest -UseBasicParsing $scriptUrl | Select-Object -ExpandProperty Content
  $match = [regex]::Match($scriptContent, 'const RP_RADIO = \{\d+:(\{.*?\}),\};', [System.Text.RegularExpressions.RegexOptions]::Singleline)

  if (-not $match.Success) {
    throw "Station payload not found for $StationId"
  }

  return $match.Groups[1].Value | ConvertFrom-Json
}

$sitemap = Invoke-WebRequest -UseBasicParsing "$baseUrl/sitemap.xml" | Select-Object -ExpandProperty Content
$stationUrls = [regex]::Matches($sitemap, 'https://radiopotok\.ru/radio/\d+') |
  ForEach-Object { $_.Value } |
  Sort-Object -Unique

$stations = [System.Collections.Generic.List[object]]::new()
$failed = [System.Collections.Generic.List[string]]::new()
$total = $stationUrls.Count

for ($index = 0; $index -lt $total; $index += 1) {
  $stationUrl = $stationUrls[$index]
  $stationId = [regex]::Match($stationUrl, '/radio/(\d+)$').Groups[1].Value

  try {
    $payload = Get-StationPayload -StationId $stationId
    $streams = @()

    if ($payload.stream) {
      $streams = $payload.stream | ConvertFrom-Json
    }

    $primaryStream = $streams | Select-Object -First 1

    if (-not $primaryStream -or -not $primaryStream.file) {
      throw "Primary stream missing for $stationId"
    }

    $name = [string]$payload.name
    $normalizedName = ($name -replace '\s+', ' ').Trim()

    $stations.Add([PSCustomObject][ordered]@{
      id = "rp-$stationId"
      externalId = [int]$stationId
      name = $normalizedName
      stream = [string]$primaryStream.file
      sourceUrl = $stationUrl
      logoUrl = "$baseUrl/f/station_webp/256/$stationId.webp"
      description = "Станция из каталога RadioPotok."
      listeners = "Источник: RadioPotok"
      tags = @("Radiopotok", "Live")
    })
  } catch {
    $failed.Add("$stationUrl :: $($_.Exception.Message)")
  }

  if ((($index + 1) % 100) -eq 0 -or ($index + 1) -eq $total) {
    Write-Output ("Processed {0}/{1}" -f ($index + 1), $total)
  }
}

$json = $stations | ConvertTo-Json -Depth 6
$content = "window.STATIONS = $json;"
Set-Content -Path $OutputPath -Value $content -Encoding UTF8

Write-Output ("Saved stations: {0}" -f $stations.Count)

if ($failed.Count -gt 0) {
  $failedPath = [System.IO.Path]::ChangeExtension($OutputPath, ".failed.txt")
  Set-Content -Path $failedPath -Value $failed -Encoding UTF8
  Write-Output ("Failed stations: {0}" -f $failed.Count)
  Write-Output ("Failure log: {0}" -f $failedPath)
}