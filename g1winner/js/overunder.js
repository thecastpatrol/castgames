












(function () {
  'use strict';
  var T = window.T, E = window.OU_ENGINE;
  if (!T || !E) return;
  
  var NAME = 'HIGHER OR LOWER: RACING', SPORT = 'Racing';
  

  var RC_CATS = {
    jockeyg1: { name: 'Jockey Group 1 Wins', unit: 'Group 1 wins', one: 'Group 1 win', base: 40, step: 12, game: 'racing' },
    bigrace: { name: 'Big Race Wins', unit: 'big race wins', one: 'big race win', base: 30, step: 8, game: 'racing' },
    horseg1: { name: 'Horses\u2019 Group 1 Wins', unit: 'Group 1 wins', one: 'Group 1 win', base: 45, step: 14, game: 'racing' }
  };
  Object.keys(RC_CATS).forEach(function (k) { if (!E.CATS[k]) E.CATS[k] = RC_CATS[k]; });
  var CAT_ORDER = ['jockeyg1', 'bigrace', 'horseg1'];
  var LS_CAT = 'racing_ou_cat_v1', LS_BEST = 'racing_ou_best_v1'; 
  var D = null, loading = null;
  var st = { view: 'start', cat: 'jockeyg1' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {   } }
  function bests() { try { return JSON.parse(lsGet(LS_BEST) || '{}') || {}; } catch (e) { return {}; } }
  function root() { return document.getElementById('ouRoot'); }
  function A() { return window.CastAccount || null; }
  




  var SILKS = {};
  function load() {
    if (D) return Promise.resolve(D);
    if (!loading) loading = Promise.all([
      fetch('data/ou.json?v=20261016.1').then(function (r) { return r.json(); }),
      fetch('data/silks.json?v=20261016.2').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      T.loadPlayers ? T.loadPlayers().catch(function () { return null; }) : null 
    ]).then(function (x) { SILKS = x[1] || {}; D = x[0]; return D; });
    return loading;
  }
  function hexOk(c) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : null; }
  
  function looks(p) {
    if (st.cat !== 'horseg1') {
      var j = T.byId && T.byId[p[2]], L = T.look(j || {});
      return { style: '--club:' + L.primary + ';--club-accent:' + L.accent + ';--club-text:' + L.text + ';--silks:' + L.bg + ';', cls: ' is-silks' + (L.neutral ? ' is-plain' : ''), words: L.words, horse: L.horse };
    }
    var sk = SILKS[p[0]], a = sk && sk.colours && hexOk(sk.colours[0]);
    if (!a) return { style: '--club:#4b5563;--club-accent:#9ca3af;--club-text:#ffffff;', cls: ' is-neutral' };
    var L2 = T.look({ silks: sk });
    return { style: '--club:' + L2.primary + ';--club-accent:' + L2.accent + ';--club-text:' + L2.text + ';--silks:' + L2.bg + ';', cls: ' is-silks', words: sk.words || '' };
  }
  function newSeed() { var s = '', c = 'abcdefghijkmnpqrstuvwxyz23456789'; for (var i = 0; i < 12; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  
  function shown(n) { return String(n || '').replace(/\s*\([^)]*\)\s*$/, ''); }
  function years(p) { var y = String(p[3] || '').split('-'); return !y[0] ? '' : !y[1] || y[1] === y[0] ? y[0] : y[0] + ' to ' + y[1]; }
  function unit(n) { var c = E.CATS[st.cat]; return n === 1 ? c.one : c.unit; }

  
  function start() {
    var CG = A();
    if (CG && CG.ouGate && !CG.ouGate(function () { if (T.ou) T.ou.open(); })) { st = { view: 'start', cat: st.cat }; render(); return; } 
    var cat = st.cat;
    st = { view: 'play', cat: cat, seed: newSeed(), calls: '', streak: 0, rib: 0, rr: 0, ice: 0, iceBest: 0, ms: 0, done: false, busy: false, log: [] };
    st.run = new E.Run(D[cat], cat, st.seed, E.VERSION); 
    st.first = st.run.left; 
    
    var CA = A(); st.rrPaid = 0;
    if (CA && CA.useFor) CA.useFor('ou'); 
    primeVault();
    T.track('ou_start', { category: cat });
    nextCall();
  }
  
  function primeVault() { var CA = A(); if (CA && CA.rerollsSaved) { CA.rerollsSaved(); if (CA.itemSaved) CA.itemSaved('rib'); } }
  function rrLabel() { var CA = A(), n = CA && CA.rerollsSaved ? CA.rerollsSaved() : 0; return n ? n + ' saved' : 'Buy &middot; ' + (CA && CA.price ? CA.price('one', '$0.99') : '$0.99'); }
  function ribLabel() { var CA = A(), n = CA && CA.itemSaved ? CA.itemSaved('rib') : 0; return n ? n + ' saved' : CA && CA.price ? CA.price('rib1', '$0.99') : '$0.99'; }
  
  window.addEventListener('cast:rerolls', function () {
    var a = document.querySelector('#ouRoot .ou-rr .wc-left'), b = document.querySelector('#ouRoot .ou-decide-rib small');
    if (a) a.innerHTML = rrLabel();
    if (b) b.innerHTML = ribLabel();
  });
  function clearClock() { if (st.clock) { clearTimeout(st.clock); st.clock = null; } }
  

  function rerollShow() {
    clearClock();
    st.busy = true;
    var old = document.querySelector('#ouRoot .ou-card.is-right');
    if (old) old.classList.add('is-rr-out');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      var el = document.createElement('div');
      el.className = 'wc-burst wc-burst-reroll';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<span class="wcb-ring"></span><span class="wcb-ring wcb-ring2"></span><span class="wcb-card"><span class="wcb-ico">&#x1F504;</span>' +
        '<span class="wcb-title">Reroll!</span><span class="wcb-sub">A new one to call</span></span>';
      document.body.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400);
    }
    setTimeout(function () { st.busy = false; if (st.view === 'play') { st.rerolled = true; nextCall(st.free); } }, reduce ? 0 : 1000); 
  }
  
  function nextCall(free) {
    clearClock();
    st.view = 'play'; st.reveal = null; st.secs = E.callTime(st.streak); st.free = !!free; st.callAt = Date.now();
    st.fresh = true; render(); st.fresh = false; st.rerolled = false; 
    if (!st.free) st.clock = setTimeout(function () { call('T'); }, st.secs * 1000);
  }
  function call(c) {
    if (st.view !== 'play' || st.reveal || st.busy) return;
    clearClock();
    var took = Date.now() - st.callAt;
    st.ms += Math.min(took, st.secs * 1000);
    st.calls += c;
    var right = c !== 'T' && c === st.run.answer();
    st.reveal = { right: right, timeout: c === 'T' };
    st.log.push({ p: st.run.right, c: c, ok: right, ms: Math.min(took, st.secs * 1000) }); 
    if (right) { st.ice = took < 3000 ? st.ice + 1 : 0; st.iceBest = Math.max(st.iceBest, st.ice); } else st.ice = 0;
    render();
    setTimeout(function () {
      if (right) {
        st.streak++;
        st.run.left = st.run.right;
        st.run.right = st.run.draw(st.streak);
        if (st.run.right < 0) { out(); return; } 
        nextCall();
      } else out();
    }, right ? 450 : 1000); 
  }
  function out() {
    clearClock();
    st.view = 'out';
    var b = bests();
    st.newBest = st.streak > (b[st.cat] || 0);
    if (st.newBest) { b[st.cat] = st.streak; lsSet(LS_BEST, JSON.stringify(b)); }
    T.track('ou_out', { category: st.cat, streak: st.streak, why: st.reveal && st.reveal.timeout ? 'time' : 'wrong' });
    


    st.hold = false;
    
    st.cleared = !!(st.run && st.run.right < 0);
    if (st.streak > 0 && !st.cleared) { st.offer = OFFER_SECS; render(); startOffer(); }
    else { st.offer = 0; finish(); render(); }
  }
  var OFFER_SECS = 10;
  function paintOffer() {
    var f = document.querySelector('.ou-decide .lock-fill'), n = document.querySelector('.ou-decide .lock-secs');
    if (f) f.style.transform = 'scaleX(' + Math.max(st.offer - 1, 0) / OFFER_SECS + ')';
    if (n) n.textContent = st.offer;
  }
  function startOffer() {
    clearInterval(st.offerT);
    requestAnimationFrame(function () { requestAnimationFrame(paintOffer); });
    st.offerT = setInterval(function () {
      if (st.view !== 'out' || !st.offer || st.hold || st.done) { clearInterval(st.offerT); return; }
      st.offer--;
      paintOffer();
      if (!st.offer) { T.track('ou_rib_offer_timeout', { category: st.cat, streak: st.streak }); endRun(); }
    }, 1000);
  }
  
  function endRun() { clearInterval(st.offerT); st.offer = 0; st.hold = false; finish(); render(); }
  
  function runItBack() {
    var CA = A();
    if (!CA || !CA.buyItem || st.view !== 'out' || st.cleared) return;
    clearInterval(st.offerT); st.hold = true; render(); 
    T.track('ou_rib_tap', { category: st.cat, streak: st.streak });
    var hook = { kicker: 'Run It Back', title: 'Keep Your Streak', line: 'Keep your ' + st.streak + ' in a row and play on with a new card.',
      foot: 'Run It Backs work in ' + NAME + ' and other CAST games. Saved ones stay on your CAST Profile.' };
    CA.buyItem('rib', 'racing', function () {
      if (st.view !== 'out' || st.done) return;
      st.calls += 'B'; st.rib++; st.offer = 0; st.hold = false;
      st.log.push({ rib: 1 });
      
      st.missed = st.run.right;
      st.run.right = st.run.draw(st.streak);
      T.track('ou_rib', { category: st.cat, streak: st.streak });
      
      
      st.view = 'rewind'; render();
      
      setTimeout(function () { if (st.view === 'rewind') nextCall(true); }, 1500);
    }, hook);
  }
  
  function reroll() {
    var CA = A();
    if (!CA || !CA.buyReroll || st.view !== 'play' || st.reveal) return;
    clearClock();
    T.track('ou_reroll_tap', { category: st.cat, streak: st.streak });
    st.busy = true;
    var watch = null, back = function () { if (watch) clearInterval(watch); st.busy = false; if (st.view === 'play' && !st.reveal && !st.clock) nextCall(); };
    CA.buyReroll('racing', function () {
      if (watch) clearInterval(watch);
      st.busy = false;
      if (st.view !== 'play' || st.reveal) return;
      st.calls += 'R'; st.rr++; st.rrPaid++;
      st.log.push({ rr: 1 });
      st.run.right = st.run.draw(st.streak);
      T.track('ou_reroll', { category: st.cat, streak: st.streak });
      rerollShow();
    }, { title: 'Stuck On This One?', line: 'Swap this one for a new card and keep your ' + st.streak + ' in a row.' });
    
    setTimeout(function () {
      if (!st.busy) return;
      watch = setInterval(function () { if (st.busy && !document.querySelector('.ca-rr:not([hidden])') && !document.documentElement.classList.contains('ca-open')) back(); }, 500);
    }, 1500);
  }
  
  function finish() {
    var C0 = A(); if (C0 && C0.useFor) C0.useFor(null); 
    if (!st.run || st.done || !(st.view === 'out' || st.view === 'play') || !/[OUT]/.test(st.calls)) return; 
    st.done = true;
    clearClock();
    var CA = A();
    if (!CA) return;
    var d = { cat: st.cat, seed: st.seed, calls: st.calls, ms: Math.round(st.ms), ouv: st.run && st.run.v };
    if (st.rib) d.rib = st.rib;
    if (st.rrPaid) d.rr = st.rrPaid; 
    try {
      CA.record({ game: 'racing', mode: 'ou', score: st.streak, result: 'out', win: false, top: false, picks: [], d: d });
      var tr = [], n = st.streak;
      if (n >= 10) tr.push('ou10');
      if (n >= 20) tr.push('ou20');
      if (n >= 30) tr.push('ou30');
      if (n >= 50) tr.push('ou50');
      if (n >= 100) tr.push('ou100');
      if (st.iceBest >= 8) tr.push('ouice');
      if (n >= 15 && !st.rib && !st.rr) tr.push('ouclean');
      if (tr.length && CA.unlock) CA.unlock(tr);
      if (CA.refresh) CA.refresh();
    } catch (e) {   }
  }
  window.addEventListener('pagehide', function () { if (st.view === 'out') finish(); });

  function share() {
    var c = E.CATS[st.cat], marks = (st.log || []).filter(function (x) { return x.c; }).map(function (x) { return !x.ok ? '\u274C' : x.c === 'O' ? '\u2B06\uFE0F' : '\u2B07\uFE0F'; });
    if (marks.length > 30) marks = marks.slice(0, 29).concat(['\u2026', marks[marks.length - 1]]);
    var txt = NAME + ' \u00B7 ' + c.name + '\n\uD83D\uDD25 ' + st.streak + ' in a row\n' + marks.join('') + '\nCan you beat it?';
    var url = 'https://castgames.com.au/higher-or-lower-racing/', cq = 'cat=' + encodeURIComponent(st.cat);
    url += (url.indexOf('?') < 0 ? '?' : '&') + cq;
    if (window.CastAccount && window.CastAccount.inviteLink) url = window.CastAccount.inviteLink(url); 
    T.track('ou_share', { category: st.cat, streak: st.streak });
    
    var CA = window.CastAccount;
    if (CA && CA.sharePick && CA.shareDraw) {
      CA.sharePick({ title: 'Share Your Streak', text: txt, url: url, name: String(NAME).toLowerCase().replace(/[^a-z0-9]+/g, '-'), where: 'ou',
        card: { kicker: NAME, title: c.name, big: String(st.streak), unit: 'In a Row', marks: marks.filter(function (m) { return m !== '\u2026'; }), cta: 'Can you beat it?' } });
      return;
    }
    if (navigator.share) { navigator.share({ text: txt, url: url }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(txt + ' ' + url); flash('Copied. Paste it anywhere.'); } catch (e) {   }
  }
  function flash(msg) { st.note = msg; render(); setTimeout(function () { st.note = ''; render(); }, 2200); }

  
  var CAT_ICO = { jockeyg1: '&#x1F3C7;', bigrace: '&#x1F3C6;', horseg1: '&#x1F40E;' };
  function catTiles() {
    var b = bests();
    return '<div class="ou-tiles" role="tablist" aria-label="Category">' + CAT_ORDER.filter(function (k) { return D && D[k] && D[k].length; }).map(function (k) {
      var on = k === st.cat;
      
      return '<button type="button" role="tab" aria-selected="' + on + '" class="ou-tile ou-c-' + k + (on ? ' is-on' : '') + '" data-ou="cat" data-v="' + k + '" aria-label="' + esc(E.CATS[k].name) + (b[k] ? ', best ' + b[k] + ' in a row' : ', not played yet') + '">' +
        '<span class="ou-tile-l"><span class="ou-tile-ico" aria-hidden="true">' + CAT_ICO[k] + '</span><b>' + esc(E.CATS[k].name) + '</b></span>' +
        '<span class="ou-tile-n' + (b[k] ? '' : ' is-new') + '" aria-hidden="true">' + (b[k] ? '<b>' + b[k] + '</b><small>Best</small>' : '<b>New</b>') + '</span></button>'; 
    }).join('') + '</div>';
  }
  
  function demoPair() {
    var L = D[st.cat];
    if (!L || L.length < 3) return '';
    return '<div class="ou-pair is-demo" aria-hidden="true">' + card(L[0], true, 'is-left') + '<span class="ou-vs">VS</span>' + card(L[2], false, 'is-right') + '</div>';
  }
  function startView() {
    return '<div class="ou-start"><h1 class="ou-logo" aria-label="' + esc(NAME) + '"><span class="ou-logo-t" aria-hidden="true"><span class="ou-up">&#x25B2;</span> Higher or Lower <span class="ou-dn">&#x25BC;</span></span>' +
        '<span class="ou-logo-s" aria-hidden="true">' + esc(SPORT) + '</span></h1>' +
      '<p class="ou-lede">You know the first number. Is the second one <b>Higher</b> or <b>Lower</b>? Group 1 wins in Australia and New Zealand since 1983. One wrong call and you&rsquo;re out.</p>' +
      demoPair() + catTiles() +
      '<button type="button" class="btn btn-primary ou-play" data-ou="play">Play ' + esc(E.CATS[st.cat].name) + ' <i aria-hidden="true">&#x25B6;</i></button>' +
      '<button type="button" class="ou-link" data-ou="board">&#x1F3C6; Leaderboard</button></div>';
  }
  
  
  function card(p, known, cls, mark) {
    var y = years(p);
    var val = known ? '<b>' + num(p[1]) + '</b><small>' + esc(unit(p[1])) + '</small>' : '<b class="is-q">?</b><small>' + esc(E.CATS[st.cat].unit) + '</small>'; 
    var look = looks(p);
    return '<div class="ou-card ' + cls + look.cls + (mark ? ' ' + mark : '') + '" style="' + esc(look.style) + '"' + (look.words ? ' title="Silks: ' + esc(look.words) + '"' : '') + '>' +
      
      '<span class="ou-plate is-bare">' + (look.horse ? '<span class="silks-horse">' + esc(look.horse) + '</span>' : '') + '</span>' +
      '<span class="ou-body"><span class="ou-name">' + esc(shown(p[0])) + '</span>' + (y ? '<span class="ou-years">' + esc(y) + '</span>' : '') + '</span>' +
      '<span class="ou-num">' + val + '</span></div>';
  }
  function topBar() {
    return '<div class="ou-top"><span class="ou-streak"><i aria-hidden="true">&#x1F525;</i><b>' + st.streak + '</b><small>in a row</small></span>' +
      '<span class="ou-catpill">' + CAT_ICO[st.cat] + ' ' + esc(E.CATS[st.cat].name) + '</span></div>';
  }
  function playView() {
    var L = D[st.cat], a = L[st.run.left], b = L[st.run.right], rv = st.reveal;
    var h = topBar() + (st.free ? '<div class="ou-clock is-free"><span>&#x23EA; No Clock This Call</span></div>' : '<div class="ou-clock' + (rv ? ' is-stop' : '') + '"><i style="animation-duration:' + st.secs + 's"></i></div>');
    h += '<div class="ou-pair">' + card(a, true, 'is-left') + '<span class="ou-vs">VS</span>' +
      card(b, !!rv, 'is-right', (rv ? (rv.right ? 'is-good' : 'is-bad') : '') + (st.fresh ? (st.rerolled ? ' is-new is-rerolled' : ' is-new') : '')) + '</div>';
    h += '<p class="ou-q">Is <b>' + esc(shown(b[0])) + '</b> higher or lower than <b>' + num(a[1]) + '</b>?</p>';
    h += '<div class="ou-calls"><button type="button" class="ou-call is-over" data-ou="O"' + (rv ? ' disabled' : '') + '><span aria-hidden="true">&#x25B2;</span> Higher<kbd class="ou-key" aria-hidden="true">&uarr;</kbd></button>' +
      '<button type="button" class="ou-call is-under" data-ou="U"' + (rv ? ' disabled' : '') + '><span aria-hidden="true">&#x25BC;</span> Lower<kbd class="ou-key" aria-hidden="true">&darr;</kbd></button></div>';
    
    h += '<div class="wildcards ou-wild"><button type="button" class="wc wc-reroll ou-rr" data-ou="rr"' + (rv ? ' disabled' : '') + ' title="Swap this card for a new one">' +
      '<span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F504;</span> Reroll</span><span class="wc-left">' + rrLabel() + '</span></button></div>';
    return h;
  }
  
  function decideView() {
    var L = D[st.cat], a = L[st.run.left], b = L[st.view === 'rewind' && st.missed != null ? st.missed : st.run.right], why = st.reveal && st.reveal.timeout;
    return '<div class="ou-out"><div class="ou-out-h">' + (why ? '&#x23F0; Time&rsquo;s Up' : '&#x274C; Wrong Call') + '</div>' +
      '<div class="ou-pair is-small">' + card(a, true, 'is-left') + '<span class="ou-vs">VS</span>' + card(b, true, 'is-right', 'is-bad') + '</div>' +
      '<p class="ou-out-why">' + esc(shown(b[0])) + ' was ' + (b[1] > a[1] ? 'higher' : 'lower') + ', with ' + num(b[1]) + ' ' + esc(unit(b[1])) + '.</p>' +
      '<div class="panel ou-decide"><div class="panel-head"><span class="panel-title">Run It Back?</span><span class="panel-meta">' + esc(E.CATS[st.cat].name) + '</span></div>' +
        '<div class="decision is-over"><p class="decision-big">' + st.streak + ' <small>in a row</small></p>' +
        '<p>Keep your streak and play on with a new card.</p>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-decide btn-decide-remove ou-decide-rib" data-ou="rib"><span class="btn-decide-lbl">&#x23EA; Run It Back</span><small>' + ribLabel() + '</small></button>' +
          '<button type="button" class="btn btn-decide btn-decide-lock" data-ou="end" aria-label="End the run' + (st.hold ? '' : ' (ends automatically in ' + OFFER_SECS + ' seconds)') + '">' +
            '<span class="lock-fill" aria-hidden="true" style="transform:scaleX(' + (st.hold ? 1 : st.offer / OFFER_SECS) + ')"></span>' +
            '<span class="btn-decide-lbl">&#x1F3C1; End Run' + (st.hold ? '' : ' <b class="lock-secs">' + st.offer + '</b>') + '</span></button>' +
        '</div></div></div></div>';
  }
  
  function chip(p) {
    var look = looks(p);
    return '<span class="ou-chip' + look.cls + '" style="' + esc(look.style) + '" aria-hidden="true"></span>';
  }
  function secs(ms) { return (ms / 1000).toFixed(1) + 's'; }
  

  function resultsView() {
    var L = D[st.cat], log = st.log || [], why = st.reveal && st.reveal.timeout, b = bests()[st.cat] || 0;
    var calls = log.filter(function (x) { return x.c; }), good = calls.filter(function (x) { return x.ok; });
    var avg = calls.length ? calls.reduce(function (t, x) { return t + x.ms; }, 0) / calls.length : 0;
    var fast = good.length ? Math.min.apply(null, good.map(function (x) { return x.ms; })) : 0;
    var strip = log.map(function (x) {
      if (x.rib) return '<i class="is-rib" title="Run It Back">&#x23EA;</i>';
      if (!x.c) return '';
      return x.ok ? '<i class="is-ok">' + (x.c === 'O' ? '&#x25B2;' : '&#x25BC;') + '</i>' : '<i class="is-x">' + (x.c === 'T' ? '&#x23F0;' : '&#x2715;') + '</i>';
    }).join('');
    var h = '<div class="ou-res">' +
      '<div class="ou-hero"><span class="ou-hero-k">' + (st.cleared ? '&#x1F3C6; Every Card Called' : why ? '&#x23F0; Time&rsquo;s Up' : '&#x274C; Out') + ' &middot; ' + esc(E.CATS[st.cat].name) + '</span>' +
        '<span class="ou-hero-n"><i aria-hidden="true">&#x1F525;</i>' + st.streak + '</span>' +
        '<span class="ou-hero-s">in a row' + (st.newBest && st.streak ? '<em class="ou-best">New Best</em>' : b ? '<em class="ou-best is-old">Best ' + b + '</em>' : '') + '</span>' +
        (strip ? '<span class="ou-strip" aria-hidden="true">' + strip + '</span>' : '') + '</div>' +
      '<div class="ou-stats"><span><b>' + (avg ? secs(avg) : '-') + '</b><small>Avg Call</small></span>' +
        '<span><b>' + (fast ? secs(fast) : '-') + '</b><small>Fastest</small></span>' +
        '<span><b>' + (st.rib || st.rr ? (st.rib ? '&#x23EA; ' + st.rib : '') + (st.rib && st.rr ? ' ' : '') + (st.rr ? '&#x1F504; ' + st.rr : '') : '&#x2714;') + '</b><small>' + (st.rib || st.rr ? 'Wildcards Used' : 'No Wildcards') + '</small></span></div>';
    
    
    h += '<div class="res-acts ou-acts">' +
      '<button type="button" class="btn btn-res btn-res-again btn-block" data-ou="again"><span aria-hidden="true">&#x1F504;</span> Play Again</button>' +
      '<div class="res-two"><button type="button" class="btn btn-res btn-res-share" data-ou="share"><span aria-hidden="true">&#x1F4E4;</span> Share</button>' +
      '<button type="button" class="btn btn-res btn-res-mode" data-ou="board"><span aria-hidden="true">&#x1F3C6;</span> Leaderboard</button></div>' +
      '<button type="button" class="btn btn-res btn-res-mode btn-block" data-ou="home"><span aria-hidden="true">&#x1F3AE;</span> Change Mode</button></div>';
    
    var rows = '', n = 0, prev = L[st.first];
    rows += '<li class="ou-step is-start"><span class="ou-step-i">&#x25B6;</span>' + chip(prev) + '<span class="ou-step-p"><b>' + esc(shown(prev[0])) + '</b><small>' + esc(years(prev)) + '</small></span>' +
      '<span class="ou-step-v">' + num(prev[1]) + '</span><span class="ou-tag is-start">Start</span></li>';
    log.forEach(function (x) {
      if (x.rib) { rows += '<li class="ou-step-note">&#x23EA; Ran It Back</li>'; return; }
      if (!x.c) return;
      var p = L[x.p], dir = p[1] > prev[1] ? 'O' : 'U';
      var tag = x.ok ? '<span class="ou-tag is-' + (dir === 'O' ? 'o' : 'u') + '">' + (dir === 'O' ? '&#x25B2; Higher' : '&#x25BC; Lower') + '</span>'
        : '<span class="ou-tag is-x">' + (x.c === 'T' ? '&#x23F0; No Call' : '&#x2715; ' + (x.c === 'O' ? 'Higher' : 'Lower')) + '</span>';
      rows += '<li class="ou-step ' + (x.ok ? 'is-good' : 'is-bad') + '"><span class="ou-step-i">' + (x.ok ? ++n : '&#x2715;') + '</span>' + chip(p) +
        '<span class="ou-step-p"><b>' + esc(shown(p[0])) + '</b><small>' + (x.ok ? esc(years(p)) : 'It was ' + (dir === 'O' ? 'higher' : 'lower')) + '</small></span><span class="ou-step-v">' + num(p[1]) + '</span>' + tag + '</li>';
      if (x.ok) prev = p;
    });
    h += '<div class="panel ou-run"><div class="panel-head"><span class="panel-title">Your Run</span><span class="panel-meta">' + esc(E.CATS[st.cat].unit) + '</span></div><ol class="ou-ladder">' + rows + '</ol></div>';
    h += '</div>';
    return h;
  }
  function outView() { return st.done ? resultsView() : decideView(); }
  
  function rewindView() {
    return decideView() + '<div class="ou-rewind" role="status"><div class="ou-rw-rays" aria-hidden="true"></div>' +
      '<span class="ou-rw-ico" aria-hidden="true">&#x23EA;</span><b class="ou-rw-t">Run It Back</b>' +
      '<span class="ou-rw-s"><i aria-hidden="true">&#x1F525;</i>' + st.streak + ' <small>in a row saved</small></span></div>';
  }
  
  
  function fitClubs(el) {
    Array.prototype.forEach.call(el.querySelectorAll('.ou-club'), function (c) {
      c.style.fontSize = ''; c.classList.remove('is-wrap');
      if (c.getAttribute('data-full')) c.textContent = c.getAttribute('data-full');
      var fs = parseFloat(getComputedStyle(c).fontSize) || 11.5;
      while (c.scrollWidth > c.clientWidth + 1 && fs > 9.5) { fs -= .5; c.style.fontSize = fs + 'px'; }
      
      var w = (c.getAttribute('data-full') || c.textContent).split(' ');
      if (c.scrollWidth > c.clientWidth + 1 && w.length >= 3) {
        c.setAttribute('data-full', w.join(' ')); c.title = w.join(' ');
        c.textContent = w.slice(0, -1).map(function (x) { return x.charAt(0); }).join('').toUpperCase() + ' ' + w[w.length - 1];
      }
      if (c.scrollWidth > c.clientWidth + 1) c.classList.add('is-wrap');
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { var r = document.querySelector('.ou-pair'); if (r) fitClubs(document); });
  window.addEventListener('resize', function () { if (document.querySelector('.ou-club')) fitClubs(document); });

  function render() {
    var el = root();
    if (!el) return;
    var h = '<div class="ou-head"><button type="button" class="ou-back" data-ou="home" aria-label="Back to home">&larr;</button>' + (st.view === 'start' ? '' : '<span>' + esc(NAME) + '</span>') + '</div>';
    if (!D) h += '<div class="ou-load">Loading the form guide&hellip;</div>';
    else h += st.view === 'play' ? playView() : st.view === 'out' ? outView() : st.view === 'rewind' ? rewindView() : startView();
    if (st.note) h += '<p class="ou-note" role="status">' + esc(st.note) + '</p>';
    el.innerHTML = h;
    fitClubs(el);
  }

  
  function num(n) { return String(Math.round(+n || 0)); }
  function boardId() { return { jockeyg1: 'rcou', bigrace: 'rcoub', horseg1: 'rcouh' }[st.cat] || 'rcou'; }
  document.addEventListener('click', function (e) {
    
    var bn = e.target.closest && e.target.closest('[data-ou-open]');
    if (bn && T.ou.on()) { e.preventDefault(); T.ou.open(); return; }
    var t = e.target.closest && e.target.closest('[data-ou]');
    if (!t || !root() || !root().contains(t)) return;
    var a = t.getAttribute('data-ou');
    if (a === 'O' || a === 'U') call(a);
    else if (a === 'rr') reroll();
    else if (a === 'rib') runItBack();
    else if (a === 'cat') { st.cat = t.getAttribute('data-v'); lsSet(LS_CAT, st.cat); render(); }
    else if (a === 'play') start();
    else if (a === 'again') { finish(); var c = st.cat; st = { view: 'start', cat: c }; start(); }
    else if (a === 'share') share();
    else if (a === 'end') { T.track('ou_rib_offer_no', { category: st.cat, streak: st.streak }); endRun(); }
    else if (a === 'board') { finish(); var CA = A(); if (CA && CA.openBoards) CA.openBoards([boardId(), 'week']); if (st.view === 'out') { var c2 = st.cat; st = { view: 'start', cat: c2 }; render(); } }
    else if (a === 'home') { if (st.view === 'play' && !st.reveal && st.streak && !window.confirm('Leave this run? Your streak ends here.')) return; finish(); var c3 = st.cat; st = { view: 'start', cat: c3 }; if (T.ouHome) T.ouHome(); }
  });
  
  document.addEventListener('keydown', function (e) {
    if (st.view !== 'play' || document.body.getAttribute('data-screen') !== 'ou' || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowUp' || k === 'o' || k === 'O') { e.preventDefault(); call('O'); }
    else if (k === 'ArrowDown' || k === 'u' || k === 'U') { e.preventDefault(); call('U'); }
  });

  var opened = false;
  T.ou = {
    
    open: function (cat) {
      if (!opened) { opened = true; cat = cat || urlCat(); } 
      if (st.view === 'play' && !st.done) return;
      if (!cat && st.view === 'start' && root() && root().offsetParent) return; 
      st = { view: 'start', cat: CAT_ORDER.indexOf(cat) >= 0 ? cat : CAT_ORDER.indexOf(lsGet(LS_CAT)) >= 0 ? lsGet(LS_CAT) : CAT_ORDER[0] };
      if (T.showScreen) T.showScreen('ou');
      primeVault();
      render();
      load().then(render, function () { var el = root(); if (el) el.innerHTML = '<div class="ou-load">Could not load the form guide. Check your connection and try again.</div>'; });
    },
    on: function () { return true; } 
  };
  
  function urlCat() { var m = /[?&]cat=([a-z0-9]+)(?=&|#|$)/.exec(location.search); return m ? m[1] : null; }
  
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) T.ou._answer = function () { return st.run && st.view === 'play' ? st.run.answer() : null; };
  
  
  if (T.ouWanted || window.CG_MODE === 'ou' || /[?&](play=ou|po=[a-z0-9]+)(?=&|#|$)/.test(location.search)) { 
    
    
    var docEl = document.documentElement, boot = document.createElement('style'), tries = 0;
    boot.textContent = 'html.ou-boot .screen:not(#screen-ou) { display: none !important; }';
    document.head.appendChild(boot);
    docEl.classList.add('ou-boot');
    (function go() {
      if (T.showScreen && T.ou.on()) { T.ou.open(); docEl.classList.remove('ou-boot'); return; }
      if (++tries < 80) setTimeout(go, 100); else docEl.classList.remove('ou-boot');
    })();
  }
})();
