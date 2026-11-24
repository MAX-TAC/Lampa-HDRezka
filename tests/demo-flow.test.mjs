import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../dist/rezka-demo.js',import.meta.url),'utf8');
function setup(){
  let menu,input,played=[],notes=[],focus=[];
  const window={appready:true,Lampa:{
    Select:{show(x){menu=x},close(){}},Player:{play(x){played.push(x)}},
    Controller:{enabled(){return {name:'content'}},toggle(x){focus.push(x)}},
    Input:{edit(opts,cb){input=cb}},Noty:{show(x){notes.push(x)}}
  }};
  vm.runInNewContext(code,{window});
  return {get menu(){return menu},choose(i){menu.onSelect(menu.items[i])},back(){menu.onBack()},enter(q){input(q)},played,notes,focus};
}
test('film flow: catalog, voice, format, playback',()=>{
  const e=setup();e.choose(0);e.choose(0);e.choose(1);e.choose(0);
  assert.equal(e.played.length,1);assert.match(e.played[0].url,/flower\.mp4$/);
  assert.equal(e.focus[0],'content');
});
test('series flow: voice, season, episode, format',()=>{
  const e=setup();e.choose(0);e.choose(1);e.choose(0);e.choose(1);e.choose(2);e.choose(1);
  assert.match(e.played[0].title,/серия 3$/);assert.match(e.played[0].url,/flower\.webm$/);
});
test('search and no results',()=>{
  const e=setup();e.choose(1);e.enter('сериал');assert.equal(e.menu.items.length,1);
  e.back();e.choose(1);e.enter('unmatched');assert.equal(e.notes[0],'Ничего не найдено');
});
test('simulated failover clears session',()=>{
  const e=setup();e.choose(2);assert.match(e.menu.items[2].title,/активна/);
  e.choose(3);assert.match(e.menu.items[2].title,/нет/);assert.match(e.menu.items[3].title,/B$/);
});
test('stale callbacks and invalid selection ignored',()=>{
  const e=setup(),old=e.menu;e.choose(0);old.onSelect(old.items[2]);assert.match(e.menu.title,/Результаты/);
  e.menu.onSelect({demoIndex:999});assert.match(e.menu.title,/Результаты/);e.back();e.back();
  assert.equal(e.played.length,0);
});
