import { TuningGroup } from '../../types';
import { DBI_LANGUAGES } from '../../autonyms';

const tuning: {[group in string]: TuningGroup} = {
	logo: {
		title: 'Екран завантаження',
		description: 'Екран, який hekate показує, поки чекає на VOL- для входу в меню.',
		options: {
			bootwait: {
				title: 'Затримка екрана завантаження',
				description: 'Час показу екрана завантаження (у секундах). Значення 0 повністю приховує його.',
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
				title: 'Сховати відлік на екрані завантаження',
				description: 'Не малювати смужку часу, що лишився до входу в меню, на власному екрані завантаження.',
			},
		},
	},
	hekate: {
		title: 'Hekate',
		description: 'Поведінка завантажувача під час старту. Пункти меню й екран завантаження налаштовуються на кроці "Запуск".',
		options: {
			backlight: {
				title: 'Яскравість екрана',
				description: 'Рівень підсвічування в Hekate і Nyx.',
			},
			autohosoff: {
				title: 'Вимкнення після пробудження',
				description: 'Що робити, якщо HOS розбудила консоль за RTC, наприклад під час заряджання.',
				values: {
					0: 'Нічого',
					1: 'Логотип і вимкнення',
					2: 'Одразу вимкнути',
				},
			},
			autonogc: {
				title: 'Захист слота картриджів (nogc)',
				description: 'Застосовує патч nogc за неперепалених ф’юзів, щоб прошивка картрідера не оновлювалася і молодші прошивки могли читати картриджі.',
			},
			updater2p: {
				title: 'Hekate як пейлоад перезавантаження',
				description: 'Підтримує atmosphere/reboot_payload.bin актуальним Hekate, щоб перезавантаження з HOS повертало в Hekate.',
			},
			bootprotect: {
				title: 'Захист теки bootloader',
				description: 'Ховає теку bootloader від HOS, щоб її не пошкодили й не змінили.',
			},
		},
	},
	nyx: {
		title: 'Nyx',
		description: 'Зовнішній вигляд і поведінка графічного інтерфейсу Hekate.',
		options: {
			themecolor: {
				title: 'Акцентний колір',
				description: 'Відтінок підсвічування тексту.',
			},
			themebg: {
				title: 'Фон',
				description: 'Колір фону, від #0b0b0b до #c7c7c7.',
			},
			homescreen: {
				title: 'Домашній екран',
				description: 'Екран, що відкривається після старту.',
				values: {
					0: 'Головна',
					1: 'Усі конфіги',
					2: 'Launch',
					3: 'More configs',
				},
			},
			verification: {
				title: 'Перевірка бекапів',
				description: 'Як перевіряються бекапи й відновлення NAND.',
				values: {
					0: 'Вимк',
					1: 'Вибіркова, швидко',
					2: 'Повна SHA256, повільно',
				},
			},
			entries5col: {
				title: 'П’ять колонок',
				description: 'Показувати 5 пунктів завантаження в ряд замість 4.',
			},
			timedst: {
				title: 'Літній час',
				description: 'Автоматично переводити годинник на літній час.',
			},
			umsemmcrw: {
				title: 'Запис в eMMC через USB',
				description: 'Підключати eMMC і emuMMC з правом запису в режимі USB-накопичувача. Необережний запис може перетворити консоль на цеглу.',
			},
			jcdisable: {
				title: 'Вимкнути Joy-Con',
				description: 'Повністю вимкнути драйвер Joy-Con у Nyx.',
			},
			jcforceright: {
				title: 'Правий Joy-Con як вказівник',
				description: 'Завжди використовувати правий Joy-Con як основний вказівник.',
			},
			bpmpclock: {
				title: 'Частота BPMP',
				description: 'Знизь, якщо Nyx зависає або збоять USB-накопичувач і перевірка бекапів.',
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
		title: 'Блокування серверів Nintendo (DNS-MITM)',
		description: 'Блокувати сервери Nintendo на рівні системи. Вимикаються оновлення, телеметрія й eShop (онлайн-ігри не працюватимуть).',
		options: {
			mode: {
				title: 'Режим',
				description: 'Телеметрія Atmosphere блокується завжди, якщо DNS-MITM не вимкнено.',
				values: {
					block: 'Блокувати все',
					default: 'Лише телеметрія',
					off: 'Вимкнути DNS-MITM',
				},
			},
			targets: {
				title: 'Де застосовувати',
				description: 'Системи, що отримують блок-лист.',
				values: {
					emummc: 'emuMMC',
					sysmmc: 'sysMMC',
				},
			},
			add_defaults: {
				title: 'Список Atmosphere',
				description: 'Блокувати вбудований список телеметрії Atmosphere на додачу до hosts-файлу.',
			},
			debug_log: {
				title: 'Налагоджувальний журнал',
				description: 'Записувати кожен DNS-запит в atmosphere/logs/dns_mitm_debug.log.',
			},
		},
	},
	exosphere: {
		title: 'Exosphere',
		description: 'Маскування серійного номера. Система бачить порожні ключі й серійний номер у PRODINFO. Розробники Atmosphere не вважають це повністю безпечним: дані можуть кешуватися в інших місцях.',
		options: {
			blank_prodinfo_emummc: {
				title: 'Маскувати в emuMMC',
				description: 'Занулити PRODINFO під час завантаження emuMMC.',
			},
			blank_prodinfo_sysmmc: {
				title: 'Маскувати в sysMMC',
				description: 'Занулити PRODINFO під час завантаження sysMMC. Онлайн-сервіси перестають працювати.',
			},
			allow_writing_to_cal_sysmmc: {
				title: 'Запис PRODINFO в sysMMC',
				description: 'Дозволяє homebrew змінювати калібрувальні дані. Atmosphere зберігає зашифрований бекап, але невдалий запис однаково може зламати консоль.',
			},
			debugmode: {
				title: 'Налагоджувальний режим ядра',
				description: 'Повідомляє ядру, що налагодження ввімкнено. Вимкнення ламає Atmosphere.',
			},
			debugmode_user: {
				title: 'Налагоджувальний режим процесів',
				description: 'Вмикає налагоджувальний режим для користувацьких процесів.',
			},
			disable_user_exception_handlers: {
				title: 'Вимкнути обробники винятків',
				description: 'Падіння перестають оброблятися акуратно. З цією опцією в підтримці можуть відмовити в допомозі.',
			},
			enable_user_pmu_access: {
				title: 'Доступ до PMU',
				description: 'Дає користувацьким процесам доступ до регістрів моніторингу продуктивності. Вплив на офіційний код невідомий.',
			},
			enable_mem_mode: {
				title: 'Режим пам’яті з boot config',
				description: 'Бере обсяг пам’яті з boot config замість обмеження в 4 ГБ, для консолей зі збільшеною пам’яттю.',
			},
			log_port: {
				title: 'UART-порт журналу',
				description: 'Послідовний порт журналу exosphere.',
				values: {
					0: 'UART-A',
					1: 'UART-B',
					2: 'UART-C',
					3: 'UART-D',
				},
			},
			log_baud_rate: {
				title: 'Швидкість журналу',
				description: 'Швидкість UART-порту журналу, 0 означає 115200.',
			},
			log_inverted: {
				title: 'Інвертувати порт журналу',
				description: 'Інвертує сигнал UART-порту журналу.',
			},
		},
	},
	atmosphere: {
		title: 'Atmosphere',
		description: 'Перевизначення системних налаштувань Horizon OS.',
		options: {
			upload_enabled: {
				title: 'Надсилання звітів про помилки',
				description: 'Надсилати звіти про помилки в Nintendo.',
			},
			usb30_force_enabled: {
				title: 'USB 3.0',
				description: 'Увімкнути USB 3.0 для homebrew. Може заважати Wi-Fi 2,4 ГГц і Bluetooth.',
			},
			dmnt_cheats_enabled_by_default: {
				title: 'Автоактивація читів',
				description: 'Автоматично вмикати знайдені чити під час запуску гри.',
			},
			dmnt_always_save_cheat_toggles: {
				title: 'Запам’ятовувати чити',
				description: 'Зберігати стан читів і відновлювати його під час наступного запуску.',
			},
			enable_external_bluetooth_db: {
				title: 'Спільні сполучення геймпадів',
				description: 'Зберігати Bluetooth-сполучення на SD-карті, спільними для sysMMC і emuMMC.',
			},
			power_menu_reboot_function: {
				title: 'Перезавантаження з меню живлення',
				description: 'Що робить кнопка "Reboot" у меню живлення.',
				values: {
					payload: 'У Hekate',
					normal: 'Звичайне',
					rcm: 'У RCM',
				},
			},
			fatal_auto_reboot_interval: {
				title: 'Перезавантаження після збою',
				description: 'Перезапускати консоль після фатальної помилки замість очікування натискання.',
				values: {
					0: 'Ніколи',
					5000: '5 с',
					10000: '10 с',
					30000: '30 с',
				},
			},
			disable_automatic_report_cleanup: {
				title: 'Зберігати всі звіти про помилки',
				description: 'Не видаляти звіти про помилки автоматично.',
			},
			ease_nro_restriction: {
				title: 'Послабити перевірку NRO',
				description: 'Пом’якшує перевірку NRO-модулів, які завантажують ігри й homebrew.',
			},
			enable_log_manager: {
				title: 'Менеджер журналів',
				description: 'Збирає журнали системних модулів.',
			},
			enable_sd_card_logging: {
				title: 'Журнали на SD-карту',
				description: 'Зберігати зібрані журнали на SD-карту.',
			},
			sd_card_log_output_directory: {
				title: 'Тека журналів',
				description: 'Тека журналів на SD-карті.',
			},
			enable_htc: {
				title: 'Host target connection (htc)',
				description: 'Зв’язок з інструментами розробки Nintendo, заодно вмикає менеджер журналів.',
			},
			enable_am_debug_mode: {
				title: 'Налагоджувальний режим AM',
				description: 'Менеджер аплетів вважає систему налагоджувальною.',
			},
			enable_hbl_bis_write: {
				title: 'Запис homebrew у системні розділи',
				description: 'Дозволяє homebrew запис у BIS-розділи eMMC. Небезпечно.',
			},
			enable_hbl_cal_read: {
				title: 'Читання PRODINFO з homebrew',
				description: 'Дозволяє homebrew читати розділ калібрування.',
			},
			fsmitm_redirect_saves_to_sd: {
				title: 'Збереження на SD-карті',
				description: 'Перенаправляє збереження ігор на SD-карту. Експериментально, збереження можна втратити.',
			},
			applet_heap_size: {
				title: 'Пам’ять homebrew у режимі аплета, МіБ',
				description: 'Пам’ять для homebrew, запущеного через Альбом, 0 використовує всю доступну.',
			},
			applet_heap_reservation_size: {
				title: 'Резерв для інших аплетів, МіБ',
				description: 'Лишається вільною для інших аплетів, поки пам’ять вище дорівнює 0.',
			},
		},
	},
	stratosphere: {
		title: 'Stratosphere',
		description: 'Захист картрідера під час завантаження через fusee.',
		options: {
			nogc: {
				title: 'Захист слота картриджів (nogc)',
				description: 'Авто вмикає його лише за потреби, як опція Hekate.',
				values: {
					auto: 'Авто',
					on: 'Завжди',
					off: 'Ніколи',
				},
			},
		},
	},
	hbl: {
		title: 'Homebrew',
		description: 'Як відкривати hbmenu.',
		options: {
			album: {
				title: 'Через галерею',
				description: 'Галерея відкриває hbmenu, із затиснутою кнопкою - справжня галерея. Якщо вимкнено, то навпаки.',
			},
			any_app: {
				title: 'Через будь-яку гру',
				description: 'Затисни кнопку під час запуску гри, щоб відкрити hbmenu з повним доступом до пам’яті.',
			},
			key: {
				title: 'Кнопкою',
				description: 'Затиснута кнопка для обох опцій вище.',
			},
			mods_key: {
				title: 'Запуск без модів',
				description: 'Затисни цю кнопку під час запуску гри, щоб вимкнути її моди.',
			},
			cheat_key: {
				title: 'Запуск без читів',
				description: 'Затисни цю кнопку під час запуску гри, щоб вимкнути чити.',
			},
			address_space: {
				title: 'Адресний простір',
				description: 'Адресний простір homebrew, запущеного через гру.',
				values: {
					'39_bit': '39 біт',
					'36_bit': '36 біт',
					'32_bit': '32 біти',
				},
			},
			path: {
				title: 'Завантажувач homebrew',
				description: 'Шлях до завантажувача homebrew на SD-карті.',
			},
		},
	},
	tesla: {
		title: 'Tesla / Ultrahand',
		description: 'Комбінація для виклику меню оверлеїв.',
		options: {
			key_combo: {
				title: 'Комбінація',
				description: 'Кнопки, які треба затиснути одночасно.',
			},
		},
	},
	sys_patch: {
		title: 'sys-patch',
		description: 'Де застосовувати патчі підписів.',
		options: {
			patch_sysmmc: {
				title: 'Патчити sysMMC',
				description: 'Застосовувати патчі під час завантаження sysMMC.',
			},
			patch_emummc: {
				title: 'Патчити emuMMC',
				description: 'Застосовувати патчі під час завантаження emuMMC.',
			},
			version_skip: {
				title: 'Пропускати застарілі шаблони',
				description: 'Не пробувати шаблони старих прошивок, це пришвидшує завантаження.',
			},
			enable_logging: {
				title: 'Журнал',
				description: 'Записувати застосовані патчі в config/sys-patch/log.ini.',
			},
		},
	},
	missioncontrol: {
		title: 'MissionControl',
		description: 'Сторонні Bluetooth-геймпади.',
		options: {
			enable_rumble: {
				title: 'Вібрація',
				description: 'Підтримка вібрації неофіційних геймпадів.',
			},
			enable_motion: {
				title: 'Гіроскоп',
				description: 'Підтримка гіроскопа неофіційних геймпадів.',
			},
			analog_trigger_activation_threshold: {
				title: 'Поріг курків, %',
				description: 'Наскільки треба натиснути аналогові курки, щоб спрацювали ZL і ZR.',
			},
			dualsense_lightbar_brightness: {
				title: 'Підсвічування DualSense',
				description: 'Яскравість від 0 (вимк) до 9 (максимум).',
			},
			dualsense_enable_player_leds: {
				title: 'Індикатори гравця DualSense',
				description: 'Білі індикатори номера гравця під тачпадом.',
			},
			dualsense_vibration_intensity: {
				title: 'Вібрація DualSense',
				description: 'Сила від 1 (12,5%) до 8 (100%).',
			},
			dualshock4_lightbar_brightness: {
				title: 'Підсвічування DualShock 4',
				description: 'Яскравість від 0 (вимк) до 9 (максимум).',
			},
			dualshock3_enable_usb_pairing: {
				title: 'Сполучення DualShock 3 через USB',
				description: 'Сполучати DualShock 3 кабелем. Вимкни, якщо граєш ним по дроту через sys-con.',
			},
			dualshock3_led_mode: {
				title: 'Індикатори DualShock 3',
				description: 'Схема індикаторів номера гравця.',
				values: {
					0: 'Switch',
					1: 'PS3',
					2: 'Гібрид',
				},
			},
			dualshock4_polling_rate: {
				title: 'Частота опитування DualShock 4',
				description: '0 найшвидше, 16 найповільніше, 8 відповідає 125 Гц.',
			},
			host_name: {
				title: 'Ім’я Bluetooth',
				description: 'Ім’я консолі для геймпадів, порожнє залишає системне.',
			},
		},
	},
	status_monitor: {
		title: 'Status Monitor',
		description: 'Розкладка й комбінація екранного монітора.',
		options: {
			key_combo: {
				title: 'Комбінація',
				description: 'Кнопки, які треба затиснути одночасно, щоб відкрити монітор.',
			},
			mini_show: {
				title: 'Режим mini',
				description: 'Значення в режимі mini.',
				values: {
					TEMP: 'Температура',
					FAN: 'Кулер',
					DRAW: 'Споживання',
					RES: 'Роздільність',
					READ: 'Швидкість читання',
				},
			},
			micro_show: {
				title: 'Режим micro',
				description: 'Значення в смужці micro.',
				values: {
					BRD: 'Плата',
					FAN: 'Кулер',
				},
			},
			average_gpu_load: {
				title: 'Усереднювати навантаження GPU',
				description: 'Згладжувати показники навантаження GPU.',
			},
			touch_screen: {
				title: 'Сенсорний екран',
				description: 'Керувати монітором дотиками.',
			},
			motion_control: {
				title: 'Виклик жестом',
				description: 'Відкривати монітор рухом Joy-Con із затиснутими кнопками.',
			},
			mini_font_size: {
				title: 'Розмір шрифту mini',
				description: 'Однаковий у портативному режимі й у доці.',
			},
			micro_font_size: {
				title: 'Розмір шрифту micro',
				description: 'Однаковий у портативному режимі й у доці.',
			},
			battery_avg_iir_filter: {
				title: 'Фільтр батареї',
				description: 'Згладжувати показники батареї IIR-фільтром.',
			},
			battery_time_left_refreshrate: {
				title: 'Оновлення залишку батареї, с',
				description: 'Як часто перераховується час, що лишився.',
			},
			use_old_fps_average: {
				title: 'Старе усереднення FPS',
				description: 'Використовувати попередній спосіб усереднення FPS.',
			},
			font_cache: {
				title: 'Кеш шрифту',
				description: 'Кешувати гліфи, щоб малювати швидше.',
			},
		},
	},
	sys_ftpd_light: {
		title: 'sys-ftpd-light',
		description: 'Вхід і поведінка FTP-сервера.',
		options: {
			user: {
				title: 'Логін',
				description: 'Ім’я користувача для підключення.',
			},
			password: {
				title: 'Пароль',
				description: 'Пароль для підключення.',
			},
			anonymous: {
				title: 'Анонімний доступ',
				description: 'Будь-хто в мережі підключиться без пароля. Небезпечно.',
			},
			port: {
				title: 'Порт',
				description: 'Порт сервера на IP-адресі консолі.',
			},
			pause: {
				title: 'Пауза комбінацією',
				description: 'Дозволити призупиняти сервер комбінацією кнопок.',
			},
			keycombo: {
				title: 'Комбінація паузи',
				description: 'Кнопки, які треба затиснути одночасно, щоб призупинити сервер.',
			},
			led: {
				title: 'Індикатор під час підключення',
				description: 'Блимати індикатором, коли підключається клієнт.',
			},
		},
	},
	dbi_patcher: {
		title: 'DBIPatcher',
		description: 'Мова перекладу DBI.',
		options: {
			language: {
				title: 'Мова',
				description: 'Переклад, який DBI показує замість російської.',
				values: DBI_LANGUAGES,
			},
		},
	},
	sys_clk: {
		title: 'sys-clk',
		description: 'Службові інтервали sys-clk.',
		options: {
			poll_interval_ms: {
				title: 'Перевірка профілів, мс',
				description: 'Як часто sys-clk перевіряє й застосовує профілі.',
			},
			temp_log_interval_ms: {
				title: 'Журнал температур, мс',
				description: '0 вимикає його.',
			},
			freq_log_interval_ms: {
				title: 'Журнал частот, мс',
				description: '0 вимикає його.',
			},
			power_log_interval_ms: {
				title: 'Журнал живлення, мс',
				description: '0 вимикає його.',
			},
			csv_write_interval_ms: {
				title: 'Журнал CSV, мс',
				description: '0 вимикає його.',
			},
		},
	},
};

export default tuning;
