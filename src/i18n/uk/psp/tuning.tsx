import { TuningGroup } from '../../types';

const tuning: {[group in string]: TuningGroup} = {
	ark: {
		title: 'ARK-5',
		description: 'Пакет, який ставить FasterARK.',
		options: {
			variant: {
				title: 'Пакет',
				description: 'Повний додає меню VSH, Custom Launcher, переклади, Despertar del Cementerio для відновлення з цегли, тестер розгону й Leda для homebrew під 1.50. Легкий — лише сама кастомна прошивка.',
				values: {
					full: 'Повний',
					lite: 'Легкий',
				},
			},
		},
	},
	clock: {
		title: 'Частота процесора',
		description: 'Частота процесора в МГц, шина йде слідом. ARK-5 розганяє будь-яку PSP понад 333 МГц.',
		options: {
			game: {
				title: 'В іграх',
				description: 'Частота в іграх і homebrew.',
				values: {
					0: 'Як задасть гра',
				},
			},
			vsh: {
				title: 'У XMB',
				description: 'Частота в XMB.',
				values: {
					0: 'Як задасть система',
				},
			},
			usbcharge: {
				title: 'Заряджання через USB',
				description: 'Заряджає батарею через USB на моделях, які це вміють.',
			},
		},
	},
	memory: {
		title: 'Пам’ять і кеші',
		description: 'Додаткова пам’ять і кеші для ігор.',
		options: {
			highmem: {
				title: 'Додаткова пам’ять',
				description: 'Віддає іграм і homebrew додаткову пам’ять моделей з 64 МБ. Авто дає ARK вирішувати для кожної гри, примусові режими віддають її всім іграм.',
				values: {
					off: 'Вимк.',
					on: 'Увімк.',
					auto: 'Авто',
					force16: 'Завжди 16 МБ',
					forcemax: 'Завжди всю',
				},
			},
			mscache: {
				title: 'Кеш Memory Stick',
				description: 'Пришвидшує читання з Memory Stick, більший кеш допомагає сильніше й займає більше пам’яті.',
				values: {
					off: 'Вимк.',
					'4k': '4 КіБ',
					'8k': '8 КіБ',
					'16k': '16 КіБ',
				},
			},
			infernocache: {
				title: 'Кеш ISO',
				description: 'Кеш Inferno, драйвера образів ISO: LRU зберігає останні прочитані дані, по колу замінює їх по черзі.',
				values: {
					off: 'Вимк.',
					lru: 'LRU',
					rr: 'По колу',
				},
			},
		},
	},
	xmb: {
		title: 'XMB',
		description: 'Що показує XMB і як запускається PSP.',
		options: {
			launcher: {
				title: 'Custom Launcher',
				description: 'Замінює XMB на Custom Launcher з повного пакета ARK.',
			},
			skiplogos: {
				title: 'Пропускати заставки',
				description: 'Пропускає анімацію запуску PSP, логотип перед іграми або обидва.',
				values: {
					off: 'Вимк.',
					all: 'Обидві',
					gameboot: 'Логотип гри',
					coldboot: 'Анімацію запуску',
				},
			},
			hidepics: {
				title: 'Приховувати картинки',
				description: 'Приховує в XMB тло (PIC1) і логотип (PIC0) ігор.',
				values: {
					off: 'Вимк.',
					all: 'Обидві',
					pic0: 'PIC0',
					pic1: 'PIC1',
				},
			},
			hidedlc: {
				title: 'Приховувати DLC',
				description: 'Прибирає завантажуваний вміст зі списку ігор.',
			},
			region: {
				title: 'Регіон UMD-відео',
				description: 'Регіон, який XMB повідомляє дискам UMD Video, щоб грати диски іншого регіону.',
				values: {
					off: 'Свій',
					us: 'Америка',
					eu: 'Європа',
					jp: 'Японія',
				},
			},
			qaflags: {
				title: 'Прапорці QA',
				description: 'Відкриває приховані налагоджувальні налаштування XMB.',
			},
		},
	},
	device: {
		title: 'Пристрій',
		description: 'Мережа, індикатори й керування.',
		options: {
			wpa2: {
				title: 'WPA2',
				description: 'Підключається до мереж Wi-Fi із захистом WPA2.',
			},
			hidemac: {
				title: 'Приховувати MAC-адресу',
				description: 'Показує в інформації про систему вигадану MAC-адресу.',
			},
			noled: {
				title: 'Вимкнути індикатори',
				description: 'Тримає індикатори PSP згаслими.',
			},
			noumd: {
				title: 'Без приводу UMD',
				description: 'Запускає ігри без приводу UMD, для PSP зі зламаним або знятим приводом.',
			},
			noanalog: {
				title: 'Ігнорувати стік',
				description: 'Не помічає дрейфуючий аналоговий стік.',
			},
			vitamute: {
				title: 'Без звуку як на Vita',
				description: 'Кнопка вимкнення звуку працює як на PS Vita.',
			},
		},
	},
	go: {
		title: 'PSP Go',
		description: 'Налаштування, що мають сенс лише на PSP Go.',
		options: {
			oldplugin: {
				title: 'Плагіни для Memory Stick',
				description: 'Перенаправляє плагіни, що шукають файли на Memory Stick (ms0), у вбудовану пам’ять (ef0).',
			},
			hibblock: {
				title: 'Заборонити гібернацію',
				description: 'Забороняє глибокий сон PSP Go, після якого кастомна прошивка злітає.',
			},
			disablepause: {
				title: 'Вимкнути паузу гри',
				description: 'Вимикає функцію Pause Game у PSP Go.',
			},
			deadef: {
				title: 'Мертва вбудована пам’ять',
				description: 'Працює без вбудованої пам’яті, для PSP Go, у якої вона відмовила.',
			},
		},
	},
	aemu: {
		title: 'æmu',
		description: 'Підключення до серверів PRO Online.',
		options: {
			hotspot: {
				title: 'Мережа Wi-Fi',
				description: 'SSID підключення в режимі інфраструктури з мережевих налаштувань PSP, записується в SEPLUGINS/hotspot.txt. Порожнє значення лишає файл як є.',
			},
		},
	},
};

export default tuning;
