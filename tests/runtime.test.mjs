import test from 'node:test';
import assert from 'node:assert/strict';
import inspect from '../diagnostics/runtime.cjs';
test('webOS capability detection without exposing full UA or URL', () => {
  const result = inspect({
    navigator: {userAgent:'Mozilla/5.0 (Web0S) Chrome/79.0'},
    location: {protocol:'https:',host:'example.test',href:'https://example.test/?secret=1'},
    Lampa: {SettingsApi:{addComponent(){},addParam(){}},Player:{play(){}}}
  });
  assert.equal(result.chromium,79);
  assert.equal(result.webOS,true);
  assert.equal(result.origin,'https://example.test');
  assert.equal(result.settings,true);
  assert.equal(result.player,true);
  assert.equal(JSON.stringify(result).includes('secret'),false);
  assert.equal('userAgent' in result,false);
});
test('missing browser and Lampa APIs fail safely', () => {
  const result = inspect({});
  assert.equal(result.origin,'non-http');
  assert.equal(result.fetch,false);
  assert.equal(result.request,false);
  assert.equal(result.chromium,null);
});
