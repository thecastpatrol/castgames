


(function (T) {
  'use strict';

  T.TARGET = 777; 

  
  
  
  T.OU_SEPARATE = true;

  T.SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'];

  T.POS_NAMES = { QB: 'Quarterback', RB: 'Running Back', WR: 'Wide Receiver', TE: 'Tight End', FLEX: 'Flex' };
  
  T.POS_SHORT = { QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', FLEX: 'FLEX' };
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  T.FLEX_OF = ['RB', 'WR', 'TE']; 

  
  
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

  
  T.CLUB_ABBR = { cardinals: 'ARI', falcons: 'ATL', ravens: 'BAL', bills: 'BUF', panthers: 'CAR', bears: 'CHI', bengals: 'CIN', browns: 'CLE', cowboys: 'DAL', broncos: 'DEN', lions: 'DET', packers: 'GB', texans: 'HOU', colts: 'IND', jaguars: 'JAX', chiefs: 'KC', raiders: 'LV', chargers: 'LAC', rams: 'LAR', dolphins: 'MIA', vikings: 'MIN', patriots: 'NE', saints: 'NO', giants: 'NYG', jets: 'NYJ', eagles: 'PHI', steelers: 'PIT', "49ers": 'SF', seahawks: 'SEA', buccaneers: 'TB', titans: 'TEN', commanders: 'WAS' };

  
  T.CLUB_COLORS = { cardinals: '#97233F', falcons: '#A71930', ravens: '#241773', bills: '#00338D', panthers: '#0085CA', bears: '#0B162A', bengals: '#FB4F14', browns: '#FF3C00', cowboys: '#002244', broncos: '#002244', lions: '#0076B6', packers: '#203731', texans: '#03202F', colts: '#002C5F', jaguars: '#006778', chiefs: '#E31837', raiders: '#000000', chargers: '#007BC7', rams: '#003594', dolphins: '#008E97', vikings: '#4F2683', patriots: '#002244', saints: '#D3BC8D', giants: '#0B2265', jets: '#003F2D', eagles: '#004C54', steelers: '#000000', "49ers": '#AA0000', seahawks: '#002244', buccaneers: '#A71930', titans: '#4495D2', commanders: '#5A1414' };

  
  T.CLUB_SECONDARY = { cardinals: '#FFFFFF', falcons: '#FFFFFF', ravens: '#9E7C0C', bills: '#C60C30', panthers: '#BFC0BF', bears: '#E64100', bengals: '#000000', browns: '#FFFFFF', cowboys: '#B0B7BC', broncos: '#FB4F14', lions: '#B0B7BC', packers: '#FFB612', texans: '#A71930', colts: '#A5ACAF', jaguars: '#000000', chiefs: '#FFB612', raiders: '#A5ACAF', chargers: '#FFC20E', rams: '#FFD100', dolphins: '#F58220', vikings: '#FFC62F', patriots: '#C60C30', saints: '#000000', giants: '#A71930', jets: '#FFFFFF', eagles: '#A5ACAF', steelers: '#FFB612', "49ers": '#B3995D', seahawks: '#69BE28', buccaneers: '#B1BABF', titans: '#0C2340', commanders: '#FFB612' };
  T.CLUB_THIRD = {};

  
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

  
  T.club = function (slug) {
    var primary = T.CLUB_COLORS[slug] || '#1a1a2e';
    var secondary = T.CLUB_SECONDARY[slug] || '#FFFFFF';
    
    var accent = secondary.toLowerCase() === primary.toLowerCase() ? textOn(primary) : secondary;
    return {
      slug: slug,
      name: (T.CLUBS[slug] || T.TEST_SIDES[slug] || {}).name || slug,
      abbr: T.CLUB_ABBR[slug] || String(slug).slice(0, 3).toUpperCase(),
      primary: primary,
      secondary: secondary,
      accent: accent,
      third: T.CLUB_THIRD[slug] || null, 
      text: textOn(primary)
    };
  };

  
  
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

  
  T.playedFor = function (p, club, year) {
    return !!club && (p.club_years || []).some(function (cy) {
      return cy.club === club && (year == null || (cy.from <= year && year <= cy.to));
    });
  };

  
  T.lastClub = function (p) {
    if (p._last) return p._last;
    if (p.tier) return (p._last = p.primary_club); 
    var best = null;
    (p.club_years || []).forEach(function (cy) {
      if (!best || cy.to > best.to || (cy.to === best.to && cy.from >= best.from)) best = cy;
    });
    p._last = best ? best.club : p.primary_club;
    return p._last;
  };

  
  
  
  T.slotClub = function (slot) {
    return (slot && slot.club) || (T.showClub ? T.showClub(slot.player) : T.lastClub(slot.player));
  };

  



  

  T.LEGENDS = [];
  T.LEGEND_ODDS = { legends: 0.25, immortal: 0.08 }; 
  T.isImmortal = function (p) { return !!p && p.tier === 'immortal'; };
  




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

  


  T.GOAT_SRC = 'legend-jerry-rice';
  T.GOAT_ID = 'legend-jerry-rice'; 
  T.isGoat = function (p) {
    return !!p && (p.tier === 'goat' || (!!T.GOAT_ID && p.id === T.GOAT_ID));
  };
  T.goatCard = function (src) {
    if (!src || !src.tier) return src || null; 
    var c = {};
    Object.keys(src).forEach(function (k) { c[k] = src[k]; });
    c.id = 'goat-' + String(src.id).replace(/^legend-/, ''); c.tier = 'goat';
    c.record_name = String(src.record_name || src.name).replace(/\s*\([^)]*\)$/, '') + ' (GOAT)';
    return c;
  };

  


  var SURNAME_OF = {
    'Sonny Bill Williams': 'Williams', 'Te Maire Martin': 'Martin', "De La Salle Va'a": "Va'a", 'Kalifa Faifai Loa': 'Faifai Loa',
    'Junior Tia Kilifi': 'Tia Kilifi', 'Raymond Tuaimalo Vaega': 'Tuaimalo Vaega', 'Gordon Chan Kum Tong': 'Chan Kum Tong',
    'Loko Jnr Pasifiki Tonga': 'Pasifiki Tonga', 'Tuku Hau Tapuha': 'Hau Tapuha', 'Tevita Pangai Junior': 'Pangai Junior'
  };
  T.surname = function (name) {
    var n = String(name).replace(/\s*\([^)]*\)\s*$/, '').replace(/[\u201C"][^\u201D"]*[\u201D"]\s*/g, '').trim();
    if (SURNAME_OF[n]) return SURNAME_OF[n];
    var parts = n.split(/\s+/), rest = parts.slice(1);
    
    while (rest.length > 1 && /^(?:[A-Z]\.)+$|^[A-Z]$/.test(rest[0])) rest.shift();
    return rest.length ? rest.join(' ') : parts[0];
  };

  T.fmt = function (n) {
    return Number(n).toLocaleString('en-AU', { useGrouping: false }); 
  };

  T.players = [];
  T.byId = {};

  
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

  
  
  T.DATASETS = {
    nrl:  { file: 'data/players.json', target: 777, weight: 40, label: 'career TDs', era: 'Career TDs', only: 'Scored TDs only, no passing TDs', who: 'NFL' },
    
    wc: { file: 'data/players.json', target: 200, weight: 4, label: 'TDs', era: 'TDs', only: 'TDs', who: 'NFL' },
    nrlw: { live: false, file: 'data/players.json', target: 777, weight: 40, label: 'career TDs', era: 'Career TDs', only: 'Scored TDs only', who: 'NFL' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'career TDs';
  T.ERA_LABEL = 'Career TDs';

  
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
          
          
          var m = / \([^)]+\)$/.exec(p.name);
          if (m && !p.record_name) { p.record_name = p.name; p.name = p.name.slice(0, m.index); }
        });
        var pool = { players: players, byId: byId };
        return (d.pool = pool);
      });
    d.loading.catch(function () { d.loading = null; });
    return d.loading;
  };

  
  T.starCut = function () {
    var d = T.DATASETS[T.DATASET];
    if (d.starCut == null) {
      var t = T.players.map(function (p) { return p.tries_1998_plus; }).sort(function (a, b) { return a - b; });
      d.starCut = t.length ? t[Math.floor(t.length * 0.95)] : Infinity;
    }
    return d.starCut;
  };

  
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
        var gsrc = T.GOAT_SRC && pool.byId[T.GOAT_SRC]; 
        T.GOAT_CARD = gsrc && gsrc.tier ? T.goatCard(gsrc) : null;
        if (T.GOAT_CARD) pool.byId[T.GOAT_CARD.id] = T.GOAT_CARD;
        pool.legendsApplied = true;
      }
      T.useDataset('nrl');
      return pool.players;
    });
  };
})(window.T = window.T || {});
