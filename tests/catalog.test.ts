import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { HARDWARE } from '@data';
import { matchingPreset, presetSelection, resolveSelection } from '@/data';
import { PLATFORMS } from '@/platforms';
import { CATALOG, GALLERY, SWITCH } from '@/platforms/switch';
import { I18N } from '@i18n';
import { buttonName, isButtons } from '@/components/Buttons';

const PLATFORM_CASES = Object.values(PLATFORMS).map(platform => [platform.id, platform] as const);
const LANGUAGE_CASES = Object.entries(I18N);

describe('catalog', () => {
	it('builds for the platform of every console', () => {
		expect(HARDWARE.filter(hw => !(hw.platform in PLATFORMS)).map(hw => hw.id)).toEqual([]);
	});

	it.each(PLATFORM_CASES)('refers only to existing components of %s', (id, { catalog }) => {
		const ids = new Set(catalog.components.map(comp => comp.id));
		for (const comp of catalog.components) {
			const references = [
				...(comp.requires ?? []).flat(),
				...(comp.conflicts_with ?? []),
				...(comp.replaces ?? []),
				...(comp.sources.bundled ? [comp.sources.bundled] : [])
			];
			expect(references.filter(id => !ids.has(id)), comp.id).toEqual([]);
		}
		for (const preset of catalog.presets) {
			expect(preset.components.filter(id => !ids.has(id)), preset.id).toEqual([]);
		}
	});

	it.each(PLATFORM_CASES)('takes every component of %s from a source it has', (id, { catalog }) => {
		expect(catalog.components.filter(comp => !comp.sources[comp.source]?.length).map(comp => comp.id)).toEqual([]);
	});

	it.each(PLATFORM_CASES)('matches the assets of %s with patterns that read as they are written', (id, { catalog }) => {
		const patterns = catalog.components.flatMap(comp => (comp.sources.github ?? []).map(item => item.asset));
		// A backslash doubled in the YAML matches a backslash instead of escaping what follows it
		expect(patterns.filter(pattern => pattern.includes('\\\\'))).toEqual([]);
		expect(() => patterns.map(pattern => new RegExp(pattern))).not.toThrow();
	});

	it('installs payloads where their Launch entries point', () => {
		for (const comp of CATALOG.components.filter(comp => comp.payload)) {
			const paths = [...(comp.sources.github ?? []), ...(comp.sources.url ?? [])].map(item => item.path).filter(Boolean);
			// Archives unpack the payload themselves, single files are saved to the path
			expect(paths.every(path => path == comp.payload), comp.id).toBe(true);
		}
	});

	it('has every picture in public', () => {
		const files = [
			...Object.values(PLATFORMS).flatMap(({ id, catalog }) => catalog.components.filter(comp => comp.logo).map(comp => `logos/${id}/${comp.logo}`)),
			...GALLERY.map(image => image.file),
			...HARDWARE.map(hw => `assets/${hw.image}`)
		];
		expect(files.filter(file => !existsSync(`public/${file}`))).toEqual([]);
	});

	it.each(PLATFORM_CASES)('credits every logo of %s in public/LICENSE', id => {
		// The section of the platform runs up to the next unindented line
		const section = readFileSync('public/LICENSE', 'utf8').split(`\nlogos/${id}/\n`)[1].split(/\n(?=\S)/)[0];
		const credited = [...section.matchAll(/^ {4}([\w.-]+\.(?:png|jpg))\b/gm)].map(match => match[1]).sort();
		expect(credited).toEqual(readdirSync(`public/logos/${id}`).sort());
	});

	describe.each(LANGUAGE_CASES)('in %s', (lang, t) => {
		it.each(PLATFORM_CASES)('describes every component, option and preset of %s', (id, { catalog }) => {
			expect(catalog.components.filter(comp => !t.software[id][comp.id]?.description).map(comp => comp.id)).toEqual([]);
			const missing = catalog.tuning.flatMap(group => group.options
				.filter(option => !t.tuning[id][group.id]?.options[option.id]?.title)
				.map(option => `${group.id}.${option.id}`));
			expect(missing).toEqual([]);
			expect(catalog.presets.filter(preset => !t.pages.software.presets[preset.id]).map(preset => preset.id)).toEqual([]);
		});

		it.each(PLATFORM_CASES)('keeps no texts of %s for what the catalog no longer has', (id, { catalog }) => {
			const components = new Set(catalog.components.map(comp => comp.id));
			const options = new Set(catalog.tuning.flatMap(group => group.options.map(option => `${group.id}.${option.id}`)));
			const stale = [
				...Object.keys(t.software[id]).filter(component => !components.has(component)),
				...Object.entries(t.tuning[id]).flatMap(([group, texts]) => Object.keys(texts.options).map(option => `${group}.${option}`)).filter(option => !options.has(option))
			];
			expect(stale).toEqual([]);
		});

		it('names every button', () => {
			const buttons = CATALOG.tuning.flatMap(group => group.options)
				.flatMap(option => 'values' in option && isButtons(option.values) ? option.values.map(value => buttonName(String(value))) : []);
			expect(buttons.length).toBeGreaterThan(0);
			expect(buttons.filter(button => !t.buttons[button])).toEqual([]);
		});
	});
});

describe('selection', () => {
	it('keeps required components and what ships with them', () => {
		expect(resolveSelection(CATALOG, [])).toEqual(expect.arrayContaining(['atmosphere', 'hekate', 'daybreak']));
	});

	it('brings dependencies of an added component', () => {
		expect(resolveSelection(CATALOG, ['fps_locker'])).toEqual(expect.arrayContaining(['saltynx', 'ovlmenu']));
	});

	it('leaves a removed dependency removed', () => {
		expect(resolveSelection(CATALOG, ['fps_locker', 'ovlmenu'], false)).not.toContain('saltynx');
	});

	// Alternatives written as plain requirements would bring both sides of a conflict
	it.each(PLATFORM_CASES)('picks any component of %s without conflicts among what it brings', (id, platform) => {
		for (const comp of platform.catalog.components) {
			const selection = resolveSelection(platform.catalog, [comp.id]);
			const conflicts = platform.validate({ ...platform.defaults(), selectedComponentIDs: selection }, I18N.en)
				.filter(issue => issue.code == 'conflict');
			expect(conflicts, comp.id).toEqual([]);
		}
	});

	const presets = Object.values(PLATFORMS).flatMap(platform => platform.catalog.presets.map(preset => [`${platform.id} ${preset.id}`, platform, preset] as const));
	it.each(presets)('turns the %s preset into a consistent selection', (name, platform, preset) => {
		const selection = presetSelection(platform.catalog, preset);
		// Everything takes both sides of conflicts too, the user picks one
		const broken = platform.validate({ ...platform.defaults(), selectedComponentIDs: selection }, I18N.en)
			.filter(issue => issue.code == 'requires' || (preset.id != 'all' && issue.code == 'conflict'));
		expect(broken).toEqual([]);
		expect(matchingPreset(platform.catalog, selection)?.id).toBe(preset.id);
	});
});

describe('steps', () => {
	const steps = (ids: string[]) => SWITCH.steps({ ...SWITCH.defaults(), selectedComponentIDs: resolveSelection(CATALOG, ids) });

	it('show the settings of modules, overlays and applications only for the selected ones that have some', () => {
		expect(steps([]).filter(step => ['sysmodules', 'overlays', 'dbi', 'jksv', 'amiibo'].includes(step))).toEqual([]);
		expect(steps(['sys_con'])).toContain('sysmodules');
		expect(steps(['ultrahand'])).toContain('overlays');
		// An application with a lot to set has a step of its own, the tools for amiibo share theirs
		expect(steps(['jksv']).filter(step => ['dbi', 'jksv', 'amiibo'].includes(step))).toEqual(['jksv']);
		expect(steps(['dbi', 'amiigo']).filter(step => ['dbi', 'jksv', 'amiibo'].includes(step))).toEqual(['dbi', 'amiibo']);
	});

	// A step misspelled in the data would hide its settings without a word
	it.each(PLATFORM_CASES)('keep every group of settings of %s on a step the platform goes through', (id, platform) => {
		const everything = platform.steps({ ...platform.defaults(), selectedComponentIDs: platform.catalog.components.map(comp => comp.id) });
		expect(platform.catalog.tuning.filter(group => !everything.includes(group.step)).map(group => group.id)).toEqual([]);
	});
});
