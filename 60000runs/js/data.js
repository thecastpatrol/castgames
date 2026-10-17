/* Test cricket game data layer (16 Oct 2026, copied from 25000 RUNS): player pack, nation maps, slot template.
   Test runs, wickets and dismissals from ESPNcricinfo's Statsguru career records; full names from Wikidata. */
(function (T) {
  'use strict';

  T.TARGET = 60000; // set by the real-engine simulation before launch

  // The over/under mode is a separate game on CAST Games (its own page); this home shows no card for it
  T.OU_SEPARATE = true;

  /* The XI in draft order (the same Real XI as 25000 RUNS): 5 batters, an all-rounder at 6, a keeper, 4 bowlers. The
     All-Rounder spot (A, 17 Oct 2026, the owner: one batter's spot becomes it, in both cricket games) takes only a player
     listed as both a batter and a bowler (T.positionsOf): a keeper who bats is not an all-rounder unless he bowls too.
     Until then the XI had 6 batters (T.SLOTS_6): a draft saved on a phone with those spots can't be brought back
     (js/app.js), and the server still takes a game played on them before the change (lib/checkts.js in the 1000TRIES repo) */
  T.SLOTS = ['B', 'B', 'B', 'B', 'B', 'A', 'K', 'W', 'W', 'W', 'W'];
  T.SLOTS_6 = ['B', 'B', 'B', 'B', 'B', 'B', 'K', 'W', 'W', 'W', 'W'];

  // All-Rounder is kept whole (a word joiner after the hyphen: never split across two lines)
  T.POS_NAMES = { B: 'Batter', A: 'All-\u2060Rounder', K: 'Keeper', W: 'Bowler' };
  // What the spots and chips show (the fantasy cricket labels, as 25000 RUNS). The codes underneath (B, A, K, W) are what
  // the games save and the server checks, so they never change
  T.POS_SHORT = { B: 'BAT', A: 'AR', K: 'WK', W: 'BOWL' };
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  // "a Batter", "an All-Rounder"
  T.aPos = function (code) { var n = T.POS_NAMES[code] || code; return (/^[AEIOU]/.test(n) ? 'an ' : 'a ') + n; };

  // The Test nations, each from its first Test (the ICC World XI's one Test in 2005 counts for runs, not as a nation)
  T.CLUBS = {
    aus: { name: 'Australia', from: 1877, to: 2026 },
    eng: { name: 'England', from: 1877, to: 2026 },
    sa: { name: 'South Africa', from: 1889, to: 2026 },
    wi: { name: 'West Indies', from: 1928, to: 2026 },
    nz: { name: 'New Zealand', from: 1930, to: 2026 },
    ind: { name: 'India', from: 1932, to: 2026 },
    pak: { name: 'Pakistan', from: 1952, to: 2026 },
    sl: { name: 'Sri Lanka', from: 1982, to: 2026 },
    zim: { name: 'Zimbabwe', from: 1992, to: 2026 },
    ban: { name: 'Bangladesh', from: 2000, to: 2026 },
    ire: { name: 'Ireland', from: 2018, to: 2026 },
    afg: { name: 'Afghanistan', from: 2018, to: 2026 }
  };
  T.TEST_SIDES = {};

  // The broadcast abbreviations
  T.CLUB_ABBR = { aus: 'AUS', eng: 'ENG', sa: 'SA', wi: 'WI', nz: 'NZ', ind: 'IND', pak: 'PAK', sl: 'SL', zim: 'ZIM', ban: 'BAN', ire: 'IRE', afg: 'AFG' };

  // Each nation's Test cap colours
  T.CLUB_COLORS = {
    aus: '#0B6B3A', eng: '#1B2A5C', sa: '#007A4D', wi: '#7B0041', nz: '#111111', ind: '#0B5FB0', pak: '#01411C', sl: '#0D3B8F',
    zim: '#C8102E', ban: '#006A4E', ire: '#169B62', afg: '#0066B3'
  };

  T.CLUB_SECONDARY = {
    aus: '#FFCD00', eng: '#C8102E', sa: '#FFB81C', wi: '#FFC72C', nz: '#FFFFFF', ind: '#FF9933', pak: '#FFFFFF', sl: '#FFBE29',
    zim: '#006400', ban: '#F42A41', ire: '#FFFFFF', afg: '#D32011'
  };
  T.CLUB_THIRD = {};

  function textOn(hex) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#111111' : '#FFFFFF';
  }

  // Everything the UI needs to paint a club: strong primary block, accent bar, readable text
  T.club = function (slug) {
    var primary = T.CLUB_COLORS[slug] || '#1a1a2e';
    var secondary = T.CLUB_SECONDARY[slug] || '#FFFFFF';
    // Secondary that matches the primary (or is too close to the dark page) falls back to the text colour
    var accent = secondary.toLowerCase() === primary.toLowerCase() ? textOn(primary) : secondary;
    return {
      slug: slug,
      name: (T.CLUBS[slug] || T.TEST_SIDES[slug] || {}).name || slug,
      abbr: T.CLUB_ABBR[slug] || String(slug).slice(0, 3).toUpperCase(),
      primary: primary,
      secondary: secondary,
      accent: accent,
      third: T.CLUB_THIRD[slug] || null, // nations only
      text: textOn(primary)
    };
  };

  // Positions a player can fill: positions_played, falling back to draft_role then position, and the All-Rounder spot (A)
  // for a player listed as both a batter and a bowler (B and W), straight after B so a chooser lists the spots in field order
  T.positionsOf = function (p) {
    if (p._pos) return p._pos;
    var list = (p.positions_played && p.positions_played.length) ? p.positions_played.slice()
      : [p.draft_role || p.position].filter(Boolean);
    if (list.indexOf('B') !== -1 && list.indexOf('W') !== -1 && list.indexOf('A') === -1) list.splice(list.indexOf('B') + 1, 0, 'A');
    p._pos = list;
    return list;
  };
  T.isAllRounder = function (p) { return !!p && T.positionsOf(p).indexOf('A') !== -1; };
  // The roles a card shows: his own (A isn't one: BAT and BOWL already say he is an all-rounder)
  T.rolesOf = function (p) { return T.positionsOf(p).filter(function (c) { return c !== 'A'; }); };

  T.canFill = function (p, code) {
    return T.positionsOf(p).indexOf(code) !== -1;
  };

  // Played for club in that season (Team Spin), or in any season when there is no year (a themed Daily's club)
  T.playedFor = function (p, club, year) {
    return !!club && (p.club_years || []).some(function (cy) {
      return cy.club === club && (year == null || (cy.from <= year && year <= cy.to));
    });
  };

  // Club a player last played for (latest season, then latest start). Drives all club colours.
  T.lastClub = function (p) {
    if (p._last) return p._last;
    if (p.tier) return (p._last = p.primary_club); // Legends and Immortals wear the club they are remembered for
    // World Cup 200+ (5 Oct 2026, the owner's call): the side they play for now, else the one they played most Tests for
    if (p.tests && p.primary_club) return (p._last = p.primary_club);
    var best = null;
    (p.club_years || []).forEach(function (cy) {
      if (!best || cy.to > best.to || (cy.to === best.to && cy.from >= best.from)) best = cy;
    });
    p._last = best ? best.club : p.primary_club;
    return p._last;
  };

  // Club colours for a player sitting in a slot: Team Spin picks keep the club they were
  // spun from (slot.club); a themed Daily shows the club from the day's pool (T.showClub, js/draft.js);
  // every other mode uses the club they last played for.
  T.slotClub = function (slot) {
    return (slot && slot.club) || (T.showClub ? T.showClub(slot.player) : T.lastClub(slot.player));
  };

  /* Each club's kit for the Legends and Immortal Pick reveal: its real current home kit, drawn by js/cast-kits.js from
     js/kits-data.js (16 Oct 2026, the owner: "Don't just assume always that they are a V-shaped jersey design"; the data
     is researched in ~/cast-dev/kits). CastIntl.JERSEYS in js/cast-intl.js is the NRL clubs' only */

  /* Legends and Immortals (4000+ only): the Legends Pick and the rarer Immortal Pick.
     data/legends.json lists them with career premiership goals (NSWRL, ARL, Super League, AFL). None of them
     are in the normal AFL era pool: 'replaces' names the pool players who moved across. */
  T.LEGENDS = [];
  T.LEGEND_ODDS = { legends: 0.25, immortal: 0.08 }; // data/legends.json odds win once loaded
  T.isImmortal = function (p) { return !!p && p.tier === 'immortal'; };
  /* World Legends (World Cup 200+, 8 Oct 2026, the owner's calls; data/wc-legends.json "1000tries", a copy of
     shared/wc-legends.json): greats already in the World Cup pack, with their Test goals. They leave the normal offers
     (js/draft.js T.eligible) and come only as a free one now and then or with a World Legend Pick. "show" is
     the name on his card (Sir Billy Boston) while results keep his own name (record_name); "positions" are the spots
     he plays and "nation" the side he wears (Nigel Vagana: Samoa), the same in both games */
  T.isIntlLegend = function (p) { return !!p && !!p.il; };
  T.WC_IL = [];
  T.markIntlLegends = function (pool, list) {
    T.WC_IL = [];
    (list || []).forEach(function (e) {
      var p = pool && pool.byId[e.id];
      if (!p) return;
      if (e.show && e.show !== p.name) { if (!p.record_name) p.record_name = p.name; p.name = e.show; }
      if (e.positions && e.positions.length) { p.positions_played = e.positions.slice(); p._pos = null; }
      if (e.nation) { p.primary_club = e.nation; p._last = null; }
      p.il = 1;
      T.WC_IL.push(p);
    });
    return T.WC_IL;
  };
  T.isLegend = function (p) { return !!p && p.tier === 'legend'; };
  T.isSpecial = function (p) { return !!p && !!p.tier; };
  T.loadLegends = function () {
    if (T._legends) return T._legends;
    T._legends = fetch('data/legends.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('legends ' + r.status);
      return r.json();
    }).then(function (doc) {
      T.LEGENDS = (doc.players || []).filter(function (p) { return p && p.id && typeof p.tries_1998_plus === 'number'; });
      if (doc.odds) T.LEGEND_ODDS = doc.odds;
      T.LEGEND_REPLACES = doc.replaces || [];
      return T.LEGENDS;
    }, function () { T._legends = null; T.LEGENDS = []; T.LEGEND_REPLACES = []; return []; });
    return T._legends;
  };

  /* The GOAT (one Shop item for every CAST draft game, 16 Oct 2026, the owner: "THE GOAT IS UNIVERSAL"): here Sachin Tendulkar, the #1 Test run scorer (each game's GOAT is its #1, 17 Oct 2026).
     T.GOAT_SRC: the player the GOAT item brings. A Legend comes as his own GOAT card (T.goatCard: "Name (GOAT)", tier
     'goat', the server's lib/goat.js), never beside his Legend card. T.GOAT_ID: who always wears the goat */
  T.GOAT_SRC = 'legend-sachin-tendulkar';
  T.GOAT_ID = 'legend-sachin-tendulkar'; // his Legend card wears the goat too, when a Legends Pick deals him (17 Oct 2026, the owner)
  T.isGoat = function (p) {
    return !!p && (p.tier === 'goat' || (!!T.GOAT_ID && p.id === T.GOAT_ID));
  };
  T.goatCard = function (src) {
    if (!src || !src.tier) return src || null; // a pack player is the GOAT himself (as Alex Johnston in 1000TRIES)
    var c = {};
    Object.keys(src).forEach(function (k) { c[k] = src[k]; });
    c.id = 'goat-' + String(src.id).replace(/^legend-/, ''); c.tier = 'goat';
    c.record_name = String(src.record_name || src.name).replace(/\s*\([^)]*\)$/, '') + ' (GOAT)';
    return c;
  };

  /* The surname on the pitch tiles (10 Oct 2026, the owner: "Bill Williams" for Sonny Bill Williams): a club tag in
     brackets (Ben Jones (Raiders)) and a nickname in quotes go, and the names whose first or last name is two words
     are spelt out (27-0's cardSurname has the same list) */
  var SURNAME_OF = {
    'Sonny Bill Williams': 'Williams', 'Te Maire Martin': 'Martin', "De La Salle Va'a": "Va'a", 'Kalifa Faifai Loa': 'Faifai Loa',
    'Junior Tia Kilifi': 'Tia Kilifi', 'Raymond Tuaimalo Vaega': 'Tuaimalo Vaega', 'Gordon Chan Kum Tong': 'Chan Kum Tong',
    'Loko Jnr Pasifiki Tonga': 'Pasifiki Tonga', 'Tuku Hau Tapuha': 'Hau Tapuha', 'Tevita Pangai Junior': 'Pangai Junior'
  };
  T.surname = function (name) {
    var n = String(name).replace(/\s*\([^)]*\)\s*$/, '').replace(/[\u201C"][^\u201D"]*[\u201D"]\s*/g, '').trim();
    if (SURNAME_OF[n]) return SURNAME_OF[n];
    var parts = n.split(/\s+/), rest = parts.slice(1);
    // middle initials go too (16 Oct 2026): "M. J. K. Smith" read "J. K. Smith" on the tile
    while (rest.length > 1 && /^(?:[A-Z]\.)+$|^[A-Z]$/.test(rest[0])) rest.shift();
    return rest.length ? rest.join(' ') : parts[0];
  };

  T.fmt = function (n) {
    return Number(n).toLocaleString('en-AU', { useGrouping: false }); // no commas in numbers (the owner, 16 Oct 2026)
  };

  T.players = [];
  T.byId = {};

  // World Cup match days (4 Oct 2026): the sides each AFL-era player has played a Test for (data/nations-nrl.json, from
  // tools/build_wc.py), so a match day's Daily can deal only that day's Test players
  T.NAT = null;
  T.loadNat = function () {
    if (T.NAT) return Promise.resolve(T.NAT);
    if (T._natLoading) return T._natLoading;
    T._natLoading = fetch('data/nations-nrl.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('nations ' + r.status);
      return r.json();
    }).then(function (m) { T.NAT = m; return m; }, function (e) { T._natLoading = null; throw e; });
    return T._natLoading;
  };
  T.nationsOf = function (p) { return (T.NAT && p && T.NAT[p.record_name || p.name]) || []; };

  // Player packs. Test runs is the only one (key kept as 'nrl': the main pack everywhere in the code); the women's pack slot,
  // target and offer weighting (key 'nrlw', the NRLW mode's twin). tries_1998_plus holds each pack's career runs
  T.DATASETS = {
    nrl:  { file: 'data/players.json', target: 60000, weight: 300, label: 'Test runs', era: 'Test runs', only: 'Test runs only', who: 'Test' },
    // World Cup mode: never on in the Test cricket game (kept so the shared mode code finds it)
    wc: { file: 'data/players.json', target: 200, weight: 4, label: 'runs', era: 'runs', only: 'runs', who: 'Test' },
    nrlw: { live: false, file: 'data/players.json', target: 60000, weight: 300, label: 'Test runs', era: 'Test runs', only: 'Test runs only', who: 'Test' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'Test runs';
  T.ERA_LABEL = 'Test runs';

  // Only rows with a numeric tries_1998_plus are playable
  T.loadDataset = function (name) {
    var d = T.DATASETS[name];
    if (d.pool) return Promise.resolve(d.pool);
    if (d.loading) return d.loading;
    d.loading = fetch(d.file, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error(d.file + ' ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        var players = rows.filter(function (p) {
          return p && p.id && typeof p.tries_1998_plus === 'number' && isFinite(p.tries_1998_plus);
        });
        var byId = {};
        players.forEach(function (p) {
          byId[p.id] = p;
          // Namesakes are tagged in the data ("Ben Jones (Raiders)") so the leaderboard server can tell them
          // apart: show the plain name, and keep the tagged one as the name results are saved under
          var m = / \([^)]+\)$/.exec(p.name);
          if (m && !p.record_name) { p.record_name = p.name; p.name = p.name.slice(0, m.index); }
        });
        var pool = { players: players, byId: byId };
        return (d.pool = pool);
      });
    d.loading.catch(function () { d.loading = null; });
    return d.loading;
  };

  // Big run scorers (top 5% of a pack) for the first-offer 'false hope'. Cached per pack.
  T.starCut = function () {
    var d = T.DATASETS[T.DATASET];
    if (d.starCut == null) {
      var t = T.players.map(function (p) { return p.tries_1998_plus; }).sort(function (a, b) { return a - b; });
      d.starCut = t.length ? t[Math.floor(t.length * 0.95)] : Infinity;
    }
    return d.starCut;
  };

  // Switch the live pack (call only between games)
  T.useDataset = function (name) {
    var d = T.DATASETS[name];
    if (!d || !d.pool) return false;
    T.DATASET = name;
    T.players = d.pool.players;
    T.byId = d.pool.byId;
    T.TARGET = d.target;
    T.OFFER_WEIGHT_BASE = d.weight;
    T.LOW_CUT = d.lowCut || 0;
    T.LOW_FACTOR = d.lowFactor || 1;
    T.TRY_LABEL = d.label;
    T.ERA_LABEL = d.era;
    return true;
  };

  T.loadPlayers = function () {
    return Promise.all([T.loadDataset('nrl'), T.loadLegends()]).then(function (res) {
      var pool = res[0], gone = {};
      (T.LEGEND_REPLACES || []).forEach(function (id) { gone[id] = true; });
      if (!pool.legendsApplied) {
        pool.players = pool.players.filter(function (p) { return !gone[p.id]; });
        T.LEGENDS.forEach(function (p) { pool.byId[p.id] = p; });
        var gsrc = T.GOAT_SRC && pool.byId[T.GOAT_SRC]; // the GOAT item's card, so a pick or a draft brought back finds him
        T.GOAT_CARD = gsrc && gsrc.tier ? T.goatCard(gsrc) : null;
        if (T.GOAT_CARD) pool.byId[T.GOAT_CARD.id] = T.GOAT_CARD;
        pool.legendsApplied = true;
      }
      T.useDataset('nrl');
      return pool.players;
    });
  };
})(window.T = window.T || {});
