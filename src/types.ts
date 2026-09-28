export type HardwareRevision = 'erista' | 'mariko' | 'oled' | 'lite';

export interface HardwareInfo {
	id: HardwareRevision;
	name: string;
	codename: string;
	is_modchip_required: boolean;
	image: string;
}

export type HOSVersionStatus = 'stable' | 'legacy' | 'dead';

export interface HOSVersion {
	version: string;
	date: Date;
	status: HOSVersionStatus;
}

export type ComponentCategory = 'base' | 'payloads' | 'sysmodules' | 'homebrew' | 'overlays';

// Release asset of the latest GitHub release: an archive merged into the SD root or a single file saved to `path`
export interface ComponentInstall {
	repo: string;
	asset: string; // regular expression matched against asset names
	root?: string; // archive directory that maps to the SD root
	path?: string; // destination on the SD card, turns the asset into a single file
	modchip?: boolean; // only for revisions booted by a modchip
}

export interface ComponentInfo {
	id: string;
	category: ComponentCategory;
	name: string;
	version: string;
	author: string;
	size_kb: number;
	is_selected_by_default: boolean;
	is_required: boolean;
	logo?: string;
	install?: ComponentInstall[]; // missing when the component has to be downloaded manually
	conflicts_with?: string[];
	replaces?: string[];
}

export type TuningValue = boolean | number | string | string[];

interface TuningOptionBase {
	id: string;
	when?: Record<string, TuningValue[]>; // active only while sibling options hold one of the listed values
}

export type TuningOption = TuningOptionBase & (
	| { type: 'toggle'; default: boolean }
	| { type: 'select'; values: (string | number)[]; default: string | number }
	| { type: 'multiselect'; values: string[]; default: string[] }
	| { type: 'range'; min: number; max: number; step: number; default: number }
	| { type: 'hue'; default: number }
	| { type: 'color'; default: string }
);

export interface TuningGroup {
	id: string;
	file: string; // SD path the group is written to, shown to the user
	requires?: string; // component that has to be selected for the group to take effect
	options: TuningOption[];
}

export type TuningConfig = Record<string, Record<string, TuningValue>>;
