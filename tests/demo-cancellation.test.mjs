import test from 'node:test';
import assert from 'node:assert/strict';
import {createCatalogClient} from '../src/catalog-client.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
test('already cancelled request never reaches transport',async()=>{
 const ctrl=new AbortController();ctrl.abort();let calls=0;
 const c=createCatalogClient({origin:'https://example.org',fetcher:async()=>{calls++;}});
 await assert.rejects(c.search('x',ctrl.signal),{code:'CANCELLED'});assert.equal(calls,0);
});
test('user cancellation aborts active transport, distinct from timeout',async()=>{
 const ctrl=new AbortController();let observed=false;
 const c=createCatalogClient({origin:'https://example.org',fetcher:async(u,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>{observed=true;reject(Error('abort'));},{once:true}))});
 const promise=c.search('x',ctrl.signal);ctrl.abort();
 await assert.rejects(promise,{code:'CANCELLED'});assert.equal(observed,true);
});
const source=fs.readFileSync(new URL('../dist/rezka-demo-v014.js',import.meta.url),'utf8');
function client(provider){
 const module={exports:{}};vm.runInNewContext(source,{module,URL,AbortController,setTimeout,clearTimeout});
 let menu;const l={Select:{show(m){menu=m},close(){}},Controller:{toggle(){}},Player:{play(){}}};
 module.exports.createClient(l,provider).open();
 return {get menu(){return menu},choose(i){menu.onSelect(menu.items[i])},back(){menu.onBack()}};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('UI Back aborts active request and ignores rejected promise',async()=>{
 let seen;
 const e=client({search(q,signal){seen=signal;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('abort')),{once:true}));}});
 e.choose(0);await tick();assert.equal(seen.aborted,false);e.back();await tick();assert.equal(seen.aborted,true);assert.match(e.menu.title,/0\.1\.4/);
});
test('access denial does not present retry',async()=>{
 for(const status of [401,403,429,451]){
  const e=client({search(){return Promise.reject({code:'HTTP_ERROR',status});}});e.choose(0);await tick();
  assert.match(e.menu.title,new RegExp(String(status)));assert.equal(e.menu.items.length,1);assert.equal(e.menu.items[0].title,'Назад');
 }
});
test('temporary HTTP 503 presents manual retry',async()=>{
 const e=client({search(){return Promise.reject({code:'HTTP_ERROR',status:503});}});e.choose(0);await tick();assert.equal(e.menu.items[0].title,'Повторить');
});
test('browser embedded client matches source transform',()=>{
 const original=fs.readFileSync(new URL('../src/catalog-client.mjs',import.meta.url),'utf8');
 const extracted=source.slice(source.indexOf('// Generic, first-party JSON catalog contract'),source.indexOf('  // A local transport'));
 assert.equal(extracted.trim(),original.replace("import { validateOrigin } from './network.mjs';","function validateOrigin(value) {\n  const u = new URL(value);\n  if (u.protocol !== 'https:' || u.username || u.password || u.pathname !== '/' || u.search || u.hash) throw new Error('Invalid HTTPS origin');\n  return u.origin;\n}").replaceAll('export ','').replace('fetcher = globalThis.fetch','fetcher = root.fetch').trim());
});
