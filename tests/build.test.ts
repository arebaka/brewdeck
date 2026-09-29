import { describe, expect, it } from 'vitest';

import { build } from '@/build';
import { COMPONENTS, resolveSelection } from '@/data';
import { translations } from '@/i18n';
import { defaultState } from '@/state';
import { BITMAPS, customState, encodeBitmaps } from './fixtures';

describe('build', () => {
	const result = build({ ...customState(), t: translations.en });
	const paths = result.configs.map(config => config.path);
	const config = (path: string) => result.configs.find(config => config.path == path)?.content;
	const installers = result.files.filter(file => file.path.startsWith('install.'));
	// Lines of a section of hekate_ipl.ini, up to the blank line before the next one
	const section = (name: string) => `\n${config('bootloader/hekate_ipl.ini')}`.split(`\n[${name}]\n`)[1]?.split('\n\n')[0].trim().split('\n');

	it('writes the Launch menu: boot modes, then payloads, autoboot by number', () => {
		const state = customState();
		const ini = config('bootloader/hekate_ipl.ini')!;
		const payloads = COMPONENTS.filter(comp => comp.payload && state.selectedComponentIDs.includes(comp.id));
		expect([...ini.matchAll(/^\[(.+)\]$/gm)].map(match => match[1])).toEqual(['config', 'CFW (emuMMC)', 'CFW (emuMMC SD01)', 'Stock', ...payloads.map(comp => comp.name)]);
		expect(ini).toMatch(/^autoboot=3$/m);
		expect(section('config')).toEqual(expect.arrayContaining(['bootwait=5', 'noticker=1', 'backlight=50']));
		for (const comp of payloads) {
			expect(ini).toContain(`payload=${comp.payload}`);
		}
	});

	it('boots another emuMMC by its folder and sets Exosphere keys per entry', () => {
		expect(section('CFW (emuMMC)')).toEqual(['pkg3=atmosphere/package3', 'emummcforce=1', 'cal0blank=0', 'icon=bootloader/res/brewdeck_emummc_hue.bmp']);
		expect(section('CFW (emuMMC SD01)')).toEqual([
			'pkg3=atmosphere/package3',
			'emummcforce=1',
			'emupath=emuMMC/SD01',
			'usb3force=1',
			'memmode=1',
			'logopath=bootloader/res/brewdeck_emummc-SD01_logo.bmp'
		]);
		expect(section('Stock')).toEqual(expect.arrayContaining(['logopath=bootloader/res/brewdeck_stock_logo.bmp']));
		expect(result.files.find(file => file.path == 'README.md')?.content).toContain('**Launch → CFW (emuMMC SD01)**: `emuMMC/SD01`');
	});

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
			'bootloader/res/brewdeck_emummc-SD01_logo.bmp',
			'bootloader/res/brewdeck_stock_logo.bmp',
			'bootloader/res/brewdeck_emummc_hue.bmp',
			'bootloader/res/brewdeck_stock.bmp',
			'bootloader/res/brewdeck_fusee_hue.bmp'
		]);
		expect(section('Stock')).toContain('icon=bootloader/res/brewdeck_stock.bmp');
		expect(section('Fusee')).toContain('icon=bootloader/res/brewdeck_fusee_hue.bmp');
	});

	it('embeds images into both installers', () => {
		const images = encodeBitmaps(BITMAPS);
		const { files } = build({
			...defaultState(),
			appearance: { bootlogo: 'hekate-a', background: 'atmosphere-splash', logos: {}, icons: { emummc: 'hekate-switch' } },
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

	it('names assets after the options of their components', () => {
		const state = customState();
		const { files } = build({
			...state,
			selectedComponentIDs: resolveSelection([...state.selectedComponentIDs, 'dbi_patcher']),
			tuning: { ...state.tuning, dbi_patcher: { language: 'ua' } },
			t: translations.en
		});
		for (const file of files.filter(file => file.path.startsWith('install.'))) {
			expect(file.content).toContain("'^translation_ua\\.bin$'");
			expect(file.content).toContain("'switch/DBI/translation.bin'");
			// The translated build of DBI lands over the original one
			expect(file.content.indexOf("'rashevskyv/DBIPatcher'")).toBeGreaterThan(file.content.indexOf("'rashevskyv/dbi'"));
		}
	});

	it('runs installers from the root of the card without arguments', () => {
		for (const file of installers) {
			expect(file.content).not.toMatch(/SdRoot E:|\[SD card root\]|path\/to/);
		}
		expect(result.files.find(file => file.path == 'README.md')?.content).toContain('`bash install.sh`');
	});
});
