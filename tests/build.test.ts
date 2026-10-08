import { describe, expect, it } from 'vitest';

import { resolveSelection } from '@/data';
import { CATALOG, COMPONENTS, SWITCH } from '@/platforms/switch';
import { I18N } from '@i18n';
import { TuningConfig } from '@/types';
import { BITMAPS, customBuild, encodeBitmaps } from './fixtures';

describe('build', () => {
	const result = SWITCH.build({ ...customBuild(), lang: 'en', t: I18N.en });
	const paths = result.configs.map(config => config.path);
	const config = (path: string) => result.configs.find(config => config.path == path)?.content;
	const installers = result.files.filter(file => file.path.startsWith('install.'));
	// Lines of a section of hekate_ipl.ini, up to the blank line before the next one
	const section = (name: string) => `\n${config('bootloader/hekate_ipl.ini')}`.split(`\n[${name}]\n`)[1]?.split('\n\n')[0].trim().split('\n');

	it('writes the Launch menu: boot modes, then payloads, autoboot by number', () => {
		const build = customBuild();
		const ini = config('bootloader/hekate_ipl.ini')!;
		const payloads = COMPONENTS.filter(comp => comp.payload && build.selectedComponentIDs.includes(comp.id));
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

	it('writes the configs of the selected components, whether their settings are changed or not', () => {
		expect(paths).toEqual(expect.arrayContaining([
			'config/tesla/config.ini',
			'config/sys-ftpd/config.ini',
			'config/MissionControl/missioncontrol.ini',
			'config/sys-clk/config.ini',
			'atmosphere/hosts/sysmmc.txt',
			// Nothing is changed in these
			'config/sys-patch/config.ini',
			'config/status-monitor/config.ini',
			'config/JKSV/JKSV.json'
		]));
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

	it('points the page at the pictures of the gallery', () => {
		expect(result.assets.map(asset => asset.file)).toEqual([
			'appearance/bootlogo/hekate-a.png',
			undefined,
			undefined,
			'appearance/bootlogo/hekate-b.png',
			'appearance/icon/hekate-switch.png',
			undefined,
			'appearance/icon/hekate-payload.png'
		]);
	});

	it('embeds images into both installers', () => {
		const images = encodeBitmaps(BITMAPS);
		const { files } = SWITCH.build({
			...SWITCH.defaults(),
			appearance: { bootlogo: 'hekate-a', background: 'atmosphere-splash', logos: {}, icons: { emummc: 'hekate-switch' } },
			images,
			lang: 'en',
			t: I18N.en
		});
		for (const file of files.filter(file => file.path.startsWith('install.'))) {
			for (const [path, data] of Object.entries(images)) {
				expect(file.content).toContain(path);
				expect(file.content).toContain(data);
			}
		}
	});

	it('names assets after the options of their components', () => {
		const build = customBuild();
		const { files } = SWITCH.build({
			...build,
			selectedComponentIDs: resolveSelection(CATALOG, [...build.selectedComponentIDs, 'dbi_patcher']),
			tuning: { ...build.tuning, dbi_patcher: { language: 'ua' } },
			lang: 'en',
			t: I18N.en
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

describe('configs of modules, overlays and applications', () => {
	// Configs by path of the recommended build with more components and changed options of their groups
	const configs = (ids: string[], changes: TuningConfig) => {
		const build = SWITCH.defaults();
		const { configs } = SWITCH.build({
			...build,
			selectedComponentIDs: resolveSelection(CATALOG, [...build.selectedComponentIDs, ...ids]),
			tuning: { ...build.tuning, ...Object.fromEntries(Object.entries(changes).map(([group, options]) => [group, { ...build.tuning[group], ...options }])) },
			lang: 'en',
			t: I18N.en
		});
		return Object.fromEntries(configs.map(config => [config.path, config.content]));
	};
	const lines = (content: string) => content.trim().split('\n');
	// Keys of an INI file by its sections
	const sections = (content: string): Record<string, Record<string, string>> => Object.fromEntries(content.trim().split('\n\n').map(section => {
		const [header, ...keys] = section.split('\n');
		return [header.slice(1, -1), Object.fromEntries(keys.map(key => key.split('=')))];
	}));
	const options = (group: string) => CATALOG.tuning.find(item => item.id == group)!.options.map(option => option.id);
	const PATHS = [
		'config/ultrahand/config.ini', 'config/status-monitor/config.ini', 'config/sys-tune/config.ini', 'config/sys-con/config.ini',
		'config/JKSV/JKSV.json', 'config/JKSV/webdav.json', 'config/amiigo/settings.json'
	];

	it('writes them for the selected components with nothing changed too, all but the WebDAV server that is not set', () => {
		expect(Object.keys(configs(['sys_tune', 'sys_con', 'amiigo'], {})).filter(path => PATHS.includes(path)).sort())
			.toEqual(PATHS.filter(path => path != 'config/JKSV/webdav.json').sort());
	});

	it('writes nothing for a component that is not selected', () => {
		const paths = Object.keys(configs([], { sys_tune: { shuffle: true }, sys_con: { mode: 'mitm' }, amiigo: { categoryMode: 2 } }));
		expect(paths.filter(path => ['config/sys-tune/config.ini', 'config/sys-con/config.ini', 'config/amiigo/settings.json'].includes(path))).toEqual([]);
	});

	it('writes every setting of Ultrahand in the order it keeps them, what it shows as what it hides', () => {
		const { ultrahand } = sections(configs([], {
			ultrahand: { default_lang: 'uk', hold_duration: 1500, show_clock: false, datetime_format: '%H:%M' }
		})['config/ultrahand/config.ini']);
		// Ultrahand saves its keys sorted, so the config reads line by line against the one of a console
		expect(Object.keys(ultrahand)).toEqual([...options('ultrahand').map(option => option.replace('show_', 'hide_')), 'key_combo'].sort());
		expect(ultrahand).toMatchObject({
			key_combo: 'L+DDOWN+RS',
			default_lang: 'uk',
			hold_duration: '1500',
			datetime_format: '%H:%M',
			hide_clock: 'true',
			hide_battery: 'true',
			hide_packages: 'false',
			swipe_to_open: 'true',
			extended_widget_backdrop: 'false'
		});
	});

	it('writes the combo of the overlay menu into the config of Ultrahand too, as it reads its own first', () => {
		const picked = configs([], { tesla: { key_combo: ['ZL', 'ZR', 'DDOWN'] } });
		expect(picked['config/tesla/config.ini']).toContain('key_combo=ZL+ZR+DDOWN');
		expect(picked['config/ultrahand/config.ini']).toContain('\nkey_combo=ZL+ZR+DDOWN\n');
		// Without buttons the combo is left to the menu
		const none = configs([], { tesla: { key_combo: [] } });
		expect(none['config/tesla/config.ini']).toBeUndefined();
		expect(none['config/ultrahand/config.ini']).not.toContain('key_combo');
	});

	it('writes the volumes of sys-tune as parts of one and its path from the root of the card', () => {
		const ini = (changes: TuningConfig[string]) => lines(configs(['sys_tune'], { sys_tune: changes })['config/sys-tune/config.ini']);
		expect(ini({ volume: 35, shuffle: true, load_path: 'sdmc:/music/' }))
			.toEqual(['[config]', 'shuffle=1', 'repeat=1', 'volume=0.35', 'global_volume=1', 'load_path=/music/', '', '[title]', 'default=1']);
		expect(ini({ title_default: false })).toEqual(['[config]', 'shuffle=0', 'repeat=1', 'volume=1', 'global_volume=1', '', '[title]', 'default=0']);
	});

	it('writes the settings of sys-con ahead of the profiles of controllers it ships', () => {
		const ini = configs(['sys_con'], { sys_con: { discovery_mode: 1, discovery_vidpid: '054c-*, 057e-2009', auto_add_controller: false } })['config/sys-con/config.ini'];
		expect(ini).toContain('\n[default]\n');
		expect(ini).not.toContain('{{');
		expect(lines(ini.slice(0, ini.indexOf('\n\n')))).toEqual([
			'[global]',
			'mode=hiddbg',
			'polling_timeout_ms=10',
			'polling_thread_priority=41',
			'log_level=3',
			'discovery_mode=1',
			'discovery_vidpid=054c-*,057e-2009',
			'auto_add_controller=0',
			'network_controller=0',
			'network_controller_port=56789'
		]);
	});

	it('writes the config of Status Monitor with a section of every mode, each with all of its settings', () => {
		const SECTIONS = {
			'status-monitor': 'status_monitor',
			full: 'status_monitor_full',
			mini: 'status_monitor_mini',
			micro: 'status_monitor_micro',
			'fps-counter': 'status_monitor_fps_counter',
			'fps-graph': 'status_monitor_fps_graph',
			game_resolutions: 'status_monitor_game_resolutions'
		};
		const content = configs([], {
			status_monitor: { touch_screen: false, key_combo: ['ZL', 'ZR'] },
			status_monitor_mini: { show: ['CPU', 'FPS'], background_color: '#000F' },
			status_monitor_fps_graph: { layer_height_align: 'bottom' }
		})['config/status-monitor/config.ini'];
		const ini = sections(content);

		expect(Object.keys(ini)).toEqual(Object.keys(SECTIONS));
		for (const [section, group] of Object.entries(SECTIONS)) {
			expect(Object.keys(ini[section]).sort(), section).toEqual(options(group).sort());
		}
		// A key without its option would be written empty
		expect(content).not.toMatch(/=$|\{\{/m);
		expect(ini['status-monitor']).toMatchObject({ key_combo: 'ZL+ZR', touch_screen: 'false', motion_control: 'true', battery_time_left_refreshrate: '60' });
		expect(ini.mini).toMatchObject({ show: 'CPU+FPS', background_color: '#000F', cat_color: '#FFFF', handheld_font_size: '15' });
		expect(ini.micro).toMatchObject({ show: 'CPU+GPU+RAM+BRD+FAN+FPS', cat_color: '#FCCF' });
		expect(ini['fps-graph']).toMatchObject({ layer_height_align: 'bottom', perfect_line_color: '#0C0F' });
		expect(ini.game_resolutions.refresh_rate).toBe('10');
	});

	it('writes a setting of a mode of Status Monitor into the section of the mode', () => {
		expect(configs([], { status_monitor_game_resolutions: { refresh_rate: 30 } })['config/status-monitor/config.ini']).toContain('[game_resolutions]\nrefresh_rate=30\n');
	});

	it('writes the Bluetooth section of MissionControl only for a name or an address', () => {
		const ini = (changes: TuningConfig[string]) => configs(['missioncontrol'], { missioncontrol: changes })['config/MissionControl/missioncontrol.ini'];
		expect(ini({ host_address: '04:20:69:04:20:69' })).toContain('[bluetooth]\nhost_address=04:20:69:04:20:69\n\n[misc]');
		expect(ini({ enable_rumble: false })).not.toContain('[bluetooth]');
		expect(ini({ dualsense_adaptive_trigger_travel: 40 })).toContain('dualsense_adaptive_trigger_travel=40');
	});

	it('writes every setting of JKSV as valid JSON, switches as numbers', () => {
		const json = JSON.parse(configs([], { jksv: { ExportToZip: false, UIAnimationScaling: 1.25, WorkingDirectory: 'sdmc:/saves "of mine"' } })['config/JKSV/JKSV.json']);
		expect(Object.keys(json)).toEqual(CATALOG.tuning.find(group => group.id == 'jksv')!.options.map(option => option.id));
		expect(json).toMatchObject({ WorkingDirectory: 'sdmc:/saves "of mine"', ExportToZip: 0, HoldForDeletion: 1, ZipCompressionLevel: 6, UIAnimationScaling: 1.25 });
	});

	it('writes the WebDAV server of JKSV only when it is set, the login only when it is given', () => {
		const webdav = (options: TuningConfig[string]) => configs([], { jksv_webdav: options })['config/JKSV/webdav.json'];
		expect(JSON.parse(webdav({ origin: 'https://dav.example.com', basepath: '/saves/', username: 'me', password: 'hunter2' })))
			.toEqual({ origin: 'https://dav.example.com', basepath: 'saves', username: 'me', password: 'hunter2' });
		expect(JSON.parse(webdav({ origin: 'https://dav.example.com' }))).toEqual({ origin: 'https://dav.example.com' });
		expect(webdav({ username: 'me', password: 'hunter2' })).toBeUndefined();
	});

	it('writes the settings of Amiigo as it reads them', () => {
		const json = JSON.parse(configs(['amiigo'], { amiigo: { categoryMode: 2, saveAmiiboImages: true } })['config/amiigo/settings.json']);
		expect(json).toEqual({ categoryMode: 2, useRandomisedUUID: false, saveAmiiboImages: true });
	});
});
