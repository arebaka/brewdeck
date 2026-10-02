import { TuningGroup } from '../../types';

const tuning: {[group in string]: TuningGroup} = {
	ark: {
		title: 'ARK-5',
		description: 'The package FasterARK installs.',
		options: {
			variant: {
				title: 'Package',
				description: 'Full adds the VSH menu, the Custom Launcher, translations, Despertar del Cementerio for unbricking, the overclock tester and Leda for 1.50 homebrew. Lite is the custom firmware alone.',
				values: {
					full: 'Full',
					lite: 'Lite',
				},
			},
		},
	},
	clock: {
		title: 'CPU clock',
		description: 'The clock of the CPU in MHz, the bus follows it. ARK-5 overclocks any PSP above 333 MHz.',
		options: {
			game: {
				title: 'In games',
				description: 'Clock in games and homebrew.',
				values: {
					0: 'As the game sets',
				},
			},
			vsh: {
				title: 'In the XMB',
				description: 'Clock in the XMB.',
				values: {
					0: 'As the system sets',
				},
			},
			usbcharge: {
				title: 'USB charging',
				description: 'Charges the battery over USB on the models that can.',
			},
		},
	},
	memory: {
		title: 'Memory and caches',
		description: 'Extra memory and caches for games.',
		options: {
			highmem: {
				title: 'Extra memory',
				description: 'Gives games and homebrew the extra memory of the models with 64 MB. Auto lets ARK decide per game, the forced modes give it to every game.',
				values: {
					off: 'Off',
					on: 'On',
					auto: 'Auto',
					force16: 'Force 16 MB',
					forcemax: 'Force all',
				},
			},
			mscache: {
				title: 'Memory Stick cache',
				description: 'Speeds up reading from the Memory Stick, a larger cache helps more and takes more memory.',
				values: {
					off: 'Off',
					'4k': '4 KiB',
					'8k': '8 KiB',
					'16k': '16 KiB',
				},
			},
			infernocache: {
				title: 'ISO cache',
				description: 'Cache of Inferno, the ISO driver: LRU keeps the data read last, round robin replaces it in turn.',
				values: {
					off: 'Off',
					lru: 'LRU',
					rr: 'Round robin',
				},
			},
		},
	},
	xmb: {
		title: 'XMB',
		description: 'What the XMB shows and how the PSP starts.',
		options: {
			launcher: {
				title: 'Custom Launcher',
				description: 'Replaces the XMB with the Custom Launcher of ARK from the full package.',
			},
			skiplogos: {
				title: 'Skip logos',
				description: 'Skips the boot animation of the PSP, the logo before games or both.',
				values: {
					off: 'Off',
					all: 'Both',
					gameboot: 'Game logo',
					coldboot: 'Boot animation',
				},
			},
			hidepics: {
				title: 'Hide pictures',
				description: 'Hides the background (PIC1) and the logo (PIC0) of games in the XMB.',
				values: {
					off: 'Off',
					all: 'Both',
					pic0: 'PIC0',
					pic1: 'PIC1',
				},
			},
			hidedlc: {
				title: 'Hide DLC',
				description: 'Keeps downloadable content out of the game list.',
			},
			region: {
				title: 'UMD video region',
				description: 'The region the XMB reports to UMD video discs, to play discs of another region.',
				values: {
					off: 'Own',
					us: 'America',
					eu: 'Europe',
					jp: 'Japan',
				},
			},
			qaflags: {
				title: 'QA flags',
				description: 'Unlocks the hidden debug settings of the XMB.',
			},
		},
	},
	device: {
		title: 'Device',
		description: 'Network, lights and controls.',
		options: {
			wpa2: {
				title: 'WPA2',
				description: 'Connects to Wi-Fi networks protected with WPA2.',
			},
			hidemac: {
				title: 'Hide MAC address',
				description: 'Shows a made-up MAC address in the system information.',
			},
			noled: {
				title: 'Turn LEDs off',
				description: 'Keeps the LEDs of the PSP dark.',
			},
			noumd: {
				title: 'No UMD drive',
				description: 'Boots games without the UMD drive, for a PSP with a broken or removed one.',
			},
			noanalog: {
				title: 'Ignore the analog stick',
				description: 'Ignores a drifting analog stick.',
			},
			vitamute: {
				title: 'Mute as on the Vita',
				description: 'The mute button behaves as on the PS Vita.',
			},
		},
	},
	go: {
		title: 'PSP Go',
		description: 'Settings that only matter on the PSP Go.',
		options: {
			oldplugin: {
				title: 'Plugins made for the Memory Stick',
				description: 'Redirects plugins that look for files on the Memory Stick (ms0) to the internal memory (ef0).',
			},
			hibblock: {
				title: 'Block hibernation',
				description: 'Blocks the deep sleep of the PSP Go, which drops the custom firmware.',
			},
			disablepause: {
				title: 'Turn off Pause Game',
				description: 'Turns off the Pause Game feature of the PSP Go.',
			},
			deadef: {
				title: 'Dead internal memory',
				description: 'Runs without the internal memory, for a PSP Go whose memory has failed.',
			},
		},
	},
	aemu: {
		title: 'æmu',
		description: 'Connection to the servers of PRO Online.',
		options: {
			hotspot: {
				title: 'Wi-Fi network',
				description: 'The SSID of the infrastructure connection set up in the network settings of the PSP, written to SEPLUGINS/hotspot.txt. Empty keeps the file as it is.',
			},
		},
	},
};

export default tuning;
