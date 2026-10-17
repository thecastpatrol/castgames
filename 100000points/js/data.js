/* NBA draft game data layer (17 Oct 2026, from the 1000TRIES engine via 777 TDS): player pack, franchise maps, slot template.
   Career NBA regular-season points from the NBA's own stats (stats.nba.com all-time totals; ABA points never count),
   checked against Basketball-Reference, which also gives each player's positions and teams by season. */
(function (T) {
  'use strict';

  T.TARGET = 100000; // set with the real-engine smart-fan simulator (kept out of this repo)

  // The starting five in draft order (the owner, 17 Oct 2026): a point guard, shooting guard, small forward, power
  // forward and centre. A player can fill up to 2 of these, his real ones
  // The over/under game is a separate page on CAST Games; this home shows no card for it
  T.OU_SEPARATE = true;

  T.SLOTS = ['PG', 'SG', 'SF', 'PF', 'C'];

  T.POS_NAMES = { PG: 'Point Guard', SG: 'Shooting Guard', SF: 'Small Forward', PF: 'Power Forward', C: 'Centre' };
  // What the spots and chips show. The codes are also what the games save and the server checks, so they never change
  T.POS_SHORT = { PG: 'PG', SG: 'SG', SF: 'SF', PF: 'PF', C: 'C' };
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  T.FLEX_OF = []; // no FLEX spot in a starting five

  // Seasons are kept by the year they tipped off (2025 = the 2025-26 season) and shown as "2025-26"
  T.seasonLabel = function (y) { y = +y; return isFinite(y) && y > 1900 ? y + '-' + String((y + 1) % 100).padStart(2, '0') : String(y || '?'); };

  // The 30 franchises, each named as it is today (one slug per franchise: the Seattle SuperSonics are 'thunder', the
  // Charlotte Hornets and Bobcats 'hornets', the New Orleans Hornets 'pelicans', as the NBA keeps their histories)
  T.CLUBS = {
    hawks: { name: 'Atlanta Hawks', from: 1949, to: 2025 },
    celtics: { name: 'Boston Celtics', from: 1946, to: 2025 },
    nets: { name: 'Brooklyn Nets', from: 1976, to: 2025 },
    hornets: { name: 'Charlotte Hornets', from: 1988, to: 2025 },
    bulls: { name: 'Chicago Bulls', from: 1966, to: 2025 },
    cavaliers: { name: 'Cleveland Cavaliers', from: 1970, to: 2025 },
    mavericks: { name: 'Dallas Mavericks', from: 1980, to: 2025 },
    nuggets: { name: 'Denver Nuggets', from: 1976, to: 2025 },
    pistons: { name: 'Detroit Pistons', from: 1948, to: 2025 },
    warriors: { name: 'Golden State Warriors', from: 1946, to: 2025 },
    rockets: { name: 'Houston Rockets', from: 1967, to: 2025 },
    pacers: { name: 'Indiana Pacers', from: 1976, to: 2025 },
    clippers: { name: 'LA Clippers', from: 1970, to: 2025 },
    lakers: { name: 'Los Angeles Lakers', from: 1948, to: 2025 },
    grizzlies: { name: 'Memphis Grizzlies', from: 1995, to: 2025 },
    heat: { name: 'Miami Heat', from: 1988, to: 2025 },
    bucks: { name: 'Milwaukee Bucks', from: 1968, to: 2025 },
    timberwolves: { name: 'Minnesota Timberwolves', from: 1989, to: 2025 },
    pelicans: { name: 'New Orleans Pelicans', from: 2002, to: 2025 },
    knicks: { name: 'New York Knicks', from: 1946, to: 2025 },
    thunder: { name: 'Oklahoma City Thunder', from: 1967, to: 2025 },
    magic: { name: 'Orlando Magic', from: 1989, to: 2025 },
    '76ers': { name: 'Philadelphia 76ers', from: 1949, to: 2025 },
    suns: { name: 'Phoenix Suns', from: 1968, to: 2025 },
    blazers: { name: 'Portland Trail Blazers', from: 1970, to: 2025 },
    kings: { name: 'Sacramento Kings', from: 1948, to: 2025 },
    spurs: { name: 'San Antonio Spurs', from: 1976, to: 2025 },
    raptors: { name: 'Toronto Raptors', from: 1995, to: 2025 },
    jazz: { name: 'Utah Jazz', from: 1974, to: 2025 },
    wizards: { name: 'Washington Wizards', from: 1961, to: 2025 }
  };
  T.TEST_SIDES = {};

  // The broadcast abbreviations
  T.CLUB_ABBR = { hawks: 'ATL', celtics: 'BOS', nets: 'BKN', hornets: 'CHA', bulls: 'CHI', cavaliers: 'CLE', mavericks: 'DAL', nuggets: 'DEN', pistons: 'DET', warriors: 'GSW', rockets: 'HOU', pacers: 'IND', clippers: 'LAC', lakers: 'LAL', grizzlies: 'MEM', heat: 'MIA', bucks: 'MIL', timberwolves: 'MIN', pelicans: 'NOP', knicks: 'NYK', thunder: 'OKC', magic: 'ORL', '76ers': 'PHI', suns: 'PHX', blazers: 'POR', kings: 'SAC', spurs: 'SAS', raptors: 'TOR', jazz: 'UTA', wizards: 'WAS' };

  // Team colours (each club's main colour, then a second one that reads on it)
  T.CLUB_COLORS = { hawks: '#C8102E', celtics: '#007A33', nets: '#000000', hornets: '#1D1160', bulls: '#CE1141', cavaliers: '#860038', mavericks: '#00538C', nuggets: '#0E2240', pistons: '#C8102E', warriors: '#1D428A', rockets: '#CE1141', pacers: '#002D62', clippers: '#1D428A', lakers: '#552583', grizzlies: '#5D76A9', heat: '#98002E', bucks: '#00471B', timberwolves: '#0C2340', pelicans: '#0C2340', knicks: '#006BB6', thunder: '#007AC1', magic: '#0077C0', '76ers': '#006BB6', suns: '#1D1160', blazers: '#E03A3E', kings: '#5A2D81', spurs: '#000000', raptors: '#CE1141', jazz: '#3E2680', wizards: '#002B5C' };
  T.CLUB_SECONDARY = { hawks: '#FDB927', celtics: '#FFFFFF', nets: '#FFFFFF', hornets: '#00788C', bulls: '#000000', cavaliers: '#FDBB30', mavericks: '#B8C4CA', nuggets: '#FEC524', pistons: '#1D42BA', warriors: '#FFC72C', rockets: '#C4CED4', pacers: '#FDBB30', clippers: '#C8102E', lakers: '#FDB927', grizzlies: '#12173F', heat: '#F9A01B', bucks: '#EEE1C6', timberwolves: '#78BE20', pelicans: '#C8102E', knicks: '#F58426', thunder: '#EF3B24', magic: '#C4CED4', '76ers': '#ED174C', suns: '#E56020', blazers: '#000000', kings: '#63727A', spurs: '#C4CED4', raptors: '#A1A1A4', jazz: '#FFFFFF', wizards: '#E31837' };
  T.CLUB_THIRD = {};

  // Each franchise's names by season ([from, to, name], to null: today), so a 1990 spin says Seattle SuperSonics
  T.CLUB_ERAS = {
    hawks: [[1949, 1950, 'Tri-Cities Blackhawks'], [1951, 1954, 'Milwaukee Hawks'], [1955, 1967, 'St. Louis Hawks'], [1968, null, 'Atlanta Hawks']],
    celtics: [[1946, null, 'Boston Celtics']],
    nets: [[1976, 1976, 'New York Nets'], [1977, 2011, 'New Jersey Nets'], [2012, null, 'Brooklyn Nets']],
    hornets: [[1988, 2001, 'Charlotte Hornets'], [2004, 2013, 'Charlotte Bobcats'], [2014, null, 'Charlotte Hornets']],
    bulls: [[1966, null, 'Chicago Bulls']],
    cavaliers: [[1970, null, 'Cleveland Cavaliers']],
    mavericks: [[1980, null, 'Dallas Mavericks']],
    nuggets: [[1976, null, 'Denver Nuggets']],
    pistons: [[1948, 1956, 'Fort Wayne Pistons'], [1957, null, 'Detroit Pistons']],
    warriors: [[1946, 1961, 'Philadelphia Warriors'], [1962, 1970, 'San Francisco Warriors'], [1971, null, 'Golden State Warriors']],
    rockets: [[1967, 1970, 'San Diego Rockets'], [1971, null, 'Houston Rockets']],
    pacers: [[1976, null, 'Indiana Pacers']],
    clippers: [[1970, 1977, 'Buffalo Braves'], [1978, 1983, 'San Diego Clippers'], [1984, null, 'LA Clippers']],
    lakers: [[1948, 1959, 'Minneapolis Lakers'], [1960, null, 'Los Angeles Lakers']],
    grizzlies: [[1995, 2000, 'Vancouver Grizzlies'], [2001, null, 'Memphis Grizzlies']],
    heat: [[1988, null, 'Miami Heat']],
    bucks: [[1968, null, 'Milwaukee Bucks']],
    timberwolves: [[1989, null, 'Minnesota Timberwolves']],
    pelicans: [[2002, 2004, 'New Orleans Hornets'], [2005, 2006, 'New Orleans/OKC Hornets'], [2007, 2012, 'New Orleans Hornets'], [2013, null, 'New Orleans Pelicans']],
    knicks: [[1946, null, 'New York Knicks']],
    thunder: [[1967, 2007, 'Seattle SuperSonics'], [2008, null, 'Oklahoma City Thunder']],
    magic: [[1989, null, 'Orlando Magic']],
    '76ers': [[1949, 1962, 'Syracuse Nationals'], [1963, null, 'Philadelphia 76ers']],
    suns: [[1968, null, 'Phoenix Suns']],
    blazers: [[1970, null, 'Portland Trail Blazers']],
    kings: [[1948, 1956, 'Rochester Royals'], [1957, 1971, 'Cincinnati Royals'], [1972, 1974, 'Kansas City-Omaha Kings'], [1975, 1984, 'Kansas City Kings'], [1985, null, 'Sacramento Kings']],
    spurs: [[1976, null, 'San Antonio Spurs']],
    raptors: [[1995, null, 'Toronto Raptors']],
    jazz: [[1974, 1978, 'New Orleans Jazz'], [1979, null, 'Utah Jazz']],
    wizards: [[1961, 1961, 'Chicago Packers'], [1962, 1962, 'Chicago Zephyrs'], [1963, 1972, 'Baltimore Bullets'], [1973, 1973, 'Capital Bullets'], [1974, 1996, 'Washington Bullets'], [1997, null, 'Washington Wizards']]
  };
  // Today's divisions (the Daily's division days)
  T.CLUB_DIVISION = { celtics: 'Atlantic', nets: 'Atlantic', knicks: 'Atlantic', '76ers': 'Atlantic', raptors: 'Atlantic', bulls: 'Central', cavaliers: 'Central', pistons: 'Central', pacers: 'Central', bucks: 'Central', hawks: 'Southeast', hornets: 'Southeast', heat: 'Southeast', magic: 'Southeast', wizards: 'Southeast', nuggets: 'Northwest', timberwolves: 'Northwest', thunder: 'Northwest', blazers: 'Northwest', jazz: 'Northwest', warriors: 'Pacific', clippers: 'Pacific', lakers: 'Pacific', suns: 'Pacific', kings: 'Pacific', mavericks: 'Southwest', rockets: 'Southwest', grizzlies: 'Southwest', pelicans: 'Southwest', spurs: 'Southwest' };
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

  // Positions a player can fill: positions_played (1 or 2 of PG, SG, SF, PF, C: his own, from where he played his
  // minutes), falling back to draft_role then position
  T.positionsOf = function (p) {
    if (p._pos) return p._pos;
    var list = (p.positions_played && p.positions_played.length) ? p.positions_played.slice(0, 2)
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

  /* Legends (the main mode only): the Legends Pick. data/legends.json lists the retired players with 25000+ NBA points,
     with their career points. None of them are in the normal pool: 'replaces' names any pool players who moved across. */
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

  /* The GOAT (one Shop item for every CAST draft game, 16 Oct 2026, the owner: "THE GOAT IS UNIVERSAL"): here LeBron James
     (the owner, 17 Oct 2026), the NBA's career points leader. Like Alex Johnston in 1000TRIES he is a pack player, so he
     stays in the normal offers too and the GOAT item brings his own card (T.goatCard keeps a pack player as he is); he
     always wears the goat (T.GOAT_ID). Michael Jordan stays one of the Legends */
  T.GOAT_SRC = 'lebron-james';
  T.GOAT_ID = 'lebron-james';
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

  /* The surname on the court tiles: a club tag in brackets (Eddie Johnson (Kings)) and a nickname in quotes go, and the
     names whose last name is two words are spelt out */
  var SURNAME_OF = {
    'Metta World Peace': 'World Peace', 'Nick Van Exel': 'Van Exel', 'Keith Van Horn': 'Van Horn', 'Dick Van Arsdale': 'Van Arsdale',
    'Tom Van Arsdale': 'Van Arsdale', 'Luc Mbah a Moute': 'Mbah a Moute', 'Kiki VanDeWeghe': 'VanDeWeghe', 'Fred VanVleet': 'VanVleet',
    'Jan Van Breda Kolff': 'Van Breda Kolff', 'Butch van Breda Kolff': 'van Breda Kolff', 'Bob Van Arsdale': 'Van Arsdale',
    'Juan Carlos Navarro': 'Navarro', 'Nene': 'Nene', 'World B. Free': 'Free', 'Lloyd Free': 'Free'
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

  // World Cup match days (shared code from 1000TRIES; never on here: there is no data/nations-nrl.json)
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

  // Player packs. Career NBA points is the only one (key kept as 'nrl': the main pack everywhere in the code); the second
  // pack slot (key 'nrlw', the NRLW mode's twin) is never live. tries_1998_plus holds each player's career NBA points
  T.DATASETS = {
    nrl:  { file: 'data/players.json', target: 100000, weight: 6000, label: 'career points', era: 'Career Points', only: 'NBA regular season only, never ABA', who: 'NBA' },
    // World Cup mode: never on here (kept so the shared mode code finds it)
    wc: { file: 'data/players.json', target: 100000, weight: 6000, label: 'points', era: 'Points', only: 'Points', who: 'NBA' },
    nrlw: { live: false, file: 'data/players.json', target: 100000, weight: 6000, label: 'career points', era: 'Career Points', only: 'NBA regular season only', who: 'NBA' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'career points';
  T.ERA_LABEL = 'Career Points';

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

  // Big scorers (top 5% of a pack) for the first offer. Cached per pack.
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
