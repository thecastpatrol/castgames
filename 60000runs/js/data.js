

(function (T) {
  'use strict';

  T.TARGET = 60000; 

  
  T.OU_SEPARATE = true;

  




  T.SLOTS = ['B', 'B', 'B', 'B', 'B', 'A', 'K', 'W', 'W', 'W', 'W'];
  T.SLOTS_6 = ['B', 'B', 'B', 'B', 'B', 'B', 'K', 'W', 'W', 'W', 'W'];

  
  T.POS_NAMES = { B: 'Batter', A: 'All-\u2060Rounder', K: 'Keeper', W: 'Bowler' };
  
  
  T.POS_SHORT = { B: 'BAT', A: 'AR', K: 'WK', W: 'BOWL' };
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  
  T.aPos = function (code) { var n = T.POS_NAMES[code] || code; return (/^[AEIOU]/.test(n) ? 'an ' : 'a ') + n; };

  
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

  
  T.CLUB_ABBR = { aus: 'AUS', eng: 'ENG', sa: 'SA', wi: 'WI', nz: 'NZ', ind: 'IND', pak: 'PAK', sl: 'SL', zim: 'ZIM', ban: 'BAN', ire: 'IRE', afg: 'AFG' };

  
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
    if (list.indexOf('B') !== -1 && list.indexOf('W') !== -1 && list.indexOf('A') === -1) list.splice(list.indexOf('B') + 1, 0, 'A');
    p._pos = list;
    return list;
  };
  T.isAllRounder = function (p) { return !!p && T.positionsOf(p).indexOf('A') !== -1; };
  
  T.rolesOf = function (p) { return T.positionsOf(p).filter(function (c) { return c !== 'A'; }); };

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

  


  T.GOAT_SRC = 'legend-sachin-tendulkar';
  T.GOAT_ID = 'legend-sachin-tendulkar'; 
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
    nrl:  { file: 'data/players.json', target: 60000, weight: 300, label: 'Test runs', era: 'Test runs', only: 'Test runs only', who: 'Test' },
    
    wc: { file: 'data/players.json', target: 200, weight: 4, label: 'runs', era: 'runs', only: 'runs', who: 'Test' },
    nrlw: { live: false, file: 'data/players.json', target: 60000, weight: 300, label: 'Test runs', era: 'Test runs', only: 'Test runs only', who: 'Test' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'Test runs';
  T.ERA_LABEL = 'Test runs';

  
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
