# Generic provider adapter (not HDRezka)
The current service rules explicitly prohibit Lampa: https://rezka.fi/rules/ . Public third-party libraries are not an official API contract. No supported HDRezka integration was identified. The new src/catalog-client.mjs implements a proposed first-party JSON contract for an authorized catalog source, not actual provider endpoints. It is independent of the current browser demo, which remains unchanged.
GET /v1/search?q=... -> array of {id,title,kind,year}
GET /v1/voices?id=... -> array of {id,title}
GET /v1/seasons?id=...&voice=... -> integer array
GET /v1/episodes?id=...&voice=...&season=... -> integer array
GET /v1/streams?id=...&voice=... [&season=...&episode=...] -> array of {url,height,title}
No credentials or proxy. HTTPS origin and media origin allowlist, no redirects, timeout, status handling, JSON/schema validation, quality sorting. Response length checked after reading; this is not a streaming size limiter. Downstream player must independently honor trusted media delivery policy; URL validation here cannot control redirects in player. Authentication, server-side API implementation, runtime bundling, real catalog and device tests are outstanding. Unit tests use injected mock fetch; no service traffic.
