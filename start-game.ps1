param(
  [int]$Port = 4173,
  [switch]$AutoUpdate
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$serverProcess = $null
$browserProcess = $null
$browserProfileDir = $null
$serverStdOutLog = $null
$serverStdErrLog = $null
$updateConfigPath = Join-Path $PSScriptRoot "update-source.json"
$updateStatePath = Join-Path $PSScriptRoot ".shindoro-update-state.json"

function Get-DefaultUpdateConfig {
  return [pscustomobject]@{
    provider = "github-branch-zip"
    owner = "czy199621"
    repo = "shindoro"
    branch = "main"
    preservePaths = @(
      ".git"
      "node_modules"
      "dist"
      ".shindoro-update-state.json"
    )
  }
}

function Get-UpdateConfig {
  if (-not (Test-Path -LiteralPath $updateConfigPath)) {
    return (Get-DefaultUpdateConfig)
  }

  $raw = Get-Content -LiteralPath $updateConfigPath -Raw -Encoding UTF8
  $config = $raw | ConvertFrom-Json

  if (-not $config.provider -or -not $config.owner -or -not $config.repo -or -not $config.branch) {
    throw "update-source.json is missing required fields."
  }

  if (-not $config.preservePaths) {
    $config | Add-Member -NotePropertyName preservePaths -NotePropertyValue @(
      ".git"
      "node_modules"
      "dist"
      ".shindoro-update-state.json"
    )
  }

  return $config
}

function Get-UpdateState {
  if (-not (Test-Path -LiteralPath $updateStatePath)) {
    return $null
  }

  try {
    return (Get-Content -LiteralPath $updateStatePath -Raw -Encoding UTF8 | ConvertFrom-Json)
  } catch {
    Write-Host "[WARN] Could not parse the local update state file. It will be ignored for this run." -ForegroundColor Yellow
    return $null
  }
}

function Normalize-RelativePath {
  param(
    [string]$Path
  )

  if (-not $Path) {
    return ""
  }

  return (($Path -replace "\\", "/").Trim("/"))
}

function Get-LocalPathFromRelative {
  param(
    [string]$RelativePath
  )

  $nativeRelative = (Normalize-RelativePath -Path $RelativePath) -replace "/", "\"
  return (Join-Path $PSScriptRoot $nativeRelative)
}

function Test-PreservedRelativePath {
  param(
    [string]$RelativePath,
    [object[]]$PreservePaths
  )

  $normalizedRelative = Normalize-RelativePath -Path $RelativePath
  foreach ($preservePath in $PreservePaths) {
    $normalizedPreserve = Normalize-RelativePath -Path ([string]$preservePath)
    if (-not $normalizedPreserve) {
      continue
    }

    if ($normalizedRelative.Equals($normalizedPreserve, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }

    if ($normalizedRelative.StartsWith("$normalizedPreserve/", [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }

  return $false
}

function Get-GitContext {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    return $null
  }

  $insideRepo = (& git rev-parse --is-inside-work-tree 2>$null).Trim()
  if ($LASTEXITCODE -ne 0 -or $insideRepo -ne "true") {
    return $null
  }

  $currentBranch = (& git branch --show-current 2>$null).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $currentBranch) {
    return [pscustomobject]@{
      Available = $true
      Branch = $null
      HasOrigin = $false
      HeadCommit = $null
      IsDirty = $false
    }
  }

  $originUrl = (& git remote get-url origin 2>$null).Trim()
  $hasOrigin = ($LASTEXITCODE -eq 0 -and [string]::IsNullOrWhiteSpace($originUrl) -eq $false)

  $headCommit = (& git rev-parse HEAD 2>$null).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $headCommit) {
    $headCommit = $null
  }

  $statusOutput = @(& git status --porcelain 2>$null)
  $isDirty = $false
  if ($LASTEXITCODE -eq 0) {
    $isDirty = ($statusOutput.Count -gt 0)
  }

  return [pscustomobject]@{
    Available = $true
    Branch = $currentBranch
    HasOrigin = $hasOrigin
    HeadCommit = $headCommit
    IsDirty = $isDirty
  }
}

function Invoke-GitAutoUpdate {
  $gitContext = Get-GitContext
  if (-not $gitContext) {
    return [pscustomobject]@{
      Applicable = $false
      Updated = $false
      ProtectedSkip = $false
    }
  }

  if ($gitContext.IsDirty) {
    Write-Host "[WARN] Local git changes were detected. Skipping auto-update to protect your worktree." -ForegroundColor Yellow
    return [pscustomobject]@{
      Applicable = $true
      Updated = $false
      ProtectedSkip = $true
    }
  }

  if (-not $gitContext.HasOrigin) {
    Write-Host "[INFO] Git is available, but no origin remote is configured. Falling back to archive-based update." -ForegroundColor Yellow
    return [pscustomobject]@{
      Applicable = $false
      Updated = $false
      ProtectedSkip = $false
    }
  }

  if (-not $gitContext.Branch) {
    Write-Host "[INFO] Git is available, but the current branch could not be determined. Falling back to archive-based update." -ForegroundColor Yellow
    return [pscustomobject]@{
      Applicable = $false
      Updated = $false
      ProtectedSkip = $false
    }
  }

  Write-Host "[INFO] Pulling latest changes from origin/$($gitContext.Branch) ..."
  & git pull --ff-only origin $gitContext.Branch

  if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Git auto-update failed. Continuing with local files." -ForegroundColor Yellow
    return [pscustomobject]@{
      Applicable = $true
      Updated = $false
      ProtectedSkip = $true
    }
  }

  Write-Host "[INFO] Git auto-update complete."
  return [pscustomobject]@{
    Applicable = $true
    Updated = $true
    ProtectedSkip = $false
  }
}

function Get-GitHubCommitSha {
  param(
    [pscustomobject]$Config
  )

  $headers = @{
    "User-Agent" = "ShindoroLauncher/1.0"
    "Accept" = "application/vnd.github+json"
  }

  $uri = "https://api.github.com/repos/$($Config.owner)/$($Config.repo)/commits/$($Config.branch)"
  $response = Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 20

  if (-not $response.sha) {
    throw "The update API did not return a commit SHA."
  }

  return [string]$response.sha
}

function Get-GitHubArchiveUrl {
  param(
    [pscustomobject]$Config
  )

  return "https://codeload.github.com/$($Config.owner)/$($Config.repo)/zip/refs/heads/$($Config.branch)"
}

function Get-ManagedSourceFiles {
  param(
    [string]$SourceRoot,
    [object[]]$PreservePaths
  )

  $managedFiles = [ordered]@{}
  Get-ChildItem -LiteralPath $SourceRoot -Recurse -File | ForEach-Object {
    $relativePath = Normalize-RelativePath -Path ([System.IO.Path]::GetRelativePath($SourceRoot, $_.FullName))
    if (-not (Test-PreservedRelativePath -RelativePath $relativePath -PreservePaths $PreservePaths)) {
      $managedFiles[$relativePath] = $_.FullName
    }
  }

  return $managedFiles
}

function Get-FileHashMap {
  param(
    [System.Collections.IDictionary]$ManagedFiles
  )

  $hashMap = [ordered]@{}
  foreach ($relativePath in ($ManagedFiles.Keys | Sort-Object)) {
    $hashMap[$relativePath] = (Get-FileHash -LiteralPath $ManagedFiles[$relativePath] -Algorithm SHA256).Hash
  }
  return $hashMap
}

function Test-StateTrackedLocalChanges {
  param(
    $State
  )

  if (-not $State -or -not $State.fileHashes) {
    return $false
  }

  foreach ($property in $State.fileHashes.PSObject.Properties) {
    $relativePath = Normalize-RelativePath -Path $property.Name
    $targetPath = Get-LocalPathFromRelative -RelativePath $relativePath

    if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
      return $true
    }

    $currentHash = (Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash
    if (-not $currentHash.Equals([string]$property.Value, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }

  return $false
}

function Remove-StaleManagedFiles {
  param(
    $State,
    [System.Collections.IDictionary]$NewManagedFiles
  )

  if (-not $State -or -not $State.fileHashes) {
    return
  }

  $newPathSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  foreach ($relativePath in $NewManagedFiles.Keys) {
    [void]$newPathSet.Add((Normalize-RelativePath -Path $relativePath))
  }

  foreach ($property in $State.fileHashes.PSObject.Properties) {
    $relativePath = Normalize-RelativePath -Path $property.Name
    if ($newPathSet.Contains($relativePath)) {
      continue
    }

    $targetPath = Get-LocalPathFromRelative -RelativePath $relativePath
    if (Test-Path -LiteralPath $targetPath -PathType Leaf) {
      Remove-Item -LiteralPath $targetPath -Force
    }
  }
}

function Copy-ManagedFiles {
  param(
    [System.Collections.IDictionary]$ManagedFiles
  )

  foreach ($relativePath in $ManagedFiles.Keys) {
    $targetPath = Get-LocalPathFromRelative -RelativePath $relativePath
    $targetDirectory = Split-Path -Parent $targetPath
    if ($targetDirectory -and -not (Test-Path -LiteralPath $targetDirectory)) {
      New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    }

    Copy-Item -LiteralPath $ManagedFiles[$relativePath] -Destination $targetPath -Force
  }
}

function Save-UpdateState {
  param(
    [pscustomobject]$Config,
    [string]$Commit,
    [System.Collections.IDictionary]$FileHashes
  )

  $state = [ordered]@{
    provider = $Config.provider
    owner = $Config.owner
    repo = $Config.repo
    branch = $Config.branch
    commit = $Commit
    updatedAt = (Get-Date).ToString("o")
    fileHashes = $FileHashes
  }

  $state | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $updateStatePath -Encoding UTF8
}

function Invoke-ArchiveAutoUpdate {
  try {
    $config = Get-UpdateConfig
  } catch {
    Write-Host "[WARN] Could not load update-source.json. Skipping archive-based update." -ForegroundColor Yellow
    return $false
  }

  if ($config.provider -ne "github-branch-zip") {
    Write-Host "[WARN] Unsupported update provider '$($config.provider)'. Skipping archive-based update." -ForegroundColor Yellow
    return $false
  }

  $state = Get-UpdateState
  if (Test-StateTrackedLocalChanges -State $state) {
    Write-Host "[WARN] Local file changes were detected since the last archive update. Skipping auto-update to protect your files." -ForegroundColor Yellow
    return $false
  }

  $remoteCommit = $null
  try {
    $remoteCommit = Get-GitHubCommitSha -Config $config
  } catch {
    Write-Host "[WARN] Could not check the remote update manifest. Continuing with local files." -ForegroundColor Yellow
    return $false
  }

  $localCommit = $null
  $gitContext = Get-GitContext
  if ($gitContext -and $gitContext.HeadCommit) {
    $localCommit = $gitContext.HeadCommit
  } elseif ($state -and $state.commit) {
    $localCommit = [string]$state.commit
  }

  if ($localCommit -and $localCommit.Equals($remoteCommit, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-Host "[INFO] Archive update source is already up to date."
    return $false
  }

  if (-not $localCommit) {
    Write-Host "[INFO] No local update marker was found. Downloading the latest package from GitHub..."
  } else {
    Write-Host "[INFO] Downloading update package $($remoteCommit.Substring(0, 7)) from GitHub..."
  }

  $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("shindoro-update-" + [Guid]::NewGuid().ToString("N"))
  $zipPath = Join-Path $tempRoot "update.zip"
  $extractRoot = Join-Path $tempRoot "extract"

  try {
    New-Item -ItemType Directory -Path $tempRoot | Out-Null
    Invoke-WebRequest -Uri (Get-GitHubArchiveUrl -Config $config) -Headers @{ "User-Agent" = "ShindoroLauncher/1.0" } -OutFile $zipPath -TimeoutSec 60
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractRoot -Force

    $archiveRoot = Get-ChildItem -LiteralPath $extractRoot | Where-Object { $_.PSIsContainer } | Select-Object -First 1
    if (-not $archiveRoot) {
      throw "The downloaded update package did not contain a valid project root."
    }

    $managedFiles = Get-ManagedSourceFiles -SourceRoot $archiveRoot.FullName -PreservePaths $config.preservePaths
    $fileHashes = Get-FileHashMap -ManagedFiles $managedFiles

    Remove-StaleManagedFiles -State $state -NewManagedFiles $managedFiles
    Copy-ManagedFiles -ManagedFiles $managedFiles
    Save-UpdateState -Config $config -Commit $remoteCommit -FileHashes $fileHashes

    Write-Host "[INFO] Archive auto-update complete."
    return $true
  } catch {
    Write-Host "[WARN] Archive auto-update failed. Continuing with local files." -ForegroundColor Yellow
    return $false
  } finally {
    if (Test-Path -LiteralPath $tempRoot) {
      try {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
      } catch {
      }
    }
  }
}

function Invoke-AutoUpdate {
  if (-not $AutoUpdate) {
    return $false
  }

  $gitResult = Invoke-GitAutoUpdate
  if ($gitResult.Applicable) {
    return $gitResult.Updated
  }

  return (Invoke-ArchiveAutoUpdate)
}

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

function Write-ServerFailureDetails {
  $logs = @()

  if ($serverStdOutLog -and (Test-Path -LiteralPath $serverStdOutLog)) {
    $stdout = (Get-Content -LiteralPath $serverStdOutLog -Raw).Trim()
    if ($stdout) {
      $logs += "----- npm start stdout -----`r`n$stdout"
    }
  }

  if ($serverStdErrLog -and (Test-Path -LiteralPath $serverStdErrLog)) {
    $stderr = (Get-Content -LiteralPath $serverStdErrLog -Raw).Trim()
    if ($stderr) {
      $logs += "----- npm start stderr -----`r`n$stderr"
    }
  }

  if ($logs.Count -gt 0) {
    Write-Host ""
    Write-Host ($logs -join "`r`n`r`n") -ForegroundColor Yellow
  } else {
    Write-Host ""
    Write-Host "[WARN] No npm start output was captured." -ForegroundColor Yellow
  }
}

try {
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found. Please install Node.js first."
  }

  $didAutoUpdate = Invoke-AutoUpdate

  $hasNodeModules = Test-Path -LiteralPath "node_modules"
  $hasLocalTsc = (Test-Path -LiteralPath "node_modules\.bin\tsc.cmd") -or (Test-Path -LiteralPath "node_modules\.bin\tsc")

  if ($didAutoUpdate -or -not $hasNodeModules -or -not $hasLocalTsc) {
    if (-not $hasNodeModules) {
      Write-Host "[INFO] node_modules was not found. Installing dependencies..."
    } elseif ($didAutoUpdate) {
      Write-Host "[INFO] Refreshing dependencies after auto-update..."
    } else {
      Write-Host "[INFO] Local TypeScript toolchain was not found. Refreshing dependencies..."
    }
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
  $serverStdOutLog = Join-Path $browserProfileDir "server-stdout.log"
  $serverStdErrLog = Join-Path $browserProfileDir "server-stderr.log"

  Write-Host "[INFO] Starting Shindoro on http://localhost:$Port"
  $serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set PORT=$Port && npm start" -WorkingDirectory $PSScriptRoot -RedirectStandardOutput $serverStdOutLog -RedirectStandardError $serverStdErrLog -PassThru

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
  Write-ServerFailureDetails
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
