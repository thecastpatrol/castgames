/* 60000 RUNS draft engine: modes, slots, roll-3 offers, picks, outcome. */
(function (T) {
  'use strict';

  T.MODES = {
    exact: {
      id: 'exact', event: 'hard_1000_plays', name: 'Exactly 60,000', short: 'Exactly 60,000',
      blurb: 'Roll 3, pick 1, 15 seconds a pick. Land on 60,000 exactly. Under or over and you miss.',
      // Hard Mode (29 Sep 2026, the owner's call): wildcards, but no free ones. One of each a game, used from the Vault or
      // bought on the spot, for everyone (CAST Pass too), and no Substitute
      rule: 'exact', source: 'roll', wildcards: true, paidOnly: true
    },
    plus: {
      id: 'plus', event: 'classic_1000_plays', name: '60,000+', short: '60,000+',
      blurb: 'Roll 3, pick 1. Get your Test XI to 60,000 runs or more.',
      rule: 'atleast', source: 'roll', wildcards: true
    },
    spin: {
      id: 'spin', event: 'team_spin_plays', name: 'Team Spin', short: 'Team Spin',
      blurb: 'Choose a position, then spin a nation and year and pick from that Test squad. Aim for 60,000+.',
      rule: 'atleast', source: 'spin', wildcards: true
    },
    // The Daily (js/daily.js): 4000+ rules on a draft everyone shares that day. No wildcards, no Legends Pick.
    daily: {
      id: 'daily', event: 'daily_1000_plays', name: 'Daily', short: 'Daily',
      blurb: 'Today\u2019s themed draft. Get your Test XI to the target.',
      rule: 'atleast', source: 'roll', wildcards: false
    },
    // World Cup 200+ (4 Oct 2026): hidden until World Cup mode is launched (CastAccount.wcLive), signed-in players only
    wc: {
      id: 'wc', event: 'world_cup_200_plays', dataset: 'wc',
      name: 'World Cup ' + T.DATASETS.wc.target + '+', short: 'World Cup ' + T.DATASETS.wc.target + '+',
      blurb: 'Roll 3, pick 1 from Test players since 1980 and the greats before them. Get your XI to ' + T.DATASETS.wc.target + ' Test runs or more.',
      rule: 'atleast', source: 'roll', wildcards: true
    },
    nrlw: {
      id: 'nrlw', event: 'nrlw_plays', dataset: 'nrlw',
      name: 'Women\u2019s Tests ' + T.DATASETS.nrlw.target + '+', short: 'Women\u2019s Tests ' + T.DATASETS.nrlw.target + '+',
      blurb: 'Roll 3, pick 1 from every women\u2019s Test player. Get your XI to ' + T.DATASETS.nrlw.target + ' Test runs or more.',
      rule: 'atleast', source: 'roll', wildcards: true
    }
  };

  /* Offer weighting. Offers are random, but a player's chance of turning up
     scales with (runs + OFFER_WEIGHT_BASE). With a flat random draw most of the
     pack is low scorers (median 10) and 1000 is out of reach even with perfect
     knowledge. Raise the base to make the game harder, lower it to make it easier. */
  T.OFFER_WEIGHT_BASE = 40; // AFL default; each pack sets its own in T.DATASETS (tuned with tools/simulate.py)
  // First offer of a game shows a big run scorer (top 5% of the pack) this often: false hope
  T.FIRST_STAR_CHANCE = 0.7;
  T.OFFER_SIZE = 3;
  T.IL_NATURAL = 0.5; // World Cup 200+: games with a free World Legend (T.newGame)
  // A player's first World Cup game always has a free World Legend (9 Oct 2026, the owner), marked on this device for their
  // account once he has been shown (a game left before he came keeps the promise for the next one)
  function ilFirstKey() { var u = window.CastAccount && window.CastAccount.uid ? window.CastAccount.uid() : ''; return 'wc_il_first' + (u ? '_' + u : ''); }
  T.ilFirstSeen = function () { try { return !!localStorage.getItem(ilFirstKey()); } catch (e) { return true; } };
  T.ilFirstDone = function () { try { localStorage.setItem(ilFirstKey(), '1'); } catch (e) { /* storage blocked */ } };

  /* 4000+ plays harder than every other mode, for good (the owner's call on launch night, 27 Sep 2026: too many 1000s
     in the first hour). Rarer Legends and Hall of Fame Picks and lifelines, and offers that favour big run scorers less.
     The Daily, Team Spin, NRLW and Exactly 4000 keep the normal settings above. firstStar is the first offer's big
     run scorer, kept at the normal setting. */
  /* 25000 RUNS' settings (12 Oct 2026, the owner: "the harder the better ... harder at the start"), kept for 60000 RUNS:
     a weight of 900 for 60,000+, against the pack's own 300 (the simulator: ~/cast-dev/private-notes) */
  T.HARD = { weight: 900, legends: 0.06, immortal: 0.02, lifeline: 0.08, firstStar: 0.7 };
  /* One Legend per team (12 Oct 2026, the owner's call): AFL Legends carry whole careers (Lockett's 1,360), so stacked
     they bought 4000 too easily. Once the XI has one, no Legends Pick is dealt and no Key or Legend Pick can be used */
  T.hasLegend = function () { return !!S && S.slots.some(function (s) { return s.player && s.player.tier; }); };
  T.HARD_ON = true; // tools/simulate_engine.js switches it off to compare with the normal settings
  T.isHard = function (mode) { return T.HARD_ON && !!mode && mode.id === 'plus' && T.DATASET === 'nrl'; };

  var S = null;

  T.state = function () { return S; };
  // Quick Draft (the owner's challenges) searches ahead in the real engine: copy the game, and put a copy back in place
  // (in place, so T.state() stays the same object for the app's guards)
  function copyState(x) {
    return Object.assign({}, x, {
      slots: x.slots.map(function (s) { return Object.assign({}, s); }), used: Object.assign({}, x.used), revealed: {},
      wildcards: Object.assign({}, x.wildcards), history: x.history.slice(),
      offer: x.offer ? Object.assign({}, x.offer, { players: x.offer.players.slice() }) : null
    });
  }
  T.snapshot = function () { return copyState(S); };
  T.restore = function (x) { var c = copyState(x); Object.keys(S).forEach(function (k) { delete S[k]; }); Object.assign(S, c); };
  // A draft brought back from this phone (js/app.js, Save the draft in progress) becomes the game in play
  T.adopt = function (x) { S = x; return S; };

  /* Seeded draws: every game is dealt from a seed (S.seed), so a friend can be challenged to the same draft. Each draw
     has its own stream (the first offer, the Legends Pick, each spin), and offers are chosen by weighted random keys per
     player, so two players with the same open spots see the same cards. Without a seed it is plain Math.random. */
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
  // A number in (0, 1) fixed for this seed, draw and player
  function keyU(tag, id) { var u = mulberry32(hash32(S.seed + '|' + tag + '|' + id))(); return u > 0 ? u : 1e-12; }
  T.newSeed = function () {
    var a = new Uint32Array(2);
    try { (window.crypto || window.msCrypto).getRandomValues(a); } catch (e) { a[0] = Math.random() * 4294967296; a[1] = Math.random() * 4294967296; }
    var s = (a[0].toString(36) + a[1].toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 12) || 'seed' + Date.now().toString(36);
    var P = window.CAST_PROMO;
    return P ? P.mark(P.clean(s)) : s; // a game dealt in a promo carries its mark (js/cast-promo.js)
  };

  // opts.seed: play this exact draft (a challenge); otherwise a fresh seed
  T.newGame = function (modeId, opts) {
    var mode = T.MODES[modeId] || T.MODES.plus;
    S = {
      mode: mode,
      slots: T.SLOTS.map(function (code) { return { code: code, player: null }; }),
      used: {},          // id -> true for players in the XI
      offer: null,       // { kind: 'roll', players: [] } or { kind: 'spin', year, club, players: [] }
      revealed: {},      // id -> true when Reveal Runs showed the runs
      wildcards: mode.wildcards && !mode.paidOnly ? { reroll: 1, scout: 1, tweak: 1 } : { reroll: 0, scout: 0, tweak: 0 },
      paidUsed: {},      // Hard Mode: the paid wildcards used this game (one of each)
      tweakMode: false,
      spinPos: null,     // Team Spin: position chosen before the spin
      spinSlot: null,    // Team Spin: exact field spot tapped, if any
      picks: 0,
      finished: false,
      awaitingLock: false,
      history: [],
      seed: (opts && opts.seed) || T.newSeed(), offerNo: 0, spinNo: 0,
      challenge: !!(opts && opts.challenge), // playing a friend's challenge: no Vault keys
      daily: (opts && opts.daily) || null    // a Daily go: { date, n, go }
    };
    // Legends Pick or the rarer Hall of Fame Pick: 4000+ only, at most one a game,
    // on a random offer after the first few. Local testing: ?pack=legends or ?pack=immortal forces it first.
    S.special = null; S.specialAt = 0; S.specialDone = false; S.lifelineRoll = null; S.lifelineUsed = false;
    S.luckExp = 0; S.luckGot = 0; // the luck of the draw, see noteLuck()
    S.hard = T.isHard(mode); // 4000+ only (T.HARD)
    // Promos (js/cast-promo.js: the Dally M Team of the Year, the 2026 Premiers): 60,000+ and Exactly 60,000 games dealt
    // during one (the seed carries its mark, so a friend's challenge deals the same after it ends). Never the Daily, the
    // same for everyone. S.promoDef: the promo the seed was dealt in
    S.promoDef = window.CAST_PROMO && window.CAST_PROMO.of ? window.CAST_PROMO.of(S.seed) : null;
    S.promo = !!(S.promoDef && (mode.id === 'plus' || mode.id === 'exact' || mode.id === 'nrlw') && !S.daily);
    if (mode.id === 'plus' && T.DATASET === 'nrl' && T.LEGENDS && T.LEGENDS.length) {
      var force = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && (location.search.match(/[?&]pack=(legends|immortal)/) || [])[1];
      var g = T.stream('game'), r = g(), odds = S.hard ? T.HARD : T.LEGEND_ODDS || {};
      S.special = force || (r < (odds.immortal || 0) ? 'immortal' : r < (odds.immortal || 0) + (odds.legends || 0) ? 'legends' : null);
      S.specialAt = force ? 0 : 2 + Math.floor(g() * 8); // after 2 to 9 picks
    }
    // World Legends (World Cup 200+, 8 Oct 2026, the owner's calls): now and then a free one takes a card's place
    // in an offer after 2 to 9 picks (never a boosted one), at most one a game; the rest come with a Pick (T.useIL).
    // Seeded with the draft. S.ilegUsed: World Legend Picks used (d.ileg)
    S.il = null; S.ilegUsed = 0;
    if (mode.id === 'wc' && T.DATASET === 'wc' && T.WC_IL.length && !S.daily) {
      var ig = T.stream('ilegend');
      // the first game's is promised (T.ilFirstSeen), never in a friend's challenge, which deals what the friend had
      if (ig() < T.IL_NATURAL || (!S.challenge && !T.ilFirstSeen())) S.il = { at: 2 + Math.floor(ig() * 8), shown: null };
    }
    // The target is set per game: the pack's own (60,000), or a themed Daily's (js/tests-daily.js, e.g. 46,250)
    T.TARGET = (S.daily && S.daily.target) || (T.DATASETS[T.DATASET] || {}).target || T.TARGET;
    return S;
  };

  /* A themed Daily's club (js/daily.js, e.g. Knights Day): the XI needs at least one player who has played for that
     club (any season from 1998, so Joseph Tapine counts for the Knights). Until the XI has one, every offer holds one. */
  // (T.playedFor with no year, in js/data.js)
  T.dailyClub = function () { return (S && S.daily && S.daily.club) || null; };
  T.hasDailyClub = function () {
    var club = T.dailyClub();
    return !club || S.slots.some(function (s) { return s.player && T.playedFor(s.player, club); });
  };

  // Lifeline: in 4000+, a player with no real chance left may get the game's Legends or Hall of Fame Pick straight away
  // (if they have not had one yet). No real chance: more than LIFELINE_PER runs needed from each of their last
  // LIFELINE_SLOTS or fewer spots, a number only the biggest Test run scorers reach.
  // Not every time: one roll per game (LIFELINE_CHANCE) the first time they fall that far behind. A pick they were
  // already due that game arrives straight away instead.
  T.LIFELINE_PER = 5300; // 60000 RUNS: Test runs, near the top of the Test list (1000TRIES' 110 tries, scaled)
  T.LIFELINE_SLOTS = 5;
  T.LIFELINE_CHANCE = 1 / 3;
  T.LIFELINE_IMMORTAL = 0; // 60000 RUNS has one group of Legends, as 25000 RUNS (the owner, 12 Oct 2026), so a lifeline is always a Legends Pick
  function lifeline() {
    if (!S.mode || S.mode.id !== 'plus' || T.DATASET !== 'nrl' || !T.LEGENDS || !T.LEGENDS.length || S.specialDone) return false;
    var left = S.slots.length - T.filledCount();
    if (!(left >= 1 && left <= T.LIFELINE_SLOTS && (T.TARGET - T.total()) / left > T.LIFELINE_PER)) return false;
    if (S.special) return true;
    if (S.lifelineRoll == null) S.lifelineRoll = T.stream('lifeline')() < (S.hard ? T.HARD.lifeline : T.LIFELINE_CHANCE);
    return S.lifelineRoll;
  }

  // The three greats offered by a Legends Pick or an Hall of Fame Pick (kind: the game's own, S.special, unless given), if
  // enough fit your open spots
  function specialOffer(tag, kind) {
    var imm = (kind || S.special) === 'immortal';
    var list = T.LEGENDS.filter(function (p) {
      // Two separate pools: the Legends Pick never deals an Immortal, the Hall of Fame Pick never deals a Legend
      return (imm ? T.isImmortal(p) : T.isLegend(p)) && !S.used[p.id] && T.fitsEmpty(p);
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

  // Distinct empty slot codes this player can go into
  T.openCodesFor = function (p) {
    var empty = T.emptyCodes();
    var seen = {};
    var codes = T.positionsOf(p).filter(function (c) {
      if (!empty[c] || seen[c]) return false;
      seen[c] = true;
      return true;
    });
    // A spot running out of players (25000 RUNS, 15 Oct 2026: a themed day can have only 3 or 4 keepers, and a keeper who bats
    // could go into the top six and leave the gloves with nobody): when the players left who can fill it are no more
    // than its open spots, someone who can fill it must go there
    if (codes.length > 1) {
      var open = function (c) { return S.slots.filter(function (x) { return !x.player && x.code === c; }).length; };
      var scarce = codes.filter(function (c) { return T.supplyFor(c, p) <= open(c); });
      if (scarce.length) return scarce.slice(0, 1);
    }
    return codes;
  };
  // How many unpicked players in today's pool (this one included) could still fill an open spot of this code
  T.supplyFor = function (code, me) {
    return T.players.filter(function (q) { return (q === me || !S.used[q.id]) && T.inDailyPool(q) && T.positionsOf(q).indexOf(code) !== -1; }).length;
  };

  T.eligible = function () {
    // World Cup 200+: World Legends never come in a normal offer (only the free one, or with a Pick)
    var noIL = T.DATASET === 'wc';
    return T.players.filter(function (p) { return !S.used[p.id] && T.fitsEmpty(p) && T.inDailyPool(p) && !(noIL && p.il); });
  };
  /* A themed Daily's own pool (js/cast-daily.js 'only', e.g. Grand Final week): only players who were at one of those clubs
     in one of those seasons ({ roosters: [2002, 2013], knights: [2001] }; an empty list is any season since 1998).
     An era day ('years': [2000, 2009]) is anyone who played at any club in those seasons. */
  T.inDailyPool = function (p) {
    // A World Cup match day: a Test for one of the day's sides (js/data.js T.nationsOf)
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

  // A pack can make very low scorers rarer (T.LOW_CUT / T.LOW_FACTOR, NRLW only) and caps them at one per offer
  function weightOf(p) {
    var w = p.tries_1998_plus + (S && S.hard ? T.HARD.weight : T.OFFER_WEIGHT_BASE);
    return T.LOW_CUT && p.tries_1998_plus < T.LOW_CUT ? w * T.LOW_FACTOR : w;
  }
  function isLow(p) { return T.LOW_CUT && p.tries_1998_plus < T.LOW_CUT; }

  // Seeded: each player's key is u^(1/weight) (log(u) / weight here), the same weighted odds as the draw below, but a
  // player's key stays the same whoever else is in the pool, so the same seed deals the same cards
  function seededSample(pool, k, already, tag) {
    var lowTaken = (already || []).some(isLow), out = [];
    var ranked = pool.map(function (p) { return [p, Math.log(keyU(tag, p.id)) / weightOf(p)]; }).sort(function (a, b) { return b[1] - a[1]; });
    var highs = ranked.filter(function (x) { return !isLow(x[0]); }).length;
    for (var i = 0; i < ranked.length && out.length < k; i++) {
      var p = ranked[i][0];
      if (isLow(p) && lowTaken && highs > 0) continue; // no second low scorer in an offer (unless nobody else is left)
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
        // no second low scorer in this offer (unless nobody else is left)
        var rest = items.filter(function (q) { return !isLow(q); });
        if (rest.length) items = rest;
      }
    }
    return out;
  }

  // Promos: 'medal', 'toty', 'prem' or '' for a player in a promo game (js/render.js: Dally M platinum, or a premier in
  // his club's colours with the silver edge), its look (the card's words and the medal or trophy after the name), the
  // promo's kind, and its trophy for finding one
  T.PROMO_CHANCE = 0.05;
  T.promoTier = function (p) { return S && S.promo && p && S.promoDef ? S.promoDef.tier(p.name, true) : ''; };
  T.promoLook = function (p) { return S && S.promo && p && S.promoDef ? S.promoDef.look(p.name, true) : null; };
  T.promoKind = function () { return S && S.promo && S.promoDef ? S.promoDef.kind : ''; };
  T.promoTrophy = function () { return T.promoKind() === 'prem' ? 'prem26' : 'toty'; };

  /* Stronger wildcards (2 Oct 2026, the owner's call), toned down 3 Oct (2 better players every time was too easy to farm):
     Some of the time (T.BOOST_CHANCE), a Reroll's new offer (Team Spin: the Respin's squad), and the first offer after
     Remove Player, hold T.BOOST_N player with more runs than the best one rerolled (or the one removed), when one fits
     your open spots, and the other cards don't beat him; the rest of the time it's a plain offer. The roll is seeded, so
     a friend's challenge rolls the same. 60,000+ and Team Spin; not Exactly 60,000 (more runs isn't better there)
     or Quick Draft (it plans the plain draws). S.boost waits for the next offer. Boosted offers stay out of the luck of
     the draw (a wildcard isn't luck) */
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
    // A Legend Key (T.useLegendKey): this offer is its Legends Pick, beside the game's own (which still comes when due)
    if (S.keyPick) {
      S.keyPick = false;
      if (T.hasLegend()) S.keysUsed = Math.max(0, (S.keysUsed || 1) - 1); // never a second Legend (the Legend Pick waits for a key, so this is a guard)
      var keyed = specialOffer(tag + 'k', 'legends');
      if (keyed.length && !T.hasLegend()) { S.offer = { kind: 'roll', special: 'legends', key: true, players: keyed }; S.revealed = {}; return S.offer; }
    }
    var boost = S.boost; S.boost = null;
    var rescue = lifeline();
    if (rescue && !S.special) S.special = rng() < T.LIFELINE_IMMORTAL ? 'immortal' : 'legends';
    if (S.special && !S.specialDone && !T.hasLegend() && (rescue || S.picks >= S.specialAt)) {
      var greats = specialOffer(tag + 'g');
      // A lifeline with none of that kind fitting the open spots runs the other kind
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
      // The other cards come from below the bar (when enough are left), so the wildcard gives one better, not more
      var below = pool.filter(function (p) { return p.tries_1998_plus < boost.min; });
      if (below.length < T.OFFER_SIZE - lift.length) below = pool.filter(function (p) { return lift.indexOf(p) < 0; });
      players = weightedSample(below, T.OFFER_SIZE - lift.length, lift, tag);
      lift.forEach(function (p) { players.splice(Math.floor(rng() * (players.length + 1)), 0, p); }); // any cards, so their spots give nothing away
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
      players.splice(Math.floor(rng() * (players.length + 1)), 0, star); // any card, so its spot gives nothing away
    } else {
      players = weightedSample(pool, T.OFFER_SIZE, null, tag);
    }
    // Themed Daily: no player from the day's club in the XI yet, and none on these cards: one takes a card's place
    // (never the first offer's big run scorer), chosen the same way for everyone with the same draft
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
    // Promos: about 1 offer in 20 swaps a card for a promo player (Team of the Year, or a premier) who fits an open spot
    // (the owner's call: a little more often, not a lot), the same way for everyone with the same draft. Runs never change
    if (S.promo && !first && !players.some(function (p) { return T.promoTier(p); })) {
      var pr = T.stream(tag + 'pm');
      if (pr() < T.PROMO_CHANCE) {
        var toty = pool.filter(function (p) { return T.promoTier(p) && players.indexOf(p) < 0; });
        if (toty.length) players[Math.floor(pr() * players.length)] = toty[Math.floor(pr() * toty.length)];
      }
    }
    if (!first) noteLuck(pool, players);
    // The free World Legend (S.il, set at the deal): once his offer comes he takes a card's place (js/app.js
    // shows him with the World Legend reveal first, S.offer.il). None fitting the open spots: the next offer
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

  /* The luck of the draw, shown on the results screen and on leaderboard team sheets: the runs on every offer
     against what an average offer from the same players would hold. Legends and Hall of Fame Picks and the first offer
     (its big run scorer is there by design) are left out; rerolls count. Team Spin has no offers, so no luck. */
  function noteLuck(pool, players) {
    var tw = 0, tt = 0;
    for (var i = 0; i < pool.length; i++) { var w = weightOf(pool[i]); tw += w; tt += w * pool[i].tries_1998_plus; }
    if (!tw) return;
    S.luckExp += players.length * tt / tw;
    S.luckGot += players.reduce(function (sum, p) { return sum + p.tries_1998_plus; }, 0);
  }
  // Percent above (or below) an average draw, or null when there is nothing to go on
  T.luckPct = function () {
    return S && S.luckExp >= 20 ? Math.max(-99, Math.min(999, Math.round(100 * (S.luckGot / S.luckExp - 1)))) : null;
  };
  // Wildcards played this game (a Remove Player whose pick came straight back still counts)
  T.wildcardsUsed = function () {
    if (!S || !S.mode.wildcards) return null;
    var st = S.wcStart || (S.mode.paidOnly ? { reroll: 0, scout: 0, tweak: 0 } : { reroll: 1 + (S.profileRerolls || 0), scout: 1, tweak: 1 }); // wcStart: the CAST Pass tiers (app.js)
    return Math.max(0, st.reroll + (S.bonusRerolls || 0) + (S.boughtRerolls || 0) - S.wildcards.reroll) + Math.max(0, st.scout + (S.boughtScouts || 0) - S.wildcards.scout) + Math.max(0, st.tweak + (S.boughtTweaks || 0) - S.wildcards.tweak);
  };

  /* The Vault (CAST Pass): a Legend Key makes the offer a Legends Pick. 4000+ only, while a Legend fits an open spot and a
     plain offer is showing. Since 8 Oct 2026 (the owner: "I would like to use my free cast pass legend on top of the free
     one I got by random chance OR buy another ... shouldn't cut off that funnel") it works after the game's free Legends
     or Hall of Fame Pick, and again with another key, and a key used first never takes the game's own pick away (S.keyPick:
     the next offer is the key's Legends Pick). S.keysUsed counts them (d.lks: each adds a Legend on the boards).
     T.legendKeyRoom: a Legend fits an open spot; T.legendKeyFits: and the offer on screen is a plain one to swap */
  T.legendKeyRoom = function () {
    return !!S && S.mode.id === 'plus' && T.DATASET === 'nrl' && !S.finished && !S.challenge && !!T.LEGENDS && !T.hasLegend() &&
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

  /* The GOAT item (the Shop, $9.99; 1000TRIES only since 12 Oct 2026, T.GOAT_ITEM): the GOAT as the next pick. 4000+ and Exactly 4000 (the roll modes),
     once a game, never in a Daily or a friend's challenge, and only while he isn't in the XI and fits an open spot.
     Using it swaps the offer for him alone, his runs showing */
  T.goatPlayer = function () { return (T.players || []).concat(T.LEGENDS || []).filter(T.isGoat)[0] || null; };
  T.GOAT_ITEM = false; // the GOAT item is 1000TRIES only (12 Oct 2026, the owner)
  T.goatFits = function () {
    if (!T.GOAT_ITEM) return false;
    var g = T.goatPlayer();
    return !!S && !!g && T.DATASET === 'nrl' && (S.mode.id === 'plus' || S.mode.id === 'exact') && !S.finished && !S.goatUsed && !S.challenge && !S.daily &&
      !(S.offer && (S.offer.key || S.offer.special)) && !S.used[g.id] && !T.hasLegend() && !S.keyPick && T.fitsEmpty(g); // never over a Legends Pick, and he is the XI's one Legend
  };
  T.useGoat = function () {
    if (!T.goatFits()) return false;
    var g = T.goatPlayer();
    S.goatUsed = true;
    S.offer = { kind: 'roll', goat: true, players: [g] };
    S.revealed = {}; S.revealed[g.id] = true;
    return true;
  };

  /* The Hall of Fame Pick (bought, shared with 27-0; 2 Oct 2026, the owner's call; the account side is js/cast-account.js
     pickState, pickBuy and pickUse): the offer in front of you becomes three Hall of Famers who fit your open spots (Team Spin:
     the position you locked in), with their career premiership runs. 4000+, Exactly 4000 and Team Spin, never NRLW, the
     Daily or a friend's challenge, and as many as you have in one 13 (the owner: they paid for it). Not over a Legends,
     Hall of Famer or GOAT offer. The Pick is only taken when you choose one (js/app.js place), and Keep My Offer puts the
     offer you had back. S.immUsed counts them for the leaderboards (d.imm) */
  T.IMM_MODES = ['plus', 'exact', 'spin'];
  function immPool() {
    var spot = S.mode.source === 'spin' ? S.spinPos : null;
    return (T.LEGENDS || []).filter(function (p) {
      return T.isLegend(p) && !S.used[p.id] && (spot ? T.openCodesFor(p).indexOf(spot) !== -1 : T.fitsEmpty(p));
    });
  }
  T.immMode = function () { return !!S && T.DATASET === 'nrl' && T.IMM_MODES.indexOf(S.mode.id) !== -1 && !S.challenge && !S.daily; };
  T.immFits = function () {
    return T.immMode() && !S.finished && !S.tweakMode && !S.subMode && !!S.offer && S.offer.players.length > 0 && !T.hasLegend() && !S.keyPick && // a Key's Legends Pick is coming: that's the one Legend
      !S.offer.goat && !S.offer.special && immPool().length > 0;
  };
  T.useImm = function () {
    if (!T.immFits()) return false;
    var list = immPool(), out = [];
    while (out.length < T.OFFER_SIZE && list.length) out.push(list.splice(Math.floor(Math.random() * list.length), 1)[0]);
    S.offer = { kind: 'roll', special: 'immortal', paid: true, players: out, prev: S.offer };
    return true;
  };
  /* The World Legend Pick (bought, one balance with 27-0; 8 Oct 2026, the owner's calls; the account side is
     js/cast-account.js pickState, pickBuy and pickUse): the offer in front of you becomes three World Legends who
     fit your open spots, from three nations when it can, with their Test runs. World Cup 200+ only, never a friend's
     challenge, and as many as you have in one 13. Taken only when you choose one (js/app.js place), and Keep My Offer
     puts the offer you had back. S.ilegUsed counts them for the leaderboards (d.ileg) */
  function ilPool() {
    // the free one on screen stays free: never one of the three you pay for (the review, 8 Oct 2026)
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

  // Place a player. code is optional when only one open slot type fits.
  // slotIdx (optional) is the exact spot clicked on the field.
  /* The club a themed Daily shows on a player's card and in their slot: their latest club in the day's pool (on Sydney
     Clubs day Dallin Watene-Zelezniak is a Panther, not a Warrior), else the club they last played for */
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
    // Perfect Read (a trophy, js/app.js): was this the biggest run scorer on offer who could go in the 13? Ties count
    var offer = (S.offer && S.offer.players) || [];
    S.slots[idx].top = offer.indexOf(p) >= 0 && offer.every(function (o) { return o === p || S.used[o.id] || !T.fitsEmpty(o) || o.tries_1998_plus <= p.tries_1998_plus; });
    S.slots[idx].player = p;
    // Team Spin: remember the club this pick was spun from, so it keeps those colours
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

  // Tweak: pull a picked player out, reopen the slot, return them to the pool
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

  /* World Cup 200+ trophies (11 Oct 2026, the owner's picks; js/app.js unlocks them as a game finishes). A player's nation
     is his primary side, England and Great Britain counting as one. Only World Legend comes before the XI is full */
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

  // null while undecided; { win, total, target, diff, reason } once decided
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
    // A themed Daily is won with its own target and its club's player ('won'); the target without the club is 'noclub'
    var themed = !!(S.daily && (S.daily.target || S.daily.club));
    if (total >= T.TARGET && !T.hasDailyClub()) return { win: false, total: total, target: T.TARGET, diff: total - T.TARGET, reason: 'noclub' };
    if (total >= T.TARGET) return { win: true, total: total, target: T.TARGET, diff: total - T.TARGET, reason: themed ? 'won' : 'hit' };
    if (!force && S.wildcards.tweak > 0) return null; // still has a Tweak to play
    return { win: false, total: total, target: T.TARGET, diff: total - T.TARGET, reason: 'under' };
  };
})(window.T = window.T || {});
