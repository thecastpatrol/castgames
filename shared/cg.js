/* CAST Games (castgames.com.au, 15 Oct 2026, the owner: every game under one address, picked by sport, then game).

   CG.SPORTS and CG.GAMES are the one list of what's on the site: a new game or a new sport is one more entry here, and
   the home page, the game switcher and the bar all follow. status: 'live' (shown), 'soon' (a Coming Soon tile on the
   home page), 'hidden' (nowhere). A game with launch: shows once that key is in config/launch (CastAccount.launched)
   or the device has its preview switch on.

   The bar (one for the home page and every game, the owner's call: "consistent tab at the top"): the cast logo (home),
   the game switcher, the account button (js/cast-account.js fills any [data-cast-account]), then the tabs Play, Stats,
   Boards, Friends and Shop. Inside a game it hides the game's own header (CG_GAME_HIDE in the page) and Play goes back to
   that game's home, or its New Game when a game is under way. */
(function () {
  'use strict';
  var ROOT = (function () {
    // The site's root from this script's own address (/shared/cg.js), so pages at any depth link back correctly
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/shared\/cg\.js.*$/, '') : '/';
  })();

  /* Sports in the owner's order, one colour each, used everywhere (17 Oct 2026, the owner: chips, rows, cards, sport pages,
     leaderboard tabs and the 3px line under the bar on game pages). c: the colour as r,g,b; hex; ink: text on it */
  var SPORTS = [
    { id: 'nrl', name: 'NRL', ico: '&#x1F3C9;', long: 'Rugby League', c: '21,128,61', hex: '#15803D', ink: '#ffffff', status: 'live', path: 'nrl/' }, // path: its See All page
    { id: 'afl', name: 'AFL', ico: '&#x1F3C9;', long: 'Aussie Rules', c: '220,38,38', hex: '#DC2626', ink: '#ffffff', status: 'live', path: 'afl/' },
    { id: 'cricket', name: 'Cricket', ico: '&#x1F3CF;', long: 'Test and Big Bash', c: '255,213,0', hex: '#FFD500', ink: '#1a1400', status: 'live', path: 'cricket/' },
    { id: 'racing', name: 'Horse Racing', chip: 'Racing', ico: '&#x1F3C7;', long: 'Group 1 Jockeys', c: '20,83,45', hex: '#14532D', ink: '#ffffff', status: 'live', path: 'racing/' },
    { id: 'epl', name: 'Premier League', chip: 'EPL', ico: '&#x26BD;', long: 'English Football', c: '76,29,149', hex: '#4C1D95', ink: '#ffffff', status: 'live', path: 'epl/' },
    { id: 'nfl', name: 'NFL', ico: '&#x1F3C8;', long: 'American Football', c: '37,99,235', hex: '#2563EB', ink: '#ffffff', status: 'live', path: 'nfl/' },
    { id: 'nba', name: 'NBA', ico: '&#x1F3C0;', long: 'Basketball', c: '249,115,22', hex: '#F97316', ink: '#1f0d02', status: 'soon', path: 'nba/' }
  ];
  /* Every card is one game a player can play (17 Oct 2026, the owner: "a box of games"): each mode of each game has its
     own card and its own page that opens straight into play (tools/build.py makes the pages from this list's path,
     folder and mode). id: the page (window.CG_GAME); folder: the game's copy here; mode: what the page plays (?play=);
     tag: the mode's words on a card that shares its game's logo; of: the spots in a team (Continue: 7 of 13); draft: the
     saved draft's key on this site; board: its main leaderboard (the weekly #1 and Most Popular); daily: the game's
     Daily Challenge lives on this card's game. status: 'live', 'soon' (a Coming Soon card) or 'hidden'. launch: shown
     once that key is launched (or previewed). */
  var L = 'assets/logos/';
  var GAMES = [
    // NRL
    { id: '1000tries', sport: 'nrl', name: '1000TRIES', path: '1000tries/', folder: '1000tries', mode: 'plus', logo: L + '1000tries.png', status: 'live',
      line: 'Draft 13 to 1000 tries', long: 'Draft 13 NRL players with their tries hidden and reach 1000 career tries.', of: 13, draft: '1000tries_draft_v1', board: '1000plus', daily: true, stats: '1000tries' },
    { id: '27-0', sport: 'nrl', name: '27-0 CLASSIC', pill: '27-0 CLASSIC', path: '27-0/', folder: '27-0', mode: 'classic', logo: L + '27-0.png', status: 'live',
      line: 'Build a 13, go undefeated', long: 'Spin a club and season, draft a 13 from any NRL season since 1998 and go undefeated.', of: 13, draft: '270_draft_v1', board: '270best', daily: true, stats: '27-0' },
    { id: '1000tries-exactly', sport: 'nrl', name: '1000TRIES EXACTLY', path: '1000tries-exactly/', folder: '1000tries', mode: 'exact', logo: L + '1000tries.png', tag: 'Exactly 1000', status: 'live',
      line: 'Land on 1000 tries exactly', long: 'Draft 13 NRL players and land on exactly 1000 career tries. Under or over and you miss.', of: 13, draft: '1000tries_draft_v1_exact', board: '1000exact' },
    { id: '27-0-pack', sport: 'nrl', name: '27-0 PACK MODE', path: '27-0-pack/', folder: '27-0', mode: 'pack', logo: L + '27-0.png', tag: 'Pack Mode', status: 'live',
      line: 'Rip open 7 packs, go 27-0', long: 'Rip open 7 packs of NRL players, build your 13 and go undefeated.', of: 13, draft: '270_draft_v1_pack', board: '270pack' },
    { id: '1000tries-team-spin', sport: 'nrl', name: '1000TRIES TEAM SPIN', pill: 'TEAM SPIN', path: '1000tries-team-spin/', folder: '1000tries', mode: 'spin', logo: L + '1000tries.png', tag: 'Team Spin', status: 'live',
      line: 'Spin a club and season, pick 1', long: 'Choose a position, spin a club and season, and pick from that squad. Reach 1000 tries.', of: 13, draft: '1000tries_draft_v1_spin', board: '1000spin' },
    { id: '27-0-hard', sport: 'nrl', name: '27-0 HARD', path: '27-0-hard/', folder: '27-0', mode: 'hard', logo: L + '27-0.png', tag: 'Hard', status: 'live',
      line: 'No ratings, paid wildcards', long: 'Classic 27-0 with the ratings hidden and paid wildcards only. Can you still go undefeated?', of: 13, draft: '270_draft_v1_hard', board: '270hard' },
    { id: 'nrlw-250', sport: 'nrl', name: 'NRLW 250+', path: 'nrlw-250/', folder: '1000tries', mode: 'nrlw', logo: L + 'nrlw-250.png', status: 'live',
      line: 'Draft 13 NRLW stars to 250 tries', long: 'Draft 13 NRLW players with their tries hidden and reach 250 NRLW tries.', of: 13, draft: '1000tries_draft_v1_nrlw', board: 'nrlw' },
    // World Cup 8-0 and World Cup 200+ (17 Oct 2026, the owner: their own games, under NRL, while the World Cup is on)
    { id: 'world-cup-8-0', sport: 'nrl', name: 'WORLD CUP 8-0', path: 'world-cup-8-0/', folder: '27-0', mode: 'wc', logo: L + 'world-cup-8-0.png', status: 'live', launch: 'wc', badge: 'World Cup',
      line: 'Spin a nation, win all eight', long: 'Spin a nation, draft from its 2026 World Cup squad, then win all eight games.', board: '270wc', wcRun: true },
    { id: 'world-cup-200', sport: 'nrl', name: 'WORLD CUP 200+', path: 'world-cup-200/', folder: '1000tries', mode: 'wc', logo: L + 'world-cup-200.png', status: 'live', launch: 'wc', badge: 'World Cup',
      line: 'Draft Test greats to 200 tries', long: 'Draft 13 Test players since 1980 and the greats before them, and reach 200 Test tries.', of: 13, draft: '1000tries_draft_v1_wc', board: '1000wc' },
    { id: 'higher-or-lower-nrl', sport: 'nrl', name: 'HIGHER OR LOWER: NRL', pill: '&#x25B2;&#x25BC; NRL', path: 'higher-or-lower-nrl/', folder: '1000tries', mode: 'ou', logo: '', mark: '&#x25B2;&#x25BC;', status: 'live', launch: 'ou', ou: true,
      line: 'Career tries, vs the clock', long: 'Higher or lower? Call NRL players’ career tries before the clock runs out.', board: '1000ou' },
    // NRL Bingo (17 Oct 2026): a Coming Soon card until the owner's Launch ('bingo') or on a device that opened his private
    // link; its Daily's link is ?play=bingo-daily (dplay)
    { id: 'nrl-bingo', sport: 'nrl', name: 'NRL BINGO', path: 'nrl-bingo/', folder: '1000tries', mode: 'bingo', logo: '', mark: '&#x2705;', status: 'live', launch: 'bingo',
      line: 'Tap his clubs, fill the card', long: 'A player comes up: tap a club he played for. Fill all 20 tiles of the card for a Full House.', board: 'bgfree', daily: true, dplay: 'bingo-daily' },
    { id: 'sc', sport: 'nrl', name: 'SC', path: '', logo: '', mark: '&#x1F4C8;', status: 'soon', line: 'Spin 3 seasons, top the SC points' },
    // AFL
    { id: '4000goals', sport: 'afl', name: '4000 GOALS', path: '4000goals/', folder: '4000goals', mode: 'plus', logo: L + '4000goals.png', status: 'live',
      line: 'Draft 18 to 4000 goals', long: 'Draft an AFL 18 with their goals hidden and reach 4000 career goals.', of: 18, draft: '4000goals_draft_v1', board: '4000plus', daily: true, stats: '4000goals' },
    { id: '4000goals-exactly', sport: 'afl', name: '4000 GOALS EXACTLY', path: '4000goals-exactly/', folder: '4000goals', mode: 'exact', logo: L + '4000goals.png', tag: 'Exactly 4000', status: 'live',
      line: 'Land on 4000 goals exactly', long: 'Draft an AFL 18 and land on exactly 4000 career goals.', of: 18, draft: '4000goals_draft_v1_exact', board: '4000exact' },
    { id: '4000goals-team-spin', sport: 'afl', name: '4000 GOALS TEAM SPIN', pill: 'TEAM SPIN', path: '4000goals-team-spin/', folder: '4000goals', mode: 'spin', logo: L + '4000goals.png', tag: 'Team Spin', status: 'live',
      line: 'Spin a club and season, pick 1', long: 'Choose a position, spin a club and season, and pick from that squad. Reach 4000 goals.', of: 18, draft: '4000goals_draft_v1_spin', board: '4000spin' },
    { id: 'aflw-750', sport: 'afl', name: 'AFLW 750+', path: 'aflw-750/', folder: '4000goals', mode: 'nrlw', logo: L + 'aflw-750.png', status: 'live',
      line: 'Draft 18 AFLW stars to 750 goals', long: 'Draft an AFLW 18 with their goals hidden and reach 750 AFLW goals.', of: 18, draft: '4000goals_draft_v1_nrlw', board: 'aflw' },
    { id: 'higher-or-lower-afl', sport: 'afl', name: 'HIGHER OR LOWER: AFL', pill: '&#x25B2;&#x25BC; AFL', path: 'higher-or-lower-afl/', folder: '4000goals', mode: 'ou', logo: '', mark: '&#x25B2;&#x25BC;', status: 'live', launch: 'po', ou: true,
      line: 'Career goals, vs the clock', long: 'Higher or lower? Call AFL players’ career goals before the clock runs out.', board: '4000ou' },
    // Cricket
    { id: '60000runs', comp: 'Test Cricket', sport: 'cricket', name: '60000 RUNS', path: '60000runs/', folder: '60000runs', mode: 'plus', logo: L + '60000runs.png', status: 'live',
      line: 'Test XI to 60000 runs', long: 'Draft a Test XI from every Test since 1877 with their runs hidden and reach 60000 Test runs.', of: 11, draft: '60000runs_draft_v1', board: 'tsplus', daily: true },
    { id: '25000runs', comp: 'Big Bash', sport: 'cricket', name: '25000 RUNS', path: '25000runs/', folder: '25000runs', mode: 'plus', logo: L + '25000runs.png', status: 'live',
      line: 'Big Bash XI to 25000 runs', long: 'Draft a Big Bash XI with their BBL runs hidden and reach 25000 BBL runs.', of: 11, draft: '25000runs_draft_v1', board: 'bbplus', daily: true },
    { id: 'higher-or-lower-cricket', sport: 'cricket', name: 'HIGHER OR LOWER: CRICKET', pill: '&#x25B2;&#x25BC; CRICKET', path: 'higher-or-lower-cricket/', folder: '25000runs', mode: 'ou', logo: '', mark: '&#x25B2;&#x25BC;', status: 'live', ou: true,
      line: 'Test and BBL numbers, vs the clock', long: 'Higher or lower? Call Test and Big Bash runs and wickets before the clock runs out.', board: 'bbou' },
    { id: '60000runs-exactly', comp: 'Test Cricket', sport: 'cricket', name: '60000 RUNS EXACTLY', path: '60000runs-exactly/', folder: '60000runs', mode: 'exact', logo: L + '60000runs.png', tag: 'Exactly 60000', status: 'live',
      line: 'Land on 60000 Test runs exactly', long: 'Draft a Test XI and land on exactly 60000 Test runs.', of: 11, draft: '60000runs_draft_v1_exact', board: 'tsexact' },
    { id: '25000runs-exactly', comp: 'Big Bash', sport: 'cricket', name: '25000 RUNS EXACTLY', path: '25000runs-exactly/', folder: '25000runs', mode: 'exact', logo: L + '25000runs.png', tag: 'Exactly 25000', status: 'live',
      line: 'Land on 25000 BBL runs exactly', long: 'Draft a Big Bash XI and land on exactly 25000 BBL runs.', of: 11, draft: '25000runs_draft_v1_exact', board: 'bbexact' },
    { id: '60000runs-team-spin', comp: 'Test Cricket', sport: 'cricket', name: '60000 RUNS TEAM SPIN', pill: 'TEAM SPIN', path: '60000runs-team-spin/', folder: '60000runs', mode: 'spin', logo: L + '60000runs.png', tag: 'Team Spin', status: 'live',
      line: 'Spin a nation and season, pick 1', long: 'Choose a position, spin a Test nation and season, and pick from that squad. Reach 60000 runs.', of: 11, draft: '60000runs_draft_v1_spin', board: 'tsspin' },
    { id: '25000runs-team-spin', comp: 'Big Bash', sport: 'cricket', name: '25000 RUNS TEAM SPIN', pill: 'TEAM SPIN', path: '25000runs-team-spin/', folder: '25000runs', mode: 'spin', logo: L + '25000runs.png', tag: 'Team Spin', status: 'live',
      line: 'Spin a club and season, pick 1', long: 'Choose a position, spin a BBL club and season, and pick from that squad. Reach 25000 runs.', of: 11, draft: '25000runs_draft_v1_spin', board: 'bbspin' },
    // Horse Racing
    { id: 'g1winner', sport: 'racing', name: 'G1 WINNER SPINNER', pill: 'G1 WINNER', path: 'g1winner/', folder: 'g1winner', mode: 'plus', logo: L + 'g1winner.png', status: 'live',
      line: '8 jockeys to 550 Group 1s', long: 'Draft 8 jockeys for a Group 1 card with their wins hidden and reach 550 Group 1 wins.', of: 8, draft: 'racing_draft_v1', board: 'rcplus', daily: true },
    { id: 'g1winner-exactly', sport: 'racing', name: 'G1 WINNER SPINNER EXACTLY', pill: 'G1 EXACTLY', path: 'g1winner-exactly/', folder: 'g1winner', mode: 'exact', logo: L + 'g1winner.png', tag: 'Exactly 550', status: 'live',
      line: 'Land on 550 Group 1s exactly', long: 'Draft 8 jockeys and land on exactly 550 Group 1 wins.', of: 8, draft: 'racing_draft_v1_exact', board: 'rcexact' },
    { id: 'higher-or-lower-racing', sport: 'racing', name: 'HIGHER OR LOWER: RACING', pill: '&#x25B2;&#x25BC; RACING', path: 'higher-or-lower-racing/', folder: 'g1winner', mode: 'ou', logo: '', mark: '&#x25B2;&#x25BC;', status: 'live', ou: true,
      line: 'Jockeys, races and horses', long: 'Higher or lower? Call jockeys, big races and horses before the clock runs out.', board: 'rcou' },
    // Premier League
    { id: '650goals', sport: 'epl', name: '650 GOALS', path: '650goals/', folder: '650goals', mode: 'plus', logo: L + '650goals.png', status: 'live',
      line: 'An XI to 650 PL goals', long: 'Draft a Premier League XI with their goals hidden and reach 650 career goals.', of: 11, draft: '500goals_draft_v1', board: 'eplplus', daily: true },
    { id: '650goals-exactly', sport: 'epl', name: '650 GOALS EXACTLY', path: '650goals-exactly/', folder: '650goals', mode: 'exact', logo: L + '650goals.png', tag: 'Exactly 650', status: 'live',
      line: 'Land on 650 PL goals exactly', long: 'Draft a Premier League XI and land on exactly 650 career goals.', of: 11, draft: '500goals_draft_v1_exact', board: 'eplexact' },
    { id: '650goals-team-spin', sport: 'epl', name: '650 GOALS TEAM SPIN', pill: 'TEAM SPIN', path: '650goals-team-spin/', folder: '650goals', mode: 'spin', logo: L + '650goals.png', tag: 'Team Spin', status: 'live',
      line: 'Spin a club and season, pick 1', long: 'Choose a position, spin a Premier League club and season, and pick from that squad. Reach 650 goals.', of: 11, draft: '500goals_draft_v1_spin', board: 'eplspin' },
    { id: 'higher-or-lower-premier-league', sport: 'epl', name: 'HIGHER OR LOWER: PREMIER LEAGUE', pill: '&#x25B2;&#x25BC; EPL', path: 'higher-or-lower-premier-league/', folder: '650goals', mode: 'ou', logo: '', mark: '&#x25B2;&#x25BC;', status: 'live', ou: true,
      line: 'Goals, assists and games', long: 'Higher or lower? Call Premier League goals, assists and appearances before the clock runs out.', board: 'eplou' },
    // NFL
    { id: '777tds', sport: 'nfl', name: '777 TDS', path: '777tds/', folder: '777tds', mode: 'plus', logo: L + '777tds.png', status: 'live',
      line: '10 players to 777 TDs', long: 'Draft an NFL offence with their touchdowns hidden and reach 777 career touchdowns.', of: 10, draft: '700tds_draft_v1', board: 'nflplus', daily: true },
    { id: '777tds-exactly', sport: 'nfl', name: '777 TDS EXACTLY', path: '777tds-exactly/', folder: '777tds', mode: 'exact', logo: L + '777tds.png', tag: 'Exactly 777', status: 'live',
      line: 'Land on 777 TDs exactly', long: 'Draft an NFL offence and land on exactly 777 career touchdowns.', of: 10, draft: '700tds_draft_v1_exact', board: 'nflexact' },
    { id: '777tds-team-spin', sport: 'nfl', name: '777 TDS TEAM SPIN', pill: 'TEAM SPIN', path: '777tds-team-spin/', folder: '777tds', mode: 'spin', logo: L + '777tds.png', tag: 'Team Spin', status: 'live',
      line: 'Spin a team and season, pick 1', long: 'Choose a position, spin an NFL team and season, and pick from that roster. Reach 777 touchdowns.', of: 10, draft: '700tds_draft_v1_spin', board: 'nflspin' },
    { id: 'higher-or-lower-nfl', sport: 'nfl', name: 'HIGHER OR LOWER: NFL', pill: '&#x25B2;&#x25BC; NFL', path: 'higher-or-lower-nfl/', folder: '777tds', mode: 'ou', logo: '', mark: '&#x25B2;&#x25BC;', status: 'live', ou: true,
      line: 'Career touchdowns, vs the clock', long: 'Higher or lower? Call NFL players’ career touchdowns before the clock runs out.', board: 'nflou' },
    // NBA (17 Oct 2026: built, not on the site yet)
    { id: '100000points', sport: 'nba', name: '100000 POINTS', path: '', logo: L + '100000points.png', status: 'soon', line: 'A starting five to 100000' },
    { id: 'higher-or-lower-nba', sport: 'nba', name: 'HIGHER OR LOWER: NBA', path: '', logo: '', mark: '&#x25B2;&#x25BC;', status: 'soon', ou: true, line: 'Points, rebounds and assists' }
  ];
  // Each card's colours are its sport's (the owner: "sport colour background")
  GAMES.forEach(function (g) {
    var sp = SPORTS.filter(function (x) { return x.id === g.sport; })[0];
    g.c1 = sp ? sp.hex : '#141420'; g.ink = sp ? sp.ink : '#ffffff'; g.sc = sp ? sp.c : '255,255,255';
  });

  /* The home page's Most Popular, before real weekly plays are known (js/home.js asks the boards): the main ones first */
  var POPULAR = ['1000tries', '27-0', '4000goals', 'higher-or-lower-nrl', '60000runs', '25000runs', '777tds', '650goals', 'g1winner', 'world-cup-8-0', 'world-cup-200'];

  function acct() { return window.CastAccount || null; }
  function launched(key) {
    if (!key) return true;
    var A = acct();
    try { if (A && A.isLaunched && A.isLaunched(key)) return true; } catch (e) { /* not ready */ }
    if (key === 'ou' && A && A.ouOn) { try { return !!A.ouOn(); } catch (e) { return false; } }
    if (key === 'po' && A && A.poOn) { try { return !!A.poOn(); } catch (e) { return false; } }
    if (key === 'bingo' && A && A.bingoOn) { try { return !!A.bingoOn(); } catch (e) { return false; } }
    if (key === 'wc' && A && A.wcLive) { try { return !!A.wcLive(); } catch (e) { return false; } } // the World Cup, while it's on
    return false;
  }
  // The games a player sees right now
  function liveGames() { return GAMES.filter(function (g) { return g.status === 'live' && launched(g.launch); }); }
  // Live games, most popular first (POPULAR, then the rest in list order); n: how many
  function popular(n, sport) {
    var rank = function (g) { var i = POPULAR.indexOf(g.id); return i < 0 ? 99 : i; };
    var list = liveGames().filter(function (g) { return !sport || g.sport === sport; })
      .map(function (g, i) { return [rank(g), i, g]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }).map(function (x) { return x[2]; });
    return n ? list.slice(0, n) : list;
  }
  function sportOf(id) { for (var i = 0; i < SPORTS.length; i++) if (SPORTS[i].id === id) return SPORTS[i]; return null; }
  function game(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; return null; }
  // The card that plays a game folder's mode (cast:play events and ?play= links land on the mode's own page)
  function forMode(folder, mode) {
    for (var i = 0; i < GAMES.length; i++) { var g = GAMES[i]; if (g.status !== 'soon' && g.folder === folder && g.mode === mode) return g; }
    return null;
  }
  /* A game in progress on this device for a card (the owner: "Continue" on its own card): { picks, of, at } or null.
     A saved draft (each mode its own since 17 Oct 2026), or World Cup 8-0's saved run (signed in, 7 days) */
  function lsJson(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function continueOf(g) {
    if (!g) return null;
    var A = acct(), uid = '', now = Date.now();
    try { uid = A && A.uid ? A.uid() || '' : ''; } catch (e) { uid = ''; }
    if (g.wcRun) {
      var r = lsJson('wc_run_v1');
      if (!r || r.v !== 1 || !r.t || !r.t.run || !uid || r.uid !== uid || !(now - (r.at || 0) < 7 * 864e5)) return null;
      return { at: r.at, label: 'Continue: Game ' + Math.min(8, (r.t.shown || 0) + 1) + ' of 8' };
    }
    if (!g.draft) return null;
    var d = lsJson(g.draft);
    if (!d || d.v !== 1 || !(now - (d.at || 0) < 24 * 3600000) || (d.who && d.who !== 'guest' && d.who !== uid)) return null;
    var m = d.mode || d.sel || (g.folder === '27-0' ? 'classic' : 'plus');
    if (m !== g.mode) return null; // a draft kept under the first key before each mode had its own: shown on its own mode's card
    return { at: d.at, picks: d.picks || 0, of: g.of || 0, label: g.folder === '27-0' && g.mode === 'pack' ? 'Continue Your Packs' : 'Continue: ' + (d.picks || 0) + ' of ' + (g.of || 13) };
  }
  // Every card with a game in progress, newest first
  function inProgress() {
    return GAMES.map(function (g) { var c = g.status === 'live' && launched(g.launch) ? continueOf(g) : null; return c ? { g: g, c: c } : null; })
      .filter(Boolean).sort(function (a, b) { return b.c.at - a.c.at; });
  }
  function url(path) { return ROOT + path; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  /* ---------- The bar ---------- */
  var HERE = window.CG_GAME || ''; // the game this page is ('' on the home page)
  function currentGame() { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === HERE) return GAMES[i]; return null; }
  var TABS = [
    ['play', '&#x1F3AE;', 'Play'], ['stats', '&#x1F4CA;', 'Stats'], ['boards', '&#x1F3C6;', 'Boards'],
    ['friends', '&#x1F465;', 'Friends'], ['shop', '&#x1F6D2;', 'Shop'] // the cart, the same as the games' Shop and Vault
  ];
  function bar() {
    var g = currentGame();
    var el = document.createElement('div');
    el.className = 'cg-bar';
    el.innerHTML = '<div class="cg-in">' +
      '<a class="cg-logo" href="' + url('') + '" aria-label="CAST Games home"><img src="' + url('assets/logos/castgames.png') + '" alt="CAST Games" width="300" height="150"></a>' +
      '<button type="button" class="cg-game" data-cg="switch" aria-haspopup="dialog">' + (g ? g.pill || esc(g.name) : 'All Games') + ' <i aria-hidden="true">&#x25BE;</i></button>' +
      '<nav class="cg-tabs" aria-label="CAST Games">' + TABS.map(function (t) {
        return '<button type="button" class="cg-tab' + (t[0] === 'play' ? ' is-on' : '') + '" data-cg="' + t[0] + '"><i aria-hidden="true">' + t[1] + '</i><span>' + t[2] + '</span></button>';
      }).join('') + '</nav>' +
      '<span class="cg-sp"></span>' +
      '<span class="cg-right"><button type="button" class="cg-new" data-cg="new" hidden><i aria-hidden="true">&#x2699;&#xFE0F;</i><span>New Game</span></button><span class="cg-acct"><button type="button" data-cast-friends aria-label="Friends" hidden></button><button type="button" data-cast-account aria-label="Sign in to save your history"></button></span></span>' +
      '</div>';
    document.body.insertBefore(el, document.body.firstChild);
    document.documentElement.classList.add('cg-on');
    if (HERE) document.documentElement.classList.add('cg-in-game', 'cg-g-' + HERE);
    // The sport's colour as a 3px line under the bar, on its game pages and its sport page (17 Oct 2026, the owner)
    var sp = sportOf((g && g.sport) || window.CG_SPORT || '');
    if (sp) { document.documentElement.style.setProperty('--cg-sport', sp.hex); document.documentElement.style.setProperty('--cg-sport-rgb', sp.c); document.documentElement.classList.add('cg-has-sport'); }
    el.addEventListener('click', onBar);
    // The game's own sticky parts (the scoreboard, the desktop offer panel) sit under this bar, not behind it (16 Oct 2026):
    // its height, measured, as --cg-bar-h for cg.css
    var barH = function () { document.documentElement.style.setProperty('--cg-bar-h', el.offsetHeight + 'px'); };
    barH(); window.addEventListener('resize', barH); window.addEventListener('load', barH);
    var A = acct(); if (A && A.refresh) { try { A.refresh(); } catch (e) { /* later */ } }
    if (HERE) midGame(el);
  }
  /* Mid-game a New Game button at the top right, next to the profile, where 1000TRIES has its own (17 Oct 2026, the
     owner: on castgames there was no button mid-game for a new game or another mode). It opens the game's own pop-up
     (Play Again, Change Mode or Keep Playing) */
  function midGame(el) {
    var btn = el.querySelector('.cg-new'), was = null, queued = false;
    if (!btn) return;
    var check = function () {
      queued = false;
      var hook = window.CG_PLAY, mid = false;
      try { mid = typeof hook === 'function' && hook(true) === true; } catch (e) { mid = false; }
      if (mid === was) return;
      was = mid;
      btn.hidden = !mid;
    };
    var soon = function () { if (!queued) { queued = true; setTimeout(check, 60); } };
    new MutationObserver(soon).observe(document.body, { attributes: true, attributeFilter: ['data-screen', 'class'], subtree: true });
    check();
  }
  function onBar(e) {
    var b = e.target.closest('[data-cg]');
    if (!b) return;
    var a = b.getAttribute('data-cg'), A = acct();
    track('cg_tab', { tab: a, game: HERE || 'home' });
    if (a === 'switch') { openSwitcher(); return; }
    if (a === 'play') { play(); return; }
    if (a === 'new') { var nh = window.CG_PLAY; try { if (typeof nh === 'function') nh(); } catch (err) { /* the game's own */ } return; }
    // A game whose accounts open at its launch (25000 RUNS before the owner's Launch, 16 Oct 2026: the tabs did nothing)
    if (!A || !acctOn()) { note((currentGame() ? currentGame().name : 'CAST Games') + ' stats, boards, friends and the Shop open when it launches. Play as a guest for now.'); return; }
    if (a === 'stats') A.openProfile ? A.openProfile('stats') : A.open('stats');
    else if (a === 'boards') A.openBoards(null);
    else if (a === 'friends') A.openFriends ? A.openFriends() : A.open('friends');
    else if (a === 'shop') A.openShop ? A.openShop() : A.open('shop');
  }
  // Accounts are on for this page: the page's own setting, or its game launched since (CastAccount.launched)
  function acctOn() {
    var c = window.CAST_ACCOUNT, A = acct();
    if (!c) return !!A;
    try { return c.enabled !== false || !!(A && A.launched && A.launched()); } catch (e) { return false; }
  }
  // A short note under the bar (gone after 4 s, or on the next tap)
  var noteEl = null, noteT = 0;
  function note(msg) {
    if (!noteEl) { noteEl = document.createElement('div'); noteEl.className = 'cg-note'; noteEl.setAttribute('role', 'status'); document.body.appendChild(noteEl); }
    noteEl.textContent = msg; noteEl.hidden = false; clearTimeout(noteT);
    noteT = setTimeout(function () { noteEl.hidden = true; }, 4000);
  }
  // The account button on the right waits for the game's launch too (it showed an empty dash)
  function acctShow() { var s = document.querySelector('.cg-acct'); if (s) s.hidden = !acctOn(); }
  setTimeout(acctShow, 1500); setTimeout(acctShow, 6000); window.addEventListener('cast-account', acctShow);
  // Play: on the home page, the top; in a game, its New Game when a game is under way, else that game's home
  function play() {
    if (!HERE) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var hook = window.CG_PLAY;
    if (typeof hook === 'function') { try { if (hook() !== false) return; } catch (e) { /* the page's own */ } }
    location.href = url(currentGame().path);
  }

  /* ---------- The game switcher: sport chips, then that sport's games ---------- */
  /* One sport at a time (16 Oct 2026, the owner: with a lot of games the list was very long, and no sideways scrolling on
     phones): the chips wrap onto a second row rather than scroll, it opens on the sport you're in (on the home page the
     last one picked), and a tap on a chip swaps the list below without closing */
  var sheet = null, swSport = '';
  function swSports(live) { return SPORTS.filter(function (s) { return s.status === 'live' && live.some(function (g) { return g.sport === s.id; }); }); }
  function swDraw() {
    var live = liveGames(), sps = swSports(live);
    if (!sps.some(function (s) { return s.id === swSport; })) swSport = sps.length ? sps[0].id : '';
    var sp = sportOf(swSport), gs = live.filter(function (g) { return g.sport === swSport; });
    sheet.innerHTML = '<div class="cg-sheet-box is-sw"><button type="button" class="cg-x" data-cg-x aria-label="Close">&#x2715;</button>' +
      '<a class="cg-home-link" href="' + url('') + '">&#x1F3E0; All Games</a>' +
      '<div class="cg-sw-chips" role="tablist" aria-label="Sports">' + sps.map(function (s) {
        return '<button type="button" role="tab" class="cg-sw-chip' + (s.id === swSport ? ' is-on' : '') + '" aria-selected="' + (s.id === swSport) + '" data-cg-sport="' + s.id + '" style="--sc:' + s.c + '">' +
          '<span aria-hidden="true">' + (s.ico || '') + '</span><b>' + esc(s.chip || s.name) + '</b></button>';
      }).join('') + '</div>' +
      (sp ? '<div class="cg-sp-h" style="--sc:' + sp.c + '"><b>' + esc(sp.name) + '</b><small>' + esc(sp.long) + '</small></div>' : '') +
      '<div class="cg-sw-list"><div class="cg-sp-list">' + gs.map(function (g) {
        var c = continueOf(g);
        return '<a class="cg-sp-game' + (g.id === HERE ? ' is-on' : '') + '" href="' + url(g.path) + '" style="--c1:' + g.c1 + ';--ink:' + g.ink + '">' +
          (g.logo ? '<img src="' + url(g.logo) + '" alt="">' : '<span class="cg-mark">' + g.mark + '</span>') + '<span><b>' + esc(g.name) + '</b><small>' + (c ? esc(c.label) : esc(g.line)) + '</small></span></a>';
      }).join('') + '</div></div></div>';
  }
  function openSwitcher() {
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'cg-sheet';
      sheet.hidden = true;
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-label', 'Pick a game');
      document.body.appendChild(sheet);
      sheet.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-cg-sport]');
        if (chip) { swSport = chip.getAttribute('data-cg-sport'); try { localStorage.setItem('cg_sw_sport', swSport); } catch (x) { /* storage blocked */ } swDraw(); return; }
        if (e.target === sheet || e.target.closest('[data-cg-x]')) shut();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    }
    var g = currentGame(), last = '';
    try { last = localStorage.getItem('cg_sw_sport') || ''; } catch (x) { /* storage blocked */ }
    swSport = (g && g.sport) || window.CG_SPORT || last;
    swDraw();
    sheet.hidden = false;
    document.documentElement.classList.add('cg-sheet-open');
  }
  function shut() { if (sheet && !sheet.hidden) { sheet.hidden = true; document.documentElement.classList.remove('cg-sheet-open'); } }

  function track(ev, p) { try { if (typeof gtag === 'function') gtag('event', ev, p || {}); } catch (e) { /* no analytics */ } }

  /* A link to another game on this site opens in the same tab, even one a game made with a new tab in mind; one to a
     game's folder with ?play=<mode> goes to that mode's own page (17 Oct 2026: every mode is its own game) */
  function ours(u) { return u.host === location.host || u.host === 'castgames.com.au' || u.host === 'www.castgames.com.au'; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (!ours(u)) return;
    if (a.target === '_blank') a.removeAttribute('target');
    var f = /^\/([\w-]+)\/(?:index\.html)?$/.exec(u.pathname), pm = /[?&]play=([a-z]+)/.exec(u.search);
    var g = f && pm && pm[1] !== 'daily' ? forMode(f[1], pm[1]) : null;
    if (g && g.path) a.href = url(g.path) + (u.search.replace(/([?&])play=[^&#]*&?/, '$1').replace(/[?&]$/, '')) + u.hash;
  }, true);
  /* The leaderboards' Play for another mode (cast:play from the account): that mode's own page, not this page playing it.
     Heard before the game hears it (this script runs first) */
  window.addEventListener('cast:play', function (e) {
    var d = e.detail || {}, here = currentGame();
    if (!here || !here.folder || d.mode === 'daily') return;
    var folder = { '1000tries': '1000tries', '27-0': '27-0', '4000goals': '4000goals', bigbash: '25000runs', tests: '60000runs', nfl: '777tds', racing: 'g1winner', epl: '650goals' }[d.game] || d.game;
    var m = d.mode === 'aflw' ? 'nrlw' : d.mode === 'bingod' ? 'bingo' : d.mode, g = forMode(folder, m);
    if (!g || g.id === here.id || !g.path) return;
    e.stopImmediatePropagation();
    location.href = url(g.path) + (d.mode === 'bingod' ? '?play=bingo-daily' : '');
  });

  /* A page for one mode (window.CG_MODE, tools/build.py): the game opens straight into it (its js/app.js or theme-fx.js
     boot). Leaving the game (Change Mode, home) goes to its sport's page, with every mode as a card */
  function leave() {
    var g = currentGame(), sp = g && sportOf(g.sport);
    location.href = url(sp && sp.status === 'live' ? sp.path : '');
  }
  // Nothing started (a sign-in wall closed, a link that opened a panel, a mode that isn't on yet): a card for the mode,
  // with Play (or Opens Soon) and All Games, until the game opens
  var idleEl = null;
  function bootIdle(retry) {
    var g = currentGame();
    if (!g) return;
    var on = launched(g.launch), sp = sportOf(g.sport) || {};
    if (!idleEl) {
      idleEl = document.createElement('div');
      idleEl.className = 'cg-idle';
      idleEl.setAttribute('role', 'region');
      idleEl.setAttribute('aria-label', g.name);
      document.body.appendChild(idleEl);
      idleEl.addEventListener('click', function (e) {
        if (!e.target.closest('[data-cg-idle-play]')) return;
        track('cg_idle_play', { game: HERE });
        if (typeof idleEl.retry === 'function') idleEl.retry();
      });
    }
    idleEl.retry = retry;
    idleEl.style.cssText = '--c1:' + g.c1 + ';--ink:' + g.ink;
    idleEl.innerHTML = '<div class="cg-idle-box">' +
      '<span class="cg-idle-art">' + (g.logo ? '<img src="' + url(g.logo) + '" alt="">' : '<span class="cg-mark" aria-hidden="true">' + g.mark + '</span>') + '</span>' +
      '<span class="cg-idle-k">' + esc(sp.name || '') + '</span><h1>' + esc(g.name) + '</h1><p>' + esc(g.long || g.line) + '</p>' +
      (on ? '<button type="button" class="cg-idle-btn" data-cg-idle-play>Play</button>' : '<span class="cg-idle-soon">Opens Soon</span>') +
      '<a class="cg-idle-alt" href="' + url('') + '">&#x1F3E0; All Games</a></div>';
    idleEl.hidden = false;
    document.documentElement.classList.add('cg-idle-on');
  }
  function bootDone() {
    if (idleEl) idleEl.hidden = true;
    document.documentElement.classList.remove('cg-idle-on');
  }

  /* An old link that opens a game's folder on another mode (/27-0/?play=wc, /25000runs/?play=ou, a leaderboard's Play):
     that mode's own page instead, before anything shows (17 Oct 2026: every mode is its own game) */
  (function () {
    var here = currentGame(), m = /[?&]play=([a-z-]+)(?=&|#|$)/.exec(location.search);
    if (!here || !here.folder || !m || m[1] === 'daily') return;
    var mode = m[1] === 'aflw' ? 'nrlw' : /^bingo/.test(m[1]) ? 'bingo' : m[1], g = forMode(here.folder, mode);
    if (!g || g.id === here.id || !g.path) return;
    var q = mode === 'bingo' ? location.search : location.search.replace(/([?&])play=[^&#]*&?/, '$1').replace(/[?&]$/, '');
    location.replace(url(g.path) + q + location.hash);
  })();

  window.CG = { SPORTS: SPORTS, GAMES: GAMES, liveGames: liveGames, popular: popular, sportOf: sportOf, game: game, forMode: forMode, continueOf: continueOf, inProgress: inProgress,
    launched: launched, url: url, root: ROOT, openSwitcher: openSwitcher, track: track, leave: leave, bootIdle: bootIdle, bootDone: bootDone };
  if (document.body) bar(); else document.addEventListener('DOMContentLoaded', bar);
})();
