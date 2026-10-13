# RobotCYB & CicadaFarm — Browser Token Prices

A small Manifest V3 extension for Chrome and Edge, displaying RobotCYB and CicadaFarm prices in USDT and SOL. No wallet connection, seed phrase, account or subscription is required.

[Download ZIP](https://github.com/c1cad4/plugin-robotcyb-cicadafarm/archive/refs/heads/main.zip) · [CybOS](https://github.com/c1cad4/CybOS-demo) · [Privacy](PRIVACY.md)

<a id="installation"></a>
## Установка / Installation

1. Скачайте ZIP по ссылке выше и распакуйте его. / Download and extract the ZIP.
2. В Chrome откройте `chrome://extensions`, в Edge — `edge://extensions`.
3. Включите «Режим разработчика» / Developer mode.
4. Нажмите «Загрузить распакованное расширение» / Load unpacked и выберите папку, в которой находится `manifest.json`.
5. Закрепите расширение на панели и нажмите его значок.

This is a manual beta installation, not a Chrome Web Store / Edge Add-ons listing. Store submission requires publisher accounts and review; no store IDs or automatic-update URLs are claimed. Manual installations must be updated by downloading the new files and clicking Reload. Other Chromium browsers can use the same package where unpacked MV3 extensions are supported; Firefox and Safari are not included in this package.

## Что показывает расширение

- RobotCYB / USDT и RobotCYB / SOL.
- CicadaFarm / USDT и CicadaFarm / SOL.
- Изменение за 24 часа, если источник его отдаёт.
- Короткую историю собственных наблюдений, до 120 точек за последние 24 часа. Это не исторический биржевой OHLC-график.
- Время получения, устаревшие данные и ошибки источников.
- Русский и английский интерфейс, значки обоих токенов, разворачиваемую панель и ссылки на рынок, Solscan и CybOS.

Обновление примерно раз в минуту; браузер может задерживать фоновые задачи. Кнопка обновления ограничена одним запросом обновления в 30 секунд. При ошибке сети последняя цена остаётся с явной отметкой ошибки и прежним временем.

## Token identities and price methodology

- RobotCYB: `8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump`
- CicadaFarm: `9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump`

RobotCYB uses the user-confirmed Raydium RobotCYB/SOL pool [6pQd4VkSN35X4MGNPHjPbA6KgF8zxGj9K7cUkfNCjKHP](https://www.geckoterminal.com/solana/pools/6pQd4VkSN35X4MGNPHjPbA6KgF8zxGj9K7cUkfNCjKHP) through GeckoTerminal. Pool address, base mint and SOL quote mint must all match. SOL is taken directly from that pool's reported ratio.

CicadaFarm uses [DEX Screener](https://docs.dexscreener.com/api/reference). Among exact-base-mint Solana pools with a SOL/USDT/USDC quote, positive USD price and positive USD liquidity, the extension selects the highest reported USD liquidity. Inverted, mismatched, invalid and unknown-quote pools are excluded. SOL uses the direct pool ratio when quoted in SOL; otherwise it is derived from USD prices.

USDT is always converted using its observed USD price, not assumed to equal one dollar. Cross-rates are indicative prices, not executable swap quotes: trading fees, slippage and market depth are outside this extension.

If a DEX source has no usable pool, Pump.fun public metadata may provide a clearly labelled **market-cap estimate**: `usd_market_cap / (total_supply / 10^base_decimals)`. Mint, units and source timestamp are validated. A completed bonding curve's old virtual reserves are never used as a live pool price. Pump metadata is a fallback, can be stale, and is not an on-chain verified swap quote. If sources fail, values are unavailable rather than fabricated.

## Permissions

Only `storage`, `alarms` and read access to three explicit public API hosts are requested. No page injection, browsing-history access, wallet access, notifications, private keys or remote executable scripts. All JS/CSS/icons ship locally.

## Development

Node.js 20+; no npm runtime dependencies.

```sh
npm test
python3 tools/package.py
```

The package script creates `dist/robotcyb-cicadafarm-1.0.0.zip` and a SHA-256 checksum. CI tests and builds the same package.

Validation: seven Node tests cover source selection, exact token/pool identity, real USDT conversion, bounded history/response size, source timestamps, invalid/offline data and the background worker. Popup rendering and language switching were checked in an isolated headless Chrome context with captured public API responses. Public GeckoTerminal, DEX Screener and Pump.fun responses were inspected. Automated headless Edge sideloading did not start the extension service worker in this environment; actual manual loading, browser alarm sleep/restart and store installation still need verification.

MIT license. Original code in this repository; no dependency on the older RobotCYB-Price-Tracker extension.
