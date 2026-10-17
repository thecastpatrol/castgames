

(function (T) {
  'use strict';

  T.TARGET = 650; 

  
  T.OU_SEPARATE = true;

  


  T.FORMATIONS = {
    '4-3-3': [['LB', 'CB', 'CB', 'RB'], ['CM', 'CM', 'CM'], ['LW', 'ST', 'RW']],
    '4-4-2': [['LB', 'CB', 'CB', 'RB'], ['LM', 'CM', 'CM', 'RM'], ['ST', 'ST']],
    '4-2-3-1': [['LB', 'CB', 'CB', 'RB'], ['DM', 'DM'], ['LW', 'AM', 'RW'], ['ST']],
    '3-5-2': [['CB', 'CB', 'CB'], ['LM', 'CM', 'CM', 'RM'], ['AM'], ['ST', 'ST']], 
    '3-4-3': [['CB', 'CB', 'CB'], ['LM', 'CM', 'CM', 'RM'], ['LW', 'ST', 'RW']], 
    '5-3-2': [['LWB', 'CB', 'CB', 'CB', 'RWB'], ['CM', 'CM', 'CM'], ['ST', 'ST']],
    '4-1-4-1': [['LB', 'CB', 'CB', 'RB'], ['DM'], ['LM', 'CM', 'CM', 'RM'], ['ST']],
    '4-5-1': [['LB', 'CB', 'CB', 'RB'], ['LM', 'CM', 'CM', 'CM', 'RM'], ['ST']],
    '3-4-2-1': [['CB', 'CB', 'CB'], ['LWB', 'CM', 'CM', 'RWB'], ['AM', 'AM'], ['ST']],
    '4-3-1-2': [['LB', 'CB', 'CB', 'RB'], ['CM', 'DM', 'CM'], ['AM'], ['ST', 'ST']]
  };
  T.FORMATION_IDS = Object.keys(T.FORMATIONS);
  
  T.FORMATION_NOTES = {
    '4-3-3': 'Front Three', '4-4-2': 'Two Up Top', '4-2-3-1': 'Two Holding Mids', '3-5-2': 'Back Three, Two Up Top',
    '3-4-3': 'Back Three, Front Three', '5-3-2': 'Back Five', '4-1-4-1': 'One Holding Mid', '4-5-1': 'Five Across the Middle',
    '3-4-2-1': 'Two Behind the Striker', '4-3-1-2': 'The Diamond'
  };
  T.FORMATION_DEFAULT = '4-3-3';
  
  T.formationSlots = function (id) { return [].concat.apply([], T.FORMATIONS[id] || T.FORMATIONS[T.FORMATION_DEFAULT]); };
  T.formationRows = function (id) {
    var i = 0;
    return (T.FORMATIONS[id] || T.FORMATIONS[T.FORMATION_DEFAULT]).map(function (r) { return r.map(function () { return i++; }); });
  };

  
  T.SLOTS = T.formationSlots(T.FORMATION_DEFAULT);

  T.POS_NAMES = {
    LB: 'Left Back', CB: 'Centre Back', RB: 'Right Back', LWB: 'Left Wing Back', RWB: 'Right Wing Back',
    DM: 'Defensive Mid', CM: 'Central Mid', AM: 'Attacking Mid', LM: 'Left Mid', RM: 'Right Mid',
    LW: 'Left Wing', RW: 'Right Wing', ST: 'Striker',
    D: 'Defender', M: 'Midfielder', F: 'Forward' 
  };
  
  T.POS_SHORT = { D: 'DEF', M: 'MID', F: 'FWD', AM: 'CAM', DM: 'CDM' }; 
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  
  T.SPOT_ORDER = ['LB', 'LWB', 'CB', 'RB', 'RWB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW', 'ST'];
  


  T.SAME_SPOT = { LB: 'LWB', LWB: 'LB', RB: 'RWB', RWB: 'RB', LW: 'LM', LM: 'LW', RW: 'RM', RM: 'RW' };

  


  
  T.CUR_SEASON = 2026;
  T.CLUBS = {
    bournemouth: { name: 'AFC Bournemouth', spells: [[2015, 2019], [2022, 2026]] },
    arsenal: { name: 'Arsenal', spells: [[1992, 2026]] },
    villa: { name: 'Aston Villa', spells: [[1992, 2015], [2019, 2026]] },
    barnsley: { name: 'Barnsley', spells: [[1997, 1997]] },
    birmingham: { name: 'Birmingham City', spells: [[2002, 2005], [2007, 2007], [2009, 2010]] },
    blackburn: { name: 'Blackburn Rovers', spells: [[1992, 1998], [2001, 2011]] },
    blackpool: { name: 'Blackpool', spells: [[2010, 2010]] },
    bolton: { name: 'Bolton Wanderers', spells: [[1995, 1995], [1997, 1997], [2001, 2011]] },
    bradford: { name: 'Bradford City', spells: [[1999, 2000]] },
    brentford: { name: 'Brentford', spells: [[2021, 2026]] },
    brighton: { name: 'Brighton & Hove Albion', spells: [[2017, 2026]] },
    burnley: { name: 'Burnley', spells: [[2009, 2009], [2014, 2014], [2016, 2021], [2023, 2023], [2025, 2025]] },
    cardiff: { name: 'Cardiff City', spells: [[2013, 2013], [2018, 2018]] },
    charlton: { name: 'Charlton Athletic', spells: [[1998, 1998], [2000, 2006]] },
    chelsea: { name: 'Chelsea', spells: [[1992, 2026]] },
    coventry: { name: 'Coventry City', spells: [[1992, 2000], [2026, 2026]] },
    palace: { name: 'Crystal Palace', spells: [[1992, 1992], [1994, 1994], [1997, 1997], [2004, 2004], [2013, 2026]] },
    derby: { name: 'Derby County', spells: [[1996, 2001], [2007, 2007]] },
    everton: { name: 'Everton', spells: [[1992, 2026]] },
    fulham: { name: 'Fulham', spells: [[2001, 2013], [2018, 2018], [2020, 2020], [2022, 2026]] },
    huddersfield: { name: 'Huddersfield Town', spells: [[2017, 2018]] },
    hull: { name: 'Hull City', spells: [[2008, 2009], [2013, 2014], [2016, 2016], [2026, 2026]] },
    ipswich: { name: 'Ipswich Town', spells: [[1992, 1994], [2000, 2001], [2024, 2024], [2026, 2026]] },
    leeds: { name: 'Leeds United', spells: [[1992, 2003], [2020, 2022], [2025, 2026]] },
    leicester: { name: 'Leicester City', spells: [[1994, 1994], [1996, 2001], [2003, 2003], [2014, 2022], [2024, 2024]] },
    liverpool: { name: 'Liverpool', spells: [[1992, 2026]] },
    luton: { name: 'Luton Town', spells: [[2023, 2023]] },
    mancity: { name: 'Manchester City', spells: [[1992, 1995], [2000, 2000], [2002, 2026]] },
    manutd: { name: 'Manchester United', spells: [[1992, 2026]] },
    boro: { name: 'Middlesbrough', spells: [[1992, 1992], [1995, 1996], [1998, 2008], [2016, 2016]] },
    newcastle: { name: 'Newcastle United', spells: [[1993, 2008], [2010, 2015], [2017, 2026]] },
    norwich: { name: 'Norwich City', spells: [[1992, 1994], [2004, 2004], [2011, 2013], [2015, 2015], [2019, 2019], [2021, 2021]] },
    forest: { name: 'Nottingham Forest', spells: [[1992, 1992], [1994, 1996], [1998, 1998], [2022, 2026]] },
    oldham: { name: 'Oldham Athletic', spells: [[1992, 1993]] },
    portsmouth: { name: 'Portsmouth', spells: [[2003, 2009]] },
    qpr: { name: 'Queens Park Rangers', spells: [[1992, 1995], [2011, 2012], [2014, 2014]] },
    reading: { name: 'Reading', spells: [[2006, 2007], [2012, 2012]] },
    sheffutd: { name: 'Sheffield United', spells: [[1992, 1993], [2006, 2006], [2019, 2020], [2023, 2023]] },
    sheffwed: { name: 'Sheffield Wednesday', spells: [[1992, 1999]] },
    southampton: { name: 'Southampton', spells: [[1992, 2004], [2012, 2022], [2024, 2024]] },
    stoke: { name: 'Stoke City', spells: [[2008, 2017]] },
    sunderland: { name: 'Sunderland', spells: [[1996, 1996], [1999, 2002], [2005, 2005], [2007, 2016], [2025, 2026]] },
    swansea: { name: 'Swansea City', spells: [[2011, 2017]] },
    swindon: { name: 'Swindon Town', spells: [[1993, 1993]] },
    spurs: { name: 'Tottenham Hotspur', spells: [[1992, 2026]] },
    watford: { name: 'Watford', spells: [[1999, 1999], [2006, 2006], [2015, 2019], [2021, 2021]] },
    westbrom: { name: 'West Bromwich Albion', spells: [[2002, 2002], [2004, 2005], [2008, 2008], [2010, 2017], [2020, 2020]] },
    westham: { name: 'West Ham United', spells: [[1993, 2002], [2005, 2010], [2012, 2025]] },
    wigan: { name: 'Wigan Athletic', spells: [[2005, 2012]] },
    wimbledon: { name: 'Wimbledon', spells: [[1992, 1999]] },
    wolves: { name: 'Wolverhampton Wanderers', spells: [[2003, 2003], [2009, 2011], [2018, 2025]] }
  };
  T.CLUB_ABBR = {
    bournemouth: 'BOU', arsenal: 'ARS', villa: 'AVL', barnsley: 'BAR', birmingham: 'BIR', blackburn: 'BLB',
    blackpool: 'BLP', bolton: 'BOL', bradford: 'BRA', brentford: 'BRE', brighton: 'BHA', burnley: 'BUR',
    cardiff: 'CAR', charlton: 'CHA', chelsea: 'CHE', coventry: 'COV', palace: 'CRY', derby: 'DER', everton: 'EVE',
    fulham: 'FUL', huddersfield: 'HUD', hull: 'HUL', ipswich: 'IPS', leeds: 'LEE', leicester: 'LEI', liverpool: 'LIV',
    luton: 'LUT', mancity: 'MCI', manutd: 'MUN', boro: 'BOR', newcastle: 'NEW', norwich: 'NOR', forest: 'NFO',
    oldham: 'OLD', portsmouth: 'POR', qpr: 'QPR', reading: 'REA', sheffutd: 'SHU', sheffwed: 'SHW',
    southampton: 'SOU', stoke: 'STK', sunderland: 'SUN', swansea: 'SWA', swindon: 'SWI', spurs: 'TOT', watford: 'WAT',
    westbrom: 'WBA', westham: 'WHU', wigan: 'WIG', wimbledon: 'WIM', wolves: 'WOL'
  };
  
  
  T.CLUB_SHORT = { manutd: 'Man United', mancity: 'Man City', spurs: 'Spurs', wolves: 'Wolves', westbrom: 'West Brom', brighton: 'Brighton',
    sheffwed: 'Sheff Wed', sheffutd: 'Sheff Utd', forest: 'Forest', qpr: 'QPR', huddersfield: 'Huddersfield', charlton: 'Charlton',
    bolton: 'Bolton', blackburn: 'Blackburn', newcastle: 'Newcastle', bournemouth: 'Bournemouth', palace: 'Palace' };
  T.TEST_SIDES = {};

  
  T.seasonLabel = function (y) { return y + '-' + String((Number(y) + 1) % 100).padStart(2, '0'); };

  
  T.CLUB_COLORS = {
    bournemouth: '#DA291C', arsenal: '#EF0107', villa: '#670E36', barnsley: '#D71920', birmingham: '#1D3D8F',
    blackburn: '#009EE0', blackpool: '#F68712', bolton: '#1B2A5C', bradford: '#8A1538', brentford: '#E30613',
    brighton: '#0057B8', burnley: '#6C1D45', cardiff: '#0070B5', charlton: '#D4021D', chelsea: '#034694',
    coventry: '#59CBE8', palace: '#1B458F', derby: '#000000', everton: '#003399', fulham: '#000000',
    huddersfield: '#0E63AD', hull: '#F5A12D', ipswich: '#0044A9', leeds: '#1D428A', leicester: '#003090',
    liverpool: '#C8102E', luton: '#F78F1E', mancity: '#6CABDD', manutd: '#DA291C', boro: '#E11B22',
    newcastle: '#241F20', norwich: '#FFF200', forest: '#DD0000', oldham: '#004A9F', portsmouth: '#001489',
    qpr: '#1D5BA4', reading: '#004494', sheffutd: '#EE2737', sheffwed: '#1E5BB8', southampton: '#D71920',
    stoke: '#E03A3E', sunderland: '#EB172B', swansea: '#121212', swindon: '#DC161B', spurs: '#132257',
    watford: '#FBEE23', westbrom: '#122F67', westham: '#7A263A', wigan: '#1D59AF', wimbledon: '#1A2B5C',
    wolves: '#FDB913'
  };
  T.CLUB_SECONDARY = {
    bournemouth: '#000000', arsenal: '#FFFFFF', villa: '#95BFE5', barnsley: '#FFFFFF', birmingham: '#FFFFFF',
    blackburn: '#FFFFFF', blackpool: '#FFFFFF', bolton: '#FFFFFF', bradford: '#FDB913', brentford: '#FFFFFF',
    brighton: '#FFFFFF', burnley: '#99D6EA', cardiff: '#FFFFFF', charlton: '#FFFFFF', chelsea: '#FFFFFF',
    coventry: '#FFFFFF', palace: '#C4122E', derby: '#FFFFFF', everton: '#FFFFFF', fulham: '#FFFFFF',
    huddersfield: '#FFFFFF', hull: '#000000', ipswich: '#FFFFFF', leeds: '#FFFFFF', leicester: '#FFFFFF',
    liverpool: '#FFFFFF', luton: '#002D62', mancity: '#FFFFFF', manutd: '#FFFFFF', boro: '#FFFFFF',
    newcastle: '#FFFFFF', norwich: '#00A650', forest: '#FFFFFF', oldham: '#FFFFFF', portsmouth: '#FFFFFF',
    qpr: '#FFFFFF', reading: '#FFFFFF', sheffutd: '#FFFFFF', sheffwed: '#FFFFFF', southampton: '#FFFFFF',
    stoke: '#FFFFFF', sunderland: '#FFFFFF', swansea: '#FFFFFF', swindon: '#FFFFFF', spurs: '#FFFFFF',
    watford: '#ED2127', westbrom: '#FFFFFF', westham: '#1BB1E7', wigan: '#FFFFFF', wimbledon: '#FFE500',
    wolves: '#231F20'
  };
  
  T.CLUB_THIRD = {};

  function textOn(hex) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#111111' : '#FFFFFF';
  }

  
  T.club = function (slug) {
    var primary = T.CLUB_COLORS[slug] || '#1a1a2e';
    var secondary = T.CLUB_SECONDARY[slug] || '#FFFFFF';
    
    
    var lum = function (h) { return (0.299 * parseInt(h.slice(1, 3), 16) + 0.587 * parseInt(h.slice(3, 5), 16) + 0.114 * parseInt(h.slice(5, 7), 16)) / 255; };
    var accent = secondary.toLowerCase() === primary.toLowerCase() || Math.abs(lum(secondary) - lum(primary)) < 0.18 ? textOn(primary) : secondary;
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
    p._pos = list;
    return list;
  };

  


  T.WIDE = { LB: 1, RB: 1, LWB: 1, RWB: 1, LM: 1, RM: 1, LW: 1, RW: 1 };
  T.WIDE_SPOT = { LWB: 1, RWB: 1, LM: 1, RM: 1 };
  T.WIDE_ATT = { LM: 1, RM: 1, LW: 1, RW: 1 };
  T.MID_FLEX = { CM: ['AM', 'DM'] }; 
  T.backThree = function (slots) { return (slots || T.SLOTS).filter(function (c) { return c === 'CB'; }).length === 3; };
  T.canFill = function (p, code) {
    var own = T.positionsOf(p);
    if (own.indexOf(code) !== -1 || (!!T.SAME_SPOT[code] && own.indexOf(T.SAME_SPOT[code]) !== -1)) return true;
    
    
    if (own.some(function (c) { return (T.MID_FLEX[c] || []).indexOf(code) !== -1; })) return true;
    
    
    var wb = code === 'LWB' || code === 'RWB';
    return !!T.WIDE_SPOT[code] && T.backThree() && own.some(function (c) { return !!T.WIDE[c] && c.charAt(0) === code.charAt(0) && (!wb || c.slice(1, 2) === 'B' || c.slice(1) === 'WB'); });
  };

  
  T.playedFor = function (p, club, year) {
    return !!club && (p.club_years || []).some(function (cy) {
      return cy.club === club && (year == null || (cy.from <= year && year <= cy.to));
    });
  };

  
  T.lastClub = function (p) {
    if (p._last) return p._last;
    if (p.tier) return (p._last = p.primary_club); 
    
    if (p.tests && p.primary_club) return (p._last = p.primary_club);
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

  


  T.GOAT_SRC = 'legend-alan-shearer';
  T.GOAT_ID = 'legend-alan-shearer'; 
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
    
    nrl:  { file: 'data/players.json', target: 650, weight: 40, lowCut: 1, lowFactor: 0.5, label: 'PL goals', era: 'PL goals', only: 'Premier League goals only', who: 'Premier League' },
    
    wc: { file: 'data/players.json', target: 200, weight: 4, label: 'goals', era: 'goals', only: 'goals', who: 'Premier League' },
    nrlw: { live: false, file: 'data/players.json', target: 650, weight: 40, label: 'PL goals', era: 'PL goals', only: 'Premier League goals only', who: 'Premier League' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'PL goals';
  T.ERA_LABEL = 'PL goals';

  
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
