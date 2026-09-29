import { TuningGroup } from '..';

const tuning: {[group in string]: TuningGroup} = {
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
					20: '20 s',
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
			noticker: {
				title: 'Hide the logo countdown',
				description: 'Do not draw the line showing the time left to enter the menu during a custom boot logo.',
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
			timeoffset: {
				title: 'Time offset',
				description: 'Offset of the system time from UTC.',
			},
			timedst: {
				title: 'Daylight saving time',
				description: 'Adjust the clock for daylight saving time automatically.',
			},
			umsemmcrw: {
				title: 'Writable eMMC over USB',
				description: 'Mount eMMC and emuMMC as writable in USB mass storage mode. Careless writes can brick the console.',
			},
			jcdisable: {
				title: 'Disable Joy-Con',
				description: 'Turn off the Joy-Con driver of Nyx completely.',
			},
			jcforceright: {
				title: 'Right Joy-Con as pointer',
				description: 'Always use the right Joy-Con as the main pointer.',
			},
			bpmpclock: {
				title: 'BPMP clock',
				description: 'Lower it if Nyx hangs or USB mass storage and backup verification fail.',
				values: {
					0: 'Auto',
					1: '589 MHz',
					2: '576 MHz',
					3: '563 MHz',
					4: '544 MHz',
					5: '408 MHz',
				},
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
			add_defaults: {
				title: 'Atmosphere defaults',
				description: 'Block the built-in telemetry list of Atmosphere in addition to the hosts file.',
			},
			debug_log: {
				title: 'Debug log',
				description: 'Log every DNS request to atmosphere/logs/dns_mitm_debug.log.',
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
			allow_writing_to_cal_sysmmc: {
				title: 'Writable PRODINFO on sysMMC',
				description: 'Lets homebrew edit the calibration data. Atmosphere keeps an encrypted backup, but a bad write can still break the console.',
			},
			debugmode: {
				title: 'Kernel debug mode',
				description: 'Tells the kernel that debugging is enabled. Turning it off breaks Atmosphere.',
			},
			debugmode_user: {
				title: 'Userland debug mode',
				description: 'Enables debug mode for user processes.',
			},
			disable_user_exception_handlers: {
				title: 'Disable exception handlers',
				description: 'Crashes stop being handled gracefully. Support may refuse to help with this on.',
			},
			enable_user_pmu_access: {
				title: 'User access to PMU',
				description: 'Gives user processes access to the performance monitoring registers. The effect on official code is unknown.',
			},
			enable_mem_mode: {
				title: 'Boot config memory mode',
				description: 'Takes the memory size from the boot config instead of the retail 4 GB cap, for consoles with upgraded RAM.',
			},
			log_port: {
				title: 'Log UART port',
				description: 'Serial port of the exosphere log.',
				values: {
					0: 'UART-A',
					1: 'UART-B',
					2: 'UART-C',
					3: 'UART-D',
				},
			},
			log_baud_rate: {
				title: 'Log baud rate',
				description: 'Speed of the log UART port, 0 means 115200.',
			},
			log_inverted: {
				title: 'Inverted log port',
				description: 'Inverts the signal of the log UART port.',
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
			fatal_auto_reboot_interval: {
				title: 'Reboot after a crash',
				description: 'Restart the console after a fatal error instead of waiting for a button press.',
				values: {
					0: 'Never',
					5000: '5 s',
					10000: '10 s',
					30000: '30 s',
				},
			},
			disable_automatic_report_cleanup: {
				title: 'Keep every error report',
				description: 'Never clean up error reports automatically.',
			},
			ease_nro_restriction: {
				title: 'Ease NRO restriction',
				description: 'Relaxes the validation of NRO modules loaded by games and homebrew.',
			},
			enable_log_manager: {
				title: 'Log manager',
				description: 'Collects the logs of system modules.',
			},
			enable_sd_card_logging: {
				title: 'Logs to SD card',
				description: 'Save the collected logs to the SD card.',
			},
			sd_card_log_output_directory: {
				title: 'Log folder',
				description: 'Folder of the logs on the SD card.',
			},
			enable_htc: {
				title: 'Host target connection (htc)',
				description: 'Connection with the Nintendo development tools, turns the log manager on as well.',
			},
			enable_am_debug_mode: {
				title: 'AM debug mode',
				description: 'The applet manager sees the system as a debug unit.',
			},
			enable_hbl_bis_write: {
				title: 'Homebrew writes to system partitions',
				description: 'Allows homebrew to write to the BIS partitions of the eMMC. Dangerous.',
			},
			enable_hbl_cal_read: {
				title: 'Homebrew reads PRODINFO',
				description: 'Allows homebrew to read the calibration partition.',
			},
			fsmitm_redirect_saves_to_sd: {
				title: 'Saves on SD card (experimental)',
				description: 'Redirects game saves to the SD card. Experimental, saves can be lost.',
			},
			applet_heap_size: {
				title: 'Homebrew memory in applet mode, MiB',
				description: 'Memory of homebrew launched through the Album, 0 uses everything available.',
			},
			applet_heap_reservation_size: {
				title: 'Memory kept for other applets, MiB',
				description: 'Stays free for other applets while the memory above is 0.',
			},
		},
	},
	stratosphere: {
		title: 'Stratosphere',
		description: 'Game card reader protection used when booting through fusee.',
		options: {
			nogc: {
				title: 'Cartridge slot protection (nogc)',
				description: 'Auto applies it only when needed, like the option of Hekate.',
				values: {
					auto: 'Auto',
					on: 'Always',
					off: 'Never',
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
			mods_key: {
				title: 'Launch without mods',
				description: 'Hold this button while launching a game to disable its mods.',
			},
			cheat_key: {
				title: 'Launch without cheats',
				description: 'Hold this button while launching a game to disable cheats.',
			},
			address_space: {
				title: 'Address space',
				description: 'Address space of homebrew launched through a game.',
				values: {
					'39_bit': '39-bit',
					'36_bit': '36-bit',
					'32_bit': '32-bit',
				},
			},
			path: {
				title: 'Homebrew loader',
				description: 'Path of the homebrew loader on the SD card.',
			},
		},
	},
	tesla: {
		title: 'Tesla / Ultrahand',
		description: 'Button combo to open the overlay menu.',
		options: {
			key_combo: {
				title: 'Combo',
				description: 'Buttons to press simultaneously.',
			},
		},
	},
	sys_patch: {
		title: 'sys-patch',
		description: 'Where signature patches are applied.',
		options: {
			patch_sysmmc: {
				title: 'Patch sysMMC',
				description: 'Apply the patches when booting sysMMC.',
			},
			patch_emummc: {
				title: 'Patch emuMMC',
				description: 'Apply the patches when booting emuMMC.',
			},
			version_skip: {
				title: 'Skip outdated patterns',
				description: 'Do not try patterns made for older firmware, it speeds up the boot.',
			},
			enable_logging: {
				title: 'Log',
				description: 'Write the applied patches to config/sys-patch/log.ini.',
			},
		},
	},
	missioncontrol: {
		title: 'MissionControl',
		description: 'Third-party Bluetooth controllers.',
		options: {
			enable_rumble: {
				title: 'Vibration',
				description: 'Rumble support for unofficial controllers.',
			},
			enable_motion: {
				title: 'Motion controls',
				description: 'Gyro support for unofficial controllers.',
			},
			analog_trigger_activation_threshold: {
				title: 'Trigger threshold, %',
				description: 'How far analog triggers have to be pressed to count as ZL and ZR.',
			},
			dualsense_lightbar_brightness: {
				title: 'DualSense lightbar',
				description: 'Brightness from 0 (off) to 9 (full).',
			},
			dualsense_enable_player_leds: {
				title: 'DualSense player LEDs',
				description: 'White player indicators below the touchpad.',
			},
			dualsense_vibration_intensity: {
				title: 'DualSense vibration',
				description: 'Intensity from 1 (12.5%) to 8 (100%).',
			},
			dualshock4_lightbar_brightness: {
				title: 'DualShock 4 lightbar',
				description: 'Brightness from 0 (off) to 9 (full).',
			},
			dualshock3_enable_usb_pairing: {
				title: 'DualShock 3 USB pairing',
				description: 'Pair DualShock 3 by cable. Turn it off if you play with it wired through sys-con.',
			},
			dualshock3_led_mode: {
				title: 'DualShock 3 LEDs',
				description: 'Pattern of the player LEDs.',
				values: {
					0: 'Switch',
					1: 'PS3',
					2: 'Hybrid',
				},
			},
			dualshock4_polling_rate: {
				title: 'DualShock 4 polling rate',
				description: '0 is the fastest, 16 the slowest, 8 means 125 Hz.',
			},
			host_name: {
				title: 'Bluetooth name',
				description: 'Name of the console shown to controllers, empty keeps the system one.',
			},
		},
	},
	status_monitor: {
		title: 'Status Monitor',
		description: 'Layout and shortcut of the on-screen monitor.',
		options: {
			key_combo: {
				title: 'Shortcut',
				description: 'Buttons to hold together to open the monitor.',
			},
			mini_show: {
				title: 'Mini mode',
				description: 'Values shown in the mini mode.',
				values: {
					TEMP: 'Temperature',
					FAN: 'Fan',
					DRAW: 'Power',
					RES: 'Resolution',
					READ: 'Read speed',
				},
			},
			micro_show: {
				title: 'Micro mode',
				description: 'Values shown in the micro bar.',
				values: {
					BRD: 'Board',
					FAN: 'Fan',
				},
			},
			average_gpu_load: {
				title: 'Average GPU load',
				description: 'Smooth the GPU load readings.',
			},
			touch_screen: {
				title: 'Touch screen',
				description: 'Control the monitor by touch.',
			},
			motion_control: {
				title: 'Motion shortcut',
				description: 'Open the monitor with a Joy-Con motion combo.',
			},
			mini_font_size: {
				title: 'Mini mode font size',
				description: 'Same size in handheld and docked.',
			},
			micro_font_size: {
				title: 'Micro mode font size',
				description: 'Same size in handheld and docked.',
			},
			battery_avg_iir_filter: {
				title: 'Battery filter',
				description: 'Smooth the battery readings with an IIR filter.',
			},
			battery_time_left_refreshrate: {
				title: 'Battery estimate refresh, s',
				description: 'How often the time left is recalculated.',
			},
			use_old_fps_average: {
				title: 'Old FPS average',
				description: 'Use the previous way of averaging FPS.',
			},
			font_cache: {
				title: 'Font cache',
				description: 'Cache glyphs to draw faster.',
			},
		},
	},
	sys_ftpd_light: {
		title: 'sys-ftpd-light',
		description: 'Login and behavior of the FTP server.',
		options: {
			user: {
				title: 'Login',
				description: 'User name to connect with.',
			},
			password: {
				title: 'Password',
				description: 'Password to connect with.',
			},
			anonymous: {
				title: 'Anonymous access',
				description: 'Anyone on the network can connect without a password. Dangerous.',
			},
			port: {
				title: 'Port',
				description: 'Port of the server on the IP address of the console.',
			},
			pause: {
				title: 'Pause by combo',
				description: 'Allow pausing the server with a button combo.',
			},
			keycombo: {
				title: 'Pause combo',
				description: 'Buttons to hold together to pause the server.',
			},
			led: {
				title: 'LED on connect',
				description: 'Flash the LED when a client connects.',
			},
		},
	},
	sys_clk: {
		title: 'sys-clk',
		description: 'Service intervals of sys-clk.',
		options: {
			poll_interval_ms: {
				title: 'Profile check interval, ms',
				description: 'How often sys-clk checks and applies profiles.',
			},
			temp_log_interval_ms: {
				title: 'Temperature log, ms',
				description: '0 disables it.',
			},
			freq_log_interval_ms: {
				title: 'Frequency log, ms',
				description: '0 disables it.',
			},
			power_log_interval_ms: {
				title: 'Power log, ms',
				description: '0 disables it.',
			},
			csv_write_interval_ms: {
				title: 'CSV log, ms',
				description: '0 disables it.',
			},
		},
	},
};

export default tuning;
