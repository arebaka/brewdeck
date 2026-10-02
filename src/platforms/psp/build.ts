import { PspState, TuningValue } from '@/types';
import { Language } from '@/i18n';
import { HARDWARE } from '@/data';
import { BuildRequest, BuildResult, ConfigSpec, installerView, installers, render, renderConfigs } from '@/build';
import { readmeEn, readmeRu, readmeUk, settingsTxt, pluginsTxt, hotspotTxt } from '@templates/psp';
import { COMPONENTS, isFirmwareSupported, pluginScope, selectedPlugins } from './data';

type Request = BuildRequest<PspState>;

const READMES: {[lang in Language]: string} = {
	en: readmeEn,
	ru: readmeRu,
	uk: readmeUk
};

const onOff = (value: TuningValue) => value ? 'on' : 'off';

// A setting with modes as the settings menu of ARK writes it: off, plain on or `key:mode`
const mode = (key: string, value: TuningValue, plain = 'on') => value == 'off'
	? `always, ${key}, off`
	: `always, ${value == plain ? key : `${key}:${value}`}, on`;

// Lines of the plugins file: runlevels, path relative to the file, on, or `always` and off for a plugin left off
const pluginLines = (request: Request) => selectedPlugins(request.selectedComponentIDs).map(comp => {
	const scope = pluginScope(request, comp);
	return { runlevel: scope.join(' ') || 'always', path: comp.plugin!.path, state: onOff(scope.length) };
});

const CONFIGS: ConfigSpec<Request>[] = [
	{
		path: 'PSP/SAVEDATA/ARK_01234/SETTINGS.TXT',
		template: settingsTxt,
		view: ({ tuning: { clock, memory, xmb, device, go } }) => ({
			usbcharge: onOff(clock.usbcharge),
			// The same clock in games and the XMB takes one line, 0 leaves the clock alone
			clock: clock.game == clock.vsh
				? (clock.game ? [`always, cpuclock:${clock.game}, on`] : [])
				: [
					...(clock.game ? [`game, cpuclock:${clock.game}, on`] : []),
					...(clock.vsh ? [`vsh, cpuclock:${clock.vsh}, on`] : [])
				],
			wpa2: onOff(device.wpa2),
			launcher: onOff(xmb.launcher),
			highmem: mode('highmem', memory.highmem),
			mscache: mode('mscache', memory.mscache),
			infernocache: mode('infernocache', memory.infernocache),
			disablepause: onOff(go.disablepause),
			oldplugin: onOff(go.oldplugin),
			hibblock: onOff(go.hibblock),
			skiplogos: mode('skiplogos', xmb.skiplogos, 'all'),
			hidepics: mode('hidepics', xmb.hidepics, 'all'),
			hidemac: onOff(device.hidemac),
			hidedlc: onOff(xmb.hidedlc),
			noled: onOff(device.noled),
			noumd: onOff(device.noumd),
			deadef: onOff(go.deadef),
			noanalog: onOff(device.noanalog),
			vitamute: onOff(device.vitamute),
			qaflags: onOff(xmb.qaflags),
			region: xmb.region == 'off' ? undefined : xmb.region
		})
	},
	{
		// ARK also reads the plugins file of its own folder, which FasterARK overwrites on every install
		path: 'SEPLUGINS/PLUGINS.TXT',
		template: pluginsTxt,
		view: request => ({ plugins: pluginLines(request) }),
		when: request => selectedPlugins(request.selectedComponentIDs).length > 0
	},
	{
		path: 'SEPLUGINS/hotspot.txt',
		template: hotspotTxt,
		view: ({ tuning: { aemu } }) => ({ hotspot: aemu.hotspot }),
		when: ({ selectedComponentIDs, tuning: { aemu } }) => selectedComponentIDs.includes('aemu') && aemu.hotspot != ''
	}
];

// The installers, their readme and every config they write, for the chosen build
export function build(request: Request): BuildResult {
	const { t } = request;
	const hardware = HARDWARE.find(hw => hw.id == request.hardware)!;
	const selected = COMPONENTS.filter(comp => request.selectedComponentIDs.includes(comp.id));
	const manual = selected.filter(comp => comp.source == 'manual');

	const configs = renderConfigs(CONFIGS, request);
	const view = {
		...installerView(request, hardware, selected, configs, []),
		title: `${hardware.name}, firmware ${request.firmware}`,
		card: 'Memory Stick',
		console: 'PSP'
	};

	const runlevels = t.pages.plugins.runlevels;
	const readmeView = {
		...view,
		firmware: request.firmware,
		date: new Date().toISOString().slice(0, 10),
		components: selected.map(comp => ({
			name: comp.name,
			version: comp.version,
			description: t.software.psp[comp.id]?.description ?? ''
		})),
		manual: manual.map(comp => comp.name),
		update: !isFirmwareSupported(request.firmware) && request.selectedComponentIDs.includes('update661'),
		go: request.hardware == 'pspgo',
		plugins: selectedPlugins(request.selectedComponentIDs).map(comp => ({
			name: comp.name,
			runlevels: pluginScope(request, comp).map(level => runlevels[level]).join(', ') || t.pages.plugins.off
		})),
		hasPlugins: selectedPlugins(request.selectedComponentIDs).length > 0
	};

	return {
		configs,
		files: [...installers(view), { path: 'README.md', content: render(READMES[request.lang], readmeView) }],
		assets: [],
		manual
	};
}
