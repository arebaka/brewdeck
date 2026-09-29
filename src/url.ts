import { AppearanceConfig, ClockKey, Clocks, GameProfile, HardwareRevision, IconEntry, ImageTarget, StepId, TuningConfig, TuningOption, TuningValue } from './types';
import { Language, translations } from './i18n';
import { COMPONENTS, DEFAULT_COMPONENTS, GALLERY, HARDWARE, HOS_VERSIONS, OVERCLOCK, TUNING, getTuningDefaults, resolveSelection } from './data';

export interface AppState {
	lang: Language;
	step: StepId;
	hardware: HardwareRevision;
	hosVersion: string;
	selectedComponentIDs: string[];
	tuning: TuningConfig;
	overclock: GameProfile[];
	appearance: AppearanceConfig;
}

export const STEP_IDS: StepId[] = ['hardware', 'firmware', 'software', 'system', 'modules', 'overclock', 'appearance', 'build'];
const ICON_ENTRIES: IconEntry[] = ['emummc', 'sysmmc', 'stock'];

export function defaultState(): AppState {
	return {
		lang: 'en',
		step: 'hardware',
		hardware: 'oled',
		hosVersion: '19.0.1',
		selectedComponentIDs: resolveSelection(DEFAULT_COMPONENTS),
		tuning: getTuningDefaults(),
		overclock: [],
		appearance: { icons: {} }
	};
}

// Commas, colons and dots stay readable, everything else is percent-encoded
const encode = (value: string) => encodeURIComponent(value).replace(/%2C/g, ',').replace(/%3A/g, ':');

function serialize(value: TuningValue): string {
	if (typeof value == 'boolean') return value ? '1' : '0';
	if (Array.isArray(value)) return value.join(',');
	return String(value);
}

function parse(option: TuningOption, raw: string): TuningValue | undefined {
	const number = Number(raw);
	switch (option.type) {
		case 'toggle':
			return raw == '1' ? true : raw == '0' ? false : undefined;
		case 'select':
			return option.values.find(value => String(value) == raw);
		case 'multiselect': {
			const items = raw ? raw.split(',') : [];
			return items.every(item => option.values.includes(item)) ? option.values.filter(value => items.includes(value)) : undefined;
		}
		case 'range':
		case 'number':
			return raw != '' && Number.isFinite(number) && number >= option.min && number <= option.max ? number : undefined;
		case 'hue':
			return Number.isInteger(number) && number >= 0 && number <= 359 ? number : undefined;
		case 'color':
			return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : undefined;
		case 'text':
			return raw.length <= option.maxLength ? raw : undefined;
	}
}

export function gameName(id: string): string {
	return OVERCLOCK.games.find(game => game.id == id)?.name ?? id;
}

export function templateClocks(template: string): Clocks {
	return { ...(OVERCLOCK.templates[template] ?? {}) };
}

export function encodeState(state: AppState): string {
	const defaults = defaultState();
	const params: [string, string][] = [];
	const set = (key: string, value: string) => params.push([key, value]);

	set('hw', state.hardware);
	set('hos', state.hosVersion);

	const added = state.selectedComponentIDs.filter(id => !defaults.selectedComponentIDs.includes(id));
	const removed = defaults.selectedComponentIDs.filter(id => !state.selectedComponentIDs.includes(id));
	if (added.length || removed.length) {
		set('sw', [...added, ...removed.map(id => `-${id}`)].join(','));
	}

	for (const group of TUNING) {
		for (const option of group.options) {
			const value = state.tuning[group.id][option.id];
			if (!option.secret && JSON.stringify(value) != JSON.stringify(option.default)) {
				set(`${group.id}.${option.id}`, serialize(value));
			}
		}
	}

	// title.template or title.custom.key-mhz.key-mhz
	if (state.overclock.length) {
		set('oc', state.overclock.map(profile => [
			profile.id,
			profile.template,
			...(profile.template == 'custom' ? Object.entries(profile.clocks).map(([key, mhz]) => `${key}-${mhz}`) : [])
		].join('.')).join(','));
	}

	// Uploaded images cannot travel in a link
	const { bootlogo, background, icons } = state.appearance;
	if (bootlogo && bootlogo != 'upload') set('img.bootlogo', bootlogo);
	if (background && background != 'upload') set('img.background', background);
	for (const entry of ICON_ENTRIES) {
		if (icons[entry] && icons[entry] != 'upload') set(`img.icon.${entry}`, icons[entry]!);
	}

	return params.map(([key, value]) => `${key}=${encode(value)}`).join('&');
}

export function decodeState(query: string): AppState {
	const params = new URLSearchParams(query);
	const state = defaultState();
	const get = (key: string) => params.get(key);

	const hardware = get('hw');
	if (HARDWARE.some(hw => hw.id == hardware)) state.hardware = hardware as HardwareRevision;

	const hos = get('hos');
	if (HOS_VERSIONS.some(v => v.version == hos)) state.hosVersion = hos!;

	const sw = get('sw');
	if (sw) {
		const selected = new Set(state.selectedComponentIDs);
		for (const token of sw.split(',')) {
			const id = token.replace(/^-/, '');
			if (!COMPONENTS.some(comp => comp.id == id)) continue;
			if (token.startsWith('-')) selected.delete(id);
			else selected.add(id);
		}
		state.selectedComponentIDs = resolveSelection([...selected]);
	}

	for (const group of TUNING) {
		for (const option of group.options.filter(option => !option.secret)) {
			const raw = get(`${group.id}.${option.id}`);
			const value = raw == null ? undefined : parse(option, raw);
			if (value !== undefined) state.tuning[group.id][option.id] = value;
		}
	}

	const oc = get('oc');
	if (oc) {
		for (const entry of oc.split(',')) {
			const [id, template, ...pairs] = entry.split('.');
			if (!/^[0-9A-F]{16}$/i.test(id ?? '') || state.overclock.some(profile => profile.id == id.toUpperCase())) continue;
			if (template != 'custom' && template != 'stock' && !(template in OVERCLOCK.templates)) continue;
			const clocks: Clocks = template == 'custom' ? {} : templateClocks(template);
			for (const pair of pairs) {
				const [key, mhz] = pair.split('-');
				if (/^(docked|handheld(_charging(_usb|_official)?)?)_(cpu|gpu|mem)$/.test(key) && Number(mhz) > 0) {
					clocks[key as ClockKey] = Number(mhz);
				}
			}
			state.overclock.push({ id: id.toUpperCase(), name: gameName(id.toUpperCase()), template, clocks });
		}
	}

	const image = (target: ImageTarget, id: string | null) =>
		id && GALLERY.some(item => item.target == target && item.id == id) ? id : undefined;
	state.appearance = {
		bootlogo: image('bootlogo', get('img.bootlogo')),
		background: image('background', get('img.background')),
		icons: Object.fromEntries(ICON_ENTRIES
			.map(entry => [entry, image('icon', get(`img.icon.${entry}`))])
			.filter(([, id]) => id))
	};

	return state;
}
