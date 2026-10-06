import { HARDWARE } from '@data';
import { PLATFORMS } from '@/platforms';
import { SWITCH } from '@/platforms/switch';
import { PSP } from '@/platforms/psp';
import { Language } from '@i18n';
import { BuildState, PlatformId, PspState, StepId, SwitchState } from './types';

// A build of every platform, so a console picked by mistake does not cost the build of another one
export interface Builds {
	switch: SwitchState;
	psp: PspState;
}

export interface AppState {
	lang: Language;
	step: StepId;
	platform: PlatformId; // the build shown and linked
	builds: Builds;
}

export function defaultState(): AppState {
	return {
		lang: 'en',
		step: 'hardware',
		platform: 'switch',
		builds: { switch: SWITCH.defaults(), psp: PSP.defaults() }
	};
}

// The builds with the one of the platform replaced
export const withBuild = (builds: Builds, platform: PlatformId, build: BuildState) => ({ ...builds, [platform]: build }) as Builds;

// A link carries the build of the current platform only
export function encodeState(state: AppState): string {
	return PLATFORMS[state.platform].encode(state.builds[state.platform]);
}

// The revision of a link tells its platform, a link without one is a Switch build
export function decodeState(query: string): AppState {
	const params = new URLSearchParams(query);
	const state = defaultState();
	state.platform = HARDWARE.find(hw => hw.id == params.get('hw'))?.platform ?? state.platform;
	state.builds = withBuild(state.builds, state.platform, PLATFORMS[state.platform].decode(params));
	return state;
}
