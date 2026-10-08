import { Catalog, TuningConfig, TuningGroup, TuningOption, TuningValue } from './types';
import { isCountAllowed, resolveSelection } from './data';

// Parameters of a link in their order
export type Params = [string, string][];

// Commas, colons and dots stay readable, everything else is percent-encoded
const encode = (value: string) => encodeURIComponent(value).replace(/%2C/g, ',').replace(/%3A/g, ':');

export const query = (params: Params) => params.map(([key, value]) => `${key}=${encode(value)}`).join('&');

// Values of options as links spell them
function serialize(value: TuningValue): string {
	if (typeof value == 'boolean') return value ? '1' : '0';
	if (Array.isArray(value)) return value.join(',');
	return String(value);
}

// A value of the option read from a link, undefined unless it is valid
function parse(option: TuningOption, raw: string): TuningValue | undefined {
	const number = Number(raw);
	switch (option.type) {
		case 'toggle':
			return raw == '1' ? true : raw == '0' ? false : undefined;
		case 'select':
			return option.values.find(value => String(value) == raw);
		case 'multiselect': {
			const items = raw ? raw.split(',') : [];
			const values = option.values.filter(value => items.includes(value));
			return items.every(item => option.values.includes(item)) && isCountAllowed(option, values.length) ? values : undefined;
		}
		case 'range':
		case 'number':
			return raw != '' && Number.isFinite(number) && number >= option.min && number <= option.max ? number : undefined;
		case 'hue':
			return Number.isInteger(number) && number >= 0 && number <= 359 ? number : undefined;
		case 'color':
			return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : undefined;
		case 'rgba4444':
			return /^#[0-9a-f]{4}$/i.test(raw) ? raw.toUpperCase() : undefined;
		case 'text':
			// A text is a single line: a line break would get out of its key in the config and out of the config in the installers
			return raw.length <= option.maxLength && !/[\p{Cc}\p{Zl}\p{Zp}]/u.test(raw) ? raw : undefined;
	}
}

// The whole selection in the order of the catalog, so links keep their builds when recommendations change
export const encodeSelection = (catalog: Catalog, selectedComponentIDs: string[]) => catalog.components
	.filter(comp => selectedComponentIDs.includes(comp.id))
	.map(comp => comp.id)
	.join(',');

// The selection as it is, dependencies removed by hand stay removed. An empty list leaves the required components,
// a list of unknown ones means nothing
export function decodeSelection(catalog: Catalog, raw: string | null): string[] | undefined {
	const sw = raw?.split(',').filter(Boolean);
	const components = sw?.filter(id => catalog.components.some(comp => comp.id == id)) ?? [];
	return sw && (!sw.length || components.length) ? resolveSelection(catalog, components, false) : undefined;
}

// Options that differ from their defaults, secrets never leave the page
export function encodeTuning(groups: TuningGroup[], tuning: TuningConfig): Params {
	return groups.flatMap(group => group.options
		.filter(option => !option.secret && JSON.stringify(tuning[group.id][option.id]) != JSON.stringify(option.default))
		.map(option => [`${group.id}.${option.id}`, serialize(tuning[group.id][option.id])] as [string, string]));
}

// Options of a link into the tuning, an invalid value keeps the one there is
export function decodeTuning(groups: TuningGroup[], params: URLSearchParams, tuning: TuningConfig): void {
	for (const group of groups) {
		for (const option of group.options.filter(option => !option.secret)) {
			const raw = params.get(`${group.id}.${option.id}`);
			const value = raw == null ? undefined : parse(option, raw);
			if (value !== undefined) tuning[group.id][option.id] = value;
		}
	}
}
