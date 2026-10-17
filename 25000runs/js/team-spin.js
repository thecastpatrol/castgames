/* 25000 RUNS Team Spin: 27-0 style year + club spin. */
(function (T) {
  'use strict';

  var MIN_YEAR = 2011; // 25000 RUNS: BBL01, 2011/12
  var MAX_YEAR = 2025; // seasons go by the year they start (2025/26)
  T.SPIN_LIFT = 0.072; // see spinOffer

  function clubsInYear(year) {
    return Object.keys(T.CLUBS).filter(function (slug) {
      var c = T.CLUBS[slug];
      return c.from <= year && year <= c.to;
    });
  }

  // Unused players from that club and season who can play the chosen position
  // (or any open slot, if no position has been chosen)
  T.spinSquad = function (club, year, pos) {
    var S = T.state();
    return T.players
      .filter(function (p) { return !S.used[p.id] && !T.goatOut(p) && T.playedFor(p, club, year) && (pos ? T.canFill(p, pos) : T.fitsEmpty(p)); })
      .sort(function (a, b) { return a.name.localeCompare(b.name); }); // alphabetical so order leaks nothing
  };

  /* How many of the squad a spin shows (12 Oct 2026): an AFL list is about three times an NRL one, so a spin shows
     SPIN_SHOW players from the squad who can play that spot (a little under a 1000TRIES spin), drawn the same way for
     everyone with the same draft. keep: players who must be among them (the first spin's big run scorer, a Respin's) */
  T.SPIN_SHOW = 4;
  /* A spin for a batter's spot shows one more (17 Oct 2026, the owner: with one batter's spot now the All-Rounder's, Team
     Spin keeps playing as it did before) */
  T.SPIN_SHOW_POS = { B: 5 };
  function showN() { var S = T.state(); return (S && S.spinPos && T.SPIN_SHOW_POS[S.spinPos]) || T.SPIN_SHOW; }
  // and the first spin of a game lands on a big run scorer a little more often than the first offer of the other modes
  T.SPIN_FIRST_STAR = 0.8;
  function shown(squad, R, keep, low) {
    var n = showN();
    if (squad.length <= n) return squad;
    var must = (keep || []).filter(function (p) { return squad.indexOf(p) >= 0; }).slice(0, n);
    var rest = squad.filter(function (p) { return must.indexOf(p) < 0; });
    // a Respin's other cards come from below its bar when enough are left, so it shows one better, not more
    if (low) { var under = rest.filter(low); if (under.length >= n - must.length) rest = under; }
    for (var i = rest.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
    return must.concat(rest.slice(0, n - must.length)).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  // Spin until a combo has someone eligible. Returns the offer plus how many empty spins were skipped.
  T.spinOffer = function () {
    var S = T.state();
    var pos = S.spinPos || null;
    var skipped = 0;
    var R = T.stream ? T.stream('spin' + (S.spinNo = (S.spinNo || 0) + 1)) : Math.random; // seeded: a challenge gets the same spins
    // A Respin or Remove Player, 7 times in 10 (js/draft.js S.boost): a club and season with just 1 player for this
    // position who beats the best of the last squad (or the player removed), else one with more, else a normal spin
    var boost = S.boost; S.boost = null;
    if (boost) {
      var best = [];
      for (var by = MIN_YEAR; by <= MAX_YEAR; by++) {
        clubsInYear(by).forEach(function (c) {
          var bsq = T.spinSquad(c, by, pos), good = bsq.filter(function (p) { return p.tries_1998_plus >= boost.min; }).length;
          if (good) best.push({ year: by, club: c, players: bsq, good: good });
        });
      }
      var want = best.filter(function (x) { return x.good === boost.n; });
      if (!want.length) want = best;
      if (want.length) {
        var bc = want[Math.floor(R() * want.length)], better = function (p) { return p.tries_1998_plus >= boost.min; };
        var lift = bc.players.filter(better);
        for (var k = lift.length - 1; k > 0; k--) { var m = Math.floor(R() * (k + 1)), tmp = lift[k]; lift[k] = lift[m]; lift[m] = tmp; }
        S.firstOfferDone = true;
        S.offer = { kind: 'spin', year: bc.year, club: bc.club, pos: pos, skipped: 0, boosted: true,
          players: shown(bc.players, R, lift.slice(0, boost.n), function (p) { return !better(p); }) };
        S.revealed = {};
        return S.offer;
      }
    }
    // First spin of a game: most of the time land on a club and season with a big run scorer in that position
    var first = !S.firstOfferDone;
    S.firstOfferDone = true;
    // Now and then a later spin lands the same way (T.SPIN_LIFT, on its own seeded stream, so the other spins are dealt as
    // before): Team Spin set again on 17 Oct 2026, when the GOAT became rare in free play, so it stays as hard as it was
    var lift = !first && T.SPIN_LIFT > 0 && T.stream('spinlift' + S.spinNo)() < T.SPIN_LIFT;
    if ((first && R() < T.SPIN_FIRST_STAR) || lift) {
      var stars = T.players.filter(function (p) {
        return !S.used[p.id] && !T.goatOut(p) && p.tries_1998_plus >= T.starCut() && (pos ? T.canFill(p, pos) : T.fitsEmpty(p));
      });
      if (stars.length) {
        var star = stars[Math.floor(R() * stars.length)];
        var stints = (star.club_years || []).filter(function (cy) { return cy.to >= MIN_YEAR && cy.from <= MAX_YEAR; });
        if (stints.length) {
          var st = stints[Math.floor(R() * stints.length)];
          var from = Math.max(st.from, MIN_YEAR), to = Math.min(st.to, MAX_YEAR);
          var sy = from + Math.floor(R() * (to - from + 1));
          if (clubsInYear(sy).indexOf(st.club) !== -1) {
            var sq = T.spinSquad(st.club, sy, pos);
            if (sq.length) {
              S.offer = { kind: 'spin', year: sy, club: st.club, pos: pos, players: shown(sq, R, sq.indexOf(star) >= 0 ? [star] : []), skipped: 0 };
              S.revealed = {};
              return S.offer;
            }
          }
        }
      }
    }
    for (var guard = 0; guard < 400; guard++) {
      var year = MIN_YEAR + Math.floor(R() * (MAX_YEAR - MIN_YEAR + 1));
      var clubs = clubsInYear(year);
      var club = clubs[Math.floor(R() * clubs.length)];
      var squad = T.spinSquad(club, year, pos);
      if (squad.length) {
        S.offer = { kind: 'spin', year: year, club: club, pos: pos, players: shown(squad, R), skipped: skipped };
        S.revealed = {};
        return S.offer;
      }
      skipped++;
    }
    // Pool is nearly dry: pick straight from the combos that still have someone eligible
    var combos = [];
    for (var y = MIN_YEAR; y <= MAX_YEAR; y++) {
      clubsInYear(y).forEach(function (c) {
        var sq = T.spinSquad(c, y, pos);
        if (sq.length) combos.push({ year: y, club: c, players: sq });
      });
    }
    if (!combos.length) return null; // nobody left anywhere for this position
    var pickC = combos[Math.floor(R() * combos.length)];
    S.offer = { kind: 'spin', year: pickC.year, club: pickC.club, pos: pos, players: shown(pickC.players, R), skipped: skipped };
    S.revealed = {};
    return S.offer;
  };

  T.spinReelValues = function () {
    var years = [];
    for (var y = MIN_YEAR; y <= MAX_YEAR; y++) years.push(y);
    return { years: years, clubs: Object.keys(T.CLUBS) };
  };
})(window.T = window.T || {});
