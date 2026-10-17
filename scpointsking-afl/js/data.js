


(function (T) {
  'use strict';

  

  T.GAME_NAME = 'SC POINTS KING: AFL';
  T.GAME_SLUG = 'scpointsking-afl'; 
  T.TARGET = 0;

  
  T.OU_SEPARATE = true;

  


  T.SLOTS = ['DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'RUC', 'FWD', 'FWD', 'FWD', 'FWD', 'FWD', 'FWD'];
  

  T.GOAT_HEADLINES = { 'marcus-bontempelli': 'IT\u2019S BONT TIME' }; 
  T.goatHeadline = function (p) { return (p && T.GOAT_HEADLINES[p.pid]) || ''; };
  T.POS_NAMES = { DEF: 'Defender', MID: 'Midfielder', RUC: 'Ruck', FWD: 'Forward' };
  T.POS_SHORT = { DEF: 'DEF', MID: 'MID', RUC: 'RUC', FWD: 'FWD' };
  T.POS_ORDER = ['DEF', 'MID', 'RUC', 'FWD'];
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  T.FLEX_OF = [];

  T.seasonLabel = function (y) { return String(y || '?'); };
  
  T.FIRST_YEAR = 2007;
  T.LAST_YEAR = 2026;

  
  
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

  
  T.positionsOf = function (p) { return p.positions_played || []; };
  T.canFill = function (p, code) { return T.positionsOf(p).indexOf(code) !== -1; };

  
  T.playedFor = function (p, club, year) { return !!club && p.club === club && (year == null || p.year === year); };
  T.lastClub = function (p) { return p.club; };
  T.slotClub = function (slot) { return (slot && slot.club) || (slot && slot.player && slot.player.club); };

  




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

  


  T.GOAT_SRC = null;
  T.GOAT_ID = null;
  T.isGoat = function (p) { return !!p && (p.tier === 'goat' || (!!T.GOAT_ID && p.id === T.GOAT_ID)); };
  T.goatCard = function (src) { return src || null; };

  
  T.surname = function (name) {
    var n = String(name).replace(/\s*\([^)]*\)\s*$/, '').trim(), parts = n.split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  };

  T.fmt = function (n) {
    return Number(n).toLocaleString('en-AU', { useGrouping: false }); 
  };

  T.players = [];
  T.byId = {};

  
  T.NAT = null;
  T.loadNat = function () { return Promise.reject(new Error('no World Cup here')); };
  T.nationsOf = function () { return []; };

  

  T.DATASETS = {
    nrl: { file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'Season SC points', who: 'AFL' },
    wc: { file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'SC points', who: 'AFL' },
    nrlw: { live: false, file: 'data/seasons.json', target: 0, weight: 100, label: 'SC points', era: 'SC Points', only: 'SC points', who: 'AFL' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'SC points';
  T.ERA_LABEL = 'SC Points';

  

  
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
    return T.loadDataset('nrl').then(function (pool) {
      if (!pool.legendsApplied) {
        T.LEGENDS.forEach(function (p) { pool.byId[p.id] = p; });
        T.GOAT_CARD = null; 
        pool.legendsApplied = true;
      }
      T.useDataset('nrl');
      return pool.players;
    });
  };
})(window.T = window.T || {});
