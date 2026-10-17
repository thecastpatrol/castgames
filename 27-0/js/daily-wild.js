/* 27-0 Daily Challenge draft extras (Daily, and Hard mode's list tools; pick a spot on the pitch also works in Classic).
   - Ratings are hidden in the squad list (they show on the pitch once a player is placed)
   - Sort the squad by Position or Surname A-Z
   - 1000TRIES-style wildcards, one each per go: Reroll, Reveal Ratings, Remove Player
   - Classic seasons get them too once the CAST tiers are on: 1 of each with a free CAST Profile, 2 with CAST Pass.
     Reveal Ratings only shows when ratings are hidden. A guest sees them locked: a tap asks them to sign in free,
     and they unlock in the same season. A wildcard that can't be used yet explains when it can, instead of doing nothing
   - Substitute (CAST Pass, Classic, 1 a season): move a player already in your 13 into another open spot they can play
     (Arrow from lock to the second row, so Fittler can go in at lock). A free profile sees it with the CAST Pass tag
   - Squad full with Remove Player unused: remove one, or lock in (auto locks in after 10 seconds). In Classic, a player 15+
     with none left gets the same choice with a saved or bought one (Remove Player packs, like rerolls)
   - Pick a spot: tap an empty spot on the pitch and the squad list shows who can play there (Classic, Daily, Hard) */
(function () {
  'use strict';
  // A pack's price as this device shows it (local currency, 17 Oct 2026: "NZ$0.99"; CastAccount.price), else the A$ words
  function px(pack, aud) { return window.CastAccount && CastAccount.price ? CastAccount.price(pack, aud) : aud; }
  var ORDER = ['FB', 'W', 'C', 'FE', 'HB', 'HK', 'P', 'SR', 'LK'];
  var LOCK_SECS = 10;

  function on() { return !!(window.CastDaily && CastDaily.isActive && CastDaily.isActive()) && document.getElementById('draft'); }
  function tierNow() { return window.CastAccount && CastAccount.tier ? CastAccount.tier() : null; }
  /* A Classic season once the tiers are on (not the Daily, Pack or Hard Mode). World Cup 8-0 (js/world-cup.js) gets the
     same wildcards (the owner's 'wildcards only' for World Cup), all but the Superstar Key, which needs club seasons */
  function classicOn() { return !on() && tierNow() !== null && !!document.getElementById('draft') && typeof STATE !== 'undefined' && !!STATE && (STATE.gameMode === 'classic' || STATE.gameMode === 'wc'); }
  /* Hard Mode (29 Sep 2026, the owner's call): wildcards, but only paid ones. One of each a season (Reroll, Reveal Ratings,
     Remove Player), from the Vault or bought on the spot, for everyone (CAST Pass too); no Substitute or Superstar Key */
  function hardOn() { return !on() && tierNow() !== null && !!document.getElementById('draft') && typeof STATE !== 'undefined' && !!STATE && STATE.gameMode === 'hard'; }
  function wild() { return !!on() || classicOn() || hardOn(); }
  function locked() { return (classicOn() || hardOn()) && tierNow() === 'guest'; }
  // Of each kind: 1 in the Daily for everyone; in Classic 1 with a profile, 2 with CAST Pass (0 for a guest: locked); none free in Hard
  function allowed() { if (on()) return 1; if (hardOn()) return 0; var n = window.CastAccount && CastAccount.wildcardCount ? CastAccount.wildcardCount() : 0; return n || 0; }
  // Hard Mode: this season's paid one of that kind is used
  function hardUsed(k) { return hardOn() && !!(W().hardUsed || {})[k]; }
  // A saved or bought one can be offered: Classic; the Daily once its free one is used (30 Sep 2026, the owner's call; not a
  // replay of a past Daily); Hard until that kind's one is used
  function replay() { return !!(window.CastDaily && CastDaily.isReplay && CastDaily.isReplay()); }
  function payOn(k) { return classicOn() || (!!on() && !replay()) || (hardOn() && !hardUsed(k)); }
  // Saved Rerolls, Reveals or Remove Players this game can use once its own are gone (0 when none, or not in this mode)
  function savedFor(k) {
    var A = window.CastAccount;
    if (!A || !A.canUseSaved || !A.canUseSaved() || !payOn(k) || hardOn()) return 0;
    var n = k === 'reroll' ? (A.rerollsSaved ? A.rerollsSaved() : 0) : k === 'remove' ? (A.removesSaved ? A.removesSaved() : 0) : k === 'reveal' ? (A.itemSaved ? A.itemSaved('reveal') : 0) : 0;
    return n > 0 ? n : 0;
  }
  function ratingsHidden() { return !!on() || !STATE.showRatings; }
  // Substitute: CAST Pass only, 1 a Classic season ('pass' when they have it, 'profile' or 'guest' see it locked)
  // Substitute: CAST Pass, with a free profile seeing it locked; never shown to a guest, as in every draft game (17 Oct 2026)
  function subTier() { var t = classicOn() ? tierNow() : null; return t === 'guest' ? null : t; }
  function W() { if (!STATE.__wc) STATE.__wc = { hardUsed: {}, revealN: 0, removeN: 0, subN: 0, sub: null, arming: false, revealSpin: null, sort: 'pos', dir: 1, q: '', qSpin: null, searching: false, slot: null }; return STATE.__wc; }
  // The squad list tools (sort, search, pick a spot) run in the Daily and in Hard mode
  function tools() { return !!document.getElementById('draft') && (on() || STATE.gameMode === 'hard') && STATE.gameMode !== 'pack'; }
  // Pick a spot on the pitch: every spin mode (Classic, Daily and Hard); Pack has its own
  function spots() { return !!document.getElementById('draft') && !!STATE && STATE.gameMode !== 'pack'; }
  // The spot picked on the pitch, while it is still empty
  function pickedSlot() {
    var w = STATE && STATE.__wc;
    if (!w || w.slot == null) return null;
    var s = SLOTS.filter(function (x) { return x.i === w.slot; })[0];
    if (!s || STATE.team[w.slot]) { w.slot = null; return null; }
    return s;
  }
  function fits(p, s) { return p.positions.some(function (pos) { return (ELIGIBLE_SLOTS[pos] || [pos]).indexOf(s.type) >= 0; }); }
  // A picked spot names its position without left or right ("Centre", "Wing"): both spots of it light up
  function posName(s) { return String(s.label).replace(/^(Left|Right)\s+/i, ''); }
  function spinOn() { return !!(STATE.currentSpin && STATE.currentSpin.players && STATE.currentSpin.players.length && !STATE.spinPickedThisSpin); }
  function filled() { return STATE.team.filter(function (p) { return p; }).length; }
  function surname(n) { return String(n).split(' ').slice(-1)[0].toLowerCase(); }
  function after(name, fx) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () { var out = orig.apply(this, arguments); try { fx.apply(this, arguments); } catch (e) { /* cosmetic */ } return out; };
  }

  // Wildcard moment, same look as 1000TRIES / the 27-0 reroll burst
  function burst(kind, ico, title, sub) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var el = document.createElement('div');
    el.className = 'cp-burst cpw-burst-' + kind;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="cp-burst-ring"></span><span class="cp-burst-ring cp-burst-ring2"></span>' +
      '<span class="cp-burst-card"><span class="cp-burst-ico">' + ico + '</span><span class="cp-burst-title">' + title + '</span>' +
      '<span class="cp-burst-sub">' + sub + '</span></span>';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400);
  }

  /* ---------- Wildcard bar ---------- */
  function bar() {
    var b = document.getElementById('cpWild');
    if (!b) {
      var zone = document.querySelector('#draft .spin-zone');
      if (!zone) return null;
      b = document.createElement('div');
      b.id = 'cpWild';
      b.className = 'cpw-bar';
      b.setAttribute('role', 'group');
      b.setAttribute('aria-label', 'Wildcards');
      zone.appendChild(b);
      b.addEventListener('click', onWild);
    }
    return b;
  }
  function revealedNow() { var w = W(); return w.revealSpin != null && w.revealSpin === STATE.currentSpin; }
  function renderBar() {
    var b = bar();
    if (!b) return;
    var show = wild() && STATE.gameMode !== 'pack';
    document.body.classList.toggle('cpw-classic', show && (classicOn() || hardOn())); // the bar replaces Classic's lone Reroll button
    if (!show) { b.hidden = true; return; }
    b.hidden = false;
    if (classicOn() && STATE.__cpExtra === undefined && typeof updateRerollBtn === 'function') updateRerollBtn(); // theme-fx.js settles this season's rerolls
    var w = W(), n = allowed(), lock = locked();
    // Reroll: the base one plus any extras (theme-fx.js: CAST Pass adds one); when they're gone the YouTube bonus can add one
    var rrLeft = STATE.__tierLocked ? 0 : (STATE.rerollUsed ? 0 : 1) + (classicOn() ? STATE.__cpExtra || 0 : 0);
    var bonus = classicOn() && !lock && !rrLeft && window.CastAccount && CastAccount.bonusState && CastAccount.bonusState() !== 'none';
    var items = [['reroll', '&#x1F504;', 'Reroll', rrLeft, rrLeft && spinOn(), 'Spin first, then Reroll swaps the squad you get.']];
    // Reveal Ratings: bought ones used this season add to it (w.revealExtra)
    var rvN = n + (w.revealExtra || 0);
    if (ratingsHidden()) items.push(['reveal', '&#x1F440;', 'Reveal', Math.max(0, rvN - w.revealN), rvN - w.revealN > 0 && spinOn() && !revealedNow(),
      revealedNow() ? 'Every rating in this squad is already showing.' : 'Spin first, then reveal every rating in the squad.']);
    // Remove Player works any time there is someone in your 13, even with a squad showing (like 1000TRIES); bought ones
    // used this season add to it (w.removeExtra)
    var rmN = n + (w.removeExtra || 0);
    items.push(['remove', '&#x274C;', 'Remove', Math.max(0, rmN - w.removeN), rmN - w.removeN > 0 && filled() > 0, 'Place a player first, then you can remove one.']);
    var st = subTier(), canMove = st === 'pass' ? movable().length : 0;
    if (st) items.push(['sub', '&#x1F501;', 'Substitute', st === 'pass' ? Math.max(0, 1 - w.subN) : 1, st === 'pass' && 1 - w.subN > 0 && canMove > 0,
      filled() >= 13 ? 'Your 13 is full. Substitute moves a player into an open spot.' : !filled() ? 'Place a player first, then you can move them to another spot they play.'
        : 'Nobody in your 13 can move yet: they need an open spot in another position they play.']);
    // The Vault's Superstar Key (CAST Pass): Classic only, not in a friend's challenge; a free profile sees it locked
    var kv = classicOn() && STATE.gameMode === 'classic' && !STATE.__ch && window.CastAccount && CastAccount.vault ? CastAccount.vault('superstar') : null;
    if (kv) items.push(['key', '&#x1F511;', 'Superstar Key', 1, true, 'No 95+ player fits your open spots in this era.']);
    /* The Picks (js/picks.js: a promo's Pick, then the Immortal Pick), last and only when they can be used. With
       one the bar is rows of three (six make two full rows) and the last row shares its width evenly, so no row has a
       gap and two Picks side by side get half each (8 Oct 2026: "World Cup Pick" wrapped in a third) */
    var picks = window.cpPicks && window.cpPicks.bars ? window.cpPicks.bars() : [], pk = {};
    picks.forEach(function (p) { pk[p.k] = p; items.push([p.k, p.ico, p.name, 1, true, '']); });
    /* The draft games' layout (17 Oct 2026, the owner: identical wildcards in every game): rows of three, four as two rows
       of two, the last row sharing its width evenly; from five tiles the icon sits above the name (css/theme.css) */
    var tiles = items.length; // tiles on the bar
    b.classList.toggle('has-pick', picks.length > 0);
    b.classList.toggle('is-stack', tiles >= 5);
    // One name a tile, the same in every game: Reroll, Reveal, Remove, Substitute, Superstar Key, then the Picks' own names
    var lab = function (it) { return '<span class="cpw-label"><span class="cpw-ico" aria-hidden="true">' + it[1] + '</span> ' + it[2] + '</span>'; };
    b.innerHTML = items.map(function (it) {
      var armed = (it[0] === 'remove' && w.arming) || (it[0] === 'sub' && !!w.sub), isBonus = it[0] === 'reroll' && bonus;
      var tp = pk[it[0]];
      if (tp) return '<button type="button" class="cpw cpw-' + tp.k + (tp.have ? ' is-have' : ' is-buy') + (tp.fresh ? ' ca-rr-fresh' : '') + '" data-w="' + tp.k + '"' +
        '>' + lab(it) + '<span class="cpw-left">' + tp.left + '</span>' +
        (tp.ends ? '<span class="cpw-ends" data-dm-hours>' + tp.ends + '</span>' : '') + '</button>'; // the promo's last 24 hours: hours left
      var passLock = it[0] === 'sub' && st === 'profile';
      if (passLock) return '<button type="button" class="cpw cpw-sub is-pass" data-w="sub">' + lab(it) + '<span class="cpw-left">CAST Pass</span></button>';
      if (it[0] === 'key') {
        // No key to use (no CAST Pass, or today's is gone): a player 15+ can buy one for $1.99 (CastAccount.buyKey). Since
        // 8 Oct 2026 (the owner: match 1000TRIES's Legend Key) a key works again in the same season and never says Used
        if ((kv === 'pass' || kv === 'used') && !STATE.__superNext && !lock && CastAccount.buyKey && CastAccount.canBuyKey && CastAccount.canBuyKey()) {
          var kok = !!(window.cpSuperstarReady && window.cpSuperstarReady());
          return '<button type="button" class="cpw cpw-key is-buy' + (kok ? '' : ' is-wait') + '" data-w="key"' + (kok ? '' : ' data-hint="' + it[5] + '"') + '>' + lab(it) + '<span class="cpw-left">Buy &middot; ' + px('superstar1', '$1.99') + '</span></button>';
        }
        var ks = kv === 'pass' ? 'is-pass' : STATE.__superNext ? 'is-armed' : kv === 'used' ? 'is-spent' : w.keyBusy ? 'is-armed' : window.cpSuperstarReady && window.cpSuperstarReady() ? '' : 'is-wait';
        var kt = kv === 'pass' ? 'CAST Pass' : STATE.__superNext ? 'Next spin: 95+' : kv === 'used' ? (CastAccount.keyCountdown ? CastAccount.keyCountdown() : 'Used today') : w.keyBusy ? 'Opening&hellip;' : 'Ready';
        return '<button type="button" class="cpw cpw-key ' + ks + '" data-w="key"' + (ks === 'is-spent' ? ' disabled' : '') + (ks === 'is-wait' ? ' data-hint="' + it[5] + '"' : '') +
          '>' + lab(it) + '<span class="cpw-left">' + kt + '</span></button>';
      }
      // Out of rerolls in Classic: a saved one ("2 saved") or one to buy, in a pop-up over the game (CastAccount.buyReroll)
      var isBuy = it[0] === 'reroll' && !it[3] && !lock && !isBonus && payOn('reroll') && window.CastAccount && CastAccount.canBuyReroll && (CastAccount.canBuyReroll() || (CastAccount.canUseSaved && CastAccount.canUseSaved() && CastAccount.rerollsSaved() > 0));
      if (isBuy) {
        // Just bought: "N ready", glowing, so they tap it and watch the roll
        var sv = CastAccount.rerollsSaved(), live = spinOn(), fresh = !!(sv && CastAccount.rerollsFresh && CastAccount.rerollsFresh());
        return '<button type="button" class="cpw cpw-reroll is-buy' + (live ? '' : ' is-wait') + (fresh ? ' ca-rr-fresh' : '') + '" data-w="reroll"' + (live ? '' : ' data-hint="' + it[5] + '"') + '>' + lab(it) +
          '<span class="cpw-left">' + (sv ? sv + (fresh ? ' ready' : ' left') : 'Buy &middot; ' + px('one', '$0.99')) + '</span></button>';
      }
      // Out of Reveals in Classic (ratings hidden): a saved one or one to buy, the same way (CastAccount.buyItem('reveal'))
      if (it[0] === 'reveal' && !it[3] && !lock && payOn('reveal') && window.CastAccount && CastAccount.buyItem && CastAccount.canBuyReroll && (CastAccount.canBuyReroll() || (CastAccount.canUseSaved && CastAccount.canUseSaved() && CastAccount.itemSaved('reveal') > 0))) {
        var vs = CastAccount.itemSaved('reveal'), vok = spinOn() && !revealedNow(), vfresh = !!(vs && CastAccount.itemFresh('reveal'));
        return '<button type="button" class="cpw cpw-reveal is-buy' + (vok ? '' : ' is-wait') + (vfresh ? ' ca-rr-fresh' : '') + '" data-w="reveal"' + (vok ? '' : ' data-hint="' + it[5] + '"') + '>' + lab(it) +
          '<span class="cpw-left">' + (vs ? vs + (vfresh ? ' ready' : ' left') : 'Buy &middot; ' + px('reveal1', '$0.99')) + '</span></button>';
      }
      // Out of Remove Players in Classic: a saved one or one to buy, the same way (CastAccount.buyRemove)
      if (it[0] === 'remove' && !it[3] && !lock && payOn('remove') && window.CastAccount && CastAccount.canBuyRemove && (CastAccount.canBuyRemove() || (CastAccount.canUseSaved && CastAccount.canUseSaved() && CastAccount.removesSaved() > 0))) {
        var rs = CastAccount.removesSaved(), rok = filled() > 0 && !w.sub, rfresh = !!(rs && CastAccount.removesFresh && CastAccount.removesFresh());
        return '<button type="button" class="cpw cpw-remove is-buy' + (rok ? '' : ' is-wait') + (rfresh ? ' ca-rr-fresh' : '') + '" data-w="remove"' + (rok ? '' : ' data-hint="' + it[5] + '"') + '>' + lab(it) +
          '<span class="cpw-left">' + (rs ? rs + (rfresh ? ' ready' : ' left') : 'Buy &middot; ' + px('remove1', '$0.99')) + '</span></button>';
      }
      // The game's own and the saved ones as one total from the first pick ("13 left"), so a bought pack is never out of sight
      // (11 Oct 2026: a player thought his 12 Remove Players were gone)
      var svN = !lock && !armed && it[3] ? savedFor(it[0]) : 0;
      var sub = lock ? '&#x1F512; Sign in free' : it[0] === 'sub' && w.sub ? (w.sub.from == null ? 'Tap a player' : 'Tap a spot') : armed ? 'Tap a player' : isBonus ? (CastAccount.bonusState() === 'signin' ? '+1: sign in' : '&#x25B6; +1 free') : it[3] ? (it[3] + svN) + ' left' : hardOn() && !hardUsed(it[0]) ? '15+ to buy' : 'Used';
      var state = lock ? ' is-lock' : armed ? ' is-armed' : isBonus ? ' is-bonus' : !it[3] ? ' is-spent' : it[4] ? '' : ' is-wait';
      return '<button type="button" class="cpw cpw-' + it[0] + state + '" data-w="' + it[0] + '"' + (state === ' is-spent' ? ' disabled' : '') +
        (state === ' is-wait' ? ' data-hint="' + it[5] + '"' : '') + '>' + lab(it) +
        '<span class="cpw-left">' + sub + '</span></button>';
    }).join('');
    // Six columns: two each, four as two rows of two, and the last row's tiles share all six (one: the row, two: half each).
    // A tile across the whole row keeps its icon beside the name, as 1000TRIES' seventh tile does
    var bs = b.children, r = tiles - 3 * Math.floor((tiles - 1) / 3);
    for (var j = 0; j < bs.length; j++) {
      var span = tiles === 4 ? 3 : j >= tiles - r ? 6 / r : 2;
      bs[j].style.gridColumn = 'span ' + span;
      if (span === 6 && tiles >= 5) bs[j].classList.add('is-wide');
    }
  }
  function reveal() {
    var w = W();
    w.revealN++; w.revealSpin = STATE.currentSpin;
    burst('reveal', '&#x1F440;', 'Ratings revealed!', 'Every rating in this squad is showing');
    displaySpin(STATE.currentSpin.cid, STATE.currentSpin.year, STATE.currentSpin.players);
    wcEvent('reveal');
  }
  // Out of Reveals (Classic, players 15+): a saved one, or one to buy. Once one is ready it adds to this season's count
  // (w.revealExtra) and reveals the squad showing, if it still needs it
  function buyReveal() {
    var st = STATE;
    CastAccount.buyItem('reveal', '27-0', function () {
      if (STATE !== st) return;
      var w = W(); w.revealExtra = (w.revealExtra || 0) + 1;
      if (hardOn()) w.hardUsed.reveal = true; // Hard: one a season
      if (spinOn() && !revealedNow()) reveal();
      renderBar();
    }, { title: 'See Their Ratings First', line: 'Show every rating in this squad, then pick the right player for your 13.' });
  }
  // Not usable yet: a short note under the bar says when it will be
  function hint(text) {
    var b = bar();
    if (!b || !text) return;
    var old = document.getElementById('cpwHint');
    if (old) old.remove();
    var n = document.createElement('div');
    n.id = 'cpwHint'; n.className = 'cpw-hint'; n.setAttribute('role', 'status'); n.textContent = text;
    b.insertAdjacentElement('afterend', n);
    clearTimeout(hint.t);
    hint.t = setTimeout(function () { if (n.parentNode) n.remove(); }, 2600);
  }
  function wcEvent(k) {
    if (typeof gtag === 'undefined') return;
    if (on()) gtag('event', 'daily_wildcard', { wildcard: k }); else gtag('event', 'wildcard_used', { wildcard: k, mode: STATE.gameMode === 'hard' || STATE.gameMode === 'wc' ? STATE.gameMode : 'classic', tier: tierNow() || '' });
  }
  function onWild(e) {
    var t = e.target.closest('[data-w]');
    if (!t || t.disabled) return;
    var k = t.getAttribute('data-w'), w = W();
    if (t.classList.contains('is-lock')) {
      if (typeof gtag !== 'undefined') gtag('event', 'wildcard_locked_tap', { wildcard: k, mode: STATE.gameMode === 'wc' ? 'wc' : 'classic' });
      if (window.CastAccount && CastAccount.requireSignIn) CastAccount.requireSignIn(null, 'wildcards');
      return;
    }
    if (t.classList.contains('is-pass')) { if (typeof gtag !== 'undefined') gtag('event', 'wildcard_locked_tap', { wildcard: k, mode: STATE.gameMode === 'wc' ? 'wc' : 'classic' }); if (window.CastAccount && CastAccount.openPass) CastAccount.openPass(k === 'key' ? 'vault' : 'substitute'); return; }
    if (k === 'toty' || k === 'prem' || k === 'imm' || k === 'wcp' || k === 'ileg' || k === 'wch') { if (window.cpPicks) window.cpPicks.tap(k); return; } // js/picks.js: the price, or the choice
    if (k === 'key') {
      if (t.classList.contains('is-wait')) { hint(t.getAttribute('data-hint')); return; }
      if (t.classList.contains('is-buy')) {
        CastAccount.buyKey('superstar', '27-0', { title: 'Spin a 95+ Player', line: 'Use a Superstar Key and your next spin has a 95+ player who fits your open spots.' });
        return;
      }
      if (w.keyBusy || STATE.__superNext || !CastAccount.useKey) return;
      w.keyBusy = true; renderBar();
      var st0 = STATE;
      CastAccount.useKey('superstar', 'classic').then(function () {
        w.keyBusy = false;
        if (STATE !== st0) return;
        STATE.__superNext = true; STATE.__keyUsed = 'superstar';
        burst('key', '&#x1F511;', 'Superstar Key!', 'Your next spin has a 95+ player');
        renderBar();
      }, function (err) { w.keyBusy = false; renderBar(); hint((err && err.message) || 'The Vault did not open. Try again.'); });
      return;
    }
    if (t.classList.contains('is-wait')) { hint(t.getAttribute('data-hint')); return; }
    if (k === 'sub') { w.sub = w.sub ? null : { from: null }; w.arming = false; subUI(); armUI(); renderBar(); return; }
    if (k === 'remove' && t.classList.contains('is-buy')) { buyRemove(); return; }
    if (k === 'reveal' && t.classList.contains('is-buy')) { buyReveal(); return; }
    if (k === 'reroll' && t.classList.contains('is-buy')) {
      var st1 = STATE, got = (STATE.team || []).filter(Boolean).length, left13 = 13 - got;
      var rtg = got && typeof calcTeamRating === 'function' ? calcTeamRating() : 0;
      var hook27 = { title: 'You\u2019re One Good Spin Away', line: (rtg ? 'Rated ' + rtg + ' with ' : '') + left13 + ' spot' + (left13 === 1 ? '' : 's') + ' to fill. The right spin could make this a 27-0 team.' };
      CastAccount.buyReroll('27-0', function () {
        if (STATE !== st1) return;
        STATE.__cpExtra = (STATE.__cpExtra || 0) + 1; // theme-fx.js's Reroll spends it
        if (hardOn()) { W().hardUsed.reroll = true; STATE.__hardPaidRR = true; } // Hard: one a season, let through by hard-mode.js
        renderBar(); useReroll(); wcEvent('reroll');
      }, hook27);
      return;
    }
    if (k === 'reroll') { useReroll(); if (!t.classList.contains('is-bonus')) wcEvent('reroll'); }
    else if (k === 'reveal') reveal();
    else if (k === 'remove') {
      w.arming = !w.arming;
      if (w.sub) { w.sub = null; subUI(); }
      stopLock();
      armUI();
    }
    renderBar();
  }
  // js/picks.js redraws it; js/world-cup.js draws it at the start of a World Cup (make: even before the bar is there)
  window.cpWildRender = function (make) { if (typeof STATE !== 'undefined' && STATE && (make || document.getElementById('cpWild'))) renderBar(); };
  // Signed in (or got CAST Pass) mid-season: the wildcards unlock in this same season
  window.addEventListener('cast:tier', function () { if (typeof STATE !== 'undefined' && STATE && document.getElementById('cpWild')) setTimeout(renderBar, 0); });
  window.addEventListener('cast:rerolls', function () { if (typeof STATE !== 'undefined' && STATE && document.getElementById('cpWild')) setTimeout(renderBar, 0); });
  // Midnight in Sydney: a new Superstar Key (the tile was counting down to it)
  window.addEventListener('cast:keys', function () { if (typeof STATE !== 'undefined' && STATE && document.getElementById('cpWild')) setTimeout(renderBar, 0); });

  /* ---------- Remove Player: tap a player on the pitch ---------- */
  function armUI() {
    var w = W(), field = document.getElementById('nrlField'), sec = document.getElementById('playerSection');
    if (field) field.classList.toggle('cpw-arming', !!w.arming);
    var old = document.getElementById('cpwArmNote');
    if (old) old.remove();
    if (w.arming && sec) {
      var n = document.createElement('div');
      n.id = 'cpwArmNote';
      n.className = 'cpw-note';
      n.innerHTML = '<span>&#x274C; Tap a player on the pitch to remove them. ' + (spinOn() ? 'Their spot opens, and you can fill it from this squad.' : 'Their spot opens and you spin again.') + '</span><button type="button" class="cpw-cancel">Cancel</button>';
      sec.insertBefore(n, sec.firstChild);
      n.querySelector('button').addEventListener('click', function () { W().arming = false; armUI(); renderBar(); if (lockPending) showDecision(); });
      if (field && field.scrollIntoView) field.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
  document.addEventListener('click', function (e) {
    var w = STATE && STATE.__wc;
    if (!w || !w.arming || !wild()) return;
    var cell = e.target.closest('#nrlField .fpos');
    if (!cell) return;
    var cells = Array.prototype.slice.call(document.querySelectorAll('#nrlField .fpos'));
    var keys = Object.keys(FIELD_POSITIONS).map(Number).sort(function (a, b) { return a - b; });
    var idx = keys[cells.indexOf(cell)];
    var p = STATE.team[idx];
    if (!p) return;
    var hadSpin = spinOn(); // a squad still showing stays up, and the opened spot can be filled from it
    STATE.team[idx] = null;
    STATE.takenNames.delete(p.name);
    w.arming = false; w.removeN++; lockPending = false;
    stopLock();
    // Stronger wildcards (js/theme-fx.js cpBoost): 7 times in 10 the next spin quietly has 1 player rated above him. A
    // mechanic only, never in the copy
    if (window.cpBoost) window.cpBoost((p.rating || 0) + 1);
    burst('remove', '&#x274C;', 'Player removed', p.name + ' is back in the pool');
    renderField();
    if (hadSpin) {
      displaySpin(STATE.currentSpin.cid, STATE.currentSpin.year, STATE.currentSpin.players);
    } else {
      var sec = document.getElementById('playerSection');
      if (sec) sec.innerHTML = '<div class="spin-picked-msg"><div style="font-size:18px;margin-bottom:4px">&#x1F3B0;</div><div style="font-size:13px;font-weight:800;color:var(--gold);margin-bottom:2px">Spot open</div><div style="font-size:11px;color:var(--muted);font-weight:500">Spin again to fill it</div></div>';
      STATE.spinPickedThisSpin = true;
      var sb = document.getElementById('spinBtn');
      if (sb) sb.disabled = false;
    }
    armUI(); renderBar();
    wcEvent('remove');
  }, true);

  /* ---------- Substitute (CAST Pass): tap a player in your 13, then an open spot they can play ---------- */
  function slotAt(cell) {
    var cells = Array.prototype.slice.call(document.querySelectorAll('#nrlField .fpos'));
    var keys = Object.keys(FIELD_POSITIONS).map(Number).sort(function (a, b) { return a - b; });
    return keys[cells.indexOf(cell)];
  }
  // Open spots (other than where they are) that this player can play
  function subTargets(p, from) { return SLOTS.filter(function (s) { return s.i !== from && !STATE.team[s.i] && fits(p, s); }); }
  // Spots holding a player who can move somewhere open
  function movable() { return SLOTS.filter(function (s) { var p = STATE.team[s.i]; return p && subTargets(p, s.i).length; }).map(function (s) { return s.i; }); }
  function posList(list) { var seen = {}; return list.map(posName).filter(function (n) { if (seen[n]) return false; seen[n] = 1; return true; }).join(' or '); }
  function subUI() {
    var w = W(), field = document.getElementById('nrlField'), sec = document.getElementById('playerSection');
    var old = document.getElementById('cpwSubNote');
    if (old) old.remove();
    var can = w.sub && w.sub.from == null ? movable() : [];
    if (field) {
      field.classList.toggle('cpw-subbing', !!w.sub);
      var to = w.sub && w.sub.from != null ? subTargets(STATE.team[w.sub.from], w.sub.from).map(function (s) { return s.i; }) : [];
      Array.prototype.forEach.call(field.querySelectorAll('.fpos'), function (c) {
        var i = slotAt(c), picking = !!w.sub && w.sub.from == null;
        c.classList.toggle('cpw-sub-to', to.indexOf(i) >= 0);
        c.classList.toggle('cpw-sub-from', !!w.sub && w.sub.from === i);
        c.classList.toggle('cpw-sub-can', picking && can.indexOf(i) >= 0);           // can move: lit up
        c.classList.toggle('cpw-sub-no', picking && !!STATE.team[i] && can.indexOf(i) < 0); // one position (or nowhere open): dimmed
      });
    }
    if (!w.sub || !sec) return;
    var n = document.createElement('div');
    n.id = 'cpwSubNote';
    n.className = 'cpw-note cpw-note-sub';
    var p = w.sub.from != null ? STATE.team[w.sub.from] : null;
    var who = can.slice(0, 3).map(function (i) { var q = STATE.team[i]; return '<b>' + cardSurname(q.name) + '</b> (to ' + posList(subTargets(q, i)) + ')'; }).join(', ');
    n.innerHTML = '<span>&#x1F501; ' + (p ? 'Now tap the lit-up spot to move <b>' + p.name + '</b> into: ' + posList(subTargets(p, w.sub.from)) + '.'
      : 'Tap a lit-up player to move them: ' + who + (can.length > 3 ? ' and ' + (can.length - 3) + ' more' : '') + '.') + '</span><button type="button" class="cpw-cancel">Cancel</button>';
    sec.insertBefore(n, sec.firstChild);
    n.querySelector('button').addEventListener('click', function () { W().sub = null; subUI(); renderBar(); });
    if (field && field.scrollIntoView) field.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var w = STATE && STATE.__wc;
    if (!w || !w.sub || !classicOn()) return;
    var cell = e.target.closest('#nrlField .fpos');
    if (!cell) return;
    e.stopPropagation(); e.preventDefault();
    var i = slotAt(cell), p = STATE.team[i];
    if (w.sub.from == null) {
      if (!p) { hint('Tap one of the lit-up players first.'); return; }
      if (!subTargets(p, i).length) { hint(p.name + ' only plays ' + (p.positions || []).join('/') + ', with no other open spot. Tap a lit-up player.'); return; }
      w.sub.from = i; subUI(); renderBar(); return;
    }
    if (i === w.sub.from) { w.sub.from = null; subUI(); renderBar(); return; }
    if (p) { if (subTargets(p, i).length) { w.sub.from = i; subUI(); renderBar(); } else hint('Tap an open spot for them.'); return; }
    var mover = STATE.team[w.sub.from];
    if (!subTargets(mover, w.sub.from).some(function (s) { return s.i === i; })) { hint(mover.name + ' can\u2019t play there.'); return; }
    STATE.team[i] = mover; STATE.team[w.sub.from] = null;
    var dest = SLOTS.filter(function (s) { return s.i === i; })[0];
    w.sub = null; w.subN++; w.slot = null;
    burst('sub', '&#x1F501;', 'Substitute!', mover.name + ' moves to ' + (dest ? posName(dest) : 'a new spot'));
    renderField();
    if (spinOn()) displaySpin(STATE.currentSpin.cid, STATE.currentSpin.year, STATE.currentSpin.players);
    subUI(); renderBar();
    wcEvent('sub');
  }, true);

  /* ---------- Pick a spot: tap an empty spot on the pitch and the squad list shows who can play there ---------- */
  document.addEventListener('click', function (e) {
    if (!STATE || !spots()) return;
    var w = W();
    if (w.arming || w.sub) return; // Remove Player or Substitute is choosing instead
    var cell = e.target.closest('#nrlField .fpos[data-slot]');
    if (!cell) return;
    var idx = +cell.getAttribute('data-slot');
    if (STATE.team[idx]) return; // filled spots stay as they are
    w.slot = w.slot === idx ? null : idx;
    renderField();
    if (spinOn()) displaySpin(STATE.currentSpin.cid, STATE.currentSpin.year, STATE.currentSpin.players);
    // On phones the list sits under the pitch: bring it into view
    var sec = document.getElementById('playerSection');
    if (w.slot != null && spinOn() && sec && window.innerWidth < 900) {
      var r = sec.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.55) sec.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    if (typeof gtag !== 'undefined' && w.slot != null) gtag('event', 'draft_pick_spot', { mode: STATE.gameMode, slot: SLOTS[idx] ? SLOTS[idx].type : '' });
  });

  /* ---------- Squad list: hidden ratings, sort, reveal ---------- */
  after('displaySpin', function () {
    renderBar();
    if (!spots()) return; // pick a spot: Classic, Daily and Hard mode (Pack has its own)
    var list = tools();   // sort, search and hidden ratings: Daily and Hard mode only
    var sec = document.getElementById('playerSection'), w = W();
    var rows = Array.prototype.slice.call(sec.querySelectorAll('.player-row'));
    if (!rows.length) { armUI(); return; }
    var byName = {};
    (STATE.currentSpin.players || []).forEach(function (p) { byName[p.name] = p; });
    var revealed = revealedNow();
    rows.forEach(function (r) {
      var p = byName[(r.querySelector('.pr-name') || {}).textContent];
      r.__p = p;
      var badge = r.querySelector('.pr-badge');
      // Classic with ratings off hides them itself; Reveal Ratings shows this squad's
      if (!badge || !p || !(list || (revealed && classicOn()))) return;
      badge.removeAttribute('style');
      if (revealed) { badge.className = 'pr-badge cpw-badge is-shown ' + ratingClass(p.rating); badge.textContent = p.rating; }
      else { badge.className = 'pr-badge cpw-badge'; badge.textContent = '??'; }
    });
    var sb = null;
    if (list) {
      // Sort: tap the active option again to flip it (FB to LK / LK to FB, A to Z / Z to A)
      rows.sort(function (a, b) {
        var pa = a.__p, pb = b.__p;
        if (!pa || !pb) return 0;
        if (w.sort === 'pos') {
          var d = ORDER.indexOf(pa.positions[0]) - ORDER.indexOf(pb.positions[0]);
          if (d) return d * w.dir;
          return surname(pa.name).localeCompare(surname(pb.name));
        }
        return surname(pa.name).localeCompare(surname(pb.name)) * w.dir;
      });
      rows.forEach(function (r) { sec.appendChild(r); });
      // Search within this squad (cleared on each new spin)
      if (w.qSpin !== STATE.currentSpin) { w.q = ''; w.searching = false; w.qSpin = STATE.currentSpin; }
      var arrow = function (k) { return w.sort === k ? ' <span class="cpw-arrow" aria-hidden="true">' + (w.dir > 0 ? '&darr;' : '&uarr;') + '</span>' : ''; };
      var lbl = function (k) { return k === 'pos' ? 'Position' : (w.sort === k && w.dir < 0 ? 'Surname Z to A' : 'Surname A to Z'); };
      sb = document.createElement('div');
      sb.className = 'cpw-sort';
      sb.innerHTML = '<span class="cpw-sort-lbl">Sort</span><div class="cpw-seg" role="group" aria-label="Sort players">' +
        '<button type="button" data-s="pos" aria-pressed="' + (w.sort === 'pos') + '">' + lbl('pos') + arrow('pos') + '</button>' +
        '<button type="button" data-s="az" aria-pressed="' + (w.sort === 'az') + '">' + lbl('az') + arrow('az') + '</button></div>' +
        '<button type="button" class="cpw-search-btn" data-search aria-label="Search this squad" aria-expanded="' + !!w.searching + '">&#x1F50D;</button>' +
        (w.searching ? '<input type="search" class="cpw-search" id="cpwSearch" placeholder="Search player name" autocomplete="off" value="' + String(w.q).replace(/"/g, '&quot;') + '">' : '') +
        (revealed ? '' : '<span class="cpw-sort-hint">Ratings hidden</span>');
      sec.insertBefore(sb, sec.firstChild);
    }
    // Pick a spot: only players who can play the empty spot picked on the pitch (and are free to pick)
    var slot = pickedSlot(), open = STATE.team.filter(function (x) { return !x; }).length;
    var sl = document.createElement('div');
    sl.className = 'cpw-slotbar' + (slot ? ' is-on' : '');
    sl.innerHTML = slot ? '<span>Showing who can play <b>' + posName(slot) + '</b></span><button type="button" data-clear-slot>Show All</button>'
      : open > 1 ? '<span class="cpw-slot-tip">Tap an empty spot on the pitch to see who can play there</span>' : '';
    if (sl.innerHTML) sec.insertBefore(sl, sb ? sb.nextSibling : sec.firstChild);
    sl.addEventListener('click', function (e) {
      if (!e.target.closest('[data-clear-slot]')) return;
      w.slot = null; renderField();
      displaySpin(STATE.currentSpin.cid, STATE.currentSpin.year, STATE.currentSpin.players);
    });
    if (slot) rows.forEach(function (r) {
      if (r.__p && fits(r.__p, slot) && !r.classList.contains('pr-taken') && !r.classList.contains('pr-grey')) {
        r.onclick = function () { var p = r.__p; w.slot = null; placePlayer(p, slot.i); };
      }
    });
    function applySearch() {
      var q = list ? String(w.q || '').trim().toLowerCase() : '', shown = 0;
      rows.forEach(function (r) {
        var hit = (!q || (r.__p && r.__p.name.toLowerCase().indexOf(q) >= 0)) &&
          (!slot || (r.__p && fits(r.__p, slot) && !r.classList.contains('pr-taken') && !r.classList.contains('pr-grey')));
        r.hidden = !hit; if (hit) shown++;
      });
      var none = sec.querySelector('.cpw-none');
      var msg = slot && !q ? 'No one in this squad can play ' + posName(slot) + '. Spin again, or pick another spot.' : 'No one in this squad matches that name.';
      if (!shown && !none) { none = document.createElement('p'); none.className = 'cpw-none'; none.textContent = msg; sec.appendChild(none); }
      else if (!shown && none) none.textContent = msg;
      else if (shown && none) none.remove();
    }
    applySearch();
    if (sb) {
      sb.addEventListener('click', function (e) {
        if (e.target.closest('[data-search]')) {
          w.searching = !w.searching; if (!w.searching) w.q = '';
          displaySpin(STATE.currentSpin.cid, STATE.currentSpin.year, STATE.currentSpin.players);
          var inp = document.getElementById('cpwSearch'); if (inp) inp.focus();
          return;
        }
        var b = e.target.closest('[data-s]');
        if (!b) return;
        var k = b.getAttribute('data-s');
        if (w.sort === k) w.dir = -w.dir; else { w.sort = k; w.dir = 1; }
        displaySpin(STATE.currentSpin.cid, STATE.currentSpin.year, STATE.currentSpin.players);
      });
      var inp = sb.querySelector('#cpwSearch');
      if (inp) inp.addEventListener('input', function () { w.q = inp.value; applySearch(); });
    }
    armUI();
  });
  after('placePlayer', renderBar);
  after('renderField', function () { if (STATE && STATE.__wc && STATE.__wc.sub) subUI(); });
  after('renderField', function () {
    var w = STATE && STATE.__wc, f = document.getElementById('nrlField');
    if (!f) return;
    f.classList.toggle('cpw-arming', !!(w && w.arming && wild()));
    f.classList.toggle('cpw-spots', spots()); // empty spots can be tapped to pick a spot
    var s = spots() ? pickedSlot() : null;
    Array.prototype.forEach.call(f.querySelectorAll('.fpos[data-slot]'), function (c) {
      var i = +c.getAttribute('data-slot'), same = !!s && SLOTS[i] && SLOTS[i].type === s.type && !STATE.team[i];
      c.classList.toggle('cpw-spot-on', same); // both empty spots of the picked position (both centres, both wings...)
    });
  });
  after('finalSpin', renderBar);
  after('startSelectedMode', function () { setTimeout(renderBar, 50); });
  after('resetGame', function () { lockPending = false; stopLock(); var b = document.getElementById('cpWild'); if (b) b.hidden = true; });
  after('startGame', function () { lockPending = false; stopLock(); }); // a new season never inherits a lock-in countdown (the review, 9 Oct 2026)

  /* ---------- Out of Remove Players (Classic, players 15+): a saved one, or one to buy ----------
     CastAccount.buyRemove uses a saved one straight away, or opens the pop-up. Once one is ready it adds to this season's
     count (w.removeExtra) and arms Remove Player: tap who goes. A squad-full countdown stops while they choose. */
  function buyRemove() {
    var st = STATE, got = filled(), rtg = got && typeof calcTeamRating === 'function' ? calcTeamRating() : 0;
    var hook = got >= 13 ? { title: 'Not Sold on This 13?', line: (rtg ? 'Rated ' + rtg + '. ' : '') + 'Swap one player out and spin that spot again before the season starts.' }
      : { title: 'Swap Out Your Weakest Pick', line: (rtg ? 'Rated ' + rtg + ' with ' : '') + (13 - got) + ' spot' + (13 - got === 1 ? '' : 's') + ' to fill. Take one player out and spin that spot again.' };
    stopLock();
    var secs = document.getElementById('cpwSecs'); if (secs) secs.remove(); // the countdown has stopped: plain "Lock in"
    CastAccount.buyRemove('27-0', function () {
      if (STATE !== st) return;
      var w = W(); w.removeExtra = (w.removeExtra || 0) + 1;
      if (hardOn()) w.hardUsed.remove = true; // Hard: one a season
      if (w.sub) { w.sub = null; subUI(); }
      w.arming = true; armUI(); renderBar();
    }, hook);
  }

  /* ---------- Squad full: Remove Player or lock in (10 second countdown) ----------
     With no Remove Player left, a player who can buy one (Classic, 15+) gets the same choice at $1, or "2 saved". */
  var baseComplete = window.showSquadComplete, lockPending = false, lockTimer = null;
  function stopLock() { if (lockTimer) { clearInterval(lockTimer); lockTimer = null; } }
  function lockIn() { stopLock(); lockPending = false; baseComplete(); }
  function removesInHand() { var w = W(); return allowed() + (w.removeExtra || 0) - w.removeN; }
  function removeOnSale() { return payOn('remove') && !locked() && !!(window.CastAccount && CastAccount.canBuyRemove && CastAccount.canBuyRemove()); }
  function showDecision() {
    var sec = document.getElementById('playerSection');
    if (!sec) return lockIn();
    var paid = removesInHand() <= 0, rs = paid && window.CastAccount && CastAccount.removesSaved ? CastAccount.removesSaved() : 0;
    sec.innerHTML = '<div class="cpw-decide"><div class="cpw-decide-h">Squad full</div>' +
      (!paid ? '<p>You still have <b>Remove Player</b>. Swap one out and spin again, or lock in this 13.</p>'
        : rs ? '<p>You have <b>' + rs + ' saved Remove Player' + (rs === 1 ? '' : 's') + '</b>. Swap one out and spin that spot again, or lock in this 13.</p>'
          : '<p>Swap one player out and spin that spot again for <b>' + px('remove1', '$0.99') + '</b>, or lock in this 13.</p>') +
      '<div class="cpw-decide-row"><button type="button" class="cpw-btn cpw-btn-remove" data-d="' + (paid ? 'buy' : 'remove') + '"><span>&#x274C; Remove' + (paid ? ' &middot; ' + (rs ? rs + ' left' : px('remove1', '$0.99')) : ' player') + '</span></button>' +
      '<button type="button" class="cpw-btn cpw-btn-lock" data-d="lock"><span class="cpw-fill" aria-hidden="true"></span><span class="cpw-lbl">&#x1F512; Lock in <b id="cpwSecs">' + LOCK_SECS + '</b></span></button></div>' +
      // Still holding the season's own Remove Player: a way to stock up on more (the packs pop-up; nothing is used)
      (!paid && removeOnSale() && CastAccount.shopRemoves ? '<button type="button" class="cpw-more" data-d="more">&#x2795; Get More Remove Players</button>' : '') + '</div>';
    sec.querySelector('.cpw-decide').addEventListener('click', function (e) {
      var b = e.target.closest('[data-d]');
      if (!b) return;
      var d = b.getAttribute('data-d');
      if (d === 'lock') lockIn();
      else if (d === 'buy') buyRemove();
      else if (d === 'more') {
        stopLock();
        var secs = document.getElementById('cpwSecs'); if (secs) secs.remove(); // the countdown has stopped: plain "Lock in"
        CastAccount.shopRemoves('27-0', { kicker: 'Stock Up', title: 'Stock Up on Remove Players', line: 'Save them for the seasons where one swap is the difference. They work in 27-0 Classic and 1000TRIES.' });
      } else { stopLock(); W().arming = true; armUI(); renderBar(); }
    });
    var left = LOCK_SECS, fill = sec.querySelector('.cpw-fill');
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (fill) fill.style.transform = 'scaleX(' + (left - 1) / LOCK_SECS + ')'; }); });
    stopLock();
    lockTimer = setInterval(function () {
      left--;
      var s = document.getElementById('cpwSecs'); if (s) s.textContent = Math.max(left, 0);
      if (fill) fill.style.transform = 'scaleX(' + Math.max(left - 1, 0) / LOCK_SECS + ')';
      if (left <= 0) lockIn();
    }, 1000);
    renderBar();
  }
  if (typeof baseComplete === 'function') {
    window.showSquadComplete = function () {
      if (wild() && STATE.gameMode !== 'pack' && !locked() && (removesInHand() > 0 || removeOnSale())) { lockPending = true; showDecision(); return; }
      return baseComplete.apply(this, arguments);
    };
  }
})();

/* A tap right after the squad list moved is ignored (11 Oct 2026, both games; a 1000TRIES World Cup player tapped one player
   and got the one above: a wildcard row arrived late above the list and pushed it down as he tapped). Anything above the
   list changing height (the spin box, the wildcard bar) marks the list as moved; a player tap within 0.7 s does nothing,
   so the next tap lands where the eye is. Only taps are held back, never the game's own picks */
(function () {
  if (typeof ResizeObserver !== 'function') return;
  var movedAt = 0, heights = new WeakMap();
  var ro = new ResizeObserver(function (es) {
    es.forEach(function (e) { var h = Math.round(e.target.getBoundingClientRect().height), was = heights.get(e.target); if (was !== undefined && Math.abs(h - was) > 8) movedAt = Date.now(); heights.set(e.target, h); });
  });
  function watch() { var z = document.querySelector('#draft .spin-zone'); if (z && !heights.has(z)) { heights.set(z, Math.round(z.getBoundingClientRect().height)); ro.observe(z, { box: "border-box" }); } }
  // Never a Quick Draft's own picks (the review, 11 Oct 2026: they run inside its click and must not be held)
  function held() { var ev = window.event; return !(typeof STATE !== 'undefined' && STATE && STATE.__qd) && !!ev && (ev.type === 'click' || ev.type === 'touchend') && Date.now() - movedAt < 700; }
  ['selectPlayer', 'placePlayer'].forEach(function (name) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () { watch(); if (held()) { if (typeof gtag === 'function') gtag('event', 'pick_after_shift', {}); return; } return orig.apply(this, arguments); };
  });
  document.addEventListener('DOMContentLoaded', watch); setTimeout(watch, 0);
})();
