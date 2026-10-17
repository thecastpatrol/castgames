 
(function (T) {
  'use strict';

  var MIN_YEAR = 1992; 
  var MAX_YEAR = T.CUR_SEASON || 2026; 
  T.SPIN_LIFT = 0; 

  
  function clubsInYear(year) {
    return Object.keys(T.CLUBS).filter(function (slug) {
      var c = T.CLUBS[slug];
      return (c.spells || [[c.from, c.to]]).some(function (s) { return s[0] <= year && year <= s[1]; }); 
    });
  }

  
  
  T.spinSquad = function (club, year, pos) {
    var S = T.state();
    return T.players
      .filter(function (p) { return !S.used[p.id] && !T.goatOut(p) && T.playedFor(p, club, year) && (pos ? T.canFill(p, pos) : T.fitsEmpty(p)); })
      .sort(function (a, b) { return a.name.localeCompare(b.name); }); 
  };

  


  T.SPIN_SHOW = 4;
  function shown(squad, R, keep, low) {
    if (squad.length <= T.SPIN_SHOW) return squad;
    var must = (keep || []).filter(function (p) { return squad.indexOf(p) >= 0; }).slice(0, T.SPIN_SHOW);
    var rest = squad.filter(function (p) { return must.indexOf(p) < 0; });
    
    if (low) { var under = rest.filter(low); if (under.length >= T.SPIN_SHOW - must.length) rest = under; }
    for (var i = rest.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
    return must.concat(rest.slice(0, T.SPIN_SHOW - must.length)).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  
  T.spinOffer = function () {
    var S = T.state();
    var pos = S.spinPos || null;
    var skipped = 0;
    var R = T.stream ? T.stream('spin' + (S.spinNo = (S.spinNo || 0) + 1)) : Math.random; 
    
    
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
    
    var first = !S.firstOfferDone;
    S.firstOfferDone = true;
    
    
    var lift = !first && T.SPIN_LIFT > 0 && T.stream('spinlift' + S.spinNo)() < T.SPIN_LIFT;
    if ((first && R() < T.FIRST_STAR_CHANCE) || lift) {
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
    
    var combos = [];
    for (var y = MIN_YEAR; y <= MAX_YEAR; y++) {
      clubsInYear(y).forEach(function (c) {
        var sq = T.spinSquad(c, y, pos);
        if (sq.length) combos.push({ year: y, club: c, players: sq });
      });
    }
    if (!combos.length) return null; 
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
