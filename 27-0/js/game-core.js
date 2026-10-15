// ============================================================
// PACK MODE FUNCTIONS
// ============================================================
function startClassicMode() { selectMode('classic'); showScreen('setup'); }
function startPackMode() { selectMode('pack'); showScreen('setup'); }

function selectMode(mode) {
  STATE.gameMode = mode;
  const cb = document.getElementById('modeClassicBtn');
  // Pack is a small button now (29 Sep 2026): its own CSS colours it, so the old inline paint below skips it
  const pb0 = document.getElementById('modePackBtn'), pb = pb0 && !pb0.classList.contains('cp-mode-mini') ? pb0 : null;
  const era = document.getElementById('eraOptions');
  const btn = document.getElementById('startModeBtn');
  const grid = document.getElementById('hiwGrid');
  if (mode === 'classic') {
    if (cb) { cb.style.background='linear-gradient(135deg,#c8952a,#f1c073)'; cb.style.borderColor='var(--gold)'; cb.querySelector('div').style.color='#111'; cb.querySelectorAll('div')[1].style.color='#555'; }
    if (pb) { pb.style.background='#12122a'; pb.style.borderColor='#2a2a4a'; pb.querySelector('div').style.color='#6688cc'; pb.querySelectorAll('div')[1].style.color='#445'; }
    if (era) era.style.display='';
    if (btn) { btn.textContent='🎰 SPIN THE WHEEL'; btn.style.background=''; btn.style.color='#000'; btn.style.boxShadow=''; }
    if (grid) grid.innerHTML = _hiwClassic();
    const rt=document.getElementById('ratingsToggle'); if(rt) rt.style.display='';
  } else {
    if (pb) { pb.style.background='linear-gradient(135deg,#1e3a8a,#3b5bdb)'; pb.style.borderColor='#6688ff'; pb.querySelector('div').style.color='#fff'; pb.querySelectorAll('div')[1].style.color='#aac4ff'; }
    if (cb) { cb.style.background='#12122a'; cb.style.borderColor='#2a2a4a'; cb.querySelector('div').style.color='#665522'; cb.querySelectorAll('div')[1].style.color='#443311'; }
    if (era) era.style.display='none';
    if (btn) { btn.textContent='📦 OPEN PACKS'; btn.style.background='linear-gradient(135deg,#1e3a8a,#3b5bdb)'; btn.style.color='#fff'; btn.style.boxShadow='0 4px 20px rgba(59,91,219,0.5)'; }
    if (grid) grid.innerHTML = _hiwClassic(); // How It Works always explains Classic (modes are one tap now)
    const rt=document.getElementById('ratingsToggle'); if(rt) rt.style.display='none';
  }
}
function startSelectedMode() {
  if(typeof gtag!=='undefined'){
    gtag('event', STATE.gameMode==='pack' ? 'Pack_Mode' : 'Classic_Mode', {});
    gtag('event','new_season_started',{event_category:'game'});
  }
  if (STATE.gameMode === 'pack') { startPackOpening(); }
  else { startGame(); }
}
function _hiwClassic() {
  const c='background:rgba(245,197,24,0.07);border:1px solid rgba(245,197,24,0.18);border-radius:10px;padding:10px 10px 8px';
  const t='font-size:12px;font-weight:700;color:var(--gold);margin-bottom:3px';
  const d='font-size:12px;color:#a0a0b8;line-height:1.4';
  return `<div style="${c}"><div style="font-size:18px;margin-bottom:4px">🎰</div><div style="${t}">Spin</div><div style="${d}">Get a random NRL club &amp; season</div></div><div style="${c}"><div style="font-size:18px;margin-bottom:4px">🏉</div><div style="${t}">Pick</div><div style="${d}">Choose one player to fill your squad</div></div><div style="${c}"><div style="font-size:18px;margin-bottom:4px">🔁</div><div style="${t}">Build</div><div style="${d}">Repeat until your 13 is complete</div></div><div style="${c}"><div style="font-size:18px;margin-bottom:4px">📊</div><div style="${t}">Play</div><div style="${d}">Simulate a full season and chase the Premiership title</div></div>`;
}
function _hiwPack() {
  const c='background:rgba(59,91,219,0.1);border:1px solid rgba(59,91,219,0.3);border-radius:10px;padding:10px 10px 8px';
  const t='font-size:12px;font-weight:700;color:#6688ff;margin-bottom:3px';
  const d='font-size:12px;color:#a0a0b8;line-height:1.4';
  return `<div style="${c}"><div style="font-size:18px;margin-bottom:4px">📦</div><div style="${t}">Open</div><div style="${d}">Rip open 7 packs of the entire NRL era database</div></div><div style="${c}"><div style="font-size:18px;margin-bottom:4px">⭐</div><div style="${t}">Collect</div><div style="${d}">Gold, green, blue, silver &amp; bronze card rarities</div></div><div style="${c}"><div style="font-size:18px;margin-bottom:4px">🧩</div><div style="${t}">Build</div><div style="${d}">Pick your ultimate team from the players you pulled in packs.</div></div><div style="${c}"><div style="font-size:18px;margin-bottom:4px">📊</div><div style="${t}">Play</div><div style="${d}">Simulate a full season and chase the Premiership title</div></div>`;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildWeightedPackPool() {
  // Collect every unique card (one per club-stint)
  const all = [];
  const seen = new Set();
  // Promos: their players (the Team of the Year, or the premiers) are only ever a rare pull (promoPulls), never a normal card
  const P = typeof promoLive === 'function' ? promoLive() : null;
  RAW_PLAYERS.forEach(p => {
    const [name, seasons, positions, rating] = p;
    if (P && P.tier(name, true)) return;
    seasons.forEach(([club, yf, yt]) => {
      const key = `${name}|${club}|${yt}`;
      if (!seen.has(key)) { seen.add(key); all.push({ name, club, year: yt, positions, rating }); }
    });
  });
  // Keep only highest-rated stint per player name to prevent duplicates across packs
  const byName = new Map();
  all.forEach(c => {
    const ex = byName.get(c.name);
    if (!ex || c.rating > ex.rating) byName.set(c.name, c);
  });
  const deduped = [...byName.values()];
  return {
    gold:   shuffleArray(deduped.filter(c => c.rating >= 90)),
    purple: shuffleArray(deduped.filter(c => c.rating >= 85 && c.rating < 90)),
    blue:   shuffleArray(deduped.filter(c => c.rating >= 80 && c.rating < 85)),
    grey:   shuffleArray(deduped.filter(c => c.rating < 80)),
  };
}

function _ensurePackHeader(screenId) {
  const screen = document.getElementById(screenId);
  if (!screen || screen.querySelector('.header')) return;
  const src = document.getElementById('draft')?.querySelector('.header');
  if (!src) return;
  const clone = src.cloneNode(true);
  const p = clone.querySelector('.header-title p');
  if (p) p.textContent = 'Pack Mode: open and build your squad';
  // The account buttons (Shop, Friends, Profile, Admin): copies don't carry their taps, so js/cast-account.js sets them up again
  clone.querySelectorAll('[data-cast-shop], [data-cast-admin]').forEach(n => n.remove());
  clone.querySelectorAll('[data-cast-friends], [data-cast-account]').forEach(n => { n.removeAttribute('data-ca-init'); n.innerHTML = ''; });
  screen.insertBefore(clone, screen.firstChild);
  if (window.CastAccount && CastAccount.refresh) CastAccount.refresh();
}

const REQUIRED_SLOT_COUNTS = {FB:1, W:2, C:2, FE:1, HB:1, P:2, HK:1, SR:2, LK:1};

// Returns true if every one of the 13 starting slots can be filled by a distinct player.
// Uses real bipartite matching (not just a per-type count) so dual-position players who
// overlap the same slots (e.g. HB/FE) can't create a hidden shortfall that a simple count misses.
function canAssembleFullSquad(pool) {
  const slots = SLOTS; // 13 slot objects, each with .type
  const matchSlot = new Array(slots.length).fill(-1); // slotIdx -> poolIdx
  const matchPlayer = new Array(pool.length).fill(-1); // poolIdx -> slotIdx
  function tryAssign(slotIdx, visited) {
    for (let p = 0; p < pool.length; p++) {
      if (!pool[p].positions.includes(slots[slotIdx].type)) continue;
      if (visited[p]) continue;
      visited[p] = true;
      if (matchPlayer[p] === -1 || tryAssign(matchPlayer[p], visited)) {
        matchPlayer[p] = slotIdx;
        matchSlot[slotIdx] = p;
        return true;
      }
    }
    return false;
  }
  let count = 0;
  for (let s = 0; s < slots.length; s++) {
    const visited = new Array(pool.length).fill(false);
    if (tryAssign(s, visited)) count++;
  }
  return { ok: count === slots.length, count, matchSlot };
}

// Mutates packPool in place, injecting eligible players from the wider allPool until
// (a) every position type meets its required count, and (b) a full 13-slot matching exists.
function ensurePackPoolCanFillSquad(packPool, allPool) {
  // Layer 1: guarantee raw count coverage per position type
  Object.entries(REQUIRED_SLOT_COUNTS).forEach(([type, needed]) => {
    let have = packPool.filter(c => c.positions.includes(type));
    if (have.length >= needed) return;
    let haveNames = new Set(packPool.map(c => c.name));
    let deficit = needed - have.length;
    const candidates = allPool
      .filter(c => c.positions.includes(type) && !haveNames.has(c.name))
      .sort((a, b) => b.rating - a.rating);
    for (let n = 0; n < deficit && candidates.length; n++) {
      const pick = candidates.shift();
      let worstIdx = -1, worstRtg = Infinity;
      packPool.forEach((c, k) => {
        const remaining = packPool.filter((_, j) => j !== k);
        const okAfterRemoval = Object.entries(REQUIRED_SLOT_COUNTS).every(([t2, need2]) => {
          let cnt = remaining.filter(x => x.positions.includes(t2)).length;
          if (t2 === type) cnt += 1; // accounts for pick being added
          return cnt >= need2;
        });
        if (okAfterRemoval && c.rating < worstRtg) { worstRtg = c.rating; worstIdx = k; }
      });
      if (worstIdx >= 0) {
        packPool[worstIdx] = pick;
        haveNames.add(pick.name);
      }
    }
  });

  // Layer 2: confirm a real 13-slot matching exists; if not, keep injecting eligible
  // players for whichever slot types are unmatched until it does (or candidates run out).
  let guard = 0;
  while (guard < 20) {
    const result = canAssembleFullSquad(packPool);
    if (result.ok) break;
    const unmatchedTypes = new Set();
    SLOTS.forEach((slot, i) => { if (result.matchSlot[i] === -1) unmatchedTypes.add(slot.type); });
    if (!unmatchedTypes.size) break;
    let injected = false;
    unmatchedTypes.forEach(type => {
      const haveNames = new Set(packPool.map(c => c.name));
      const candidates = allPool
        .filter(c => c.positions.includes(type) && !haveNames.has(c.name))
        .sort((a, b) => b.rating - a.rating);
      if (!candidates.length) return;
      const pick = candidates[0];
      // Replace the lowest-rated card whose own position type still has slack after removal
      let worstIdx = -1, worstRtg = Infinity;
      packPool.forEach((c, k) => {
        const countOfItsType = packPool.filter(x => x.positions.includes(c.positions[0])).length;
        const needed = REQUIRED_SLOT_COUNTS[c.positions[0]] || 1;
        if (countOfItsType > needed && c.rating < worstRtg) { worstRtg = c.rating; worstIdx = k; }
      });
      if (worstIdx === -1) {
        // Fall back to the single lowest-rated card overall if nothing has slack
        worstIdx = packPool.reduce((bi, c, k) => c.rating < packPool[bi].rating ? k : bi, 0);
      }
      packPool[worstIdx] = pick;
      injected = true;
    });
    guard++;
    if (!injected) break;
  }
}

function startPackOpening() {
  const nameEl = document.getElementById('packTeamNameInput');
  const tName = (nameEl?.value?.trim() || 'My Team').substring(0, 40);
  STATE.teamName = tName;
  STATE.gameMode = 'pack';
  _ensurePackHeader('pack-opening');
  _ensurePackHeader('pack-squad');

  const tiers = buildWeightedPackPool();

  // GOD PACK: all 42 cards are the best in the pool
  if (Math.random() < 0.0001) {
    const allCards = [...tiers.gold, ...tiers.purple, ...tiers.blue, ...tiers.grey]
      .sort((a, b) => b.rating - a.rating);
    STATE.packs = [];
    for (let i = 0; i < PACK_TOTAL; i++) {
      STATE.packs.push(allCards.slice(i * 6, i * 6 + 6));
    }
    STATE.isGodPack = true;
  } else {
    STATE.isGodPack = false;
    // 6 cards per pack. Gold distribution: min 4, avg ~6, max 10 total across 7 packs, max 3 per pack
    const _gr = Math.random();
    const totalGolds = _gr < 0.10 ? 4 : _gr < 0.30 ? 5 : _gr < 0.55 ? 6 : _gr < 0.75 ? 7 : _gr < 0.87 ? 8 : _gr < 0.95 ? 9 : 10;
    const actualGolds = Math.min(totalGolds, tiers.gold.length);
    const goldPerPack = Array(PACK_TOTAL).fill(0);
    const packOrder = shuffleArray([...Array(PACK_TOTAL).keys()]);
    let distributed = 0;
    for (let pass = 0; pass < 3 && distributed < actualGolds; pass++) {
      for (const pi of packOrder) {
        if (distributed >= actualGolds) break;
        if (goldPerPack[pi] < 3) { goldPerPack[pi]++; distributed++; }
      }
    }
    const nonGold = shuffleArray([
      ...tiers.purple.slice(0, 22),
      ...tiers.blue.slice(0, 22),
      ...tiers.grey.slice(0, 8),
    ]);

    STATE.packs = [];
    let goldIdx = 0, nonGoldIdx = 0;
    for (let i = 0; i < PACK_TOTAL; i++) {
      const gCount = goldPerPack[i];
      const fillCount = 6 - gCount;
      const packCards = [
        ...tiers.gold.slice(goldIdx, goldIdx + gCount),
        ...nonGold.slice(nonGoldIdx, nonGoldIdx + fillCount),
      ];
      goldIdx += gCount;
      nonGoldIdx += fillCount;
      STATE.packs.push(shuffleArray(packCards));
    }
  }

  STATE.packIdx = 0;
  STATE.packAllCards = STATE.packs.flat();
  if (!STATE.isGodPack) promoPulls(STATE.packAllCards);

  // Guarantee a complete Starting 13 can always be assembled from the pool.
  // Two layers: (1) per-position count coverage (FB:1,W:2,C:2,FE:1,HB:1,P:2,HK:1,SR:2,LK:1),
  // (2) a bipartite-matching check so dual-position players sharing the same slots can't create a hidden shortfall.
  if (!STATE.isGodPack) {
    const allPool = [...tiers.gold, ...tiers.purple, ...tiers.blue, ...tiers.grey];
    ensurePackPoolCanFillSquad(STATE.packAllCards, allPool);
    const sz = 6;
    STATE.packs = [];
    for (let p = 0; p < PACK_TOTAL; p++) STATE.packs.push(STATE.packAllCards.slice(p*sz,(p+1)*sz));
  }

  if (STATE.isGodPack) {
    showScreen('pack-opening');
    const inner = document.getElementById('packOpeningInner');
    const footer = document.getElementById('packOpeningFooter');
    if (footer) footer.innerHTML = '';
    if (inner) {
      inner.style.cssText = 'padding:0;max-width:480px;margin:0 auto;width:100%;box-sizing:border-box;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center';
      inner.innerHTML = `<div style="font-size:60px;margin-bottom:16px">&#9889;</div><div style="font-size:11px;font-weight:900;letter-spacing:4px;color:#f1c073;text-transform:uppercase;margin-bottom:8px">You unlocked a</div><div style="font-size:42px;font-weight:900;font-family:'Inter',sans-serif;color:var(--gold);line-height:1;margin-bottom:8px">GOD PACK</div><div style="font-size:13px;color:#888;margin-bottom:32px">7 packs &middot; 42 best players ever</div><button onclick="renderPackIntro()" style="background:linear-gradient(135deg,#c8952a,#f1c073);border:none;border-radius:14px;padding:16px 48px;font-size:18px;font-weight:900;color:#111;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 6px 24px rgba(245,197,24,0.5)">LET'S GO &#8594;</button>`;
    }
  } else {
    showScreen('pack-opening');
    renderPackIntro();
  }
}

const PACK_TOTAL = 7;

/* Promos (js/cast-promo.js, the owner's call: rare): a pack run can hold a promo card (a Team of the Year player, or one
   of the premiers' whole 2026 squad) and the medal winner (the Dally M's, or the Clive Churchill's), on their 2026 season,
   each in place of a random card. Picks (js/picks.js) can add as many as the player buys. */
const PROMO_TOTY_ODDS = 0.1, PROMO_MEDAL_ODDS = 0.02;
function promoPulls(cards) {
  const P = typeof promoLive === 'function' ? promoLive() : null;
  if (!P || !cards.length) return;
  const prem = P.kind === 'prem';
  const card = (name, pm) => {
    const r = RAW_PLAYERS.find(x => x[0] === name), st = r && r[1].find(s => s[1] <= 2026 && s[2] >= 2026);
    return st ? Object.assign({ name, club: st[0], year: 2026, positions: r[2], rating: pm === 'medal' ? 99 : Math.max(95, r[3]), pm }, promoKind(P, name)) : null;
  };
  const out = [];
  if (Math.random() < PROMO_TOTY_ODDS) {
    const list = (prem ? P.squad('nrl') : P.team.map(t => t[0])).filter(n => n !== P.medal);
    const c = list.length ? card(list[Math.floor(Math.random() * list.length)], prem ? 'prem' : 'toty') : null;
    if (c) out.push(c);
  }
  if (P.medal && Math.random() < PROMO_MEDAL_ODDS) { const c = card(P.medal, 'medal'); if (c) out.push(c); }
  out.forEach(c => {
    const free = cards.map((x, i) => (x.pm ? -1 : i)).filter(i => i >= 0);
    cards[free[Math.floor(Math.random() * free.length)]] = c;
  });
}

function packRarityColor(rating) {
  if (rating >= 90) return { bg: 'linear-gradient(135deg,#2a1800,#5a3200,#7a4800)', text: '#f1c073', border: '#c8952a', label: 'GOLD' };
  if (rating >= 85) return { bg: 'linear-gradient(135deg,#0a1f04,#1a3a0a,#254f10)', text: '#a3e635', border: '#65a30d', label: 'GREEN' };
  if (rating >= 80) return { bg: 'linear-gradient(135deg,#050e2a,#0f2050,#1a3070)', text: '#93c5fd', border: '#3b82f6', label: 'BLUE' };
  if (rating >= 75) return { bg: 'linear-gradient(135deg,#111118,#1c1c28,#252535)', text: '#9ca3af', border: '#4b5563', label: 'SILVER' };
  return { bg: 'linear-gradient(135deg,#120a02,#241408,#341e0e)', text: '#cd7f32', border: '#7a5020', label: 'BRONZE' };
}

// Club badge using primary colour: works after main script loads
function packClubBadge(club, size) {
  // size: 'lg' = walkout, 'sm' = list card
  const bg = (typeof CLUB_COLORS !== 'undefined' ? CLUB_COLORS[club] : null) || '#1a1a2e';
  const abbr = (typeof CLUB_ABBR !== 'undefined' ? CLUB_ABBR[club] : null) || club.slice(0,3).toUpperCase();
  const fg = (typeof _clubTextColor !== 'undefined') ? _clubTextColor(bg) : '#fff';
  if (size === 'lg') {
    return `<div style="display:inline-flex;align-items:center;justify-content:center;background:${bg};color:${fg};border-radius:8px;font-size:13px;font-weight:900;letter-spacing:.5px;padding:6px 14px;margin:6px 0">${abbr}</div>`;
  }
  return `<div style="display:inline-flex;align-items:center;justify-content:center;background:${bg};color:${fg};border-radius:5px;font-size:10px;font-weight:900;letter-spacing:.5px;padding:3px 7px;flex-shrink:0">${abbr}</div>`;
}

// ── Pack intro: animated pack card that slides in ──────────────────
function renderPackIntro() {
  const pack = STATE.packs[STATE.packIdx];
  const packNum = STATE.packIdx + 1;
  const isLast = STATE.packIdx === PACK_TOTAL - 1;
  const cardCount = pack.length;
  // Clear any stale footer button / skip button left over from the previous pack
  const staleFooter = document.getElementById('packOpeningFooter');
  if (staleFooter) staleFooter.innerHTML = '';
  const staleSkip = document.getElementById('packWalkoutSkipBtn');
  if (staleSkip) staleSkip.remove();
  const inner = document.getElementById('packOpeningInner');
  inner.style.cssText = 'padding:0;width:100%;box-sizing:border-box;display:flex;flex-direction:column;position:relative;overflow-x:hidden;overflow-y:auto';

  const dots = Array.from({ length: PACK_TOTAL }, (_, k) => `<i class="${k < STATE.packIdx ? 'is-done' : k === STATE.packIdx ? 'is-now' : ''}"></i>`).join('');
  inner.innerHTML = `
    <div class="pk-stage">
      <div class="pk-progress">
        <div class="pk-count">${isLast ? '&#9733; Final pack &#9733;' : `Pack ${packNum} of ${PACK_TOTAL}`}</div>
        <div class="pk-dots" aria-hidden="true">${dots}</div>
      </div>

      <div id="packCardOuter" class="pack-card-anim pk${isLast ? ' is-final' : ''}" role="button" tabindex="0" aria-label="Open pack ${packNum}" onclick="openPackAnimation()">
        <div class="pk-body">
          <div class="pk-foil"></div>
          <div class="pk-shine"></div>
          <div class="pk-seal is-top"></div>
          <div class="pk-tear"><span>Tear to open</span></div>
          <div class="pk-mid">
            <div class="pk-kicker">NRL &middot; ${cardCount} players</div>
            <!-- DO NOT REPLACE: 27-0 LOGO (pack card). ASSET: 27-0 LOGO PNG, never replace with banner -->
            <img src="assets/img/27-0-logo.png" alt="27-0" class="pk-logo">
            <div class="pk-num"><span>Pack</span><b>${packNum}</b></div>
          </div>
          <div class="pk-foot">${isLast ? '&#9733; FINAL PACK &#9733;' : '27-0.APP PACK MODE'}</div>
          <div class="pk-seal is-bottom"></div>
        </div>
      </div>

      <button type="button" class="pk-open" onclick="openPackAnimation()">Tap to open</button>
    </div>
  `;
}

// ── Crack open animation then reveal ──────────────────────────────
function openPackAnimation() {
  const packEl = document.getElementById('packCardOuter');
  if (!packEl || packEl.dataset.opening) return;
  packEl.dataset.opening = '1';
  packEl.style.animation = 'packCrack .55s cubic-bezier(.23,1,.32,1) forwards';

  // Flash overlay
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:#fff;pointer-events:none;z-index:9999;animation:flashWhite .5s ease forwards';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);

  setTimeout(() => {
    const pack = STATE.packs[STATE.packIdx];
    const best = pack.reduce((a, b) => b.rating > a.rating ? b : a);
    // A promo card in this pack gets the promo walkout, whatever else is in there
    const special = pack.find(c => c.pm === 'medal') || pack.find(c => c.pm);
    if (special) {
      showPlatWalkout(special, () => revealPackCards());
    } else if (best.rating >= 90) {
      showGoldWalkout(best, () => revealPackCards());
    } else {
      revealPackCards();
    }
  }, 480);
}

// ── Special gold walkout for 90+: cinematic reveal ──────────────────────────
function showGoldWalkout(card, onDone) {
  const isTribute = card.name === 'Jai Arrow';
  const bg = (typeof CLUB_COLORS !== 'undefined' ? CLUB_COLORS[card.club] : null) || '#1a1a2e';
  const abbr = (typeof CLUB_ABBR !== 'undefined' ? CLUB_ABBR[card.club] : null) || card.club.slice(0,3).toUpperCase();
  const fg = (typeof _clubTextColor !== 'undefined') ? _clubTextColor(bg) : '#fff';
  const accentColor = isTribute ? '#72BE8F' : card.pm === 'medal' ? '#f0abfc' : card.pm ? '#e2e8f0' : '#f1c073';
  const promoWord = promoTag(card) ? promoTag(card).toUpperCase() + ' &middot; ' : '';
  const nameColor = isTribute ? '#02702A' : '#fff';
  const badgeBg = isTribute ? '#02702A' : bg;
  const badgeFg = isTribute ? '#fff' : fg;

  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden';
  ov.innerHTML = `
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(241,192,115,.2) 0%,transparent 65%);pointer-events:none;animation:walkoutBg 2.5s ease forwards"></div>
    <div style="position:absolute;inset:0;pointer-events:none" id="woSparkles"></div>

    <div id="woBadge" style="opacity:0;transition:opacity 0.7s ease;margin-bottom:18px">
      <div style="display:inline-flex;align-items:center;justify-content:center;background:${badgeBg};color:${badgeFg};border-radius:10px;font-size:16px;font-weight:900;font-family:'Inter',sans-serif;padding:8px 20px;letter-spacing:1px;box-shadow:0 4px 20px rgba(0,0,0,0.5)">${abbr}</div>
    </div>

    <div id="woYear" style="opacity:0;transition:opacity 0.7s ease;font-size:14px;font-weight:900;color:${card.pm ? accentColor : '#666'};letter-spacing:5px;margin-bottom:20px">${promoWord}${card.year}</div>

    <div id="woRating" style="opacity:0;transition:opacity 0.7s ease;text-align:center;margin-bottom:20px">
      <div style="font-size:88px;font-weight:900;color:${accentColor};font-family:'Inter',sans-serif;line-height:1;text-shadow:0 0 50px rgba(241,192,115,0.4)">${card.rating}</div>
      <div style="margin-top:10px;display:flex;justify-content:center;gap:6px">${card.positions.slice(0,2).map(p=>`<span style="display:inline-block;background:rgba(30,40,80,0.7);border:1.5px solid rgba(100,140,255,0.5);color:#93c5fd;font-size:11px;font-weight:900;padding:4px 12px;border-radius:6px;letter-spacing:.5px">${p}</span>`).join('')}</div>
    </div>

    <div id="woName" style="opacity:0;transition:opacity 0.7s ease;text-align:center;margin-bottom:36px">
      <div style="font-size:34px;font-weight:900;color:${nameColor};font-family:'Inter',sans-serif;line-height:1.1;letter-spacing:.3px;text-shadow:0 0 30px rgba(255,255,255,0.15)">${card.name}</div>
    </div>

    <button id="woBtn" style="opacity:0;transition:opacity 0.4s ease;background:${isTribute?'#02702A':'var(--gold)'};border:none;border-radius:12px;padding:14px 44px;font-size:16px;font-weight:900;color:${isTribute?'#fff':'#111'};cursor:pointer;font-family:'Inter',sans-serif">See All Cards →</button>
  `;
  document.body.appendChild(ov);

  // Skip button: only visible during the walkout animation itself
  const skipBtn = document.createElement('button');
  skipBtn.id = 'packWalkoutSkipBtn';
  skipBtn.innerHTML = 'Skip &#9193;';
  skipBtn.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9100;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.28);border-radius:24px;color:#fff;font-size:15px;font-weight:800;padding:11px 22px;cursor:pointer;letter-spacing:.5px;display:flex;align-items:center;gap:6px';
  skipBtn.onclick = () => { ov.remove(); skipBtn.remove(); onDone(); };
  document.body.appendChild(skipBtn);

  const sparkleWrap = ov.querySelector('#woSparkles');
  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      const s = document.createElement('div');
      const x = Math.random() * 100, y = Math.random() * 100;
      const size = 4 + Math.random() * 8;
      s.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:${size}px;height:${size}px;border-radius:50%;background:${accentColor};opacity:0;animation:goldTwinkle ${0.8+Math.random()*1.2}s ease-in-out ${Math.random()*2}s infinite alternate`;
      sparkleWrap.appendChild(s);
    }, i * 60);
  }

  // Cinematic reveal: team → year → rating+pos → name (~1s gaps)
  setTimeout(() => { ov.querySelector('#woBadge').style.opacity = '1'; }, 400);
  setTimeout(() => { ov.querySelector('#woYear').style.opacity = '1'; }, 1500);
  setTimeout(() => { ov.querySelector('#woRating').style.opacity = '1'; }, 2600);
  setTimeout(() => {
    ov.querySelector('#woName').style.opacity = '1';
    setTimeout(() => { const b=ov.querySelector('#woBtn'); if(b) b.style.opacity='1'; }, 500);
  }, 3700);

  ov.querySelector('#woBtn').onclick = () => { ov.remove(); skipBtn.remove(); onDone(); };
}

// ── Promos: the walkout (the owner's call: a FIFA-style moment when you pack one) ──────────────
// The screen shakes and light beams come up, TEAM OF THE YEAR (2026 PREMIERS, or the medal) slams in, then the position
// and the club, one at a time, and the card flips in with a shine. Skip goes straight to the card (css/theme.css .pw;
// a premier in his club's colours with the silver edge, .pw.is-prem)
function pwEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function showPlatWalkout(card, onDone) {
  const med = card.pm === 'medal', imm = card.pm === 'imm', prem = card.pk === 'prem', il = !!card.il, label = imm ? 'Immortal' : promoTag(card);
  const bg = (typeof CLUB_COLORS !== 'undefined' ? CLUB_COLORS[card.club] : null) || '#1a1a2e';
  const abbr = (typeof CLUB_ABBR !== 'undefined' ? CLUB_ABBR[card.club] : null) || card.club.slice(0,3).toUpperCase();
  const clubName = card.clubName || (typeof CLUBS !== 'undefined' && CLUBS[card.club] && CLUBS[card.club].name) || abbr;
  const fg = (typeof _clubTextColor !== 'undefined') ? _clubTextColor(bg) : '#fff';
  const ov = document.createElement('div');
  ov.className = 'pw' + (med ? ' is-medal' : '') + (imm ? ' is-imm' : '') + (prem ? ' is-prem' : '') + (il ? ' is-ileg' : '') + (card.wcp ? ' is-wcp' : '') + (card.ch ? ' is-wch' + (card.ch === 'potf' ? ' is-wch-medal' : '') : ''); // World Champions: premium World Cup blue foil // a World Legend: gold accents on his nation's colours; an 88+ Pick: World Cup sky blue
  if (prem) ov.style.cssText = promoVars(card);
  ov.innerHTML = `
    <div class="pw-beams"></div><div class="pw-flash"></div><div class="pw-sparks"></div>
    <div class="pw-stage">
      <div class="pw-label">${label}</div>
      <div class="pw-clues">
        <div class="pw-clue pw-pos">${card.positions.slice(0, 2).join(' / ')}</div>
        <div class="pw-clue pw-club"><span style="background:${bg};color:${fg}">${abbr}</span>${clubName}</div>
      </div>
      <div class="pw-card">${il && window.CastNations && window.CastNations.has(card.club) ? `<span class="pw-look" aria-hidden="true">${window.CastNations.svg(card.club, 220, 260)}</span>` : ''}
        <div class="pw-card-r">${card.rating}</div>
        ${il ? `<div class="pw-card-row"><span class="pw-card-p">${card.positions[0]}</span><span class="pw-card-club" style="background:${bg};color:${fg}">${abbr}</span></div>` : `<div class="pw-card-p">${card.positions[0]}</div>
        <div class="pw-card-club" style="background:${bg};color:${fg}">${abbr}</div>`}
        <div class="pw-card-n">${pwEsc(card.name)}${promoMark(card)}</div>
        <div class="pw-card-t">${il && card.line ? pwEsc(card.line).replace(/ \u00b7 /g, '\u00a0\u00b7 ') : label + ' &middot; ' + (imm && card.era ? card.era : card.year)}</div>
      </div>
      <button type="button" class="pw-go">Continue</button>
    </div>`;
  document.body.appendChild(ov);
  const sparks = ov.querySelector('.pw-sparks');
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('i'), z = 3 + Math.random() * 7;
    s.className = 'pw-spark';
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${z}px;height:${z}px;animation-delay:${(Math.random() * 2).toFixed(2)}s`;
    sparks.appendChild(s);
  }
  const steps = [[250, 's1'], [900, 's2'], [2300, 's3'], [3400, 's4'], [4600, 's5'], [5600, 's6']];
  const timers = steps.map(([t, c]) => setTimeout(() => ov.classList.add(c), t));
  const skipBtn = document.createElement('button');
  skipBtn.id = 'packWalkoutSkipBtn';
  skipBtn.className = 'pw-skip';
  skipBtn.innerHTML = 'Skip &#9193;';
  skipBtn.onclick = () => { timers.forEach(clearTimeout); ov.classList.add('s1', 's5', 's6', 'is-skip'); skipBtn.remove(); };
  document.body.appendChild(skipBtn);
  timers.push(setTimeout(() => skipBtn.remove(), 5600)); // the card is in: Continue takes over
  let closed = false;
  ov.querySelector('.pw-go').onclick = () => {
    if (closed) return;
    closed = true; timers.forEach(clearTimeout); ov.remove(); skipBtn.remove(); onDone();
  };
}

// ── Reveal all cards: worst→best, ascending from bottom to top ──────────────
function _packCardHTML(card) {
  const r = packRarityColor(card.rating);
  const isTribute = card.name === 'Jai Arrow';
  const badge = packClubBadge(card.club, 'sm');
  // Promos: platinum, or holographic platinum for the medal winner (css/theme.css .pk-plat); a premier in his club's
  // colours with the silver edge (.pk-prem)
  if (card.pm) {
    const med = card.pm === 'medal', tags = card.positions.map(p => `<span class="pk-plat-pos">${p}</span>`).join('');
    return {
      css: 'border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;' + promoVars(card),
      cls: 'pk-plat' + (card.pk === 'prem' ? ' pk-prem' : '') + (med ? ' is-medal' : ''),
      html: `<div class="pk-plat-r">${card.rating}</div>${badge}<div style="flex:1;min-width:0"><div class="pk-plat-n">${card.name}${promoMark(card)}</div><div class="pk-plat-t">${promoTag(card)} &middot; ${card.year}</div></div><div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:4px;flex-shrink:0;justify-content:flex-end">${tags}</div>`
    };
  }
  const posTags = card.positions.map(p => {
    const colors = {FB:'#93c5fd',W:'#93c5fd',C:'#5eead4',FE:'#86efac',HB:'#86efac',HK:'#fdba74',P:'#fca5a5',SR:'#c4b5fd',LK:'#c4b5fd'};
    const bgs = {FB:'#1e3a8a',W:'#1e3a8a',C:'#134e4a',FE:'#14532d',HB:'#14532d',HK:'#7c2d12',P:'#7f1d1d',SR:'#3b0764',LK:'#3b0764'};
    return `<span style="display:inline-block;background:${bgs[p]||'#1a1a3a'};color:${colors[p]||'#93c5fd'};font-size:10px;font-weight:900;padding:3px 7px;border-radius:5px;letter-spacing:.3px">${p}</span>`;
  }).join('');
  if (isTribute) {
    return {
      css: 'background:#fff;border:2px solid #02702A;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 0 14px rgba(2,112,42,0.35)',
      html: `<div style="font-size:26px;font-weight:900;color:#02702A;font-family:'Inter',sans-serif;min-width:36px;text-align:center;line-height:1">${card.rating}</div>${badge}<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:900;color:#02702A;line-height:1.2">${card.name}</div><div style="font-size:10px;color:#3a7a50;margin-top:2px">${card.year}</div></div><div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:4px;flex-shrink:0;justify-content:flex-end">${posTags}</div>`
    };
  }
  return {
    css: `background:${r.bg};border:${card.rating>=90?'2px':'1.5px'} solid ${r.border};border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px`,
    html: `<div style="font-size:26px;font-weight:900;color:${r.text};font-family:'Inter',sans-serif;min-width:36px;text-align:center;line-height:1">${card.rating}</div>${badge}<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:900;color:${r.text};line-height:1.2">${card.name}</div><div style="font-size:10px;color:${r.text};opacity:.7;margin-top:2px">${card.year}</div></div><div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:4px;flex-shrink:0;justify-content:flex-end">${posTags}</div>`
  };
}

function revealPackCards() {
  const pack = STATE.packs[STATE.packIdx];
  const packNum = STATE.packIdx + 1;
  const isLast = STATE.packIdx === PACK_TOTAL - 1;
  // Sort ascending: worst first (index 0=bottom), best last (index n-1=top)
  const sorted = [...pack].sort((a, b) => a.rating - b.rating);
  const inner = document.getElementById('packOpeningInner');
  inner.style.cssText = 'padding:16px 16px 8px;max-width:480px;margin:0 auto;width:100%;box-sizing:border-box';

  // Pre-render all cards invisible: layout is fully static, no shifts
  // Best card first in DOM (top), worst last (bottom)
  const cardsHTML = [...sorted].reverse().map((card, ri) => {
    const i = sorted.length - 1 - ri; // original index (0=worst/bottom)
    const {css, html, cls} = _packCardHTML(card);
    return `<div id="pslot-${i}"${cls ? ` class="${cls}"` : ''} style="${css};opacity:0;transition:opacity 0.35s ease">${html}</div>`;
  }).join('');

  inner.innerHTML = `
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:10px;font-weight:900;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:4px">Pack ${packNum} of ${PACK_TOTAL}</div>
      <div style="font-size:20px;font-weight:900;color:#fff;font-family:'Inter',sans-serif">${isLast ? '🏆 Final Pack!' : `Pack ${packNum} Opened`}</div>
    </div>
    <div id="packCardsList" style="display:flex;flex-direction:column;gap:8px">${cardsHTML}</div>
  `;

  // Footer: Next/Build button, disabled until all cards have finished revealing
  const footer = document.getElementById('packOpeningFooter');
  const revealMs = sorted.length * 220 + 350;
  if (footer) {
    const mainBtn = isLast
      ? `<button id="packMainBtn" disabled onclick="finishPackOpening()" style="width:100%;padding:16px;border:none;border-radius:12px;background:var(--gold);color:#111;font-size:17px;font-weight:900;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.4);opacity:0.4;transition:opacity 0.3s">⚡ Build Your Team</button>`
      : `<button id="packMainBtn" disabled onclick="nextPack()" style="width:100%;padding:16px;border:none;border-radius:12px;background:linear-gradient(135deg,#3b5bdb,#6688ff);color:#fff;font-size:17px;font-weight:900;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.4);opacity:0.4;transition:opacity 0.3s">Next Pack →</button>`;
    footer.innerHTML = `<div style="max-width:480px;margin:0 auto;padding:0 16px;box-sizing:border-box">${mainBtn}</div>`;
  }
  setTimeout(() => {
    const btn = document.getElementById('packMainBtn');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }, revealMs);

  // Fade in cards one by one from bottom (i=0) to top (i=n-1)
  _packRevealCards = sorted;
  _packRevealTimers = [];
  sorted.forEach((card, i) => {
    const t = setTimeout(() => {
      const slot = document.getElementById(`pslot-${i}`);
      if (slot) slot.style.opacity = '1';
    }, i * 220);
    _packRevealTimers.push(t);
  });
}

let _packRevealCards = [];
let _packRevealTimers = [];

function skipPackAnimation() {
  _packRevealTimers.forEach(t => clearTimeout(t));
  _packRevealTimers = [];
  _packRevealCards.forEach((card, i) => {
    const slot = document.getElementById(`pslot-${i}`);
    if (!slot || slot.innerHTML.trim()) return;
    const {css, html, cls} = _packCardHTML(card);
    slot.style.cssText = css;
    slot.className = cls || '';
    slot.innerHTML = html;
  });
}

function nextPack() {
  const sb = document.getElementById('packWalkoutSkipBtn'); if (sb) sb.remove();
  STATE.packIdx++;
  showScreen('pack-opening');
  renderPackIntro();
  document.getElementById('pack-opening').scrollTop = 0;
}

function finishPackOpening() {
  const sb = document.getElementById('packWalkoutSkipBtn'); if (sb) sb.remove();
  STATE.team = Array(13).fill(null);
  STATE.takenNames = new Set();
  // Final validation layer: confirm a legal Starting 13 can actually be assembled.
  // If somehow not (shouldn't happen given the pack-build guarantee, but never trust it blindly),
  // top up from the full player pool before the user ever sees the team builder.
  if (!STATE.isGodPack && !canAssembleFullSquad(STATE.packAllCards).ok) {
    const tiers = buildWeightedPackPool();
    const allPool = [...tiers.gold, ...tiers.purple, ...tiers.blue, ...tiers.grey];
    ensurePackPoolCanFillSquad(STATE.packAllCards, allPool);
  }
  STATE.packPlayers = STATE.packAllCards;
  showScreen('pack-squad');
  renderPackSquad();
}

let _packSelectedSlot = null;
let _cachedFieldSize = null; // cached classic field circle size: cleared on resize/new draft
let _packRenderedPlayers = [];

function updatePackRatingBar() {
  const filled = STATE.team.filter(Boolean);
  const count = filled.length;
  const rating = count > 0
    ? (typeof calcTeamRating === 'function' ? calcTeamRating() : Math.round(filled.reduce((s, p) => s + p.rating, 0) / count))
    : 0;
  const rEl = document.getElementById('packLiveRating');
  const fillEl = document.getElementById('packRatingFill');
  const countEl = document.getElementById('packSlotCount');
  if (!rEl) return;
  rEl.textContent = count > 0 ? rating : '-';
  const rc = typeof ratingColor === 'function' ? ratingColor(rating) : '#f1c073';
  rEl.style.color = count > 0 ? rc : '#555';
  const pct = count > 0 ? Math.min(100, Math.max(0, (rating - 75) / 20 * 100)) : 0;
  fillEl.style.width = pct + '%';
  fillEl.style.background = count > 0 ? rc : '#333';
  countEl.textContent = `${count} / 13 players`;
  const startBtn = document.getElementById('packStartBtn');
  if (startBtn) {
    startBtn.disabled = count < 13;
    startBtn.innerHTML = count < 13 ? `${count} / 13 picked` : '&#9654; START SEASON';
  }
  countEl.style.color = count === 13 ? '#22c55e' : '#555';
  // Sub-ratings: backs, forwards, spine (matches classic mode)
  if (typeof calcSubRatings === 'function') {
    const sub = calcSubRatings();
    const setS = (id, v) => { const el=document.getElementById(id); if(!el) return; el.textContent=v??'-'; el.style.color=v?(typeof ratingColor==='function'?ratingColor(v):'#fff'):'var(--muted)'; };
    setS('packSubBacks', sub.backs);
    setS('packSubFwds', sub.forwards);
    setS('packSubSpine', sub.spine);
  }
}

function renderPackSquad() {
  const wrap = document.getElementById('packSquadField');
  if (!wrap) return;
  updatePackRatingBar();
  const t = fieldTileSize(wrap);
  const tm = fieldTileMetrics(t);
  let h = '<div class="nrl-field-inner">';
  Object.entries(FIELD_POSITIONS).forEach(([idx, pos]) => {
    const i = parseInt(idx);
    const p = STATE.team[i];
    const slot = SLOTS[i];
    const isSelected = _packSelectedSlot === i;
    const isTribute = p && p.name === 'Jai Arrow';
    const tierClass = p ? (isTribute ? 'fp-tribute' : p.pm === 'imm' ? 'fp-imm' : p.pm ? promoCls(p, 'fp').trim() : (typeof fieldTierClass === 'function' ? fieldTierClass(p.rating) : '')) : '';
    h += `<div class="fpos" style="left:${pos.x}%;top:${pos.y}%;position:absolute;width:${t.w}px !important" onclick="packSelectFieldSlot(${i})">`;
    if (p) {
      h += `<button onclick="event.stopPropagation();packRemovePlayer(${i})" style="position:absolute;top:-6px;right:-6px;background:#3a0808;border:1.5px solid #f87171;border-radius:50%;width:17px;height:17px;cursor:pointer;color:#f87171;font-size:10px;font-weight:900;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;z-index:10;touch-action:manipulation">✕</button>`;
    }
    h += `<div class="fpos-circle${p ? ' fp-filled ' + tierClass : ''}${isSelected ? ' fp-pack-sel' : ''}" style="width:${t.w}px !important;height:${t.h}px !important;${promoVars(p)}">`;
    h += fieldTileInner(slot.type, pos.a, p, tm);
    h += `</div><div class="fpos-label"${isSelected ? ' style="color:var(--gold);font-weight:900"' : ''}>${slot.label}</div>`;
    h += '</div>';
  });
  h += '</div>';
  wrap.innerHTML = h;
  if (typeof scaleFieldNames === 'function') scaleFieldNames(wrap);
  renderPackPlayerList();
}
function packSelectFieldSlot(i) {
  _packSelectedSlot = (_packSelectedSlot === i) ? null : i;
  renderPackSquad();
}
function renderPackPlayerList() {
  const list = document.getElementById('packPlayerList');
  const hdr = document.getElementById('packPlayerListHdr');
  list.innerHTML = '';
  const slot = _packSelectedSlot !== null ? SLOTS.find(s => s.i === _packSelectedSlot) : null;
  const slotType = slot ? slot.type : null;
  if (hdr) {
    hdr.textContent = slotType ? `${slot.label}: eligible players` : 'All Players';
    hdr.style.color = slotType ? 'var(--gold)' : '#888';
  }
  const players = [...STATE.packPlayers]
    .filter(card => {
      if (slotType && !card.positions.includes(slotType)) return false;
      return true;
    })
    .sort((a, b) => b.rating - a.rating);
  _packRenderedPlayers = players;
  players.forEach((card, cardIdx) => {
    const alreadyPicked = STATE.team.some(t => t && t.name === card.name && t.club === card.club && t.year === card.year);
    const isTribute = card.name === 'Jai Arrow';
    const clubName = card.clubName || (CLUBS[card.club]?.name) || card.club;
    const posTags = card.positions.map(p => `<span class="ptag ptag-${p} ptag-btn" onclick="event.stopPropagation();packClickPos(${cardIdx},'${p}')">${p}</span>`).join('');
    const cc = CLUB_COLORS[card.club] || '#1a1a2e';
    const cs = CLUB_SECONDARY[card.club] || '#fff';
    const abbr = CLUB_ABBR[card.club] || card.club;
    const clubTag = `<span class="club-tag" style="background:${cc};color:${cs};font-size:9px;font-weight:900;padding:4px 7px;border-radius:5px;letter-spacing:.5px;flex-shrink:0">${abbr}</span>`;

    const div = document.createElement('div');
    div.className = 'player-row' + (isTribute ? ' pr-tribute' : '') + (card.pm === 'imm' ? ' pr-imm' : promoCls(card, 'pr')) + (alreadyPicked ? ' pr-taken' : '');
    if (card.pk === 'prem') div.style.cssText += promoVars(card);

    const badge = isTribute
      ? `<div class="pr-badge" style="background:linear-gradient(135deg,#72BE8F,#02702A)">${card.rating}</div>`
      : `<div class="pr-badge ${card.pm === 'imm' ? 'rb-imm' : ratingClass(card.rating)}">${card.rating}</div>`;

    div.innerHTML = `${badge}<div class="pr-info"><div class="pr-name">${card.name}${card.pm === 'imm' ? '<span class="pr-pm">Immortal</span>' : card.pm ? promoMark(card) + '<span class="pr-pm">' + promoTag(card) + '</span>' : ''}</div><div class="pr-club">${clubName} · ${card.pm === 'imm' && card.era ? card.era : card.year}</div></div><div class="pr-right"><div class="pr-tags">${posTags}</div>${clubTag}</div>`;

    if (!alreadyPicked) {
      div.onclick = () => {
        if (_packSelectedSlot !== null) {
          packAssignPlayer(card);
        } else {
          packAutoAssignPlayer(card);
        }
      };
    }
    list.appendChild(div);
  });
}

function packAssignPlayer(card) {
  if (_packSelectedSlot === null) return;
  const slot = SLOTS.find(s => s.i === _packSelectedSlot);
  if (!slot) return;
  if (!card.positions.includes(slot.type)) return;
  if (STATE.team[_packSelectedSlot]) {
    STATE.takenNames.delete(STATE.team[_packSelectedSlot].name + '|' + (STATE.team[_packSelectedSlot].year||''));
  }
  STATE.team[_packSelectedSlot] = { name: card.name, club: card.club, year: card.year, positions: card.positions, rating: card.rating, pos: slot.type, ...promoKeep(card) };
  if (card.pm && card.pm !== 'imm' && window.CastAccount && CastAccount.unlock) CastAccount.unlock([promoTrophy(card)]); // promos: the Team of the Year or 2026 Premiers trophy
  STATE.takenNames.add(card.name + '|' + (card.year||''));
  _packSelectedSlot = null;
  renderPackSquad();
}

function packAutoAssignPlayer(card) {
  // Find the first empty slot this card's positions can fill
  const eligible = typeof ELIGIBLE_SLOTS !== 'undefined' ? ELIGIBLE_SLOTS : {};
  for (let i = 0; i < SLOTS.length; i++) {
    if (STATE.team[i]) continue;
    const slotType = SLOTS[i].type;
    // A card fills a slot if any of the card's positions matches the slot type
    // (respecting ELIGIBLE_SLOTS cross-position rules e.g. SR can fill LK)
    const canFill = card.positions.some(p => {
      if (p === slotType) return true;
      const fillable = eligible[slotType] || [slotType];
      return fillable.includes(p);
    });
    if (canFill) {
      _packSelectedSlot = i;
      packAssignPlayer(card);
      return;
    }
  }
}

function packClickPos(cardIdx, pos) {
  const card = _packRenderedPlayers[cardIdx];
  if (!card || !card.positions.includes(pos)) return;
  const alreadyPicked = STATE.team.some(t => t && t.name === card.name && t.club === card.club && t.year === card.year);
  if (alreadyPicked) return;
  // If selected slot matches this position, use it; otherwise find first empty slot of this type
  const selSlot = _packSelectedSlot !== null ? SLOTS.find(s => s.i === _packSelectedSlot) : null;
  let targetIdx;
  if (selSlot && selSlot.type === pos) {
    targetIdx = selSlot.i;
  } else {
    const eligible = SLOTS.filter(s => s.type === pos && !STATE.team[s.i]);
    targetIdx = eligible.length > 0 ? eligible[0].i : null;
  }
  if (targetIdx === null || targetIdx === undefined) return;
  if (STATE.team[targetIdx]) STATE.takenNames.delete(STATE.team[targetIdx].name + '|' + (STATE.team[targetIdx].year||''));
  STATE.team[targetIdx] = { name: card.name, club: card.club, year: card.year, positions: card.positions, rating: card.rating, pos, ...promoKeep(card) };
  if (card.pm && card.pm !== 'imm' && window.CastAccount && CastAccount.unlock) CastAccount.unlock([promoTrophy(card)]); // promos: the Team of the Year or 2026 Premiers trophy
  STATE.takenNames.add(card.name + '|' + (card.year||''));
  _packSelectedSlot = null;
  renderPackSquad();
}

function packRemovePlayer(slotIdx) {
  const p = STATE.team[slotIdx];
  if (p) STATE.takenNames.delete(p.name + '|' + (p.year||''));
  STATE.team[slotIdx] = null;
  renderPackSquad();
}

function packResetTeam() {
  STATE.team = Array(13).fill(null);
  STATE.takenNames = new Set();
  _packSelectedSlot = null;
  renderPackSquad();
}
function packAutoBuild() {
  const pool = STATE.packPlayers;
  const pkey = p => p.name + '|' + (p.year || '');

  // Preserve already-placed players
  const preUsed = new Set();
  SLOTS.forEach(slot => {
    if (STATE.team[slot.i]) preUsed.add(pkey(STATE.team[slot.i]));
  });

  // Slots to fill and candidate players (not already placed)
  const emptySlots = SLOTS.filter(s => !STATE.team[s.i]);
  const candidates = pool.filter(p => !preUsed.has(pkey(p)));

  if (emptySlots.length > 0 && candidates.length > 0) {
    // Max-weight bipartite matching (Hungarian algorithm, O(n³))
    // Maximises total rating across all empty slots simultaneously
    const ns = emptySlots.length;
    const np = candidates.length;
    const INF = 1e9;

    // cost[i][j] = -rating if candidate j is eligible for emptySlots[i], else INF (min-cost form)
    const cost = Array.from({length: ns}, (_, i) =>
      Array.from({length: np}, (_, j) =>
        candidates[j].positions.includes(emptySlots[i].type) ? -candidates[j].rating : INF
      )
    );

    // Hungarian algorithm for min-cost assignment (ns rows, np cols, np >= ns required)
    // Pad columns if needed so np >= ns
    const m = Math.max(ns, np);
    const C = Array.from({length: ns}, (_, i) => {
      const row = cost[i].slice();
      while (row.length < m) row.push(INF);
      return row;
    });

    const u = new Array(ns + 1).fill(0);
    const v = new Array(m + 1).fill(0);
    const p = new Array(m + 1).fill(0); // p[j] = row assigned to col j (1-indexed)
    const way = new Array(m + 1).fill(0);

    for (let i = 1; i <= ns; i++) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array(m + 1).fill(INF);
      const used = new Array(m + 1).fill(false);
      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = INF, j1 = -1;
        for (let j = 1; j <= m; j++) {
          if (!used[j]) {
            const cur = C[i0 - 1][j - 1] - u[i0] - v[j];
            if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
            if (minv[j] < delta) { delta = minv[j]; j1 = j; }
          }
        }
        for (let j = 0; j <= m; j++) {
          if (used[j]) { u[p[j]] -= delta; v[j] += delta; }
          else minv[j] -= delta;
        }
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }

    // Extract assignment: for each col j, p[j] = row (1-indexed)
    for (let j = 1; j <= m; j++) {
      if (p[j] === 0 || j > np) continue;
      const si = p[j] - 1; // slot index in emptySlots
      const pi = j - 1;    // player index in candidates
      const slot = emptySlots[si];
      const card = candidates[pi];
      if (C[si][pi] < INF && !STATE.team[slot.i]) {
        STATE.team[slot.i] = { name: card.name, club: card.club, year: card.year, positions: card.positions, rating: card.rating, pos: slot.type, ...promoKeep(card) }; // keeps a Pick's marking
        STATE.takenNames.add(pkey(card));
      }
    }
  }

  _packSelectedSlot = null;
  renderPackSquad();
}

function packLockTeam() {
  const filled = STATE.team.filter(Boolean).length;
  if (filled < 13) {
    alert(`Fill all 13 positions first (${filled}/13 filled)`);
    return;
  }
  STATE.rating = typeof calcTeamRating === 'function' ? calcTeamRating() : Math.round(STATE.team.filter(Boolean).reduce((a,p)=>a+p.rating,0)/13);
  STATE.teamName = (document.getElementById('packTeamNameInput') || {}).value?.trim() || (document.getElementById('teamNameInput') || {}).value?.trim() || 'My Team';
  if(typeof gtag!=='undefined') gtag('event','draft_completed',{event_category:'draft',squad_rating:STATE.rating,game_mode:'pack'});
  startSeason();
}

function showPackSquadComplete() {
  const backs = STATE.team.filter(p => p && ['FB','W','C','FE','HB'].some(pos => p.pos === pos));
  const forwards = STATE.team.filter(p => p && ['PR','HK','SR','LK'].some(pos => p.pos === pos));
  const spine = STATE.team.filter(p => p && ['FB','HB','FE'].some(pos => p.pos === pos));
  const avg = arr => arr.length ? Math.round(arr.reduce((s, p) => s + p.rating, 0) / arr.length) : 0;
  showScreen('pack-squad-complete');
  document.getElementById('pscTeamName').textContent = myTeam();
  document.getElementById('pscRating').textContent = STATE.rating;
  document.getElementById('pscBacks').textContent = avg(backs);
  document.getElementById('pscForwards').textContent = avg(forwards);
  document.getElementById('pscSpine').textContent = avg(spine);
}
