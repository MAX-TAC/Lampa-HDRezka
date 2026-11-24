/* Lampa client prototype 0.1.2-demo.
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
  var demo = {
    search:function(query){
      var q=String(query||'').trim().toLowerCase();
      return catalog.filter(function(x){return !q || x.title.toLowerCase().indexOf(q)!==-1;});
    },
    voices:function(){return [{id:'a',title:'Озвучка A (имитация)'},{id:'b',title:'Озвучка B (имитация)'}];},
    seasons:function(){return [1,2];},
    episodes:function(){return [1,2,3];},
    streams:function(){return [{title:'MP4 (образец)',url:VIDEO},{title:'WebM (образец)',url:WEBM}];}
  };
  function createClient(l,provider){
    var closed=false, generation=0, previous='content', simulatedLogin=false, activeMirror=0;
    var mirrors=['Тестовый сервер A','Тестовый сервер B'];
    function notify(s){if(l.Noty && typeof l.Noty.show==='function')l.Noty.show(s);}
    function focus(){if(l.Controller && typeof l.Controller.toggle==='function')l.Controller.toggle(previous);}
    function exit(){closed=true;generation++;focus();}
    function pick(title,options,choose,back){
      if(closed)return;
      var token=++generation, items=options.map(function(x,i){return {title:String(x.title),demoIndex:i};});
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
    function quality(movie,voice,season,episode,back){
      var variants=provider.streams(movie,voice,season,episode);
      if(!variants.length){notify('Нет доступных форматов');back();return;}
      pick('Формат видео (демо)',variants,function(v){play(movie.title,episode,v,back);},back);
    }
    function episodes(movie,voice,season,back){
      var list=provider.episodes(movie,voice,season).map(function(n){return {title:'Серия '+n,n:n};});
      function again(){episodes(movie,voice,season,back);}
      pick('Сезон '+season,list,function(x){quality(movie,voice,season,x.n,again);},back);
    }
    function seasons(movie,voice,back){
      var list=provider.seasons(movie,voice).map(function(n){return {title:'Сезон '+n,n:n};});
      function again(){seasons(movie,voice,back);}
      pick('Выберите сезон',list,function(x){episodes(movie,voice,x.n,again);},back);
    }
    function voices(movie,back){
      function again(){voices(movie,back);}
      pick('Выберите озвучку (демо)',provider.voices(movie),function(v){
        if(movie.kind==='series')seasons(movie,v,again);
        else quality(movie,v,null,null,again);
      },back);
    }
    function results(query){
      var found=provider.search(query);
      if(!found.length){notify('Ничего не найдено');home();return;}
      function again(){results(query);}
      pick('Результаты поиска (демо)',found,function(x){voices(x,again);},home);
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
      pick('Lampa HDRezka — ДЕМО 0.1.2',[
        {title:'Тестовый каталог',action:'catalog'},
        {title:'Поиск',action:'search'},
        {title:'Тестовая сессия: '+(simulatedLogin?'активна':'нет'),action:'session'},
        {title:'Имитация сбоя: '+mirrors[activeMirror],action:'mirror'},
        {title:'Закрыть',action:'exit'}
      ],function(x){
        if(x.action==='catalog')results('');
        else if(x.action==='search')search();
        else if(x.action==='session'){simulatedLogin=!simulatedLogin;home();}
        else if(x.action==='mirror'){activeMirror=1-activeMirror;simulatedLogin=false;home();}
        else exit();
      },exit);
    }
    return {open:function(cardKind){
      if(!closed && generation)return;
      closed=false;
      var c=l.Controller && typeof l.Controller.enabled==='function' && l.Controller.enabled();
      previous=c && typeof c.name==='string'?c.name:'content';
      if(cardKind==='movie'||cardKind==='series'){
        var entry=provider.search('').filter(function(x){return x.kind===cardKind;})[0];
        if(entry){voices(entry,home);return;}
      }
      home();
    }};
  }
  if(typeof module==='object' && module.exports){module.exports={createClient:createClient,demo:demo};return;}
  var l=root.Lampa, key='__max_tac_hdrezka_demo_012';
  if(!l||root[key])return;
  var started=false;
  function init(){
    if(started)return;
    if(!l.Select||typeof l.Select.show!=='function'||typeof l.Select.close!=='function'||
       !l.Player||typeof l.Player.play!=='function'||!l.SettingsApi||
       typeof l.SettingsApi.addComponent!=='function'||typeof l.SettingsApi.addParam!=='function'){
      if(root.console && typeof root.console.warn==='function')root.console.warn('[HDRezka demo 0.1.2] Required API unavailable');
      return;
    }
    var client=createClient(l,demo);
    var component='max_tac_hdrezka_demo';
    root.Lampa.SettingsApi.addComponent({
      component:component,
      name:'HDRezka — ДЕМО',
      icon:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>'
    });
    root.Lampa.SettingsApi.addParam({
      component:component,
      param:{name:'max_tac_hdrezka_demo_open',type:'button'},
      field:{name:'Открыть тестовый каталог',description:'Демонстрация интерфейса 0.1.2. Без подключения к HDRezka.'},
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
    if(root.console && typeof root.console.info==='function')root.console.info('[HDRezka demo 0.1.2] Settings registered');
  }
  root[key]=true;
  if(root.appready)init();
  else if(l.Listener&&typeof l.Listener.follow==='function')l.Listener.follow('app',function(e){if(e&&e.type==='ready')init();});
}(typeof window!=='undefined'?window:{}));
