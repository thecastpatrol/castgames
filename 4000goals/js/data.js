

(function (T) {
  'use strict';

  T.TARGET = 4000;

  
  
  T.OU_SEPARATE = true;

  T.SLOTS = ['B', 'B', 'B', 'B', 'B', 'B', 'M', 'M', 'M', 'M', 'M', 'M', 'F', 'F', 'F', 'F', 'F', 'F'];

  T.POS_NAMES = { B: 'Back', M: 'Midfield', F: 'Forward' };

  
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
    wb: { name: 'Western Bulldogs', from: 1925, to: 2026 },
    
    bb: { name: 'Brisbane Bears', from: 1987, to: 1996 },
    fi: { name: 'Fitzroy', from: 1897, to: 1996 },
    sm: { name: 'South Melbourne', from: 1897, to: 1981 },
    un: { name: 'University', from: 1908, to: 1914 }
  };
  T.TEST_SIDES = {};

  T.CLUB_ABBR = {
    ad: 'ADE', bl: 'BRI', ca: 'CAR', cw: 'COL', es: 'ESS', fr: 'FRE', ge: 'GEE', gc: 'GCS', gw: 'GWS', hw: 'HAW', me: 'MEL',
    nm: 'NTH', pa: 'PTA', ri: 'RIC', sk: 'STK', sy: 'SYD', wc: 'WCE', wb: 'WBD', bb: 'BRB', fi: 'FIT', sm: 'SMB', un: 'UNI'
  };

  T.CLUB_COLORS = {
    ad: '#002B5C', bl: '#7C003E', ca: '#0E1E2D', cw: '#000000', es: '#CC2031', fr: '#2A1A54', ge: '#1C3C63', gc: '#D93E39',
    gw: '#F15C22', hw: '#4D2004', me: '#0F1131', nm: '#1A3B8E', pa: '#008AAB', ri: '#000000', sk: '#ED0F05', sy: '#ED171F',
    wc: '#062EE2', wb: '#014896', bb: '#8B0000', fi: '#A30046', sm: '#ED171F', un: '#000080'
  };

  T.CLUB_SECONDARY = {
    ad: '#E21937', bl: '#FDBE57', ca: '#FFFFFF', cw: '#FFFFFF', es: '#000000', fr: '#FFFFFF', ge: '#FFFFFF', gc: '#F6BD00',
    gw: '#4A4F55', hw: '#FBBF15', me: '#CC2031', nm: '#FFFFFF', pa: '#000000', ri: '#FED102', sk: '#000000', sy: '#FFFFFF',
    wc: '#FFD700', wb: '#E21937', bb: '#FFD700', fi: '#1A3B8E', sm: '#FFFFFF', un: '#FFFFFF'
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

  


  T.GOAT_SRC = 'legend-tony-lockett';
  T.GOAT_ID = 'legend-tony-lockett';
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
    
    
    nrl:  { file: 'data/players.json', target: 4000, weight: 40, label: 'AFL goals', era: 'AFL goals since 1990', only: 'AFL goals since 1990', who: 'AFL' }, 
    
    nrlw: { live: true, file: 'data/aflw-players.json', target: 750, weight: 45, lowCut: 2, lowFactor: 0.3, label: 'AFLW goals', era: 'AFLW goals', only: 'AFLW premiership goals only', who: 'AFLW' },
    
    
    
    
    wc: { file: 'data/wc-players.json', target: 200, weight: 4, lowCut: 2, lowFactor: 0.3, label: 'Test goals', era: 'Test goals', only: 'Senior Test goals only', who: 'Test' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'AFL goals';
  T.ERA_LABEL = 'AFL goals since 1990';

  
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
        
        
        if (name === 'nrlw') return T.aflwGoals().then(function (list) { T.addAflwGoals(d, pool, list); d.pool = pool; return pool; },
          function () { d.av = 0; d.pool = pool; return pool; });
        if (name !== 'wc') return (d.pool = pool);
        
        
        return fetch('data/wc-legends.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('data/wc-legends.json ' + r.status); return r.json(); })
          .then(function (j) { T.markIntlLegends(pool, j && j['1000tries']); d.pool = pool; })
          .then(function () {
            
            
            if (!window.CastAccount || !CastAccount.wcTries) return d.pool;
            return CastAccount.wcTries().then(function (x) { T.addWcTries(d, x.list); return d.pool; }, function () { d.wv = 0; return d.pool; });
          });
      });
    d.loading.catch(function () { d.loading = null; });
    return d.loading;
  };

  
  T.addWcTries = function (d, list) {
    var add = {}, apps = {};
    (list || []).forEach(function (m) { Object.keys((m && m.s) || {}).forEach(function (n) { add[n.toLowerCase()] = (add[n.toLowerCase()] || 0) + (+m.s[n] || 0); }); });
    
    
    var app = function (m, key, by) {
      Object.keys((m && m[key]) || {}).forEach(function (n) { var k = n.toLowerCase(), o = apps[k] = apps[k] || {}, c = m[key][n] || ''; o[c] = (o[c] || 0) + by; });
    };
    (list || []).forEach(function (m) { app(m, 'a', 1); app(m, 'ax', -1); });
    d.pool.players.forEach(function (p) {
      var k = (p.record_name || p.name).toLowerCase(), a = add[k], o = apps[k];
      if (a) p.tries_1998_plus += a;
      if (!o) return;
      var n = 0;
      Object.keys(o).forEach(function (c) {
        if (o[c] <= 0) return;
        n += o[c];
        if (!c) return; 
        var cy = (p.club_years = p.club_years || []), e = cy.filter(function (x) { return x.club === c; })[0];
        if (e) { e.tests = (e.tests || 0) + o[c]; e.to = Math.max(e.to || 2026, 2026); } else cy.push({ club: c, from: 2026, to: 2026, tests: o[c] });
      });
      if (!n) return;
      p.tests = (p.tests || 0) + n;
      var y = String(p.career_span || '').split('-')[0];
      p.career_span = y && y !== '2026' ? y + '-2026' : '2026';
    });
    d.wv = (list || []).length;
    d.starCut = null;
  };

  




  var AFLW_DOC = 'projects/cast-games-bd641/databases/(default)/documents/config/aflwGoals';
  function fsVal(v) {
    if (!v || typeof v !== 'object') return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return +v.integerValue;
    if ('doubleValue' in v) return +v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsVal);
    if ('mapValue' in v) { var o = {}, f = v.mapValue.fields || {}; Object.keys(f).forEach(function (k) { o[k] = fsVal(f[k]); }); return o; }
    return null;
  }
  T.aflwGoals = function () {
    var emu = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]castemu=1(&|$)/.test(location.search); 
    var url = emu ? 'http://127.0.0.1:8085/v1/' + AFLW_DOC.replace('cast-games-bd641', 'demo-cast-games')
      : 'https://firestore.googleapis.com/v1/' + AFLW_DOC + '?key=AIzaSyC76_SWOqYJbwfqPWhx0eVX2WwruE5ryRU'; 
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (r.status === 404) return [];
      if (!r.ok) throw new Error('aflwGoals ' + r.status);
      return r.json().then(function (j) { var l = fsVal((j.fields || {}).list); return Array.isArray(l) ? l : []; });
    });
  };
  var AFLW_SINCE = 2026; 
  T.addAflwGoals = function (d, pool, list) {
    var byName = {}, slug = function (n) { return String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
    pool.players.forEach(function (p) { byName[p.record_name || p.name] = p; });
    (list || []).forEach(function (e) {
      
      ((e && e.nw) || []).forEach(function (x) {
        if (!x || !x.n || byName[x.n]) return;
        var id = slug(x.n) + '-aflw', line = ['B', 'M', 'F'].indexOf(x.p) >= 0 ? x.p : 'F';
        while (pool.byId[id]) id += '1';
        var p = { id: id, name: x.n, positions_played: [line], draft_role: line, position: line, primary_club: x.c || null,
          club_years: x.c ? [{ club: x.c, from: AFLW_SINCE, to: AFLW_SINCE }] : [], career_span: AFLW_SINCE + '-present', active: true, games: 1, tries_1998_plus: 0 };
        pool.players.push(p); pool.byId[id] = p; byName[x.n] = p;
      });
      [(e && e.s) || {}].concat(((e && e.nw) || []).map(function (x) { var o = {}; o[x.n] = x.g || 0; return o; })).forEach(function (s) {
        Object.keys(s).forEach(function (n) { var p = byName[n]; if (p) p.tries_1998_plus += (+s[n] || 0); });
      });
    });
    d.av = (list || []).length;
    d.starCut = null;
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
