


























(function (root) {
  'use strict';
  
  var CLUBS = [
    ['broncos', 'Broncos'], ['bulldogs', 'Bulldogs'], ['cowboys', 'Cowboys'], ['dolphins', 'Dolphins'],
    ['dragons', 'Dragons'], ['eels', 'Eels'], ['knights', 'Knights'], ['panthers', 'Panthers'],
    ['rabbitohs', 'Rabbitohs'], ['raiders', 'Raiders'], ['roosters', 'Roosters'], ['seaeagles', 'Sea Eagles'],
    ['sharks', 'Sharks'], ['storm', 'Storm'], ['titans', 'Titans'], ['warriors', 'Warriors'], ['tigers', 'Wests Tigers']
  ];
  var TILES_1 = CLUBS.concat([['origin', 'Origin'], ['aus', 'Kangaroos'], ['nzl', 'Kiwis']]);
  var TILES_2 = CLUBS.concat([['nsw', 'NSW Blues'], ['qld', 'QLD Maroons'], ['aus', 'Australia'], ['nzl', 'New Zealand'],
    ['eng', 'England'], ['sam', 'Samoa'], ['ton', 'Tonga']]);
  var LIVES = 3, VERSION = 2, MAX_MOVES = 3000;
  

  var RULES = { 1: { tiles: TILES_1, skips: 3, auto: true }, 2: { tiles: TILES_2, skips: 0, auto: false } };
  var TILES = RULES[VERSION].tiles, N = TILES.length, SKIPS = RULES[VERSION].skips;
  var LETTERS = 'abcdefghijklmnopqrstuvwx';
  var INDEX = {}; TILES.forEach(function (t, i) { INDEX[t[0]] = i; });

  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = hash(seed); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  
  function dailySeed(date) { return 'daily:' + date; }

  

  function order(players, seed) {
    var r = rng('bingo|' + seed), keys = new Array(players.length);
    for (var i = 0; i < players.length; i++) {
      var w = Math.max(1, players[i][5] | 0), u = r();
      keys[i] = [Math.pow(u || 1e-12, 1 / w), i];
    }
    keys.sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; });
    return keys.map(function (k) { return k[1]; });
  }
  function fits(players, p, t) { return !!(players[p] && (players[p][4] & (1 << t))); }
  
  function tilesOf(players, p, v) { var n = (RULES[v] || RULES[VERSION]).tiles.length, out = []; for (var t = 0; t < n; t++) if (fits(players, p, t)) out.push(t); return out; }

   
  function Board(players, seed, v) {
    this.v = RULES[v] ? v : VERSION; this.R = RULES[this.v]; this.T = this.R.tiles; this.N = this.T.length;
    this.P = players; this.seed = seed; this.order = order(players, seed); this.pos = 0;
    this.grid = []; for (var t = 0; t < this.N; t++) this.grid.push(-1);
    this.filled = 0; this.lives = LIVES; this.skips = 0; this.wrong = 0; this.nofit = 0; this.ribs = 0; this.wilds = 0; this.reveals = 0;
    this.out = false; this.auto = 0; this.decisions = 0; this.moves = ''; this.revealed = -1;
  }
  Board.prototype.won = function () { return this.filled === this.N; };
  
  Board.prototype.empty = function () { return this.pos >= this.order.length; };
  Board.prototype.over = function () { return this.won() || this.empty() || this.out; };
  Board.prototype.open = function (t) { return this.grid[t] === -1; };
  
  Board.prototype.openFits = function (p) { var out = []; for (var t = 0; t < this.N; t++) if (this.grid[t] === -1 && fits(this.P, p, t)) out.push(t); return out; };
  

  Board.prototype.settle = function () {
    var gone = [];
    if (!this.R.auto || this.won() || this.out) return gone;
    while (this.pos < this.order.length && !this.openFits(this.order[this.pos]).length) { gone.push(this.order[this.pos]); this.pos++; this.auto++; }
    return gone;
  };
  
  Board.prototype.card = function () { this.settle(); return this.over() ? -1 : this.order[this.pos]; };
  
  Board.prototype.noFit = function () { var p = this.card(); return p >= 0 && !this.openFits(p).length; };
  Board.prototype.freeSkips = function () { return Math.max(0, this.R.skips - this.skips); };
  Board.prototype.paidSkips = function () { return Math.max(0, this.skips - this.R.skips); };
  Board.prototype.next = function () { this.pos++; this.revealed = -1; };
  Board.prototype.lose = function () { this.lives--; if (this.lives <= 0) { this.lives = 0; this.out = true; } };

  
  Board.prototype.tap = function (t) {
    var p = this.card();
    if (p < 0) return { ok: false, why: 'the board is over' };
    if (!(t >= 0 && t < this.N)) return { ok: false, why: 'no such tile' };
    if (!this.open(t)) return { ok: false, why: 'that tile is filled' };
    this.decisions++; this.moves += LETTERS[t];
    var right = fits(this.P, p, t);
    if (right) { this.grid[t] = p; this.filled++; } else { this.wrong++; this.lose(); }
    this.next();
    return { ok: true, right: right, p: p, t: t };
  };
  
  Board.prototype.skip = function () {
    var p = this.card();
    if (p < 0) return { ok: false, why: 'the board is over' };
    this.decisions++; this.skips++; this.moves += 'S';
    this.next();
    return { ok: true, p: p, paid: this.skips > this.R.skips };
  };
  
  Board.prototype.pass = function () {
    if (this.R.auto) return { ok: false, why: 'no such move on these rules' };
    var p = this.card();
    if (p < 0) return { ok: false, why: 'the board is over' };
    if (this.openFits(p).length) return { ok: false, why: 'he fits an open tile' };
    this.decisions++; this.nofit++; this.moves += 'N';
    this.lose();
    this.next();
    return { ok: true, p: p };
  };
  
  Board.prototype.reveal = function () {
    var p = this.card();
    if (p < 0) return { ok: false, why: 'the board is over' };
    if (this.revealed === this.pos) return { ok: false, why: 'already revealed' };
    this.reveals++; this.moves += 'V'; this.revealed = this.pos;
    return { ok: true, p: p, tiles: this.openFits(p) };
  };
  
  Board.prototype.wild = function (t) {
    if (this.over()) return { ok: false, why: 'the board is over' };
    if (!(t >= 0 && t < this.N)) return { ok: false, why: 'no such tile' };
    if (!this.open(t)) return { ok: false, why: 'that tile is filled' };
    this.grid[t] = -2; this.filled++; this.wilds++; this.moves += 'W' + LETTERS[t];
    return { ok: true, t: t };
  };
  
  Board.prototype.runItBack = function () {
    if (!this.out || this.won()) return { ok: false, why: 'Run It Back without losing the last life' };
    this.out = false; this.lives = 1; this.ribs++; this.moves += 'B';
    return { ok: true };
  };

  

  function build(players, seed, moves, v) {
    if (!Array.isArray(players) || !players.length) return { ok: false, why: 'players' };
    if (typeof seed !== 'string' || seed.length < 4 || seed.length > 40) return { ok: false, why: 'seed' };
    if (typeof moves !== 'string' || moves.length > MAX_MOVES || !/^(?:[a-xSNVB]|W[a-x])*$/.test(moves)) return { ok: false, why: 'moves' };
    var b = new Board(players, seed, v);
    for (var k = 0; k < moves.length; k++) {
      var c = moves[k], r;
      if (b.won()) return { ok: false, why: 'a move after the Full House' };
      if (b.out && c !== 'B') return { ok: false, why: 'a move after the last life' };
      if (c === 'B') r = b.runItBack();
      else if (c === 'S') r = b.skip();
      else if (c === 'N') r = b.pass();
      else if (c === 'V') r = b.reveal();
      else if (c === 'W') { k++; r = b.wild(LETTERS.indexOf(moves[k])); }
      else r = b.tap(LETTERS.indexOf(c));
      if (!r.ok) return { ok: false, why: r.why };
    }
    if (!b.out && !b.won()) b.settle();
    return { ok: true, board: b };
  }
  

  function replay(players, seed, moves, v) {
    var x = build(players, seed, moves, v);
    if (!x.ok) return x;
    var b = x.board;
    return { ok: true, v: b.v, filled: b.filled, won: b.won(), lives: b.lives, wrong: b.wrong, nofit: b.nofit, skips: b.skips, paidSkips: b.paidSkips(), ribs: b.ribs,
      wilds: b.wilds, reveals: b.reveals, decisions: b.decisions, grid: b.grid.slice(), over: b.over(), out: b.out };
  }

  var api = { VERSION: VERSION, RULES: RULES, TILES: TILES, TILES_1: TILES_1, N: N, LIVES: LIVES, SKIPS: SKIPS, LETTERS: LETTERS, INDEX: INDEX, MAX_MOVES: MAX_MOVES,
    Board: Board, build: build, replay: replay, order: order, fits: fits, tilesOf: tilesOf, dailySeed: dailySeed, hash: hash };
  root.BINGO_ENGINE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
