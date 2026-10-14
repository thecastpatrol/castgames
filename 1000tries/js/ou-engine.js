/* Over or Under (14 Oct 2026, the owner's BUILD IT): a higher-or-lower run for 1000TRIES. Two players: you see the left
   one's number and call whether the right one's is Over or Under it. Right, and the right card becomes the left with a new
   player in; wrong (or out of time), and you're out, unless you Run It Back.

   One engine for the site (js/overunder.js) and the server (functions lib/boards.js checks every run by replaying it), so
   the draw is deterministic: the same seed and the same calls always give the same players. The owner's rules: never two
   players on the same number ("over or under 8 tries and the other person is 8 tries ruins the game"), and it gets
   challenging: pairs start far apart among well-known players, then close in and reach further down the list.

   Data (data/ou.json, tools/build_ou.py): { cat: [[name, value, club or nation], ...] } highest first.
   Calls, one letter each: O over, U under, T out of time, R reroll (a new right player), B Run It Back (after a miss: play
   on from the same left player with a new right one). */
(function (root) {
  'use strict';
  var CATS = {
    nrl: { name: 'NRL-Era Tries', unit: 'NRL-era tries', one: 'NRL-era try', base: 150, step: 45 }, // since 1998 only (the owner)
    caps: { name: 'Test Caps', unit: 'Tests', one: 'Test', base: 120, step: 40 },
    ttries: { name: 'Test Tries', unit: 'Test tries', one: 'Test try', base: 90, step: 30 },
    nrlw: { name: 'NRLW Tries', unit: 'tries', one: 'try', base: 45, step: 14 }
  };
  // The relative gap a pair aims for, by streak: |a - b| / max(a, b). Far apart early, close later
  var BANDS = [[0, 0.3, 0.75], [3, 0.18, 0.5], [6, 0.1, 0.32], [10, 0.06, 0.24], [16, 0.03, 0.18]]; // hard, never a coin flip (the owner: trophies a human can get)
  // Seconds a call gets (the owner, 14 Oct 2026): 10 for the first call, then 7, then 5, then 4
  function callTime(streak) { var n = streak || 0; return n < 1 ? 10 : n < 10 ? 7 : n < 20 ? 5 : 4; }

  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = hash(seed); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function band(level) { var b = BANDS[0]; for (var i = 0; i < BANDS.length; i++) if (level >= BANDS[i][0]) b = BANDS[i]; return b; }
  function gap(a, b) { var m = Math.max(a, b); return m ? Math.abs(a - b) / m : 0; }

  /* A run: list (a category's [[name, value, club]] highest first), seed. draw(level) gives the index of the next right
     player for the current left one. The pool (the best known: the top base + step x level) grows with the streak */
  function Run(list, cat, seed) {
    this.list = list; this.cat = CATS[cat] || CATS.nrl; this.r = rng(cat + '|' + seed); this.used = {};
    this.left = this.first();
    this.right = this.draw(0);
  }
  Run.prototype.poolSize = function (level) { return Math.min(this.list.length, this.cat.base + this.cat.step * level); };
  Run.prototype.first = function () {
    var n = this.poolSize(0), i = Math.floor(this.r() * Math.min(n, 60)); // a well-known player to start
    this.used[i] = 1;
    return i;
  };
  Run.prototype.draw = function (level) {
    var L = this.list, lv = L[this.left][1], n = this.poolSize(level), b = band(level), best = -1, bestMiss = Infinity;
    for (var tries = 0; tries < 80; tries++) {
      var i = Math.floor(this.r() * n);
      if (this.used[i] || L[i][1] === lv) continue; // never the same number as the left player
      var g = gap(lv, L[i][1]);
      if (g >= b[1] && g <= b[2]) { best = i; break; }
      var miss = g < b[1] ? b[1] - g : g - b[2];
      if (miss < bestMiss) { bestMiss = miss; best = i; }
    }
    if (best < 0) { // everyone near was used or level with the left one: anyone else in the list
      for (var j = 0; j < L.length; j++) if (!this.used[j] && L[j][1] !== lv) { best = j; break; }
    }
    if (best < 0) return -1;
    this.used[best] = 1;
    return best;
  };
  // The answer for the current pair: 'O' if the right one is over the left, else 'U' (never level)
  Run.prototype.answer = function () { return this.list[this.right][1] > this.list[this.left][1] ? 'O' : 'U'; };

  /* The whole run from its seed and calls: { ok, why, streak, ribs, rerolls, calls, players } (players: the right-hand
     picks in order, for the share card and team sheet). The server's check (lib/boards.js) and the site's own record */
  function replay(list, cat, seed, calls) {
    if (!CATS[cat]) return { ok: false, why: 'category' };
    if (typeof calls !== 'string' || !/^[OUTRB]{0,600}$/.test(calls)) return { ok: false, why: 'calls' };
    var run = new Run(list, cat, seed), streak = 0, ribs = 0, rerolls = 0, out = false, seen = [list[run.left][0]];
    for (var k = 0; k < calls.length; k++) {
      var c = calls[k];
      if (run.right < 0) return { ok: false, why: 'no players left' };
      if (out) {
        if (c !== 'B') return { ok: false, why: 'after the end' };
        out = false; ribs++;
        run.right = run.draw(streak); // play on: the same left player, a new right one
        continue;
      }
      if (c === 'B') return { ok: false, why: 'Run It Back without a miss' };
      if (c === 'R') { rerolls++; run.right = run.draw(streak); continue; }
      seen.push(list[run.right][0]);
      if (c !== 'T' && c === run.answer()) {
        streak++;
        run.left = run.right;
        run.right = run.draw(streak);
      } else out = true;
    }
    return { ok: true, streak: streak, ribs: ribs, rerolls: rerolls, ended: out, players: seen };
  }

  var api = { CATS: CATS, BANDS: BANDS, callTime: callTime, Run: Run, replay: replay, gap: gap };
  root.OU_ENGINE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
