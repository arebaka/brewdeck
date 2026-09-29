// Refreshes the catalog from the Homebrew App Store and GitHub: versions, sizes, release dates,
// the fresher source of every component and logos. Maps HOS versions to the Atmosphere releases supporting them.
//
// Usage: npm run sync                  GITHUB_TOKEN or a logged in gh CLI lifts the GitHub API limit
//        npm run sync -- --logos       downloads logos again, even the existing ones

import { readFile, writeFile, readdir, stat, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import JSZip from 'jszip';

const APPSTORE = 'https://switch.cdn.fortheusers.org';
const SWITCHBREW_VERSIONS = 'https://switchbrew.org/wiki/System_Versions';

const SOFTWARE = new URL('../data/software.json', import.meta.url);
const TUNING = new URL('../data/tuning.json', import.meta.url);
const FIRMWARE = new URL('../data/firmware.json', import.meta.url);
const LOGOS = new URL('../public/logos/', import.meta.url);

const MAX_ICON_SOURCE = 40 * 1024 * 1024; // archives bigger than this are not downloaded for an icon
const STUB_LOGO = 1024; // logos smaller than this are placeholders

const refreshLogos = process.argv.includes('--logos');
const token = process.env.GITHUB_TOKEN || ghToken();

function ghToken() {
	try {
		return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return '';
	}
}

async function request(url, headers = {}) {
	const response = await fetch(url, { headers: { 'User-Agent': 'brewdeck-sync', ...headers } });
	if (!response.ok) {
		throw new Error(`${response.status} ${url}`);
	}
	return response;
}

const github = async (path) => (await request(`https://api.github.com/${path}`, {
	Accept: 'application/vnd.github+json',
	...(token && { Authorization: `Bearer ${token}` })
})).json();

const download = async (url) => Buffer.from(await (await request(url)).arrayBuffer());

// Size of a download in bytes, 0 when the server does not tell
async function contentLength(url) {
	try {
		return Number((await fetch(url, { method: 'HEAD' })).headers.get('content-length')) || 0;
	} catch {
		return 0;
	}
}

// Numeric part of a version, v1.25.1 → [1, 25, 1]. Dates such as 12/02/2025 are not versions
function parseVersion(version) {
	const match = !/\d+\/\d+\/\d+/.test(version) && String(version).match(/\d+(?:\.\d+)*/);
	return match ? match[0].split('.').map(Number) : null;
}

function compareVersions(a, b) {
	const [x, y] = [parseVersion(a), parseVersion(b)];
	if (!x || !y) return 0;
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		const difference = (x[i] ?? 0) - (y[i] ?? 0);
		if (difference) return Math.sign(difference);
	}
	return 0;
}

// App Store dates are dd/mm/yyyy
const storeDate = (date) => date.split('/').reverse().join('-');

// Equal or unknown versions are decided by the release date, the App Store wins a tie
function pickSource(component, store, release) {
	if (component.prefer) return component.prefer;
	if (!release) return 'appstore';
	if (!store) return 'github';
	return (compareVersions(store.version, release.version) || (store.date >= release.date ? 1 : -1)) > 0 ? 'appstore' : 'github';
}

// Icon from the asset section of a homebrew executable (.nro, .ovl)
function nroIcon(buffer) {
	if (buffer.length < 0x20 || buffer.toString('ascii', 0x10, 0x14) != 'NRO0') return null;
	const assets = buffer.readUInt32LE(0x18);
	if (buffer.length < assets + 0x18 || buffer.toString('ascii', assets, assets + 4) != 'ASET') return null;
	const offset = Number(buffer.readBigUInt64LE(assets + 8));
	const size = Number(buffer.readBigUInt64LE(assets + 16));
	return size ? buffer.subarray(assets + offset, assets + offset + size) : null;
}

// Largest executable of an archive is the application itself, not a bundled helper
async function archiveIcon(buffer) {
	const zip = await JSZip.loadAsync(buffer);
	const executables = Object.values(zip.files)
		.filter(file => !file.dir && /\.(nro|ovl)$/i.test(file.name) && !/hbmenu|reboot_to/i.test(file.name));
	const sizes = await Promise.all(executables.map(async file => ({ file, data: await file.async('nodebuffer') })));
	sizes.sort((a, b) => b.data.length - a.data.length);
	for (const { data } of sizes) {
		const icon = nroIcon(data);
		if (icon) return icon;
	}
	return null;
}

// Assets named after an option of the component, such as a language, are looked up with its default
function assetPattern(component, item, tuning) {
	const options = tuning.find(group => group.id == component.id)?.options ?? [];
	return new RegExp(item.asset.replace(/\{\{(\w+)\}\}/g, (match, id) => options.find(option => option.id == id)?.default ?? match));
}

async function findLogo(component, release, packages, tuning) {
	for (const name of component.sources.appstore ?? []) {
		try {
			return { data: await download(`${APPSTORE}/packages/${name}/icon.png`), extension: 'png' };
		} catch {}
	}

	const assets = (component.sources.github ?? [])
		.map(item => release?.assets.find(asset => assetPattern(component, item, tuning).test(asset.name)))
		.filter(asset => asset && asset.size < MAX_ICON_SOURCE && /\.(nro|ovl|zip)$/i.test(asset.name));
	const archives = packages
		.filter(pkg => pkg.filesize * 1024 < MAX_ICON_SOURCE)
		.map(pkg => `${APPSTORE}/zips/${pkg.name}.zip`);

	for (const url of [...assets.map(asset => asset.browser_download_url), ...archives]) {
		try {
			const data = await download(url);
			const icon = /\.zip$/i.test(url) ? await archiveIcon(data) : nroIcon(data);
			if (icon) return { data: icon, extension: icon[0] == 0x89 ? 'png' : 'jpg' };
		} catch {}
	}
	return null;
}

async function existingLogo(component) {
	if (!component.logo) return false;
	try {
		return (await stat(new URL(component.logo, LOGOS))).size >= STUB_LOGO;
	} catch {
		return false;
	}
}

// Arrays of plain values and objects nested in arrays stay on one line, like the hand written data
function format(value, depth = 0, inline = false) {
	const indent = '\t'.repeat(depth);
	if (Array.isArray(value)) {
		if (value.every(item => typeof item != 'object' || Array.isArray(item))) {
			return `[${value.map(item => format(item)).join(', ')}]`;
		}
		return `[\n${value.map(item => `${indent}\t${format(item, depth + 1, depth > 0)}`).join(',\n')}\n${indent}]`;
	}
	if (value && typeof value == 'object') {
		const entries = Object.entries(value).filter(([, item]) => item !== undefined);
		if (inline) {
			return `{ ${entries.map(([key, item]) => `${JSON.stringify(key)}: ${JSON.stringify(item)}`).join(', ')} }`;
		}
		return `{\n${entries.map(([key, item]) => `${indent}\t${JSON.stringify(key)}: ${format(item, depth + 1)}`).join(',\n')}\n${indent}}`;
	}
	return JSON.stringify(value);
}

async function syncSoftware() {
	const software = JSON.parse(await readFile(SOFTWARE, 'utf8'));
	const tuning = JSON.parse(await readFile(TUNING, 'utf8'));
	const store = Object.fromEntries((await (await request(`${APPSTORE}/repo.json`)).json()).packages.map(pkg => [pkg.name, pkg]));
	const releases = new Map();
	const release = async (repo) => {
		if (!releases.has(repo)) {
			const latest = await github(`repos/${repo}/releases/latest`);
			releases.set(repo, { version: latest.tag_name, date: latest.published_at.slice(0, 10), assets: latest.assets });
		}
		return releases.get(repo);
	};

	const problems = [];
	for (const component of software) {
		const { appstore = [], github: items = [], url = [] } = component.sources;
		const packages = appstore.map(name => store[name]).filter(Boolean);
		if (packages.length < appstore.length) {
			problems.push(`${component.id}: no App Store package ${appstore.filter(name => !store[name]).join(', ')}`);
		}
		// The store lists sizes rounded down to KiB, the archives themselves tell the exact ones
		const storeInfo = packages.length == appstore.length && packages.length > 0
			? {
				version: packages.at(-1).version,
				date: storeDate(packages.at(-1).updated),
				size: (await Promise.all(packages.map(async pkg => await contentLength(`${APPSTORE}/zips/${pkg.name}.zip`) || pkg.filesize * 1024)))
					.reduce((sum, size) => sum + size, 0)
			}
			: null;

		let releaseInfo = null;
		if (items.length) {
			const matched = [];
			for (const item of items) {
				const info = await release(item.repo);
				const asset = info.assets.find(asset => assetPattern(component, item, tuning).test(asset.name));
				if (!asset) problems.push(`${component.id}: no asset ${item.asset} in ${item.repo} ${info.version}`);
				else matched.push(asset);
			}
			const main = await release(items[0].repo);
			releaseInfo = { ...main, size: matched.reduce((sum, asset) => sum + asset.size, 0) };
		}

		if (storeInfo || releaseInfo) {
			const source = pickSource(component, storeInfo, releaseInfo);
			const chosen = source == 'appstore' ? storeInfo : releaseInfo;
			Object.assign(component, { source, version: chosen.version.replace(/^v(?=\d)/, ''), size: chosen.size, released: chosen.date });
		} else if (url.length) {
			const sizes = await Promise.all(url.map(item => contentLength(item.url)));
			Object.assign(component, { source: 'url', size: sizes.reduce((a, b) => a + b, 0) });
		} else {
			component.source = component.sources.bundled ? 'bundled' : 'manual';
		}

		if (refreshLogos || !(await existingLogo(component))) {
			const logo = await findLogo(component, items.length ? await release(items[0].repo) : null, packages, tuning);
			if (logo) {
				component.logo = `${component.id}.${logo.extension}`;
				await writeFile(new URL(component.logo, LOGOS), logo.data);
			} else if (!(await existingLogo(component))) {
				delete component.logo;
			}
		}

		const { id, source, version, released } = component;
		console.log(`${id.padEnd(24)} ${String(source).padEnd(9)} ${String(version).padEnd(14)} ${released ?? ''}${component.logo ? '' : '  (no logo)'}`);
	}

	// Placeholders nobody refers to any more
	const logos = new Set(software.map(component => component.logo).filter(Boolean));
	for (const file of await readdir(LOGOS)) {
		const path = new URL(file, LOGOS);
		if (!logos.has(file) && (await stat(path)).size < STUB_LOGO) await unlink(path);
	}

	await writeFile(SOFTWARE, format(software.map(({ id, name, author, category, version, size, released, logo, source, prefer, sources, ...rest }) =>
		({ id, name, author, category, version, size, released, logo, source, prefer, sources, ...rest }))) + '\n');
	return problems;
}

// Every HOS version maps to the first Atmosphere release that supports it or an older version of the same line
async function syncFirmware() {
	const firmware = JSON.parse(await readFile(FIRMWARE, 'utf8'));

	const support = [];
	for (let page = 1; ; page++) {
		const releases = await github(`repos/Atmosphere-NX/Atmosphere/releases?per_page=100&page=${page}`);
		for (const release of releases) {
			const own = (release.body ?? '').split('And the following was changed in')[0];
			for (const [, hos] of own.matchAll(/[Ss]upport was added for (\d+\.\d+\.\d+)/g)) {
				support.push({ hos, atmosphere: release.tag_name, date: release.published_at.slice(0, 10) });
			}
		}
		if (releases.length < 100) break;
	}
	// Several releases may mention the same version, the earliest one added the support
	support.sort((a, b) => compareVersions(a.hos, b.hos) || b.date.localeCompare(a.date));

	const page = await (await request(SWITCHBREW_VERSIONS, { 'User-Agent': 'Mozilla/5.0' })).text();
	const released = new Map();
	for (const [, row] of page.matchAll(/<tr>(.*?)<\/tr>/gs)) {
		const cells = [...row.matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gs)].map(([, cell]) => cell.replace(/<[^>]+>/g, '').trim());
		if (/^\d+\.\d+\.\d+$/.test(cells[0] ?? '') && !isNaN(Date.parse(cells[1]))) {
			released.set(cells[0], new Date(`${cells[1].replace(/\s*\(UTC\)/, '')} UTC`).toISOString().slice(0, 10));
		}
	}

	const newest = firmware.reduce((max, entry) => compareVersions(entry.version, max) > 0 ? entry.version : max, '0.0.0');
	for (const [version, date] of released) {
		if (compareVersions(version, newest) > 0) {
			firmware.push({ version, date, status: 'stable' });
			console.log(`firmware: added ${version} released ${date}`);
		}
	}
	firmware.sort((a, b) => compareVersions(b.version, a.version));

	for (const entry of firmware) {
		const official = released.get(entry.version);
		if (isNaN(Date.parse(entry.date)) || /-00-/.test(entry.date)) {
			console.log(`firmware: ${entry.version} date ${entry.date} is invalid, using ${official}`);
			entry.date = official ?? entry.date;
		} else if (official && Math.abs(Date.parse(official) - Date.parse(entry.date)) > 24 * 60 * 60 * 1000) {
			// Switchbrew dates are UTC, a day off is the American evening of the same release
			console.log(`firmware: ${entry.version} date ${entry.date} differs from switchbrew ${official}`);
		}

		const supported = support.filter(item => compareVersions(item.hos, entry.version) <= 0).at(-1);
		entry.atmosphere = supported?.atmosphere;
		entry.supported = supported?.date;
	}
	for (const entry of firmware.filter(entry => compareVersions(entry.version, support.at(-1).hos) > 0)) {
		entry.atmosphere = entry.supported = undefined;
		console.log(`firmware: ${entry.version} is not supported by Atmosphere yet`);
	}

	await writeFile(FIRMWARE, format(firmware) + '\n');
}

const problems = await syncSoftware();
await syncFirmware();

if (problems.length) {
	console.error(`\n${problems.join('\n')}`);
	process.exitCode = 1;
}
