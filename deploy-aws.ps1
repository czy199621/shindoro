param(
  [string]$Bucket,
  [string]$DistributionId,
  [string]$Region,
  [string]$Profile,
  [switch]$SkipTests,
  [switch]$SkipInvalidation,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Use-ConfigDefault {
  param(
    [object]$Config,
    [string]$Name,
    [object]$Current
  )

  if ($null -ne $Current -and "$Current" -ne "") {
    return $Current
  }

  if ($null -eq $Config) {
    return $Current
  }

  $property = $Config.PSObject.Properties[$Name]
  if ($null -eq $property) {
    return $Current
  }

  return $property.Value
}

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing command '$Name'. Install it first, then run this script again."
  }
}

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  Write-Host "> $FilePath $($Arguments -join ' ')"
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE."
  }
}

function Assert-ChildPath {
  param(
    [string]$Parent,
    [string]$Child
  )

  $parentFullPath = [System.IO.Path]::GetFullPath($Parent).TrimEnd([System.IO.Path]::DirectorySeparatorChar)
  $childFullPath = [System.IO.Path]::GetFullPath($Child)
  if (-not $childFullPath.StartsWith($parentFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to operate outside repository: $childFullPath"
  }
}

$repoRoot = $PSScriptRoot
$configPath = Join-Path $repoRoot "deploy-aws.config.json"
$config = $null

if (Test-Path -LiteralPath $configPath) {
  $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
}

$Bucket = Use-ConfigDefault -Config $config -Name "bucket" -Current $Bucket
$DistributionId = Use-ConfigDefault -Config $config -Name "distributionId" -Current $DistributionId
$Region = Use-ConfigDefault -Config $config -Name "region" -Current $Region
$Profile = Use-ConfigDefault -Config $config -Name "profile" -Current $Profile

if (-not $PSBoundParameters.ContainsKey("SkipTests") -and $null -ne $config -and $null -ne $config.PSObject.Properties["skipTests"]) {
  $SkipTests = [bool]$config.skipTests
}

if (-not $PSBoundParameters.ContainsKey("SkipInvalidation") -and $null -ne $config -and $null -ne $config.PSObject.Properties["skipInvalidation"]) {
  $SkipInvalidation = [bool]$config.skipInvalidation
}

if (-not $Bucket) {
  throw "Missing S3 bucket. Set it in deploy-aws.config.json or pass -Bucket."
}

if (-not $SkipInvalidation -and -not $DistributionId) {
  throw "Missing CloudFront distribution id. Set it in deploy-aws.config.json, pass -DistributionId, or use -SkipInvalidation."
}

if (-not $Region) {
  $Region = "ap-northeast-1"
}

Require-Command "npm.cmd"
Require-Command "aws"

Push-Location $repoRoot
try {
  if ($SkipTests) {
    Invoke-Checked "npm.cmd" @("run", "build")
  } else {
    Invoke-Checked "npm.cmd" @("test")
    Invoke-Checked "npm.cmd" @("run", "build")
  }

  $deployDir = Join-Path $repoRoot ".aws-deploy"
  Assert-ChildPath -Parent $repoRoot -Child $deployDir
  if (Test-Path -LiteralPath $deployDir) {
    Remove-Item -LiteralPath $deployDir -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $deployDir | Out-Null
  Copy-Item -Path (Join-Path $repoRoot "dist\*") -Destination $deployDir -Recurse -Force

  $awsPrefix = @()
  if ($Profile) {
    $awsPrefix += @("--profile", $Profile)
  }
  if ($Region) {
    $awsPrefix += @("--region", $Region)
  }

  $syncArgs = @()
  $syncArgs += $awsPrefix
  $syncArgs += @("s3", "sync", $deployDir, "s3://$Bucket", "--delete", "--cache-control", "no-cache")
  if ($DryRun) {
    $syncArgs += "--dryrun"
  }
  Invoke-Checked "aws" $syncArgs

  if (-not $SkipInvalidation -and -not $DryRun) {
    $invalidateArgs = @()
    $invalidateArgs += $awsPrefix
    $invalidateArgs += @("cloudfront", "create-invalidation", "--distribution-id", $DistributionId, "--paths", "/*")
    Invoke-Checked "aws" $invalidateArgs
  } elseif ($DryRun) {
    Write-Host "Dry run enabled; skipping CloudFront invalidation."
  } else {
    Write-Host "CloudFront invalidation skipped."
  }

  Write-Host "Deploy complete."
} finally {
  Pop-Location
}
