import { type Conditions, type Row, components, firmware, presets, tuning } from '../parse';

import FIRMWARE_ROWS from './firmware.tsv';
import SOFTWARE_ROWS from './software/index.tsv';
import SOFTWARE_SOURCES from './software/sources.yaml';
import PRESET_ROWS from './presets.tsv';
import TUNING_ROWS from './tuning/index.tsv';
import TUNING_CONDITIONS from './tuning/when.yaml';

// Options of the groups lie in tables named after them
const TUNING_TABLES = import.meta.glob<Row[]>('./tuning/*.tsv', { eager: true, import: 'default' });

export const FIRMWARE = firmware(FIRMWARE_ROWS);
export const SOFTWARE = components(SOFTWARE_ROWS, SOFTWARE_SOURCES);
export const PRESETS = presets(PRESET_ROWS);
export const TUNING = tuning(TUNING_ROWS, group => TUNING_TABLES[`./tuning/${group}.tsv`], TUNING_CONDITIONS as Conditions);
