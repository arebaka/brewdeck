import type { Language } from '@i18n';
import en from './readme/en.md?raw';
import ru from './readme/ru.md?raw';
import uk from './readme/uk.md?raw';
import settingsTxt from './ms/PSP/SAVEDATA/ARK_01234/SETTINGS.TXT?raw';
import pluginsTxt from './ms/SEPLUGINS/PLUGINS.TXT?raw';
import hotspotTxt from './ms/SEPLUGINS/hotspot.txt?raw';

export const README: {[code in Language]: string} = { en, ru, uk };

export default {
	settingsTxt,
	pluginsTxt,
	hotspotTxt,
};
