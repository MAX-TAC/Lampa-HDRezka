import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOrigin, probeOrigins, anonymousProbe } from '../src/network.mjs';
test('reject unsafe origins', () => {
  for (const url of ['http://example.com','https://u:p@example.com','https://example.com/path','https://example.com/?x=1','https://example.com/#x']) assert.throws(() => validateOrigin(url));
});
test('fail over on explicit service outage', async () => {
  const calls = [];
  assert.equal(await probeOrigins(['https://a.example','https://b.example'], async origin => {calls.push(origin); return calls.length === 1 ? 503 : 200;}), 'https://b.example');
  assert.equal(calls.length, 2);
});
test('stop on authorization and rate limits', async () => {
  for (const status of [401,403,429,451]) {
    let count = 0;
    await assert.rejects(probeOrigins(['https://a.example','https://b.example'], async () => {count++; return status;}));
    assert.equal(count,1);
  }
});
test('anonymous probe does not send credentials or follow redirects', async () => {
  assert.equal(await anonymousProbe('https://a.example', async (url, options) => {
    assert.equal(options.credentials,'omit'); assert.equal(options.redirect,'error');
    assert.equal(options.method,'HEAD'); assert.equal(options.referrerPolicy,'no-referrer');
    return {status:200};
  }),200);
});
