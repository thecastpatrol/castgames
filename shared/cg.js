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
    { id: 'nba', name: 'NBA', ico: '&#x1F3C0;', long: 'Basketball', c: '249,115,22', hex: '#F97316', ink: '#1f0d02', status: 'live', path: 'nba/' }
  ];
  /* Every card is one game a player can play (17 Oct 2026, the owner: "a box of games"): each mode of each game has its
     own card and its own page that opens straight into play (tools/build.py makes the pages from this list's path,
     folder and mode). id: the page (window.CG_GAME); folder: the game's copy here; mode: what the page plays (?play=);
     tag: the mode's words on a card that shares its game's logo; of: the spots in a team (Continue: 7 of 13); draft: the
     saved draft's key on this site; board: its main leaderboard (the weekly #1 and Most Popular); daily: the game's
     Daily Challenge lives on this card's game; art: its logo set's name (the final Russo One set, 17 Oct 2026: the card's
     logo, its page's share image assets/og/<art>-og.png and its icons assets/icons/<art>-180.png); bg: a card drawn on its
     own colour, not its sport's (World Cup blue). status: 'live', 'soon' (a Coming Soon card) or 'hidden'. launch: shown
     once that key is launched (or previewed). */
  var L = 'assets/logos/';
  // each game's app icon (assets/icons/<art>-192.png), for the switcher's group labels; tools/build.py adds the versions
  var IC = 'assets/icons/';
  var ICONS = { '1000tries': IC + '1000tries-192.png?v=129340d4', '27-0': IC + '27-0-192.png?v=e0f2e022', '4000goals': IC + '4000goals-192.png?v=5c5ca7ad', '25000runs': IC + '25000runs-192.png?v=a035ae9b',
    '60000runs': IC + '60000runs-192.png?v=0cdf4153', '777tds': IC + '777tds-192.png?v=d19d259e', 'g1winner': IC + 'g1winner-192.png?v=82e093d7', '650goals': IC + '650goals-192.png?v=f82163a5',
    '100000points': IC + '100000points-192.png?v=8b5c9f6b', 'nrl-bingo': IC + 'nrl-bingo-192.png?v=17a4ff47', 'sc-points-king': IC + 'sc-points-king-192.png?v=07ddcb11', 'hol-nrl': IC + 'hol-nrl-192.png?v=69ddeb3b',
    'hol-afl': IC + 'hol-afl-192.png?v=a57a84e3', 'hol-cricket': IC + 'hol-cricket-192.png?v=20e936d7', 'hol-racing': IC + 'hol-racing-192.png?v=bff34f58', 'hol-epl': IC + 'hol-epl-192.png?v=76971d56',
    'hol-nfl': IC + 'hol-nfl-192.png?v=db581393', 'hol-nba': IC + 'hol-nba-192.png?v=7e704bde' };
  var GAMES = [
    // NRL
    { id: '1000tries', art: '1000tries', sport: 'nrl', name: '1000TRIES', path: '1000tries/', folder: '1000tries', mode: 'plus', logo: L + '1000tries.png?v=8e2b532f', status: 'live',
      line: 'Draft 13 to 1000 tries', long: 'Draft 13 NRL players with their tries hidden and reach 1000 career tries.', of: 13, draft: '1000tries_draft_v1', board: '1000plus', daily: true, stats: '1000tries' },
    { id: '27-0', art: '27-0', sport: 'nrl', name: '27-0 CLASSIC', pill: '27-0 CLASSIC', path: '27-0/', folder: '27-0', mode: 'classic', logo: L + '27-0.png?v=6b59b335', status: 'live',
      line: 'Build a 13, go undefeated', long: 'Spin a club and season, draft a 13 from any NRL season since 1998 and go undefeated.', of: 13, draft: '270_draft_v1', board: '270best', daily: true, stats: '27-0' },
    { id: '27-0-pack', art: '27-0-pack', sport: 'nrl', name: '27-0 PACK MODE', pill: '27-0 PACK', path: '27-0-pack/', folder: '27-0', mode: 'pack', logo: L + '27-0-pack.png?v=7cd49f29', status: 'live',
      line: 'Rip open 7 packs, go 27-0', long: 'Rip open 7 packs of NRL players, build your 13 and go undefeated.', of: 13, draft: '270_draft_v1_pack', board: '270pack' },
    { id: '1000tries-team-spin', art: '1000tries-team-spin', sport: 'nrl', name: '1000TRIES TEAM SPIN', pill: 'TEAM SPIN', path: '1000tries-team-spin/', folder: '1000tries', mode: 'spin', logo: L + '1000tries-team-spin.png?v=42c59123', status: 'live',
      line: 'Spin a club and season, pick 1', long: 'Choose a position, spin a club and season, and pick from that squad. Reach 1000 tries.', of: 13, draft: '1000tries_draft_v1_spin', board: '1000spin' },
    { id: '27-0-hard', art: '27-0-hard', sport: 'nrl', name: '27-0 HARD', path: '27-0-hard/', folder: '27-0', mode: 'hard', logo: L + '27-0-hard.png?v=dffcfdbc', status: 'live',
      line: 'No ratings, paid wildcards', long: 'Classic 27-0 with the ratings hidden and paid wildcards only. Can you still go undefeated?', of: 13, draft: '270_draft_v1_hard', board: '270hard' },
    { id: 'nrlw-250', art: 'nrlw-250', sport: 'nrl', name: 'NRLW 250+', path: 'nrlw-250/', folder: '1000tries', mode: 'nrlw', logo: L + 'nrlw-250.png?v=91455665', status: 'live',
      line: 'Draft 13 NRLW stars to 250 tries', long: 'Draft 13 NRLW players with their tries hidden and reach 250 NRLW tries.', of: 13, draft: '1000tries_draft_v1_nrlw', board: 'nrlw' },
    // World Cup 8-0 and World Cup 200+ (17 Oct 2026, the owner: their own games, under NRL, while the World Cup is on)
    { id: 'world-cup-8-0', art: 'world-cup-8-0', sport: 'nrl', name: 'WORLD CUP 8-0', path: 'world-cup-8-0/', folder: '27-0', mode: 'wc', logo: L + 'world-cup-8-0.png?v=e194c528', bg: '#0ea5e9', status: 'live', launch: 'wc', badge: 'World Cup',
      line: 'Spin a nation, win all eight', long: 'Spin a nation, draft from its 2026 World Cup squad, then win all eight games.', board: '270wc', wcRun: true },
    { id: 'world-cup-200', art: 'world-cup-200plus', sport: 'nrl', name: 'WORLD CUP 200+', path: 'world-cup-200/', folder: '1000tries', mode: 'wc', logo: L + 'world-cup-200plus.png?v=ce7dcbf4', bg: '#0ea5e9', status: 'live', launch: 'wc', badge: 'World Cup',
      line: 'Draft Test greats to 200 tries', long: 'Draft 13 Test players since 1980 and the greats before them, and reach 200 Test tries.', of: 13, draft: '1000tries_draft_v1_wc', board: '1000wc' },
    { id: 'higher-or-lower-nrl', art: 'hol-nrl', sport: 'nrl', name: 'HIGHER OR LOWER: NRL', pill: '&#x25B2;&#x25BC; NRL', path: 'higher-or-lower-nrl/', folder: '1000tries', mode: 'ou', logo: L + 'hol-nrl.png?v=e72b9a25', mark: '&#x25B2;&#x25BC;', status: 'live', launch: 'ou', ou: true,
      line: 'Career tries, vs the clock', long: 'Higher or lower? Call NRL players’ career tries before the clock runs out.', board: '1000ou' },
    // NRL Bingo (17 Oct 2026): a Coming Soon card until the owner's Launch ('bingo') or on a device that opened his private
    // link. One endless game, no Daily (the owner, 17 Oct 2026); the 4 x 6 card of 24 tiles
    { id: 'nrl-bingo', art: 'nrl-bingo', sport: 'nrl', name: 'NRL BINGO', path: 'nrl-bingo/', folder: '1000tries', mode: 'bingo', logo: L + 'nrl-bingo.png?v=99598215', mark: '&#x2705;', status: 'live', launch: 'bingo',
      line: 'Tap his teams, fill the card', long: 'A player comes up: tap a team he played for. Fill all 24 tiles of the card for a Full House.', board: 'bgfree' },
    // SC POINTS KING (17 Oct 2026): the NRL SC spinner, a 13 of player seasons in SC positions, no target (the biggest total
    // wins). A Coming Soon card until the owner's Launch ('sc'); its page plays already (the testers' way in)
    { id: 'scpointsking', art: 'sc-points-king', sport: 'nrl', name: 'SC POINTS KING', pill: 'SC KING', path: 'scpointsking/', folder: 'scpointsking', mode: 'plus', logo: L + 'sc-points-king.png?v=e4ac1c76', status: 'live', launch: 'sc',
      line: 'Chase the top of the SC board', long: 'Spin NRL player seasons from 2009 to 2026 and build the biggest SC 13. The top of the board wears the crown.', of: 13, draft: 'sc_draft_v1', board: 'scplus', daily: true },
    // AFL
    { id: '4000goals', art: '4000goals', sport: 'afl', name: '4000 GOALS', path: '4000goals/', folder: '4000goals', mode: 'plus', logo: L + '4000goals.png?v=c6dd3772', status: 'live',
      line: 'Draft 18 to 4000 goals', long: 'Draft an AFL 18 with their goals hidden and reach 4000 career goals.', of: 18, draft: '4000goals_draft_v1', board: '4000plus', daily: true, stats: '4000goals' },
    { id: '4000goals-team-spin', art: '4000goals-team-spin', sport: 'afl', name: '4000 GOALS TEAM SPIN', pill: 'TEAM SPIN', path: '4000goals-team-spin/', folder: '4000goals', mode: 'spin', logo: L + '4000goals-team-spin.png?v=d2d6f54c', status: 'live',
      line: 'Spin a club and season, pick 1', long: 'Choose a position, spin a club and season, and pick from that squad. Reach 4000 goals.', of: 18, draft: '4000goals_draft_v1_spin', board: '4000spin' },
    { id: 'aflw-750', art: 'aflw-750', sport: 'afl', name: 'AFLW 750+', path: 'aflw-750/', folder: '4000goals', mode: 'nrlw', logo: L + 'aflw-750.png?v=48a574d9', status: 'live',
      line: 'Draft 18 AFLW stars to 750 goals', long: 'Draft an AFLW 18 with their goals hidden and reach 750 AFLW goals.', of: 18, draft: '4000goals_draft_v1_nrlw', board: 'aflw' },
    { id: 'higher-or-lower-afl', art: 'hol-afl', sport: 'afl', name: 'HIGHER OR LOWER: AFL', pill: '&#x25B2;&#x25BC; AFL', path: 'higher-or-lower-afl/', folder: '4000goals', mode: 'ou', logo: L + 'hol-afl.png?v=ae3187ef', mark: '&#x25B2;&#x25BC;', status: 'live', launch: 'po', ou: true,
      line: 'Career goals, vs the clock', long: 'Higher or lower? Call AFL players’ career goals before the clock runs out.', board: '4000ou' },
    // Cricket
    // Cricket's colours (18 Oct 2026, the owner: "Both"): 60000 RUNS (Tests) Test amber and 25000 RUNS (Big Bash) lime, clearly
    // apart (no orange, no gold); each game's extra modes (TEAM SPIN, HIGHER OR LOWER: CRICKET with 25000 RUNS) a shade darker
    { id: '60000runs', art: '60000runs', comp: 'Test Cricket', sport: 'cricket', name: '60000 RUNS', path: '60000runs/', folder: '60000runs', mode: 'plus', logo: L + '60000runs.png?v=cb301c59', bg: '#FFC107', bgInk: '#1a1400', status: 'live',
      line: 'Test XI to 60000 runs', long: 'Draft a Test XI from every Test since 1877 with their runs hidden and reach 60000 Test runs.', of: 11, draft: '60000runs_draft_v1', board: 'tsplus', daily: true },
    { id: '25000runs', art: '25000runs', comp: 'Big Bash', sport: 'cricket', name: '25000 RUNS', path: '25000runs/', folder: '25000runs', mode: 'plus', logo: L + '25000runs.png?v=56e235c6', bg: '#D4E83A', bgInk: '#1a1400', status: 'live',
      line: 'Big Bash XI to 25000 runs', long: 'Draft a Big Bash XI with their BBL runs hidden and reach 25000 BBL runs.', of: 11, draft: '25000runs_draft_v1', board: 'bbplus', daily: true },
    { id: 'higher-or-lower-cricket', art: 'hol-cricket', sport: 'cricket', name: 'HIGHER OR LOWER: CRICKET', pill: '&#x25B2;&#x25BC; CRICKET', path: 'higher-or-lower-cricket/', folder: '25000runs', mode: 'ou', logo: L + 'hol-cricket.png?v=586518d9', mark: '&#x25B2;&#x25BC;', bg: '#C1D335', bgInk: '#1a1400', status: 'live', ou: true,
      line: 'Test\u00a0and BBL\u00a0numbers, vs\u00a0the\u00a0clock', long: 'Higher or lower? Call Test and Big Bash runs and wickets before the clock runs out.', board: 'bbou' },
    { id: '60000runs-team-spin', art: '60000runs-team-spin', comp: 'Test Cricket', sport: 'cricket', name: '60000 RUNS TEAM SPIN', pill: 'TEAM SPIN', path: '60000runs-team-spin/', folder: '60000runs', mode: 'spin', logo: L + '60000runs-team-spin.png?v=e26c04f3', bg: '#EBB206', bgInk: '#1a1400', status: 'live',
      line: 'Spin a nation and season, pick 1', long: 'Choose a position, spin a Test nation and season, and pick from that squad. Reach 60000 runs.', of: 11, draft: '60000runs_draft_v1_spin', board: 'tsspin' },
    { id: '25000runs-team-spin', art: '25000runs-team-spin', comp: 'Big Bash', sport: 'cricket', name: '25000 RUNS TEAM SPIN', pill: 'TEAM SPIN', path: '25000runs-team-spin/', folder: '25000runs', mode: 'spin', logo: L + '25000runs-team-spin.png?v=05d0c547', bg: '#C1D335', bgInk: '#1a1400', status: 'live',
      line: 'Spin a club and season, pick 1', long: 'Choose a position, spin a BBL club and season, and pick from that squad. Reach 25000 runs.', of: 11, draft: '25000runs_draft_v1_spin', board: 'bbspin' },
    // Horse Racing
    { id: 'g1winner', art: 'g1winner', sport: 'racing', name: 'G1 WINNER SPINNER', pill: 'G1 WINNER', path: 'g1winner/', folder: 'g1winner', mode: 'plus', logo: L + 'g1winner.png?v=02b3481a', status: 'live',
      line: '8 jockeys to 550 Group 1s', long: 'Draft 8 jockeys for a Group 1 card with their wins hidden and reach 550 Group 1 wins.', of: 8, draft: 'racing_draft_v1', board: 'rcplus', daily: true },
    { id: 'higher-or-lower-racing', art: 'hol-racing', sport: 'racing', name: 'HIGHER OR LOWER: RACING', pill: '&#x25B2;&#x25BC; RACING', path: 'higher-or-lower-racing/', folder: 'g1winner', mode: 'ou', logo: L + 'hol-racing.png?v=f2af3fed', mark: '&#x25B2;&#x25BC;', status: 'live', ou: true,
      line: 'Jockeys, races and horses', long: 'Higher or lower? Call jockeys, big races and horses before the clock runs out.', board: 'rcou' },
    // Premier League
    { id: '650goals', art: '650goals', sport: 'epl', name: '650 GOALS', path: '650goals/', folder: '650goals', mode: 'plus', logo: L + '650goals.png?v=5ee67ff2', status: 'live',
      line: 'An XI to 650 PL goals', long: 'Draft a Premier League XI with their goals hidden and reach 650 career goals.', of: 10, draft: '500goals_draft_v1', board: 'eplplus', daily: true },
    { id: '650goals-team-spin', art: '650goals-team-spin', sport: 'epl', name: '650 GOALS TEAM SPIN', pill: 'TEAM SPIN', path: '650goals-team-spin/', folder: '650goals', mode: 'spin', logo: L + '650goals-team-spin.png?v=d71c9d25', status: 'live',
      line: 'Spin a club and season, pick 1', long: 'Choose a position, spin a Premier League club and season, and pick from that squad. Reach 650 goals.', of: 10, draft: '500goals_draft_v1_spin', board: 'eplspin' },
    { id: 'higher-or-lower-premier-league', art: 'hol-epl', sport: 'epl', name: 'HIGHER OR LOWER: PREMIER LEAGUE', pill: '&#x25B2;&#x25BC; EPL', path: 'higher-or-lower-premier-league/', folder: '650goals', mode: 'ou', logo: L + 'hol-epl.png?v=73af468d', mark: '&#x25B2;&#x25BC;', status: 'live', ou: true,
      line: 'Goals, assists and games', long: 'Higher or lower? Call Premier League goals, assists and appearances before the clock runs out.', board: 'eplou' },
    // NFL
    { id: '777tds', art: '777tds', sport: 'nfl', name: '777 TDS', path: '777tds/', folder: '777tds', mode: 'plus', logo: L + '777tds.png?v=2b015cfe', status: 'live',
      line: '10 players to 777 TDs', long: 'Draft an NFL offence with their touchdowns hidden and reach 777 career touchdowns.', of: 10, draft: '700tds_draft_v1', board: 'nflplus', daily: true },
    { id: '777tds-team-spin', art: '777tds-team-spin', sport: 'nfl', name: '777 TDS TEAM SPIN', pill: 'TEAM SPIN', path: '777tds-team-spin/', folder: '777tds', mode: 'spin', logo: L + '777tds-team-spin.png?v=1f5c7620', status: 'live',
      line: 'Spin a team and season, pick 1', long: 'Choose a position, spin an NFL team and season, and pick from that roster. Reach 777 touchdowns.', of: 10, draft: '700tds_draft_v1_spin', board: 'nflspin' },
    { id: 'higher-or-lower-nfl', art: 'hol-nfl', sport: 'nfl', name: 'HIGHER OR LOWER: NFL', pill: '&#x25B2;&#x25BC; NFL', path: 'higher-or-lower-nfl/', folder: '777tds', mode: 'ou', logo: L + 'hol-nfl.png?v=85d24d72', mark: '&#x25B2;&#x25BC;', status: 'live', ou: true,
      line: 'Career TDs, vs the clock', long: 'Higher or lower? Call NFL players’ career touchdowns before the clock runs out.', board: 'nflou' },
    // NBA (17 Oct 2026: built, not on the site yet)
    // 100000 POINTS (17 Oct 2026): the NBA game, a starting five to 100000 career points. Its accounts open at the owner's
    // Launch ('nba'); its pages play already, like the other new games before theirs
    { id: '100000points', art: '100000points', sport: 'nba', name: '100000 POINTS', path: '100000points/', folder: '100000points', mode: 'plus', logo: L + '100000points.png?v=6d686a56', status: 'live',
      line: 'A starting five to 100000', long: 'Draft an NBA starting five with their points hidden and reach 100000 career points.', of: 5, draft: 'nba_draft_v1', board: 'nbaplus', daily: true },
    { id: '100000points-team-spin', art: '100000points-team-spin', sport: 'nba', name: '100000 POINTS TEAM SPIN', pill: 'TEAM SPIN', path: '100000points-team-spin/', folder: '100000points', mode: 'spin', logo: L + '100000points-team-spin.png?v=655621c4', status: 'live',
      line: 'Spin a team and season, pick 1', long: 'Choose a position, spin an NBA franchise and season, and pick from that roster. Reach 100000 points.', of: 5, draft: 'nba_draft_v1_spin', board: 'nbaspin' },
    { id: 'higher-or-lower-nba', art: 'hol-nba', sport: 'nba', name: 'HIGHER OR LOWER: NBA', pill: '&#x25B2;&#x25BC; NBA', path: 'higher-or-lower-nba/', folder: '100000points', mode: 'ou', logo: L + 'hol-nba.png?v=130cb686', mark: '&#x25B2;&#x25BC;', status: 'live', ou: true,
      line: 'Career stats, vs the clock', long: 'Higher or lower? Call NBA players\u2019 career points, rebounds and assists before the clock runs out.', board: 'nbaou' }
  ];
  // Each card's colours are its sport's (the owner: "sport colour background")
  GAMES.forEach(function (g) {
    var sp = SPORTS.filter(function (x) { return x.id === g.sport; })[0];
    g.c1 = g.bg || (sp ? sp.hex : '#141420'); g.ink = g.bgInk || (g.bg ? '#ffffff' : sp ? sp.ink : '#ffffff'); g.sc = sp ? sp.c : '255,255,255'; // bg: a card drawn on its own colour (World Cup blue, 25000 RUNS' lime-yellow), bgInk its words
  });

  /* The home page's Most Popular, before real weekly plays are known (js/home.js asks the boards): the main ones first */
  var POPULAR = ['1000tries', '27-0', '4000goals', 'higher-or-lower-nrl', '60000runs', '25000runs', '777tds', '650goals', 'g1winner', 'world-cup-8-0', 'world-cup-200',
    '100000points', 'scpointsking', 'nrl-bingo', '27-0-pack', '1000tries-team-spin', '27-0-hard', 'nrlw-250', 'higher-or-lower-afl', 'higher-or-lower-cricket',
    '4000goals-team-spin', 'aflw-750', '60000runs-team-spin', '25000runs-team-spin', 'higher-or-lower-nfl', '777tds-team-spin', 'higher-or-lower-premier-league',
    '650goals-team-spin', 'higher-or-lower-racing', 'higher-or-lower-nba', '100000points-team-spin'];

  function acct() { return window.CastAccount || null; }
  function launched(key) {
    if (!key) return true;
    // The owner's preview device (?castlaunch=1, remembered): every game shows and plays before launch day (17 Oct 2026)
    try { if (localStorage.getItem('cast_launch_preview') === '1') return true; } catch (e) { /* storage blocked */ }
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
  /* A sport's games in popularity order (18 Oct 2026, the owner: "sort by most popular, but the World Cup modes by
     themselves"): this week's players on each card's main board (plays(g), else the home page's copy of the weekly boards
     kept on this device, cg_home_boards_v1), then POPULAR, then the list's own order. The World Cup games take their places
     in it by their own players; wcSlots then lifts them to their set places in a sport's row (18 Oct 2026) */
  function isWC(g) { return g.badge === 'World Cup'; }
  function boardsKept() { try { var b = JSON.parse(localStorage.getItem('cg_home_boards_v1') || 'null'); return b && b.b ? b.b : null; } catch (e) { return null; } }
  function byPopular(list, plays) {
    var kept = plays ? null : boardsKept(), rank = {};
    POPULAR.forEach(function (id, i) { rank[id] = i; });
    var p = plays || function (g) { var x = kept && g.board && kept[g.board]; return x ? x.p || 0 : -1; };
    var r = function (g) { return rank[g.id] == null ? 99 : rank[g.id]; };
    return list.map(function (g, i) { return [g, i]; }).sort(function (a, b) {
      return (p(b[0]) - p(a[0])) || (r(a[0]) - r(b[0])) || (a[1] - b[1]);
    }).map(function (x) { return x[0]; });
  }
  /* The World Cup cards high in the NRL row (18 Oct 2026, the owner: "Move the World Cup modes higher up on the NRL swiper.
     It's one of the most popular games, and it separates the all-green boxes"): WORLD CUP 8-0 2nd and WORLD CUP 200+ 4th,
     the blue breaking up the green; the rest keep their popularity order around them, and a World Cup card already
     higher on its own players stays where it is */
  var WC_SLOTS = [['world-cup-8-0', 1], ['world-cup-200', 3]];
  function wcSlots(list) {
    var out = list.slice();
    WC_SLOTS.forEach(function (x) {
      var i = -1;
      for (var k = 0; k < out.length; k++) if (out[k].id === x[0]) i = k;
      if (i > x[1]) out.splice(x[1], 0, out.splice(i, 1)[0]);
    });
    return out;
  }
  function sportOf(id) { for (var i = 0; i < SPORTS.length; i++) if (SPORTS[i].id === id) return SPORTS[i]; return null; }
  function game(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; return null; }
  // The card that plays a game folder's mode (cast:play events and ?play= links land on the mode's own page)
  /* Modes CAST Games doesn't offer (17 Oct 2026, the owner: no EXACTLY modes on CAST Games; players' past Exactly scores
     stay in their stats): a link or a board's Play for one opens the game's main card instead */
  var REMOVED = { exact: true };
  function mainMode(folder) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].folder === folder && GAMES[i].path === folder + '/') return GAMES[i].mode; return 'plus'; }
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
  /* The bar's own icons (17 Oct 2026, the owner picked "Bold Gradient Glyphs"): each in grey (-off) and lit (-on, its glow
     drawn in); the selected tab shows -on on a soft white pill. tools/build.py gives each icon address its content version */
  var TB = 'assets/tabs/';
  var TAB_ICONS = {
    play: [TB + 'play-off.png?v=7a0c07c2', TB + 'play-on.png?v=7a540de7'], stats: [TB + 'stats-off.png?v=38a5311a', TB + 'stats-on.png?v=7cb0ecf8'], boards: [TB + 'boards-off.png?v=0e9c79b8', TB + 'boards-on.png?v=1f012f44'],
    friends: [TB + 'friends-off.png?v=81cf4be7', TB + 'friends-on.png?v=42d2099a'], shop: [TB + 'shop-off.png?v=8d900645', TB + 'shop-on.png?v=c1346e02'], 'new-game': [TB + 'new-game-off.png?v=f66f6164', TB + 'new-game-on.png?v=d0f70d5e'],
    admin: [TB + 'admin-off.png?v=5515a667', TB + 'admin-on.png?v=47b3267f']
  };
  function tabIcon(name) {
    var t = TAB_ICONS[name];
    return '<i class="cg-ti" aria-hidden="true"><img class="is-off" src="' + url(t[0]) + '" alt="" width="26" height="26"><img class="is-on" src="' + url(t[1]) + '" alt="" width="26" height="26"></i>';
  }
  function bar() {
    var g = currentGame();
    var el = document.createElement('div');
    el.className = 'cg-bar';
    el.innerHTML = '<div class="cg-in">' +
      '<a class="cg-logo" href="' + url('') + '" aria-label="CAST Games home"><img src="' + url('assets/logos/castgames.png') + '" alt="CAST Games" width="300" height="150"></a>' +
      '<button type="button" class="cg-game" data-cg="switch" aria-haspopup="dialog">' + (g ? g.pill || esc(g.name) : 'All Games') + ' <i aria-hidden="true">&#x25BE;</i></button>' +
      '<nav class="cg-tabs" aria-label="CAST Games">' + TABS.map(function (t) {
        return '<button type="button" class="cg-tab' + (t[0] === 'play' ? ' is-on' : '') + '" data-cg="' + t[0] + '" aria-label="' + t[2] + '">' + tabIcon(t[0]) + '<span>' + t[2] + '</span></button>';
      }).join('') + '</nav>' +
      '<span class="cg-sp"></span>' +
      '<span class="cg-right"><button type="button" class="cg-new" data-cg="new" aria-label="New Game" hidden>' + tabIcon('new-game') + '<span>New Game</span></button><span class="cg-acct"><button type="button" data-cast-friends aria-label="Friends" hidden></button><button type="button" data-cast-account aria-label="Sign in to save your history"></button></span></span>' +
      '</div>';
    document.body.insertBefore(el, document.body.firstChild);
    document.documentElement.classList.add('cg-on');
    document.documentElement.style.setProperty('--cg-admin-off', 'url("' + url(TAB_ICONS.admin[0]) + '")');
    document.documentElement.style.setProperty('--cg-admin-on', 'url("' + url(TAB_ICONS.admin[1]) + '")');
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
      '<div class="cg-sw-list"><div class="cg-sp-list">' + swGroups(byPopular(gs)).map(function (grp) {
        return '<section class="cg-swg' + (grp.wc ? ' is-wc' : '') + '"><h3 class="cg-swg-h">' + (grp.icon ? '<img src="' + url(grp.icon) + '" alt="">' : '<span aria-hidden="true">&#x1F30F;</span>') +
          '<span>' + esc(grp.label) + '</span></h3>' + grp.rows.map(function (r) { return swRow(r.g, r.name); }).join('') + '</section>';
      }).join('') + '</div></div></div>';
  }
  /* The switcher's list, grouped by game (18 Oct 2026, the owner: "I like groups but this looks too weird"): each game a
     plain label (its app icon and name), then its modes as rows all the same size, the main mode first and the rest by
     popularity; the games themselves by popularity (byPopular). The World Cup games are their own World Cup group in World
     Cup blue, right after the first game (18 Oct 2026, the owner), or higher if their own players put them there. A HIGHER OR LOWER game, NRL Bingo and SC POINTS KING are games of their own */
  function mainOf(g) {
    if (!g.folder || g.ou || g.mode === 'bingo' || g.path === g.folder + '/') return null;
    for (var i = 0; i < GAMES.length; i++) if (GAMES[i].folder === g.folder && GAMES[i].path === g.folder + '/') return GAMES[i];
    return null;
  }
  // a game's name as its group label: 27-0 CLASSIC's group is 27-0
  function gameLabel(g) { return String(g.name).replace(/ CLASSIC$/, ''); }
  function swGroups(gs) {
    var out = [], by = {}, wc = null;
    gs.forEach(function (g) {
      if (isWC(g)) { if (!wc) { wc = { wc: true, label: 'World Cup', icon: '', rows: [] }; out.push(wc); } wc.rows.push({ g: g, name: g.name }); return; }
      var m = mainOf(g), key = m && gs.indexOf(m) >= 0 ? m.id : g.id;
      if (!by[key]) { var main = m && gs.indexOf(m) >= 0 ? m : g; by[key] = { label: gameLabel(main), icon: ICONS[main.art] || '', rows: [], main: main }; out.push(by[key]); }
      by[key].rows.push({ g: g, name: g === by[key].main ? g.name : subName(g, by[key].main) });
    });
    // the main mode first in its group, the rest as they came (by popularity)
    out.forEach(function (grp) { if (grp.main) grp.rows.sort(function (a, b) { return (b.g === grp.main ? 1 : 0) - (a.g === grp.main ? 1 : 0); }); });
    var w = out.indexOf(wc);
    if (w > 1) out.splice(1, 0, out.splice(w, 1)[0]); // right after the first game, unless already higher
    return out;
  }
  // A mode's own words under its game: "1000TRIES TEAM SPIN" is Team Spin, "27-0 PACK MODE" Pack Mode (NRLW, 250+ and 8-0 kept)
  function subName(g, main) {
    var n = String(g.name), full = main ? String(main.name) + ' ' : '', p = main ? String(main.name).split(' ')[0] + ' ' : '';
    if (full && n.indexOf(full) === 0) n = n.slice(full.length); // 60000 RUNS TEAM SPIN: Team Spin
    else if (p && n.indexOf(p) === 0) n = n.slice(p.length); // 27-0 PACK MODE under 27-0 CLASSIC: Pack Mode
    return n.split(' ').map(function (w) { return /\d|^(NRLW|AFLW|NBA|NFL|NRL|AFL|SC)$/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase(); }).join(' ');
  }
  function swRow(g, name) {
    var c = continueOf(g);
    return '<a class="cg-swr' + (g.id === HERE ? ' is-on' : '') + '" href="' + url(g.path) + '" style="--c1:' + g.c1 + ';--ink:' + g.ink + '">' +
      '<span class="cg-swr-art" aria-hidden="true">' + (g.logo ? '<img src="' + url(g.logo) + '" alt="">' : '<span class="cg-mark">' + g.mark + '</span>') + '</span>' +
      '<span class="cg-swr-t"><b>' + esc(name) + '</b><small>' + (c ? esc(c.label) : esc(g.line)) + '</small></span></a>';
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
    var folder = { '1000tries': '1000tries', '27-0': '27-0', '4000goals': '4000goals', bigbash: '25000runs', tests: '60000runs', nfl: '777tds', racing: 'g1winner', epl: '650goals', nba: '100000points', sc: 'scpointsking' }[d.game] || d.game;
    var m = d.mode === 'aflw' ? 'nrlw' : d.mode === 'bingod' ? 'bingo' : d.mode, g = forMode(folder, REMOVED[m] ? mainMode(folder) : m);
    if (REMOVED[m] && g && g.id === here.id) { e.stopImmediatePropagation(); return; } // already on its main card: nothing to start
    if (!g || g.id === here.id || !g.path) return;
    e.stopImmediatePropagation();
    location.href = url(g.path); // an old Daily Bingo board's Play opens NRL Bingo itself (no Daily since 17 Oct 2026)
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
    var mode = m[1] === 'aflw' ? 'nrlw' : /^bingo/.test(m[1]) ? 'bingo' : m[1], g = forMode(here.folder, REMOVED[mode] ? mainMode(here.folder) : mode);
    var bare = location.search.replace(/([?&])play=[^&#]*&?/, '$1').replace(/[?&]$/, '');
    if (REMOVED[mode] && g && g.id === here.id) { try { history.replaceState(history.state, '', location.pathname + bare + location.hash); } catch (e) { /* old browser */ } return; } // this page's own game, in its main mode
    if (!g || g.id === here.id || !g.path) return;
    var q = mode === 'bingo' ? location.search : location.search.replace(/([?&])play=[^&#]*&?/, '$1').replace(/[?&]$/, '');
    location.replace(url(g.path) + q + location.hash);
  })();

  window.CG = { SPORTS: SPORTS, GAMES: GAMES, liveGames: liveGames, popular: popular, sportOf: sportOf, game: game, forMode: forMode, continueOf: continueOf, inProgress: inProgress,
    launched: launched, url: url, root: ROOT, openSwitcher: openSwitcher, byPopular: byPopular, wcSlots: wcSlots, isWC: isWC, track: track, leave: leave, bootIdle: bootIdle, bootDone: bootDone };
  if (document.body) bar(); else document.addEventListener('DOMContentLoaded', bar);
})();
