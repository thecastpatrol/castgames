/* World Cup 8-0 (4 Oct 2026, the owner's call): the men's 2026 Rugby League World Cup, with the player's team in France's
   place in Pool C. Spin a nation, pick from its 2026 squad (data/wc-squads.json), 13 picks like Classic, then the Long Road:
   all five Pool B and C sides, a quarter final, a semi and the final. js/wc-engine.js plays the tournament; this file is the
   screens. Hidden until the owner launches World Cup mode in Admin (or ?castwc=1 for an admin's visit); signed-in players only.
   Classic's wildcards (js/daily-wild.js: Reroll, Remove Player, Substitute) and the 88+ Pick (js/picks.js, 7 Oct 2026:
   one of three squad players rated 88+, or the best at a spot with none); no Run It Back, other Picks, Superstar Keys or Quick Draft here.
   World Champions week (from the owner's launch on final night to 11:59pm Sun 22 Nov) adds the World Champions Pick. */
(function () {
  'use strict';
  if (typeof STATE === 'undefined' || typeof SLOTS === 'undefined' || !window.WC) return;
  var WC = window.WC; // js/wc-engine.js plays the tournament

  // The ten World Cup nations: name, short, nickname, code and badge colours (c3: the stripe), as both games show them
  var NATIONS = {
    aus: ['Australia', 'Australia', 'Kangaroos', 'AUS', '#00843D', '#FFCD00', '#FFCD00'],
    nzl: ['New Zealand', 'New Zealand', 'Kiwis', 'NZL', '#000000', '#FFFFFF', '#FFFFFF'],
    eng: ['England', 'England', 'England', 'ENG', '#FFFFFF', '#CE1124', '#CE1124'],
    fra: ['France', 'France', 'France', 'FRA', '#002395', '#FFFFFF', '#ED2939'],
    sam: ['Samoa', 'Samoa', 'Toa Samoa', 'SAM', '#002B7F', '#FFFFFF', '#CE1126'],
    ton: ['Tonga', 'Tonga', 'Tonga', 'TON', '#C10000', '#FFFFFF', '#FFFFFF'],
    fij: ['Fiji', 'Fiji', 'Fiji Bati', 'FIJ', '#FFFFFF', '#000000', '#62B5E5'],
    png: ['Papua New Guinea', 'PNG', 'Kumuls', 'PNG', '#CE1126', '#FCD116', '#000000'],
    leb: ['Lebanon', 'Lebanon', 'Cedars', 'LEB', '#ED1C24', '#FFFFFF', '#00A651'],
    cok: ['Cook Islands', 'Cook Islands', 'Cook Islands', 'COK', '#FFFFFF', '#185818', '#F8D000']
  };
  var KEYS = Object.keys(NATIONS);
  // Spins and squad lists name the nation like a club (CLUBS[cid].name). from 9999 to 0: never in a Classic spin
  KEYS.forEach(function (k) {
    var n = NATIONS[k];
    CLUBS[k] = { name: n[0], from: 9999, to: 0, wc: true };
    CLUB_COLORS[k] = n[4]; CLUB_SECONDARY[k] = n[5]; CLUB_ABBR[k] = n[3];
  });
  // World Legends (8 Oct 2026): Great Britain's greats wear its look and come up in England's spins. GB isn't a
  // World Cup side, so it is never a spin of its own
  var IL_NATIONS = { gbr: ['Great Britain', 'Great Britain', 'Lions', 'GBR', '#FFFFFF', '#00247D', '#C8102E'] };
  Object.keys(IL_NATIONS).forEach(function (k) {
    var n = IL_NATIONS[k];
    CLUBS[k] = { name: n[0], from: 9999, to: 0, wc: true };
    CLUB_COLORS[k] = n[4]; CLUB_SECONDARY[k] = n[5]; CLUB_ABBR[k] = n[3];
  });
  var STAGE_RESULT = ['group', 'quarter', 'semi', 'final', 'champions'];
  var STAGE_WORD = ['Out in the Pool', 'Lost the Quarter Final', 'Lost the Semi Final', 'Lost the Final', 'World Champions'];

  function acct() { return window.CastAccount || null; }
  function on() { var A = acct(); return !!(A && A.wcLive && A.wcLive()); }
  function signedIn() { var A = acct(); return !!(A && A.isSignedIn && A.isSignedIn()); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function track(name, p) { if (typeof gtag !== 'undefined') gtag('event', name, p || {}); }
  function isWc() { return typeof STATE !== 'undefined' && STATE && STATE.gameMode === 'wc'; }
  var SYD = window.Intl && Intl.DateTimeFormat ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }) : null;
  function today() { return SYD ? SYD.format(new Date()) : new Date().toISOString().slice(0, 10); }
  // A side's badge. The big ones (match card, full time, the draw) carry the nation's look with the code in a pill;
  // the small ones (the road, tables) keep flat colours so the codes stay readable
  /* The player's side (7 Oct 2026, the owner: "change to the users default team or profile picture they have"): their
     photo or creator logo, else their club's colours and letters, else YOU */
  function myBadge() { var A = acct(); return A && A.myBadge ? A.myBadge() : null; }
  function badge(k, cls) {
    var n = NATIONS[k];
    if (!n) {
      var me = myBadge();
      if (me && me.img) return '<span class="wc-badge is-photo ' + (cls || '') + '"><img src="' + esc(me.img) + '" alt=""></span>';
      if (me && me.abbr) return '<span class="wc-badge ' + (cls || '') + '" style="--n1:' + esc(me.c1) + ';--n2:' + esc(me.c2) + ';--n3:' + esc(me.c3 || me.c1) + '" title="' + esc(me.name) + '">' + esc(me.abbr) + '</span>';
      return '<span class="wc-badge ' + (cls || '') + '" style="--n1:#1a1a2a;--n2:#fff;--n3:#1a1a2a">YOU</span>';
    }
    var lk = (cls || '').indexOf('wc-badge-xl') >= 0 ? look(k, 64, 40, 2) : '';
    return '<span class="wc-badge ' + (cls || '') + (lk ? ' has-look' : '') + '" style="--n1:' + n[4] + ';--n2:' + n[5] + ';--n3:' + n[6] + '">' +
      (lk ? lk + '<span class="wc-code">' + n[3] + '</span>' : n[3]) + '</span>';
  }
  /* Nation looks (5 Oct 2026, the owner's calls; js/cast-nations.js draws them): the spinner, the pitch tiles (faint),
     the big plates and the home card strip */
  var NICK = { aus: 'Kangaroos', nzl: 'Kiwis', eng: 'Three Lions', fra: 'Les Chanticleers', sam: 'Toa Samoa', ton: 'Mate Ma\'a Tonga', fij: 'Bati', png: 'Kumuls', leb: 'Cedars', cok: 'Aitu' };
  function look(k, w, h, level) {
    var N = window.CastNations;
    return N && N.has(k) ? '<span class="wc-look" aria-hidden="true">' + N.svg(k, w, h, level ? { level: level } : null) + '</span>' : '';
  }
  function nameOf(k) { return k === 'you' ? myName() : NATIONS[k] ? NATIONS[k][1] : k; }
  // A side in a sentence ('lost the final to the Kangaroos'): nicknames for some, 'the' where it belongs
  var SIDE = { aus: 'the Kangaroos', nzl: 'the Kiwis', png: 'the Kumuls', leb: 'the Cedars', cok: 'the Cook Islands' };
  function side(k) { return SIDE[k] || nameOf(k); }
  function myName() { return typeof myTeam === 'function' ? myTeam() : (STATE.teamName || 'My Team'); }

  /* ---------- The squads (data/wc-squads.json) ---------- */
  var squads = null, loading = null, kickers = {}, fgOver = {};
  function load() {
    if (squads) return Promise.resolve(squads);
    if (loading) return loading;
    loading = fetch('data/wc-squads.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('wc squads ' + r.status);
      return r.json();
    }).then(function (j) {
      squads = j.nations || {};
      kickers = j.kickers || {};
      fgOver = j.fieldGoal || {};
      if (WC.setSquads) WC.setSquads(j);
      return loadLegends().then(function () { return squads; });
    }, function (e) { loading = null; throw e; });
    return loading;
  }
  /* World Legends (8 Oct 2026, the owner's calls; data/wc-legends.json "270", a copy of shared/wc-legends.json):
     retired greats on their own World Cup ratings (Classic never changes), in their nation's look with gold edges. Now and
     then a free one turns up in a nation's spin (below), at most one a World Cup; the rest come with an International
     Legend Pick (js/picks.js). None loaded: World Cup plays on without them */
  var legends = [];
  function loadLegends() {
    return fetch('data/wc-legends.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      legends = ((j && j['270']) || []).map(function (e) {
        return { name: e.name, positions: (e.positions || []).slice(), rating: e.rating, club: e.nation, also: e.also || [], yf: 2026, yt: 2026, year: 2026, il: 1, line: e.line || '', kick: e.kick || 0 };
      });
    }, function () { legends = []; });
  }
  function legendOf(name) { for (var i = 0; i < legends.length; i++) if (legends[i].name === name) return legends[i]; return null; }
  // For js/picks.js (the World Legend Pick): every World Legend, as a player to choose
  window.cpIntlLegends = function () { return legends.slice(); };
  /* World Cup Team of the Week (15 Oct 2026, the owner's BUILD IT; published by an admin, js/cast-account.js totw): this
     week's 13 come up boosted in their nation's spins, in World Cup blue (p.tw: the boost, p.twId: the week). Free, no cap.
     raw: everyone at his own rating (the 88+ Pick goes on real ratings) */
  function totwBoosts() {
    var A = acct(), w = A && A.totw ? A.totw() : null, m = null;
    if (w && Array.isArray(w.set)) { m = { id: w.id }; w.set.forEach(function (e) { m[e.n] = e.b; }); }
    return m;
  }
  /* World Champions (15 Oct 2026, the owner's calls; js/cast-account.js wch, js/cast-wch.js; the server's lib/wch.js has the
     same rules): while it runs, the World Cup final winner's squad come up boosted in their nation's spins at 95+ (his own
     rating if it's higher) and the Player of the Final at 99, on premium World Cup blue foil (p.ch: 'champ' or 'potf'; p.cht:
     the trophy, for a champion). Cap per 13 from spins: one, and none once the CAST Pass member's free World Champions
     Pick is used (STATE.__wchf). Picks (js/picks.js) are on top. A champion's boost replaces his Team of the Week boost: the
     higher rating, never both */
  function wchNow() { var A = acct(); return A && A.wch ? A.wch() : null; }
  function wchTier(w, name, k) { return !w ? '' : name === w.potf ? 'potf' : k === w.nation ? 'champ' : ''; }
  function wchRating(own, t) { return t === 'potf' ? 99 : Math.max(95, own); }
  // Champions in the 13 from spins (a Pick's are marked src 'C')
  function wchFromSpins() { return (STATE.team || []).filter(function (p) { return p && p.ch && p.src !== 'C'; }).length; }
  function wchRoom() { return !STATE.__wchf && wchFromSpins() < 1; }
  // A nation's squad as 27-0 players (the same shape getSquadForClubYear gives), best first. Ratings floor at 67 like Classic
  function squadOf(k, raw) {
    var s = squads && squads[k];
    if (!s) return [];
    var tw = raw ? null : totwBoosts(), w = raw || !isWc() ? null : wchNow(), room = !!w && wchRoom();
    return (s.players || []).map(function (r) {
      var own = Math.max(67, Math.round(r[2] || 67)), p = { name: r[0], positions: (r[1] || []).slice(0, 2), rating: own, club: k, yf: 2026, yt: 2026, year: 2026, wcClub: r[3] || '' };
      var b = tw && Object.prototype.hasOwnProperty.call(tw, r[0]) ? tw[r[0]] : 0;
      if (b > 0) { p.rating = Math.min(99, p.rating + b); p.tw = b; p.twId = tw.id; }
      var t = room ? wchTier(w, r[0], k) : '';
      if (t) { p.rating = Math.max(wchRating(own, t), p.rating); p.ch = t; p.cht = k === w.nation ? 1 : 0; delete p.tw; delete p.twId; }
      return p;
    }).sort(function (a, b) { return b.rating - a.rating; });
  }
  // For js/picks.js (the World Champions Pick): every champion and the Player of the Final, boosted, as players to choose
  window.cpWchRoster = function () {
    var w = wchNow();
    if (!w || !squads) return [];
    var out = [];
    KEYS.forEach(function (k) {
      ((squads[k] || {}).players || []).forEach(function (r) {
        var t = wchTier(w, r[0], k);
        if (t) out.push({ name: r[0], positions: (r[1] || []).slice(0, 2), rating: wchRating(Math.max(67, Math.round(r[2] || 67)), t), club: k, year: 2026, ch: t, cht: k === w.nation ? 1 : 0 });
      });
    });
    return out;
  };
  // A champion in the 13 from a spin? (js/picks.js then uses a bought World Champions Pick, never the free one)
  window.cpWchSpinIn = function () { return isWc() && wchFromSpins() > 0; };

  /* ---------- The kickers (data/wc-squads.json, 7 Oct 2026, the owner: "Valentine Holmes goal 2 points when you play
     Cook Islands or missed goal after tries", field goals by "the FE or HALFBACK usually") ---------- */
  function takenNames() { return (STATE.team || []).filter(Boolean).map(function (p) { return p.name; }); }
  // A listed kicker's [level (1 top, 2 good), place in the nation's list], or null
  function listed(name) {
    for (var k in kickers) { var l = kickers[k] || []; for (var j = 0; j < l.length; j++) if (l[j][0] === name) return [l[j][1] === 1 ? 1 : 2, j]; }
    var lg = legendOf(name); // a World Legend who kicked goals (data/wc-legends.json "kick")
    return lg && lg.kick ? [lg.kick === 1 ? 1 : 2, 0] : null;
  }
  // The best listed kicker among some players (top level first, then the order they're listed), or null
  function bestKicker(list) {
    var best = null;
    list.forEach(function (p) { var l = p && listed(p.name); if (l && (!best || l[0] < best.l[0] || (l[0] === best.l[0] && l[1] < best.l[1]))) best = { p: p, l: l }; });
    return best;
  }
  function myThirteen() { return SLOTS.filter(function (s) { return STATE.team && STATE.team[s.i]; }).map(function (s) { return { p: STATE.team[s.i], type: s.type }; }); }
  var KICK_ORDER = ['HB', 'FE', 'FB', 'HK', 'C', 'W', 'LK', 'SR', 'P'];
  // The player's goal kicker ({ name, level }): their best listed one, else their halfback (then five-eighth, fullback...)
  function myKicker() {
    var mine = myThirteen(), b = bestKicker(mine.map(function (x) { return x.p; }));
    if (b) return { name: b.p.name, level: b.l[0] };
    for (var i = 0; i < KICK_ORDER.length; i++) for (var j = 0; j < mine.length; j++) if (mine[j].type === KICK_ORDER[i]) return { name: mine[j].p.name, level: 0 };
    return null;
  }
  // A nation's halves (its best halfback and five-eighth), from those not in the player's 13
  function nationHalves(k) {
    var taken = takenNames(), sq = squadOf(k, true).filter(function (p) { return taken.indexOf(p.name) < 0; });
    var first = function (pos) { return sq.filter(function (p) { return p.positions[0] === pos; })[0]; };
    var out = [first('HB'), first('FE')].filter(Boolean);
    sq.forEach(function (p) { if (out.length < 2 && out.indexOf(p) < 0 && (p.positions[0] === 'HB' || p.positions[0] === 'FE')) out.push(p); });
    return out;
  }
  // Of the halves: a listed kicker first, else the better rated
  function halfFor(halves) {
    var b = bestKicker(halves);
    if (b) return b.p.name;
    var h = halves.slice().sort(function (a, c) { return (c.rating || 0) - (a.rating || 0); })[0];
    return h ? h.name : '';
  }
  // Each side's goal kicker and field goal kicker, by name
  function kickerFor(k) {
    if (k === 'you') { var m = myKicker(); return m ? m.name : ''; }
    var n = WC.nationKicker ? WC.nationKicker(k, takenNames()) : null;
    return n ? n.name : halfFor(nationHalves(k));
  }
  function fgKickerFor(k) {
    if (k === 'you') return halfFor(myThirteen().filter(function (x) { return x.type === 'HB' || x.type === 'FE'; }).map(function (x) { return x.p; })) || kickerFor('you');
    var o = fgOver[k];
    if (o && takenNames().indexOf(o) < 0) return o;
    return halfFor(nationHalves(k)) || kickerFor(k);
  }

  // The 88+ Pick's stars (js/picks.js, the World Cup Pick until 8 Oct 2026): every squad player rated 88 or more, and
  // nobody under (the owner, 8 Oct 2026 late: the name has to be true; Tom Trbojevic on the wing and Jahrome Hughes 88
  // cover every spot, tools/build_wc_squads.py)
  var WCP_MIN = 88;
  window.cpWcStars = function () {
    var all = KEYS.reduce(function (a, k) { return a.concat(squadOf(k, true)); }, []);
    return all.filter(function (p) { return p.rating >= WCP_MIN; });
  };

  /* ---------- Spins: a nation and its squad, in World Cup mode only ---------- */
  var origPool = window.getSpinPool;
  window.getSpinPool = function () {
    if (!isWc()) return origPool.apply(this, arguments);
    var list = KEYS.filter(function (k) { return squadOf(k).some(function (p) { return !STATE.takenNames.has(p.name); }); });
    // A reroll (a spin again with nothing picked from this one) never lands on the same nation (11 Oct 2026, the owner:
    // "re rolled PNG and got PNG"), unless it's the only one left with players
    var sp = STATE.currentSpin, again = sp && sp.cid && STATE.__wcAgain;
    var other = again ? list.filter(function (k) { return k !== sp.cid; }) : list;
    if (other.length) list = other;
    return (list.length ? list : KEYS).map(function (k) { return { cid: k, year: 2026 }; });
  };
  var origSquad = window.getSquadForClubYear;
  window.getSquadForClubYear = function (cid, year) {
    if (NATIONS[cid] && isWc()) return squadOf(cid);
    return origSquad.apply(this, arguments);
  };

  /* The free World Legend: once his pick comes, the next spin of a nation he played for (Great Britain's for
     England) that has an open spot he plays puts him at the top of its squad, after the World Legend reveal */
  var IL_NATURAL = 1 / 3; // the owner, 9 Oct 2026
  // A player's first World Cup game always has a free World Legend (9 Oct 2026, the owner), marked on this device for their
  // account once he has been shown (a game left before he came keeps the promise for the next one)
  function ilFirstKey() { var u = window.CastAccount && window.CastAccount.uid ? window.CastAccount.uid() : ''; return 'wc_il_first' + (u ? '_' + u : ''); }
  function ilFirstSeen() { try { return !!localStorage.getItem(ilFirstKey()); } catch (e) { return true; } }
  function ilFirstDone() { try { localStorage.setItem(ilFirstKey(), '1'); } catch (e) { /* storage blocked */ } }
  // His own nation's spin only (11 Oct 2026, the owner: Willie Mason, labelled Tonga, turned up on an Australia spin); Great
  // Britain's legends on England's
  function ilFor(p, k) { return p.club === k || (p.club === 'gbr' && k === 'eng'); }
  function posWords(p) { var W = { FB: 'Fullback', W: 'Wing', C: 'Centre', FE: 'Five-Eighth', HB: 'Halfback', HK: 'Hooker', P: 'Prop', SR: 'Second Row', LK: 'Lock' }; return p.positions.map(function (x) { return W[x] || x; }).join('/'); }
  // Is this spin a reroll? (taken before the spin clears spinPickedThisSpin; read by getSpinPool above)
  wrap('finalSpin', function (orig, args) {
    STATE.__wcAgain = isWc() && !!(STATE.currentSpin && STATE.currentSpin.cid) && !STATE.spinPickedThisSpin;
    try { return orig.apply(this, args); } finally { STATE.__wcAgain = false; }
  });
  wrap('finalSpin', function (orig, args) {
    var out = orig.apply(this, args), n = STATE.__il, sp = STATE.currentSpin;
    if (!isWc() || !n || n.shown || !sp || typeof slotsFilledCount !== 'function' || slotsFilledCount() < n.at) return out;
    var fit = legends.filter(function (p) { return ilFor(p, sp.cid) && !STATE.takenNames.has(p.name) && getAvailableSlotsForPlayer(p).length > 0; });
    if (!fit.length) return out;
    var lg = Object.assign({}, fit[Math.floor(Math.random() * fit.length)]);
    n.shown = lg.name;
    ilFirstDone();
    sp.players = [lg].concat(sp.players);
    track('ileg_natural_shown', { nation: sp.cid, player: lg.name });
    var show = function () { if (STATE.currentSpin === sp) displaySpin(sp.cid, sp.year, sp.players); };
    if (window.CastIntl && window.CastIntl.reveal) window.CastIntl.reveal({ reels: [{ nation: lg.club, name: lg.name, sub: posWords(lg) + ' · ' + lg.rating }], kicker: 'World Legend', done: show });
    else show();
    return out;
  });
  // Taken: no walkout, his reveal was the moment (9 Oct 2026, the owner: "that extra flash is not necessary")
  // A World Champion into the 13 (from a spin; a Pick unlocks it in js/picks.js): the World Champions trophy
  wrap('placePlayer', function (orig, args) {
    var p = args[0], out = orig.apply(this, args);
    if (isWc() && p && p.ch && !STATE.__qd) { var A = acct(); if (A && A.unlock) A.unlock(['wch26']); }
    return out;
  });
  wrap('placePlayer', function (orig, args) {
    var p = args[0], out = orig.apply(this, args);
    if (isWc() && p && p.il && STATE.__il && STATE.__il.shown === p.name && !STATE.__il.taken) {
      STATE.__il.taken = true;
      track('ileg_natural_taken', { player: p.name });
    }
    return out;
  });

  /* ---------- Starting: World Cup is its own mode on top of Classic's draft ---------- */
  function wrap(name, fn) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () { return fn.call(this, orig, arguments); };
  }
  wrap('selectMode', function (orig, args) {
    if (args[0] !== 'wc') return orig.apply(this, args);
    var out = orig.call(this, 'classic'); // Classic's set-up (and Hard switched off)
    if (on()) STATE.gameMode = 'wc'; // not launched (a stray ?play=wc): Classic stays picked
    return out;
  });
  wrap('startSelectedMode', function (orig, args) {
    if (!isWc() || (window.CastDaily && CastDaily.isActive && CastDaily.isActive())) return orig.apply(this, args);
    start();
  });
  // The draft's player list as the page first draws it ("Spin to Select a Player"), for a new World Cup
  var PS0 = (document.getElementById('playerSection') || {}).innerHTML || '';
  wrap('startGame', function (orig, args) {
    var wc = isWc();
    if (wc) { stopAuto(); stopLive(); T = null; } // Play Again: the last World Cup's numbers never reach the new 13
    var out = orig.apply(this, args);
    // Play Again from a finished World Cup comes straight here, around Classic's resetGame (7 Oct 2026: Spin stayed
    // switched off from the last draft's 13th pick, so it did nothing): Spin on, and no player list from the last spin
    if (wc) {
      var spinB = document.getElementById('spinBtn'), list = document.getElementById('playerSection');
      if (spinB) spinB.disabled = false;
      if (list && PS0) list.innerHTML = PS0;
    }
    if (wc && !(window.CastDaily && CastDaily.isActive && CastDaily.isActive())) {
      STATE.gameMode = 'wc';
      STATE.showRatings = true;
      STATE.yearFrom = 2026; STATE.yearTo = 2026;
      document.body.classList.add('cp-wc');
    } else document.body.classList.remove('cp-wc');
    // The spin: every World Cup squad is 2026, so it shows the nation alone (css/theme.css hides the season), beside
    // the Spin button, and says what it's for until the first spin
    var lbl = document.getElementById('spinClubLbl'), val = document.getElementById('spinClubVal'), sl = document.getElementById('spinClubSlot');
    var inWc = document.body.classList.contains('cp-wc');
    if (lbl) lbl.textContent = inWc ? 'Nation' : 'Club';
    clearLook();
    if (inWc && val) { val.textContent = 'Spin a Nation'; if (sl) sl.classList.add('is-empty'); }
    var sb = document.getElementById('spinBtn');
    if (inWc && sb && !sb.disabled) sb.textContent = '🎰 SPIN'; // short for the narrow button (Classic's says it after its first spin too)
    return out;
  });
  // The spinner: the nation's look fills the box, each flash of a spin too, the name in a pill with its nickname
  function paintLook(k) {
    var slot = document.getElementById('spinClubSlot'), val = document.getElementById('spinClubVal'), N = window.CastNations;
    if (!slot || !N) return;
    var w = Math.round(slot.clientWidth) || 232, h = Math.round(slot.clientHeight) || 78, id = k + ' ' + w + 'x' + h, layer = slot.querySelector('.wc-look');
    if (!layer) { layer = document.createElement('span'); layer.className = 'wc-look'; layer.setAttribute('aria-hidden', 'true'); slot.insertBefore(layer, slot.firstChild); }
    if (layer.getAttribute('data-k') !== id) { layer.innerHTML = N.svg(k, w, h); layer.setAttribute('data-k', id); }
    slot.classList.add('has-look'); slot.classList.remove('is-empty');
    slot.setAttribute('data-nation', k);
    if (val) val.setAttribute('data-nick', NICK[k] || '');
  }
  function clearLook() {
    var slot = document.getElementById('spinClubSlot'), val = document.getElementById('spinClubVal');
    if (!slot) return;
    var layer = slot.querySelector('.wc-look');
    if (layer) layer.remove();
    slot.classList.remove('has-look', 'is-empty');
    slot.removeAttribute('data-nation');
    if (val) val.removeAttribute('data-nick');
  }
  /* A spin on show is drawn again with today's champion boosts (World Champions): one taken, or the free Pick used, and
     the rest of that nation's champions show at their own ratings; one taken out of the 13, and they're boosted again */
  wrap('displaySpin', function (orig, args) {
    var cid = args[0], players = args[2];
    if (isWc() && NATIONS[cid] && Array.isArray(players) && wchNow()) {
      var fresh = {};
      squadOf(cid).forEach(function (p) { fresh[p.name] = p; });
      players = players.map(function (p) { return p && !p.il && fresh[p.name] ? fresh[p.name] : p; });
      if (STATE.currentSpin && STATE.currentSpin.cid === cid && STATE.currentSpin.players === args[2]) STATE.currentSpin.players = players;
      return orig.call(this, cid, args[1], players);
    }
    return orig.apply(this, args);
  });
  wrap('_applyClubColor', function (orig, args) {
    var out = orig.apply(this, args);
    if (isWc() && NATIONS[args[0]]) paintLook(args[0]); else clearLook();
    return out;
  });
  wrap('_resetClubColor', function (orig, args) { clearLook(); return orig.apply(this, args); });
  // Pitch tiles: each World Cup player's tile in its nation's look, full colour, on the look's own main colour (the name
  // sits in a dark box: css/theme.css)
  wrap('renderField', function (orig, args) {
    var out = orig.apply(this, args), N = window.CastNations;
    if (isWc() && N) {
      Array.prototype.forEach.call(document.querySelectorAll('#nrlField .fpos[data-slot]'), function (el) {
        var p = STATE.team[+el.getAttribute('data-slot')], c = el.querySelector('.fpos-circle.fp-filled');
        if (!c || !p || !(NATIONS[p.club] || (p.il && N.has(p.club))) || c.querySelector('.wc-look')) return;
        // World Champions: premium World Cup blue foil, the trophy (and the medal) after his name
        if (p.ch) {
          c.classList.add('fp-wch'); c.classList.toggle('fp-wch-medal', p.ch === 'potf'); c.classList.remove('fp-light');
          var nm = c.querySelector('.fpos-pname');
          if (nm && !nm.querySelector('.fp-wch-mk')) nm.insertAdjacentHTML('beforeend', '<span class="fp-wch-mk">' + (p.ch === 'potf' ? '&#x1F3C5;' : '') + (p.cht ? '&#x1F3C6;' : '') + '</span>');
          return;
        }
        if (p.tw) { c.classList.add('fp-tw'); c.classList.remove('fp-light'); return; } // Team of the Week: World Cup blue, not his nation's look (the owner, 15 Oct 2026)
        c.insertAdjacentHTML('afterbegin', look(p.club, c.clientWidth || 84, c.clientHeight || 56, 2)); // stars, no emblems
        c.style.setProperty('--wc-field', N.field(p.club));
        c.classList.add('has-look');
        if (p.il) c.classList.add('fp-il'); // a World Legend: his nation's look, with the gold edge
      });
      // the name's box takes a little room: long names shrink to fit again (the game's own fitting)
      if (typeof window.scaleFieldNames === 'function') window.scaleFieldNames(document.getElementById('nrlField'));
    }
    return out;
  });
  // World Cup: signed in, and the squads loaded, then Classic's draft with nation spins
  function start() {
    if (!on()) return;
    var A = acct();
    // A guest gets one free World Cup a day, which uses one of their free games (12 Oct 2026, the owner; CastAccount.wcGate
    // counts it); after that it waits for a sign-in, then their saved World Cup, if any
    if (A && A.wcGate && !A.wcGate(function () { window.wcHome(); }, 'wc')) return;
    if (A && !A.wcGate && A.requireSignIn && !A.requireSignIn(function () { window.wcHome(); }, 'wc', 'wc')) return;
    load().then(function () {
      track('World_Cup_Mode', {});
      track('new_season_started', { event_category: 'game' });
      STATE.gameMode = 'wc';
      startGame();
      // World Legends: now and then a free one is due after 1 to 6 picks (STATE.__il; early, so his spots are still open;
      // always in a player's first World Cup game); Picks used (STATE.__ileg)
      STATE.__il = legends.length && (Math.random() < IL_NATURAL || !ilFirstSeen()) ? { at: 1 + Math.floor(Math.random() * 6), shown: null } : null;
      STATE.__ileg = 0;
      STATE.__wch = 0; STATE.__wchf = 0; // World Champions Picks used: bought ones, and the free one
      // The wildcard bar from the start, as Classic draws it (js/daily-wild.js redraws it after startSelectedMode, which
      // World Cup goes around): the 88+ Pick shows before the first spin, and nothing from the last game stays on it
      if (window.cpWildRender) setTimeout(function () { window.cpWildRender(true); }, 50);
    }, function () { alert270('The World Cup squads did not load. Check your connection and try again.'); });
  }
  function alert270(msg) {
    var d = document.createElement('div');
    d.className = 'wc-toast'; d.setAttribute('role', 'alert'); d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 4200);
  }

  /* ---------- Squad Complete: the World Cup at a glance (5 Oct 2026, the owner's calls) ----------
     The road (each game's side and date, no venues), both pool tables at 0-0 (with each side's rating, so the player
     can see who's strong) and the knockouts: who plays who. */
  var KO_WORD = { qf: 'Quarter Final', sf: 'Semi Final', final: 'The Final' };
  var KO_SHORT = { qf: 'QF', sf: 'SF', final: 'F' };
  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function strengthOf(k) { return k === 'you' ? (T && T === STATE.wc ? T.rating : (typeof calcTeamRating === 'function' ? calcTeamRating() : '')) : WC.strength(k); }
  function roadChips(state) {
    var road = WC.road();
    return '<ol class="wc-chips">' + road.map(function (r, i) {
      var st = state ? state(r, i) : { opp: r.opp };
      var b = st.opp ? badge(st.opp) : '<span class="wc-badge is-ko">' + KO_SHORT[r.kind] + '</span>';
      return '<li class="wc-chip' + (st.cls ? ' ' + st.cls : '') + '">' + b + '<small>' + (st.sub || esc(r.date.replace(/^\w{3} /, ''))) + '</small></li>';
    }).join('') + '</ol>';
  }
  function poolTable(rows, opts) {
    opts = opts || {};
    return '<table class="wc-table' + (opts.cut ? ' has-cut' : '') + '"><thead><tr><th>#</th><th>Team</th>' + (opts.rtg ? '<th>Rtg</th>' : '') + '<th>P</th><th>W</th><th>L</th><th>Diff</th></tr></thead><tbody>' +
      rows.map(function (t, i) {
        var d = t.pf - t.pa;
        return '<tr class="' + (t.key === 'you' ? 'is-me' : '') + (opts.cut && i < 4 ? ' is-in' : '') + (opts.cut && i === 3 ? ' is-cut' : '') + '"><td>' + (i + 1) + '</td><td class="wc-tm"><span class="wc-tm-in">' + badge(t.key) + '<span>' + esc(nameOf(t.key)) + '</span></span></td>' +
          (opts.rtg ? '<td>' + strengthOf(t.key) + '</td>' : '') + '<td>' + t.p + '</td><td>' + t.w + '</td><td>' + t.l + '</td><td>' + (d > 0 ? '+' : '') + d + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  // Before a ball is kicked: every side 0-0, the strongest first
  function zeroRows(keys) {
    return keys.map(function (k) { return { key: k, p: 0, w: 0, l: 0, pf: 0, pa: 0 }; }).sort(function (a, b) { return strengthOf(b.key) - strengthOf(a.key); });
  }
  // Who plays who, by semi final: the two quarter finals in each box meet in that semi (SF1 is QF1 v QF4, SF2 is QF2 v QF3)
  function koPreview() {
    var q = function (a, b) { return '<div class="wc-kp-q"><span>' + a + '</span><i>v</i><span>' + b + '</span></div>'; };
    return '<div class="wc-kp"><div class="wc-kp-sf"><div class="wc-kp-h">Semi Final 1</div>' + q('1st Pool A', '4th Pools B and C') + q('2nd Pools B and C', '3rd Pool A') + '</div>' +
      '<div class="wc-kp-sf"><div class="wc-kp-h">Semi Final 2</div>' + q('2nd Pool A', '3rd Pools B and C') + q('1st Pools B and C', '4th Pool A') + '</div>' +
      '<div class="wc-kp-f">The Final <small>Sun 15 Nov</small></div></div><p class="wc-kp-note">Quarter finals on Wed 4 Nov, and your semi final on Sun 8 Nov. The two winners in each box meet in that semi final.</p>';
  }
  function previewHtml() {
    return '<div class="wc-road-h">Your Road to the Final</div>' + roadChips() +
      '<div class="wc-sub-h">Pools B and C <small>Top 4 Go Through</small></div>' + poolTable(zeroRows(['you', 'png', 'ton', 'sam', 'eng', 'leb']), { cut: true, rtg: true }) +
      '<div class="wc-sub-h">Pool A <small>Top 4 Go Through</small></div>' + poolTable(zeroRows(['aus', 'nzl', 'fij', 'cok']), { rtg: true }) +
      '<div class="wc-sub-h">The Knockouts</div>' + koPreview();
  }
  wrap('showSquadComplete', function (orig, args) {
    var out = orig.apply(this, args);
    var wc = isWc(), odds = document.querySelector('#squad-complete .odds-card'), go = document.querySelector('#squad-complete .btn[onclick="startSeason()"]');
    var box = document.getElementById('wcRoad'), btn = document.getElementById('wcStartBtn');
    if (odds) odds.hidden = wc;
    if (go) go.hidden = wc;
    if (box) { box.hidden = !wc; if (wc) box.innerHTML = previewHtml(); }
    if (btn) btn.hidden = !wc;
    var title = document.querySelector('#squad-complete .header-title p');
    if (title) title.textContent = wc ? 'Squad Complete: Your World Cup 13 Is Set' : 'Squad Complete: Your Best Starting 13 Is Set';
    return out;
  });

  /* ---------- Match days (5 Oct 2026, the owner's calls) ----------
     One game at a time on a big match card. In the pools the player picks Watch It (try by try, with the minutes and the
     scorers) or Quick Result, remembered on this device; in the knockouts the card plays it through by default, with a
     Skip. Before each game: what's at stake (only what holds: js/wc-engine.js stakes), the other side's rating and form.
     At full time: the score, the try scorers and the Player of the Match. Always on screen: the Pools B and C ladder after
     each round (the top 4 line), the other scores that round, and Pool A after the real weekends (rounds 1, 3 and 5).
     Then the knockouts: the draw, a lead-in for each game, the bracket with the player's path lit and the other results as
     they happen, and the Champions moment in World Cup blue and white. The results are the engine's, decided at the
     start; nothing here changes them. */
  var T = null, autoTimer = null, liveTimer = null, LS_WATCH = 'wc_watch';
  function pref() { try { return localStorage.getItem(LS_WATCH) === 'quick' ? 'quick' : 'watch'; } catch (e) { return 'watch'; } }
  function setPref(v) { try { localStorage.setItem(LS_WATCH, v); } catch (e) { /* storage blocked */ } }
  function stopAuto() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } var b = document.getElementById('wcAutoBtn'); if (b) b.textContent = '⚡ Auto Play'; }
  function stopLive() { if (liveTimer) { clearInterval(liveTimer); liveTimer = null; } }
  // Leaving the World Cup (New Game, the logo, Change Mode) stops its clocks, so nothing lands in the next season
  wrap('resetGame', function (orig, args) { stopAuto(); stopLive(); T = null; return orig.apply(this, args); });
  window.wcStart = function () {
    var rating = calcTeamRating(), mk = myKicker(), il = (STATE.team || []).filter(function (p) { return p && p.il; }).length;
    var run = WC.run(rating, Math.random, { kick: mk ? mk.level : 0, taken: takenNames(), il: il });
    STATE.season = { playerTries: Array(13).fill(0), playerAssists: Array(13).fill(0), tries: 0, wins: 0, losses: 0, pf: 0, pa: 0, done: false, rating: rating };
    T = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), run: run, rating: rating, shown: 0, phase: 'pre', ev: [], potm: [], seen: { bc: 0, a: 0, ko: 0 }, drawn: false, done: false };
    STATE.wc = T;
    track('season_started', { event_category: 'game', play_mode: 'world_cup', squad_rating: rating });
    renderTournament();
    if (typeof showScreen === 'function') showScreen('wc-season');
  };

  // The tries: the player's 13 by 27-0's try weights (and its season tallies), the other side's from its best 17
  var TW = { FB: 8, W: 15, C: 11, FE: 7, HB: 5, P: 3, HK: 4, SR: 6, LK: 4 };
  var POS = { FB: 'FB', W: 'W', WG: 'W', RW: 'W', LW: 'W', C: 'C', CE: 'C', RC: 'C', LC: 'C', FE: 'FE', '5/8': 'FE', SO: 'FE', HB: 'HB', SH: 'HB',
    P: 'P', PR: 'P', FR: 'P', HK: 'HK', H: 'HK', SR: 'SR', '2R': 'SR', '2RF': 'SR', LK: 'LK', L: 'LK' };
  function weighted(list, w) {
    var ws = list.map(w), tot = ws.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * tot;
    for (var j = 0; j < list.length; j++) { r -= ws[j]; if (r <= 0) return list[j]; }
    return list[list.length - 1];
  }
  function myScorers(count) {
    var slots = SLOTS.filter(function (s) { return STATE.team[s.i]; }), out = [];
    for (var n = 0; n < count && slots.length; n++) {
      var c = weighted(slots, function (s) { return TW[s.type] || 4; }), p = STATE.team[c.i];
      STATE.season.playerTries[c.i]++;
      out.push({ name: p.name, pos: c.type, rating: p.rating || 0 });
    }
    return out;
  }
  function theirScorers(k, count) {
    // Never one of the player's own 13 (drafted from that nation, they're playing for the player's side)
    var mine = {};
    (STATE.team || []).forEach(function (p) { if (p) mine[p.name] = 1; });
    var sq = squadOf(k, true).filter(function (p) { return !mine[p.name]; }).slice(0, 17), out = []; // opponents at their own ratings (Team of the Week boosts are the player's)
    for (var n = 0; n < count && sq.length; n++) {
      var p = weighted(sq, function (x) { return TW[POS[String(x.positions[0] || '').toUpperCase()]] || 4; });
      out.push({ name: p.name, pos: POS[String(p.positions[0] || '').toUpperCase()] || '', rating: p.rating || 0 });
    }
    return out;
  }
  /* The game in order, each moment at its own minute: tries, each one's conversion a moment later, penalty goals and field
     goals, by each side's kickers, as the engine scored them (7 Oct 2026). A field goal comes last: in the last 10 minutes
     (level, or 6 ahead to go 7 up), or in golden point in a knockout that was level at 80. Level late with time to spare,
     a side sometimes has a shot at a field goal and misses. A World Cup from before then kicked every goal with its try */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function timeline(mine, theirs, g) {
    var list = [], m;
    if (g.myConv == null) {
      mine.forEach(function (p) { list.push([{ me: true, p: p }]); });
      theirs.forEach(function (p) { list.push([{ me: false, p: p }]); });
      return place(shuffle(list), 79);
    }
    var kick = { me: kickerFor('you'), them: kickerFor(g.opp) };
    var flags = function (n, k) { var f = []; for (var i = 0; i < n; i++) f.push(i < k); return shuffle(f); };
    var mc = flags(mine.length, g.myConv), tc = flags(theirs.length, g.theirConv);
    mine.forEach(function (p, i) { list.push([{ me: true, p: p, conv: mc[i] }, { me: true, goal: mc[i], k: kick.me, after: true }]); });
    theirs.forEach(function (p, i) { list.push([{ me: false, p: p, conv: tc[i] }, { me: false, goal: tc[i], k: kick.them, after: true }]); });
    for (m = 0; m < (g.myPens || 0); m++) list.push([{ me: true, pen: true, k: kick.me }]);
    for (m = 0; m < (g.theirPens || 0); m++) list.push([{ me: false, pen: true, k: kick.them }]);
    var fg = g.myFg ? true : g.theirFg ? false : null, gp = fg !== null && Math.abs(g.my - g.their) === 1 && g.kind !== 'pool' && Math.random() < 0.5;
    var fgMin = fg === null ? 80 : gp ? 81 + Math.floor(Math.random() * 6) : 71 + Math.floor(Math.random() * 9);
    var out = place(shuffle(list), Math.min(79, fgMin - 1));
    if (fg !== null) out.push({ min: fgMin, me: fg, fg: true, gp: gp, k: fgKickerFor(fg ? 'you' : g.opp) });
    return withMisses(out, g, fgMin);
  }
  // Each group (a try and its conversion) gets its own minute from 2 to top, in order
  function place(groups, top) {
    var free = [], mins = [], out = [];
    for (var m = 2; m <= top; m++) free.push(m);
    groups.forEach(function () { mins.push(free.splice(Math.floor(Math.random() * free.length), 1)[0]); });
    mins.sort(function (x, y) { return x - y; });
    groups.forEach(function (grp, n) { grp.forEach(function (e) { e.min = mins[n]; out.push(e); }); });
    return out;
  }
  // Level from 70 minutes on with a minute or more before the next score (or full time): now and then a shot at a field
  // goal that misses, two at most a game. Before a winning field goal it's more often the other side's
  function withMisses(out, g, end) {
    var me = 0, them = 0, add = [];
    for (var i = 0; i <= out.length && add.length < 2; i++) {
      if (i) { var e = out[i - 1]; if (e.me) me += ptsOf(e); else them += ptsOf(e); }
      var from = Math.max(70, i ? out[i - 1].min + 1 : 2), to = (i < out.length ? out[i].min : end) - 1;
      if (me !== them || to < from || Math.random() >= 0.5) continue;
      var at = from + Math.floor(Math.random() * (to - from + 1));
      if (at === 80) { if (from < 80) at = 79; else if (to > 80) at = 81; else continue; }
      var next = out[i], who = next && next.fg ? (Math.random() < 0.4 ? next.me : !next.me) : Math.random() < 0.5;
      add.push({ min: at, me: who, fgMiss: true, k: fgKickerFor(who ? 'you' : g.opp) });
    }
    return out.concat(add).sort(function (a, b) { return a.min - b.min; });
  }
  // An event's points: a try 4 (6 in a World Cup from before 7 Oct 2026, its goal with it), a goal or penalty goal 2, a
  // field goal 1, a miss nothing
  function ptsOf(e) { return e.p ? (e.conv == null ? 6 : 4) : e.pen || e.goal === true ? 2 : e.fg ? 1 : 0; }
  // Each side's goals for the Full Time card ('<b>Goals:</b> Moses 3/4 &middot; <b>Field Goal:</b> Moses'), '' for none
  function kicksText(ev, me) {
    var by = {}, order = [], fg = [];
    ev.forEach(function (e) {
      if (e.me !== me || !e.k || e.fgMiss) return;
      var n = cardSurname(e.k);
      if (e.fg) { fg.push(n); return; }
      if (!by[n]) { by[n] = [0, 0]; order.push(n); }
      by[n][1]++;
      if (e.pen || e.goal) by[n][0]++;
    });
    var out = order.length ? '<b>Goals:</b> ' + esc(order.map(function (n) { return n + ' ' + by[n][0] + '/' + by[n][1]; }).join(', ')) : '';
    return out + (fg.length ? (out ? ' &middot; ' : '') + '<b>Field Goal:</b> ' + esc(fg.join(', ')) : '');
  }
  function gpOf(i) { return (T.ev[i] || []).some(function (e) { return e.min > 80; }); }
  // Player of the Match: the winners' top try scorer (the better player breaks a tie)
  function potmOf(won, mine, theirs) {
    var by = {}, list = won ? mine : theirs;
    list.forEach(function (p) { (by[p.name] = by[p.name] || { p: p, n: 0 }).n++; });
    var best = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.n - a.n || b.p.rating - a.p.rating; })[0];
    return best ? { name: best.p.name, pos: best.p.pos, tries: best.n, me: won } : null;
  }
  // Golden Boot (5 Oct 2026, the owner's call): the player's top try scorer across the World Cup, from the tries the games
  // showed (the better player breaks a tie)
  function goldenBoot() {
    var by = {};
    (T.ev || []).forEach(function (list) { (list || []).forEach(function (e) { if (e && e.me && e.p) (by[e.p.name] = by[e.p.name] || { p: e.p, n: 0 }).n++; }); });
    var best = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.n - a.n || (b.p.rating || 0) - (a.p.rating || 0) || (a.p.name < b.p.name ? -1 : 1); })[0];
    return best ? { name: best.p.name, pos: best.p.pos, tries: best.n } : null;
  }
  function triesWord(n) { return n + (n === 1 ? ' try' : ' tries'); }
  // Game i's story and the season's numbers, once
  function play(i) {
    if (T.ev[i]) return;
    var g = T.run.games[i], s = STATE.season, mine = myScorers(g.myTries), theirs = theirScorers(g.opp, g.theirTries);
    T.ev[i] = timeline(mine, theirs, g);
    T.potm[i] = potmOf(g.won, mine, theirs);
    assignAssists(g.myTries);
    s.tries += g.myTries; s.pf += g.my; s.pa += g.their;
    if (g.won) s.wins++; else s.losses++;
  }
  // Full time in game i: the ladders and the other scores catch up
  function fullTime(i) {
    play(i);
    stopLive();
    var g = T.run.games[i];
    T.shown = i + 1;
    T.phase = 'ft';
    if (g.kind === 'pool') { T.seen.bc = i + 1; if (i % 2 === 0) T.seen.a = i / 2 + 1; } // Pool A after rounds 1, 3 and 5
    else T.seen.ko = g.kind === 'qf' ? 1 : g.kind === 'sf' ? 2 : 3;
    track('wc_game', { game: i + 1, kind: g.kind, won: g.won ? 1 : 0 });
    if (bigWin(g)) setTimeout(function () { if (T && T.run.games[i] === g) makeShare(i).then(function (x) { if (T && T.shares && T.shares[i]) T.shares[i].ready = x; }, function () { /* made at the tap */ }); }, 400);
  }

  /* ---------- What the cards say ---------- */
  function kickOf(i) { var g = T.run.games[i]; return g.kind === 'pool' ? 'Pool Game ' + (i + 1) + ' of 5 &middot; ' + esc(g.date) : KO_WORD[g.kind] + ' &middot; ' + esc(g.date); }
  function plate(k) { return '<div class="wc-plate">' + badge(k, 'wc-badge-xl') + '<b>' + esc(nameOf(k)) + '</b><small>Rating ' + strengthOf(k) + '</small></div>'; }
  function scoreLine(g) { return badge(g.a) + ' <span>' + esc(nameOf(g.a)) + '</span> <b>' + g.sa + '-' + g.sb + '</b> <span>' + esc(nameOf(g.b)) + '</span> ' + badge(g.b); }
  function resultFor(k, g) { // "beat Lebanon 24-12" or "lost to PNG 12-24", from k's side
    var mine = g.a === k, other = mine ? g.b : g.a, f = mine ? g.sa : g.sb, a = mine ? g.sb : g.sa;
    return (g.winner === k ? 'beat ' : 'lost to ') + side(other) + ' ' + f + '-' + a;
  }
  // The other side's World Cup so far: its record and last game (pools), or its pool and knockout wins
  function formLine(i) {
    var g = T.run.games[i], k = g.opp, P = T.run.pools, txt;
    if (g.kind === 'pool') {
      var r = i + 1;
      if (r === 1) return '<b>' + esc(nameOf(k)) + '</b> start their World Cup here.';
      var row = WC.standings(P.bc, r - 1, P.coins).filter(function (t) { return t.key === k; })[0];
      var last = P.bc.filter(function (x) { return x.round === r - 1 && (x.a === k || x.b === k); })[0];
      return '<b>' + esc(nameOf(k)) + '</b> are ' + row.w + '-' + row.l + ' so far' + (last ? ' and ' + resultFor(k, last) + ' last time out' : '') + '.';
    }
    var inA = ['aus', 'nzl', 'fij', 'cok'].indexOf(k) >= 0;
    var tbl = inA ? T.run.poolA : T.run.table, pr = tbl.filter(function (t) { return t.key === k; })[0], pos = tbl.indexOf(pr) + 1;
    txt = '<b>' + esc(nameOf(k)) + '</b> went ' + pr.w + '-' + pr.l + ' in ' + (inA ? 'Pool A' : 'Pools B and C') + ' (' + ord(pos) + ')';
    var b = T.run.bracket, wins = [];
    if (g.kind !== 'qf') b.qf.forEach(function (m) { if (m.winner === k) wins.push(resultFor(k, m) + ' in the quarter final'); });
    if (g.kind === 'final') b.sf.forEach(function (m) { if (m.winner === k) wins.push(resultFor(k, m) + ' in the semi'); });
    return txt + (wins.length ? ', then ' + wins.join(' and ') : '') + '.';
  }
  // What's at stake: in the pools only what holds whatever else happens (WC.stakes checks every way it can go)
  function stakesLine(i) {
    var g = T.run.games[i];
    if (g.kind === 'qf') return 'Win and you&rsquo;re into the semi finals.';
    if (g.kind === 'sf') return 'Win and you&rsquo;re into the World Cup Final.';
    if (g.kind === 'final') return 'Win and you&rsquo;re world champions.';
    var r = i + 1, st = WC.stakes(T.run.pools.bc, r);
    if (st.through) return 'You&rsquo;re through to the quarter finals already.' + (st.win.top ? ' Win and you finish top of Pools B and C.' : '');
    if (st.out) return 'The quarter finals are out of reach. Play for pride.';
    var a = st.win.top ? 'Win and you finish top of Pools B and C' : st.win.through ? 'Win and you&rsquo;re through to the quarter finals' : '';
    var l = st.lose.out ? 'Lose and you&rsquo;re out' : '';
    if (a || l) return [a, l].filter(Boolean).join('. ') + '.';
    if (r === 1) return 'Five pool games. The top 4 go through to the quarter finals.';
    var pos = WC.standings(T.run.pools.bc, r - 1, T.run.pools.coins).map(function (t) { return t.key; }).indexOf('you') + 1;
    return 'You&rsquo;re ' + ord(pos) + ' in Pools B and C. The top 4 go through.';
  }

  /* ---------- The screen ---------- */
  function stripHtml() {
    var games = T.run.games, over = T.phase === 'over', done = games.slice(0, T.shown);
    // The record counts games finished on screen (a game being watched is already in the season's numbers)
    var w = done.filter(function (g) { return g.won; }).length;
    return '<div class="wc-strip-h"><b>World Cup 2026</b><span>' + w + '-' + (done.length - w) + '</span></div>' + roadChips(function (r, i) {
      var g = games[i], played = i < T.shown;
      if (played) return { opp: g.opp, cls: g.won ? 'is-w' : 'is-l', sub: g.my + '-' + g.their };
      // Knockouts never reached: greyed once the last game is played (before that, nothing gives away where the run ends)
      if (!g && T.shown >= games.length) return { cls: 'is-gone', sub: '-' };
      // The next game lights up; the quarter final only once the draw card is turned (a surprise)
      var cur = i === T.shown && !over && (i !== 5 || T.drawn);
      return { opp: r.kind === 'pool' || cur ? (g ? g.opp : r.opp) : null, cls: cur ? 'is-now' : '' };
    });
  }
  function matchHtml() {
    var i = T.shown, g = T.run.games[i];
    if (T.phase === 'draw') return drawHtml();
    if (T.phase === 'ft') return ftHtml(T.shown - 1);
    if (T.phase === 'over' || !g) return '';
    var ko = g.kind !== 'pool', watch = ko || pref() === 'watch';
    var h = '<div class="wc-match' + (ko ? ' is-ko' : '') + '"><div class="wc-kick">' + kickOf(i) + '</div>' +
      '<div class="wc-plates">' + plate('you') + '<span class="wc-v">v</span>' + plate(g.opp) + '</div>';
    if (T.phase === 'live') {
      // A fixed-height scoreboard and try list (the newest slides in at the top), so nothing moves as the tries land;
      // the Half Time and Full Time banners sit over the scoreboard
      return h + '<div class="wc-live"><div class="wc-live-top"><span class="wc-live-dot" aria-hidden="true"></span>LIVE <b id="wcClock">0&prime;</b></div>' +
        '<div class="wc-board"><div class="wc-big-score"><b id="wcSMe">0</b><i>-</i><b id="wcSThem">0</b></div>' +
        '<div class="wc-banner" id="wcBanner" role="status" aria-live="assertive"></div></div>' +
        '<ol class="wc-feed" id="wcFeed" aria-live="polite"></ol></div></div>';
    }
    return h + '<p class="wc-form">' + formLine(i) + '</p><p class="wc-stakes">' + stakesLine(i) + '</p></div>';
  }
  // The match's buttons, pinned at the foot of the screen in the same spot through every phase (the owner's call). Watch
  // It is always on the left and Quick Result on the right (7 Oct 2026: they swapped places with the last one used, the
  // owner); the one used last is the filled one. At full time Next is the only button (Share This Win is on the card)
  function actsHtml() {
    var i = T.shown, g = T.run.games[i], ko = g && g.kind !== 'pool', b = function (cls, on, label) { return '<button type="button" class="btn wc-go' + cls + '" onclick="' + on + '">' + label + '</button>'; };
    if (T.phase === 'pre' && g) {
      var watch = ko || pref() === 'watch';
      return b(watch ? '' : ' btn-outline', 'wcWatch()', '▶ Watch It') + b(watch ? ' btn-outline' : '', 'wcQuick()', '⚡ Quick Result');
    }
    if (T.phase === 'live') return b(' btn-outline', 'wcFull()', '⏭ Skip to Full Time');
    if (T.phase === 'draw') return T.drawn ? b('', 'wcNext()', '▶ On to the Quarter Final') : b('', 'wcReveal(true)', '🎟️ Reveal Your Opponent');
    if (T.phase === 'ft') return b('', 'wcNext()', nextLabel(T.shown - 1));
    return '';
  }
  function feedRow(e, g) {
    var k = e.me ? 'you' : g.opp, pts = ptsOf(e), what;
    if (e.p) what = '<b>' + esc(e.p.name) + '</b><small>Try' + (e.p.pos ? ' &middot; ' + e.p.pos : '') + '</small>';
    else what = '<b>' + esc(e.k || nameOf(k)) + '</b><small>' + (e.pen ? 'Penalty Goal' : e.fg ? (e.gp ? 'Golden Point Field Goal' : 'Field Goal') : e.fgMiss ? 'Missed Field Goal' : e.goal ? 'Goal' : 'Missed Goal') + '</small>';
    return '<li class="' + (e.me ? 'is-me' : 'is-them') + (pts ? '' : ' is-miss') + '"><span class="wc-min">' + e.min + '&prime;</span>' + badge(k) +
      '<span class="wc-fe">' + what + '</span>' + (pts ? '<span class="wc-pts">+' + pts + '</span>' : '') + '</li>';
  }
  function scorersText(list) {
    var c = {}, order = [];
    list.forEach(function (e) { var n = cardSurname(e.p.name); if (!c[n]) { c[n] = 0; order.push(n); } c[n]++; });
    return order.map(function (n) { return n + (c[n] > 1 ? ' ' + c[n] : ''); }).join(', ');
  }
  function bigWin(g) { return g.won && (g.kind !== 'pool' || g.opp === 'aus' || g.opp === 'nzl'); }
  function nextLabel(i) {
    var games = T.run.games, n = games[i + 1];
    if (i === 4) return n ? '🎟️ See the Quarter Final Draw' : '🌏 See Your World Cup';
    if (!n) return T.run.stage === 4 ? '🏆 Lift the Trophy' : '🌏 See Your World Cup';
    if (n.kind === 'pool') return '▶ Next: ' + esc(nameOf(n.opp)) + ' &middot; ' + esc(n.date);
    return n.kind === 'sf' ? '▶ On to the Semi Final' : '▶ On to the Final';
  }
  function ftHtml(i) {
    var g = T.run.games[i], ev = T.ev[i] || [], pm = T.potm[i];
    var mine = ev.filter(function (e) { return e.me && e.p; }), theirs = ev.filter(function (e) { return !e.me && e.p; });
    var line = function (label, tries, me) {
      var k = kicksText(ev, me), t = tries.length ? esc(scorersText(tries)) : '';
      return t || k ? '<span><b>' + label + '</b> ' + (t || 'No tries') + (k ? ' &middot; ' + k : '') + '</span>' : '';
    };
    return '<div class="wc-match wc-ft ' + (g.won ? 'is-win' : 'is-loss') + (g.kind !== 'pool' ? ' is-ko' : '') + '"><div class="wc-kick">Full Time &middot; ' + (gpOf(i) ? 'Golden Point &middot; ' : '') + kickOf(i).replace(/ &middot; .*$/, '') + '</div>' +
      '<div class="wc-ft-word">' + (g.won ? 'WIN' : 'LOSS') + '</div>' +
      '<div class="wc-ft-score">' + badge('you', 'wc-badge-xl') + '<b>' + g.my + '</b><i>-</i><b>' + g.their + '</b>' + badge(g.opp, 'wc-badge-xl') + '</div>' +
      '<div class="wc-ft-names"><span>' + esc(nameOf('you')) + '</span><span>' + esc(nameOf(g.opp)) + '</span></div>' +
      '<div class="wc-tries">' + line('Tries:', mine, true) + line(esc(NATIONS[g.opp][3]) + ':', theirs, false) + '</div>' +
      (pm ? '<div class="wc-potm"><span class="wc-potm-i" aria-hidden="true">&#x1F3C5;</span><span><small>Player of the Match</small><b>' + esc(pm.name) + '</b><em>' + (pm.me ? esc(nameOf('you')) : esc(nameOf(g.opp))) +
        (pm.pos ? ' &middot; ' + pm.pos : '') + ' &middot; ' + pm.tries + ' tr' + (pm.tries === 1 ? 'y' : 'ies') + '</em></span></div>' : '') +
      (bigWin(g) ? '<div class="wc-ft-share"><button type="button" class="btn btn-outline wc-go" onclick="wcShareWin(' + i + ')">📸 Share This Win</button></div>' : '') + '</div>';
  }
  // The quarter final draw: where they finished, then their opponent turns over
  function drawHtml() {
    var r = T.run, qf = r.games[5], pos = r.pos;
    return '<div class="wc-match wc-draw is-ko"><div class="wc-kick">Quarter Final Draw</div><div class="wc-draw-t">You Finished ' + ord(pos) + ' in Pools B and C</div>' +
      '<p class="wc-form">Through to the quarter finals. Your opponent is&hellip;</p>' +
      '<button type="button" class="wc-flip' + (T.drawn ? ' is-on' : '') + '" onclick="wcReveal()" aria-label="' + (T.drawn ? 'Your quarter final opponent: ' + esc(nameOf(qf.opp)) : 'Reveal your quarter final opponent') + '"><span class="wc-flip-in"><span class="wc-flip-f">?</span>' +
      '<span class="wc-flip-b">' + badge(qf.opp, 'wc-badge-xl') + '<b>' + esc(nameOf(qf.opp)) + '</b><small>Rating ' + strengthOf(qf.opp) + '</small></span></span></button>' +
      (T.drawn ? '' : '<p class="wc-tap">Tap to Reveal</p>') + '</div>';
  }
  // The round's other games
  function roundGames(list, r, title) {
    var gs = list.filter(function (x) { return x.round === r && x.a !== 'you' && x.b !== 'you'; });
    return gs.length ? '<div class="wc-also"><div class="wc-sub-h">' + title + '</div>' + gs.map(function (x) { return '<div class="wc-also-g">' + scoreLine(x) + '</div>'; }).join('') + '</div>' : '';
  }
  // The knockouts as far as they've gone (0: the draw, 1: quarter finals played, 2: semis, 3: the final), the player's path lit
  /* Your 13 under the knockouts (11 Oct 2026, the owner): each pick in field order with his nation and his rating, a World
     Legend marked, and the team rating */
  function teamPanel() {
    var team = (typeof STATE !== 'undefined' && STATE && STATE.team) || [];
    if (!team.some(Boolean) || typeof SLOTS === 'undefined') return '';
    return '<div class="wc-panel"><div class="wc-panel-h">Your 13 <small>Team Rating ' + esc(String(T.rating)) + '</small></div><div class="wc-13">' +
      SLOTS.map(function (sl) {
        var p = team[sl.i];
        if (!p) return '';
        var col = typeof ratingColor === 'function' ? ratingColor(p.rating) : '#a3e635';
        return '<div class="wc-13-row' + (p.il ? ' is-il' : '') + '"><span class="wc-13-pos">' + esc(sl.type) + '</span>' + badge(p.club) +
          '<span class="wc-13-n">' + esc(p.name) + (p.il ? '<em>World Legend</em>' : '') + '</span>' +
          '<span class="wc-13-r" style="--rc:' + col + '">' + esc(String(p.rating)) + '</span></div>';
      }).join('') + '</div></div>';
  }
  function bracketHtml(reveal) {
    var b = T.run.bracket, cell = function (m, show, cls) {
      var mine = m.a === 'you' || m.b === 'you', known = show >= 0;
      var row = function (k, sc) { return '<div class="wc-b-side' + (show > 0 && k === m.winner ? ' is-win' : '') + (k === 'you' ? ' is-me' : '') + '">' + (known ? badge(k) : '<span class="wc-badge is-ko">?</span>') + '<span>' + (known ? esc(nameOf(k)) : 'To Be Decided') + '</span><b>' + (show > 0 ? sc : '') + '</b></div>'; };
      return '<div class="wc-b-match ' + (cls || '') + (mine && known ? ' is-path' : '') + '">' + row(m.a, m.sa) + row(m.b, m.sb) + '</div>';
    };
    var qf = [b.qf[0], b.qf[3], b.qf[1], b.qf[2]]; // SF1 is QF1 v QF4, SF2 is QF2 v QF3
    return '<div class="wc-panel"><div class="wc-panel-h">The Knockouts</div><div class="wc-bracket">' +
      '<div class="wc-b-col"><div class="wc-b-h">Quarter Finals</div>' + qf.map(function (m) { return cell(m, reveal >= 1 ? 1 : 0); }).join('') + '</div>' +
      '<div class="wc-b-col"><div class="wc-b-h">Semi Finals</div>' + b.sf.map(function (m) { return cell(m, reveal >= 2 ? 1 : reveal >= 1 ? 0 : -1); }).join('') + '</div>' +
      '<div class="wc-b-col"><div class="wc-b-h">Final</div>' + cell(b.final, reveal >= 3 ? 1 : reveal >= 2 ? 0 : -1, 'is-final') + '</div></div></div>';
  }
  function sideHtml() {
    var P = T.run.pools, h = '', ko = T.run.pos <= 4 && (T.shown > 5 || T.drawn); // the bracket waits for the draw: it's a surprise
    if (ko) h += bracketHtml(T.seen.ko);
    var r = T.seen.bc;
    h += '<div class="wc-panel"><div class="wc-panel-h">Pools B and C <small>' + (r ? 'After Round ' + r : 'Before Round 1') + '</small></div>' +
      poolTable(r ? WC.standings(P.bc, r, P.coins) : zeroRows(['you', 'png', 'ton', 'sam', 'eng', 'leb']), { cut: true }) +
      (r ? roundGames(P.bc, r, 'Also in Round ' + r) : '') + '</div>';
    var a = T.seen.a;
    h += '<div class="wc-panel"><div class="wc-panel-h">Pool A <small>' + (a ? 'After Round ' + a : 'Before Round 1') + '</small></div>' +
      poolTable(a ? WC.standings(P.a, a, P.coins) : zeroRows(['aus', 'nzl', 'fij', 'cok'])) + (a ? roundGames(P.a, a, 'Pool A Round ' + a) : '') + '</div>';
    return h;
  }
  function renderTournament() {
    if (!T) return;
    var box = document.getElementById('wcMatch'), bar = document.getElementById('wcActs'), act = document.activeElement;
    var had = !!act && ((!!box && box.contains(act)) || (!!bar && bar.contains(act)));
    var set = function (id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; };
    set('wcStrip', stripHtml());
    set('wcMatch', matchHtml());
    if (bar) { var acts = actsHtml(); if (bar.getAttribute('data-h') !== acts) { bar.innerHTML = acts; bar.setAttribute('data-h', acts); } bar.hidden = !acts; }
    set('wcSide', sideHtml());
    var lab = document.getElementById('wcTeamLabel'); if (lab) lab.textContent = 'Team Rating: ' + T.rating;
    var pools = document.getElementById('wcPoolsBtn'); if (pools) pools.hidden = T.shown >= 5 || T.phase === 'over';
    if (had) { var f = (bar && (bar.querySelector('.btn:not(.btn-outline)') || bar.querySelector('button'))) || (box && box.querySelector('button')); if (f && f.focus) f.focus({ preventScroll: true }); }
    keep();
  }
  // Back up to the card only when it's out of view (no jumps while it's on screen)
  function toTop() {
    var m = document.getElementById('wcMatch'), r = m && m.getBoundingClientRect();
    if (r && (r.top < 0 || r.top > window.innerHeight * 0.45) && m.scrollIntoView) m.scrollIntoView({ block: 'start', behavior: autoTimer ? 'auto' : 'smooth' });
  }

  /* ---------- Playing it ---------- */
  // Watch It: the clock runs and the tries land at their minutes (about 6 seconds a pool game, 9 a knockout)
  window.wcWatch = function () {
    if (!T || T.phase !== 'pre') return;
    var i = T.shown, g = T.run.games[i];
    if (g.kind === 'pool') setPref('watch');
    play(i);
    T.phase = 'live';
    renderTournament();
    var ev = T.ev[i], n = 0, min = 0, me = 0, them = 0, step = 80 / ((g.kind === 'pool' ? 6000 : 9000) / 100), hold = 0, beat = 0, ht = false, ftAt = 0;
    // Golden point: the clock stops at 80, then runs on to the winning field goal
    var gpAt = ev.length && ev[ev.length - 1].min > 80 ? ev[ev.length - 1].min : 0, end = 80;
    var clock = document.getElementById('wcClock'), feed = document.getElementById('wcFeed'), sMe = document.getElementById('wcSMe'), sThem = document.getElementById('wcSThem');
    var banner = document.getElementById('wcBanner');
    var show = function (title) { if (banner) { banner.innerHTML = '<b>' + title + '</b><span>' + me + '-' + them + '</span>'; banner.classList.add('is-on'); } };
    var hide = function () { if (banner) banner.classList.remove('is-on'); };
    stopLive();
    liveTimer = setInterval(function () {
      if (!T || T.phase !== 'live') { stopLive(); return; }
      var now = Date.now();
      if (ftAt) { if (now >= ftAt) { fullTime(i); renderTournament(); } return; } // the Full Time banner, then the result
      if (hold) { if (now < hold) return; hold = 0; hide(); }
      if (beat) { if (now < beat) return; beat = 0; } else min = Math.min(end, min + step);
      while (n < ev.length && ev[n].min <= min) {
        var e = ev[n++];
        if (e.me) me += ptsOf(e); else them += ptsOf(e);
        if (sMe) sMe.textContent = me;
        if (sThem) sThem.textContent = them;
        if (feed) { feed.insertAdjacentHTML('afterbegin', feedRow(e, g)); var li = feed.firstChild; if (li && li.classList) li.classList.add('is-new'); }
        if (n < ev.length && ev[n].after) { beat = now + 800; break; } // the conversion a moment after its try
      }
      if (clock) clock.innerHTML = min >= end && n >= ev.length ? 'FT' : ht && min < 41 ? 'HT' : Math.floor(min) + '&prime;';
      if (beat) return;
      if (!ht && min >= 40) { ht = true; if (clock) clock.innerHTML = 'HT'; show('Half Time'); hold = now + 1500; return; }
      if (min >= 80 && gpAt && end === 80) { end = gpAt; show('Golden Point'); hold = now + 1800; return; }
      if (min >= end) { show('Full Time'); ftAt = now + 1500; }
    }, 100);
  };
  window.wcQuick = function () {
    if (!T || T.phase !== 'pre') return;
    var g = T.run.games[T.shown];
    if (g.kind === 'pool') setPref('quick');
    fullTime(T.shown);
    renderTournament();
  };
  window.wcFull = function () { if (T && T.phase === 'live') { fullTime(T.shown); renderTournament(); } };
  /* The quarter final draw's reveal (7 Oct 2026, the owner: "a slower reveal animation either roll or dissolve in"; it just
     showed the side): the Pool A sides flick past on the card, each a little slower (about 2.5 seconds), and the opponent
     lands with a glow and its rating, then the card stays turned. Straight to it with reduced motion, or when nobody is
     looking (a hidden tab) */
  var rolling = false;
  // now: the button under the draw shows the opponent straight away, even mid-spin (11 Oct 2026, the owner); the card spins
  window.wcReveal = function (now) {
    if (!T || T.phase !== 'draw' || T.drawn || (rolling && !now)) return;
    var opp = T.run.games[5].opp, card = document.querySelector('#wcMatch .wc-flip'), face = card && card.querySelector('.wc-flip-f'), t0 = T;
    track('wc_draw', { opp: opp });
    var land = function () { rolling = false; if (T !== t0 || T.phase !== 'draw' || T.drawn) return; T.drawn = true; renderTournament(); }; // renderTournament keeps the run
    var calm = document.hidden || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!face || calm || now) { rolling = false; land(); return; }
    rolling = true;
    card.classList.add('is-rolling');
    card.setAttribute('aria-busy', 'true');
    var tap = document.querySelector('#wcMatch .wc-tap'); if (tap) tap.style.visibility = 'hidden';
    var sides = ['aus', 'nzl', 'fij', 'cok'], seq = [], last = null, at = 0;
    for (var j = 0; j < 15; j++) { // never the same side twice running, and not the opponent just before it lands
      var opts = sides.filter(function (k) { return k !== last && (j < 14 || k !== opp); });
      last = opts[Math.floor(Math.random() * opts.length)];
      seq.push(last);
    }
    seq.push(opp);
    seq.forEach(function (k, n) {
      at += 60 + Math.round(Math.pow(n / (seq.length - 1), 2.4) * 420);
      setTimeout(function () {
        if (T !== t0 || T.drawn || !face.isConnected) { if (n === seq.length - 1) land(); return; }
        var end = n === seq.length - 1;
        face.innerHTML = badge(k, 'wc-badge-xl') + '<b>' + esc(nameOf(k)) + '</b>' + (end ? '<small>Rating ' + strengthOf(k) + '</small>' : '');
        if (end) { card.classList.add('is-landed'); setTimeout(land, 1100); }
      }, at);
    });
  };
  function wcNext() {
    if (!T) return;
    if (T.phase === 'live') { window.wcFull(); return; }
    if (T.phase === 'draw') { if (T.drawn) { T.phase = 'pre'; renderTournament(); toTop(); } return; }
    if (T.phase !== 'ft') return;
    var games = T.run.games;
    if (T.shown >= games.length) { if (T.run.stage === 4) champions(); else finish(); return; }
    T.phase = T.shown === 5 ? 'draw' : 'pre';
    renderTournament();
    toTop();
  }
  window.wcNext = wcNext;
  // Auto Play: quick results through the pools, then it stops for the knockouts (they're played by hand)
  window.wcAuto = function () {
    if (autoTimer) { stopAuto(); return; }
    var b = document.getElementById('wcAutoBtn');
    if (b) b.textContent = '⏸ Pause';
    var step = function () {
      autoTimer = null;
      if (!T || T !== STATE.wc) { stopAuto(); return; }
      if (T.phase === 'live') window.wcFull();
      if (T.phase === 'pre' && T.shown < 5) { fullTime(T.shown); renderTournament(); autoTimer = setTimeout(step, 700); return; }
      if (T.phase === 'ft' && T.shown < 5) { wcNext(); autoTimer = setTimeout(step, 450); return; }
      stopAuto(); renderTournament();
    };
    step();
  };
  // Skip to the Knockouts (7 Oct 2026, the owner: "skip group stage in one click"; it took Auto Play's place): every pool
  // game left goes to full time at once, then it's the quarter final draw (or the results, out in the pools)
  window.wcSkipPools = function () {
    if (!T || T.shown >= 5 || T.phase === 'draw' || T.phase === 'over') return;
    stopAuto(); stopLive();
    for (var i = T.shown; i < 5; i++) fullTime(i);
    wcNext();
  };
  // The Skip to the End button: a second tap within 3 seconds, like the finals' Skip the Finals (8 Oct 2026, the owner:
  // "two taps for both"). wcSkip itself skips at once
  var skipArm = 0;
  window.wcSkipTap = function (btn) {
    if (!T) return;
    var lab = function (t) { if (btn) btn.textContent = t; };
    if (!skipArm || Date.now() - skipArm > 3000) {
      skipArm = Date.now(); lab('Tap Again to Skip to the End');
      setTimeout(function () { if (skipArm && Date.now() - skipArm >= 3000) { skipArm = 0; lab('\u23ED Skip to the End'); } }, 3100);
      return;
    }
    skipArm = 0; lab('\u23ED Skip to the End');
    window.wcSkip();
  };
  window.wcSkip = function () {
    if (!T) return;
    stopAuto(); stopLive();
    for (var i = T.shown; i < T.run.games.length; i++) fullTime(i);
    T.drawn = true;
    keep(); // closed on the Champions moment, it picks up at the last full time
    if (T.run.stage === 4) champions(); else finish();
  };

  /* ---------- The result ---------- */
  // 'Team beat Samoa, the Kumuls and England, then lost the semi final to the Kiwis 30-12 at the World Cup on 27-0' (the
  // winner's score first); out in the pool: 'beat Samoa but missed the quarter finals'
  function shareLine() {
    var r = T.run, beat = [], team = myName();
    r.games.forEach(function (g) { if (g.won && beat.indexOf(side(g.opp)) < 0) beat.push(side(g.opp)); });
    if (r.perfect) return team + ' went 8-0 and won the World Cup on 27-0 🏆';
    if (r.stage === 4) return team + ' won the World Cup on 27-0, ' + r.wins + '-' + r.losses + ' 🏆';
    if (r.stage === 0) return team + (beat.length ? ' beat ' + listOf(beat.slice(0, 3)) + ' but' : ' went ' + r.wins + '-' + r.losses + ' and') + ' missed the quarter finals at the World Cup on 27-0';
    var where = r.stage === 3 ? 'the final' : r.stage === 2 ? 'the semi final' : 'the quarter final', last = r.games[r.games.length - 1];
    return team + (beat.length ? ' beat ' + listOf(beat.slice(0, 3)) + ', then' : '') + ' lost ' + where + ' to ' + side(last.opp) + ' ' + last.their + '-' + last.my + ' at the World Cup on 27-0';
  }
  function listOf(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  // One line a game: the side, the score and the tries, no venues
  function roadRow(g, i) {
    var ev = T.ev[i] || [], mine = ev.filter(function (e) { return e.me && e.p; });
    return '<div class="wc-rr ' + (g.won ? 'is-w' : 'is-l') + '"><span class="wc-rr-k">' + (g.kind === 'pool' ? 'G' + (i + 1) : KO_SHORT[g.kind]) + '</span>' + badge(g.opp) +
      '<span class="wc-rr-t"><b>' + esc(nameOf(g.opp)) + '</b><small>' + esc(g.date) + (mine.length ? ' &middot; Tries: ' + esc(scorersText(mine)) : '') + '</small></span>' +
      '<span class="wc-rr-s">' + g.my + '-' + g.their + '</span><span class="wc-rr-r">' + (g.won ? 'W' : 'L') + '</span></div>';
  }
  function finish() {
    if (!T) return;
    if (T.done) { if (typeof showScreen === 'function') showScreen('wc-results'); return; }
    stopAuto(); stopLive();
    for (var i = 0; i < T.run.games.length; i++) if (!T.ev[i]) fullTime(i);
    T.done = true; T.phase = 'over'; STATE.season.done = true;
    T.seen = { bc: 5, a: 3, ko: 3 };
    // Over: never resumed again, and a run already counted (the same run left open in another tab, say) never counts twice
    drop();
    var again = false;
    try { again = !!T.id && localStorage.getItem(LS_LAST) === T.id; if (T.id) localStorage.setItem(LS_LAST, T.id); } catch (e) { again = false; }
    var r = T.run, perfect = r.perfect, result = perfect ? '8-0' : STAGE_RESULT[r.stage];
    var champ = r.champion === 'you' ? null : r.champion;
    var hero = document.getElementById('wcHero');
    if (hero) hero.innerHTML = '<div class="wc-hero' + (perfect ? ' is-perfect' : r.stage === 4 ? ' is-champ' : '') + '">' +
      '<div class="wc-hero-k">World Cup 2026</div><div class="wc-hero-rec">' + r.wins + '-' + r.losses + '</div>' +
      '<div class="wc-hero-t">' + (perfect ? '8-0 World Champions' : esc(STAGE_WORD[r.stage])) + '</div>' +
      '<div class="wc-hero-s">' + esc(myName()) + ' &middot; Team Rating ' + T.rating + '</div>' +
      (champ ? '<div class="wc-hero-c">' + badge(champ) + ' ' + esc(nameOf(champ)) + ' won the World Cup</div>' : '') + '</div>';
    var got = [];
    try { got = again ? [] : save(result, r) || []; } catch (e) { got = []; } // the result shows whatever happens to the save
    var names = got.map(function (id) { return WC_TROPHY_NAMES[id]; }).filter(Boolean);
    var body = document.getElementById('wcResultsBody'), A = acct(), strip = !!(A && A.wcSaved && A.wcSaved());
    // Like Classic's results (7 Oct 2026, the owner: "buttons should be higher up and mimic 27-0 mode"): Play Again on its
    // own, Share and Change Mode under it, then the account's Saved strip (Your Rank opens the World Cup board), then the
    // World Cup itself. No strip in an admin's preview, whose games are never saved
    if (body) body.innerHTML = '<div class="cp-res-acts"><button class="btn cp-res-again" onclick="wcAgain()">🔄 Play Again</button><div class="cp-res-two">' +
      '<button class="btn cp-res-share" onclick="wcShare()">📸 Share</button><button class="btn cp-res-mode" onclick="cpChangeMode()">🎮 Change Mode</button></div></div>' +
      (strip ? '<div data-cast-results></div>' : '') +
      (names.length ? '<div class="wc-won-tr">&#x1F3C6; ' + (names.length > 1 ? 'Trophies' : 'Trophy') + ' Unlocked: <b>' + esc(listOf(names)) + '</b></div>' : '') +
      // no Golden Boot card here (9 Oct 2026, the owner: "not needed"); the Champions moment and the picture keep theirs
      '<div class="wc-panel"><div class="wc-panel-h">Your Road</div>' + r.games.map(function (g, i) { return roadRow(g, i); }).join('') + '</div>' +
      (r.pos <= 4 ? bracketHtml(3) + teamPanel() : '') +
      '<div class="wc-panel"><div class="wc-panel-h">Pools B and C <small>Final Table</small></div>' + poolTable(WC.standings(r.pools.bc, 5, r.pools.coins), { cut: true }) + '</div>' +
      '<div class="wc-panel"><div class="wc-panel-h">Pool A <small>Final Table</small></div>' + poolTable(WC.standings(r.pools.a, 3, r.pools.coins)) + '</div>' +
      (r.pos > 4 ? bracketHtml(3) + teamPanel() : '');
    if (typeof showScreen === 'function') showScreen('wc-results');
    if (strip && A.refresh) A.refresh();
    if (!again) track('season_result', { event_category: 'game', play_mode: 'world_cup', wins: r.wins, losses: r.losses, stage: result, is_8_0: perfect ? 1 : 0, squad_rating: T.rating });
    // The picture is made now, so a tap on Share sends it straight away (a phone's share sheet needs the tap)
    var mine = T;
    setTimeout(function () {
      if (T !== mine) return;
      makeRunShare().then(function (x) { if (mine.shares && mine.shares.run) mine.shares.run.ready = x; }, function () { /* made at the tap */ });
      makeRunShare(true).then(function (x) { if (mine.shares && mine.shares.runStory) mine.shares.runStory.ready = x; }, function () { /* made at the tap */ });
    }, 400);
  }
  // The Champions moment: World Cup blue and white (never gold), then the result
  function champions() {
    if (!T || document.querySelector('.wc-champs')) return;
    var r = T.run, ov = document.createElement('div'), bits = '', ko = r.games.slice(5).map(function (g) { return side(g.opp); }), boot = goldenBoot();
    var COL = ['#ffffff', '#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1'];
    for (var n = 0; n < 70; n++) {
      bits += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + COL[n % COL.length] + ';animation-delay:' + (Math.random() * 1.6).toFixed(2) + 's;animation-duration:' + (2.4 + Math.random() * 2).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    }
    ov.className = 'wc-champs';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'World Champions');
    // Three groups spread evenly down the screen (the owner's call): the cup and the title, the team and how they did it,
    // then the road; the button pinned at the foot
    ov.innerHTML = '<div class="wc-champs-fx" aria-hidden="true">' + bits + '</div><div class="wc-champs-in">' +
      '<div class="wc-champs-g"><div class="wc-champs-k">Rugby League World Cup 2026</div><div class="wc-champs-cup" aria-hidden="true">&#x1F3C6;</div>' +
      '<div class="wc-champs-t">World Champions</div></div>' +
      '<div class="wc-champs-g"><div class="wc-champs-n">' + esc(myName()) + '</div><div class="wc-champs-r">' + (r.perfect ? '8-0 &middot; Unbeaten' : r.wins + '-' + r.losses) + '</div>' +
      '<p class="wc-champs-ko">Beat ' + esc(listOf(ko)) + ' in the knockouts.</p>' +
      (boot ? '<p class="wc-champs-boot"><span aria-hidden="true">&#x1F45F;</span> Golden Boot: <b>' + esc(boot.name) + '</b>, ' + triesWord(boot.tries) + '</p>' : '') + '</div>' +
      '<div class="wc-champs-road">' + roadChips(function (rd, n) { var g = r.games[n]; return g ? { opp: g.opp, cls: g.won ? 'is-w' : 'is-l', sub: g.my + '-' + g.their } : { cls: 'is-gone', sub: '-' }; }) + '</div></div>' +
      '<div class="wc-champs-bar"><button type="button" class="btn wc-go" data-wcc="go">See Your World Cup</button></div>';
    document.body.appendChild(ov);
    var go = ov.querySelector('[data-wcc="go"]');
    if (go && go.focus) go.focus();
    track('wc_champions', { perfect: r.perfect ? 1 : 0, squad_rating: T.rating });
    ov.addEventListener('click', function (e) { if (e.target.closest('[data-wcc="go"]')) { ov.remove(); finish(); } });
  }
  // The World Cup's own trophies (both shown only while World Cup mode is on): 8-0, Champions, then the six from 5 Oct
  var WC_TROPHY_NAMES = { wc80: '8-0', wcchamp: 'World Champions', wcsweep: 'Clean Sweep', wcpool: 'Pool Winners', wcgiant: 'Giant Killer',
    wctasman: 'Trans-Tasman Double', wcpacific: 'Pacific Pride', wcnation: 'One Nation' };
  var PACIFIC = ['sam', 'ton', 'fij', 'png', 'cok'];
  function wcTrophies(r) {
    var ids = [], ko = r.games.slice(5), team = (STATE.team || []).filter(Boolean), by = {};
    if (r.perfect) ids.push('wc80');
    if (r.stage === 4) ids.push('wcchamp');
    if (r.games.slice(0, 5).every(function (g) { return g.won; })) ids.push('wcsweep');
    if (r.pos === 1) ids.push('wcpool');
    if (ko.some(function (g) { return g.won && (g.opp === 'aus' || g.opp === 'nzl'); })) ids.push('wcgiant');
    var beat = function (k) { return r.games.some(function (g) { return g.won && g.opp === k; }); };
    if (beat('aus') && beat('nzl')) ids.push('wctasman');
    if (team.length === 13 && team.every(function (p) { return PACIFIC.indexOf(p.club) >= 0; })) ids.push('wcpacific');
    team.forEach(function (p) { by[p.club] = (by[p.club] || 0) + 1; });
    if (Object.keys(by).some(function (k) { return NATIONS[k] && by[k] >= 6; })) ids.push('wcnation');
    return ids;
  }

  // What the draft used: wildcards (the team sheet's pill, like Classic: Rerolls, Reveals and Remove Players) and World Cup
  // Picks (the leaderboards' boost mark). A resumed World Cup has them from its save (keep); one saved before they were
  // kept has none (null: no pill, never a false "No Wildcards")
  function used() {
    if (STATE.__resumed) return STATE.__used || null;
    var w = STATE.__wc || {};
    return { wc: (STATE.__rrN || 0) + (w.revealN || 0) + (w.removeN || 0), wcp: STATE.__wcp || 0, ileg: STATE.__ileg || 0, wch: STATE.__wch || 0, wchf: STATE.__wchf ? 1 : 0 };
  }
  function save(result, r) {
    var A = acct();
    if (!A || !A.record) return [];
    try { localStorage.setItem('270_played', '1'); } catch (e) { /* storage blocked */ }
    var picks = (STATE.team || []).filter(function (p) { return p; });
    var d = { losses: r.losses, stage: r.stage, pd: Math.max(-999, Math.min(999, r.pd)), rating: T.rating, sq: picks.map(function (p) { return sqOf(p, 2026); }) }; // with where a World Legend or 88+ player came from (pickSrc)
    var u = used();
    if (u) { d.wc = u.wc; if (u.wcp) d.wcp = u.wcp; if (u.ileg) d.ileg = u.ileg; if (u.wch) d.wch = u.wch; if (u.wchf) d.wchf = 1; } // World Champions Picks: the server checks each was spent
    // Drafted with a Team of the Week player: the week, so the server counts his boost in the team rating (lib/boards.js)
    var tw = picks.filter(function (p) { return p.tw && p.twId; })[0];
    if (tw) d.tw = tw.twId;
    A.record({
      game: '27-0', mode: 'wc', score: r.wins, result: result, win: r.stage === 4, top: !!r.perfect,
      picks: picks.map(function (p) { return typeof playerKey === 'function' ? playerKey(p.name) : p.name; }),
      d: d
    });
    // Returns the trophies this World Cup unlocked (their ids)
    return A.unlock ? (A.unlock(wcTrophies(r)) || []).map(function (k) { return String(k).split(':')[1]; }) : [];
  }
  // Share on the results page: the World Cup as a picture with the line (shared, or saved where a phone can't share
  // pictures); the line alone if the picture can't be made
  window.wcShare = function () {
    if (!T) return;
    var text = shareLine() + '\nThink you can go 8-0? https://castgames.com.au/27-0/';
    if (window.CastAccount && window.CastAccount.inviteText) text = window.CastAccount.inviteText(text); // Invite a Mate v2: their invite code
    var asText = function () {
      if (navigator.share) { navigator.share({ text: text }).catch(function () { /* closed */ }); return; }
      try { navigator.clipboard.writeText(text).then(function () { alert270('Copied. Paste it anywhere.'); }); } catch (e) { alert270(text); }
    };
    // Post or Story (17 Oct 2026, the owner: a Story size to share to Stories). The choice is the tap the share sheet needs
    var go = function (story) {
      var key = story ? 'runStory' : 'run', made = T.shares && T.shares[key] && T.shares[key].ready;
      track('share_click', { mode: 'world_cup', size: story ? 'story' : 'post' });
      if (made) { shareBlob(made.blob, made.name, text); return; }
      makeRunShare(story).then(function (x) { shareBlob(x.blob, x.name, text); }, asText);
    };
    var old = document.querySelector('.wc-share-pick');
    if (old) old.remove();
    var d = document.createElement('div');
    d.className = 'wc-share-pick'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Share your World Cup');
    d.innerHTML = '<div class="wc-sp-box"><b>Share Your World Cup</b>' +
      '<button type="button" data-sz="post"><span aria-hidden="true">&#x1F5BC;&#xFE0F;</span> Post <small>4:5</small></button>' +
      '<button type="button" data-sz="story"><span aria-hidden="true">&#x1F4F1;</span> Story <small>9:16</small></button>' +
      '<button type="button" class="wc-sp-x" data-sz="x">Cancel</button></div>';
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sz]');
      if (!b && e.target !== d) return;
      d.remove();
      if (b && b.getAttribute('data-sz') !== 'x') go(b.getAttribute('data-sz') === 'story');
    });
    document.body.appendChild(d);
  };
  // A big win as a picture (a knockout win, or beating Australia or New Zealand): 1080x1350, shared or saved
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fitText(c, t, cx, y, max, size) { var s = size; c.font = '800 ' + s + 'px Inter, sans-serif'; while (c.measureText(t).width > max && s > 20) { s -= 2; c.font = '800 ' + s + 'px Inter, sans-serif'; } c.textAlign = 'center'; c.fillText(t, cx, y); }
  // Share sheet, or the picture saved: a closed sheet is fine, anything else (an in-app browser, the tap's permission
  // lapsing) saves it instead
  function shareBlob(blob, name, text) {
    var file = null;
    try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { file = null; }
    var keep = function () {
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: text }).catch(function (e) { if (!e || e.name !== 'AbortError') keep(); }); return; }
    keep();
  }
  // Both pictures' World Cup blue, with faint diagonal stripes
  function backdrop(x, W, H) {
    var bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#073a5e'); bg.addColorStop(1, '#020a13');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.save(); x.globalAlpha = 0.06; x.fillStyle = '#7dd3fc';
    for (var d = -H; d < W; d += 120) { x.beginPath(); x.moveTo(d, 0); x.lineTo(d + 50, 0); x.lineTo(d + 50 + H * 0.5, H); x.lineTo(d + H * 0.5, H); x.closePath(); x.fill(); }
    x.restore();
  }
  // The picture for game i, made once (as the full-time card shows), so a tap can share it straight away
  function makeShare(i) {
    T.shares = T.shares || {};
    if (T.shares[i]) return T.shares[i];
    var g = T.run.games[i], W = 1080, H = 1350, cv = document.createElement('canvas'), x = cv.getContext && cv.getContext('2d');
    if (!x) return Promise.reject(new Error('no canvas'));
    cv.width = W; cv.height = H;
    var name = '27-0 World Cup ' + (g.kind === 'pool' ? 'Win' : KO_WORD[g.kind]) + '.png';
    var text = myName() + ' ' + (g.kind === 'final' ? 'won the World Cup' : 'beat ' + side(g.opp) + ' ' + g.my + '-' + g.their) + ' on 27-0';
    var mine = myBadge(), pic = null;
    T.shares[i] = new Promise(function (done, fail) {
    var draw = function () {
      backdrop(x, W, H);
      var center = function (t, y, font, col) { x.font = font; x.fillStyle = col; x.textAlign = 'center'; x.fillText(t, W / 2, y); };
      center('RUGBY LEAGUE WORLD CUP 2026', 150, '900 40px Inter, sans-serif', '#7dd3fc');
      center(g.kind === 'pool' ? 'POOL GAME ' + (i + 1) : g.kind === 'qf' ? 'QUARTER FINAL' : g.kind === 'sf' ? 'SEMI FINAL' : 'THE FINAL', 232, '900 72px Inter, sans-serif', '#ffffff');
      var plate = function (k, cx) {
        var n = NATIONS[k], me = n ? null : mine, c1 = n ? n[4] : me && me.c1 || '#1a1a2a', c2 = n ? n[5] : me && me.c2 || '#ffffff', c3 = n ? n[6] : me && (me.c3 || me.c1) || '#1a1a2a';
        var bw = 260, bh = 150, bx = cx - bw / 2, by = 320;
        x.save(); rr(x, bx, by, bw, bh, 22); x.clip();
        if (me && pic) { x.fillStyle = '#1a1a2a'; x.fillRect(bx, by, bw, bh); x.drawImage(pic, cx - bh / 2, by, bh, bh); }
        else { x.fillStyle = c1; x.fillRect(bx, by, bw, bh * 0.72); x.fillStyle = c3; x.fillRect(bx, by + bh * 0.72, bw, bh * 0.28); }
        x.restore();
        x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.3)'; rr(x, bx, by, bw, bh, 22); x.stroke();
        if (!(me && pic)) { x.font = '900 64px Inter, sans-serif'; x.fillStyle = c2; x.textAlign = 'center'; x.fillText(n ? n[3] : me && me.abbr || 'YOU', cx, by + 84); }
        x.fillStyle = '#e0f2fe'; fitText(x, nameOf(k), cx, 540, 420, 40);
      };
      plate('you', 290); plate(g.opp, 790);
      center(g.my + '-' + g.their, 770, '900 200px Inter, sans-serif', '#ffffff');
      center(g.kind === 'final' ? 'World Champions' : g.kind === 'sf' ? 'Into the World Cup Final' : g.kind === 'qf' ? 'Into the Semi Finals' : 'Beat ' + side(g.opp), 880, '900 58px Inter, sans-serif', '#bae6fd');
      if (g.kind !== 'pool' && (g.opp === 'aus' || g.opp === 'nzl')) center('Knocked Out ' + side(g.opp), 950, '800 40px Inter, sans-serif', '#e0f2fe');
      center('Can you go 8-0?', 1170, '900 48px Inter, sans-serif', '#ffffff');
      center('27-0.app', 1235, '800 38px Inter, sans-serif', '#7dd3fc');
      var out = function () { cv.toBlob(function (b) { if (b) done({ blob: b, name: name, text: text }); else fail(new Error('no picture')); }, 'image/png'); };
      var img = new Image();
      img.onload = function () { var h = 110, w = h * img.naturalWidth / img.naturalHeight; x.drawImage(img, W / 2 - w / 2, 1000, w, h); out(); };
      img.onerror = out;
      img.src = 'assets/img/27-0-logo.png';
    };
    var go = function () { (document.fonts && document.fonts.load ? document.fonts.load('900 40px Inter') : Promise.resolve()).then(draw, draw); };
    if (mine && mine.img) { pic = new Image(); pic.onload = go; pic.onerror = function () { pic = null; go(); }; pic.src = mine.img; } else go();
    });
    T.shares[i].catch(function () { T.shares[i] = null; }); // tried again at the next tap
    return T.shares[i];
  }
  window.wcShareWin = function (i) {
    var g = T && T.run.games[i];
    if (!g) return;
    track('share_click', { mode: 'world_cup_win', kind: g.kind });
    var made = T.shares && T.shares[i] && T.shares[i].ready;
    if (made) { shareBlob(made.blob, made.name, made.text); return; }
    makeShare(i).then(function (x) { shareBlob(x.blob, x.name, x.text); }, function () { alert270('The picture could not be made. Try again.'); });
  };
  // The whole World Cup as a picture (Share on the results page, 5 Oct 2026): the record, how far they went, the team, the
  // eight results (knockouts never reached greyed) and "Can you go 8-0?" (no Golden Boot since 10 Oct 2026, the owner: it
  // looks confusing). 1080x1350, made once
  // story: the same picture on a 1080x1920 Story, the layout centred (17 Oct 2026)
  function makeRunShare(story) {
    T.shares = T.shares || {};
    var key = story ? 'runStory' : 'run';
    if (T.shares[key]) return T.shares[key];
    var r = T.run, W = 1080, H = story ? 1920 : 1350, cv = document.createElement('canvas'), x = cv.getContext && cv.getContext('2d');
    if (!x) return Promise.reject(new Error('no canvas'));
    cv.width = W; cv.height = H;
    var name = '27-0 World Cup ' + r.wins + '-' + r.losses + (story ? ' Story' : '') + '.png';
    var made = T.shares[key] = new Promise(function (done, fail) {
      var draw = function () {
        backdrop(x, W, H);
        if (story) x.translate(0, (1920 - 1350) / 2);
        var center = function (t, y, font, col) { x.font = font; x.fillStyle = col; x.textAlign = 'center'; x.fillText(t, W / 2, y); };
        center('RUGBY LEAGUE WORLD CUP 2026', 200, '900 38px Inter, sans-serif', '#7dd3fc');
        center(r.wins + '-' + r.losses, 410, '900 230px Inter, sans-serif', '#ffffff');
        center(r.perfect ? 'Unbeaten World Champions' : STAGE_WORD[r.stage], 488, '900 60px Inter, sans-serif', '#bae6fd');
        x.fillStyle = '#e0f2fe'; fitText(x, myName() + ' · Team Rating ' + T.rating, W / 2, 546, 940, 38);
        // A game: the other side's colours and code, edged green for a win or red for a loss, the score under it
        var chip = function (g, label, cx, y) {
          var w = 170, h = 118, bx = cx - w / 2;
          x.textAlign = 'center'; x.font = '900 26px Inter, sans-serif'; x.fillStyle = '#7dd3fc'; x.fillText(label, cx, y - 16);
          if (!g) {
            rr(x, bx, y, w, h, 18); x.fillStyle = 'rgba(255,255,255,.05)'; x.fill();
            x.lineWidth = 3; x.strokeStyle = 'rgba(125,211,252,.18)'; x.stroke();
            x.font = '900 44px Inter, sans-serif'; x.fillStyle = 'rgba(224,242,254,.3)'; x.fillText('-', cx, y + 74);
            return;
          }
          var n = NATIONS[g.opp] || ['', '', '', '?', '#1a1a2a', '#ffffff', '#1a1a2a'], col = g.won ? '#4ade80' : '#f87171';
          x.save(); rr(x, bx, y, w, h, 18); x.clip(); x.fillStyle = n[4]; x.fillRect(bx, y, w, h * 0.72); x.fillStyle = n[6]; x.fillRect(bx, y + h * 0.72, w, h * 0.28); x.restore();
          x.lineWidth = 6; x.strokeStyle = col; rr(x, bx, y, w, h, 18); x.stroke();
          x.font = '900 50px Inter, sans-serif'; x.fillStyle = n[5]; x.fillText(n[3], cx, y + 66);
          x.font = '900 40px Inter, sans-serif'; x.fillStyle = col; x.fillText((g.won ? 'W ' : 'L ') + g.my + '-' + g.their, cx, y + h + 50);
        };
        for (var k = 0; k < 5; k++) chip(r.games[k], 'G' + (k + 1), 156 + k * 192, 638);
        ['QF', 'SF', 'FINAL'].forEach(function (lb, n) { chip(r.games[5 + n], lb, 348 + n * 192, 882); });
        center('Can you go 8-0?', 1178, '900 52px Inter, sans-serif', '#ffffff');
        center('27-0.app', 1250, '800 36px Inter, sans-serif', '#7dd3fc');
        var out = function () { cv.toBlob(function (b) { if (b) done({ blob: b, name: name }); else fail(new Error('no picture')); }, 'image/png'); };
        var img = new Image();
        img.onload = function () { var h = 96, w = h * img.naturalWidth / img.naturalHeight; x.drawImage(img, W / 2 - w / 2, 46, w, h); out(); };
        img.onerror = out;
        img.src = 'assets/img/27-0-logo.png';
      };
      (document.fonts && document.fonts.load ? document.fonts.load('900 40px Inter') : Promise.resolve()).then(draw, draw);
    });
    made.catch(function () { if (T && T.shares && T.shares[key] === made) T.shares[key] = null; }); // tried again at the next tap
    return made;
  }

  /* ---------- Resume (5 Oct 2026, the owner's call) ----------
     The World Cup is saved on this phone at every step: if the app closes, the home card offers "Resume: Game 4 v Tonga" or
     Start a New World Cup. A game being watched is saved as not yet kicked off (its result and tries are already set, so
     watching it again changes nothing). Only for the signed-in player who saved it; dropped after 7 days, when it ends
     (before the result is saved, so it can never count twice) or when a new World Cup kicks off. */
  var LS_RUN = 'wc_run_v1', LS_LAST = 'wc_run_last', RUN_DAYS = 7;
  function uid() { var A = acct(); return A && A.uid ? A.uid() : null; }
  function keep() {
    if (!T || T !== STATE.wc || T.done || T.phase === 'over' || !isWc()) return;
    var me = uid();
    if (!me) return;
    var t = { id: T.id, run: T.run, rating: T.rating, shown: T.shown, phase: T.phase === 'live' ? 'pre' : T.phase, ev: T.ev, potm: T.potm, seen: T.seen, drawn: T.drawn };
    try { localStorage.setItem(LS_RUN, JSON.stringify({ v: 1, uid: me, at: Date.now(), name: STATE.teamName, team: STATE.team, season: STATE.season, t: t, used: used() })); } catch (e) { /* storage full or blocked: no resume */ }
  }
  function drop() { try { localStorage.removeItem(LS_RUN); } catch (e) { /* storage blocked */ } }
  // The signed-in player's saved World Cup, or null (one too old or from an older build is dropped)
  function savedRun() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(LS_RUN) || 'null'); } catch (e) { s = null; }
    if (!s) return null;
    var t = s.t;
    if (s.v !== 1 || !t || !t.run || !Array.isArray(t.run.games) || !Array.isArray(s.team) || !s.season || !(Date.now() - (s.at || 0) < RUN_DAYS * 864e5)) { drop(); return null; }
    var me = uid();
    return me && s.uid === me ? s : null;
  }
  // Where it picks up, for the home card
  function resumeWhere(s) {
    var t = s.t, i = t.shown, g = t.run.games[i];
    if ((t.phase === 'draw' && !t.drawn) || (t.phase === 'ft' && i === 5 && g)) return 'Resume: Quarter Final Draw';
    if (!g) return 'Resume Your World Cup'; // every game played: the trophy or the result is next
    return 'Resume: ' + (g.kind === 'pool' ? 'Game ' + (i + 1) : KO_WORD[g.kind]) + ' v ' + nameOf(g.opp);
  }
  function resume(s) {
    load().then(function () {
      var t = s.t;
      stopAuto(); stopLive();
      STATE = { team: s.team, takenNames: new Set(s.team.filter(Boolean).map(function (p) { return p.name; })), currentSpin: null, pendingPlayer: null, season: s.season,
        spinPickedThisSpin: false, teamName: s.name || 'My Team', yearFrom: 2026, yearTo: 2026, showRatings: true, rerollUsed: false, gameMode: 'wc', packs: [], packIdx: 0, packAllCards: [], packPlayers: [],
        __resumed: true, __used: s.used && typeof s.used.wc === 'number' ? { wc: s.used.wc, wcp: s.used.wcp || 0, ileg: s.used.ileg || 0, wch: s.used.wch || 0, wchf: s.used.wchf ? 1 : 0 } : null };
      T = { id: t.id, run: t.run, rating: t.rating, shown: t.shown, phase: t.phase, ev: t.ev || [], potm: t.potm || [], seen: t.seen || { bc: 0, a: 0, ko: 0 }, drawn: !!t.drawn, done: false };
      STATE.wc = T;
      document.body.classList.add('cp-wc');
      var lbl = document.getElementById('spinClubLbl');
      if (lbl) lbl.textContent = 'Nation';
      track('wc_resume', { game: T.shown + 1, phase: T.phase });
      renderTournament();
      if (typeof showScreen === 'function') showScreen('wc-season');
    }, function () { alert270('The World Cup squads did not load. Check your connection and try again.'); });
  }
  // The World Cup card (and links to World Cup mode): their saved World Cup if there is one, else a new one
  window.wcHome = function () {
    var s = on() && signedIn() ? savedRun() : null;
    if (s) { resume(s); return; }
    if (window.cpPlay) window.cpPlay('wc'); else { selectMode('wc'); startSelectedMode(); }
  };
  // Is the World Cup on screen saved for Resume? (js/theme-fx.js's New Game and Change Mode boxes say so; a draft isn't)
  window.wcSaved = function () { var s = T && !T.done ? savedRun() : null; return !!(s && s.t.id === T.id); };
  // Start a New World Cup (under the card): a new draft; the saved one stays until the new World Cup kicks off
  window.wcNew = function () { track('wc_new', {}); if (window.cpPlay) window.cpPlay('wc'); else { selectMode('wc'); startSelectedMode(); } };
  window.wcAgain = function () { if (window.cpPlay) window.cpPlay('wc'); };
  window.wcBoard = function () { var A = acct(); if (A && A.openBoards) A.openBoards(['270wc', 'today'], 'wc'); else if (A && A.open) A.open('boards'); };

  /* ---------- Home: the World Cup card (big until the final, then small) ---------- */
  function firstVisit() { return typeof window.cpFirstVisit === 'function' && window.cpFirstVisit(); }
  /* While the World Cup is on (10 Oct 2026, the owner: "keep it under classic until end of world cup"): the Daily
     Challenge sits under the mode cards, World Cup and the main mode first; back in its own place after the final (15 Nov) */
  var dailyMark = null;
  function placeDaily(live) {
    var d = document.getElementById('cpDaily'), picker = document.querySelector('.cp-mode-picker');
    if (!d || !picker) return;
    if (!dailyMark) { dailyMark = document.createComment(' the Daily Challenge '); d.parentNode.insertBefore(dailyMark, d); }
    if (live && today() <= '2026-11-15') { if (picker.nextSibling !== d) picker.parentNode.insertBefore(d, picker.nextSibling); }
    else if (dailyMark.nextSibling !== d) dailyMark.parentNode.insertBefore(d, dailyMark.nextSibling);
  }
  function paintHome() {
    var big = document.getElementById('modeWcBtn'), mini = document.getElementById('modeWcMini'), main = document.getElementById('modeClassicBtn');
    if (!big || !mini || !main) return;
    // late: the small card under More Modes. Since 17 Oct 2026 always (the owner: World Cup 8-0 is its own game on CAST
    // Games, so 27-0's home no longer leads with it), and the Daily Challenge keeps its own place
    var live = on(), late = true, s = live && signedIn() ? savedRun() : null, where = s ? resumeWhere(s) : '';
    placeDaily(false);
    var nb = document.getElementById('wcNewBtn');
    Array.prototype.forEach.call(document.querySelectorAll('[data-cast-wc]'), function (n) { n.hidden = !live; }); // the FAQ's World Cup question
    big.hidden = !live || late;
    mini.hidden = !live || !late;
    if (live && !late) {
      // A guest's first visit keeps Classic first, World Cup just under it; everyone else gets World Cup first
      var under = firstVisit() && !signedIn(), next = nb && big.nextSibling === nb ? nb.nextSibling : big.nextSibling;
      if (under) { if (main.nextSibling !== big) main.parentNode.insertBefore(big, main.nextSibling); }
      else if (next !== main) main.parentNode.insertBefore(big, main);
      var go = big.querySelector('.cp-mode-go');
      // a guest's free World Cup today: Play Free (12 Oct 2026); once it's played, Sign In to Play
      var A0 = acct(), free = !signedIn() && !!(A0 && A0.wcFreeLeft && A0.wcFreeLeft());
      if (go) go.innerHTML = (where ? esc(where) : signedIn() ? 'Play Now' : free ? 'Play Free' : 'Sign In to Play') + ' <i>&#x25B6;</i>';
      big.setAttribute('aria-label', where ? where + ', World Cup 8-0' : 'Play World Cup 8-0');
      // A saved World Cup: Start a New World Cup sits under the card (outside it: the card is a button)
      if (where && !nb) {
        nb = document.createElement('button');
        nb.type = 'button'; nb.id = 'wcNewBtn'; nb.className = 'cp-wc-new'; nb.textContent = 'Start a New World Cup';
        nb.onclick = function () { window.wcNew(); };
      }
      if (where && big.nextSibling !== nb) big.parentNode.insertBefore(nb, big.nextSibling);
    }
    if (nb) nb.hidden = !where || !live || late;
    var tag = mini.querySelector('.cpm-tag');
    if (tag) tag.textContent = where && late ? where : 'The 8-0 Long Road';
    // The card's ten nation chips carry their looks (once)
    Array.prototype.forEach.call(big.querySelectorAll('.cp-wc-strip i:not(.has-look)'), function (el) {
      var k = String(el.textContent || '').trim().toLowerCase(), lk = NATIONS[k] ? look(k, 30, 22, 2) : '';
      if (lk) lk = lk.replace(/^<span class="([^"]*)"/, '<span class="$1" data-nat-fit="' + k + ' 2"'); // drawn again at its real size (CastNations.fit)
      if (lk) { el.innerHTML = lk + '<span>' + esc(el.textContent) + '</span>'; el.classList.add('has-look'); }
    });
    if (window.CastNations && CastNations.fit) CastNations.fit(big);
    var more = mini.parentNode;
    if (more) more.style.setProperty('--n', more.querySelectorAll('.cp-mode-mini:not([hidden])').length);
    if (live && !squads) load().catch(function () { /* tried again at the tap */ });
  }
  // Home again (the logo, New Game, Change Mode): the card catches up with a World Cup saved or finished since
  wrap('showScreen', function (orig, args) { var out = orig.apply(this, args); if (args[0] === 'setup') paintHome(); return out; });
  window.addEventListener('cast:launch', function (e) { if (e.detail && e.detail.game === 'wc') paintHome(); });
  window.addEventListener('cast:tier', paintHome);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintHome); else paintHome();
  setTimeout(paintHome, 1500); // the account's launch answer may come in a moment after the page
  window.cpWcPaint = paintHome;
})();
