/* global require */ // only on the server, where this file is loaded with require (see below)
/* 25000 RUNS Daily calendar (15 Oct 2026): the BBL twin of the shared CAST Daily calendar (js/cast-daily.js, loaded first),
   copied from 4000 GOALS' js/afl-daily.js. It keeps the shared rewards, item names and streak ladder, and swaps in BBL days:
   club days taking turns through the 8 clubs, a city day (the Sydney clubs, the Melbourne clubs, or the other four), an
   era day (BBL01 to 05, 06 to 10, 11 to 15), and Sunday as the hard club day, the same weekly pattern as 1000TRIES. Each
   player gets their own random draft within the theme.

   CAST_DAILY.day('YYYY-MM-DD') gives the same shape as the shared calendar:
     { date, key, name, short, icon, title, story, who, hard, planned, onThisDay: null,
       g1000: { target, only, years }, reward, rewardKind } */
(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  var NICK = { strikers: 'Strikers', heat: 'Heat', hurricanes: 'Hurricanes', renegades: 'Renegades', stars: 'Stars', scorchers: 'Scorchers',
    sixers: 'Sixers', thunder: 'Thunder' };
  var MASCOT = { strikers: '⚡', heat: '🔥', hurricanes: '🌪️', renegades: '🎭', stars: '⭐', scorchers: '☀️', sixers: '6️⃣', thunder: '⛈️' };
  function dayName(c) { return NICK[c]; }
  var CLUBS = ['sixers', 'stars', 'scorchers', 'heat', 'thunder', 'strikers', 'renegades', 'hurricanes'];
  var CITIES = { sydney: ['sixers', 'thunder'], melbourne: ['stars', 'renegades'], rest: ['strikers', 'heat', 'hurricanes', 'scorchers'] };
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }

  /* Targets (15 Oct 2026): [normal, hard (Sundays)] */
  var TARGETS = {
    'club:strikers': [19300, 20250], 'club:heat': [16300, 17075], 'club:hurricanes': [16250, 17000], 'club:renegades': [17875, 19225],
    'club:stars': [19050, 19875], 'club:scorchers': [17650, 18800], 'club:sixers': [17175, 18025], 'club:thunder': [14525, 15475],
    'city:sydney': [16725, 17625], 'city:melbourne': [19000, 20525], 'city:rest': [20225, 22350],
    'era:bbl01': [21775, 23425], 'era:bbl06': [23725, 25725], 'era:bbl11': [23075, 24725]
  };
  /* From Sunday 18 October 2026 the GOAT (Chris Lynn) is rare in free play (js/draft.js T.goatOut), so the targets of the days
     whose pool holds him were set again from that day: [normal, hard]. Every day before keeps its target */
  var GOAT_FROM = '2026-10-18';
  var TARGETS_GOAT = { 'club:strikers': [16700, 17500], 'era:bbl01': [20575, 22175], 'club:heat': [13900, 14600], 'era:bbl06': [22825, 24700], 'city:rest': [19175, 21125], 'era:bbl11': [22225, 23775] };
  /* The All-Rounder spot (17 Oct 2026, the owner: the Daily plays as it did before): the days whose pool has few
     all-rounders, and light ones (the Sixers, the Thunder, the Sydney Derby and the Heat), were set again from AR_FROM, the
     first of them with the All-Rounder spot live: [normal, hard]. Every other day, and every day before, keeps its target */
  var AR_FROM = '2026-10-20';
  var TARGETS_AR = { 'club:sixers': [16125, 17100], 'club:thunder': [13600, 14325], 'city:sydney': [15450, 16350], 'club:heat': [12925, 13800] };
  function tgt(key, hard, date) { var t = date >= AR_FROM && TARGETS_AR[key] || date >= GOAT_FROM && TARGETS_GOAT[key] || TARGETS[key]; return t ? (hard ? t[1] : t[0]) : (hard ? 18000 : 17000); }

  var REWARDS = { keys: { bigbash: { legend: 1 } }, wild: { bigbash: { reveals: 1 } }, freeze: { bigbash: { freezes: 1 } }, reroll: { bigbash: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; // Sun ... Sat, as the shared calendar
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  // The planned days (edit here): { key, name, short, icon, title, who, story, t (target), g1000: { only | years } }
  var DAYS = {};

  var WEEK = ['club', 'club', 'city', 'club', 'era', 'club', 'club']; // Sun ... Sat
  var CITY_ORDER = ['sydney', 'melbourne', 'rest'];
  // Seasons are named by the year they start (BBL01 is 2011/12)
  var ERAS = [['bbl01', 'BBL01 to BBL05', 2011, 2015, 'from the Sixers winning the first title to the Thunder winning BBL05'],
    ['bbl06', 'BBL06 to BBL10', 2016, 2020, 'from the Scorchers’ third title to the Sixers going back to back'],
    ['bbl11', 'BBL11 to BBL15', 2021, 2025, 'from the Scorchers’ back-to-back titles to the Heat and the Hurricanes lifting the trophy']];
  function list(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'city') {
      var c = CITY_ORDER[week % CITY_ORDER.length], clubs = CITIES[c];
      var nm = c === 'sydney' ? 'Sydney Derby' : c === 'melbourne' ? 'Melbourne Derby' : 'Beyond the Derbies';
      return { key: 'city:' + c, name: nm, short: nm, icon: c === 'rest' ? '🗺️' : '🏙️', title: nm, who: list(clubs.map(function (k) { return NICK[k]; })) + ' players',
        story: c === 'rest' ? 'No Sydney or Melbourne clubs today. Every player you can draft has played for the ' + list(clubs.map(function (k) { return NICK[k]; })) + '.'
          : 'It’s derby day. Every player you can draft has played for the ' + list(clubs.map(function (k) { return NICK[k]; })) + '.',
        g1000: { only: anySeason(clubs) } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length];
      return { key: 'era:' + e[0], name: e[1], short: e[1], icon: '🕰️', title: e[1] + ' Only', who: 'players from ' + e[1],
        story: 'How well do you remember ' + e[1] + '? Every player you can draft today played in those seasons, ' + e[4] + '.',
        g1000: { years: [e[2], e[3]] } };
    }
    // Club days: five a week, taking turns through the 8 clubs
    var slot = [0, 1, -1, 2, -1, 3, 4][wd], k = CLUBS[(week * 5 + slot) % CLUBS.length];
    return { key: 'club:' + k, name: dayName(k) + ' Day', short: dayName(k), icon: MASCOT[k] || '🏏', title: dayName(k) + ' Players Only',
      who: dayName(k) + ' players',
      story: [
        'Think you know your ' + dayName(k) + '? Every player you can draft today has played for them, from BBL01 to this summer.',
        'It’s ' + dayName(k) + ' Day. Can you build a winner from every ' + dayName(k) + ' player in Big Bash history?',
        dayName(k) + ' fans, this one’s for you. Every player you can draft today has worn the kit, so how high can you go?'
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason([k]) } };
  }

  function day(date) {
    var plan = DAYS[date], t = plan ? JSON.parse(JSON.stringify(plan)) : auto(date);
    t.date = date;
    t.planned = !!plan;
    t.hard = !!(t.hard || (!plan && weekday(date) === 0));
    t.onThisDay = null;
    t.g1000.target = (plan && plan.t) || tgt(t.key, t.hard, date);
    t.g270 = {};
    var rk = t.hard ? 'reroll' : WEEK_REWARD[weekday(date)];
    t.rewardKind = rk;
    t.reward = JSON.parse(JSON.stringify(REWARDS[rk]));
    return t;
  }

  // Where a reward item is used, in 25000 RUNS' words
  var ITEM_USE = { legend: 'Use it in 25000+ to swap an offer for a Legends Pick.', reveals: 'Use it in your next draft to see the hidden runs.',
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
