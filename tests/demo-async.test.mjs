import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../dist/rezka-demo-v013.js',import.meta.url),'utf8');
function setup(){
  let menu,params=[],played=[],notes=[];
  const window={appready:true,AbortController,URL,Lampa:{SettingsApi:{addComponent(){},addParam(x){params.push(x)}},Select:{show(x){menu=x},close(){}},Player:{play(x){played.push(x)}},Controller:{enabled(){return {name:'settings_component'}},toggle(){}},Noty:{show(x){notes.push(x)}}}};
  vm.runInNewContext(source,{window,URL,AbortController,setTimeout,clearTimeout});
  params[0].onChange();
  return {get menu(){return menu},choose(i){menu.onSelect(menu.items[i])},back(){menu.onBack()},played,notes};
}
async function until(e,re){
  for(let i=0;i<100;i++){if(re.test(e.menu.title))return;await new Promise(r=>setTimeout(r,10));}
  assert.fail('Expected '+re+' but got '+e.menu.title);
}
test('async film uses validated fixture adapter end to end',async()=>{
 const e=setup();e.choose(0);assert.match(e.menu.title,/Загрузка/);await until(e,/Результаты/);
 e.choose(0);await until(e,/озвучку/);e.choose(0);await until(e,/Формат/);e.choose(0);
 assert.equal(e.played.length,1);assert.match(e.played[0].url,/flower\.mp4$/);
});
test('async series flow',async()=>{
 const e=setup();e.choose(0);await until(e,/Результаты/);e.choose(1);await until(e,/озвучку/);e.choose(0);await until(e,/Выберите сезон/);e.choose(1);await until(e,/Сезон 2/);e.choose(2);await until(e,/Формат/);e.choose(1);assert.match(e.played[0].title,/серия 3/);
});
test('cancel ignores stale result',async()=>{
 const e=setup();e.choose(0);e.back();await new Promise(r=>setTimeout(r,250));assert.match(e.menu.title,/0\.1\.3/);assert.equal(e.played.length,0);
});
test('503 error supports retry and back',async()=>{
 const e=setup();e.choose(4);e.choose(0);await until(e,/Ошибка/);e.choose(0);await until(e,/Ошибка/);e.back();assert.match(e.menu.title,/0\.1\.3/);e.choose(4);e.choose(0);await until(e,/Результаты/);
});
