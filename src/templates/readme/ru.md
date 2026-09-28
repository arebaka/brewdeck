# BrewDeck: {{hardware}}, Horizon OS {{hos}}

Сгенерировано {{date}}.

## Компоненты

{{#components}}
- **{{name}}** {{version}}: {{description}}
{{/components}}
{{#hasManual}}

Скачать вручную: {{#manual}}**{{.}}** {{/manual}}
{{/hasManual}}

## Установка

1. Отформатируй SD-карту в **FAT32**: консоль поддерживает exFAT, но на нём файлы склонны портиться.
2. Запусти установщик на корне SD-карты:
   - Linux и macOS: `bash install.sh /путь/к/sd`
   - Windows: `powershell -ExecutionPolicy Bypass -File install.ps1 -SdRoot E:\`
3. Безопасно извлеки карту и вставь её в консоль.

## Первый запуск

{{#modchip}}
Включи консоль: чип загрузит `payload.bin` (ekate) из корня SD-карты.
{{/modchip}}
{{^modchip}}
1. Выключи консоль, вставь RCM-джиг в правую направляющую Joy-Con, зажми **VOL+** и нажми **POWER**. Экран останется чёрным: консоль в режиме RCM.
2. Подключи консоль к компьютеру по USB и отправь `hekate_ctcaer_*.bin` из корня SD-карты через TegraRcmGUI на Windows или fusee-launcher на Linux и macOS.
{{/modchip}}

Запустится hekate{{#autoboot}} и загрузит **{{autoboot}}**, зажми **VOL-** во время логотипа, чтобы попасть в меню{{/autoboot}}.

## emuMMC

Держи системную NAND чистой и запускай CFW из emuMMC:

1. Сделай бэкап NAND в Hekate: **Tools → Backup eMMC**.
2. Создай emuMMC: **emuMMC → Create emuMMC → SD File**. **SD Partition** быстрее, но сначала требует **Tools → Partition SD Card**.
3. Загрузи **Launch → CFW (emuMMC)**.
{{#dnsBlock}}

Серверы Nintendo заблокированы в {{dnsTargets}}: обновления, eShop и онлайн-игра там не работают.
{{/dnsBlock}}
