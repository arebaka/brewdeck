import { Catalog, HardwareInfo, Preset, Requirement, TuningConfig, TuningGroup, TuningOption, TuningStep } from '@/types';

import { hardware } from '@data';

// Consoles of every platform, the revision of a build tells its platform
export const HARDWARE: HardwareInfo[] = hardware as HardwareInfo[];

// Compares dotted versions part by part: -1, 0 or 1
export function compareVersions(a: string, b: string): number {
	const [x, y] = [a, b].map(version => version.split('.').map(Number));
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		if ((x[i] ?? 0) != (y[i] ?? 0)) return Math.sign((x[i] ?? 0) - (y[i] ?? 0));
	}
	return 0;
}

// Default values of every option, by group
export function getTuningDefaults(groups: TuningGroup[]): TuningConfig {
	return Object.fromEntries(groups.map(group => [
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

// A component is required by its id, alternatives by any of theirs
export function isRequirementMet(requirement: Requirement, selectedComponentIDs: string[]): boolean {
	return typeof requirement == 'string'
		? selectedComponentIDs.includes(requirement)
		: requirement.some(id => selectedComponentIDs.includes(id));
}

// Groups of the step whose components are selected
export function tuningGroups(groups: TuningGroup[], step: TuningStep, selectedComponentIDs: string[]): TuningGroup[] {
	return groups.filter(group => group.step == step && (!group.requires || isRequirementMet(group.requires, selectedComponentIDs)));
}

// Adds required components and missing dependencies (the first of alternatives), bundled components follow their parent.
// Removing a component keeps dependencies as they are, so a dependency can be dropped and reported instead
export function resolveSelection(catalog: Catalog, ids: string[], dependencies: boolean = true): string[] {
	const { components } = catalog;
	const selected = new Set([...components.filter(comp => comp.is_required).map(comp => comp.id), ...ids]);
	for (let changed = dependencies; changed;) {
		changed = false;
		for (const comp of components.filter(comp => selected.has(comp.id))) {
			for (const requirement of comp.requires ?? []) {
				if (!isRequirementMet(requirement, [...selected])) {
					selected.add(typeof requirement == 'string' ? requirement : requirement[0]);
					changed = true;
				}
			}
		}
	}
	for (const comp of components.filter(comp => comp.sources.bundled)) {
		if (selected.has(comp.sources.bundled!)) selected.add(comp.id);
		else selected.delete(comp.id);
	}
	return components.filter(comp => selected.has(comp.id)).map(comp => comp.id);
}

// Every component of the catalog, both sides of conflicts too: the user picks one
function allComponents(catalog: Catalog): string[] {
	return catalog.components
		.map(comp => comp.id);
}

// Components of a preset with their dependencies
export function presetSelection(catalog: Catalog, preset: Preset): string[] {
	return resolveSelection(
		catalog,
		preset.components == 'all' ? allComponents(catalog)
			: preset.components
	);
}

// The preset the selection equals to, if any
export function matchingPreset(catalog: Catalog, selectedComponentIDs: string[]): Preset | undefined {
	const current = [...selectedComponentIDs].sort().join();
	return catalog.presets.find(preset => presetSelection(catalog, preset).sort().join() == current);
}
