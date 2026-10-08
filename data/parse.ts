import type {
	ComponentCategory, ComponentInfo, ComponentSource, ComponentSources, Download, FirmwareStatus, FirmwareVersion,
	GithubAsset, HardwareRevision, Preset, Requirement, TuningGroup, TuningOption, TuningStep
} from '@/types';

// A row of a table: every cell is a string, an empty one where the row has nothing to say
export type Row = Record<string, string>;

// Sources of a component as the YAML spells them: a single asset or download may go without a list
type OneOrMany<T> = T | T[];
export interface SourcesEntry {
	appstore?: OneOrMany<string>;
	github?: OneOrMany<GithubAsset>;
	url?: OneOrMany<Download>;
	manual?: string;
	bundled?: string;
}

// Conditions of the options of a group, by option
export type Conditions = Record<string, Record<string, TuningOption['when']>>;

// Drops what a row left empty, so an object only has the keys it has values for
export function compact<T extends object>(object: T): T {
	return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as T;
}

export const text = (cell: string | undefined): string | undefined => cell || undefined;

export function number(cell: string | undefined): number {
	const value = Number(cell);
	if (!cell || Number.isNaN(value)) throw new Error(`Not a number: "${cell ?? ''}"`);
	return value;
}

// `on` sets a flag, an empty cell or `off` leaves it unset
export function flag(cell: string | undefined): boolean {
	if (cell == 'on') return true;
	if (!cell || cell == 'off') return false;
	throw new Error(`Not a flag: "${cell}"`);
}

// Values separated by commas
export const list = (cell: string | undefined): string[] | undefined => cell ? cell.split(',') : undefined;

// A component, or any of the components separated by `|`
export const requirement = (cell: string): Requirement => cell.includes('|') ? cell.split('|') : cell;

const many = <T>(value: OneOrMany<T> | undefined): T[] | undefined => value === undefined ? undefined : ([] as T[]).concat(value);

export const firmware = (rows: Row[]): FirmwareVersion[] => rows.map(row => compact<FirmwareVersion>({
	version: row.version,
	date: new Date(row.date),
	status: row.status as FirmwareStatus,
	atmosphere: text(row.atmosphere),
	supported: row.supported ? new Date(row.supported) : undefined
}));

// Components of a catalog: a row of the table each, with the sources of its downloads from the YAML next to the table
export const components = (rows: Row[], sources: Record<string, SourcesEntry>): ComponentInfo[] => rows.map(row => {
	const from = sources[row.id] ?? {};
	return compact<ComponentInfo>({
		id: row.id,
		name: row.name,
		author: row.author,
		category: row.category as ComponentCategory,
		version: row.version,
		size: number(row.size),
		released: text(row.released),
		logo: text(row.logo),
		source: row.source as ComponentSource,
		sources: compact<ComponentSources>({
			appstore: many(from.appstore),
			github: many(from.github),
			url: many(from.url),
			manual: from.manual,
			bundled: from.bundled
		}),
		payload: text(row.payload),
		// Requirements are separated by commas and all have to be met
		requires: list(row.requires)?.map(requirement),
		replaces: list(row.replaces),
		conflicts_with: list(row.conflicts_with),
		tracks: list(row.tracks) as ComponentInfo['tracks'],
		hardware: list(row.hardware) as HardwareRevision[] | undefined,
		deprecated: flag(row.deprecated) || undefined,
		is_required: flag(row.is_required),
		risky: flag(row.risky) || undefined,
		plugin: row.plugin_path ? { path: row.plugin_path, scope: list(row.plugin_scope) ?? [] } : undefined
	});
});

export const presets = (rows: Row[]): Preset[] => rows.map(row => ({
	id: row.id,
	components: list(row.components) ?? []
}));

// Values of a select are numbers when every one of them reads as a number
function scalars(cells: string[]): (string | number)[] {
	return cells.every(cell => cell != '' && !Number.isNaN(Number(cell))) ? cells.map(Number) : cells;
}

// An option of a config, its cells read by its type
function option(row: Row): TuningOption {
	const { id } = row;

	switch (row.type) {
		case 'toggle':
			return { id, type: 'toggle', default: flag(row.default) };
		case 'select': {
			const values = scalars(list(row.values) ?? []);
			return { id, type: 'select', values, default: typeof values[0] == 'number' ? number(row.default) : row.default };
		}
		case 'multiselect': {
			// The bounds are on how many values are picked at once
			const picked = list(row.default) ?? [];
			const min = row.min ? number(row.min) : undefined;
			const max = row.max ? number(row.max) : undefined;
			if (picked.length < (min ?? 0) || picked.length > (max ?? Infinity)) throw new Error(`Default of the option ${id} is out of its bounds: "${row.default}"`);
			return { id, type: 'multiselect', values: list(row.values) ?? [], default: picked, min, max };
		}
		case 'range':
			return { id, type: 'range', min: number(row.min), max: number(row.max), step: number(row.step), default: number(row.default) };
		case 'number':
			return { id, type: 'number', min: number(row.min), max: number(row.max), default: number(row.default) };
		case 'text':
			return { id, type: 'text', maxLength: number(row.maxLength), default: row.default };
		case 'hue':
			return { id, type: 'hue', default: number(row.default) };
		case 'color':
			return { id, type: 'color', default: row.default };
		case 'rgba4444':
			if (!/^#[0-9A-F]{4}$/.test(row.default)) throw new Error(`Not a color of the option ${id}: "${row.default}"`);
			return { id, type: 'rgba4444', default: row.default };
		default:
			throw new Error(`Unknown type of the option ${id}: "${row.type}"`);
	}
}

// Groups of options in the order of their index. Every group keeps its options in the table its row points at,
// in the one named after the group without that, conditions of the options come from the YAML next to the tables
export const tuning = (index: Row[], table: (path: string) => Row[] | undefined, conditions: Conditions | null): TuningGroup[] => index.map(row => {
	const path = row.table || `${row.id}.tsv`;
	const rows = table(path);
	if (!rows) throw new Error(`No table ${path} with the options of the group ${row.id}`);
	return compact<TuningGroup>({
		id: row.id,
		step: row.step as TuningStep,
		file: row.file,
		requires: row.requires ? requirement(row.requires) : undefined,
		options: rows.map(item => compact<TuningOption>({
			...option(item),
			when: conditions?.[row.id]?.[item.id],
			secret: flag(item.secret) || undefined
		}))
	});
});
