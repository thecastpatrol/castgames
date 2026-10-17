/* NRL Bingo (17 Oct 2026, the owner's BUILD IT): a 4 x 5 card of 20 tiles, the 17 NRL clubs, one State of Origin tile and
   the Kangaroos and Kiwis. One player at a time: tap a tile he played for and it fills. A wrong tap costs one of 3 lives,
   3 skips are free, and a player who fits no open tile is skipped by himself. Fill all 20 for a Full House. Boards rank
   the tiles filled, then the time.

   One engine for the site (js/bingo.js) and the server (functions lib/bingo.js replays every board from its seed and its
   moves), so the order of players is fixed by the seed: the same seed and the same moves always give the same board.

   Data (data/bingo.json, tools/build_bingo.py): { v, players: [[name, position, first season, last season, tiles, w]] }.
   tiles: one bit per tile (TILES order). w: a whole number from 1 up, how often he turns up in the order.

   Moves, one letter each (W takes two):
     a to t   tap that tile (TILES order) for the player on the card: it fills if he played there, else a life is lost
     S        skip him (the free skips first, then a Reroll for each one after)
     V        Reveal: the open tiles he fits light up (nothing else changes)
     W + a-t  a Wild Tile fills that open tile; the same player stays on the card
     B        Run It Back after the last life went: one more life, the next player
   A player who fits no open tile is passed over by the engine itself, never a move. */
(function (root) {
  'use strict';
  // [key, the tile's name] in the card's order: four across, five down
  var TILES = [
    ['broncos', 'Broncos'], ['bulldogs', 'Bulldogs'], ['cowboys', 'Cowboys'], ['dolphins', 'Dolphins'],
    ['dragons', 'Dragons'], ['eels', 'Eels'], ['knights', 'Knights'], ['panthers', 'Panthers'],
    ['rabbitohs', 'Rabbitohs'], ['raiders', 'Raiders'], ['roosters', 'Roosters'], ['seaeagles', 'Sea Eagles'],
    ['sharks', 'Sharks'], ['storm', 'Storm'], ['titans', 'Titans'], ['warriors', 'Warriors'],
    ['tigers', 'Wests Tigers'], ['origin', 'Origin'], ['aus', 'Kangaroos'], ['nzl', 'Kiwis']
  ];
  var N = TILES.length, LIVES = 3, SKIPS = 3, VERSION = 1, MAX_MOVES = 3000;
  var LETTERS = 'abcdefghijklmnopqrst';
  var INDEX = {}; TILES.forEach(function (t, i) { INDEX[t[0]] = i; });

  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = hash(seed); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // The Daily's seed: the same order for everyone on that Sydney date
  function dailySeed(date) { return 'daily:' + date; }

  /* The order the players come out in: every player once, drawn from the seed (a weighted shuffle: each gets a key from
     the seed, u ^ (1 / w), highest first; level keys go to the lower index) */
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
  // Every tile he played for (open or not)
  function tilesOf(players, p) { var out = []; for (var t = 0; t < N; t++) if (fits(players, p, t)) out.push(t); return out; }

  /* A board: grid[t] is -1 open, -2 a Wild Tile, else the player who filled it */
  function Board(players, seed) {
    this.P = players; this.seed = seed; this.order = order(players, seed); this.pos = 0;
    this.grid = []; for (var t = 0; t < N; t++) this.grid.push(-1);
    this.filled = 0; this.lives = LIVES; this.skips = 0; this.wrong = 0; this.ribs = 0; this.wilds = 0; this.reveals = 0;
    this.out = false; this.auto = 0; this.decisions = 0; this.moves = ''; this.revealed = -1;
  }
  Board.prototype.won = function () { return this.filled === N; };
  // Run out of players (never in practice: there are far more players than a card needs)
  Board.prototype.empty = function () { return this.pos >= this.order.length; };
  Board.prototype.over = function () { return this.won() || this.empty() || this.out; };
  Board.prototype.open = function (t) { return this.grid[t] === -1; };
  // The open tiles this player fits
  Board.prototype.openFits = function (p) { var out = []; for (var t = 0; t < N; t++) if (this.grid[t] === -1 && fits(this.P, p, t)) out.push(t); return out; };
  /* Pass over everyone who fits no open tile, up to the next player who does. The players passed over, in order (the
     site shows each one for a moment: "No open tile for him") */
  Board.prototype.settle = function () {
    var gone = [];
    if (this.won() || this.out) return gone;
    while (this.pos < this.order.length && !this.openFits(this.order[this.pos]).length) { gone.push(this.order[this.pos]); this.pos++; this.auto++; }
    return gone;
  };
  // The player on the card now (-1 when the board is over)
  Board.prototype.card = function () { this.settle(); return this.over() ? -1 : this.order[this.pos]; };
  Board.prototype.freeSkips = function () { return Math.max(0, SKIPS - this.skips); };
  Board.prototype.paidSkips = function () { return Math.max(0, this.skips - SKIPS); };
  Board.prototype.next = function () { this.pos++; this.revealed = -1; };

  // Tap tile t for the player on the card: { ok, right, p, t } or { ok: false, why }
  Board.prototype.tap = function (t) {
    var p = this.card();
    if (p < 0) return { ok: false, why: 'the board is over' };
    if (!(t >= 0 && t < N)) return { ok: false, why: 'no such tile' };
    if (!this.open(t)) return { ok: false, why: 'that tile is filled' };
    this.decisions++; this.moves += LETTERS[t];
    var right = fits(this.P, p, t);
    if (right) { this.grid[t] = p; this.filled++; }
    else { this.lives--; this.wrong++; if (this.lives <= 0) { this.lives = 0; this.out = true; } }
    this.next();
    return { ok: true, right: right, p: p, t: t };
  };
  // Skip the player on the card: { ok, paid } (paid: past the free skips, so a Reroll)
  Board.prototype.skip = function () {
    var p = this.card();
    if (p < 0) return { ok: false, why: 'the board is over' };
    this.decisions++; this.skips++; this.moves += 'S';
    this.next();
    return { ok: true, p: p, paid: this.skips > SKIPS };
  };
  // A Reveal on the player on the card: his open tiles
  Board.prototype.reveal = function () {
    var p = this.card();
    if (p < 0) return { ok: false, why: 'the board is over' };
    if (this.revealed === this.pos) return { ok: false, why: 'already revealed' };
    this.reveals++; this.moves += 'V'; this.revealed = this.pos;
    return { ok: true, p: p, tiles: this.openFits(p) };
  };
  // A Wild Tile on open tile t (the player on the card stays)
  Board.prototype.wild = function (t) {
    if (this.over()) return { ok: false, why: 'the board is over' };
    if (!(t >= 0 && t < N)) return { ok: false, why: 'no such tile' };
    if (!this.open(t)) return { ok: false, why: 'that tile is filled' };
    this.grid[t] = -2; this.filled++; this.wilds++; this.moves += 'W' + LETTERS[t];
    return { ok: true, t: t };
  };
  // Run It Back: only once the last life has gone
  Board.prototype.runItBack = function () {
    if (!this.out || this.won()) return { ok: false, why: 'Run It Back without losing the last life' };
    this.out = false; this.lives = 1; this.ribs++; this.moves += 'B';
    return { ok: true };
  };

  /* The whole board from its seed and moves: { ok, why, filled, won, lives, wrong, skips, paidSkips, ribs, wilds, reveals,
     decisions, grid, over }. The server's check (lib/bingo.js) and the site's own record */
  // The board its moves make: { ok, why, board } (the site picks a board up again this way after a reload)
  function build(players, seed, moves) {
    if (!Array.isArray(players) || !players.length) return { ok: false, why: 'players' };
    if (typeof seed !== 'string' || seed.length < 4 || seed.length > 40) return { ok: false, why: 'seed' };
    if (typeof moves !== 'string' || moves.length > MAX_MOVES || !/^(?:[a-tSVB]|W[a-t])*$/.test(moves)) return { ok: false, why: 'moves' };
    var b = new Board(players, seed);
    for (var k = 0; k < moves.length; k++) {
      var c = moves[k], r;
      if (b.won()) return { ok: false, why: 'a move after the Full House' };
      if (b.out && c !== 'B') return { ok: false, why: 'a move after the last life' };
      if (c === 'B') r = b.runItBack();
      else if (c === 'S') r = b.skip();
      else if (c === 'V') r = b.reveal();
      else if (c === 'W') { k++; r = b.wild(LETTERS.indexOf(moves[k])); }
      else r = b.tap(LETTERS.indexOf(c));
      if (!r.ok) return { ok: false, why: r.why };
    }
    if (!b.out && !b.won()) b.settle();
    return { ok: true, board: b };
  }
  function replay(players, seed, moves) {
    var x = build(players, seed, moves);
    if (!x.ok) return x;
    var b = x.board;
    return { ok: true, filled: b.filled, won: b.won(), lives: b.lives, wrong: b.wrong, skips: b.skips, paidSkips: b.paidSkips(), ribs: b.ribs,
      wilds: b.wilds, reveals: b.reveals, decisions: b.decisions, grid: b.grid.slice(), over: b.over(), out: b.out };
  }

  var api = { VERSION: VERSION, TILES: TILES, N: N, LIVES: LIVES, SKIPS: SKIPS, LETTERS: LETTERS, INDEX: INDEX, MAX_MOVES: MAX_MOVES,
    Board: Board, build: build, replay: replay, order: order, fits: fits, tilesOf: tilesOf, dailySeed: dailySeed, hash: hash };
  root.BINGO_ENGINE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
