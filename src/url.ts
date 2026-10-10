import { Catalog, TuningConfig, TuningGroup, TuningOption, TuningValue } from './types';
import { isCountAllowed, isTuningOptionChanged, listRow, listRows, resolveSelection } from './data';

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

// Params of an option: one with its value, for a list one per row, an empty one when it has no rows
function optionParams(key: string, option: TuningOption, value: TuningValue): Params {
	if (option.type != 'list') return [[key, serialize(value)]];
	const rows = listRows(value as string[][]);
	return rows.length ? rows.map(row => [key, row.join('=')]) : [[key, '']];
}

// A text is a single line: a line break would get out of its key in the config and out of the config in the installers
const isLine = (text: string, maxLength: number) => text.length <= maxLength && !/[\p{Cc}\p{Zl}\p{Zp}]/u.test(text);

// A value of the option read from the params of a link with its key, undefined unless it is valid
function parse(option: TuningOption, raws: string[]): TuningValue | undefined {
	const [raw] = raws;
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
			return isLine(raw, option.maxLength) ? raw : undefined;
		case 'list': {
			// Every row has to name itself and hold a line or one of the choices in every field
			const rows = raws.length == 1 && raw == '' ? [] : raws.map(item => listRow(item, option.fields.length));
			const isValid = rows.length <= (option.max ?? Infinity) && rows.every(row => row[0].trim() != '' && row.every((cell, index) => {
				const { values } = option.fields[index];
				return values ? values.includes(cell) : isLine(cell, option.maxLength);
			}));
			return isValid ? rows : undefined;
		}
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
		.filter(option => !option.secret && isTuningOptionChanged(group, option, tuning))
		.flatMap(option => optionParams(`${group.id}.${option.id}`, option, tuning[group.id][option.id])));
}

// Keys of the options links carry, in the order links spell them
export const tuningKeys = (groups: TuningGroup[]) => groups.flatMap(group => group.options
	.filter(option => !option.secret)
	.map(option => `${group.id}.${option.id}`));

// The param of a short link the key of an option goes into, the one of its group
export const tuningParam = (groups: TuningGroup[], key: string) => groups.find(group => key.startsWith(`${group.id}.`))?.link;

// Keys by the params of a short link they go into, the params in the order they get their first keys
export function byParam(keys: string[], paramOf: (key: string) => string | undefined): {[param: string]: string[]} {
	const params: {[param: string]: string[]} = {};
	for (const key of keys) {
		const param = paramOf(key);
		if (param !== undefined) (params[param] ??= []).push(key);
	}
	return params;
}

// Words the values of these options are made of: what there is to choose from, as often as the options offer it
export function tuningWords(groups: TuningGroup[]): string[] {
	return groups.flatMap(group => group.options.filter(option => !option.secret).flatMap(option => {
		switch (option.type) {
			case 'select':
			case 'multiselect':
				return option.values.map(String);
			case 'list':
				return option.fields.flatMap(field => field.values ?? []);
			default:
				return [];
		}
	}));
}

// Options of a link into the tuning, an invalid value keeps the one there is
export function decodeTuning(groups: TuningGroup[], params: URLSearchParams, tuning: TuningConfig): void {
	for (const group of groups) {
		for (const option of group.options.filter(option => !option.secret)) {
			const raws = params.getAll(`${group.id}.${option.id}`);
			const value = raws.length ? parse(option, raws) : undefined;
			if (value !== undefined) tuning[group.id][option.id] = value;
		}
	}
}
