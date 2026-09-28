import Mustache from 'mustache';

import { ComponentInfo, HardwareRevision, TuningConfig, TuningValue } from '@/types';
import { Language, Translation } from '@/i18n';
import { COMPONENTS, HARDWARE } from '@/data';

import hekateIplIni from '@/templates/sd/bootloader/hekate_ipl.ini?raw';
import nyxIni from '@/templates/sd/bootloader/nyx.ini?raw';
import exosphereIni from '@/templates/sd/exosphere.ini?raw';
import systemSettingsIni from '@/templates/sd/atmosphere/config/system_settings.ini?raw';
import overrideConfigIni from '@/templates/sd/atmosphere/config/override_config.ini?raw';
import nintendoHostsTxt from '@/templates/sd/atmosphere/hosts/nintendo.txt?raw';
import teslaConfigIni from '@/templates/sd/config/tesla/config.ini?raw';
import installSh from '@/templates/install.sh?raw';
import installPs1 from '@/templates/install.ps1?raw';
import readmeEn from '@/templates/readme/en.md?raw';
import readmeRu from '@/templates/readme/ru.md?raw';

const READMES: {[lang in Language]: string} = {
	en: readmeEn,
	ru: readmeRu
};

// Boot entries in the order of hekate_ipl.ini, autoboot refers to them by 1-based index
const HEKATE_ENTRIES = ['emummc', 'sysmmc', 'stock'];

export interface BuildRequest {
	hardware: HardwareRevision;
	hosVersion: string;
	selectedComponentIDs: string[];
	tuning: TuningConfig;
	lang: Language;
	t: Translation;
}

export interface GeneratedFile {
	path: string;
	content: string;
}

export interface BuildResult {
	configs: GeneratedFile[]; // written onto the SD card by the installers
	files: GeneratedFile[]; // artifacts the user downloads
	manual: ComponentInfo[]; // selected components without install instructions
}

interface ConfigSpec {
	path: string;
	template: string;
	view: (request: BuildRequest) => object;
	when?: (request: BuildRequest) => boolean;
}

const flag = (value: TuningValue) => value ? 1 : 0;
const u8 = (value: TuningValue) => value ? '0x1' : '0x0';

// Nyx accepts backgrounds from 0x0B0B0B to 0xC7C7C7 only
function nyxBackground(color: TuningValue): string {
	const value = Math.min(Math.max(parseInt(String(color).slice(1), 16) || 0, 0x0b0b0b), 0xc7c7c7);
	return value.toString(16).padStart(6, '0');
}

function isDNSBlocked({ tuning: { dns } }: BuildRequest, target: string): boolean {
	return dns.mode == 'block' && (dns.targets as string[]).includes(target);
}

const CONFIGS: ConfigSpec[] = [
	{
		path: 'bootloader/hekate_ipl.ini',
		template: hekateIplIni,
		view: ({ tuning: { hekate } }) => ({
			autoboot: HEKATE_ENTRIES.indexOf(hekate.autoboot as string) + 1,
			bootwait: hekate.bootwait,
			backlight: hekate.backlight,
			autohosoff: hekate.autohosoff,
			autonogc: flag(hekate.autonogc),
			updater2p: flag(hekate.updater2p),
			bootprotect: flag(hekate.bootprotect)
		})
	},
	{
		path: 'bootloader/nyx.ini',
		template: nyxIni,
		view: ({ tuning: { nyx } }) => ({
			themebg: nyxBackground(nyx.themebg),
			themecolor: nyx.themecolor,
			entries5col: flag(nyx.entries5col),
			homescreen: nyx.homescreen,
			verification: nyx.verification
		})
	},
	{
		path: 'exosphere.ini',
		template: exosphereIni,
		view: ({ tuning: { exosphere } }) => ({
			blank_prodinfo_sysmmc: flag(exosphere.blank_prodinfo_sysmmc),
			blank_prodinfo_emummc: flag(exosphere.blank_prodinfo_emummc)
		})
	},
	{
		path: 'atmosphere/config/system_settings.ini',
		template: systemSettingsIni,
		view: ({ tuning: { atmosphere, dns } }) => ({
			upload_enabled: u8(atmosphere.upload_enabled),
			usb30_force_enabled: u8(atmosphere.usb30_force_enabled),
			power_menu_reboot_function: atmosphere.power_menu_reboot_function,
			dmnt_cheats_enabled_by_default: u8(atmosphere.dmnt_cheats_enabled_by_default),
			dmnt_always_save_cheat_toggles: u8(atmosphere.dmnt_always_save_cheat_toggles),
			enable_dns_mitm: u8(dns.mode != 'off'),
			enable_external_bluetooth_db: u8(atmosphere.enable_external_bluetooth_db)
		})
	},
	{
		path: 'atmosphere/config/override_config.ini',
		template: overrideConfigIni,
		// `!` inverts a key: the Album opens hbmenu unless the key is held
		view: ({ tuning: { hbl } }) => ({
			album_key: (hbl.album ? '!' : '') + hbl.key,
			any_app: String(hbl.any_app),
			any_app_key: hbl.key
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
		path: 'config/tesla/config.ini',
		template: teslaConfigIni,
		view: ({ tuning: { tesla } }) => ({
			key_combo: (tesla.key_combo as string[]).join('+')
		}),
		when: ({ selectedComponentIDs, tuning: { tesla } }) =>
			selectedComponentIDs.includes('ovlmenu') && (tesla.key_combo as string[]).length > 0
	}
];

function render(template: string, view: object): string {
	return Mustache.render(template, view, {}, { escape: String });
}

export function build(request: BuildRequest): BuildResult {
	const { t } = request;
	const hardware = HARDWARE.find(hw => hw.id == request.hardware)!;
	const selected = COMPONENTS.filter(comp => request.selectedComponentIDs.includes(comp.id));
	const manual = selected.filter(comp => !comp.install);

	const configs = CONFIGS
		.filter(config => !config.when || config.when(request))
		.map(config => ({ path: config.path, content: render(config.template, config.view(request)) }));

	const installerView = {
		hardware: hardware.name,
		hos: request.hosVersion,
		components: selected
			.filter(comp => comp.install)
			.map(comp => ({
				name: comp.name,
				items: comp.install!
					.filter(item => !item.modchip || hardware.is_modchip_required)
					.map(item => ({ repo: item.repo, asset: item.asset, root: item.root ?? '', path: item.path ?? '' }))
			})),
		// Heredocs and here-strings add the final line break themselves
		configs: configs.map(config => ({ path: config.path, content: config.content.trimEnd() })),
		manual: manual.map(comp => comp.name),
		hasManual: manual.length > 0
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
		manual
	};
}

export async function zipFiles(files: GeneratedFile[]): Promise<Blob> {
	const JSZip = (await import('jszip')).default;
	const zip = new JSZip();
	files.forEach(file => zip.file(file.path, file.content, {
		unixPermissions: file.path.endsWith('.sh') ? 0o755 : 0o644
	}));
	return zip.generateAsync({ type: 'blob', platform: 'UNIX' });
}
