// Consoles BrewDeck builds for, each with a catalog, steps and templates of its own
export type PlatformId = 'switch' | 'psp';
export const PLATFORM_IDS: PlatformId[] = ['switch', 'psp'];

export type SwitchRevision = 'erista' | 'mariko' | 'oled' | 'lite';
export type PspRevision = 'psp1000' | 'psp2000' | 'psp3000' | 'pspgo' | 'pspstreet';
export type HardwareRevision = SwitchRevision | PspRevision;

export interface HardwareInfo {
	id: HardwareRevision;
	platform: PlatformId;
	name: string;
	codename: string;
	is_modchip_required: boolean;
	image: string;
	dimensions: [number, number]; // width and height in millimeters, Joy-Con attached
	screen: number; // diagonal of the 16:9 display in inches
}

export type FirmwareStatus = 'stable' | 'legacy' | 'dead';

// Version of the system software of a console
export interface FirmwareVersion {
	version: string;
	date: Date;
	status: FirmwareStatus;
	atmosphere?: string; // Atmosphere release supporting the HOS version
	supported?: Date;
}

export type ComponentCategory = 'base' | 'payloads' | 'sysmodules' | 'overlays' | 'plugins' | 'tools' | 'installers' | 'saves' | 'mods' | 'amiibo' | 'themes' | 'media' | 'streaming' | 'emulators' | 'developer';

export type ComponentSource = 'appstore' | 'github' | 'url' | 'manual' | 'bundled';

// Asset of the latest GitHub release: an archive merged into the SD card or a single file
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
	source: ComponentSource; // the fresher of the available sources, picked by npm run sync
	prefer?: 'appstore' | 'github';
	sources: ComponentSources;
	requires?: Requirement[]; // all have to be met, a nested list is met by any of its components
	conflicts_with?: string[];
	replaces?: string[];
	hardware?: HardwareRevision[]; // revisions the component is useful on
	tracks?: ('hos' | 'atmosphere')[]; // has to be updated for every new HOS or Atmosphere release
	deprecated?: boolean;
	risky?: boolean; // its note tells what may go wrong, the build warns about it too
	payload?: string; // SD path of the payload, it gets an entry in the Launch menu of hekate
	plugin?: CfwPlugin; // a CFW plugin the build lists in the plugins file of its platform
	is_required: boolean;
}

// Plugin of a custom firmware and where it loads by default
export interface CfwPlugin {
	path: string; // relative to the folder of the plugins file
	scope: string[]; // runlevels, such as `vsh` or `game`, empty to leave the plugin off
}

export interface Preset {
	id: string;
	components: string[] | 'all';
}

export type TuningValue = boolean | number | string | string[];

export type TuningStep = 'launch' | 'system' | 'security' | 'modules' | 'plugins' | 'overclock';

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

// Software of a platform: its components, presets of them and options of their configs
export interface Catalog {
	platform: PlatformId;
	components: ComponentInfo[];
	categories: ComponentCategory[]; // picked on the Software step in this order, the others on steps of their own
	presets: Preset[];
	tuning: TuningGroup[];
}

// What a build keeps on every platform: the console, its system version, the software and the options
export interface BuildState {
	hardware: HardwareRevision;
	firmware: string;
	selectedComponentIDs: string[];
	tuning: TuningConfig;
}

export type ClockModule = 'cpu' | 'gpu' | 'mem';
export type ClockMode = 'docked' | 'handheld' | 'handheld_charging' | 'handheld_charging_usb' | 'handheld_charging_official';
export type ClockKey = `${ClockMode}_${ClockModule}`;
export type Clocks = Partial<Record<ClockKey, number>>;

export interface OverclockData {
	frequencies: Record<ClockModule, number[]>;
	caps: Partial<Record<ClockKey, Record<SwitchRevision, number>>>; // sys-clk lowers requested clocks to these
	templates: Record<string, Clocks>;
	games: { id: string; name: string }[];
}

// sys-clk profile of a game, template turns into custom once any clock is edited by hand
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
	file: string; // public path of the image, in the orientation it is seen on screen, made of the target and the ID
	hue?: boolean; // white layout Nyx tints with the theme color
	author: string;
	license: string;
	url: string;
}

export type BootMode = 'emummc' | 'sysmmc' | 'stock';

// Section of hekate_ipl.ini, an entry of the Launch menu
export interface LaunchEntry {
	id: string; // boot mode, `emummc-<folder>` of another emuMMC or a payload component
	name: string; // name of the section, shown in the Launch menu
	caption: string; // caption of the group the section belongs to
	keys: Record<string, string | number>;
}

// Entry booting the console in one of the modes
export type BootEntry = LaunchEntry & { id: BootMode };

// Exosphere keys an entry sets for itself, overriding exosphere.ini and system_settings.ini
export type EntryOverride = 'cal0blank' | 'usb3force' | 'memmode';

// Launch menu of hekate: the boot modes, more emuMMCs, then payloads of the selected components
export interface LaunchConfig {
	modes: BootMode[];
	emummcs: string[]; // folders in emuMMC/ of more emuMMCs, each gets its own entry
	overrides: Record<string, Partial<Record<EntryOverride, 0 | 1>>>; // by entry, a missing key follows the configs
	autoboot: string; // an entry booted after the logo, `menu` to stay in the menu
}

// Gallery image ids or `upload` for an image picked from the disk
export interface AppearanceConfig {
	bootlogo?: string;
	background?: string;
	logos: Record<string, string>; // boot logos of entries, shown when hekate boots them by itself
	icons: Record<string, string>; // icons of entries in the Launch menu
}

// Images picked from the disk by `bootlogo`, `background`, `logo.<entry>` or `icon.<entry>`, kept only in this tab: links cannot carry them
export type Uploads = Record<string, { blob: Blob; url: string }>;

// Build of a Nintendo Switch: the Launch menu of hekate, sys-clk profiles and pictures on top of the common part
export interface SwitchState extends BuildState {
	hardware: SwitchRevision;
	launch: LaunchConfig;
	overclock: GameProfile[];
	appearance: AppearanceConfig;
}

// Build of a PSP: runlevels the plugins load in, by plugin, where they differ from the catalog
export interface PspState extends BuildState {
	hardware: PspRevision;
	plugins: Record<string, string[]>;
}

export type StepId = 'hardware' | 'firmware' | 'software' | 'launch' | 'system' | 'security' | 'modules' | 'plugins' | 'overclock' | 'appearance' | 'build';

export type IssueLevel = 'error' | 'warning' | 'info';

// Components a fix adds or removes
export interface Fix {
	add?: string[];
	remove?: string[];
}

export interface Issue {
	level: IssueLevel;
	code: string;
	step: StepId;
	params: Record<string, string>;
	fixes?: Fix[]; // ways to resolve the issue, a button each
}
