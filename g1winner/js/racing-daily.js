  










(function (root) {
  'use strict';
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  

  var TARGETS = {
    'dec:1980': [320, 345], 'dec:2000': [525, 565], 'dec:2010': [525, 565], 'dec:2020': [555, 580],
    'era:2000': [510, 550], 'era:2013': [515, 555],
    'spring': [185, 200]
  };
  function tgt(key, hard) { var t = TARGETS[key]; return t ? (hard ? t[1] : t[0]) : (hard ? 520 : 500); }

  var REWARDS = { keys: { racing: { legend: 1 } }, wild: { racing: { reveals: 1 } }, freeze: { racing: { freezes: 1 } }, reroll: { racing: { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; 
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  
  var DAYS = {};

  
  var YEARS = [['dec:1980', '1980s and 1990s', 1983, 1999, 'the years of Dittman, Dye, Beadman and the young Damien Oliver', 'the 1980s and 1990s'],
    ['dec:2000', '2000s', 2000, 2009, 'from Northerly and Sunline to Makybe Diva', 'the 2000s'],
    ['era:2000', '2000 to 2012', 2000, 2012, 'from Northerly and Sunline to Black Caviar', '2000 to 2012'],
    ['dec:2010', '2010s', 2010, 2019, 'the Black Caviar and Winx years', 'the 2010s'],
    ['era:2013', 'Since 2013', 2013, 2026, 'the Winx years and the jockeys riding today', 'the years since 2013'],
    ['dec:2020', '2020s', 2020, 2026, 'the jockeys riding today', 'the 2020s']];
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), week = Math.floor((n + 4) / 7); 
    if (wd === 6) {
      return { key: 'spring', name: 'Spring Carnival', short: 'Spring Carnival', icon: '🌸', title: 'Melbourne Wins Only',
        who: 'jockeys with a Group 1 in Melbourne',
        story: 'It’s Spring Carnival day. Every jockey you can draft has won a Group 1 at Flemington, Caulfield, Moonee Valley or Sandown, and only those wins count.',
        g1000: { ds: 'vic', unit: 'Melbourne Group 1 wins' } };
    }
    
    var e = YEARS[(week + wd) % YEARS.length];
    return { key: e[0], name: e[1], short: e[1], icon: e[0].indexOf('dec:') === 0 ? '📅' : '🕰️', title: e[1] + ' Only', who: 'Group 1 winners from ' + e[5],
      story: 'How well do you remember ' + e[5] + '? Every jockey you can draft today won a Group 1 in those years, ' + e[4] + '.' +
        (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { years: [e[2], e[3]] } };
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

  
  var ITEM_USE = { legend: 'Use it in the main mode to swap an offer for a Legends Pick.', reveals: 'Use it in your next draft to see the hidden wins.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh roll.', removes: 'Use it to take a jockey off your card.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: {}, mascot: {}, clubs: [], cities: {},
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; 
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
