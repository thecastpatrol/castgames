 
(function (T) {
  'use strict';

  T.MODES = {
    exact: {
      id: 'exact', event: 'hard_1000_plays', name: 'Exactly 100000', short: 'Exactly 100000',
      blurb: 'Roll 3, pick 1, 15 seconds a pick. Land on 100000 exactly. Under or over and you miss.',
      
      
      rule: 'exact', source: 'roll', wildcards: true, paidOnly: true
    },
    plus: {
      id: 'plus', event: 'classic_1000_plays', name: '100000+', short: '100000+',
      blurb: 'Roll 3, pick 1. Get your team to 100000 career points or more.',
      rule: 'atleast', source: 'roll', wildcards: true
    },
    spin: {
      id: 'spin', event: 'team_spin_plays', name: 'Team Spin', short: 'Team Spin',
      blurb: 'Choose a position, then spin a team and season and pick from that roster. Aim for 100000+.',
      rule: 'atleast', source: 'spin', wildcards: true
    },
    
    daily: {
      id: 'daily', event: 'daily_1000_plays', name: 'Daily', short: 'Daily',
      blurb: 'Today\u2019s themed draft. Get your team to the target.',
      rule: 'atleast', source: 'roll', wildcards: false
    },
    
    wc: {
      id: 'wc', event: 'world_cup_200_plays', dataset: 'wc',
      name: 'World Cup ' + T.DATASETS.wc.target + '+', short: 'World Cup ' + T.DATASETS.wc.target + '+',
      blurb: 'Roll 3, pick 1. Get your team to ' + T.DATASETS.wc.target + ' points or more.',
      rule: 'atleast', source: 'roll', wildcards: true
    },
    nrlw: {
      id: 'nrlw', event: 'nrlw_plays', dataset: 'nrlw',
      name: 'Second Pack ' + T.DATASETS.nrlw.target + '+', short: 'Second Pack ' + T.DATASETS.nrlw.target + '+',
      blurb: 'Roll 3, pick 1. Get your team to ' + T.DATASETS.nrlw.target + ' points or more.', 
      rule: 'atleast', source: 'roll', wildcards: true
    }
  };

   
  T.OFFER_WEIGHT_BASE = 6000; 
  
  T.FIRST_STAR_CHANCE = 0.7;
  T.OFFER_SIZE = 3;
  T.IL_NATURAL = 0.5; 
  
  
  function ilFirstKey() { var u = window.CastAccount && window.CastAccount.uid ? window.CastAccount.uid() : ''; return 'wc_il_first' + (u ? '_' + u : ''); }
  T.ilFirstSeen = function () { try { return !!localStorage.getItem(ilFirstKey()); } catch (e) { return true; } };
  T.ilFirstDone = function () { try { localStorage.setItem(ilFirstKey(), '1'); } catch (e) {   } };

  



  

  T.HARD = { weight: 55000, legends: 0.1, immortal: 0.02, lifeline: 1, firstStar: 0.7 };
  


  T.hasLegend = function () { return !!S && S.slots.some(function (s) { return s.player && s.player.tier && s.player.tier !== 'goat'; }); };
  T.HARD_ON = true; 
  T.isHard = function (mode) { return T.HARD_ON && !!mode && mode.id === 'plus' && T.DATASET === 'nrl'; };

  var S = null;

  





  T.GOAT_FREE = 0.24;
  T.GOAT_FREE_DAILY = 0.06; 
  T.GOAT_FREE_SPIN = 0.075; 
  T.GOAT_FROM = '2026-10-18';
  T.goatOut = function (p) { return !!S && !!S.goatOut && !!p && p.id === (T.GOAT_SRC || T.GOAT_ID); };

  T.state = function () { return S; };
  
  
  function copyState(x) {
    return Object.assign({}, x, {
      slots: x.slots.map(function (s) { return Object.assign({}, s); }), used: Object.assign({}, x.used), revealed: {},
      wildcards: Object.assign({}, x.wildcards), history: x.history.slice(),
      offer: x.offer ? Object.assign({}, x.offer, { players: x.offer.players.slice() }) : null
    });
  }
  T.snapshot = function () { return copyState(S); };
  T.restore = function (x) { var c = copyState(x); Object.keys(S).forEach(function (k) { delete S[k]; }); Object.assign(S, c); };
  
  T.adopt = function (x) { S = x; return S; };

  


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
  
  function keyU(tag, id) { var u = mulberry32(hash32(S.seed + '|' + tag + '|' + id))(); return u > 0 ? u : 1e-12; }
  T.newSeed = function () {
    var a = new Uint32Array(2);
    try { (window.crypto || window.msCrypto).getRandomValues(a); } catch (e) { a[0] = Math.random() * 4294967296; a[1] = Math.random() * 4294967296; }
    var s = (a[0].toString(36) + a[1].toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 12) || 'seed' + Date.now().toString(36);
    var P = window.CAST_PROMO;
    return P ? P.mark(P.clean(s)) : s; 
  };

  
  T.newGame = function (modeId, opts) {
    var mode = T.MODES[modeId] || T.MODES.plus;
    S = {
      mode: mode,
      slots: T.SLOTS.map(function (code) { return { code: code, player: null }; }),
      used: {},          
      offer: null,       
      revealed: {},      
      wildcards: mode.wildcards && !mode.paidOnly ? { reroll: 1, scout: 1, tweak: 1 } : { reroll: 0, scout: 0, tweak: 0 },
      paidUsed: {},      
      tweakMode: false,
      spinPos: null,     
      spinSlot: null,    
      picks: 0,
      finished: false,
      awaitingLock: false,
      history: [],
      seed: (opts && opts.seed) || T.newSeed(), offerNo: 0, spinNo: 0,
      challenge: !!(opts && opts.challenge), 
      daily: (opts && opts.daily) || null    
    };
    
    
    S.special = null; S.specialAt = 0; S.specialDone = false; S.lifelineRoll = null; S.lifelineUsed = false;
    S.luckExp = 0; S.luckGot = 0; 
    S.hard = T.isHard(mode); 
    S.goatOut = T.DATASET === 'nrl' && !(S.daily && S.daily.date < T.GOAT_FROM) && !(T.stream('goatfree')() < (S.daily ? T.GOAT_FREE_DAILY : mode.source === 'spin' ? T.GOAT_FREE_SPIN : T.GOAT_FREE)); 
    
    
    
    S.promoDef = window.CAST_PROMO && window.CAST_PROMO.of ? window.CAST_PROMO.of(S.seed) : null;
    S.promo = !!(S.promoDef && (mode.id === 'plus' || mode.id === 'exact' || mode.id === 'nrlw') && !S.daily);
    if (mode.id === 'plus' && T.DATASET === 'nrl' && T.LEGENDS && T.LEGENDS.length) {
      var force = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && (location.search.match(/[?&]pack=(legends|immortal)/) || [])[1];
      var g = T.stream('game'), r = g(), odds = S.hard ? T.HARD : T.LEGEND_ODDS || {};
      S.special = force || (r < (odds.immortal || 0) ? 'immortal' : r < (odds.immortal || 0) + (odds.legends || 0) ? 'legends' : null);
      S.specialAt = force ? 0 : 2 + Math.floor(g() * 8); 
    }
    
    
    
    S.il = null; S.ilegUsed = 0;
    if (mode.id === 'wc' && T.DATASET === 'wc' && T.WC_IL.length && !S.daily) {
      var ig = T.stream('ilegend');
      
      if (ig() < T.IL_NATURAL || (!S.challenge && !T.ilFirstSeen())) S.il = { at: 2 + Math.floor(ig() * 8), shown: null };
    }
    
    T.TARGET = (S.daily && S.daily.target) || (T.DATASETS[T.DATASET] || {}).target || T.TARGET;
    return S;
  };

  

  
  T.dailyClub = function () { return (S && S.daily && S.daily.club) || null; };
  T.hasDailyClub = function () {
    var club = T.dailyClub();
    return !club || S.slots.some(function (s) { return s.player && T.playedFor(s.player, club); });
  };

  
  
  
  
  
  T.LIFELINE_PER = 36000; 
  T.LIFELINE_SLOTS = 2; 
  T.LIFELINE_CHANCE = 1 / 3;
  T.LIFELINE_IMMORTAL = 0; 
  function lifeline() {
    if (!S.mode || S.mode.id !== 'plus' || T.DATASET !== 'nrl' || !T.LEGENDS || !T.LEGENDS.length || S.specialDone) return false;
    var left = S.slots.length - T.filledCount();
    if (!(left >= 1 && left <= T.LIFELINE_SLOTS && (T.TARGET - T.total()) / left > T.LIFELINE_PER)) return false;
    if (S.special) return true;
    if (S.lifelineRoll == null) S.lifelineRoll = T.stream('lifeline')() < (S.hard ? T.HARD.lifeline : T.LIFELINE_CHANCE);
    return S.lifelineRoll;
  }

  
  
  function specialOffer(tag, kind, keyed) {
    var imm = (kind || S.special) === 'immortal';
    var list = T.LEGENDS.filter(function (p) {
      
      return (imm ? T.isImmortal(p) : T.isLegend(p)) && !S.used[p.id] && T.fitsEmpty(p) && (keyed || !T.goatOut(p)); 
    });
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

  T.filledCount = function () {
    return S.slots.filter(function (s) { return s.player; }).length;
  };

  T.total = function () {
    return S.slots.reduce(function (sum, s) { return sum + (s.player ? s.player.tries_1998_plus : 0); }, 0);
  };

  T.fitsEmpty = function (p) {
    var empty = T.emptyCodes();
    return T.positionsOf(p).some(function (c) { return empty[c]; });
  };

  
  T.openCodesFor = function (p) {
    var empty = T.emptyCodes();
    var seen = {};
    var codes = T.positionsOf(p).filter(function (c) {
      if (!empty[c] || seen[c]) return false;
      seen[c] = true;
      return true;
    });
    
    
    
    if (codes.length > 1) {
      var open = function (c) { return S.slots.filter(function (x) { return !x.player && x.code === c; }).length; };
      var scarce = codes.filter(function (c) { return T.supplyFor(c, p) <= open(c); });
      if (scarce.length) return scarce.slice(0, 1);
    }
    return codes;
  };
  
  T.supplyFor = function (code, me) {
    return T.players.filter(function (q) { return (q === me || (!S.used[q.id] && !T.goatOut(q))) && T.inDailyPool(q) && T.positionsOf(q).indexOf(code) !== -1; }).length;
  };

  T.eligible = function () {
    
    var noIL = T.DATASET === 'wc';
    return T.players.filter(function (p) { return !S.used[p.id] && T.fitsEmpty(p) && T.inDailyPool(p) && !(noIL && p.il) && !T.goatOut(p); });
  };
  


  T.inDailyPool = function (p) {
    
    var nat = S && S.daily && S.daily.nations;
    if (nat) return T.nationsOf(p).some(function (k) { return nat.indexOf(k) >= 0; });
    var yrs = S && S.daily && S.daily.years;
    if (yrs) return (p.club_years || []).some(function (cy) { return cy.from <= yrs[1] && cy.to >= yrs[0]; });
    var only = S && S.daily && S.daily.only;
    if (!only) return true;
    return Object.keys(only).some(function (club) {
      var ys = only[club] || [];
      return ys.length ? ys.some(function (y) { return T.playedFor(p, club, y); }) : T.playedFor(p, club);
    });
  };

  
  function weightOf(p) {
    var w = p.tries_1998_plus + (S && S.hard ? T.HARD.weight : T.OFFER_WEIGHT_BASE);
    return T.LOW_CUT && p.tries_1998_plus < T.LOW_CUT ? w * T.LOW_FACTOR : w;
  }
  function isLow(p) { return T.LOW_CUT && p.tries_1998_plus < T.LOW_CUT; }

  
  
  function seededSample(pool, k, already, tag) {
    var lowTaken = (already || []).some(isLow), out = [];
    var ranked = pool.map(function (p) { return [p, Math.log(keyU(tag, p.id)) / weightOf(p)]; }).sort(function (a, b) { return b[1] - a[1]; });
    var highs = ranked.filter(function (x) { return !isLow(x[0]); }).length;
    for (var i = 0; i < ranked.length && out.length < k; i++) {
      var p = ranked[i][0];
      if (isLow(p) && lowTaken && highs > 0) continue; 
      out.push(p);
      if (isLow(p)) lowTaken = true; else highs--;
    }
    return out;
  }
  function weightedSample(pool, k, already, tag) {
    if (S && S.seed && tag) return seededSample(pool, k, already, tag);
    var items = pool.slice();
    var out = [];
    var lowTaken = (already || []).some(isLow);
    if (lowTaken) { var hi = items.filter(function (p) { return !isLow(p); }); if (hi.length) items = hi; }
    while (out.length < k && items.length) {
      var total = 0;
      for (var i = 0; i < items.length; i++) total += weightOf(items[i]);
      var r = Math.random() * total;
      var idx = 0;
      for (; idx < items.length; idx++) {
        r -= weightOf(items[idx]);
        if (r <= 0) break;
      }
      idx = Math.min(idx, items.length - 1);
      var p = items[idx];
      out.push(p);
      items.splice(idx, 1);
      if (isLow(p)) {
        
        var rest = items.filter(function (q) { return !isLow(q); });
        if (rest.length) items = rest;
      }
    }
    return out;
  }

  
  
  
  T.PROMO_CHANCE = 0.05;
  T.promoTier = function (p) { return S && S.promo && p && S.promoDef ? S.promoDef.tier(p.name, true) : ''; };
  T.promoLook = function (p) { return S && S.promo && p && S.promoDef ? S.promoDef.look(p.name, true) : null; };
  T.promoKind = function () { return S && S.promo && S.promoDef ? S.promoDef.kind : ''; };
  T.promoTrophy = function () { return T.promoKind() === 'prem' ? 'prem26' : 'toty'; };

  






  T.BOOST_N = 1;
  T.BOOST_CHANCE = 0.7;
  T.boostMode = function () { return !!S && !!S.mode.wildcards && S.mode.id !== 'exact' && !S.qd && !S.daily; };
  T.setBoost = function (min) {
    if (!T.boostMode()) return false;
    S.boost = T.stream('boost' + (S.boostNo = (S.boostNo || 0) + 1))() < T.BOOST_CHANCE ? { min: Math.max(1, min), n: T.BOOST_N } : null;
    return !!S.boost;
  };

  T.rollOffer = function () {
    var tag = 'offer' + (S.offerNo++), rng = T.stream(tag);
    
    if (S.keyPick) {
      S.keyPick = false;
      var keyed = specialOffer(tag + 'k', 'legends', true);
      if (keyed.length) { S.offer = { kind: 'roll', special: 'legends', key: true, players: keyed }; S.revealed = {}; return S.offer; }
    }
    var boost = S.boost; S.boost = null;
    var rescue = lifeline();
    if (rescue && !S.special) S.special = rng() < T.LIFELINE_IMMORTAL ? 'immortal' : 'legends';
    if (S.special && !S.specialDone && !T.hasLegend() && (rescue || S.picks >= S.specialAt)) {
      var greats = specialOffer(tag + 'g');
      
      if (!greats.length && rescue) { S.special = S.special === 'immortal' ? 'legends' : 'immortal'; greats = specialOffer(tag + 'h'); }
      if (greats.length) {
        S.specialDone = true;
        S.lifelineUsed = !!rescue;
        S.offer = { kind: 'roll', special: S.special, lifeline: !!rescue, players: greats };
        S.revealed = {};
        return S.offer;
      }
    }
    var pool = T.eligible();
    var players;
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
    var stars = first && rng() < (S.hard ? T.HARD.firstStar : T.FIRST_STAR_CHANCE)
      ? pool.filter(function (p) { return p.tries_1998_plus >= T.starCut(); }) : [];
    if (stars.length) {
      var star = S.seed ? stars.map(function (p) { return [p, keyU(tag + 's', p.id)]; }).sort(function (a, b) { return b[1] - a[1]; })[0][0]
        : stars[Math.floor(Math.random() * stars.length)];
      players = weightedSample(pool.filter(function (p) { return p !== star; }), T.OFFER_SIZE - 1, [star], tag);
      players.splice(Math.floor(rng() * (players.length + 1)), 0, star); 
    } else {
      players = weightedSample(pool, T.OFFER_SIZE, null, tag);
    }
    
    
    var club = T.dailyClub();
    if (club && !T.hasDailyClub() && !players.some(function (p) { return T.playedFor(p, club); })) {
      var hasLow = players.some(isLow), mine = pool.filter(function (p) { return T.playedFor(p, club) && players.indexOf(p) < 0; });
      if (hasLow && mine.some(function (p) { return !isLow(p); })) mine = mine.filter(function (p) { return !isLow(p); });
      if (mine.length) {
        var pickC = mine.map(function (p) { return [p, S.seed ? Math.log(keyU(tag + 'c', p.id)) / weightOf(p) : Math.random()]; }).sort(function (a, b) { return b[1] - a[1]; })[0][0];
        var at = players.length - 1;
        while (at > 0 && players[at] === star) at--;
        players[at] = pickC;
      }
    }
    
    
    if (S.promo && !first && !players.some(function (p) { return T.promoTier(p); })) {
      var pr = T.stream(tag + 'pm');
      if (pr() < T.PROMO_CHANCE) {
        var toty = pool.filter(function (p) { return T.promoTier(p) && players.indexOf(p) < 0; });
        if (toty.length) players[Math.floor(pr() * players.length)] = toty[Math.floor(pr() * toty.length)];
      }
    }
    if (!first) noteLuck(pool, players);
    
    
    if (S.il && !S.il.shown && S.picks >= S.il.at) {
      var ils = T.WC_IL.filter(function (p) { return !S.used[p.id] && T.fitsEmpty(p); });
      if (ils.length) {
        var ir = T.stream(tag + 'il'), leg = ils[Math.floor(ir() * ils.length)];
        players[Math.floor(ir() * players.length)] = leg;
        S.il.shown = leg.id;
        T.ilFirstDone();
        S.offer = { kind: 'roll', players: players, il: leg.id };
        S.revealed = {};
        return S.offer;
      }
    }
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
    var st = S.wcStart || (S.mode.paidOnly ? { reroll: 0, scout: 0, tweak: 0 } : { reroll: 1 + (S.profileRerolls || 0), scout: 1, tweak: 1 }); 
    return Math.max(0, st.reroll + (S.bonusRerolls || 0) + (S.boughtRerolls || 0) - S.wildcards.reroll) + Math.max(0, st.scout + (S.boughtScouts || 0) - S.wildcards.scout) + Math.max(0, st.tweak + (S.boughtTweaks || 0) - S.wildcards.tweak);
  };

  





  T.legendKeyRoom = function () {
    return !!S && S.mode.id === 'plus' && T.DATASET === 'nrl' && !S.finished && !S.challenge && !!T.LEGENDS &&
      T.LEGENDS.some(function (p) { return T.isLegend(p) && !S.used[p.id] && T.fitsEmpty(p); });
  };
  T.legendKeyFits = function () {
    return T.legendKeyRoom() && !(S.offer && (S.offer.special || S.offer.paid || S.offer.goat));
  };
  T.useLegendKey = function () {
    if (!T.legendKeyFits()) return false;
    S.keysUsed = (S.keysUsed || 0) + 1; S.keyUsed = 'legend'; S.keyPick = true;
    return true;
  };

  



  T.goatPlayer = function () { return T.GOAT_CARD || (T.GOAT_SRC && T.byId[T.GOAT_SRC]) || null; };
  
  T.goatRoom = function () { var g = T.goatPlayer(); return !!S && !!g && !S.used[g.id] && !S.used[T.GOAT_SRC] && T.fitsEmpty(g); };
  T.goatFits = function () {
    var g = T.goatPlayer();
    return !!S && !!g && T.DATASET === 'nrl' && (S.mode.id === 'plus' || S.mode.id === 'exact') && !S.finished && !S.goatUsed && !S.challenge && !S.daily &&
      !(S.offer && (S.offer.key || S.offer.special)) && !S.used[g.id] && !S.used[T.GOAT_SRC] && !S.keyPick && T.fitsEmpty(g);
  };
  T.useGoat = function () {
    if (!T.goatFits()) return false;
    var g = T.goatPlayer();
    S.goatUsed = true;
    if (g.id !== T.GOAT_SRC) S.used[T.GOAT_SRC] = true; 
    S.offer = { kind: 'roll', goat: true, players: [g] };
    S.revealed = {}; S.revealed[g.id] = true;
    return true;
  };

  





  T.IMM_MODES = ['plus', 'exact', 'spin'];
  function immPool() {
    var spot = S.mode.source === 'spin' ? S.spinPos : null;
    return (T.LEGENDS || []).filter(function (p) {
      return T.isLegend(p) && !S.used[p.id] && (spot ? T.openCodesFor(p).indexOf(spot) !== -1 : T.fitsEmpty(p));
    });
  }
  T.immMode = function () { return false; }; 
  T.immFits = function () {
    return T.immMode() && !S.finished && !S.tweakMode && !S.subMode && !!S.offer && S.offer.players.length > 0 && !T.hasLegend() && !S.keyPick && 
      !S.offer.goat && !S.offer.special && immPool().length > 0;
  };
  T.useImm = function () {
    if (!T.immFits()) return false;
    var list = immPool(), out = [];
    while (out.length < T.OFFER_SIZE && list.length) out.push(list.splice(Math.floor(Math.random() * list.length), 1)[0]);
    S.offer = { kind: 'roll', special: 'immortal', paid: true, players: out, prev: S.offer };
    return true;
  };
  




  function ilPool() {
    
    var onShow = S.offer && !S.offer.paid ? S.offer.players : [];
    return (T.WC_IL || []).filter(function (p) { return !S.used[p.id] && T.fitsEmpty(p) && onShow.indexOf(p) < 0; });
  }
  T.ilMode = function () { return !!S && T.DATASET === 'wc' && S.mode.id === 'wc' && !S.challenge && !S.daily && !S.qd; };
  T.ilFits = function () {
    return T.ilMode() && !S.finished && !S.tweakMode && !S.subMode && !!S.offer && S.offer.players.length > 0 && !S.offer.paid && ilPool().length > 0;
  };
  T.useIL = function () {
    if (!T.ilFits()) return false;
    var list = ilPool(), out = [], seen = {};
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
    list.forEach(function (p) { var n = T.lastClub(p); if (out.length < T.OFFER_SIZE && !seen[n]) { seen[n] = 1; out.push(p); } });
    list.forEach(function (p) { if (out.length < T.OFFER_SIZE && out.indexOf(p) < 0) out.push(p); });
    S.offer = { kind: 'roll', special: 'ilegend', paid: true, item: 'ileg', players: out, prev: S.offer };
    return true;
  };
  T.keepOffer = function () {
    if (!S || !S.offer || !S.offer.paid || S.offer.taken) return false;
    S.offer = S.offer.prev || null;
    return true;
  };

  
  
  

  T.showClub = function (p) {
    var d = S && S.daily;
    if (!p || p.tier || !d || (!d.only && !d.years)) return T.lastClub(p);
    var best = null;
    (p.club_years || []).forEach(function (cy) {
      var ys = d.only && d.only[cy.club];
      var ok = d.years ? cy.from <= d.years[1] && cy.to >= d.years[0] : !!ys && (!ys.length || ys.some(function (y) { return cy.from <= y && y <= cy.to; }));
      if (ok && (!best || cy.to > best.to || (cy.to === best.to && cy.from >= best.from))) best = cy;
    });
    return best ? best.club : T.lastClub(p);
  };

  T.pick = function (id, code, slotIdx) {
    var p = T.byId[id];
    if (!p || S.used[id] || S.finished) return null;
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
    S.slots[idx].top = offer.indexOf(p) >= 0 && offer.every(function (o) { return o === p || S.used[o.id] || !T.fitsEmpty(o) || o.tries_1998_plus <= p.tries_1998_plus; });
    S.slots[idx].player = p;
    
    S.slots[idx].club = S.offer && S.offer.kind === 'spin' ? S.offer.club : null;
    S.slots[idx].year = S.offer && S.offer.kind === 'spin' ? S.offer.year : null;
    S.used[id] = true;
    S.picks++;
    S.offer = null;
    S.revealed = {};
    S.spinPos = null;
    S.spinSlot = null;
    S.history.push({ type: 'pick', id: id, slot: idx });
    return idx;
  };

  
  T.removeAt = function (idx) {
    var s = S.slots[idx];
    if (!s || !s.player) return null;
    var p = s.player;
    s.player = null;
    s.club = null;
    s.year = null;
    s.top = null;
    delete S.used[p.id];
    S.awaitingLock = false;
    S.history.push({ type: 'tweak', id: p.id, slot: idx });
    return p;
  };

  

  var WC_PACIFIC = ['sam', 'ton', 'fij', 'png', 'cok'];
  T.wcTrophyIds = function (players, total, opt) {
    var ids = [], target = T.DATASETS.wc.target, full = players.length === 13, nat = {};
    if (players.some(function (p) { return p && p.il; })) ids.push('wcleg');
    if (!full) return ids;
    players.forEach(function (p) { var n = p.primary_club === 'gbr' ? 'eng' : p.primary_club; nat[n] = (nat[n] || 0) + 1; });
    var most = Math.max.apply(null, Object.keys(nat).map(function (k) { return nat[k]; }));
    var pacific = players.filter(function (p) { return WC_PACIFIC.indexOf(p.primary_club) >= 0; }).length;
    if (total >= 220) ids.push('wc220');
    if (total >= target - 10 && total < target) ids.push('wcclose');
    if (total >= target && opt && opt.usedWild === false) ids.push('wcnowild');
    if (Object.keys(nat).length >= 10) ids.push('wcworld');
    if (most >= 7) ids.push('wcnation');
    if (pacific >= 5) ids.push('wcpacific');
    if ((nat.png || 0) >= 3) ids.push('wckumul');
    if (!nat.aus && !nat.nzl) ids.push('wcrest');
    return ids;
  };

  
  T.outcome = function (force) {
    var total = T.total();
    var full = T.filledCount() === S.slots.length;
    var mode = S.mode;
    if (mode.rule === 'exact') {
      if (total > T.TARGET) return { win: false, total: total, target: T.TARGET, diff: total - T.TARGET, reason: 'over' };
      if (!full) return null;
      if (total === T.TARGET) return { win: true, total: total, target: T.TARGET, diff: 0, reason: 'exact' };
      return { win: false, total: total, target: T.TARGET, diff: total - T.TARGET, reason: 'under' };
    }
    if (!full) return null;
    
    var themed = !!(S.daily && (S.daily.target || S.daily.club));
    if (total >= T.TARGET && !T.hasDailyClub()) return { win: false, total: total, target: T.TARGET, diff: total - T.TARGET, reason: 'noclub' };
    if (total >= T.TARGET) return { win: true, total: total, target: T.TARGET, diff: total - T.TARGET, reason: themed ? 'won' : 'hit' };
    if (!force && S.wildcards.tweak > 0) return null; 
    return { win: false, total: total, target: T.TARGET, diff: total - T.TARGET, reason: 'under' };
  };
})(window.T = window.T || {});
