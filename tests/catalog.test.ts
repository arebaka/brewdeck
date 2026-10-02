import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { HARDWARE, matchingPreset, presetSelection, resolveSelection } from '@/data';
import { PLATFORMS } from '@/platforms';
import { CATALOG, GALLERY } from '@/platforms/switch';
import { translations } from '@/i18n';
import { buttonName, isButtons } from '@/components/Buttons';

const platforms = Object.values(PLATFORMS).map(platform => [platform.id, platform] as const);
const languages = Object.entries(translations);

describe('catalog', () => {
	it('builds for the platform of every console', () => {
		expect(HARDWARE.filter(hw => !(hw.platform in PLATFORMS)).map(hw => hw.id)).toEqual([]);
	});

	it.each(platforms)('refers only to existing components of %s', (id, { catalog }) => {
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
		for (const preset of catalog.presets.filter(preset => Array.isArray(preset.components))) {
			expect((preset.components as string[]).filter(id => !ids.has(id)), preset.id).toEqual([]);
		}
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
			...HARDWARE.map(hw => `images/${hw.image}`)
		];
		expect(files.filter(file => !existsSync(`public/${file}`))).toEqual([]);
	});

	it.each(platforms)('credits every logo of %s in public/LICENSE', id => {
		// The section of the platform runs up to the next unindented line
		const section = readFileSync('public/LICENSE', 'utf8').split(`\nlogos/${id}/\n`)[1].split(/\n(?=\S)/)[0];
		const credited = [...section.matchAll(/^ {4}([\w.-]+\.(?:png|jpg))\b/gm)].map(match => match[1]).sort();
		expect(credited).toEqual(readdirSync(`public/logos/${id}`).sort());
	});

	describe.each(languages)('in %s', (lang, t) => {
		it.each(platforms)('describes every component, option and preset of %s', (id, { catalog }) => {
			expect(catalog.components.filter(comp => !t.software[id][comp.id]?.description).map(comp => comp.id)).toEqual([]);
			const missing = catalog.tuning.flatMap(group => group.options
				.filter(option => !t.tuning[id][group.id]?.options[option.id]?.title)
				.map(option => `${group.id}.${option.id}`));
			expect(missing).toEqual([]);
			expect(catalog.presets.filter(preset => !t.pages.software.presets[preset.id]).map(preset => preset.id)).toEqual([]);
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

	const presets = Object.values(PLATFORMS).flatMap(platform => platform.catalog.presets.map(preset => [`${platform.id} ${preset.id}`, platform, preset] as const));
	it.each(presets)('turns the %s preset into a consistent selection', (name, platform, preset) => {
		const selection = presetSelection(platform.catalog, preset);
		// Everything takes both sides of conflicts too, the user picks one
		const broken = platform.validate({ ...platform.defaults(), selectedComponentIDs: selection }, translations.en)
			.filter(issue => issue.code == 'requires' || (preset.components != 'all' && issue.code == 'conflict'));
		expect(broken).toEqual([]);
		expect(matchingPreset(platform.catalog, selection)?.id).toBe(preset.id);
	});
});
