  








(function (root) {
  'use strict';
  
  var shared = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./cast-daily.js') : (root.CAST_DAILY || {});

  var NICK = { ad: 'Crows', bl: 'Lions', ca: 'Blues', cw: 'Magpies', es: 'Bombers', fr: 'Dockers', ge: 'Cats', gc: 'Suns',
    gw: 'Giants', hw: 'Hawks', me: 'Demons', nm: 'Kangaroos', pa: 'Power', ri: 'Tigers', sk: 'Saints', sy: 'Swans', wc: 'Eagles',
    wb: 'Bulldogs', bb: 'Bears', fi: 'Fitzroy' };
  var MASCOT = { ad: '🐦‍⬛', bl: '🦁', ca: '💙', cw: '🖤', es: '🔴', fr: '⚓', ge: '🐱', gc: '☀️', gw: '🧡', hw: '🤎', me: '😈',
    nm: '🦘', pa: '⚡', ri: '🐯', sk: '😇', sy: '🦢', wc: '🦅', wb: '🐶' };
  
  var DAY_NAME = { es: 'Essendon' };
  function dayName(c) { return DAY_NAME[c] || NICK[c]; }
  
  var CLUBS = ['cw', 'ca', 'es', 'ri', 'hw', 'ge', 'sy', 'bl', 'wc', 'ad', 'pa', 'fr', 'me', 'nm', 'sk', 'wb', 'gw', 'gc'];
  
  var VICTORIA = ['ca', 'cw', 'es', 'ge', 'hw', 'me', 'nm', 'ri', 'sk', 'wb', 'fi'];
  var INTERSTATE = ['ad', 'bl', 'bb', 'fr', 'gc', 'gw', 'pa', 'sy', 'wc'];
  function anySeason(clubs) { var o = {}; clubs.forEach(function (c) { o[c] = []; }); return o; }

  

  var TARGETS = {
    'club:ad': [4525, 4750], 'club:bl': [4425, 4600], 'club:ca': [3850, 4000], 'club:cw': [3350, 3500],
    'club:es': [3400, 3550], 'club:fr': [3475, 3625], 'club:gc': [3175, 3275], 'club:ge': [4225, 4450],
    'club:gw': [3950, 4025], 'club:hw': [4150, 4350], 'club:me': [3600, 3750], 'club:nm': [3875, 4050],
    'club:pa': [3500, 3625], 'club:ri': [3225, 3375], 'club:sk': [3625, 3800], 'club:sy': [3850, 4025],
    'club:wb': [3975, 4150], 'club:wc': [3750, 3925],
    'victoria': [4200, 4450], 'interstate': [4350, 4625], 'era:1990s': [4275, 4550], 'era:2000s': [4700, 4950],
    'era:2010s': [4575, 4850], 'era:2020s': [4200, 4500]
  };
  function tgt(key, hard) { var t = TARGETS[key]; return t ? (hard ? t[1] : t[0]) : (hard ? 3500 : 3200); }

  var REWARDS = { keys: { '4000goals': { legend: 1 } }, wild: { '4000goals': { reveals: 1 } }, freeze: { '4000goals': { freezes: 1 } }, reroll: { '4000goals': { left: 1 } } };
  var WEEK_REWARD = ['reroll', 'freeze', 'keys', 'wild', 'freeze', 'keys', 'wild']; 
  function weekday(date) { var p = date.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])).getUTCDay(); }
  function dayNum(date) { var p = date.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }

  
  var DAYS = {};

  var WEEK = ['club', 'club', 'region', 'club', 'era', 'club', 'club']; 
  var REGIONS = ['victoria', 'interstate'];
  var ERAS = [['1990s', 1990, 1999], ['2000s', 2000, 2009], ['2010s', 2010, 2019], ['2020s', 2020, 2026]];
  var ERA_LINE = { '1990s': 'the decade of Wayne Carey, Michael Voss and Essendon’s Baby Bombers',
    '2000s': 'the era of the Lions’ three-peat, Matthew Lloyd and Barry Hall',
    '2010s': 'from the Hawks’ three-peat to Buddy Franklin in red and white',
    '2020s': 'from Richmond’s dynasty to the Cats, the Pies and the Lions lifting the cup' };
  
  var CLUB_LINE = { gc: 'the Suns since they joined in 2011', gw: 'the Giants since they joined in 2012', bl: 'the Lions since the merger in 1997',
    pa: 'Port Adelaide since they joined in 1997', fr: 'the Dockers since they joined in 1995' };

  function list(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''); }
  function auto(date) {
    var n = dayNum(date), wd = weekday(date), kind = WEEK[wd], week = Math.floor((n + 3) / 7);
    if (kind === 'region') {
      var r = REGIONS[week % REGIONS.length], vic = r === 'victoria', clubs = vic ? VICTORIA : INTERSTATE;
      var nm = vic ? 'Victorian Clubs' : 'Interstate Clubs';
      return { key: r, name: nm, short: nm, icon: vic ? '🏙️' : '🗺️', title: nm + ' Only', who: (vic ? 'Victorian' : 'interstate') + ' club players',
        story: vic ? 'Can you win today without leaving Victoria? Every player you can draft has played for a Victorian club: ' + list(VICTORIA.filter(function (c) { return CLUBS.indexOf(c) !== -1; }).map(function (c) { return NICK[c]; })) + ', plus Fitzroy.'
          : 'Can you win today with no Victorian clubs? Every player you can draft has played for the ' + list(INTERSTATE.filter(function (c) { return CLUBS.indexOf(c) !== -1; }).map(function (c) { return NICK[c]; })) + ', or the old Brisbane Bears.',
        g1000: { only: anySeason(clubs) } };
    }
    if (kind === 'era') {
      var e = ERAS[week % ERAS.length];
      return { key: 'era:' + e[0], name: 'The ' + e[0], short: 'The ' + e[0], icon: '🕰️', title: 'The ' + e[0] + ' Only',
        who: 'players from the ' + e[0],
        story: 'How well do you remember the ' + e[0] + '? Every player you can draft today played between ' + e[1] + ' and ' + e[2] + ', ' + ERA_LINE[e[0]] + '.',
        g1000: { years: [e[1], e[2]] } };
    }
    
    var slot = [0, 1, -1, 2, -1, 3, 4][wd], c = CLUBS[(week * 5 + slot) % CLUBS.length];
    return { key: 'club:' + c, name: dayName(c) + ' Day', short: dayName(c), icon: MASCOT[c] || '🏉', title: dayName(c) + ' Players Only',
      who: dayName(c) + ' players',
      story: [
        CLUB_LINE[c] ? 'Think you know your ' + dayName(c) + '? Every player you can draft today has played for ' + CLUB_LINE[c] + '.'
          : 'Think you know your ' + dayName(c) + '? Every player you can draft today has played for them, from the 1990 squad to this year’s.',
        'It’s ' + dayName(c) + ' Day. Can you build a winner from every ' + dayName(c) + ' player of the AFL era?',
        dayName(c) + ' fans, this one’s for you. Every player you can draft today has worn the jumper, so how high can you go?'
      ][week % 3] + (wd === 0 ? ' It’s Sunday, the hard day, so the bar is higher than usual.' : ''),
      g1000: { only: anySeason([c]) } };
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

  
  var ITEM_USE = { legend: 'Use it in 4000+ to swap an offer for a Legends Pick.', reveals: 'Use it in your next draft to see the hidden goals.',
    freezes: 'If you miss a day, it keeps your streak alive by itself.', left: 'Use it in your next draft for a fresh roll.', removes: 'Use it to take a player out of your 18.' };
  function useText(items) {
    var k = Object.keys(items || {})[0], n = 0;
    Object.keys(items || {}).forEach(function (x) { if (x !== 'freezes') n += +items[x] || 0; });
    return ((k && ITEM_USE[k]) || 'It is in your Vault for your next game.') + (n > 1 ? ' They last 24 hours.' : n ? ' It lasts 24 hours.' : '');
  }

  var api = Object.assign({}, shared, { day: day, finals: [], nick: NICK, mascot: MASCOT, clubs: CLUBS, victoria: VICTORIA, interstate: INTERSTATE,
    useText: useText, TARGETS: TARGETS, TARGETS_HARDER: TARGETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; 
  else root.CAST_DAILY = api;
})(typeof window !== 'undefined' ? window : globalThis);
