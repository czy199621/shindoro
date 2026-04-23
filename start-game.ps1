param(
  [int]$Port = 4173
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$serverProcess = $null
$browserProcess = $null
$browserProfileDir = $null

function Get-SupportedBrowser {
  $programFilesX86 = ${env:ProgramFiles(x86)}
  $programFiles = $env:ProgramFiles

  $candidates = @(
    @{ Name = "Edge"; Path = (Join-Path $programFilesX86 "Microsoft\Edge\Application\msedge.exe") },
    @{ Name = "Edge"; Path = (Join-Path $programFiles "Microsoft\Edge\Application\msedge.exe") },
    @{ Name = "Chrome"; Path = (Join-Path $programFilesX86 "Google\Chrome\Application\chrome.exe") },
    @{ Name = "Chrome"; Path = (Join-Path $programFiles "Google\Chrome\Application\chrome.exe") },
    @{ Name = "Brave"; Path = (Join-Path $programFilesX86 "BraveSoftware\Brave-Browser\Application\brave.exe") },
    @{ Name = "Brave"; Path = (Join-Path $programFiles "BraveSoftware\Brave-Browser\Application\brave.exe") }
  )

  foreach ($candidate in $candidates) {
    if ($candidate.Path -and (Test-Path -LiteralPath $candidate.Path)) {
      return $candidate
    }
  }

  return $null
}

function Wait-ForLocalPort {
  param(
    [int]$TargetPort,
    [int]$TimeoutSeconds = 35
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    if ($serverProcess -and $serverProcess.HasExited) {
      throw "The game server exited early with code $($serverProcess.ExitCode)."
    }

    try {
      $client = [Net.Sockets.TcpClient]::new("127.0.0.1", $TargetPort)
      $client.Close()
      return
    } catch {
      Start-Sleep -Milliseconds 350
    }
  }

  throw "The game server did not become ready on port $TargetPort in time."
}

function Stop-ServerTree {
  if (-not $serverProcess) {
    return
  }

  try {
    if (-not $serverProcess.HasExited) {
      Start-Process -FilePath "taskkill.exe" -ArgumentList "/PID", $serverProcess.Id, "/T", "/F" -Wait -NoNewWindow | Out-Null
    }
  } catch {
  }
}

try {
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found. Please install Node.js first."
  }

  if (-not (Test-Path -LiteralPath "node_modules")) {
    Write-Host "[INFO] node_modules was not found. Installing dependencies..."
    & npm install
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed."
    }
  }

  $browser = Get-SupportedBrowser
  if (-not $browser) {
    throw "No supported browser was found. Edge, Chrome, or Brave is required for auto-close behavior."
  }

  $browserProfileDir = Join-Path ([System.IO.Path]::GetTempPath()) ("shindoro-browser-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $browserProfileDir | Out-Null

  Write-Host "[INFO] Starting Shindoro on http://localhost:$Port"
  $serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set PORT=$Port && npm start" -WorkingDirectory $PSScriptRoot -PassThru

  Wait-ForLocalPort -TargetPort $Port

  $url = "http://localhost:$Port"
  $browserArgs = @(
    "--user-data-dir=$browserProfileDir"
    "--app=$url"
    "--new-window"
    "--window-size=1440,960"
    "--disable-session-crashed-bubble"
    "--no-first-run"
    "--no-default-browser-check"
  )

  Write-Host "[INFO] Opening dedicated $($browser.Name) window. Closing that window will also stop the server."
  $browserProcess = Start-Process -FilePath $browser.Path -ArgumentList $browserArgs -WorkingDirectory $PSScriptRoot -PassThru
  $browserProcess.WaitForExit()
} catch {
  Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
} finally {
  Stop-ServerTree

  if ($browserProfileDir -and (Test-Path -LiteralPath $browserProfileDir)) {
    try {
      Remove-Item -LiteralPath $browserProfileDir -Recurse -Force
    } catch {
    }
  }
}
