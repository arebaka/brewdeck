// Clicks through every step of BrewDeck in headless Chrome and checks what the user sees.
// Usage: npm run test:ui, set CHROME when the browser is not on the PATH

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createServer } from 'vite';

const BROWSERS = ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser'];

// Chrome DevTools Protocol over the WebSocket of a page
class Page {
	socket: WebSocket;
	id = 0;
	pending = new Map<number, (message: any) => void>();
	console: string[] = [];

	constructor(socket: WebSocket) {
		this.socket = socket;
		socket.onmessage = event => {
			const message = JSON.parse(String(event.data));
			if (this.pending.has(message.id)) {
				this.pending.get(message.id)!(message);
				this.pending.delete(message.id);
			} else if (message.method == 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
				this.console.push(`${message.params.type}: ${message.params.args.map((arg: any) => arg.value ?? arg.description).join(' ')}`);
			} else if (message.method == 'Runtime.exceptionThrown') {
				this.console.push(`exception: ${message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text}`);
			}
		};
	}

	send(method: string, params: object = {}): Promise<any> {
		return new Promise((resolve, reject) => {
			this.pending.set(++this.id, message => message.error ? reject(new Error(message.error.message)) : resolve(message.result));
			this.socket.send(JSON.stringify({ id: this.id, method, params }));
		});
	}

	async evaluate(expression: string): Promise<unknown> {
		const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
		if (result.exceptionDetails) {
			throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
		}
		return result.result.value;
	}

	// Runs an action and lets React render
	async act(expression: string): Promise<void> {
		await this.evaluate(expression);
		await sleep(250);
	}
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Shortcuts available to the checks inside the page
const HELPERS = `
	window.$$ = selector => [...document.querySelectorAll(selector)];
	window.byText = (selector, text) => $$(selector).find(node => node.textContent.trim() == text);
	window.step = name => byText('.sidebar .step .label', name).closest('button').click();
	window.setField = (node, value) => {
		const prototype = node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
		Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value);
		node.dispatchEvent(new Event(node instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
	};
	window.key = (node, key) => node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
`;

function findBrowser(): string {
	const browser = process.env.CHROME ?? BROWSERS.find(name => spawnSync('sh', ['-c', `command -v ${name}`]).status == 0);
	if (!browser) {
		throw new Error(`No Chrome found: install one of ${BROWSERS.join(', ')} or set CHROME`);
	}
	return browser;
}

// Chrome tells the port of its DevTools on the standard error once it listens
function launchBrowser(profile: string) {
	const browser = spawn(findBrowser(), [
		'--headless=new',
		'--disable-gpu',
		'--no-first-run',
		'--no-default-browser-check',
		'--hide-scrollbars',
		'--remote-debugging-port=0',
		`--user-data-dir=${profile}`,
		...(process.getuid?.() == 0 ? ['--no-sandbox'] : []),
		'about:blank'
	]);
	const port = new Promise<number>((resolve, reject) => {
		let output = '';
		browser.stderr.on('data', chunk => {
			output += chunk;
			const match = output.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
			if (match) resolve(Number(match[1]));
		});
		browser.on('exit', code => reject(new Error(`Chrome exited with ${code}: ${output}`)));
	});
	return { browser, port };
}

// Embedded images of an installer as bitmap headers
function embeddedImages(script: string) {
	return [...script.matchAll(/write_image '([^']+)' << 'BREWDECK_EOF'\n([\s\S]*?)\nBREWDECK_EOF/g)].map(([, path, data]) => {
		const bitmap = gunzipSync(Buffer.from(data, 'base64'));
		const alpha = new Set(Array.from({ length: (bitmap.length - 54) / 4 }, (_, i) => bitmap[54 + i * 4 + 3]));
		return {
			path,
			magic: bitmap.toString('ascii', 0, 2),
			width: bitmap.readInt32LE(18),
			height: bitmap.readInt32LE(22),
			bpp: bitmap.readUInt16LE(28),
			isOpaque: alpha.size == 1 && alpha.has(255)
		};
	});
}

async function run(page: Page, url: string, downloads: string): Promise<number> {
	let failures = 0;
	const check = async (name: string, expression: string) => {
		let value: unknown;
		try {
			value = await page.evaluate(expression);
		} catch (error) {
			value = String(error);
		}
		console.log(`${value === true ? 'ok  ' : 'FAIL'} ${name}${value === true ? '' : ` → ${JSON.stringify(value)}`}`);
		if (value !== true) failures++;
	};
	const expect = (name: string, isTrue: boolean, detail?: unknown) => {
		console.log(`${isTrue ? 'ok  ' : 'FAIL'} ${name}${isTrue ? '' : ` → ${JSON.stringify(detail)}`}`);
		if (!isTrue) failures++;
	};

	await page.send('Runtime.enable');
	await page.send('Page.enable');
	// A headless page has no focus of its own, so focus events would never fire
	await page.send('Emulation.setFocusEmulationEnabled', { enabled: true });
	await page.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
	await page.send('Page.navigate', { url });
	await sleep(3000);
	await page.evaluate(HELPERS);

	// Hardware
	// The photo is titled with the size of the console, drawn at the 96 pixels per inch browsers assume on Linux
	await check('the console is as wide as the real one', `(() => {
		const photo = document.querySelector('.preview .photo');
		return Math.abs(photo.getBoundingClientRect().width - parseFloat(photo.title) / 25.4 * 96) < 1;
	})()`);

	// Software
	await page.act(`step('Software')`);
	await page.act(`byText('.batch .choice', 'Minimal').click()`);
	await check('a preset replaces the selection and stays marked', `byText('.batch .choice.active', 'Minimal') != null
		&& location.search.includes('sw=') && !location.search.includes('sys_patch')`);
	await page.act(`byText('.batch .choice', 'Recommended').click()`);
	await page.act(`byText('.component .name', 'Moonlight').closest('.component').click()`);
	await check('a hand edit turns into a custom selection', `document.querySelector('.choice.custom') != null && location.search.includes('moonlight')`);
	await page.act(`byText('.component .name', 'Atmosphere').closest('.component').click()`);
	await check('required components stay', `byText('.component .name', 'Atmosphere').closest('.component').classList.contains('active')`);
	await check('Daybreak opens the utilities and is required with Atmosphere', `(() => {
		const daybreak = byText('.component .name', 'Daybreak').closest('.component');
		return daybreak.parentElement.firstElementChild == daybreak && daybreak.querySelector('.badge.required') != null;
	})()`);
	await page.act(`byText('.component .name', 'FPSLocker').closest('.component').click()`);
	await page.act(`byText('.component .name', 'SaltyNX').closest('.component').click()`);
	await check('a removed dependency leaves a fix', `$$('.notice .fix').some(button => button.textContent == 'Add SaltyNX')`);
	await page.act(`$$('.notice .fix').find(button => button.textContent == 'Add SaltyNX').click()`);
	await check('the fix brings it back', `byText('.component .name', 'SaltyNX').closest('.component').classList.contains('active')`);
	await page.act(`byText('.component .name', 'Tesla Menu').closest('.component').click()`);
	await check('a conflict offers to remove either side', `['Remove Tesla Menu', 'Remove Ultrahand'].every(text => $$('.notice .fix').some(button => button.textContent == text))`);
	// The list of the step may be scrolled away, so the issue a click brings pops up
	await check('the conflict pops up with its fixes', `(() => {
		const toast = document.querySelector('.toasts .toast.warning');
		return toast?.querySelector('.text').textContent == 'Tesla Menu conflicts with Ultrahand'
			&& $$('.toast .fix').map(button => button.textContent).join() == 'Remove Tesla Menu,Remove Ultrahand';
	})()`);
	await page.act(`$$('.toast .fix').find(button => button.textContent == 'Remove Ultrahand').click()`);
	await check('the chosen side goes away', `(() => {
		const active = name => byText('.component .name', name).closest('.component').classList.contains('active');
		return !active('Ultrahand') && active('Tesla Menu');
	})()`);
	await check('and the toast with it', `document.querySelector('.toast') == null`);
	await page.act(`byText('.component .name', 'Checkpoint').closest('.component').click()`);
	await check('an overlap pops up too and goes away by its button', `document.querySelector('.toast.info .text')?.textContent == 'JKSV covers Checkpoint, one of them is enough'`);
	await page.act(`document.querySelector('.toast .dismiss').click()`);
	await check('the dismissed toast leaves the issue in the list', `document.querySelector('.toast') == null
		&& $$('.advices .notice').some(notice => notice.textContent.startsWith('JKSV covers Checkpoint'))`);

	await page.act(`byText('.component .name', 'DBIPatcher').closest('.component').click()`);
	await check('a risky component is marked and warned about', `byText('.component .name', 'DBIPatcher').closest('.component').querySelector('.badge.warning') != null
		&& $$('.notice').some(notice => notice.textContent.includes('The author of DBI warns'))`);

	// Launch
	await check('payloads moved off the Software step', `byText('.component .name', 'Lockpick RCM') == null`);
	await page.act(`step('Launch')`);
	await check('payloads are picked on the Launch step', `byText('.component .name', 'Lockpick RCM') != null`);
	await page.act(`byText('.row .name', 'CFW (sysMMC)').closest('.switch').click()`);
	await check('a boot mode leaves the menu', `location.search.includes('boot=emummc,stock') && byText('.choices .choice', 'CFW (sysMMC)') == null`);
	const folder = `document.querySelector('.add input')`;
	await page.act(`setField(${folder}, 'sd01/..')`);
	await check('an emuMMC folder keeps safe characters in upper case', `${folder}.value == 'SD01'`);
	await page.act(`key(${folder}, 'Enter')`);
	await check('another emuMMC gets an entry', `location.search.includes('emummc=SD01') && byText('.row .name', 'CFW (emuMMC SD01)') != null`);
	await page.act(`setField(${folder}, 'RAW1')`);
	await page.act(`key(${folder}, 'Enter')`);
	// Choice of an Exosphere key under the entry
	const override = (entry: string, label: string, value: string) => `[...byText('.row .name', '${entry}').closest('.row').querySelectorAll('.override')]
		.find(item => item.querySelector('.label').textContent == '${label}').querySelectorAll('.choice')[${['as configured', 'on', 'off'].indexOf(value)}]`;
	await page.act(`${override('CFW (emuMMC SD01)', 'USB 3.0', 'on')}.click()`);
	await check('an entry overrides an Exosphere key', `location.search.includes('launch.emummc-SD01.usb3force=1')
		&& byText('.row .name', 'CFW (emuMMC SD01)').closest('.row').querySelector('.keys').textContent.includes('usb3force=1')`);
	await page.act(`${override('CFW (emuMMC RAW1)', 'Boot config memory mode', 'off')}.click()`);
	await page.act(`byText('.row .name', 'CFW (emuMMC RAW1)').closest('.row').querySelector('.control').click()`);
	await check('a removed emuMMC takes its keys along', `!location.search.includes('RAW1') && location.search.includes('emummc=SD01')`);
	await check('the boot screen delay is set with the menu', `byText('.row .name', 'Boot screen delay') != null`);
	await page.act(`byText('.component .name', 'CommonProblemResolver').closest('.component').click()`);
	await page.act(`byText('.choices .choice', 'CommonProblemResolver').click()`);
	await check('a payload can boot on its own', `location.search.includes('autoboot=common_problem_resolver')`);

	// CFW
	await page.act(`step('CFW')`);
	await check('every option is shown at once', `$$('.row .name').length > 20 && !$$('.batch .control').some(button => /ADVANCED/.test(button.textContent))`);
	await check('the boot screen delay left the step', `byText('.row .name', 'Boot screen delay') == null`);
	await check('buttons are drawn in their shapes', `$$('.buttons .button.trigger').length > 0 && $$('.buttons .button.face').length > 0`);
	await page.act(`byText('.row .name', 'Button').closest('.row').querySelector('.button.trigger.left').click()`);
	await check('a button picks the key', `location.search.includes('hbl.key=ZL')`);
	await page.act(`byText('.batch .control', 'RESET').click()`);
	await check('reset clears the step', `!location.search.includes('hbl.')`);

	// Security
	await page.act(`step('Security')`);
	const baudRate = `byText('.row .name', 'Log baud rate').closest('.row').querySelector('input')`;
	await page.act(`setField(${baudRate}, '9600')`);
	await check('a number field reaches the link', `location.search.includes('exosphere.log_baud_rate=9600')`);
	await page.act(`setField(${baudRate}, '99999999')`);
	await check('a number out of range is not taken', `location.search.includes('exosphere.log_baud_rate=9600')`);
	await page.act(`byText('.batch .control', 'RESET').click()`);
	await check('reset clears only its step', `!location.search.includes('exosphere.') && location.search.includes('launch.emummc-SD01.usb3force=1')`);

	// Plugins
	await page.act(`step('Plugins')`);
	await check('the settings of selected plugins are listed', `$$('.tuning > .header .title').length > 0`);
	await page.act(`byText('.row .choice', 'Українська').click()`);
	await check('the translation of DBI takes a language', `location.search.includes('dbi_patcher.language=ua')`);

	// Overclock
	await page.act(`step('Overclock')`);
	await check('there are no games yet', `document.querySelector('.games .empty') != null`);
	await page.act(`setField(document.querySelector('.add select'), '0100F2C0115B6000')`);
	await check('a game comes from the list', `$$('.game').length == 1 && document.querySelector('.add select').value == ''`);
	const titleId = `document.querySelector('.add input')`;
	await page.act(`setField(${titleId}, 'abcdef01-23456789zz')`);
	await check('the title ID keeps hex only', `${titleId}.value == 'ABCDEF0123456789'`);
	await page.act(`key(${titleId}, 'Escape')`);
	await check('Escape in a field stays on the step', `byText('.sidebar .step.active .label', 'Overclock') != null`);
	await page.act(`key(${titleId}, 'Enter')`);
	await check('Enter adds the title ID', `$$('.game').length == 2 && ${titleId}.value == ''`);
	await page.act(`byText('.game .choice', 'Performance').click()`);
	await check('a template fills the table', `$$('.game')[0].querySelector('select').value == '1785' && location.search.includes('0100F2C0115B6000.performance')`);
	await page.act(`setField($$('.game')[0].querySelectorAll('select')[1], '')`);
	await check('editing a cell makes the profile custom', `$$('.game')[0].querySelector('.choice.active').textContent == 'Custom'`);
	await page.act(`byText('.apply .choice', 'Battery saver').click()`);
	await check('a template applies to every game', `$$('.game').every(game => game.querySelector('.choice.active').textContent == 'Battery saver')`);
	await page.act(`byText('.game .control', 'Remove').click()`);
	await check('a game goes away', `$$('.game').length == 1`);

	// Appearance
	await page.act(`step('Appearance')`);
	// Tile of a gallery picture by its ID, whatever the order of the gallery
	const tile = (target: string, id: string) => `document.querySelector('.gallery.${target} img[alt="${id}"]').closest('.picture')`;
	await page.act(`${tile('bootlogo', 'hekate-a')}.click()`);
	await check('a gallery image reaches the link', `location.search.includes('img.bootlogo=hekate-a')`);
	// Picture on the preview of the console screen
	const shown = (target: string) => `document.querySelector('.screen.${target} img')?.src.split('/appearance/')[1]`;
	await check('the boot screen is previewed on the screen of the console in its real size', `(() => {
		const screen = document.querySelector('.screen.bootlogo');
		const width = Math.min(6.2 * 16 / Math.hypot(16, 9) * 96, screen.parentElement.clientWidth - 16);
		return Math.abs(screen.getBoundingClientRect().width - width) < 1 && ${shown('bootlogo')} == 'bootlogo/hekate-a.png';
	})()`);
	await page.act(`${tile('bootlogo', 'hekate-b')}.focus()`);
	await check('the screen shows the picture in focus', `${shown('bootlogo')} == 'bootlogo/hekate-b.png'`);
	await page.act(`${tile('bootlogo', 'hekate-b')}.blur()`);
	await check('and returns to the chosen one', `${shown('bootlogo')} == 'bootlogo/hekate-a.png'`);
	await check('the background without a picture takes the theme color of Nyx', `${shown('background')} == null
		&& getComputedStyle(document.querySelector('.screen.background')).backgroundColor == 'rgb(45, 45, 45)'`);
	await check('more pictures are a link away', `$$('.appearance .thread').length == 3 && $$('.appearance .thread')[2].href.includes('nyx-custom-icon-thread')`);
	// Chips of the entries in the section of the target
	const chip = (target: string, name: string) => `[...document.querySelector('.gallery.${target}').closest('.appearance').querySelectorAll('.choice')]
		.find(chip => chip.textContent == '${name}')`;
	await page.act(`${chip('bootlogo', 'CFW (emuMMC SD01)')}.click()`);
	await check('an entry starts from the common boot screen', `document.querySelector('.gallery.bootlogo .picture.active').textContent == 'Common'
		&& ${shown('bootlogo')} == 'bootlogo/hekate-a.png'`);
	await page.act(`${tile('bootlogo', 'hekate-b')}.click()`);
	await check('an entry takes a boot screen of its own', `location.search.includes('img.logo.emummc-SD01=hekate-b')
		&& ${chip('bootlogo', 'CFW (emuMMC SD01)')}.classList.contains('set') && location.search.includes('img.bootlogo=hekate-a')
		&& ${shown('bootlogo')} == 'bootlogo/hekate-b.png'`);
	await page.act(`${tile('icon', 'hekate-switch')}.click()`);
	await check('the first entry gets the icon', `location.search.includes('img.icon.emummc=hekate-switch')`);
	await page.act(`${chip('icon', 'Lockpick RCM')}.click()`);
	await page.act(`${tile('icon', 'hekate-payload')}.click()`);
	await check('a payload gets an icon too', `location.search.includes('img.icon.lockpick_rcm=hekate-payload')`);

	// Keyboard
	await page.act(`document.activeElement.blur(); key(document.body, 'Escape')`);
	await check('Escape goes back', `byText('.sidebar .step.active .label', 'Overclock') != null`);
	await page.act(`key(document.body, 'Enter')`);
	await check('Enter goes forward', `byText('.sidebar .step.active .label', 'Appearance') != null`);

	// Build
	await page.act(`step('Build')`);
	await sleep(1500);
	await check('the readme is rendered', `document.querySelector('.readme h1')?.textContent.startsWith('BrewDeck') && $$('.readme li').length > 5`);
	await check('generated files are highlighted', `document.querySelector('.generated .code .hljs-keyword') != null`);
	await check('the installers are ready', `$$('.files .row.interactive').length == 3`);
	await page.act(`byText('.generated .choice', 'bootloader/hekate_ipl.ini').click()`);
	await check('the Launch menu reaches hekate_ipl.ini', `(() => {
		const ini = document.querySelector('.generated .code').textContent;
		return ini.includes('[Lockpick RCM]') && !ini.includes('[CFW (sysMMC)]') && /autoboot=\\d/.test(ini)
			&& ini.includes('[CFW (emuMMC SD01)]') && ini.includes('emupath=emuMMC/SD01') && ini.includes('usb3force=1')
			&& ini.includes('logopath=bootloader/res/brewdeck_emummc-SD01_logo.bmp') && ini.includes('icon=bootloader/res/brewdeck_lockpick_rcm_hue.bmp')
			&& !ini.includes('RAW1');
	})()`);
	await page.act(`byText('.generated .choice', 'config/sys-clk/config.ini').click()`);
	await check('the sys-clk profile is previewed', `document.querySelector('.generated .code').textContent.includes('[ABCDEF0123456789]')`);
	await page.act(`byText('.files .row .name', 'install.sh').closest('.row').click()`);
	await page.act(`byText('.files .row .name', 'install.ps1').closest('.row').click()`);
	await sleep(1000);

	const installer = readFileSync(join(downloads, 'install.sh'), 'utf8');
	expect('the installer fetches the translation in the chosen language', installer.includes("'^translation_ua\\.bin$'"));
	const images = embeddedImages(installer);
	expect('the installer embeds the boot screen rotated and opaque', images.some(image =>
		image.path == 'bootloader/bootlogo.bmp' && image.magic == 'BM' && image.bpp == 32 && image.width == 50 && image.height == 204 && image.isOpaque), images);
	expect('the installer embeds the icon with its transparency', images.some(image =>
		image.path == 'bootloader/res/brewdeck_emummc_hue.bmp' && image.width == 192 && image.height == 192 && !image.isOpaque), images);
	expect('the installer embeds the boot screen of an entry', images.some(image =>
		image.path == 'bootloader/res/brewdeck_emummc-SD01_logo.bmp' && image.magic == 'BM' && image.bpp == 32 && image.isOpaque), images);
	expect('the installer embeds the icon of a payload', images.some(image => image.path == 'bootloader/res/brewdeck_lockpick_rcm_hue.bmp'), images);
	expect('install.ps1 starts with a byte order mark', readFileSync(join(downloads, 'install.ps1')).subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])));

	await page.act(`byText('.lang-switch button', 'ru').click()`);
	await check('the language changes in place', `byText('.sidebar .step.active .label', 'Сборка') != null && document.documentElement.lang == 'ru'`);
	await page.act(`byText('.lang-switch button', 'ua').click()`);
	await check('Ukrainian is there too', `byText('.sidebar .step.active .label', 'Збірка') != null && document.documentElement.lang == 'uk'`);

	// PSP
	await page.act(`byText('.lang-switch button', 'en').click()`);
	await page.act(`step('Hardware')`);
	await page.act(`byText('.consoles .item .name', 'PSP-3000').closest('.item').click()`);
	await check('a PSP turns the page into its own', `document.documentElement.dataset.platform == 'psp' && location.search.startsWith('?hw=psp3000&fw=6.61&sw=')
		&& document.querySelector('.topbar .subtitle').textContent == 'PSP custom firmware builder'
		&& getComputedStyle(document.body).fontFamily.includes('M PLUS 1p')`);
	await check('a PSP goes through steps of its own', `$$('.sidebar .step .label').map(label => label.textContent).join() == 'Hardware,Firmware,Software,CFW,Plugins,Build'`);
	await check('the steps of a PSP are categories of its XMB', `$$('.sidebar .step .icon').every(icon => getComputedStyle(icon).display != 'none')
		&& new Set($$('.sidebar .step').map(step => Math.round(step.getBoundingClientRect().top))).size == 1`);
	await check('the buttons of a PSP show its symbols', `$$('.controls .glyph').length > 0 && $$('.controls .glyph').every(glyph => glyph.querySelector('svg'))`);
	await page.act(`step('Firmware')`);
	// The strip slides for .3s
	await sleep(400);
	await check('the active category keeps its place', `(() => {
		const strip = document.querySelector('.sidebar .steps');
		const left = strip.getBoundingClientRect().left + parseFloat(getComputedStyle(strip).paddingLeft);
		return Math.abs(document.querySelector('.sidebar .step.active').getBoundingClientRect().left - left) < 1;
	})()`);
	await page.act(`byText('.item .name', '6.35').closest('.item').click()`);
	await check('an old firmware takes the official update', `$$('.notice .fix').some(button => button.textContent == 'Add System Update 6.61')`);
	await page.act(`$$('.notice .fix').find(button => button.textContent == 'Add System Update 6.61').click()`);
	await check('the update solves it', `$$('.notice').length == 0 && location.search.includes('update661')`);
	await page.act(`step('Plugins')`);
	await page.act(`byText('.row .name', 'Game Categories Lite').closest('.row').querySelectorAll('.choice')[2].click()`);
	await check('a plugin takes another runlevel', `location.search.includes('plugin.gclite=vsh,game')
		&& byText('.row .name', 'Game Categories Lite').closest('.row').querySelector('.keys').textContent == 'vsh game, gclite/category_lite.prx, on'`);
	await page.act(`step('Build')`);
	await sleep(1000);
	await page.act(`byText('.generated .choice', 'SEPLUGINS/PLUGINS.TXT').click()`);
	await check('the plugins reach PLUGINS.TXT', `document.querySelector('.generated .code').textContent.includes('vsh game, gclite/category_lite.prx, on')`);
	await check('the readme asks for the update first', `document.querySelector('.readme').textContent.includes('PSP Update ver 6.61')`);
	await page.act(`step('Hardware')`);
	await page.act(`byText('.consoles .item .name', 'Erista (V1)').closest('.item').click()`);
	await check('the Switch keeps its build', `document.documentElement.dataset.platform == 'switch' && location.search.includes('emummc=SD01')`);
	await check('the Switch keeps its side bar and letters', `$$('.sidebar .step .icon').every(icon => getComputedStyle(icon).display == 'none')
		&& $$('.controls .glyph').every(glyph => !glyph.querySelector('svg') && /^[A-Z]$/.test(glyph.textContent))`);

	expect('the console stays clean', page.console.length == 0, page.console);
	return failures;
}

async function main() {
	const temporary = mkdtempSync(join(tmpdir(), 'brewdeck-ui-'));
	const downloads = join(temporary, 'downloads');
	const server = await createServer({ logLevel: 'error', server: { host: '127.0.0.1', port: 0, open: false } });
	const { browser, port } = launchBrowser(join(temporary, 'profile'));

	try {
		await server.listen();
		const url = server.resolvedUrls!.local[0];
		const target = await (await fetch(`http://127.0.0.1:${await port}/json/new?about:blank`, { method: 'PUT' })).json();
		const socket = new WebSocket(target.webSocketDebuggerUrl);
		await new Promise(resolve => socket.onopen = resolve);

		const failures = await run(new Page(socket), url, downloads);
		console.log(failures ? `${failures} failed` : 'all passed');
		process.exitCode = failures ? 1 : 0;
		socket.close();
	} finally {
		// Chrome writes its profile while closing, so the directory goes away after it
		if (browser.exitCode === null) {
			const exited = new Promise(resolve => browser.once('exit', resolve));
			browser.kill();
			await exited;
		}
		await server.close();
		rmSync(temporary, { recursive: true, force: true });
	}
}

await main();
