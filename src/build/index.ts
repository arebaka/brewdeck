import Mustache from 'mustache';

import { AppearanceConfig, ComponentInfo, GameProfile, HardwareRevision, IconEntry, ImageTarget, TuningConfig, TuningValue } from '@/types';
import { Language, Translation } from '@/i18n';
import { COMPONENTS, GALLERY, HARDWARE, TUNING, isRequirementMet, isTuningOptionChanged } from '@/data';

import hekateIplIni from '@templates/sd/bootloader/hekate_ipl.ini?raw';
import nyxIni from '@templates/sd/bootloader/nyx.ini?raw';
import exosphereIni from '@templates/sd/exosphere.ini?raw';
import systemSettingsIni from '@templates/sd/atmosphere/config/system_settings.ini?raw';
import stratosphereIni from '@templates/sd/atmosphere/config/stratosphere.ini?raw';
import overrideConfigIni from '@templates/sd/atmosphere/config/override_config.ini?raw';
import nintendoHostsTxt from '@templates/sd/atmosphere/hosts/nintendo.txt?raw';
import adHostsTxt from '@templates/sd/atmosphere/hosts/advertising.txt?raw';
import teslaConfigIni from '@templates/sd/config/tesla/config.ini?raw';
import sysPatchConfigIni from '@templates/sd/config/sys-patch/config.ini?raw';
import missionControlIni from '@templates/sd/config/MissionControl/missioncontrol.ini?raw';
import statusMonitorConfigIni from '@templates/sd/config/status-monitor/config.ini?raw';
import sysFtpdConfigIni from '@templates/sd/config/sys-ftpd/config.ini?raw';
import sysClkConfigIni from '@templates/sd/config/sys-clk/config.ini?raw';
import installSh from '@templates/install.sh?raw';
import installPs1 from '@templates/install.ps1?raw';
import readmeEn from '@templates/readme/en.md?raw';
import readmeRu from '@templates/readme/ru.md?raw';

const READMES: {[lang in Language]: string} = {
	en: readmeEn,
	ru: readmeRu
};

// Boot entries in the order of hekate_ipl.ini, autoboot refers to them by 1-based index
const HEKATE_ENTRIES: IconEntry[] = ['emummc', 'sysmmc', 'stock'];

export interface BuildRequest {
	hardware: HardwareRevision;
	hosVersion: string;
	selectedComponentIDs: string[];
	tuning: TuningConfig;
	overclock: GameProfile[];
	appearance: AppearanceConfig;
	lang: Language;
	t: Translation;
	images?: Record<string, string>; // encoded images by SD path, embedded into the installers
}

export interface GeneratedFile {
	path: string;
	content: string;
}

// Image the installers write onto the SD card: a gallery image or the upload under `key`
export interface Asset {
	path: string;
	target: ImageTarget;
	key: string;
	image: string;
}

export interface BuildResult {
	configs: GeneratedFile[]; // written onto the SD card by the installers
	files: GeneratedFile[]; // artifacts the user downloads
	assets: Asset[];
	manual: ComponentInfo[]; // selected components without automatic download
}

interface ConfigSpec {
	path: string;
	template: string;
	view: (request: BuildRequest) => object;
	when?: (request: BuildRequest) => boolean;
}

const flag = (value: TuningValue) => value ? 1 : 0;
const u8 = (value: TuningValue) => value ? '0x1' : '0x0';
const u64 = (value: number) => `0x${value.toString(16)}`;
const MIB = 1024 * 1024;

// Nyx accepts backgrounds from 0x0B0B0B to 0xC7C7C7 only
function nyxBackground(color: TuningValue): string {
	const value = Math.min(Math.max(parseInt(String(color).slice(1), 16) || 0, 0x0b0b0b), 0xc7c7c7);
	return value.toString(16).padStart(6, '0');
}

function isDNSBlocked({ tuning: { dns } }: BuildRequest, target: string): boolean {
	return dns.mode == 'block' && (dns.targets as string[]).includes(target);
}

const isSelected = (request: BuildRequest, id: string) => request.selectedComponentIDs.includes(id);

// Module configs are written only when changed, so updating a card keeps what was set on the console
function isGroupChanged(request: BuildRequest, id: string): boolean {
	const group = TUNING.find(group => group.id == id)!;
	return (!group.requires || isRequirementMet(group.requires, request.selectedComponentIDs))
		&& group.options.some(option => isTuningOptionChanged(group, option, request.tuning));
}

// Icons are named after their entry, white layouts get the `_hue` suffix Nyx tints with the theme color
function iconPath(request: BuildRequest, entry: IconEntry): string | undefined {
	const image = request.appearance.icons[entry];
	if (!image) return undefined;
	const hue = GALLERY.find(item => item.target == 'icon' && item.id == image)?.hue;
	return `bootloader/res/brewdeck_${entry}${hue ? '_hue' : ''}.bmp`;
}

const CONFIGS: ConfigSpec[] = [
	{
		path: 'bootloader/hekate_ipl.ini',
		template: hekateIplIni,
		view: (request) => {
			const { hekate } = request.tuning;
			return {
				autoboot: HEKATE_ENTRIES.indexOf(hekate.autoboot as IconEntry) + 1,
				bootwait: hekate.bootwait,
				noticker: flag(hekate.noticker),
				backlight: hekate.backlight,
				autohosoff: hekate.autohosoff,
				autonogc: flag(hekate.autonogc),
				updater2p: flag(hekate.updater2p),
				bootprotect: flag(hekate.bootprotect),
				icons: Object.fromEntries(HEKATE_ENTRIES.map(entry => [entry, iconPath(request, entry)]))
			};
		}
	},
	{
		path: 'bootloader/nyx.ini',
		template: nyxIni,
		view: ({ tuning: { nyx } }) => ({
			themebg: nyxBackground(nyx.themebg),
			themecolor: nyx.themecolor,
			entries5col: flag(nyx.entries5col),
			timeoffset: flag(nyx.timeoffset),
			timedst: flag(nyx.timedst),
			homescreen: nyx.homescreen,
			verification: nyx.verification,
			umsemmcrw: flag(nyx.umsemmcrw),
			jcdisable: flag(nyx.jcdisable),
			jcforceright: flag(nyx.jcforceright),
			bpmpclock: nyx.bpmpclock
		})
	},
	{
		path: 'exosphere.ini',
		template: exosphereIni,
		view: ({ tuning: { exosphere } }) => ({
			debugmode: flag(exosphere.debugmode),
			debugmode_user: flag(exosphere.debugmode_user),
			disable_user_exception_handlers: flag(exosphere.disable_user_exception_handlers),
			enable_user_pmu_access: flag(exosphere.enable_user_pmu_access),
			enable_mem_mode: flag(exosphere.enable_mem_mode),
			blank_prodinfo_sysmmc: flag(exosphere.blank_prodinfo_sysmmc),
			blank_prodinfo_emummc: flag(exosphere.blank_prodinfo_emummc),
			allow_writing_to_cal_sysmmc: flag(exosphere.allow_writing_to_cal_sysmmc),
			log_port: exosphere.log_port,
			log_baud_rate: exosphere.log_baud_rate,
			log_inverted: flag(exosphere.log_inverted)
		})
	},
	{
		path: 'atmosphere/config/system_settings.ini',
		template: systemSettingsIni,
		view: ({ tuning: { atmosphere, dns } }) => ({
			upload_enabled: u8(atmosphere.upload_enabled),
			usb30_force_enabled: u8(atmosphere.usb30_force_enabled),
			ease_nro_restriction: u8(atmosphere.ease_nro_restriction),
			enable_sd_card_logging: u8(atmosphere.enable_sd_card_logging),
			sd_card_log_output_directory: atmosphere.sd_card_log_output_directory || 'atmosphere/binlogs',
			disable_automatic_report_cleanup: u8(atmosphere.disable_automatic_report_cleanup),
			fatal_auto_reboot_interval: u64(atmosphere.fatal_auto_reboot_interval as number),
			power_menu_reboot_function: atmosphere.power_menu_reboot_function,
			dmnt_cheats_enabled_by_default: u8(atmosphere.dmnt_cheats_enabled_by_default),
			dmnt_always_save_cheat_toggles: u8(atmosphere.dmnt_always_save_cheat_toggles),
			enable_hbl_bis_write: u8(atmosphere.enable_hbl_bis_write),
			enable_hbl_cal_read: u8(atmosphere.enable_hbl_cal_read),
			fsmitm_redirect_saves_to_sd: u8(atmosphere.fsmitm_redirect_saves_to_sd),
			enable_am_debug_mode: u8(atmosphere.enable_am_debug_mode),
			enable_dns_mitm: u8(dns.mode != 'off'),
			add_defaults_to_dns_hosts: u8(dns.add_defaults),
			enable_dns_mitm_debug_log: u8(dns.debug_log),
			enable_htc: u8(atmosphere.enable_htc),
			enable_log_manager: u8(atmosphere.enable_log_manager),
			enable_external_bluetooth_db: u8(atmosphere.enable_external_bluetooth_db),
			applet_heap_size: u64((atmosphere.applet_heap_size as number) * MIB),
			applet_heap_reservation_size: u64((atmosphere.applet_heap_reservation_size as number) * MIB)
		})
	},
	{
		path: 'atmosphere/config/stratosphere.ini',
		template: stratosphereIni,
		view: ({ tuning: { stratosphere } }) => ({
			nogc: flag(stratosphere.nogc == 'on')
		}),
		when: ({ tuning: { stratosphere } }) => stratosphere.nogc != 'auto'
	},
	{
		path: 'atmosphere/config/override_config.ini',
		template: overrideConfigIni,
		// `!` inverts a key: the Album opens hbmenu unless the key is held, mods and cheats apply unless their keys are held
		view: ({ tuning: { hbl } }) => ({
			album_key: (hbl.album ? '!' : '') + hbl.key,
			any_app: String(hbl.any_app),
			any_app_key: hbl.key,
			address_space: hbl.address_space,
			path: hbl.path || 'atmosphere/hbl.nsp',
			mods_key: hbl.mods_key,
			cheat_key: hbl.cheat_key
		})
	},
	{
		path: 'atmosphere/hosts/emummc.txt',
		template: nintendoHostsTxt,
		view: () => ({}),
		when: request => isDNSBlocked(request, 'emummc')
	},
	{
		path: 'atmosphere/hosts/sysmmc.txt',
		template: nintendoHostsTxt,
		view: () => ({}),
		when: request => isDNSBlocked(request, 'sysmmc')
	},
	{
		path: 'atmosphere/hosts/advertising.txt',
		template: adHostsTxt,
		view: () => ({})
	},
	{
		path: 'config/tesla/config.ini',
		template: teslaConfigIni,
		view: ({ tuning: { tesla } }) => ({
			key_combo: (tesla.key_combo as string[]).join('+')
		}),
		when: request => isGroupChanged(request, 'tesla') && (request.tuning.tesla.key_combo as string[]).length > 0
	},
	{
		path: 'config/sys-patch/config.ini',
		template: sysPatchConfigIni,
		view: ({ tuning: { sys_patch } }) => ({
			patch_sysmmc: flag(sys_patch.patch_sysmmc),
			patch_emummc: flag(sys_patch.patch_emummc),
			enable_logging: flag(sys_patch.enable_logging),
			version_skip: flag(sys_patch.version_skip)
		}),
		when: request => isGroupChanged(request, 'sys_patch')
	},
	{
		path: 'config/MissionControl/missioncontrol.ini',
		template: missionControlIni,
		view: ({ tuning: { missioncontrol } }) => Object.fromEntries(Object.entries(missioncontrol).map(([key, value]) => [key, String(value)])),
		when: request => isGroupChanged(request, 'missioncontrol')
	},
	{
		path: 'config/status-monitor/config.ini',
		template: statusMonitorConfigIni,
		view: ({ tuning: { status_monitor } }) => ({
			...Object.fromEntries(Object.entries(status_monitor).map(([key, value]) => [key, Array.isArray(value) ? value.join('+') : String(value)]))
		}),
		when: request => isGroupChanged(request, 'status_monitor')
	},
	{
		path: 'config/sys-ftpd/config.ini',
		template: sysFtpdConfigIni,
		view: ({ tuning: { sys_ftpd_light } }) => ({
			user: sys_ftpd_light.user,
			password: sys_ftpd_light.password,
			port: sys_ftpd_light.port,
			anonymous: flag(sys_ftpd_light.anonymous),
			pause_disabled: flag(!sys_ftpd_light.pause),
			keycombo: (sys_ftpd_light.keycombo as string[]).join('+'),
			led: flag(sys_ftpd_light.led)
		}),
		when: request => isGroupChanged(request, 'sys_ftpd_light')
	},
	{
		path: 'config/sys-clk/config.ini',
		template: sysClkConfigIni,
		view: ({ tuning: { sys_clk }, overclock }) => ({
			...sys_clk,
			profiles: overclock
				.filter(profile => Object.keys(profile.clocks).length)
				.map(profile => ({
					...profile,
					clocks: Object.entries(profile.clocks).map(([key, value]) => ({ key, value }))
				}))
		}),
		when: request => isSelected(request, 'sys_clk')
			&& (isGroupChanged(request, 'sys_clk') || request.overclock.some(profile => Object.keys(profile.clocks).length))
	}
];

function render(template: string, view: object): string {
	return Mustache.render(template, view, {}, { escape: String });
}

// Every flag is set explicitly, so a missing one never resolves from an outer context
function installSteps(comp: ComponentInfo, modchip: boolean) {
	const step = { appstore: false, zip: false, file: false, urlZip: false, urlFile: false };
	switch (comp.source) {
		case 'appstore':
			return comp.sources.appstore!.map(name => ({ ...step, appstore: true, package: name }));
		case 'github':
			return comp.sources.github!
				.filter(item => !item.modchip || modchip)
				.map(item => item.path
					? { ...step, file: true, repo: item.repo, asset: item.asset, path: item.path }
					: { ...step, zip: true, repo: item.repo, asset: item.asset, root: item.root ?? '', into: item.into ?? '' });
		case 'url':
			return comp.sources.url!.map(item => item.path
				? { ...step, urlFile: true, url: item.url, path: item.path }
				: { ...step, urlZip: true, url: item.url, root: item.root ?? '', into: item.into ?? '' });
		default:
			return [];
	}
}

function assets(request: BuildRequest): Asset[] {
	const { bootlogo, background } = request.appearance;
	return [
		...(bootlogo ? [{ path: 'bootloader/bootlogo.bmp', target: 'bootlogo' as ImageTarget, key: 'bootlogo', image: bootlogo }] : []),
		...(background ? [{ path: 'bootloader/res/background.bmp', target: 'background' as ImageTarget, key: 'background', image: background }] : []),
		...HEKATE_ENTRIES
			.filter(entry => request.appearance.icons[entry])
			.map(entry => ({ path: iconPath(request, entry)!, target: 'icon' as ImageTarget, key: `icon.${entry}`, image: request.appearance.icons[entry]! }))
	];
}

export function build(request: BuildRequest): BuildResult {
	const { t } = request;
	const hardware = HARDWARE.find(hw => hw.id == request.hardware)!;
	const selected = COMPONENTS.filter(comp => request.selectedComponentIDs.includes(comp.id));
	const manual = selected.filter(comp => comp.source == 'manual');

	const configs = CONFIGS
		.filter(config => !config.when || config.when(request))
		.map(config => ({ path: config.path, content: render(config.template, config.view(request)) }));
	const images = assets(request);

	const installerView = {
		hardware: hardware.name,
		hos: request.hosVersion,
		components: selected
			.map(comp => ({ name: comp.name, steps: installSteps(comp, hardware.is_modchip_required) }))
			.filter(comp => comp.steps.length),
		// Heredocs and here-strings add the final line break themselves
		configs: configs.map(config => ({ path: config.path, content: config.content.trimEnd() })),
		manual: manual.map(comp => ({ name: comp.name, url: comp.sources.manual })),
		hasManual: manual.length > 0,
		images: images.map(asset => ({ path: asset.path, data: request.images?.[asset.path] ?? '' })),
		hasImages: images.length > 0
	};

	const { hekate, dns } = request.tuning;
	const readmeView = {
		...installerView,
		date: new Date().toISOString().slice(0, 10),
		components: selected.map(comp => ({
			name: comp.name,
			version: comp.version,
			description: t.software[comp.id]?.description ?? ''
		})),
		manual: manual.map(comp => comp.name),
		modchip: hardware.is_modchip_required,
		autoboot: hekate.autoboot == 'off' ? '' : t.tuning.hekate.options.autoboot.values?.[hekate.autoboot as string],
		dnsBlock: dns.mode == 'block' && (dns.targets as string[]).length > 0,
		dnsTargets: (dns.targets as string[]).map(target => t.tuning.dns.options.targets.values?.[target]).join(', ')
	};

	return {
		configs,
		files: [
			{ path: 'install.sh', content: render(installSh, installerView) },
			{ path: 'install.ps1', content: render(installPs1, installerView) },
			{ path: 'README.md', content: render(READMES[request.lang], readmeView) }
		],
		assets: images,
		manual
	};
}
