import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../diagnostics/runtime.js',import.meta.url),'utf8');
test('ready runtime opens read-only report and restores focus', () => {
  let menu, closed=0, focus;
  const window={appready:true,location:{protocol:'https:',host:'example.test'},navigator:{userAgent:'Chrome/79.0 Web0S'},Lampa:{Select:{show(x){menu=x},close(){closed++}},Controller:{toggle(x){focus=x}}}};
  vm.runInNewContext(source,{window});
  assert.equal(menu.title,'Lampa runtime diagnostics 0.0.1');
  assert.ok(menu.items.some(x=>x.title==='chromium: 79'));
  menu.onBack();
  assert.equal(closed,1);
  assert.equal(focus,'content');
});
test('delayed appready runs once', () => {
  let callback, calls=0;
  const window={Lampa:{Listener:{follow(name,cb){assert.equal(name,'app');callback=cb}},Select:{show(){calls++},close(){}}}};
  vm.runInNewContext(source,{window});
  callback({type:'other'});
  callback({type:'ready'});
  callback({type:'ready'});
  assert.equal(calls,1);
});
