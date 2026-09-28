import { ComponentCategory, HardwareRevision, HOSVersionStatus } from '@/types';

import en from './en';
import ru from './ru';

export type Language = 'en' | 'ru';

type Hardware = {
	name: string;
	description: string;
	note: string;
};

type Software = {
	description: string;
	details: string;
	note?: string;
};

type TuningOption = {
	title: string;
	description: string;
	values?: {[value in string]: string}; // labels of select values, raw values are shown otherwise
};

type TuningGroup = {
	title: string;
	description: string;
	options: {[option in string]: TuningOption};
};

export interface Translation {
	title: string;
	subtitle: string;
	steps: {
		hardware: string;
		version: string;
		components: string;
		tuning: string;
		build: string;
	};
	wizard: {
		back: string;
		next: string;
		rebuild: string;
	};
	hardware: {[revision in HardwareRevision]: Hardware};
	software: {[component in string]: Software};
	tuning: {[group in string]: TuningGroup};
	step1: {
		title: string;
		description: string;
		isModchipRequired: string;
		isModchipNotRequired: string;
	};
	step2: {
		title: string;
		description: string;
		status: {[status in HOSVersionStatus]: string}
	};
	step3: {
		title: string;
		description: string;
		selectAll: string;
		deselectAll: string;
		categories: {[category in ComponentCategory]: string};
		select: string;
		deselect: string;
		requiredBadge: string;
		defaultBadge: string;
		authorLabel: string;
		sizeLabel: string;
		conflictTitle: string;
		recommendsTitle: string;
		conflictBadge: string;
	};
	step4: {
		title: string;
		description: string;
		reset: string;
		on: string;
		off: string;
		requires: string;
	};
	step5: {
		title: string;
		description: string;
		summary: {
			hardware: string;
			firmware: string;
			components: string;
			size: string;
			tuning: string;
		};
		installer: string;
		files: {[file in string]: string};
		download: string;
		downloadAll: string;
		usage: string;
		usageNote: string;
		manual: string;
		manualDescription: string;
		preview: string;
	};
	metrics: {
		size: string;
	};
	warnings: {
		missionControlLDNMITM: string;
		dbiReplacesExtra: string;
		sysclkSaltynx: string;
	};
}

export const translations: {[lang in Language]: Translation} = {
	en,
	ru
};
