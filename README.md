# BrewDeck

[Русская версия](README.RU.MD)

A builder of custom firmware setups for the Nintendo Switch and the PSP: Hekate and Atmosphère or ARK-5 with the chosen homebrew, configured down to single keys of their configs.

BrewDeck is a static web app. It goes through the console, the software and every setting, then produces installers for Linux and macOS (`install.sh`) and Windows (`install.ps1`) along with a readme on the first boot. The installer lies in the root of the SD card or the Memory Stick and builds the setup right there from the latest releases, so nothing in a build is prepackaged. The whole build is kept in the page address: a link reproduces it, except passwords and uploaded images. The software is listed in full there, so a link keeps its build when the recommended selection changes. Every console keeps a build of its own while another one is picked, and the page takes its look: the system UI of the Switch or the XMB of the PSP in the color of the month. The interface speaks English, Russian and Ukrainian.

## Nintendo Switch

**Revision.** Erista, Mariko, OLED or Lite. The revision decides how Hekate starts: from RCM or from a modchip that boots `payload.bin` in the root of the card. It also decides which tools make sense and how far overclocking goes. The console is drawn at its real size, as far as the browser can tell the density of the screen. On a screen narrower than the console the picture shrinks to fit.

**Firmware.** Every system version, with the Atmosphère release that supports it. A version Atmosphère does not support yet is an error, patches released before the support of the version are warned about.

**Software.** Components by purpose:

- core: Atmosphère, Hekate, sys-patch;
- sysmodules: MissionControl, sys-clk, NX-FanControl, SaltyNX, ldn_mitm, sys-con, SysDVR, sys-ftpd-light, sys-tune, Fizeau and others;
- overlays: Tesla Menu or Ultrahand, Status Monitor, FPSLocker, ReverseNX-RT, the SysDVR and EdiZon overlays, noled, MasterVolume, BT_Audio-ovl;
- utilities: Daybreak, Homebrew App Store, sphaira, AIO Switch Updater, NX-Shell, Linkalho, NX Activity Log and others;
- installers and dumpers: DBI with the DBIPatcher translations into 20+ languages, Tinfoil, Goldleaf, nxdumptool;
- saves: JKSV, Checkpoint, Neumann;
- cheats and mods: EdiZon SE, Breeze, SimpleModManager and SimpleModDownloader;
- Amiibo: emuiibo, Amiigo, AmiiboGenerator;
- themes and HOME menu: NXThemes Installer, Themezer, uLaunch;
- media: NXMP, Switchfin for Jellyfin, pPlay and others;
- game streaming: Moonlight, Akira, SkyNX, switch-remote-play;
- emulators: RetroArch, Flycast, PPSSPP, melonDS, NooDS, mGBA, pSNES, pNES, pFBNeo, ScummVM and others;
- development: sys-botbase, sys-gdbstub, Twili and others.

Presets (Minimal, Recommended, Everything) replace the selection, a component brings its dependencies along. Conflicts such as Tesla Menu and Ultrahand, overlaps such as JKSV and Checkpoint or RetroArch and the standalone emulators, components useless on the revision and abandoned ones are explained with fixes: a conflict or an overlap is solved by removing either side, a missing dependency by adding any of its alternatives. What a click brings also pops up as a notification, so it is seen on a phone too. Every component comes from the Homebrew App Store or from GitHub releases, whichever is fresher. Packages of the App Store are registered as installed, so the store on the console keeps updating them.

**Launch.** Entries of the Launch menu of Hekate. Boot modes: CFW on the emuMMC, CFW on the system NAND and the stock firmware. More emuMMCs boot from entries of their own by their folder (`emupath`), such as SD01 or RAW1. Every entry booting the system can override Exosphère keys for itself: blank PRODINFO (`cal0blank`), USB 3.0 (`usb3force`) and the boot config memory mode (`memmode`). Payloads: Fusée, Lockpick RCM, TegraExplorer, CommonProblemResolver, the HWFLY and Picofly toolboxes, each in its own entry. Autoboot takes any of them or stays in the menu, the boot screen delay and its countdown are set here too.

**CFW.** Settings of Hekate, Nyx and Atmosphère. Each is an actual key of their configs with the default of the developers:

- Hekate: backlight, power off on RTC wake, nogc, Hekate as the reboot payload, protected bootloader folder;
- Nyx: theme colors, home screen, backup verification, writable eMMC over USB, Joy-Con, BPMP clock;
- Atmosphère: error reports, USB 3.0, cheats, reboot after a crash, logs, saves on the SD card, applet memory;
- homebrew loader: the Album or any title with a held key, keys to start a game without mods or cheats.

**Security.** What the console tells Nintendo and what the secure monitor allows: DNS-MITM blocking of Nintendo servers on the emuMMC, the sysMMC or both, and in Exosphère blank PRODINFO, writing PRODINFO on the sysMMC, debug modes, the memory mode and the UART log.

**Plugins.** Settings of the selected sysmodules and overlays: the Tesla and Ultrahand combo, where sys-patch applies its patches, MissionControl vibration, motion and the lights of DualSense and DualShock, Status Monitor layouts, sys-ftpd login, port and pause combo, the language of the DBI translation. These configs are written only when changed, so an update keeps what was set on the console.

**Overclock.** sys-clk profiles by title ID: a template (Stock, Balanced, Performance, Battery saver) or CPU, GPU and RAM clocks for every mode, docked, handheld and charging. Clocks above the limits sys-clk applies on the revision are pointed out.

**Appearance.** Boot screen, Nyx background and icons of the Launch entries, taken from the gallery of Hekate and Atmosphère art, the icons of Nichole Mattera and the own icon set of BrewDeck, or uploaded. The boot screen and the background are previewed on the screen of the chosen console in its real size, as Hekate and Nyx draw them. Every entry, payloads included, can take an icon and a boot screen of its own (`logopath`), which Hekate shows when autoboot starts that entry. Images are converted to the bitmaps Hekate expects and embedded into the installers. More pictures are linked from the GBAtemp threads where people share them.

**Build.** Issues of every step with their fixes, the installers, the readme and every generated file with syntax highlighting, to read before running anything.

## PSP

**Model.** PSP-1000, 2000, 3000, Go or Street, drawn at its real size as well.

**Firmware.** Every firmware from 1.00 to 6.61. ARK-5 runs on 6.60 and 6.61, an older PSP gets the official update to 6.61 from the servers of Sony along with the build, and the readme tells to run it first.

**Software.** ARK-5 as FasterARK, in the full package with the VSH menu, the Custom Launcher and the unbricking tools or in the lite one. Plugins: Game Categories Lite, missyhud, æmu for online play through PRO Online, RemoteJoyLite. CMFileManager, DaedalusX64, TempGBA4PSP-mod with the open BIOS of Cult-of-GBA. Everything comes from GitHub releases and direct links.

**CFW.** Settings of ARK-5, written to `SETTINGS.TXT` the way its own settings menu writes them: clocks in games and in the XMB up to 443 MHz, USB charging, extra memory, the caches of the Memory Stick and of ISO images, the Custom Launcher, logos and pictures of the XMB, the options of the PSP Go.

**Plugins.** Where every plugin loads: always, in the XMB, in games and homebrew, in PS1 games, several of them at once. The list goes to `SEPLUGINS/PLUGINS.TXT`, the plugin manager of ARK turns them on and off later.

**Build.** The same as for the Switch.

## Installation

1. Format the SD card as FAT32, the Memory Stick in the PSP itself.
2. Put `install.sh` or `install.ps1` into the root of the card and run it there:

   ```sh
   bash install.sh
   ```

   ```powershell
   powershell -ExecutionPolicy Bypass -File install.ps1
   ```

3. Boot the console as the readme of the build says.

Files with the same names are overwritten, the rest of the card stays. The installer needs `curl` and `unzip`, `bsdtar` or `python3` on Linux and macOS, PowerShell 5.1 or newer on Windows. GitHub allows 60 anonymous API requests per hour, `GITHUB_TOKEN` lifts the limit. Keys and games are never downloaded, the only firmware is the official update of the PSP from the servers of Sony.

## Development

```sh
bun install
bun run dev       # development server
bun run build     # static site in dist/
bun run start     # builds the site and serves it the way it is published
bun run test      # unit tests, installers run where bash, pwsh and shellcheck are installed
bun run test:ui   # every step in headless Chrome
bun run check     # types, unit tests, build and UI tests in a row
bun run sync      # versions, sizes, sources and logos of the catalogs
```

The project runs on [Bun](https://bun.sh). Unit tests are started with `bun run test`: `bun test` would start the test runner of Bun itself instead of Vitest, and that one cannot read the catalogs, which Vite loads.

Catalogs live in `data/` and templates of the generated files in `templates/`, with a directory per platform in both, such as `data/switch/`. A catalog is a set of TSV tables with a row per console, system version, component or option. Several values in a cell are separated by commas, alternatives by `|`, and a flag is set with `on`. What does not fit a table lies in YAML next to it: the sources of the components, the conditions of the options, the keys of the Launch entries, the clocks and the templates of the overclock. Texts of the page live in `i18n/`, a folder of YAML files per language: `index.yaml` holds the page itself, the folders of the platforms hold the texts of their components and options. Styles live in `styles/`. Logos, photos and the gallery live in `public/`. SVG sources of the gallery icons, the set of BrewDeck and the icons of Nichole Mattera fitted into the icon of Nyx, live in `art/icons/` and are rendered into the gallery with `rsvg-convert -w 192 -h 192 art/icons/<id>.svg -o public/appearance/icon/<id>.png`.

## License

The code is under the [MIT license](LICENSE). Logos, photos and the gallery belong to their owners, see [`public/LICENSE`](public/LICENSE). BrewDeck is not affiliated with Nintendo or Sony.
