/* 4000 GOALS wildcards: Reroll, Reveal Goals, Remove Player (internally 'tweak'). One use each (not in Exactly 4000). */
(function (T) {
  'use strict';

  T.WILDCARDS = {
    reroll: { label: 'Reroll', desc: 'Bin this offer and get a fresh one.' },
    scout:  { label: 'Reveal Goals', desc: 'Show the goals for everyone on this offer.' },
    tweak:  { label: 'Remove Player', desc: 'Take one player out of your 18 and draft again.' }
  };

  T.canUse = function (key) {
    var S = T.state();
    if (!S || S.finished || !S.mode.wildcards || S.wildcards[key] < 1) return false;
    if (key === 'scout') return !!(S.offer && S.offer.players.length && !S.offer.goat && !S.offer.paid); // the GOAT's and a bought Immortal Pick's offers stay
    // a Legend Key's Legends Pick stays too: the key is spent once they're dealt (9 Oct 2026)
    if (key === 'reroll') return !!(S.offer && S.offer.players.length && !S.offer.goat && !S.offer.paid && !S.offer.key);
    if (key === 'tweak') return T.filledCount() > 0;
    return false;
  };

  T.useReroll = function () {
    var S = T.state();
    if (!T.canUse('reroll')) return null;
    S.wildcards.reroll--;
    T.setBoost(T.bestOnOffer() + 1); // 7 times in 10 the new offer has one who beats the best one binned (js/draft.js rollOffer)
    return S.mode.source === 'spin' ? T.spinOffer() : T.rollOffer();
  };

  // The most goals on the offer in front of you (what a Reroll's new offer has to beat)
  T.bestOnOffer = function () {
    var S = T.state();
    return S && S.offer ? S.offer.players.reduce(function (m, p) { return Math.max(m, p.tries_1998_plus || 0); }, 0) : 0;
  };

  T.useScout = function () {
    var S = T.state();
    if (!T.canUse('scout')) return false;
    S.wildcards.scout--;
    S.offer.players.forEach(function (p) { S.revealed[p.id] = true; });
    return true;
  };

  // Tweak is two steps: arm it, then tap a filled slot. Cancelling does not spend it.
  T.armTweak = function (on) {
    var S = T.state();
    if (on && !T.canUse('tweak')) return false;
    S.tweakMode = !!on;
    return S.tweakMode;
  };

  /* Substitute (CAST Pass, 1 a game in the wildcard modes): move a player in your 18 into an open spot in another
     position they play, to make room (a centre who plays wing moves out wide, and the centre spot opens up). */
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
  T.canSub = function () { var S = T.state(); return !!S && !S.finished && !!S.mode.wildcards && (S.subLeft || 0) > 0 && T.subMovable().length > 0; };
  T.subMove = function (from, to) {
    var S = T.state(), a = S.slots[from], b = S.slots[to];
    if (!a || !a.player || !b || b.player || T.subTargets(from).indexOf(to) === -1 || (S.subLeft || 0) < 1) return null;
    b.player = a.player; b.club = a.club; b.year = a.year; b.top = a.top; // top: Perfect Read (js/draft.js)
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
    T.setBoost(p.tries_1998_plus + 1); // 7 times in 10 the next offer has one who beats him
    S.wildcards.tweak--;
    S.tweakMode = false;
    return p;
  };
})(window.T = window.T || {});
