 
(function (T) {
  'use strict';
  
  function px(pack, aud) { return window.CastAccount && CastAccount.price ? CastAccount.price(pack, aud) : aud; }

  var R = T.render = {};

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
  var nameHtml = R.nameHtml = function (p, text) {
    return esc(text == null ? p.name : text) + (T.isGoat(p) ? GOAT : '');
  };

  function goatCls(p) { return T.isGoat(p) ? ' is-goat' : T.isLegend(p) ? ' is-legend' : ''; }
  function tierTag(p) {
    if (T.isGoat(p)) return '<span class="pcard-tier">&#x1F410; GOAT</span>';
    if (T.isLegend(p)) return '<span class="pcard-tier">&#x2B50; Legend</span>';
    return '';
  }

  

  var kitCache = {};
  function kit(club, w, h) {
    var K = window.CastKits, k = club + '|' + w + '|' + h;
    if (!K || !K.drawFill || !T.CLUBS[club]) return '';
    if (kitCache[k] == null) {
      var c = T.club(club);
      try { kitCache[k] = K.drawFill('afl', club, { w: w, h: h, fallback: { base: c.primary, accent: c.accent } }) || ''; } catch (e) { kitCache[k] = ''; }
    }
    return kitCache[k] ? '<span class="kit" aria-hidden="true">' + kitCache[k] + '</span>' : '';
  }
  R.kit = kit;

  
  function posChips(p) {
    return T.positionsOf(p).map(function (c) {
      return '<span class="chip" title="' + esc(T.POS_NAMES[c] || c) + '">' + esc(T.posLabel(c)) + '</span>';
    }).join('');
  }

   

  R.ouCard = function () { return ''; };
  R.ouBanner = function () { return ''; };
  R.wcCard = function () { return ''; };
  
  R.modePicker = function (selected) {
    var m = T.MODES.plus;
    return '<button type="button" class="mode-card mode-main' + (selected === 'plus' ? ' is-on' : '') + '" data-mode="plus" aria-label="Play ' + esc(m.name) + '">' +
      '<span class="mode-tag">High Score</span>' +
      '<span class="mode-ico" aria-hidden="true">&#x1F451;</span>' +
      '<span class="mode-name">' + esc(m.name) + '</span>' +
      '<span class="mode-line">Spin 3 player seasons, pick 1, eighteen times. The biggest SC total takes the crown.</span>' +
      '<span class="mode-chips"><span class="mode-chip">Spin 3, Pick 1</span><span class="mode-chip">Biggest Total Wins</span><span class="mode-chip">Wildcards</span></span>' +
      '<span class="mode-go" aria-hidden="true">Play Now <i>&#x25B6;</i></span>' +
      '</button>';
  };

   

  R.helper = function (S) {
    var left = T.SLOTS.length - T.filledCount();
    return { text: left ? left + ' to pick' : 'Team full', cls: left ? '' : 'is-good' };
  };

  
  R.scoreboard = function (S) {
    var h = R.helper(S), dots = S.slots.map(function (s, i) {
      var p = s.player;
      return '<i class="sb-dot' + (p ? ' is-on' : '') + (S.captain === i ? ' is-cap' : '') + '"' + (p ? ' style="' + clubVars(T.slotClub(s)) + '"' : '') + '></i>';
    }).join('');
    return '<div class="sb-inner">' +
      '<div class="sb-left">' +
        '<span class="sb-mode">' + esc(S.daily ? 'Daily Challenge' : S.mode.name) + '</span>' +
        '<span class="sb-picks">' + T.filledCount() + ' / ' + T.SLOTS.length + ' picked</span>' +
      '</div>' +
      '<div class="sb-center">' +
        '<span class="sb-total" id="sbTotal">' + T.fmt(T.total()) + '</span><span class="sb-of">' + (S.daily && S.daily.target ? 'of ' + T.fmt(S.daily.target) + ' SC points' : 'SC points') + '</span>' +
      '</div>' +
      '<div class="sb-right"><span class="sb-help ' + h.cls + '">' + esc(h.text) + '</span></div>' +
      '<div class="sb-dots" aria-hidden="true">' + dots + '</div>' +
      (S.daily && S.daily.task ? '<button type="button" class="sb-daily" data-dly="remind" aria-label="See today&rsquo;s Daily Challenge">' +
        '<span class="sb-daily-k">' + (S.daily.icon || '&#x1F4C5;') + ' Daily Challenge &middot; Go ' + S.daily.go + ' of ' + (S.daily.of || 3) + '</span>' +
        '<span class="sb-daily-t">' + S.daily.task + '</span><span class="sb-daily-i" aria-hidden="true">&#x24D8;</span></button>' : '') +
      '</div>';
  };
  R.barLook = function () { return { color: 'var(--gold)', glow: 'rgba(var(--acc-rgb),.5)', stage: 'mid' }; };

  



  var ROWS = R.ROWS = T.FIELD_ROWS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 11, 10], [12, 13, 14], [15, 16, 17]];
  T.FIELD_ORDER = T.SLOTS.map(function (_, i) { return i; });
  var ROW_CLS = ['r-def', 'r-def', 'r-mid', 'r-mid r-ruck', 'r-fwd', 'r-fwd'];
  
  var FIELD = '<svg class="field-lines" viewBox="0 0 500 700" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke="rgba(255,255,255,.42)" stroke-width="2">' +
    '<ellipse cx="250" cy="350" rx="246" ry="346" stroke="rgba(255,255,255,.6)" stroke-width="3"/>' +
    '<path d="M86 52 A190 200 0 0 0 414 52"/><path d="M86 648 A190 200 0 0 1 414 648"/>' +
    '<rect x="160" y="262" width="180" height="176"/><circle cx="250" cy="350" r="26"/><circle cx="250" cy="350" r="7"/>' +
    '<path d="M226 5 V30 H274 V5" stroke="rgba(255,255,255,.55)"/><path d="M226 695 V670 H274 V695" stroke="rgba(255,255,255,.55)"/>' +
    '<path d="M214 4 V20 M226 4 V28 M274 4 V28 M286 4 V20 M214 696 V680 M226 696 V672 M274 696 V672 M286 696 V680" stroke="rgba(255,255,255,.8)" stroke-width="3"/>' +
    '</g></svg>';

  R.pitch = function (S, flashIdx) {
    return FIELD + ROWS.map(function (row, ri) {
      return '<div class="pitch-row ' + ROW_CLS[ri] + '">' + row.map(function (i) {
        var s = S.slots[i];
        var p = s.player;
        var tweakable = S.tweakMode && p;
        var sub = S.subMode, subCan = sub && sub.from == null && p && T.subTargets(i).length, subNo = sub && sub.from == null && p && !subCan;
        var subTo = sub && sub.from != null && !p && T.subTargets(sub.from).indexOf(i) !== -1, subFrom = sub && sub.from === i;
        if (subTo) return '<button type="button" class="slot is-empty is-subto" data-slot="' + i + '" aria-label="Move here: ' + esc(T.POS_NAMES[s.code]) + '"><span class="slot-code">' + esc(T.posLabel(s.code)) + '</span><span class="slot-pos">' + esc(T.POS_NAMES[s.code]) + '</span></button>';
        if (subCan || subFrom) tweakable = true;
        if (!p) {
          return '<div class="slot is-empty" data-slot="' + i + '"><span class="slot-code">' + esc(T.posLabel(s.code)) + '</span><span class="slot-pos">' + esc(T.POS_NAMES[s.code]) + '</span></div>';
        }
        var club = T.slotClub(s), c = T.club(club), cap = S.captain === i, choosing = S.capStep && S.captain == null;
        if (choosing) tweakable = true;
        return '<' + (tweakable ? 'button type="button"' : 'div') + ' class="slot is-filled' + goatCls(p) + (sub ? (subFrom ? ' is-subfrom' : subCan ? ' is-subcan' : subNo ? ' is-subno' : '') : choosing ? ' is-capcan' + (S.capPick === i ? ' is-cappick' : '') : tweakable ? ' is-tweakable' : '') + (flashIdx === i ? ' is-flash' : '') + (cap ? ' is-captain' : '') + '" data-slot="' + i + '" style="' + clubVars(club) + '"' +
          (tweakable ? ' aria-label="' + (choosing ? 'Make Captain: ' : sub ? 'Move ' : 'Swap out ') + esc(p.name) + ' ' + p.year + '"' : '') + '>' + kit(club, 108, 84) +
          '<span class="slot-code">' + esc(T.posLabel(s.code)) + '</span>' +
          '<span class="slot-abbr">' + (T.isGoat(p) ? '<span role="img" aria-label="GOAT">&#x1F410;</span>' : esc(c.abbr)) + '</span>' +
          '<span class="slot-name">' + esc(T.surname(p.name)) + '</span>' +
          '<span class="slot-year">' + p.year + '</span>' +
          '<span class="slot-tries" data-pts="' + p.tries_1998_plus + '">' + T.fmt(p.tries_1998_plus * (cap ? 2 : 1)) + '</span>' +
          (cap ? '<span class="slot-cap" title="SC Captain: his SC points count double">C &times;2</span>' : '') +
          (tweakable ? '</button>' : '</div>');
      }).join('') + '</div>';
    }).join('');
  };

  R.wildcardBar = function (S) {
    if (!S.mode.wildcards || S.fullTime) return '';
    var sub = R.subButton(S), key = R.keyTile(S), goat = R.goatTile(S), extras = (sub ? 1 : 0) + (key ? 1 : 0) + (goat ? 1 : 0), five = extras >= 2;
    var SHORT = { reroll: 'Reroll', scout: 'Reveal', tweak: 'Remove' };
    var ICO = { reroll: '&#x1F504;', scout: '&#x1F440;', tweak: '&#x274C;' };
    var savedN = function (k) {
      var A = window.CastAccount;
      if (S.finished || !S.mode.wildcards || S.wcLocked || !A || !A.canUseSaved || !A.canUseSaved()) return 0;
      var n = k === 'reroll' ? (A.rerollsSaved ? A.rerollsSaved() : 0) : k === 'tweak' ? (A.removesSaved ? A.removesSaved() : 0) : A.itemSaved ? A.itemSaved('reveal') : 0;
      return n > 0 ? n : 0;
    };
    return '<div class="wildcards' + (extras === 3 ? ' has-6' : five ? ' has-5' : extras ? ' has-4' : '') + '" role="group" aria-label="Wildcards">' +
      ['reroll', 'scout', 'tweak'].map(function (k) {
        var left = S.wildcards[k], usable = T.canUse(k);
        if (S.wcLocked && !left && !S.finished) {
          return '<button type="button" class="wc wc-' + k + ' wc-lock" data-action="wc-signin" title="Sign in free to use wildcards">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + ICO[k] + '</span> ' + esc(SHORT[k]) + '</span>' +
            '<span class="wc-left"><span aria-hidden="true">&#x1F512;</span> Sign in free</span></button>';
        }
        
        var A = window.CastAccount, buyable = !left && !S.finished && A && A.canBuyReroll && A.canUseSaved;
        if (k === 'reroll' && buyable && (A.canBuyReroll() || (A.canUseSaved() && A.rerollsSaved() > 0))) {
          var sv = A.rerollsSaved(), live = !!(S.offer && S.offer.players.length), fresh = !!(sv && A.rerollsFresh && A.rerollsFresh());
          return '<button type="button" class="wc wc-reroll wc-buy' + (fresh ? ' ca-rr-fresh' : '') + '" data-action="buy-reroll"' + (live ? '' : ' disabled') + ' title="' + (sv ? 'Use one of your saved Rerolls' : 'Buy an extra Reroll') + '">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + ICO.reroll + '</span> Reroll</span><span class="wc-left">' + (sv ? sv + (fresh ? ' ready' : ' left') : 'Buy &middot; ' + px('one', '$0.99')) + '</span></button>';
        }
        if (k === 'tweak' && buyable && A.canBuyRemove && (A.canBuyRemove() || (A.canUseSaved() && A.removesSaved() > 0))) {
          var rs = A.removesSaved(), can = T.filledCount() > 0 && !S.subMode, rfresh = !!(rs && A.removesFresh && A.removesFresh());
          return '<button type="button" class="wc wc-tweak wc-buy' + (rfresh ? ' ca-rr-fresh' : '') + '" data-action="buy-remove"' + (can ? '' : ' disabled') + ' title="' + (rs ? 'Use one of your saved Remove Players' : 'Buy an extra Remove Player') + '">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + ICO.tweak + '</span> ' + esc(SHORT.tweak) + '</span><span class="wc-left">' + (rs ? rs + (rfresh ? ' ready' : ' left') : 'Buy &middot; ' + px('remove1', '$0.99')) + '</span></button>';
        }
        if (k === 'scout' && buyable && A.buyItem && (A.canBuyReroll() || (A.canUseSaved() && A.itemSaved('reveal') > 0))) {
          var vs = A.itemSaved('reveal'), hidden = !!(S.offer && S.offer.players.some(function (p) { return !R.triesShown(S, p); }));
          var vok = hidden && !S.tweakMode && !S.subMode, vfresh = !!(vs && A.itemFresh('reveal'));
          return '<button type="button" class="wc wc-scout wc-buy' + (vfresh ? ' ca-rr-fresh' : '') + '" data-action="buy-reveal"' + (vok ? '' : ' disabled') + ' title="' + (vs ? 'Use one of your saved Reveals' : 'Buy an extra Reveal') + '">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + ICO.scout + '</span> Reveal</span><span class="wc-left">' + (vs ? vs + (vfresh ? ' ready' : ' left') : 'Buy &middot; ' + px('reveal1', '$0.99')) + '</span></button>';
        }
        if (k === 'reroll' && !left && !S.finished && A && A.bonusState && A.bonusState() !== 'none') {
          var guest = A.bonusState() === 'signin';
          return '<button type="button" class="wc wc-reroll wc-bonus" data-action="bonus-reroll" title="' + (guest ? 'Sign in for an extra Reroll every game' : 'Subscribe on YouTube for a free extra Reroll') + '">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + ICO.reroll + '</span> Reroll</span><span class="wc-left">' + (guest ? '+1: sign in' : '&#x25B6; +1 free') + '</span></button>';
        }
        
        if (k === 'scout' && !left && !S.scoutMode && !S.finished) {
          return '<button type="button" class="wc wc-scout wc-lock" data-action="wc-signin" title="Reveal comes from your Vault: sign in free to get one">' +
            '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + ICO.scout + '</span> Reveal</span><span class="wc-left"><span aria-hidden="true">&#x1F512;</span> Sign In</span></button>';
        }
        var armed = (k === 'tweak' && S.tweakMode) || (k === 'scout' && S.scoutMode);
        var label = SHORT[k]; 
        return '<button type="button" class="wc wc-' + k + (left ? '' : ' is-spent') + (armed ? ' is-armed' : '') + '" data-wildcard="' + k + '"' +
          ((usable || armed) ? '' : ' disabled') + ' title="' + esc(T.WILDCARDS[k].desc) + '">' +
          '<span class="wc-label"><span class="wc-ico" aria-hidden="true">' + ICO[k] + '</span> ' + esc(label) + '</span>' +
          '<span class="wc-left">' + (armed ? (k === 'scout' ? 'Tap a season' : 'Tap a player') : left ? (left + savedN(k)) + ' left' : 'Used') + '</span>' +
          '</button>';
      }).join('') + sub + key + goat + '</div>';
  };
  


  function goatName() { var g = T.goatPlayer && T.goatPlayer(); return g ? g.name + ' ' + g.year : 'The GOAT'; }
  function goatPts() { var g = T.goatPlayer && T.goatPlayer(); return g ? T.fmt(g.tries_1998_plus) : ''; }
  R.goatTile = function (S) {
    var A = window.CastAccount;
    if (S.finished || S.fullTime || S.challenge || S.daily || S.goatUsed || S.mode.id !== 'plus' || !T.goatPlayer || !T.goatPlayer()) return '';
    if (!A || !A.itemSaved || !A.isSignedIn || !A.isSignedIn()) return '';
    var n = A.itemSaved('goat'), buy = !(n > 0);
    if (buy && !(A.canBuyReroll && A.canBuyReroll())) return '';
    var ok = T.goatFits() && !S.tweakMode && !S.subMode && !S.scoutMode, room = T.goatRoom();
    return '<button type="button" class="wc wc-goat' + (ok && !buy ? ' is-ready' : '') + (buy ? ' wc-buy' : '') + '" data-action="goat"' + (ok ? '' : ' disabled') +
      ' title="' + (ok ? esc(goatName()) + ', ' + goatPts() + ' SC points, as your next pick' : room ? 'Ready for your next spin' : 'No open spot fits ' + esc(goatName())) + '"><span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F410;</span> The GOAT</span>' +
      '<span class="wc-left">' + (!room ? 'Spot Taken' : buy ? 'Buy &middot; ' + px('goat1', '$9.99') : n > 1 ? n + ' left' : 'Ready') + '</span></button>';
  };
  R.immTile = function () { return ''; };
  R.ilTile = function () { return ''; };
  R.immBack = function () { return ''; };
  R.goatSheet = function () {
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico goat-ico" aria-hidden="true">&#x1F410;</div>' +
      '<div class="sheet-kicker">The GOAT</div>' +
      '<h2 class="sheet-title center">Bring In ' + esc(goatName()) + '?</h2>' +
      '<p class="sheet-sub center">The biggest SC season of them all: ' + goatPts() + ' SC points. This spin becomes his season. Pick him and put him in an open spot he played.</p>' +
      '<button type="button" class="btn btn-primary btn-block btn-goat" data-action="confirm-goat">&#x1F410; ' + (window.CastAccount && CastAccount.itemSaved && CastAccount.itemSaved('goat') > 0 ? 'Use The GOAT' : 'Get The GOAT &middot; ' + px('goat1', '$9.99')) + '</button>' +
      '<button type="button" class="btn btn-quiet btn-block" data-action="close-sheet">Not Now</button>';
  };
  
  R.subButton = function (S) {
    var t = window.CastAccount && CastAccount.tier ? CastAccount.tier() : null;
    if (!t || t === 'guest' || S.finished || S.fullTime || !S.mode.wildcards) return '';
    if (t !== 'pass') return '<button type="button" class="wc wc-sub is-pass" data-action="sub-pass" title="Move a player into his other SC position (CAST Pass)"><span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F501;</span> Substitute</span><span class="wc-left wc-pass-tag">CAST Pass</span></button>';
    var left = S.subLeft || 0, armed = !!S.subMode, usable = T.canSub();
    return '<button type="button" class="wc wc-sub' + (left ? '' : ' is-spent') + (armed ? ' is-armed' : '') + '" data-wildcard="sub"' + (usable || armed ? '' : ' disabled') +
      ' title="Move a player into an open spot in his other SC position"><span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F501;</span> Substitute</span>' +
      '<span class="wc-left">' + (armed ? (S.subMode.from == null ? 'Tap a player' : 'Tap a spot') : left ? left + ' left' : 'Used') + '</span></button>';
  };

  

  function keyState(S) {
    if (S.mode.id !== 'plus' || S.finished || S.fullTime || S.challenge || !window.CastAccount || !CastAccount.vault) return null;
    return CastAccount.vault('legend');
  }
  function keyLeft() { var n = window.CastAccount && CastAccount.keyCount ? CastAccount.keyCount('legend') : 1; return n > 1 ? n + ' left' : 'Ready'; }
  R.keyTile = function (S) {
    var v = keyState(S);
    if (!v) return '';
    var lab = '<span class="wc-label"><span class="wc-ico" aria-hidden="true">&#x1F511;</span> Legend Key</span>';
    var why = !T.legendKeyRoom() ? 'No Legend season fits your open spots' : 'Ready for your next spin';
    if ((v === 'pass' || v === 'used') && CastAccount.buyKey && CastAccount.canBuyKey && CastAccount.canBuyKey()) {
      var bf = T.legendKeyFits() && !S.tweakMode && !S.subMode && !S.scoutMode;
      return '<button type="button" class="wc wc-key wc-buy" data-action="buy-key"' + (bf ? '' : ' disabled') +
        ' title="' + (bf ? 'Buy a Legend Key: swap this spin for a Legends Pick' : why) + '">' + lab + '<span class="wc-left">Buy &middot; ' + px('legend1', '$1.99') + '</span></button>';
    }
    if (v === 'pass') return '<button type="button" class="wc wc-key is-pass" data-action="legend-key-pass" title="A Legends Pick when you want it, once a day (CAST Pass)">' + lab + '<span class="wc-left wc-pass-tag">CAST Pass</span></button>';
    if (v === 'used') return '<div class="wc wc-key is-used" title="A new Legend Key arrives at midnight, Sydney time">' + lab + '<span class="wc-left">' + (CastAccount.keyCountdown ? CastAccount.keyCountdown() : 'Back at midnight') + '</span></div>';
    var fits = T.legendKeyFits() && !S.tweakMode && !S.subMode && !S.scoutMode, room = T.legendKeyRoom();
    return '<button type="button" class="wc wc-key' + (fits ? ' is-ready' : '') + '" data-action="legend-key"' + (fits ? '' : ' disabled') +
      ' title="' + (fits ? 'Swap this spin for a Legends Pick' : why) + '">' + lab +
      '<span class="wc-left">' + (fits || room ? keyLeft() : 'No fit') + '</span></button>';
  };
  
  R.keySwap = function (S) {
    if (keyState(S) !== 'ready' || S.tweakMode || S.subMode || S.scoutMode || !T.legendKeyFits() || !(S.offer && S.offer.players.length) || S.offer.goat || S.offer.paid) return '';
    return '<button type="button" class="key-swap" data-action="legend-key"><span aria-hidden="true">&#x1F511;</span> Not these? Swap for a Legends Pick</button>';
  };

  

  function usedOffer(S, p) { return !!(S.offer && (S.offer.paid || S.offer.key || S.offer.goat) && S.offer.players.indexOf(p) >= 0); }
  R.triesShown = function (S, p) { return !!S.revealed[p.id] || usedOffer(S, p); };
  function triesBadge(S, p) {
    if (R.triesShown(S, p)) return '<span class="tries-badge is-revealed"><strong>' + T.fmt(p.tries_1998_plus) + '</strong> SC points</span>';
    return '<span class="tries-badge"><strong>??</strong> SC points</span>';
  }

  
  R.removeMode = function (S) {
    return '<div class="panel-head"><span class="panel-title">Remove a Player</span><span class="panel-meta">Spin paused</span></div>' +
      R.wildcardBar(S) +
      '<div class="remove-mode">' +
        '<div class="rm-ico" aria-hidden="true">&#x274C;</div>' +
        '<p class="rm-title">Tap a player in your 18 to remove him</p>' +
        '<p class="rm-sub">His spot reopens and his season goes back in the pool. Your spin comes back after.</p>' +
        '<span class="rm-arrow" aria-hidden="true">&darr;</span>' +
        '<button type="button" class="btn btn-ghost btn-block" data-action="cancel-tweak">Cancel</button>' +
      '</div>';
  };

  
  
  function seasonCard(S, p, n) {
    var club = p.club, c = T.club(club), scout = S.scoutMode && !R.triesShown(S, p);
    return '<button type="button" class="pcard' + goatCls(p) + (scout ? ' is-scout' : '') + '" ' + (scout ? 'data-scout' : 'data-pick') + '="' + esc(p.id) + '" style="' + clubVars(club) + 'animation-delay:' + (n * 70) + 'ms"' + (S.tweakMode ? ' disabled' : '') +
      ' aria-label="' + esc((scout ? 'Reveal ' : 'Pick ') + p.name + ', ' + p.year + ', ' + c.name) + '">' +
      '<span class="pcard-plate">' + kit(club, 340, 46) + '<span class="pcard-club">' + esc(c.name) + '</span><span class="pcard-yr">' + p.year + '</span>' + tierTag(p) + '</span>' +
      '<span class="pcard-body">' +
        '<span class="pcard-name">' + nameHtml(p) + '</span>' +
        '<span class="pcard-meta">' + posChips(p) + '</span>' +
      '</span>' +
      '<span class="pcard-foot">' + triesBadge(S, p) + '<span class="pcard-cta">' + (scout ? '&#x1F440; Reveal' : '<kbd class="pcard-key" aria-hidden="true">' + (n + 1) + '</kbd>Pick') + '</span></span>' +
      '</button>';
  }
  R.seasonCard = seasonCard;

  

  R.pickClock = function (S) {
    if (!T.clockMode || !T.clockMode(S) || S.tweakMode || !S.offer || !S.offer.players.length) return '';
    var v = T.clockView(S), left = Math.ceil(v.left / 1000);
    return '<div class="pick-clock' + (v.paused ? ' is-paused' : v.left <= 5000 ? ' is-low' : '') + '" data-pick-clock role="timer" aria-label="Time to pick">' +
      '<i style="width:' + Math.min(100, v.left / (v.secs * 10)).toFixed(1) + '%"></i>' +
      '<span class="pc-lbl"><span class="pc-run">&#x23F1;&#xFE0F; Time to Pick</span><span class="pc-wait">&#x23F8;&#xFE0F; Paused</span></span>' +
      '<b>' + left + 's</b></div>';
  };

  R.offerRoll = function (S) {
    if (S.tweakMode) return R.removeMode(S);
    var players = S.offer ? S.offer.players : [], special = S.offer && S.offer.special;
    return '<div class="panel-head' + (special ? ' is-' + special : '') + '">' +
        '<span class="panel-title">' + (S.offer && S.offer.goat ? '&#x1F410; The GOAT' : special ? '&#x2B50; Legends Pick' : 'Pick 1') + '</span>' +
        '<span class="panel-meta">' + (special ? 'Pick 1 of 3 Legend seasons &middot; SC points shown' : S.offer && S.offer.goat ? 'SC points shown' : S.scoutMode ? 'Tap the season to see' : 'SC points hidden until you pick') + '</span>' +
      '</div>' +
      R.pickClock(S) +
      R.wildcardBar(S) +
      R.tweakBanner(S) +
      (S.scoutMode ? '<div class="scout-banner"><span>Tap one season to see his SC points. Nothing is picked.</span><button type="button" class="btn btn-ghost btn-sm" data-action="cancel-scout">Cancel</button></div>' : '') +
      '<div class="offer-cards">' + players.map(function (p, n) { return seasonCard(S, p, n); }).join('') + '</div>';
  };

  

  R.spinning = function (S) {
    var reel = function (i) {
      return '<div class="spin-reel" data-reel="' + i + '"><span class="kit-slot"></span><span class="sr-club">&nbsp;</span><span class="sr-year">?</span></div>';
    };
    return '<div class="panel-head"><span class="panel-title">&#x1F3B0; Spinning</span><span class="panel-meta">Three player seasons</span></div>' +
      R.wildcardBar(S) +
      '<div class="spin-reels" aria-hidden="true">' + reel(0) + reel(1) + reel(2) + '</div>' +
      '<p class="spin-note" role="status">Spinning for three seasons from ' + T.FIRST_YEAR + ' to ' + T.LAST_YEAR + '</p>';
  };
  R.reel = function () { return ''; };

  R.tweakBanner = function (S) {
    if (!S.tweakMode) return '';
    return '<div class="tweak-banner"><span>Tap a player in your 18 to remove him. His spot reopens and his season goes back in the pool.</span>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-action="cancel-tweak">Cancel</button></div>';
  };

  
  
  R.decision = function (S) {
    var paid = S.wildcards.tweak < 1;
    var rs = paid && window.CastAccount && CastAccount.removesSaved ? CastAccount.removesSaved() : 0;
    var msg = !paid ? 'You still have Remove Player. Swap one out and spin for his spot, or lock in your 18 and see your SC points.'
      : rs ? 'You have ' + rs + ' saved Remove Player' + (rs === 1 ? '' : 's') + '. Swap one out and spin for his spot, or lock in your 18.'
        : 'Swap one out and spin for his spot for ' + px('remove1', '$0.99') + ', or lock in your 18 and see your SC points.';
    return '<div class="panel-head"><span class="panel-title">Team Full</span><span class="panel-meta">' + T.SLOTS.length + ' of ' + T.SLOTS.length + '</span></div>' +
      '<div class="decision">' +
        '<p class="decision-big">Happy With Your 18?</p>' +
        '<p>' + esc(msg) + '</p>' +
        (S.tweakMode ? R.tweakBanner(S) :
        '<div class="btn-row">' +
          (paid ? '<button type="button" class="btn btn-decide btn-decide-remove" data-action="buy-remove"><span class="btn-decide-lbl">&#x274C; Remove &middot; ' + (rs ? rs + ' left' : px('remove1', '$0.99')) + '</span></button>'
            : '<button type="button" class="btn btn-decide btn-decide-remove" data-wildcard="tweak"><span class="btn-decide-lbl">&#x274C; Remove&nbsp;Player</span></button>') +
          '<button type="button" class="btn btn-decide btn-decide-lock" data-action="lock-in" aria-label="Lock in your 18' + (S.lockHold ? '' : ' (locks in automatically in ' + T.LOCK_SECS + ' seconds)') + '">' +
            '<span class="lock-fill" aria-hidden="true"></span>' +
            '<span class="btn-decide-lbl">&#x1F512; Lock In' + (S.lockHold ? '' : ' <b class="lock-secs">' + T.LOCK_SECS + '</b>') + '</span></button>' +
        '</div>') +
      '</div>';
  };

  



  R.captainStep = function (S, have, signIn) {
    var p = S.slots[S.capPick] && S.slots[S.capPick].player, add = p ? p.tries_1998_plus : 0;
    return '<div class="panel-head"><span class="panel-title">&#x1F396;&#xFE0F; SC Captain</span><span class="panel-meta">' + T.SLOTS.length + ' of ' + T.SLOTS.length + '</span></div>' +
      '<div class="decision is-cap">' +
        '<p class="decision-big"><span id="capTotal">' + T.fmt(T.total()) + '</span> <small>SC points</small></p>' +
        '<p class="cap-line">Make one of your 18 the <b>SC Captain</b> and his SC points count double.</p>' +
        (p ? '<div class="cap-pick" style="' + clubVars(p.club) + '">' + kit(p.club, 340, 64) + '<span class="cap-who"><b>' + esc(p.name) + '</b> ' + p.year + '</span><span class="cap-add">+' + T.fmt(add) + '</span></div>' +
          '<p class="cap-hint">Tap anyone on your field to choose a different Captain.</p>' : '') +
        '<div class="btn-row is-stack">' +
          '<button type="button" class="btn btn-decide btn-decide-cap" data-action="captain"' + (p ? '' : ' disabled') + '><span class="btn-decide-lbl">&#x1F396;&#xFE0F; ' +
            (signIn ? 'Sign In to Set a Captain' : have ? 'Set Captain &middot; ' + (have > 1 ? have + ' Left' : 'Use 1') : 'Set Captain &middot; ' + px('cap1', '$4.99')) + '</span></button>' +
          '<button type="button" class="btn btn-decide btn-decide-lock" data-action="no-captain">' +
            '<span class="lock-fill" aria-hidden="true"></span><span class="btn-decide-lbl">No Thanks, Finish' + (S.lockHold ? '' : ' <b class="lock-secs">' + T.LOCK_SECS + '</b>') + '</span></button>' +
        '</div>' +
      '</div>';
  };

  
  R.slotChooser = function (p, codes) {
    var club = p.club, c = T.club(club);
    return '<div class="chooser-card' + goatCls(p) + '" style="' + clubVars(club) + '">' +
        '<span class="pcard-plate">' + kit(club, 340, 46) + '<span class="pcard-club">' + esc(c.name) + '</span><span class="pcard-yr">' + p.year + '</span></span>' +
        '<span class="chooser-name">' + nameHtml(p) + '</span>' +
      '</div>' +
      '<p class="chooser-q">Where do you want him?</p>' +
      '<div class="chooser-spots">' + codes.map(function (code) {
        return '<button type="button" class="chooser-spot" data-place="' + esc(code) + '">' +
          '<span class="cs-code">' + esc(T.posLabel(code)) + '</span>' +
          '<span class="cs-pos">' + esc(T.POS_NAMES[code]) + '</span>' +
          '<span class="cs-tag">Place here</span>' +
          '</button>';
      }).join('') + '</div>' +
      '<button type="button" class="chooser-back" data-action="close-sheet">&larr; Pick Someone Else</button>';
  };

  R.subscribeBtn = function (where) {
    return '<a class="yt-sub" href="https://www.youtube.com/@thecastpatrol?sub_confirmation=1" target="_blank" rel="noopener" data-track="click_subscribe" data-where="' + esc(where) + '">' +
      '<img class="yt-avatar" src="assets/logos/cast-patrol-avatar.jpg" alt="" width="40" height="40">' +
      '<span class="yt-text"><span class="yt-kicker">Enjoying ' + esc(T.GAME_NAME) + '?</span><span class="yt-label">Subscribe to The Cast Patrol</span></span>' +
      '<svg class="yt-logo" viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" rx="5" fill="#fff"/><path d="M11 5.5v9l8-4.5z" fill="#FF0000"/></svg>' +
      '</a>';
  };

  R.newGameSheet = function (S) {
    var daily = S.mode.id === 'daily' || !!S.daily;
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico" aria-hidden="true">&#x1F504;</div>' +
      '<div class="sheet-kicker">New Game</div>' +
      '<h2 class="sheet-title center">Start a New Game?</h2>' +
      '<p class="sheet-sub center">' + (daily ? 'This Daily Challenge go still counts as used.' : 'This 18 will be lost.') + ' Go again or head back to the home page.</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="confirm-restart"><span aria-hidden="true">&#x1F504;</span>' + (daily ? 'Play Again' : 'Play ' + esc(S.mode.name) + ' Again') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="confirm-change-mode"><span aria-hidden="true">&#x1F3E0;</span>Back to Home</button>' +
      '<button type="button" class="btn btn-quiet btn-block" data-action="close-sheet">Keep Playing</button>' +
      R.subscribeBtn('new_game');
  };
  R.restartSheet = function () {
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico" aria-hidden="true">&#x1F504;</div>' +
      '<div class="sheet-kicker">Play Again?</div>' +
      '<h2 class="sheet-title center">Not Happy With Your Picks?</h2>' +
      '<p class="sheet-sub center">This 18 will be lost and you start a new one.</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="confirm-restart">Start a New 18</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="close-sheet">Keep Going</button>' +
      R.subscribeBtn('play_again');
  };
  R.resumeSheet = function (name, picks) {
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico" aria-hidden="true">&#x1F3C9;</div>' +
      '<div class="sheet-kicker">Your Draft Is Saved</div>' +
      '<h2 class="sheet-title center">Pick Up Where You Left Off?</h2>' +
      '<p class="sheet-sub center">Your ' + esc(name) + ' 18 has ' + picks + ' of ' + T.SLOTS.length + ' picked, with everything you used still in it.</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="resume-draft">Continue My Draft</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="drop-draft">Start Fresh</button>';
  };
  R.changeModeSheet = function (S) {
    return '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="confirm-ico" aria-hidden="true">&#x1F3E0;</div>' +
      '<div class="sheet-kicker">Leave This Game?</div>' +
      '<h2 class="sheet-title center">Head Back to the Home Page?</h2>' +
      '<p class="sheet-sub center">You are playing ' + esc(S.mode.name) + '. This 18 will be lost.</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="confirm-change-mode">Back to Home</button>' +
      '<button type="button" class="btn btn-ghost btn-block sheet-gap" data-action="close-sheet">Keep Going</button>' +
      R.subscribeBtn('change_mode');
  };

  
  R.reveal = function (p, club) {
    return '<div class="reveal' + goatCls(p) + '" style="' + clubVars(club || p.club) + '">' + kit(club || p.club, 340, 120) +
      '<span class="reveal-name">' + nameHtml(p) + '</span>' +
      '<span class="reveal-yr">' + p.year + ' &middot; ' + esc(T.club(p.club).nick) + '</span>' +
      '<span class="reveal-num">' + T.fmt(p.tries_1998_plus) + '</span><span class="reveal-lbl">' + (T.isGoat(p) ? 'SC Points. The GOAT.' : T.isLegend(p) ? 'SC Points. A Legend season.' : 'SC Points') + '</span></div>';
  };

  



  var RB_TABS = [['today', 'Today'], ['week', 'This Week'], ['all', 'All Time']];
  R.resBoard = function (v) {
    var b = v.data[v.period], score = v.score, label = RB_TABS.filter(function (t) { return t[0] === v.period; })[0][1];
    var tabs = '<div class="rb-tabs" role="tablist">' + RB_TABS.map(function (t) {
      return '<button type="button" role="tab" class="rb-tab' + (t[0] === v.period ? ' is-on' : '') + '" aria-selected="' + (t[0] === v.period) + '" data-action="rb-tab" data-v="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
    var head = '<div class="rb-head"><span class="rb-kick">&#x1F451; Leaderboard</span>', body;
    if (!b) return head + '</div>' + tabs + '<p class="rb-note">Loading the board&hellip;</p>';
    if (b.failed) return head + '</div>' + tabs + '<p class="rb-note">The board didn&rsquo;t load. <button type="button" class="rb-retry" data-action="rb-retry">Try Again</button></p>';
    
    var myName = b.me && b.me.name, top = b.top || [], rows = top.map(function (r) { return myName && r.n === myName ? { n: r.n + ' (your best)', s: r.s, mine: true } : r; });
    var ahead = rows.filter(function (r) { return r.s >= score; }).length;
    var whole = top.length < 100 || (b.players || 0) <= top.length; 
    var inTop = ahead < rows.length || whole;
    var you = { n: myName ? myName + ' (this game)' : 'You', s: score, you: true };
    var list = inTop ? rows.slice(0, ahead).concat([you], rows.slice(ahead)) : rows.concat([you]);
    var at = inTop ? ahead : list.length - 1, rank = inTop ? ahead + 1 : (v.own && v.own[v.period]) || null;
    var show = {};
    [0, 1, 2, at - 1, at, at + 1].forEach(function (i) { if (i >= 0 && i < list.length) show[i] = 1; });
    var idx = Object.keys(show).map(Number).sort(function (x, y) { return x - y; }), out = [], prev = -1;
    idx.forEach(function (i) {
      if (i > prev + 1) out.push('<li class="rb-gap" aria-hidden="true">&middot;&middot;&middot;</li>');
      var r = list[i], n = !inTop && i === list.length - 1 ? (rank ? '#' + T.fmt(rank) : '100+') : '#' + (i + 1);
      out.push('<li class="rb-row' + (r.you ? ' is-you' : '') + (r.mine ? ' is-mine' : '') + (i === 0 ? ' is-king' : '') + '"><span class="rb-rank">' + n + '</span><span class="rb-name">' + esc(r.n) +
        (i === 0 ? ' <span class="rb-crown" role="img" aria-label="SC Points King">&#x1F451;</span>' : '') + '</span><span class="rb-pts">' + T.fmt(r.s) + '</span></li>');
      prev = i;
    });
    
    var above = null;
    for (var k = at - 1; k >= 0; k--) if (!list[k].mine) { above = list[k]; break; }
    var pass = !above ? (rows.length ? 'Top of the board: the SC Points King &#x1F451;' : 'Nobody on this board yet: the crown is yours &#x1F451;')
      : !inTop ? '<b>' + T.fmt(above.s - score + 1) + '</b> SC points to reach the top 100'
      : '<b>' + T.fmt(above.s - score + 1) + '</b> SC points to pass ' + esc(above.n);
    head += '<b class="rb-where">' + (rank ? '#' + T.fmt(rank) : '#100+') + ' ' + label + '</b></div>';
    body = '<ol class="rb-list">' + out.join('') + '</ol><p class="rb-pass">' + pass + '</p>';
    if (!b.me) body += '<p class="rb-note">Your score isn&rsquo;t on the board yet.</p><button type="button" class="btn btn-ghost btn-block rb-signin" data-action="rb-signin">Sign In Free to Save It</button>';
    else if (b.me.hidden) body += '<p class="rb-note">You&rsquo;ve hidden your name from the leaderboards.</p>';
    return head + tabs + body;
  };

  R.videos = function () { return ''; };
  R.unibet = function () { return ''; };

  
  R.HEAD_CUTS = [37000, 35000, 31000];
  R.headline = function (S, out) {
    if (S.daily) {
      return out.win ? { title: 'Daily Challenge Won', sub: 'Your 18 made ' + T.fmt(out.total) + ' SC points, past today\u2019s ' + T.fmt(out.target) + '.' }
        : { title: T.fmt(out.total) + ' SC Points', sub: T.fmt(out.target - out.total) + ' short of today\u2019s ' + T.fmt(out.target) + '. Go again.' };
    }
    if (S.pb && S.pbBefore) return { title: 'New Personal Best', sub: 'Up ' + T.fmt(out.total - S.pbBefore) + ' on your best. Keep climbing.' };
    var t = out.total, cut = R.HEAD_CUTS;
    var lines = t >= cut[0] ? ['A Royal 18', 'That is an 18 fit for the crown.'] : t >= cut[1] ? ['A Serious 18', 'That would win a lot of SC leagues.']
      : t >= cut[2] ? ['Solid Season', 'Good picks. Spin again and chase the crown.'] : ['Rebuild Time', 'Some quiet seasons in there. Spin again.'];
    return { title: lines[0], sub: lines[1] };
  };

  function luckLine(S) {
    var k = T.luckPct ? T.luckPct() : null;
    if (k == null) return '';
    return '<p class="result-luck' + (k >= 5 ? ' is-lucky' : k <= -5 ? ' is-tough' : '') + '">' +
      (k >= 5 ? '&#x1F340; Lucky spins: your cards held ' + k + '% more SC points than an average game'
        : k <= -5 ? '&#x1F327;&#xFE0F; Tough spins: your cards held ' + (-k) + '% fewer SC points than an average game'
          : '&#x2696;&#xFE0F; Fair spins: your cards held about as many SC points as an average game') + '</p>';
  }

  R.results = function (S, out) {
    var h = R.headline(S, out), best = null;
    S.slots.forEach(function (s) { if (s.player && (!best || s.player.tries_1998_plus > best.tries_1998_plus)) best = s.player; });
    var rows = T.FIELD_ORDER.map(function (i) {
      var s = S.slots[i], p = s.player;
      if (!p) return '<li class="rrow is-empty"><span class="rrow-code">' + esc(T.posLabel(s.code)) + '</span><span class="rrow-name">Not picked</span><span class="rrow-tries">&nbsp;</span></li>';
      var club = T.slotClub(s), c = T.club(club);
      return '<li class="rrow' + goatCls(p) + (p === best ? ' is-best' : '') + '" style="' + clubVars(club) + '">' +
        '<span class="rrow-code">' + esc(T.posLabel(s.code)) + '</span>' +
        '<span class="rrow-club">' + esc(c.abbr) + '</span>' +
        '<span class="rrow-name">' + nameHtml(p) + ' <span class="rrow-yr">' + p.year + '</span>' + (S.captain === i ? ' <span class="cap-tag">Captain &times;2</span>' : p === best ? ' <span class="best-tag">Top Season</span>' : '') +
          '<small class="rrow-sub">' + esc(c.nick) + ' &middot; ' + p.games + ' game' + (p.games === 1 ? '' : 's') + '</small></span>' +
        '<span class="rrow-tries">' + T.fmt(p.tries_1998_plus * (S.captain === i ? 2 : 1)) + '</span>' +
        '</li>';
    }).join('');
    
    var pb = T.bestScore ? T.bestScore() : 0;
    var pbRow = !S.daily ? '<div class="result-pb' + (S.pb ? ' is-new' : '') + '"><span>Your Best</span><b>' + T.fmt(Math.max(pb, out.total)) + '</b></div>' +
      (T.crownOn && T.crownOn() ? '<p class="result-crown">&#x1F451; Each leaderboard&rsquo;s #1 wears the crown as the SC Points King.</p>' : '') : '';
    return '<div class="result-hero ' + (out.win || (S.pb && S.pbBefore) ? 'is-win' : 'is-done') + '">' +
        '<div class="result-kicker">' + esc(S.daily ? 'Daily Challenge' : S.mode.name) + '</div>' +
        '<div class="result-total"><span class="rt-num" id="rtNum">' + T.fmt(out.total) + '</span><span class="rt-of">SC Points</span></div>' +
        '<h1 id="resultTitle" class="result-title">' + (out.win || S.pb ? '&#x1F389; ' : '') + esc(h.title) + '</h1>' +
        (h.sub ? '<p class="result-sub">' + esc(h.sub) + '</p>' : '') +
        pbRow + luckLine(S) +
      '</div>' +
      (!S.daily ? '<section class="res-board" id="resBoard" aria-label="Leaderboard" hidden></section>' : '') +
      '<div class="res-acts">' +
        '<button type="button" class="btn btn-res btn-res-again btn-block" data-action="play-again"><span aria-hidden="true">&#x1F504;</span> Play Again</button>' +
        '<div class="res-two">' +
          '<button type="button" class="btn btn-res btn-res-share" data-action="share"><span aria-hidden="true">&#x1F4E4;</span> Share</button>' +
          '<button type="button" class="btn btn-res btn-res-mode" data-action="results-home"><span aria-hidden="true">&#x1F3E0;</span> Home</button>' +
        '</div>' +
      '</div>' +
      '<div data-cast-results></div>' +
      '<div class="panel">' +
        '<div class="panel-head is-stack"><span class="panel-title">Your 18</span><span class="panel-meta">Season SC points</span></div>' +
        '<ol class="rlist">' + rows + '</ol>' +
        '<div class="rsum"><span>Total' + (S.captain != null ? ' (Captain &times;2)' : '') + '</span><strong>' + T.fmt(out.total) + '</strong></div>' +
      '</div>';
  };
})(window.T = window.T || {});
