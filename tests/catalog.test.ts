import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { COMPONENTS, GALLERY, HARDWARE, PRESETS, TUNING, matchingPreset, presetSelection, resolveSelection } from '@/data';
import { translations } from '@/i18n';
import { buttonName, isButtons } from '@/components/Buttons';
import { defaultState } from '@/state';
import { issueCodes } from './fixtures';

const ids = new Set(COMPONENTS.map(comp => comp.id));
const languages = Object.entries(translations);

describe('catalog', () => {
	it('refers only to existing components', () => {
		for (const comp of COMPONENTS) {
			const references = [
				...(comp.requires ?? []).flat(),
				...(comp.conflicts_with ?? []),
				...(comp.replaces ?? []),
				...(comp.sources.bundled ? [comp.sources.bundled] : [])
			];
			expect(references.filter(id => !ids.has(id)), comp.id).toEqual([]);
		}
		for (const preset of PRESETS.filter(preset => Array.isArray(preset.components))) {
			expect((preset.components as string[]).filter(id => !ids.has(id)), preset.id).toEqual([]);
		}
	});

	it('installs payloads where their Launch entries point', () => {
		for (const comp of COMPONENTS.filter(comp => comp.payload)) {
			const paths = [...(comp.sources.github ?? []), ...(comp.sources.url ?? [])].map(item => item.path).filter(Boolean);
			// Archives unpack the payload themselves, single files are saved to the path
			expect(paths.every(path => path == comp.payload), comp.id).toBe(true);
		}
	});

	it('has every picture in public', () => {
		const files = [
			...COMPONENTS.filter(comp => comp.logo).map(comp => `logos/${comp.logo}`),
			...GALLERY.map(image => image.file),
			...HARDWARE.map(hw => `images/${hw.image}`)
		];
		expect(files.filter(file => !existsSync(`public/${file}`))).toEqual([]);
	});

	it.each(languages)('describes every component and option in %s', (lang, t) => {
		expect(COMPONENTS.filter(comp => !t.software[comp.id]?.description).map(comp => comp.id)).toEqual([]);
		const missing = TUNING.flatMap(group => group.options
			.filter(option => !t.tuning[group.id]?.options[option.id]?.title)
			.map(option => `${group.id}.${option.id}`));
		expect(missing).toEqual([]);
	});

	it.each(languages)('names every button in %s', (lang, t) => {
		const buttons = TUNING.flatMap(group => group.options)
			.flatMap(option => 'values' in option && isButtons(option.values) ? option.values.map(value => buttonName(String(value))) : []);
		expect(buttons.length).toBeGreaterThan(0);
		expect(buttons.filter(button => !t.buttons[button])).toEqual([]);
	});
});

describe('selection', () => {
	it('keeps required components and what ships with them', () => {
		expect(resolveSelection([])).toEqual(expect.arrayContaining(['atmosphere', 'hekate', 'daybreak']));
	});

	it('brings dependencies of an added component', () => {
		expect(resolveSelection(['fps_locker'])).toEqual(expect.arrayContaining(['saltynx', 'ovlmenu']));
	});

	it('leaves a removed dependency removed', () => {
		expect(resolveSelection(['fps_locker', 'ovlmenu'], false)).not.toContain('saltynx');
	});

	it.each(PRESETS.map(preset => [preset.id, preset] as const))('turns the %s preset into a consistent selection', (id, preset) => {
		const selection = presetSelection(preset);
		const broken = issueCodes({ ...defaultState(), selectedComponentIDs: selection }).filter(code => /:(requires|conflict):/.test(code));
		expect(broken).toEqual([]);
		expect(matchingPreset(selection)?.id).toBe(id);
	});
});
