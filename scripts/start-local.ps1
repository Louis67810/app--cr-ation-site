$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"
$dashboardUrl = "http://localhost:3000/dashboard?tab=ai"

Write-Host ""
Write-Host "Atelier paysagiste - execution locale" -ForegroundColor Cyan
Write-Host "Le serveur restera actif tant que cette fenetre reste ouverte." -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path -LiteralPath $envFile)) {
  Write-Warning ".env.local est introuvable. Copiez .env.example vers .env.local et ajoutez les cles."
} elseif (-not (Select-String -LiteralPath $envFile -Pattern '^OPENROUTER_API_KEY=.+$' -Quiet)) {
  Write-Warning "OPENROUTER_API_KEY manque dans .env.local. L'interface demarrera, mais les agents ne pourront pas travailler."
}

$devServer = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $projectRoot -NoNewWindow -PassThru

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if ($devServer.HasExited) {
      throw "Le serveur local s'est arrete avant de demarrer."
    }
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  if ($ready) {
    Start-Process $dashboardUrl
    Write-Host "Atelier ouvert : $dashboardUrl" -ForegroundColor Green
  } else {
    Write-Warning "Le serveur met plus d'une minute a repondre. Ouvrez manuellement $dashboardUrl"
  }

  Wait-Process -Id $devServer.Id
} finally {
  if (-not $devServer.HasExited) {
    Stop-Process -Id $devServer.Id
  }
}
