/* global require */ // only on the server, where this file is loaded with require (see below)
/* 500 GOALS Daily calendar (17 Oct 2026): the Premier League twin of the shared CAST Daily calendar (js/cast-daily.js,
   loaded first), copied from 25000 RUNS' js/bbl-daily.js. It keeps the shared rewards, item names and streak ladder, and
   swaps in Premier League days: club days taking turns through the clubs with the longest Premier League histories, a
   derby day (North London, Merseyside, Manchester, Tyne-Wear), an era day (the 1990s, 2000s, 2010s, 2020s), and Sunday
   as the hard club day, the same weekly pattern as 1000TRIES. Each player gets their own random draft within the theme.
   The club facts come from the league's own records (tools/make_game_files.py writes them between the @facts lines).

   CAST_DAILY.day('YYYY-MM-DD') gives the same shape as the shared calendar:
     { date, key, name, short, icon, title, story, who, hard, planned, onThisDay: null,
       g1000: { target, only, years }, reward, rewardKind } */
(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  // The names fans use on a club day (the owner's rule: the club's own name, never a nickname that sounds like a slogan)
  var NICK = { arsenal: 'Arsenal', manutd: 'Man United', liverpool: 'Liverpool', chelsea: 'Chelsea', spurs: 'Spurs', mancity: 'Man City',
    everton: 'Everton', newcastle: 'Newcastle', villa: 'Aston Villa', westham: 'West Ham', southampton: 'Southampton', palace: 'Crystal Palace',
    fulham: 'Fulham', leicester: 'Leicester', blackburn: 'Blackburn', sunderland: 'Sunderland', boro: 'Middlesbrough', wolves: 'Wolves',
    bolton: 'Bolton', westbrom: 'West Brom', leeds: 'Leeds', stoke: 'Stoke', brighton: 'Brighton', bournemouth: 'Bournemouth' };
  var MASCOT = {};
  function dayName(c) { return NICK[c]; }
  var CLUBS = ['arsenal', 'manutd', 'liverpool', 'chelsea', 'spurs', 'mancity', 'everton', 'newcastle', 'villa', 'westham', 'southampton',
    'palace', 'fulham', 'leicester', 'blackburn', 'sunderland', 'boro', 'wolves', 'bolton', 'westbrom', 'leeds', 'stoke', 'brighton', 'bournemouth'];
  var CITIES = { northlondon: ['arsenal', 'spurs'], merseyside: ['liverpool', 'everton'], manchester: ['manutd', 'mancity'], tynewear: ['newcastle', 'sunderland'] };
  var DERBY = { northlondon: 'North London Derby', merseyside: 'Merseyside Derby', manchester: 'Manchester Derby', tynewear: 'Tyne-Wear Derby' };
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }

  // @facts (tools/make_game_files.py: each club's top Premier League scorer, from the league's own records)
  var FACTS = {
    bournemouth: ['Joshua King', 48], arsenal: ['Thierry Henry', 175], villa: ['Ollie Watkins', 91],
    barnsley: ['Neil Redfearn', 10], birmingham: ['Mikael Forssell', 29], blackburn: ['Alan Shearer', 112],
    blackpool: ['DJ Campbell', 13], bolton: ['Kevin Davies', 68], bradford: ['Dean Windass', 13],
    brentford: ['Yoane Wissa', 45], brighton: ['Danny Welbeck', 46], burnley: ['Chris Wood', 49],
    cardiff: ['Jordon Mutch', 7], charlton: ['Jason Euell', 34], chelsea: ['Frank Lampard', 147],
    coventry: ['Dion Dublin', 61], palace: ['Wilfried Zaha', 68], derby: ['Dean Sturridge', 32],
    everton: ['Romelu Lukaku', 68], fulham: ['Clint Dempsey', 50], huddersfield: ['Steve Mounié', 9],
    hull: ['Nikica Jelavić', 12], ipswich: ['Marcus Stewart', 25], leeds: ['Mark Viduka', 59],
    leicester: ['Jamie Vardy', 145], liverpool: ['Mohamed Salah', 191], luton: ['Carlton Morris', 11],
    mancity: ['Sergio Agüero', 184], manutd: ['Wayne Rooney', 183], boro: ['Hámilton Ricard', 31],
    newcastle: ['Alan Shearer', 148], norwich: ['Chris Sutton', 33], forest: ['Chris Wood', 38],
    oldham: ['Graeme Sharp', 16], portsmouth: ['Yakubu', 28], qpr: ['Les Ferdinand', 60],
    reading: ['Kevin Doyle', 19], sheffutd: ['Brian Deane', 15], sheffwed: ['Mark Bright', 48],
    southampton: ['Matt Le Tissier', 100], stoke: ['Peter Crouch', 45], sunderland: ['Kevin Phillips', 61],
    swansea: ['Gylfi Sigurdsson', 34], swindon: ['Jan Åge Fjørtoft', 12], spurs: ['Harry Kane', 213],
    watford: ['Troy Deeney', 47], westbrom: ['Peter Odemwingie', 30], westham: ['Michail Antonio', 68],
    wigan: ['Hugo Rodallega', 24], wimbledon: ['Dean Holdsworth', 58], wolves: ['Raúl Jiménez', 40]
  };
  // @end

  /* Targets: [normal, hard (Sundays)], where a thoughtful fan wins about 1 in 4 days and 1 in 10 Sundays, like 1000TRIES'
     Daily (the real engine, ~/cast-dev/epl/tools/strat.js with each theme's pool) */
  // @targets (tools/daily_targets.sh)
  var TARGETS = {
    'club:arsenal': [470, 505], 'club:manutd': [590, 640], 'club:liverpool': [580, 640], 'club:mancity': [475, 525],
    'club:spurs': [540, 595], 'club:chelsea': [545, 600], 'club:palace': [315, 345], 'club:southampton': [410, 465],
    'club:newcastle': [395, 430], 'club:everton': [445, 485], 'club:villa': [490, 540], 'club:westham': [385, 415],
    'club:wolves': [255, 280], 'club:boro': [315, 345], 'club:blackburn': [350, 375], 'club:leicester': [425, 470],
    'club:fulham': [325, 365], 'club:sunderland': [320, 355], 'club:stoke': [350, 370],
    'club:bournemouth': [250, 270], 'club:brighton': [275, 305], 'club:bolton': [335, 365],
    'club:westbrom': [355, 390], 'club:leeds': [375, 405], 'city:manchester': [540, 595],
    'city:northlondon': [515, 575], 'city:tynewear': [365, 405], 'city:merseyside': [525, 590],
    'era:e90s': [350, 400], 'era:e00s': [395, 440], 'era:e20s': [450, 525], 'era:e10s': [455, 525]
  };
  // @end
  function tgt(key, hard) { var t = TARGETS[key]; return t ? (hard ? t[1] : t[0]) : (hard ? 330 : 300); }

  var REWARDS = { keys: { epl: { legend: 1 } }, wild: { epl: { reveals: 1 } }, freeze: { epl: { freezes: 1 } }, reroll: { epl: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; // Sun ... Sat, as the shared calendar
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  // The planned days (edit here): { key, name, short, icon, title, who, story, t (target), g1000: { only | years } }
  var DAYS = {};

  var WEEK = ['club', 'club', 'city', 'club', 'era', 'club', 'club']; // Sun ... Sat
  var CITY_ORDER = ['northlondon', 'merseyside', 'manchester', 'tynewear'];
  // Seasons are named by the year they start (1992 is 1992-93)
  var ERAS = [['e90s', 'The 1990s', 1992, 1999, 'from Manchester United winning the first Premier League title in 1992-93 to the end of the decade'],
    ['e00s', 'The 2000s', 2000, 2009, 'when Arsenal went the whole of 2003-04 unbeaten'],
    ['e10s', 'The 2010s', 2010, 2019, 'when Leicester won the 2015-16 title and Manchester City reached 100 points in 2017-18'],
    ['e20s', 'The 2020s', 2020, 2026, 'from 2020-21 to this season']];
  function list(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  function fact(k) { var f = FACTS[k]; return f ? ' ' + f[0] + ' leads their Premier League scorers with ' + f[1] + ' goals.' : ''; }
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'city') {
      var c = CITY_ORDER[week % CITY_ORDER.length], clubs = CITIES[c], nm = DERBY[c];
      return { key: 'city:' + c, name: nm, short: nm, icon: '⚔️', title: nm, who: list(clubs.map(function (k) { return NICK[k]; })) + ' players',
        story: 'It’s derby day. Every player you can draft has played Premier League football for ' + list(clubs.map(function (k) { return NICK[k]; })) + '.',
        g1000: { only: anySeason(clubs) } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length];
      return { key: 'era:' + e[0], name: e[1], short: e[1], icon: '🕰️', title: e[1] + ' Only', who: 'players from ' + e[1].replace('The', 'the'),
        story: 'How well do you remember ' + e[1].replace('The', 'the') + '? Every player you can draft today played in those seasons, ' + e[4] + '.',
        g1000: { years: [e[2], e[3]] } };
    }
    // Club days: five a week, taking turns through the clubs
    var slot = [0, 1, -1, 2, -1, 3, 4][wd], k = CLUBS[(week * 5 + slot) % CLUBS.length];
    return { key: 'club:' + k, name: dayName(k) + ' Day', short: dayName(k), icon: MASCOT[k] || '🏟️', title: dayName(k) + ' Players Only',
      who: dayName(k) + ' players',
      story: [
        'Think you know your ' + dayName(k) + '? Every player you can draft today has played for them in the Premier League.' + fact(k),
        'It’s ' + dayName(k) + ' Day. Can you build a winner from every ' + dayName(k) + ' player in Premier League history?' + fact(k),
        dayName(k) + ' fans, this one’s for you. Every player you can draft today has worn the shirt, so how high can you go?' + fact(k)
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason([k]) } };
  }

  function day(date) {
    var plan = DAYS[date], t = plan ? JSON.parse(JSON.stringify(plan)) : auto(date);
    t.date = date;
    t.planned = !!plan;
    t.hard = !!(t.hard || (!plan && weekday(date) === 0));
    t.onThisDay = null;
    t.g1000.target = (plan && plan.t) || tgt(t.key, t.hard);
    t.g270 = {};
    var rk = t.hard ? 'reroll' : WEEK_REWARD[weekday(date)];
    t.rewardKind = rk;
    t.reward = JSON.parse(JSON.stringify(REWARDS[rk]));
    return t;
  }

  // Where a reward item is used, in 500 GOALS' words
  var ITEM_USE = { legend: 'Use it in 500+ to swap an offer for a Legends Pick.', reveals: 'Use it in your next draft to see the hidden goals.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh roll.', removes: 'Use it to take a player out of your XI.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: NICK, mascot: MASCOT, clubs: CLUBS, cities: CITIES,
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // the server: its own copy, the shared one untouched
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
