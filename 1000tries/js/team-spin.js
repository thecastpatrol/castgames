/* 1000TRIES Team Spin: 27-0 style year + club spin. */
(function (T) {
  'use strict';

  var MIN_YEAR = 1998;
  var MAX_YEAR = 2026;

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
      .filter(function (p) { return !S.used[p.id] && T.playedFor(p, club, year) && (pos ? T.canFill(p, pos) : T.fitsEmpty(p)); })
      .sort(function (a, b) { return a.name.localeCompare(b.name); }); // alphabetical so order leaks nothing
  };

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
        var bc = want[Math.floor(R() * want.length)];
        S.firstOfferDone = true;
        S.offer = { kind: 'spin', year: bc.year, club: bc.club, pos: pos, players: bc.players, skipped: 0, boosted: true };
        S.revealed = {};
        return S.offer;
      }
    }
    // First spin of a game: most of the time land on a club and season with a big tryscorer in that position
    var first = !S.firstOfferDone;
    S.firstOfferDone = true;
    if (first && R() < T.FIRST_STAR_CHANCE) {
      var stars = T.players.filter(function (p) {
        return !S.used[p.id] && p.tries_1998_plus >= T.starCut() && (pos ? T.canFill(p, pos) : T.fitsEmpty(p));
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
              S.offer = { kind: 'spin', year: sy, club: st.club, pos: pos, players: sq, skipped: 0 };
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
        S.offer = { kind: 'spin', year: year, club: club, pos: pos, players: squad, skipped: skipped };
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
    S.offer = { kind: 'spin', year: pickC.year, club: pickC.club, pos: pos, players: pickC.players, skipped: skipped };
    S.revealed = {};
    return S.offer;
  };

  T.spinReelValues = function () {
    var years = [];
    for (var y = MIN_YEAR; y <= MAX_YEAR; y++) years.push(y);
    return { years: years, clubs: Object.keys(T.CLUBS) };
  };
})(window.T = window.T || {});
