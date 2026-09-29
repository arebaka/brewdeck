import { describe, expect, it } from 'vitest';

import { AppState, defaultState } from '@/state';
import { resolveSelection } from '@/data';
import { translations } from '@/i18n';
import { validate } from '@/validation';
import { customState, issueCodes } from './fixtures';

const scenario = (patch: Partial<AppState>) => issueCodes({ ...defaultState(), ...patch });
const selecting = (ids: string[], dependencies = true) => ({ selectedComponentIDs: resolveSelection(ids, dependencies) });
const fixes = (patch: Partial<AppState>, code: string) => validate({ ...defaultState(), ...patch }, translations.en).find(issue => issue.code == code)?.fixes;

describe('validation', () => {
	it('asks for a missing dependency', () => {
		expect(scenario(selecting(['fps_locker', 'ovlmenu'], false))).toContainEqual('warning:requires:FPSLocker|SaltyNX');
	});

	it('offers every alternative of a dependency', () => {
		expect(scenario(selecting(['status_monitor'], false))).toContainEqual('warning:requires:Status Monitor|Tesla Menu или Ultrahand');
	});

	it('reports conflicting components once', () => {
		expect(scenario(selecting(['ovlmenu', 'ultrahand'])).filter(code => code.startsWith('warning:conflict:'))).toHaveLength(1);
	});

	it('lets either side of a conflict go and any alternative of a dependency come', () => {
		expect(fixes(selecting(['ovlmenu', 'ultrahand']), 'conflict')).toEqual([{ remove: ['ovlmenu'] }, { remove: ['ultrahand'] }]);
		expect(fixes(selecting(['status_monitor'], false), 'requires')).toEqual([{ add: ['ovlmenu'] }, { add: ['ultrahand'] }]);
	});

	it('needs an entry in the Launch menu', () => {
		const launch = { ...defaultState().launch, modes: [] };
		expect(scenario({ launch, ...selecting(['atmosphere']) })).toContainEqual('error:noEntries:');
		expect(scenario({ launch: { ...launch, emummcs: ['SD01'] }, ...selecting(['atmosphere']) })).not.toContainEqual('error:noEntries:');
		expect(scenario({ launch, ...selecting(['atmosphere', 'lockpick_rcm']) })).not.toContainEqual('error:noEntries:');
	});

	it('knows the revisions a component is useful on', () => {
		expect(scenario({ hardware: 'erista', ...selecting(['hwfly_toolbox']) }).some(code => code.startsWith('warning:hardware:'))).toBe(true);
	});

	it('warns about patches older than the support of the HOS version', () => {
		expect(scenario({ hosVersion: '23.0.0' })).toContainEqual('warning:hosTracks:sys-patch|23.0.0');
		expect(scenario({ hosVersion: '22.1.0' }).some(code => code.startsWith('warning:hosTracks:'))).toBe(false);
	});

	it('asks for FTP credentials', () => {
		expect(scenario(selecting([...defaultState().selectedComponentIDs, 'sys_ftpd_light']))).toContainEqual('warning:ftpCredentials:');
	});

	it('explains the GPU cap of sys-clk', () => {
		expect(issueCodes(customState()).some(code => code.startsWith('info:gpuCap:0123456789ABCDEF|460|'))).toBe(true);
	});

	it('warns about risky components with their notes', () => {
		expect(scenario(selecting([...defaultState().selectedComponentIDs, 'dbi_patcher'])).some(code => code.startsWith('warning:risky:DBIPatcher|Автор DBI'))).toBe(true);
	});

	it('points at components to download by hand', () => {
		expect(issueCodes(customState())).toContainEqual('info:manual:Tinfoil');
	});
});
