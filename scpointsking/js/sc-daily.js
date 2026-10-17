/* global require */ // only on the server, where this file is loaded with require (see below)
/* SC Daily calendar (17 Oct 2026): the SC twin of the shared CAST Daily calendar (js/cast-daily.js, loaded first). It
   keeps the shared rewards, item names and streak ladder, and swaps in SC days: club days taking turns through the
   clubs, a season day (one season, 2015 on: the seasons with SC hookers), a derby day (two clubs), an era day, and
   Sunday as the hard club day, the same weekly pattern as 1000TRIES. The spins are seeded, so everyone's go 1 is the
   same draft. No Legend Key or GOAT in a Daily.

   CAST_DAILY.day('YYYY-MM-DD') gives the same shape as the shared calendar:
     { date, key, name, short, lead, icon, title, story, who, hard, planned, onThisDay: null,
       g1000: { target, only, years }, reward, rewardKind } */
(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  var NICK = { broncos: 'Broncos', raiders: 'Raiders', bulldogs: 'Bulldogs', sharks: 'Sharks', dolphins: 'Dolphins', titans: 'Titans',
    seaeagles: 'Sea Eagles', storm: 'Storm', knights: 'Knights', cowboys: 'Cowboys', eels: 'Eels', panthers: 'Panthers', rabbitohs: 'Rabbitohs',
    dragons: 'Dragons', roosters: 'Roosters', warriors: 'Warriors', tigers: 'Wests Tigers' };
  var MASCOT = { broncos: '🐎', raiders: '🟢', bulldogs: '🐶', sharks: '🦈', dolphins: '🐬', titans: '⚡', seaeagles: '🦅', storm: '⛈️',
    knights: '⚔️', cowboys: '🤠', eels: '🐍', panthers: '🐆', rabbitohs: '🐰', dragons: '🐉', roosters: '🐓', warriors: '🛡️', tigers: '🐯' };
  // Club days in turn (the Dolphins, with four seasons, share theirs with the Broncos: Brisbane Day)
  var CLUBS = ['rabbitohs', 'storm', 'broncos', 'panthers', 'roosters', 'eels', 'sharks', 'cowboys', 'dragons', 'raiders', 'seaeagles',
    'bulldogs', 'knights', 'warriors', 'titans', 'tigers'];
  var WITH = { broncos: ['broncos', 'dolphins'] };
  var DERBIES = [['rabbitohs', 'roosters', 'The Oldest Rivalry'], ['broncos', 'cowboys', 'The Queensland Derby'], ['storm', 'panthers', 'Grand Final Rivals'],
    ['eels', 'tigers', 'The Western Sydney Derby'], ['dragons', 'sharks', 'The Southern Sydney Derby'], ['bulldogs', 'eels', 'The Western Derby'],
    ['seaeagles', 'roosters', 'The Harbour Derby'], ['knights', 'raiders', 'The Country Clash']];
  // Seasons with SC hookers (the position began in 2015): one season a day, in turn
  var SEASONS = [2021, 2015, 2024, 2018, 2023, 2016, 2026, 2019, 2022, 2017, 2025, 2020];
  var ERAS = [['2015', '2015 to 2020', 2015, 2020, 'from Johnathan Thurston and Cameron Smith to Nathan Cleary and Jason Taumalolo'],
    ['2021', 'Since 2021', 2021, 2026, 'from Tom Trbojevic’s record year to the 2026 season'],
    ['2012', '2012 to 2019', 2012, 2019, 'from Corey Parker and Paul Gallen to the first SC hookers']];
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }
  function list(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  function orList(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1] : a.join(''); }

  /* Targets: [normal, hard (Sundays)], set with the real-engine smart-fan simulator on each theme's own pool, no
     wildcards, as the Daily deals (kept with the game's private notes) */
  var TARGETS = {
    'club:broncos': [17250, 17800], 'club:bulldogs': [16350, 16800], 'club:cowboys': [17000, 17450], 'club:dragons': [16700, 17150], 'club:eels': [17150, 17700], 'club:knights': [15650, 16200], 'club:panthers': [17050, 17700], 'club:rabbitohs': [17000, 17700], 'club:raiders': [16750, 17150], 'club:roosters': [17600, 18050], 'club:seaeagles': [17000, 17550], 'club:sharks': [17150, 17650], 'club:storm': [17550, 18050], 'club:tigers': [16000, 16400], 'club:titans': [16200, 16700], 'club:warriors': [16000, 16450],
    'derby:broncos-cowboys': [17150, 17750], 'derby:bulldogs-eels': [16950, 17700], 'derby:dragons-sharks': [17050, 17650], 'derby:eels-tigers': [16650, 17400], 'derby:knights-raiders': [16250, 16750], 'derby:rabbitohs-roosters': [17800, 18300], 'derby:seaeagles-roosters': [17650, 18150], 'derby:storm-panthers': [17650, 18250],
    'season:2015': [16750, 17300], 'season:2016': [17250, 17850], 'season:2017': [17250, 17700], 'season:2018': [16400, 16900], 'season:2019': [16900, 17350], 'season:2020': [14700, 15100], 'season:2021': [17150, 17850], 'season:2022': [17600, 18050], 'season:2023': [17800, 18450], 'season:2024': [17800, 18350], 'season:2025': [18150, 18700], 'season:2026': [18900, 19600],
    'era:2012': [16950, 17550], 'era:2015': [16800, 17350], 'era:2021': [18100, 18650]
  };
  function tgt(key, hard) { var t = TARGETS[key]; return t && t[0] ? (hard ? t[1] : t[0]) : (hard ? 16500 : 15500); }

  var REWARDS = { keys: { sc: { legend: 1 } }, wild: { sc: { reveals: 1 } }, freeze: { sc: { freezes: 1 } }, reroll: { sc: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; // Sun ... Sat, as the shared calendar
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  // The planned days (edit here): { key, name, short, lead, icon, title, who, story, t (target), g1000: { only | years } }
  var DAYS = {};

  var WEEK = ['club', 'club', 'club', 'season', 'club', 'era', 'derby']; // Sun ... Sat
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'derby') {
      var dv = DERBIES[week % DERBIES.length], names = [NICK[dv[0]], NICK[dv[1]]];
      return { key: 'derby:' + dv[0] + '-' + dv[1], name: dv[2], short: names.join(' and '), lead: 'With ', icon: '⚔️',
        title: names.join(' and ') + ' Seasons Only', who: names.join(' and ') + ' seasons',
        story: dv[2] + ': every season you can draft today was played for the ' + orList(names) + '. Pick the best of both.',
        g1000: { only: anySeason([dv[0], dv[1]]) } };
    }
    if (kind === 'season') {
      var y = SEASONS[week % SEASONS.length];
      return { key: 'season:' + y, name: 'The ' + y + ' Season', short: y + ' Only', lead: 'From ', icon: '📅', title: 'The ' + y + ' Season Only',
        who: y + ' seasons', story: 'One season, every club: every player you can draft today played in ' + y + '. How well do you remember it?',
        g1000: { years: [y, y] } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length];
      return { key: 'era:' + e[0], name: e[1], short: e[1], lead: e[0] === '2021' ? '' : 'From ', icon: '🕰️', title: e[1] + ' Only', who: 'seasons ' + (e[0] === '2021' ? 'since 2021' : 'from ' + e[1]),
        story: 'Every season you can draft today was played ' + (e[0] === '2021' ? 'since 2021' : 'from ' + e[1]) + ', ' + e[4] + '.',
        g1000: { years: [e[2], e[3]] } };
    }
    // Club days: four a week, taking turns through the clubs (a week starts one club on, so a Sunday and the Monday
    // after never share one)
    var slot = [0, 1, 2, -1, 3, -1, -1][wd], k = CLUBS[(week * 4 + slot) % CLUBS.length], clubs = WITH[k] || [k];
    var nick = clubs.length > 1 ? 'Brisbane' : NICK[k], whoN = clubs.map(function (c) { return NICK[c]; });
    return { key: 'club:' + k, name: nick + ' Day', short: nick, lead: 'With ', icon: MASCOT[k] || '🏉', title: (clubs.length > 1 ? list(whoN) : NICK[k]) + ' Seasons Only',
      who: (clubs.length > 1 ? list(whoN) : NICK[k]) + ' seasons',
      story: [
        'It’s ' + nick + ' Day. Every season you can draft today was played for the ' + orList(whoN) + ', from 2009 to 2026.',
        'Think you know your ' + (clubs.length > 1 ? 'Brisbane footy' : NICK[k]) + '? Every season on the spinner today was played for the ' + orList(whoN) + '.',
        nick + ' fans, this one’s for you. Every season you can draft today was played for the ' + orList(whoN) + ', so how high can you go?'
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason(clubs) } };
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

  var ITEM_USE = { legend: 'Use it in Classic to swap a spin for a Legends Pick.', reveals: 'Use it in your next draft to see one season’s SC points.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh spin.', removes: 'Use it to take a player out of your 13.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: NICK, mascot: MASCOT, clubs: CLUBS, derbies: DERBIES, seasons: SEASONS, eras: ERAS,
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // the server: its own copy, the shared one untouched
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
