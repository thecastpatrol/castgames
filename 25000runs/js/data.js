/* Big Bash game data layer (15 Oct 2026, copied from 4000 GOALS): player pack, club maps, slot template.
   BBL runs from Cricsheet's ball-by-ball data (ODC-By: credited on the site), checked against ESPNcricinfo's career totals. */
(function (T) {
  'use strict';

  T.TARGET = 25000; // set by the real-engine simulation before launch

  // The XI in draft order: 6 batters, a keeper, 4 bowlers (the owner, 15 Oct 2026: "Real XI")
  // The over/under mode is a separate game on CAST Games (its own page); this home shows no card for it
  T.OU_SEPARATE = true;

  T.SLOTS = ['B', 'B', 'B', 'B', 'B', 'B', 'K', 'W', 'W', 'W', 'W'];

  T.POS_NAMES = { B: 'Batter', K: 'Keeper', W: 'Bowler' };
  // What the spots and chips show (16 Oct 2026, the owner: W read as wicketkeeper): the fantasy cricket labels. The
  // codes underneath (B, K, W) are what the games save and the server checks, so they never change
  T.POS_SHORT = { B: 'BAT', K: 'WK', W: 'BOWL' };
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };

  // The eight BBL clubs (every season since BBL01, 2011/12). Seasons are named by the year they start
  T.CLUBS = {
    strikers: { name: 'Adelaide Strikers', from: 2011, to: 2025 },
    heat: { name: 'Brisbane Heat', from: 2011, to: 2025 },
    hurricanes: { name: 'Hobart Hurricanes', from: 2011, to: 2025 },
    renegades: { name: 'Melbourne Renegades', from: 2011, to: 2025 },
    stars: { name: 'Melbourne Stars', from: 2011, to: 2025 },
    scorchers: { name: 'Perth Scorchers', from: 2011, to: 2025 },
    sixers: { name: 'Sydney Sixers', from: 2011, to: 2025 },
    thunder: { name: 'Sydney Thunder', from: 2011, to: 2025 }
  };
  T.TEST_SIDES = {};

  // The broadcast abbreviations
  T.CLUB_ABBR = { strikers: 'STR', heat: 'HEA', hurricanes: 'HUR', renegades: 'REN', stars: 'STA', scorchers: 'SCO', sixers: 'SIX', thunder: 'THU' };

  // The clubs' brand colours (16 Oct 2026, checked one by one after the owner: "Hobart and Brisbane Heat look wrong";
  // teamcolorcodes.com's BBL pages). Renegades list only their red, so black is their second, as on their kit
  T.CLUB_COLORS = {
    strikers: '#0084D6', heat: '#27A6B0', hurricanes: '#674398', renegades: '#EE343F', stars: '#8DC64C', scorchers: '#CC5A1E',
    sixers: '#EC2A90', thunder: '#97D700'
  };

  T.CLUB_SECONDARY = {
    strikers: '#C8C8C8', heat: '#FFFFFF', hurricanes: '#C8CACB', renegades: '#111111', stars: '#287246', scorchers: '#403529',
    sixers: '#000000', thunder: '#000000'
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

  // Positions a player can fill: positions_played, falling back to draft_role then position
  T.positionsOf = function (p) {
    if (p._pos) return p._pos;
    var list = (p.positions_played && p.positions_played.length) ? p.positions_played.slice()
      : [p.draft_role || p.position].filter(Boolean);
    p._pos = list;
    return list;
  };

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

  /* Each club's jersey for the Legends and Immortal Pick reveal (8 Oct 2026, the owner: "make the jerseys more accurate"):
     shared with 27-0's Immortal Pick, so the table lives in js/cast-intl.js (CastIntl.JERSEYS) */

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

  /* The GOAT (one Shop item for every CAST draft game, 16 Oct 2026, the owner: "THE GOAT IS UNIVERSAL"): here Chris Lynn.
     T.GOAT_SRC: the player the GOAT item brings. A Legend comes as his own GOAT card (T.goatCard: "Name (GOAT)", tier
     'goat', the server's lib/goat.js), never beside his Legend card. T.GOAT_ID: who always wears the goat */
  T.GOAT_SRC = 'chris-lynn';
  T.GOAT_ID = 'chris-lynn';
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
    var parts = n.split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
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

  // Player packs. BBL is the default (key kept as 'nrl': the main pack everywhere in the code); WBBL has its own players,
  // target and offer weighting (key 'nrlw', the NRLW mode's twin). tries_1998_plus holds each pack's career runs
  T.DATASETS = {
    nrl:  { file: 'data/players.json', target: 25000, weight: 300, label: 'BBL runs', era: 'BBL runs', only: 'BBL runs only', who: 'BBL' },
    // World Cup mode: never on in the Big Bash game (kept so the shared mode code finds it)
    wc: { file: 'data/players.json', target: 200, weight: 4, label: 'runs', era: 'runs', only: 'runs', who: 'Test' },
    nrlw: { live: false, file: 'data/wbbl-players.json', target: 35000, weight: 300, lowCut: 20, lowFactor: 0.3, label: 'WBBL runs', era: 'WBBL runs', only: 'WBBL runs only', who: 'WBBL' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'BBL runs';
  T.ERA_LABEL = 'BBL runs';

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
