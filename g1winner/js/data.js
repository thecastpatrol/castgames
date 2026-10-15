/* Racing game data layer (15 Oct 2026, from the CAST draft engine): jockey pack, silks, the card of 8.
   Group 1 wins in Australia and New Zealand since 1983 from breednet.com.au and Wikipedia (CC BY-SA), built by
   ~/cast-dev/racing/tools/make_game_files.py. The engine's field names stay as they are (tries_1998_plus holds the wins,
   club_years the years a Group 1 was won, all under one club 'g1'), so the shared code reads them unchanged. */
(function (T) {
  'use strict';

  T.TARGET = 550; // set by the real-engine simulation before launch (T.DATASETS.nrl.target wins once a game starts)
  T.GAME_NAME = 'G1 WINNER SPINNER'; // the owner's name (16 Oct 2026: "G1s Winners Spinner")
  T.GAME_SLUG = 'g1winner'; // its address on castgames.com.au

  // An 8-race Group 1 card with no positions (the owner, 16 Oct 2026): every jockey can ride any race, so every race has
  // the one code 'R' and a pick goes straight into the next open race. The races show as Race 1 to Race 8 (R1 to R8)
  // The over/under mode is a separate game on CAST Games (its own page); this home shows no card for it
  T.OU_SEPARATE = true;

  T.SLOTS = ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'];

  T.POS_NAMES = { R: 'Race' };
  T.POS_SHORT = { R: 'R' };
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };
  T.raceLabel = function (i) { return 'R' + (i + 1); };      // on the tiles
  T.raceName = function (i) { return 'Race ' + (i + 1); };   // in full

  /* No states anywhere (the owner, 16 Oct 2026): no jurisdiction on a card or in a Daily. The shared code still
     asks for clubs, so these stay, empty */
  T.CLUBS = {};
  T.TEST_SIDES = {};
  T.CLUB_ABBR = {};
  T.CLUB_COLORS = {};
  T.CLUB_SECONDARY = {};
  T.CLUB_THIRD = {};

  function textOn(hex) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#0B1220' : '#FFFFFF';
  }
  T.textOn = textOn;

  // A club for the shared code (never a state here): a plain neutral look
  T.club = function (slug) {
    var n = T.NEUTRAL_SILKS.colours;
    return { slug: slug || '', name: '', abbr: '', primary: n[0], secondary: n[1], accent: n[1], third: null, text: textOn(n[0]) };
  };

  /* Silks (the owner, 16 Oct 2026): every jockey wears the silks of his or her signature horse (data/players.json silks
     { horse, colours: [body, pattern], pattern, words, letter?, emblem?, epaulettes? }, built by
     tools/make_game_files.py; James McDonald wears Verry Elleegant). The horses' Photo Finish cards wear their own
     (data/silks.json, js/overunder.js), drawn by the same T.silksBg. A jockey without confirmed silks gets one neutral
     racing look: royal blue, no pattern */
  T.NEUTRAL_SILKS = { colours: ['#1f4fbf', '#ffffff'], pattern: 'plain' };
  function hexOk(c) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : null; }
  T.silksOf = function (p) {
    var s = p && p.silks;
    return s && s.colours && hexOk(s.colours[0]) ? s : null;
  };
  // The repeating patterns, each a 24px tile with the second colour as B
  var TILES = { stripes: '<rect width="12" height="24" fill="B"/>', hoops: '<rect width="24" height="12" fill="B"/>',
    spots: '<circle cx="12" cy="12" r="4.5" fill="B"/>', stars: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" fill="B"/>',
    diamonds: '<path d="M12 2l10 10-10 10L2 12z" fill="B"/>', 'triple diamond': '<path d="M12 2l10 10-10 10L2 12z" fill="B"/>',
    checks: '<rect width="12" height="12" fill="B"/><rect x="12" y="12" width="12" height="12" fill="B"/>',
    chevrons: '<path d="M0 6l12 8 12-8v6l-12 8L0 12z" fill="B"/>', chevron: '<path d="M0 6l12 8 12-8v6l-12 8L0 12z" fill="B"/>',
    quarters: '<rect width="12" height="12" fill="B"/><rect x="12" y="12" width="12" height="12" fill="B"/>',
    cross: '<rect x="9" width="6" height="24" fill="B"/><rect y="9" width="24" height="6" fill="B"/>',
    braces: '<rect x="4" width="4" height="24" fill="B"/><rect x="16" width="4" height="24" fill="B"/>',
    seams: '<rect x="11" width="2" height="24" fill="B"/>' };
  /* A letter or a badge, drawn once in the middle of the plate (40 x 40), in the second colour: Winx's M (a bold path,
     so it reads the same on every phone), a shamrock, a horseshoe, a lightning bolt, one big star, disc, diamond or square */
  var M_PATH = 'M5 35V5h8l7 13.5L27 5h8v30h-7V17.5l-6 11.5h-4l-6-11.5V35z';
  function emblemSvg(sk, b) {
    var e = sk.emblem, f = ' fill="' + b + '"';
    if (sk.letter) {
      if (sk.letter === 'M') return '<path d="' + M_PATH + '"' + f + '/>';
      return '<text x="20" y="31" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-weight="900" font-size="' + (sk.letter.length > 1 ? 22 : 30) + '"' + f + '>' + String(sk.letter).replace(/[<&>"]/g, '') + '</text>';
    }
    if (e === 'shamrock') return '<g' + f + '><circle cx="20" cy="12" r="7"/><circle cx="12.5" cy="21" r="7"/><circle cx="27.5" cy="21" r="7"/><path d="M19 22h2.4l2.6 15h-3z"/></g>';
    if (e === 'horseshoe') return '<path d="M9 6h7v13a4 4 0 0 0 8 0V6h7v13a11 11 0 0 1-22 0z"' + f + '/>';
    if (e === 'bolt') return '<path d="M23 3L9 23h9l-3 14 16-21h-9l4-13z"' + f + '/>';
    if (e === 'star') return '<path d="M20 3l4.9 10.1 11.1 1.5-8.1 7.7 2 11L20 28l-9.9 5.3 2-11L4 14.6l11.1-1.5z"' + f + '/>';
    if (e === 'disc') return '<circle cx="20" cy="20" r="14"' + f + '/>';
    if (e === 'diamond') return '<path d="M20 3l15 17-15 17L5 20z"' + f + '/>';
    if (e === 'square') return '<rect x="8" y="8" width="24" height="24"' + f + '/>';
    return '';
  }
  function uri(svg) { return "url('data:image/svg+xml," + encodeURIComponent(svg) + "')"; } // single quotes: it goes inside style="..."
  /* The silks as a CSS background (layers: the letter or badge once in the middle, epaulettes at the two top corners, the
     repeating pattern, then the body colour). Takes a silks object, or (the old way) body, second colour and pattern */
  T.silksBg = function (sk, b2, pat2) {
    if (typeof sk === 'string') sk = { colours: [sk, b2], pattern: pat2 };
    sk = sk || T.NEUTRAL_SILKS;
    var a = hexOk(sk.colours && sk.colours[0]) || T.NEUTRAL_SILKS.colours[0], b = hexOk(sk.colours && sk.colours[1]) || a;
    var pat = sk.pattern || 'plain', layers = [];
    var em = emblemSvg(sk, b);
    if (em) layers.push(uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">' + em + '</svg>') + ' center / auto 86% no-repeat');
    if (sk.epaulettes || pat === 'epaulettes') layers.push(uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" width="100" height="100"><rect width="16" height="24" fill="' + b + '"/><rect x="84" width="16" height="24" fill="' + b + '"/></svg>') + ' 0 0 / 100% 100% no-repeat');
    if (pat === 'sash') layers.push('linear-gradient(120deg, ' + a + ' 0 38%, ' + b + ' 38% 58%, ' + a + ' 58%)');
    else if (pat === 'halves' || pat === 'diabolo') layers.push('linear-gradient(90deg, ' + a + ' 0 50%, ' + b + ' 50%)');
    else if (TILES[pat]) layers.push(uri('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="' + a + '"/>' + TILES[pat].replace(/fill="B"/g, 'fill="' + b + '"') + '</svg>') + ' 0 0 / ' + (pat === 'quarters' ? 48 : 24) + 'px ' + (pat === 'quarters' ? 48 : 24) + 'px');
    layers.push(a);
    return layers.join(', ');
  };
  /* The same silks as one SVG picture, w x h (the share image draws it: js/share-card.js) */
  T.silksSvg = function (sk, w, h) {
    sk = sk || T.NEUTRAL_SILKS;
    var a = hexOk(sk.colours && sk.colours[0]) || T.NEUTRAL_SILKS.colours[0], b = hexOk(sk.colours && sk.colours[1]) || a;
    var pat = sk.pattern || 'plain', body = '<rect width="' + w + '" height="' + h + '" fill="' + a + '"/>', defs = '';
    if (pat === 'sash') body += '<path d="M' + (w * 0.2) + ' ' + h + 'L' + (w * 0.62) + ' 0H' + (w * 0.92) + 'L' + (w * 0.5) + ' ' + h + 'z" fill="' + b + '"/>';
    else if (pat === 'halves' || pat === 'diabolo') body += '<rect x="' + (w / 2) + '" width="' + (w / 2) + '" height="' + h + '" fill="' + b + '"/>';
    else if (TILES[pat]) {
      var t = Math.max(24, Math.round(h / 2)) * (pat === 'quarters' ? 2 : 1), sc = t / 24; // the tile grows with the picture, so it reads small
      defs = '<defs><pattern id="p" width="' + t + '" height="' + t + '" patternUnits="userSpaceOnUse"><g transform="scale(' + sc + ')"><rect width="24" height="24" fill="' + a + '"/>' + TILES[pat].replace(/fill="B"/g, 'fill="' + b + '"') + '</g></pattern></defs>';
      body += '<rect width="' + w + '" height="' + h + '" fill="url(#p)"/>';
    }
    if (sk.epaulettes || pat === 'epaulettes') body += '<rect width="' + (w * 0.16) + '" height="' + (h * 0.24) + '" fill="' + b + '"/><rect x="' + (w * 0.84) + '" width="' + (w * 0.16) + '" height="' + (h * 0.24) + '" fill="' + b + '"/>';
    var em = emblemSvg(sk, b);
    if (em) { var s = h * 0.86 / 40; body += '<g transform="translate(' + (w / 2 - 20 * s) + ' ' + (h / 2 - 20 * s) + ') scale(' + s + ')">' + em + '</g>'; }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + defs + body + '</svg>';
  };
  /* A jockey's look on every card: { primary, accent, text, bg (the silks), horse, words, neutral } */
  T.look = function (p) {
    var sk = T.silksOf(p), use = sk || T.NEUTRAL_SILKS;
    var a = hexOk(use.colours[0]), b = hexOk(use.colours[1]) || a;
    return { primary: a, accent: b.toLowerCase() === a.toLowerCase() ? textOn(a) : b, text: textOn(a), bg: T.silksBg(use),
      // Just the colours on jockey cards (16 Oct 2026, the owner: no horse name next to the jockey)
      horse: '', words: sk ? sk.words || '' : '', neutral: !sk };
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

  // The shared code's club check: every jockey's one club is 'g1' (club_years: the years a Group 1 was won)
  T.playedFor = function (p, club, year) {
    return !!club && (p.club_years || []).some(function (cy) {
      return cy.club === club && (year == null || (cy.from <= year && year <= cy.to));
    });
  };

  // The look a jockey's cards wear: his or her own (the key is the jockey's id; T.look draws it)
  T.lastClub = function (p) { return p ? p.id : ''; };
  T.slotClub = function (slot) { return T.lastClub(slot.player); };

  /* Legends: retired greats with 30 or more Group 1 wins since 1983 (data/legends.json). They are out of the normal offers
     and come only with a Legends Pick (or a Legend Key) */
  T.LEGENDS = [];
  T.LEGEND_ODDS = { legends: 0.25, immortal: 0 }; // data/legends.json wins once loaded
  T.isImmortal = function (p) { return !!p && p.tier === 'immortal'; };
  // World Legends are 1000TRIES' (World Cup): never here, kept so the shared code finds them
  T.isIntlLegend = function (p) { return !!p && !!p.il; };
  T.WC_IL = [];
  T.markIntlLegends = function () { T.WC_IL = []; return T.WC_IL; };
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

  /* The GOAT (one Shop item for every CAST draft game, 16 Oct 2026, the owner: "THE GOAT IS UNIVERSAL"): here Damien Oliver.
     T.GOAT_SRC: the player the GOAT item brings. A Legend comes as his own GOAT card (T.goatCard: "Name (GOAT)", tier
     'goat', the server's lib/goat.js), never beside his Legend card. T.GOAT_ID: who always wears the goat */
  T.GOAT_SRC = 'legend-damien-oliver';
  T.GOAT_ID = '';
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

  // The surname on the card: the last name, two-word surnames kept whole (Mark Du Plessis), and a jockey known only by
  // initials (A G Clarke) keeps his surname
  T.surname = function (name) {
    var n = String(name).replace(/\s*\([^)]*\)\s*$/, '').trim();
    var parts = n.split(/\s+/);
    if (parts.length > 2 && /^(Du|De|Van|Le|La|Di)$/i.test(parts[parts.length - 2])) return parts.slice(-2).join(' ');
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  };

  T.fmt = function (n) {
    return Number(n).toLocaleString('en-AU', { useGrouping: false }); // no commas in numbers (the owner, 16 Oct 2026)
  };

  T.players = [];
  T.byId = {};

  // World Cup match days are 1000TRIES' only (kept so the shared Daily code finds them)
  T.NAT = null;
  T.loadNat = function () { return Promise.resolve(T.NAT = {}); };
  T.nationsOf = function () { return []; };

  /* Packs. The main one is 'nrl' (the key the shared code uses everywhere). 'vic' is the Spring Carnival Daily's: the same
     jockeys with their Melbourne Group 1 wins only (Flemington, Caulfield, Moonee Valley, Sandown: every Victorian one). wc and nrlw are never on here (kept so the shared mode code finds them) */
  T.DATASETS = {
    nrl: { file: 'data/players.json', target: 550, weight: 8, label: 'Group 1 wins', era: 'Group 1 wins since 1983', only: 'Group 1 wins since 1983', who: 'Group 1' },
    vic: { live: false, file: 'data/vic-players.json', target: 120, weight: 8, label: 'Melbourne Group 1 wins', era: 'Melbourne Group 1 wins since 1983', only: 'Melbourne Group 1 wins only', who: 'Melbourne' },
    wc: { live: false, file: 'data/players.json', target: 200, weight: 4, label: 'wins', era: 'wins', only: 'wins', who: 'Group 1' },
    nrlw: { live: false, file: 'data/players.json', target: 550, weight: 8, label: 'Group 1 wins', era: 'Group 1 wins', only: 'Group 1 wins', who: 'Group 1' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'Group 1 wins';
  T.ERA_LABEL = 'Group 1 wins since 1983';

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
        players.forEach(function (p) { byId[p.id] = p; });
        var pool = { players: players, byId: byId };
        return (d.pool = pool);
      });
    d.loading.catch(function () { d.loading = null; });
    return d.loading;
  };

  // The big winners (top 5% of a pack) for the first offer's 'false hope'. Cached per pack.
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
