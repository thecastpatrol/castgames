/* SC POINTS KING draft engine (17 Oct 2026, from the 1000TRIES engine via 100000 POINTS): modes, the 13, spin-3 offers of
   player seasons, picks, the outcome. One season per player in a team. No target: the highest SC total wins the boards
   and each board's #1 wears the crown. */
(function (T) {
  'use strict';

  T.MODES = {
    plus: {
      id: 'plus', event: 'classic_1000_plays', name: 'Classic', short: 'Classic',
      blurb: 'Spin 3 player seasons, pick 1. His SC points show once you pick him. Build the biggest 13 you can.',
      rule: 'high', source: 'roll', wildcards: true
    },
    // The Daily (js/daily.js): a themed draft everyone shares that day (seeded spins, Sydney date). No wildcards, no
    // Legend Key or GOAT. Won by reaching the day's target
    daily: {
      id: 'daily', event: 'daily_1000_plays', name: 'Daily', short: 'Daily',
      blurb: 'Today’s themed spins. Get your 13 to the target.',
      rule: 'high', source: 'roll', wildcards: false
    },
    // Kept so the shared code finds them: never on in SC
    wc: { id: 'wc', event: 'world_cup_200_plays', dataset: 'wc', name: 'World Cup', short: 'World Cup', blurb: '', rule: 'high', source: 'roll', wildcards: true, off: true },
    nrlw: { id: 'nrlw', event: 'nrlw_plays', dataset: 'nrlw', name: 'Second Pack', short: 'Second Pack', blurb: '', rule: 'high', source: 'roll', wildcards: true, off: true }
  };

  /* Offer weighting. Offers are random, but a season's chance of turning up scales with (SC points +
     OFFER_WEIGHT_BASE), so every season with a game can come up and the big ones come up more. */
  T.OFFER_WEIGHT_BASE = 100; // each pack sets its own in T.DATASETS
  // How often the first offer of a game shows a big season (top 5% of the pack)
  T.FIRST_STAR_CHANCE = 0.7;
  T.OFFER_SIZE = 3;
  T.HARD = { weight: 100, legends: 0, immortal: 0, lifeline: 0, firstStar: 0.7 };
  T.HARD_ON = false;
  T.isHard = function () { return false; };
  T.hasLegend = function () { return !!S && S.slots.some(function (s) { return s.player && s.player.tier && s.player.tier !== 'goat'; }); };

  /* The GOAT in free play (17 Oct 2026, the owner: the GOAT extremely rare unless you pay, in every game): most games
     are dealt without his season (S.goatOut): no offer, Reroll, Remove Player offer or Daily holds it. Now and then
     (T.GOAT_FREE, seeded with the draft, so a friend's challenge deals the same) a game is dealt with him in the pack
     as any other season. The GOAT item itself is unchanged. A Daily follows it from T.GOAT_FROM */
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

  /* Seeded draws: every game is dealt from a seed (S.seed), so a friend can be challenged to the same draft, and the
     Daily's spins are the same for everyone (its seed is the Sydney date and the go). Each draw has its own stream,
     and offers are chosen by weighted random keys per season, so two players with the same open spots see the same
     cards. Without a seed it is plain Math.random. */
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
  // A number in (0, 1) fixed for this seed, draw and card (each card's own hash is worked out once)
  var idHash = {};
  function keyU(tag, id) {
    var h = idHash[id];
    if (h === undefined) h = idHash[id] = hash32(String(id));
    var u = first32((hash32(S.seed + '|' + tag) ^ Math.imul(h, 0x9E3779B1)) >>> 0);
    return u > 0 ? u : 1e-12;
  }
  // mulberry32's first number for a seed, without making a stream
  function first32(a) {
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  // keyU for a whole pool: the draw's hash once, then each card's
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

  // opts.seed: play this exact draft (a challenge, or the Daily's go); otherwise a fresh seed
  T.newGame = function (modeId, opts) {
    var mode = T.MODES[modeId] || T.MODES.plus;
    S = {
      mode: mode,
      slots: T.SLOTS.map(function (code) { return { code: code, player: null }; }),
      used: {},          // card id -> true for seasons in the 13
      usedP: {},         // player id -> true: one season per player in a team
      known: {},         // card id -> true when his SC points showed before he was picked (a Reveal, a Legend Key, the GOAT)
      offer: null,       // { kind: 'roll', players: [] }
      revealed: {},      // card id -> true while Reveal shows his SC points on the offer
      wildcards: mode.wildcards ? { reroll: 1, scout: T.FREE_REVEALS || 0, tweak: 1 } : { reroll: 0, scout: 0, tweak: 0 },
      paidUsed: {},
      tweakMode: false,
      scoutMode: false,  // Reveal armed: the next card tapped shows his SC points
      spinPos: null, spinSlot: null,
      picks: 0,
      finished: false,
      awaitingLock: false,
      fullTime: false,   // Team Full is locked in: the SC Captain step, then the results
      captain: null,     // the slot of the SC Captain (his SC points count double), once one is set
      history: [],
      seed: (opts && opts.seed) || T.newSeed(), offerNo: 0, spinNo: 0,
      challenge: !!(opts && opts.challenge),
      daily: (opts && opts.daily) || null    // a Daily go: { date, n, go, target, only, years }
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

  // A season already in the team, or another season of a player in the team
  T.taken = function (p) { return !!S && !!p && (!!S.used[p.id] || !!S.usedP[p.pid]); };

  // The Legend Key's three: Legend seasons of three players not in the team who fit an open spot
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
  // The 13's SC points, the Captain's counted twice
  T.total = function () {
    return S.slots.reduce(function (sum, s, i) { return sum + (s.player ? s.player.tries_1998_plus * (S.captain === i ? 2 : 1) : 0); }, 0);
  };
  T.fitsEmpty = function (p) {
    var empty = T.emptyCodes();
    return T.positionsOf(p).some(function (c) { return empty[c]; });
  };

  // Distinct empty slot codes this season can go into
  T.openCodesFor = function (p) {
    var empty = T.emptyCodes(), seen = {};
    var codes = T.positionsOf(p).filter(function (c) {
      if (!empty[c] || seen[c]) return false;
      seen[c] = true;
      return true;
    });
    // A spot running out of seasons (a themed Daily can run short of one position): when the seasons left who can fill
    // it are no more than its open spots, someone who can fill it must go there
    if (codes.length > 1) {
      var open = function (c) { return S.slots.filter(function (x) { return !x.player && x.code === c; }).length; };
      var scarce = codes.filter(function (c) { var o = open(c); return T.supplyFor(c, p, o) <= o; });
      if (scarce.length) return scarce.slice(0, 1);
    }
    return codes;
  };
  // How many players (one count each, whatever his seasons) could still fill an open spot of this code; with cap, it
  // stops counting once it passes cap
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
  /* A themed Daily's own pool (js/sc-daily.js): 'only' { club: [years] } (an empty list is every season at that club),
     'years' [from, to] (seasons in those years) */
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

  // Seeded: each season's key is u^(1/weight) (log(u) / weight here), the same weighted odds as the draw below, but a
  // season's key stays the same whoever else is in the pool, so the same seed deals the same cards. Never two seasons
  // of one player in an offer
  function seededSample(pool, k, already, tag) {
    var lowTaken = (already || []).some(isLow), out = [], pids = {};
    (already || []).forEach(function (p) { pids[p.pid] = 1; });
    var u = keysFor(tag, pool), keyed = new Array(pool.length), highs = 0;
    for (var j = 0; j < pool.length; j++) { keyed[j] = [pool[j], Math.log(u[j]) / weightOf(pool[j])]; if (!isLow(pool[j])) highs++; }
    // only the best few are ever needed: the top 24 by key, and all of them in order only if those run out
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
  // The n highest keys of [card, key] pairs, highest first (a partial sort: an offer only ever needs the first few)
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

  /* Stronger wildcards (as every draft game): some of the time (T.BOOST_CHANCE) a Reroll's new offer, and the first
     offer after Remove Player, hold T.BOOST_N season with more SC points than the best one rerolled (or the one
     removed), when one fits your open spots, and the other cards don't beat him. Seeded. The main mode only. S.boost
     waits for the next offer. Boosted offers stay out of the luck of the draw */
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
    // A Legend Key (T.useLegendKey): this offer is its Legends Pick
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

  /* The luck of the draw, shown on the results: the SC points on every offer against what an average offer from the
     same seasons would hold. The first offer and a Legend Key's three are left out; rerolls count. */
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

  /* The Legend Key (CAST Pass's daily key, or bought): the offer becomes a Legends Pick, three all-time great SC seasons
     with their SC points showing. The main mode, while a Legend fits an open spot and a plain offer is showing; as many
     as you have in one team (S.keysUsed, d.lks) */
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

  /* The GOAT (the Shop's one GOAT item for every CAST draft game): Tom Trbojevic's 2021, the #1 SC season, as the next
     pick, his SC points showing. The main mode, once a game, never in a Daily or a friend's challenge, never over a
     Legends Pick, while no season of his is in the team and an open spot fits him */
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

  // Place a season. code is optional when only one open slot type fits; slotIdx (optional) is the exact spot clicked
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
    // Perfect Read (a trophy): was this the biggest season on offer who could go in the team? Ties count
    var offer = (S.offer && S.offer.players) || [];
    S.slots[idx].top = offer.indexOf(p) >= 0 && offer.every(function (o) { return o === p || T.taken(o) || !T.fitsEmpty(o) || o.tries_1998_plus <= p.tries_1998_plus; });
    // His SC points were showing when he was picked (a Reveal, a Legend Key, the GOAT): they stay on his tile
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

  // Remove Player: pull a pick out, reopen the slot, return the season to the pool
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

  /* The SC Captain (the owner, 17 Oct 2026; a Shop item, A$4.99, never free, CAST Pass included): once the 13 is full
     and locked in, one season of the 13 can be made Captain and his SC points count double. Offered at the end of every
     Classic game, never the Daily, a friend's challenge or Quick Draft; one a game. Taken from the Vault (or bought) only
     when it is set (js/app.js). S.capSet: one was used (d.cap, the slot's pick) */
  T.captainOffer = function () {
    return !!S && S.mode.id === 'plus' && !S.daily && !S.challenge && !S.qd && !S.finished && S.captain == null && T.filledCount() === S.slots.length;
  };
  T.setCaptain = function (idx) {
    if (!T.captainOffer() || !S.slots[idx] || !S.slots[idx].player) return false;
    S.captain = idx; S.capSet = true;
    S.history.push({ type: 'captain', id: S.slots[idx].player.id, slot: idx });
    return true;
  };
  // The Captain who adds the most (the step's first choice)
  T.bestCaptain = function () {
    var best = -1;
    S.slots.forEach(function (s, i) { if (s.player && (best < 0 || s.player.tries_1998_plus > S.slots[best].player.tries_1998_plus)) best = i; });
    return best;
  };

  /* The outcome once the 13 is full: Classic is 'done' whatever the total (the boards rank it; no target, so never a win
     or a miss). A Daily is won with its own target ('won') or not ('under'). force: lock in now */
  T.outcome = function (force) {
    var total = T.total(), full = T.filledCount() === S.slots.length;
    if (!full) return null;
    if (!force && S.mode.wildcards && S.wildcards.tweak > 0) return null; // Team Full: Remove Player or Lock In first
    if (S.daily && S.daily.target) {
      return total >= S.daily.target ? { win: true, total: total, target: S.daily.target, diff: total - S.daily.target, reason: 'won' }
        : { win: false, total: total, target: S.daily.target, diff: total - S.daily.target, reason: 'under' };
    }
    return { win: false, total: total, target: null, diff: 0, reason: 'done' };
  };
})(window.T = window.T || {});
