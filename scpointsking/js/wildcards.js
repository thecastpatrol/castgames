


(function (T) {
  'use strict';

  
  
  T.FREE_REVEALS = 0;

  T.WILDCARDS = {
    reroll: { label: 'Reroll', desc: 'Spin again: three new seasons.' },
    scout:  { label: 'Reveal', desc: 'Show the SC points for all three seasons on this spin.' },
    tweak:  { label: 'Remove Player', desc: 'Take one player out of your 13 and spin for his spot.' }
  };

  T.canUse = function (key) {
    var S = T.state();
    if (!S || S.finished || S.fullTime || !S.mode.wildcards || S.wildcards[key] < 1) return false;
    var plain = !!(S.offer && S.offer.players.length && !S.offer.goat && !S.offer.paid && !S.offer.key); 
    if (key === 'scout') return plain && S.offer.players.some(function (p) { return !S.revealed[p.id]; });
    if (key === 'reroll') return plain;
    if (key === 'tweak') return T.filledCount() > 0;
    return false;
  };

  T.useReroll = function () {
    var S = T.state();
    if (!T.canUse('reroll')) return null;
    S.wildcards.reroll--;
    T.setBoost(T.bestOnOffer() + 1); 
    return T.rollOffer();
  };

  
  T.bestOnOffer = function () {
    var S = T.state();
    return S && S.offer ? S.offer.players.reduce(function (m, p) { return Math.max(m, p.tries_1998_plus || 0); }, 0) : 0;
  };

  
  
  
  T.useScout = function () {
    var S = T.state();
    if (!S || !T.canUse('scout')) return false;
    S.wildcards.scout--;
    S.offer.players.forEach(function (p) { S.revealed[p.id] = true; });
    S.scoutMode = false;
    return true;
  };
  
  T.armScout = function (on) { return on ? T.useScout() : false; };

  
  T.armTweak = function (on) {
    var S = T.state();
    if (on && !T.canUse('tweak')) return false;
    S.tweakMode = !!on;
    if (on) S.scoutMode = false;
    return S.tweakMode;
  };

  

  T.subTargets = function (idx) {
    var S = T.state(), s = S && S.slots[idx];
    if (!s || !s.player) return [];
    var codes = T.positionsOf(s.player), out = [];
    S.slots.forEach(function (x, i) { if (i !== idx && !x.player && x.code !== s.code && codes.indexOf(x.code) !== -1) out.push(i); });
    return out;
  };
  T.subMovable = function () {
    var S = T.state(), out = [];
    if (!S) return out;
    S.slots.forEach(function (x, i) { if (x.player && T.subTargets(i).length) out.push(i); });
    return out;
  };
  T.canSub = function () { var S = T.state(); return !!S && !S.finished && !S.fullTime && !!S.mode.wildcards && (S.subLeft || 0) > 0 && T.subMovable().length > 0; };
  T.subMove = function (from, to) {
    var S = T.state(), a = S.slots[from], b = S.slots[to];
    if (!a || !a.player || !b || b.player || T.subTargets(from).indexOf(to) === -1 || (S.subLeft || 0) < 1) return null;
    b.player = a.player; b.club = a.club; b.year = a.year; b.top = a.top;
    a.player = null; a.club = null; a.year = null; a.top = null;
    S.subLeft--; S.subUsed = (S.subUsed || 0) + 1; S.subMode = null;
    S.history.push({ type: 'sub', id: b.player.id, from: from, to: to });
    return b.player;
  };

  T.applyTweak = function (idx) {
    var S = T.state();
    if (!S.tweakMode || S.wildcards.tweak < 1) return null;
    var p = T.removeAt(idx);
    if (!p) return null;
    T.setBoost(p.tries_1998_plus + 1); 
    S.wildcards.tweak--;
    S.tweakMode = false;
    return p;
  };
})(window.T = window.T || {});
