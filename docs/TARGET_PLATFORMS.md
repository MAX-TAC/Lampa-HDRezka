# Target platforms

Owner confirmed on 2026-11-24:
- Android TV: latest Lampa Android TV release; exact version/build not yet recorded.
- LG webOS: Lampa running through Media Station X; exact webOS, MSX and Lampa versions unknown.
- Both platforms have equal priority.
- Owner has an active HDRezka Premium account; no existing working HDRezka plugin used. Never request or commit credentials or session cookies.

## Architecture
Shared JavaScript core and capability-based platform adapters, not UA impersonation. No mandatory Android native bridge for MSX. Verify CORS, cookie handling, browser engine features, remote navigation and supported playback APIs separately. Premium login and playback require a supported service contract. Failover only for verified service origins and ordinary service outages, not access denials.

## Acceptance gates
1. Pin exact Lampa release and MSX deployment URL, webOS and MSX versions.
2. Test startup, settings, navigation and errors on both platforms using mocked fixtures.
3. Verify authorized provider integration before live account tests.
4. Owner enters credentials locally only if supported; no secrets in logs.
5. Confirm search, quality, translations, seasons, episodes, playback and logout separately on both devices.

Status: requirements recorded; compatibility and live service integration not verified. No release yet.

## Update 2026-11-25
- Android TV: Lampa 1.13.7, owner-reported. FlixTone D11 Master Android TV 13; actual WebView/bridge unknown.
- LG 43UP770, manufactured 2021-08, firmware 03.53.46; webOS 6.x / Chromium 79 expected, not measured. LG firmware reference: https://www.lg.com/uk/support/product-support/cs-43UP77006LB.AEK/ ; engine reference: https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine
- MSX launches Lampa from an embedded catalog; origin/version unknown. Do not require owner to find URL manually.
- Browser build target: Chromium 79 pending measurement; avoid optional chaining, nullish coalescing, Promise.any in distributed code.
- diagnostics/runtime.cjs: read-only, ES5 syntax, reports origin (not path/query), Chromium major and availability of selected APIs; no network, storage, cookies or full UA output. Browser alert may be unsupported on TV. Node mock tests added; actual devices not tested. Not a service plugin or release.
