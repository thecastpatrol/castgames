/* SC wildcards: Reroll (a fresh spin), Reveal (every season's SC points on the spin, internally 'scout'), Remove Player
   (internally 'tweak'), and Substitute (CAST Pass). Reroll and Remove Player: one of each a game (two with CAST Pass);
   more from the Vault or the Shop. */
(function (T) {
  'use strict';

  // Reveal is paid: no free one a game, only from the Vault or bought on the spot. One Reveal shows all three seasons on
  // the spin, as 1000TRIES's does (the owner, 17 Oct 2026); a new spin (a Reroll too) starts hidden again
  T.FREE_REVEALS = 0;

  T.WILDCARDS = {
    reroll: { label: 'Reroll', desc: 'Spin again: three new seasons.' },
    scout:  { label: 'Reveal', desc: 'Show the SC points for all three seasons on this spin.' },
    tweak:  { label: 'Remove Player', desc: 'Take one player out of your 18 and spin for his spot.' }
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
  // One Reveal: every season on the current spin shows his SC points (nothing is picked)
  T.useScout = function () {
    var S = T.state();
    if (!S || !T.canUse('scout')) return false;
    S.wildcards.scout--;
    S.offer.players.forEach(function (p) { S.revealed[p.id] = true; });
    S.scoutMode = false;
    return true;
  };
  // Older callers: arming is gone, a Reveal is used at once
  T.armScout = function (on) { return on ? T.useScout() : false; };

  // Remove Player is two steps: arm it, then tap a filled slot. Cancelling does not spend it.
  T.armTweak = function (on) {
    var S = T.state();
    if (on && !T.canUse('tweak')) return false;
    S.tweakMode = !!on;
    if (on) S.scoutMode = false;
    return S.tweakMode;
  };

  /* Substitute (CAST Pass, 1 a game): move a season in your 18 into an open spot in his other SC position that year,
     to make room (a MID/FWD moves to the forwards, and his midfield spot opens up). */
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
