# Browser transport feasibility — 2026-11-25
## Evidence
- Lampa upstream src/utils/reguest.js lines 520–650: ordinary browser requests use jQuery.ajax with crossDomain; native() selects Android.httpReq only on Android, otherwise uses the same browser implementation. Source: https://github.com/yumata/lampa-source/blob/main/src/utils/reguest.js .
- Third-party Python client documentation https://ndenissov.github.io/HDRezka/hdrezka/index.html describes a server-side cookie session and private web endpoints, not a browser CORS contract or official API. Existing Gist https://gist.github.com/gmm67/888fc9f66b7801c3daedac316ad38ad9 uses custom headers and manually stored cookie/password; not a trustworthy browser authentication design.
- Service rules https://rezka.moi/rules/ explicitly disallow Lampa even with Premium. The owner has acknowledged the account risk; this is a provider restriction, not proof that every HTTP request is technically blocked. No supported browser API identified.
## Required measurement
Run from developer console on lampa.stream, without credentials. Test only the public rules page, not login or stream endpoints. Change the origin if the owner uses a different mirror; do not use arbitrary third-party proxies.
```js
(async () => {
  const url = 'https://rezka.moi/rules/';
  try {
    const r = await fetch(url, {
      mode:'cors', credentials:'omit', redirect:'error',
      cache:'no-store', referrerPolicy:'no-referrer',
      signal:AbortSignal.timeout(10000)
    });
    console.log('HDRezka public probe:', r.status, r.type);
  } catch (e) {
    console.log('HDRezka public probe:', e.name, e.message);
  }
})();
```
Report only status/type or the browser error (including CORS/CSP/network message, if present). Do not share cookies, account data, HAR, or full URLs containing authentication parameters.
A readable result proves CORS only for that exact public endpoint. A failure is ambiguous until the console/network error is inspected; it cannot establish site-wide CORS or authenticated endpoint behavior. No real provider calls from CI or this research environment. No changes to beta.

## Owner observation
From https://lampa.stream, GET https://rezka.moi/rules/ returned HTTP 200 in DevTools but lacked Access-Control-Allow-Origin; browser blocked access with net::ERR_FAILED and TypeError Failed to fetch. Confirmed only for this public endpoint. Owner reports hdrezka.ag redirects to hdrezka-home.tv. No credentials provided or needed. Next measure anonymous public root of the final origin directly; no assumption about other endpoints or mirrors.

## Active mirror result
Owner tested anonymous GET https://hdrezka-home.tv/ from https://lampa.stream. DevTools reported HTTP 200, missing Access-Control-Allow-Origin, net::ERR_FAILED, TypeError Failed to fetch. Both public endpoints tested reject cross-origin response access. No additional root/rules probes needed. These results do not establish CORS policy of every endpoint or authenticated access. Browser-only JavaScript cannot change the server CORS policy; no-cors yields an opaque response. An authorized backend or provider-supported cross-origin API would be needed if the actual catalog/login endpoints have the same restrictions. Android native transport is not a cross-platform solution for browser/webOS. Do not disable browser protections or use untrusted public credential proxies. No change to beta; provider integration remains unresolved.
