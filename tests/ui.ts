// Clicks through every step of BrewDeck in headless Chrome and checks what the user sees.
// Usage: npm run test:ui, set CHROME when the browser is not on the PATH

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createServer } from 'vite';

const BROWSERS = ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser'];

// A 242 mm OLED at the 96 pixels per inch browsers assume on Linux
const OLED_WIDTH = 242 / 25.4 * 96;

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
	await page.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
	await page.send('Page.navigate', { url });
	await sleep(3000);
	await page.evaluate(HELPERS);

	// Hardware
	await check('the console is as wide as the real one', `Math.abs(document.querySelector('.console .photo').getBoundingClientRect().width - ${OLED_WIDTH}) < 1`);

	// Software
	await page.act(`step('Software')`);
	await page.act(`byText('.batch .choice', 'Gamer').click()`);
	await check('a preset replaces the selection and stays marked', `byText('.batch .choice.active', 'Gamer') != null && location.search.includes('sw=')`);
	await page.act(`byText('.component .name', 'Moonlight').closest('.component').click()`);
	await check('a hand edit turns into a custom selection', `document.querySelector('.choice.custom') != null && location.search.includes('moonlight')`);
	await page.act(`byText('.component .name', 'Atmosphere').closest('.component').click()`);
	await check('required components stay', `byText('.component .name', 'Atmosphere').closest('.component').classList.contains('active')`);
	await check('Daybreak opens the homebrew and is required with Atmosphere', `(() => {
		const daybreak = byText('.component .name', 'Daybreak').closest('.component');
		return daybreak.parentElement.firstElementChild == daybreak && daybreak.querySelector('.badge.required') != null;
	})()`);
	await page.act(`byText('.component .name', 'SaltyNX').closest('.component').click()`);
	await check('a removed dependency leaves a fix', `$$('.notice .fix').some(button => button.textContent == 'Add SaltyNX')`);
	await page.act(`$$('.notice .fix').find(button => button.textContent == 'Add SaltyNX').click()`);
	await check('the fix brings it back', `byText('.component .name', 'SaltyNX').closest('.component').classList.contains('active')`);

	// CFW
	await page.act(`step('CFW')`);
	await check('every option is shown at once', `$$('.tuning .row').length >= 60`);
	await page.act(`setField(byText('.row .name', 'Log baud rate').closest('.row').querySelector('input'), '9600')`);
	await check('a number field reaches the link', `location.search.includes('exosphere.log_baud_rate=9600')`);
	await page.act(`setField(byText('.row .name', 'Log baud rate').closest('.row').querySelector('input'), '99999999')`);
	await check('a number out of range is not taken', `location.search.includes('exosphere.log_baud_rate=9600')`);
	await check('buttons are drawn in their shapes', `$$('.buttons .button.trigger').length > 0 && $$('.buttons .button.face').length > 0`);
	await page.act(`byText('.row .name', 'Button').closest('.row').querySelector('.button.trigger.left').click()`);
	await check('a button picks the key', `location.search.includes('hbl.key=ZL')`);
	await page.act(`byText('.batch .control', 'RESET').click()`);
	await check('reset clears the step', `!location.search.includes('exosphere.') && !location.search.includes('hbl.')`);

	// Plugins
	await page.act(`step('Plugins')`);
	await check('the settings of selected plugins are listed', `$$('.tuning > .header .title').length > 0`);

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
	await page.act(`$$('.gallery.bootlogo .picture')[1].click()`);
	await check('a gallery image reaches the link', `location.search.includes('img.bootlogo=hekate-a')`);
	await page.act(`$$('.gallery.icon .picture')[1].click()`);

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
	await page.act(`byText('.generated .choice', 'config/sys-clk/config.ini').click()`);
	await check('the sys-clk profile is previewed', `document.querySelector('.generated .code').textContent.includes('[ABCDEF0123456789]')`);
	await page.act(`byText('.files .row .name', 'install.sh').closest('.row').click()`);
	await page.act(`byText('.files .row .name', 'install.ps1').closest('.row').click()`);
	await sleep(1000);

	const images = embeddedImages(readFileSync(join(downloads, 'install.sh'), 'utf8'));
	expect('the installer embeds the boot logo rotated and opaque', images.some(image =>
		image.path == 'bootloader/bootlogo.bmp' && image.magic == 'BM' && image.bpp == 32 && image.width == 50 && image.height == 204 && image.isOpaque), images);
	expect('the installer embeds the icon with its transparency', images.some(image =>
		image.path == 'bootloader/res/brewdeck_emummc_hue.bmp' && image.width == 192 && image.height == 192 && !image.isOpaque), images);
	expect('install.ps1 starts with a byte order mark', readFileSync(join(downloads, 'install.ps1')).subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])));

	await page.act(`byText('.lang-switch button', 'ru').click()`);
	await check('the language changes in place', `byText('.sidebar .step.active .label', 'Сборка') != null`);

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
