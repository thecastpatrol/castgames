

































(function () {
  'use strict';
  var ORDER = ['FB', 'W', 'C', 'FE', 'HB', 'HK', 'P', 'SR', 'LK'];
  var sheet = { el: null, k: null, list: [], busy: false, err: '', dealt: false };

  
  function promo(kind) { var C = window.CAST_PROMO, P = C && C.now ? C.now() : null; return P && P.kind === kind ? P : null; }
  function acct() { return window.CastAccount && CastAccount.pickState ? CastAccount : null; }
  function live() { return typeof STATE !== 'undefined' && !!STATE; }
  function dailyOn() { return !!(window.CastDaily && CastDaily.isActive && CastDaily.isActive()); }
  function screenOn(id) { var el = document.getElementById(id); return !!el && el.classList.contains('active'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function track(e, p) { if (typeof gtag !== 'undefined') gtag('event', e, p || {}); }
  function clubName(id) { return (typeof CLUBS !== 'undefined' && CLUBS[id] && CLUBS[id].name) || ({ easts: 'Eastern Suburbs', glebe: 'Glebe' })[id] || id; }

  
  function totyRoster() {
    var P = promo('toty');
    if (!P || typeof RAW_PLAYERS === 'undefined') return [];
    return P.team.map(function (t) {
      var r = RAW_PLAYERS.filter(function (x) { return x[0] === t[0]; })[0];
      var st = r && r[1].filter(function (s) { return s[1] <= 2026 && s[2] >= 2026; })[0];
      if (!st) return null;
      var pm = t[0] === P.medal ? 'medal' : 'toty';
      return { name: t[0], positions: r[2], rating: pm === 'medal' ? 99 : Math.max(95, r[3]), club: st[0], year: 2026, pm: pm };
    }).filter(Boolean);
  }
  
  function premRoster() {
    var P = promo('prem');
    if (!P || typeof RAW_PLAYERS === 'undefined') return [];
    return P.squad('nrl').map(function (n) {
      var r = RAW_PLAYERS.filter(function (x) { return x[0] === n; })[0];
      var st = r && r[1].filter(function (s) { return s[1] <= 2026 && s[2] >= 2026; })[0];
      if (!st) return null;
      var pm = n === P.medal ? 'medal' : 'prem';
      return { name: n, positions: r[2], rating: pm === 'medal' ? 99 : Math.max(95, r[3]), club: st[0], year: 2026, pm: pm, pk: 'prem', pr: 1 };
    }).filter(Boolean);
  }
  
  function immRoster() {
    return ((window.CAST_PICKS || {}).immortals || []).map(function (x) {
      return { name: x.name, positions: x.positions, rating: 99, club: x.club, year: x.year, era: x.era, clubName: clubName(x.club), pm: 'imm' };
    });
  }
  
  function ilegRoster() {
    return (typeof window.cpIntlLegends === 'function' ? window.cpIntlLegends() : []).map(function (p) {
      return { name: p.name, positions: p.positions, rating: p.rating, club: p.club, year: 2026, il: 1, line: p.line };
    });
  }
  
  
  function wcpRoster() {
    return (typeof window.cpWcStars === 'function' ? window.cpWcStars() : []).map(function (p) {
      return { name: p.name, positions: p.positions, rating: p.rating, club: p.club, year: 2026, wcp: 1 };
    });
  }
  
  function wchRoster() {
    return (typeof window.cpWchRoster === 'function' ? window.cpWchRoster() : []).map(function (p) {
      return { name: p.name, positions: p.positions, rating: p.rating, club: p.club, year: 2026, ch: p.ch, cht: p.cht };
    });
  }
  function wchSpinIn() { return typeof window.cpWchSpinIn === 'function' && window.cpWchSpinIn(); }
  var KINDS = {
    
    wch: {
      ico: '&#x1F3C6;', name: 'World Champions Pick', btn: 'cpWchPack',
      on: function () { return !!(window.CastAccount && CastAccount.pickState && CastAccount.pickState('wch')); },
      roster: wchRoster,
      season: function () { return true; },
      sell: function () { return !!(window.CastAccount && CastAccount.wch && CastAccount.wch()); },
      title: 'Choose Your World Champion',
      sub: function () { return 'He goes straight into your 13 at 95+. Your pick is only used once you choose.'; },
      tag: function (p) { return p.ch === 'potf' ? 'Player of the Final' : 'World Champions'; },
      hook: { kicker: 'World Champions Pick', title: 'Choose a World Champion', line: 'Pick from three of the World Champions. He\u00a0joins your World Cup 13 at 95+.' }
    },
    
    wcp: {
      ico: '&#x1F30F;', name: '88+ Pick', btn: 'cpWcpPack',
      on: function () { return !!(window.CastAccount && CastAccount.wcLive && CastAccount.wcLive()); },
      roster: wcpRoster,
      season: function () { return true; },
      sell: function () { return true; },
      title: 'Choose Your 88+ Player',
      sub: function () { return 'Rated 88+ from the 2026 World Cup squads. He goes straight into your 13. Your pick is only used once you choose.'; },
      tag: function (p) { return (typeof CLUBS !== 'undefined' && CLUBS[p.club] && CLUBS[p.club].name) || 'World Cup'; },
      hook: { kicker: '88+ Pick', title: 'Choose an 88+ Player', line: 'Pick from three 88+ rated players from the 2026 World\u00a0Cup squads. He\u00a0takes an open spot in your 13.' }
    },
    ileg: {
      ico: '&#x1F451;', name: 'World Legend Pick', btn: 'cpIlegPack',
      on: function () { return !!(window.CastAccount && CastAccount.wcLive && CastAccount.wcLive()); },
      roster: ilegRoster,
      season: function () { return true; },
      sell: function () { return true; },
      title: 'Choose Your World Legend',
      sub: function () { return 'He goes straight into your 13 at his World Cup rating. Your pick is only used once you choose.'; },
      tag: function (p) { return (typeof CLUBS !== 'undefined' && CLUBS[p.club] && CLUBS[p.club].name) || 'World Legend'; },
      hook: { kicker: 'World Legend Pick', title: 'Choose a World Legend', line: 'Pick from three World\u00a0Legends. He\u00a0takes an open spot in your 13.' }
    },
    
    prem: {
      ico: '&#x1F3C6;', name: 'Premiers Pick', btn: 'cpPremPack',
      on: function () { return !!promo('prem'); },
      roster: premRoster,
      
      season: function () { var L = typeof promoLive === 'function' ? promoLive() : null; return !!L && L.kind === 'prem' && (STATE.yearFrom || 1998) <= 2026 && (STATE.yearTo || 2026) >= 2026; },
      sell: function () { return true; },
      title: 'Choose Your Premier',
      sub: function (pack) { return (pack ? 'He joins your players' : 'He goes straight into your 13') + ' on his 2026 season. Your pick is only used once you choose.'; },
      tag: function (p) { return p.pm === 'medal' ? 'Clive Churchill Medal' : '2026 Premiers'; },
      hook: { kicker: 'Premiers Pick', title: 'Choose a 2026 Premier', line: 'Pick from three of the 2026 premiers. He joins your players at 95+.' }
    },
    toty: {
      ico: '&#x1F3C5;', name: 'Team of the Year Pick', btn: 'cpTotyPack',
      on: function () { return !!promo('toty'); },
      roster: totyRoster,
      
      season: function () { var L = typeof promoLive === 'function' ? promoLive() : null; return !!L && L.kind === 'toty' && (STATE.yearFrom || 1998) <= 2026 && (STATE.yearTo || 2026) >= 2026; },
      sell: function () { return true; },
      title: 'Choose Your Player',
      sub: function (pack) { return (pack ? 'He joins your players' : 'He goes straight into your 13') + ' on his 2026 season. Your pick is only used once you choose.'; },
      tag: function (p) { return p.pm === 'medal' ? 'Dally M Medal' : 'Team of the Year'; },
      hook: { kicker: 'Team of the Year Pick', title: 'Choose a Team of the Year Player', line: 'Pick from three 2026 Dally M Team of the Year players. He joins your players at 95+.' }
    },
    imm: {
      ico: '&#x1F3DB;&#xFE0F;', name: 'Immortal Pick', btn: 'cpImmPack',
      on: function () { return !!window.CAST_PICKS; },
      roster: immRoster,
      season: function () { return true; }, 
      
      sell: function () { return !!(window.CastAccount && CastAccount.immOn && CastAccount.immOn()); },
      title: 'Choose Your Immortal',
      sub: function (pack) { return (pack ? 'He joins your players' : 'He goes straight into your 13') + ' at 99. Your pick is only used once you choose.'; },
      tag: function (p) { return p.era || 'Immortal'; },
      hook: { kicker: 'Immortal Pick', title: 'Choose an Immortal', line: 'Pick from three of the game’s Immortals. He joins your players at 99.' }
    }
  };

   
  
  function spinMode(k) {
    var K = KINDS[k];
    if (!K || !live() || !K.on() || dailyOn() || !screenOn('draft')) return false;
    
    if (k === 'wcp' || k === 'ileg' || k === 'wch' || STATE.gameMode === 'wc') return (k === 'wcp' || k === 'ileg' || k === 'wch') && STATE.gameMode === 'wc';
    if ((STATE.gameMode !== 'classic' && STATE.gameMode !== 'hard') || STATE.__ch || STATE.__qd || STATE.__rib) return false;
    return K.season();
  }
  function packMode(k) { var K = KINDS[k]; return !!K && k !== 'wcp' && k !== 'ileg' && k !== 'wch' && live() && K.on() && STATE.gameMode === 'pack' && screenOn('pack-squad') && Array.isArray(STATE.packPlayers) && STATE.packPlayers.length > 0; }
  
  function choices(k) {
    if (spinMode(k)) {
      if (STATE.team.every(Boolean)) return [];
      
      var onShow = k === 'ileg' && STATE.currentSpin ? (STATE.currentSpin.players || []).map(function (p) { return p.name; }) : [];
      return KINDS[k].roster().filter(function (p) { return !STATE.takenNames.has(p.name) && onShow.indexOf(p.name) < 0 && getAvailableSlotsForPlayer(p).length > 0; });
    }
    if (packMode(k)) {
      var pool = STATE.packPlayers;
      return KINDS[k].roster().filter(function (p) { return !pool.some(function (c) { return c.name === p.name; }); });
    }
    return [];
  }
  
  function spinSpot(p) {
    var avail = getAvailableSlotsForPlayer(p), w = STATE.__wc;
    return (w && w.slot != null && avail.filter(function (s) { return s.i === w.slot; })[0]) || avail[0] || null;
  }
  


  function spotChoices(p) {
    if (STATE.gameMode === 'pack') return [];
    var avail = getAvailableSlotsForPlayer(p), w = STATE.__wc, seen = {};
    if (w && w.slot != null && avail.some(function (s) { return s.i === w.slot; })) return [];
    var out = avail.filter(function (s) { if (seen[s.type]) return false; seen[s.type] = 1; return true; });
    return out.length > 1 ? out : [];
  }
  function packSpot(p) {
    var sel = typeof _packSelectedSlot !== 'undefined' ? _packSelectedSlot : null;
    if (sel != null && !STATE.team[sel] && SLOTS[sel] && p.positions.indexOf(SLOTS[sel].type) >= 0) return SLOTS[sel];
    for (var k = 0; k < p.positions.length; k++) {
      for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i].type === p.positions[k] && !STATE.team[SLOTS[i].i]) return SLOTS[i];
    }
    return null;
  }
  function posName(s) { return String(s.label).replace(/^(Left|Right)\s+/i, ''); }

  

  function pst(k) {
    var A = acct(), st = A && A.pickState(k);
    if (st && k === 'wch' && st.free && wchSpinIn()) st = Object.assign({}, st, { have: st.bought, free: 0 });
    return st;
  }
  
  function wchHours() {
    var A = acct(), w = A && A.wch ? A.wch() : null, l = w ? w.until - Date.now() : 0, m = Math.ceil(Math.max(0, l) / 60000);
    return w && A.wchLast && A.wchLast() ? (m > 60 ? Math.ceil(m / 60) + 'h left' : m + 'm left') : '';
  }
   
  function state(k) {
    var A = acct(), st = pst(k);
    if (!st || !choices(k).length) return null;
    
    var ends = k === 'wch' ? wchHours() : (k === 'toty' || k === 'prem') && promo(k) && A.promoLast && A.promoLast() ? A.promoHours() : '';
    if (st.have) return { have: st.have, fresh: st.fresh, left: st.free && !st.bought ? '1 Free' : st.have + ' Left', ends: ends };
    if (KINDS[k].sell() && (st.canBuy || st.guest)) return { have: 0, buy: true, left: st.price, ends: ends };
    return null; 
  }
  
  function bars() {
    return Object.keys(KINDS).map(function (k) {
      var s = state(k);
      return s ? { k: k, ico: KINDS[k].ico, name: KINDS[k].name, have: s.have, fresh: s.fresh, left: s.left, ends: s.ends || '' } : null;
    }).filter(Boolean);
  }
  function tap(k) {
    var s = state(k), A = acct();
    if (!s || !A) return;
    if (s.have) { open(k); return; }
    track(k + '_pick_tap', { mode: STATE.gameMode });
    var st0 = STATE, pack = STATE.gameMode === 'pack';
    A.pickBuy(k, '27-0', function () { if (STATE === st0) open(k); }, pack ? KINDS[k].hook : null);
  }

   
  
  function offer(k) {
    var list = choices(k), names = list.map(function (p) { return p.name; }), key = '__' + k + 'Offer';
    var keep = (STATE[key] || []).filter(function (n) { return names.indexOf(n) >= 0; });
    var rest = names.filter(function (n) { return keep.indexOf(n) < 0; });
    
    if (k === 'ileg') {
      var nat = function (n) { return list[names.indexOf(n)].club; }, used = keep.map(nat);
      for (var i = rest.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
      rest.slice().forEach(function (n) { if (keep.length < 3 && used.indexOf(nat(n)) < 0) { keep.push(n); used.push(nat(n)); rest.splice(rest.indexOf(n), 1); } });
    }
    while (keep.length < 3 && rest.length) keep.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
    STATE[key] = keep;
    return keep.map(function (n) { return list[names.indexOf(n)]; }).sort(function (a, b) { return ORDER.indexOf(a.positions[0]) - ORDER.indexOf(b.positions[0]); });
  }
  function open(k) {
    if (!live() || !KINDS[k]) return;
    sheet.k = k; sheet.list = offer(k); sheet.err = ''; sheet.busy = false;
    if (!sheet.list.length) return;
    
    var three = sheet.list.map(function (p) { return p.name; }).join('|');
    if (k === 'ileg' && STATE.__ilegShown !== three && window.CastIntl && window.CastIntl.reveal) {
      STATE.__ilegShown = three;
      var st0 = STATE;
      window.CastIntl.reveal({
        reels: sheet.list.map(function (p) { return { nation: p.club, name: p.name, sub: p.positions.join('/') + ' · ' + p.rating }; }), 
        kicker: 'World Legend Pick', title: 'Your World Legends',
        done: function () { if (STATE === st0) open(k); }
      });
      return;
    }
    
    
    var CI = window.CastIntl;
    if (k === 'imm' && STATE.__immShown !== three && CI && CI.reveal && CI.JERSEYS) {
      STATE.__immShown = three;
      var st1 = STATE, sides = {}, side = function (key) {
        if (!key || sides[key]) return;
        var nm = clubName(key), last = String(nm).split(' ').pop(), J = CI.JERSEYS[key] || {};
        var c1 = (typeof CLUB_COLORS !== 'undefined' && CLUB_COLORS[key]) || '#1a1a2e', c2 = (typeof CLUB_SECONDARY !== 'undefined' && CLUB_SECONDARY[key]) || '#ffffff';
        sides[key] = { name: nm, short: key === 'stgeorge' ? 'St George' : nm.length <= 15 ? nm : last, code: (typeof CLUB_ABBR !== 'undefined' && CLUB_ABBR[key]) || String(key).slice(0, 3).toUpperCase(),
          c1: c1, c2: c2, glow: c1, pattern: J.pattern, base: J.base, colors: J.colors, count: J.count, dir: J.dir, sizes: J.sizes, collar: J.collar };
      };
      var pool = Object.keys(CI.JERSEYS);
      pool.forEach(side);
      sheet.list.forEach(function (p) { side(p.club); });
      CI.reveal({ reels: sheet.list.map(function (p) { return { nation: p.club, name: p.name, sub: p.positions.join('/') + ' · 99' }; }), sides: sides, pool: pool,
        kicker: 'Immortal Pick', title: 'Three of the Game\u2019s Immortals', done: function () { if (STATE === st1) open(k); } });
      return;
    }
    if (!sheet.el) {
      sheet.el = document.createElement('div');
      sheet.el.hidden = true;
      document.body.appendChild(sheet.el);
      sheet.el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tp]');
        if (!b && e.target !== sheet.el) return;
        var a = b ? b.getAttribute('data-tp') : 'close';
        if (a === 'close') { if (sheet.busy === false) shut(); return; }
        if (a === 'back') { sheet.where = null; render(); return; }
        var at = a.split(':');
        choose(+at[0], at.length > 1 ? +at[1] : null);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.el && !sheet.el.hidden && sheet.busy === false) shut(); });
    }
    sheet.el.className = 'tp' + (k === 'imm' ? ' is-imm' : k === 'prem' ? ' is-prem' : k === 'wcp' ? ' is-wcp' : k === 'ileg' ? ' is-ileg' : k === 'wch' ? ' is-wch' : '');
    sheet.where = null; sheet.dealt = false; render(); sheet.dealt = true; 
    sheet.el.hidden = false;
    track(k + '_pick_open', { mode: STATE.gameMode, offered: sheet.list.length });
  }
  function shut() { sheet.where = null; if (sheet.el) { sheet.el.hidden = true; sheet.el.innerHTML = ''; } }
  function card(p, i) {
    var K = KINDS[sheet.k], med = p.pm === 'medal', pack = STATE.gameMode === 'pack', s = pack ? packSpot(p) : spinSpot(p);
    var bg = (typeof CLUB_COLORS !== 'undefined' && CLUB_COLORS[p.club]) || '#1a1a2e', fg = (typeof CLUB_SECONDARY !== 'undefined' && CLUB_SECONDARY[p.club]) || '#fff';
    var abbr = (typeof CLUB_ABBR !== 'undefined' && CLUB_ABBR[p.club]) || p.club.slice(0, 3).toUpperCase();
    var prem = p.pk === 'prem', vars = prem ? ';--pc:' + bg + ';--pc2:' + fg : '';
    
    var N = window.CastNations, look = p.il && N && N.has(p.club) ? '<span class="tp-look" aria-hidden="true">' + N.svg(p.club, 120, 200) + '</span>' : '';
    var many = spotChoices(p), asking = sheet.where === i;
    return '<button type="button" class="tp-card' + (asking ? ' is-asking' : sheet.where != null ? ' is-dim' : '') + (med ? ' is-medal' : '') + (p.pm === 'imm' ? ' is-imm' : '') + (prem ? ' is-prem' : '') + (p.il ? ' is-ileg' : '') + (p.wcp ? ' is-wcp' : '') + (p.ch ? ' is-wch' + (p.ch === 'potf' ? ' is-wch-medal' : '') : '') + (sheet.busy === i ? ' is-chosen' : '') + '" data-tp="' + i + '" style="--d:' + i + vars + '" aria-label="Choose ' + esc(p.name) + ', ' + p.rating + '">' + look +
      
      '<span class="tp-top"><b>' + esc(p.positions.join('/')) + '</b>' + (prem ? '' : '<i style="background:' + bg + ';color:' + fg + '">' + esc(abbr) + '</i>') + '</span>' +
      '<span class="tp-r">' + p.rating + '</span>' +
      '<span class="tp-n">' + esc(p.name).replace('-', '-<wbr>') + (prem ? '&nbsp;' + (med ? '&#x1F3C5;' : '') + '&#x1F3C6;' : med ? '&nbsp;&#x1F3C5;' : p.ch ? '&nbsp;' + (p.ch === 'potf' ? '&#x1F3C5;' : '') + (p.cht ? '&#x1F3C6;' : '') : '') + '</span>' +
      '<span class="tp-t">' + esc(K.tag(p)) + '</span>' +
      
      
      '<span class="tp-spot">' + (many.length ? many.map(posName).join(' or ') : s ? (p.il ? '' : 'Fills ') + posName(s) : 'Joins your players').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/ (\S+)$/, '&nbsp;$1') + '</span>' +
      '<span class="tp-go">' + (sheet.busy === i ? 'Signing&hellip;' : 'Choose') + '</span></button>';
  }
  
  function where() {
    var i = sheet.where, p = i != null ? sheet.list[i] : null, many = p && sheet.busy === false ? spotChoices(p) : [];
    if (!many.length) return '';
    return '<div class="tp-where" role="group" aria-label="Where ' + esc(p.name) + ' plays"><p class="tp-where-q">Where will ' + esc(p.name).replace(/ (\S+)$/, '&nbsp;$1') + ' play?</p>' +
      '<div class="tp-where-btns">' + many.map(function (sl) { return '<button type="button" class="tp-where-go" data-tp="' + i + ':' + sl.i + '">' + esc(posName(sl)) + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="tp-where-back" data-tp="back">Back</button></div>';
  }
  function render() {
    var K = KINDS[sheet.k], st = pst(sheet.k), pack = STATE.gameMode === 'pack', n = st ? st.have : 0;
    var foot = st && st.free && !st.bought ? 'Using your free CAST Pass pick' : n ? n + ' pick' + (n === 1 ? '' : 's') + ' left' : '';
    sheet.el.innerHTML = '<div class="tp-box' + (sheet.busy !== false ? ' is-busy' : '') + (sheet.dealt ? ' is-dealt' : '') + '" role="dialog" aria-modal="true" aria-labelledby="tpT">' +
      '<button type="button" class="tp-x" data-tp="close" aria-label="Close">&#x2715;</button>' +
      '<p class="tp-kick">' + K.ico + ' ' + esc(K.name) + '</p>' +
      '<h2 class="tp-title" id="tpT">' + esc(K.title) + '</h2>' +
      '<p class="tp-sub">' + esc(K.sub(pack)) + '</p>' +
      '<div class="tp-cards">' + sheet.list.map(card).join('') + '</div>' +
      where() +
      (sheet.err ? '<p class="tp-err" role="alert">' + esc(sheet.err) + '</p>' : '') +
      (foot ? '<p class="tp-foot">' + esc(foot) + '</p>' : '') + '</div>';
  }
  function choose(i, at) {
    var k = sheet.k, p = sheet.list[i], A = acct();
    if (!p || sheet.busy !== false || !A) return;
    var pack = STATE.gameMode === 'pack';
    
    if (at != null && !getAvailableSlotsForPlayer(p).some(function (s) { return s.i === at; })) { render(); return; }
    if (at == null && !pack && spotChoices(p).length) { sheet.where = i; render(); var q = sheet.el.querySelector('.tp-where-go'); if (q) q.focus(); return; }
    sheet.where = null;
    
    if (!choices(k).some(function (c) { return c.name === p.name; }) || (!pack && !spinSpot(p))) { sheet.list = offer(k); render(); return; }
    sheet.busy = i; sheet.err = ''; render();
    var st0 = STATE;
    
    A.pickUse(k, '27-0', k === 'wch' && wchSpinIn() ? { paid: true } : null).then(function (r) {
      sheet.busy = false; shut();
      if (STATE !== st0) return;
      if (k === 'wch' && r && r.free) STATE.__wchf = 1; 
      else STATE['__' + k] = (STATE['__' + k] || 0) + 1;
      STATE['__' + k + 'Offer'] = null;
      
      var placed = pack ? placePack(Object.assign({}, p, { src: SRC[k] })) : placeSpin(Object.assign({}, p, { src: SRC[k] }), at);
      if ((k === 'toty' || k === 'prem' || k === 'wch') && !STATE.__qd && window.CastAccount && CastAccount.unlock) CastAccount.unlock([k === 'prem' ? 'prem26' : k === 'wch' ? 'wch26' : 'toty']); 
      track(k + '_pick_chosen', { mode: STATE.gameMode, player: p.name, free: r && r.free ? 1 : 0 });
      redraw();
      var done = function () { if (pack && !placed) note(p); };
      
      if (k !== 'ileg' && k !== 'imm' && typeof showPlatWalkout === 'function') showPlatWalkout(cardOf(p), done); else done();
    }, function (err) {
      sheet.busy = false; sheet.err = (err && err.message) || 'Your Pick did not go through. Try again.';
      if (sheet.el && !sheet.el.hidden) render();
    });
  }
  var SRC = { ileg: 'L', wcp: '8', imm: 'I', toty: 'T', prem: 'P', wch: 'C' };
  
  function cardOf(p) {
    var c = { name: p.name, club: p.club, year: p.year, positions: p.positions, rating: p.rating, pm: p.pm };
    if (p.src) c.src = p.src;
    if (p.pm === 'imm') { c.era = p.era; c.clubName = p.clubName; }
    if (p.pk) { c.pk = p.pk; c.pr = p.pr || 0; }
    if (p.wcp) c.wcp = 1; 
    if (p.il) { c.il = 1; c.line = p.line; } 
    if (p.ch) { c.ch = p.ch; c.cht = p.cht || 0; } 
    return c;
  }
  
  function placeSpin(p, at) {
    var s = (at != null && getAvailableSlotsForPlayer(p).filter(function (x) { return x.i === at; })[0]) || spinSpot(p);
    if (!s) return false;
    STATE.team[s.i] = Object.assign({ name: p.name, positions: p.positions, rating: p.rating, club: p.club, year: p.year, pm: p.pm }, p.pk ? { pk: p.pk, pr: p.pr || 0 } : {}, p.il ? { il: 1, line: p.line } : {},
      p.wcp ? { wcp: 1 } : {}, p.ch ? { ch: p.ch, cht: p.cht || 0 } : {}, p.src ? { src: p.src } : {});
    STATE.takenNames.add(p.name);
    if (STATE.__wc) STATE.__wc.slot = null;
    renderField();
    if (STATE.team.every(Boolean)) {
      if (typeof gtag !== 'undefined') gtag('event', 'draft_completed', { event_category: 'draft', squad_rating: calcTeamRating(), era_from: STATE.yearFrom, era_to: STATE.yearTo });
      setTimeout(function () { showSquadComplete(); }, 350);
    } else if (STATE.currentSpin) displaySpin(STATE.currentSpin.cid, STATE.currentSpin.year, STATE.currentSpin.players);
    return true;
  }
  
  function placePack(p) {
    var c = cardOf(p);
    STATE.packPlayers.push(c);
    if (STATE.packAllCards && STATE.packAllCards !== STATE.packPlayers) STATE.packAllCards.push(c);
    var s = packSpot(p);
    if (s && typeof packAssignPlayer === 'function') { _packSelectedSlot = s.i; packAssignPlayer(c); return true; }
    if (typeof renderPackSquad === 'function') renderPackSquad();
    return false;
  }
  
  function note(p) {
    var foot = document.querySelector('#pack-squad .ps-footer');
    if (!foot) return;
    var old = document.getElementById('tpNote');
    if (old) old.remove();
    var n = document.createElement('div');
    n.id = 'tpNote'; n.className = 'cpw-hint tp-note'; n.setAttribute('role', 'status');
    n.textContent = p.name + ' is at the top of your players. Tap ✕ on a ' + p.positions.join(' or ') + ' to make room for him.';
    foot.insertBefore(n, foot.firstChild);
    setTimeout(function () { if (n.parentNode) n.remove(); }, 6000);
    var sc = document.getElementById('packSquadScroll');
    if (sc) sc.scrollTop = 0;
  }

   
  function packBtns() {
    var foot = document.querySelector('#pack-squad .ps-footer'), prev = null;
    Object.keys(KINDS).forEach(function (k) {
      var K = KINDS[k], b = document.getElementById(K.btn), s = foot && packMode(k) ? state(k) : null;
      if (!s) { if (b) b.hidden = true; return; }
      if (!b) {
        b = document.createElement('button');
        b.type = 'button'; b.id = K.btn; b.className = 'cpw cpw-' + k + ' tp-packbtn';
        b.addEventListener('click', function () { tap(k); });
      }
      
      var at = prev ? prev.nextSibling : foot.firstChild;
      if (b.parentNode !== foot || (prev ? b.previousSibling !== prev : b !== foot.firstChild)) foot.insertBefore(b, at);
      prev = b;
      b.hidden = false;
      b.classList.toggle('ca-rr-fresh', !!s.fresh);
      b.innerHTML = '<span class="cpw-label"><span aria-hidden="true">' + K.ico + '</span> ' + esc(K.name) + '</span><span class="cpw-left">' + esc(s.left) +
        (s.ends ? ' <span class="cpw-ends" data-dm-hours>' + esc(s.ends) + '</span>' : '') + '</span>';
      if (s.ends && window.CastAccount && CastAccount.promoTick) CastAccount.promoTick();
    });
  }
  function redraw() {
    if (typeof window.cpWildRender === 'function') window.cpWildRender();
    packBtns();
  }
  function after(name, fx) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () { var out = orig.apply(this, arguments); try { fx.apply(this, arguments); } catch (e) {   } return out; };
  }
  
  var basePack = window.startPackOpening;
  if (typeof basePack === 'function') window.startPackOpening = function () { if (live()) { STATE.__toty = 0; STATE.__totyOffer = null; STATE.__prem = 0; STATE.__premOffer = null; STATE.__imm = 0; STATE.__immOffer = null; } return basePack.apply(this, arguments); };
  after('renderPackSquad', packBtns);
  ['cast:rerolls', 'cast:tier', 'cast-account', 'cast:launch', 'cast:promo', 'cast:wch'].forEach(function (ev) { window.addEventListener(ev, function () { setTimeout(redraw, 0); }); });

  
  window.cpPicks = { bars: bars, tap: tap };
})();
