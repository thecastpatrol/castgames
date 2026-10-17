/* 777 TDS data layer (15 Oct 2026, from the 1000TRIES engine): player pack, franchise maps, slot template.
   Career scored touchdowns (rushing, receiving, returns, interception and fumble returns; passing TDs never count) from
   nflverse player stats (CC BY 4.0) for 1999 on and Wikipedia (CC BY-SA 4.0) for seasons before 1999 and the Legends. */
(function (T) {
  'use strict';

  T.TARGET = 777; // the owner's name and target (the real-engine simulation: ~/cast-dev/nfl/tools/strat.js); 777 with 10 spots since 17 Oct 2026 (was 700 with 9)

  // The 10 in draft order (the owner, 15 Oct 2026: offence only; a 4th receiver 17 Oct 2026): a quarterback, two running
  // backs, four receivers, a tight end and two FLEX spots (a running back, receiver or tight end)
  // The over/under mode is a separate game on CAST Games (its own page); this home shows no card for it
  T.OU_SEPARATE = true;

  T.SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'];

  T.POS_NAMES = { QB: 'Quarterback', RB: 'Running Back', WR: 'Wide Receiver', TE: 'Tight End', FLEX: 'Flex' };
  // What the spots and chips show. The codes are also what the games save and the server checks, so they never change
  T.POS_SHORT = { QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', FLEX: 'FLEX' };
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  T.FLEX_OF = ['RB', 'WR', 'TE']; // who can play a FLEX spot

  // The 32 franchises, each named as it is today (one slug per franchise: the Oakland, Los Angeles and Las Vegas Raiders
  // are all 'raiders'), from its first NFL (or AFL) season
  T.CLUBS = {
    cardinals: { name: 'Arizona Cardinals', from: 1920, to: 2026 },
    falcons: { name: 'Atlanta Falcons', from: 1966, to: 2026 },
    ravens: { name: 'Baltimore Ravens', from: 1996, to: 2026 },
    bills: { name: 'Buffalo Bills', from: 1960, to: 2026 },
    panthers: { name: 'Carolina Panthers', from: 1995, to: 2026 },
    bears: { name: 'Chicago Bears', from: 1920, to: 2026 },
    bengals: { name: 'Cincinnati Bengals', from: 1968, to: 2026 },
    browns: { name: 'Cleveland Browns', from: 1950, to: 2026 },
    cowboys: { name: 'Dallas Cowboys', from: 1960, to: 2026 },
    broncos: { name: 'Denver Broncos', from: 1960, to: 2026 },
    lions: { name: 'Detroit Lions', from: 1930, to: 2026 },
    packers: { name: 'Green Bay Packers', from: 1921, to: 2026 },
    texans: { name: 'Houston Texans', from: 2002, to: 2026 },
    colts: { name: 'Indianapolis Colts', from: 1953, to: 2026 },
    jaguars: { name: 'Jacksonville Jaguars', from: 1995, to: 2026 },
    chiefs: { name: 'Kansas City Chiefs', from: 1960, to: 2026 },
    raiders: { name: 'Las Vegas Raiders', from: 1960, to: 2026 },
    chargers: { name: 'Los Angeles Chargers', from: 1960, to: 2026 },
    rams: { name: 'Los Angeles Rams', from: 1937, to: 2026 },
    dolphins: { name: 'Miami Dolphins', from: 1966, to: 2026 },
    vikings: { name: 'Minnesota Vikings', from: 1961, to: 2026 },
    patriots: { name: 'New England Patriots', from: 1960, to: 2026 },
    saints: { name: 'New Orleans Saints', from: 1967, to: 2026 },
    giants: { name: 'New York Giants', from: 1925, to: 2026 },
    jets: { name: 'New York Jets', from: 1960, to: 2026 },
    eagles: { name: 'Philadelphia Eagles', from: 1933, to: 2026 },
    steelers: { name: 'Pittsburgh Steelers', from: 1933, to: 2026 },
    "49ers": { name: 'San Francisco 49ers', from: 1950, to: 2026 },
    seahawks: { name: 'Seattle Seahawks', from: 1976, to: 2026 },
    buccaneers: { name: 'Tampa Bay Buccaneers', from: 1976, to: 2026 },
    titans: { name: 'Tennessee Titans', from: 1960, to: 2026 },
    commanders: { name: 'Washington Commanders', from: 1932, to: 2026 }
  };
  T.TEST_SIDES = {};

  // The broadcast abbreviations
  T.CLUB_ABBR = { cardinals: 'ARI', falcons: 'ATL', ravens: 'BAL', bills: 'BUF', panthers: 'CAR', bears: 'CHI', bengals: 'CIN', browns: 'CLE', cowboys: 'DAL', broncos: 'DEN', lions: 'DET', packers: 'GB', texans: 'HOU', colts: 'IND', jaguars: 'JAX', chiefs: 'KC', raiders: 'LV', chargers: 'LAC', rams: 'LAR', dolphins: 'MIA', vikings: 'MIN', patriots: 'NE', saints: 'NO', giants: 'NYG', jets: 'NYJ', eagles: 'PHI', steelers: 'PIT', "49ers": 'SF', seahawks: 'SEA', buccaneers: 'TB', titans: 'TEN', commanders: 'WAS' };

  // nflverse team colours (CC BY 4.0)
  T.CLUB_COLORS = { cardinals: '#97233F', falcons: '#A71930', ravens: '#241773', bills: '#00338D', panthers: '#0085CA', bears: '#0B162A', bengals: '#FB4F14', browns: '#FF3C00', cowboys: '#002244', broncos: '#002244', lions: '#0076B6', packers: '#203731', texans: '#03202F', colts: '#002C5F', jaguars: '#006778', chiefs: '#E31837', raiders: '#000000', chargers: '#007BC7', rams: '#003594', dolphins: '#008E97', vikings: '#4F2683', patriots: '#002244', saints: '#D3BC8D', giants: '#0B2265', jets: '#003F2D', eagles: '#004C54', steelers: '#000000', "49ers": '#AA0000', seahawks: '#002244', buccaneers: '#A71930', titans: '#4495D2', commanders: '#5A1414' };

  // The second colour: nflverse's, or a readable one where it would sink into the first or the dark page
  T.CLUB_SECONDARY = { cardinals: '#FFFFFF', falcons: '#FFFFFF', ravens: '#9E7C0C', bills: '#C60C30', panthers: '#BFC0BF', bears: '#E64100', bengals: '#000000', browns: '#FFFFFF', cowboys: '#B0B7BC', broncos: '#FB4F14', lions: '#B0B7BC', packers: '#FFB612', texans: '#A71930', colts: '#A5ACAF', jaguars: '#000000', chiefs: '#FFB612', raiders: '#A5ACAF', chargers: '#FFC20E', rams: '#FFD100', dolphins: '#F58220', vikings: '#FFC62F', patriots: '#C60C30', saints: '#000000', giants: '#A71930', jets: '#FFFFFF', eagles: '#A5ACAF', steelers: '#FFB612', "49ers": '#B3995D', seahawks: '#69BE28', buccaneers: '#B1BABF', titans: '#0C2340', commanders: '#FFB612' };
  T.CLUB_THIRD = {};

  // Each franchise's names by season ([from, to, name], to null: today), so a 2001 spin says St. Louis Rams
  T.CLUB_ERAS = {
    cardinals: [[1920, 1959, 'Chicago Cardinals'], [1960, 1987, 'St. Louis Cardinals'], [1988, 1993, 'Phoenix Cardinals'], [1994, null, 'Arizona Cardinals']],
    falcons: [[1966, null, 'Atlanta Falcons']],
    ravens: [[1996, null, 'Baltimore Ravens']],
    bills: [[1960, null, 'Buffalo Bills']],
    panthers: [[1995, null, 'Carolina Panthers']],
    bears: [[1920, 1921, 'Chicago Staleys'], [1922, null, 'Chicago Bears']],
    bengals: [[1968, null, 'Cincinnati Bengals']],
    browns: [[1950, 1995, 'Cleveland Browns'], [1999, null, 'Cleveland Browns']],
    cowboys: [[1960, null, 'Dallas Cowboys']],
    broncos: [[1960, null, 'Denver Broncos']],
    lions: [[1930, 1933, 'Portsmouth Spartans'], [1934, null, 'Detroit Lions']],
    packers: [[1921, null, 'Green Bay Packers']],
    texans: [[2002, null, 'Houston Texans']],
    colts: [[1953, 1983, 'Baltimore Colts'], [1984, null, 'Indianapolis Colts']],
    jaguars: [[1995, null, 'Jacksonville Jaguars']],
    chiefs: [[1960, 1962, 'Dallas Texans'], [1963, null, 'Kansas City Chiefs']],
    raiders: [[1960, 1981, 'Oakland Raiders'], [1982, 1994, 'Los Angeles Raiders'], [1995, 2019, 'Oakland Raiders'], [2020, null, 'Las Vegas Raiders']],
    chargers: [[1960, 1960, 'Los Angeles Chargers'], [1961, 2016, 'San Diego Chargers'], [2017, null, 'Los Angeles Chargers']],
    rams: [[1937, 1945, 'Cleveland Rams'], [1946, 1994, 'Los Angeles Rams'], [1995, 2015, 'St. Louis Rams'], [2016, null, 'Los Angeles Rams']],
    dolphins: [[1966, null, 'Miami Dolphins']],
    vikings: [[1961, null, 'Minnesota Vikings']],
    patriots: [[1960, 1970, 'Boston Patriots'], [1971, null, 'New England Patriots']],
    saints: [[1967, null, 'New Orleans Saints']],
    giants: [[1925, null, 'New York Giants']],
    jets: [[1960, 1962, 'New York Titans'], [1963, null, 'New York Jets']],
    eagles: [[1933, null, 'Philadelphia Eagles']],
    steelers: [[1933, 1939, 'Pittsburgh Pirates'], [1940, null, 'Pittsburgh Steelers']],
    "49ers": [[1950, null, 'San Francisco 49ers']],
    seahawks: [[1976, null, 'Seattle Seahawks']],
    buccaneers: [[1976, null, 'Tampa Bay Buccaneers']],
    titans: [[1960, 1996, 'Houston Oilers'], [1997, 1998, 'Tennessee Oilers'], [1999, null, 'Tennessee Titans']],
    commanders: [[1932, 1932, 'Boston Braves'], [1933, 1936, 'Boston Redskins'], [1937, 2019, 'Washington Redskins'], [2020, 2021, 'Washington Football Team'], [2022, null, 'Washington Commanders']]
  };
  T.CLUB_DIVISION = { cardinals: 'NFC West', falcons: 'NFC South', ravens: 'AFC North', bills: 'AFC East', panthers: 'NFC South', bears: 'NFC North', bengals: 'AFC North', browns: 'AFC North', cowboys: 'NFC East', broncos: 'AFC West', lions: 'NFC North', packers: 'NFC North', texans: 'AFC South', colts: 'AFC South', jaguars: 'AFC South', chiefs: 'AFC West', raiders: 'AFC West', chargers: 'AFC West', rams: 'NFC West', dolphins: 'AFC East', vikings: 'NFC North', patriots: 'AFC East', saints: 'NFC South', giants: 'NFC East', jets: 'AFC East', eagles: 'NFC East', steelers: 'AFC North', "49ers": 'NFC West', seahawks: 'NFC West', buccaneers: 'NFC South', titans: 'AFC South', commanders: 'NFC East' };
  T.clubNameIn = function (slug, year) {
    var e = (T.CLUB_ERAS[slug] || []).filter(function (x) { return x[0] <= year && (x[1] == null || year <= x[1]); })[0];
    return e ? e[2] : (T.CLUBS[slug] || {}).name || slug;
  };

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

  // Positions a player can fill: positions_played (QB, RB, WR, TE), falling back to draft_role then position, and FLEX for
  // every running back, receiver and tight end
  T.positionsOf = function (p) {
    if (p._pos) return p._pos;
    var list = (p.positions_played && p.positions_played.length) ? p.positions_played.slice()
      : [p.draft_role || p.position].filter(Boolean);
    if (list.some(function (c) { return T.FLEX_OF.indexOf(c) !== -1; }) && list.indexOf('FLEX') === -1) list.push('FLEX');
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

  /* Legends (777+ only): the Legends Pick. data/legends.json lists the 30 greats whose careers were mostly before 1999,
     with their whole-career scored TDs. None of them are in the normal pool: 'replaces' names any pool players who moved across. */
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

  /* The GOAT (one Shop item for every CAST draft game, 16 Oct 2026, the owner: "THE GOAT IS UNIVERSAL"): here Jerry Rice.
     T.GOAT_SRC: the player the GOAT item brings. A Legend comes as his own GOAT card (T.goatCard: "Name (GOAT)", tier
     'goat', the server's lib/goat.js), never beside his Legend card. T.GOAT_ID: who always wears the goat */
  T.GOAT_SRC = 'legend-jerry-rice';
  T.GOAT_ID = 'legend-jerry-rice'; // his Legend card wears the goat too, when a Legends Pick deals him (17 Oct 2026, the owner)
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

  // World Cup match days (shared code from 1000TRIES; never on in 777 TDS, which has no data/nations-nrl.json)
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

  // Player packs. Career scored TDs is the only one (key kept as 'nrl': the main pack everywhere in the code); the second
  // pack slot (key 'nrlw', the NRLW mode's twin) is never live. tries_1998_plus holds each player's career scored TDs
  T.DATASETS = {
    nrl:  { file: 'data/players.json', target: 777, weight: 40, label: 'career TDs', era: 'Career TDs', only: 'Scored TDs only, no passing TDs', who: 'NFL' },
    // World Cup mode: never on in 777 TDS (kept so the shared mode code finds it)
    wc: { file: 'data/players.json', target: 200, weight: 4, label: 'TDs', era: 'TDs', only: 'TDs', who: 'NFL' },
    nrlw: { live: false, file: 'data/players.json', target: 777, weight: 40, label: 'career TDs', era: 'Career TDs', only: 'Scored TDs only', who: 'NFL' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'career TDs';
  T.ERA_LABEL = 'Career TDs';

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

  // Big TD scorers (top 5% of a pack) for the first-offer 'false hope'. Cached per pack.
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
