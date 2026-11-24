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
