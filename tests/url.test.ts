import { describe, expect, it } from 'vitest';

import { decodeState, defaultState, encodeState } from '@/state';
import { resolveSelection } from '@/data';
import { CATALOG } from '@/platforms/switch';
import { customState } from './fixtures';

describe('links', () => {
	const state = customState();
	const query = encodeState(state);

	it('restore the build', () => {
		const expected = structuredClone(state);
		expected.builds.switch.tuning.sys_ftpd_light.user = '';
		expected.builds.switch.tuning.sys_ftpd_light.password = '';
		expected.builds.switch.appearance = { bootlogo: 'hekate-a', logos: { stock: 'hekate-b' }, icons: { emummc: 'hekate-switch', fusee: 'hekate-payload' } };
		expect(decodeState(`?${query}`)).toEqual(expected);
	});

	it('keep secrets and uploaded images out', () => {
		expect(query).not.toContain('hunter2');
		expect(query).not.toContain('lesha');
		expect(query).not.toMatch(/password|upload/);
	});

	it('leave the language and the step to the interface', () => {
		expect(query).not.toMatch(/(^|&)(lang|step)=/);
	});

	it('encode the same build the same way', () => {
		expect(encodeState(decodeState(`?${query}`))).toBe(query);
	});

	it('always pin the revision, the HOS version and the whole software selection', () => {
		const defaults = defaultState().builds.switch;
		expect(encodeState(defaultState())).toBe(`hw=${defaults.hardware}&hos=${defaults.firmware}&sw=${defaults.selectedComponentIDs.join(',')}`);
	});

	it('take the platform of the revision', () => {
		expect(decodeState('?hw=lite')).toMatchObject({ platform: 'switch', builds: { switch: { hardware: 'lite' } } });
	});

	it('take the software as listed, whatever the recommendations are', () => {
		expect(decodeState('?sw=dbi,fps_locker').builds.switch.selectedComponentIDs).toEqual(resolveSelection(CATALOG, ['dbi', 'fps_locker'], false));
		expect(decodeState('?sw=dbi,fps_locker').builds.switch.selectedComponentIDs).not.toContain('saltynx');
		expect(decodeState('?sw=').builds.switch.selectedComponentIDs).toEqual(resolveSelection(CATALOG, [], false));
	});

	it('turn every boot mode off with an empty list', () => {
		expect(decodeState('?boot=&autoboot=menu').builds.switch.launch).toEqual({ modes: [], emummcs: [], overrides: {}, autoboot: 'menu' });
	});

	it('spell more emuMMCs by their folders and overrides by their entries', () => {
		expect(query).toContain('emummc=SD01');
		expect(query).toContain('launch.emummc.cal0blank=0');
		expect(query).toContain('launch.emummc-SD01.usb3force=1&launch.emummc-SD01.memmode=1');
		expect(query).toContain('img.logo.stock=hekate-b');
		expect(query).toContain('img.icon.fusee=hekate-payload');
	});

	it('take as many values of an option as it holds at once', () => {
		const combo = (raw: string) => decodeState(`?status_monitor.key_combo=${raw}`).builds.switch.tuning.status_monitor.key_combo;
		expect(combo('ZR,ZL,R,L')).toEqual(['L', 'R', 'ZL', 'ZR']);
		expect(combo('L,R,ZL,ZR,A')).toEqual(['L', 'DDOWN', 'RSTICK']);
		expect(combo('')).toEqual(['L', 'DDOWN', 'RSTICK']);
		// An option without bounds takes any number of them, none too
		expect(decodeState('?tesla.key_combo=').builds.switch.tuning.tesla.key_combo).toEqual([]);
	});

	// A line break would end the config inside an installer and run what follows it as commands
	it('take a text only as a single line', () => {
		const path = (raw: string) => decodeState(`?atmosphere.sd_card_log_output_directory=${encodeURIComponent(raw)}`).builds.switch.tuning.atmosphere.sd_card_log_output_directory;
		expect(path('logs/of mine')).toBe('logs/of mine');
		for (const breaking of ['x\nBREWDECK_EOF\necho pwned', 'x\r\'@\rpwned', `x${String.fromCharCode(0x2028)}y`, 'x\ty', `x${String.fromCharCode(0)}`]) {
			expect(path(breaking), JSON.stringify(breaking)).toBe('atmosphere/binlogs');
		}
	});

	it('ignore invalid values', () => {
		const decoded = decodeState('?hw=foo&hos=99.0.0&sw=nope,-atmosphere,-hekate&hekate.backlight=999&boot=nope&autoboot=evil'
			+ '&nyx.themebg=red&tesla.key_combo=L,HOME&sys_ftpd_light.port=1.5e9'
			+ '&oc=XYZ.balanced,0100F2C0115B6000.nope,0100F2C0115B6001.custom.docked_cpu-abc.evil_gpu-5'
			+ '&img.bootlogo=../../etc/passwd&img.icon.emummc=hekate-a'
			+ '&emummc=SD01,../x,SD01,sd02&launch.emummc-RAW9.memmode=1&launch.emummc-SD01.memmode=2&launch.stock.cal0writesys=1'
			+ '&img.logo.emummc-RAW9=hekate-b&img.logo.fusee=hekate-switch&img.icon.evil=hekate-switch');
		const expected = defaultState();
		expected.builds.switch.overclock = [{ id: '0100F2C0115B6001', name: '0100F2C0115B6001', template: 'custom', clocks: {} }];
		expected.builds.switch.launch.emummcs = ['SD01'];
		expect(decoded).toEqual(expected);
	});
});
