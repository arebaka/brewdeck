import { PspState, StepId } from '@/types';
import { Platform } from '..';
import { CATALOG, FIRMWARE, defaultBuild, isFirmwareSupported, selectedPlugins } from './data';
import { decode, encode } from './url';
import { validate } from './validation';
import { build } from './build';

export * from './data';

const STEPS: StepId[] = ['hardware', 'firmware', 'software', 'system', 'plugins', 'build'];

// ARK-5 with plugins and homebrew from GitHub releases
export const PSP: Platform<PspState> = {
	id: 'psp',
	catalog: CATALOG,
	firmware: FIRMWARE,
	isFirmwareSupported,
	defaults: defaultBuild,
	glyphs: { next: 'cross', back: 'circle', rebuild: 'triangle' },
	// Plugins only appear with a plugin selected
	steps: ({ selectedComponentIDs }) => STEPS.filter(step => step != 'plugins' || selectedPlugins(selectedComponentIDs).length > 0),
	values: ({ selectedComponentIDs }) => ({
		plugins: selectedPlugins(selectedComponentIDs).length
	}),
	encode,
	decode,
	validate,
	build
};
