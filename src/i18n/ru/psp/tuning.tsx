import { TuningGroup } from '../../types';

const tuning: {[group in string]: TuningGroup} = {
	ark: {
		title: 'ARK-5',
		description: 'Пакет, который ставит FasterARK.',
		options: {
			variant: {
				title: 'Пакет',
				description: 'Полный добавляет меню VSH, Custom Launcher, переводы, Despertar del Cementerio для раскирпичивания, тестер разгона и Leda для homebrew под 1.50. Лёгкий — только сама кастомная прошивка.',
				values: {
					full: 'Полный',
					lite: 'Лёгкий',
				},
			},
		},
	},
	clock: {
		title: 'Частота процессора',
		description: 'Частота процессора в МГц, шина следует за ней. ARK-5 разгоняет любую PSP выше 333 МГц.',
		options: {
			game: {
				title: 'В играх',
				description: 'Частота в играх и homebrew.',
				values: {
					0: 'Как задаст игра',
				},
			},
			vsh: {
				title: 'В XMB',
				description: 'Частота в XMB.',
				values: {
					0: 'Как задаст система',
				},
			},
			usbcharge: {
				title: 'Зарядка по USB',
				description: 'Заряжает батарею по USB на моделях, которые это умеют.',
			},
		},
	},
	memory: {
		title: 'Память и кэши',
		description: 'Дополнительная память и кэши для игр.',
		options: {
			highmem: {
				title: 'Дополнительная память',
				description: 'Отдаёт играм и homebrew дополнительную память моделей с 64 МБ. Авто даёт ARK решать для каждой игры, принудительные режимы отдают её всем играм.',
				values: {
					off: 'Выкл.',
					on: 'Вкл.',
					auto: 'Авто',
					force16: 'Всегда 16 МБ',
					forcemax: 'Всегда всю',
				},
			},
			mscache: {
				title: 'Кэш Memory Stick',
				description: 'Ускоряет чтение с Memory Stick, больший кэш помогает сильнее и занимает больше памяти.',
				values: {
					off: 'Выкл.',
					'4k': '4 КиБ',
					'8k': '8 КиБ',
					'16k': '16 КиБ',
				},
			},
			infernocache: {
				title: 'Кэш ISO',
				description: 'Кэш Inferno, драйвера образов ISO: LRU хранит последние прочитанные данные, по кругу заменяет их по очереди.',
				values: {
					off: 'Выкл.',
					lru: 'LRU',
					rr: 'По кругу',
				},
			},
		},
	},
	xmb: {
		title: 'XMB',
		description: 'Что показывает XMB и как запускается PSP.',
		options: {
			launcher: {
				title: 'Custom Launcher',
				description: 'Заменяет XMB на Custom Launcher из полного пакета ARK.',
			},
			skiplogos: {
				title: 'Пропускать заставки',
				description: 'Пропускает анимацию запуска PSP, логотип перед играми или и то и другое.',
				values: {
					off: 'Выкл.',
					all: 'Обе',
					gameboot: 'Логотип игры',
					coldboot: 'Анимацию запуска',
				},
			},
			hidepics: {
				title: 'Скрывать картинки',
				description: 'Скрывает в XMB фон (PIC1) и логотип (PIC0) игр.',
				values: {
					off: 'Выкл.',
					all: 'Обе',
					pic0: 'PIC0',
					pic1: 'PIC1',
				},
			},
			hidedlc: {
				title: 'Скрывать DLC',
				description: 'Убирает загружаемый контент из списка игр.',
			},
			region: {
				title: 'Регион UMD-видео',
				description: 'Регион, который XMB сообщает дискам UMD Video, чтобы играть диски другого региона.',
				values: {
					off: 'Свой',
					us: 'Америка',
					eu: 'Европа',
					jp: 'Япония',
				},
			},
			qaflags: {
				title: 'Флаги QA',
				description: 'Открывает скрытые отладочные настройки XMB.',
			},
		},
	},
	device: {
		title: 'Устройство',
		description: 'Сеть, индикаторы и управление.',
		options: {
			wpa2: {
				title: 'WPA2',
				description: 'Подключается к сетям Wi-Fi с защитой WPA2.',
			},
			hidemac: {
				title: 'Скрывать MAC-адрес',
				description: 'Показывает в информации о системе выдуманный MAC-адрес.',
			},
			noled: {
				title: 'Выключить индикаторы',
				description: 'Держит индикаторы PSP погашенными.',
			},
			noumd: {
				title: 'Без привода UMD',
				description: 'Запускает игры без привода UMD, для PSP со сломанным или снятым приводом.',
			},
			noanalog: {
				title: 'Игнорировать стик',
				description: 'Не замечает дрейфующий аналоговый стик.',
			},
			vitamute: {
				title: 'Без звука как на Vita',
				description: 'Кнопка выключения звука работает как на PS Vita.',
			},
		},
	},
	go: {
		title: 'PSP Go',
		description: 'Настройки, которые имеют смысл только на PSP Go.',
		options: {
			oldplugin: {
				title: 'Плагины для Memory Stick',
				description: 'Перенаправляет плагины, которые ищут файлы на Memory Stick (ms0), во встроенную память (ef0).',
			},
			hibblock: {
				title: 'Запретить гибернацию',
				description: 'Запрещает глубокий сон PSP Go, после которого кастомная прошивка слетает.',
			},
			disablepause: {
				title: 'Выключить паузу игры',
				description: 'Выключает функцию Pause Game у PSP Go.',
			},
			deadef: {
				title: 'Мёртвая встроенная память',
				description: 'Работает без встроенной памяти, для PSP Go, у которой она отказала.',
			},
		},
	},
	aemu: {
		title: 'æmu',
		description: 'Подключение к серверам PRO Online.',
		options: {
			hotspot: {
				title: 'Сеть Wi-Fi',
				description: 'SSID подключения в режиме инфраструктуры из сетевых настроек PSP, записывается в SEPLUGINS/hotspot.txt. Пустое значение оставляет файл как есть.',
			},
		},
	},
};

export default tuning;
