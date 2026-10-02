import { Software } from '../../types';

const software: {[component in string]: Software} = {
	ark: {
		description: 'Custom firmware for every PSP model',
		details: 'The successor of PRO and ME: homebrew and plugins, games from ISO images and the PS1 ones, a recovery menu and a cIPL for a permanent install. FasterARK installs it right from the XMB.',
	},
	update661: {
		description: 'Official firmware update from Sony',
		details: 'The last firmware of the PSP, downloaded from the servers of Sony. ARK-5 needs 6.60 or 6.61.',
		note: 'Only for a PSP on an older firmware. Charge the battery and connect the AC adapter before running it.',
	},
	gclite: {
		description: 'Categories of games in the XMB',
		details: 'Sorts games and homebrew into categories by folders, the mode is chosen in System Settings.',
		note: 'Has to load first in the XMB, so it opens the plugin list.',
	},
	missyhud: {
		description: 'HUD with FPS, CPU and battery',
		details: 'Shows FPS, CPU load and clock, RAM and battery over games. L + R + START held for a second toggles it, START with the analog stick moves it.',
	},
	aemu: {
		description: 'Online play for adhoc games',
		details: 'The fork of PRO Online by Kethen: games with local multiplayer play over the internet through the servers of PRO Online, together with PPSSPP.',
		note: 'Set the Wi-Fi network in the plugin settings and turn the caches of ARK off.',
	},
	remotejoylite: {
		description: 'The screen of the PSP on a computer',
		details: 'Streams the picture of the PSP over USB to a computer, where RemoteJoyLite shows it and passes the controls back.',
		note: 'The program for the computer is in the same release on GitHub.',
	},
	cmfilemanager: {
		description: 'File manager',
		details: 'Copies, moves and deletes files, unpacks archives, shows pictures and plays music.',
	},
	daedalusx64: {
		description: 'Nintendo 64 emulator',
		details: 'N64 emulator for the PSP with settings per game and controller profiles.',
	},
	tempgba: {
		description: 'Game Boy Advance emulator',
		details: 'Modernized TempGBA with a faster dynarec and a launcher for single games.',
		note: 'Needs a BIOS: the open Cult-of-GBA BIOS comes along, a dump of your own GBA works too.',
	},
	gba_bios: {
		description: 'Open BIOS of the Game Boy Advance',
		details: 'A free replacement of the GBA BIOS written from scratch, put where TempGBA4PSP-mod looks for it.',
		note: 'Most games boot with it, a few need a dump of the original.',
	},
};

export default software;
