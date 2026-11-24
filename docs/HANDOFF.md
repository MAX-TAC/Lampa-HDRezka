# Handoff — 2026-11-24
Status: FOUNDATION / UNTESTED. Not installable.
Upstream reference: https://gist.github.com/gmm67/888fc9f66b7801c3daedac316ad38ad9 (published by gmm67; source header declares MIT). Original not imported yet.
Observed issues from source: persistent login/password/cookie, cross-origin cookie assumptions, configurable proxy, forced UA, fragile HTML parsing and unverified Lampa APIs.
Implemented: isolated anonymous HTTPS probe and explicit outage selection; no production mirror list. Browser network errors are intentionally not retried because CORS, redirect and policy failures cannot reliably be distinguished.
Next: verify license notice and exact upstream revision, verify supported service integration and official origins, pin Lampa source revision, define authorized authentication and playback contracts, test remote navigation and player on Android TV 13. No account ban evasion or access restriction bypass. No real credentials in logs or fixtures.
Tests: node --test tests/*.test.mjs (not executed in this session).
