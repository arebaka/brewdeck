import { Software } from '..';

const software: {[component in string]: Software} = {
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
	common_problem_resolver: {
		description: 'Payload that fixes common boot problems',
		details: 'Disables system modules, removes installed themes and fixes the archive bit of SD card files when the console stops booting after an update or a new module.',
	},
	hwfly_toolbox: {
		description: 'Payload for HWFLY modchip diagnostics and updates',
		details: 'Checks and updates modchip firmware, resets statistics, and outputs diagnostics.',
		note: 'Only useful for hardmodded consoles (Mariko, OLED, Lite).',
	},
	picofly_toolbox: {
		description: 'Payload for Picofly modchip diagnostics',
		details: 'Shows the state and firmware of an RP2040 Picofly chip and helps to diagnose glitching problems.',
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
		note: 'Required for FPSLocker and ReverseNX-RT.',
	},
	ldn_mitm: {
		description: 'Local wireless multiplayer over the internet',
		details: 'Turns local wireless play into a virtual LAN room. Play local co-op (e.g., Mario Kart 8, Monster Hunter Rise) with players worldwide.',
		note: 'Only needed for playing with others via LAN play servers like XLink Kai.',
	},
	sys_con: {
		description: 'Support for third-party USB controllers',
		details: 'Makes wired Xbox, PlayStation and generic HID controllers work over USB, with configurable button mapping.',
		note: 'The fork by o0Zz, the original is no longer maintained.',
	},
	sysdvr: {
		description: 'Streams game video and audio to a PC',
		details: 'Sends the screen and sound over USB or the network to the SysDVR client on a PC, for recording or streaming without a capture card.',
	},
	sys_ftpd_light: {
		description: 'Background FTP server',
		details: 'Gives access to the SD card from a PC over Wi-Fi. Set a login and password in the module settings: anonymous access is dangerous.',
	},
	sys_tune: {
		description: 'Background music player',
		details: 'Plays MP3 files from the SD card over games, controlled from its overlay.',
	},
	fizeau: {
		description: 'Screen color management',
		details: 'Adjusts color temperature, saturation, gamma and luminance of the screen, with a night schedule. Includes an overlay and an app.',
	},
	sys_hidplus: {
		description: 'Controller input from a PC',
		details: 'Lets a client on a PC send gamepad input to the console over the network, e.g. for remote play.',
	},
	ovlmenu: {
		description: 'Overlay loader and in-game menu',
		details: 'Installs nx-ovlloader and Tesla Menu - an in-game sidebar used to launch overlays like FPSLocker, Status Monitor, or sys-clk.',
		note: 'Overlays need Tesla Menu or Ultrahand.',
	},
	ultrahand: {
		description: 'Alternative overlay menu',
		details: 'Modern replacement of Tesla Menu with themes, command packages and settings. Works with the same overlays.',
		note: 'Replaces Tesla Menu, only one of them can be installed.',
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
	reversenx_rt: {
		description: 'Switches games between handheld and docked mode on the fly',
		details: 'Makes a game think it runs docked or handheld, to raise the resolution in handheld or lower the load when docked.',
		note: 'Requires SaltyNX.',
	},
	sysdvr_overlay: {
		description: 'SysDVR control overlay',
		details: 'Switches SysDVR modes and shows its state without leaving the game.',
	},
	edizon_overlay: {
		description: 'Cheat overlay',
		details: 'Toggles the cheats of the running game from the overlay menu.',
	},
	noled: {
		description: 'Screen-off overlay',
		details: 'Turns the screen off while the game keeps running, e.g. for streaming or listening to music.',
	},
	appstore: {
		description: 'Homebrew App Store',
		details: 'Browse, install and update homebrew right on the console. Everything BrewDeck installs from the store shows up there as installed.',
	},
	dbi: {
		description: 'Advanced title installer and file manager',
		details: 'Connects the console to a PC as an MTP device via USB for installing NSP/NSZ games. Also supports network installs (HTTP, FTP, WebDAV), managing saves, and cleaning up orphaned files.',
		note: 'Covers everything Goldleaf and Tinfoil do for local installation, but faster and more stable.',
	},
	tinfoil: {
		description: 'Alternative installer with shop support',
		details: 'Installs content from third-party online shops, verifies file hashes, and features a tile-based UI with game covers.',
		note: 'tinfoil.io blocks automated downloads, so the installer cannot fetch it: download it manually.',
	},
	goldleaf: {
		description: 'Multipurpose installer and content manager',
		details: 'Installs packages from the SD card or via USB through Quark on PC. Manages installed games, tickets, and user accounts.',
	},
	jksv: {
		description: 'Save data manager',
		details: 'Back up and restore game save data to the SD card and upload to remote storage. Saves are exported in unencrypted format.',
	},
	checkpoint: {
		description: 'Save manager',
		details: 'Backs up and restores game saves and extra data, simple and fast.',
	},
	aio_updater: {
		description: 'On-console updater for CFW components, firmware, and cheats',
		details: 'Runs directly on the console via network. Downloads the latest Atmosphere, Hekate, cheats, and firmware files without removing the SD card.',
	},
	edizon: {
		description: 'Cheat manager, memory scanner, and editor',
		details: 'Reads running game memory, applies cheats, freezes values (like health or ammo), and searches for new cheat codes. Includes the Breeze cheat engine.',
	},
	breeze: {
		description: 'Cheat engine',
		details: 'Searches, creates and applies cheats with a memory scanner, by the author of EdiZon SE.',
		note: 'EdiZon SE already includes Breeze.',
	},
	emuiibo: {
		description: 'Virtual Amiibo emulator',
		details: 'Games read virtual Amiibo figures as real ones, granting access to exclusive skins and items in Zelda, Fire Emblem, Smash Bros., etc. Controlled via the included overlay.',
	},
	amiigo: {
		description: 'Amiibo manager for emuiibo',
		details: 'Creates and manages virtual Amiibo figures of emuiibo in a convenient interface.',
		note: 'Requires emuiibo.',
	},
	linkalho: {
		description: 'Links a fake Nintendo Account offline',
		details: 'Links user profiles to fake Nintendo Accounts, so games and apps demanding a linked account start without going online.',
		note: 'The original repository was deleted; uses the maintained fork by impeeza.',
	},
	nx_shell: {
		description: 'File manager',
		details: 'Browse, copy, move, rename, and delete files on the SD card, extract archives, and view images.',
	},
	nx_activity_log: {
		description: 'Detailed replacement for the system play activity log',
		details: 'Records play sessions, generates graphs of playtime by days, months, and years, and exports data. Useful for those who like tracking detailed statistics.',
	},
	jc_color_swapper: {
		description: 'Joy-Con color changer',
		details: 'Changes the colors of Joy-Cons and Pro Controllers stored in their memory and shown in the HOME menu.',
	},
	daybreak: {
		description: 'System update installer',
		details: 'Installs Horizon OS updates from a folder on the SD card.',
		note: 'Ships with Atmosphere.',
	},
	nxthemes_installer: {
		description: 'HOME menu theme installer',
		details: 'Installs custom themes (.nxtheme) for the HOME menu, lock screen and other system applets.',
	},
	themezer: {
		description: 'Theme store',
		details: 'Browse and download themes from themezer.net right on the console.',
		note: 'Installs themes through NXThemes Installer.',
	},
	ulaunch: {
		description: 'HOME menu replacement',
		details: 'Replaces the system HOME menu with a customizable launcher with folders and themes.',
		note: 'Takes over the HOME menu, NXThemes themes do not apply to it.',
	},
	moonlight: {
		description: 'Game streaming from a PC',
		details: 'Plays games streamed from a PC with Sunshine or NVIDIA GameStream, with controller support and low latency.',
	},
	akira: {
		description: 'PS4 and PS5 Remote Play',
		details: 'Streams PlayStation 4 and 5 games to the Switch, based on chiaki-ng.',
	},
	retroarch: {
		description: 'Multi-system emulator',
		details: 'Frontend for libretro cores: NES, SNES, Game Boy, Genesis, PlayStation and dozens of other systems in one app.',
		note: 'The App Store package includes a set of cores.',
	},
	flycast: {
		description: 'Dreamcast emulator core',
		details: 'Sega Dreamcast, Naomi and Atomiswave emulation as a RetroArch core from the libretro nightly builds.',
		note: 'Requires RetroArch.',
	},
	ppsspp: {
		description: 'PSP emulator',
		details: 'Standalone port of PPSSPP with hardware rendering.',
	},
	melonds: {
		description: 'Nintendo DS emulator',
		details: 'Port of melonDS with touchscreen support.',
	},
	sys_botbase: {
		description: 'Remote control over the network',
		details: 'Lets PC tools read memory and press buttons over Wi-Fi, the base of bots and automation like SysBot.NET.',
		note: 'Uses the same title as USB-Botbase, only one of them can be installed.',
	},
	usb_botbase: {
		description: 'Remote control over USB',
		details: 'sys-botbase with a USB connection instead of Wi-Fi.',
	},
	sys_gdbstub: {
		description: 'GDB debugger stub',
		details: 'Lets GDB debug applications on the console over the network.',
	},
	twili: {
		description: 'Homebrew debug monitor',
		details: 'Captures output and crash reports of homebrew and sends them to a PC over USB.',
		note: 'Replaces atmosphere/hbl.nsp with its old version: homebrew may stop launching.',
	},
};

export default software;
