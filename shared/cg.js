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

  var SPORTS = [
    { id: 'nrl', name: 'NRL', long: 'Rugby League', c: '34,197,94', status: 'live', path: 'nrl/' }, // path: its See All page
    { id: 'afl', name: 'AFL', long: 'Aussie Rules', c: '239,68,68', status: 'live', path: 'afl/' },
    { id: 'cricket', name: 'Cricket', long: 'The Big Bash and Tests', c: '255,122,46', status: 'live', path: 'cricket/' },
    { id: 'nfl', name: 'NFL', long: 'American Football', c: '54,226,126', status: 'live', path: 'nfl/' },
    { id: 'racing', name: 'Horse Racing', long: 'Group 1 Jockeys', c: '59,130,246', status: 'live', path: 'racing/' }
  ];
  var GAMES = [
    { id: '27-0', sport: 'nrl', name: '27-0', path: '27-0/', logo: 'assets/logos/27-0.png', c1: '#1f2a55', c2: '#11152a', status: 'live',
      line: 'Draft a 13 from any NRL season since 1998 and go undefeated.', short: 'Draft a 13 and go undefeated', daily: true, stats: '27-0' },
    { id: '1000tries', sport: 'nrl', name: '1000TRIES', path: '1000tries/', logo: 'assets/logos/1000tries.png', c1: '#3b1d5e', c2: '#160f24', status: 'live',
      line: 'Draft 13 NRL players and reach 1000 career tries.', short: 'Draft 13 to 1000 tries', daily: true, stats: '1000tries' },
    { id: 'six-again', sport: 'nrl', name: 'Six Again', path: 'six-again/', logo: '', mark: '&#x25B2;&#x25BC;', c1: '#0f4a4a', c2: '#0a1a1f', status: 'live', launch: 'ou', badge: 'New',
      line: 'Over or under? Call it before the clock runs out.', short: 'Over or under, vs the clock' },
    { id: '4000goals', sport: 'afl', name: '4000 GOALS', path: '4000goals/', logo: 'assets/logos/4000goals.png', c1: '#5a1620', c2: '#1c0b10', status: 'live',
      line: 'Draft an AFL 18 and reach 4000 career goals.', short: 'Draft an 18 to 4000 goals', daily: true, stats: '4000goals' },
    // 25000 RUNS (15 Oct 2026): the Big Bash game, a BBL XI to 25,000 career runs
    { id: '25000runs', sport: 'cricket', name: '25000 RUNS', path: '25000runs/', logo: 'assets/logos/25000runs.png', c1: '#1a2148', c2: '#0b1022', status: 'live', badge: 'New',
      line: 'Draft a Big Bash XI and reach 25,000 career BBL runs.', short: 'Draft a BBL XI to 25,000 runs' },
    // 60000 RUNS (16 Oct 2026): the Test cricket game, a Test XI to 60,000 career Test runs
    { id: '60000runs', sport: 'cricket', name: '60000 RUNS', path: '60000runs/', logo: 'assets/logos/60000runs.png', c1: '#163327', c2: '#06140f', status: 'live', badge: 'New',
      line: 'Draft a Test XI from every Test since 1877 and reach 60,000 career Test runs.', short: 'Draft a Test XI to 60,000 runs' },
    // 700 TDS (16 Oct 2026): the NFL game, an offence of 9 to 700 career touchdowns
    { id: '700tds', sport: 'nfl', name: '700 TDS', path: '700tds/', logo: 'assets/logos/700tds.png', c1: '#123a26', c2: '#08131f', status: 'live', badge: 'New',
      line: 'Draft an NFL offence and reach 700 career touchdowns.', short: 'Draft 9 to 700 touchdowns' },
    // G1 WINNERS SPINNER (16 Oct 2026): the racing game, 8 jockeys to 550 Group 1 wins since 1983
    { id: 'g1winners', sport: 'racing', name: 'G1 WINNERS SPINNER', path: 'g1winners/', logo: 'assets/logos/g1winners.png', c1: '#14306b', c2: '#08132e', status: 'live', badge: 'New',
      line: 'Draft 8 jockeys and reach 550 Group 1 wins since 1983.', short: 'Draft 8 jockeys to 550 Group 1s' },
    // Play On (15 Oct 2026): 4000 GOALS's Six Again, its own page like Six Again's
    { id: 'play-on', sport: 'afl', name: 'Play On', path: 'play-on/', logo: '', mark: '&#x25B2;&#x25BC;', c1: '#5a1a1a', c2: '#1c0b10', status: 'live', launch: 'po', badge: 'New',
      line: 'Over or under? Call AFL players before the clock runs out.', short: 'Over or under, vs the clock' }
  ];

  /* The home page's Most Popular four (the owner, 15 Oct 2026: the main ones for now; real weekly plays and an Admin pin can
     take over later). The first four that are live right now, in this order; a sport's See All page uses it too */
  var POPULAR = ['27-0', '1000tries', '4000goals', 'six-again', 'play-on'];

  function acct() { return window.CastAccount || null; }
  function launched(key) {
    if (!key) return true;
    var A = acct();
    try { if (A && A.isLaunched && A.isLaunched(key)) return true; } catch (e) { /* not ready */ }
    if (key === 'ou' && A && A.ouOn) { try { return !!A.ouOn(); } catch (e) { return false; } }
    if (key === 'po' && A && A.poOn) { try { return !!A.poOn(); } catch (e) { return false; } }
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
      '<button type="button" class="cg-game" data-cg="switch" aria-haspopup="dialog">' + esc(g ? g.name : 'All Games') + ' <i aria-hidden="true">&#x25BE;</i></button>' +
      '<nav class="cg-tabs" aria-label="CAST Games">' + TABS.map(function (t) {
        return '<button type="button" class="cg-tab' + (t[0] === 'play' ? ' is-on' : '') + '" data-cg="' + t[0] + '"><i aria-hidden="true">' + t[1] + '</i><span>' + t[2] + '</span></button>';
      }).join('') + '</nav>' +
      '<span class="cg-sp"></span>' +
      '<span class="cg-acct"><button type="button" data-cast-friends aria-label="Friends" hidden></button><button type="button" data-cast-account aria-label="Sign in to save your history"></button></span>' +
      '</div>';
    document.body.insertBefore(el, document.body.firstChild);
    document.documentElement.classList.add('cg-on');
    if (HERE) document.documentElement.classList.add('cg-in-game', 'cg-g-' + HERE);
    el.addEventListener('click', onBar);
    var A = acct(); if (A && A.refresh) { try { A.refresh(); } catch (e) { /* later */ } }
  }
  function onBar(e) {
    var b = e.target.closest('[data-cg]');
    if (!b) return;
    var a = b.getAttribute('data-cg'), A = acct();
    track('cg_tab', { tab: a, game: HERE || 'home' });
    if (a === 'switch') { openSwitcher(); return; }
    if (a === 'play') { play(); return; }
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

  /* ---------- The game switcher: every sport, then its games (soon sports at the end) ---------- */
  var sheet = null;
  function openSwitcher() {
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'cg-sheet';
      sheet.hidden = true;
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-label', 'Pick a game');
      document.body.appendChild(sheet);
      sheet.addEventListener('click', function (e) { if (e.target === sheet || e.target.closest('[data-cg-x]')) shut(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    }
    var live = liveGames();
    sheet.innerHTML = '<div class="cg-sheet-box"><button type="button" class="cg-x" data-cg-x aria-label="Close">&#x2715;</button>' +
      '<a class="cg-home-link" href="' + url('') + '">&#x1F3E0; All Games</a>' +
      SPORTS.filter(function (s) { return s.status !== 'hidden'; }).map(function (s) {
        var gs = live.filter(function (g) { return g.sport === s.id; });
        if (!gs.length && s.status !== 'soon') return '';
        return '<div class="cg-sp-h" style="--sc:' + s.c + '"><b>' + esc(s.name) + '</b><small>' + esc(s.long) + '</small></div>' +
          (gs.length ? '<div class="cg-sp-list">' + gs.map(function (g) {
            return '<a class="cg-sp-game' + (g.id === HERE ? ' is-on' : '') + '" href="' + url(g.path) + '" style="--c1:' + g.c1 + ';--c2:' + g.c2 + '">' +
              (g.logo ? '<img src="' + url(g.logo) + '" alt="">' : '<span class="cg-mark">' + g.mark + '</span>') + '<span><b>' + esc(g.name) + '</b><small>' + esc(g.short) + '</small></span></a>';
          }).join('') + '</div>' : '<p class="cg-soon">Coming soon</p>');
      }).join('') + '</div>';
    sheet.hidden = false;
    document.documentElement.classList.add('cg-sheet-open');
  }
  function shut() { if (sheet && !sheet.hidden) { sheet.hidden = true; document.documentElement.classList.remove('cg-sheet-open'); } }

  function track(ev, p) { try { if (typeof gtag === 'function') gtag('event', ev, p || {}); } catch (e) { /* no analytics */ } }

  // A link to another game on this site opens in the same tab, even one a game made with a new tab in mind
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[target="_blank"][href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.host === location.host || u.host === 'castgames.com.au' || u.host === 'www.castgames.com.au') a.removeAttribute('target');
  }, true);

  window.CG = { SPORTS: SPORTS, GAMES: GAMES, liveGames: liveGames, popular: popular, sportOf: sportOf, url: url, root: ROOT, openSwitcher: openSwitcher, track: track };
  if (document.body) bar(); else document.addEventListener('DOMContentLoaded', bar);
})();
