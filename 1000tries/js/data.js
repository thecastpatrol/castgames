/* 1000TRIES data layer: player pack, club maps, slot template.
   Club names, abbreviations and colours are lifted from the 27-0 app. */
(function (T) {
  'use strict';

  T.TARGET = 1000;

  // Starting 13 in draft order
  T.SLOTS = ['FB', 'W', 'C', 'C', 'W', 'FE', 'HB', 'P', 'HK', 'P', 'SR', 'SR', 'LK'];

  T.POS_NAMES = {
    FB: 'Fullback', W: 'Winger', C: 'Centre', FE: 'Five-Eighth', HB: 'Halfback',
    P: 'Prop', HK: 'Hooker', SR: 'Second Row', LK: 'Lock'
  };

  T.CLUBS = {
    adelaide:       { name: 'Adelaide Rams', from: 1998, to: 1998 },
    balmain:        { name: 'Balmain Tigers', from: 1998, to: 1999 },
    bears:          { name: 'North Sydney Bears', from: 1998, to: 1999 },
    broncos:        { name: 'Brisbane Broncos', from: 1998, to: 2026 },
    bulldogs:       { name: 'Canterbury-Bankstown Bulldogs', from: 1998, to: 2026 },
    cowboys:        { name: 'North Queensland Cowboys', from: 1998, to: 2026 },
    dolphins:       { name: 'Dolphins', from: 2023, to: 2026 },
    dragons:        { name: 'St. George Illawarra Dragons', from: 1999, to: 2026 },
    eels:           { name: 'Parramatta Eels', from: 1998, to: 2026 },
    knights:        { name: 'Newcastle Knights', from: 1998, to: 2026 },
    northerneagles: { name: 'Northern Eagles', from: 2000, to: 2002 },
    panthers:       { name: 'Penrith Panthers', from: 1998, to: 2026 },
    rabbitohs:      { name: 'South Sydney Rabbitohs', from: 1998, to: 2026 },
    raiders:        { name: 'Canberra Raiders', from: 1998, to: 2026 },
    roosters:       { name: 'Sydney Roosters', from: 1998, to: 2026 },
    seaeagles:      { name: 'Manly Warringah Sea Eagles', from: 1998, to: 2026 },
    sharks:         { name: 'Cronulla-Sutherland Sharks', from: 1998, to: 2026 },
    steelers:       { name: 'Illawarra Steelers', from: 1998, to: 1998 },
    stgeorge:       { name: 'St George Dragons', from: 1998, to: 1998 },
    storm:          { name: 'Melbourne Storm', from: 1998, to: 2026 },
    tigers:         { name: 'Wests Tigers', from: 2000, to: 2026 },
    titans:         { name: 'Gold Coast Titans', from: 2007, to: 2026 },
    warriors:       { name: 'NZ Warriors', from: 1998, to: 2026 },
    wmagpies:       { name: 'Wests Magpies', from: 1998, to: 1999 },
    // Clubs only Legends and Immortals played for (before 1998)
    easts:          { name: 'Eastern Suburbs', from: 1908, to: 1994 },
    glebe:          { name: 'Glebe', from: 1908, to: 1929 },
    newtown:        { name: 'Newtown Jets', from: 1908, to: 1983 },
    goldcoast:      { name: 'Gold Coast Seagulls', from: 1988, to: 1995 }
  };
  /* World Cup 200+ (4 Oct 2026): the 13 Test sides, painted like clubs (club_years holds each player's first and last
     Test). Kept out of T.CLUBS, which Team Spin spins through, so its spins and a friend's challenge stay the same */
  T.TEST_SIDES = {
    aus: { name: 'Australia', from: 1908, to: 2026 }, nzl: { name: 'New Zealand', from: 1908, to: 2026 },
    eng: { name: 'England', from: 1904, to: 2026 }, fra: { name: 'France', from: 1934, to: 2026 },
    sam: { name: 'Samoa', from: 1986, to: 2026 }, ton: { name: 'Tonga', from: 1986, to: 2026 },
    fij: { name: 'Fiji', from: 1992, to: 2026 }, png: { name: 'Papua New Guinea', from: 1975, to: 2026 },
    leb: { name: 'Lebanon', from: 1997, to: 2026 }, cok: { name: 'Cook Islands', from: 1986, to: 2026 },
    gbr: { name: 'Great Britain', from: 1908, to: 2019 }, sco: { name: 'Scotland', from: 1995, to: 2026 },
    ita: { name: 'Italy', from: 1995, to: 2026 }
  };

  T.CLUB_ABBR = {
    adelaide: 'RAM', balmain: 'BAL', bears: 'NSB', broncos: 'BRI', bulldogs: 'BUL',
    cowboys: 'NQC', dolphins: 'DOL', dragons: 'SGI', eels: 'PAR', knights: 'NEW',
    northerneagles: 'NEA', panthers: 'PTH', rabbitohs: 'SSR', raiders: 'CBR',
    roosters: 'SYD', seaeagles: 'MAN', sharks: 'CRO', steelers: 'ILL', stgeorge: 'STG',
    storm: 'MEL', tigers: 'WST', titans: 'GCT', warriors: 'NZW', wmagpies: 'WMP',
    easts: 'EST', glebe: 'GLE', newtown: 'NTN', goldcoast: 'GCS',
    aus: 'AUS', nzl: 'NZL', eng: 'ENG', fra: 'FRA', sam: 'SAM', ton: 'TON', fij: 'FIJ', png: 'PNG', leb: 'LEB', cok: 'COK',
    gbr: 'GBR', sco: 'SCO', ita: 'ITA'
  };

  T.CLUB_COLORS = {
    adelaide: '#002D71', balmain: '#F37221', bears: '#CC0000', broncos: '#6B0046',
    bulldogs: '#00468B', cowboys: '#0B233F', dolphins: '#FB141C', dragons: '#D22730',
    eels: '#002D71', knights: '#D22730', northerneagles: '#6B1D45', panthers: '#000000',
    rabbitohs: '#003C1A', raiders: '#36AD2D', roosters: '#012D5C', seaeagles: '#6B1D45',
    sharks: '#0182BB', steelers: '#D22730', stgeorge: '#D22730', storm: '#592B8D',
    tigers: '#F37221', titans: '#00A2E0', warriors: '#000000', wmagpies: '#000000',
    easts: '#012D5C', glebe: '#7A1F2B', newtown: '#1B3A8C', goldcoast: '#0E8C8C',
    // Nations: the badge colours from the owner's World Cup plan (4 Oct 2026)
    aus: '#00843D', nzl: '#000000', eng: '#FFFFFF', fra: '#002395', sam: '#002B7F', ton: '#C10000', fij: '#FFFFFF',
    png: '#CE1126', leb: '#ED1C24', cok: '#FFFFFF', gbr: '#012169', sco: '#0065BD', ita: '#009246'
  };

  T.CLUB_SECONDARY = {
    adelaide: '#FFD700', balmain: '#000000', bears: '#000000', broncos: '#F5A623',
    bulldogs: '#FFFFFF', cowboys: '#C4A84B', dolphins: '#FFFFFF', dragons: '#FFFFFF',
    eels: '#FFD700', knights: '#003087', northerneagles: '#FFFFFF', panthers: '#FFFFFF',
    rabbitohs: '#CC0000', raiders: '#FFFFFF', roosters: '#CC0000', seaeagles: '#FFFFFF',
    sharks: '#000000', steelers: '#003087', stgeorge: '#FFFFFF', storm: '#FFD600',
    tigers: '#000000', titans: '#001F5B', warriors: '#FFFFFF', wmagpies: '#FFFFFF',
    easts: '#CC0000', glebe: '#FFFFFF', newtown: '#FFFFFF', goldcoast: '#F4B223',
    aus: '#FFCD00', nzl: '#FFFFFF', eng: '#CE1124', fra: '#FFFFFF', sam: '#FFFFFF', ton: '#FFFFFF', fij: '#000000',
    png: '#FCD116', leb: '#FFFFFF', cok: '#185818', gbr: '#FFFFFF', sco: '#FFFFFF', ita: '#FFFFFF'
  };
  // A nation's third colour (World Cup 200+): the stripe along the bottom of its badge, so all three show
  T.CLUB_THIRD = {
    aus: '#FFCD00', nzl: '#FFFFFF', eng: '#CE1124', fra: '#ED2939', sam: '#CE1126', ton: '#FFFFFF', fij: '#62B5E5',
    png: '#000000', leb: '#00A651', cok: '#F8D000', gbr: '#C8102E', sco: '#FFFFFF', ita: '#CE2B37'
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

  // Positions a player can fill: positions_played, falling back to draft_role then position
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
    // World Cup 200+ (5 Oct 2026, the owner's call): the side they play for now, else the one they played most Tests for
    if (p.tests && p.primary_club) return (p._last = p.primary_club);
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

  /* Each club's jersey for the Legends and Immortal Pick reveal (8 Oct 2026, the owner: "make the jerseys more accurate"):
     shared with 27-0's Immortal Pick, so the table lives in js/cast-intl.js (CastIntl.JERSEYS) */

  /* Legends and Immortals (1000+ only): the Legends Pick and the rarer Immortal Pick.
     data/legends.json lists them with career premiership tries (NSWRL, ARL, Super League, NRL). None of them
     are in the normal NRL era pool: 'replaces' names the pool players who moved across. */
  T.LEGENDS = [];
  T.LEGEND_ODDS = { legends: 0.25, immortal: 0.08 }; // data/legends.json odds win once loaded
  T.isImmortal = function (p) { return !!p && p.tier === 'immortal'; };
  /* World Legends (World Cup 200+, 8 Oct 2026, the owner's calls; data/wc-legends.json "1000tries", a copy of
     shared/wc-legends.json): greats already in the World Cup pack, with their Test tries. They leave the normal offers
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

  // The GOAT of NRL tryscoring gets his own treatment
  T.GOAT_ID = 'alex-johnston';
  T.isGoat = function (p) {
    return !!p && p.id === T.GOAT_ID;
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
    var parts = n.split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  };

  T.fmt = function (n) {
    return Number(n).toLocaleString('en-AU', { useGrouping: false }); // no commas in numbers (the owner, 16 Oct 2026)
  };

  T.players = [];
  T.byId = {};

  // World Cup match days (4 Oct 2026): the sides each NRL-era player has played a Test for (data/nations-nrl.json, from
  // tools/build_wc.py), so a match day's Daily can deal only that day's Test players
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

  // Player packs. NRL is the default; NRLW has its own players, target and offer weighting.
  // (tries_1998_plus holds each pack's own try count: NRL premiership tries, or NRLW premiership tries.)
  T.DATASETS = {
    nrl:  { file: 'data/players.json', target: 1000, weight: 40, label: 'NRL tries', era: 'NRL era tries', only: 'NRL era tries only', who: 'NRL' },
    // lowCut/lowFactor: players under 2 NRLW tries show up less, and never two in one offer
    nrlw: { live: true, file: 'data/nrlw-players.json', target: 250, weight: 45, lowCut: 2, lowFactor: 0.3, label: 'NRLW tries', era: 'NRLW tries', only: 'NRLW premiership tries only', who: 'NRLW' },
    // World Cup 200+ (4 Oct 2026, the owner's call): senior Test players of the 2026 World Cup sides, Great Britain,
    // Scotland and Italy (tools/build_wc.py), on their Test tries. Since 5 Oct the draft pool is Test tryscorers from 1980
    // on, older greats with 5+ Test tries and the 2026 squads (1865 of 4,674). Its offers' weighting is the owner's call
    // (eased a little on 8 Oct 2026, once the World Legends left the normal offers)
    wc: { file: 'data/wc-players.json', target: 200, weight: 4, lowCut: 2, lowFactor: 0.3, label: 'Test tries', era: 'Test tries', only: 'Senior Test tries only', who: 'Test' }
  };
  T.DATASET = 'nrl';
  T.TRY_LABEL = 'NRL tries';
  T.ERA_LABEL = 'NRL era tries';

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
        if (name !== 'wc') return (d.pool = pool);
        // World Cup 200+: its World Legends first (T.markIntlLegends). Never the pack without them (they'd come in
        // normal offers and the board would hold the game): no list, no pack this time, and the next tap tries again
        return fetch('data/wc-legends.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('data/wc-legends.json ' + r.status); return r.json(); })
          .then(function (j) { T.markIntlLegends(pool, j && j['1000tries']); d.pool = pool; })
          .then(function () {
            // then the tries from every World Cup game counted so far (the server reads NRL.com after each game,
            // config/wcTries). d.wv: how many, saved with each game so the board adds it up the same way
            if (!window.CastAccount || !CastAccount.wcTries) return d.pool;
            return CastAccount.wcTries().then(function (x) { T.addWcTries(d, x.list); return d.pool; }, function () { d.wv = 0; return d.pool; });
          });
      });
    d.loading.catch(function () { d.loading = null; });
    return d.loading;
  };

  // The World Cup games' tries on top of each player's Test tries (lower-case names, like the server's lib/wctries.js)
  T.addWcTries = function (d, list) {
    var add = {}, apps = {};
    (list || []).forEach(function (m) { Object.keys((m && m.s) || {}).forEach(function (n) { add[n.toLowerCase()] = (add[n.toLowerCase()] || 0) + (+m.s[n] || 0); }); });
    // Their Test appearances too (7 Oct 2026, the owner): everyone who took the field (a), less any NRL.com took off (ax),
    // by the side they played for (lib/wctries.js appsOf). Display only: Tests played, each nation's count and the years
    var app = function (m, key, by) {
      Object.keys((m && m[key]) || {}).forEach(function (n) { var k = n.toLowerCase(), o = apps[k] = apps[k] || {}, c = m[key][n] || ''; o[c] = (o[c] || 0) + by; });
    };
    (list || []).forEach(function (m) { app(m, 'a', 1); app(m, 'ax', -1); });
    // World Cup debutants (17 Oct 2026): a scorer in a 2026 squad joins with his squad positions and nation (nw: name ->
    // [nation, positions]), from 0 Test tries, so his World Cup tries below are his total and set his offer weight
    var have = {};
    d.pool.players.forEach(function (p) { have[(p.record_name || p.name).toLowerCase()] = 1; });
    (list || []).forEach(function (m) {
      Object.keys((m && m.nw) || {}).forEach(function (n) {
        var k = n.toLowerCase(), v = m.nw[n] || [], pos = (v[1] || []).filter(function (x) { return typeof x === 'string'; });
        if (have[k] || !pos.length || !(add[k] > 0)) return; // a try NRL.com took back: not in the pack, like every 0
        have[k] = 1;
        var p = { id: 'wc26-' + k.replace(/[^a-z0-9]+/g, '-'), name: n, tries_1998_plus: 0, primary_club: v[0] || '', club_years: [], tests: 0,
          positions_played: pos, draft_role: pos[0], position: pos[0], active: true, career_span: '' };
        var tag = / \([^)]+\)$/.exec(n);
        if (tag) { p.record_name = n; p.name = n.slice(0, tag.index); }
        d.pool.players.push(p);
        d.pool.byId[p.id] = p;
      });
    });
    d.pool.players.forEach(function (p) {
      var k = (p.record_name || p.name).toLowerCase(), a = add[k], o = apps[k];
      if (a) p.tries_1998_plus += a;
      if (!o) return;
      var n = 0;
      Object.keys(o).forEach(function (c) {
        if (o[c] <= 0) return;
        n += o[c];
        if (!c) return; // NRL.com didn't name the side: his Tests only
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

  // Big tryscorers (top 5% of a pack) for the first-offer 'false hope'. Cached per pack.
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
        pool.legendsApplied = true;
      }
      T.useDataset('nrl');
      return pool.players;
    });
  };
})(window.T = window.T || {});
