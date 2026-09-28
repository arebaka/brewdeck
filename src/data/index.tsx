import { ComponentInfo, HardwareInfo, HOSVersion, TuningConfig, TuningGroup, TuningOption } from '@/types';

import hardware from './hardware.json';
import firmware from './firmware.json';
import software from './software.json';
import tuning from './tuning.json';

export const HARDWARE: HardwareInfo[] = hardware as HardwareInfo[];
export const HOS_VERSIONS: HOSVersion[] = firmware.map(v => ({
	version: v.version,
	date: new Date(v.date),
	status: v.status
})) as HOSVersion[];
export const COMPONENTS: ComponentInfo[] = software as ComponentInfo[];
export const TUNING: TuningGroup[] = tuning as TuningGroup[];

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

export function countTuningChanges(tuning: TuningConfig): number {
	const defaults = getTuningDefaults();
	return TUNING.reduce((count, group) => count + group.options.filter(option =>
		JSON.stringify(tuning[group.id][option.id]) != JSON.stringify(defaults[group.id][option.id])
	).length, 0);
}
