






(function () {
  'use strict';
  var T = window.T;
  if (!T) return;
  var PAGE = 'https://castgames.com.au/higher-or-lower-cricket/', CATS = ['testruns', 'testwkts'], LS_CAT = 'fo_cat_v1';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function urlCat() { var m = /[?&]cat=([a-z0-9]+)(?=&|#|$)/.exec(location.search); return m ? m[1] : null; }
  
  function to(cat) {
    var c = CATS.indexOf(cat) >= 0 ? cat : CATS.indexOf(lsGet(LS_CAT)) >= 0 ? lsGet(LS_CAT) : CATS[0];
    var keep = location.search.replace(/^\?/, '').split('&').filter(function (x) { return x && !/^(play|cat|po)=/.test(x); });
    return PAGE + '?' + ['cat=' + c].concat(keep).join('&') + location.hash;
  }
  function go(cat) { location.replace(to(cat)); }
  T.ou = { open: function (cat) { go(cat || urlCat()); }, on: function () { return true; } };
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) T.ou._to = to; 
  
  if (T.ouWanted || window.CG_MODE === 'ou' || /[?&](play=ou|po=[a-z0-9]+)(?=&|#|$)/.test(location.search)) {
    var boot = document.createElement('style');
    boot.textContent = 'html.ou-boot .screen { display: none !important; }';
    document.head.appendChild(boot);
    document.documentElement.classList.add('ou-boot');
    go(urlCat());
  }
})();
