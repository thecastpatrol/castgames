/* Racing game data layer (15 Oct 2026, from the CAST draft engine): jockey pack, jurisdiction maps, the card of 8.
   Group 1 wins in Australia and New Zealand since 1983 from breednet.com.au and Wikipedia (CC BY-SA), built by
   ~/cast-dev/racing/tools/make_game_files.py. The engine's field names stay as they are (tries_1998_plus holds the wins,
   club_years the jurisdictions), so the shared code reads them unchanged. */
(function (T) {
  'use strict';

  T.TARGET = 550; // set by the real-engine simulation before launch (T.DATASETS.nrl.target wins once a game starts)
  T.GAME_NAME = 'G1 WINNERS SPINNER'; // the owner's name (16 Oct 2026: "G1s Winners Spinner")
  T.GAME_SLUG = 'g1winners'; // its address on castgames.com.au

  // An 8-race Group 1 card in draft order: 2 sprints, 2 miles, 2 middle distance races, 2 staying races (the owner,
  // 15 Oct 2026). A jockey fills a race if he or she has a Group 1 win at that distance
  T.SLOTS = ['SPR', 'SPR', 'MIL', 'MIL', 'MID', 'MID', 'STY', 'STY'];

  T.POS_NAMES = { SPR: 'Sprint', MIL: 'Mile', MID: 'Middle Distance', STY: 'Staying' };
  // What the spots and chips show. The codes are what the games save, so they never change
  T.POS_SHORT = { SPR: 'SPR', MIL: 'MILE', MID: 'MID', STY: 'STAY' };
  T.POS_RANGE = { SPR: 'Up to 1400m', MIL: '1401 to 1700m', MID: '1701 to 2100m', STY: '2101m and up' };
  T.posLabel = function (code) { return T.POS_SHORT[code] || code; };

  // The six jurisdictions (Group 1 racing in every one from 1983). A jockey rides for every one he or she won a Group 1 in
  T.CLUBS = {
    nsw: { name: 'New South Wales', from: 1983, to: 2026 },
    vic: { name: 'Victoria', from: 1983, to: 2026 },
    qld: { name: 'Queensland', from: 1983, to: 2026 },
    sa: { name: 'South Australia', from: 1983, to: 2026 },
    wa: { name: 'Western Australia', from: 1983, to: 2026 },
    nz: { name: 'New Zealand', from: 1983, to: 2026 }
  };
  T.TEST_SIDES = {};

  T.CLUB_ABBR = { nsw: 'NSW', vic: 'VIC', qld: 'QLD', sa: 'SA', wa: 'WA', nz: 'NZ' };

  // State colours (the owner's list, 15 Oct 2026): NSW sky blue, VIC navy, QLD maroon, SA red, WA black and gold, NZ black
  T.CLUB_COLORS = { nsw: '#6CACE4', vic: '#0B1F4B', qld: '#7A0F2E', sa: '#D2232A', wa: '#161616', nz: '#000000' };
  T.CLUB_SECONDARY = { nsw: '#0B1F4B', vic: '#FFFFFF', qld: '#F3D7DF', sa: '#0B1F4B', wa: '#F2B705', nz: '#C9CED6' };
  T.CLUB_THIRD = {};

  function textOn(hex) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#0B1220' : '#FFFFFF';
  }

  // Everything the UI needs to paint a jurisdiction: strong primary block, accent bar, readable text
  T.club = function (slug) {
    var primary = T.CLUB_COLORS[slug] || '#14432a';
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

  // The distances a jockey can ride: positions_played, falling back to draft_role then position
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

  // Won a Group 1 in that jurisdiction in that year (Team Spin), or in any year when there is no year (a themed Daily)
  T.playedFor = function (p, club, year) {
    return !!club && (p.club_years || []).some(function (cy) {
      return cy.club === club && (year == null || (cy.from <= year && year <= cy.to));
    });
  };

  /* The state a jockey's cards wear (the owner, 16 Oct 2026): the jurisdiction he or she won the most Group 1s in since
     1983 (primary_club; level: the most recent), in every mode. No silks, trainer or owner colours anywhere */
  T.lastClub = function (p) { return p.primary_club; };

  // Colours for a jockey in a race on the card: always the jockey's own state (above), in Team Spin and the Daily too
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

  // No GOAT in the racing game (no GOAT item sold)
  T.GOAT_ID = '';
  T.isGoat = function (p) {
    return !!p && !!T.GOAT_ID && p.id === T.GOAT_ID;
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
    return Number(n).toLocaleString('en-AU');
  };

  T.players = [];
  T.byId = {};

  // World Cup match days are 1000TRIES' only (kept so the shared Daily code finds them)
  T.NAT = null;
  T.loadNat = function () { return Promise.resolve(T.NAT = {}); };
  T.nationsOf = function () { return []; };

  /* Packs. The main one is 'nrl' (the key the shared code uses everywhere). 'vic' is the Spring Carnival Daily's: the same
     jockeys with their Victorian Group 1 wins only. wc and nrlw are never on here (kept so the shared mode code finds them) */
  T.DATASETS = {
    nrl: { file: 'data/players.json', target: 550, weight: 8, label: 'Group 1 wins', era: 'Group 1 wins since 1983', only: 'Group 1 wins since 1983', who: 'Group 1' },
    vic: { live: false, file: 'data/vic-players.json', target: 120, weight: 8, label: 'Victorian Group 1 wins', era: 'Victorian Group 1 wins since 1983', only: 'Victorian Group 1 wins only', who: 'Victorian' },
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
        pool.legendsApplied = true;
      }
      T.useDataset('nrl');
      return pool.players;
    });
  };
})(window.T = window.T || {});
