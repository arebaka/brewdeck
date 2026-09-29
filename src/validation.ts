import { ClockKey, ClockMode, GameProfile, HardwareRevision, Issue, TuningConfig } from './types';
import { Translation } from './i18n';
import { COMPONENTS, HARDWARE, HOS_VERSIONS, OVERCLOCK, isHOSSupported, isRequirementMet } from './data';

export interface ValidationState {
	hardware: HardwareRevision;
	hosVersion: string;
	selectedComponentIDs: string[];
	tuning: TuningConfig;
	overclock: GameProfile[];
}

const LEVELS = { error: 0, warning: 1, info: 2 };

export function validate(state: ValidationState, t: Translation): Issue[] {
	const issues: Issue[] = [];
	const selected = COMPONENTS.filter(comp => state.selectedComponentIDs.includes(comp.id));
	const name = (id: string) => COMPONENTS.find(comp => comp.id == id)?.name ?? id;
	const hos = HOS_VERSIONS.find(v => v.version == state.hosVersion);
	const atmosphere = COMPONENTS.find(comp => comp.id == 'atmosphere')!;

	if (!isHOSSupported(state.hosVersion)) {
		issues.push({ level: 'error', code: 'hosUnsupported', step: 'firmware', params: { hos: state.hosVersion } });
	}

	for (const comp of selected) {
		for (const requirement of comp.requires ?? []) {
			if (!isRequirementMet(requirement, state.selectedComponentIDs)) {
				const alternatives = typeof requirement == 'string' ? [requirement] : requirement;
				issues.push({
					level: 'warning',
					code: 'requires',
					step: 'software',
					params: { component: comp.name, dependency: alternatives.map(name).join(t.issues.or) },
					fix: { add: [alternatives[0]] }
				});
			}
		}

		// Conflicts are mutual, the pair is reported once
		for (const other of comp.conflicts_with ?? []) {
			if (state.selectedComponentIDs.includes(other) && COMPONENTS.indexOf(comp) < COMPONENTS.findIndex(c => c.id == other)) {
				issues.push({ level: 'warning', code: 'conflict', step: 'software', params: { component: comp.name, other: name(other) }, fix: { remove: [other] } });
			}
		}

		for (const other of comp.replaces ?? []) {
			if (state.selectedComponentIDs.includes(other)) {
				issues.push({ level: 'info', code: 'replaces', step: 'software', params: { component: comp.name, other: name(other) }, fix: { remove: [other] } });
			}
		}

		if (comp.hardware && !comp.hardware.includes(state.hardware)) {
			const revisions = comp.hardware.map(id => HARDWARE.find(hw => hw.id == id)!.name).join(', ');
			issues.push({ level: 'warning', code: 'hardware', step: 'software', params: { component: comp.name, revisions }, fix: { remove: [comp.id] } });
		}

		if (comp.deprecated) {
			issues.push({ level: 'info', code: 'deprecated', step: 'software', params: { component: comp.name } });
		}

		if (comp.source == 'manual') {
			issues.push({ level: 'info', code: 'manual', step: 'software', params: { component: comp.name } });
		}

		// Components patching HOS or Atmosphere have to be released after the support of the chosen versions
		if (comp.tracks?.includes('hos') && comp.released && hos?.supported && new Date(comp.released) < hos.supported) {
			issues.push({ level: 'warning', code: 'hosTracks', step: 'firmware', params: { component: comp.name, hos: hos.version } });
		}
		if (comp.tracks?.includes('atmosphere') && comp.released && atmosphere.released && comp.released < atmosphere.released) {
			issues.push({ level: 'warning', code: 'atmosphereTracks', step: 'software', params: { component: comp.name, version: atmosphere.version } });
		}
	}

	const ftp = state.tuning.sys_ftpd_light;
	if (state.selectedComponentIDs.includes('sys_ftpd_light') && !ftp.anonymous && (!ftp.user || !ftp.password)) {
		issues.push({ level: 'warning', code: 'ftpCredentials', step: 'modules', params: {} });
	}

	if (state.selectedComponentIDs.includes('sys_clk')) {
		for (const profile of state.overclock) {
			for (const [key, caps] of Object.entries(OVERCLOCK.caps)) {
				const cap = caps[state.hardware];
				if ((profile.clocks[key as ClockKey] ?? 0) > cap) {
					const mode = key.replace(/_(cpu|gpu|mem)$/, '') as ClockMode;
					issues.push({ level: 'info', code: 'gpuCap', step: 'overclock', params: { game: profile.name, cap: String(cap), mode: t.pages.overclock.modes[mode] } });
				}
			}
		}
	}

	return issues.sort((a, b) => LEVELS[a.level] - LEVELS[b.level]);
}
