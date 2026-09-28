#!/usr/bin/env bash
# BrewDeck installer: Nintendo Switch {{hardware}}, Horizon OS {{hos}}
#
# Usage: bash install.sh [-y] [SD card root]
#   The SD card root defaults to the directory of this script, -y skips the confirmation.
#
# Downloads the latest releases of the selected components from GitHub,
# unpacks them onto the SD card and writes the configuration.
# Set GITHUB_TOKEN to lift the GitHub API limit of 60 requests per hour.

set -euo pipefail

ASSUME_YES=0
if [ "${1:-}" = "-y" ] || [ "${1:-}" = "--yes" ]; then
	ASSUME_YES=1
	shift
fi

SD_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
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
if [ ! -d "$SD_ROOT" ] || [ ! -w "$SD_ROOT" ]; then
	echo "error: $SD_ROOT is not a writable directory" >&2
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

# Downloads the matching asset into the work directory and prints its path
fetch() {
	local url file
	url="$(asset_url "$1" "$2")" || return 1
	file="$WORK_DIR/$(basename "$url")"
	curl -fsSL -o "$file" "$url" || return 1
	echo "$file"
}

# install_zip REPOSITORY REGEX [ROOT]: merges the archive, or its ROOT directory, into the SD root
install_zip() {
	local file unpacked="$WORK_DIR/unpacked"
	file="$(fetch "$1" "$2")" || return 1
	rm -rf "$unpacked" && mkdir -p "$unpacked"
	extract "$file" "$unpacked" || return 1
	cp -R "$unpacked/${3:-.}/." "$SD_ROOT/"
}

# install_file REPOSITORY REGEX PATH: saves the asset to PATH on the SD card
install_file() {
	local file
	file="$(fetch "$1" "$2")" || return 1
	mkdir -p "$SD_ROOT/$(dirname "$3")" && cp "$file" "$SD_ROOT/$3"
}

# write_config PATH: writes stdin to PATH on the SD card
write_config() {
	mkdir -p "$SD_ROOT/$(dirname "$1")" && cat > "$SD_ROOT/$1"
}

{{#components}}
echo '==> {{name}}'
{{#items}}
{{#path}}install_file '{{repo}}' '{{asset}}' '{{path}}' &&{{/path}}{{^path}}install_zip '{{repo}}' '{{asset}}' '{{root}}' &&{{/path}}
{{/items}}
	true || FAILED+=('{{name}}')

{{/components}}
echo '==> Configuration'
{{#configs}}
write_config '{{path}}' << 'NX_BUILDER_EOF'
{{content}}
NX_BUILDER_EOF
{{/configs}}

# macOS leaves AppleDouble ._ files on FAT32, Atmosphere tries to load them as contents
if [ "$(uname)" = Darwin ] && command -v dot_clean > /dev/null; then
	dot_clean -m "$SD_ROOT"
fi
{{#hasManual}}

echo
echo 'Download manually:'
{{#manual}}
echo '  {{.}}'
{{/manual}}
{{/hasManual}}

echo
if [ ${#FAILED[@]} -gt 0 ]; then
	echo "Failed: ${FAILED[*]}" >&2
	exit 1
fi
echo 'Done. Eject the SD card safely and boot the console.'
