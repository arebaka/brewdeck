import { BootMode, ClockMode, EntryOverride, ClockModule, ComponentCategory, ComponentSource, HardwareRevision, HOSVersionStatus, ImageTarget, StepId } from '@/types';

export type Language = 'en' | 'ru' | 'uk';

type Hardware = {
	name: string;
	description: string;
	note: string;
};

export type Software = {
	description: string;
	details: string;
	note?: string;
};

type TuningOption = {
	title: string;
	description: string;
	values?: {[value in string]: string}; // labels of select values, raw values are shown otherwise
};

export type TuningGroup = {
	title: string;
	description: string;
	options: {[option in string]: TuningOption};
};

type Page = {
	title: string;
	description: string;
};

export interface Translation {
	language: string; // short name in the language switch
	title: string;
	subtitle: string;
	steps: {[step in StepId]: string};
	wizard: {
		back: string;
		next: string;
		rebuild: string;
		step: string;
	};
	hardware: {[revision in HardwareRevision]: Hardware};
	software: {[component in string]: Software};
	tuning: {[group in string]: TuningGroup};
	buttons: {[button in string]: string}; // names of the controller buttons for tooltips
	pages: {
		hardware: Page & {
			isModchipRequired: string;
			isModchipNotRequired: string;
			size: string;
		};
		firmware: Page & {
			status: {[status in HOSVersionStatus]: string};
			unsupported: string;
		};
		software: Page & {
			presets: {[preset in string]: string};
			custom: string;
			categories: {[category in ComponentCategory]: string};
			sources: {[source in ComponentSource]: string};
			requiredBadge: string;
			bundledBadge: string;
			deprecatedBadge: string;
			riskyBadge: string;
			select: string;
			deselect: string;
			defaultBadge: string;
			authorLabel: string;
			sizeLabel: string;
			conflictTitle: string;
			recommendsTitle: string;
			conflictBadge: string;
		};
		launch: Page & {
			modes: string;
			entries: {[mode in BootMode]: string}; // what every boot mode is for
			emummcEntry: string;
			emummcs: string;
			addEmuMMC: string;
			remove: string;
			overrides: {[key in EntryOverride]: string};
			asConfigured: string;
			overridesDescription: string;
			payloads: string;
			payloadsDescription: string;
			autoboot: string;
			autobootDescription: string;
			menu: string;
		};
		system: Page & {
			reset: string;
			on: string;
			off: string;
		};
		security: Page;
		modules: Page & {
			empty: string;
		};
		overclock: Page & {
			templates: {[template in string]: string};
			applyAll: string;
			games: string;
			add: string;
			titleId: string;
			addCustom: string;
			remove: string;
			empty: string;
			modes: {[mode in ClockMode]: string};
			modules: {[module in ClockModule]: string};
			stock: string;
			mhz: string;
		};
		appearance: Page & {
			targets: {[target in ImageTarget]: Page};
			common: string;
			none: string;
			upload: string;
			uploaded: string;
			invalid: string;
			more: string;
			credit: string;
		};
		build: Page & {
			summary: {
				hardware: string;
				firmware: string;
				components: string;
				size: string;
				tuning: string;
			};
			issues: string;
			installer: string;
			files: {[file in string]: string};
			download: string;
			failed: string;
			manual: string;
			manualDescription: string;
			readme: string;
			preview: string;
			imageData: string;
		};
	};
	issues: {
		requires: string;
		conflict: string;
		replaces: string;
		hardware: string;
		deprecated: string;
		risky: string;
		manual: string;
		hosUnsupported: string;
		hosTracks: string;
		noEntries: string;
		atmosphereTracks: string;
		ftpCredentials: string;
		gpuCap: string;
		add: string;
		remove: string;
		or: string;
		go: string;
	};
	metrics: {
		size: string;
	};
}
