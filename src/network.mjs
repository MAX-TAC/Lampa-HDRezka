// Security foundation; no service-specific endpoints or credentials.
export function validateOrigin(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.pathname !== '/' || u.search || u.hash) throw new Error('Invalid HTTPS origin');
  return u.origin;
}
export async function probeOrigins(origins, probe) {
  const allowed = [...new Set(origins.map(validateOrigin))];
  for (const origin of allowed) {
    // Probe must be anonymous, with redirects disabled.
    const status = await probe(origin);
    if (status >= 200 && status < 300) return origin;
    if (![502, 503, 504].includes(status)) throw new Error('Probe stopped: ' + status);
  }
  throw new Error('No available origin');
}
export async function anonymousProbe(origin, fetcher = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetcher(validateOrigin(origin), {
      method: 'HEAD', credentials: 'omit', redirect: 'error',
      cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal
    });
    return response.status;
  } finally { clearTimeout(timer); }
}
