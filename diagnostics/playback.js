/* Lampa playback smoke test 0.0.2. Only public MDN example videos. */
(function (root) {
  'use strict';
  var guard = '__max_tac_playback_smoke_002';
  if (root[guard]) return;
  var l = root.Lampa;
  if (!l) return;
  var initialized = false;
  var samples = [
    {title: 'Тест MP4 (MDN)', url: 'https://developer.mozilla.org/shared-assets/videos/flower.mp4'},
    {title: 'Тест WebM (MDN)', url: 'https://developer.mozilla.org/shared-assets/videos/flower.webm'}
  ];
  function notify(message) {
    if (l.Noty && typeof l.Noty.show === 'function') l.Noty.show(message);
    else if (root.console && typeof root.console.warn === 'function') root.console.warn(message);
  }
  function focus() {
    if (l.Controller && typeof l.Controller.toggle === 'function') l.Controller.toggle('content');
  }
  function init() {
    if (initialized) return;
    if (!l.Select || typeof l.Select.show !== 'function' || typeof l.Select.close !== 'function' ||
        !l.Player || typeof l.Player.play !== 'function') {
      notify('Тест: API Select или Player недоступен');
      return;
    }
    initialized = true;
    var items = samples.map(function (sample, index) {
      return {title: sample.title, sampleIndex: index};
    });
    items.push({title: 'Закрыть', sampleIndex: -1});
    l.Select.show({
      title: 'Lampa: тест воспроизведения 0.0.2',
      items: items,
      onSelect: function (item) {
        l.Select.close();
        focus();
        var index = item && item.sampleIndex;
        if (typeof index !== 'number' || index % 1 !== 0 || index < 0 || index >= samples.length) return;
        var sample = samples[index];
        try {
          l.Player.play({title: sample.title, url: sample.url});
        } catch (error) {
          notify('Тест: не удалось вызвать Player.play');
        }
      },
      onBack: function () { l.Select.close(); focus(); }
    });
  }
  if (root.appready) {
    root[guard] = true;
    init();
  } else if (l.Listener && typeof l.Listener.follow === 'function') {
    root[guard] = true;
    l.Listener.follow('app', function (event) {
      if (event && event.type === 'ready') init();
    });
  }
}(typeof window !== 'undefined' ? window : {}));
