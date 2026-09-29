import { describe, expect, it } from 'vitest';

import { build } from '@/build';
import { translations } from '@/i18n';
import { defaultState } from '@/url';
import { BITMAPS, customState, encodeBitmaps } from './fixtures';

describe('build', () => {
	const result = build({ ...customState(), t: translations.en });
	const paths = result.configs.map(config => config.path);
	const config = (path: string) => result.configs.find(config => config.path == path)?.content;
	const installers = result.files.filter(file => file.path.startsWith('install.'));

	it('writes the configs of changed modules', () => {
		expect(paths).toEqual(expect.arrayContaining([
			'config/tesla/config.ini',
			'config/sys-ftpd/config.ini',
			'config/MissionControl/missioncontrol.ini',
			'config/sys-clk/config.ini',
			'atmosphere/hosts/sysmmc.txt'
		]));
	});

	it('leaves untouched module configs on the card as they are', () => {
		expect(paths).not.toContain('config/sys-patch/config.ini');
		expect(paths).not.toContain('config/status-monitor/config.ini');
	});

	it('writes only overclock profiles that change clocks', () => {
		expect(config('config/sys-clk/config.ini')).toContain('[0123456789ABCDEF]');
		expect(config('config/sys-clk/config.ini')).not.toContain('01007EF00011E000');
	});

	it('writes the FTP password into its config', () => {
		expect(config('config/sys-ftpd/config.ini')).toContain('hunter2');
	});

	it('places images where hekate and Nyx look for them', () => {
		expect(result.assets.map(asset => asset.path)).toEqual([
			'bootloader/bootlogo.bmp',
			'bootloader/res/background.bmp',
			'bootloader/res/brewdeck_emummc_hue.bmp',
			'bootloader/res/brewdeck_stock.bmp'
		]);
		expect(config('bootloader/hekate_ipl.ini')).toMatch(/icon=bootloader\/res\/brewdeck_emummc_hue\.bmp/);
		expect(config('bootloader/hekate_ipl.ini')).toMatch(/icon=bootloader\/res\/brewdeck_stock\.bmp/);
	});

	it('embeds images into both installers', () => {
		const images = encodeBitmaps(BITMAPS);
		const { files } = build({
			...defaultState(),
			appearance: { bootlogo: 'hekate-a', background: 'atmosphere-splash', icons: { emummc: 'hekate-switch' } },
			images,
			t: translations.en
		});
		for (const file of files.filter(file => file.path.startsWith('install.'))) {
			for (const [path, data] of Object.entries(images)) {
				expect(file.content).toContain(path);
				expect(file.content).toContain(data);
			}
		}
	});

	it('runs installers from the root of the card without arguments', () => {
		for (const file of installers) {
			expect(file.content).not.toMatch(/SdRoot E:|\[SD card root\]|path\/to/);
		}
		expect(result.files.find(file => file.path == 'README.md')?.content).toContain('`bash install.sh`');
	});
});
