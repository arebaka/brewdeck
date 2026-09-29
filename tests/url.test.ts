import { describe, expect, it } from 'vitest';

import { decodeState, defaultState, encodeState } from '@/url';
import { customState } from './fixtures';

describe('links', () => {
	const state = customState();
	const query = encodeState(state);

	it('restore the build', () => {
		const expected = structuredClone(state);
		expected.tuning.sys_ftpd_light.password = '';
		expected.appearance = { bootlogo: 'hekate-a', icons: { emummc: 'hekate-switch' } };
		expect(decodeState(`?${query}`)).toEqual(expected);
	});

	it('keep secrets and uploaded images out', () => {
		expect(query).not.toContain('hunter2');
		expect(query).not.toMatch(/password|upload/);
	});

	it('leave the language and the step to the interface', () => {
		expect(query).not.toMatch(/(^|&)(lang|step)=/);
	});

	it('encode the same build the same way', () => {
		expect(encodeState(decodeState(`?${query}`))).toBe(query);
	});

	it('always pin the revision and the HOS version', () => {
		const defaults = defaultState();
		expect(encodeState(defaults)).toBe(`hw=${defaults.hardware}&hos=${defaults.hosVersion}`);
	});

	it('ignore invalid values', () => {
		const decoded = decodeState('?hw=foo&hos=99.0.0&sw=nope,-atmosphere,-hekate&hekate.backlight=999&hekate.autoboot=evil'
			+ '&nyx.themebg=red&tesla.key_combo=L,HOME&sys_ftpd_light.port=1.5e9'
			+ '&oc=XYZ.balanced,0100F2C0115B6000.nope,0100F2C0115B6001.custom.docked_cpu-abc.evil_gpu-5'
			+ '&img.bootlogo=../../etc/passwd&img.icon.emummc=hekate-a');
		const expected = defaultState();
		expected.overclock = [{ id: '0100F2C0115B6001', name: '0100F2C0115B6001', template: 'custom', clocks: {} }];
		expect(decoded).toEqual(expected);
	});
});
