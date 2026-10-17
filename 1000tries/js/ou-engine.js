











(function (root) {
  'use strict';
  var CATS = {
    nrl: { name: 'NRL-Era Tries', unit: 'NRL-era tries', one: 'NRL-era try', base: 150, step: 45 }, 
    caps: { name: 'Test Caps', unit: 'Tests', one: 'Test', base: 120, step: 40 },
    ttries: { name: 'Test Tries', unit: 'Test tries', one: 'Test try', base: 90, step: 30 },
    nrlw: { name: 'NRLW Tries', unit: 'tries', one: 'try', base: 45, step: 14 },
    
    
    goals: { name: 'AFL-Era Goals', unit: 'AFL-era goals', one: 'AFL-era goal', base: 150, step: 45, game: '4000goals' },
    games: { name: 'AFL-Era Games', unit: 'AFL-era games', one: 'AFL-era game', base: 150, step: 45, game: '4000goals' },
    aflw: { name: 'AFLW Goals', unit: 'goals', one: 'goal', base: 45, step: 14, game: '4000goals' },
    
    bblruns: { name: 'BBL Runs', unit: 'BBL runs', one: 'BBL run', base: 45, step: 14, game: 'bigbash' },
    bblwkts: { name: 'BBL Wickets', unit: 'BBL wickets', one: 'BBL wicket', base: 40, step: 10, game: 'bigbash' },
    
    testruns: { name: 'Test Runs', unit: 'Test runs', one: 'Test run', base: 150, step: 45, game: 'tests' },
    testwkts: { name: 'Test Wickets', unit: 'Test wickets', one: 'Test wicket', base: 120, step: 40, game: 'tests' },
    
    nfltds: { name: 'Career TDs', unit: 'career TDs', one: 'career TD', base: 150, step: 45, game: 'nfl' },
    
    jockeyg1: { name: 'Jockey Group 1 Wins', unit: 'Group 1 wins', one: 'Group 1 win', base: 40, step: 12, game: 'racing' },
    bigrace: { name: 'Big Race Wins', unit: 'big race wins', one: 'big race win', base: 30, step: 8, game: 'racing' },
    horseg1: { name: 'Horses\u2019 Group 1 Wins', unit: 'Group 1 wins', one: 'Group 1 win', base: 45, step: 14, game: 'racing' },
    
    plgoals: { name: 'Premier League Goals', unit: 'PL goals', one: 'PL goal', base: 150, step: 45, game: 'epl' },
    plassists: { name: 'Premier League Assists', unit: 'PL assists', one: 'PL assist', base: 150, step: 45, game: 'epl' },
    plapps: { name: 'PL Appearances', unit: 'PL games', one: 'PL game', base: 150, step: 45, game: 'epl' },
    
    nbapts: { name: 'NBA Points', unit: 'NBA points', one: 'NBA point', base: 150, step: 45, game: 'nba' },
    nbareb: { name: 'NBA Rebounds', unit: 'NBA rebounds', one: 'NBA rebound', base: 150, step: 45, game: 'nba' },
    nbaast: { name: 'NBA Assists', unit: 'NBA assists', one: 'NBA assist', base: 120, step: 40, game: 'nba' }
  };
  function gameOf(cat) { return (CATS[cat] && CATS[cat].game) || '1000tries'; }
  
  var BANDS = [[0, 0.3, 0.75], [3, 0.18, 0.5], [6, 0.1, 0.32], [10, 0.06, 0.24], [16, 0.03, 0.18]]; 
  
  function callTime(streak) { var n = streak || 0; return n < 1 ? 9 : n < 10 ? 6 : n < 20 ? 4 : 3; }

  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = hash(seed); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function band(level) { var b = BANDS[0]; for (var i = 0; i < BANDS.length; i++) if (level >= BANDS[i][0]) b = BANDS[i]; return b; }
  function gap(a, b) { var m = Math.max(a, b); return m ? Math.abs(a - b) / m : 0; }

  

  


  var VERSION = 2, EASY_ODDS = 0.13, EASY_FROM = 2;
  function Run(list, cat, seed, v) {
    this.list = list; this.cat = CATS[cat] || CATS.nrl; this.r = rng(cat + '|' + seed); this.used = {}; this.v = v === 2 ? 2 : 1; this.easyLast = false;
    this.left = this.first();
    this.right = this.draw(0);
  }
  Run.prototype.poolSize = function (level) { return Math.min(this.list.length, this.cat.base + this.cat.step * level); };
  Run.prototype.first = function () {
    var n = this.poolSize(0), i = Math.floor(this.r() * Math.min(n, 60)); 
    this.used[i] = 1;
    return i;
  };
  


  Run.prototype.easy = function (level) {
    if (this.v < 2 || level < EASY_FROM) return -1;
    if (this.easyLast) { this.easyLast = false; return -1; }
    if (this.r() >= EASY_ODDS) return -1;
    var L = this.list, lv = L[this.left][1], cap = Math.min(Math.floor(lv * 0.2), lv - 5), start = -1;
    if (cap < 0) return -1;
    for (var j = 0; j < L.length; j++) if (L[j][1] <= cap) { start = j; break; }
    if (start < 0) return -1;
    for (var k = 0; k < 20; k++) {
      var i = start + Math.floor(this.r() * (L.length - start));
      if (!this.used[i]) { this.used[i] = 1; this.easyLast = true; return i; }
    }
    return -1;
  };
  Run.prototype.draw = function (level) {
    var e = this.easy(level);
    if (e >= 0) return e;
    var L = this.list, lv = L[this.left][1], n = this.poolSize(level), b = band(level), best = -1, bestMiss = Infinity;
    for (var tries = 0; tries < 80; tries++) {
      var i = Math.floor(this.r() * n);
      if (this.used[i] || L[i][1] === lv) continue; 
      var g = gap(lv, L[i][1]);
      if (g >= b[1] && g <= b[2]) { best = i; break; }
      var miss = g < b[1] ? b[1] - g : g - b[2];
      if (miss < bestMiss) { bestMiss = miss; best = i; }
    }
    if (best < 0) { 
      for (var j = 0; j < L.length; j++) if (!this.used[j] && L[j][1] !== lv) { best = j; break; }
    }
    if (best < 0) return -1;
    this.used[best] = 1;
    return best;
  };
  
  Run.prototype.answer = function () { return this.list[this.right][1] > this.list[this.left][1] ? 'O' : 'U'; };

  

  function replay(list, cat, seed, calls, v) {
    if (!CATS[cat]) return { ok: false, why: 'category' };
    if (typeof calls !== 'string' || !/^[OUTRB]{0,8000}$/.test(calls)) return { ok: false, why: 'calls' }; 
    var run = new Run(list, cat, seed, v), streak = 0, ribs = 0, rerolls = 0, out = false, seen = [list[run.left][0]];
    for (var k = 0; k < calls.length; k++) {
      var c = calls[k];
      if (run.right < 0) return { ok: false, why: 'no players left' };
      if (out) {
        if (c !== 'B') return { ok: false, why: 'after the end' };
        out = false; ribs++;
        run.right = run.draw(streak); 
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

  var api = { VERSION: VERSION, CATS: CATS, BANDS: BANDS, callTime: callTime, Run: Run, replay: replay, gap: gap, gameOf: gameOf };
  root.OU_ENGINE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
