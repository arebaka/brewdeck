import { describe, expect, it } from 'vitest';

import { defaultState } from '@/state';
import { resolveSelection } from '@/data';
import { decodeState, encodeState } from '@/url';
import { customState } from './fixtures';

describe('links', () => {
	const state = customState();
	const query = encodeState(state);

	it('restore the build', () => {
		const expected = structuredClone(state);
		expected.tuning.sys_ftpd_light.user = '';
		expected.tuning.sys_ftpd_light.password = '';
		expected.appearance = { bootlogo: 'hekate-a', logos: { stock: 'hekate-b' }, icons: { emummc: 'hekate-switch', fusee: 'hekate-payload' } };
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
		const defaults = defaultState();
		expect(encodeState(defaults)).toBe(`hw=${defaults.hardware}&hos=${defaults.hosVersion}&sw=${defaults.selectedComponentIDs.join(',')}`);
	});

	it('take the software as listed, whatever the recommendations are', () => {
		expect(decodeState('?sw=dbi,fps_locker').selectedComponentIDs).toEqual(resolveSelection(['dbi', 'fps_locker'], false));
		expect(decodeState('?sw=dbi,fps_locker').selectedComponentIDs).not.toContain('saltynx');
		expect(decodeState('?sw=').selectedComponentIDs).toEqual(resolveSelection([], false));
	});

	it('turn every boot mode off with an empty list', () => {
		expect(decodeState('?boot=&autoboot=menu').launch).toEqual({ modes: [], emummcs: [], overrides: {}, autoboot: 'menu' });
	});

	it('spell more emuMMCs by their folders and overrides by their entries', () => {
		const query = encodeState(customState());
		expect(query).toContain('emummc=SD01');
		expect(query).toContain('launch.emummc.cal0blank=0');
		expect(query).toContain('launch.emummc-SD01.usb3force=1&launch.emummc-SD01.memmode=1');
		expect(query).toContain('img.logo.stock=hekate-b');
		expect(query).toContain('img.icon.fusee=hekate-payload');
	});

	it('ignore invalid values', () => {
		const decoded = decodeState('?hw=foo&hos=99.0.0&sw=nope,-atmosphere,-hekate&hekate.backlight=999&boot=nope&autoboot=evil'
			+ '&nyx.themebg=red&tesla.key_combo=L,HOME&sys_ftpd_light.port=1.5e9'
			+ '&oc=XYZ.balanced,0100F2C0115B6000.nope,0100F2C0115B6001.custom.docked_cpu-abc.evil_gpu-5'
			+ '&img.bootlogo=../../etc/passwd&img.icon.emummc=hekate-a'
			+ '&emummc=SD01,../x,SD01,sd02&launch.emummc-RAW9.memmode=1&launch.emummc-SD01.memmode=2&launch.stock.cal0writesys=1'
			+ '&img.logo.emummc-RAW9=hekate-b&img.logo.fusee=hekate-switch&img.icon.evil=hekate-switch');
		const expected = defaultState();
		expected.overclock = [{ id: '0100F2C0115B6001', name: '0100F2C0115B6001', template: 'custom', clocks: {} }];
		expected.launch.emummcs = ['SD01'];
		expect(decoded).toEqual(expected);
	});
});
