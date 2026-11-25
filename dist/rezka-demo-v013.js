/* Lampa client prototype 0.1.3-demo.
 * Independent implementation; upstream concept: gmm67 rezka.js
 * https://gist.github.com/gmm67/888fc9f66b7801c3daedac316ad38ad9
 * Demo fixtures only; no HDRezka requests, passwords, cookies or UA changes.
 */
(function(root){
  'use strict';
  var VIDEO = 'https://developer.mozilla.org/shared-assets/videos/flower.mp4';
  var WEBM = 'https://developer.mozilla.org/shared-assets/videos/flower.webm';
  var catalog = [
    {id:'film',title:'Цветок — тестовый фильм',year:2026,kind:'movie'},
    {id:'series',title:'Цветок — тестовый сериал',year:2026,kind:'series'}
  ];
// Generic, first-party JSON catalog contract; not an HDRezka API.
// No credentials, proxy, redirects, forged UA or implicit mirror changes.
function validateOrigin(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.pathname !== '/' || u.search || u.hash) throw new Error('Invalid HTTPS origin');
  return u.origin;
}

class CatalogError extends Error {
  constructor(code, status = null) {
    super(code); this.name = 'CatalogError'; this.code = code; this.status = status;
  }
}
function check(condition) { if (!condition) throw new CatalogError('INVALID_RESPONSE'); }
function str(value, max = 256) {
  check(typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value));
  return value;
}
function number(value, min, max) {
  check(Number.isInteger(value) && value >= min && value <= max);
  return value;
}
function list(value, map) {
  check(Array.isArray(value) && value.length <= 500);
  return value.map(map);
}
function named(value) {
  check(value && typeof value === 'object');
  return { id: str(value.id, 128), title: str(value.title) };
}
function createCatalogClient({origin, mediaOrigins = [], fetcher = root.fetch, timeoutMs = 5000}) {
  const base = validateOrigin(origin);
  const media = new Set([base, ...mediaOrigins.map(validateOrigin)]);
  if (typeof fetcher !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new TypeError('Invalid transport');
  async function get(path, params) {
    const u = new URL('/v1/' + path, base);
    Object.entries(params || {}).forEach(([k,v]) => u.searchParams.set(k, String(v)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await fetcher(u.href, {
        method: 'GET', headers: {Accept:'application/json'}, credentials:'omit',
        redirect:'error', cache:'no-store', referrerPolicy:'no-referrer', signal:controller.signal
      });
      if (!r.ok) throw new CatalogError('HTTP_ERROR', r.status);
      if (r.redirected || (r.url && new URL(r.url).origin !== base)) throw new CatalogError('INVALID_ORIGIN');
      if (!/^application\/json(?:\s*;|$)/i.test(r.headers.get('content-type') || '')) throw new CatalogError('INVALID_CONTENT_TYPE');
      const raw = await r.text();
      if (raw.length > 1000000) throw new CatalogError('RESPONSE_TOO_LARGE');
      try { return JSON.parse(raw); } catch { throw new CatalogError('INVALID_JSON'); }
    } catch (e) {
      if (e instanceof CatalogError) throw e;
      throw new CatalogError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR');
    } finally { clearTimeout(timer); }
  }
  function stream(value) {
    check(value && typeof value === 'object');
    let u;
    try { u = new URL(str(value.url, 8192)); } catch { throw new CatalogError('INVALID_STREAM_URL'); }
    if (u.protocol !== 'https:' || u.username || u.password || !media.has(u.origin)) throw new CatalogError('INVALID_STREAM_URL');
    return {url:u.href, height:number(value.height, 1, 4320), title:str(value.title)};
  }
  function id(value) { return str(value,128); }
  return Object.freeze({
    async search(query) {
      return list(await get('search',{q:str(query,256)}), value => {
        const item = named(value);
        check(value.kind === 'movie' || value.kind === 'series');
        return {...item,kind:value.kind,year:number(value.year,1888,2100)};
      });
    },
    async voices(movieId) { return list(await get('voices',{id:id(movieId)}), named); },
    async seasons(movieId, voiceId) { return list(await get('seasons',{id:id(movieId),voice:id(voiceId)}), x=>number(x,0,999)); },
    async episodes(movieId, voiceId, season) { return list(await get('episodes',{id:id(movieId),voice:id(voiceId),season:number(season,0,999)}),x=>number(x,1,9999)); },
    async streams(movieId,voiceId,season=null,episode=null) {
      const p={id:id(movieId),voice:id(voiceId)};
      if ((season===null)!==(episode===null)) throw new CatalogError('INVALID_EPISODE');
      if (season!==null) {p.season=number(season,0,999);p.episode=number(episode,1,9999);}
      return list(await get('streams',p),stream).sort((a,b)=>b.height-a.height);
    }
  });
}

  // A local transport exercises the same client contract. No network request is made.
  var fixtureMode='ok';
  function fixtureFetch(url,opts){
    var u=new URL(url), p=u.searchParams, data;
    if(u.origin!=='https://catalog.example')return Promise.reject(new Error('unexpected origin'));
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){
        opts.signal.removeEventListener('abort',abort);
        if(fixtureMode==='error'){resolve({ok:false,status:503});return;}
        if(u.pathname==='/v1/search'){
          var q=(p.get('q')||'').trim().toLowerCase();
          data=catalog.filter(function(x){return q==='*'||x.title.toLowerCase().indexOf(q)!==-1;});
        }else if(u.pathname==='/v1/voices')data=[{id:'a',title:'Озвучка A (имитация)'},{id:'b',title:'Озвучка B (имитация)'}];
        else if(u.pathname==='/v1/seasons')data=[1,2];
        else if(u.pathname==='/v1/episodes')data=[1,2,3];
        else if(u.pathname==='/v1/streams')data=[{title:'MP4 (образец)',height:240,url:VIDEO},{title:'WebM (образец)',height:240,url:WEBM}];
        else{resolve({ok:false,status:404});return;}
        resolve({ok:true,status:200,url:url,headers:{get:function(){return 'application/json';}},text:function(){return Promise.resolve(JSON.stringify(data));}});
      },150);
      function abort(){clearTimeout(timer);reject(new Error('aborted'));}
      if(opts.signal.aborted)abort();
      else opts.signal.addEventListener('abort',abort,{once:true});
    });
  }
  function makeDemo(){
    var api=createCatalogClient({origin:'https://catalog.example',mediaOrigins:['https://developer.mozilla.org'],fetcher:fixtureFetch});
    return {
      search:function(q){return api.search(q||'*');},
      voices:function(m){return api.voices(m.id);},
      seasons:function(m,v){return api.seasons(m.id,v.id);},
      episodes:function(m,v,n){return api.episodes(m.id,v.id,n);},
      streams:function(m,v,n,e){return api.streams(m.id,v.id,n,e);}
    };
  }
  function createClient(l,provider){
    var closed=false, generation=0, previous='content', simulatedLogin=false, activeMirror=0;
    var mirrors=['Тестовый сервер A','Тестовый сервер B'];
    function notify(s){if(l.Noty && typeof l.Noty.show==='function')l.Noty.show(s);}
    function focus(){if(l.Controller && typeof l.Controller.toggle==='function')l.Controller.toggle(previous);}
    function exit(){closed=true;generation++;focus();}
    function pick(title,options,choose,back){
      if(closed)return;
      var token=++generation, items=options.map(function(x,i){return {title:String(x.title).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'),demoIndex:i};});
      function finish(fn){
        if(closed || token!==generation)return;
        generation++;
        l.Select.close();fn();
      }
      l.Select.show({title:title,items:items,
        onSelect:function(item){
          var i=item && item.demoIndex;
          if(typeof i!=='number'||i%1!==0||i<0||i>=options.length)return;
          finish(function(){choose(options[i]);});
        },
        onBack:function(){finish(back||exit);}
      });
    }
    function play(title,episode,stream,back){
      if(!stream || (stream.url!==VIDEO && stream.url!==WEBM)){
        notify('Недопустимый тестовый URL');back();return;
      }
      exit();
      try{l.Player.play({title:title+(episode?' — серия '+episode:''),url:stream.url});}
      catch(e){notify('Ошибка вызова плеера');}
    }
    function load(work,done,back){
      if(closed)return;
      var token=++generation;
      function cancel(){
        if(closed||token!==generation)return;
        generation++;l.Select.close();back();
      }
      l.Select.show({title:'Загрузка (демо)',items:[{title:'Отмена'}],onSelect:cancel,onBack:cancel});
      Promise.resolve().then(work).then(function(result){
        if(closed||token!==generation)return;
        generation++;l.Select.close();done(result);
      },function(error){
        if(closed||token!==generation)return;
        generation++;l.Select.close();
        pick('Ошибка запроса (демо)',[{title:'Повторить',retry:true},{title:'Назад'}],function(x){
          if(x.retry)load(work,done,back);else back();
        },back);
      });
    }
    function quality(movie,voice,season,episode,back){
      load(function(){return provider.streams(movie,voice,season,episode);},function(variants){
        if(!variants.length){notify('Нет доступных форматов');back();return;}
        pick('Формат видео (демо)',variants,function(v){play(movie.title,episode,v,back);},back);
      },back);
    }
    function episodes(movie,voice,season,back){
      function again(){episodes(movie,voice,season,back);}
      load(function(){return provider.episodes(movie,voice,season);},function(numbers){
        if(!numbers.length){notify('Нет серий');back();return;}
        pick('Сезон '+season,numbers.map(function(n){return {title:'Серия '+n,n:n};}),function(x){quality(movie,voice,season,x.n,again);},back);
      },back);
    }
    function seasons(movie,voice,back){
      function again(){seasons(movie,voice,back);}
      load(function(){return provider.seasons(movie,voice);},function(numbers){
        if(!numbers.length){notify('Нет сезонов');back();return;}
        pick('Выберите сезон',numbers.map(function(n){return {title:'Сезон '+n,n:n};}),function(x){episodes(movie,voice,x.n,again);},back);
      },back);
    }
    function voices(movie,back){
      function again(){voices(movie,back);}
      load(function(){return provider.voices(movie);},function(list){
        if(!list.length){notify('Нет озвучек');back();return;}
        pick('Выберите озвучку (демо)',list,function(v){
          if(movie.kind==='series')seasons(movie,v,again);
          else quality(movie,v,null,null,again);
        },back);
      },back);
    }
    function results(query){
      function again(){results(query);}
      load(function(){return provider.search(query);},function(found){
        if(!found.length){notify('Ничего не найдено');home();return;}
        pick('Результаты поиска (демо)',found,function(x){voices(x,again);},home);
      },home);
    }
    function search(){
      if(!l.Input || typeof l.Input.edit!=='function'){results('');return;}
      var token=++generation;
      l.Input.edit({title:'Поиск в тестовом каталоге',value:'',free:true,nosave:true},function(q){
        if(closed||token!==generation)return;
        generation++;results(typeof q==='string'?q:'');
      });
    }
    function home(){
      pick('Lampa HDRezka — ДЕМО 0.1.3',[
        {title:'Тестовый каталог',action:'catalog'},
        {title:'Поиск',action:'search'},
        {title:'Тестовая сессия: '+(simulatedLogin?'активна':'нет'),action:'session'},
        {title:'Имитация сбоя: '+mirrors[activeMirror],action:'mirror'},
        {title:'Имитация HTTP 503: '+(fixtureMode==='error'?'вкл':'выкл'),action:'error'},
        {title:'Закрыть',action:'exit'}
      ],function(x){
        if(x.action==='catalog')results('');
        else if(x.action==='search')search();
        else if(x.action==='session'){simulatedLogin=!simulatedLogin;home();}
        else if(x.action==='mirror'){activeMirror=1-activeMirror;simulatedLogin=false;home();}
        else if(x.action==='error'){fixtureMode=fixtureMode==='error'?'ok':'error';home();}
        else exit();
      },exit);
    }
    return {open:function(cardKind){
      if(!closed && generation)return;
      closed=false;
      var c=l.Controller && typeof l.Controller.enabled==='function' && l.Controller.enabled();
      previous=c && typeof c.name==='string'?c.name:'content';
      if(cardKind==='movie'||cardKind==='series'){
        load(function(){return provider.search('');},function(found){
          var entry=found.filter(function(x){return x.kind===cardKind;})[0];
          if(entry)voices(entry,home);else home();
        },home);return;
      }
      home();
    }};
  }
  if(typeof module==='object' && module.exports){module.exports={createClient:createClient,makeDemo:makeDemo};return;}
  var l=root.Lampa, key='__max_tac_hdrezka_demo_013';
  if(!l||root[key])return;
  var started=false;
  function init(){
    if(started)return;
    if(!l.Select||typeof l.Select.show!=='function'||typeof l.Select.close!=='function'||
       !l.Player||typeof l.Player.play!=='function'||!l.SettingsApi||
       typeof l.SettingsApi.addComponent!=='function'||typeof l.SettingsApi.addParam!=='function'){
      if(root.console && typeof root.console.warn==='function')root.console.warn('[HDRezka demo 0.1.3] Required API unavailable');
      return;
    }
    if(typeof root.AbortController!=='function'||typeof root.URL!=='function'){if(root.console)root.console.warn('[HDRezka demo] Missing browser APIs');return;}
    var client=createClient(l,makeDemo());
    var component='max_tac_hdrezka_demo';
    root.Lampa.SettingsApi.addComponent({
      component:component,
      name:'HDRezka — ДЕМО',
      icon:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>'
    });
    root.Lampa.SettingsApi.addParam({
      component:component,
      param:{name:'max_tac_hdrezka_demo_open',type:'button'},
      field:{name:'Открыть тестовый каталог',description:'Демонстрация интерфейса 0.1.3. Без подключения к HDRezka.'},
      onChange:function(){client.open();}
    });
    if(l.Listener&&typeof l.Listener.follow==='function'&&typeof root.$==='function'){
      l.Listener.follow('full',function(event){
        if(!event||event.type!=='complite'||!event.body||typeof event.body.find!=='function')return;
        if(root.lampa_settings&&root.lampa_settings.read_only)return;
        var movie=event.data&&event.data.movie;
        if(!movie||movie.blocked||movie.adult)return;
        if(event.body.find('.max-tac-rezka-demo-source').length)return;
        var target=event.body.find('.buttons--container').first();
        if(!target.length)target=event.body.find('.full-start-new__buttons').first();
        if(!target.length)return;
        var kind=movie.media_type==='tv'||movie.media_type==='series'||movie.number_of_seasons>0||(!movie.title&&movie.name)?'series':'movie';
        var button=root.$('<div class="full-start__button selector max-tac-rezka-demo-source"><span>HDRezka — ДЕМО</span></div>');
        button.on('hover:enter',function(){client.open(kind);});
        target.append(button);
      });
    }
    started=true;
    if(root.console && typeof root.console.info==='function')root.console.info('[HDRezka demo 0.1.3] Settings registered');
  }
  root[key]=true;
  if(root.appready)init();
  else if(l.Listener&&typeof l.Listener.follow==='function')l.Listener.follow('app',function(e){if(e&&e.type==='ready')init();});
}(typeof window!=='undefined'?window:{}));
