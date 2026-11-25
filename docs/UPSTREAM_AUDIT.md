# Upstream audit — 2026-11-24

Source: https://gist.github.com/gmm67/888fc9f66b7801c3daedac316ad38ad9 (rezka.js, version 1.0.1; one revision as displayed). Header declares MIT and credits generation via Perplexity Computer. Exact revision and full license notice still need to be captured before redistribution.

## Verified findings
- Lines 93–119: password, login and cookie persisted through Lampa.Storage.
- Lines 126–163: HTTP accepted, arbitrary proxy URL, hard-coded desktop Chrome UA, manually constructed Cookie and Referer.
- Lines 239–299: XHR cross-origin login, reads document.cookie from Lampa origin, reports success even if cookie extraction is empty.
- Lines 301–304: logout does not remove stored password.
- Lines 203–217: playlist parsing chooses last alternative without verification.
- Lines 222–234: Lampa.Reguest wrapper; transport semantics must be checked against exact installed version.

## Lampa public API documentation
https://github.com/yumata/lampa-source/blob/main/docs/ru/README.md
https://github.com/yumata/lampa-source/blob/main/docs/en/08-settings.md

SettingsApi.addComponent/addParam and Storage.field are documented. Settings parameters are persisted automatically, so password must not be registered as a settings input. Listener.follow('app', ...) and window.appready are documented lifecycle entry points. Exact app version and upstream commit remain unpinned.

## Decisions
No forced desktop UA, no third-party credential proxy, no cross-origin cookie copying. Do not implement unsupported authentication or playback access; supported provider contract is not yet established. No verified production mirror list. No live requests or account tests performed. Existing network module is an isolated foundation, not a functional service plugin.
