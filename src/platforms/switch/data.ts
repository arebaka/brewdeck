import { BootEntry, BootMode, Catalog, Clocks, ComponentInfo, EntryOverride, FirmwareVersion, GalleryImage, LaunchConfig, LaunchEntry, OverclockData, Preset, SwitchState, TuningGroup } from '@/types';
import { compareVersions, getTuningDefaults, presetSelection } from '@/data';

import { appearance, firmware, launch, overclock, presets, software, tuning } from '@data/switch';

export const HOS_VERSIONS: FirmwareVersion[] = firmware.map(v => ({
	version: v.version,
	date: new Date(v.date),
	status: v.status,
	atmosphere: v.atmosphere,
	supported: v.supported ? new Date(v.supported) : undefined
})) as FirmwareVersion[];
export const COMPONENTS: ComponentInfo[] = software as ComponentInfo[];
// Payloads are picked on the Launch step, the other categories on the Software one
export const CATALOG: Catalog = {
	platform: 'switch',
	components: COMPONENTS,
	categories: ['base', 'sysmodules', 'overlays', 'tools', 'installers', 'saves', 'mods', 'amiibo', 'themes', 'media', 'streaming', 'emulators', 'developer'],
	presets: presets as Preset[],
	tuning: tuning as TuningGroup[]
};
export const BOOT_ENTRIES: BootEntry[] = launch as unknown as BootEntry[];
export const OVERCLOCK: OverclockData = overclock as OverclockData;
// Pictures lie in the folder of their target under their ID: appearance/icon/hekate-switch.png
export const GALLERY: GalleryImage[] = (appearance as Omit<GalleryImage, 'file'>[])
	.map(image => ({ ...image, file: `appearance/${image.target}/${image.id}.png` }));

// Versions newer than the last one some Atmosphere release added support for cannot boot CFW yet
const NEWEST_SUPPORTED_HOS = HOS_VERSIONS
	.filter(v => v.atmosphere)
	.reduce((max, v) => compareVersions(v.version, max) > 0 ? v.version : max, '0.0.0');

export const isHOSSupported = (version: string) => compareVersions(version, NEWEST_SUPPORTED_HOS) <= 0;

// A link without parameters builds the recommended preset
export function defaultBuild(): SwitchState {
	return {
		hardware: 'erista',
		firmware: '21.0.0',
		selectedComponentIDs: presetSelection(CATALOG, CATALOG.presets.find(preset => preset.id == 'base')!),
		tuning: getTuningDefaults(CATALOG.tuning),
		launch: { modes: ['emummc', 'sysmmc', 'stock'], emummcs: [], overrides: {}, autoboot: 'emummc' },
		overclock: [],
		appearance: { logos: {}, icons: {} }
	};
}

// Keys an entry sets over exosphere.ini and system_settings.ini, 0 or 1. A missing key keeps the configs
export const ENTRY_OVERRIDES: EntryOverride[] = ['cal0blank', 'usb3force', 'memmode'];

// Folders of emuMMCs as hekate names them (SD00, RAW1) or a user renames them. FAT ignores the case,
// so folders are kept in upper case and `sd01` never turns into a second entry of `SD01`
export const isEmuMMCFolder = (folder: string) => /^[A-Z0-9_-]{1,32}$/.test(folder);

// Entries of the Launch menu in their order: the emuMMC ones, sysMMC and stock, then payloads of the selected components.
// Entries booting the system carry the Exosphere keys set for them
export function launchEntries(launch: LaunchConfig, selectedComponentIDs: string[]): LaunchEntry[] {
	const mode = (id: BootMode) => BOOT_ENTRIES.filter(entry => entry.id == id && launch.modes.includes(id));
	const emummc = BOOT_ENTRIES.find(entry => entry.id == 'emummc')!;

	return [
		...[
			...mode('emummc'),
			...launch.emummcs.map(folder => ({
				id: `emummc-${folder}`,
				name: `CFW (emuMMC ${folder})`,
				caption: emummc.caption,
				keys: { ...emummc.keys, emupath: `emuMMC/${folder}` }
			})),
			...mode('sysmmc'),
			...mode('stock')
		].map(entry => ({ ...entry, keys: { ...entry.keys, ...launch.overrides[entry.id] } })),
		...COMPONENTS
			.filter(comp => comp.payload && selectedComponentIDs.includes(comp.id))
			.map(comp => ({ id: comp.id, name: comp.name, caption: 'Payloads', keys: { payload: comp.payload! } }))
	];
}

// Name of a known game, the title ID otherwise
export function gameName(id: string): string {
	return OVERCLOCK.games.find(game => game.id == id)?.name ?? id;
}

// A copy of the clocks of an overclock template, stock has none
export function templateClocks(template: string): Clocks {
	return { ...(OVERCLOCK.templates[template] ?? {}) };
}
