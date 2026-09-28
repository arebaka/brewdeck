# BrewDeck installer: Nintendo Switch {{hardware}}, Horizon OS {{hos}}
#
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1 [-SdRoot E:\] [-Yes]
#   SdRoot defaults to the directory of this script, -Yes skips the confirmation.
#
# Downloads the latest releases of the selected components from GitHub,
# unpacks them onto the SD card and writes the configuration.
# Set $env:GITHUB_TOKEN to lift the GitHub API limit of 60 requests per hour.

param(
	[string]$SdRoot = $PSScriptRoot,
	[switch]$Yes
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue' # the progress bar slows Invoke-WebRequest down dramatically on PowerShell 5
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not (Test-Path -LiteralPath $SdRoot -PathType Container)) {
	Write-Host "error: $SdRoot is not a directory" -ForegroundColor Red
	exit 1
}
$SdRoot = (Resolve-Path -LiteralPath $SdRoot).Path

Write-Host "Installing to $SdRoot"
if (-not $Yes -and (Read-Host 'Continue? [y/N]') -notmatch '^[yY]') {
	exit 1
}

$WorkDir = Join-Path ([IO.Path]::GetTempPath()) ('nx-builder-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $WorkDir | Out-Null
$Releases = @{}
$Failed = @()

# Downloads the first asset of the latest release of the repository whose name matches the regex
function Get-Asset([string]$Repo, [string]$Pattern) {
	if (-not $Releases.ContainsKey($Repo)) {
		$headers = @{ Accept = 'application/vnd.github+json' }
		if ($env:GITHUB_TOKEN) {
			$headers.Authorization = "Bearer $env:GITHUB_TOKEN"
		}
		$Releases[$Repo] = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers $headers -UseBasicParsing
	}
	$asset = $Releases[$Repo].assets | Where-Object { $_.name -cmatch $Pattern } | Select-Object -First 1
	if (-not $asset) {
		throw "no asset matching $Pattern in $Repo"
	}
	$file = Join-Path $WorkDir $asset.name
	Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $file -UseBasicParsing
	return $file
}

# Merges the archive, or its Root directory, into the SD root
function Install-Zip([string]$Repo, [string]$Pattern, [string]$Root) {
	$file = Get-Asset $Repo $Pattern
	$unpacked = Join-Path $WorkDir 'unpacked'
	if (Test-Path -LiteralPath $unpacked) {
		Remove-Item -LiteralPath $unpacked -Recurse -Force
	}
	Expand-Archive -LiteralPath $file -DestinationPath $unpacked -Force
	$source = if ($Root) { Join-Path $unpacked $Root } else { $unpacked }
	Copy-Item -Path (Join-Path $source '*') -Destination $SdRoot -Recurse -Force
}

# Saves the asset to Path on the SD card
function Install-File([string]$Repo, [string]$Pattern, [string]$Path) {
	$file = Get-Asset $Repo $Pattern
	$target = Join-Path $SdRoot $Path
	New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
	Copy-Item -LiteralPath $file -Destination $target -Force
}

# Writes UTF-8 without BOM and with LF line endings, as the console expects
function Write-Config([string]$Path, [string]$Content) {
	$target = Join-Path $SdRoot $Path
	New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
	[IO.File]::WriteAllText($target, ($Content -replace "`r`n", "`n") + "`n")
}

{{#components}}
Write-Host '==> {{name}}' -ForegroundColor Cyan
try {
{{#items}}
{{#path}}	Install-File '{{repo}}' '{{asset}}' '{{path}}'{{/path}}{{^path}}	Install-Zip '{{repo}}' '{{asset}}' '{{root}}'{{/path}}
{{/items}}
} catch {
	Write-Warning $_
	$Failed += '{{name}}'
}

{{/components}}
Write-Host '==> Configuration' -ForegroundColor Cyan
{{#configs}}
Write-Config '{{path}}' @'
{{content}}
'@
{{/configs}}

Remove-Item -LiteralPath $WorkDir -Recurse -Force -ErrorAction SilentlyContinue
{{#hasManual}}

Write-Host ''
Write-Host 'Download manually:'
{{#manual}}
Write-Host '  {{.}}'
{{/manual}}
{{/hasManual}}

Write-Host ''
if ($Failed.Count -gt 0) {
	Write-Host "Failed: $($Failed -join ', ')" -ForegroundColor Red
} else {
	Write-Host 'Done. Eject the SD card safely and boot the console.' -ForegroundColor Green
}
if (-not $Yes) {
	Read-Host 'Press Enter to exit' | Out-Null
}
exit [int]($Failed.Count -gt 0)
