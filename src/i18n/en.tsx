import { Translation } from '.';

const en: Translation = {
	title: 'BrewDeck',
	subtitle: 'Nintendo Switch custom firmware builder',
	steps: {
		hardware: 'Hardware',
		version: 'HOS Version',
		components: 'Software',
		tuning: 'Tuning',
		build: 'Build',
	},
	wizard: {
		back: 'Back',
		next: 'Next',
		rebuild: 'Rebuild',
	},
	hardware: {
		erista: {
			name: 'Erista',
			description: 'Original Switch models (released before July 2018)',
			note: 'The most user-friendly revision for custom firmware. Softmodded via RCM jig and payload, requires no soldering.',
		},
		mariko: {
			name: 'Mariko',
			description: 'V2 revision with improved battery life (Red Box)',
			note: 'Requires a modchip (HWFLY / RP2040 / Instinct, etc.). Firmware files are loaded directly by the chip via Hekate. Cannot be softmodded.',
		},
		oled: {
			name: 'OLED',
			description: 'Revision with a 7-inch OLED screen',
			note: 'Requires complex micro-soldering (DAT0 adapter). Professional modchip installation is highly recommended.',
		},
		lite: {
			name: 'Lite',
			description: 'Compact model with non-detachable controllers',
			note: 'Requires a modchip soldered directly onto the APU capacitors. Requires extra precision with micro-soldering.',
		},
	},
	software: {
		atmosphere: {
			description: 'The standard Custom Firmware (CFW)',
			details: 'The core modification that enables homebrew, custom system modules, and mods on your console.',
		},
		hekate: {
			description: 'Feature-rich bootloader',
			details: 'Manages NAND backups, SD card partitioning, emuMMC creation, and payload launching. Includes the Nyx GUI and partition/NAND manager.',
		},
		sys_patch: {
			description: 'System module for bypassing signature checks on boot',
			details: 'Allows Horizon OS to launch installed games and unsigned code. Patches are calculated on the fly for the current firmware; no updates needed after a system update.',
			note: 'Replaces classic sigpatches, which required updating for every HOS version.',
		},
		fusee: {
			description: 'Official Atmosphere launch payload',
			details: 'Launches Atmosphere directly, bypassing Hekate. Useful for RCM injection on unpatched Erista models.',
		},
		lockpick_rcm: {
			description: 'Cryptographic key dumper',
			details: 'Dumps console-specific encryption keys (prod.keys / title.keys) to the SD card. Needed for PC-based emulation and NSP manipulation.',
			note: 'The original repository was deleted; uses the maintained fork by impeeza.',
		},
		tegraexplorer: {
			description: 'Payload-level file browser',
			details: 'Payload-level file manager. Allows rescuing files, formatting the SD card, dumping firmware, or performing system wipes when Horizon OS fails to boot.',
		},
		hwfly_toolbox: {
			description: 'Payload for HWFLY modchip diagnostics and updates',
			details: 'Checks and updates modchip firmware, resets statistics, and outputs diagnostics.',
			note: 'Only useful for hardmodded consoles (Mariko, OLED, Lite).',
		},
		missioncontrol: {
			description: 'Use third-party controllers via native Bluetooth',
			details: 'Play on your Switch with PlayStation (DualSense, DualShock), Xbox, or Wii controllers without extra Bluetooth adapters.',
		},
		sys_clk: {
			description: 'System service for CPU, GPU, and RAM overclocking and underclocking',
			details: 'Overclocks the console to improve FPS in demanding games or underclocks in handheld mode to save battery life.',
		},
		saltynx: {
			description: 'System module for injecting code into games',
			details: 'Intercepts game render calls, allowing you to change the target frame rate (e.g., 60 FPS in handheld) and collect performance stats. Mandatory if you plan to install performance mods.',
			note: 'Required for FPSLocker.',
		},
		ldn_mitm: {
			description: 'Local wireless multiplayer over the internet',
			details: 'Turns local wireless play into a virtual LAN room. Play local co-op (e.g., Mario Kart 8, Monster Hunter Rise) with players worldwide.',
			note: 'Only needed for playing with others via LAN play servers like XLink Kai.',
		},
		dbi: {
			description: 'Advanced title installer and file manager',
			details: 'Connects the console to a PC as an MTP device via USB for installing NSP/NSZ games. Also supports network installs (HTTP, FTP, WebDAV), managing saves, and cleaning up orphaned files.',
			note: 'Covers everything Goldleaf and Tinfoil do for local installation, but faster and more stable.',
		},
		tinfoil: {
			description: 'Alternative installer with shop support',
			details: 'Installs content from third-party online shops, verifies file hashes, and features a tile-based UI with game covers.',
			note: 'Not hosted on GitHub; the installer cannot download it automatically. Download manually from tinfoil.io.',
		},
		jksv: {
			description: 'Save data manager',
			details: 'Back up and restore game save data to the SD card and upload to remote storage. Saves are exported in unencrypted format.',
		},
		aio_updater: {
			description: 'On-console updater for CFW components, firmware, and cheats',
			details: 'Runs directly on the console via network. Downloads the latest Atmosphere, Hekate, cheats, and firmware files without removing the SD card.',
		},
		edizon: {
			description: 'Cheat manager, memory scanner, and editor',
			details: 'Reads running game memory, applies cheats, freezes values (like health or ammo), and searches for new cheat codes. Includes the Breeze cheat engine.',
		},
		emuiibo: {
			description: 'Virtual Amiibo emulator',
			details: 'Games read virtual Amiibo figures as real ones, granting access to exclusive skins and items in Zelda, Fire Emblem, Smash Bros., etc. Controlled via the included overlay.',
		},
		nx_shell: {
			description: 'File manager',
			details: 'Browse, copy, move, rename, and delete files on the SD card, extract archives, and view images.',
		},
		goldleaf: {
			description: 'Multipurpose installer and content manager',
			details: 'Installs packages from the SD card or via USB through Quark on PC. Manages installed games, tickets, and user accounts.',
		},
		nx_activity_log: {
			description: 'Detailed replacement for the system play activity log',
			details: 'Records play sessions, generates graphs of playtime by days, months, and years, and exports data. Useful for those who like tracking detailed statistics.',
		},
		ovlmenu: {
			description: 'Overlay loader and in-game menu',
			details: 'Installs nx-ovlloader and Tesla Menu - an in-game sidebar used to launch overlays like FPSLocker, Status Monitor, or sys-clk.',
			note: 'Required for all overlays in this category.',
		},
		status_monitor: {
			description: 'Real-time monitoring for FPS, CPU, GPU, RAM, temps, and battery',
			details: 'Displays a compact bar or detailed panel over the game. Best paired with sys-clk to monitor temperatures while overclocking.',
		},
		fps_locker: {
			description: 'Overlay for capping frame rates in games',
			details: 'Locks at 30, 45, or 60 FPS, disables dynamic resolution, and applies game-specific patches.',
			note: 'Requires SaltyNX.',
		},
	},
	tuning: {
		hekate: {
			title: 'Hekate',
			description: 'Boot menu entries and startup behavior. The menu always includes CFW (emuMMC), CFW (sysMMC), and Stock.',
			options: {
				autoboot: {
					title: 'Autoboot',
					description: 'What to boot when turning on. Hold VOL- during the logo to enter the menu anyway.',
					values: {
						off: 'Menu',
						emummc: 'CFW (emuMMC)',
						sysmmc: 'CFW (sysMMC)',
						stock: 'Stock',
					},
				},
				bootwait: {
					title: 'Logo delay',
					description: 'Boot logo display time (in seconds). A value of 0 completely hides the logo.',
					values: {
						0: '0 s',
						1: '1 s',
						3: '3 s',
						5: '5 s',
						10: '10 s',
					},
				},
				backlight: {
					title: 'Screen brightness',
					description: 'Backlight level in Hekate and Nyx.',
				},
				autohosoff: {
					title: 'Power off on wake',
					description: 'What to do if HOS wakes the console via RTC, e.g., during charging.',
					values: {
						0: 'Nothing',
						1: 'Logo and power off',
						2: 'Power off immediately',
					},
				},
				autonogc: {
					title: 'Cartridge slot protection (nogc)',
					description: 'Applies the nogc patch on unburnt fuses so the card reader firmware is not updated, allowing lower firmwares to read cartridges.',
				},
				updater2p: {
					title: 'Hekate as reboot payload',
					description: 'Keeps atmosphere/reboot_payload.bin updated with Hekate, so rebooting from HOS returns to Hekate.',
				},
				bootprotect: {
					title: 'Protect bootloader folder',
					description: 'Hides the bootloader folder from HOS to prevent corruption or modification.',
				},
			},
		},
		nyx: {
			title: 'Nyx',
			description: 'Appearance and behavior of the Hekate graphical interface.',
			options: {
				themecolor: {
					title: 'Accent color',
					description: 'Highlight color for text.',
				},
				themebg: {
					title: 'Background',
					description: 'Background color, from #0b0b0b to #c7c7c7.',
				},
				homescreen: {
					title: 'Home screen',
					description: 'The screen opened after startup.',
					values: {
						0: 'Main',
						1: 'All configs',
						2: 'Launch',
						3: 'More configs',
					},
				},
				verification: {
					title: 'Backup verification',
					description: 'How backups and NAND restores are verified.',
					values: {
						0: 'Off',
						1: 'Sparse, fast',
						2: 'Full SHA256, slow',
					},
				},
				entries5col: {
					title: 'Five columns',
					description: 'Show 5 boot entries in a row instead of 4.',
				},
			},
		},
		dns: {
			title: 'Nintendo servers block (DNS-MITM)',
			description: 'Blocks Nintendo servers at the system level. Disables updates, telemetry, and eShop (online gaming will not work).',
			options: {
				mode: {
					title: 'Mode',
					description: 'Atmosphere telemetry is always blocked unless DNS-MITM is disabled.',
					values: {
						block: 'Block all',
						default: 'Telemetry only',
						off: 'Disable DNS-MITM',
					},
				},
				targets: {
					title: 'Apply to',
					description: 'Systems receiving the blocklist.',
					values: {
						emummc: 'emuMMC',
						sysmmc: 'sysMMC',
					},
				},
			},
		},
		exosphere: {
			title: 'Exosphere',
			description: 'Serial number blanking. The system sees empty keys and a blank serial number in PRODINFO. Atmosphere developers do not consider this completely safe, as data may be cached elsewhere.',
			options: {
				blank_prodinfo_emummc: {
					title: 'Blank on emuMMC',
					description: 'Wipe PRODINFO when booting emuMMC.',
				},
				blank_prodinfo_sysmmc: {
					title: 'Blank on sysMMC',
					description: 'Wipe PRODINFO when booting sysMMC. Online services will stop working.',
				},
			},
		},
		atmosphere: {
			title: 'Atmosphere',
			description: 'Override Horizon OS system settings.',
			options: {
				upload_enabled: {
					title: 'Error report uploads',
					description: 'Send crash reports to Nintendo.',
				},
				usb30_force_enabled: {
					title: 'USB 3.0',
					description: 'Enable USB 3.0 for homebrew. May interfere with 2.4 GHz Wi-Fi and Bluetooth.',
				},
				dmnt_cheats_enabled_by_default: {
					title: 'Auto-enable cheats',
					description: 'Automatically apply found cheats when launching a game.',
				},
				dmnt_always_save_cheat_toggles: {
					title: 'Remember cheats',
					description: 'Save cheat states and restore them on the next launch.',
				},
				enable_external_bluetooth_db: {
					title: 'Shared gamepad pairings',
					description: 'Store Bluetooth pairings on the SD card, shared between sysMMC and emuMMC.',
				},
				power_menu_reboot_function: {
					title: 'Power menu reboot',
					description: 'What the "Reboot" button does in the power menu.',
					values: {
						payload: 'To Hekate',
						normal: 'Normal',
						rcm: 'To RCM',
					},
				},
			},
		},
		hbl: {
			title: 'Homebrew',
			description: 'How to open the hbmenu.',
			options: {
				album: {
					title: 'Via Album',
					description: 'Opening the Album launches hbmenu; holding the button opens the real Album. If off, it is inverted.',
				},
				any_app: {
					title: 'Via any game',
					description: 'Hold the button while launching a game to open hbmenu with full memory access.',
				},
				key: {
					title: 'Button',
					description: 'The button to hold for both options above.',
				},
			},
		},
		tesla: {
			title: 'Tesla',
			description: 'Button combo to open the overlay menu.',
			options: {
				key_combo: {
					title: 'Combo',
					description: 'Buttons to press simultaneously.',
					values: {
						DLEFT: '◀',
						DUP: '▲',
						DRIGHT: '▶',
						DDOWN: '▼',
						MINUS: '－',
						PLUS: '+',
					},
				},
			},
		},
	},
	step1: {
		title: 'Step 1. Console revision',
		description: 'Select your Switch revision. This determines the vulnerability type, base file set, and first-boot instructions.',
		isModchipRequired: 'requires modchip',
		isModchipNotRequired: 'softmod'
	},
	step2: {
		title: 'Step 2. System version',
		description: 'Select the system version (HOS) installed on your console. You can find this in System Settings. The builder will prepare compatible Atmosphere and Hekate configurations.',
		status: {
			stable: 'stable',
			legacy: 'legacy',
			dead: 'unsupported'
		}
	},
	step3: {
		title: 'Step 3. Software components',
		description: 'All selected binary files and modules are downloaded directly from the developers\' official repositories. Uncheck unnecessary components to save SD card space.',
		selectAll: 'SELECT ALL',
		deselectAll: 'DESELECT ALL',
		categories: {
			base: 'Core components',
			payloads: 'Primary payloads',
			sysmodules: 'System modules (background plugins)',
			homebrew: 'Homebrew applications',
			overlays: 'Tesla HUD overlays',
		},
		select: 'enable',
		deselect: 'disable',
		requiredBadge: 'required',
		defaultBadge: 'recommended',
		authorLabel: 'Developer',
		sizeLabel: 'File size',
		conflictTitle: 'Conflicts with:',
		recommendsTitle: 'Recommended to add:',
		conflictBadge: 'conflict',
	},
	step4: {
		title: 'Step 4. Fine-tuning',
		description: 'Each option corresponds to an actual configuration key. Default values match developer recommendations.',
		reset: 'RESET',
		on: 'on',
		off: 'off',
		requires: 'requires',
	},
	step5: {
		title: 'Step 5. Build installer',
		description: 'Run the script at the root of your SD card (FAT32 recommended). It will download the latest component releases and apply your configuration.',
		summary: {
			hardware: 'Revision',
			firmware: 'Horizon OS',
			components: 'Components',
			size: 'Download size',
			tuning: 'Modified options',
		},
		installer: 'Installer',
		files: {
			'install.sh': 'Linux and macOS',
			'install.ps1': 'Windows, PowerShell 5.1+',
			'README.md': 'Build summary and first-boot instructions',
		},
		download: 'Download',
		downloadAll: 'Download all (.zip)',
		usage: 'Usage',
		usageNote: 'Files with matching names will be overwritten; everything else on the card remains untouched. Specify a GITHUB_TOKEN if you run the installer frequently, as GitHub limits anonymous downloads to 60 per hour.',
		manual: 'Manual download',
		manualDescription: 'These components cannot be downloaded automatically',
		preview: 'Generated files',
	},
	metrics: {
		size: 'Total size'
	},
	warnings: {
		missionControlLDNMITM: 'MissionControl and ldn_mitm heavily utilize the Wlan/Bluetooth controller. It is recommended to use only one of them on standard revisions to prevent memory-related crashes or stutters.',
		dbiReplacesExtra: 'DBI completely covers the local game installation functionality of Goldleaf and Tinfoil. It is recommended to keep only one manager to avoid cluttering the system.',
		sysclkSaltynx: 'The sys-clk overclocking service requires the SaltyNX plugin to accurately read FPS in overlays.'
	}
}

export default en;
