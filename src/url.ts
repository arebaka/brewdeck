import { BootMode, ClockKey, Clocks, EntryOverride, HardwareRevision, ImageTarget, LaunchConfig, TuningOption, TuningValue } from './types';
import { BOOT_ENTRIES, COMPONENTS, ENTRY_OVERRIDES, GALLERY, HARDWARE, HOS_VERSIONS, OVERCLOCK, TUNING, isEmuMMCFolder, resolveSelection } from './data';
import { AppState, defaultState } from './state';

const BOOT_MODES = BOOT_ENTRIES.map(entry => entry.id);

// Entries booting the system, enabled or not: they keep overrides, logos and icons
const hosEntries = (launch: LaunchConfig) => [...BOOT_MODES, ...launch.emummcs.map(folder => `emummc-${folder}`)];

// Components with a payload, each of them can be an entry with a logo and an icon
const PAYLOADS = COMPONENTS.filter(comp => comp.payload).map(comp => comp.id);

// Commas, colons and dots stay readable, everything else is percent-encoded
const encode = (value: string) => encodeURIComponent(value).replace(/%2C/g, ',').replace(/%3A/g, ':');

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

// Name of a known game, the title ID otherwise
export function gameName(id: string): string {
	return OVERCLOCK.games.find(game => game.id == id)?.name ?? id;
}

// A copy of the clocks of an overclock template, stock has none
export function templateClocks(template: string): Clocks {
	return { ...(OVERCLOCK.templates[template] ?? {}) };
}

// The revision, the HOS version and the whole software selection always, so links keep their builds when recommendations change.
// Everything else only where it differs from the defaults
export function encodeState(state: AppState): string {
	const defaults = defaultState();
	const params: [string, string][] = [];
	const set = (key: string, value: string) => params.push([key, value]);

	set('hw', state.hardware);
	set('hos', state.hosVersion);

	set('sw', COMPONENTS.filter(comp => state.selectedComponentIDs.includes(comp.id)).map(comp => comp.id).join(','));

	if (state.launch.modes.join() != defaults.launch.modes.join()) set('boot', state.launch.modes.join(','));
	if (state.launch.emummcs.length) set('emummc', state.launch.emummcs.join(','));
	if (state.launch.autoboot != defaults.launch.autoboot) set('autoboot', state.launch.autoboot);
	for (const [entry, keys] of Object.entries(state.launch.overrides)) {
		for (const [key, value] of Object.entries(keys)) set(`launch.${entry}.${key}`, String(value));
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
	const { bootlogo, background, logos, icons } = state.appearance;
	if (bootlogo && bootlogo != 'upload') set('img.bootlogo', bootlogo);
	if (background && background != 'upload') set('img.background', background);
	for (const [entry, image] of Object.entries(logos)) {
		if (image != 'upload') set(`img.logo.${entry}`, image);
	}
	for (const [entry, image] of Object.entries(icons)) {
		if (image != 'upload') set(`img.icon.${entry}`, image);
	}

	return params.map(([key, value]) => `${key}=${encode(value)}`).join('&');
}

// The build a link describes, anything invalid keeps its default
export function decodeState(query: string): AppState {
	const params = new URLSearchParams(query);
	const state = defaultState();
	const get = (key: string) => params.get(key);

	const hardware = get('hw');
	if (HARDWARE.some(hw => hw.id == hardware)) state.hardware = hardware as HardwareRevision;

	const hos = get('hos');
	if (HOS_VERSIONS.some(v => v.version == hos)) state.hosVersion = hos!;

	// The selection as it is, dependencies removed by hand stay removed. An empty list leaves the required components,
	// a list of unknown ones means nothing
	const sw = get('sw')?.split(',').filter(Boolean);
	const components = sw?.filter(id => COMPONENTS.some(comp => comp.id == id)) ?? [];
	if (sw && (!sw.length || components.length)) state.selectedComponentIDs = resolveSelection(components, false);

	// An empty list turns every boot mode off, a list of unknown ones means nothing
	const boot = get('boot')?.split(',').filter(Boolean);
	const modes = BOOT_MODES.filter(mode => boot?.includes(mode));
	if (boot && (!boot.length || modes.length)) state.launch.modes = modes;

	const emummcs = get('emummc')?.split(',').filter(isEmuMMCFolder);
	if (emummcs) state.launch.emummcs = [...new Set(emummcs)];
	const entries = hosEntries(state.launch);

	// Autoboot takes the menu, an entry booting the system or a component with a payload
	const autoboot = get('autoboot');
	if (autoboot == 'menu' || entries.includes(autoboot!) || PAYLOADS.includes(autoboot!)) {
		state.launch.autoboot = autoboot!;
	}

	for (const [key, value] of params) {
		const [, entry, override] = key.match(/^launch\.(.+)\.(\w+)$/) ?? [];
		if (entries.includes(entry) && ENTRY_OVERRIDES.includes(override as EntryOverride) && (value == '0' || value == '1')) {
			state.launch.overrides[entry] = { ...state.launch.overrides[entry], [override]: Number(value) };
		}
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
	const images = (kind: 'logo' | 'icon', target: ImageTarget) => Object.fromEntries([...entries, ...PAYLOADS]
		.map(entry => [entry, image(target, get(`img.${kind}.${entry}`))])
		.filter(([, id]) => id)) as Record<string, string>;
	state.appearance = {
		bootlogo: image('bootlogo', get('img.bootlogo')),
		background: image('background', get('img.background')),
		logos: images('logo', 'bootlogo'),
		icons: images('icon', 'icon')
	};

	return state;
}
