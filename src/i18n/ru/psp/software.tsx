import { Software } from '../../types';

const software: {[component in string]: Software} = {
	ark: {
		description: 'Кастомная прошивка для любой модели PSP',
		details: 'Наследница PRO и ME: homebrew и плагины, игры из образов ISO и игры PS1, меню восстановления и cIPL для постоянной установки. FasterARK ставит её прямо из XMB.',
	},
	update661: {
		description: 'Официальное обновление прошивки от Sony',
		details: 'Последняя прошивка PSP, скачивается с серверов Sony. ARK-5 нужна 6.60 или 6.61.',
		note: 'Только для PSP на старой прошивке. Перед запуском заряди батарею и подключи блок питания.',
	},
	gclite: {
		description: 'Категории игр в XMB',
		details: 'Раскладывает игры и homebrew по категориям по папкам, режим выбирается в System Settings.',
		note: 'Должен загружаться в XMB первым, поэтому открывает список плагинов.',
	},
	missyhud: {
		description: 'HUD с FPS, процессором и батареей',
		details: 'Показывает поверх игр FPS, загрузку и частоту процессора, память и батарею. L + R + START на секунду включает и выключает его, START со стиком двигает.',
	},
	aemu: {
		description: 'Игра по сети для игр с adhoc',
		details: 'Форк PRO Online от Kethen: игры с локальным мультиплеером играются через интернет на серверах PRO Online, вместе с PPSSPP.',
		note: 'Укажи сеть Wi-Fi в настройках плагина и выключи кэши ARK.',
	},
	remotejoylite: {
		description: 'Экран PSP на компьютере',
		details: 'Передаёт картинку PSP по USB на компьютер, где RemoteJoyLite показывает её и передаёт управление обратно.',
		note: 'Программа для компьютера лежит в том же релизе на GitHub.',
	},
	cmfilemanager: {
		description: 'Файловый менеджер',
		details: 'Копирует, перемещает и удаляет файлы, распаковывает архивы, показывает картинки и играет музыку.',
	},
	daedalusx64: {
		description: 'Эмулятор Nintendo 64',
		details: 'Эмулятор N64 для PSP с настройками для каждой игры и профилями управления.',
	},
	tempgba: {
		description: 'Эмулятор Game Boy Advance',
		details: 'Обновлённый TempGBA с более быстрым динамическим рекомпилятором и запуском отдельных игр.',
		note: 'Нужен BIOS: открытый BIOS от Cult-of-GBA ставится вместе с ним, подойдёт и дамп своей GBA.',
	},
	gba_bios: {
		description: 'Открытый BIOS Game Boy Advance',
		details: 'Свободная замена BIOS GBA, написанная с нуля, кладётся туда, где её ищет TempGBA4PSP-mod.',
		note: 'С ним запускается большинство игр, некоторым нужен дамп оригинала.',
	},
};

export default software;
