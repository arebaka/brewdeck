# BrewDeck installer: Nintendo Switch {{hardware}}, Horizon OS {{hos}}
#
# Usage: put the script into the root of the SD card and run it there:
#   powershell -ExecutionPolicy Bypass -File install.ps1 [-Yes]
#   -Yes skips the confirmation.
#
# Downloads the selected components from the Homebrew App Store, GitHub releases and direct links,
# unpacks them onto the SD card next to the script and writes the configuration and images.
# Set $env:GITHUB_TOKEN to lift the GitHub API limit of 60 requests per hour.

param(
	[switch]$Yes
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue' # the progress bar slows Invoke-WebRequest down dramatically on PowerShell 5
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$AppStore = 'https://switch.cdn.fortheusers.org'
$SdRoot = $PSScriptRoot

Write-Host "Installing to $SdRoot"
if (-not $Yes -and (Read-Host 'Continue? [y/N]') -notmatch '^[yY]') {
	exit 1
}

# Downloads land on the SD card next to the script and are removed at the end
$WorkDir = Join-Path $SdRoot '.brewdeck'
New-Item -ItemType Directory -Path $WorkDir -Force | Out-Null
$Releases = @{}
$Failed = @()

# Saves the file into the work directory and returns its path
function Get-Download([string]$Url) {
	$file = Join-Path $WorkDir ([IO.Path]::GetFileName(([Uri]$Url).AbsolutePath))
	Invoke-WebRequest -Uri $Url -OutFile $file -UseBasicParsing
	return $file
}

# URL of the first asset of the latest release of the repository whose name matches the regex
function Get-AssetUrl([string]$Repo, [string]$Pattern) {
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
	return $asset.browser_download_url
}

# Unpacks the archive into a fresh folder of the work directory and returns it
function Expand-Download([string]$File) {
	$unpacked = Join-Path $WorkDir 'unpacked'
	if (Test-Path -LiteralPath $unpacked) {
		Remove-Item -LiteralPath $unpacked -Recurse -Force
	}
	Expand-Archive -LiteralPath $File -DestinationPath $unpacked -Force
	return $unpacked
}

# Merges the archive, or its Root directory, into the Into directory of the SD card
function Install-Archive([string]$File, [string]$Root, [string]$Into) {
	$unpacked = Expand-Download $File
	$source = if ($Root) { Join-Path $unpacked $Root } else { $unpacked }
	$target = if ($Into) { Join-Path $SdRoot $Into } else { $SdRoot }
	New-Item -ItemType Directory -Path $target -Force | Out-Null
	Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse -Force
}

# Copies the file to Path on the SD card
function Install-Download([string]$File, [string]$Path) {
	$target = Join-Path $SdRoot $Path
	New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
	Copy-Item -LiteralPath $File -Destination $target -Force
}

# Unpacks a Homebrew App Store package and registers it, so the store on the console sees it installed
function Install-AppStore([string]$Package) {
	$unpacked = Expand-Download (Get-Download "$AppStore/zips/$Package.zip")
	$registry = Join-Path $SdRoot "switch/appstore/.get/packages/$Package"
	New-Item -ItemType Directory -Path $registry -Force | Out-Null
	foreach ($meta in 'manifest.install', 'info.json') {
		$file = Join-Path $unpacked $meta
		if (Test-Path -LiteralPath $file) {
			Move-Item -LiteralPath $file -Destination (Join-Path $registry $meta) -Force
		}
	}
	Copy-Item -Path (Join-Path $unpacked '*') -Destination $SdRoot -Recurse -Force
}

# Writes UTF-8 without BOM and with LF line endings, as the console expects
function Write-Config([string]$Path, [string]$Content) {
	$target = Join-Path $SdRoot $Path
	New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
	[IO.File]::WriteAllText($target, ($Content -replace "`r`n", "`n") + "`n")
}

# Decodes a gzip-compressed base64 image to Path on the SD card
function Write-Image([string]$Path, [string]$Data) {
	$target = Join-Path $SdRoot $Path
	New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
	$gzip = [IO.Compression.GZipStream]::new([IO.MemoryStream]::new([Convert]::FromBase64String($Data)), [IO.Compression.CompressionMode]::Decompress)
	$file = [IO.File]::Create($target)
	try {
		$gzip.CopyTo($file)
	} finally {
		$file.Dispose()
		$gzip.Dispose()
	}
}

{{#components}}
Write-Host '==> {{name}}' -ForegroundColor Cyan
try {
{{#steps}}
{{#appstore}}	Install-AppStore '{{package}}'{{/appstore}}{{#zip}}	Install-Archive (Get-Download (Get-AssetUrl '{{repo}}' '{{asset}}')) '{{root}}' '{{into}}'{{/zip}}{{#file}}	Install-Download (Get-Download (Get-AssetUrl '{{repo}}' '{{asset}}')) '{{path}}'{{/file}}{{#urlZip}}	Install-Archive (Get-Download '{{url}}') '{{root}}' '{{into}}'{{/urlZip}}{{#urlFile}}	Install-Download (Get-Download '{{url}}') '{{path}}'{{/urlFile}}
{{/steps}}
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
{{#hasImages}}

Write-Host '==> Appearance' -ForegroundColor Cyan
{{#images}}
Write-Image '{{path}}' @'
{{data}}
'@
{{/images}}
{{/hasImages}}

Remove-Item -LiteralPath $WorkDir -Recurse -Force -ErrorAction SilentlyContinue
{{#hasManual}}

Write-Host ''
Write-Host 'Download manually:'
{{#manual}}
Write-Host '  {{name}}: {{url}}'
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
