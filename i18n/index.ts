import { PLATFORM_IDS, type PlatformId, type StepId } from '@/types';
import type { Language, Translation } from './types';

import AUTONYMS from './autonyms.yaml';

export * from './types';

export const LANGUAGES: Language[] = ['en', 'ru', 'uk'];

// Texts of a language lie in its folder: the page in index.yaml, the catalogs of a platform in the folder of the platform
const FILES = import.meta.glob<Record<string, any>>('./*/**/*.yaml', { eager: true, import: 'default' });

function translation(lang: Language): Translation {
	const catalogs = (file: string) => Object.fromEntries(PLATFORM_IDS.map(platform => [platform, FILES[`./${lang}/${platform}/${file}.yaml`]]));
	const texts = { ...FILES[`./${lang}/index.yaml`], software: catalogs('software'), tuning: catalogs('tuning') } as Translation;
	// Languages name themselves, so the names of the DBI translations are kept once for every language
	texts.tuning.switch.dbi_patcher.options.language.values = AUTONYMS;
	return texts;
}

export const I18N = Object.fromEntries(LANGUAGES.map(lang => [lang, translation(lang)])) as {[lang in Language]: Translation};

// Replaces {name} placeholders with the params
export const format = (template: string, params: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (match, key) => key in params ? String(params[key]) : match);

// Name of a step as the platform calls it
export const stepName = (t: Translation, platform: PlatformId, step: StepId): string => t.platforms[platform].steps?.[step] ?? t.steps[step];
