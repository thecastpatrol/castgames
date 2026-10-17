/* SC draft game data layer (17 Oct 2026, from the 1000TRIES engine via 100000 POINTS): the player-season pack, club maps,
   the 13 in SC positions. Each card is one NRL player's season: his club that year, his SC position(s) that year and his
   SC points for the season, 2009 to 2026, every season with at least one game. */
(function (T) {
  'use strict';

  /* SC POINTS KING (the owner, 17 Oct 2026): a high-score chase, not a target game. The biggest SC total wins the boards
     and each board's #1 wears the crown. No target number anywhere in the main mode (the Daily keeps its own targets) */
  T.GAME_NAME = 'SC POINTS KING';
  T.GAME_SLUG = 'scpointsking'; // its address on CAST Games: castgames.com.au/scpointsking
  T.TARGET = 0;

  // The over/under game would be a separate page on CAST Games; this home shows no card for it
  T.OU_SEPARATE = true;

  /* The 13 in SC positions (the owner, 17 Oct 2026): a fullback, four centres or wingers, a five-eighth, a halfback, a
     hooker, two front rowers and three second rowers. A season fills one of the SC positions he had that year (the
     site's first and second position). The codes are what the games save and the server checks, so they never change;
     5/8 and 2RF keep their SC labels on screen */
  T.SLOTS = ['FLB', 'CTW', 'CTW', 'CTW', 'CTW', 'FE', 'HFB', 'HOK', 'FRF', 'FRF', 'SR', 'SR', 'SR'];
  T.POS_NAMES = { FLB: 'Fullback', CTW: 'Centre or Wing', FE: 'Five-Eighth', HFB: 'Halfback', HOK: 'Hooker', FRF: 'Front Row', SR: 'Second Row' };
  T.POS_SHORT = { FLB: 'FLB', CTW: 'CTW', FE: '5/8', HFB: 'HFB', HOK: 'HOK', FRF: 'FRF', SR: '2RF' };
  T.POS_ORDER = ['FLB', 'CTW', 'FE', 'HFB', 'HOK', 'FRF', 'SR'];
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  T.FLEX_OF = [];

  T.seasonLabel = function (y) { return String(y || '?'); };
  T.FIRST_YEAR = 2009;
  T.LAST_YEAR = 2026;

  // The 17 clubs, by the slugs the other NRL games use (1000TRIES and 27-0)
  T.CLUBS = {
    broncos: { name: 'Brisbane Broncos', from: 2009, to: 2026 },
    raiders: { name: 'Canberra Raiders', from: 2009, to: 2026 },
    bulldogs: { name: 'Canterbury-Bankstown Bulldogs', from: 2009, to: 2026 },
    sharks: { name: 'Cronulla-Sutherland Sharks', from: 2009, to: 2026 },
    dolphins: { name: 'Dolphins', from: 2023, to: 2026 },
    titans: { name: 'Gold Coast Titans', from: 2009, to: 2026 },
    seaeagles: { name: 'Manly Warringah Sea Eagles', from: 2009, to: 2026 },
    storm: { name: 'Melbourne Storm', from: 2009, to: 2026 },
    knights: { name: 'Newcastle Knights', from: 2009, to: 2026 },
    cowboys: { name: 'North Queensland Cowboys', from: 2009, to: 2026 },
    eels: { name: 'Parramatta Eels', from: 2009, to: 2026 },
    panthers: { name: 'Penrith Panthers', from: 2009, to: 2026 },
    rabbitohs: { name: 'South Sydney Rabbitohs', from: 2009, to: 2026 },
    dragons: { name: 'St. George Illawarra Dragons', from: 2009, to: 2026 },
    roosters: { name: 'Sydney Roosters', from: 2009, to: 2026 },
    warriors: { name: 'NZ Warriors', from: 2009, to: 2026 },
    tigers: { name: 'Wests Tigers', from: 2009, to: 2026 }
  };
  T.TEST_SIDES = {};
  T.CLUB_NICK = { broncos: 'Broncos', raiders: 'Raiders', bulldogs: 'Bulldogs', sharks: 'Sharks', dolphins: 'Dolphins', titans: 'Titans',
    seaeagles: 'Sea Eagles', storm: 'Storm', knights: 'Knights', cowboys: 'Cowboys', eels: 'Eels', panthers: 'Panthers', rabbitohs: 'Rabbitohs',
    dragons: 'Dragons', roosters: 'Roosters', warriors: 'Warriors', tigers: 'Wests Tigers' };
  // The abbreviations and colours 1000TRIES uses
  T.CLUB_ABBR = { broncos: 'BRI', raiders: 'CBR', bulldogs: 'BUL', sharks: 'CRO', dolphins: 'DOL', titans: 'GCT', seaeagles: 'MAN', storm: 'MEL',
    knights: 'NEW', cowboys: 'NQC', eels: 'PAR', panthers: 'PTH', rabbitohs: 'SSR', dragons: 'SGI', roosters: 'SYD', warriors: 'NZW', tigers: 'WST' };
  T.CLUB_COLORS = { broncos: '#6B0046', raiders: '#36AD2D', bulldogs: '#00468B', sharks: '#0182BB', dolphins: '#FB141C', titans: '#00A2E0',
    seaeagles: '#6B1D45', storm: '#592B8D', knights: '#D22730', cowboys: '#0B233F', eels: '#002D71', panthers: '#000000', rabbitohs: '#003C1A',
    dragons: '#D22730', roosters: '#012D5C', warriors: '#000000', tigers: '#F37221' };
  T.CLUB_SECONDARY = { broncos: '#F5A623', raiders: '#FFFFFF', bulldogs: '#FFFFFF', sharks: '#000000', dolphins: '#FFFFFF', titans: '#001F5B',
    seaeagles: '#FFFFFF', storm: '#FFD600', knights: '#003087', cowboys: '#C4A84B', eels: '#FFD700', panthers: '#FFFFFF', rabbitohs: '#CC0000',
    dragons: '#FFFFFF', roosters: '#CC0000', warriors: '#FFFFFF', tigers: '#000000' };
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

  /* Legends (the Legend Key's Legends Pick only, 17 Oct 2026): all-time great SC seasons, each player's best when it
     is 1750 or more (data/seasons.json "legends", set by ~/cast-dev/sc/tools/make_game_files.py). They are seasons
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

  /* The GOAT: the #1 SC season total in the data (the owner's rule for every game: the GOAT is the #1 in the stat), Tom
     Trbojevic's 2021 (2149 SC points in 15 games). A pack season, so he can be dealt like any other, but rarely in free
     play (js/draft.js S.goatOut); the GOAT item brings his own card, his number showing */
  T.GOAT_SRC = null;
  T.GOAT_ID = null;
  T.isGoat = function (p) { return !!p && (p.tier === 'goat' || (!!T.GOAT_ID && p.id === T.GOAT_ID)); };
  T.goatCard = function (src) { return src || null; };

  // The surname on the field tiles: everything after the first name (Ah Mau, Chan Kum Tong)
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

  /* The pack (key 'nrl': the main pack everywhere in the shared code). tries_1998_plus holds each card's season SC
     points (the engine's one number field); the second pack slot is never live */
  T.DATASETS = {
    nrl: { file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'Season SC points, 2009 to 2026', who: 'NRL' },
    wc: { file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'SC points', who: 'NRL' },
    nrlw: { live: false, file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'SC points', who: 'NRL' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'SC points';
  T.ERA_LABEL = 'SC Points';

  /* data/seasons.json (compact): clubs, people [[id, name]], rows [[person, year, club, "FLB/CTW", SC points, games]],
     legends [row], goat row, tags {row: club} for a name two players share ("Sione Katoa (Sharks) 2018" on the boards) */
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

  // Big seasons (top 5% of the pack) for the first offer's 'false hope'. Cached per pack.
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
