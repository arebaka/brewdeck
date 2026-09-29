import { ComponentCategory, ComponentInfo, GalleryImage, HardwareInfo, HOSVersion, OverclockData, Preset, Requirement, TuningConfig, TuningGroup, TuningOption } from '@/types';

import hardware from '@data/hardware.json';
import firmware from '@data/firmware.json';
import software from '@data/software.json';
import tuning from '@data/tuning.json';
import presets from '@data/presets.json';
import overclock from '@data/overclock.json';
import appearance from '@data/appearance.json';

export const HARDWARE: HardwareInfo[] = hardware as HardwareInfo[];
export const HOS_VERSIONS: HOSVersion[] = firmware.map(v => ({
	version: v.version,
	date: new Date(v.date),
	status: v.status,
	atmosphere: v.atmosphere,
	supported: v.supported ? new Date(v.supported) : undefined
})) as HOSVersion[];
export const COMPONENTS: ComponentInfo[] = software as ComponentInfo[];
export const CATEGORIES: ComponentCategory[] = ['base', 'payloads', 'sysmodules', 'overlays', 'homebrew', 'themes', 'streaming', 'emulators', 'developer'];
export const TUNING: TuningGroup[] = tuning as TuningGroup[];
export const PRESETS: Preset[] = presets as Preset[];
export const OVERCLOCK: OverclockData = overclock as OverclockData;
export const GALLERY: GalleryImage[] = appearance as GalleryImage[];

export const DEFAULT_COMPONENTS = COMPONENTS.filter(comp => comp.is_selected_by_default || comp.is_required).map(comp => comp.id);

export function compareVersions(a: string, b: string): number {
	const [x, y] = [a, b].map(version => version.split('.').map(Number));
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		if ((x[i] ?? 0) != (y[i] ?? 0)) return Math.sign((x[i] ?? 0) - (y[i] ?? 0));
	}
	return 0;
}

// Versions newer than the last one some Atmosphere release added support for cannot boot CFW yet
const NEWEST_SUPPORTED_HOS = HOS_VERSIONS
	.filter(v => v.atmosphere)
	.reduce((max, v) => compareVersions(v.version, max) > 0 ? v.version : max, '0.0.0');

export const isHOSSupported = (version: string) => compareVersions(version, NEWEST_SUPPORTED_HOS) <= 0;

export function getTuningDefaults(): TuningConfig {
	return Object.fromEntries(TUNING.map(group => [
		group.id,
		Object.fromEntries(group.options.map(option => [option.id, option.default]))
	]));
}

// Options with `when` conditions only apply while their sibling options hold one of the listed values
export function isTuningOptionActive(group: TuningGroup, option: TuningOption, tuning: TuningConfig): boolean {
	return Object.entries(option.when ?? {}).every(([id, values]) => values.includes(tuning[group.id][id]));
}

export function isTuningOptionChanged(group: TuningGroup, option: TuningOption, tuning: TuningConfig): boolean {
	return JSON.stringify(tuning[group.id][option.id]) != JSON.stringify(option.default);
}

export function countTuningChanges(tuning: TuningConfig): number {
	return TUNING.reduce((count, group) => count + group.options.filter(option => isTuningOptionChanged(group, option, tuning)).length, 0);
}

export function isRequirementMet(requirement: Requirement, selectedComponentIDs: string[]): boolean {
	return typeof requirement == 'string'
		? selectedComponentIDs.includes(requirement)
		: requirement.some(id => selectedComponentIDs.includes(id));
}

// Adds required components and missing dependencies (the first of alternatives), bundled components follow their parent.
// Removing a component keeps dependencies as they are, so a dependency can be dropped and reported instead
export function resolveSelection(ids: string[], dependencies: boolean = true): string[] {
	const selected = new Set([...COMPONENTS.filter(comp => comp.is_required).map(comp => comp.id), ...ids]);
	for (let changed = dependencies; changed;) {
		changed = false;
		for (const comp of COMPONENTS.filter(comp => selected.has(comp.id))) {
			for (const requirement of comp.requires ?? []) {
				if (!isRequirementMet(requirement, [...selected])) {
					selected.add(typeof requirement == 'string' ? requirement : requirement[0]);
					changed = true;
				}
			}
		}
	}
	for (const comp of COMPONENTS.filter(comp => comp.sources.bundled)) {
		if (selected.has(comp.sources.bundled!)) selected.add(comp.id);
		else selected.delete(comp.id);
	}
	return COMPONENTS.filter(comp => selected.has(comp.id)).map(comp => comp.id);
}

// Everything that does not conflict with an earlier component of the catalog
function allComponents(): string[] {
	const ids: string[] = [];
	for (const comp of COMPONENTS) {
		if (!(comp.conflicts_with ?? []).some(id => ids.includes(id))) ids.push(comp.id);
	}
	return ids;
}

export function presetSelection(preset: Preset): string[] {
	return resolveSelection(
		preset.components == 'default' ? DEFAULT_COMPONENTS
			: preset.components == 'all' ? allComponents()
			: preset.components
	);
}

export function matchingPreset(selectedComponentIDs: string[]): Preset | undefined {
	const current = [...selectedComponentIDs].sort().join();
	return PRESETS.find(preset => presetSelection(preset).sort().join() == current);
}
