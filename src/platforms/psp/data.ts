import { Catalog, ComponentInfo, FirmwareVersion, Preset, PspState, TuningGroup } from '@/types';
import { compareVersions, getTuningDefaults, presetSelection } from '@/data';

import { firmware, presets, software, tuning } from '@data/psp';

export const FIRMWARE: FirmwareVersion[] = firmware.map(v => ({
	version: v.version,
	date: new Date(v.date),
	status: v.status
})) as FirmwareVersion[];
export const COMPONENTS: ComponentInfo[] = software as ComponentInfo[];
export const CATALOG: Catalog = {
	platform: 'psp',
	components: COMPONENTS,
	categories: ['base', 'plugins', 'tools', 'emulators'],
	presets: presets as Preset[],
	tuning: tuning as TuningGroup[]
};

// ARK-5 runs on the firmware 6.60 and 6.61, an older PSP takes the official update first
export const isFirmwareSupported = (version: string) => compareVersions(version, '6.60') >= 0;

// Runlevels a plugin loads in, any of them together or always: the XMB, games and homebrew, PS1 games
export const RUNLEVELS = ['always', 'vsh', 'game', 'pops'];

// Where the plugin loads, as the build sets it or as the catalog suggests
export const pluginScope = (build: PspState, comp: ComponentInfo) => build.plugins[comp.id] ?? comp.plugin!.scope;

// Selected plugins in the order of the catalog, which is the order they load in
export const selectedPlugins = (selectedComponentIDs: string[]) => COMPONENTS
	.filter(comp => comp.plugin && selectedComponentIDs.includes(comp.id));

// A link without parameters builds the recommended preset for the most common PSP
export function defaultBuild(): PspState {
	return {
		hardware: 'psp3000',
		firmware: '6.61',
		selectedComponentIDs: presetSelection(CATALOG, CATALOG.presets.find(preset => preset.id == 'base')!),
		tuning: getTuningDefaults(CATALOG.tuning),
		plugins: {}
	};
}
