import { StepId, SwitchState } from '@/types';
import { tuningGroups } from '@/data';
import { Platform } from '..';
import { CATALOG, HOS_VERSIONS, defaultBuild, isHOSSupported, launchEntries } from './data';
import { decode, encode } from './url';
import { validate } from './validation';
import { build } from './build';

export * from './data';

const STEPS: StepId[] = ['hardware', 'firmware', 'software', 'launch', 'system', 'security', 'modules', 'overclock', 'appearance', 'build'];

// Hekate and Atmosphere with homebrew from the Homebrew App Store and GitHub
export const SWITCH: Platform<SwitchState> = {
	id: 'switch',
	catalog: CATALOG,
	firmware: HOS_VERSIONS,
	isFirmwareSupported: isHOSSupported,
	defaults: defaultBuild,
	glyphs: { next: 'A', back: 'B', rebuild: 'X' },
	// Plugins and overclock only appear when a selected component has something to set
	steps: ({ selectedComponentIDs }) => STEPS.filter(step => {
		if (step == 'modules') return tuningGroups(CATALOG.tuning, 'modules', selectedComponentIDs).some(group => group.requires);
		if (step == 'overclock') return selectedComponentIDs.includes('sys_clk');
		return true;
	}),
	values: ({ selectedComponentIDs, launch, overclock, appearance }) => {
		const images = [appearance.bootlogo, appearance.background, ...Object.values(appearance.logos), ...Object.values(appearance.icons)].filter(Boolean).length;
		return {
			launch: launchEntries(launch, selectedComponentIDs).length,
			overclock: overclock.length || '',
			appearance: images || ''
		};
	},
	encode,
	decode,
	validate,
	build
};
