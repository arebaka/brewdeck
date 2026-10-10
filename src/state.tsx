import { HARDWARE, HARDWARE_CODES } from '@data';
import { PLATFORMS } from '@/platforms';
import { SWITCH } from '@/platforms/switch';
import { PSP } from '@/platforms/psp';
import { Language } from '@i18n';
import { BuildState, PlatformId, PspState, StepId, SwitchState } from './types';
import { expand, hardwareOf, shorten } from './link';
import { query } from './url';

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

// A link carries the build of the current platform only, packed into a short one
export function encodeState(state: AppState): string {
	const platform = PLATFORMS[state.platform];
	return query(shorten(platform.encode(state.builds[state.platform]), platform.link));
}

// Params of a link spelled in full, whichever way it spells them, and the platform they are of:
// the revision of a link tells its platform, a link without one is a Switch build
function spelled(query: string): { platform: PlatformId; params: URLSearchParams } {
	const params = new URLSearchParams(query);
	const hardware = hardwareOf(params, HARDWARE_CODES);
	const platform = HARDWARE.find(hw => hw.id == hardware)?.platform ?? 'switch';
	return { platform, params: expand(params, PLATFORMS[platform].link) };
}

export function decodeState(query: string): AppState {
	const { platform, params } = spelled(query);
	const state = defaultState();
	state.platform = platform;
	state.builds = withBuild(state.builds, platform, PLATFORMS[platform].decode(params));
	return state;
}

// What a link says spelled in full, a param for everything
export const spellOut = (link: string): string => query([...spelled(link).params]);
