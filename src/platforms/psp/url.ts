import { PspRevision, PspState } from '@/types';
import { HARDWARE } from '@data';
import { Params, decodeSelection, decodeTuning, encodeSelection, encodeTuning, query } from '@/url';
import { CATALOG, COMPONENTS, FIRMWARE, RUNLEVELS, defaultBuild } from './data';

// The model, the firmware and the whole software selection always, options and plugins where they differ from the defaults
export function encode(build: PspState): string {
	const params: Params = [];
	const set = (key: string, value: string) => params.push([key, value]);

	set('hw', build.hardware);
	set('fw', build.firmware);
	set('sw', encodeSelection(CATALOG, build.selectedComponentIDs));

	params.push(...encodeTuning(CATALOG.tuning, build.tuning));

	// plugin.gclite=vsh, an empty list leaves the plugin off
	for (const [id, scope] of Object.entries(build.plugins)) set(`plugin.${id}`, scope.join(','));

	return query(params);
}

// The build a link describes, anything invalid keeps its default
export function decode(params: URLSearchParams): PspState {
	const build = defaultBuild();
	const get = (key: string) => params.get(key);

	const hardware = get('hw');
	if (HARDWARE.some(hw => hw.platform == 'psp' && hw.id == hardware)) build.hardware = hardware as PspRevision;

	const fw = get('fw');
	if (FIRMWARE.some(v => v.version == fw)) build.firmware = fw!;

	build.selectedComponentIDs = decodeSelection(CATALOG, get('sw')) ?? build.selectedComponentIDs;

	decodeTuning(CATALOG.tuning, params, build.tuning);

	// Known runlevels in their order, `always` alone
	for (const comp of COMPONENTS.filter(comp => comp.plugin)) {
		const scope = get(`plugin.${comp.id}`)?.split(',').filter(Boolean);
		if (scope && scope.every(level => RUNLEVELS.includes(level)) && (!scope.includes('always') || scope.length == 1)) {
			build.plugins[comp.id] = RUNLEVELS.filter(level => scope.includes(level));
		}
	}

	return build;
}
