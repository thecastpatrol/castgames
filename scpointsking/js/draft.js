


(function (T) {
  'use strict';

  T.MODES = {
    plus: {
      id: 'plus', event: 'classic_1000_plays', name: 'Classic', short: 'Classic',
      blurb: 'Spin 3 player seasons, pick 1. His SC points show once you pick him. Build the biggest 13 you can.',
      rule: 'high', source: 'roll', wildcards: true
    },
    
    
    daily: {
      id: 'daily', event: 'daily_1000_plays', name: 'Daily', short: 'Daily',
      blurb: 'Today’s themed spins. Get your 13 to the target.',
      rule: 'high', source: 'roll', wildcards: false
    },
    
    wc: { id: 'wc', event: 'world_cup_200_plays', dataset: 'wc', name: 'World Cup', short: 'World Cup', blurb: '', rule: 'high', source: 'roll', wildcards: true, off: true },
    nrlw: { id: 'nrlw', event: 'nrlw_plays', dataset: 'nrlw', name: 'Second Pack', short: 'Second Pack', blurb: '', rule: 'high', source: 'roll', wildcards: true, off: true }
  };

  

  T.OFFER_WEIGHT_BASE = 100; 
  
  T.FIRST_STAR_CHANCE = 0.7;
  T.OFFER_SIZE = 3;
  T.HARD = { weight: 100, legends: 0, immortal: 0, lifeline: 0, firstStar: 0.7 };
  T.HARD_ON = false;
  T.isHard = function () { return false; };
  T.hasLegend = function () { return !!S && S.slots.some(function (s) { return s.player && s.player.tier && s.player.tier !== 'goat'; }); };

  



  T.GOAT_FREE = 0.2;
  T.GOAT_FROM = '2026-10-18';
  T.goatOut = function (p) { return !!S && !!S.goatOut && !!p && p.id === T.GOAT_SRC; };

  var S = null;

  T.state = function () { return S; };
  function copyState(x) {
    return Object.assign({}, x, {
      slots: x.slots.map(function (s) { return Object.assign({}, s); }), used: Object.assign({}, x.used), usedP: Object.assign({}, x.usedP), revealed: {},
      known: Object.assign({}, x.known), wildcards: Object.assign({}, x.wildcards), history: x.history.slice(),
      offer: x.offer ? Object.assign({}, x.offer, { players: x.offer.players.slice() }) : null
    });
  }
  T.snapshot = function () { return copyState(S); };
  T.restore = function (x) { var c = copyState(x); Object.keys(S).forEach(function (k) { delete S[k]; }); Object.assign(S, c); };
  T.adopt = function (x) { S = x; if (!S.usedP) S.usedP = {}; if (!S.known) S.known = {}; return S; };

  



  function hash32(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  T.stream = function (tag) { return S && S.seed ? mulberry32(hash32(S.seed + '|' + tag)) : Math.random; };
  
  var idHash = {};
  function keyU(tag, id) {
    var h = idHash[id];
    if (h === undefined) h = idHash[id] = hash32(String(id));
    var u = first32((hash32(S.seed + '|' + tag) ^ Math.imul(h, 0x9E3779B1)) >>> 0);
    return u > 0 ? u : 1e-12;
  }
  
  function first32(a) {
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  
  function keysFor(tag, list) {
    var base = hash32(S.seed + '|' + tag), out = new Array(list.length);
    for (var i = 0; i < list.length; i++) {
      var id = list[i].id, h = idHash[id];
      if (h === undefined) h = idHash[id] = hash32(String(id));
      var u = first32((base ^ Math.imul(h, 0x9E3779B1)) >>> 0);
      out[i] = u > 0 ? u : 1e-12;
    }
    return out;
  }
  T.newSeed = function () {
    var a = new Uint32Array(2);
    try { (window.crypto || window.msCrypto).getRandomValues(a); } catch (e) { a[0] = Math.random() * 4294967296; a[1] = Math.random() * 4294967296; }
    return (a[0].toString(36) + a[1].toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 12) || 'seed' + Date.now().toString(36);
  };

  
  T.newGame = function (modeId, opts) {
    var mode = T.MODES[modeId] || T.MODES.plus;
    S = {
      mode: mode,
      slots: T.SLOTS.map(function (code) { return { code: code, player: null }; }),
      used: {},          
      usedP: {},         
      known: {},         
      offer: null,       
      revealed: {},      
      wildcards: mode.wildcards ? { reroll: 1, scout: T.FREE_REVEALS || 0, tweak: 1 } : { reroll: 0, scout: 0, tweak: 0 },
      paidUsed: {},
      tweakMode: false,
      scoutMode: false,  
      spinPos: null, spinSlot: null,
      picks: 0,
      finished: false,
      awaitingLock: false,
      fullTime: false,   
      captain: null,     
      history: [],
      seed: (opts && opts.seed) || T.newSeed(), offerNo: 0, spinNo: 0,
      challenge: !!(opts && opts.challenge),
      daily: (opts && opts.daily) || null    
    };
    S.special = null; S.specialAt = 0; S.specialDone = false; S.lifelineRoll = null; S.lifelineUsed = false;
    S.luckExp = 0; S.luckGot = 0;
    S.hard = false;
    S.promoDef = null; S.promo = false;
    S.il = null; S.ilegUsed = 0;
    S.goatOut = !(S.daily && S.daily.date < T.GOAT_FROM) && !(T.stream('goatfree')() < T.GOAT_FREE);
    T.TARGET = (S.daily && S.daily.target) || 0;
    return S;
  };

  T.dailyClub = function () { return null; };
  T.hasDailyClub = function () { return true; };

  
  T.taken = function (p) { return !!S && !!p && (!!S.used[p.id] || !!S.usedP[p.pid]); };

  
  function specialOffer(tag) {
    var list = T.LEGENDS.filter(function (p) { return T.isLegend(p) && !T.taken(p) && T.fitsEmpty(p); });
    if (S.seed) return list.map(function (p) { return [p, keyU(tag, p.id)]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, T.OFFER_SIZE).map(function (x) { return x[0]; });
    var out = [];
    while (out.length < T.OFFER_SIZE && list.length) out.push(list.splice(Math.floor(Math.random() * list.length), 1)[0]);
    return out;
  }

  T.emptyCodes = function () {
    var out = {};
    S.slots.forEach(function (s) { if (!s.player) out[s.code] = true; });
    return out;
  };
  T.filledCount = function () { return S.slots.filter(function (s) { return s.player; }).length; };
  
  T.total = function () {
    return S.slots.reduce(function (sum, s, i) { return sum + (s.player ? s.player.tries_1998_plus * (S.captain === i ? 2 : 1) : 0); }, 0);
  };
  T.fitsEmpty = function (p) {
    var empty = T.emptyCodes();
    return T.positionsOf(p).some(function (c) { return empty[c]; });
  };

  
  T.openCodesFor = function (p) {
    var empty = T.emptyCodes(), seen = {};
    var codes = T.positionsOf(p).filter(function (c) {
      if (!empty[c] || seen[c]) return false;
      seen[c] = true;
      return true;
    });
    
    
    if (codes.length > 1) {
      var open = function (c) { return S.slots.filter(function (x) { return !x.player && x.code === c; }).length; };
      var scarce = codes.filter(function (c) { var o = open(c); return T.supplyFor(c, p, o) <= o; });
      if (scarce.length) return scarce.slice(0, 1);
    }
    return codes;
  };
  
  
  T.supplyFor = function (code, me, cap) {
    var n = 0, seen = {}, list = T.players;
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (q !== me && (T.taken(q) || T.goatOut(q))) continue;
      if (seen[q.pid] || T.positionsOf(q).indexOf(code) === -1 || !T.inDailyPool(q)) continue;
      seen[q.pid] = 1; n++;
      if (cap != null && n > cap) return n;
    }
    return n;
  };

  T.eligible = function () {
    var empty = T.emptyCodes(), used = S.used, usedP = S.usedP, gid = S.goatOut ? T.GOAT_SRC : null;
    return T.players.filter(function (p) {
      if (used[p.id] || usedP[p.pid] || p.id === gid) return false;
      var pos = p.positions_played, fits = false;
      for (var i = 0; i < pos.length; i++) if (empty[pos[i]]) { fits = true; break; }
      return fits && T.inDailyPool(p);
    });
  };
  

  T.inDailyPool = function (p) {
    var d = S && S.daily;
    if (!d) return true;
    if (d.years && !(p.year >= d.years[0] && p.year <= d.years[1])) return false;
    if (d.only) {
      var ys = d.only[p.club];
      if (!ys) return false;
      if (ys.length && ys.indexOf(p.year) === -1) return false;
    }
    return true;
  };

  function weightOf(p) {
    var w = p.tries_1998_plus + T.OFFER_WEIGHT_BASE;
    return Math.max(1, T.LOW_CUT && p.tries_1998_plus < T.LOW_CUT ? w * T.LOW_FACTOR : w);
  }
  function isLow(p) { return T.LOW_CUT && p.tries_1998_plus < T.LOW_CUT; }
  T.weightOf = weightOf;

  
  
  
  function seededSample(pool, k, already, tag) {
    var lowTaken = (already || []).some(isLow), out = [], pids = {};
    (already || []).forEach(function (p) { pids[p.pid] = 1; });
    var u = keysFor(tag, pool), keyed = new Array(pool.length), highs = 0;
    for (var j = 0; j < pool.length; j++) { keyed[j] = [pool[j], Math.log(u[j]) / weightOf(pool[j])]; if (!isLow(pool[j])) highs++; }
    
    var ranked = topByKey(keyed, 24), full = ranked.length >= keyed.length;
    for (var i = 0; out.length < k; i++) {
      if (i >= ranked.length) { if (full) break; ranked = topByKey(keyed, keyed.length); full = true; if (i >= ranked.length) break; }
      var p = ranked[i][0];
      if (pids[p.pid]) continue;
      if (isLow(p) && lowTaken && highs > 0) continue;
      out.push(p); pids[p.pid] = 1;
      if (isLow(p)) lowTaken = true; else highs--;
    }
    return out;
  }
  
  function topByKey(list, n) {
    if (list.length <= n) return list.slice().sort(function (a, b) { return b[1] - a[1]; });
    var top = [];
    for (var i = 0; i < list.length; i++) {
      var x = list[i];
      if (top.length < n) { top.push(x); if (top.length === n) top.sort(function (a, b) { return b[1] - a[1]; }); continue; }
      if (x[1] <= top[n - 1][1]) continue;
      var j = n - 1;
      while (j > 0 && top[j - 1][1] < x[1]) { top[j] = top[j - 1]; j--; }
      top[j] = x;
    }
    return top;
  }
  function weightedSample(pool, k, already, tag) {
    if (S && S.seed && tag) return seededSample(pool, k, already, tag);
    var pids = {};
    (already || []).forEach(function (p) { pids[p.pid] = 1; });
    var items = pool.filter(function (p) { return !pids[p.pid]; }), out = [];
    while (out.length < k && items.length) {
      var total = 0;
      for (var i = 0; i < items.length; i++) total += weightOf(items[i]);
      var r = Math.random() * total, idx = 0;
      for (; idx < items.length; idx++) { r -= weightOf(items[idx]); if (r <= 0) break; }
      idx = Math.min(idx, items.length - 1);
      var p = items[idx];
      out.push(p);
      items = items.filter(function (q) { return q.pid !== p.pid; });
    }
    return out;
  }

  T.PROMO_CHANCE = 0;
  T.promoTier = function () { return ''; };
  T.promoLook = function () { return null; };
  T.promoKind = function () { return ''; };
  T.promoTrophy = function () { return ''; };

  



  T.BOOST_N = 1;
  T.BOOST_CHANCE = 0.7;
  T.boostMode = function () { return !!S && !!S.mode.wildcards && !S.qd && !S.daily; };
  T.setBoost = function (min) {
    if (!T.boostMode()) return false;
    S.boost = T.stream('boost' + (S.boostNo = (S.boostNo || 0) + 1))() < T.BOOST_CHANCE ? { min: Math.max(1, min), n: T.BOOST_N } : null;
    return !!S.boost;
  };

  T.rollOffer = function () {
    var tag = 'offer' + (S.offerNo++), rng = T.stream(tag);
    S.scoutMode = false;
    
    if (S.keyPick) {
      S.keyPick = false;
      var keyed = specialOffer(tag + 'k');
      if (keyed.length) { S.offer = { kind: 'roll', special: 'legends', key: true, players: keyed }; S.revealed = {}; return S.offer; }
    }
    var boost = S.boost; S.boost = null;
    var pool = T.eligible(), players;
    var first = !S.firstOfferDone;
    S.firstOfferDone = true;
    var lift = boost ? pool.filter(function (p) { return p.tries_1998_plus >= boost.min; }) : [];
    if (lift.length) {
      lift = weightedSample(lift, Math.min(boost.n, lift.length), null, tag + 'b');
      var below = pool.filter(function (p) { return p.tries_1998_plus < boost.min; });
      if (below.length < T.OFFER_SIZE - lift.length) below = pool.filter(function (p) { return lift.indexOf(p) < 0; });
      players = weightedSample(below, T.OFFER_SIZE - lift.length, lift, tag);
      lift.forEach(function (p) { players.splice(Math.floor(rng() * (players.length + 1)), 0, p); });
      S.offer = { kind: 'roll', players: players, boosted: true };
      S.revealed = {};
      return S.offer;
    }
    var stars = first && rng() < T.FIRST_STAR_CHANCE ? pool.filter(function (p) { return p.tries_1998_plus >= T.starCut(); }) : [];
    if (stars.length) {
      var star = S.seed ? stars.map(function (p) { return [p, keyU(tag + 's', p.id)]; }).sort(function (a, b) { return b[1] - a[1]; })[0][0]
        : stars[Math.floor(Math.random() * stars.length)];
      players = weightedSample(pool.filter(function (p) { return p !== star; }), T.OFFER_SIZE - 1, [star], tag);
      players.splice(Math.floor(rng() * (players.length + 1)), 0, star);
    } else {
      players = weightedSample(pool, T.OFFER_SIZE, null, tag);
    }
    if (!first) noteLuck(pool, players);
    S.offer = { kind: 'roll', players: players };
    S.revealed = {};
    return S.offer;
  };

  

  function noteLuck(pool, players) {
    var tw = 0, tt = 0;
    for (var i = 0; i < pool.length; i++) { var w = weightOf(pool[i]); tw += w; tt += w * pool[i].tries_1998_plus; }
    if (!tw) return;
    S.luckExp += players.length * tt / tw;
    S.luckGot += players.reduce(function (sum, p) { return sum + p.tries_1998_plus; }, 0);
  }
  T.luckPct = function () {
    return S && S.luckExp >= 20 ? Math.max(-99, Math.min(999, Math.round(100 * (S.luckGot / S.luckExp - 1)))) : null;
  };
  T.wildcardsUsed = function () {
    if (!S || !S.mode.wildcards) return null;
    var st = S.wcStart || { reroll: 1 + (S.profileRerolls || 0), scout: T.FREE_REVEALS || 0, tweak: 1 };
    return Math.max(0, st.reroll + (S.bonusRerolls || 0) + (S.boughtRerolls || 0) - S.wildcards.reroll) + Math.max(0, st.scout + (S.boughtScouts || 0) - S.wildcards.scout) +
      Math.max(0, st.tweak + (S.boughtTweaks || 0) - S.wildcards.tweak);
  };

  


  T.legendKeyRoom = function () {
    return !!S && S.mode.id === 'plus' && !S.finished && !S.fullTime && !S.challenge && !!T.LEGENDS &&
      T.LEGENDS.some(function (p) { return !T.taken(p) && T.fitsEmpty(p); });
  };
  T.legendKeyFits = function () { return T.legendKeyRoom() && !(S.offer && (S.offer.special || S.offer.paid || S.offer.goat)); };
  T.useLegendKey = function () {
    if (!T.legendKeyFits()) return false;
    S.keysUsed = (S.keysUsed || 0) + 1; S.keyUsed = 'legend'; S.keyPick = true;
    return true;
  };

  


  T.goatPlayer = function () { return (T.GOAT_SRC && T.byId[T.GOAT_SRC]) || null; };
  T.goatRoom = function () { var g = T.goatPlayer(); return !!S && !!g && !T.taken(g) && T.fitsEmpty(g); };
  T.goatFits = function () {
    var g = T.goatPlayer();
    return !!S && !!g && T.DATASET === 'nrl' && S.mode.id === 'plus' && !S.finished && !S.fullTime && !S.goatUsed && !S.challenge && !S.daily &&
      !(S.offer && (S.offer.key || S.offer.special)) && !T.taken(g) && !S.keyPick && T.fitsEmpty(g);
  };
  T.useGoat = function () {
    if (!T.goatFits()) return false;
    var g = T.goatPlayer();
    S.goatUsed = true;
    S.offer = { kind: 'roll', goat: true, players: [g] };
    S.revealed = {}; S.revealed[g.id] = true;
    return true;
  };

  T.IMM_MODES = [];
  T.immMode = function () { return false; };
  T.immFits = function () { return false; };
  T.useImm = function () { return false; };
  T.ilMode = function () { return false; };
  T.ilFits = function () { return false; };
  T.useIL = function () { return false; };
  T.keepOffer = function () {
    if (!S || !S.offer || !S.offer.paid || S.offer.taken) return false;
    S.offer = S.offer.prev || null;
    return true;
  };

  T.showClub = function (p) { return T.lastClub(p); };

  
  T.pick = function (id, code, slotIdx) {
    var p = T.byId[id];
    if (!p || T.taken(p) || S.finished) return null;
    var codes = T.openCodesFor(p);
    if (!codes.length) return null;
    var target = code && codes.indexOf(code) !== -1 ? code : codes[0];
    var idx = -1;
    if (slotIdx != null && S.slots[slotIdx] && !S.slots[slotIdx].player && S.slots[slotIdx].code === target) idx = slotIdx;
    for (var i = 0; idx === -1 && i < S.slots.length; i++) {
      if (!S.slots[i].player && S.slots[i].code === target) { idx = i; break; }
    }
    if (idx === -1) return null;
    
    var offer = (S.offer && S.offer.players) || [];
    S.slots[idx].top = offer.indexOf(p) >= 0 && offer.every(function (o) { return o === p || T.taken(o) || !T.fitsEmpty(o) || o.tries_1998_plus <= p.tries_1998_plus; });
    
    if (S.revealed[p.id] || (S.offer && (S.offer.key || S.offer.goat || S.offer.paid))) S.known[p.id] = true;
    S.slots[idx].player = p;
    S.slots[idx].club = null; S.slots[idx].year = null;
    S.used[id] = true; S.usedP[p.pid] = true;
    S.picks++;
    S.offer = null;
    S.revealed = {};
    S.scoutMode = false;
    S.history.push({ type: 'pick', id: id, slot: idx });
    return idx;
  };

  
  T.removeAt = function (idx) {
    var s = S.slots[idx];
    if (!s || !s.player) return null;
    var p = s.player;
    s.player = null; s.club = null; s.year = null; s.top = null;
    delete S.used[p.id]; delete S.usedP[p.pid]; delete S.known[p.id];
    if (S.captain === idx) S.captain = null;
    S.awaitingLock = false;
    S.history.push({ type: 'tweak', id: p.id, slot: idx });
    return p;
  };

  



  T.captainOffer = function () {
    return !!S && S.mode.id === 'plus' && !S.daily && !S.challenge && !S.qd && !S.finished && S.captain == null && T.filledCount() === S.slots.length;
  };
  T.setCaptain = function (idx) {
    if (!T.captainOffer() || !S.slots[idx] || !S.slots[idx].player) return false;
    S.captain = idx; S.capSet = true;
    S.history.push({ type: 'captain', id: S.slots[idx].player.id, slot: idx });
    return true;
  };
  
  T.bestCaptain = function () {
    var best = -1;
    S.slots.forEach(function (s, i) { if (s.player && (best < 0 || s.player.tries_1998_plus > S.slots[best].player.tries_1998_plus)) best = i; });
    return best;
  };

  

  T.outcome = function (force) {
    var total = T.total(), full = T.filledCount() === S.slots.length;
    if (!full) return null;
    if (!force && S.mode.wildcards && S.wildcards.tweak > 0) return null; 
    if (S.daily && S.daily.target) {
      return total >= S.daily.target ? { win: true, total: total, target: S.daily.target, diff: total - S.daily.target, reason: 'won' }
        : { win: false, total: total, target: S.daily.target, diff: total - S.daily.target, reason: 'under' };
    }
    return { win: false, total: total, target: null, diff: 0, reason: 'done' };
  };
})(window.T = window.T || {});
