import { ClockMode, ClockModule, ComponentCategory, ComponentSource, HardwareRevision, HOSVersionStatus, IconEntry, ImageTarget, StepId } from '@/types';

import en from './en';
import ru from './ru';

export type Language = 'en' | 'ru';

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
			select: string;
			deselect: string;
			defaultBadge: string;
			authorLabel: string;
			sizeLabel: string;
			conflictTitle: string;
			recommendsTitle: string;
			conflictBadge: string;
		};
		system: Page & {
			reset: string;
			on: string;
			off: string;
		};
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
			icons: {[entry in IconEntry]: string};
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
		manual: string;
		hosUnsupported: string;
		hosTracks: string;
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

export const translations: {[lang in Language]: Translation} = {
	en,
	ru
};

// Replaces {name} placeholders with the params
export function format(template: string, params: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, key) => key in params ? String(params[key]) : match);
}
