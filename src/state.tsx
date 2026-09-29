import { DEFAULT_COMPONENTS, getTuningDefaults, resolveSelection } from '@/data';
import { Language } from './i18n';
import { AppearanceConfig, GameProfile, HardwareRevision, LaunchConfig, StepId, TuningConfig } from './types';

export interface AppState {
	lang: Language;
	step: StepId;
	hardware: HardwareRevision;
	hosVersion: string;
	selectedComponentIDs: string[];
	launch: LaunchConfig;
	tuning: TuningConfig;
	overclock: GameProfile[];
	appearance: AppearanceConfig;
}

export function defaultState(): AppState {
	return {
		lang: 'en',
		step: 'hardware',
		hardware: 'erista',
		hosVersion: '21.0.0',
		selectedComponentIDs: resolveSelection(DEFAULT_COMPONENTS),
		launch: { modes: ['emummc', 'sysmmc', 'stock'], emummcs: [], overrides: {}, autoboot: 'emummc' },
		tuning: getTuningDefaults(),
		overclock: [],
		appearance: { logos: {}, icons: {} }
	};
}
