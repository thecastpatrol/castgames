/* CAST Daily calendar, shared by 1000TRIES and 27-0 (both load this before their js/daily.js) and by the server
   (tools/sync_functions_data.py copies it to firebase/functions/data/cast-daily.js, where it checks a completed Daily
   before its reward is given). So a day's theme, goal and reward are the same everywhere. Edit Dailies HERE, then run
   tools/sync_shared.py (the sites) and tools/sync_functions_data.py (the server), push both sites and redeploy.

   From 29 Sep 2026 (the owner's call): every Daily has a theme and a goal to tick off (✅ or ❌), and each player gets
   their own random draft within the theme. No more "the same spins for everyone". Targets come from each game's
   simulator, and from 7 October 2026 every day reads TARGETS_HARDER (fitted to Admin's results, below).

   CAST_DAILY.day('YYYY-MM-DD') gives {
     date, key, name, short, icon, title, story, hard, planned, onThisDay (a final, or null),
     who ('Sydney club players', for 1000TRIES), seasons ('Sydney club seasons', for 27-0),
     g1000: { target, only },                  1000TRIES: tries to reach, and the pool ({ club: [seasons] }, [] = any)
     g270: { type, clubs, teams, from, to, goal }  27-0: 'clubs' (any season of these clubs; null = every club), 'final'
                                                (two clubs taking turns), 'teams' (these club seasons), 'club' (one club);
                                                from/to: seasons; goal: the squad rating to reach. ('premiers', win the
                                                Grand Final, was tried for Grand Final Day, but the engine almost never
                                                lets a random 87 squad win the final, so the hard day uses a rating too)
     reward: { '1000tries': { legend: 1 }, '27-0': { superstar: 1 } }   into the Vault once the Daily is completed
   } */
(function (root) {
  'use strict';

  var NICK = { broncos: 'Broncos', bulldogs: 'Bulldogs', cowboys: 'Cowboys', dolphins: 'Dolphins', dragons: 'Dragons', eels: 'Eels',
    knights: 'Knights', panthers: 'Panthers', rabbitohs: 'Rabbitohs', raiders: 'Raiders', roosters: 'Roosters', seaeagles: 'Sea Eagles',
    sharks: 'Sharks', storm: 'Storm', tigers: 'Wests Tigers', titans: 'Titans', warriors: 'Warriors',
    balmain: 'Balmain', bears: 'North Sydney', wmagpies: 'Western Suburbs', stgeorge: 'St George', northerneagles: 'Northern Eagles',
    steelers: 'Illawarra', adelaide: 'Adelaide' };
  var MASCOT = { broncos: '🐎', bulldogs: '🐶', cowboys: '🤠', dolphins: '🐬', dragons: '🐉',
    eels: '🐍', knights: '🏰', panthers: '🐆', rabbitohs: '🐇', raiders: '🪓',
    roosters: '🐓', seaeagles: '🦅', sharks: '🦈', storm: '⛈️', tigers: '🐯',
    titans: '🔱', warriors: '⚔️' };
  // Today's 17 clubs (the club days take turns through them)
  var CLUBS = ['rabbitohs', 'broncos', 'roosters', 'storm', 'eels', 'panthers', 'dragons', 'bulldogs', 'sharks',
    'knights', 'cowboys', 'raiders', 'seaeagles', 'warriors', 'tigers', 'titans', 'dolphins'];
  // Sydney: today's nine Sydney clubs plus the old ones from 1998 (the owner's call, 28 Sep 2026)
  var SYDNEY = ['roosters', 'rabbitohs', 'bulldogs', 'eels', 'seaeagles', 'sharks', 'tigers', 'panthers', 'dragons',
    'balmain', 'wmagpies', 'bears', 'stgeorge', 'northerneagles'];
  var QUEENSLAND = ['broncos', 'cowboys', 'titans', 'dolphins'];
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }

  /* Every NRL Grand Final from 1998 (fact-checked 28 Sep 2026 against Wikipedia, the ABC and Rugby League Project; 2007 and
     2009 were stripped from Melbourne and are never used). pick: the one
     a date's On This Day uses when finals share a date (the owner's picks, 28 Sep 2026); the others get a line. */
  var FINALS = [
    { d: '2000-08-27', w: 'broncos', l: 'roosters', s: '14-6', pick: 1, line: 'Brisbane beat the Roosters 14-6 in a Grand Final brought forward to August for the Sydney Olympics.' },
    { d: '1999-09-26', w: 'storm', l: 'dragons', s: '20-18', pick: 1, line: 'Melbourne came from 14-0 down to beat St George Illawarra 20-18, sealed by a late penalty try, in only their second season.' },
    { d: '1998-09-27', w: 'broncos', l: 'bulldogs', s: '38-12', pick: 1, line: 'Brisbane won the first NRL Grand Final, 38-12 over Canterbury.' },
    { d: '2001-09-30', w: 'knights', l: 'eels', s: '30-24', pick: 1, line: 'Andrew Johns led Newcastle to a 30-24 win over a record-breaking Parramatta side.' },
    { d: '2012-09-30', w: 'storm', l: 'bulldogs', s: '14-4', line: 'Melbourne beat Canterbury 14-4.' },
    { d: '2018-09-30', w: 'roosters', l: 'storm', s: '21-6', line: 'The Roosters beat Melbourne 21-6, with Cooper Cronk playing through a broken shoulder blade.' },
    { d: '2023-10-01', w: 'panthers', l: 'broncos', s: '26-24', pick: 1, line: 'Penrith came back from 24-8 down, the biggest comeback in Grand Final history, to beat Brisbane 26-24 for a third straight title.' },
    { d: '2006-10-01', w: 'broncos', l: 'storm', s: '15-8', line: 'Brisbane beat Melbourne 15-8.' },
    { d: '2017-10-01', w: 'storm', l: 'cowboys', s: '34-6', line: 'Melbourne beat North Queensland 34-6 in Cooper Cronk’s last game for the club.' },
    { d: '2016-10-02', w: 'sharks', l: 'storm', s: '14-12', pick: 1, line: 'Cronulla beat Melbourne 14-12 for the first premiership in the club’s 50 seasons.' },
    { d: '2005-10-02', w: 'tigers', l: 'cowboys', s: '30-16', line: 'Wests Tigers beat North Queensland 30-16 for their first title, lit up by Benji Marshall’s flick pass.' },
    { d: '2011-10-02', w: 'seaeagles', l: 'warriors', s: '24-10', line: 'Manly beat the Warriors 24-10.' },
    { d: '2022-10-02', w: 'panthers', l: 'eels', s: '28-12', line: 'Penrith beat Parramatta 28-12 for back-to-back titles.' },
    { d: '2010-10-03', w: 'dragons', l: 'roosters', s: '32-8', pick: 1, line: 'St George Illawarra beat the Roosters 32-8 for their first premiership as a joint venture.' },
    { d: '2004-10-03', w: 'bulldogs', l: 'roosters', s: '16-13', line: 'Canterbury edged the Roosters 16-13 in Brad Fittler’s last game.' },
    { d: '2021-10-03', w: 'panthers', l: 'rabbitohs', s: '14-12', line: 'Penrith beat South Sydney 14-12, the first of four straight titles.' },
    { d: '2015-10-04', w: 'cowboys', l: 'broncos', s: '17-16', pick: 1, line: 'North Queensland won their first premiership 17-16 over Brisbane, Johnathan Thurston kicking the golden point field goal.' },
    { d: '2014-10-05', w: 'rabbitohs', l: 'bulldogs', s: '30-6', pick: 1, line: 'South Sydney beat Canterbury 30-6 for their first premiership in 43 years, Sam Burgess playing on with a broken cheekbone.' },
    { d: '2003-10-05', w: 'panthers', l: 'roosters', s: '18-6', line: 'Penrith beat the Roosters 18-6, remembered for Scott Sattler’s chase-down tackle.' },
    { d: '2008-10-05', w: 'seaeagles', l: 'storm', s: '40-0', line: 'Manly beat Melbourne 40-0, the biggest winning margin in a Grand Final.' },
    { d: '2025-10-05', w: 'broncos', l: 'storm', s: '26-22', line: 'Brisbane came from 22-12 down at half-time to beat Melbourne 26-22.' },
    { d: '2024-10-06', w: 'panthers', l: 'storm', s: '14-6', pick: 1, line: 'Penrith beat Melbourne 14-6 for a fourth straight premiership.' },
    { d: '2002-10-06', w: 'roosters', l: 'warriors', s: '30-8', line: 'The Roosters beat the Warriors 30-8.' },
    { d: '2013-10-06', w: 'roosters', l: 'seaeagles', s: '26-18', line: 'The Roosters beat Manly 26-18.' },
    { d: '2019-10-06', w: 'roosters', l: 'raiders', s: '14-8', line: 'The Roosters beat Canberra 14-8 for back-to-back titles.' },
    { d: '2020-10-25', w: 'storm', l: 'panthers', s: '26-20', pick: 1, line: 'Melbourne beat Penrith 26-20 in the season played through COVID.' }
  ];
  function finalFor(md) { return FINALS.filter(function (f) { return f.pick && f.d.slice(5) === md; })[0] || null; }
  // Other finals on the date that one of the day's two clubs won: a Daily only mentions its own clubs (the owner's rule,
  // 4 Oct 2026), so a final between two other clubs is never named
  function othersOn(md, pick) { return FINALS.filter(function (f) { return f !== pick && f.d.slice(5) === md && (f.w === pick.w || f.w === pick.l); }); }

  /* Targets from each game's simulator. t: 1000TRIES tries,
     g: 27-0 squad rating. Filled by the calibration run (28 Sep 2026) for every pool the calendar can use. */
  var TARGETS = {
    // key: [1000TRIES normal, 1000TRIES hard, 27-0 normal, 27-0 hard]
    'sydney': [750, 825, 87, 88],
    'premierships': [1050, 1100, 88, 89],
    'club:storm': [775, 825, 88, 89],
    'final:2016': [825, 875, 87, 88],
    'final:2010': [850, 900, 86, 87],
    'gf2026': [800, 875, 87, 88],
    'final:2014': [825, 900, 87, 88],
    'final:2024': [800, 850, 88, 89],
    'club:rabbitohs': [825, 900, 87, 87],
    'club:broncos': [725, 775, 88, 88],
    'club:roosters': [925, 1000, 87, 88],
    'club:eels': [725, 775, 85, 86],
    'club:panthers': [750, 800, 86, 87],
    'club:dragons': [750, 800, 85, 86],
    'club:bulldogs': [750, 825, 86, 87],
    'club:sharks': [825, 875, 85, 85],
    'club:knights': [625, 675, 86, 87],
    'club:cowboys': [675, 725, 87, 87],
    'club:raiders': [700, 750, 84, 85],
    'club:seaeagles': [725, 800, 86, 86],
    'club:warriors': [650, 700, 85, 85],
    'club:tigers': [675, 725, 85, 86],
    'club:titans': [625, 675, 84, 85],
    'club:dolphins': [600, 625, 83, 84],
    'queensland': [700, 750, 87, 88],
    'era:2000s': [800, 875, 87, 88],
    'era:2010s': [875, 925, 88, 89],
    'era:2020s': [775, 850, 86, 87],
    'final:2000': [875, 925, 88, 89],
    'final:1999': [775, 850, 87, 88],
    'final:1998': [775, 825, 88, 88],
    'final:2001': [700, 750, 87, 87],
    'final:2012': [775, 850, 88, 89],
    'final:2018': [875, 950, 88, 89],
    'final:2023': [750, 800, 88, 88],
    'final:2006': [775, 825, 89, 90],
    'final:2017': [725, 800, 88, 89],
    'final:2005': [675, 750, 87, 87],
    'final:2011': [725, 775, 86, 86],
    'final:2022': [750, 800, 87, 87],
    'final:2004': [825, 900, 87, 88],
    'final:2021': [800, 875, 87, 88],
    'final:2015': [725, 775, 88, 89],
    'final:2003': [850, 925, 87, 88],
    'final:2008': [750, 825, 87, 88],
    'final:2025': [775, 825, 89, 90],
    'final:2002': [850, 900, 86, 87],
    'final:2013': [850, 925, 87, 87],
    'final:2019': [875, 925, 87, 87],
    'final:2020': [800, 850, 88, 89]
  };
  /* Harder from Wednesday 7 October 2026 (the owner's call, 5 Oct), fitted to Admin's results. Every day before 7 October
     keeps TARGETS, so past Dailies, replays and rewards already won never change. */
  var HARDER_FROM = '2026-10-07';
  var TARGETS_HARDER = {
    // key: [1000TRIES normal, 1000TRIES hard, 27-0 normal, 27-0 hard]
    'sydney': [850, 925, 88, 88],
    'premierships': [1150, 1200, 89, 89],
    'club:storm': [875, 925, 89, 89],
    'final:2016': [950, 1000, 88, 88],
    'final:2010': [975, 1025, 87, 87],
    'gf2026': [950, 1000, 88, 88],
    'final:2014': [1000, 1050, 88, 88],
    'final:2024': [900, 950, 89, 89],
    'club:rabbitohs': [1000, 1050, 88, 88],
    'club:broncos': [825, 875, 89, 89],
    'club:roosters': [1075, 1100, 88, 88],
    'club:eels': [875, 925, 86, 86],
    'club:panthers': [875, 900, 87, 87],
    'club:dragons': [875, 925, 86, 86],
    'club:bulldogs': [900, 950, 87, 87],
    'club:sharks': [950, 1000, 86, 86],
    'club:knights': [775, 800, 87, 87],
    'club:cowboys': [825, 850, 87, 87],
    'club:raiders': [825, 875, 85, 85],
    'club:seaeagles': [875, 925, 87, 87],
    'club:warriors': [800, 850, 86, 86],
    'club:tigers': [800, 850, 86, 86],
    'club:titans': [775, 800, 85, 85],
    'club:dolphins': [675, 700, 84, 84],
    'queensland': [775, 825, 88, 88],
    'era:2000s': [925, 975, 88, 88],
    'era:2010s': [975, 1050, 89, 89],
    'era:2020s': [900, 975, 87, 87],
    'final:2000': [1000, 1050, 89, 89],
    'final:1999': [900, 975, 88, 88],
    'final:1998': [900, 950, 89, 89],
    'final:2001': [825, 875, 88, 88],
    'final:2012': [925, 1000, 89, 89],
    'final:2018': [1000, 1075, 89, 89],
    'final:2023': [875, 925, 89, 89],
    'final:2006': [875, 925, 90, 90],
    'final:2017': [875, 925, 89, 89],
    'final:2005': [825, 875, 88, 88],
    'final:2011': [850, 900, 87, 87],
    'final:2022': [875, 925, 88, 88],
    'final:2004': [975, 1025, 88, 88],
    'final:2021': [975, 1025, 88, 88],
    'final:2015': [850, 900, 89, 89],
    'final:2003': [1000, 1050, 88, 88],
    'final:2008': [900, 950, 88, 88],
    'final:2025': [900, 950, 90, 90],
    'final:2002': [975, 1050, 87, 87],
    'final:2013': [1000, 1050, 88, 88],
    'final:2019': [1000, 1050, 88, 88],
    'final:2020': [925, 950, 89, 89]
  };
  /* 27-0 from Wednesday 14 October 2026 (the owner, 13 Oct: most players were finishing 27-0's Dailies). Monday, Wednesday
     and Friday ask for a squad rating; Tuesday, Thursday, Saturday and Sunday ask for a number of wins (Sunday, the hard day,
     a higher one). Fitted to the week before's results (private notes). Rating goals capped 14 Oct (the owner: Cowboys
     90+ wasn't possible; the best of 122 players was 88): never above the old goal + 1, wins goals and the 1000TRIES World Cup targets set from
     the past boards (the owner: Thursday 17+). key: [rating, wins, Sunday wins]. A pool missing here
     takes MIX_DEFAULT. Every day before 14 October keeps its rating goal, so past Dailies and rewards never change */
  var MIX_FROM = '2026-10-14';
  var MIX_DEFAULT = [88, 18, 20];
  var TARGETS_270 = {
    'club:broncos': [90, 22, 23], 'club:bulldogs': [88, 17, 18], 'club:cowboys': [88, 20, 22],
    'club:dolphins': [84, 16, 17], 'club:dragons': [86, 17, 18], 'club:eels': [87, 17, 18], 'club:knights': [87, 17, 18],
    'club:panthers': [88, 17, 18], 'club:rabbitohs': [89, 21, 22], 'club:raiders': [84, 16, 17],
    'club:roosters': [89, 20, 22], 'club:seaeagles': [86, 16, 17], 'club:sharks': [86, 16, 17],
    'club:storm': [90, 21, 22], 'club:tigers': [86, 16, 17], 'club:titans': [86, 16, 18], 'club:warriors': [86, 16, 17],
    'era:2000s': [89, 20, 22], 'era:2010s': [90, 22, 23], 'era:2020s': [88, 18, 20], 'final:1998': [90, 21, 23],
    'final:1999': [89, 18, 20], 'final:2000': [90, 22, 23], 'final:2001': [88, 18, 20], 'final:2010': [88, 18, 20],
    'final:2014': [89, 20, 22], 'final:2015': [90, 22, 23], 'final:2016': [89, 20, 22], 'final:2023': [90, 21, 22],
    'final:2024': [90, 21, 22], 'queensland': [89, 19, 21], 'sydney': [89, 18, 21], 'wc:aus-nzl': [89, 17, 21],
    'wc:aus-nzl-eng-fra-sam-ton-fij-png-leb-cok': [89, 19, 21], 'wc:eng-png': [81, 16, 17],
    'wc:fij-cok-sam-ton-png': [81, 16, 17], 'wc:leb-fra-ton-sam': [82, 16, 18], 'wc:nzl-cok-aus-fij': [89, 20, 21],
    'wc:nzl-fij-aus-cok': [89, 19, 22], 'wc:png-leb-eng-ton': [82, 16, 18], 'wc:png-sam-eng-fra': [81, 16, 17],
    'wc:sam-fra': [80, 16, 17], 'wc:ton-leb': [82, 16, 18]
  };
  // A wins day: Tuesday, Thursday, Saturday or Sunday
  function winsDay(date) { return [0, 2, 4, 6].indexOf(weekday(date)) >= 0; }
  // The 27-0 goal for a day from 14 October: { goal } (a squad rating) or { wins }
  function goal270(key, date) {
    var t = TARGETS_270[key] || MIX_DEFAULT;
    if (!winsDay(date)) return { goal: t[0] };
    return { wins: weekday(date) === 0 ? t[2] : t[1] };
  }
  /* From Sunday 18 October 2026 the GOAT (Alex Johnston) is rare in free play (js/draft.js T.goatOut), so the 1000TRIES
     targets of the days whose pool holds him were set again from that day: [normal, hard]. 27-0's goals don't change, and
     every day before keeps its target. The World Cup days ahead carry their own (DAYS below) */
  var GOAT_FROM = '2026-10-18';
  var TARGETS_GOAT = { 'club:rabbitohs': [875, 925], 'sydney': [825, 900], 'era:2010s': [950, 1025], 'era:2020s': [875, 925], 'final:2014': [950, 975] };
  function tgt(key, hard, date) {
    var harder = date >= HARDER_FROM, t = (harder ? TARGETS_HARDER : TARGETS)[key];
    if (t && date >= GOAT_FROM && TARGETS_GOAT[key]) t = TARGETS_GOAT[key].concat(t.slice(2));
    return t ? { t: hard ? t[1] : t[0], g: hard ? t[3] : t[2] } : harder ? { t: 900, g: 86 } : { t: 800, g: 85 };
  }

  // Rewards for completing the Daily (the owner's rotation from 30 Sep 2026: items that barely sell, a Reroll on the hard day)
  var REWARDS = {
    keys: { '1000tries': { legend: 1 }, '27-0': { superstar: 1 } },
    wild: { '1000tries': { reveals: 1 }, '27-0': { ribs: 1 } },
    freeze: { '1000tries': { freezes: 1 }, '27-0': { freezes: 1 } },
    reroll: { '1000tries': { left: 1 }, '27-0': { left: 1 } }
  };
  // Sydney weekday: Sun 0 ... Sat 6. Sunday is the hard day
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild'];
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  /* The planned days (edit here). Anything not listed: an On This Day if a Grand Final was played on that date, else the
     weekly pattern (club days, a region, an era; Sunday is a hard club day). */
  var DAYS = {
    '2026-09-29': { key: 'sydney', name: 'Sydney Clubs', short: 'Sydney Clubs', icon: '🌉', t: 700, who: 'Sydney club players', seasons: 'Sydney club seasons',
      title: 'Sydney Clubs Only',
      story: 'Roosters or Rabbitohs, Eels or Tigers: can you win today without leaving Sydney? Every player you can draft has pulled on a Sydney jersey, from today’s stars to the Balmain, Wests, Norths and St George sides of the early NRL years.',
      g1000: { only: anySeason(SYDNEY) }, g270: { type: 'clubs', clubs: SYDNEY } },
    '2026-09-30': { key: 'premierships', name: 'Premiership Players', short: 'Premiership Players', icon: '🏆',
      who: 'premiership winners from the Roosters and the Knights', seasons: 'Roosters and Knights premiership teams',
      title: 'Premiership Players Only', final: '2001-09-30',
      story: 'Can you build a winner from the squads that already won it all? On this day in 2001 Andrew Johns led the Knights past Parramatta 30-24, and on this day in 2018 the Roosters beat Melbourne 21-6. Ahead of Sunday’s Grand Final between the Knights and the Roosters, every player today was in the Knights’ 2001 squad or the Roosters’ 2002, 2013, 2018 or 2019 squads.',
      g1000: { only: { roosters: [2002, 2013, 2018, 2019], knights: [2001] } },
      g270: { type: 'teams', clubs: ['roosters', 'knights'], teams: { roosters: [2002, 2013, 2018, 2019], knights: [2001] } } },
    '2026-10-01': { key: 'club:storm', name: 'Storm Day', short: 'Storm', icon: MASCOT.storm, final: '2017-10-01', who: 'Storm players', seasons: 'Storm seasons',
      title: 'Storm Players Only',
      story: 'How good is your Storm memory? On this day in 2017 Melbourne thrashed North Queensland 34-6 in Cooper Cronk’s farewell, with Billy Slater taking the Clive Churchill Medal. Every player you can draft today has worn purple.',
      g1000: { only: anySeason(['storm']) }, g270: { type: 'club', clubs: ['storm'] } },
    '2026-10-02': { key: 'final:2016', final: '2016-10-02' },
    '2026-10-03': { key: 'final:2010', final: '2010-10-03' },
    '2026-10-04': { key: 'gf2026', name: 'Grand Final Day', short: 'Roosters and Knights', icon: '🏆', hard: true,
      who: 'Roosters and Knights players', seasons: 'Roosters and Knights seasons',
      title: 'Grand Final Day',
      story: 'It’s Grand Final day, and today is the hard one. Can you build a winner from the two clubs playing tonight? The Knights are in their first decider since 2001, just a year after the wooden spoon, and the Roosters are back for the first time since 2019.',
      g1000: { only: anySeason(['roosters', 'knights']) }, g270: { type: 'final', clubs: ['roosters', 'knights'] } }
  };
  /* World Cup match days (4 Oct 2026, the owner's call): every player has played a Test for one of that day's nations, all
     four on a double-header. NRL-era players only, so each game keeps its own pack, rewards and streaks; the server checks
     each pick's Test nations (packs.json nat, from tools/build_wc.py). A write-up only names that day's own nations (the
     owner's rule). The semis and the final use all ten until the real sides are known (then set them here and push).
     t and g: each game's target, made harder with every other Daily from 7 Oct 2026 (the owner's call, 5 Oct; see
     TARGETS_HARDER). */
  var NATION = { aus: ['Australia', 'Kangaroos'], nzl: ['New Zealand', 'Kiwis'], eng: ['England', 'England'], fra: ['France', 'France'],
    sam: ['Samoa', 'Toa Samoa'], ton: ['Tonga', 'Tonga'], fij: ['Fiji', 'Fiji Bati'], png: ['PNG', 'Kumuls'], leb: ['Lebanon', 'Cedars'],
    cok: ['Cook Islands', 'Cook Islands'] };
  var WC10 = ['aus', 'nzl', 'eng', 'fra', 'sam', 'ton', 'fij', 'png', 'leb', 'cok'];
  // games: the day's games; o: { hard, title, pool (the nations to draft from, when wider than the day's sides), who }
  function wcDay(games, story, t, g, o) {
    o = o || {};
    var keys = [];
    games.forEach(function (m) { m.forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
    var names = list(keys.map(function (k) { return NATION[k][0]; })), all = keys.length === 10, pool = o.pool || keys;
    var who = o.who || (all ? 'World Cup Test players' : names + ' Test players');
    return { key: 'wc:' + pool.join('-'), name: 'World Cup Day', icon: '🌏', t: t, g: g, hard: !!o.hard,
      short: all ? 'World Cup Nations' : keys.length > 2 ? names : NATION[keys[0]][1] + ' and ' + NATION[keys[1]][1],
      who: who, seasons: who,
      title: o.title || games.map(function (m) { return NATION[m[0]][0] + ' v ' + NATION[m[1]][0]; }).join(' and '),
      story: story, g1000: { nations: pool }, g270: { type: 'nations', nations: pool } };
  }
  var SUNDAY = ' It’s Sunday, the hard day, so the bar is higher than usual.';
  DAYS['2026-10-15'] = wcDay([['aus', 'nzl']], 'The World Cup starts tonight with Australia against New Zealand at Allianz Stadium. Can you build a winner from the two sides kicking it off? Every player you can draft has played a Test for the Kangaroos or the Kiwis.', 1175, 89);
  DAYS['2026-10-16'] = wcDay([['sam', 'fra']], 'Samoa meet France at CommBank Stadium tonight. Every player you can draft has played a Test for Samoa or France, so how strong a 13 can you find?', 700, 82);
  DAYS['2026-10-17'] = wcDay([['png', 'leb'], ['eng', 'ton']], 'A World Cup double-header: PNG host Lebanon in Port Moresby, then England meet Tonga in Perth. Every player you can draft has played a Test for one of those four sides.', 950, 84);
  // Fiji and the Cook Islands alone can't always fill a 13 (one halfback, two five-eighths in the NRL era), so the day widens to
  // the other Pacific sides, without naming them (the write-up only names the day's own nations)
  DAYS['2026-10-18'] = wcDay([['fij', 'cok']], 'Fiji take on the Cook Islands in Newcastle. Every player you can draft has played a Test for Fiji, the Cook Islands or another Pacific nation, so who makes your 13?' + SUNDAY, 800, 84,
    { hard: true, pool: ['fij', 'cok', 'sam', 'ton', 'png'], who: 'Pacific Test players' });
  DAYS['2026-10-23'] = wcDay([['ton', 'leb']], 'Tonga meet Lebanon at CommBank Stadium tonight. Every player you can draft has played a Test for Tonga or Lebanon.', 775, 84);
  DAYS['2026-10-24'] = wcDay([['png', 'sam'], ['eng', 'fra']], 'Another World Cup double-header: PNG host Samoa in Port Moresby, then England meet France in Perth. Every player you can draft has played a Test for one of those four sides.', 700, 83);
  DAYS['2026-10-25'] = wcDay([['nzl', 'cok'], ['aus', 'fij']], 'New Zealand play the Cook Islands in Christchurch, then Australia meet Fiji at Suncorp Stadium. Every player you can draft has played a Test for one of those four sides.' + SUNDAY, 1175, 90, { hard: true });
  DAYS['2026-10-30'] = wcDay([['eng', 'png']], 'England meet PNG at WIN Stadium tonight. Every player you can draft has played a Test for England or PNG.', 450, 83);
  DAYS['2026-10-31'] = wcDay([['nzl', 'fij'], ['aus', 'cok']], 'New Zealand play Fiji on the Gold Coast, then Australia meet the Cook Islands in Townsville. Every player you can draft has played a Test for one of those four sides.', 1125, 89);
  DAYS['2026-11-01'] = wcDay([['leb', 'fra'], ['ton', 'sam']], 'The last day of the pool games: Lebanon meet France, then Tonga take on Samoa, both at CommBank Stadium. Every player you can draft has played a Test for one of those four sides.' + SUNDAY, 875, 84, { hard: true });
  DAYS['2026-11-07'] = wcDay([WC10], 'It’s World Cup semi final day in Newcastle. Every player you can draft has played a Test for one of the ten World Cup nations.', 1050, 89, { title: 'World Cup Semi Final' });
  DAYS['2026-11-08'] = wcDay([WC10], 'The second World Cup semi final is tonight at Allianz Stadium. Every player you can draft has played a Test for one of the ten World Cup nations.' + SUNDAY, 1100, 89, { hard: true, title: 'World Cup Semi Final' });
  DAYS['2026-11-15'] = wcDay([WC10], 'It’s World Cup final day at Suncorp Stadium. Can you build a 13 fit for the final? Every player you can draft has played a Test for one of the ten World Cup nations.' + SUNDAY, 1100, 89, { hard: true, title: 'World Cup Final' });

  // How an On This Day reads: why today, what happened, and who you can draft
  var FINAL_STORY = {
    '2016-10-02': 'Can you end a drought like the Sharks did? On this day in 2016, after 49 years of waiting, Cronulla beat Melbourne 14-12 with Andrew Fifita crashing over late for the winning try. Every player today has played for the Sharks or the Storm.',
    '2010-10-03': 'Behind at half-time? No problem. On this day in 2010 St George Illawarra trailed the Roosters 8-6 at the break, then ran in 26 unanswered points to win 32-8 for the joint venture’s first title, with Darius Boyd taking the Clive Churchill Medal. Can you finish as strongly with only Dragons and Roosters players?',
    '2014-10-05': 'Have you got the heart of Sam Burgess? On this day in 2014 he fractured his cheekbone and eye socket in the first tackle, played all 80 minutes and won the Clive Churchill Medal as South Sydney beat Canterbury 30-6 to end a 43-year wait. Every player today has played for the Rabbitohs or the Bulldogs.',
    '2024-10-06': 'Can you build a dynasty? On this day in 2024 Penrith beat Melbourne 14-6 for a fourth straight premiership, the first four in a row since St George in the 1950s and 60s. Every player today has played for the Panthers or the Storm.'
  };

  // The weekly pattern, for days with nothing planned and no Grand Final: club days take turns through the 17 clubs
  var WEEK = ['club', 'club', 'region', 'club', 'era', 'club', 'club']; // Sun ... Sat
  var REGIONS = ['sydney', 'queensland'];
  var ERAS = [['2000s', 2000, 2009], ['2010s', 2010, 2019], ['2020s', 2020, 2026]];
  // What each era day says after its question (the names people remember)
  var ERA_LINE = { '2000s': 'the era of Andrew Johns, Darren Lockyer and a young Billy Slater', '2010s': 'the decade of Johnathan Thurston and the Storm’s big three',
    '2020s': 'from the Panthers’ four-peat to the arrival of the Dolphins' };

  function list(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  function fromFinal(f, date) {
    var y = +f.d.slice(0, 4), w = f.w, l = f.l;
    return { key: 'final:' + y, name: 'On This Day ' + y, short: NICK[w] + ' and ' + NICK[l], icon: MASCOT[w] || '🏆',
      who: NICK[w] + ' and ' + NICK[l] + ' players', seasons: NICK[w] + ' and ' + NICK[l] + ' seasons',
      title: 'On This Day ' + y + ': ' + NICK[w] + ' ' + f.s + ' ' + NICK[l],
      story: FINAL_STORY[f.d] || ('Can you relive a Grand Final? On this day in ' + y + ': ' + f.line + ' Every player today has played for the ' + NICK[w] + ' or the ' + NICK[l] + '.'),
      onThisDay: { date: f.d, w: w, l: l, s: f.s, line: f.line, also: othersOn(date.slice(5), f).map(function (o) { return o.d.slice(0, 4) + ': ' + o.line; }) },
      g1000: { only: anySeason([w, l]) }, g270: { type: 'final', clubs: [w, l] } };
  }
  function auto(date) {
    var f = finalFor(date.slice(5));
    if (f && +f.d.slice(0, 4) < +date.slice(0, 4)) return fromFinal(f, date);
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'region') {
      var r = REGIONS[week % REGIONS.length], clubs = r === 'sydney' ? SYDNEY : QUEENSLAND;
      return { key: r, name: r === 'sydney' ? 'Sydney Clubs' : 'Queensland Clubs', short: r === 'sydney' ? 'Sydney Clubs' : 'Queensland Clubs',
        icon: r === 'sydney' ? '🌉' : '☀️', title: (r === 'sydney' ? 'Sydney' : 'Queensland') + ' Clubs Only',
        who: (r === 'sydney' ? 'Sydney' : 'Queensland') + ' club players', seasons: (r === 'sydney' ? 'Sydney' : 'Queensland') + ' club seasons',
        story: 'Can you win today without leaving ' + (r === 'sydney' ? 'Sydney' : 'Queensland') + '? Every player you can draft has played for a ' + (r === 'sydney' ? 'Sydney' : 'Queensland') + ' club: ' + list(clubs.filter(function (c) { return CLUBS.indexOf(c) !== -1; }).map(function (c) { return NICK[c]; })) + (r === 'sydney' ? ', plus the old Balmain, Wests, Norths and St George sides.' : '.'),
        g1000: { only: anySeason(clubs) }, g270: { type: 'clubs', clubs: clubs } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length];
      return { key: 'era:' + e[0], name: 'The ' + e[0], short: 'The ' + e[0], icon: '🕰️', title: 'The ' + e[0] + ' Only',
        who: 'players from the ' + e[0], seasons: 'seasons from the ' + e[0],
        story: 'How well do you remember the ' + e[0] + '? Every player you can draft today played between ' + e[1] + ' and ' + e[2] + ', ' + ERA_LINE[e[0]] + '.',
        g1000: { years: [e[1], e[2]] }, g270: { type: 'clubs', clubs: null, from: e[1], to: e[2] } };
    }
    // Club days: four a week, taking turns through the 17 clubs
    var slot = [0, 1, -1, 2, -1, 3, 4][wd], c = CLUBS[(week * 5 + slot) % CLUBS.length];
    return { key: 'club:' + c, name: NICK[c] + ' Day', short: NICK[c], icon: MASCOT[c] || '🏉', title: NICK[c] + ' Players Only',
      who: NICK[c] + ' players', seasons: NICK[c] + ' seasons',
      story: [
        c === 'dolphins' ? 'Think you know your Dolphins? Every player you can draft today has played for the NRL’s newest club since it joined in 2023.'
          : 'Think you know your ' + NICK[c] + '? Every player you can draft today has played for them, from the legends to this year’s squad.',
        'It’s ' + NICK[c] + ' Day. Can you build a winner from every ' + NICK[c] + ' player of the NRL era?',
        NICK[c] + ' fans, this one’s for you. Every player you can draft today has worn the jersey, so how high can you go?'
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason([c]) }, g270: { type: 'club', clubs: [c] } };
  }

  function day(date) {
    var plan = DAYS[date], t;
    if (plan && plan.final && !plan.name) {
      var f = FINALS.filter(function (x) { return x.d === plan.final; })[0];
      t = fromFinal(f, date);
      if (plan.key) t.key = plan.key;
    } else if (plan) {
      t = JSON.parse(JSON.stringify(plan));
      if (plan.final) {
        var pf = FINALS.filter(function (x) { return x.d === plan.final; })[0];
        t.onThisDay = { date: pf.d, w: pf.w, l: pf.l, s: pf.s, line: pf.line, also: othersOn(date.slice(5), pf).map(function (o) { return o.d.slice(0, 4) + ': ' + o.line; }) };
      }
    } else t = auto(date);
    t.date = date;
    t.planned = !!plan;
    t.hard = !!(t.hard || (!plan && weekday(date) === 0));
    t.onThisDay = t.onThisDay || null;
    // Targets: a planned day's own (t: 1000TRIES, g: 27-0), else the calibrated ones for its pool
    var cal = tgt(t.key, t.hard, date);
    t.g1000.target = (plan && plan.t) || cal.t;
    t.g270.goal = (plan && plan.g) || cal.g;
    if (date >= MIX_FROM) { // 27-0's rating or wins goal (MIX_FROM)
      var m = goal270(t.key, date);
      if (m.wins) { delete t.g270.goal; t.g270.wins = m.wins; } else t.g270.goal = m.goal;
    }
    var rk = WEEK_REWARD[weekday(date)];
    if (t.hard) rk = 'reroll';
    t.rewardKind = rk;
    t.reward = JSON.parse(JSON.stringify(REWARDS[rk]));
    return t;
  }

  // "1 Legend Key", "1 Run It Back", "1 Reroll" (the reward line in both games)
  var ITEM_NAMES = { legend: ['Legend Key', 'Legend Keys'], superstar: ['Superstar Key', 'Superstar Keys'], reveals: ['Reveal', 'Reveals'],
    ribs: ['Run It Back', 'Run It Backs'], freezes: ['Streak Freeze', 'Streak Freezes'], left: ['Reroll', 'Rerolls'], removes: ['Remove Player', 'Remove Players'],
    ilegs: ['World Legend Pick', 'World Legend Picks'], wcps: ['88+ Pick', '88+ Picks'], imms: ['Immortal Pick', 'Immortal Picks'], goats: ['GOAT', 'GOATs'] }; // the last four: the owner's Give Items
  function itemsText(items) {
    return Object.keys(items || {}).filter(function (k) { return items[k] > 0; }).map(function (k) {
      var n = items[k], nm = ITEM_NAMES[k] || [k, k];
      return n + ' ' + (n === 1 ? nm[0] : nm[1]);
    }).join(' + ');
  }
  var ITEM_ICONS = { legend: '⭐', superstar: '🌟', reveals: '👀', ribs: '⏪', freezes: '🧊', left: '🔄', removes: '❌', ilegs: '👑', wcps: '🌏', imms: '🏛️', goats: '🐐' };
  // Where a reward item is used (the result card's line under "added to your Vault"), from the Shop's own descriptions
  var ITEM_USE = { legend: 'Use it in 1000+ to swap an offer for a Legends Pick.', superstar: 'Use it in 27-0 Classic or Pack: your next spin has a 95+ player.',
    reveals: 'Use it in your next draft to see the hidden numbers.', ribs: 'Use it after a 27-0 Classic season and your closest loss becomes a win.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh roll.', removes: 'Use it to take a player out of your 13.' };
  // A Daily reward lasts 24 hours (5 Oct 2026); a Streak Freeze keeps
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  /* Streak rewards (the owner's ladder, 28 Sep 2026): every 10 days, in-game items only, growing to 50 days, then 6 Rerolls
     and a Streak Freeze every 10 days, with the 50-day reward again at 100, 150 and so on */
  function streakReward(days) {
    if (!days || days % 10) return null;
    if (days % 50 === 0) return { left: 10, legend: 3, superstar: 3 };
    // One Streak Freeze at a time (2 Oct 2026, the owner's call): a prize gives one, the rest of its old freezes as Rerolls
    // (and the server swaps that one for a Reroll too if a freeze is already waiting)
    if (days > 50) return { left: 6, freezes: 1 };
    return ({ 10: { left: 5 }, 20: { legend: 3, superstar: 3 }, 30: { reveals: 5, ribs: 3 }, 40: { freezes: 1, reveals: 5, left: 2 } })[days] || null;
  }
  function nextStreakReward(days) {
    var next = (Math.floor((days || 0) / 10) + 1) * 10;
    return { days: next, left: next - (days || 0), items: streakReward(next) };
  }

  var api = { day: day, finals: FINALS, nick: NICK, mascot: MASCOT, clubs: CLUBS, sydney: SYDNEY, queensland: QUEENSLAND,
    itemsText: itemsText, itemIcons: ITEM_ICONS, useText: useText, streakReward: streakReward, nextStreakReward: nextStreakReward, TARGETS: TARGETS,
    HARDER_FROM: HARDER_FROM, TARGETS_HARDER: TARGETS_HARDER, MIX_FROM: MIX_FROM, TARGETS_270: TARGETS_270 };
  root.CAST_DAILY = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
