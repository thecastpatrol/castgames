/* 60000 RUNS render: builds HTML for each screen piece. No game logic here. */
(function (T) {
  'use strict';

  var R = T.render = {};

  // What the total counts: Test runs, Legends included (every player counts his whole Test career, so one label does)
  T.totalLabel = function () { return T.ERA_LABEL; };

  var esc = R.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  var clubVars = R.clubVars = function (slug) {
    var c = T.club(slug);
    return '--club:' + c.primary + ';--club-accent:' + c.accent + ';--club-text:' + c.text + ';';
  };

  var GOAT = ' <span class="goat" role="img" aria-label="GOAT">&#x1F410;</span>';

  // Player name, plus the goat for AJ
  var nameHtml = R.nameHtml = function (p, text) {
    return esc(text == null ? p.name : text) + (T.isGoat(p) ? GOAT : '');
  };

  // The GOAT, Hall of Famers and Legends each get their own look wherever a player is drawn
  function goatCls(p) {
    // Promos: Dally M platinum, or a premier in his club's colours with the silver edge (is-prem); the medal winner gold
    var pm = T.promoTier ? T.promoTier(p) : '', prem = pm && T.promoKind && T.promoKind() === 'prem';
    if (T.isIntlLegend && T.isIntlLegend(p)) return ' is-ileg'; // World Legends: his nation's look with gold edges
    return T.isGoat(p) ? ' is-goat' : T.isImmortal(p) ? ' is-immortal' : T.isLegend(p) ? ' is-legend' : pm ? (prem ? ' is-prem' : ' is-plat') + (pm === 'medal' ? ' is-medal' : '') : '';
  }
  /* Nation looks (5 Oct 2026, the owner's calls; js/cast-nations.js draws them, as in 27-0): a World Cup 200+ card's
     nation band, the team tiles (full colour, the name and runs in dark boxes) and the home card's chips. 60000 RUNS has
     no World Cup mode, and the shared looks are rugby league jerseys for only some Test nations, so every Test nation
     shows its cap colours instead (T.NO_LOOKS). The GOAT, Hall of Famers, Legends and promo cards keep their own looks */
  T.NO_LOOKS = true;
  function look(slug, w, h, level, p) {
    var N = window.CastNations;
    if (T.NO_LOOKS || !N || !N.has(slug) || (p && goatCls(p) && !T.isIntlLegend(p))) return ''; // a World Legend keeps his nation's look
    return '<span class="wc-look" aria-hidden="true">' + N.svg(slug, w, h, level ? { level: level } : null) + '</span>';
  }
  var TIER_LABEL = { immortal: 'Hall of Famer', legend: 'Legend' };
  // Promos: a medal after a medal winner's name and a trophy after a premier's (the owner's calls)
  function medalMark(p) { var lk = T.promoLook ? T.promoLook(p) : null; return lk && lk.mark ? lk.mark : ''; }
  function tierTag(p) {
    // A World Legend's card says Legend, so his nation's name still fits beside it (the owner, 8 Oct 2026)
    if (T.isIntlLegend && T.isIntlLegend(p)) return '<span class="pcard-tier pcard-il">&#x1F451; Legend</span>';
    if (p && p.tier) return '<span class="pcard-tier">' + (T.isGoat(p) ? '&#x1F410; GOAT' : (p.tier === 'immortal' ? '&#x1F410; ' : '&#x2B50; ') + TIER_LABEL[p.tier]) + '</span>';
    var lk = T.promoLook ? T.promoLook(p) : null;
    return lk ? '<span class="pcard-tier pcard-pm">' + esc(lk.label) + '</span>' : '';
  }

  function posChips(p) {
    return T.positionsOf(p).map(function (c) {
      return '<span class="chip" title="' + esc(T.POS_NAMES[c] || c) + '">' + esc(T.posLabel(c)) + '</span>';
    }).join('');
  }

  // World Cup 200+ (5 Oct 2026, the owner's calls): Tests played and the years, and a badge for every nation a player
  // played Tests for when there's more than one, in the order they first played (Alex Johnston: Australia then PNG; Tyson
  // Frizell: Wales too). Other nations come with their own colours (tools/build_wc.py)
  // The years: "2009 to 2019", or one year once ("2026")
  function years(p) {
    var y = String(p.career_span || '').split('-');
    return !y[0] ? '' : !y[1] || y[1] === y[0] ? esc(y[0]) : esc(y[0] + ' to ' + y[1]);
  }
  // World Cup 200+ shows the Tests and the years (the owner: "so you know what era they were from")
  function span(p) {
    if (p.tests) return p.tests + ' Test' + (p.tests === 1 ? '' : 's') + (years(p) ? ' &middot; ' + years(p) : '');
    return years(p);
  }
  function nationBadges(p) {
    var cy = p.club_years || [], xs = p.other_sides || [];
    if (!p.tests || cy.length + xs.length < 2) return '';
    var all = cy.map(function (c) { var cl = T.club(c.club); return { code: cl.abbr, c1: cl.primary, c2: cl.accent, from: c.from || 9999, name: cl.name, n: c.tests || 0 }; })
      .concat(xs.map(function (x) { return { code: x.code, c1: x.c1, c2: x.c2, from: x.from || 9999, name: x.name, n: x.tests || 0 }; }))
      .sort(function (a, b) { return a.from - b.from; });
    return '<span class="pcard-nats">' + all.map(function (x) {
      return '<i style="--n1:' + esc(x.c1) + ';--n2:' + esc(x.c2) + '" title="' + esc(x.name + ': ' + x.n + ' Test' + (x.n === 1 ? '' : 's')) + '">' + esc(x.code) + '</i>';
    }).join('') + '</span>';
  }

  /* HOME */

  var MODE_CARD = {
    exact: { ico: '&#x1F3AF;', line: 'Hit 60000 on the dot. Not 59,999, not 60001', chips: ['Roll 3, Pick 1', '15s a Pick', 'Paid Wildcards'] },
    plus:  { ico: '&#x1F3CF;', line: 'Get to 60000 or more', chips: ['Roll 3, Pick 1', '3 Wildcards'] },
    spin:  { ico: '&#x1F3B0;', line: 'Pick a position, then spin', chips: ['Spin, Pick 1', '3 Wildcards'] },
    nrlw:  { ico: '&#x2B50;', line: 'Get to ' + T.DATASETS.nrlw.target + ' or more', chips: ['Roll 3, Pick 1', '3 Wildcards'] }, // the hidden second pack
    wc:    { ico: '&#x1F30F;', line: 'Get to ' + T.DATASETS.wc.target + ' Test runs or more', chips: ['Roll 3, Pick 1', '3 Wildcards', 'Test Players'] },
    ou:    { ico: '&#x2195;&#xFE0F;', line: 'More or fewer? Call it before the clock runs out' } // Follow On
  };

  /* Home modes (29 Sep 2026, the user's call): 4000+ is the main mode, one big card with a clear Play button; the others
     are three small buttons in a row under it (each keeps its colour and one tag). A tap on any of them starts it. */
  var MINI_TAG = { exact: 'Hard Mode', spin: 'Know Your Squads', nrlw: 'Second Pack', wc: 'Test Runs', ou: 'New &middot; Beat the Clock' };
  /* Follow On's home card (as Play On's, 15 Oct 2026, the owner: "lower, under the Daily, it shouldn't take away from the other modes"):
     its own full-width card under the Daily Challenge (js/app.js placeOu), not in More Modes */
  R.ouCard = function () {
    // A small live look at the game (the owner, 15 Oct 2026: "more exciting, actual visuals"): two mini player cards in
    // their nation's colours, one number showing (no comma, as on the Follow On cards) and one hidden, the Over and Under arrows pulsing between them, and NEW
    var mini = function (club, nm, num) {
      return '<span class="oup-card' + (num ? '' : ' is-q') + '" style="' + clubVars(club) + '"><i>' + esc(nm.toUpperCase()) + '</i><b>' + (num || '?') + '</b></span>'; // the player's name in his club's colours (the owner)
    };
    return '<button type="button" class="mode-mini is-ou oup" data-mode="ou" aria-label="Play Follow On">' +
      '<span class="oup-new">New</span>' +
      '<span class="oup-pair" aria-hidden="true">' + mini('ind', 'Tendulkar', '15921') + '<span class="oup-arrows"><em class="is-up">&#x25B2;</em><em class="is-dn">&#x25BC;</em></span>' + mini('aus', 'Ponting', '') + '</span>' +
      '<span class="oup-t"><b>Follow On</b><small>More Test runs or fewer? Beat the clock.</small></span><span class="oup-go" aria-hidden="true">&#x25B6;</span></button>';
  };
  // The same live look for its banner in the home slider (the owner, 15 Oct 2026: "more enticing, like the card below")
  R.ouBanner = function () {
    var mini = function (club, nm, num) {
      return '<span class="oup-card' + (num ? '' : ' is-q') + '" style="' + clubVars(club) + '"><i>' + esc(nm.toUpperCase()) + '</i><b>' + (num || '?') + '</b></span>';
    };
    return '<span class="oup-pair" aria-hidden="true">' + mini('ind', 'Tendulkar', '15921') + '<span class="oup-arrows"><em class="is-up">&#x25B2;</em><em class="is-dn">&#x25BC;</em></span>' + mini('aus', 'Ponting', '') + '</span>' +
      '<span class="spot-promo-txt"><em class="oup-kick">New Mode</em><b>Follow On</b><small>More Test runs or fewer? Beat the clock.</small></span><span class="oup-play" aria-hidden="true">&#x25B6;</span>';
  };
  /* World Cup 200+ (4 Oct 2026, the owner's call): once launched, a big card the same size as 4000+ until the final on
     15 Nov, in the World Cup nations' colours (flags when the owner's designs arrive), then a small one with the others.
     opt.wc: 'top', 'under' (a guest's first visit keeps 4000+ first), 'mini' or null; opt.guest: Sign In to Play */
  var WC_NATIONS = ['aus', 'nzl', 'eng', 'fra', 'sam', 'ton', 'fij', 'png', 'leb', 'cok'];
  R.wcCard = function (selected, guest, free) { // free: a guest's free World Cup today (Play Free)
    var m = T.MODES.wc, c = MODE_CARD.wc;
    var strip = WC_NATIONS.map(function (k) {
      var cl = T.club(k);
      var lk = look(k, 30, 22, 2);
      return '<i' + (lk ? ' class="has-look"' : '') + ' style="--n1:' + cl.primary + ';--n2:' + cl.secondary + ';--n3:' + (cl.third || cl.secondary) + '">' + (lk ? lk + '<span>' + cl.abbr + '</span>' : cl.abbr) + '</i>';
    }).join('');
    return '<button type="button" class="mode-card mode-main is-wc' + (selected === 'wc' ? ' is-on' : '') + '" data-mode="wc" aria-label="' + (guest ? 'Sign in to play ' : free ? 'Play free: ' : 'Play ') + esc(m.name) + '">' +
      '<span class="mode-tag mode-tag-wc">World Cup</span>' +
      '<span class="mode-wc-strip" aria-hidden="true">' + strip + '</span>' +
      '<span class="mode-ico" aria-hidden="true">' + c.ico + '</span>' +
      '<span class="mode-name">' + esc(m.name) + '</span>' +
      '<span class="mode-line">Draft 18 Test players. ' + esc(c.line) + '</span>' +
      '<span class="mode-chips">' + c.chips.map(function (t) { return '<span class="mode-chip">' + esc(t) + '</span>'; }).join('') + '</span>' +
      '<span class="mode-go" aria-hidden="true">' + (guest ? 'Sign In to Play' : free ? 'Play Free' : 'Play Now') + ' <i>&#x25B6;</i></span>' +
      '</button>';
  };
  R.modePicker = function (selected, opt) {
    opt = opt || {};
    var m = T.MODES.plus, c = MODE_CARD.plus;
    var main = '<button type="button" class="mode-card mode-main' + (selected === 'plus' ? ' is-on' : '') + '" data-mode="plus" aria-label="Play ' + esc(m.name) + '">' +
      '<span class="mode-tag">Classic</span>' +
      '<span class="mode-ico" aria-hidden="true">' + c.ico + '</span>' +
      '<span class="mode-name">' + esc(m.name) + '</span>' +
      '<span class="mode-line">Draft a Test XI. ' + esc(c.line) + ' Test runs</span>' +
      '<span class="mode-chips">' + c.chips.map(function (t) { return '<span class="mode-chip">' + esc(t) + '</span>'; }).join('') + '</span>' +
      '<span class="mode-go" aria-hidden="true">Play Now <i>&#x25B6;</i></span>' +
      '</button>';
    var wc = opt.wc === 'top' || opt.wc === 'under' ? R.wcCard(selected, opt.guest, opt.free) : '';
    // Follow On (1000TRIES's Six Again for Test cricket): first in More Modes once it's on (launched, or the private link)
    var more = (opt.ou ? ['ou'] : []).concat(['exact', 'spin', 'nrlw']).concat(opt.wc === 'mini' ? ['wc'] : []).filter(function (id) { return id !== 'nrlw' || T.DATASETS.nrlw.live; }).map(function (id) {
      var mm = T.MODES[id] || { name: 'Follow On' };
      return '<button type="button" class="mode-mini is-' + id + (id === selected ? ' is-on' : '') + '" data-mode="' + id + '" aria-label="Play ' + esc(mm.name) + '">' +
        '<span class="mm-ico" aria-hidden="true">' + MODE_CARD[id].ico + '</span><span class="mm-name">' + esc(mm.name) + '</span><span class="mm-tag">' + MINI_TAG[id] + '</span></button>';
    });
    return (opt.wc === 'top' ? wc + main : main + wc) + '<div class="mode-more-kicker">More Modes</div><div class="mode-more" style="--n:' + (more.length - (opt.ou ? 1 : 0)) + '">' + more.join('') + '</div>';
  };

  /* DRAFT */

  R.helper = function (S) {
    var total = T.total();
    var d = T.TARGET - total;
    if (S.mode.rule === 'exact') {
      if (d > 0) return { text: T.fmt(d) + ' to go', cls: '' };
      if (d === 0) return { text: 'Exactly ' + T.fmt(T.TARGET) + ' \uD83C\uDFAF', cls: 'is-good' };
      return { text: 'Over by ' + T.fmt(-d), cls: 'is-bad' };
    }
    if (d > 0) return { text: T.fmt(d) + ' to go', cls: '' };
    return { text: 'Target hit, ' + T.fmt(-d) + ' to spare', cls: 'is-good' };
  };

  R.scoreboard = function (S) {
    var total = T.total();
    var h = R.helper(S);
    return '<div class="sb-inner">' +
      '<div class="sb-left">' +
        '<span class="sb-mode">' + esc(S.mode.name) + '</span>' +
        '<span class="sb-picks">' + T.filledCount() + ' / ' + T.SLOTS.length + ' picked</span>' +
      '</div>' +
      '<div class="sb-center">' +
        '<span class="sb-total" id="sbTotal">' + T.fmt(total) + '</span>' +
        '<span class="sb-of">/ ' + T.fmt(T.TARGET) + '</span>' +
      '</div>' +
      '<div class="sb-right">' +
        '<span class="sb-help ' + h.cls + '">' + esc(h.text) + '</span>' +
      '</div>' +
      '<div class="sb-bar" id="sbBar"><div class="sb-fill" id="sbFill"></div><span class="sb-gain" id="sbGain"></span></div>' +
      // A Daily go: today's challenge, always in view (the scoreboard stays at the top); a tap opens the whole challenge
      (S.daily && S.daily.task ? '<button type="button" class="sb-daily" data-dly="remind" aria-label="See today&rsquo;s Daily Challenge">' +
        '<span class="sb-daily-k">' + (S.daily.icon || '&#x1F4C5;') + ' Daily Challenge &middot; Go ' + S.daily.go + ' of ' + (S.daily.of || 3) + '</span>' +
        '<span class="sb-daily-t">' + S.daily.task + '</span><span class="sb-daily-i" aria-hidden="true">&#x24D8;</span></button>' : '') +
      '</div>';
  };

  // Progress bar heats up as the total closes in on 1000
  R.barLook = function (S, total) {
    var k = total / T.TARGET;
    if (S.mode.rule === 'exact' && total > T.TARGET) return { color: '#f87171', glow: 'rgba(248,113,113,.6)', stage: 'bust' };
    if (k >= 1) return { color: '#4ade80', glow: 'rgba(74,222,128,.65)', stage: 'hit' };
    if (k >= 0.9) return { color: '#ff5a36', glow: 'rgba(255,90,54,.65)', stage: 'hot' };
    if (k >= 0.75) return { color: '#fb923c', glow: 'rgba(251,146,60,.55)', stage: 'warm' };
    if (k >= 0.5) return { color: '#ff8f84', glow: 'rgba(255,143,132,.5)', stage: 'mid' }; // 60000 RUNS (16 Oct 2026): cool blues, then the game's own colour, never gold
    if (k >= 0.25) return { color: '#3f86d6', glow: 'rgba(63,134,214,.4)', stage: 'low' };
    return { color: '#3b5b8a', glow: 'rgba(59,91,138,.3)', stage: 'cold' };
  };

  // The ground from above: the top six batting across the top two rows, the keeper at the stumps on the pitch, the four
  // bowlers below (as 25000 RUNS, 15 Oct 2026)
  var ROWS = [[0, 1, 2], [3, 4, 5], [6], [7, 8], [9, 10]];

  R.pitch = function (S, flashIdx) {
    return ROWS.map(function (row) {
      return '<div class="pitch-row">' + row.map(function (i) {
        var s = S.slots[i];
        var p = s.player;
        var tweakable = S.tweakMode && p;
        var sub = S.subMode, subCan = sub && sub.from == null && p && T.subTargets(i).length, subNo = sub && sub.from == null && p && !subCan;
        var subTo = sub && sub.from != null && !p && T.subTargets(sub.from).indexOf(i) !== -1, subFrom = sub && sub.from === i;
        if (subTo) return '<button type="button" class="slot is-empty is-subto" data-slot="' + i + '" aria-label="Move here: ' + esc(T.POS_NAMES[s.code]) + '"><span class="slot-code">' + T.posLabel(s.code) + '</span><span class="slot-pos">' + esc(T.POS_NAMES[s.code]) + '</span></button>';
        if (subCan || subFrom) tweakable = true;
        if (!p) {
          var choosing = S.mode.source === 'spin' && !S.offer && !S.spinPos && !S.awaitingLock && !S.tweakMode && !S.finished;
          var chosen = S.spinPos === s.code && (S.spinSlot == null || S.spinSlot === i);
          return '<div class="slot is-empty' + (choosing ? ' is-choose' : '') + (chosen ? ' is-chosen' : '') + '" data-slot="' + i + '"><span class="slot-code">' + T.posLabel(s.code) + '</span><span class="slot-pos">' + esc(T.POS_NAMES[s.code]) + '</span></div>';
        }
        var club = T.slotClub(s);
        var c = T.club(club), lk = look(club, 84, 70, 2, p);
        return '<' + (tweakable ? 'button type="button"' : 'div') + ' class="slot is-filled' + (lk ? ' has-look' : '') + goatCls(p) + (sub ? (subFrom ? ' is-subfrom' : subCan ? ' is-subcan' : subNo ? ' is-subno' : '') : tweakable ? ' is-tweakable' : '') + (flashIdx === i ? ' is-flash' : '') + '" data-slot="' + i + '" style="' + clubVars(club) + (lk ? '--wc-field:' + window.CastNations.field(club) + ';' : '') + '"' +
          (tweakable ? ' aria-label="' + (sub ? 'Move ' : 'Swap out ') + esc(p.name) + '"' : '') + '>' + lk +
          '<span class="slot-code">' + T.posLabel(s.code) + '</span>' +
          '<span class="slot-abbr">' + (T.isGoat(p) ? '<span role="img" aria-label="GOAT">&#x1F410;</span>' : esc(c.abbr)) + '</span>' +
          '<span class="slot-name">' + esc(T.surname(p.name)) + medalMark(p) + '</span>' +
          '<span class="slot-tries">' + T.fmt(p.tries_1998_plus) + '</span>' +
          (tweakable ? '</button>' : '</div>');
      }).join('') + '</div>';
    }).join('');
  };

  R.wildcardBar = function (S) {
    if (!S.mode.wildcards) return '';
    var sub = R.subButton(S), key = R.keyTile(S), goat = R.goatTile(S), imm = R.immTile(S), il = R.ilTile(S), extras = (sub ? 1 : 0) + (key ? 1 : 0) + (goat ? 1 : 0) + (imm ? 1 : 0) + (il ? 1 : 0), five = extras >= 2;
    var paid = !!S.mode.paidOnly;
    // Five tools (4000+ with a CAST Profile): Reroll, Reveal and Remove across the top with short one-word names, so the
    // three are exactly even on a phone, then Substitute and the Legend Key underneath
    var SHORT = { reroll: 'Reroll', scout: 'Reveal', tweak: 'Remove' };
    // The game's own and the saved ones as one total from the first pick ("13 left"), so a bought pack is never out of sight
    // (11 Oct 2026: a player thought his 12 Remove Players were gone)
    var savedN = function (k) {
      var A = window.CastAccount;
      if (paid || S.finished || !S.mode.wildcards || S.wcLocked || !A || !A.canUseSaved || !A.canUseSaved()) return 0;
      var n = k === 'reroll' ? (A.rerollsSaved ? A.rerollsSaved() : 0) : k === 'tweak' ? (A.removesSaved ? A.removesSaved() : 0) : A.itemSaved ? A.itemSaved('reveal') : 0;
      return n > 0 ? n : 0;
    };
    return '<div class="wildcards' + (extras === 4 ? ' has-7' : extras === 3 ? ' has-6' : five ? ' has-5' : extras ? ' has-4' : '') + (paid ? ' is-paid' : '') + '" role="group" aria-label="Wildcards">' +
      ['reroll', 'scout', 'tweak'].map(function (k) {
        var left = S.wildcards[k];
        var usable = T.canUse(k);
        // Hard Mode: one paid use of each a game, then it's done
        if (paid && !left && (S.paidUsed || {})[k] && !(k === 'tweak' && S.tweakMode)) {
          return '<button type="button" class="wc wc-' + k + ' is-spent" disabled title="One of each wildcard a game in Exactly 4000">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + { reroll: '&#x1F504;', scout: '&#x1F440;', tweak: '&#x274C;' }[k] + '</span> ' + esc(five ? SHORT[k] : T.WILDCARDS[k].label) + '</span>' +
            '<span class="wc-left">Used</span></button>';
        }
        // A guest once CAST Pass launches: wildcards come with a free CAST Profile (sign in and they unlock in this game)
        if (S.wcLocked && !left && !S.finished) {
          return '<button type="button" class="wc wc-' + k + ' wc-lock" data-action="wc-signin" title="Sign in free to use wildcards">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + { reroll: '&#x1F504;', scout: '&#x1F440;', tweak: '&#x274C;' }[k] + '</span> ' + esc(k === 'reroll' && S.mode.source === 'spin' ? 'Respin' : T.WILDCARDS[k].label) + '</span>' +
            '<span class="wc-left"><span aria-hidden="true">&#x1F512;</span> Sign in free</span></button>';
        }
        // Rerolls used up: a saved one ("2 saved") or one to buy, in a pop-up over the game (CastAccount.buyReroll)
        if (k === 'reroll' && !left && !S.finished && S.mode.wildcards && window.CastAccount && CastAccount.canBuyReroll && (CastAccount.canBuyReroll() || (CastAccount.canUseSaved && CastAccount.canUseSaved() && CastAccount.rerollsSaved() > 0))) {
          // Just bought: "N ready", glowing, so they tap it and watch the roll
          var sv = CastAccount.rerollsSaved(), live = !!(S.offer && S.offer.players.length), fresh = !!(sv && CastAccount.rerollsFresh && CastAccount.rerollsFresh());
          return '<button type="button" class="wc wc-reroll wc-buy' + (fresh ? ' ca-rr-fresh' : '') + '" data-action="buy-reroll"' + (live ? '' : ' disabled') + ' title="' + (sv ? 'Use one of your saved rerolls' : 'Buy an extra reroll') + '">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F504;</span> ' + (S.mode.source === 'spin' ? 'Respin' : 'Reroll') + '</span><span class="wc-left">' + (sv ? sv + (fresh ? ' ready' : ' left') : 'Buy &middot; $0.99') + '</span></button>';
        }
        // Remove Player used up: a saved one ("2 saved") or one to buy, the same way (CastAccount.buyRemove)
        if (k === 'tweak' && !left && !S.finished && S.mode.wildcards && window.CastAccount && CastAccount.canBuyRemove && (CastAccount.canBuyRemove() || (CastAccount.canUseSaved && CastAccount.canUseSaved() && CastAccount.removesSaved() > 0))) {
          var rs = CastAccount.removesSaved(), can = T.filledCount() > 0 && !S.subMode, rfresh = !!(rs && CastAccount.removesFresh && CastAccount.removesFresh());
          return '<button type="button" class="wc wc-tweak wc-buy' + (rfresh ? ' ca-rr-fresh' : '') + '" data-action="buy-remove"' + (can ? '' : ' disabled') + ' title="' + (rs ? 'Use one of your saved Remove Players' : 'Buy an extra Remove Player') + '">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x274C;</span> ' + esc(five ? SHORT.tweak : T.WILDCARDS.tweak.label) + '</span><span class="wc-left">' + (rs ? rs + (rfresh ? ' ready' : ' left') : 'Buy &middot; $0.99') + '</span></button>';
        }
        // Reveal Runs used up: a saved one or one to buy, the same way (CastAccount.buyItem('reveal')), while the offer is hidden
        if (k === 'scout' && !left && !S.finished && S.mode.wildcards && window.CastAccount && CastAccount.buyItem && CastAccount.canBuyReroll && (CastAccount.canBuyReroll() || (CastAccount.canUseSaved && CastAccount.canUseSaved() && CastAccount.itemSaved('reveal') > 0))) {
          var vs = CastAccount.itemSaved('reveal'), hidden = !!(S.offer && S.offer.players.some(function (p) { return !R.triesShown(S, p); }));
          var vok = hidden && !S.tweakMode && !S.subMode, vfresh = !!(vs && CastAccount.itemFresh('reveal'));
          return '<button type="button" class="wc wc-scout wc-buy' + (vfresh ? ' ca-rr-fresh' : '') + '" data-action="buy-reveal"' + (vok ? '' : ' disabled') + ' title="' + (vs ? 'Use one of your saved Reveals' : 'Buy an extra Reveal') + '">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F440;</span> ' + esc(five ? SHORT.scout : T.WILDCARDS.scout.label) + '</span><span class="wc-left">' + (vs ? vs + (vfresh ? ' ready' : ' left') : 'Buy &middot; $0.99') + '</span></button>';
        }
        // Rerolls used up: the same button offers one more (YouTube subscribe, or sign in first); never in Hard Mode
        if (k === 'reroll' && !left && !S.finished && !paid && window.CastAccount && CastAccount.bonusState && CastAccount.bonusState() !== 'none') {
          var guest = CastAccount.bonusState() === 'signin';
          return '<button type="button" class="wc wc-reroll wc-bonus" data-action="bonus-reroll" title="' + (guest ? 'Sign in for an extra reroll every game' : 'Subscribe on YouTube for a free extra reroll') + '">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F504;</span> ' + (S.mode.source === 'spin' ? 'Respin' : 'Reroll') + '</span><span class="wc-left">' + (guest ? '+1: sign in' : '&#x25B6; +1 free') + '</span></button>';
        }
        var armed = k === 'tweak' && S.tweakMode;
        var label = k === 'reroll' && S.mode.source === 'spin' ? 'Respin' : five ? SHORT[k] : T.WILDCARDS[k].label;
        var ico = { reroll: '&#x1F504;', scout: '&#x1F440;', tweak: '&#x274C;' }[k];
        return '<button type="button" class="wc wc-' + k + (left ? '' : ' is-spent') + (armed ? ' is-armed' : '') + '" data-wildcard="' + k + '"' +
          ((usable || armed) ? '' : ' disabled') + ' title="' + esc(T.WILDCARDS[k].desc) + '">' +
          '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + ico + '</span> ' + esc(label) + '</span>' +
          '<span class="wc-left">' + (left ? (left + savedN(k)) + ' left' : paid ? '15+ to buy' : 'Used') + '</span>' +
          '</button>';
      }).join('') + sub + key + goat + imm + il + '</div>' +
      (paid && !S.finished ? '<p class="wc-paid-note">Hard Mode: no free wildcards. One of each a game.</p>' : '');
  };
  /* The GOAT (bought in the Shop, one item for every CAST draft game, 16 Oct 2026): in the main mode and Exactly,
     never the Daily or a friend's challenge. "Ready" (or "N Left") with one to use, "Buy" without, "Spot Taken" while no
     open spot fits him; never shown where there is no GOAT. A tap asks first, then swaps the offer for him */
  function goatName() { var g = T.goatPlayer && T.goatPlayer(); return g ? g.name : 'The GOAT'; }
  function goatGoals() { var g = T.goatPlayer && T.goatPlayer(); return g ? T.fmt(g.tries_1998_plus) : ''; }
  R.goatTile = function (S) {
    var A = window.CastAccount;
    if (S.finished || S.challenge || S.daily || S.goatUsed || !(S.mode.id === 'plus' || S.mode.id === 'exact') || !T.goatPlayer || !T.goatPlayer()) return '';
    if (!A || !A.itemSaved || !A.isSignedIn || !A.isSignedIn()) return '';
    var n = A.itemSaved('goat'), buy = !(n > 0);
    if (buy && !(A.canBuyReroll && A.canBuyReroll())) return ''; // under 15: only one already in the Vault
    var ok = T.goatFits() && !S.tweakMode && !S.subMode, room = T.goatRoom();
    return '<button type="button" class="wc wc-goat' + (ok && !buy ? ' is-ready' : '') + (buy ? ' wc-buy' : '') + '" data-action="goat"' + (ok ? '' : ' disabled') +
      ' title="' + (ok ? esc(goatName()) + ', ' + goatGoals() + ' Test runs, as your next pick' : room ? 'Ready for your next offer' : 'No open spot fits ' + esc(goatName())) + '"><span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F410;</span> The GOAT</span>' +
      '<span class="wc-left">' + (!room ? 'Spot Taken' : buy ? 'Buy &middot; $9.99' : n > 1 ? n + ' left' : 'Ready') + '</span></button>';
  };
  // No Legend Pick tile here (16 Oct 2026, the owner: one Legend Key button). 1000TRIES and 27-0 keep the Immortal Pick
  R.immTile = function () { return ''; };
  // 60000 RUNS: no World Cup, so no World Legend Pick
  R.ilTile = function () { return ''; };
  // Under a bought Pick's three (Hall of Famers, World Legends): go back to the offer you had, nothing used
  R.immBack = function (S) {
    if (!S.offer || !S.offer.paid || S.offer.taken) return '';
    return '<div class="imm-back"><button type="button" class="btn btn-quiet btn-sm" data-action="imm-back">&larr; Keep My Offer</button><small>Your ' + (S.offer.item === 'ileg' ? 'World Legend Pick' : 'Legend Pick') + ' is only used once you choose.</small></div>';
  };
  // Use the GOAT? One tap more, so a $9.99 item is never used by mistake
  R.goatSheet = function () {
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico goat-ico" aria-hidden="true">&#x1F410;</div>' +
      '<div class="sheet-kicker">The GOAT</div>' +
      '<h2 class="sheet-title center">Bring In ' + esc(goatName()) + '?</h2>' +
      '<p class="sheet-sub center">This offer becomes the GOAT and his ' + goatGoals() + ' Test runs. Pick him and put him in an open spot he plays.</p>' +
      '<button type="button" class="btn btn-primary btn-block btn-goat" data-action="confirm-goat">&#x1F410; ' + (window.CastAccount && CastAccount.itemSaved && CastAccount.itemSaved('goat') > 0 ? 'Use The GOAT' : 'Get The GOAT &middot; $9.99') + '</button>' +
      '<button type="button" class="btn btn-quiet btn-block" data-action="close-sheet">Not Now</button>';
  };
  // Substitute: CAST Pass holders get 1 a game; a free profile sees it with the CAST Pass tag (tap for the Pass page)
  R.subButton = function (S) {
    var t = window.CastAccount && CastAccount.tier ? CastAccount.tier() : null;
    if (!t || t === 'guest' || S.finished || !S.mode.wildcards || S.mode.paidOnly) return ''; // no Substitute in Hard Mode
    if (t !== 'pass') return '<button type="button" class="wc wc-sub is-pass" data-action="sub-pass" title="Move a player into another position they play (CAST Pass)"><span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F501;</span> Substitute</span><span class="wc-left wc-pass-tag">CAST Pass</span></button>';
    var left = S.subLeft || 0, armed = !!S.subMode, usable = T.canSub();
    return '<button type="button" class="wc wc-sub' + (left ? '' : ' is-spent') + (armed ? ' is-armed' : '') + '" data-wildcard="sub"' + (usable || armed ? '' : ' disabled') +
      ' title="Move a player into another open position they play"><span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F501;</span> Substitute</span>' +
      '<span class="wc-left">' + (armed ? (S.subMode.from == null ? 'Tap a player' : 'Tap a spot') : left ? left + ' left' : 'Used') + '</span></button>';
  };

  /* The Vault (CAST Pass): the Legend Key in 4000+, a tile with the wildcards (as 27-0 shows its Superstar Key). A Pass
     holder can swap the offer for a Legends Pick once a day; a free profile sees it with the CAST Pass tag (tap for the
     Pass page). Never in a friend's challenge. While it is ready and a Legend fits, the offer also gets a line under
     its cards: "Not these? Swap for a Legends Pick". */
  function keyState(S) {
    if (S.mode.id !== 'plus' || S.finished || S.challenge || !window.CastAccount || !CastAccount.vault) return null;
    return CastAccount.vault('legend'); // 'ready', 'used', 'pass' (no CAST Pass: locked) or null (guests, and before the tiers)
  }
  // Today's CAST Pass key and the bought ones: "Ready" for one, "N left" for more (16 Oct 2026: as many in one team as you have)
  function keyLeft() { var n = window.CastAccount && CastAccount.keyCount ? CastAccount.keyCount('legend') : 1; return n > 1 ? n + ' left' : 'Ready'; }
  R.keyTile = function (S) {
    var v = keyState(S);
    if (!v) return '';
    var lab = '<span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F511;</span> Legend Key</span>';
    // Never "Used" in a game, and never "had its pick": the key stays on offer (the owner, 8 Oct 2026)
    // No key to use (no CAST Pass, or today's is gone): a player 15+ can buy one for $1.99 (CastAccount.buyKey)
    // A Legends, Hall of Famer or paid pick on screen: the key waits for the next offer
    var why = !T.legendKeyRoom() ? 'No Legend fits your open spots' : 'Ready for your next offer';
    if ((v === 'pass' || v === 'used') && CastAccount.buyKey && CastAccount.canBuyKey && CastAccount.canBuyKey()) {
      var bf = T.legendKeyFits() && !S.tweakMode && !S.subMode;
      return '<button type="button" class="wc wc-key wc-buy" data-action="buy-key"' + (bf ? '' : ' disabled') +
        ' title="' + (bf ? 'Buy a Legend Key: swap this offer for a Legends Pick' : why) + '">' + lab + '<span class="wc-left">Buy &middot; $1.99</span></button>';
    }
    if (v === 'pass') return '<button type="button" class="wc wc-key is-pass" data-action="legend-key-pass" title="A Legends Pick when you want it, once a day (CAST Pass)">' + lab + '<span class="wc-left wc-pass-tag">CAST Pass</span></button>';
    if (v === 'used') return '<div class="wc wc-key is-used" title="A new Legend Key arrives at midnight, Sydney time">' + lab + '<span class="wc-left">' + (CastAccount.keyCountdown ? CastAccount.keyCountdown() : 'Back at midnight') + '</span></div>';
    var fits = T.legendKeyFits() && !S.tweakMode && !S.subMode, room = T.legendKeyRoom();
    return '<button type="button" class="wc wc-key' + (fits ? ' is-ready' : '') + '" data-action="legend-key"' + (fits ? '' : ' disabled') +
      ' title="' + (fits ? 'Swap this offer for a Legends Pick' : why) + '">' + lab +
      '<span class="wc-left">' + (fits || room ? keyLeft() : 'No fit') + '</span></button>';
  };
  R.keySwap = function (S) {
    if (keyState(S) !== 'ready' || S.tweakMode || S.subMode || !T.legendKeyFits() || !(S.offer && S.offer.players.length) || S.offer.goat || S.offer.paid) return '';
    return '<button type="button" class="key-swap" data-action="legend-key"><span aria-hidden="true">&#x1F511;</span> Not these? Swap for a Legends Pick</button>';
  };

  /* A Pick you used (a bought Pick, a Legend Key's Legends Pick, the GOAT) shows its numbers straight away (16 Oct 2026,
     the owner: "When you use legend picks they have to show the runs straight away"). A free roll, Legends Pick
     included, stays hidden until a Reveal */
  function usedOffer(S, p) { return !!(S.offer && (S.offer.paid || S.offer.key || S.offer.goat) && S.offer.players.indexOf(p) >= 0); }
  R.triesShown = function (S, p) { return !!S.revealed[p.id] || usedOffer(S, p); };
  function triesBadge(S, p) {
    if (R.triesShown(S, p)) return '<span class="tries-badge is-revealed"><strong>' + T.fmt(p.tries_1998_plus) + '</strong> runs</span>';
    return '<span class="tries-badge"><strong>??</strong> runs</span>';
  }

  // Remove Player armed: hide the offer entirely so the only thing to do is tap the field
  R.removeMode = function (S) {
    return '<div class="panel-head"><span class="panel-title">Remove a player</span><span class="panel-meta">Offer paused</span></div>' +
      R.wildcardBar(S) +
      '<div class="remove-mode">' +
        '<div class="rm-ico" aria-hidden="true">&#x274C;</div>' +
        '<p class="rm-title">Tap a player in your XI to remove them</p>' +
        '<p class="rm-sub">Their spot reopens and they go back in the pool. Your offer comes back after.</p>' +
        '<span class="rm-arrow" aria-hidden="true">&darr;</span>' +
        '<button type="button" class="btn btn-ghost btn-block" data-action="cancel-tweak">Cancel</button>' +
      '</div>';
  };

  // A themed Daily's club rule (e.g. Knights Day): what the offer panel says until the XI has one, and the tag on their cards
  function dailyRule(S) {
    var d = S.daily;
    if (!d || !d.club) return '';
    return T.hasDailyClub() ? '&#x2705; ' + esc(d.clubName) + ' player in your XI' : d.icon + ' Needs a ' + esc(d.clubName) + ' player (tagged)';
  }
  function dailyTag(S, p) {
    var d = S.daily;
    return d && d.club && T.playedFor(p, d.club) ? '<span class="pcard-dc" title="Has played for the ' + esc(d.clubName) + '">' + d.icon + ' ' + esc(d.clubName) + '</span>' : '';
  }

  R.offerRoll = function (S) {
    if (S.tweakMode) return R.removeMode(S);
    var players = S.offer ? S.offer.players : [];
    var special = S.offer && S.offer.special;
    return '<div class="panel-head' + (special ? ' is-' + special : '') + '">' +
        '<span class="panel-title">' + (S.offer && S.offer.goat ? '&#x1F410; The GOAT' : special === 'ilegend' ? '&#x1F451; Your World Legend Pick' : S.offer && S.offer.paid ? '&#x1F3DB;&#xFE0F; Your Legend Pick' : special === 'immortal' ? '&#x1F410; Legend Pick' : special ? '&#x2B50; Legends Pick' : 'Pick 1') + '</span>' +
        '<span class="panel-meta">' + (special === 'ilegend' ? 'Pick 1 of 3 World Legends &middot; Test runs shown' : special ? 'Pick 1 of 3 ' + (S.offer.paid || S.offer.key ? 'Legends' : 'greats') + (S.offer.paid || S.offer.key ? ' &middot; career runs shown' : ' &middot; career runs, hidden') : S.offer && S.offer.goat ? 'Career runs shown' : dailyRule(S) || 'Runs hidden until you pick') + '</span>' +
      '</div>' +
      // Exactly 4000's shot clock (js/app.js clockTick fills it in)
      (S.mode.id === 'exact' && !S.tweakMode && players.length ? '<div class="pick-clock" data-pick-clock role="timer" aria-label="Time to pick"><i></i><b>' + T.EXACT_SECS + 's</b></div>' : '') +
      R.wildcardBar(S) +
      R.tweakBanner(S) +
      '<div class="offer-cards">' + players.map(function (p, n) {
        var club = T.showClub(p);
        var c = T.club(club), lk = look(club, 340, 42, 3, p);
        return '<button type="button" class="pcard' + goatCls(p) + '" data-pick="' + esc(p.id) + '" style="' + clubVars(club) + 'animation-delay:' + (n * 70) + 'ms"' + (S.tweakMode ? ' disabled' : '') + '>' +
          '<span class="pcard-plate' + (lk ? ' has-look' : '') + '">' + lk + '<span class="pcard-abbr">' + esc(c.abbr) + '</span><span class="pcard-club">' + esc(c.name) + '</span>' + tierTag(p) + '</span>' +
          '<span class="pcard-body">' +
            '<span class="pcard-name">' + nameHtml(p) + medalMark(p) + '</span>' +
            '<span class="pcard-meta">' + posChips(p) + '<span class="pcard-span">' + span(p) + '</span>' + nationBadges(p) + '</span>' + dailyTag(S, p) +
          '</span>' +
          '<span class="pcard-foot">' + triesBadge(S, p) + '<span class="pcard-cta"><kbd class="pcard-key" aria-hidden="true">' + (n + 1) + '</kbd>Pick</span></span>' +
          '</button>';
      }).join('') + '</div>' + R.immBack(S) + R.keySwap(S);
  };

  R.reel = function (year, club, landed) {
    var c = club ? T.club(club) : null;
    return '<div class="reel' + (landed ? ' is-landed' : ' is-spinning') + '">' +
      '<div class="reel-box reel-year"><span class="reel-lbl">Year</span><span class="reel-val">' + (year || '?') + '</span></div>' +
      '<span class="reel-x" aria-hidden="true">&times;</span>' +
      '<div class="reel-box reel-club"' + (c ? ' style="' + clubVars(club) + '"' : '') + '><span class="reel-lbl">Nation</span><span class="reel-val">' + (c ? esc(c.name) : '?') + '</span></div>' +
      '</div>';
  };

  // Squad sort for Team Spin (squads can run to 30+ players)
  T.spinSort = T.spinSort || { key: 'pos', dir: 1 };
  var POS_ORDER = ['B', 'K', 'W'];

  // Group under the player's main listed position that is still open in your XI
  function groupPos(p) {
    var open = T.openCodesFor(p);
    return open.length ? open[0] : T.positionsOf(p)[0];
  }

  function sortSquad(players, fixedPos) {
    var srt = fixedPos ? { key: 'name', dir: 1 } : T.spinSort;
    var bySurname = function (a, b) {
      return T.surname(a.name).localeCompare(T.surname(b.name)) || a.name.localeCompare(b.name);
    };
    return players.slice().sort(function (a, b) {
      if (srt.key === 'pos') {
        var d = POS_ORDER.indexOf(groupPos(a)) - POS_ORDER.indexOf(groupPos(b));
        return (d * srt.dir) || bySurname(a, b);
      }
      return bySurname(a, b) * srt.dir;
    });
  }

  function sortToggle() {
    var srt = T.spinSort;
    var btn = function (key, label, arrowUp, arrowDown) {
      var on = srt.key === key;
      return '<button type="button" class="sort-btn' + (on ? ' is-on' : '') + '" data-action="spin-sort" data-sort="' + key + '" aria-pressed="' + on + '">' +
        '<span>' + label + '</span><span class="sort-dir">' + (on ? (srt.dir === 1 ? arrowUp : arrowDown) : (key === 'pos' ? 'FB first' : 'A to Z')) + '</span></button>';
    };
    return '<div class="sort-toggle" role="group" aria-label="Sort squad">' +
      btn('pos', 'Position', 'FB first &uarr;', 'LK first &darr;') +
      btn('name', 'Surname', 'A to Z &uarr;', 'Z to A &darr;') +
      '</div>';
  }

  // Team Spin squad search (cleared on every new spin)
  T.squadSearch = T.squadSearch || { open: false, q: '', offer: null };

  R.offerSpin = function (S) {
    if (S.tweakMode) return R.removeMode(S);
    var o = S.offer;
    if (T.squadSearch.offer !== o) T.squadSearch = { open: false, q: '', offer: o };
    // Position chosen first: one list for that position (dual players included, never split)
    var fixedPos = !!o.pos;
    var sorted = sortSquad(o.players, fixedPos);
    var lastGroup = null;
    // Rows carry the spun nation's colours: that is the squad they are being picked from
    var rows = sorted.map(function (p) {
      var head = '';
      if (!fixedPos && T.spinSort.key === 'pos') {
        var g = groupPos(p);
        if (g !== lastGroup) { head = '<div class="squad-group">' + esc(T.POS_NAMES[g] || g) + '</div>'; lastGroup = g; }
      }
      return head + '<button type="button" class="srow' + goatCls(p) + '" data-pick="' + esc(p.id) + '" data-name="' + esc(p.name.toLowerCase()) + '" style="' + clubVars(o.club) + '"' + (S.tweakMode ? ' disabled' : '') + '>' +
        '<span class="srow-main"><span class="srow-name">' + nameHtml(p) + '</span>' +
        '<span class="srow-meta">' + posChips(p) + '<span class="pcard-span">' + span(p) + '</span></span></span>' +
        triesBadge(S, p) +
        '</button>';
    }).join('');
    return '<div class="panel-head">' +
        '<span class="panel-title">' + (o.pos ? 'Pick your ' + esc(T.POS_NAMES[o.pos]) : 'Pick 1 from this squad') + '</span>' +
        '<span class="panel-meta">' + o.players.length + ' eligible</span>' +
      '</div>' +
      R.wildcardBar(S) +
      R.tweakBanner(S) +
      '<div id="reelWrap">' + R.reel(o.year, o.club, true) + '</div>' +
      (o.skipped ? '<p class="note">No one left who fits from ' + o.skipped + (o.skipped === 1 ? ' spin' : ' spins') + ', so we spun again for you.</p>' : '') +
      '<div class="squad-tools">' + (fixedPos ? '<div class="squad-group squad-group-fixed">' + esc(T.POS_NAMES[o.pos]) + 's from this squad</div>' : sortToggle()) +
        '<button type="button" class="squad-search-btn" data-action="squad-search" aria-label="Search this squad" aria-expanded="' + !!T.squadSearch.open + '">&#x1F50D;</button></div>' +
      (T.squadSearch.open ? '<input type="search" id="squadSearch" class="squad-search" placeholder="Search player name" autocomplete="off" aria-label="Search player name" value="' + esc(T.squadSearch.q) + '">' : '') +
      '<div class="squad-wrap" id="squadWrap"><div class="squad" id="squadList">' + rows + '</div>' +
      '<span class="squad-more" aria-hidden="true">Scroll for more &darr;</span></div>';
  };

  // Team Spin step 1: choose the position before the nation and year are revealed
  R.pickPosition = function (S) {
    var counts = {}, order = [];
    S.slots.forEach(function (sl) { if (!sl.player) { if (!counts[sl.code]) order.push(sl.code); counts[sl.code] = (counts[sl.code] || 0) + 1; } });
    return '<div class="panel-head"><span class="panel-title">Choose a position</span><span class="panel-meta">Then we spin</span></div>' +
      R.wildcardBar(S) +
      '<p class="pp-intro">Pick the spot you want to fill. We then spin a nation and year, and you can only pick from that Test squad\'s players in that position. No backing out.</p>' +
      '<div class="pp-grid">' + order.map(function (code) {
        return '<button type="button" class="pp-btn" data-action="spin-pos" data-pos="' + code + '">' +
          '<span class="pp-code">' + T.posLabel(code) + '</span><span class="pp-name">' + esc(T.POS_NAMES[code]) + '</span>' +
          (counts[code] > 1 ? '<span class="pp-count">' + counts[code] + ' open</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<p class="pp-hint">Or tap an empty spot on your XI.</p>';
  };

  R.spinning = function (S) {
    return '<div class="panel-head"><span class="panel-title">Spinning' + (S.spinPos ? ' for a ' + esc(T.POS_NAMES[S.spinPos]) : '') + '</span><span class="panel-meta">Nation and year</span></div>' +
      R.wildcardBar(S) +
      '<div id="reelWrap">' + R.reel(null, null, false) + '</div>';
  };

  R.tweakBanner = function (S) {
    if (!S.tweakMode) return '';
    return '<div class="tweak-banner"><span>Tap a player in your XI to remove them. The spot reopens and they go back in the pool.</span>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-action="cancel-tweak">Cancel</button></div>';
  };

  // Squad full with a Remove Player in hand, or (15+) a saved or bought one: remove, or lock in (10 second countdown,
  // which waits while a Remove Player is being bought: S.lockHold)
  /* Go Higher (js/app.js goHigher): at the target or over, their words in turn (S.ghCopy) and the total, with the same
     Remove (their own, a saved one, or $0.99) and Lock In as a short 13 */
  var GO_HIGHER = [
    function () { return ['Over ' + T.fmt(T.TARGET) + '! Go Higher?', 'Want to increase your score? Remove a player now.']; },
    function () { return ['Climb the Leaderboard', 'Don’t like a player in your squad? Remove them now.']; }
  ];
  R.decision = function (S) {
    var total = T.total(), short = T.TARGET - total, over = short <= 0, paid = S.wildcards.tweak < 1;
    var rs = paid && window.CastAccount && CastAccount.removesSaved ? CastAccount.removesSaved() : 0;
    var gh = over ? GO_HIGHER[(S.ghCopy || 0) % GO_HIGHER.length]() : null;
    var msg = over ? gh[1] : !paid ? 'You still have Remove Player. Take one player out and draft again, or lock in this XI.'
      : rs ? 'You have ' + rs + ' saved Remove Player' + (rs === 1 ? '' : 's') + '. Take one player out and draft that spot again, or lock in this XI.'
        : 'Take one player out and draft that spot again for $0.99, or lock in this XI.';
    var ghAttr = over ? ' data-gh="1"' : '';
    return '<div class="panel-head"><span class="panel-title">' + (over ? esc(gh[0]) : 'Squad full') + '</span></div>' +
      '<div class="decision' + (over ? ' is-over' : '') + '">' +
        (over ? '<p class="decision-big">' + T.fmt(total) + ' <small>runs</small></p>' : '<p class="decision-big">' + T.fmt(short) + ' short</p>') +
        '<p>' + esc(msg) + '</p>' +
        (S.tweakMode ? R.tweakBanner(S) :
        '<div class="btn-row">' +
          (paid ? '<button type="button" class="btn btn-decide btn-decide-remove" data-action="buy-remove"' + ghAttr + '><span class="btn-decide-lbl">&#x274C; Remove &middot; ' + (rs ? rs + ' left' : '$0.99') + '</span></button>'
            : '<button type="button" class="btn btn-decide btn-decide-remove" data-wildcard="tweak"' + ghAttr + '><span class="btn-decide-lbl">&#x274C; Remove Player</span></button>') +
          '<button type="button" class="btn btn-decide btn-decide-lock" data-action="lock-in" aria-label="Lock in this XI' + (over ? ' at ' + T.fmt(total) + ' runs' : '') + (S.lockHold ? '' : ' (locks in automatically in ' + T.LOCK_SECS + ' seconds)') + '">' +
            '<span class="lock-fill" aria-hidden="true"></span>' +
            '<span class="btn-decide-lbl">&#x1F512; Lock ' + (over ? 'In' : 'in') + (S.lockHold ? '' : ' <b class="lock-secs">' + T.LOCK_SECS + '</b>') + '</span></button>' + // the total is big above it
        '</div>' +
        // Still holding the game's own Remove Player: a way to stock up on more (the packs pop-up; nothing is used)
        (!paid && window.CastAccount && CastAccount.shopRemoves && CastAccount.canBuyRemove && CastAccount.canBuyRemove()
          ? '<button type="button" class="decision-more" data-action="shop-removes">&#x2795; Get More Remove Players</button>' : '')) +
      '</div>';
  };

  // Phone chooser for dual-position players: club-coloured header + glowing field spots
  R.slotChooser = function (p, codes) {
    var club = T.showClub(p);
    var c = T.club(club), lk = look(club, 340, 42, 3, p);
    return '<div class="chooser-card' + goatCls(p) + '" style="' + clubVars(club) + '">' +
        '<span class="pcard-plate' + (lk ? ' has-look' : '') + '">' + lk + '<span class="pcard-abbr">' + esc(c.abbr) + '</span><span class="pcard-club">' + esc(c.name) + '</span></span>' +
        '<span class="chooser-name">' + nameHtml(p) + '</span>' +
      '</div>' +
      '<p class="chooser-q">Where do you want them?</p>' +
      '<div class="chooser-spots">' + codes.map(function (code) {
        return '<button type="button" class="chooser-spot" data-place="' + code + '">' +
          '<span class="cs-code">' + T.posLabel(code) + '</span>' +
          '<span class="cs-pos">' + esc(T.POS_NAMES[code]) + '</span>' +
          '<span class="cs-tag">Place here</span>' +
          '</button>';
      }).join('') + '</div>' +
      '<button type="button" class="chooser-back" data-action="close-sheet">&larr; Pick Someone Else</button>';
  };

  // Subscribe button (red, YouTube logo, Cast Patrol avatar). Shared with 27-0's Play Again pop-up.
  R.subscribeBtn = function (where) {
    return '<a class="yt-sub" href="https://www.youtube.com/@thecastpatrol?sub_confirmation=1" target="_blank" rel="noopener" data-track="click_subscribe" data-where="' + esc(where) + '">' +
      '<img class="yt-avatar" src="assets/logos/cast-patrol-avatar.jpg" alt="" width="40" height="40">' +
      '<span class="yt-text"><span class="yt-kicker">Enjoying 60000 RUNS?</span><span class="yt-label">Subscribe to The Cast Patrol</span></span>' +
      '<svg class="yt-logo" viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" rx="5" fill="#fff"/><path d="M11 5.5v9l8-4.5z" fill="#FF0000"/></svg>' +
      '</a>';
  };

  // The New Game tab mid-draft: go again in this mode, change mode or keep playing (the same pop-up as 27-0's)
  R.newGameSheet = function (S) {
    var daily = S.mode.id === 'daily' || !!S.daily;
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico" aria-hidden="true">&#x1F504;</div>' +
      '<div class="sheet-kicker">New Game</div>' +
      '<h2 class="sheet-title center">Start a New Game?</h2>' +
      '<p class="sheet-sub center">' + (daily ? 'This Daily Challenge go still counts as used.' : 'This team will be lost.') + ' Go again or pick another mode.</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="confirm-restart"><span aria-hidden="true">&#x1F504;</span>' + (daily ? 'Play Again' : 'Play ' + esc(S.mode.name) + ' Again') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="confirm-change-mode"><span aria-hidden="true">&#x1F3AE;</span>Change Mode</button>' +
      '<button type="button" class="btn btn-quiet btn-block" data-action="close-sheet">Keep Playing</button>' +
      R.subscribeBtn('new_game');
  };

  // Mid-game restart, same idea as the 27-0 Play Again prompt
  R.restartSheet = function () {
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico" aria-hidden="true">&#x1F504;</div>' +
      '<div class="sheet-kicker">Play again?</div>' +
      '<h2 class="sheet-title center">Not happy with your selections?</h2>' +
      '<p class="sheet-sub center">This team will be lost and you start a new team in the same mode.</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="confirm-restart">Start new team</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="close-sheet">Keep going</button>' +
      R.subscribeBtn('play_again');
  };

  // A draft saved on this phone (js/app.js, Save the draft in progress): carry on, or start fresh
  R.resumeSheet = function (name, picks) {
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico" aria-hidden="true">&#x1F3CF;</div>' +
      '<div class="sheet-kicker">Your Draft Is Saved</div>' +
      '<h2 class="sheet-title center">Pick Up Where You Left Off?</h2>' +
      '<p class="sheet-sub center">Your ' + esc(name) + ' team has ' + picks + ' of ' + T.SLOTS.length + ' picked, with everything you used still in it.</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="resume-draft">Continue My Draft</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="drop-draft">Start Fresh</button>';
  };

  // Mid-game Change mode: confirm before dropping the current team
  R.changeModeSheet = function (S) {
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico" aria-hidden="true">&#x1F3AE;</div>' +
      '<div class="sheet-kicker">Change mode?</div>' +
      '<h2 class="sheet-title center">Want to try a different mode?</h2>' +
      '<p class="sheet-sub center">You are playing ' + esc(S.mode.name) + '. This team will be lost and you go back to pick a mode.</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="confirm-change-mode">Choose a mode</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="close-sheet">Keep going</button>' +
      R.subscribeBtn('change_mode'); // as on 27-0's Change mode pop-up
  };

  R.reveal = function (p, club) {
    return '<div class="reveal' + goatCls(p) + '" style="' + clubVars(club || T.lastClub(p)) + '">' +
      '<span class="reveal-name">' + nameHtml(p) + medalMark(p) + '</span>' +
      '<span class="reveal-num">' + T.fmt(p.tries_1998_plus) + '</span>' +
      '<span class="reveal-lbl">' + (T.isGoat(p) ? 'Career Test runs. The GOAT.' : T.isImmortal(p) ? 'Career Test runs. A Hall of Famer.' : T.isLegend(p) ? 'Career Test runs. A Legend.' : T.TRY_LABEL) + '</span></div>';
  };

  /* LATEST VIDEOS (shared feed from the media kit) */

  R.videos = function (list) {
    return list.map(function (v) {
      var d = v.published_at ? new Date(v.published_at) : null;
      var date = d && !isNaN(d) ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      return '<a class="vcard" href="' + esc(v.url) + '" target="_blank" rel="noopener">' +
        '<span class="vthumb"><img src="' + esc(v.thumbnail || '') + '" alt="" loading="lazy"><span class="vplay" aria-hidden="true"></span></span>' +
        '<span class="vbody"><span class="vtitle">' + esc(v.title) + '</span>' +
        (date ? '<span class="vdate">' + esc(date) + '</span>' : '') + '</span></a>';
    }).join('');
  };

  /* RESULTS + ADS */

  // Unibet holding banner (rotates like 27-0). Renders nothing until the manifest has loaded.
  R.unibet = function (where) {
    var src = T.ads && T.ads.pick('homepage');
    if (!src) return '';
    // Neutral class names and a hide-on-error so blocked images never leave an empty frame
    return '<div class="cp-partner">' +
      '<a class="cp-partner-link" href="https://bit.ly/betwithcast" target="_blank" rel="noopener noreferrer sponsored" data-track="unibet_click" data-where="' + esc(where) + '">' +
        '<img src="' + esc(src) + '" alt="Unibet" width="1920" height="1080" loading="lazy" onerror="var b=this.closest(\'.cp-partner\');if(b)b.remove();">' +
      '</a>' +
      '</div>';
  };

  R.headline = function (S, out) {
    if (out.win) {
      if (out.reason === 'exact') return { title: 'Exactly ' + T.fmt(T.TARGET) + '!', sub: 'Eleven players, not a run wasted. Elite.' };
      return { title: 'Target smashed', sub: out.diff > 0 ? 'Cleared ' + T.fmt(T.TARGET) + ' by ' + T.fmt(out.diff) + '. What a batting line-up.' : 'Right on ' + T.fmt(T.TARGET) + '. Just.' };
    }
    var left = T.SLOTS.length - T.filledCount();
    if (out.reason === 'noclub') return { title: 'No ' + esc(S.daily.clubName) + ' player', sub: T.fmt(out.total) + ' runs, but today\u2019s Daily needs at least one player who has played for the ' + esc(S.daily.clubName) + '.' };
    if (out.reason === 'over') return { title: 'Over by ' + T.fmt(out.diff), sub: 'Blew past ' + T.fmt(T.TARGET) + ' with ' + left + ' spot' + (left === 1 ? '' : 's') + ' still to fill.' };
    if (S.mode.rule === 'exact') return { title: 'Short by ' + T.fmt(-out.diff), sub: 'Exactly ' + T.fmt(T.TARGET) + ' is brutal. Go again.' };
    return { title: 'Short by ' + T.fmt(-out.diff), sub: '' };
  };

  // The luck of the draw (T.luckPct in js/draft.js): the runs on offer against an average game. Also on team sheets.
  function luckLine(S) {
    var k = S.mode.source === 'roll' && T.luckPct ? T.luckPct() : null;
    if (k == null) return '';
    return '<p class="result-luck' + (k >= 5 ? ' is-lucky' : k <= -5 ? ' is-tough' : '') + '">' +
      (k >= 5 ? '&#x1F340; Lucky draw: your cards held ' + k + '% more runs than an average game'
        : k <= -5 ? '&#x1F327;&#xFE0F; Tough draw: your cards held ' + (-k) + '% fewer runs than an average game'
          : '&#x2696;&#xFE0F; Fair draw: your cards held about as many runs as an average game') + '</p>';
  }

  R.results = function (S, out) {
    var h = R.headline(S, out);
    var best = null;
    S.slots.forEach(function (s) { if (s.player && (!best || s.player.tries_1998_plus > best.tries_1998_plus)) best = s.player; });
    var rows = S.slots.map(function (s) {
      var p = s.player;
      if (!p) return '<li class="rrow is-empty"><span class="rrow-code">' + T.posLabel(s.code) + '</span><span class="rrow-name">Not picked</span><span class="rrow-tries">&nbsp;</span></li>';
      var club = T.slotClub(s);
      var c = T.club(club);
      return '<li class="rrow' + goatCls(p) + (p === best ? ' is-best' : '') + '" style="' + clubVars(club) + '">' +
        '<span class="rrow-code">' + T.posLabel(s.code) + '</span>' +
        '<span class="rrow-club">' + esc(c.abbr) + '</span>' +
        '<span class="rrow-name">' + nameHtml(p) + (p === best ? ' <span class="best-tag">Top scorer</span>' : '') + '</span>' +
        '<span class="rrow-tries">' + T.fmt(p.tries_1998_plus) + '</span>' +
        '</li>';
    }).join('');
    return '<div class="result-hero ' + (out.win ? 'is-win' : 'is-fail') + '">' +
        '<div class="result-kicker">' + esc(S.mode.name) + ' mode</div>' +
        '<div class="result-total"><span class="rt-num" id="rtNum">' + T.fmt(out.total) + '</span><span class="rt-of">' + esc(T.totalLabel(S)) + '</span></div>' +
        '<h1 id="resultTitle" class="result-title">' + (out.win ? '&#x2705; ' : '') + esc(h.title) + '</h1>' +
        (h.sub ? '<p class="result-sub">' + esc(h.sub) + '</p>' : '') +
        luckLine(S) +
      '</div>' +
      // Play Again on its own, Share and Change Mode side by side under it (4 Oct 2026, the owner's call; 27-0 the same).
      // A Daily go turns them into Go Again and Share My Best (js/daily.js)
      '<div class="res-acts">' +
        '<button type="button" class="btn btn-res btn-res-again btn-block" data-action="play-again"><span aria-hidden="true">&#x1F504;</span> Play Again</button>' +
        '<div class="res-two">' +
          '<button type="button" class="btn btn-res btn-res-share" data-action="share"><span aria-hidden="true">&#x1F4E4;</span> Share</button>' +
          '<button type="button" class="btn btn-res btn-res-mode" data-action="results-home"><span aria-hidden="true">&#x1F3AE;</span> Change Mode</button>' +
        '</div>' +
      '</div>' +
      '<div data-cast-results></div>' +
      '<div class="panel">' +
        '<div class="panel-head is-stack"><span class="panel-title">Your Selected XI</span><span class="panel-meta">' + (T.totalLabel(S) === T.ERA_LABEL ? T.DATASETS[T.DATASET].only : 'Legends: whole careers') + '</span></div>' +
        '<ol class="rlist">' + rows + '</ol>' +
        '<div class="rsum"><span>Total</span><strong>' + T.fmt(out.total) + '</strong></div>' +
      '</div>' +
      R.unibet('results');
  };
})(window.T = window.T || {});
