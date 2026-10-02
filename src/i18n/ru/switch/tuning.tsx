import { TuningGroup } from '../../types';
import { DBI_LANGUAGES } from '../../autonyms';

const tuning: {[group in string]: TuningGroup} = {
	logo: {
		title: 'Экран загрузки',
		description: 'Экран, который hekate показывает, пока ждёт VOL- для входа в меню.',
		options: {
			bootwait: {
				title: 'Задержка экрана загрузки',
				description: 'Время показа экрана загрузки (в секундах). Значение 0 полностью скрывает его.',
				values: {
					0: '0 с',
					1: '1 с',
					3: '3 с',
					5: '5 с',
					10: '10 с',
					20: '20 с',
				},
			},
			noticker: {
				title: 'Скрыть отсчёт на экране загрузки',
				description: 'Не рисовать полоску оставшегося до входа в меню времени на своём экране загрузки.',
			},
		},
	},
	hekate: {
		title: 'Hekate',
		description: 'Поведение загрузчика при старте. Пункты меню и экран загрузки настраиваются на шаге "Запуск".',
		options: {
			backlight: {
				title: 'Яркость экрана',
				description: 'Уровень подсветки в Hekate и Nyx.',
			},
			autohosoff: {
				title: 'Выключение после пробуждения',
				description: 'Что делать, если HOS разбудила консоль по RTC, например, во время зарядки.',
				values: {
					0: 'Ничего',
					1: 'Логотип и выключение',
					2: 'Сразу выключить',
				},
			},
			autonogc: {
				title: 'Защита слота картриджей (nogc)',
				description: 'Применяет патч nogc при несожжённых фьюзах, чтобы прошивка картридера не обновлялась, и младшие прошивки могли читать картриджи.',
			},
			updater2p: {
				title: 'Hekate как пэйлоад перезагрузки',
				description: 'Поддерживает atmosphere/reboot_payload.bin актуальным Hekate, чтобы перезагрузка из HOS возвращала в Hekate.',
			},
			bootprotect: {
				title: 'Защита папки bootloader',
				description: 'Прячет папку bootloader от HOS, чтобы её не повредили и не изменили.',
			},
		},
	},
	nyx: {
		title: 'Nyx',
		description: 'Внешний вид и поведение графического интерфейса Hekate.',
		options: {
			themecolor: {
				title: 'Акцентный цвет',
				description: 'Оттенок подсветки текста.',
			},
			themebg: {
				title: 'Фон',
				description: 'Цвет фона, от #0b0b0b до #c7c7c7.',
			},
			homescreen: {
				title: 'Домашний экран',
				description: 'Экран, открывающийся после старта.',
				values: {
					0: 'Главная',
					1: 'Все конфиги',
					2: 'Launch',
					3: 'More configs',
				},
			},
			verification: {
				title: 'Проверка бэкапов',
				description: 'Как проверяются бэкапы и восстановление NAND.',
				values: {
					0: 'Выкл',
					1: 'Выборочная, быстро',
					2: 'Полная SHA256, медленно',
				},
			},
			entries5col: {
				title: 'Пять колонок',
				description: 'Показывать 5 пунктов загрузки в ряд вместо 4.',
			},
			timeoffset: {
				title: 'Смещение времени',
				description: 'Смещение системного времени относительно UTC.',
			},
			timedst: {
				title: 'Летнее время',
				description: 'Автоматически переводить часы на летнее время.',
			},
			umsemmcrw: {
				title: 'Запись в eMMC по USB',
				description: 'Подключать eMMC и emuMMC с правом записи в режиме USB-накопителя. Неосторожная запись может окирпичить консоль.',
			},
			jcdisable: {
				title: 'Отключить Joy-Con-ы',
				description: 'Полностью отключить драйвер Joy-Con в Nyx.',
			},
			jcforceright: {
				title: 'Правый Joy-Con как указатель',
				description: 'Всегда использовать правый Joy-Con как основной указатель.',
			},
			bpmpclock: {
				title: 'Частота BPMP',
				description: 'Снизь, если Nyx зависает или сбоят USB-накопитель и проверка бэкапов.',
				values: {
					0: 'Авто',
					1: '589 МГц',
					2: '576 МГц',
					3: '563 МГц',
					4: '544 МГц',
					5: '408 МГц',
				},
			},
		},
	},
	dns: {
		title: 'Блокировка серверов Nintendo (DNS-MITM)',
		description: 'Блокировать серверы Nintendo на уровне системы. Отключаются обновления, телеметрия и eShop (онлайн-игры работать не будут).',
		options: {
			mode: {
				title: 'Режим',
				description: 'Телеметрия Atmosphere блокируется всегда, если DNS-MITM не отключён.',
				values: {
					block: 'Блокировать всё',
					default: 'Только телеметрия',
					off: 'Отключить DNS-MITM',
				},
			},
			targets: {
				title: 'Где применять',
				description: 'Системы, получающие блок-лист.',
				values: {
					emummc: 'emuMMC',
					sysmmc: 'sysMMC',
				},
			},
			add_defaults: {
				title: 'Список Atmosphere',
				description: 'Блокировать встроенный список телеметрии Atmosphere вдобавок к hosts-файлу.',
			},
			debug_log: {
				title: 'Отладочный журнал',
				description: 'Записывать каждый DNS-запрос в atmosphere/logs/dns_mitm_debug.log.',
			},
		},
	},
	exosphere: {
		title: 'Exosphere',
		description: 'Маскировка серийного номера. Система видит пустые ключи и серийный номер в PRODINFO. Разработчики Atmosphere не считают это полностью безопасным: данные могут кэшироваться в других местах.',
		options: {
			blank_prodinfo_emummc: {
				title: 'Маскировать в emuMMC',
				description: 'Занулить PRODINFO при загрузке emuMMC.',
			},
			blank_prodinfo_sysmmc: {
				title: 'Маскировать в sysMMC',
				description: 'Занулить PRODINFO при загрузке sysMMC. Онлайн-сервисы перестают работать.',
			},
			allow_writing_to_cal_sysmmc: {
				title: 'Запись PRODINFO в sysMMC',
				description: 'Позволяет homebrew изменять калибровочные данные. Atmosphere хранит зашифрованный бэкап, но неудачная запись всё равно может сломать консоль.',
			},
			debugmode: {
				title: 'Отладочный режим ядра',
				description: 'Сообщает ядру, что отладка включена. Выключение ломает Atmosphere.',
			},
			debugmode_user: {
				title: 'Отладочный режим процессов',
				description: 'Включает отладочный режим для пользовательских процессов.',
			},
			disable_user_exception_handlers: {
				title: 'Отключить обработчики исключений',
				description: 'Падения перестают обрабатываться аккуратно. С этой опцией в поддержке могут отказать в помощи.',
			},
			enable_user_pmu_access: {
				title: 'Доступ к PMU',
				description: 'Даёт пользовательским процессам доступ к регистрам мониторинга производительности. Влияние на официальный код неизвестно.',
			},
			enable_mem_mode: {
				title: 'Режим памяти из boot config',
				description: 'Берёт объём памяти из boot config вместо ограничения в 4 ГБ, для консолей с увеличенной памятью.',
			},
			log_port: {
				title: 'UART-порт журнала',
				description: 'Последовательный порт журнала exosphere.',
				values: {
					0: 'UART-A',
					1: 'UART-B',
					2: 'UART-C',
					3: 'UART-D',
				},
			},
			log_baud_rate: {
				title: 'Скорость журнала',
				description: 'Скорость UART-порта журнала, 0 означает 115200.',
			},
			log_inverted: {
				title: 'Инвертировать порт журнала',
				description: 'Инвертирует сигнал UART-порта журнала.',
			},
		},
	},
	atmosphere: {
		title: 'Atmosphere',
		description: 'Переопределение системных настроек Horizon OS.',
		options: {
			upload_enabled: {
				title: 'Отправка отчётов об ошибках',
				description: 'Отправлять отчёты об ошибках в Nintendo.',
			},
			usb30_force_enabled: {
				title: 'USB 3.0',
				description: 'Включить USB 3.0 для homebrew. Может мешать Wi-Fi 2.4 ГГц и Bluetooth.',
			},
			dmnt_cheats_enabled_by_default: {
				title: 'Авто-активация читов',
				description: 'Автоматически включать найденные читы при запуске игры.',
			},
			dmnt_always_save_cheat_toggles: {
				title: 'Запоминать читы',
				description: 'Сохранять состояние читов и восстанавливать его при следующем запуске.',
			},
			enable_external_bluetooth_db: {
				title: 'Общие сопряжения геймпадов',
				description: 'Хранить Bluetooth-сопряжения на SD-карте, общими для sysMMC и emuMMC.',
			},
			power_menu_reboot_function: {
				title: 'Перезагрузка из меню питания',
				description: 'Что делает кнопка "Reboot" в меню питания.',
				values: {
					payload: 'В Hekate',
					normal: 'Обычная',
					rcm: 'В RCM',
				},
			},
			fatal_auto_reboot_interval: {
				title: 'Перезагрузка после сбоя',
				description: 'Перезапускать консоль после фатальной ошибки вместо ожидания нажатия.',
				values: {
					0: 'Никогда',
					5000: '5 с',
					10000: '10 с',
					30000: '30 с',
				},
			},
			disable_automatic_report_cleanup: {
				title: 'Хранить все отчёты об ошибках',
				description: 'Не удалять отчёты об ошибках автоматически.',
			},
			ease_nro_restriction: {
				title: 'Ослабить проверку NRO',
				description: 'Смягчает проверку NRO-модулей, загружаемых играми и homebrew.',
			},
			enable_log_manager: {
				title: 'Менеджер журналов',
				description: 'Собирает журналы системных модулей.',
			},
			enable_sd_card_logging: {
				title: 'Журналы на SD-карту',
				description: 'Сохранять собранные журналы на SD-карту.',
			},
			sd_card_log_output_directory: {
				title: 'Папка журналов',
				description: 'Папка журналов на SD-карте.',
			},
			enable_htc: {
				title: 'Host target connection (htc)',
				description: 'Связь с инструментами разработки Nintendo, заодно включает менеджер журналов.',
			},
			enable_am_debug_mode: {
				title: 'Отладочный режим AM',
				description: 'Менеджер апплетов считает систему отладочной.',
			},
			enable_hbl_bis_write: {
				title: 'Запись homebrew в системные разделы',
				description: 'Разрешает homebrew запись в BIS-разделы eMMC. Опасно.',
			},
			enable_hbl_cal_read: {
				title: 'Чтение PRODINFO из homebrew',
				description: 'Разрешает homebrew читать раздел калибровки.',
			},
			fsmitm_redirect_saves_to_sd: {
				title: 'Сохранения на SD-карте',
				description: 'Перенаправляет сохранения игр на SD-карту. Экспериментально, сохранения можно потерять.',
			},
			applet_heap_size: {
				title: 'Память homebrew в режиме апплета, МиБ',
				description: 'Память для homebrew, запущенного через Альбом, 0 использует всю доступную.',
			},
			applet_heap_reservation_size: {
				title: 'Резерв для других апплетов, МиБ',
				description: 'Остаётся свободной для других апплетов, пока память выше равна 0.',
			},
		},
	},
	stratosphere: {
		title: 'Stratosphere',
		description: 'Защита картридера при загрузке через fusee.',
		options: {
			nogc: {
				title: 'Защита слота картриджей (nogc)',
				description: 'Авто включает её только при необходимости, как опция Hekate.',
				values: {
					auto: 'Авто',
					on: 'Всегда',
					off: 'Никогда',
				},
			},
		},
	},
	hbl: {
		title: 'Homebrew',
		description: 'Как открывать hbmenu.',
		options: {
			album: {
				title: 'Через галерею',
				description: 'Галерея открывает hbmenu, с зажатой кнопкой - настоящая галерея. Если выключено, то наоборот.',
			},
			any_app: {
				title: 'Через любую игру',
				description: 'Зажми кнопку при запуске игры, чтобы открыть hbmenu с полным доступом к памяти.',
			},
			key: {
				title: 'Кнопкой',
				description: 'Зажатая кнопка для обеих опций выше.',
			},
			mods_key: {
				title: 'Запуск без модов',
				description: 'Зажми эту кнопку при запуске игры, чтобы отключить её моды.',
			},
			cheat_key: {
				title: 'Запуск без читов',
				description: 'Зажми эту кнопку при запуске игры, чтобы отключить читы.',
			},
			address_space: {
				title: 'Адресное пространство',
				description: 'Адресное пространство homebrew, запущенного через игру.',
				values: {
					'39_bit': '39 бит',
					'36_bit': '36 бит',
					'32_bit': '32 бита',
				},
			},
			path: {
				title: 'Загрузчик homebrew',
				description: 'Путь к загрузчику homebrew на SD-карте.',
			},
		},
	},
	tesla: {
		title: 'Tesla / Ultrahand',
		description: 'Сочетание для вызова меню оверлеев.',
		options: {
			key_combo: {
				title: 'Сочетание',
				description: 'Кнопки, которые нужно зажать одновременно.',
			},
		},
	},
	sys_patch: {
		title: 'sys-patch',
		description: 'Где применять патчи подписей.',
		options: {
			patch_sysmmc: {
				title: 'Патчить sysMMC',
				description: 'Применять патчи при загрузке sysMMC.',
			},
			patch_emummc: {
				title: 'Патчить emuMMC',
				description: 'Применять патчи при загрузке emuMMC.',
			},
			version_skip: {
				title: 'Пропускать устаревшие шаблоны',
				description: 'Не пробовать шаблоны старых прошивок, это ускоряет загрузку.',
			},
			enable_logging: {
				title: 'Журнал',
				description: 'Записывать применённые патчи в config/sys-patch/log.ini.',
			},
		},
	},
	missioncontrol: {
		title: 'MissionControl',
		description: 'Сторонние Bluetooth-геймпады.',
		options: {
			enable_rumble: {
				title: 'Вибрация',
				description: 'Поддержка вибрации неофициальных геймпадов.',
			},
			enable_motion: {
				title: 'Гироскоп',
				description: 'Поддержка гироскопа неофициальных геймпадов.',
			},
			analog_trigger_activation_threshold: {
				title: 'Порог курков, %',
				description: 'Насколько нужно нажать аналоговые курки, чтобы сработали ZL и ZR.',
			},
			dualsense_lightbar_brightness: {
				title: 'Подсветка DualSense',
				description: 'Яркость от 0 (выкл) до 9 (максимум).',
			},
			dualsense_enable_player_leds: {
				title: 'Индикаторы игрока DualSense',
				description: 'Белые индикаторы номера игрока под тачпадом.',
			},
			dualsense_vibration_intensity: {
				title: 'Вибрация DualSense',
				description: 'Сила от 1 (12,5%) до 8 (100%).',
			},
			dualshock4_lightbar_brightness: {
				title: 'Подсветка DualShock 4',
				description: 'Яркость от 0 (выкл) до 9 (максимум).',
			},
			dualshock3_enable_usb_pairing: {
				title: 'Сопряжение DualShock 3 по USB',
				description: 'Сопрягать DualShock 3 по кабелю. Выключи, если играешь им по проводу через sys-con.',
			},
			dualshock3_led_mode: {
				title: 'Индикаторы DualShock 3',
				description: 'Схема индикаторов номера игрока.',
				values: {
					0: 'Switch',
					1: 'PS3',
					2: 'Гибрид',
				},
			},
			dualshock4_polling_rate: {
				title: 'Частота опроса DualShock 4',
				description: '0 быстрее всего, 16 медленнее всего, 8 соответствует 125 Гц.',
			},
			host_name: {
				title: 'Имя Bluetooth',
				description: 'Имя консоли для геймпадов, пустое оставляет системное.',
			},
		},
	},
	status_monitor: {
		title: 'Status Monitor',
		description: 'Раскладка и сочетание экранного монитора.',
		options: {
			key_combo: {
				title: 'Сочетание',
				description: 'Кнопки, которые нужно зажать одновременно, чтобы открыть монитор.',
			},
			mini_show: {
				title: 'Режим mini',
				description: 'Значения в режиме mini.',
				values: {
					TEMP: 'Температура',
					FAN: 'Кулер',
					DRAW: 'Потребление',
					RES: 'Разрешение',
					READ: 'Скорость чтения',
				},
			},
			micro_show: {
				title: 'Режим micro',
				description: 'Значения в полоске micro.',
				values: {
					BRD: 'Плата',
					FAN: 'Кулер',
				},
			},
			average_gpu_load: {
				title: 'Усреднять нагрузку GPU',
				description: 'Сглаживать показания нагрузки GPU.',
			},
			touch_screen: {
				title: 'Сенсорный экран',
				description: 'Управлять монитором касаниями.',
			},
			motion_control: {
				title: 'Вызов жестом',
				description: 'Открывать монитор движением Joy-Con с зажатыми кнопками.',
			},
			mini_font_size: {
				title: 'Размер шрифта mini',
				description: 'Одинаковый в портативе и доке.',
			},
			micro_font_size: {
				title: 'Размер шрифта micro',
				description: 'Одинаковый в портативе и доке.',
			},
			battery_avg_iir_filter: {
				title: 'Фильтр батареи',
				description: 'Сглаживать показания батареи IIR-фильтром.',
			},
			battery_time_left_refreshrate: {
				title: 'Обновление остатка батареи, с',
				description: 'Как часто пересчитывается оставшееся время.',
			},
			use_old_fps_average: {
				title: 'Старое усреднение FPS',
				description: 'Использовать прежний способ усреднения FPS.',
			},
			font_cache: {
				title: 'Кэш шрифта',
				description: 'Кэшировать глифы, чтобы рисовать быстрее.',
			},
		},
	},
	sys_ftpd_light: {
		title: 'sys-ftpd-light',
		description: 'Вход и поведение FTP-сервера.',
		options: {
			user: {
				title: 'Логин',
				description: 'Имя пользователя для подключения.',
			},
			password: {
				title: 'Пароль',
				description: 'Пароль для подключения.',
			},
			anonymous: {
				title: 'Анонимный доступ',
				description: 'Кто угодно в сети подключится без пароля. Опасно.',
			},
			port: {
				title: 'Порт',
				description: 'Порт сервера на IP-адресе консоли.',
			},
			pause: {
				title: 'Пауза по сочетанию',
				description: 'Разрешить приостанавливать сервер сочетанием кнопок.',
			},
			keycombo: {
				title: 'Сочетание паузы',
				description: 'Кнопки, которые нужно зажать одновременно, чтобы приостановить сервер.',
			},
			led: {
				title: 'Индикатор при подключении',
				description: 'Мигать индикатором, когда подключается клиент.',
			},
		},
	},
	dbi_patcher: {
		title: 'DBIPatcher',
		description: 'Язык перевода DBI.',
		options: {
			language: {
				title: 'Язык',
				description: 'Перевод, который DBI показывает вместо русского.',
				values: DBI_LANGUAGES,
			},
		},
	},
	sys_clk: {
		title: 'sys-clk',
		description: 'Служебные интервалы sys-clk.',
		options: {
			poll_interval_ms: {
				title: 'Проверка профилей, мс',
				description: 'Как часто sys-clk проверяет и применяет профили.',
			},
			temp_log_interval_ms: {
				title: 'Журнал температур, мс',
				description: '0 отключает его.',
			},
			freq_log_interval_ms: {
				title: 'Журнал частот, мс',
				description: '0 отключает его.',
			},
			power_log_interval_ms: {
				title: 'Журнал питания, мс',
				description: '0 отключает его.',
			},
			csv_write_interval_ms: {
				title: 'Журнал CSV, мс',
				description: '0 отключает его.',
			},
		},
	},
};

export default tuning;
