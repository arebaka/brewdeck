import { PlatformId, StepId } from '@/types';
import { Language, Translation } from './types';
import en from './en';
import ru from './ru';
import uk from './uk';

export * from './types';
export { en, ru, uk };

export const translations: {[lang in Language]: Translation} = {
	en,
	ru,
	uk
};

// Replaces {name} placeholders with the params
export function format(template: string, params: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, key) => key in params ? String(params[key]) : match);
}

// Name of a step as the platform calls it
export const stepName = (t: Translation, platform: PlatformId, step: StepId) => t.platforms[platform].steps?.[step] ?? t.steps[step];
