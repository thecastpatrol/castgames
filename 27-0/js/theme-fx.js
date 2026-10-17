/* 27-0 theme effects: sound, club colours on the field and list, small animations.
   Purely cosmetic. Hooks run AFTER the original game functions and never change their
   results, so gameplay is identical with or without this file. */
(function () {
  'use strict';

  /* ---------------- Sound (same tones as Cast house) ---------------- */

  var KEY = '270_sound';
  var sound = true;
  try { sound = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* storage blocked */ }

  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, unlocked = false;

  function audioReady() {
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    }
    if (ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
    return ctx;
  }

  // iOS: play on the "ambient" channel, which mixes with the player's own music (Spotify, Apple Music) instead
  // of stopping it. The trade-off: the Ring/Silent switch mutes game sounds, like most games.
  function useMediaChannel() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* n/a */ }
  }

  function unlockAudio() {
    if (!sound || !AC) return;
    try {
      if (!unlocked) useMediaChannel();
      var c = audioReady();
      var src = c.createBufferSource(); src.buffer = c.createBuffer(1, 1, 22050); src.connect(c.destination); src.start(0);
      if (c.state === 'running') unlocked = true;
    } catch (e) { /* audio unavailable */ }
  }
  ['touchend', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlockAudio, true); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ctx && ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
  });

  var lastPlay = {};
  function tone(freq, dur, type, when, vol) {
    if (!sound || !ctx) return;
    var key = freq + '|' + (when || 0), now = Date.now();
    if (lastPlay[key] && now - lastPlay[key] < 60) return; // no pile-ups when many fire at once
    lastPlay[key] = now;
    try {
      if (ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () {});
      var t0 = ctx.currentTime + 0.01 + (when || 0);
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + dur + 0.03);
    } catch (e) { /* ignore */ }
  }

  var sfx = {
    tick: function () { tone(1200, 0.035, 'square', 0, 0.06); },
    land: function () { tone(660, 0.1, 'triangle', 0, 0.3); tone(990, 0.16, 'triangle', 0.07, 0.3); },
    pick: function () { tone(523, 0.1, 'triangle', 0, 0.35); tone(784, 0.16, 'triangle', 0.08, 0.35); },
    wild: function () { tone(660, 0.12, 'sine', 0, 0.35); tone(990, 0.16, 'sine', 0.07, 0.35); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.28, 'triangle', i * 0.12, 0.35); }); },
    fail: function () { tone(262, 0.3, 'triangle', 0, 0.35); tone(196, 0.45, 'triangle', 0.2, 0.35); }
  };

  // Run the original, then play a sound / add polish. Never alters arguments or return value.
  function after(name, fx) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      var out = orig.apply(this, arguments);
      try { fx.apply(this, arguments); } catch (e) { /* cosmetic only */ }
      return out;
    };
  }

  after('flashRandom', function () { sfx.tick(); });
  after('finalSpin', function () {
    sfx.land();
    if (rerollFlip) {
      rerollFlip = false;
      setTimeout(function () {
        document.body.classList.remove('cp-rerolled'); void document.body.offsetWidth;
        document.body.classList.add('cp-rerolled');
        setTimeout(function () { document.body.classList.remove('cp-rerolled'); }, 1600);
      }, 30);
    }
    ['spinClubSlot', 'spinYearSlot'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.classList.remove('cp-landed'); void el.offsetWidth; el.classList.add('cp-landed'); }
    });
  });
  after('placePlayer', function () { sfx.pick(); flashNewSlot(); });
  after('packAssignPlayer', function () { sfx.pick(); flashNewSlot(); });
  // Reroll: the big burst card (same as the Cast house wildcards), then the new squad flips in
  var rerollFlip = false;
  after('useReroll', function () {
    sfx.wild();
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el.tagName === 'DIV' && /Reroll Activated/.test(el.textContent || '') && el.style.position === 'fixed') el.remove();
    });
    rerollBurst();
    rerollFlip = true;
  });
  function rerollBurst() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var el = document.createElement('div');
    el.className = 'cp-burst';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="cp-burst-ring"></span><span class="cp-burst-ring cp-burst-ring2"></span>' +
      '<span class="cp-burst-card"><span class="cp-burst-ico">&#x1F504;</span><span class="cp-burst-title">Reroll!</span>' +
      // World Cup mode spins nations (7 Oct 2026, the owner: "should say new country or nation")
      '<span class="cp-burst-sub">' + (typeof STATE !== 'undefined' && STATE && STATE.gameMode === 'wc' ? 'New nation to choose from' : 'New club and season to choose from') + '</span></span>';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400);
  }
  after('show270Celebration', function () { sfx.win(); });
  after('showWoodenSpoonAnimation', function () { sfx.fail(); });
  after('openPackAnimation', function () { sfx.land(); });

  /* ---------------- Trophies earned this season (the account module skips ones you have) ---------------- */

  function trophiesFor(s, f, perfect, fw, daily) {
    var ids = [], team = (STATE.team || []).filter(function (p) { return p; });
    var rating = s.rating || STATE.rating || 0;
    if (perfect) ids.push('perfect');
    if (s.wins + fw === 0) ids.push('winless');
    if (f.isChampion) ids.push('premiers');
    if (s.myLadderPos === 1) ids.push('minor');
    if (s.myLadderPos === 18) ids.push('spoon');
    // Underdogs (premiers rated under 80) was retired on 5 Oct 2026
    if (rating >= 94) ids.push('elite');
    if (team.length === 13) {
      var clubs = {};
      team.forEach(function (p) { clubs[p.club] = 1; });
      var n = Object.keys(clubs).length;
      if (n === 1) ids.push('oneclub');
      if (n === 13) ids.push('melting');
      squadTrophies(team, ids);
    }
    // Heart Stopper: the grand final won by a single try (finals are scored in tries); Golden Boot: 25+ tries in the season
    var gf = ((f.weeks || []).filter(function (w) { return w.label === 'GRAND FINAL'; })[0] || { games: [] }).games[0];
    if (f.isChampion && gf && gf.wTries - gf.lTries === 1) ids.push('heart');
    if ((s.playerTries || []).some(function (t) { return t >= 25; })) ids.push('boot');
    // Who is in which spot: STATE.team is in spot order (SLOTS[i]). Only Pack mode also notes the spot on the player (pos),
    // so the Johns Brothers never came in Classic, Hard or the Daily until 5 Oct 2026 (a player's report)
    var at = function (name, type) { return (STATE.team || []).some(function (p, i) { return !!p && p.name === name && !!SLOTS[i] && SLOTS[i].type === type; }); };
    if (at('Andrew Johns', 'HB') && at('Matthew Johns', 'FE')) ids.push('johns');
    if (STATE.gameMode === 'pack' && f.isChampion) ids.push('packprem');
    if (STATE.gameMode === 'hard' && f.isChampion) ids.push('hardprem');
    if (STATE.gameMode === 'hard' && perfect) ids.push('hard27');
    if (daily) {
      // Dead Eye: a Target Daily hit exactly, or (6 Oct 2026, the owner's call: Target days ended on 29 Sep, so nobody could earn
      // it) a Daily finished on its goal exactly, like 88 on an 88+ day
      if ((daily.theme.type === 'target' && Math.abs(rating - daily.theme.target) === 0) ||
          (typeof daily.theme.goal === 'number' && rating === daily.theme.goal)) ids.push('bangon');
      if (daily.theme.type === 'match' && f.isChampion) ids.push('matchday');
    }
    return ids;
  }
  /* The 13's own trophies (5 Oct 2026), by each player's spun club and season (a Pick's season is the first of its era):
     Maroon Machine (all Queensland clubs), Blue Wall (all NSW clubs: no Raiders, the owner's call), Class Of (one season),
     Time Traveller (a 1998 and a 2026 season), Fresh Faces (2020 on), Old School (2004 back), True Colours (5+ from the
     profile's club or a club it grew from), and Family Business or Namesakes from the names (js/cast-account.js) */
  var QLD = { broncos: 1, cowboys: 1, titans: 1, dolphins: 1 };
  var NSW = { bulldogs: 1, eels: 1, knights: 1, panthers: 1, rabbitohs: 1, roosters: 1, seaeagles: 1, sharks: 1, tigers: 1, dragons: 1,
    northerneagles: 1, balmain: 1, bears: 1, steelers: 1, stgeorge: 1, wmagpies: 1 };
  function squadTrophies(team, ids) {
    var CA = window.CastAccount, yrs = team.map(function (p) { return p.year; });
    if (team.every(function (p) { return QLD[p.club]; })) ids.push('maroon');
    if (team.every(function (p) { return NSW[p.club]; })) ids.push('bluewall');
    if (yrs.every(function (y) { return Number.isInteger(y); })) {
      if (yrs.every(function (y) { return y === yrs[0]; })) ids.push('classof');
      if (yrs.indexOf(1998) >= 0 && yrs.indexOf(2026) >= 0) ids.push('timetravel');
      if (yrs.every(function (y) { return y >= 2020; })) ids.push('fresh');
      if (yrs.every(function (y) { return y <= 2004; })) ids.push('oldschool');
    }
    var fan = CA.fanClub && CA.fanClub();
    if (fan && team.filter(function (p) { return CA.homeClub(p.club) === fan; }).length >= 5) ids.push('colours');
    if (CA.nameTrophies) CA.nameTrophies(team.map(function (p) { return typeof playerKey === 'function' ? playerKey(p.name) : p.name; })).forEach(function (id) { ids.push(id); });
  }

  /* ---------------- Extra rerolls, all inside the Reroll button ----------------
     Everyone: 1 reroll. CAST Profile: +1 every game (shows "2 left"). At 0 left the same button offers
     one more: subscribe on YouTube (or sign in first). Not in the Daily or Pack mode, so boards stay fair.
     Once CAST Pass launches (CastAccount.tier() is not null): guests start with the reroll locked ("Sign in"),
     CAST Profile gets 1 and CAST Pass 2, and signing in mid-season unlocks it in the same season. */

  function extraOk() {
    return window.CastAccount && CastAccount.bonusState && !(window.CastDaily && CastDaily.isActive()) && STATE.gameMode !== 'pack' && STATE.gameMode !== 'hard';
  }
  // Extra rerolls for this game, set once per game (STATE is a fresh object each game)
  function extras() {
    if (STATE.__cpExtra === undefined) {
      STATE.__cpExtra = extraOk() && CastAccount.profileRerolls ? CastAccount.profileRerolls() : 0;
      if (extraOk() && CastAccount.tier && CastAccount.tier() === 'guest') { STATE.rerollUsed = true; STATE.__tierLocked = true; }
    }
    return STATE.__cpExtra;
  }
  function bonusOffer() { return extraOk() && CastAccount.bonusState() !== 'none'; }
  function grant27() { STATE.__cpExtra = extras() + 1; STATE.bonusRerolls = (STATE.bonusRerolls || 0) + 1; if (typeof updateRerollBtn === 'function') updateRerollBtn(); }

  /* A Reroll (stronger wildcards, below at boostSpots): 7 times in 10 its new squad has one who beats the best free player
     who fits in the squad on show. Installed first so it runs inside the extra-reroll wrapper here, after an extra one is spent */
  var plainReroll = window.useReroll;
  if (typeof plainReroll === 'function') {
    window.useReroll = function () {
      if (STATE && !STATE.rerollUsed && !STATE.spinPickedThisSpin && STATE.currentSpin) {
        var best = (STATE.currentSpin.players || []).filter(fitsFree).reduce(function (m, p) { return Math.max(m, p.rating || 0); }, 0);
        boostSet(best + 1);
      }
      return plainReroll.apply(this, arguments);
    };
  }
  var baseReroll = window.useReroll;
  if (typeof baseReroll === 'function') {
    window.useReroll = function () {
      extras(); // decides this game's rerolls first (a guest's is locked once CAST Pass launches)
      var spinOn = STATE.currentSpin && STATE.currentSpin.players && STATE.currentSpin.players.length && !STATE.spinPickedThisSpin;
      if (STATE.rerollUsed && spinOn && extras() > 0) { STATE.__cpExtra--; STATE.rerollUsed = false; } // spend an extra one
      else if (STATE.rerollUsed && STATE.__tierLocked) { CastAccount.requireSignIn(null, 'wildcards'); return; } // a guest: sign in free
      else if (STATE.rerollUsed) { if (bonusOffer()) CastAccount.followBonus(grant27); return; }       // out: offer the bonus
      var out = baseReroll.apply(this, arguments);
      if (STATE.rerollUsed && !extras() && bonusOffer() && CastAccount.nudgeBonus) setTimeout(function () { CastAccount.nudgeBonus(grant27); }, 1800);
      return out;
    };
  }

  // Signed in (or got CAST Pass) mid-season: unlock the reroll in this same season
  window.addEventListener('cast:tier', function (e) {
    if (typeof STATE === 'undefined' || !STATE || STATE.__cpExtra === undefined) return;
    var t = e.detail && e.detail.tier;
    if (STATE.__tierLocked && t && t !== 'guest') { STATE.__tierLocked = false; STATE.rerollUsed = false; }
    if (t === 'pass' && extraOk() && !STATE.__passExtra && STATE.__cpExtra < 1) { STATE.__cpExtra += 1; STATE.__passExtra = true; }
    if (typeof updateRerollBtn === 'function') updateRerollBtn();
  });
  // A guest's 6th season of the day (a new season or Play Again) waits for a free sign-in, then starts by itself
  var baseStartMode = window.startSelectedMode;
  if (typeof baseStartMode === 'function') {
    window.startSelectedMode = function () {
      var self = this, args = arguments;
      if (window.CastAccount && CastAccount.guestGate && !CastAccount.guestGate(function () { baseStartMode.apply(self, args); }, STATE && STATE.gameMode)) return;
      return baseStartMode.apply(this, args);
    };
  }

  after('updateRerollBtn', function () {
    var btn = document.getElementById('rerollBtn'), cnt = document.getElementById('rerollCount');
    if (!btn || !cnt) return;
    var left = (STATE.rerollUsed ? 0 : 1) + extras();
    var spinOn = STATE.currentSpin && STATE.currentSpin.players && STATE.currentSpin.players.length && !STATE.spinPickedThisSpin;
    btn.classList.remove('cp-bonus-reroll');
    if (STATE.__tierLocked) {
      cnt.textContent = '(Sign in)';
      btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
      btn.classList.add('cp-bonus-reroll');
    } else if (left > 0) {
      cnt.textContent = '(' + left + ' left)';
      if (STATE.rerollUsed && spinOn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
    } else if (bonusOffer()) {
      cnt.textContent = CastAccount.bonusState() === 'signin' ? '(+1: sign in)' : '(\u25B6 +1 free)';
      btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
      btn.classList.add('cp-bonus-reroll');
    }
  });

  /* ---------------- CAST Games account: team sheets ----------------
     A leaderboard team sheet asks the game for club badges (27-0's own colours, historic clubs included)
     and, for seasons saved before each pick's rating was kept, the player's rating. */
  if (window.CAST_ACCOUNT) {
    window.CAST_ACCOUNT.club = function (id) {
      if (typeof CLUB_COLORS === 'undefined' || !CLUB_COLORS[id]) return null;
      var bg = CLUB_COLORS[id];
      return { abbr: CLUB_ABBR[id] || String(id).slice(0, 3).toUpperCase(), bg: bg, fg: _clubTextColor(bg), name: (CLUBS[id] || {}).name || ({ easts: 'Eastern Suburbs', glebe: 'Glebe' })[id] || id };
    };
    var ratingsByName = null;
    window.CAST_ACCOUNT.player = function (game, name) {
      if (game !== '27-0' || typeof RAW_PLAYERS === 'undefined') return null;
      if (!ratingsByName) {
        ratingsByName = {};
        RAW_PLAYERS.forEach(function (r) { ratingsByName[playerKey(r[0]).toLowerCase()] = Math.max(67, r[3]); });
      }
      var r = ratingsByName[String(name).toLowerCase()];
      return r ? { rating: r } : null;
    };
  }

  /* ---------------- Seeded spins: challenges and the Vault ----------------
     Every Classic and Hard season is dealt from a seed (STATE.__seed): each spin's club and season come from it, so a
     friend challenged to the same season gets the same spins (a reroll takes the next one). The Daily seeds its own.
     A Superstar Key (CAST Pass Vault) makes the next spin a club and season with a 95+ player who fits an open spot. */
  function hash32(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function newSeed() {
    var a = new Uint32Array(2);
    try { window.crypto.getRandomValues(a); } catch (e) { a[0] = Math.random() * 4294967296; a[1] = Math.random() * 4294967296; }
    var s = (a[0].toString(36) + a[1].toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 12) || 'seed' + Date.now().toString(36);
    var P = window.CAST_PROMO;
    return P ? P.mark(P.clean(s)) : s; // a season dealt in a promo carries its mark (js/cast-promo.js)
  }
  function dailyOn() { return !!(window.CastDaily && CastDaily.isActive && CastDaily.isActive()); }
  var nextSeed = null; // a friend's challenge: the next season plays their draft
  after('startGame', function () {
    if (dailyOn()) return;
    STATE.__seed = nextSeed || newSeed(); STATE.__ch = !!nextSeed; STATE.__k = 0; nextSeed = null;
  });
  var SUPERSTARS = null;
  // Where the next spin can land for a Superstar Key: pool spots (club and season) with a 95+ player who is free and fits
  function superstarSpots() {
    if (typeof RAW_PLAYERS === 'undefined' || typeof getSpinPool !== 'function') return [];
    if (!SUPERSTARS) SUPERSTARS = RAW_PLAYERS.filter(function (r) { return Math.max(67, r[3]) >= 95; });
    var pool = getSpinPool(), at = {}, open = SLOTS.filter(function (s) { return !STATE.team[s.i]; }), out = [];
    pool.forEach(function (c, i) { at[c.cid + '|' + c.year] = i; });
    SUPERSTARS.forEach(function (r) {
      if (STATE.takenNames.has(r[0])) return;
      var fits = r[2].some(function (pos) { return (ELIGIBLE_SLOTS[pos] || [pos]).some(function (type) { return open.some(function (s) { return s.type === type; }); }); });
      if (!fits) return;
      r[1].forEach(function (st) { for (var y = st[1]; y <= st[2]; y++) { var i = at[st[0] + '|' + y]; if (i != null && !(CLUBS[st[0]].skip && CLUBS[st[0]].skip.indexOf(y) >= 0)) out.push(i); } });
    });
    return out;
  }
  window.cpSuperstarReady = function () { return superstarSpots().length > 0; };
  /* Stronger wildcards (2 Oct 2026, the owner's call), toned down 3 Oct (2 better players every time was too easy to farm):
     7 times in 10 (BOOST_CHANCE), a Reroll's new squad, and the next spin after Remove Player, have 1 free player who fits
     your open spots and is rated above the best one rerolled (or the one removed), from a squad with just the one when
     there is such a squad; the rest of the time it's a normal spin. The roll is seeded, so a friend's challenge rolls the
     same. Classic and Hard (a friend's challenge too); not the Daily, Packs or Quick Draft (it plans the plain spins).
     STATE.__boost waits for the next spin */
  var BOOST_CHANCE = 0.7;
  function boostOn() { return typeof STATE !== 'undefined' && !!STATE && !!STATE.__seed && !dailyOn() && !STATE.__qd && (STATE.gameMode === 'classic' || STATE.gameMode === 'hard'); }
  function fitsFree(p) { return !STATE.takenNames.has(p.name) && getAvailableSlotsForPlayer(p).length > 0; }
  function boostSet(min) {
    if (!boostOn()) return false;
    var roll = mulberry32(hash32('27-0|boost|' + STATE.__seed + '|' + (STATE.__boostN = (STATE.__boostN || 0) + 1)))();
    STATE.__boost = roll < BOOST_CHANCE ? { min: Math.max(1, min), n: 1 } : null;
    return !!STATE.__boost;
  }
  window.cpBoost = boostSet;
  // Spins (by index) whose squad has n free players above min who fit an open spot: exactly n, or at least n
  function boostSpots(min, n, exact) {
    if (typeof getSpinPool !== 'function' || typeof getSquadForClubYear !== 'function') return [];
    var out = [];
    getSpinPool().forEach(function (c, i) {
      if (CLUBS[c.cid].skip && CLUBS[c.cid].skip.indexOf(c.year) >= 0) return;
      var sq = getSquadForClubYear(c.cid, c.year), good = 0;
      for (var k = 0; k < sq.length && good <= n; k++) if (sq[k].rating >= min && fitsFree(sq[k])) good++;
      if (exact ? good === n : good >= n) out.push(i);
    });
    return out;
  }
  var baseFinal = window.finalSpin;
  if (typeof baseFinal === 'function') {
    window.finalSpin = function () {
      if (typeof STATE === 'undefined' || !STATE.__seed || dailyOn() || STATE.gameMode === 'pack') return baseFinal.apply(this, arguments);
      var rng = mulberry32(hash32('27-0|ch|' + STATE.__seed + '|' + (STATE.__k++))), origRand = window.rand, forced = -1, first = true;
      if (STATE.__superNext) { var spots = superstarSpots(); STATE.__superNext = false; STATE.__boost = null; if (spots.length) forced = spots[Math.floor(Math.random() * spots.length)]; }
      else if (STATE.__boost) { // a Reroll or Remove Player that rolled the boost: 1 better player (a squad with just him if there is one)
        var b = STATE.__boost, bs = boostSpots(b.min, b.n, true);
        STATE.__boost = null;
        if (!bs.length) bs = boostSpots(b.min, b.n);
        if (bs.length) forced = bs[Math.floor(rng() * bs.length)];
      }
      window.rand = function (min, max) { if (first && forced >= 0) { first = false; return forced; } first = false; return Math.floor(rng() * (max - min + 1)) + min; };
      try { return baseFinal.apply(this, arguments); } finally { window.rand = origRand; }
    };
  }
  // A friend's challenge (from the CAST Profile, or a ?challenge= link): their mode, era, ratings setting and seed
  function setupChallenge(c) {
    var cfg = c.cfg || {}, fe = document.getElementById('eraSliderFrom'), te = document.getElementById('eraSliderTo');
    if (typeof selectMode === 'function') selectMode(c.mode);
    if (fe && te && cfg.from) {
      fe.value = cfg.from; te.value = cfg.to || 2026;
      if (typeof _updateSliderZIndex === 'function') _updateSliderZIndex(+fe.value, +te.value);
      if (typeof updateEraUI === 'function') updateEraUI(+fe.value, +te.value);
    }
    if (c.mode === 'classic' && typeof setRatings === 'function') setRatings(cfg.rat === 0 ? 'off' : 'on');
    nextSeed = c.seed;
    if (typeof startSelectedMode === 'function') startSelectedMode();
  }
  if (window.CAST_ACCOUNT) {
    window.CAST_ACCOUNT.startChallenge = function (c) {
      if (!c || (c.mode !== 'classic' && c.mode !== 'hard')) return false;
      askHome(function () { setupChallenge(c); }, (c.from ? c.from + '\u2019s' : 'the') + ' challenge');
      return true;
    };
  }

  /* ---------------- Quick Draft (the owner's challenges, from the CAST Profile) ----------------
     A challenge's spins depend only on its seed, so the whole draft is known before the first spin. Quick Draft plans
     the strongest 13 from those spins (the highest squad rating, with rerolls spent where they gain the most), plays
     the plan spin by spin with the game's own functions, then plays the season through. The game is saved like any
     other challenge answer, marked qd: the server keeps it off the leaderboards, and it earns no trophies. */
  var SLOT_W = [1.3, 0.8, 0.8, 0.9, 0.9, 1.2, 1.5, 0.9, 1.1, 0.9, 0.9, 0.9, 1.0]; // calcTeamRating's weights, by slot
  function qdFits(p, i) { return p.positions.some(function (pos) { return (ELIGIBLE_SLOTS[pos] || [pos]).indexOf(SLOTS[i].type) >= 0; }); }
  function qdWorth(p, i) { return SLOT_W[i] * (p.name === 'Jai Arrow' ? 95 : p.rating); }
  function qdBits(m) { var n = 0; while (m) { m &= m - 1; n++; } return n; }
  // Spin k of this seed, exactly as the seeded finalSpin deals it, without touching the game
  function qdPeek(seed, k) {
    var rng = mulberry32(hash32('27-0|ch|' + seed + '|' + k)), r = function (a, b) { return Math.floor(rng() * (b - a + 1)) + a; };
    var pool = getSpinPool(), cid, year, players = [], tries = 0;
    do {
      var pick = pool[r(0, pool.length - 1)];
      cid = pick.cid; year = pick.year;
      if (CLUBS[cid].skip && CLUBS[cid].skip.indexOf(year) >= 0) { tries++; continue; }
      players = getSquadForClubYear(cid, year);
      tries++;
    } while (players.length < 2 && tries < 60);
    return { cid: cid, year: year, players: players };
  }
  function qdRerolls() { extras(); return (STATE.__tierLocked ? 0 : (STATE.rerollUsed ? 0 : 1)) + (STATE.__cpExtra || 0); }
  // Best plan: for each spin, a pick {slot, name} or a reroll. Every spin must be picked from unless it is rerolled, so
  // this is a search over (spins dealt, spots filled): at most 16 x 8192 states. The same player dealt on two spins is
  // kept on one and the plan is made again. Quick Draft also stays at 92 or under (the owner's call, 27 Sep 2026): over
  // that, the plan's best player is left out and it plans again.
  var QD_MAX = 92, W_SUM = 13.1; // calcTeamRating: the weighted average of the 13, rounded
  function qdPlan(spins, R) {
    var K = spins.length, N = 1 << 13, FULL = N - 1, ban = {};
    for (var round = 0; round < 80; round++) {
      var best = spins.map(function (sp, k) {
        return SLOTS.map(function (sl, i) {
          var top = null, v = -1;
          sp.players.forEach(function (p) { if (!ban[k + '|' + p.name] && qdFits(p, i) && qdWorth(p, i) > v) { v = qdWorth(p, i); top = p; } });
          return top ? { v: v, p: top } : null;
        });
      });
      var f = new Float64Array((K + 1) * N).fill(-Infinity), how = new Int8Array((K + 1) * N).fill(-1);
      f[0] = 0;
      for (var k = 0; k < K; k++) {
        for (var m = 0; m < N; m++) {
          var cur = f[k * N + m];
          if (cur === -Infinity) continue;
          var pc = qdBits(m);
          if (pc === 13) continue;
          if (k - pc < R) { var j = (k + 1) * N + m; if (cur > f[j]) { f[j] = cur; how[j] = 13; } }
          for (var i = 0; i < 13; i++) {
            if ((m & (1 << i)) || !best[k][i]) continue;
            var j2 = (k + 1) * N + (m | (1 << i)), v2 = cur + best[k][i].v;
            if (v2 > f[j2]) { f[j2] = v2; how[j2] = i; }
          }
        }
      }
      var endK = -1, endV = -Infinity;
      for (var e = 13; e <= K; e++) if (f[e * N + FULL] > endV) { endV = f[e * N + FULL]; endK = e; }
      if (endK < 0) return null;
      var steps = [], mm = FULL;
      for (var k2 = endK; k2 > 0; k2--) {
        var h = how[k2 * N + mm];
        if (h === 13) steps.unshift({ reroll: true });
        else { steps.unshift({ slot: h, name: best[k2 - 1][h].p.name }); mm ^= (1 << h); }
      }
      var seen = {}, dup = null;
      steps.forEach(function (st, k3) { if (st.name) { if (seen[st.name] && !dup) dup = { k: k3, name: st.name }; seen[st.name] = true; } });
      if (dup) { ban[dup.k + '|' + dup.name] = true; continue; }
      if (Math.round(endV / W_SUM) <= QD_MAX) return steps;
      var star = null;
      steps.forEach(function (st, k4) {
        if (!st.name) return;
        var pl = spins[k4].players.filter(function (x) { return x.name === st.name; })[0], r = pl ? qdWorth(pl, 0) / SLOT_W[0] : 0;
        if (!star || r > star.r) star = { k: k4, name: st.name, r: r };
      });
      if (!star) return null;
      ban[star.k + '|' + star.name] = true;
    }
    return null;
  }
  function qdWait(test, ms) {
    return new Promise(function (ok, no) {
      var t0 = Date.now();
      (function loop() {
        var v = false;
        try { v = test(); } catch (e) { v = false; }
        if (v) return ok(v);
        if (Date.now() - t0 > ms) return no(new Error('Quick Draft timed out. Your challenge is still waiting.'));
        setTimeout(loop, 40);
      })();
    });
  }
  function qdScreen() { var a = document.querySelector('.screen.active'); return a ? a.id : ''; }
  // Play the plan: deal each spin, then pick or reroll. A spin that is not what the plan expected (it never should be)
  // switches to the best live pick for the rest of the draft.
  function qdPlay(spins, steps) {
    var onPlan = !!steps;
    function live() {
      var sp = STATE.currentSpin || { players: [] }, top = null, v = -1;
      sp.players.forEach(function (p) {
        if (STATE.takenNames.has(p.name)) return;
        for (var i = 0; i < 13; i++) if (!STATE.team[i] && qdFits(p, i) && qdWorth(p, i) > v) { v = qdWorth(p, i); top = { slot: i, name: p.name }; }
      });
      return top || (qdRerolls() > 0 ? { reroll: true } : null);
    }
    return new Promise(function (ok, no) {
      function step() {
        if (slotsFilledCount() === 13) return ok();
        var k = STATE.__k - 1, sp = STATE.currentSpin, want = spins[k];
        if (!sp || !want || sp.cid !== want.cid || sp.year !== want.year) onPlan = false;
        var mv = onPlan && steps[k] ? steps[k] : live();
        if (mv && mv.name && (STATE.team[mv.slot] || STATE.takenNames.has(mv.name))) { onPlan = false; mv = live(); }
        if (!mv) return no(new Error('No player on this spin fits an open spot and there are no rerolls left.'));
        if (mv.reroll) {
          var was = STATE.__k;
          window.useReroll();
          return qdWait(function () { return STATE.__k === was + 1 && !STATE.spinPickedThisSpin; }, 6000).then(step, no);
        }
        var p = sp.players.filter(function (x) { return x.name === mv.name; })[0];
        if (!p || !qdFits(p, mv.slot)) return no(new Error('Quick Draft lost its place in the draft. Your challenge is still waiting.'));
        placePlayer(p, mv.slot);
        if (slotsFilledCount() === 13) return ok();
        window.finalSpin();
        step();
      }
      window.finalSpin();
      step();
    });
  }
  // Squad full: lock in (the Remove Player choice), then play the regular season out. Quick Draft never goes 27-0 (the
  // owner's call, 27 Sep 2026): an unbeaten 24-0 regular season is played again, so a 27-0 challenger always wins. Then
  // straight past the finals to the results (the finals screen can turn up a moment later on a phone, so the wait
  // watches for it rather than looking once)
  // The Lock In button stays in the page after it is tapped, so it is tapped once and the wait watches the screen (tapping
  // it again and again re-ran the lock-in until Quick Draft timed out, 27 Sep 2026)
  function qdSeason() {
    var tapped = false;
    return qdWait(function () {
      if (qdScreen() === 'squad-complete') return true;
      var lock = !tapped && document.querySelector('#playerSection [data-d="lock"]');
      if (lock) { tapped = true; lock.click(); }
      return false;
    }, 8000).then(function () {
      // A 93+ squad always goes 27-0 (only if a spin was not what the plan expected): stop before the season, so the
      // challenge stays waiting and nothing is saved
      if (calcTeamRating() > QD_MAX) throw new Error('This draft came out rated ' + calcTeamRating() + ', which always goes 27-0, so Quick Draft stopped. Your challenge is still waiting.');
      for (var n = 0; n < 25; n++) {
        startSeason();
        var s = STATE.season;
        for (var i = 0; i < s.schedule.length; i++) if (!s.schedule[i].bye && !s.schedule[i].result) resolveGame(i);
        if (s.losses > 0) break;
      }
      renderFixtureList(); updateSeasonSidebar(); finishRegularSeason();
      var skipped = false;
      return qdWait(function () {
        var at = qdScreen();
        if (at === 'finals-viewer' && !skipped) { skipped = true; fvSkipFinals(); return false; }
        var go = document.querySelector('#cel27 .cel-continue');
        if (go) { go.click(); return false; }
        return at === 'results' && !document.getElementById('cel27');
      }, 15000);
    });
  }
  if (window.CAST_ACCOUNT) {
    window.CAST_ACCOUNT.quickDraft = function (c) {
      if (!c || (c.mode !== 'classic' && c.mode !== 'hard')) return Promise.reject(new Error('Quick Draft plays 27-0 Classic and Hard challenges.'));
      var at = qdScreen();
      if (at && at !== 'setup' && at !== 'results') return Promise.reject(new Error('Finish or leave the season you are playing first.'));
      askHome(function () { setupChallenge(c); });
      return qdWait(function () { return qdScreen() === 'draft' && STATE.__ch && STATE.__seed === c.seed && STATE.__k === 0 && slotsFilledCount() === 0; }, 8000)
        .then(function () {
          STATE.__qd = true;
          var R = qdRerolls(), spins = [];
          for (var k = 0; k < 13 + R; k++) spins.push(qdPeek(c.seed, k));
          return qdPlay(spins, qdPlan(spins, R));
        })
        .then(qdSeason);
    };
  }

  /* ---------------- Never stuck: the page always scrolls ----------------
     The share card, install and Pack pop-ups lock the page while they show. If one ever goes away without unlocking it,
     the draft can't scroll down to the players, so each new screen, spin and pick unlocks it unless one is showing. */
  function unstick() {
    if (document.body.style.overflow !== 'hidden') return;
    var share = document.getElementById('shareModal'), showing = !!(share && share.classList.contains('open'));
    ['installModal', 'packPromoModal'].forEach(function (id) { var m = document.getElementById(id); if (m && m.style.display === 'flex') showing = true; });
    if (!showing) document.body.style.overflow = '';
  }
  after('showScreen', unstick);
  after('finalSpin', unstick);
  after('placePlayer', unstick);

  /* ---------------- Signed in: your team plays under your leaderboard name ----------------
     The team name boxes show your username and can't be changed while you're signed in. Signing out gives the box back
     (with whatever name was there before). */
  function lockTeamName() {
    var nm = window.CastAccount && CastAccount.username ? CastAccount.username() : null;
    ['teamNameInput', 'packTeamNameInput'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (nm) {
        if (!el.hasAttribute('data-cp-own')) el.setAttribute('data-cp-own', el.readOnly ? '' : el.value || '');
        el.value = nm; el.readOnly = true; el.classList.add('cp-name-locked'); el.setAttribute('data-cp-as', nm);
        el.title = 'Signed in: your team plays as your username';
        el.setAttribute('aria-label', 'Team name: your username, ' + nm);
      } else if (el.readOnly) {
        // Signed out: back to their own name, never the username (a season started while signed in saved it)
        var was = el.getAttribute('data-cp-as') || '', own = el.getAttribute('data-cp-own') || '';
        try { if (was && localStorage.getItem('27_teamName') === was) localStorage.removeItem('27_teamName'); } catch (e) { /* storage blocked */ }
        el.readOnly = false; el.classList.remove('cp-name-locked'); el.value = own === was ? '' : own;
        el.removeAttribute('data-cp-own'); el.removeAttribute('data-cp-as');
        el.title = ''; el.setAttribute('aria-label', 'Team name (optional)');
      }
    });
    if (typeof optionsSummary === 'function') optionsSummary();
  }
  window.addEventListener('cast-account', function () { setTimeout(lockTeamName, 0); });
  after('resetGame', lockTeamName);
  var baseStartGame = window.startGame;
  if (typeof baseStartGame === 'function') window.startGame = function () { lockTeamName(); return baseStartGame.apply(this, arguments); };
  var basePackOpen = window.startPackOpening;
  if (typeof basePackOpen === 'function') window.startPackOpening = function () { lockTeamName(); return basePackOpen.apply(this, arguments); };
  setTimeout(lockTeamName, 0);

  /* ---------------- CAST Games account: record each season ---------------- */

  after('showResults', function () {
    if (!window.CastAccount || typeof STATE === 'undefined' || !STATE.season) return;
    try { localStorage.setItem('270_played', '1'); } catch (e) { /* storage blocked */ }
    // Replays of past Dailies are just for fun: never saved, ranked or awarded
    if (window.CastDaily && CastDaily.isReplay && CastDaily.isReplay()) return;
    var s = STATE.season, f = s.finals || {};
    var journey = f.myTeamInFinals ? (f.myJourney || []) : [];
    var fw = journey.filter(function (j) { return j.won; }).length;
    var fl = journey.length - fw;
    var perfect = s.wins === 24 && s.losses === 0 && f.isChampion && journey.every(function (j) { return j.won; }) && (s.wins + fw) === 27;
    var result = perfect ? '27-0' : f.isChampion ? 'premiers' : f.myTeamInFinals ? 'finals' : s.myLadderPos === 18 ? 'spoon' : 'missed';
    var daily = window.CastDaily && window.CastDaily.current();
    var d = { losses: s.losses + fl, ladder: s.myLadderPos, rating: s.rating, from: STATE.yearFrom || null, to: STATE.yearTo || null };
    // The draft's seed and ratings setting (so it can be sent as a challenge), and a Vault key if one boosted it
    if (!daily && (STATE.gameMode === 'classic' || STATE.gameMode === 'hard') && STATE.__seed) { d.seed = STATE.__seed; d.rat = STATE.showRatings ? 1 : 0; }
    if (!daily && STATE.__keyUsed) d.key = STATE.__keyUsed;
    if (!daily && STATE.__toty) d.toty = STATE.__toty; // Team of the Year Picks used (js/picks.js): the boost mark too
    if (!daily && STATE.__prem) d.prem = STATE.__prem; // Premiers Picks used (js/picks.js, the Grand Final promo): the boost mark too
    if (!daily && STATE.__imm) d.imm = STATE.__imm; // Immortal Picks used (js/picks.js): the boost mark, and how many Immortals the server accepts
    if (STATE.__qd) d.qd = 1; // Quick Draft (the owner's challenges): off the leaderboards, no trophies
    // Run back (Run It Back, below): the boost mark on the leaderboards; a 27-0 counts as a Perfect Season, trophy and all
    var rib = !daily && !!STATE.__rib;
    if (rib) d.rib = 1;
    // Wildcards used, for the team sheet (7 Oct 2026, the owner), counted like 1000TRIES: Rerolls (free, bonus and bought),
    // Reveal Ratings and Remove Player. Substitute doesn't count, and the Superstar Key has its own boost mark. Pack has none
    if (STATE.gameMode !== 'pack') { var wcs = STATE.__wc || {}; d.wc = (STATE.__rrN || 0) + (wcs.revealN || 0) + (wcs.removeN || 0); }
    // Each pick's spun club, season and rating ("raiders|2007|84"), in pick order, for the leaderboard team sheet
    // and where a special card came from (pickSrc, js/game-data-sim.js: "roosters|2026|95|T")
    d.sq = (STATE.team || []).filter(function (p) { return p; }).map(function (p) { return sqOf(p); });
    var top = perfect;
    if (daily) {
      d.daily = daily.n; d.date = daily.date; d.theme = daily.theme.type;
      if (daily.theme.type === 'target') { d.target = daily.theme.target; d.diff = Math.abs((s.rating || 0) - daily.theme.target); top = d.diff === 0; }
    }
    window.CastAccount.record({
      game: '27-0', mode: daily ? 'daily' : (STATE.gameMode || 'classic'), score: s.wins + fw, result: result, win: !!f.isChampion, top: top,
      // Namesakes go back to their tagged name ("Ben Jones (Raiders)"), and an Immortal Pick is "Andrew Johns (Immortal)",
      // which is what the server checks
      picks: (STATE.team || []).filter(function (p) { return p; }).map(function (p) { return p.pm === 'imm' ? p.name + ' (Immortal)' : typeof playerKey === 'function' ? playerKey(p.name) : p.name; }),
      d: d
    });
    if (window.CastAccount.unlock && !STATE.__qd) window.CastAccount.unlock(trophiesFor(s, f, perfect, fw, daily));
    // "Save this result" prompt under the Share / Play Again buttons
    var body = document.getElementById('resultsBody');
    var acts = body && body.querySelector('.cp-res-acts');
    if (body && !body.querySelector('[data-cast-results]')) {
      var box = document.createElement('div');
      box.setAttribute('data-cast-results', '');
      if (acts) acts.insertAdjacentElement('afterend', box); else body.insertBefore(box, body.firstChild);
    }
    if (body && result !== '27-0' && ribOn(daily)) ribCard(body, s, f); // never after a 27-0, and once a season
    window.CastAccount.refresh();
  });

  /* ---------------- Run It Back (28 Sep 2026; one more win from 1 Oct 2026, the owner's call) ----------------
     After a Classic season that wasn't 27-0, a player 15+ can run it back: $0.99 (or 3 for $1.99), or a saved one. The same
     season plays back with the same results, except one loss becomes a win: a lost Grand Final first (premiers),
     otherwise the narrowest regular-season loss (the finals stay as they were played, and the ladder keeps its order so
     they still match it). The rare 24-0 side knocked out before the Grand Final has that finals loss turned around and
     the rest of its finals played out fresh. Once a season (STATE.__rib); not in the Daily, a challenge, Quick Draft, Hard
     Mode or Pack. The season is saved with d.rib: the boost mark on the leaderboards, and a 27-0 is a Perfect Season. */
  function ribOn(daily) {
    return !daily && STATE.gameMode === 'classic' && !STATE.__ch && !STATE.__qd && !STATE.__rib && !!window.CastAccount && !!CastAccount.buyItem && !!CastAccount.canBuyReroll &&
      (CastAccount.canBuyReroll() || (!!CastAccount.canUseSaved && CastAccount.canUseSaved() && CastAccount.itemSaved('rib') > 0)); // under 15: a saved one only
  }
  function rec(r) { return r[0] + '-' + r[1]; }
  // What running it back does: kind 'gf' (the Grand Final), 'reg' (regular-season game idx) or 'fin' (the finals loss k that
  // knocked out a 24-0 side), with the record before and after (after: null for 'fin', which is at least one better)
  function ribPlan(s, f) {
    var j = f.myJourney || [], fw = j.filter(function (x) { return x.won; }).length, w = s.wins + fw, l = s.losses + j.length - fw, last = j[j.length - 1];
    // A squad rated 85 or under can't be premiers (js/game-data-sim.js, the owner's call): no Grand Final flip for it
    if (last && last.round === 'GRAND FINAL' && !last.won && Math.round(s.rating || 0) > 85) return { kind: 'gf', from: [w, l], to: [w + 1, l - 1] };
    var idx = -1, gap = 1e9;
    (s.schedule || []).forEach(function (g, i) {
      var r = g.result;
      if (r && !r.won && Math.abs(r.oppTries - r.myTries) < gap) { gap = Math.abs(r.oppTries - r.myTries); idx = i; } // the narrowest; the earliest of a tie
    });
    if (idx >= 0) return { kind: 'reg', idx: idx, from: [w, l], to: [w + 1, l - 1] };
    for (var k = 0; k < j.length; k++) if (!j[k].won) return { kind: 'fin', k: k, from: [w, l], to: null };
    return null;
  }
  function ribHook(s, f, plan) {
    if (plan.to && plan.to[0] === 27) return { title: 'One Loss From 27-0', line: 'Run it back and your one loss becomes a win: 27-0, a Perfect Season.' };
    if (plan.kind === 'gf') return { title: 'Win the Grand Final', line: 'Run it back and the Grand Final goes your way: premiers, ' + rec(plan.to) + '.' };
    if (plan.kind === 'reg') {
      var g = s.schedule[plan.idx], opp = (typeof FIXTURE_SHORT_NAME !== 'undefined' && FIXTURE_SHORT_NAME[g.opp]) || g.opp;
      return { title: 'One More Win', line: 'Run it back and your closest loss (Round ' + g.round + ' vs ' + opp + ', ' + g.result.score + ') becomes a win: ' + rec(plan.from) + ' becomes ' + rec(plan.to) + '.' };
    }
    return { title: 'Back Into the Finals', line: 'Run it back and the final that knocked you out goes your way, then the rest of the finals play out.' };
  }
  function ribLabel() {
    var n = CastAccount.itemSaved('rib'), fresh = !!(n && CastAccount.itemFresh && CastAccount.itemFresh('rib'));
    return { txt: '&#x23EA; Run It Back &middot; ' + (n ? n + (fresh ? ' ready' : ' saved') : '$0.99'), fresh: fresh };
  }
  function ribCard(body, s, f) {
    var old = body.querySelector('[data-cast-rib]'), plan = ribPlan(s, f);
    if (old) old.remove();
    if (!plan) return;
    var hook = ribHook(s, f, plan), lb = ribLabel(), card = document.createElement('div'), perfect = !!plan.to && plan.to[0] === 27;
    card.className = 'cp-rib'; card.setAttribute('data-cast-rib', '');
    card.innerHTML = '<div class="cp-rib-k">Run It Back</div><div class="cp-rib-t">' + hook.title + '</div><p>' + hook.line + '</p>' +
      '<button type="button" class="cp-rib-btn' + (lb.fresh ? ' ca-rr-fresh' : '') + '">' + lb.txt + '</button>' +
      '<small>' + (perfect ? 'Counts as a Perfect Season, with the boost mark on the leaderboards.' : 'Counts on the leaderboards with the boost mark. One per season.') + '</small>';
    var anchor = body.querySelector('[data-cast-results]');
    if (anchor) anchor.insertAdjacentElement('afterend', card); else body.insertBefore(card, body.firstChild);
    var st = STATE;
    card.querySelector('.cp-rib-btn').addEventListener('click', function () {
      CastAccount.buyItem('rib', '27-0', function () {
        if (STATE !== st || !STATE.season || STATE.__rib || STATE.team.filter(Boolean).length < 13) return;
        STATE.__rib = true;
        if (typeof gtag !== 'undefined') gtag('event', 'run_it_back', { event_category: 'game', squad_rating: STATE.season.rating, kind: plan.kind, from: rec(plan.from), to: plan.to ? rec(plan.to) : '' });
        runItBack(plan);
        window.scrollTo(0, 0);
      }, hook);
    });
  }
  // The season again with one loss turned into a win (the ladder keeps its order; the finals as played, but a lost Grand
  // Final turned around, or the rare 24-0 side's finals played again from the loss that knocked it out)
  function runItBack(plan) {
    var s = STATE.season, f = s.finals, me = (s.ladder || []).filter(function (t) { return t.name === myTeam(); })[0];
    if (plan.kind === 'reg') {
      // The score turned around: they score what the opponent did (more than they did, by at least a try)
      var g = s.schedule[plan.idx], r = g.result, hi = Math.max(r.myTries, r.oppTries), lo = Math.min(r.myTries, r.oppTries), my = hi > lo ? hi : lo + 1, extra = my - r.myTries;
      var had = r.scorers ? r.scorers.replace(/^Tries: /, '').split(', ') : [], more = extra > 0 && typeof assignTryScorers === 'function' ? assignTryScorers(extra) : [];
      if (extra > 0 && typeof assignAssists === 'function') assignAssists(extra);
      var all = had.concat(more);
      // Real goals on the turned-around score (7 Oct 2026); points before and after for the ladder
      var oldMy = r.my != null ? r.my : r.myTries * 6, oldOpp = r.opp != null ? r.opp : r.oppTries * 6;
      var k = typeof goalsFor === 'function' ? goalsFor(my, lo, myKickLevel(), clubKickLevel(g.opp)) : { wc: my, lc: lo, wp: 0, lp: 0, wf: 0, ws: my * 6, ls: lo * 6 };
      g.result = { won: true, score: k.ws + '-' + k.ls, scorers: all.length ? 'Tries: ' + all.join(', ') : '', myTries: my, oppTries: lo, my: k.ws, opp: k.ls,
        myConv: k.wc, oppConv: k.lc, myPens: k.wp, oppPens: k.lp, myFg: k.wf, oppFg: 0 };
      g.ribFlip = true;
      if (me) { me.wins++; me.pts += 2; me.pf = (me.pf || 0) + (k.ws - oldMy); me.pa = Math.max(0, (me.pa || 0) + (k.ls - oldOpp)); }
      // A regular season now 24-0 finishes 1st, as the engine always has it (finishRegularSeason's safety net)
      if (me && s.schedule.every(function (x) { return x.bye || (x.result && x.result.won); }) && s.ladder[0] !== me) {
        s.ladder.splice(s.ladder.indexOf(me), 1); s.ladder.unshift(me); s.myLadderPos = 1;
      }
    } else if (plan.kind === 'gf') {
      var wk = (f.weeks || []).filter(function (w) { return w.label === 'GRAND FINAL'; })[0], gm = wk && wk.games[0];
      if (gm) { var t = gm.winner; gm.winner = gm.loser; gm.loser = t; f.champion = gm.winner; }
      f.isChampion = true;
      f.myJourney[f.myJourney.length - 1].won = true;
    } else {
      var force = {};
      f.myJourney.forEach(function (x, i) { if (i <= plan.k) force[x.round] = true; });
      s.finals = runFinalsSeries(s.ladder.slice(0, 8), s.rating, force);
    }
    ribReplay(s, plan);
  }
  // Played back in a few seconds: the fixture list fills again and the record counts up, with a pause on the game turned
  // around (lit: game-data-sim.js fixtureRow), then the finals (or the results, if they missed them)
  function ribReplay(s, plan) {
    var results = s.schedule.map(function (g) { return g.result || null; }), order = [], n = 0;
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.schedule.forEach(function (g, i) { if (!g.bye) { g.result = null; order.push(i); } });
    s.wins = 0; s.losses = 0; s.pf = 0; s.pa = 0; s.tries = 0; s.streak = 0; s.streakType = null;
    document.body.classList.add('cp-rib-replay'); // Next Game, Auto Play and Skip All step aside
    showScreen('season'); renderFixtureList(); updateSeasonSidebar();
    (function step() {
      if (STATE.season !== s) { document.body.classList.remove('cp-rib-replay'); return; } // they left for a new game
      if (n >= order.length) { ribDone(s, plan); return; }
      var i = order[n++], r = results[i], g = s.schedule[i];
      g.result = r;
      if (r.won) { s.wins++; s.streak = s.streakType === 'W' ? s.streak + 1 : 1; s.streakType = 'W'; } else { s.losses++; s.streak = s.streakType === 'L' ? s.streak + 1 : 1; s.streakType = 'L'; }
      s.pf += r.my != null ? r.my : r.myTries * 6; s.pa += r.opp != null ? r.opp : r.oppTries * 6; s.tries += r.myTries;
      updateFixtureRow(i); updateSeasonSidebar();
      var row = document.getElementById('gr-' + i), list = document.getElementById('fixtureList');
      if (row && list) list.scrollTop = Math.max(0, row.offsetTop - list.offsetTop - list.clientHeight / 2);
      setTimeout(step, calm ? 0 : g.ribFlip ? 1400 : 110);
    })();
  }
  function ribDone(s, plan) {
    document.body.classList.remove('cp-rib-replay');
    var f = s.finals, btn = document.getElementById('nextGameBtn');
    if (btn) { btn.textContent = f && f.myTeamInFinals ? '🏆 View Finals' : '📊 See Results'; btn.onclick = launchFinalsViewer; }
    var note = document.createElement('div');
    note.className = 'cp-rib-done'; note.setAttribute('role', 'status');
    note.innerHTML = '<small>&#x23EA; Run It Back</small>' + (plan.to ? rec(plan.from) + ' becomes ' + rec(plan.to) : 'The final goes your way');
    document.body.appendChild(note);
    setTimeout(function () { if (note.parentNode) note.remove(); if (STATE.season === s && document.getElementById('season').classList.contains('active')) launchFinalsViewer(); }, 2200);
  }
  // Just bought, or used in the other game: the button's count
  window.addEventListener('cast:rerolls', function () {
    var b = document.querySelector('[data-cast-rib] .cp-rib-btn');
    if (!b || !window.CastAccount || !CastAccount.itemSaved) return;
    var lb = ribLabel();
    b.innerHTML = lb.txt; b.classList.toggle('ca-rr-fresh', lb.fresh);
  });

  /* ---------------- Home page pop-ups ----------------
     A newly launched Cast game (1000TRIES, once the owner presses Launch) gets its pop-up first: once per device, the
     first time, to anyone who hasn't played it (js/cast-account.js promo). Otherwise guests see the sign-up pop-up on their first open of the home page each
     day (the account module keeps the dates and never pitches to anyone signed in). Either waits for any other
     pop-up, and gives up if they have already tapped into a game or opened the rules. */
  function pitchBlocked() {
    if (document.documentElement.classList.contains('ca-open') || /^#(hiw|cast-profile|my-cast|join)/.test(location.hash)) return true;
    return Array.prototype.some.call(document.querySelectorAll('#socialModal, #privacyModal, #cpDailyHow, .cp-confirm, .modal-overlay'), function (m) {
      var cs = getComputedStyle(m);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && m.getBoundingClientRect().height > 0;
    });
  }
  function onHome() { var h = document.getElementById('setup'); return !!h && h.classList.contains('active'); }
  function pitchSoon(n) {
    setTimeout(function () {
      if (!window.CastAccount || !window.CastAccount.pitch || !onHome()) return;
      if (pitchBlocked()) { if (n < 10) pitchSoon(n + 1); return; }
      if (window.CastAccount.promo && window.CastAccount.promo('home')) return;
      window.CastAccount.pitch('home');
    }, n ? 1500 : 800); // first look 0.8 seconds after the page loads
  }
  if (document.readyState === 'complete') pitchSoon(0); else window.addEventListener('load', function () { pitchSoon(0); });
  // Launched while this page is open (or the answer came in after the first check): offer the new game
  window.addEventListener('cast:launch', function (e) { if (e.detail && e.detail.on) pitchSoon(0); });

  /* ---------------- Sound toggle in every header ---------------- */

  var ICON = '<svg class="ico-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>' +
    '<svg class="ico-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';

  function syncButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('.cp-sound'), function (b) {
      b.classList.toggle('is-on', sound);
      b.setAttribute('aria-pressed', String(sound));
      b.setAttribute('aria-label', sound ? 'Sound on' : 'Sound off');
      var l = b.querySelector('.cp-sound-lbl');
      if (l) l.textContent = sound ? 'Sound On' : 'Sound Off';
    });
  }

  function addSoundButtons() {
    var targets = [];
    var home = document.querySelector('.cp-site-header');
    // The home header keeps its buttons on the right (Stats, Leaderboards, Friends, Profile); sound lives in the footer
    if (home && !home.querySelector('.cp-right')) {
      var nav = home.querySelector('.cp-stats-btn');
      var wrap = document.createElement('div'); wrap.className = 'cp-right';
      if (nav) { home.insertBefore(wrap, nav); wrap.appendChild(nav); } else home.appendChild(wrap);
    }
    var foot = document.getElementById('siteFooter');
    if (foot && !foot.querySelector('.cp-sound')) {
      var fs = document.createElement('p'); fs.className = 'cp-foot-sound';
      foot.insertBefore(fs, foot.querySelector('.cp-footer-links') || foot.firstChild);
      targets.push(fs);
    }
    // A game's top bar matches 1000TRIES now (4 Oct 2026): no sound button there. The footer has one, and so does the
    // New Game pop-up for a change mid-game
    // Leaderboards button on the home header, before the account button (full screen page, accounts only)
    if (home && !home.querySelector('.cp-lb-btn') && window.CastAccount && window.CastAccount.openBoards) {
      var lbBtn = document.createElement('button');
      lbBtn.type = 'button';
      lbBtn.className = 'ca-nav-tab cp-lb-btn';
      lbBtn.setAttribute('aria-label', 'Leaderboards');
      lbBtn.innerHTML = '<span aria-hidden="true">&#x1F3C6;</span><span class="ca-nav-lbl"><span class="ca-lbl-l">Leaderboards</span><span class="ca-lbl-s">Rankings</span></span>';
      lbBtn.addEventListener('click', function () {
        if (typeof gtag !== 'undefined') gtag('event', 'leaderboard_open', { game: '27-0', where: 'header' });
        window.CastAccount.openBoards(null);
      });
      (home.querySelector('.cp-right') || home).appendChild(lbBtn);
    }
    // Friends (its own button, with a red count), then the CAST Games account button, before the sound toggle
    if (home && !home.querySelector('[data-cast-friends]')) {
      var fr = document.createElement('button');
      fr.type = 'button';
      fr.hidden = true;
      fr.setAttribute('data-cast-friends', '');
      fr.setAttribute('aria-label', 'Friends');
      (home.querySelector('.cp-right') || home).appendChild(fr);
    }
    if (home && !home.querySelector('[data-cast-account]')) {
      var acct = document.createElement('button');
      acct.type = 'button';
      acct.setAttribute('data-cast-account', '');
      acct.setAttribute('aria-label', 'Sign in to save your history');
      (home.querySelector('.cp-right') || home).appendChild(acct);
      if (window.CastAccount) window.CastAccount.refresh();
    }
    targets.forEach(function (t) {
      var b = document.createElement('button');
      var labelled = t.classList.contains('cp-foot-sound');
      b.type = 'button'; b.className = 'cp-sound' + (labelled ? ' cp-sound-foot' : ''); b.title = 'Sound'; b.innerHTML = ICON + (labelled ? '<span class="cp-sound-lbl">Sound</span>' : ''); b.__cpWired = true;
      b.addEventListener('click', function () {
        sound = !sound;
        try { localStorage.setItem(KEY, sound ? 'on' : 'off'); } catch (e) { /* ignore */ }
        syncButtons();
        if (sound) { unlockAudio(); sfx.pick(); }
      });
      t.appendChild(b);
    });
    syncButtons();
  }

  /* ---------------- Club colours on field spots and player rows ---------------- */

  function clubFrom(el, sel) {
    var tag = el.querySelector(sel);
    return tag ? (tag.style.background || tag.style.backgroundColor || '') : '';
  }

  // Row edges sit on a dark card, so near-black clubs (eg Panthers) use their text colour instead
  function isDark(col) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(col);
    return !!m && (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) < 40;
  }
  // A white or pale side (England, Fiji and the Cook Islands in World Cup 8-0): its field tile is light, so the name goes dark
  function isLight(col) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(col);
    return !!m && (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) > 160;
  }
  function edgeFrom(el) {
    var tag = el.querySelector('.club-tag');
    if (!tag) return '';
    var bg = tag.style.background || tag.style.backgroundColor || '';
    return isDark(bg) ? (tag.style.color || bg) : bg;
  }

  // Names already on the field, so only a newly placed player animates
  var onField = {};
  function fieldNames() {
    var names = {};
    Array.prototype.forEach.call(document.querySelectorAll('.fpos-circle.fp-filled .fpos-pname'), function (n) { names[n.textContent] = true; });
    return names;
  }
  function decorate() {
    // Jai Arrow (the tribute tile) keeps his white and green, never a club colour
    Array.prototype.forEach.call(document.querySelectorAll('.fpos-circle.fp-filled:not(.fp-tribute)'), function (c) {
      var col = clubFrom(c, '.fpos-club');
      if (col && c.style.getPropertyValue('--cp-club') !== col) c.style.setProperty('--cp-club', col);
      if (c.classList.contains('fp-light') !== isLight(col)) c.classList.toggle('fp-light', isLight(col)); // the owner, 5 Oct 2026
    });
    Array.prototype.forEach.call(document.querySelectorAll('.player-row:not(.pr-tribute)'), function (r) {
      var col = edgeFrom(r);
      if (col && r.style.getPropertyValue('--cp-club') !== col) r.style.setProperty('--cp-club', col);
    });
  }

  function flashNewSlot() {
    setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.fpos-circle.fp-filled'), function (c) {
        var n = c.querySelector('.fpos-pname');
        if (n && !onField[n.textContent]) c.classList.add('fp-flash-in');
      });
      onField = fieldNames();
    }, 30);
  }

  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; decorate(); });
  }).observe(document.body, { childList: true, subtree: true });

  /* ---------------- Home: mode cards and the YouTube row (Cast house layout) ---------------- */

  // One tap plays a mode, so the cards never show a picked one (Classic keeps its gold); the body class skins the game.
  // The Custom Seasons controls are Classic's, so a Pack season never hides them (game-core hides them for Pack)
  function syncMode() {
    var mode = (typeof STATE !== 'undefined' && STATE.gameMode) || 'classic';
    document.body.classList.toggle('cp-pack', mode === 'pack');
    var era = document.getElementById('eraOptions'), rt = document.getElementById('ratingsToggle');
    if (era) era.style.display = '';
    if (rt) rt.style.display = '';
  }
  after('selectMode', syncMode);

  var VIDEO_FEED = 'https://mediakit.thecastpatrol.com.au/data/episodes.json';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function loadVideos() {
    var track = document.getElementById('watchTrack'), box = document.getElementById('watch');
    if (!track || !box || !window.fetch) return;
    fetch(VIDEO_FEED, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var list = (data && data.episodes || []).filter(function (v) {
          return v && v.url && /^https:\/\/(www\.)?youtube\.com\//.test(v.url) && v.title;
        }).slice(0, 4);
        if (!list.length) return;
        track.innerHTML = list.map(function (v) {
          var d = v.published_at ? new Date(v.published_at) : null;
          var date = d && !isNaN(d) ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
          return '<a class="cp-vcard" href="' + esc(v.url) + '" target="_blank" rel="noopener">' +
            '<span class="cp-vthumb"><img src="' + esc(v.thumbnail || '') + '" alt="" loading="lazy"></span>' +
            '<span class="cp-vbody"><span class="cp-vtitle">' + esc(v.title) + '</span>' + (date ? '<span class="cp-vdate">' + esc(date) + '</span>' : '') + '</span></a>';
        }).join('');
        box.hidden = false;
      })
      .catch(function () { /* stays hidden */ });
  }

  // One-line summary of the Customise panel, so the settings are clear while it is closed
  window.cpOptionsSummary = function () { optionsSummary(); };
  function optionsSummary() {
    var out = document.getElementById('cpOptSummary');
    if (!out) return;
    // Only what the Custom Seasons controls set (the last mode played has nothing to do with it)
    var bits = [];
    var f = +(document.getElementById('eraSliderFrom') || {}).value || 1998, t = +(document.getElementById('eraSliderTo') || {}).value || 2026;
    bits.push(f === 1998 && t === 2026 ? 'All-Time' : f + ' to ' + t);
    var rt = document.getElementById('ratingsToggle');
    bits.push(rt && rt.getAttribute('data-val') === 'off' ? 'Ratings Hidden' : 'Ratings On');
    out.textContent = bits.join(' \u00B7 ');
  }
  after('updateEraUI', optionsSummary);
  after('setRatings', optionsSummary);
  after('selectMode', optionsSummary);

  /* ---------------- Change mode + logo home (same as the Cast house header) ---------------- */

  function modeModal() {
    var m = document.getElementById('cpModeModal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'cpModeModal';
    m.className = 'cp-confirm';
    m.style.display = 'none';
    m.innerHTML = '<div class="cp-confirm-backdrop" data-mm="close"></div>' +
      '<div class="cp-confirm-body" role="dialog" aria-modal="true" aria-labelledby="cpModeTitle">' +
        '<button type="button" class="cp-confirm-x" data-mm="close" aria-label="Close">&#x2715;</button>' +
        '<div class="cp-confirm-grab" aria-hidden="true"></div>' +
        '<div class="cp-confirm-ico" id="cpModeIco" aria-hidden="true">&#x1F3AE;</div>' +
        '<div class="cp-confirm-kicker" id="cpModeKick">Change mode?</div>' +
        '<h2 class="cp-confirm-title" id="cpModeTitle">Want to try a different mode?</h2>' +
        '<p class="cp-confirm-sub" id="cpModeSub">This season will be lost and you go back to pick a mode.</p>' +
        '<button type="button" class="cp-btn cp-btn-primary" data-mm="again" hidden></button>' +
        '<button type="button" class="cp-btn cp-btn-primary" data-mm="go">Choose a mode</button>' +
        '<button type="button" class="cp-btn cp-btn-ghost" data-mm="close">Keep going</button>' +
        '<button type="button" class="cp-sound cp-sound-foot cp-mm-sound" title="Sound">' + ICON + '<span class="cp-sound-lbl">Sound</span></button>' +
        // Subscribe to The Cast Patrol, the same button as the Play Again pop-up (index.html #socialModal)
        '<a class="yt-sub" href="https://www.youtube.com/@thecastpatrol?sub_confirmation=1" target="_blank" rel="noopener">' +
          '<img class="yt-avatar" src="assets/img/cast-patrol-avatar.jpg" alt="" width="40" height="40" loading="lazy">' +
          '<span class="yt-text"><span class="yt-kicker">Enjoying 27-0?</span><span class="yt-label">Subscribe to The Cast Patrol</span></span>' +
          '<svg class="yt-logo" viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" rx="5" fill="#fff"/><path d="M11 5.5v9l8-4.5z" fill="#FF0000"/></svg>' +
        '</a>' +
      '</div>';
    document.body.appendChild(m);
    syncButtons(); // its sound button shows on or off like the rest
    m.addEventListener('click', function (e) {
      if (e.target.closest('.yt-sub') && typeof gtag !== 'undefined') gtag('event', 'social_click', { platform: 'youtube_subscribe', placement: 'change_mode' });
      var a = e.target.closest('[data-mm]');
      if (!a) return;
      m.style.display = 'none';
      var act = a.getAttribute('data-mm');
      if (act === 'again') {
        // New Game > Play Again: home, then the same mode straight away (a Daily Challenge starts its next go)
        var mode = typeof STATE !== 'undefined' ? STATE.gameMode : 'classic', daily = window.CastDaily && window.CastDaily.isActive && window.CastDaily.isActive();
        afterHome = daily && window.CastDaily.start ? function () { window.CastDaily.start(); } : function () { window.cpPlay(mode); };
        goHome();
      } else if (act === 'go') goHome(); else afterHome = null;
    });
    return m;
  }
  var afterHome = null; // a mode to start once home (picked from the leaderboards)
  function goHome() {
    // CAST Games: every mode is its own page, so leaving a game goes back to CAST Games (17 Oct 2026, the owner); Play
    // Again (afterHome) starts the mode again here without the home showing (the showScreen wrap in boot)
    if (cgPage() && !afterHome) { CG.leave(); return; }
    if (typeof resetGame === 'function') resetGame();
    firstSteps(); // a first season just ended: the usual home again
    var then = afterHome;
    afterHome = null;
    if (then) setTimeout(then, 60);
  }
  // The results screen's Change Mode (4 Oct 2026, like 1000TRIES): home to pick a mode, the season is over anyway
  window.cpChangeMode = function () {
    if (typeof gtag !== 'undefined') gtag('event', 'results_change_mode', { game: '27-0' });
    afterHome = null; goHome();
  };
  // Results screen: nothing to lose, go straight home. Mid-game: confirm first. Given a mode to start (then, with its
  // label), the modal names it and that mode starts once home.
  function askHome(then, label) {
    afterHome = typeof then === 'function' ? then : null;
    var cur = document.querySelector('.screen.active');
    if (!cur || cur.id === 'setup') { var now = afterHome; afterHome = null; if (now) now(); return; }
    if (cur.id === 'results' || cur.id === 'wc-results') { goHome(); return; }
    var m = modeModal();
    mmLook(m, false);
    var daily = window.CastDaily && window.CastDaily.isActive(), next = afterHome ? label + ' starts straight away.' : 'you go back to pick a mode.';
    document.getElementById('cpModeTitle').textContent = afterHome ? 'Start ' + label + '?' : 'Want to try a different mode?';
    var wc = typeof STATE !== 'undefined' && STATE.gameMode === 'wc', kept = wc && window.wcSaved && window.wcSaved(); // a World Cup under way is saved (js/world-cup.js)
    document.getElementById('cpModeSub').textContent = daily ? 'This Daily go will still count as used, and ' + next : (kept ? 'Your World Cup is saved for later, and ' : wc ? 'This World Cup run will be lost and ' : 'This season will be lost and ') + next;
    m.querySelector('[data-mm="go"]').textContent = afterHome ? 'Start ' + label : 'Choose a mode';
    m.style.display = 'flex';
  }
  // The modal's two looks: Change Mode (from the leaderboards or the logo) and New Game (the header tab)
  function mmLook(m, isNew) {
    document.getElementById('cpModeIco').innerHTML = isNew ? '&#x1F504;' : '&#x1F3AE;';
    document.getElementById('cpModeKick').textContent = isNew ? 'New Game' : 'Change mode?';
    var again = m.querySelector('[data-mm="again"]'), go = m.querySelector('[data-mm="go"]'), keep = m.querySelector('[data-mm="close"]:not(.cp-confirm-x):not(.cp-confirm-backdrop)');
    again.hidden = !isNew;
    go.className = 'cp-btn ' + (isNew ? 'cp-btn-ghost' : 'cp-btn-primary');
    keep.className = 'cp-btn ' + (isNew ? 'cp-btn-quiet' : 'cp-btn-ghost');
    keep.textContent = isNew ? 'Keep Playing' : 'Keep going';
  }
  /* One New Game tab in a game's header (29 Sep 2026, the user's call: Mode and Again were two buttons; the same as
     1000TRIES): go again in this mode, change mode or keep playing, and Subscribe to The Cast Patrol */
  var MODE_NAME = { classic: 'Classic', hard: 'Hard', pack: 'Pack', wc: 'World Cup' };
  function askNew() {
    var cur = document.querySelector('.screen.active');
    if (!cur || cur.id === 'setup') return;
    var m = modeModal(), done = cur.id === 'results' || cur.id === 'wc-results', daily = window.CastDaily && window.CastDaily.isActive && window.CastDaily.isActive();
    var mode = typeof STATE !== 'undefined' ? STATE.gameMode : 'classic';
    afterHome = null;
    mmLook(m, true);
    document.getElementById('cpModeTitle').textContent = 'Start a New Game?';
    var kept = !done && mode === 'wc' && window.wcSaved && window.wcSaved(); // a World Cup under way is saved (js/world-cup.js)
    document.getElementById('cpModeSub').textContent = (done ? 'Good game. ' : daily ? 'This Daily Challenge go still counts as used. ' : kept ? 'Your World Cup is saved until you kick off a new one. ' : mode === 'wc' ? 'This World Cup run will be lost. ' : 'This season will be lost. ') + 'Go again or pick another mode.';
    m.querySelector('[data-mm="again"]').innerHTML = '<span class="cp-btn-ico" aria-hidden="true">&#x1F504;</span>' + (daily || !MODE_NAME[mode] ? 'Play Again' : 'Play ' + MODE_NAME[mode] + ' Again');
    m.querySelector('[data-mm="go"]').innerHTML = '<span class="cp-btn-ico" aria-hidden="true">&#x1F3AE;</span>Change Mode';
    m.style.display = 'flex';
  }
  // "Play" from the leaderboards' Not Ranked Yet box (the cast:play event from js/cast-account.js), or a link from
  // 1000TRIES (?play=pack): home (asking first mid-game), then straight into that mode
  var PLAY_LABEL = { classic: 'Classic Mode', pack: 'Pack Mode', hard: 'Hard Mode', daily: 'Today\u2019s Daily', wc: 'World Cup 8-0' }; // wc: js/world-cup.js
  function playMode(mode) {
    if (!PLAY_LABEL[mode]) return;
    if (mode === 'wc' && !(window.CastAccount && CastAccount.wcLive && CastAccount.wcLive())) return; // not launched yet
    askHome(function () {
      if (mode === 'daily') { if (window.CastDaily && CastDaily.start) CastDaily.start(); return; }
      if (mode === 'wc' && window.wcHome) { window.wcHome(); return; } // their saved World Cup first (js/world-cup.js)
      window.cpPlay(mode);
    }, PLAY_LABEL[mode]);
  }

  /* Classic is the same for everyone: all-time and ratings on (Hard is the way to play with ratings hidden). Custom
     Seasons, picking the era and hiding ratings, is a CAST Pass perk: Pass holders get the settings under Classic and
     everyone else a locked row that opens the Pass. Guests name their team above the modes; signed in, the team plays
     as their username. A friend's challenge still plays with its own settings (setupChallenge). */
  function passOn() { return !!(window.CastAccount && CastAccount.tier && CastAccount.tier() === 'pass'); }
  function classicDefaults() {
    if (typeof setEraPreset === 'function') setEraPreset(1998);
    if (typeof setRatings === 'function') setRatings('on');
  }
  window.cpPlay = function (mode) {
    if (!passOn()) classicDefaults();
    if (typeof selectMode === 'function') selectMode(mode);
    if (typeof startSelectedMode === 'function') startSelectedMode();
  };
  /* First visit (no finished season on this phone yet): how it works in three steps, under the pitch (29 Sep 2026, like
     1000TRIES). Gone once they finish a season */
  function firstVisit() {
    try {
      if (localStorage.getItem('270_played')) return false;
      // a CAST Profile is never a first visit (the owner, 15 Oct 2026: on castgames.com.au, a new address with no seasons
      // saved yet, the banner sat at the bottom under the first-visit layout)
      if (localStorage.getItem('cast_signed_in') === '1' || (window.CastAccount && CastAccount.isSignedIn && CastAccount.isSignedIn())) return false;
      var g = JSON.parse(localStorage.getItem('cast_games_v1') || '[]');
      return !(Array.isArray(g) && g.some(function (x) { return x && x.game === '27-0'; }));
    } catch (e) { return false; }
  }
  /* First-timers also get Classic first (4 Oct 2026, the owner's call): the team name and the modes move up under the
     steps, above the spot and the Daily Challenge, and a guest's first visit has no spot (js/cast-account.js asks
     CAST_ACCOUNT.firstVisit). Back in their usual place once a season is done */
  var modesMark = null, modesUp = false;
  function firstSteps() {
    var first = firstVisit(), fs = document.getElementById('cpFirstSteps');
    if (fs) fs.hidden = !first;
    var block = [document.getElementById('cpTeamRow'), document.getElementById('cpModeKicker'), document.querySelector('.cp-home .cp-mode-picker')];
    if (fs && block.every(Boolean) && first !== modesUp) {
      if (!modesMark) { modesMark = document.createComment(' the modes, after a first season '); block[0].parentNode.insertBefore(modesMark, block[0]); }
      var ref = first ? fs.nextSibling : modesMark;
      block.forEach(function (el) { ref.parentNode.insertBefore(el, ref); });
      modesUp = first;
    }
    if (window.CastAccount && CastAccount.spot) CastAccount.spot();
  }
  window.cpFirstVisit = firstVisit;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', firstSteps); else firstSteps();
  function customGate() {
    var pass = passOn(), opts = document.getElementById('cpOptions'), lock = document.getElementById('cpCustomLock'), row = document.getElementById('cpTeamRow');
    if (opts) { opts.hidden = !pass; if (!pass) opts.open = false; }
    if (lock) lock.hidden = pass;
    var likely = false; // a returning signed-in player: no flash of the guest row while sign-in loads
    try { likely = localStorage.getItem('cast_signed_in') === '1'; } catch (e) { /* storage blocked */ }
    if (row) row.hidden = likely || !!(window.CastAccount && CastAccount.username && CastAccount.username());
  }
  window.addEventListener('cast-account', function () { setTimeout(customGate, 0); setTimeout(firstSteps, 0); });
  window.addEventListener('cast:tier', function () { setTimeout(customGate, 0); });
  window.addEventListener('cast:play', function (e) { var d = e.detail || {}; if (d.game === '27-0') playMode(d.mode); });

  // Pack mode copies the draft screen's header (game-core.js _ensurePackHeader), and a copied button keeps its look but
  // not its listener: those copies answer here (buttons wired above carry __cpWired and are left alone)
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.cp-mode-btn, .cp-new-tab, .header-logo[data-home], .cp-sound');
    if (!t || t.__cpWired) return;
    if (t.classList.contains('cp-new-tab')) { askNew(); return; }
    if (t.classList.contains('cp-sound')) {
      var real = Array.prototype.filter.call(document.querySelectorAll('.cp-sound'), function (x) { return x.__cpWired; })[0];
      if (real) real.click();
      return;
    }
    askHome();
  });
  document.addEventListener('keydown', function (e) {
    var t = e.key === 'Enter' && e.target.closest && e.target.closest('.header-logo[data-home]');
    if (t && !t.__cpWired) askHome();
  });

  function addModeButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('.screen > .header'), function (h) {
      var logo = h.querySelector('.header-logo');
      // The same top bar as 1000TRIES mid-game (4 Oct 2026, the owner's call): the Cast logo (still home, asking first
      // mid-game), New Game, Shop, Friends and Profile (Admin for admins), filled in by js/cast-account.js
      if (logo && !logo.classList.contains('is-cast')) {
        logo.src = 'assets/img/cast-wordmark.png'; logo.alt = 'The Cast Patrol'; logo.classList.add('is-cast');
        logo.setAttribute('width', '600'); logo.setAttribute('height', '302');
      }
      if (logo && !logo.getAttribute('data-home')) {
        logo.setAttribute('data-home', '1');
        logo.setAttribute('role', 'button');
        logo.setAttribute('tabindex', '0');
        logo.setAttribute('title', 'Back to the home screen');
        logo.addEventListener('click', askHome);
        logo.addEventListener('keydown', function (e) { if (e.key === 'Enter') askHome(); });
        logo.__cpWired = true;
      }
      // Play Again and Change Mode are one New Game tab now (its pop-up has both)
      var again = h.querySelector('button[onclick*="showSocialPrompt"]');
      if (again && !h.querySelector('.cp-new-tab')) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ca-nav-tab cp-new-tab';
        b.setAttribute('aria-label', 'New game');
        b.innerHTML = '<span aria-hidden="true">&#x1F504;</span><span class="ca-nav-lbl">New Game</span>';
        b.addEventListener('click', askNew);
        b.__cpWired = true;
        again.parentNode.insertBefore(b, again);
        again.style.display = 'none';
      }
      // Shop, Friends and Profile open over the game, which carries on underneath
      var tab = h.querySelector('.cp-new-tab');
      if (tab && !h.querySelector('[data-cast-account]')) {
        var fr = document.createElement('button');
        fr.type = 'button'; fr.hidden = true; fr.setAttribute('data-cast-friends', ''); fr.setAttribute('aria-label', 'Friends');
        var ac = document.createElement('button');
        ac.type = 'button'; ac.setAttribute('data-cast-account', ''); ac.setAttribute('aria-label', 'Sign in to save your history');
        tab.insertAdjacentElement('afterend', fr); fr.insertAdjacentElement('afterend', ac);
        h.classList.add('has-account');
      }
    });
    if (window.CastAccount && window.CastAccount.refresh) window.CastAccount.refresh();
  }

  /* No lonely last word in the long reads (FAQ answers, the privacy notes, the intro, the footer): Chrome's "pretty"
     wrapping only fixes short paragraphs, so the last two words of each stay together (the user's rule, 28 Sep 2026) */
  function keepLastWords() {
    Array.prototype.forEach.call(document.querySelectorAll('.cp-faq p, #privacyModal p, #privacyModal li, .cp-proof-text, .cp-footer-legal'), function (el) {
      var n = el.lastChild;
      while (n && n.nodeType !== 3) n = n.lastChild;
      if (n && /\S\s+\S+\s*$/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\s+(\S+\s*)$/, '\u00A0$1');
    });
  }
  /* Opened on a mode (?play=, or a CAST Games page for one mode, window.CG_MODE): straight into play, the home never
     shows (17 Oct 2026, the owner; index.html sets html.play-boot). Classic, Hard and Pack bring back this player's saved
     draft for that mode (js/draft-save.js), the World Cup its saved run (js/world-cup.js wcHome). A link that opens
     something else (the leaderboards, a profile, the Pass, a friend's challenge) leaves the screen to it. When nothing
     could start (a sign-in wall closed, the World Cup not on), CAST Games shows its own card for the mode (CG.bootIdle)
     and the game's own site shows its home */
  function cgPage() { return !!(window.CG && CG.leave && window.CG_MODE); }
  function bootOn() { return document.documentElement.classList.contains('play-boot'); }
  function bootEnd() { document.documentElement.classList.remove('play-boot'); if (window.CG && CG.bootDone) CG.bootDone(); }
  function activeId() { var a = document.querySelector('.screen.active'); return a ? a.id : ''; }
  var bootMode = null, watching = false, rebootT = 0, bootWait = false;
  function bootIdleWatch() {
    if (watching) return;
    watching = true;
    var check = function () {
      if (!bootOn() || bootWait || activeId() !== 'setup' || document.documentElement.classList.contains('ca-open')) return;
      if (Array.prototype.some.call(document.querySelectorAll('.cp-confirm'), function (m) { return m.style.display === 'flex'; })) return;
      if (window.CG && CG.bootIdle) CG.bootIdle(function () { bootPlay(bootMode); }); else bootEnd();
    };
    var soon = function () { setTimeout(check, 400); };
    setTimeout(check, 2500); setTimeout(check, 7000);
    try { new MutationObserver(soon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); } catch (e) { /* the timers above */ }
    document.addEventListener('click', soon, true);
  }
  function bootPlay(mode) {
    bootMode = mode;
    bootIdleWatch();
    if (/#(challenge|cast-profile|my-cast|leaderboards|cast-pass|join|admin)/.test(location.hash) || /[?&](challenge|ch|vs)=/.test(location.search)) return;
    if ((mode === 'classic' || mode === 'hard' || mode === 'pack') && window.cpDraftSave && cpDraftSave.resumeFor) { cpDraftSave.resumeFor(mode, function () { playMode(mode); }); return; }
    // World Cup 8-0: a first visit has no saved launch list yet, so wait up to 8 s for the account to say it's on
    var live = function () { return !!(window.CastAccount && CastAccount.wcLive && CastAccount.wcLive()); };
    if (mode === 'wc' && !live()) {
      bootWait = true;
      var n = 0;
      (function wait() { if (live() || ++n > 40) { bootWait = false; playMode(mode); return; } setTimeout(wait, 200); })();
      return;
    }
    playMode(mode);
  }
  // Every screen change ends the boot. On CAST Games the home itself never shows: Play Again passes through it (the next
  // mode starts within a moment), anything else starts this page's mode again
  (function () {
    var orig = window.showScreen;
    if (typeof orig !== 'function') return;
    window.showScreen = function (id) {
      var out = orig.apply(this, arguments);
      if (id !== 'setup' || !cgPage()) { bootEnd(); return out; }
      document.documentElement.classList.add('play-boot');
      clearTimeout(rebootT);
      rebootT = setTimeout(function () { if (activeId() === 'setup' && !afterHome && bootOn()) bootPlay(window.CG_MODE); }, 600);
      return out;
    };
  })();
  /* Custom Seasons on CAST Games (17 Oct 2026, the owner): 27-0 CLASSIC's page has no home, so a CAST Pass member opens the
     same settings (era and ratings) from a button in the draft. Play With These Settings starts a fresh Classic season
     with them (the season under way is lost, and the pop-up says so) */
  function csOn() { return cgPage() && window.CG_MODE === 'classic' && passOn() && typeof STATE !== 'undefined' && !!STATE && STATE.gameMode === 'classic' && !(window.CastDaily && CastDaily.isActive && CastDaily.isActive()); }
  function csPaint() {
    var spot = document.querySelector('#draft .spin-zone'), b = document.getElementById('cpCsBtn');
    if (!spot) return;
    if (!b) {
      b = document.createElement('button');
      b.type = 'button'; b.id = 'cpCsBtn'; b.className = 'cp-cs-btn';
      b.addEventListener('click', csOpen);
      spot.parentNode.insertBefore(b, spot);
    }
    b.hidden = !csOn();
    var sum = document.getElementById('cpOptSummary');
    b.innerHTML = '<span aria-hidden="true">&#x2699;&#xFE0F;</span><b>Custom Seasons</b><small>' + esc(sum ? sum.textContent : '') + '</small>';
  }
  function csOpen() {
    var body = document.querySelector('#cpOptions .cp-options-body'), m = document.getElementById('cpCsModal');
    if (!body) return;
    if (!m) {
      m = document.createElement('div');
      m.id = 'cpCsModal'; m.className = 'cp-confirm'; m.style.display = 'none';
      m.innerHTML = '<div class="cp-confirm-backdrop" data-cs="close"></div><div class="cp-confirm-body" role="dialog" aria-modal="true" aria-labelledby="cpCsTitle">' +
        '<button type="button" class="cp-confirm-x" data-cs="close" aria-label="Close">&#x2715;</button>' +
        '<div class="cp-confirm-kicker">CAST Pass</div><h2 class="cp-confirm-title" id="cpCsTitle">Custom Seasons</h2>' +
        '<p class="cp-confirm-sub" id="cpCsSub"></p><div class="cp-cs-slot"></div>' +
        '<button type="button" class="cp-btn cp-btn-primary" data-cs="go">Play With These Settings</button>' +
        '<button type="button" class="cp-btn cp-btn-ghost" data-cs="close">Keep Playing</button></div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (e) {
        var a = e.target.closest('[data-cs]');
        if (!a) return;
        csClose();
        if (a.getAttribute('data-cs') === 'go') {
          if (typeof gtag !== 'undefined') gtag('event', 'custom_seasons_play', { game: '27-0' });
          afterHome = function () { if (typeof selectMode === 'function') selectMode('classic'); if (typeof startSelectedMode === 'function') startSelectedMode(); };
          goHome();
        }
      });
    }
    var picks = typeof STATE !== 'undefined' && STATE ? (STATE.team || []).filter(Boolean).length : 0;
    document.getElementById('cpCsSub').textContent = picks ? 'Pick your era and ratings. Playing with them starts a new season, and this one will be lost.' : 'Pick your era and ratings, then play a season with them.';
    m.querySelector('.cp-cs-slot').appendChild(body); // the panel's own controls, moved here while it's open
    m.style.display = 'flex';
  }
  function csClose() {
    var m = document.getElementById('cpCsModal'), body = m && m.querySelector('.cp-options-body'), home = document.getElementById('cpOptions');
    if (body && home) home.appendChild(body);
    if (m) m.style.display = 'none';
    csPaint();
  }
  window.addEventListener('cast:tier', function () { setTimeout(csPaint, 0); });
  window.addEventListener('cast-account', function () { setTimeout(csPaint, 0); });
  after('startGame', function () { setTimeout(csPaint, 0); });

  function boot() {
    addSoundButtons(); addModeButtons(); decorate(); syncMode(); loadVideos(); optionsSummary(); customGate(); keepLastWords();
    var play = /[?&]play=(classic|pack|hard|daily|wc)(?=&|#|$)/.exec(location.search) || (window.CG_MODE ? [0, window.CG_MODE] : null);
    if (play) {
      try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])play=[^&#]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) { /* keep the address as it is */ }
      setTimeout(function () { bootPlay(play[1]); }, 300);
    }
    var nm = document.getElementById('teamNameInput');
    if (nm) nm.addEventListener('input', optionsSummary);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
