/* 27-0 World Cup 8-0: the tournament engine. Pure maths, no DOM. Loaded by the page (window.WC) and by Node (module.exports).

   The player's 13 ('you') takes France's place in Pool C of the men's 2026 Rugby League World Cup.
   - Pool A (aus nzl fij cok) plays a round robin. Pools B and C become one table of six (you png ton sam eng leb)
     that plays a full round robin, 5 games each. Tables rank by wins, then points difference, then a coin flip.
   - Quarter-finals: A1 v BC4, A2 v BC3, BC1 v A4, BC2 v A3. SF1 = W(A1 v BC4) v W(BC2 v A3), Newcastle;
     SF2 = W(A2 v BC3) v W(BC1 v A4), Allianz; Final at Suncorp. 5th or 6th in the B/C table is out after 5 games.
   - Results come from winProb (the player's games) and pairProb (everyone else).
   - Each run draws one fixed block of random numbers and every game reads its own slot of it, so runs with the same
     seed at different ratings stay in step.

   WC.setSquads(json)            squads from data/wc-squads.json (the page fetches it; nations without one use FALLBACK)
   WC.strength(key)              best 13 by position with 27-0's slot weights
   WC.road()                     the player's 8 games, knockout opponents null until known
   WC.run(rating, rng, opt)      one whole tournament (run.pools: every pool game with its round, and the tie coins).
                                 opt: {kick: the player's goal kicker's level (1 top, 2 good, 0 off the lists),
                                 taken: the names in the player's 13 (a drafted kicker doesn't kick for his nation),
                                 il: how many World Legends are in the player's 13 (a whole number, none when
                                 missing; see LEGENDS)}
   WC.kickLevel(name)            a goal kicker's level from data/wc-squads.json (0: not a listed kicker)
   WC.nationKicker(key, taken)   a nation's goal kicker ({name, level}): its first listed one not in the player's 13
   WC.standings(games, k, coins) a pool's ladder after round k (0: before a ball is kicked)
   WC.stakes(bcGames, k)         what the player's round-k game can and can't decide, proved over every way it can go
   WC.winProb(myR, oppR, oppKey, stage, unbeaten, il)   the player's chance in one game (stage 0 pool, 1 QF, 2 SF, 3 final;
                                 il as in run's opt)
   WC.sim(rating, n, seed)       n seeded runs */
(function (root) {
  'use strict';

  const YOU = 'you';
  const NATIONS = {
    aus: {name: 'Australia', short: 'Australia', code: 'AUS', pool: 'A'},
    nzl: {name: 'New Zealand', short: 'NZ', code: 'NZL', pool: 'A'},
    fij: {name: 'Fiji', short: 'Fiji', code: 'FIJ', pool: 'A'},
    cok: {name: 'Cook Islands', short: 'Cook Islands', code: 'COK', pool: 'A'},
    eng: {name: 'England', short: 'England', code: 'ENG', pool: 'B'},
    sam: {name: 'Samoa', short: 'Samoa', code: 'SAM', pool: 'B'},
    leb: {name: 'Lebanon', short: 'Lebanon', code: 'LEB', pool: 'B'},
    fra: {name: 'France', short: 'France', code: 'FRA', pool: 'C'},
    png: {name: 'Papua New Guinea', short: 'PNG', code: 'PNG', pool: 'C'},
    ton: {name: 'Tonga', short: 'Tonga', code: 'TON', pool: 'C'}
  };
  // Strength of a nation until its squad is loaded (the owner's numbers)
  const FALLBACK = {aus: 93, nzl: 91, ton: 88, sam: 87, eng: 85, fij: 82, png: 78, leb: 77, cok: 75, fra: 74};
  const GIANTS = ['aus', 'nzl'];
  const CHALLENGERS = ['ton', 'sam', 'eng'];
  const CONTENDERS = GIANTS.concat(CHALLENGERS, [YOU]);
  // Each side's tier: 2, 1 or 0
  function tierOf(k) { return GIANTS.indexOf(k) >= 0 ? 2 : (CHALLENGERS.indexOf(k) >= 0 || k === YOU) ? 1 : 0; }
  // Contender v contender (7 Oct 2026, the owner's call): each side's power, not its squad strength. The player's
  // knockouts against Tonga, Samoa and England use it too
  const POWER = {aus: 90, nzl: 87.8, sam: 84.1, ton: 83.1, eng: 82.8};

  // Tuning
  const ODDS = {
    shift: 6,
    slope: 0.2,
    poolFloor: 0.05,
    poolCap: [[96, 0.91], [94, 0.89], [90, 0.87], [0, 0.84]],
    giantFrom: 90, giantBase: 0.003, giantGrow: 1.5, giantMax: 0.10,
    chalMid: 102.5, chalSlope: 0.2, chalMax: 0.45, chalRef: 85,
    finalFactor: 0.8,
    perfectFrom: 92,
    poolNG: [0.02, 0.08],
    poolNC: [0.08, 0.40],
    sameTop: [0.25, 0.75],
    sameRest: [0.05, 0.95],
    upsetBase: 0.12, upsetStep: 0.005, upsetMin: 0.12, upsetMax: 0.24
  };

  // World Legends in the player's 13 (opt.il; notes in ~/cast-dev/private-notes)
  const LEGENDS = {
    floorFrom: 3,
    giant: {3: 0.38, 4: 0.5, 5: 0.93},
    challenger: {3: 0.6, 4: 0.7, 5: 0.97},
    safe: 6, pool: 0.85, final: 0.55, perfectFinal: 0.10,
    allWon: 6
  };
  // By the rating as shown (notes in ~/cast-dev/private-notes)
  const SURE_RATING = 91, NEAR_SURE = 0.965, NEXT_SURE = 0.23;

  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
  function logistic(x) { return 1 / (1 + Math.exp(-x)); }

  function poolCap(myR) {
    for (const band of ODDS.poolCap) if (myR >= band[0]) return band[1];
    return ODDS.poolCap[ODDS.poolCap.length - 1][1];
  }
  function giantProb(myR, stage) {
    if (myR < ODDS.giantFrom) return 0;
    const p = Math.min(ODDS.giantMax, ODDS.giantBase * Math.pow(ODDS.giantGrow, myR - ODDS.giantFrom));
    return stage === 3 ? p * ODDS.finalFactor : p;
  }
  function challengerProb(myR, stage, opp) {
    const pw = POWER[opp] != null ? POWER[opp] - ODDS.chalRef : 0;
    const p = Math.min(ODDS.chalMax, logistic((myR - ODDS.chalMid - pw) * ODDS.chalSlope));
    return stage === 3 ? p * ODDS.finalFactor : p;
  }

  // The player's game. stage: 0 pool, 1 quarter final, 2 semi-final, 3 final. oppR null: the nation's own strength.
  // unbeaten (optional): the player has not lost yet. il (optional): World Legends in the player's 13
  function winProb(myR, oppR, oppKey, stage, unbeaten, il) {
    const shown = Math.round(Number(myR) || 0);
    if (shown >= SURE_RATING) return 1;
    const p = gameProb(myR, oppR, oppKey, stage, unbeaten), n = legendsIn(il);
    const q = n < LEGENDS.floorFrom ? p : withLegends(p, n, stage || 0, oppKey, unbeaten);
    return shown === SURE_RATING - 1 ? Math.max(q, NEAR_SURE) : shown === SURE_RATING - 2 ? Math.max(q, NEXT_SURE) : q;
  }
  // How many World Legends: a whole number, none when missing or not a number
  function legendsIn(x) { return typeof x === 'number' && x > 0 ? Math.floor(x) : 0; }
  function withLegends(p, n, stage, oppKey, unbeaten) {
    if (n >= LEGENDS.allWon) return 1;
    if (n >= LEGENDS.safe) {
      if (!unbeaten || stage === 1 || stage === 2) return 1;
      return Math.max(p, stage === 3 ? LEGENDS.final : LEGENDS.pool);
    }
    const t = tierOf(oppKey);
    if (!stage || !t) return p;
    const f = (t === 2 ? LEGENDS.giant : LEGENDS.challenger)[n];
    return Math.max(p, stage === 3 ? Math.min(f, unbeaten ? LEGENDS.perfectFinal : LEGENDS.final) : f);
  }
  // winProb without World Legends
  function gameProb(myR, oppR, oppKey, stage, unbeaten) {
    stage = stage || 0;
    if (oppR == null) oppR = strength(oppKey);
    const k = myR + ODDS.shift;
    if (!stage) return clamp(logistic((myR - oppR) * ODDS.slope), ODDS.poolFloor, poolCap(k));
    const t = tierOf(oppKey);
    if (t === 0) return 1;
    if (stage === 3 && unbeaten && k < ODDS.perfectFrom) return 0;
    return t === 2 ? giantProb(k, stage) : challengerProb(k, stage, oppKey);
  }

  // Nation a v nation b (neither is the player)
  function pairProb(a, b, stage) {
    const ta = tierOf(a), tb = tierOf(b);
    if (ta && tb && POWER[a] != null && POWER[b] != null) return clamp(logistic((POWER[a] - POWER[b]) * ODDS.slope), 0.05, 0.95);
    if (ta === tb) {
      const lim = ta ? ODDS.sameTop : ODDS.sameRest;
      return clamp(logistic((strength(a) - strength(b)) * ODDS.slope), lim[0], lim[1]);
    }
    // Different tiers: the lower tier's side first, then turned round when a is the higher tier
    const aLower = ta < tb;
    const gap = aLower ? strength(a) - strength(b) : strength(b) - strength(a);
    let up;
    if (!stage) {
      const lim = Math.max(ta, tb) === 2 && Math.min(ta, tb) === 0 ? ODDS.poolNG : ODDS.poolNC;
      up = clamp(logistic(gap * ODDS.slope), lim[0], lim[1]);
    } else if (Math.min(ta, tb) === 0) {
      up = 0;
    } else {
      up = clamp(ODDS.upsetBase + (gap + 4) * ODDS.upsetStep, ODDS.upsetMin, ODDS.upsetMax);
    }
    return aLower ? up : 1 - up;
  }

  // ============================================================
  // SQUADS AND STRENGTH
  // ============================================================
  // 27-0's slots and weights (calcTeamRating): FB, W, W, C, C, FE, HB, P, HK, P, SR, SR, LK
  const TYPES = ['FB', 'W', 'C', 'FE', 'HB', 'P', 'HK', 'SR', 'LK'];
  const TYPE_CAP = [1, 2, 2, 1, 1, 2, 1, 2, 1];
  const TYPE_W = [1.3, 0.8, 0.9, 1.2, 1.5, 0.9, 1.1, 0.9, 1.0];
  const W_SUM = TYPE_CAP.reduce((s, c, i) => s + c * TYPE_W[i], 0);   // 13.1
  const OUT_OF_POSITION = 10;   // a player outside their positions counts this much lower (only when a squad is short)
  const POS_ALIAS = {FB: 'FB', W: 'W', RW: 'W', LW: 'W', WG: 'W', C: 'C', RC: 'C', LC: 'C', CE: 'C', FE: 'FE', '5/8': 'FE',
    SO: 'FE', HB: 'HB', SH: 'HB', P: 'P', PR: 'P', FR: 'P', HK: 'HK', H: 'HK', SR: 'SR', '2R': 'SR', '2RF': 'SR', LK: 'LK', L: 'LK'};
  // Best fit by dynamic programming over how many slots of each type are filled (2*3*3*2*2*3*2*3*2 = 1296 states)
  const STRIDE = [];
  let NSTATE = 1;
  TYPE_CAP.forEach((c, i) => { STRIDE[i] = NSTATE; NSTATE *= c + 1; });
  const FREE = new Uint8Array(NSTATE * TYPES.length);
  for (let m = 0; m < NSTATE; m++) {
    for (let t = 0; t < TYPES.length; t++) FREE[m * TYPES.length + t] = Math.floor(m / STRIDE[t]) % (TYPE_CAP[t] + 1) < TYPE_CAP[t] ? 1 : 0;
  }

  function slotTypes(codes) {
    const list = Array.isArray(codes) ? codes : String(codes || '').split(/[\s,/|]+/);
    const ok = TYPES.map(() => false);
    list.forEach(c => { const t = TYPES.indexOf(POS_ALIAS[String(c).trim().toUpperCase()]); if (t >= 0) ok[t] = true; });
    return ok;
  }

  // Weighted average of the best 13 (null when the squad has fewer than 13 rated players)
  function bestThirteen(players) {
    const list = [];
    (players || []).forEach(p => {
      if (!Array.isArray(p)) return;
      const r = Number(p[2]);
      if (isFinite(r) && r > 0) list.push({r, ok: slotTypes(p[1])});
    });
    if (list.length < 13) return null;
    const dp = new Float64Array(NSTATE).fill(-1);
    dp[0] = 0;
    for (const p of list) {
      for (let m = NSTATE - 1; m >= 0; m--) {   // high to low, so each player fills one slot at most
        const base = dp[m];
        if (base < 0) continue;
        for (let t = 0; t < TYPES.length; t++) {
          if (!FREE[m * TYPES.length + t]) continue;
          const v = base + TYPE_W[t] * (p.ok[t] ? p.r : p.r - OUT_OF_POSITION);
          if (v > dp[m + STRIDE[t]]) dp[m + STRIDE[t]] = v;
        }
      }
    }
    return dp[NSTATE - 1] / W_SUM;
  }

  let SQUAD_STRENGTH = {}, KICKERS = {};
  // json: the parsed data/wc-squads.json (or its text). null resets every nation to its fallback (and no kickers).
  function setSquads(json) {
    SQUAD_STRENGTH = {};
    KICKERS = {};
    let data = json;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = null; } }
    const nations = data && data.nations;
    if (nations) {
      Object.keys(NATIONS).forEach(k => {
        const s = nations[k] && bestThirteen(nations[k].players);
        if (s) SQUAD_STRENGTH[k] = Math.round(s);
      });
    }
    const kick = data && data.kickers;
    if (kick) Object.keys(NATIONS).forEach(k => { if (Array.isArray(kick[k])) KICKERS[k] = kick[k].filter(e => Array.isArray(e) && e[0]); });
    const out = {};
    Object.keys(NATIONS).forEach(k => { out[k] = strength(k); });
    return out;
  }
  function strength(key) {
    if (SQUAD_STRENGTH[key] != null) return SQUAD_STRENGTH[key];
    return FALLBACK[key] != null ? FALLBACK[key] : null;
  }
  function hasSquad(key) { return SQUAD_STRENGTH[key] != null; }
  // Goal kickers' levels: 1 top, 2 good, 0 for anyone off the lists
  function kickLevel(name) {
    for (const k in KICKERS) for (const e of KICKERS[k]) if (e[0] === name) return e[1] === 1 ? 1 : 2;
    return 0;
  }
  function nationKicker(key, taken) {
    const t = Array.isArray(taken) ? taken : [];
    const e = (KICKERS[key] || []).find(x => t.indexOf(x[0]) < 0);
    return e ? {name: e[0], level: e[1] === 1 ? 1 : 2} : null;
  }

  // ============================================================
  // FIXTURES
  // ============================================================
  const ROAD = [
    {g: 1, kind: 'pool', opp: 'sam', date: 'Fri 16 Oct', venue: 'CommBank Stadium', city: 'Parramatta', real: true},
    {g: 2, kind: 'pool', opp: 'png', date: 'Tue 20 Oct', venue: 'Santos National Football Stadium', city: 'Port Moresby', real: false},
    {g: 3, kind: 'pool', opp: 'eng', date: 'Sat 24 Oct', venue: 'HBF Park', city: 'Perth', real: true},
    {g: 4, kind: 'pool', opp: 'ton', date: 'Wed 28 Oct', venue: 'Cbus Super Stadium', city: 'Gold Coast', real: false},
    {g: 5, kind: 'pool', opp: 'leb', date: 'Sun 1 Nov', venue: 'CommBank Stadium', city: 'Parramatta', real: true},
    {g: 6, kind: 'qf', opp: null, date: 'Wed 4 Nov', venue: 'Queensland Country Bank Stadium', city: 'Townsville', real: false},
    // The player's semi is always the Sunday one in Sydney, whichever semi it is (7 Oct 2026, the owner: "just pick a date
    // and stick to it"); the other semi takes the Saturday in Newcastle
    {g: 7, kind: 'sf', opp: null, date: 'Sun 8 Nov', venue: 'Allianz Stadium', city: 'Sydney', real: true},
    {g: 8, kind: 'final', opp: null, date: 'Sun 15 Nov', venue: 'Suncorp Stadium', city: 'Brisbane', real: true}
  ];
  const SEMIS = [
    {date: 'Sat 7 Nov', venue: 'McDonald Jones Stadium', city: 'Newcastle'},
    {date: 'Sun 8 Nov', venue: 'Allianz Stadium', city: 'Sydney'}
  ];
  function road() { return ROAD.map(r => Object.assign({}, r)); }

  const POOL_A = ['aus', 'nzl', 'fij', 'cok'];
  const POOL_A_GAMES = [['aus', 'nzl'], ['fij', 'cok'], ['aus', 'fij'], ['nzl', 'cok'], ['aus', 'cok'], ['nzl', 'fij']];
  const BC = [YOU, 'png', 'ton', 'sam', 'eng', 'leb'];
  // The player's five first (in road order), then the other ten
  const BC_GAMES = [[YOU, 'sam'], [YOU, 'png'], [YOU, 'eng'], [YOU, 'ton'], [YOU, 'leb'],
    ['png', 'ton'], ['sam', 'eng'], ['ton', 'leb'], ['png', 'sam'], ['eng', 'leb'],
    ['ton', 'sam'], ['png', 'eng'], ['sam', 'leb'], ['ton', 'eng'], ['png', 'leb']];
  // The round each game is shown in (display only: the results come from the slots above).
  // Every team plays once a round. Rounds 1 and 5 are the real World Cup's opening and closing weekends for Pools B and
  // C (you in France's place); no order of the other ten fits all six of the real middle games, so rounds 2 to 4 don't.
  const BC_ROUND = [1, 2, 3, 4, 5, 3, 2, 2, 4, 4, 5, 5, 3, 1, 1];
  // Pool A as drawn: AUS v NZL and FIJ v COK, then AUS v FIJ and NZL v COK, then AUS v COK and NZL v FIJ
  const A_ROUND = [1, 1, 2, 2, 3, 3];
  // Random number slots per run: 3 per game (result, winner's tries, loser's tries), then a coin per team, then one per
  // game for its goals (7 Oct 2026: last, so the same draw still gives the same results and tries)
  const SLOT_A = 0, SLOT_BC = 6, SLOT_QF = 21, SLOT_SF = 25, SLOT_F = 27, N_GAMES = 28;
  const COIN_A = N_GAMES * 3, COIN_BC = COIN_A + POOL_A.length, KICK0 = COIN_BC + BC.length, N_RAND = KICK0 + N_GAMES;

  // Tries like 27-0's resolveGame (winner 3 to 7, loser 1 to 4, winner always ahead, no draws),
  // with bigger margins when the gap between the sides is big
  function tries(winStr, loseStr, u1, u2) {
    const gap = Math.max(0, winStr - loseStr);
    let w = 3 + Math.floor(u1 * 5) + Math.floor(gap / 6);
    let l = Math.max(0, 1 + Math.floor(u2 * 4) - Math.floor(gap / 8));
    if (w < l) { const t = w; w = l; l = t; }
    if (w === l) l = Math.max(0, l - 1);
    return [w, l];
  }

  /* Goals (7 Oct 2026, the owner: "4 points for a try and 2 points for the conversion ... assumes that every player kicks
     the goal", and field goals: "if it's drawn scores with less than 10 minutes to go usually a team will kick a field
     goal worth 1 point"; level or 6 ahead): a try is 4 and its conversion 2 when it's kicked, by the side's goal kicker
     (CONV by level: off the lists, top, good), now and then a penalty goal (2), all from the game's own goal slot. The
     winner always finishes ahead: while it's behind, a missed conversion of its turns into a kicked one (all of them
     kicked beat the loser's best, as it has at least one try more). Level after that, its field goal (1) wins it; 6
     ahead, it sometimes kicks one to go 7 up. Returns each side's conversions, penalty goals, field goals and points */
  const CONV = [0.62, 0.8, 0.72], PEN1 = 0.35, PEN2 = 0.08, FG6 = 0.4;
  function goals(u, wT, lT, wk, lk) {
    const r = mulberry32(Math.floor(u * 4294967296) >>> 0);
    const kicked = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (r() < p) k++; return k; };
    const pens = () => { const x = r(); return x < PEN2 ? 2 : x < PEN1 ? 1 : 0; };
    let wc = kicked(wT, CONV[wk] || CONV[0]);
    const lc = kicked(lT, CONV[lk] || CONV[0]), wp = pens(), lp = pens(), six = r() < FG6;
    const pts = (t, c, p) => t * 4 + c * 2 + p * 2;
    while (pts(wT, wc, wp) < pts(lT, lc, lp) && wc < wT) wc++;
    const gap = pts(wT, wc, wp) - pts(lT, lc, lp), wf = gap === 0 || (gap === 6 && six) ? 1 : 0;
    return {wc, lc, wp, lp, wf, ws: pts(wT, wc, wp) + wf, ls: pts(lT, lc, lp)};
  }

  // ============================================================
  // ONE TOURNAMENT
  // ============================================================
  function run(userRating, rng, opt) {
    const R = Number(userRating) || 0;
    const rand = typeof rng === 'function' ? rng : Math.random;
    const o = opt || {};
    const myKick = o.kick === 0 || o.kick === 1 || o.kick === 2 ? o.kick : 2; // a good kicker when not told (sims, tests)
    const kicks = {};
    Object.keys(NATIONS).forEach(k => { const n = nationKicker(k, o.taken); kicks[k] = n ? n.level : 0; });
    const kickOf = k => (k === YOU ? myKick : kicks[k] || 0);
    const il = legendsIn(o.il);
    const U = new Array(N_RAND);
    for (let i = 0; i < N_RAND; i++) U[i] = rand();
    const str = k => (k === YOU ? R : strength(k));
    const games = [];
    let wins = 0, losses = 0, pf = 0, pa = 0;

    function play(a, b, stage, slot) {
      const u = U[slot * 3];
      let aWins;
      if (a === YOU || b === YOU) {
        const opp = a === YOU ? b : a;
        const youWin = u < winProb(R, str(opp), opp, stage, losses === 0, il);
        aWins = (a === YOU) === youWin;
      } else {
        aWins = u < pairProb(a, b, stage);
      }
      const w = aWins ? a : b, l = aWins ? b : a;
      const t = tries(str(w), str(l), U[slot * 3 + 1], U[slot * 3 + 2]);
      const k = goals(U[KICK0 + slot], t[0], t[1], kickOf(w), kickOf(l));
      const ta = aWins ? t[0] : t[1], tb = aWins ? t[1] : t[0];
      const res = {a, b, winner: w, sa: aWins ? k.ws : k.ls, sb: aWins ? k.ls : k.ws, ta, tb,
        ca: aWins ? k.wc : k.lc, cb: aWins ? k.lc : k.wc, pa: aWins ? k.wp : k.lp, pb: aWins ? k.lp : k.wp,
        fa: aWins ? k.wf : 0, fb: aWins ? 0 : k.wf};
      if (a === YOU || b === YOU) mine(res, stage);
      return res;
    }
    let semi = null;
    function mine(res, stage) {
      const youA = res.a === YOU;
      const myT = youA ? res.ta : res.tb, thT = youA ? res.tb : res.ta;
      const won = res.winner === YOU;
      const fix = stage === 0 ? ROAD[games.length] : stage === 1 ? ROAD[5] : stage === 2 ? Object.assign({}, ROAD[6], semi) : ROAD[7];
      const g = {g: games.length + 1, kind: fix.kind, opp: youA ? res.b : res.a, won, my: youA ? res.sa : res.sb, their: youA ? res.sb : res.sa,
        myTries: myT, theirTries: thT, myConv: youA ? res.ca : res.cb, theirConv: youA ? res.cb : res.ca,
        myPens: youA ? res.pa : res.pb, theirPens: youA ? res.pb : res.pa, myFg: youA ? res.fa : res.fb, theirFg: youA ? res.fb : res.fa,
        date: fix.date, venue: fix.venue, city: fix.city, real: fix.real, stage};
      if (stage === 2) g.sf = semi.sf;
      games.push(g);
      if (won) wins++; else losses++;
      pf += g.my; pa += g.their;
    }

    const coins = {};
    function table(teams, fixtures, slot0, coin0, rounds, log) {
      const row = {};
      teams.forEach((k, i) => { row[k] = {key: k, w: 0, l: 0, pf: 0, pa: 0, coin: U[coin0 + i]}; coins[k] = U[coin0 + i]; });
      fixtures.forEach((f, i) => {
        const r = play(f[0], f[1], 0, slot0 + i);
        log.push({a: r.a, b: r.b, winner: r.winner, sa: r.sa, sb: r.sb, ta: r.ta, tb: r.tb, round: rounds[i], n: i});
        const ra = row[r.a], rb = row[r.b];
        ra.pf += r.sa; ra.pa += r.sb; rb.pf += r.sb; rb.pa += r.sa;
        if (r.winner === r.a) { ra.w++; rb.l++; } else { rb.w++; ra.l++; }
      });
      return teams.map(k => row[k])
        .sort((x, y) => (y.w - x.w) || ((y.pf - y.pa) - (x.pf - x.pa)) || (x.coin - y.coin))
        .map(r => ({key: r.key, w: r.w, l: r.l, pf: r.pf, pa: r.pa}));
    }

    // Pool B/C first so the player's five games are played in road order
    const logBC = [], logA = [];
    const bc = table(BC, BC_GAMES, SLOT_BC, COIN_BC, BC_ROUND, logBC);
    const poolA = table(POOL_A, POOL_A_GAMES, SLOT_A, COIN_A, A_ROUND, logA);
    // By round, the player's game first in each (n: the game's place in its fixture list)
    const byRound = (x, y) => (x.round - y.round) || (x.n - y.n);
    logBC.sort(byRound); logA.sort(byRound);
    const A = poolA.map(r => r.key), B = bc.map(r => r.key);
    const pos = B.indexOf(YOU) + 1;

    function ko(id, a, b, stage, slot) {
      if (stage === 2) semi = {sf: id === 'SF1' ? 1 : 2};
      const r = play(a, b, stage, slot);
      return Object.assign({id}, r);
    }
    const qf = [
      ko('QF1', A[0], B[3], 1, SLOT_QF),
      ko('QF2', A[1], B[2], 1, SLOT_QF + 1),
      ko('QF3', B[0], A[3], 1, SLOT_QF + 2),
      ko('QF4', B[1], A[2], 1, SLOT_QF + 3)
    ];
    const sf = [
      ko('SF1', qf[0].winner, qf[3].winner, 2, SLOT_SF),
      ko('SF2', qf[1].winner, qf[2].winner, 2, SLOT_SF + 1)
    ];
    const fin = ko('Final', sf[0].winner, sf[1].winner, 3, SLOT_F);
    const mySf = sf.findIndex(s => s.a === YOU || s.b === YOU);
    sf.forEach((s, i) => Object.assign(s, {sf: i + 1}, SEMIS[mySf === 0 ? 1 - i : i]));
    Object.assign(fin, {date: ROAD[7].date, venue: ROAD[7].venue, city: ROAD[7].city});

    const stage = pos > 4 ? 0 : games.length === 6 ? 1 : games.length === 7 ? 2 : fin.winner === YOU ? 4 : 3;
    return {
      rating: R, games, table: bc, poolA, pos, pools: {a: logA, bc: logBC, coins},
      bracket: {qf, sf, final: fin},
      champion: fin.winner, stage, wins, losses, pd: pf - pa, perfect: wins === 8
    };
  }

  // ============================================================
  // LADDERS AND STAKES (for the match-day screens; neither changes a result)
  // ============================================================
  // A pool's ladder counting rounds 1 to k: wins, then points difference, then the run's coin (the same order as run()'s
  // tables, so after the last round it is exactly that table). Without coins a tie keeps the order teams first appear.
  function standings(list, k, coins) {
    const row = {}, keys = [];
    (list || []).forEach(g => [g.a, g.b].forEach(t => { if (!row[t]) { row[t] = {key: t, p: 0, w: 0, l: 0, pf: 0, pa: 0}; keys.push(t); } }));
    (list || []).forEach(g => {
      if (g.round > k) return;
      const ra = row[g.a], rb = row[g.b];
      ra.p++; rb.p++;
      ra.pf += g.sa; ra.pa += g.sb; rb.pf += g.sb; rb.pa += g.sa;
      if (g.winner === g.a) { ra.w++; rb.l++; } else { rb.w++; ra.l++; }
    });
    const c = coins || {}, order = keys.slice();
    return keys.map(t => row[t]).sort((x, y) => (y.w - x.w) || ((y.pf - y.pa) - (x.pf - x.pa)) ||
      ((c[x.key] != null && c[y.key] != null) ? c[x.key] - c[y.key] : order.indexOf(x.key) - order.indexOf(y.key)));
  }

  // Before the player's game in round k of Pools B and C: what it can and can't decide. Every way the games from round k
  // on can go is checked (2 to the power of how many are left: 32,768 at most). Points difference is unknown, so a team
  // level on wins counts against the player when proving they are through, and for them when proving they are out.
  // Only what holds in every case is claimed: through, out (whatever happens), win.through, win.top (finish 1st), lose.out.
  function stakes(bcGames, k) {
    const teams = [], wins = {};
    bcGames.forEach(g => [g.a, g.b].forEach(t => { if (wins[t] == null) { wins[t] = 0; teams.push(t); } }));
    bcGames.forEach(g => { if (g.round < k) wins[g.winner]++; });
    const open = bcGames.filter(g => g.round >= k);
    const mine = open.findIndex(g => g.round === k && (g.a === YOU || g.b === YOU));
    const out = {through: true, out: true, win: {through: true, top: true}, lose: {out: true}};
    if (mine < 0) return {through: false, out: false, win: {through: false, top: false}, lose: {out: false}};
    const w = {};
    for (let m = 0; m < (1 << open.length); m++) {
      teams.forEach(t => { w[t] = wins[t]; });
      open.forEach((g, i) => { w[(m >> i) & 1 ? g.a : g.b]++; });
      const me = w[YOU];
      let level = 0, above = 0;
      teams.forEach(t => { if (t !== YOU) { if (w[t] >= me) level++; if (w[t] > me) above++; } });
      const sureIn = level <= 3, sureOut = above >= 4, sureTop = level === 0;
      const won = ((m >> mine) & 1 ? open[mine].a : open[mine].b) === YOU;
      if (!sureIn) out.through = false;
      if (!sureOut) out.out = false;
      if (won) { if (!sureIn) out.win.through = false; if (!sureTop) out.win.top = false; }
      else if (!sureOut) out.lose.out = false;
    }
    return out;
  }

  // ============================================================
  // TUNING
  // ============================================================
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sim(userRating, n, seed) {
    n = n || 20000;
    const rng = mulberry32(seed == null ? 1 : seed);
    const champs = {}, stages = [0, 0, 0, 0, 0];
    let perfect = 0;
    for (let i = 0; i < n; i++) {
      const r = run(userRating, rng);
      if (r.perfect) perfect++;
      champs[r.champion] = (champs[r.champion] || 0) + 1;
      stages[r.stage]++;
    }
    Object.keys(champs).forEach(k => { champs[k] /= n; });
    return {n, perfect, p80: perfect / n, champs, stages: stages.map(s => s / n)};
  }

  // Read-only data for the page (frozen so a screen cannot change the engine's tables by accident)
  Object.keys(NATIONS).forEach(k => Object.freeze(NATIONS[k]));
  [NATIONS, FALLBACK, GIANTS, CHALLENGERS, CONTENDERS].forEach(o => Object.freeze(o));
  const api = {
    NATIONS, FALLBACK, GIANTS, CHALLENGERS, CONTENDERS, YOU,
    setSquads, strength, hasSquad, kickLevel, nationKicker, road, run, standings, stakes, winProb, sim, mulberry32
  };
  root.WC = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
