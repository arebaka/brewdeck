export type HardwareRevision = 'erista' | 'mariko' | 'oled' | 'lite';

export interface HardwareInfo {
	id: HardwareRevision;
	name: string;
	codename: string;
	is_modchip_required: boolean;
	image: string; // photo cropped to the console, so its width is the width of the console
	dimensions: [number, number]; // width and height in millimeters, Joy-Con attached
}

export type HOSVersionStatus = 'stable' | 'legacy' | 'dead';

export interface HOSVersion {
	version: string;
	date: Date;
	status: HOSVersionStatus;
	atmosphere?: string;
	supported?: Date;
}

export type ComponentCategory = 'base' | 'payloads' | 'sysmodules' | 'overlays' | 'homebrew' | 'themes' | 'streaming' | 'emulators' | 'developer';

export type ComponentSource = 'appstore' | 'github' | 'url' | 'manual' | 'bundled';

// Asset of the latest GitHub release: an archive merged into the SD card or a single file saved to `path`
export interface GithubAsset {
	repo: string;
	asset: string; // regular expression matched against asset names
	root?: string; // archive directory that maps to the SD root
	into?: string; // SD directory the archive is extracted to
	path?: string; // destination on the SD card, turns the asset into a single file
	modchip?: boolean; // only for revisions booted by a modchip
}

export interface Download {
	url: string;
	root?: string;
	into?: string;
	path?: string;
}

export interface ComponentSources {
	appstore?: string[]; // Homebrew App Store packages
	github?: GithubAsset[];
	url?: Download[];
	manual?: string; // page to download the component by hand
	bundled?: string; // component that already ships this one
}

// Nested arrays list alternatives, any of them satisfies the requirement
export type Requirement = string | string[];

export interface ComponentInfo {
	id: string;
	name: string;
	author: string;
	category: ComponentCategory;
	version: string;
	size: number; // bytes to download
	released?: string;
	logo?: string;
	source: ComponentSource; // the fresher of the available sources, picked by `npm run sync`
	prefer?: 'appstore' | 'github';
	sources: ComponentSources;
	requires?: Requirement[];
	conflicts_with?: string[];
	replaces?: string[];
	hardware?: HardwareRevision[]; // revisions the component is useful on
	tracks?: ('hos' | 'atmosphere')[]; // has to be updated for every new HOS or Atmosphere release
	deprecated?: boolean;
	is_selected_by_default: boolean;
	is_required: boolean;
}

export interface Preset {
	id: string;
	components: string[] | 'default' | 'all';
}

export type TuningValue = boolean | number | string | string[];

export type TuningStep = 'system' | 'modules' | 'overclock';

interface TuningOptionBase {
	id: string;
	secret?: boolean; // never written into links
	when?: Record<string, TuningValue[]>; // active only while sibling options hold one of the listed values
}

export type TuningOption = TuningOptionBase & (
	| { type: 'toggle'; default: boolean }
	| { type: 'select'; values: (string | number)[]; default: string | number }
	| { type: 'multiselect'; values: string[]; default: string[] }
	| { type: 'range'; min: number; max: number; step: number; default: number }
	| { type: 'number'; min: number; max: number; default: number }
	| { type: 'text'; maxLength: number; default: string }
	| { type: 'hue'; default: number }
	| { type: 'color'; default: string }
);

export interface TuningGroup {
	id: string;
	step: TuningStep;
	file: string; // SD path the group is written to, shown to the user
	requires?: Requirement; // component that has to be selected for the group to take effect
	options: TuningOption[];
}

export type TuningConfig = Record<string, Record<string, TuningValue>>;

export type ClockModule = 'cpu' | 'gpu' | 'mem';
export type ClockMode = 'docked' | 'handheld' | 'handheld_charging' | 'handheld_charging_usb' | 'handheld_charging_official';
export type ClockKey = `${ClockMode}_${ClockModule}`;
export type Clocks = Partial<Record<ClockKey, number>>;

export interface OverclockData {
	frequencies: Record<ClockModule, number[]>;
	caps: Partial<Record<ClockKey, Record<HardwareRevision, number>>>; // sys-clk lowers requested clocks to these
	templates: Record<string, Clocks>;
	games: { id: string; name: string }[];
}

// sys-clk profile of a game, `template` turns into `custom` once any clock is edited by hand
export interface GameProfile {
	id: string; // title ID
	name: string;
	template: string;
	clocks: Clocks;
}

export type ImageTarget = 'bootlogo' | 'background' | 'icon';

export interface GalleryImage {
	id: string;
	target: ImageTarget;
	file: string; // public path of the image, in the orientation it is seen on screen
	hue?: boolean; // white layout Nyx tints with the theme color
	author: string;
	license: string;
	url: string;
}

export type IconEntry = 'emummc' | 'sysmmc' | 'stock';

// Gallery image ids or `upload` for an image picked from the disk
export interface AppearanceConfig {
	bootlogo?: string;
	background?: string;
	icons: Partial<Record<IconEntry, string>>;
}

// Images picked from the disk by `bootlogo`, `background` or `icon.<entry>`, kept only in this tab: links cannot carry them
export type Uploads = Record<string, { blob: Blob; url: string }>;

export type StepId = 'hardware' | 'firmware' | 'software' | 'system' | 'modules' | 'overclock' | 'appearance' | 'build';

export type IssueLevel = 'error' | 'warning' | 'info';

export interface Issue {
	level: IssueLevel;
	code: string;
	step: StepId;
	params: Record<string, string>;
	fix?: { add?: string[]; remove?: string[] };
}
