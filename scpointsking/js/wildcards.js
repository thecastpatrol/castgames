/* SC wildcards: Reroll (a fresh spin), Reveal (one season's SC points on the offer, internally 'scout'), Remove Player
   (internally 'tweak'), and Substitute (CAST Pass). Reroll and Remove Player: one of each a game (two with CAST Pass);
   more from the Vault or the Shop. */
(function (T) {
  'use strict';

  // Reveal is paid (the owner, 17 Oct 2026: SC points hidden until the end, "Reveal shows one, paid"): no free one a
  // game, only from the Vault or bought on the spot
  T.FREE_REVEALS = 0;

  T.WILDCARDS = {
    reroll: { label: 'Reroll', desc: 'Spin again: three new seasons.' },
    scout:  { label: 'Reveal', desc: 'Tap one season on this spin to see his SC points.' },
    tweak:  { label: 'Remove Player', desc: 'Take one player out of your 13 and spin for his spot.' }
  };

  T.canUse = function (key) {
    var S = T.state();
    if (!S || S.finished || S.fullTime || !S.mode.wildcards || S.wildcards[key] < 1) return false;
    var plain = !!(S.offer && S.offer.players.length && !S.offer.goat && !S.offer.paid && !S.offer.key); // a key's Legends or the GOAT show their numbers already
    if (key === 'scout') return plain && S.offer.players.some(function (p) { return !S.revealed[p.id]; });
    if (key === 'reroll') return plain;
    if (key === 'tweak') return T.filledCount() > 0;
    return false;
  };

  T.useReroll = function () {
    var S = T.state();
    if (!T.canUse('reroll')) return null;
    S.wildcards.reroll--;
    T.setBoost(T.bestOnOffer() + 1); // the new spin can bring one who beats the best one binned (js/draft.js rollOffer)
    return T.rollOffer();
  };

  // The most SC points on the offer in front of you (what a Reroll's new spin has to beat)
  T.bestOnOffer = function () {
    var S = T.state();
    return S && S.offer ? S.offer.players.reduce(function (m, p) { return Math.max(m, p.tries_1998_plus || 0); }, 0) : 0;
  };

  // Reveal is two steps: arm it, then tap a season on the offer (his SC points show, nothing is picked). Cancelling
  // does not spend it
  T.armScout = function (on) {
    var S = T.state();
    if (on && !T.canUse('scout')) return false;
    S.scoutMode = !!on;
    if (on) S.tweakMode = false;
    return S.scoutMode;
  };
  T.useScout = function (id) {
    var S = T.state();
    if (!S || !S.scoutMode || !T.canUse('scout') || !S.offer.players.some(function (p) { return p.id === id; }) || S.revealed[id]) return false;
    S.wildcards.scout--;
    S.revealed[id] = true;
    S.scoutMode = false;
    return true;
  };

  // Remove Player is two steps: arm it, then tap a filled slot. Cancelling does not spend it.
  T.armTweak = function (on) {
    var S = T.state();
    if (on && !T.canUse('tweak')) return false;
    S.tweakMode = !!on;
    if (on) S.scoutMode = false;
    return S.tweakMode;
  };

  /* Substitute (CAST Pass, 1 a game): move a season in your 13 into an open spot in his other SC position that year,
     to make room (a CTW/FLB moves to fullback, and the centre or wing spot opens up). */
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
    T.setBoost(p.tries_1998_plus + 1); // the next spin can bring one who beats him
    S.wildcards.tweak--;
    S.tweakMode = false;
    return p;
  };
})(window.T = window.T || {});
