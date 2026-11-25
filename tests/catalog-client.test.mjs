import test from 'node:test';
import assert from 'node:assert/strict';
import {createCatalogClient} from '../src/catalog-client.mjs';
const base='https://catalog.example';
function reply(data, options={}) {
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'},...options});
}
function client(fetcher, options={}) {
  return createCatalogClient({origin:base,mediaOrigins:['https://media.example'],fetcher,...options});
}
test('search encodes query and sends anonymous request without redirects',async()=>{
  const c=client(async(url,opts)=>{
    const u=new URL(url);assert.equal(u.origin,base);assert.equal(u.pathname,'/v1/search');
    assert.equal(u.searchParams.get('q'),'a&b #');assert.equal(opts.credentials,'omit');assert.equal(opts.redirect,'error');
    assert.equal(opts.headers.Accept,'application/json');assert.equal('User-Agent' in opts.headers,false);
    return reply([{id:'1',title:'Example',kind:'movie',year:2020}]);
  });
  assert.equal((await c.search('a&b #'))[0].title,'Example');
});
test('voices, seasons and episodes carry identifiers',async()=>{
  const c=client(async(url)=>{
    const u=new URL(url);assert.equal(u.searchParams.get('id'),'movie-1');
    if(u.pathname.endsWith('/voices'))return reply([{id:'a',title:'English'}]);
    assert.equal(u.searchParams.get('voice'),'a');
    if(u.pathname.endsWith('/seasons'))return reply([1,2]);
    assert.equal(u.searchParams.get('season'),'2');return reply([1,2,3]);
  });
  assert.equal((await c.voices('movie-1'))[0].id,'a');
  assert.deepEqual(await c.seasons('movie-1','a'),[1,2]);
  assert.deepEqual(await c.episodes('movie-1','a',2),[1,2,3]);
});
test('sort by actual resolution rather than array position',async()=>{
  const c=client(async(url)=>{
    assert.equal(new URL(url).searchParams.get('episode'),'3');
    return reply([720,2160,1080].map(height=>({height,title:String(height),url:'https://media.example/'+height+'.mp4'})));
  });
  assert.deepEqual((await c.streams('1','a',2,3)).map(x=>x.height),[2160,1080,720]);
});
test('reject untrusted stream origins and invalid episode pairs',async()=>{
  for(const url of ['http://media.example/v','https://untrusted.example/v','https://user:password@media.example/v','javascript:alert(1)']){
    const c=client(async()=>reply([{url,height:720,title:'720p'}]));
    await assert.rejects(c.streams('1','a'),{code:'INVALID_STREAM_URL'});
  }
  await assert.rejects(client(async()=>{throw Error('unexpected')}).streams('1','a',1),{code:'INVALID_EPISODE'});
});
test('access failures are not retried',async()=>{
  for(const status of [401,403,429,451,503]){
    let calls=0;const c=client(async()=>{calls++;return reply({}, {status});});
    await assert.rejects(c.search('test'),{code:'HTTP_ERROR',status});assert.equal(calls,1);
  }
});
test('reject invalid type, malformed JSON and schema',async()=>{
  await assert.rejects(client(async()=>new Response('<html>')).search('x'),{code:'INVALID_CONTENT_TYPE'});
  await assert.rejects(client(async()=>new Response('{',{headers:{'Content-Type':'application/json'}})).search('x'),{code:'INVALID_JSON'});
  await assert.rejects(client(async()=>reply([{id:'1',title:'x',kind:'other',year:2020}])).search('x'),{code:'INVALID_RESPONSE'});
});
test('aborts pending response on timeout',async()=>{
  const c=client(async(url,opts)=>new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(new Error('abort')),{once:true})),{timeoutMs:10});
  await assert.rejects(c.search('test'),{code:'TIMEOUT'});
});
