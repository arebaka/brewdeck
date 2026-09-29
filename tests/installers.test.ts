import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { GeneratedFile, build } from '@/build';
import { PRESETS, presetSelection } from '@/data';
import { translations } from '@/i18n';
import { defaultState } from '@/url';
import { BITMAPS, encodeBitmaps } from './fixtures';

// The installers are run for real where their tools are installed
const has = (command: string) => spawnSync('sh', ['-c', `command -v ${command}`]).status == 0;
const canRunBash = has('bash') && has('curl') && (has('unzip') || has('bsdtar') || has('python3'));

// Without components nothing is downloaded: the installers only write the configuration and the embedded images
const offline = build({
	...defaultState(),
	selectedComponentIDs: [],
	appearance: { bootlogo: 'hekate-a', background: 'atmosphere-splash', icons: { emummc: 'hekate-switch' } },
	images: encodeBitmaps(BITMAPS),
	t: translations.en
});

// Every kind of download at once: App Store packages, GitHub archives and files, direct links, manual components
const everything = build({
	...defaultState(),
	hardware: 'mariko',
	selectedComponentIDs: presetSelection(PRESETS.find(preset => preset.id == 'all')!),
	t: translations.en
});

const builds = [['offline', offline.files], ['everything', everything.files]] as const;
const script = (files: GeneratedFile[], path: string) => files.find(file => file.path == path)!.content;

// Every installer gets an empty directory standing for the SD card
const cards: string[] = [];
function card(file: string, content: string): string {
	const root = mkdtempSync(join(tmpdir(), 'brewdeck-'));
	cards.push(root);
	writeFileSync(join(root, file), content);
	return root;
}
afterAll(() => cards.forEach(root => rmSync(root, { recursive: true, force: true })));

function expectInstalled(root: string) {
	for (const [path, data] of Object.entries(BITMAPS)) {
		expect(readFileSync(join(root, path)).equals(data), path).toBe(true);
	}
	for (const config of offline.configs) {
		expect(readFileSync(join(root, config.path), 'utf8'), config.path).toBe(`${config.content.trimEnd()}\n`);
	}
}

describe.skipIf(!canRunBash)('install.sh', () => {
	it('writes the configuration and the images next to itself', () => {
		const root = card('install.sh', script(offline.files, 'install.sh'));
		execFileSync('bash', [join(root, 'install.sh'), '-y'], { stdio: 'pipe' });
		expectInstalled(root);
	});
});

describe.skipIf(!has('shellcheck'))('install.sh under shellcheck', () => {
	it.each(builds)('has no findings for the %s build', (name, files) => {
		execFileSync('shellcheck', ['-S', 'style', '-'], { input: script(files, 'install.sh'), stdio: 'pipe' });
	});
});

describe.skipIf(!has('pwsh'))('install.ps1', () => {
	// The page adds the byte order mark for Windows PowerShell
	it('writes the configuration and the images next to itself', () => {
		const root = card('install.ps1', `﻿${script(offline.files, 'install.ps1')}`);
		execFileSync('pwsh', ['-NoProfile', '-File', join(root, 'install.ps1'), '-Yes'], { stdio: 'pipe' });
		expectInstalled(root);
	}, 60_000);

	it.each(builds)('parses the %s build', (name, files) => {
		const path = join(card('install.ps1', script(files, 'install.ps1')), 'install.ps1');
		const errors = execFileSync('pwsh', ['-NoProfile', '-Command', [
			'$errors = $null',
			`[void][System.Management.Automation.Language.Parser]::ParseFile('${path}', [ref]$null, [ref]$errors)`,
			'$errors | ForEach-Object { "$($_.Extent.StartLineNumber): $($_.Message)" }'
		].join('; ')], { encoding: 'utf8' });
		expect(errors.trim()).toBe('');
	}, 60_000);
});
