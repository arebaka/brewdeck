#!/usr/bin/env bash
# BrewDeck installer: Nintendo Switch {{hardware}}, Horizon OS {{hos}}
#
# Usage: put the script into the root of the SD card and run it there: bash install.sh [-y]
#   -y skips the confirmation.
#
# Downloads the selected components from the Homebrew App Store, GitHub releases and direct links,
# unpacks them onto the SD card next to the script and writes the configuration and images.
# Set GITHUB_TOKEN to lift the GitHub API limit of 60 requests per hour.

set -euo pipefail

ASSUME_YES=0
if [ "${1:-}" = "-y" ] || [ "${1:-}" = "--yes" ]; then
	ASSUME_YES=1
fi

APPSTORE='https://switch.cdn.fortheusers.org'
SD_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$SD_ROOT/.brewdeck"
FAILED=()

if ! command -v curl > /dev/null; then
	echo "error: curl is required" >&2
	exit 1
fi
if command -v unzip > /dev/null; then
	extract() { unzip -qo "$1" -d "$2"; }
elif command -v bsdtar > /dev/null; then
	extract() { bsdtar -xf "$1" -C "$2"; }
elif command -v python3 > /dev/null; then
	extract() { python3 -m zipfile -e "$1" "$2"; }
else
	echo "error: unzip, bsdtar or python3 is required" >&2
	exit 1
fi
{{#hasImages}}
if ! command -v base64 > /dev/null || ! command -v gzip > /dev/null; then
	echo "error: base64 and gzip are required" >&2
	exit 1
fi
{{/hasImages}}
if [ ! -w "$SD_ROOT" ]; then
	echo "error: $SD_ROOT is not writable" >&2
	exit 1
fi

echo "Installing to $SD_ROOT"
if [ "$ASSUME_YES" = 0 ] && [ -t 0 ]; then
	read -r -p "Continue? [y/N] " answer
	case "$answer" in
		[yY]*) ;;
		*) exit 1 ;;
	esac
fi

# Downloads land on the SD card next to the script and are removed at the end
mkdir -p "$WORK_DIR"
trap 'rm -rf "$WORK_DIR"' EXIT

# Prints the URL of the first asset of the latest release of repository $1 whose name matches regex $2
asset_url() {
	local cache="$WORK_DIR/release-${1//\//_}.json" url name
	if [ ! -f "$cache" ]; then
		curl -fsSL -H 'Accept: application/vnd.github+json' ${GITHUB_TOKEN:+-H "Authorization: Bearer $GITHUB_TOKEN"} \
			"https://api.github.com/repos/$1/releases/latest" > "$cache" || { rm -f "$cache"; return 1; }
	fi
	while read -r url; do
		name="$(basename "$url")"
		if printf '%s\n' "${name//%2B/+}" | grep -Eq "$2"; then
			echo "$url"
			return 0
		fi
	done < <(grep -o '"browser_download_url": *"[^"]*"' "$cache" | sed 's/.*"\(http[^"]*\)"$/\1/')
	echo "  no asset matching $2 in $1" >&2
	return 1
}

# download URL: saves the file into the work directory and prints its path
download() {
	local file
	file="$WORK_DIR/$(basename "${1%%\?*}")"
	curl -fsSL -o "$file" "$1" || return 1
	echo "$file"
}

# unpack ARCHIVE [ROOT] [INTO]: merges the archive, or its ROOT directory, into the INTO directory of the SD card
unpack() {
	local unpacked="$WORK_DIR/unpacked"
	rm -rf "$unpacked" && mkdir -p "$unpacked" "$SD_ROOT/${3:-.}"
	extract "$1" "$unpacked" || return 1
	cp -R "$unpacked/${2:-.}/." "$SD_ROOT/${3:-.}/"
}

# save FILE PATH: copies the file to PATH on the SD card
save() {
	mkdir -p "$SD_ROOT/$(dirname "$2")" && cp "$1" "$SD_ROOT/$2"
}

# install_appstore PACKAGE: unpacks a Homebrew App Store package and registers it, so the store on the console sees it installed
install_appstore() {
	local file unpacked="$WORK_DIR/unpacked" registry="$SD_ROOT/switch/appstore/.get/packages/$1"
	file="$(download "$APPSTORE/zips/$1.zip")" || return 1
	rm -rf "$unpacked" && mkdir -p "$unpacked" "$registry"
	extract "$file" "$unpacked" || return 1
	for meta in manifest.install info.json; do
		if [ -f "$unpacked/$meta" ]; then
			mv "$unpacked/$meta" "$registry/$meta"
		fi
	done
	cp -R "$unpacked/." "$SD_ROOT/"
}

# install_zip REPOSITORY REGEX [ROOT] [INTO]: unpacks a release archive
install_zip() {
	local url file
	url="$(asset_url "$1" "$2")" && file="$(download "$url")" && unpack "$file" "${3:-}" "${4:-}"
}

# install_file REPOSITORY REGEX PATH: saves a release asset to PATH
install_file() {
	local url file
	url="$(asset_url "$1" "$2")" && file="$(download "$url")" && save "$file" "$3"
}

# write_config PATH: writes stdin to PATH on the SD card
write_config() {
	mkdir -p "$SD_ROOT/$(dirname "$1")" && cat > "$SD_ROOT/$1"
}

# write_image PATH: decodes a gzip-compressed base64 image from stdin to PATH on the SD card
write_image() {
	mkdir -p "$SD_ROOT/$(dirname "$1")" && base64 --decode | gzip -dc > "$SD_ROOT/$1"
}

{{#components}}
echo '==> {{name}}'
{{#steps}}
{{#appstore}}install_appstore '{{package}}' &&{{/appstore}}{{#zip}}install_zip '{{repo}}' '{{asset}}' '{{root}}' '{{into}}' &&{{/zip}}{{#file}}install_file '{{repo}}' '{{asset}}' '{{path}}' &&{{/file}}{{#urlZip}}{ archive="$(download '{{url}}')" && unpack "$archive" '{{root}}' '{{into}}'; } &&{{/urlZip}}{{#urlFile}}{ file="$(download '{{url}}')" && save "$file" '{{path}}'; } &&{{/urlFile}}
{{/steps}}
	true || FAILED+=('{{name}}')

{{/components}}
echo '==> Configuration'
{{#configs}}
write_config '{{path}}' << 'BREWDECK_EOF'
{{content}}
BREWDECK_EOF
{{/configs}}
{{#hasImages}}

echo '==> Appearance'
{{#images}}
write_image '{{path}}' << 'BREWDECK_EOF'
{{data}}
BREWDECK_EOF
{{/images}}
{{/hasImages}}

# macOS leaves AppleDouble ._ files on FAT32, Atmosphere tries to load them as contents
if [ "$(uname)" = Darwin ] && command -v dot_clean > /dev/null; then
	dot_clean -m "$SD_ROOT"
fi
{{#hasManual}}

echo
echo 'Download manually:'
{{#manual}}
echo '  {{name}}: {{url}}'
{{/manual}}
{{/hasManual}}

echo
if [ ${#FAILED[@]} -gt 0 ]; then
	echo "Failed: ${FAILED[*]}" >&2
	exit 1
fi
echo 'Done. Eject the SD card safely and boot the console.'
