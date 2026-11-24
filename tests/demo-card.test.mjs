import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../dist/rezka-demo-v012.js',import.meta.url),'utf8');
function setup(){
  const listeners={},menus=[],params=[],focus=[];
  const window={appready:true,$(html){return {html,on(name,fn){this[name]=fn;return this;}}},Lampa:{
    SettingsApi:{addComponent(){},addParam(x){params.push(x)}},
    Listener:{follow(name,fn){listeners[name]=fn}},
    Select:{show(x){menus.push(x)},close(){}},
    Player:{play(){}},Controller:{enabled(){return {name:'full_start'}},toggle(x){focus.push(x)}}
  }};
  vm.runInNewContext(source,{window});
  function card(movie,modern=true){
    const buttons=[];
    const container={length:1,first(){return this},append(x){buttons.push(x)}};
    const empty={length:0,first(){return this}};
    const body={find(s){
      if(s==='.max-tac-rezka-demo-source')return {length:buttons.length};
      if(s==='.buttons--container')return modern?container:empty;
      if(s==='.full-start-new__buttons')return container;
      return empty;
    }};
    return {buttons,emit(type='complite'){listeners.full({type,body,data:{movie}})}};
  }
  return {window,menus,params,focus,card};
}
test('card source registers once and only on completion',()=>{
  const e=setup(),c=e.card({title:'Film'});
  c.emit('start');assert.equal(c.buttons.length,0);
  c.emit();c.emit();assert.equal(c.buttons.length,1);
  assert.match(c.buttons[0].html,/selector/);
  c.buttons[0]['hover:enter']();
  assert.match(e.menus[0].title,/озвучку/);
  e.menus[0].onBack();assert.match(e.menus[1].title,/ДЕМО/);
  e.menus[1].onBack();assert.equal(e.focus[0],'full_start');
});
test('series source opens season selector after voice',()=>{
  const e=setup(),c=e.card({name:'Series',media_type:'tv'},false);c.emit();
  c.buttons[0]['hover:enter']();e.menus[0].onSelect(e.menus[0].items[0]);
  assert.equal(e.menus[1].title,'Выберите сезон');
});
test('read-only and blocked cards never get source',()=>{
  const e=setup();const c=e.card({title:'Film'});e.window.lampa_settings={read_only:true};c.emit();assert.equal(c.buttons.length,0);
  e.window.lampa_settings={};const blocked=e.card({title:'Film',blocked:true});blocked.emit();assert.equal(blocked.buttons.length,0);
});
test('settings entry remains available',()=>{
  const e=setup();e.params[0].onChange();assert.match(e.menus[0].title,/0\.1\.2/);
});
