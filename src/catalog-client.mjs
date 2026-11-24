// Generic, first-party JSON catalog contract; not an HDRezka API.
// No credentials, proxy, redirects, forged UA or implicit mirror changes.
import { validateOrigin } from './network.mjs';

export class CatalogError extends Error {
  constructor(code, status = null) {
    super(code); this.name = 'CatalogError'; this.code = code; this.status = status;
  }
}
function check(condition) { if (!condition) throw new CatalogError('INVALID_RESPONSE'); }
function str(value, max = 256) {
  check(typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value));
  return value;
}
function number(value, min, max) {
  check(Number.isInteger(value) && value >= min && value <= max);
  return value;
}
function list(value, map) {
  check(Array.isArray(value) && value.length <= 500);
  return value.map(map);
}
function named(value) {
  check(value && typeof value === 'object');
  return { id: str(value.id, 128), title: str(value.title) };
}
export function createCatalogClient({origin, mediaOrigins = [], fetcher = globalThis.fetch, timeoutMs = 5000}) {
  const base = validateOrigin(origin);
  const media = new Set([base, ...mediaOrigins.map(validateOrigin)]);
  if (typeof fetcher !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new TypeError('Invalid transport');
  async function get(path, params, signal) {
    if ((signal && signal.aborted)) throw new CatalogError('CANCELLED');
    const u = new URL('/v1/' + path, base);
    Object.entries(params || {}).forEach(([k,v]) => u.searchParams.set(k, String(v)));
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal) signal.addEventListener('abort', cancel, {once:true});
    const timer = setTimeout(cancel, timeoutMs);
    try {
      const r = await fetcher(u.href, {
        method: 'GET', headers: {Accept:'application/json'}, credentials:'omit',
        redirect:'error', cache:'no-store', referrerPolicy:'no-referrer', signal:controller.signal
      });
      if (controller.signal.aborted) throw new CatalogError((signal && signal.aborted) ? 'CANCELLED' : 'TIMEOUT');
      if (!r.ok) throw new CatalogError('HTTP_ERROR', r.status);
      if (r.redirected || (r.url && new URL(r.url).origin !== base)) throw new CatalogError('INVALID_ORIGIN');
      if (!/^application\/json(?:\s*;|$)/i.test(r.headers.get('content-type') || '')) throw new CatalogError('INVALID_CONTENT_TYPE');
      const raw = await r.text();
      if (controller.signal.aborted) throw new CatalogError((signal && signal.aborted) ? 'CANCELLED' : 'TIMEOUT');
      if (raw.length > 1000000) throw new CatalogError('RESPONSE_TOO_LARGE');
      try { return JSON.parse(raw); } catch { throw new CatalogError('INVALID_JSON'); }
    } catch (e) {
      if (e instanceof CatalogError) throw e;
      throw new CatalogError((signal && signal.aborted) ? 'CANCELLED' : controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR');
    } finally { clearTimeout(timer); if (signal) signal.removeEventListener('abort', cancel); }
  }
  function stream(value) {
    check(value && typeof value === 'object');
    let u;
    try { u = new URL(str(value.url, 8192)); } catch { throw new CatalogError('INVALID_STREAM_URL'); }
    if (u.protocol !== 'https:' || u.username || u.password || !media.has(u.origin)) throw new CatalogError('INVALID_STREAM_URL');
    return {url:u.href, height:number(value.height, 1, 4320), title:str(value.title)};
  }
  function id(value) { return str(value,128); }
  return Object.freeze({
    async search(query, signal) {
      return list(await get('search',{q:str(query,256)},signal), value => {
        const item = named(value);
        check(value.kind === 'movie' || value.kind === 'series');
        return {...item,kind:value.kind,year:number(value.year,1888,2100)};
      });
    },
    async voices(movieId, signal) { return list(await get('voices',{id:id(movieId)},signal), named); },
    async seasons(movieId, voiceId, signal) { return list(await get('seasons',{id:id(movieId),voice:id(voiceId)},signal), x=>number(x,0,999)); },
    async episodes(movieId, voiceId, season, signal) { return list(await get('episodes',{id:id(movieId),voice:id(voiceId),season:number(season,0,999)},signal),x=>number(x,1,9999)); },
    async streams(movieId,voiceId,season=null,episode=null,signal) {
      const p={id:id(movieId),voice:id(voiceId)};
      if ((season===null)!==(episode===null)) throw new CatalogError('INVALID_EPISODE');
      if (season!==null) {p.season=number(season,0,999);p.episode=number(episode,1,9999);}
      return list(await get('streams',p,signal),stream).sort((a,b)=>b.height-a.height);
    }
  });
}
