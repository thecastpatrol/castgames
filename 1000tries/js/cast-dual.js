







(function () {
  'use strict';
  var box = document.querySelector('[data-cast-dual]');
  if (!box) return;
  var FROM = '2026-10-14', SECOND_UNTIL = '2026-10-17', UNTIL = '2026-10-28';
  var CA = window.CAST_ACCOUNT || {}, IS27 = CA.game === '27-0';
  
  var ALL = [
    ['Mathieu Jussaume', 'fra', 'C', 'SR', 1], ['George Williams', 'eng', 'HB', 'FE', 1], ['Patrick Carrigan', 'aus', 'LK', 'P', 1],
    ['Latu Fainu', 'ton', 'HB', 'FE', 1], ['Esan Marsters', 'cok', 'C', 'HB', 1], ['Morgan Knowles', 'eng', 'LK', 'P', 1],
    ['Francis Manuleleua', 'sam', 'SR', 'LK', 0], ['Bayleigh Bentley-Hape', 'fij', 'W', 'FB', 0], ['Julian Bousquet', 'fra', 'P', 'LK', 1],
    ['Arthur Romano', 'fra', 'W', 'SR', 1], ['Guillermo Aispuro-Bichet', 'fra', 'LK', 'C', 1], ['James Roumanos', 'leb', 'LK', 'P', 1],
    ['Jaxson Rahme', 'leb', 'LK', 'P', 0], ['Bailey Biondi-Odo', 'png', 'FE', 'HB', 0], ['Delahia Wigmore', 'cok', 'C', 'SR', 1],
    ['Cameron Brown', 'cok', 'FE', 'W', 0]
    
    
  ];
  var LIST = ALL.filter(function (u) { return IS27 || u[4]; });
  var BANNER = LIST.slice(0, 5); 
  
  var NAT = { aus: ['#00843D', 'AUS'], nzl: ['#111111', 'NZL'], eng: ['#F4F4F4', 'ENG'], fra: ['#1B3A8C', 'FRA'], sam: ['#0B2D7A', 'SAM'],
    ton: ['#C10F1F', 'TON'], fij: ['#5DB8E6', 'FIJ'], png: ['#C8102E', 'PNG'], leb: ['#008D45', 'LEB'], cok: ['#0A2A66', 'COK'] };
  var POS = { FB: 'Fullback', W: 'Wing', C: 'Centre', FE: 'Five-Eighth', HB: 'Halfback', HK: 'Hooker', P: 'Prop', SR: 'Second Row', LK: 'Lock' };

  function today() {
    var p = {};
    new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }
  function state(day) { return day < FROM || day >= UNTIL ? 'off' : day < SECOND_UNTIL ? '2' : 'mid'; }
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
    var n = NAT[u[1]] || ['#333333', u[1].toUpperCase()];
    return '<div class="cp-dual-c' + (big ? ' is-big' : '') + '" style="--c:' + n[0] + ';color:' + (light(n[0]) ? '#111' : '#fff') + '" aria-label="' + esc(u[0] + ', ' + POS[u[2]] + ', now ' + POS[u[3]] + ' too') + '">' +
      '<span class="cd-add" aria-hidden="true">+' + u[3] + '</span>' +
      (full ? '<span class="cd-nat">' + n[1] + '</span>' : '') +
      '<span class="cd-pos">' + u[2] + '<i>/' + u[3] + '</i></span>' +
      '<span class="cd-n">' + esc(full ? u[0] : surname(u[0])).replace('-', '-<wbr>') + '</span></div>';
  }

  box.innerHTML = '<button type="button" class="cp-dual-spot" data-dual="open" aria-label="Team List Updates: see all ' + LIST.length + ' new dual position players">' +
    '<span class="cp-dual-head"><b>Team List <span>Updates</span></b><span class="cp-dual-all">All ' + LIST.length + ' &rsaquo;</span></span>' +
    '<span class="cp-dual-row">' + BANNER.map(function (u, i) { return card(u, i === 2, false); }).join('') + '</span></button>';
  place(state(today()));

  var pop = null;
  function shut() { if (pop && !pop.hidden) { pop.hidden = true; document.documentElement.classList.remove('cp-dual-open'); } }
  function open() {
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'cp-dual';
      pop.hidden = true;
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-modal', 'true');
      pop.setAttribute('aria-label', 'Team List Updates');
      pop.innerHTML = '<div class="cp-dual-box"><button type="button" class="cp-dual-x" data-dual="close" aria-label="Close">&#x2715;</button>' +
        '<div class="cp-dual-top"><p class="cp-dual-k">World Cup Mode</p><h2 class="cp-dual-t">New Dual Positions</h2>' +
        '<p class="cp-dual-s">From Team List Tuesday: ' + LIST.length + ' players named in a new spot now have a second position. Draft them in either spot in ' +
          (IS27 ? 'World Cup&nbsp;8-0' : 'World Cup&nbsp;200+') + '.</p></div>' +
        '<div class="cp-dual-grid">' + LIST.map(function (u) { return card(u, false, true); }).join('') + '</div>' +
        '<div class="cp-dual-foot"><button type="button" class="cp-dual-go" data-dual="play">Play ' + (IS27 ? 'World Cup 8-0' : 'World Cup 200+') + '</button></div></div>';
      document.body.appendChild(pop);
      pop.addEventListener('click', function (e) {
        var b = e.target.closest('[data-dual]');
        if (!b && e.target !== pop) return;
        var act = b ? b.getAttribute('data-dual') : 'close';
        shut();
        if (act === 'play') {
          ga('dual_play');
          try { CA.promoPlay('wc'); } catch (x) {   }
        } else ga('dual_close');
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    }
    pop.querySelector('.cp-dual-grid').scrollTop = 0;
    pop.hidden = false;
    document.documentElement.classList.add('cp-dual-open');
    if (pop.nextElementSibling) document.body.appendChild(pop); 
  }
  box.addEventListener('click', function (e) { if (e.target.closest('[data-dual="open"]')) { ga('dual_tap'); open(); } });

  
  var seen = false;
  new MutationObserver(function () {
    if (seen || box.hidden || box.hasAttribute('data-spot-off') || !box.offsetParent) return;
    seen = true;
    ga('dual_view', { pos: box.getAttribute('data-spot-pos') || '' });
  }).observe(box, { attributes: true, attributeFilter: ['data-spot-off', 'hidden'] });

  window.cpDual = { state: state, place: place, open: open };
})();
