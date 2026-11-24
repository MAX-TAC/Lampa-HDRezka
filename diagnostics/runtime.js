/* Read-only runtime diagnostic. No network, storage, cookies, account data or UA spoofing. */
(function (root) {
  'use strict';
  function inspect(env) {
    var l = env.Lampa || {};
    var nav = env.navigator || {};
    var loc = env.location || {};
    var ua = typeof nav.userAgent === 'string' ? nav.userAgent : '';
    var chrome = /(?:Chrome|Chromium)\/(\d+)/.exec(ua);
    var settings = l.SettingsApi || {};
    var player = l.Player || {};
    return {
      origin: loc.protocol === 'http:' || loc.protocol === 'https:' ? loc.protocol + '//' + loc.host : 'non-http',
      chromium: chrome ? Number(chrome[1]) : null,
      webOS: /Web0S|webOS/i.test(ua),
      android: /Android/i.test(ua),
      fetch: typeof env.fetch === 'function',
      xhr: typeof env.XMLHttpRequest === 'function',
      abortController: typeof env.AbortController === 'function',
      url: typeof env.URL === 'function',
      promise: typeof env.Promise === 'function',
      settings: typeof settings.addComponent === 'function' && typeof settings.addParam === 'function',
      request: typeof l.Reguest === 'function',
      player: typeof player.play === 'function',
      ready: env.appready === true
    };
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = inspect;
    return;
  }
  function show() {
    var data = inspect(root);
    var report = JSON.stringify(data, null, 2);
    if (root.console && typeof root.console.info === 'function') root.console.info('[Lampa-HDRezka diagnostic]', report);
    var l = root.Lampa || {};
    if (l.Select && typeof l.Select.show === 'function' && typeof l.Select.close === 'function') {
      var items = Object.keys(data).map(function (key) {
        // Escape strings before passing them to a renderer that may interpret HTML.
        var value = String(data[key]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return {title: key + ': ' + value};
      });
      function close() {
        l.Select.close();
        if (l.Controller && typeof l.Controller.toggle === 'function') l.Controller.toggle('content');
      }
      l.Select.show({title: 'Lampa runtime diagnostics 0.0.1', items: items, onSelect: close, onBack: close});
    } else if (typeof root.alert === 'function') root.alert(report);
  }
  if (root.appready) show();
  else if (root.Lampa && root.Lampa.Listener && typeof root.Lampa.Listener.follow === 'function') {
    var shown = false;
    root.Lampa.Listener.follow('app', function (event) {
      if (!shown && event && event.type === 'ready') { shown = true; show(); }
    });
  } else show();
}(typeof window !== 'undefined' ? window : {}));
