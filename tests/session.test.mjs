import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionState } from '../src/session.mjs';

test('requires positive verification', () => {
  const state = createSessionState();
  const ticket = state.select('https://a.example');
  assert.equal(state.confirm(ticket, false), false);
  assert.equal(state.snapshot().authenticated, false);
  assert.equal(state.confirm(ticket, true), true);
  assert.equal(state.snapshot().authenticated, true);
});
test('origin switch invalidates pending authorization', () => {
  const state = createSessionState();
  const old = state.select('https://a.example');
  state.confirm(old, true);
  const next = state.select('https://b.example');
  assert.equal(state.snapshot().authenticated, false);
  assert.equal(state.confirm(old, true), false);
  assert.equal(state.confirm(next, true), true);
});
test('logout invalidates outstanding verification', () => {
  const state = createSessionState();
  const ticket = state.select('https://a.example');
  state.logout();
  assert.equal(state.confirm(ticket, true), false);
  assert.equal(state.snapshot().authenticated, false);
});
test('same origin preserves session', () => {
  const state = createSessionState();
  const ticket = state.select('https://a.example');
  state.confirm(ticket, true);
  assert.deepEqual(state.select('https://a.example/'), ticket);
  assert.equal(state.snapshot().authenticated, true);
});
