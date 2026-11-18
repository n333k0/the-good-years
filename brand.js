/* Renders the Tabloid logos and stage names into the brand deck (uses present.js helpers). */
(function () {
  'use strict';
  const T = window.TGY5;
  function go() {
    document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = T.svgFor(el.dataset.logo); T.fit(el.querySelector('svg'), 0.02); });
    document.querySelectorAll('[data-stage]').forEach((el) => {
      el.innerHTML = '<svg class="mk"><g class="ink"><text font-family="Anton" font-size="200" fill="currentColor">' + el.dataset.stage.toUpperCase() + '</text></g></svg>';
      T.fit(el.querySelector('svg'), 0.02);
    });
  }
  T.ready().then(() => { go(); setTimeout(go, 600); document.documentElement.dataset.ready = '1'; });
})();
