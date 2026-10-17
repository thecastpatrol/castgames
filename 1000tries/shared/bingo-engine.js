/* NRL Bingo (17 Oct 2026, the owner's BUILD IT): a 4 x 6 card of 24 tiles, the 17 NRL clubs and seven representative
   sides: NSW Blues and QLD Maroons (State of Origin, each state its own tile), Australia, New Zealand, England (England and
   Great Britain Tests), Samoa and Tonga. One player at a time: tap a tile he played for and it fills. Fill all 24 for a
   Full House. Boards rank the tiles filled, then the time.

   The rules (VERSION 2, the owner, 17 Oct 2026, after playing it): pot luck. Players are dealt from the pool in the seed's
   order with no help towards the open tiles, so a player may fit none of them. There are no free skips: a skip is a Reroll
   (from the Vault or bought). A wrong tap costs one of 3 lives, and so does a player who fits no open tile when no Reroll
   is used on him. Run It Back (one more life after the last one), the Reveal and the Wild Tile stay.
   VERSION 1 (the first build, before 18 Oct 2026, only ever played hidden): a 4 x 5 card of 20 tiles (one Origin tile, the
   Kangaroos and the Kiwis), 3 free skips, and a player who fit no open tile was passed over by the engine. Kept so a card
   saved on those rules still replays exactly as it was played (on its own list, lib/bingo.js).

   One engine for the site (js/bingo.js) and the server (functions lib/bingo.js replays every board from its seed and its
   moves), so the order of players is fixed by the seed: the same seed and the same moves always give the same board.

   Data (data/bingo.json, tools/build_bingo.py): { v, players: [[name, position, first season, last season, tiles, w,
   teams?]] }. tiles: one bit per tile (TILES order). w: a whole number from 1 up, how often he turns up in the order.
   teams (only when he has some): the sides he played for that aren't a tile bit, for the reveal (the engine never reads it).

   Moves, one letter each (W takes two):
     a to x   tap that tile (TILES order) for the player on the card: it fills if he played there, else a life is lost
     S        skip him with a Reroll (version 1: the free skips first)
     N        he fits no open tile and no Reroll was used: a life is lost, the next player (version 2 only)
     V        Reveal: the open tiles he fits light up (nothing else changes)
     W + a-x  a Wild Tile fills that open tile; the same player stays on the card
     B        Run It Back after the last life went: one more life, the next player */
(function (root) {
  'use strict';
  // [key, the tile's name] in the card's order: four across, six down (version 1: five down)
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
  /* Each version's rules: its tiles, its free skips, and whether a player who fits no open tile is passed over by the
     engine. A list of players (data/bingo.json) is built for one version's tiles */
  var RULES = { 1: { tiles: TILES_1, skips: 3, auto: true }, 2: { tiles: TILES_2, skips: 0, auto: false } };
  var TILES = RULES[VERSION].tiles, N = TILES.length, SKIPS = RULES[VERSION].skips;
  var LETTERS = 'abcdefghijklmnopqrstuvwx';
  var INDEX = {}; TILES.forEach(function (t, i) { INDEX[t[0]] = i; });

  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = hash(seed); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // The seed the Daily Bingo used (it ran only before 18 Oct 2026, hidden): a card saved on it is checked against it
  function dailySeed(date) { return 'daily:' + date; }

  /* The order the players come out in: every player once, drawn from the seed (a weighted shuffle: each gets a key from
     the seed, u ^ (1 / w), highest first; level keys go to the lower index). Nothing in it looks at the card */
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
  // Every tile he played for (open or not), on this version's card
  function tilesOf(players, p, v) { var n = (RULES[v] || RULES[VERSION]).tiles.length, out = []; for (var t = 0; t < n; t++) if (fits(players, p, t)) out.push(t); return out; }

  /* A board: grid[t] is -1 open, -2 a Wild Tile, else the player who filled it. v: the rules it is played on */
  function Board(players, seed, v) {
    this.v = RULES[v] ? v : VERSION; this.R = RULES[this.v]; this.T = this.R.tiles; this.N = this.T.length;
    this.P = players; this.seed = seed; this.order = order(players, seed); this.pos = 0;
    this.grid = []; for (var t = 0; t < this.N; t++) this.grid.push(-1);
    this.filled = 0; this.lives = LIVES; this.skips = 0; this.wrong = 0; this.nofit = 0; this.ribs = 0; this.wilds = 0; this.reveals = 0;
    this.out = false; this.auto = 0; this.decisions = 0; this.moves = ''; this.revealed = -1;
  }
  Board.prototype.won = function () { return this.filled === this.N; };
  // Run out of players (never in practice: there are far more players than a card needs)
  Board.prototype.empty = function () { return this.pos >= this.order.length; };
  Board.prototype.over = function () { return this.won() || this.empty() || this.out; };
  Board.prototype.open = function (t) { return this.grid[t] === -1; };
  // The open tiles this player fits
  Board.prototype.openFits = function (p) { var out = []; for (var t = 0; t < this.N; t++) if (this.grid[t] === -1 && fits(this.P, p, t)) out.push(t); return out; };
  /* Version 1 only: pass over everyone who fits no open tile, up to the next player who does (the players passed over,
     in order). Version 2 deals every player as he comes, so this never moves the board on */
  Board.prototype.settle = function () {
    var gone = [];
    if (!this.R.auto || this.won() || this.out) return gone;
    while (this.pos < this.order.length && !this.openFits(this.order[this.pos]).length) { gone.push(this.order[this.pos]); this.pos++; this.auto++; }
    return gone;
  };
  // The player on the card now (-1 when the board is over)
  Board.prototype.card = function () { this.settle(); return this.over() ? -1 : this.order[this.pos]; };
  // The player on the card fits none of the open tiles (version 2: a Reroll, or he costs a life)
  Board.prototype.noFit = function () { var p = this.card(); return p >= 0 && !this.openFits(p).length; };
  Board.prototype.freeSkips = function () { return Math.max(0, this.R.skips - this.skips); };
  Board.prototype.paidSkips = function () { return Math.max(0, this.skips - this.R.skips); };
  Board.prototype.next = function () { this.pos++; this.revealed = -1; };
  Board.prototype.lose = function () { this.lives--; if (this.lives <= 0) { this.lives = 0; this.out = true; } };

  // Tap tile t for the player on the card: { ok, right, p, t } or { ok: false, why }
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
  // Skip the player on the card: { ok, paid } (paid: a Reroll; on version 2 every skip is one)
  Board.prototype.skip = function () {
    var p = this.card();
    if (p < 0) return { ok: false, why: 'the board is over' };
    this.decisions++; this.skips++; this.moves += 'S';
    this.next();
    return { ok: true, p: p, paid: this.skips > this.R.skips };
  };
  // He fits no open tile and no Reroll was used on him: a life, then the next player (version 2)
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
    if (!(t >= 0 && t < this.N)) return { ok: false, why: 'no such tile' };
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

  /* The board its moves make, on the rules of version v (VERSION when left out): { ok, why, board }. The site picks a
     board up again this way after a reload; replay() is the server's check */
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
  /* The whole board from its seed and moves: { ok, why, v, filled, won, lives, wrong, nofit, skips, paidSkips, ribs, wilds,
     reveals, decisions, grid, over, out } */
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
