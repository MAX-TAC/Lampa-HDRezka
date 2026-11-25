import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../diagnostics/playback.js', import.meta.url),'utf8');
function make(ready) {
  let menu, cb, closes=0, played=[], focus=[], notes=[];
  const window={appready:ready,Lampa:{
    Select:{show(m){menu=m},close(){closes++}},
    Player:{play(item){played.push(item)}},
    Controller:{toggle(x){focus.push(x)}},
    Noty:{show(x){notes.push(x)}},
    Listener:{follow(name,fn){assert.equal(name,'app');cb=fn}}
  }};
  const context=vm.createContext({window});
  return {window,run(){vm.runInContext(source,context)},get menu(){return menu},ready(){cb({type:'ready'})},played,focus,notes,get closes(){return closes}};
}
test('never autoplays; explicit MP4 selection uses fixed MDN URL',()=>{
  const env=make(true);env.run();
  assert.equal(env.played.length,0);
  env.menu.onSelect(env.menu.items[0]);
  assert.equal(env.played[0].url,'https://developer.mozilla.org/shared-assets/videos/flower.mp4');
  assert.equal(env.closes,1);
  assert.equal(env.focus[0],'content');
});
test('WebM selection uses fixed URL; injected URL is ignored',()=>{
  const env=make(true);env.run();
  env.menu.onSelect({sampleIndex:1,url:'https://untrusted.example/test'});
  assert.equal(env.played[0].url,'https://developer.mozilla.org/shared-assets/videos/flower.webm');
});
test('invalid selection and back do not start playback',()=>{
  const env=make(true);env.run();
  env.menu.onSelect({sampleIndex:9});
  env.menu.onSelect({sampleIndex:0.5});
  env.menu.onSelect(env.menu.items[2]);
  env.menu.onBack();
  assert.equal(env.played.length,0);
  assert.equal(env.closes,4);
});
test('deferred ready and repeated injection register only once',()=>{
  const env=make(false);env.run();env.run();
  assert.equal(env.menu,undefined);
  env.ready();const menu=env.menu;env.ready();
  assert.equal(env.menu,menu);
});
test('missing player API reports unsupported environment',()=>{
  const env=make(true);delete env.window.Lampa.Player;env.run();
  assert.equal(env.menu,undefined);
  assert.equal(env.notes.length,1);
});
