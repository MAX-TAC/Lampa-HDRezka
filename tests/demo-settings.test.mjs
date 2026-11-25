import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../dist/rezka-demo-v011.js',import.meta.url),'utf8');
function setup(ready=true){
  let components=[],params=[],menus=[],events=[],focus=[];
  const window={appready:ready,Lampa:{SettingsApi:{addComponent(x){components.push(x)},addParam(x){params.push(x)}},
    Select:{show(x){menus.push(x)},close(){}},Player:{play(){}},
    Controller:{enabled(){return {name:'settings_component'}},toggle(x){focus.push(x)}},
    Listener:{follow(name,fn){events.push(fn)}}}};
  const context=vm.createContext({window});
  return {run(){vm.runInContext(code,context)},window,components,params,menus,events,focus};
}
test('actual extension checker recognizes literal API calls',()=>assert.match(code,/Lampa\./));
test('persistent settings button registers without auto-opening',()=>{
  const e=setup();e.run();e.run();
  assert.equal(e.components.length,1);assert.equal(e.params.length,1);assert.equal(e.menus.length,0);
  assert.equal(e.params[0].param.type,'button');
  e.params[0].onChange();assert.equal(e.menus.length,1);
  e.menus[0].onBack();assert.equal(e.focus[0],'settings_component');
  e.params[0].onChange();assert.equal(e.menus.length,2);
});
test('deferred ready registers exactly once',()=>{
  const e=setup(false);e.run();e.run();assert.equal(e.events.length,1);
  assert.equal(e.params.length,0);e.events[0]({type:'ready'});e.events[0]({type:'ready'});
  assert.equal(e.params.length,1);
});
test('missing settings API does not crash',()=>{
  const e=setup();delete e.window.Lampa.SettingsApi;assert.doesNotThrow(()=>e.run());assert.equal(e.params.length,0);
});
