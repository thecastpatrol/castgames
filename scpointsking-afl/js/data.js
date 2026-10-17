/* SC POINTS KING: AFL data layer (17 Oct 2026, the AFL twin of SC POINTS KING): the player-season pack, club maps, the
   starting 18 in AFL SC positions. Each card is one AFL player's season: his club that year, his SC position(s) that year
   and his SC points for the season, every season with at least one game (the years: data/seasons.json). */
(function (T) {
  'use strict';

  /* SC POINTS KING: AFL (the owner, 17 Oct 2026): the high-score chase of SC POINTS KING with AFL seasons. The biggest SC
     total wins the boards and each board's #1 wears the crown. No target number in the main mode (the Daily keeps its own) */
  T.GAME_NAME = 'SC POINTS KING: AFL';
  T.GAME_SLUG = 'scpointsking-afl'; // its address on CAST Games: castgames.com.au/scpointsking-afl
  T.TARGET = 0;

  // The over/under game would be a separate page on CAST Games; this home shows no card for it
  T.OU_SEPARATE = true;

  /* The starting 18 in AFL SC positions (the coordinator's default, 17 Oct 2026): six defenders, five midfielders, a ruck
     and six forwards. A season fills one of the SC positions he had that year (a dual position season, MID/FWD, either).
     The codes are what the games save and the server checks (lib/checkscafl.js SLOTS), so they never change */
  T.SLOTS = ['DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'RUC', 'FWD', 'FWD', 'FWD', 'FWD', 'FWD', 'FWD'];
  /* The GOAT moment's headline (js/cast-celebrate.js), by the GOAT's player id, as SC POINTS KING's "IT'S TURBO TIME": The
     Bont, Marcus Bontempelli. A new #1 season by someone else gets the plain moment until his own line is added here */
  T.GOAT_HEADLINES = { 'marcus-bontempelli': 'IT\u2019S BONT TIME' }; // Marcus Bontempelli's 2023, the #1 AFL SC season
  T.goatHeadline = function (p) { return (p && T.GOAT_HEADLINES[p.pid]) || ''; };
  T.POS_NAMES = { DEF: 'Defender', MID: 'Midfielder', RUC: 'Ruck', FWD: 'Forward' };
  T.POS_SHORT = { DEF: 'DEF', MID: 'MID', RUC: 'RUC', FWD: 'FWD' };
  T.POS_ORDER = ['DEF', 'MID', 'RUC', 'FWD'];
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  T.FLEX_OF = [];

  T.seasonLabel = function (y) { return String(y || '?'); };
  // The seasons' span (data/seasons.json): set from the data as it loads (T.expandPack), these until then
  T.FIRST_YEAR = 2007;
  T.LAST_YEAR = 2026;

  // The 18 AFL clubs, by the AFL Tables codes 4000 GOALS uses (Kangaroos counted as North Melbourne); names, abbreviations
  // and colours as 4000 GOALS
  T.CLUBS = {
    ad: { name: 'Adelaide Crows', from: 1991, to: 2026 },
    bl: { name: 'Brisbane Lions', from: 1997, to: 2026 },
    ca: { name: 'Carlton', from: 1897, to: 2026 },
    cw: { name: 'Collingwood', from: 1897, to: 2026 },
    es: { name: 'Essendon', from: 1897, to: 2026 },
    fr: { name: 'Fremantle', from: 1995, to: 2026 },
    ge: { name: 'Geelong Cats', from: 1897, to: 2026 },
    gc: { name: 'Gold Coast Suns', from: 2011, to: 2026 },
    gw: { name: 'GWS Giants', from: 2012, to: 2026 },
    hw: { name: 'Hawthorn', from: 1925, to: 2026 },
    me: { name: 'Melbourne', from: 1897, to: 2026 },
    nm: { name: 'North Melbourne', from: 1925, to: 2026 },
    pa: { name: 'Port Adelaide', from: 1997, to: 2026 },
    ri: { name: 'Richmond', from: 1908, to: 2026 },
    sk: { name: 'St Kilda', from: 1897, to: 2026 },
    sy: { name: 'Sydney Swans', from: 1982, to: 2026 },
    wc: { name: 'West Coast Eagles', from: 1987, to: 2026 },
    wb: { name: 'Western Bulldogs', from: 1925, to: 2026 }
  };
  T.TEST_SIDES = {};
  T.CLUB_NICK = { ad: 'Crows', bl: 'Lions', ca: 'Blues', cw: 'Magpies', es: 'Bombers', fr: 'Dockers', ge: 'Cats', gc: 'Suns', gw: 'Giants',
    hw: 'Hawks', me: 'Demons', nm: 'Kangaroos', pa: 'Power', ri: 'Tigers', sk: 'Saints', sy: 'Swans', wc: 'Eagles', wb: 'Bulldogs' };
  T.CLUB_ABBR = { ad: 'ADE', bl: 'BRI', ca: 'CAR', cw: 'COL', es: 'ESS', fr: 'FRE', ge: 'GEE', gc: 'GCS', gw: 'GWS', hw: 'HAW', me: 'MEL',
    nm: 'NTH', pa: 'PTA', ri: 'RIC', sk: 'STK', sy: 'SYD', wc: 'WCE', wb: 'WBD' };
  T.CLUB_COLORS = { ad: '#002B5C', bl: '#7C003E', ca: '#0E1E2D', cw: '#000000', es: '#CC2031', fr: '#2A1A54', ge: '#1C3C63', gc: '#D93E39',
    gw: '#F15C22', hw: '#4D2004', me: '#0F1131', nm: '#1A3B8E', pa: '#008AAB', ri: '#000000', sk: '#ED0F05', sy: '#ED171F',
    wc: '#062EE2', wb: '#014896' };
  T.CLUB_SECONDARY = { ad: '#E21937', bl: '#FDBE57', ca: '#FFFFFF', cw: '#FFFFFF', es: '#000000', fr: '#FFFFFF', ge: '#FFFFFF', gc: '#F6BD00',
    gw: '#4A4F55', hw: '#FBBF15', me: '#CC2031', nm: '#FFFFFF', pa: '#000000', ri: '#FED102', sk: '#000000', sy: '#FFFFFF',
    wc: '#FFD700', wb: '#E21937' };
  T.CLUB_THIRD = {};
  T.clubNameIn = function (slug) { return (T.CLUBS[slug] || {}).name || slug; };

  function textOn(hex) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#111111' : '#FFFFFF';
  }

  // Everything the UI needs to paint a club: strong primary block, accent bar, readable text
  T.club = function (slug) {
    var primary = T.CLUB_COLORS[slug] || '#1a1a2e';
    var secondary = T.CLUB_SECONDARY[slug] || '#FFFFFF';
    var accent = secondary.toLowerCase() === primary.toLowerCase() ? textOn(primary) : secondary;
    return {
      slug: slug,
      name: (T.CLUBS[slug] || {}).name || slug,
      nick: T.CLUB_NICK[slug] || slug,
      abbr: T.CLUB_ABBR[slug] || String(slug).slice(0, 3).toUpperCase(),
      primary: primary,
      secondary: secondary,
      accent: accent,
      third: null,
      text: textOn(primary)
    };
  };

  // A season's SC positions that year (1 or 2)
  T.positionsOf = function (p) { return p.positions_played || []; };
  T.canFill = function (p, code) { return T.positionsOf(p).indexOf(code) !== -1; };

  // A season card belongs to one club and one year: played for club (in that year, when given)
  T.playedFor = function (p, club, year) { return !!club && p.club === club && (year == null || p.year === year); };
  T.lastClub = function (p) { return p.club; };
  T.slotClub = function (slot) { return (slot && slot.club) || (slot && slot.player && slot.player.club); };

  /* Legends (the Legend Key's Legends Pick only, 17 Oct 2026): all-time great AFL SC seasons, each player's best when it
     is big enough (data/seasons.json "legends", set by ~/cast-dev/sc-afl/tools/make_game_files.py). They are seasons
     from the pack, so they also come in normal offers like any other season; a Legend Key's three are their own cards
     (tier 'legend'), saved as "Name YEAR (Legend)" so the server can count them against the keys used. No free
     Legends Pick and no lifeline: there is no target to rescue */
  T.LEGENDS = [];
  T.LEGEND_ODDS = { legends: 0, immortal: 0 };
  T.LEGEND_REPLACES = [];
  T.isImmortal = function () { return false; };
  T.isIntlLegend = function (p) { return !!p && !!p.il; };
  T.WC_IL = [];
  T.markIntlLegends = function () { T.WC_IL = []; return T.WC_IL; };
  T.isLegend = function (p) { return !!p && p.tier === 'legend'; };
  T.isSpecial = function (p) { return !!p && !!p.tier; };
  T.loadLegends = function () { return T.loadDataset('nrl').then(function () { return T.LEGENDS; }); };

  /* The GOAT: the #1 AFL SC season total in the data (the owner's rule for every game: the GOAT is the #1 in the stat,
     data/seasons.json "goat"). A pack season, so he can be dealt like any other, but rarely in free play (js/draft.js
     S.goatOut); the GOAT item brings his own card, his number showing */
  T.GOAT_SRC = null;
  T.GOAT_ID = null;
  T.isGoat = function (p) { return !!p && (p.tier === 'goat' || (!!T.GOAT_ID && p.id === T.GOAT_ID)); };
  T.goatCard = function (src) { return src || null; };

  // The surname on the field tiles: everything after the first name (De Goey, Ugle-Hagan)
  T.surname = function (name) {
    var n = String(name).replace(/\s*\([^)]*\)\s*$/, '').trim(), parts = n.split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  };

  T.fmt = function (n) {
    return Number(n).toLocaleString('en-AU', { useGrouping: false }); // no commas in numbers (the owner, 16 Oct 2026)
  };

  T.players = [];
  T.byId = {};

  // World Cup match days (shared code from 1000TRIES; never on here)
  T.NAT = null;
  T.loadNat = function () { return Promise.reject(new Error('no World Cup here')); };
  T.nationsOf = function () { return []; };

  /* The pack (key 'nrl': the main pack everywhere in the shared code, kept for AFL too). tries_1998_plus holds each card's season SC
     points (the engine's one number field); the second pack slot is never live */
  T.DATASETS = {
    nrl: { file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'Season SC points', who: 'AFL' },
    wc: { file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'SC points', who: 'AFL' },
    nrlw: { live: false, file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'SC points', who: 'AFL' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'SC points';
  T.ERA_LABEL = 'SC Points';

  /* data/seasons.json (compact): clubs, people [[id, name]], rows [[person, year, club, "MID/FWD", SC points, games]],
     legends [row], goat row, tags {row: club} for a name two players share ("Josh Kennedy (Eagles) 2016" on the boards) */
  // One flat string (an id built from two parts is looked up thousands of times an offer)
  function flat(s) { var o = {}; o[s] = 1; return Object.keys(o)[0]; }
  T.expandPack = function (doc) {
    var players = [], byId = {};
    (doc.rows || []).forEach(function (r, i) {
      var who = doc.people[r[0]], club = doc.clubs[r[2]], tag = doc.tags && doc.tags[String(i)];
      var p = { id: flat(who[0] + '-' + r[1]), pid: who[0], name: who[1], year: r[1], club: club, positions_played: String(r[3]).split('/'),
        tries_1998_plus: r[4], games: r[5], record_name: who[1] + (tag ? ' (' + tag + ')' : '') + ' ' + r[1] };
      players.push(p); byId[p.id] = p;
    });
    var legends = (doc.legends || []).map(function (i) {
      var s = players[i], c = {};
      Object.keys(s).forEach(function (k) { c[k] = s[k]; });
      c.id = flat('legend-' + s.id); c.tier = 'legend'; c.record_name = s.record_name + ' (Legend)';
      return c;
    });
    var goat = players[doc.goat] || null;
    // The span of the seasons, from the data (the spin's flashing years and the copy)
    if (players.length) {
      T.FIRST_YEAR = players.reduce(function (m, p) { return Math.min(m, p.year); }, Infinity);
      T.LAST_YEAR = players.reduce(function (m, p) { return Math.max(m, p.year); }, 0);
    }
    return { players: players, byId: byId, legends: legends, goat: goat };
  };
  T.loadDataset = function (name) {
    var d = T.DATASETS[name];
    if (d.pool) return Promise.resolve(d.pool);
    if (d.loading) return d.loading;
    d.loading = fetch(d.file, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(d.file + ' ' + r.status); return r.json(); })
      .then(function (doc) {
        var x = T.expandPack(doc);
        if (name === 'nrl') {
          T.LEGENDS = x.legends;
          if (x.goat) { T.GOAT_SRC = x.goat.id; T.GOAT_ID = x.goat.id; }
        }
        return (d.pool = { players: x.players, byId: x.byId });
      });
    d.loading.catch(function () { d.loading = null; });
    return d.loading;
  };

  // Big seasons (top 5% of the pack) for the first offer. Cached per pack.
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
    return T.loadDataset('nrl').then(function (pool) {
      if (!pool.legendsApplied) {
        T.LEGENDS.forEach(function (p) { pool.byId[p.id] = p; });
        T.GOAT_CARD = null; // the GOAT is a pack season: the item brings his own card
        pool.legendsApplied = true;
      }
      T.useDataset('nrl');
      return pool.players;
    });
  };
})(window.T = window.T || {});
