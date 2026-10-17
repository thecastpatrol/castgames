







(function () {
  'use strict';
  var D = window.CP_UPGRADES;
  var box = document.querySelector('[data-cast-upgrades]');
  if (!D || !box) return;
  var FROM = '2026-10-06', SECOND_UNTIL = '2026-10-09', UNTIL = '2026-10-20';
  var CA = window.CAST_ACCOUNT || {}, IS27 = CA.game === '27-0';
  var URL27 = 'https://castgames.com.au/27-0/?utm_source=1000tries&utm_medium=upgrades&utm_campaign=ratings_upgrades';

  function today() {
    var p = {};
    new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }
  
  function state(day) { return day < FROM || day >= UNTIL ? 'off' : !IS27 ? 'end' : day < SECOND_UNTIL ? '2' : 'mid'; }
  function place(pos) {
    if (pos === 'off') { box.hidden = true; box.removeAttribute('data-spot-pos'); return; }
    box.setAttribute('data-spot-pos', pos);
    box.hidden = false;
  }
  function ga(ev, x) {
    x = x || {}; x.game = CA.game || '';
    try { if (typeof CA.track === 'function') CA.track(ev, x); else if (typeof gtag === 'function') gtag('event', ev, x); } catch (e) {   }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function light(h) { var c = parseInt(String(h).slice(1), 16); return ((c >> 16) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114) / 1000 > 150; }
  function surname(n) { var p = n.split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; }
  
  function card(u, big, full) {
    return '<div class="cp-upg-c' + (big ? ' is-big' : '') + '" style="--c:' + esc(u[3]) + ';color:' + (light(u[3]) ? '#111' : '#fff') + '" aria-label="' + esc(u[0] + ', ' + u[1] + ', up from ' + u[4] + ' to ' + u[5]) + '">' +
      '<span class="cu-ch" aria-hidden="true">' + (u[5] - u[4]) + '</span>' +
      (full ? '<span class="cu-tp"><b>' + esc(u[1]) + '</b><i class="cu-cl">' + esc(u[2]) + '</i></span>' : '') +
      '<span class="cu-r">' + u[5] + '</span>' +
      (full ? '<span class="cu-f">from ' + u[4] + '</span>' : '') +
      '<span class="cu-n">' + esc(surname(u[0])).replace('-', '-<wbr>') + '</span></div>';
  }

  box.innerHTML = '<button type="button" class="cp-upg-spot" data-upg="open" aria-label="Ratings Upgrades: see the best ' + D.top.length + '">' +
    '<span class="cp-upg-head"><b>' + (IS27 ? '' : '27-0 ') + 'Ratings <span>Upgrades</span></b><span class="cp-upg-all">Top ' + D.top.length + ' &rsaquo;</span></span>' +
    '<span class="cp-upg-row">' + D.banner.map(function (u, i) { return card(u, i === 2, false); }).join('') + '</span></button>';
  place(state(today()));

  var pop = null;
  function shut() { if (pop && !pop.hidden) { pop.hidden = true; document.documentElement.classList.remove('cp-upg-open'); } }
  function open() {
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'cp-upg';
      pop.hidden = true;
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-modal', 'true');
      pop.setAttribute('aria-label', 'Ratings Upgrades');
      pop.innerHTML = '<div class="cp-upg-box"><button type="button" class="cp-upg-x" data-upg="close" aria-label="Close">&#x2715;</button>' +
        '<div class="cp-upg-top"><p class="cp-upg-k">27-0</p><h2 class="cp-upg-t">Ratings Upgrades</h2>' +
        '<p class="cp-upg-s">' + (IS27 ? D.total + ' players have gone up. Here are the best ' + D.top.length + '. Draft them at their new ratings in your next&nbsp;season.'
          : D.total + ' players have gone up in 27-0, our other game. Here are the best ' + D.top.length + '. Draft them at their new&nbsp;ratings.') + '</p></div>' +
        '<div class="cp-upg-grid">' + D.top.map(function (u) { return card(u, false, true); }).join('') + '</div>' +
        '<div class="cp-upg-foot">' + (IS27 ? '<button type="button" class="cp-upg-go" data-upg="play">Play Classic</button>'
          : '<a class="cp-upg-go" data-upg="play" href="' + URL27 + '" target="_blank" rel="noopener">Play 27-0</a>') + '</div></div>';
      document.body.appendChild(pop);
      pop.addEventListener('click', function (e) {
        var b = e.target.closest('[data-upg]');
        if (!b && e.target !== pop) return;
        var act = b ? b.getAttribute('data-upg') : 'close';
        shut();
        if (act === 'play') {
          ga('upgrades_play');
          
          if (IS27) { try { CA.promoPlay('classic'); } catch (x) {   } }
        } else ga('upgrades_close');
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    }
    pop.querySelector('.cp-upg-grid').scrollTop = 0;
    pop.hidden = false;
    document.documentElement.classList.add('cp-upg-open');
    if (pop.nextElementSibling) document.body.appendChild(pop); 
  }
  box.addEventListener('click', function (e) { if (e.target.closest('[data-upg="open"]')) { ga('upgrades_tap'); open(); } });

  
  var seen = false;
  new MutationObserver(function () {
    if (seen || box.hidden || box.hasAttribute('data-spot-off') || !box.offsetParent) return;
    seen = true;
    ga('upgrades_view', { pos: box.getAttribute('data-spot-pos') || '' });
  }).observe(box, { attributes: true, attributeFilter: ['data-spot-off', 'hidden'] });

  window.cpUpgrades = { state: state, place: place, open: open };
})();
