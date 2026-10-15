const CLUBS = {
  adelaide         : {name:'Adelaide Rams', from:1998, to:1998},
  balmain          : {name:'Balmain Tigers', from:1998, to:1999},
  bears            : {name:'North Sydney Bears', from:1998, to:1999},
  broncos          : {name:'Brisbane Broncos', from:1998, to:2026},
  bulldogs         : {name:'Canterbury-Bankstown Bulldogs', from:1998, to:2026},
  cowboys          : {name:'North Queensland Cowboys', from:1998, to:2026},
  dolphins         : {name:'Dolphins', from:2023, to:2026},
  dragons          : {name:'St. George Illawarra Dragons', from:1999, to:2026},
  eels             : {name:'Parramatta Eels', from:1998, to:2026},
  knights          : {name:'Newcastle Knights', from:1998, to:2026},
  northerneagles   : {name:'Northern Eagles', from:2000, to:2002},
  panthers         : {name:'Penrith Panthers', from:1998, to:2026},
  rabbitohs        : {name:'South Sydney Rabbitohs', from:1998, to:2026},
  raiders          : {name:'Canberra Raiders', from:1998, to:2026},
  roosters         : {name:'Sydney Roosters', from:1998, to:2026},
  seaeagles        : {name:'Manly Warringah Sea Eagles', from:1998, to:2026},
  sharks           : {name:'Cronulla-Sutherland Sharks', from:1998, to:2026},
  steelers         : {name:'Illawarra Steelers', from:1998, to:1998},
  stgeorge         : {name:'St George Dragons', from:1998, to:1998},
  storm            : {name:'Melbourne Storm', from:1998, to:2026},
  tigers           : {name:'Wests Tigers', from:2000, to:2026},
  titans           : {name:'Gold Coast Titans', from:2007, to:2026},
  warriors         : {name:'NZ Warriors', from:1998, to:2026},
  wmagpies         : {name:'Wests Magpies', from:1998, to:1999}
};

const CLUB_ABBR = {
  adelaide      : 'RAM',
  balmain       : 'BAL',
  bears         : 'NSB',
  broncos       : 'BRI',
  bulldogs      : 'BUL',
  cowboys       : 'NQC',
  dolphins      : 'DOL',
  dragons       : 'SGI',
  eels          : 'PAR',
  knights       : 'NEW',
  northerneagles: 'NEA',
  panthers      : 'PTH',
  rabbitohs     : 'SSR',
  raiders       : 'CBR',
  roosters      : 'SYD',
  seaeagles     : 'MAN',
  sharks        : 'CRO',
  steelers      : 'ILL',
  stgeorge      : 'STG',
  storm         : 'MEL',
  tigers        : 'WST',
  titans        : 'GCT',
  warriors      : 'NZW',
  wmagpies      : 'WMP',
  easts         : 'EST', // Immortal Picks' historic clubs (js/picks.js, like 1000TRIES): badge colours only,
  glebe         : 'GLE'  // never in CLUBS or the spins
};

const CLUB_SECONDARY = {
  adelaide      : '#FFD700',
  balmain       : '#000000',
  bears         : '#000000',
  broncos       : '#F5A623',
  bulldogs      : '#FFFFFF',
  cowboys       : '#C4A84B',
  dolphins      : '#FFFFFF',
  dragons       : '#FFFFFF',
  eels          : '#FFD700',
  knights       : '#003087',
  northerneagles: '#FFFFFF',
  panthers      : '#FFFFFF',
  rabbitohs     : '#CC0000',
  raiders       : '#FFFFFF',
  roosters      : '#CC0000',
  seaeagles     : '#FFFFFF',
  sharks        : '#000000',
  steelers      : '#003087',
  stgeorge      : '#FFFFFF',
  storm         : '#FFD600',
  tigers        : '#000000',
  titans        : '#001F5B',
  warriors      : '#FFFFFF',
  wmagpies      : '#FFFFFF',
  easts         : '#CC0000',
  glebe         : '#FFFFFF'
};

// Primary club colours for spin slot background
const CLUB_COLORS = {
  adelaide      : '#002D71', // similar to Eels navy era
  balmain       : '#F37221', // same orange as Wests Tigers (became Tigers)
  bears         : '#CC0000', // North Sydney Bears red
  broncos       : '#6B0046',
  bulldogs      : '#00468B',
  cowboys       : '#0B233F',
  dolphins      : '#FB141C',
  dragons       : '#D22730',
  eels          : '#002D71',
  knights       : '#D22730',
  northerneagles: '#6B1D45', // merged Manly/North Sydney: use Sea Eagles
  panthers      : '#000000',
  rabbitohs     : '#003C1A',
  raiders       : '#36AD2D',
  roosters      : '#012D5C',
  seaeagles     : '#6B1D45',
  sharks        : '#0182BB',
  steelers      : '#D22730', // became Dragons
  stgeorge      : '#D22730', // same red as Dragons
  storm         : '#592B8D',
  tigers        : '#F37221',
  titans        : '#00A2E0',
  warriors      : '#000000',
  wmagpies      : '#000000', // Wests Magpies black
  easts         : '#012D5C', // Eastern Suburbs and Glebe: Immortal Picks' historic clubs (js/picks.js)
  glebe         : '#7A1F2B',
};

function _clubTextColor(hex) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return (0.299*r+0.587*g+0.114*b)>140?'#111':'#fff';
}

function _applyClubColor(cid) {
  const slot=document.getElementById('spinClubSlot');
  const lbl=document.getElementById('spinClubLbl');
  const val=document.getElementById('spinClubVal');
  if(!slot) return;
  const bg=CLUB_COLORS[cid]||null;
  if(bg){
    const fg=_clubTextColor(bg);
    slot.style.background=bg;
    slot.style.borderColor=bg;
    if(lbl){lbl.style.color=fg==='#fff'?'rgba(255,255,255,0.6)':'rgba(0,0,0,0.5)';}
    if(val){val.style.color=fg;}
  } else {
    slot.style.background='';slot.style.borderColor='';
    if(lbl)lbl.style.color='';if(val)val.style.color='';
  }
}

function _resetClubColor() {
  const slot=document.getElementById('spinClubSlot');
  const lbl=document.getElementById('spinClubLbl');
  const val=document.getElementById('spinClubVal');
  if(slot){slot.style.background='';slot.style.borderColor='';}
  if(lbl)lbl.style.color='';
  if(val)val.style.color='';
}

const DISPLAY_ABBR={RW:"W",LW:"W",RC:"C",LC:"C","5/8":"FE"};
function displayAbbr(a){return DISPLAY_ABBR[a]||a;}
const SLOTS = [
  {i:0, type:'FB', label:'Fullback',     abbr:'FB'},
  {i:1, type:'W',  label:'Right Wing',   abbr:'RW'},
  {i:2, type:'C',  label:'Right Centre', abbr:'RC'},
  {i:3, type:'C',  label:'Left Centre',  abbr:'LC'},
  {i:4, type:'W',  label:'Left Wing',    abbr:'LW'},
  {i:5, type:'FE', label:'Five-Eighth',  abbr:'5/8'},
  {i:6, type:'HB', label:'Halfback',     abbr:'HB'},
  {i:7, type:'P',  label:'Prop',         abbr:'P'},
  {i:8, type:'HK', label:'Hooker',       abbr:'HK'},
  {i:9, type:'P',  label:'Prop',         abbr:'P'},
  {i:10,type:'SR', label:'Second Row',   abbr:'SR'},
  {i:11,type:'SR', label:'Second Row',   abbr:'SR'},
  {i:12,type:'LK', label:'Lock',         abbr:'LK'},
];

// TIGHTENED: Props stay at prop. SR can fill Lock. Lock can fill SR. No forward crossover to prop.
const ELIGIBLE_SLOTS = {
  FB:['FB'],
  W: ['W'],
  C: ['C'],
  FE:['FE'],
  HB:['HB'],
  P: ['P'],
  HK:['HK'],
  SR:['SR'],
  LK:['LK'],
};

// Format: [name, club_id, year_from, year_to, [positions], prime_rating]
// positions use primary role only for forwards - no P/SR/LK crossover in data
// Namesakes carry a club tag in the data ("Ben Jones (Raiders)") so the leaderboard server can tell them apart.
// In the game the tag becomes an invisible marker (U+2060): the name reads "Ben Jones" everywhere, surname
// included, but stays unique. playerKey() turns it back into the tagged name when a result is saved.
const PLAYER_KEYS = {};
function playerKey(n) { return PLAYER_KEYS[n] || n; }
const RAW_PLAYERS = (function () {
  // Player list comes from data/players.json (generated by the shared player sync).
  // Loaded synchronously so the game code below runs exactly as it did when the list was inline. A failed load (no
  // signal, a busy moment) is tried twice more, then the page says so with a Reload button instead of sitting dead.
  var rows = null, marks = {};
  for (var i = 0; i < 3 && !rows; i++) {
    try {
      var x = new XMLHttpRequest();
      x.open('GET', 'data/players.json' + (i ? '?r=' + i : ''), false);
      x.send(null);
      if (x.status >= 200 && x.status < 300) rows = JSON.parse(x.responseText);
    } catch (e) { rows = null; }
    if (!Array.isArray(rows) || !rows.length) rows = null;
  }
  if (!rows) {
    var show = function () {
      var d = document.createElement('div');
      d.setAttribute('role', 'alert');
      d.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;background:#0b0b0f;color:#fff;font:600 16px/1.45 system-ui,-apple-system,sans-serif;text-align:center';
      d.innerHTML = '<div>The player list did not load.<br>Check your connection and try again.</div>' +
        '<button type="button" style="font:700 15px system-ui,-apple-system,sans-serif;padding:12px 26px;border-radius:999px;border:0;background:#fff;color:#0b0b0f;cursor:pointer">Reload</button>';
      d.querySelector('button').onclick = function () { location.reload(); };
      document.body.appendChild(d);
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
    throw new Error('27-0: the player list did not load');
  }
  rows.forEach(function (r) {
    var m = / \([^)]+\)$/.exec(r[0]);
    if (!m) return;
    var base = r[0].slice(0, m.index);
    marks[base] = (marks[base] || 0) + 1;
    var shown = base + '\u2060'.repeat(marks[base]);
    PLAYER_KEYS[shown] = r[0];
    r[0] = shown;
  });
  return rows;
})();
// Dally M: map opponent display names → club IDs for squad lookup
const OPPONENT_CLUB_MAP = {
  'Brisbane Broncos':'broncos','Canberra Raiders':'raiders','Canterbury-Bankstown Bulldogs':'bulldogs',
  'Cronulla-Sutherland Sharks':'sharks','Dolphins':'dolphins','Gold Coast Titans':'titans',
  'Manly Warringah Sea Eagles':'seaeagles','Melbourne Storm':'storm','Newcastle Knights':'knights',
  'North Queensland Cowboys':'cowboys','Parramatta Eels':'eels','Penrith Panthers':'panthers',
  'South Sydney Rabbitohs':'rabbitohs','St. George Illawarra Dragons':'dragons',
  'Sydney Roosters':'roosters','Wests Tigers':'tigers','NZ Warriors':'warriors'
};
const FIXTURE_SHORT_NAME = {
  'Brisbane Broncos':'Broncos','Canberra Raiders':'Raiders','Canterbury-Bankstown Bulldogs':'Bulldogs',
  'Cronulla-Sutherland Sharks':'Sharks','Dolphins':'Dolphins','Gold Coast Titans':'Titans',
  'Manly Warringah Sea Eagles':'Sea Eagles','Melbourne Storm':'Storm','Newcastle Knights':'Knights',
  'North Queensland Cowboys':'Cowboys','Parramatta Eels':'Eels','Penrith Panthers':'Panthers',
  'South Sydney Rabbitohs':'Rabbitohs','St. George Illawarra Dragons':'Dragons',
  'Sydney Roosters':'Roosters','Wests Tigers':'Tigers','NZ Warriors':'Warriors'
};

function getDallyMWinner(season, finals) {
  const s = season; const f = finals;
  // Determine if user team wins the Dally M
  const userIsChamp = f.isChampian || f.isChampion;
  const userPos = s.myLadderPos;
  const userChance = userIsChamp ? 0.85 : userPos <= 1 ? 0.65 : userPos <= 2 ? 0.45 : userPos <= 4 ? 0.25 : 0.1;
  const useUserTeam = Math.random() < userChance;

  // Dally M eligible: spine (FB/HB/FE/HK), Props (P), Lock (LK) only: no wingers, centres or SR
  function dallyMWeight(p) {
    const pos = p.positions[0];
    if (['HB','FE'].includes(pos)) return p.rating * 4;   // halves most likely
    if (['FB','HK'].includes(pos)) return p.rating * 3;   // fullback/hooker
    if (pos === 'LK') return p.rating * 1.5;              // lock
    if (pos === 'P') return p.rating * 0.8;               // prop: eligible but rare
    return 0; // W, C, SR: ineligible
  }
  function weightedPick(pool) {
    const total = pool.reduce((s,p) => s + dallyMWeight(p), 0);
    let rnd = Math.random() * total;
    for (const p of pool) { rnd -= dallyMWeight(p); if (rnd <= 0) return p; }
    return pool[0];
  }

  if (useUserTeam) {
    // Pick from eligible positions only: spine + prop + lock (no W/C/SR)
    const eligible=['FB','HB','FE','HK','LK','P'];
    const pool = STATE.team.filter(p=>p!==null&&eligible.includes(p.positions[0])).sort((a,b)=>b.rating-a.rating).slice(0,6);
    if (pool.length) {
      const pick = weightedPick(pool);
      return { name: pick.name, team: myTeam(), pos: pick.positions[0] };
    }
  }

  // Pick from AI champion or minor premiers
  const aiTeamName = f.champion?.name || (s.ladder?.[0]?.name);
  if (aiTeamName && aiTeamName !== myTeam()) {
    const clubId = OPPONENT_CLUB_MAP[aiTeamName];
    if (clubId && CLUBS[clubId]) {
      const club = CLUBS[clubId];
      const midYear = Math.round((club.from + club.to) / 2);
      const squad = getSquadForClubYear(clubId, midYear);
      if (squad.length) {
        // Pick from top 5, weighted by position (no single player dominates)
        const top = squad.slice(0, Math.min(5, squad.length));
        const pick = weightedPick(top);
        return { name: pick.name, team: aiTeamName, pos: pick.positions[0] };
      }
    }
  }
  // Fallback: user's best player
  let best = null;
  STATE.team.forEach(p => { if (p && (!best || p.rating > best.rating)) best = p; });
  return best ? { name: best.name, team: myTeam(), pos: best.positions[0] } : null;
}


const NRL_OPPONENTS = [
  {name:'Penrith Panthers',       strength:86},
  {name:'Melbourne Storm',        strength:85},
  {name:'Sydney Roosters',        strength:83},
  {name:'Brisbane Broncos',       strength:82},
  {name:'Manly Warringah Sea Eagles',       strength:82},
  {name:'North Queensland Cowboys',             strength:81},
  {name:'Cronulla-Sutherland Sharks',        strength:80},
  {name:'South Sydney Rabbitohs', strength:80},
  {name:'Canberra Raiders',       strength:79},
  {name:'NZ Warriors',            strength:78},
  {name:'Parramatta Eels',        strength:78},
  {name:'Newcastle Knights',      strength:76},
  {name:'Canterbury-Bankstown Bulldogs',    strength:76},
  {name:'Gold Coast Titans',      strength:74},
  {name:'St. George Illawarra Dragons',    strength:74},
  {name:'Dolphins',               strength:74},
  {name:'Wests Tigers',           strength:73},
];

// Get squad for a club/year - deduplicates by name (highest rating wins)
function getSquadForClubYear(clubId, year) {
  // New format: [name, [[club,yf,yt],...], positions, rating]
  const result = [];
  // Promos (js/cast-promo.js): the Dally M Team of the Year, or the 2026 Premiers (the winning club's whole squad, only in
  // its own 2026 spin), on their 2026 season at 95+ and the medal winner at 99, marked pm (pk 'prem': the Premiers). Three
  // at most from spins (1 Oct 2026, the owner's call; was two): with three in already, the rest are their normal selves.
  // Picks (js/picks.js) are on top: a buyer can use as many as they like
  const P = year === 2026 ? promoLive() : null, room = !!P && promoCount() < 3;
  for (const [name, clubStints, positions, rating] of RAW_PLAYERS) {
    for (const [club, yf, yt] of clubStints) {
      if (club === clubId && year >= yf && year <= yt) {
        const pm = room ? P.tier(name, true, club) : '';
        if (pm) result.push(Object.assign({name, positions, rating: pm === 'medal' ? 99 : Math.max(95, rating), club, yf, yt, pm}, promoKind(P, name)));
        else result.push({name, positions, rating:Math.max(67,rating), club, yf, yt});
        break;
      }
    }
  }
  return result.sort((a,b) => b.rating - a.rating);
}
// The promo for this game (js/cast-promo.js): Classic and Hard seasons dealt during one (the seed carries its mark, so a
// friend's challenge plays the same after it ends), and Packs opened while one runs. Never the Daily, the same for everyone.
function promoLive() {
  const P = typeof window !== 'undefined' ? window.CAST_PROMO : null;
  if (!P || !P.now || typeof STATE === 'undefined') return null;
  if (STATE.gameMode === 'pack') return P.now();
  if (window.CastDaily && CastDaily.isActive && CastDaily.isActive()) return null;
  return P.of(STATE.__seed);
}
function promoCount() { return STATE.team.filter(p => p && p.pm && p.pm !== 'imm').length; } // Immortals (js/picks.js) aren't the promo's
// What marks a promo player as the Premiers' (4 Oct 2026): pk 'prem', and pr for a premier (a medal winner from the
// losing side isn't one). The Dally M's carry neither
function promoKind(P, name) { return P && P.kind === 'prem' ? { pk: 'prem', pr: P.premier(name) ? 1 : 0 } : {}; }
// A promo player's words, marks and look: the Dally M navy, or a premier in his club's colours with the silver edge (the
// medal winner gold either way), a medal after a medal winner's name and a trophy after a premier's (css/theme.css)
// World Legends (World Cup 8-0, 8 Oct 2026): their own tag, look (pr-il, fp-il) and the fields they carry
function promoTag(p) { return p && p.ch ? (p.ch === 'potf' ? 'Player of the Final' : 'World Champions') : p && p.tw ? 'Team of the Week' : p && p.il ? 'World Legend' : p && p.wcp ? '88+ Pick' : !p || !p.pm || p.pm === 'imm' ? '' : p.pk === 'prem' ? (p.pm === 'medal' ? 'Clive Churchill Medal' : '2026 Premiers') : p.pm === 'medal' ? 'Dally M Medal' : 'Team of the Year'; }
function promoMark(p) { if (p && p.ch) { const c = (p.ch === 'potf' ? '&#x1F3C5;' : '') + (p.cht ? '&#x1F3C6;' : ''); return c ? '&nbsp;<span style="white-space:nowrap">' + c + '</span>' : ''; } if (!p || !p.pm || p.pm === 'imm') return ''; const m = (p.pm === 'medal' ? '&#x1F3C5;' : '') + (p.pk === 'prem' && p.pr ? '&#x1F3C6;' : ''); return m ? '&nbsp;' + m : ''; } // kept with the last word of the name
/* World Cup Team of the Week (15 Oct 2026, js/world-cup.js): p.tw is his boost this week, p.twId the week; World Cup blue.
   World Champions (15 Oct 2026, js/world-cup.js): p.ch 'champ' or 'potf' (the Player of the Final), p.cht his trophy;
   premium World Cup blue foil, a trophy after the name (the medal too for the Player of the Final) */
function promoCls(p, base) { return p && p.ch ? ' ' + base + '-wch' + (p.ch === 'potf' ? ' ' + base + '-wch-medal' : '') : p && p.tw ? ' ' + base + '-tw' : p && p.il ? ' ' + base + '-il' : !p || !p.pm || p.pm === 'imm' ? '' : ' ' + base + '-plat' + (p.pk === 'prem' ? ' ' + base + '-prem' : '') + (p.pm === 'medal' ? ' ' + base + '-medal' : ''); }
function promoVars(p) { return p && p.pk === 'prem' ? '--pc:' + (CLUB_COLORS[p.club] || '#1a1a2e') + ';--pc2:' + (CLUB_SECONDARY[p.club] || '#ffffff') + ';' : ''; }
function promoTrophy(p) { return p && p.pk === 'prem' ? 'prem26' : 'toty'; } // the limited trophy for finding one
// What a promo player carries into your 13 (a Pick's Immortal keeps pm 'imm')
function promoKeep(p) { return Object.assign(p && p.ch ? { ch: p.ch, cht: p.cht || 0 } : {}, p && p.tw ? { tw: p.tw, twId: p.twId || '' } : {}, p && p.il ? Object.assign({ il: 1 }, p.line ? { line: p.line } : {}) : p && p.pm ? Object.assign({ pm: p.pm }, p.pk ? { pk: p.pk, pr: p.pr || 0 } : {}) : {}, p && p.wcp ? { wcp: 1 } : {}, p && p.src ? { src: p.src } : {}); }
/* Where a pick came from, saved as the 4th part of its team-sheet entry (d.sq "club|year|rating|L") so every team sheet can
   mark it (11 Oct 2026, the owner: "differentiate between all the special cards"; js/cast-account.js PICK_SRC): L a World
   Legend Pick, F a free World Legend, 8 an 88+ Pick, I an Immortal Pick, T a Team of the Year Pick, P a Premiers Pick
   (js/picks.js sets src), t and p a Team of the Year or Premiers card from a spin; C a World Champions Pick, c a World
   Champion boosted from a spin (the server counts both against what the 13 was allowed, lib/wch.js) */
function pickSrc(p) { return !p ? '' : p.src || (p.ch ? 'c' : p.tw ? 'w' : p.il ? 'F' : p.wcp ? '8' : p.pm === 'imm' ? 'I' : p.pm ? (p.pk === 'prem' ? 'p' : 't') : ''); }
function sqOf(p, year) { var s = pickSrc(p); return [p.club || '', year != null ? year : p.year || '', p.rating || ''].concat(s ? [s] : []).join('|'); }

// ============================================================
// GAME STATE
// ============================================================
let STATE = {
  team: Array(13).fill(null),
  gameMode: 'classic',
  packs: [], packIdx: 0, packAllCards: [], packPlayers: [],
  takenNames: new Set(),
  currentSpin: null,
  pendingPlayer: null,
  season: null,
  spinPickedThisSpin: false,
  teamName: 'My Team',
};
function myTeam() { return STATE.teamName || 'My Team'; }
// The typed team name made safe inside page HTML (4 Oct 2026): templates use this; text, canvas and comparisons use myTeam()
function myTeamHtml() { return myTeam().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ============================================================
// HELPERS
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.setProperty('display', 'none', 'important');
  });
  const el = document.getElementById(id);
  el.classList.add('active');
  el.style.removeProperty('display');
  el.scrollTop = 0;
  window.scrollTo(0, 0);
  const footer = document.getElementById('siteFooter');
  if (footer) {
    footer.classList.toggle('footer-draft', id === 'draft');
    if (id === 'setup' || id === 'draft') {
      footer.style.removeProperty('display');
    } else {
      footer.style.setProperty('display', 'none', 'important');
    }
  }
}
function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function getWinProb(myR, oppR, finalsRound) {
  // finalsRound: 0=regular, 1=elim/qualifying, 2=semis/prelims, 3=grand final
  // Hard rule: below 78 cannot win a game
  if(myR < 78) return 0.01;
  if(oppR < 78) return 0.99;
  // Steeper curve (0.20) so rating gaps matter much more than before
  const p = 1/(1+Math.exp(-(myR-oppR)*0.20));
  // Caps and floors by stage
  const maxCaps=[0.84,0.78,0.73,0.62];
  const minFloors=[0.15,0.28,0.32,0.38];
  const r=finalsRound||0;
  return Math.min(maxCaps[r], Math.max(minFloors[r], p));
}
function calcTeamRating() {
  // Weights per slot: HB>FB>FE>HK>LK>P=SR=C>W
  // Slots: 0=FB,1=RW,2=LW,3=RC,4=LC,5=FE,6=HB,7=P1,8=HK,9=P2,10=SR1,11=SR2,12=LK
  const SLOT_W=[1.3,0.8,0.8,0.9,0.9,1.2,1.5,0.9,1.1,0.9,0.9,0.9,1.0];
  let total=0,wSum=0;
  STATE.team.forEach((p,i)=>{if(p!==null){const w=SLOT_W[i]||1.0;const r=p.name==='Jai Arrow'?95:p.rating;total+=r*w;wSum+=w;}});
  return wSum?Math.round(total/wSum):0;
}
function calcSubRatings() {
  const avg = (indices) => {
    const filled = indices.map(i=>STATE.team[i]).filter(p=>p!==null);
    if(!filled.length) return null;
    return Math.round(filled.reduce((a,p)=>a+p.rating,0)/filled.length);
  };
  return {
    backs:   avg([0,1,2,3,4,5,6]),   // FB, W, W, C, C, FE, HB
    forwards: avg([7,8,9,10,11,12]),  // P, HK, P, SR, SR, LK
    spine:   avg([0,5,6,8])           // FB, FE, HB, HK
  };
}
function slotsFilledCount() { return STATE.team.filter(p=>p!==null).length; }
function getEligibleSlotTypes(player) {
  const types = new Set();
  for(const pos of player.positions){
    (ELIGIBLE_SLOTS[pos]||[pos]).forEach(t=>types.add(t));
  }
  return [...types];
}
function isPlayerGreyed(player) {
  if(STATE.takenNames.has(player.name)) return true;
  const et = getEligibleSlotTypes(player);
  return et.every(type=>SLOTS.filter(s=>s.type===type).every(s=>STATE.team[s.i]!==null));
}
function getAvailableSlotsForPlayer(player) {
  const available=[];
  for(const pos of player.positions){
    for(const type of (ELIGIBLE_SLOTS[pos]||[pos])){
      for(const slot of SLOTS){
        if(slot.type===type && STATE.team[slot.i]===null && !available.find(s=>s.i===slot.i)){
          available.push(slot);
        }
      }
    }
  }
  return available;
}
function ordinal(n){const s=['th','st','nd','rd'],v=n%100;return s[(v-20)%10]||s[v]||s[0];}

// ============================================================
// SPIN
// ============================================================
function getSpinPool() {
  const from = (STATE&&STATE.yearFrom)||1998;
  const to = (STATE&&STATE.yearTo)||2026;
  const pool = [];
  for (const [cid, c] of Object.entries(CLUBS)) {
    const cfrom = Math.max(c.from, from);
    const cto = Math.min(c.to, to);
    for (let y = cfrom; y <= cto; y++) {
      pool.push({cid, year: y});
    }
  }
  return pool.length ? pool : [{cid:'broncos',year:2020}];
}

function doSpin() {
  if(STATE.season&&STATE.season.round===1&&STATE.season.wins===0&&STATE.season.losses===0){
    if(typeof gtag!=='undefined')gtag('event','game_started',{event_category:'game'});
  }
  const btn=document.getElementById('spinBtn');
  btn.disabled=true; btn.textContent='🎰 Spinning...';
  let n=0;
  const iv=setInterval(()=>{
    n++;
    flashRandom();
    if(n>=22){clearInterval(iv);finalSpin();btn.textContent='🎰 SPIN';} // btn stays disabled until player is selected
  },55);
}

function flashRandom() {
  const pool=getSpinPool();
  const pick=pool[rand(0,pool.length-1)];
  document.getElementById('spinClubVal').textContent=CLUBS[pick.cid].name;
  document.getElementById('spinYearVal').textContent=pick.year;
  _applyClubColor(pick.cid);
}


function finalSpin() {
  STATE.spinPickedThisSpin=false;
  const _spinBtn=document.getElementById('spinBtn');
  if(_spinBtn) _spinBtn.disabled=true;
    let cid,year,players=[];
  const pool=getSpinPool();
  let tries=0;
  do {
    const pick=pool[rand(0,pool.length-1)];
    cid=pick.cid; year=pick.year;
    if(CLUBS[cid].skip?.includes(year)){tries++;continue;}
    players=getSquadForClubYear(cid,year);
    tries++;
  } while(players.length<2 && tries<60);
  STATE.currentSpin={cid,year,players};
  displaySpin(cid,year,players);
}

function displaySpin(cid,year,players) {
  const c=CLUBS[cid];
  document.getElementById('spinClubVal').textContent=c.name;
  document.getElementById('spinYearVal').textContent=year;
  _applyClubColor(cid);
  const sec=document.getElementById('playerSection');
  if(!sec) return;
  sec.innerHTML='';
  if(STATE.spinPickedThisSpin){
    sec.innerHTML='<div class="spin-picked-msg"><div style="font-size:18px;margin-bottom:4px">✅</div><div style="font-size:13px;font-weight:800;color:#22c55e;letter-spacing:.3px;margin-bottom:2px">Player Added</div><div style="font-size:11px;color:var(--muted);font-weight:500">Spin again for your next pick</div></div>';
    return;
  }
  if(!players.length){
    sec.innerHTML='<p style="color:var(--muted);font-size:12px;text-align:center;padding:14px 0">No players found. Spin again.</p>';
    return;
  }
  // Shuffle display order when ratings are hidden
  let dispPlayers=players;
  if(!STATE.showRatings){
    dispPlayers=[...players];
    for(let i=dispPlayers.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[dispPlayers[i],dispPlayers[j]]=[dispPlayers[j],dispPlayers[i]];}
  }
  dispPlayers.forEach(p=>{
    const greyed=isPlayerGreyed(p);
    const taken=STATE.takenNames.has(p.name);
    const row=document.createElement('div');
    const isTribute=p.name==='Jai Arrow';
    row.className='player-row'+(isTribute?' pr-tribute':'')+promoCls(p,'pr')+(greyed?' pr-grey':'')+(taken?' pr-taken':'');
    if(p.pk==='prem') row.style.cssText+=promoVars(p);
    const era=p.yf===p.yt?p.yf:`${p.yf} to ${p.yt}`;
    const rBadge=STATE.showRatings?`<div class="pr-badge ${p.ch?'rb-wch':p.tw?'rb-tw':p.il?'rb-il':p.pm?'rb-plat':ratingClass(p.rating)}">${p.rating}${p.tw?`<small class="rb-twb">+${p.tw}</small>`:''}</div>`:`<div class="pr-badge" style="background:#2a2a3a;color:var(--muted);font-size:13px;display:flex;align-items:center;justify-content:center">?</div>`;
    const clubAbbr = CLUB_ABBR[p.club] || p.club.slice(0,3).toUpperCase();
    const clubPrimary = CLUB_COLORS[p.club] || '#1a1a2a';
    const clubSecondary = CLUB_SECONDARY[p.club] || '#ffffff';
    const clubTagHtml = `<span class="club-tag" style="background:${clubPrimary};color:${clubSecondary};border-color:${clubPrimary}">${clubAbbr}</span>`;
    const posHasSlot=pos=>(ELIGIBLE_SLOTS[pos]||[pos]).some(type=>SLOTS.some(s=>s.type===type&&STATE.team[s.i]===null));
    const posTagBtn=pos=>{const avail=!greyed&&!taken&&posHasSlot(pos);return`<span class="ptag ptag-${pos}${avail?' ptag-btn':' ptag-dim'}" data-pos="${pos}">${pos}</span>`;};
    row.innerHTML=`${rBadge}<div class="pr-info"><div class="pr-name">${p.name}${promoMark(p)}${p.pm||p.il||p.tw||p.ch?`<span class="pr-pm">${promoTag(p)}</span>`:''}</div><div class="pr-club">${CLUBS[p.club]?.name||p.club}${p.il?'':' · '+era}</div></div><div class="pr-right"><div class="pr-tags">${p.positions.map(posTagBtn).join('')}</div>${clubTagHtml}</div>`;
    // a World Legend's row wears his nation's look behind a dark wash, like his pitch tile (10 Oct 2026, the owner: more premium)
    if(p.il&&window.CastNations&&CastNations.has(p.club)) row.insertAdjacentHTML('afterbegin',`<span class="wc-look pr-il-look" aria-hidden="true">${CastNations.svg(p.club,360,64,2)}</span>`);
    if(!greyed&&!taken){
      // A row only works for the game it was drawn in (11 Oct 2026: a World Cup spin left on screen put Kalyn Ponga, NZL
      // 2026 at 91, into a new Classic 13)
      const st=STATE;
      row.onclick=()=>{if(STATE!==st)return;selectPlayer(p);};
      row.querySelectorAll('.ptag-btn').forEach(btn=>{
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          if(STATE!==st) return;
          const pos=btn.dataset.pos;
          const types=ELIGIBLE_SLOTS[pos]||[pos];
          for(const type of types){for(const slot of SLOTS){if(slot.type===type&&STATE.team[slot.i]===null){placePlayer(p,slot.i);return;}}}
        });
      });
    }
    sec.appendChild(row);
  });
  updateRerollBtn();
}
let _rerollImpTracked=false;
function updateRerollBtn(){
  const btn=document.getElementById('rerollBtn');
  const cnt=document.getElementById('rerollCount');
  if(!btn) return;
  const hasActiveSpin=STATE.currentSpin&&STATE.currentSpin.players&&STATE.currentSpin.players.length>0;
  btn.style.display='inline-flex';
  if(!_rerollImpTracked){_rerollImpTracked=true;if(typeof gtag!=='undefined')gtag('event','reroll_shown',{event_category:'draft'});}
  if(STATE.rerollUsed){
    btn.disabled=true;btn.style.opacity='0.35';btn.style.cursor='not-allowed';
    if(cnt) cnt.textContent='(used)';
  } else if(hasActiveSpin&&!STATE.spinPickedThisSpin){
    btn.disabled=false;btn.style.opacity='1';btn.style.cursor='pointer';
    if(cnt) cnt.textContent='(1 left)';
  } else {
    btn.disabled=true;btn.style.opacity='0.3';btn.style.cursor='not-allowed';
    if(cnt) cnt.textContent='(1 left)';
  }
}
function useReroll(){
  if(STATE.rerollUsed||STATE.spinPickedThisSpin) return;
  STATE.rerollUsed=true;
  STATE.__rrN=(STATE.__rrN||0)+1; // every reroll that happens (free, bonus or bought) counts toward the wildcards on the team sheet
  if(typeof gtag!=='undefined')gtag('event','reroll_used',{event_category:'draft',event_label:'reroll_button'});
  updateRerollBtn();
  // Flash "Reroll Activated" toast
  const toast=document.createElement('div');
  toast.textContent='🔄 Reroll Activated';
  toast.style.cssText='position:fixed;top:22px;left:50%;transform:translateX(-50%) translateY(-12px);background:#1a1a2e;border:2px solid var(--gold);color:var(--gold);font-size:18px;font-weight:900;padding:14px 32px;border-radius:24px;z-index:9999;letter-spacing:1px;transition:all .4s;opacity:0;pointer-events:none';
  document.body.appendChild(toast);
  requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translateX(-50%) translateY(0)';});
  setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translateX(-50%) translateY(-8px)';setTimeout(()=>toast.remove(),400);},1400);
  // Run same slot machine spin as doSpin
  const btn=document.getElementById('spinBtn');
  if(btn){btn.disabled=true;btn.textContent='🎰 Spinning...';}
  let n=0;
  const iv=setInterval(()=>{
    n++;
    flashRandom();
    if(n>=22){clearInterval(iv);finalSpin();if(btn)btn.textContent='🎰 SPIN';}
  },55);
}
// ============================================================
// PLAYER SELECTION
// ============================================================
function selectPlayer(player) {
  const avail=getAvailableSlotsForPlayer(player);
  if(!avail.length) return;
  if(player.positions.length<2){placePlayer(player,avail[0].i);return;}
  const POS_LABELS={FB:'Fullback',W:'Wing',C:'Centre',FE:'Five-Eighth',HB:'Halfback',SR:'Second Row',P:'Prop',HK:'Hooker',LK:'Lock'};
  const posWithSlots=player.positions.filter(pos=>avail.some(s=>(ELIGIBLE_SLOTS[pos]||[pos]).includes(s.type)));
  if(posWithSlots.length<2){placePlayer(player,avail[0].i);return;}
  STATE.pendingPlayer=player;
  document.getElementById('modalPlayerName').textContent=player.name;
  document.getElementById('modalPlayerInfo').textContent=STATE.showRatings?`Rating: ${player.rating} | Position: ${player.positions.join('/')}`:`Position: ${player.positions.join('/')}`;
  const opts=document.getElementById('posOptions');
  opts.innerHTML='';
  posWithSlots.forEach(pos=>{
    const types=ELIGIBLE_SLOTS[pos]||[pos];
    const slot=avail.find(s=>types.includes(s.type));
    if(!slot) return;
    const d=document.createElement('div');
    d.className='pos-option';
    d.innerHTML=`<span class="slot-label">${POS_LABELS[pos]||pos}</span><span class="slot-badge">${pos}</span>`;
    d.onclick=()=>{placePlayer(STATE.pendingPlayer,slot.i);closeModal();};
    opts.appendChild(d);
  });
  document.getElementById('posModal').classList.remove('hidden');
}

function closeModal(){document.getElementById('posModal').classList.add('hidden');STATE.pendingPlayer=null;}

function placePlayer(player,slotIdx) {
  STATE.spinPickedThisSpin=true;
  updateRerollBtn();
  // year: the season spun, so the leaderboard team sheet can show "Raiders 2007"
  STATE.team[slotIdx]={name:player.name,positions:player.positions,rating:player.rating,club:player.club,year:player.year||(STATE.currentSpin&&STATE.currentSpin.cid===player.club?STATE.currentSpin.year:undefined),...promoKeep(player)};
  // Promos: finding a Team of the Year player or a premier earns that promo's trophy, right away
  if(player.pm&&!STATE.__qd&&window.CastAccount&&CastAccount.unlock) CastAccount.unlock([promoTrophy(player)]);
  STATE.takenNames.add(player.name);
  renderField();
  const count=slotsFilledCount();
  if(count===13){
    if(typeof gtag!=='undefined')gtag('event','draft_completed',{event_category:'draft',squad_rating:calcTeamRating(),era_from:STATE.yearFrom,era_to:STATE.yearTo});
    // All slots filled: go straight to squad complete, don't re-enable spin
    setTimeout(()=>showSquadComplete(),350);
  } else {
    // Still slots to fill: refresh player list and re-enable spin button
    if(STATE.currentSpin) displaySpin(STATE.currentSpin.cid,STATE.currentSpin.year,STATE.currentSpin.players);
    const _sb2=document.getElementById('spinBtn');
    if(_sb2) _sb2.disabled=false;
  }
}

// Formation in six rows, matching 1000TRIES: FB / W C C W / FE HB / P HK P / SR SR / LK.
// {x, y} are the centre of each tile in % of the field (theme.css centres .fpos on that point).
const FIELD_POSITIONS={
  0: {x:50,   y:9,  a:'FB'},
  4: {x:13,   y:25, a:'W'},
  3: {x:37.7, y:25, a:'C'},
  2: {x:62.3, y:25, a:'C'},
  1: {x:87,   y:25, a:'W'},
  5: {x:37.7, y:41.5, a:'FE'},
  6: {x:62.3, y:41.5, a:'HB'},
  7: {x:25,   y:58, a:'P'},
  8: {x:50,   y:58, a:'HK'},
  9: {x:75,   y:58, a:'P'},
  10:{x:37.7, y:74.5, a:'SR'},
  11:{x:62.3, y:74.5, a:'SR'},
  12:{x:50,   y:91, a:'LK'},
};
// Position names shown inside the empty tiles (same words as 1000TRIES)
const FIELD_POS_NAME={FB:'Fullback',W:'Winger',C:'Centre',FE:'Five-eighth',HB:'Halfback',P:'Prop',HK:'Hooker',SR:'Second row',LK:'Lock'};
// Tile size for a field: four across the backs row, six rows down, never bigger than the field allows
function fieldTileSize(wrap){
  const rect=wrap.getBoundingClientRect();
  const W=rect.width||360,H=rect.height||320;
  const w=Math.max(54,Math.min(118,W*0.235-2));
  const h=Math.max(40,Math.min(88,H*0.165-5,w*0.84));
  return {w:Math.round(w),h:Math.round(h)};
}
// A player's surname for the field and score lines (7 Oct 2026, the owner: Jack de Belin showed as "Belin"): a particle
// stays with it ("De Belin", "Da Silva", "Le Blanc", "El Masri", "Te Maari", "Ah Mau", "Yow Yeh"), and so does Junior. Kept in
// this file: the server's Quick Draft runs it without js/game-core.js
// The surname on the pitch tiles (10 Oct 2026, the owner): a club tag in brackets and a nickname in quotes go, and the
// names whose first or last name is two words are spelt out (1000TRIES' T.surname has the same list)
const SURNAME_OF = {
  'Sonny Bill Williams': 'Williams', 'Te Maire Martin': 'Martin', "De La Salle Va'a": "Va'a", 'Kalifa Faifai Loa': 'Faifai Loa',
  'Junior Tia Kilifi': 'Tia Kilifi', 'Raymond Tuaimalo Vaega': 'Tuaimalo Vaega', 'Gordon Chan Kum Tong': 'Chan Kum Tong',
  'Loko Jnr Pasifiki Tonga': 'Pasifiki Tonga', 'Tuku Hau Tapuha': 'Hau Tapuha', 'Tevita Pangai Junior': 'Pangai Junior'
};
function cardSurname(n) {
  n = String(n || '').replace(/\s*\([^)]*\)\s*$/, '').replace(/[\u201C"][^\u201D"]*[\u201D"]\s*/g, '').trim();
  if (SURNAME_OF[n]) return SURNAME_OF[n];
  var w = n.split(/\s+/), i = w.length - 1;
  if (i < 1) return w[0] || '';
  if (i > 1 && /^(jr|jnr|junior|snr|sr)\.?$/i.test(w[i])) i--;
  while (i > 1 && /^(de|da|di|du|del|le|la|van|von|el|te|ter|ah|yow)$/i.test(w[i - 1])) i--;
  return w.slice(i).join(' ');
}
// Text sizes inside a filled tile, from the tile height
function fieldTileMetrics(t){
  return {
    nameSize: Math.max(9, Math.min(14, t.h*0.25)),
    nameMaxW: t.w-10,
    nameMaxH: t.h*0.36,
    rtgSize: Math.max(10, Math.min(16, t.h*0.26)),
    clubSize: Math.max(7, Math.min(9, t.h*0.17))
  };
}
// Inside of one tile: empty = code + position name; filled = small code, surname, then club + rating
function fieldTileInner(slotType, code, p, tm){
  if(!p) return `<span class="fpos-abbr">${code}</span><span class="fpos-full">${FIELD_POS_NAME[slotType]||''}</span>`;
  const club=`<span class="fpos-club" style="background:${CLUB_COLORS[p.club]||'#1a1a2a'};color:${CLUB_SECONDARY[p.club]||'#fff'};font-size:${tm.clubSize}px">${CLUB_ABBR[p.club]||p.club.slice(0,3).toUpperCase()}</span>`;
  return `<span class="fpos-code">${code}</span><div class="fpos-pname" style="font-size:${tm.nameSize}px;max-width:${tm.nameMaxW}px;max-height:${tm.nameMaxH}px">${cardSurname(p.name)}</div><div class="fpos-meta">${club}<div class="fpos-prtg" style="font-size:${tm.rtgSize}px">${p.rating}</div></div>`;
}
function ratingClass(r){if(r>=90)return'rb-gold';if(r>=85)return'rb-grn';if(r>=80)return'rb-blu';if(r>=75)return'rb-teal';return'rb-gray';}
function fieldTierClass(r){if(r>=90)return'fp-gold';if(r>=85)return'fp-lime';if(r>=80)return'fp-blue';if(r>=75)return'fp-silver';return'fp-bronze';}
function ratingColor(r){if(r>=90)return'#E8A848';if(r>=85)return'#a3e635';if(r>=80)return'#3b82f6';if(r>=75)return'#9ca3af';return'#cd7f32';}
function ratingBg(r){if(r>=90)return'linear-gradient(135deg,#c8882a,#E8A848)';if(r>=85)return'linear-gradient(135deg,#65a30d,#a3e635)';if(r>=80)return'linear-gradient(135deg,#1d4ed8,#3b82f6)';if(r>=75)return'linear-gradient(135deg,#6b7280,#9ca3af)';return'linear-gradient(135deg,#92400e,#cd7f32)';}
function posTagHtml(pos){return`<span class="ptag ptag-${pos}">${pos}</span>`;}

function computeFieldCircleSize(wrap){
  const rect=wrap.getBoundingClientRect();
  const w=rect.width,h=rect.height;
  if(!w||!h) return 58;
  const pts=Object.values(FIELD_POSITIONS).map(p=>({x:p.x/100*w,y:p.y/100*h}));
  let minDist=Infinity;
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<minDist) minDist=d;
    }
  }
  // Keep circles from touching neighbours regardless of how cramped the container gets
  return Math.max(34,Math.min(108,minDist*0.8));
}
function fieldTextMetrics(fSize){
  // Derive name/rating/club text sizing proportionally from the actual circle size,
  // so text always matches whatever space computeFieldCircleSize decided was safe.
  return {
    nameSize: Math.max(6, Math.min(12, fSize*0.135)),
    nameMaxW: fSize*0.86,
    nameMaxH: fSize*0.30,
    rtgSize: Math.max(12, Math.min(19, fSize*0.22)),
    clubSize: Math.max(5.5, Math.min(7.5, fSize*0.09))
  };
}
// Long names shrink to fit their tile: every name is sized in the same rounds (a binary search, about 6 layouts in all),
// not a forced layout per 0.25px step (hundreds per pick on a phone). 1px slack: scrollHeight rounds up while offsetHeight
// rounds, so a name that fits can read 1px over (without it every name came out smaller)
function scaleFieldNames(wrap){
  const els=Array.prototype.slice.call(wrap.querySelectorAll('.fpos-pname'));
  els.forEach(function(el){el.style.overflow='hidden';el.style.whiteSpace=el.textContent.includes('-')?'normal':'nowrap';});
  const over=function(el){return el.scrollWidth>el.offsetWidth+1||el.scrollHeight>el.offsetHeight+1;};
  const st=els.map(function(el){return{el:el,hi:parseFloat(el.style.fontSize)||8,lo:4};}).filter(function(x){return x.hi>4&&over(x.el);});
  while(st.some(function(x){return x.hi-x.lo>0.25;})){
    st.forEach(function(x){x.mid=x.hi-x.lo>0.25?Math.round((x.lo+x.hi)*2)/4:x.lo;x.el.style.fontSize=x.mid+'px';});
    st.forEach(function(x){if(x.mid===x.lo)return;if(over(x.el))x.hi=x.mid;else x.lo=x.mid;});
  }
  st.forEach(function(x){x.el.style.fontSize=x.lo+'px';});
}
function updateDraftStrengthBar(){
  const r=calcTeamRating();
  const sub=calcSubRatings();
  const fill=document.getElementById('dsbFill');
  const val=document.getElementById('dsbVal');
  const backs=document.getElementById('dsbBacks');
  const fwds=document.getElementById('dsbFwds');
  const spine=document.getElementById('dsbSpine');
  if(!fill||!val) return;
  const pct=Math.max(0,Math.min(100,((r-60)/40)*100));
  fill.style.width=r?pct+'%':'0%';
  fill.style.background=r?ratingColor(r):'#333';
  val.textContent=r||'-';
  val.style.color=r?ratingColor(r):'var(--muted)';
  const setS=(el,v)=>{if(!el)return;el.textContent=v??'-';el.style.color=v?ratingColor(v):'var(--muted)';};
  setS(backs,sub.backs);setS(fwds,sub.forwards);setS(spine,sub.spine);
}
function renderField(){
  const wrap=document.getElementById('nrlField');
  if(!wrap) return;
  if(_cachedFieldSize===null) _cachedFieldSize=fieldTileSize(wrap);
  const t=_cachedFieldSize;
  const tm=fieldTileMetrics(t);
  let h='<div class="nrl-field-inner">';
  Object.entries(FIELD_POSITIONS).forEach(([idx,pos])=>{
    const i=parseInt(idx);
    const p=STATE.team[i];
    const isTributePlayer=p&&p.name==='Jai Arrow';
    h+=`<div class="fpos" data-slot="${i}" style="left:${pos.x}%;top:${pos.y}%;width:${t.w}px !important">`;
    h+=`<div class="fpos-circle${p?' fp-filled '+(isTributePlayer?'fp-tribute':p.pm==='imm'?'fp-imm':p.pm||p.tw||p.ch?promoCls(p,'fp').trim():fieldTierClass(p.rating)):''}" style="width:${t.w}px !important;height:${t.h}px !important;${promoVars(p)}">`;
    h+=fieldTileInner(SLOTS[i].type,pos.a,p,tm);
    h+=`</div><div class="fpos-label">${SLOTS[i].label}</div></div>`;
  });
  const filled=slotsFilledCount();

  h+='</div>';
  wrap.innerHTML=h;
  scaleFieldNames(wrap);
  updateDraftStrengthBar();
  const pb=document.getElementById('draftProgressBar');
  const pd=document.getElementById('draftPicksDone');
  if(pb){pb.style.width=Math.round((filled/13)*100)+'%';}
  if(pd){pd.textContent=filled;}
}
function renderLineup(){renderField();}

function removePlayer(idx){/* players locked once placed */}

// ============================================================
// SETUP → DRAFT
// ============================================================
// ============================================================
// ERA & RATINGS SETUP CONTROLS
// ============================================================
function setRatings(val) {
  const tog=document.getElementById('ratingsToggle');
  if(tog) tog.dataset.val=val;
  const pill=document.getElementById('ratPill');
  const lblOn=document.getElementById('ratLabelOn');
  const lblOff=document.getElementById('ratLabelOff');
  const sub=document.getElementById('ratSubtext');
  if(!pill) return;
  if(val==='on'){
    pill.classList.add('on');
    if(lblOn){lblOn.classList.add('active');lblOn.style.color='var(--gold)';}
    if(lblOff){lblOff.classList.remove('active');lblOff.style.color='';}
    if(sub) sub.innerHTML='<span style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;color:var(--gold);letter-spacing:0.5px">Player ratings visible</span>';
  } else {
    pill.classList.remove('on');
    if(lblOff){lblOff.classList.add('active');lblOff.style.color='var(--gold)';}
    if(lblOn){lblOn.classList.remove('active');lblOn.style.color='';}
    if(sub) sub.innerHTML='<span style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;color:var(--muted);letter-spacing:0.5px">Player ratings hidden</span>';
  }
}

function setEraPreset(from) {
  const fe=document.getElementById('eraSliderFrom');
  const te=document.getElementById('eraSliderTo');
  if(fe) fe.value=from;
  if(te) te.value=2026;
  _updateSliderZIndex(from,2026);
  updateEraUI(from,2026);
}

function getEraPlayerCount(from, to) {
  return RAW_PLAYERS.filter(([,stints])=>stints.some(([,sf,st])=>st>=from&&sf<=to)).length;
}

function updateEraUI(from, to) {
  // Preset buttons: highlight only when matching a preset (to===2026 and from matches)
  const presets=[
    {id:'eraAll',from:1998},
    {id:'era2000',from:2000},
    {id:'era2010',from:2010},
    {id:'era2020',from:2020}
  ];
  presets.forEach(p=>{
    const el=document.getElementById(p.id);
    if(!el) return;
    const active=p.from===from&&to===2026;
    el.style.background=active?'rgba(245,197,24,0.15)':'var(--card2)';
    el.style.borderColor=active?'var(--gold)':'#333';
    el.style.color=active?'var(--gold)':'var(--text)';
  });
  // Year labels
  const fl=document.getElementById('eraFromLbl');
  const tl=document.getElementById('eraToLbl');
  const cl=document.getElementById('eraCountLbl');
  if(fl) fl.textContent=String(from);
  if(tl) tl.textContent=String(to);
  // Track fill
  const fill=document.getElementById('eraFill');
  if(fill){
    const range=2026-1998;
    const lp=((from-1998)/range*100).toFixed(1);
    const rp=((to-1998)/range*100).toFixed(1);
    fill.style.left=lp+'%';
    fill.style.width=(rp-lp)+'%';
  }
  if(cl){
    const sel=getEraPlayerCount(from,to);
    const cn=document.getElementById('eraCountNum');if(cn)cn.textContent=sel;
  }
}

function _updateSliderZIndex(from,to){
  const fromEl=document.getElementById('eraSliderFrom');
  const toEl=document.getElementById('eraSliderTo');
  if(!fromEl||!toEl) return;
  // Handles at max (2026): bring FROM to front so user can drag it left
  // Handles at min (1998): bring TO to front so user can drag it right
  // Handles overlapping elsewhere: same logic: FROM on top
  if(from<=1998&&to<=1998){
    fromEl.style.zIndex=2;toEl.style.zIndex=4;
  } else if(from>=to){
    fromEl.style.zIndex=4;toEl.style.zIndex=3;
  } else {
    fromEl.style.zIndex=2;toEl.style.zIndex=3;
  }
}

function onEraSlider(which) {
  const fromEl=document.getElementById('eraSliderFrom');
  const toEl=document.getElementById('eraSliderTo');
  let from=parseInt(fromEl.value);
  let to=parseInt(toEl.value);
  // Prevent handles crossing
  if(from>to){
    if(which==='from'){fromEl.value=to;from=to;}
    else{toEl.value=from;to=from;}
  }
  _updateSliderZIndex(from,to);
  updateEraUI(from,to);
}

// Initialise on page load
setTimeout(()=>{setEraPreset(1998);setRatings('on');},0);

function startGame() {
  const _tni=document.getElementById('teamNameInput');
  const _tName=(_tni?.value?.trim()||'My Team').substring(0,40);
  if(_tName&&_tName!=='My Team') try{localStorage.setItem('27_teamName',_tName);}catch(e){}
  const _yFrom=parseInt(document.getElementById('eraSliderFrom')?.value)||1998;
  const _yTo=parseInt(document.getElementById('eraSliderTo')?.value)||2026;
  const _showR=(document.getElementById('ratingsToggle')?.dataset.val||'on')!=='off';
  STATE={team:Array(13).fill(null),takenNames:new Set(),currentSpin:null,pendingPlayer:null,season:null,spinPickedThisSpin:false,teamName:_tName,yearFrom:_yFrom,yearTo:_yTo,showRatings:_showR,rerollUsed:false,gameMode:'classic',packs:[],packIdx:0,packAllCards:[],packPlayers:[]};
  if(typeof gtag!=='undefined')gtag('event','era_selected',{event_category:'setup',era_from:_yFrom,era_to:_yTo,era_range:(_yTo-_yFrom)});
  _rerollImpTracked=false;
  // A new game starts with no players on offer: the last game's list (a World Cup nation's squad, say) goes
  const _ps=document.getElementById('playerSection'); if(_ps) _ps.innerHTML='';
  renderLineup();
  document.getElementById('spinClubVal').textContent='-';
  document.getElementById('spinYearVal').textContent='-';
  _resetClubColor();
  _cachedFieldSize = null; showScreen('draft');
  requestAnimationFrame(function(){ _cachedFieldSize = null; renderField(); });
  updateRerollBtn();
}

// ============================================================
// SQUAD COMPLETE
// ============================================================
function showSquadComplete() {
  const c=document.getElementById('lineupDisplay');
  c.innerHTML='';
  SLOTS.forEach(slot=>{
    const p=STATE.team[slot.i];
    const d=document.createElement('div');
    d.className='lineup-slot'+(p&&p.name==='Jai Arrow'?' ls-tribute':'');
    const lsClubPrimary = p ? (CLUB_COLORS[p.club]||'#1a1a2a') : null;
    const lsClubSecondary = p ? (CLUB_SECONDARY[p.club]||'#fff') : null;
    const lsClubAbbr = p ? (CLUB_ABBR[p.club]||p.club.slice(0,3).toUpperCase()) : null;
    const lsClubTag = p ? `<span class="ls-club-tag" style="background:${lsClubPrimary};color:${lsClubSecondary}">${lsClubAbbr}</span>` : '';
    const lsRatingColor = p ? ratingColor(p.rating) : 'var(--gold)';
    d.innerHTML=`<span class="ls-abbr">${displayAbbr(slot.abbr)}</span><div class="ls-info"><div class="ls-name">${p?p.name:'-'}</div><div class="ls-sub">${slot.label}</div></div>${lsClubTag}${p?`<span class="ls-rating" style="background:${ratingBg(p.rating)}">${p.rating}</span>`:'<span class="ls-rating" style="background:transparent"></span>'}`;
    c.appendChild(d);
  });
  const r=calcTeamRating();
  document.getElementById('strengthFill').style.width=r+'%';
  document.getElementById('strengthVal').textContent=r;
  document.getElementById('strengthVal').style.color=ratingColor(r);
  const sub=calcSubRatings();
  const backsEl=document.getElementById('srBacks');
  const fwdEl=document.getElementById('srForwards');
  const spineEl=document.getElementById('srSpine');
  backsEl.textContent=sub.backs??'-';
  fwdEl.textContent=sub.forwards??'-';
  spineEl.textContent=sub.spine??'-';
  if(sub.backs)backsEl.style.color=ratingColor(sub.backs);
  if(sub.forwards)fwdEl.style.color=ratingColor(sub.forwards);
  if(sub.spine)spineEl.style.color=ratingColor(sub.spine);
  const odds=calcPreseasonOdds(r);
  document.getElementById('oddsFinish').textContent=(r>=93?'1':odds.projFinish)+ordinal(r>=93?1:odds.projFinish);
  // Cosmetic display adjustments: formula values unchanged
  // Cosmetic display only: game logic/formula untouched. Floor scales with rating so user always sees hope.
  const _t4floor=Math.max(10,Math.round((r-68)*1.8));
  const _t4raw=Math.round(odds.top4Pct*0.82);
  const _dispTop4=Math.min(Math.max(_t4raw,_t4floor),85);
  const _finFloor=Math.max(_dispTop4+8,Math.round((r-60)*2.2));
  const _dispFinals=Math.min(Math.max(Math.round(odds.finalsPct*0.88),_finFloor),94);
  document.getElementById('oddsFinals').textContent=_dispFinals+'%';
  document.getElementById('oddsTop4').textContent=_dispTop4+'%';
  showScreen('squad-complete');
}

// (500 simulated seasons: display only, so each rating's odds are kept once worked out, not re-simulated every draft)
const _oddsCache={};
function calcPreseasonOdds(rating) {
  const key=rating+'|'+NRL_OPPONENTS.map(o=>o.strength).join(',');
  if(_oddsCache[key]) return _oddsCache[key];
  return (_oddsCache[key]=calcPreseasonOddsNow(rating));
}
function calcPreseasonOddsNow(rating) {
  const SIMS=500;
  let wins=0,top4s=0,finals=0,posTotal=0,undefs=0;
  for(let i=0;i<SIMS;i++){
    const{pos,isChampion,isUndefeated}=simSeasonOnce(rating);
    if(isChampion)wins++;
    if(pos<=4)top4s++;
    if(pos<=8)finals++;
    posTotal+=pos;
    if(isUndefeated)undefs++;
  }
  const winPct=Math.round(wins/SIMS*100);
  const undefeatedPct=Math.round(undefs/SIMS*100);
  return{winPct,top4Pct:Math.round(top4s/SIMS*100),finalsPct:Math.round(finals/SIMS*100),projFinish:Math.round(posTotal/SIMS),undefeatedPct};
}

function simSeasonOnce(myRating) {
  const teams=NRL_OPPONENTS.map(o=>({name:o.name,strength:o.strength,wins:0}));
  teams.push({name:myTeam(),strength:myRating,wins:0});
  let myW=0,myLoss=0;
  for(const team of teams){
    let w=0;
    for(let g=0;g<24;g++){
      const opp=teams[rand(0,teams.length-2)];
      if(opp.name===team.name){const coin=Math.random()<0.5;if(coin)w++;if(team.name===myTeam()){if(coin)myW++;else myLoss++;}continue;}
      const won=Math.random()<getWinProb(team.strength,opp.strength);
      if(won)w++;
      if(team.name===myTeam()){if(won)myW++;else myLoss++;}
    }
    team.wins=w;
  }
  teams.sort((a,b)=>b.wins-a.wins);
  let myPos=teams.findIndex(t=>t.name===myTeam())+1;
  if(myRating<=88&&myPos<=4)myPos=5;
  // Simulate NRL finals: top-4 path = QF(rd1)+bye+PF(rd3)+GF(rd4) = 3 games; 5-8 = forced loss in PF
  let isChampion=false,finalsLoss=false;
  if(myPos<=4&&myRating>=89){
    const forced=myRating>=93;
    const r1=forced||Math.random()<getWinProb(myRating,86,1);
    if(!r1)finalsLoss=true;
    const r3=r1&&(forced||Math.random()<getWinProb(myRating,87,3));
    if(r1&&!r3)finalsLoss=true;
    const r4=r3&&(forced||Math.random()<getWinProb(myRating,88,4));
    if(r3&&!r4)finalsLoss=true;
    isChampion=!!r4;
  }
  const isUndefeated=myLoss===0&&!finalsLoss&&isChampion;
  return{pos:myPos,wins:myW,isChampion,isUndefeated};
}

// ============================================================
// SEASON
// ============================================================
function buildSchedule(rating) {
  const byeRounds=new Set([9,18,24]);
  const schedule=[];
  let pool=[];
  while(pool.length<24) pool=[...pool,...[...NRL_OPPONENTS].sort(()=>Math.random()-0.5)];
  pool=pool.slice(0,24);
  let gi=0;
  for(let round=1;round<=27;round++){
    if(byeRounds.has(round)){schedule.push({round,bye:true});}
    else{
      const opp=pool[gi++];
      schedule.push({round,bye:false,opp:opp.name,oppStrength:opp.strength,winProb:getWinProb(rating,opp.strength),result:null});
    }
  }
  return schedule;
}

function startSeason() {
  const rating=calcTeamRating();
  STATE.season={
    schedule:buildSchedule(rating),
    wins:0,losses:0,pf:0,pa:0,tries:0,
    streak:0,streakType:null,
    playerTries:Array(13).fill(0),
    playerAssists:Array(13).fill(0),
    done:false,rating,
  };
  // Reset Next Game button: may retain state from a previous game session
  const ngb=document.getElementById('nextGameBtn');
  if(ngb){ngb.textContent='▶ Next Game';ngb.onclick=playNextGame;}
  const apb=document.getElementById('autoPlayBtn');
  if(apb) apb.textContent='⚡ Auto Play';
  document.getElementById('seasonTeamLabel').textContent=`Team Rating: ${rating}`;
  renderFixtureList();
  updateSeasonSidebar();
  if(typeof gtag!=='undefined')gtag('event','season_started',{event_category:'game',play_mode:'manual',squad_rating:rating});
  showScreen('season');
}

function renderFixtureList() {
  const list=document.getElementById('fixtureList');
  list.innerHTML='';
  STATE.season.schedule.forEach((game,idx)=>list.appendChild(fixtureRow(game,idx)));
}
// One row of the fixture list (Next Game swaps in just the row it played, not all 27)
function updateFixtureRow(idx){
  const old=document.getElementById(`gr-${idx}`);
  if(old) old.replaceWith(fixtureRow(STATE.season.schedule[idx],idx)); else renderFixtureList();
}
function fixtureRow(game,idx){
    const row=document.createElement('div');
    row.id=`gr-${idx}`;
    const rndbadge=`<div class="game-rnd-badge"><div class="game-rnd-num">${game.round}</div><div class="game-rnd-lbl">RND</div></div>`;
    if(game.bye){
      row.className='game-row bye';
      row.innerHTML=`${rndbadge}<div class="game-club-badge" style="background:transparent"></div><div class="game-opp"><div class="game-opp-name" style="color:var(--muted)">BYE</div></div><div class="game-score"></div><span class="game-result-badge badge-bye">BYE</span>`;
    } else {
      const clubId=OPPONENT_CLUB_MAP[game.opp]||'';
      const bg=CLUB_COLORS[clubId]||'#1a1a2a';
      const fg=CLUB_SECONDARY[clubId]||'#ffffff';
      const abbr=CLUB_ABBR[clubId]||(game.opp.slice(0,3).toUpperCase());
      const badge=`<div class="game-club-badge" style="background:${bg};color:${fg}">${abbr}</div>`;
      const _sn=FIXTURE_SHORT_NAME[game.opp]||game.opp;
      if(game.result){
        const won=game.result.won;
        // Run It Back (js/theme-fx.js): the loss it turned into a win is lit
        row.className=`game-row ${won?'win':'loss'}${game.ribFlip?' rib-flip':''}`;
        row.innerHTML=`${rndbadge}${badge}<div class="game-opp"><div class="game-opp-name">${_sn}</div>${game.ribFlip?'<span class="rib-flip-tag">Turned Around</span>':''}</div><div class="game-score ${won?'win':'loss'}">${game.result.score}</div><span class="game-result-badge ${won?'badge-win':'badge-loss'}">${won?'W':'L'}</span>`;
      } else {
        row.className='game-row pending';
        row.innerHTML=`${rndbadge}${badge}<div class="game-opp"><div class="game-opp-name">${_sn}</div></div><div class="game-score"></div><span class="game-result-badge" style="background:transparent"></span>`;
      }
    }
    return row;
}

function playNextGame() {
  const s=STATE.season;
  if(!s||s.done) return;
  let nextIdx=-1;
  for(let i=0;i<s.schedule.length;i++){if(!s.schedule[i].bye&&!s.schedule[i].result){nextIdx=i;break;}}
  if(nextIdx===-1){finishRegularSeason();return;}
  resolveGame(nextIdx);
  updateFixtureRow(nextIdx);
  updateSeasonSidebar();
  // Bring the just-played row into view inside the fixture list, only when it is out of view (a jump during Auto Play)
  const _gr=document.getElementById(`gr-${nextIdx}`),_fl=document.getElementById('fixtureList');
  if(_gr&&_fl){
    const _top=_gr.offsetTop-_fl.offsetTop;
    if(_top<_fl.scrollTop||_top+_gr.clientHeight>_fl.scrollTop+_fl.clientHeight)
      _fl.scrollTo({top:_top-(_fl.clientHeight/2-_gr.clientHeight/2),behavior:_autoTimer?'auto':'smooth'});
  }
  if(!s.schedule.some(g=>!g.bye&&!g.result)){
    document.getElementById('nextGameBtn').textContent='🏆 View Finals';
    document.getElementById('nextGameBtn').onclick=finishRegularSeason;
  }
}

function resolveGame(idx) {
  const s=STATE.season;
  const game=s.schedule[idx];
  if(game.bye||game.result) return;
  // Seasons played before 26 Sep 2026 keep their results
  const minWins=s.rating>=93?22:s.rating>=92?21:s.rating>=91?20:0;
  const gamesLeft=s.schedule.filter(g=>!g.bye&&!g.result).length;
  const mustWin=minWins>0&&(s.wins+gamesLeft-1)<minWins;
  // Streak momentum
  let adjProb=game.winProb;
  if(s.streak>=5&&s.streakType==='W') adjProb=Math.min(0.92,adjProb+0.02);
  if(s.streak>=5&&s.streakType==='L') adjProb=Math.max(0.05,adjProb-0.02);

  // A ceiling by rating
  if(s.rating<91){
    const ceil=s.rating>=90?0.82:s.rating>=89?0.74:s.rating>=88?0.66:s.rating>=86?0.62:0.56;
    adjProb=Math.min(adjProb,ceil);
  } else if(s.rating<92){
    adjProb=Math.min(adjProb,0.86);
  }
  // A late-season fade
  if(s.rating>=91&&s.rating<93){
    const from=s.rating<92?21:22;
    if(s.wins>from) adjProb=Math.max(0.35,adjProb-(s.wins-from)*(s.rating<92?0.06:0.04));
  }

  // Progressive decay
  if(s.rating<=90){
    const thresh=s.rating<=88?12:s.rating===89?16:18;
    if(s.wins>thresh){
      const over=s.wins-thresh;
      adjProb=Math.max(0.10,adjProb-over*0.09);
    }
  }

  const won=(mustWin||s.rating>=93)?true:Math.random()<adjProb;
  let myTries=won?rand(3,7):rand(1,4);
  let oppTries=won?rand(1,4):rand(3,6);
  // The winner always scores more (1 Oct 2026: the two draws could come out the wrong way round, "L 24-18")
  if(won?myTries<oppTries:myTries>oppTries){const t=myTries;myTries=oppTries;oppTries=t;}
  // No draws: if tries are equal, nudge opponent by 1 in the correct direction
  if(myTries===oppTries) oppTries=won?Math.max(0,oppTries-1):oppTries+1;
  const scorerNames=assignTryScorers(myTries);
  assignAssists(myTries);
  const mk=myKickLevel(),ok=clubKickLevel(game.opp);
  const k=won?goalsFor(myTries,oppTries,mk,ok):goalsFor(oppTries,myTries,ok,mk);
  const my=won?k.ws:k.ls,opp=won?k.ls:k.ws;
  s.tries+=myTries; s.pf+=my; s.pa+=opp;
  if(won){s.wins++;s.streak=(s.streakType==='W'?s.streak+1:1);s.streakType='W';}
  else{s.losses++;s.streak=(s.streakType==='L'?s.streak+1:1);s.streakType='L';}
  game.result={won,score:`${my}-${opp}`,scorers:scorerNames.length?'Tries: '+scorerNames.join(', '):'',myTries,oppTries,my,opp,
    myConv:won?k.wc:k.lc,oppConv:won?k.lc:k.wc,myPens:won?k.wp:k.lp,oppPens:won?k.lp:k.wp,myFg:won?k.wf:0,oppFg:won?0:k.wf};
}

const TRY_WEIGHTS={FB:8,W:15,C:11,FE:7,HB:5,P:3,HK:4,SR:6,LK:4};
/* Goals (7 Oct 2026, the owner: real scoring like World Cup 8-0): a try is 4 and its conversion 2 when the side's goal
   kicker lands it (GOAL_RATE by level: off the list, top, good; the level from career goals in GOAL_KICKER_RANK), now and
   then a penalty goal (2). Drawn after the result and the tries, which stay exactly as before. The winner always finishes
   ahead: while it's behind, a missed conversion of its turns into a kicked one (all of them kicked beat the loser's best,
   as it has at least one try more). Level after that, its field goal (1) wins it; 6 ahead, it sometimes kicks one to go
   7 up. Returns each side's conversions, penalty goals, field goal and points */
const GOAL_RATE=[0.62,0.8,0.72],PEN1=0.35,PEN2=0.08,FG6=0.4;
function kickLevelOf(name){const g=GOAL_KICKER_RANK[name]||0;return g>=400?1:g>=100?2:0;}
// The season's kicker for the player's 13 (the most career goals, js: fvFindMyConv), kept on the season
function myKickLevel(){
  const s=STATE.season;
  if(s&&s.kickLvl!=null) return s.kickLvl;
  const n=fvFindMyConv(),l=GOAL_KICKER_RANK[n]?kickLevelOf(n):0;
  if(s){s.kicker=n;s.kickLvl=l;}
  return l;
}
function clubKickLevel(club){const r=FV_ROSTERS[club];return r&&r.conv?kickLevelOf(r.conv):2;}
function goalsFor(wT,lT,wk,lk){
  const kicked=(n,p)=>{let k=0;for(let i=0;i<n;i++)if(Math.random()<p)k++;return k;};
  const pens=()=>{const x=Math.random();return x<PEN2?2:x<PEN1?1:0;};
  let wc=kicked(wT,GOAL_RATE[wk]||GOAL_RATE[0]);
  const lc=kicked(lT,GOAL_RATE[lk]||GOAL_RATE[0]),wp=pens(),lp=pens(),six=Math.random()<FG6;
  const pts=(t,c,p)=>t*4+c*2+p*2;
  while(pts(wT,wc,wp)<pts(lT,lc,lp)&&wc<wT) wc++;
  const gap=pts(wT,wc,wp)-pts(lT,lc,lp),wf=gap===0||(gap===6&&six)?1:0;
  return{wc,lc,wp,lp,wf,ws:pts(wT,wc,wp)+wf,ls:pts(lT,lc,lp)};
}
function assignTryScorers(count) {
  const names=[];
  const slots=SLOTS.filter(s=>STATE.team[s.i]!==null);
  if(!slots.length) return names;
  for(let i=0;i<count;i++){
    const ws=slots.map(s=>TRY_WEIGHTS[s.type]||4);
    const tot=ws.reduce((a,b)=>a+b,0);
    let r=Math.random()*tot,chosen=slots[slots.length-1];
    for(let j=0;j<slots.length;j++){r-=ws[j];if(r<=0){chosen=slots[j];break;}}
    STATE.season.playerTries[chosen.i]++;
    names.push(cardSurname(STATE.team[chosen.i].name));
  }
  return names;
}
const ASSIST_WEIGHTS={FB:12,W:5,C:7,FE:16,HB:18,HK:10,P:2,SR:6,LK:4};
function assignAssists(count) {
  const aSlots=SLOTS.filter(s=>STATE.team[s.i]!==null);
  if(!aSlots.length) return;
  for(let i=0;i<count;i++){
    const ws=aSlots.map(s=>ASSIST_WEIGHTS[s.type]||3);
    const tot=ws.reduce((a,b)=>a+b,0);
    let r=Math.random()*tot,chosen=aSlots[aSlots.length-1];
    for(let j=0;j<aSlots.length;j++){r-=ws[j];if(r<=0){chosen=aSlots[j];break;}}
    STATE.season.playerAssists[chosen.i]++;
  }
}

// Per-game expected stat baselines by position:
// [tackles_pg, miss_rate, linebreaks_pg, tackle_breaks_pg, run_metres_pg, offloads_pg]
const SEASON_STAT_WEIGHTS={
  // [tackles_pg, miss_rate, linebreaks_pg, tackle_breaks_pg, run_metres_pg, offloads_pg]
  // LB calibrated: avg 20-26/season, elite 30-36 (FB/W/C lead; HK/P much lower)
  // TB calibrated: avg ~100-120/season, elite ~140-165 (Tedesco 158 in 2025)
  FB:[28,0.07,1.00,5.0,115,0.30],
  W: [22,0.08,0.90,4.5, 95,0.20],
  C: [34,0.07,0.90,5.0,115,0.40],
  FE:[36,0.08,0.80,4.0,100,0.50],
  HB:[38,0.07,0.70,3.5, 85,0.30],
  HK:[42,0.05,0.40,4.5,110,0.90],
  P: [50,0.04,0.20,3.5,148,0.50],
  SR:[46,0.04,0.30,4.5,132,0.70],
  LK:[47,0.04,0.28,4.0,130,0.60],
};
function generateSeasonStats(){
  const games=STATE.season.wins+STATE.season.losses;
  const stats=Array(13).fill(null);
  // pf = shared player form factor; correlates LB, TB, RM, Off so attack-heavy seasons are consistent
  const sv=()=>0.90+Math.random()*0.20; // small per-stat variance
  SLOTS.forEach(slot=>{
    const p=STATE.team[slot.i];if(!p)return;
    const w=SEASON_STAT_WEIGHTS[slot.type]||[30,0.07,0.10,0.10,100,0.40];
    const rMult=0.88+(p.rating/100)*0.26;
    const pf=0.82+Math.random()*0.36; // shared season form: good/bad season applies to all attack stats
    const tackles=Math.round(w[0]*games*rMult*(0.88+Math.random()*0.24));
    const missed=Math.max(1,Math.round(tackles*w[1]*(0.80+Math.random()*0.40)));
    const eff=Math.round(tackles/(tackles+missed)*100);
    const lb=Math.max(0,Math.round(w[2]*games*rMult*pf*sv()));
    const tb=Math.max(0,Math.round(w[3]*games*rMult*pf*sv()));
    const rm=Math.round(w[4]*rMult*pf*sv());
    const off=Math.max(0,Math.round(w[5]*games*rMult*pf*sv()));
    stats[slot.i]={tackles,missed,eff,lb,tb,rm,off};
  });
  return stats;
}

let _autoTimer=null;
function toggleAutoPlay(){
  if(_autoTimer){clearInterval(_autoTimer);_autoTimer=null;document.getElementById('autoPlayBtn').textContent='⚡ Auto Play';return;}
  if(STATE.season.done)return;
  if(typeof gtag!=='undefined')gtag('event','season_started',{event_category:'game',play_mode:'autoplay',squad_rating:STATE.season.rating});
  document.getElementById('autoPlayBtn').textContent='⏸ Pause';
  _autoTimer=setInterval(()=>{
    const s=STATE.season;
    if(s.done||!s.schedule.some(g=>!g.bye&&!g.result)){
      clearInterval(_autoTimer);_autoTimer=null;
      document.getElementById('autoPlayBtn').textContent='⚡ Auto Play';
      finishRegularSeason();return;
    }
    playNextGame();
  },200);
}

function skipAll(){
  if(_autoTimer){clearInterval(_autoTimer);_autoTimer=null;document.getElementById('autoPlayBtn').textContent='⚡ Auto Play';}
  const s=STATE.season;
  for(let i=0;i<s.schedule.length;i++) if(!s.schedule[i].bye&&!s.schedule[i].result) resolveGame(i);
  renderFixtureList();updateSeasonSidebar();finishRegularSeason();
}

function updateSeasonSidebar() {
  const s=STATE.season;
  document.getElementById('recordDisplay').textContent=`${s.wins}-${s.losses}`;
  document.getElementById('sStatPF').textContent=s.pf;
  document.getElementById('sStatPA').textContent=s.pa;
  document.getElementById('sStatTries').textContent=s.tries;
  document.getElementById('sStatStreak').textContent=s.streak>0?`${s.streak}${s.streakType}`:'-';
  // Where they sit so far: each opponent's form is rolled once a season and scaled to the games played, so the figure
  // moves with results (it was re-rolled on every tap and jumped around). Ties count against you, as the old sort did; '-' before a game
  if(!s.formEst) s.formEst=NRL_OPPONENTS.map(()=>rand(-4,4));
  const played=s.wins+s.losses;
  if(!played){document.getElementById('sStatPos').textContent='-';return;}
  const myPts=s.wins*2;
  const above=NRL_OPPONENTS.filter((o,i)=>Math.max(0,Math.round((getWinProb(o.strength,79)*24+s.formEst[i])*played/24))*2>=myPts).length;
  const pos=above+1;
  document.getElementById('sStatPos').textContent=pos+ordinal(pos);
}

// ============================================================
// FINALS - Top 8 Finals
// ============================================================
function finishRegularSeason() {
  const s=STATE.season;
  if(!s||s.done) return; // once only
  s.done=true;
  const myPts=s.wins*2;
  const ladder=NRL_OPPONENTS.map(o=>{
    // Add ±5 win variance so different teams win different seasons
    // Seasonal form modifier: each team gets a random +/-4 swing so the ladder reshuffles each year
    const form=rand(-4,4);
    const effStr=Math.max(65,Math.min(95,o.strength+form));
    const normStr=Math.max(0,Math.min(1,(effStr-73)/13));
    const baseWins=Math.round(9+normStr*10);
    const dominance=Math.random()<0.05?rand(1,3):0;
    // Cap simulated opponents at 23 wins: a true 24-0 (perfect) season must always be unique and rank 1st
    const wins=Math.max(0,Math.min(23,baseWins+rand(-2,2)+dominance));
    const pf=Math.round(wins*22+(24-wins)*14+rand(-20,20));
    const pa=Math.round(wins*14+(24-wins)*22+rand(-20,20));
    return{name:o.name,pts:wins*2,wins,strength:o.strength,pf,pa};
  });
  ladder.push({name:myTeam(),pts:myPts,wins:s.wins,strength:s.rating,pf:s.pf||0,pa:s.pa||0});
  // Sort by: points → points differential → points for → wins
  ladder.sort((a,b)=>b.pts-a.pts||((b.pf-b.pa)-(a.pf-a.pa))||b.pf-a.pf||b.wins-a.wins);
  s.ladder=ladder;
  s.myLadderPos=ladder.findIndex(t=>t.name===myTeam())+1;
  // Safety net: a true 24-0 (perfect) regular season must always finish 1st
  if(s.wins===24&&s.losses===0&&s.myLadderPos!==1){
    const myIdx=ladder.findIndex(t=>t.name===myTeam());
    const [me]=ladder.splice(myIdx,1);
    ladder.unshift(me);
    s.ladder=ladder;
    s.myLadderPos=1;
  }
  s.finals=runFinalsSeries(ladder.slice(0,8),s.rating);
  launchFinalsViewer();
}

// force (Run It Back's rare case, js/theme-fx.js): { 'Finals Week 1': true, ... } wins the user's game in those weeks
function runFinalsSeries(top8,myRating,force) {
  const s=STATE.season;
  function str(t){return t.name===myTeam()?myRating:t.strength;}
  const seedMap={};top8.forEach((t,i)=>seedMap[t.name]=i+1);
  function effStr(t,rd){
    const base=str(t);
    if(rd===1){const seed=seedMap[t.name]||9;if(seed===1)return base+2;if(seed===2)return base+1;}
    return base;
  }
  // user seed (1-8), or 0 if not in top8
  const userSeed=top8.findIndex(t=>t.name===myTeam())+1;
  const userIn58=userSeed>=5&&userSeed<=8;
  const force88W1Loss=myRating<=88&&userSeed>=1&&userSeed<=4;
  function isMe(t){return t.name===myTeam();}
  function play(a,b,rd,forceUserLoss,wk){
    const _isMe=isMe(a)||isMe(b);
    const _meIsA=isMe(a);
    const _forceW=_isMe&&!forceUserLoss&&(myRating>=93);
    let won;
    if(_isMe&&force&&force[wk]) won=_meIsA;
    else if(_isMe&&forceUserLoss) won=!_meIsA;
    else if(_forceW) won=_meIsA;
    else won=Math.random()<getWinProb(effStr(a,rd),effStr(b,rd),rd||1);
    if(_isMe&&wk==='GRAND FINAL'&&Math.round(myRating)<=85) won=!_meIsA;
    const [winner,loser]=won?[a,b]:[b,a];
    const wTries=rand(2,7),lTries=rand(0,wTries-1);
    const lvl=t=>isMe(t)?myKickLevel():clubKickLevel(t.name);
    const k=goalsFor(wTries,lTries,lvl(winner),lvl(loser));
    const gp=k.wf===1&&k.ws-k.ls===1&&Math.random()<0.5; // level at 80: golden point
    return{winner,loser,score:`${k.ws}-${k.ls}`,wTries,lTries,wPts:k.ws,lPts:k.ls,wConv:k.wc,lConv:k.lc,wPens:k.wp,lPens:k.lp,wFg:k.wf,gp};
  }
  const results={weeks:[]};

  // WEEK 1: QF1 (1v4), QF2 (2v3), EF1 (5v8), EF2 (6v7)
  const W1='Finals Week 1';
  const qf1=play(top8[0],top8[3],1,force88W1Loss&&(isMe(top8[0])||isMe(top8[3])),W1);
  const qf2=play(top8[1],top8[2],1,force88W1Loss&&(isMe(top8[1])||isMe(top8[2])),W1);
  const ef1=play(top8[4],top8[7],1,false,W1);
  const ef2=play(top8[5],top8[6],1,false,W1);
  results.weeks.push({label:'Finals Week 1',games:[qf1,qf2,ef1,ef2],qfGames:2});

  // WEEK 2: SF1 = QF1 loser vs EF1 winner, SF2 = QF2 loser vs EF2 winner
  // QF1 & QF2 winners have a bye
  const userLostQF=userSeed>=1&&userSeed<=4&&(isMe(qf1.loser)||isMe(qf2.loser));
  const sf1=play(qf1.loser,ef1.winner,2,force88W1Loss&&isMe(qf1.loser),'Semi Finals');
  const sf2=play(qf2.loser,ef2.winner,2,force88W1Loss&&isMe(qf2.loser),'Semi Finals');
  results.weeks.push({label:'Semi Finals',games:[sf1,sf2],byes:[qf1.winner,qf2.winner]});

  // WEEK 3: PF1 = QF1 winner vs SF2 winner, PF2 = QF2 winner vs SF1 winner
  // Two paths can lead to 4 finals games: cap both at PF to keep total at 27:
  //   A) Top-4 user lost QF → dropped to SF → won SF → in PF = 3rd game → FORCE LOSS (GF would be 4th)
  //   B) 5-8 user won EF → won SF → in PF = 3rd game → FORCE LOSS (GF would be 4th)
  const userInPF1=isMe(qf1.winner)||isMe(sf2.winner);
  const userInPF2=isMe(qf2.winner)||isMe(sf1.winner);
  const forceUserPFLoss=(userLostQF||userIn58);
  const pf1=play(qf1.winner,sf2.winner,3,forceUserPFLoss&&userInPF1,'Preliminary Finals');
  const pf2=play(qf2.winner,sf1.winner,3,forceUserPFLoss&&userInPF2,'Preliminary Finals');
  results.weeks.push({label:'Preliminary Finals',games:[pf1,pf2]});

  // WEEK 4: GRAND FINAL
  const userInGF=isMe(pf1.winner)||isMe(pf2.winner);
  const belowFloor=userInGF&&s.wins<20;
  const gf=play(pf1.winner,pf2.winner,3,belowFloor,'GRAND FINAL');
  results.weeks.push({label:'GRAND FINAL',games:[gf]});

  results.champion=gf.winner;
  const inTop8=top8.some(t=>t.name===myTeam());
  results.myTeamInFinals=inTop8;
  // Build journey: track all games user actually played
  const myJourney=[];
  if(inTop8){
    results.weeks.forEach(wk=>wk.games.forEach(g=>{
      if(isMe(g.winner)||isMe(g.loser)){
        myJourney.push({round:wk.label,won:isMe(g.winner)});
      }
    }));
  }
  results.myJourney=myJourney;
  results.isChampion=results.champion.name===myTeam();
  return results;
}

function buildFinalsBracket(f,ladder){
  const seedOf={};
  ladder.forEach((t,i)=>seedOf[t.name]=i+1);
  function isMeT(t){return t.name===myTeam();}
  function teamHtml(t,won,pts){
    const me=isMeT(t);
    const seed=seedOf[t.name]||'';
    const cls='bracket-team'+(won?' winner':' loser')+(me?' is-me':'');
    const dispName=me?`⭐ ${myTeamHtml()}`:`${fvEmoji(t.name)} ${fvShort(t.name)}`;
    const scoreBadge=pts!==undefined?`<span class="bracket-tries">${pts}</span>`:'';
    return`<div class="${cls}"><span class="bracket-seed">${seed}</span><span class="bracket-name"${me?' style="color:inherit"':''}>${dispName}</span>${scoreBadge}</div>`;
  }
  function gameHtml(g,isGF){
    const cls='bracket-game'+(isGF?' bracket-gf':'');
    const champion=isGF&&g.winner.name===f.champion?.name;
    let html=`<div class="${cls}">`;
    // Points (7 Oct 2026); a season played before then has only its tries, all converted
    html+=teamHtml(g.winner,true,g.wPts!=null?g.wPts:g.wTries*6);
    html+=teamHtml(g.loser,false,g.lPts!=null?g.lPts:g.lTries*6);
    if(g.score) html+=`<div class="bracket-score">${g.score}</div>`;
    if(champion) html+=`<div style="font-size:8px;color:var(--gold);text-align:center;padding:2px;background:rgba(241,192,115,0.08)">🏆 PREMIERS</div>`;
    html+=`</div>`;
    return html;
  }
  function byeCard(t){
    const me=isMeT(t);
    const seed=seedOf[t.name]||'';
    const dispName=me?`⭐ ${myTeamHtml()}`:`${fvEmoji(t.name)} ${fvShort(t.name)}`;
    return`<div class="bracket-game" style="opacity:0.55"><div class="bracket-team${me?' is-me':''}" style="opacity:0.8"><span class="bracket-seed">${seed}</span><span class="bracket-name">${dispName}</span></div><div style="text-align:center;font-size:9px;color:var(--muted);padding:4px 0;letter-spacing:.8px">- BYE -</div></div>`;
  }

  // 4 rounds: Week1 (QF+EF), Semi Finals, Preliminary Finals, Grand Final
  const wk=f.weeks; // wk[0..3]
  const roundLabels=['Finals Wk 1','Semi Finals','Preliminary Finals','Grand Final'];

  // Determine when user was truly eliminated: last game in journey
  // (last loss = real elimination point; winning the GF = undefeated champion)
  const userElimRound=(()=>{
    if(!f.myTeamInFinals||!f.myJourney.length) return -1;
    const last=f.myJourney[f.myJourney.length-1];
    if(last.won) return 99; // still alive / champion
    return['Finals Week 1','Semi Finals','Preliminary Finals','GRAND FINAL'].indexOf(last.round);
  })();
  function ghosted(i){return userElimRound>=0&&userElimRound<99&&i>userElimRound;}

  let html='<div class="bracket-wrap"><div class="bracket">';

  // ── ROUND 1: Qualifying Finals + Elimination Finals ──
  const qfCount=wk[0].qfGames||2;
  const r0cls=ghosted(0)?' bracket-round--ghosted':'';
  html+=`<div class="bracket-round${r0cls}"><div class="bracket-round-label">${roundLabels[0]}</div><div class="bracket-games">`;
  if(ghosted(0)) html+=`<div class="bracket-elim-banner">⛔ ELIMINATED</div>`;
  wk[0].games.slice(0,qfCount).forEach(g=>html+=gameHtml(g,false));
  wk[0].games.slice(qfCount).forEach(g=>html+=gameHtml(g,false));
  html+=`</div></div>`;

  // ── ROUND 2: Semi Finals (+ BYE for QF winners) ──
  const r1cls=ghosted(1)?' bracket-round--ghosted':'';
  html+=`<div class="bracket-round${r1cls}"><div class="bracket-round-label">${roundLabels[1]}</div><div class="bracket-games">`;
  // Only show "eliminated" banner in SF if user was truly out after Week 1 (lost EF, not QF)
  // Top-4 QF losers have a second chance in SF, so no banner there
  const userLostEF=f.myJourney.length===1&&!f.myJourney[0]?.won&&f.myJourney[0]?.round==='Finals Week 1';
  if(ghosted(1)&&userLostEF) html+=`<div class="bracket-elim-banner">⛔ ELIMINATED</div>`;
  // Show QF winners' byes at top
  if(wk[1]?.byes){wk[1].byes.forEach(t=>html+=byeCard(t));}
  if(wk[1]){wk[1].games.forEach(g=>html+=gameHtml(g,false));}
  html+=`</div></div>`;

  // ── ROUND 3: Preliminary Finals ──
  const r2cls=ghosted(2)?' bracket-round--ghosted':'';
  html+=`<div class="bracket-round${r2cls}"><div class="bracket-round-label">${roundLabels[2]}</div><div class="bracket-games">`;
  if(ghosted(2)) html+=`<div class="bracket-elim-banner">⛔ DID NOT QUALIFY</div>`;
  if(wk[2]){wk[2].games.forEach(g=>html+=gameHtml(g,false));}
  html+=`</div></div>`;

  // ── ROUND 4: Grand Final: ALWAYS SHOW, grey label only ──
  const gfLabelStyle=ghosted(3)?'color:var(--muted)':'';
  html+=`<div class="bracket-round"><div class="bracket-round-label" style="${gfLabelStyle}">${roundLabels[3]}</div><div class="bracket-games" style="justify-content:center">`;

  if(wk[3]){wk[3].games.forEach(g=>html+=gameHtml(g,true));}
  html+=`</div></div>`;

  html+='</div></div>';
  return html;
}


// ============================================================
// RESULTS
// ============================================================
// ============================================================
// FINALS MATCH VIEWER
// ============================================================
const TEAM_SHORT={'Penrith Panthers':'Panthers','Melbourne Storm':'Storm','Sydney Roosters':'Roosters','Brisbane Broncos':'Broncos','Manly Warringah Sea Eagles':'Sea Eagles','North Queensland Cowboys':'Cowboys','Cronulla-Sutherland Sharks':'Sharks','South Sydney Rabbitohs':'Rabbitohs','Canberra Raiders':'Raiders','NZ Warriors':'Warriors','Parramatta Eels':'Eels','Newcastle Knights':'Knights','Canterbury-Bankstown Bulldogs':'Bulldogs','Gold Coast Titans':'Titans','St. George Illawarra Dragons':'Dragons','Dolphins':'Dolphins','Wests Tigers':'Tigers'};
const TEAM_EMOJI={'Penrith Panthers':'🐾','Melbourne Storm':'⚡','Sydney Roosters':'🐓','Brisbane Broncos':'🐴','Manly Warringah Sea Eagles':'🦅','North Queensland Cowboys':'🤠','Cronulla-Sutherland Sharks':'🦈','South Sydney Rabbitohs':'🐇','Canberra Raiders':'🥛','NZ Warriors':'🇳🇿','Parramatta Eels':'🐍','Newcastle Knights':'🏰','Canterbury-Bankstown Bulldogs':'🐶','Gold Coast Titans':'⚔️','St. George Illawarra Dragons':'🐉','Dolphins':'🐬','Wests Tigers':'🐯'};
function fvShort(n){return TEAM_SHORT[n]||n.split(' ').pop();}
function fvEmoji(n){return TEAM_EMOJI[n]||'';}
function fvLabel(n){return fvEmoji(n)+' '+fvShort(n);}
const FV_ROSTERS={
  "Penrith Panthers":{conv:"Nathan Cleary",players:[{n:"Dylan Edwards",p:"FB"},{n:"Brian To'o",p:"W"},{n:"Josh Mansour",p:"W"},{n:"Ryan Girdler",p:"C"},{n:"Paul Franze",p:"C"},{n:"Jamie Soward",p:"FE"},{n:"Nathan Cleary",p:"HB"},{n:"Brent Kite",p:"P"},{n:"Mitch Kenny",p:"HK"},{n:"Moses Leota",p:"P"},{n:"Liam Martin",p:"SR"},{n:"Trent Waterhouse",p:"SR"},{n:"Isaah Yeo",p:"LK"}]},
  "Melbourne Storm":{conv:"Cameron Smith",players:[{n:"Billy Slater",p:"FB"},{n:"Matt Geyer",p:"W"},{n:"Xavier Coates",p:"W"},{n:"Will Chambers",p:"C"},{n:"Matt King",p:"C"},{n:"Cameron Munster",p:"FE"},{n:"Jahrome Hughes",p:"HB"},{n:"Glenn Lazarus",p:"P"},{n:"Cameron Smith",p:"HK"},{n:"Robbie Kearns",p:"P"},{n:"Ryan Hoffman",p:"SR"},{n:"Eliesa Katoa",p:"SR"},{n:"Tawera Nikau",p:"LK"}]},
  "Sydney Roosters":{conv:"Brad Fittler",players:[{n:"James Tedesco",p:"FB"},{n:"Brett Morris",p:"W"},{n:"Anthony Minichiello",p:"W"},{n:"Josh Morris",p:"C"},{n:"Michael Jennings",p:"C"},{n:"Brad Fittler",p:"FE"},{n:"Cooper Cronk",p:"HB"},{n:"Jared Waerea-Hargreaves",p:"P"},{n:"Jake Friend",p:"HK"},{n:"Adrian Morley",p:"P"},{n:"Sonny Bill Williams",p:"SR"},{n:"Boyd Cordner",p:"SR"},{n:"Luke Ricketson",p:"LK"}]},
  "Brisbane Broncos":{conv:"Darren Lockyer",players:[{n:"Reece Walsh",p:"FB"},{n:"Jharal Yow Yeh",p:"W"},{n:"Darius Boyd",p:"W"},{n:"Steve Renouf",p:"C"},{n:"Israel Folau",p:"C"},{n:"Darren Lockyer",p:"FE"},{n:"Allan Langer",p:"HB"},{n:"Payne Haas",p:"P"},{n:"Billy Walters",p:"HK"},{n:"Shane Webcke",p:"P"},{n:"Gorden Tallis",p:"SR"},{n:"Sam Thaiday",p:"SR"},{n:"Tonie Carroll",p:"LK"}]},
  "Manly Warringah Sea Eagles":{conv:"Jamie Lyon",players:[{n:"Brett Stewart",p:"FB"},{n:"John Hopoate",p:"W"},{n:"Michael Robertson",p:"W"},{n:"Jamie Lyon",p:"C"},{n:"Steve Matai",p:"C"},{n:"Kieran Foran",p:"FE"},{n:"Daly Cherry-Evans",p:"HB"},{n:"Willie Mason",p:"P"},{n:"Matt Ballin",p:"HK"},{n:"Aaron Woods",p:"P"},{n:"Steve Menzies",p:"SR"},{n:"Haumole Olakau'atu",p:"SR"},{n:"Ben Kennedy",p:"LK"}]},
  "North Queensland Cowboys":{conv:"Johnathan Thurston",players:[{n:"Matt Bowen",p:"FB"},{n:"Kyle Feldt",p:"W"},{n:"Ty Williams",p:"W"},{n:"Brent Tate",p:"C"},{n:"Paul Bowman",p:"C"},{n:"Jason Smith",p:"FE"},{n:"Johnathan Thurston",p:"HB"},{n:"Matthew Scott",p:"P"},{n:"Jake Granville",p:"HK"},{n:"Ben Hannant",p:"P"},{n:"Gavin Cooper",p:"SR"},{n:"Jeremiah Nanai",p:"SR"},{n:"Jason Taumalolo",p:"LK"}]},
  "Cronulla-Sutherland Sharks":{conv:"Nicho Hynes",players:[{n:"Ben Barba",p:"FB"},{n:"Valentine Holmes",p:"W"},{n:"Ronaldo Mulitalo",p:"W"},{n:"Andrew Ettingshausen",p:"C"},{n:"Josh Dugan",p:"C"},{n:"Todd Carney",p:"FE"},{n:"Nicho Hynes",p:"HB"},{n:"Paul Gallen",p:"P"},{n:"Michael Ennis",p:"HK"},{n:"Andrew Fifita",p:"P"},{n:"Luke Lewis",p:"SR"},{n:"Wade Graham",p:"SR"},{n:"Dale Finucane",p:"LK"}]},
  "South Sydney Rabbitohs":{conv:"Adam Reynolds",players:[{n:"Greg Inglis",p:"FB"},{n:"Alex Johnston",p:"W"},{n:"Nathan Merritt",p:"W"},{n:"Latrell Mitchell",p:"C"},{n:"Dane Gagai",p:"C"},{n:"John Sutton",p:"FE"},{n:"Adam Reynolds",p:"HB"},{n:"Roy Asotasi",p:"P"},{n:"Issac Luke",p:"HK"},{n:"George Burgess",p:"P"},{n:"Jai Arrow",p:"SR"},{n:"Sam Burgess",p:"SR"},{n:"Cameron Murray",p:"LK"}]},
  "Canberra Raiders":{conv:"Jarrod Croker",players:[{n:"Clinton Schifcofske",p:"FB"},{n:"Jordan Rapana",p:"W"},{n:"Bill Tupou",p:"W"},{n:"Jarrod Croker",p:"C"},{n:"Shaun Berrigan",p:"C"},{n:"Laurie Daley",p:"FE"},{n:"Matt Orford",p:"HB"},{n:"Josh Papalii",p:"P"},{n:"Alan Tongue",p:"HK"},{n:"Joseph Tapine",p:"P"},{n:"David Furner",p:"SR"},{n:"Hudson Young",p:"SR"},{n:"Corey Horsburgh",p:"LK"}]},
  "NZ Warriors":{conv:"Shaun Johnson",players:[{n:"Roger Tuivasa-Sheck",p:"FB"},{n:"Manu Vatuvei",p:"W"},{n:"Francis Meli",p:"W"},{n:"Ivan Cleary",p:"C"},{n:"Tony Martin",p:"C"},{n:"Shaun Johnson",p:"FE"},{n:"Stacey Jones",p:"HB"},{n:"James Fisher-Harris",p:"P"},{n:"Erin Clark",p:"HK"},{n:"Steve Price",p:"P"},{n:"Ruben Wiki",p:"SR"},{n:"Simon Mannering",p:"SR"},{n:"Micheal Luck",p:"LK"}]},
  "Parramatta Eels":{conv:"Mitchell Moses",players:[{n:"Jarryd Hayne",p:"FB"},{n:"Semi Radradra",p:"W"},{n:"Josh Addo-Carr",p:"W"},{n:"Willie Tonga",p:"C"},{n:"Zac Lomax",p:"C"},{n:"Dylan Walker",p:"FE"},{n:"Mitchell Moses",p:"HB"},{n:"Nathan Cayless",p:"P"},{n:"Josh Hodgson",p:"HK"},{n:"Fuifui Moimoi",p:"P"},{n:"Nathan Hindmarsh",p:"SR"},{n:"Anthony Watmough",p:"SR"},{n:"Jim Dymock",p:"LK"}]},
  "Newcastle Knights":{conv:"Andrew Johns",players:[{n:"Kalyn Ponga",p:"FB"},{n:"Darren Albert",p:"W"},{n:"Akuila Uate",p:"W"},{n:"Timana Tahu",p:"C"},{n:"Shaun Kenny-Dowall",p:"C"},{n:"Dylan Brown",p:"FE"},{n:"Andrew Johns",p:"HB"},{n:"Paul Harragon",p:"P"},{n:"Danny Buderus",p:"HK"},{n:"Tony Butterfield",p:"P"},{n:"Steve Simpson",p:"SR"},{n:"Tyson Frizell",p:"SR"},{n:"Bill Peden",p:"LK"}]},
  "Canterbury-Bankstown Bulldogs":{conv:"Hazem El Masri",players:[{n:"Luke Patten",p:"FB"},{n:"Hazem El Masri",p:"W"},{n:"Daryl Halligan",p:"W"},{n:"Stephen Crichton",p:"C"},{n:"William Hopoate",p:"C"},{n:"Matt Burton",p:"FE"},{n:"Ricky Stuart",p:"HB"},{n:"Michael Hodgson",p:"P"},{n:"Adam Perry",p:"HK"},{n:"Paul Vaughan",p:"P"},{n:"Bradley Clyde",p:"SR"},{n:"Andrew Ryan",p:"SR"},{n:"Reni Maitua",p:"LK"}]},
  "Gold Coast Titans":{conv:"Michael Gordon",players:[{n:"Michael Gordon",p:"FB"},{n:"Mat Rogers",p:"W"},{n:"Anthony Don",p:"W"},{n:"Steve Michaels",p:"C"},{n:"Clinton Toopi",p:"C"},{n:"Preston Campbell",p:"FE"},{n:"Ash Taylor",p:"HB"},{n:"Luke Bailey",p:"P"},{n:"Nathan Friend",p:"HK"},{n:"David Shillington",p:"P"},{n:"Mark Minichiello",p:"SR"},{n:"Anthony Laffranchi",p:"SR"},{n:"Tino Fa'asuamaleaui",p:"LK"}]},
  "St. George Illawarra Dragons":{conv:"Gareth Widdop",players:[{n:"Clinton Gutherson",p:"FB"},{n:"Wendell Sailor",p:"W"},{n:"Jason Nightingale",p:"W"},{n:"Mark Gasnier",p:"C"},{n:"Matt Cooper",p:"C"},{n:"Gareth Widdop",p:"FE"},{n:"Ben Hornby",p:"HB"},{n:"James Graham",p:"P"},{n:"Damien Cook",p:"HK"},{n:"David Klemmer",p:"P"},{n:"Ben Creagh",p:"SR"},{n:"Bronson Harrison",p:"SR"},{n:"Trent Merrin",p:"LK"}]},
  "Dolphins":{conv:"Jamayne Isaako",players:[{n:"Hamiso Tabuai-Fidow",p:"FB"},{n:"Jamayne Isaako",p:"W"},{n:"Jack Bostock",p:"W"},{n:"Herbie Farnworth",p:"C"},{n:"Jake Averillo",p:"C"},{n:"Kodi Nikorima",p:"FE"},{n:"Isaiya Katoa",p:"HB"},{n:"Jesse Bromwich",p:"P"},{n:"Jeremy Marshall-King",p:"HK"},{n:"Jarrod Wallace",p:"P"},{n:"Felise Kaufusi",p:"SR"},{n:"Kenny Bromwich",p:"SR"},{n:"Morgan Knowles",p:"LK"}]},
  "Wests Tigers":{conv:"Benji Marshall",players:[{n:"Brett Hodgson",p:"FB"},{n:"Matt Utai",p:"W"},{n:"Pat Richards",p:"W"},{n:"Chris Lawrence",p:"C"},{n:"Justin Olam",p:"C"},{n:"Benji Marshall",p:"FE"},{n:"Scott Prince",p:"HB"},{n:"James Tamou",p:"P"},{n:"Robbie Farah",p:"HK"},{n:"John Skandalis",p:"P"},{n:"Gareth Ellis",p:"SR"},{n:"Chris McQueen",p:"SR"},{n:"Scott Sattler",p:"LK"}]},
};

const GOAL_KICKER_RANK={"Cameron Smith":1296,"Adam Reynolds":1139,"Johnathan Thurston":923,"Jarrod Croker":916,"Hazem El Masri":894,"James Maloney":772,"Craig Fitzgibbon":718,"Nathan Cleary":717,"Michael Gordon":684,"Andrew Johns":660,"Luke Burt":647,"Clinton Schifcofske":612,"Matt Orford":598,"Corey Parker":586,"Shaun Johnson":559,"Mitchell Moses":558,"Jamie Lyon":534,"Jamie Soward":521,"Jamayne Isaako":508,"Reuben Garrick":492,"Kurt Gidley":456,"Brett Hodgson":454,"Valentine Holmes":450,"Luke Covell":421,"Benji Marshall":417,"Gareth Widdop":417,"Latrell Mitchell":405,"Michael De Vere":403,"Scott Prince":392,"Nicho Hynes":387,"Ryan Girdler":376,"Zac Lomax":368,"Nick Meaney":357,"Josh Hannay":347,"Ivan Cleary":336,"Jason Taylor":334,"Chris Sandow":332,"Ben Walker":298,"Daryl Halligan":295,"Jamal Fogarty":295,"Trent Hodkinson":294,"Todd Carney":289,"Preston Campbell":279,"Mat Rogers":271,"Sam Walker":261,"Michael Witt":258,"Darren Lockyer":256,"Kalyn Ponga":254,"Joel Caine":249,"Tyrone Roberts":244,"Wayne Bartrim":229,"Mark Riddell":226,"Matt Burton":223,"Luke Williamson":215,"Issac Luke":214,"Daly Cherry-Evans":211,"Aidan Sezer":203,"Julian O'Neill":202,"Brett Kimmorley":196,"Jordan Kahu":187,"Chad Townsend":186,"Kyle Flanagan":185,"Adam Doueihi":184,"Stacey Jones":183,"Ryan Papenhuyzen":168,"Clinton Gutherson":157,"Luke Walsh":154,"Moses Mbye":141,"Bryson Goodwin":138,"Tanah Boyd":137,"Krisnan Inu":135,"Stephen Crichton":135,"Andrew Walker":134,"Ash Taylor":130,"Joe Williams":128,"Reece Walsh":126,"Braith Anasta":125,"Terry Campese":124,"Pat Richards":123,"David Furner":122,"Tony Martin":120,"Michael Ennis":118,"Matt Geyer":117,"Wes Naiqama":111,"Amos Roberts":108,"Scott Drinkwater":106,"Jayden Campbell":106,"Tasesa Lavea":102,"Peter Wallace":98,"Aaron Gorrell":96,"Mathew Head":96,"Esan Marsters":96,"Braydon Trindall":94,"Chris Hicks":92,"Apisai Koroisau":91,"Jason Ferris":89,"Luke Phillips":85,"Matthew Ridge":85,"Kerrod Holland":83,"Steve Turner":80,"Jackson Hastings":80,"Michael Crocker":79,"Jake Clifford":78,"Ethan Lowe":77,"John Williams":75,"Kodi Nikorima":75,"Joseph-Aukuso Sua'Ali'I":75,"Kotoni Staggs":74,"Tui Lolohea":72,"Siosiua Taukeiaho":72,"Justin Smith":71,"Lance Hohaia":70,"Shannon Nevin":69,"Daniel Abraham":67,"Sandon Smith":67,"Blake Taaffe":66,"Mason Lino":65,"John Simon":64,"Craig Smith":63,"Chanel Harris-Tavita":63,"Brett Seymour":56,"Michael Dobson":56,"Cameron Munster":55,"Luke Metcalf":55,"Toby Sexton":54,"Matthew Wright":53,"Adam Pompey":52,"Matt Gafa":51,"Anthony Milford":50,"Chris Walker":49,"Rhyse Martin":49,"Graham Appo":48,"Corey Norman":47,"Dane Gagai":47,"Kyle Feldt":47,"Sam Williams":47,"Brett Delaney":46,"Jarrod Sammut":46,"Matt Bowen":45,"Nathan Merritt":45,"Adam Keighran":45,"Travis Burns":43,"Dylan Walker":43,"Dylan Edwards":43,"Mitch Healey":42,"Owen Craigie":40,"Bill Peden":39,"Jake Averillo":39,"Adam Brown":38,"Josh Dugan":38,"Jordan Rapana":38,"Ben Hunt":37,"Chase Stanley":36,"Jarrad Anderson":35,"Justin Holbrook":34,"Mark Gasnier":34,"Greg Bird":34,"Sione Faumuina":34,"Tim Lafai":34,"Matt Moylan":34,"Brandon Wakeham":34,"Paul Alamoti":34,"Graham Mackay":33,"Rod Wishart":32,"Brad Watts":32,"Noel Goldthorpe":31,"Blaine Stanley":31,"Craig Field":30,"Matt Hilder":30,"Brock Lamb":30,"Brent Webb":29,"Ashley Graham":28,"Jordan Rankin":28,"Brendon Reeves":27,"Shane Rodney":27,"Steve Matai":27,"Kevin Locke":27,"Blake Ferguson":26,"Paul Momirovski":26,"Lachlan Miller":26,"Ken Sio":25,"Luke Brooks":25,"Greg Bourke":24,"Glenn Morrison":24,"Scott McLean":24,"Kane Elgey":24,"Brad Schneider":24,"Sean Russell":24,"Gene Ngamu":22,"Nathan Stapleton":22,"Daniel Mortimer":22,"Trent Leis":21,"Denan Kemp":21,"Tex Hoy":21,"Ben Hornby":20,"Jack Cogger":20,"Andrew Leeds":19,"Lote Tuqiri":19,"Scott Dureau":19,"Patrick Herbert":19,"Blake Austin":18,"Reece Robinson":18,"Cody Walker":18,"Mitchell Barnett":18,"Jamie Humphreys":18,"Nathan Blacklock":17,"Cory Paterson":17,"Joseph Tomane":17,"Scott Porter":17,"Damien Cook":17,"Daejarn Asi":17,"Tyran Wishart":17,"Simon Forrest":16,"Dean Collis":16,"Lachlan Coote":16,"Kyle Stanley":16,"Kevin Gordon":16,"George Williams":16,"Richard Swain":15,"Greg Inglis":15,"Nick Youngquest":15,"Joseph Paulo":15,"Dean Hawkins":15,"Leo Dynevor":14,"Brad Mackay":14,"Carl Doherty":14,"Brad Fittler":14,"Luke Kelly":14,"Herbie Farnworth":14,"Daniel Atkinson":14,"Brian Kelly":14,"Lee Murphy":13,"Brett Warton":13,"Ben Reynolds":13,"Brent Sherwin":13,"Thomas Weaver":13,"Kaeo Weekes":13,"Ben Ikin":12,"Brett Firman":12,"PJ Marsh":12,"John Morris":12,"Robbie Farah":12,"Tohu Harris":12,"Brodie Croft":12,"Aaron Schoupp":12,"Brandon Costin":11,"Travis Baker":11,"Lance Thompson":11,"Joel Monaghan":11,"Luke Young":11,"Daniel Holdsworth":11,"Nathan Gardner":11,"Beau Henry":11,"Jarome Luai":11,"Jack Bird":11,"Jock Madden":11,"Ashton Ward":11,"Scott Thorburn":10,"Darrell Trindall":10,"Phil Graham":10,"David Williams":10,"Jake Mullaney":10,"Kieran Foran":10,"Kurt Falls":10,"Luke Keary":10,"Adam Dykes":9,"Ben Jeffries":9,"Brett Sheehan":9,"Matt Riddle":9,"Tim Smith":9,"Patrick Ah Van":9,"Feleti Mateo":9,"Fletcher Myers":9,"Alf Duncan":8,"Michael Buettner":8,"Brad Drew":8,"Jason Moodie":8,"Israel Folau":8,"Ben Roberts":8,"Jayden Sullivan":8,"Hugo Savala":8,"Isaiah Tass":8,"Greg Alexander":7,"Michael Withers":7,"Ryan Cross":7,"Robbie O'Davis":7,"Marty Turner":7,"Dean Byrne":7,"Willie Peters":7,"John Sutton":7,"Marc Herbert":7,"Chris Lawrence":7,"Gavin Cooper":7,"Robert Lui":7,"Peta Hiku":7,"Adam Elliott":7,"Jai Field":7,"Tyrone Peachey":7,"Adam Cook":7,"Keano Kini":7,"Zac Laybutt":7,"Ben Lythe":6,"David Mulhall":6,"Luke Milton":6,"Dane Campbell":6,"Reegan Tanner":6,"Cooper Cronk":6,"Josh Mantellato":6,"Curtis Sironen":6,"Tyson Gamble":6,"Tyson Smoothy":6,"Jonah Pezet":6,"John Doyle":5,"Craig Gower":5,"Craig Kimmorley":5,"Scott Pethybridge":5,"Leo Clarke":5,"Beau Champion":5,"Shannon Gallant":5,"Shaun Kenny-Dowall":5,"Ben Henry":5,"Will Smith":5,"Mawene Hiroti":5,"Selwyn Cobbo":5,"James Tedesco":5,"Josh Rogers":5,"Bayleigh Bentley-Hape":5,"Ethan Strange":5};

function fvFindMyConv(){
  // Find the player on user's team with the most career goals in the database
  let best=null, bestGoals=-1;
  STATE.team.forEach(p=>{
    if(!p) return;
    const g=GOAL_KICKER_RANK[p.name]||0;
    if(g>bestGoals){bestGoals=g;best=p.name;}
  });
  if(best) return best;
  // Fallback: positional priority
  for(const pos of['HB','FE','FB','C']){
    const s=SLOTS.find(sl=>sl.type===pos&&STATE.team[sl.i]);
    if(s) return STATE.team[s.i].name;
  }
  let fb=null;
  STATE.team.forEach(p=>{if(p&&(!fb||p.rating>fb.rating))fb=p;});
  return fb?fb.name:'';
}

// The finals themselves play in js/finals-live.js (7 Oct 2026: World Cup 8-0's live view)
function fvShowMadeFinalsPopup(){
  const s=STATE.season;
  const pos=s.myLadderPos;
  document.getElementById('fvMFRecord').textContent=`${s.wins}-${s.losses}`;
  document.getElementById('fvMFPos').textContent=`${pos}${ordinal(pos)}`;
  document.getElementById('fvMFSub').textContent='Time to go all the way.';
  // Build Top 8 ladder
  const top8=s.ladder.slice(0,8);
  let lh='';
  top8.forEach((t,i)=>{
    const isMe=t.name===myTeam();
    const bg=isMe?'background:rgba(241,192,115,0.12);border-radius:5px;':'';
    lh+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 2px;${bg}">
      <span style="color:${isMe?'var(--gold)':'#666'};font-weight:700;width:16px;text-align:right;font-size:10px">${i+1}.</span>
      <span style="font-size:13px">${isMe?'⭐':fvEmoji(t.name)}</span>
      <span style="flex:1;font-weight:${isMe?800:500};color:${isMe?'#fff':'#ccc'};font-size:11px">${isMe?myTeamHtml():fvShort(t.name)}</span>
      <span style="color:var(--gold);font-weight:700;font-size:11px">${t.wins}W</span>
    </div>`;
  });
  document.getElementById('fvMFLadder').innerHTML=lh;
  document.getElementById('fvMadeFinalsPopup').style.display='flex';
}

function fvDismissMadeFinalsPopup(){
  document.getElementById('fvMadeFinalsPopup').style.display='none';
  // the first finals game's card is already on the screen behind it (js/finals-live.js)
}

function showResults() {
  const mf=document.getElementById('fvMadeFinalsPopup');if(mf)mf.style.display='none';
  const s=STATE.season;const f=s.finals;
  if(typeof gtag!=='undefined'){
    const _fW=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;
    const _fL=f.myTeamInFinals?f.myJourney.filter(j=>!j.won).length:0;
    const _is27=s.wins===24&&s.losses===0&&f.isChampion&&f.myJourney.every(j=>j.won)&&(s.wins+_fW)===27;
    gtag('event','season_completed',{event_category:'game',total_wins:s.wins+_fW,total_losses:s.losses+_fL,squad_rating:s.rating,premiers:f.isChampion?'yes':'no',undefeated:_is27?'yes':'no'});
  }
  const finalsWins27=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;const total27_0=s.wins===24&&s.losses===0&&f.isChampion&&f.myJourney.every(j=>j.won)&&(s.wins+finalsWins27)===27;
  const finalsW=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;
  const finalsL=f.myTeamInFinals?f.myJourney.filter(j=>!j.won).length:0;
  const totalW=s.wins+finalsW;
  const totalL=s.losses+finalsL;
  // Ladder badge
  const ladderStr=`${s.myLadderPos}${ordinal(s.myLadderPos)}`;
  // Finals result badge
  let finalsResultText,finalsResultColor,finalsResultSize;
  if(!f.myTeamInFinals){
    finalsResultText='Missed Finals';finalsResultColor='var(--muted)';finalsResultSize='20px';
  } else if(f.isChampion){
    finalsResultText='🏆 Premiers';finalsResultColor='var(--gold)';finalsResultSize='22px';
  } else {
    const lastRound=f.myJourney[f.myJourney.length-1]?.round||'';
    if(lastRound==='GRAND FINAL'){finalsResultText='GF Runner-Up';finalsResultColor='var(--gold)';finalsResultSize='20px';}
    else if(lastRound==='Preliminary Finals'){finalsResultText='Prelim Final';finalsResultColor='var(--gold)';finalsResultSize='20px';}else if(lastRound==='Semi Finals'){finalsResultText='Semi Final';finalsResultColor='var(--gold)';finalsResultSize='20px';}
    
    else{finalsResultText='Wk1 Finals Exit';finalsResultColor='var(--gold)';finalsResultSize='20px';}
  }
  const heroEl=document.getElementById('resultHero');
  if(total27_0){
    heroEl.innerHTML=`<div class="twentyseven-zero-banner"><h2>27-0</h2><p>🎉 UNDEFEATED! Your team is immortalised in Rugby League history. You are now in the Top 0.0000000001% of players.</p></div>`;
  } else {
    heroEl.innerHTML=`<div class="result-hero"><div class="big-record">${totalW}-${totalL}</div><div class="result-meta-row"><div class="result-badge"><div class="result-badge-label">Ladder Finish</div><div class="result-badge-val rb-ladder">${ladderStr}</div></div><div class="result-badge"><div class="result-badge-label">Season Result</div><div class="result-badge-val" style="color:${finalsResultColor};font-size:${finalsResultSize}">${finalsResultText}</div></div></div><p class="narrative">${shortNarrative(generateNarrative(s,f,total27_0,totalW,totalL),total27_0,totalW)}</p></div>`;
  }
  const body=document.getElementById('resultsBody');let _rb=''; // built as one string, set once at the end


  // Play Again on its own, Share and Change Mode side by side under it (4 Oct 2026, the owner's call; 1000TRIES the same).
  // A Daily go turns them into Go Again and Share My Best (js/daily.js)
  _rb+=`<div class="cp-res-acts"><button class="btn cp-res-again" onclick="showSocialPrompt()">🔄 Play Again</button><div class="cp-res-two"><button class="btn cp-res-share" onclick="showShareCard()">📸 Share</button><button class="btn cp-res-mode" onclick="cpChangeMode()">🎮 Change Mode</button></div></div>`;
  const finalsStatLabel=f.myTeamInFinals?'Finals':'Finals';
  const finalsStatVal=f.myTeamInFinals?`${finalsW}-${finalsL}`:'DNQ';
  const _secSum=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center"><div><div style="font-size:10px;color:var(--muted)">Regular Season</div><div style="font-size:20px;font-weight:900;font-family:'Inter',sans-serif;color:var(--gold)">${s.wins}-${s.losses}</div></div><div><div style="font-size:10px;color:var(--muted)">Finals</div><div style="font-size:20px;font-weight:900;color:${f.myTeamInFinals?(f.isChampion?'var(--gold)':'#fff'):'var(--muted)'}">${finalsStatVal}</div></div><div><div style="font-size:10px;color:var(--muted)">Ladder Finish</div><div style="font-size:20px;font-weight:900;font-family:'Inter',sans-serif">${s.myLadderPos}${ordinal(s.myLadderPos)}</div></div><div><div style="font-size:10px;color:var(--muted)">Pts For</div><div style="font-size:20px;font-weight:900;font-family:'Inter',sans-serif">${s.pf}</div></div><div><div style="font-size:10px;color:var(--muted)">Pts Against</div><div style="font-size:20px;font-weight:900;font-family:'Inter',sans-serif">${s.pa}</div></div><div><div style="font-size:10px;color:var(--muted)">Tries</div><div style="font-size:20px;font-weight:900;font-family:'Inter',sans-serif;color:var(--gold)">${s.tries}</div></div></div>`;
  // Dally M Medal: moved into Season Awards section below
  const dm = getDallyMWinner(s, f);
  let _secBracket=`${buildFinalsBracket(f,s.ladder)}`;
  if(!f.myTeamInFinals){
    _secBracket+=(`<p style="color:var(--muted);font-size:11px;margin-top:8px">Missed the finals (${s.myLadderPos}${ordinal(s.myLadderPos)}). ${f.champion?.name?fvLabel(f.champion.name)+' won the premiership.':''}</p>`);
  }

  // Regular Season Results collapsible
  let rsHtml='';
  STATE.season.schedule.forEach(game=>{
    if(game.bye){
      rsHtml+=`<div class="game-row bye" style="padding:5px 8px;margin-bottom:2px"><span class="game-opp" style="color:var(--muted);font-size:11px">Round ${game.round}: BYE</span></div>`;
    }else if(game.result){
      const won=game.result.won;
      rsHtml+=`<div class="game-row ${won?'win':'loss'}${game.ribFlip?' rib-flip':''}" style="padding:5px 8px;margin-bottom:2px"><div class="game-opp" style="flex:1"><span style="color:var(--muted);font-size:10px">Rnd ${game.round}</span> vs <span style="white-space:nowrap">${game.opp}</span>${game.ribFlip?' <span class="rib-flip-tag">Turned Around</span>':''}${game.result.scorers?`<div class="game-scorers">${game.result.scorers}</div>`:''}</div><div class="game-score ${won?'win':'loss'}" style="min-width:50px;text-align:right">${game.result.score}</div><span class="game-result-badge ${won?'badge-win':'badge-loss'}">${won?'W':'L'}</span></div>`;
    }
  });
  const _secReg=rsHtml;
  // Pre-compute triesArr (needed for Awards and Player Stats)
  const triesArr=STATE.season.playerTries.map((t,i)=>({slot:i,tries:t,assists:STATE.season.playerAssists[i]})).sort((a,b)=>b.tries-a.tries||b.assists-a.assists);
  // Final Ladder (moved above Player Stats)
  let lh='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">'
    +'<thead><tr style="color:var(--muted);text-align:center"><th style="text-align:left;padding:3px 5px">Team</th>'
    +'<th>W</th><th>L</th><th>PF</th><th>PA</th><th>Diff</th><th style="color:var(--gold)">Pts</th></tr></thead><tbody>';
  s.ladder.forEach((t,i)=>{
    const pos=i+1,isMe=t.name===myTeam();
    const bg=isMe?'background:rgba(241,192,115,0.12);':'';
    const border=pos===8?'border-bottom:2px solid var(--gold);':'';
    const diff=(t.pf||0)-(t.pa||0);
    const teamDisp=isMe?`⭐ ${myTeamHtml()}`:`${fvEmoji(t.name)} ${fvShort(t.name)}`;
    lh+=`<tr style="${bg}${border}text-align:center">`
      +`<td style="text-align:left;padding:3px 5px;font-weight:${isMe?700:400}">${pos}. ${teamDisp}</td>`
      +`<td>${t.wins}</td><td>${24-t.wins}</td>`
      +`<td>${t.pf||'-'}</td><td>${t.pa||'-'}</td>`
      +`<td style="color:${diff>=0?'#22c55e':'#ef4444'}">${diff>=0?'+':''}${diff||'-'}</td>`
      +`<td style="color:var(--gold);font-weight:700">${t.pts}</td></tr>`;
  });
  lh+='</tbody></table></div>';
  const _secLadder=lh;
  // Season Awards
  const topT=triesArr[0];const topA=[...triesArr].sort((a,b)=>b.assists-a.assists)[0];
  const dmTeamStr=dm?(dm.team===myTeam()?`⭐ ${myTeamHtml()}`:dm.team):'';
  const dmCard=dm?`<div class="award-card" style="grid-column:1/-1;display:flex;align-items:center;gap:12px;text-align:left;padding:12px 14px"><div style="font-size:32px">🏅</div><div><div class="a-title" style="margin-bottom:3px">Dally M Medal: Season MVP</div><div class="a-name" style="font-size:15px">${dm.name}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${dmTeamStr} · ${dm.pos}</div></div></div>`:'';
  _rb+=`<div class="results-section"><h3>🌟 Season Awards</h3><div class="awards-grid">${dmCard}<div class="award-card"><div class="a-title">Your Top Try Scorer</div><div class="a-name">${STATE.team[topT?.slot]?.name||'-'}</div><div class="a-stat">${topT?.tries||0} tries</div></div><div class="award-card"><div class="a-title">Your Most Try Assists</div><div class="a-name">${STATE.team[topA?.slot]?.name||'-'}</div><div class="a-stat">${topA?.assists||0} assists</div></div><div class="award-card"><div class="a-title">Premiers</div><div class="a-name">${f.champion?.name?(f.champion.name===myTeam()?myTeamHtml():fvLabel(f.champion.name)):'-'}</div><div class="a-stat">2026 Champions</div></div><div class="award-card"><div class="a-title">Team Rating</div><div class="a-name">${s.rating}/100</div><div class="a-stat">${ratingLabel(s.rating)}</div></div></div></div>`;
  // Expanded Player Stats (moved to bottom)
  const extraStats=generateSeasonStats();
  // Sort by position slot order: FB, LW, LC, RC, RW, FE, HB, P1, HK, P2, SR1, SR2, LK
  const _posSlotOrder=[0,4,3,2,1,5,6,7,8,9,10,11,12];
  const sortedRows=[..._posSlotOrder].map(si=>triesArr.find(r=>r.slot===si)).filter(Boolean);
  let sh=`<div style="overflow-x:auto"><table class="pst-wide"><thead><tr><th class="pst-name">Player</th><th class="pst-pos">Pos</th><th title="Rating" style="min-width:32px">Rtg</th><th title="Tries">T</th><th title="Try Assists">TA</th><th title="Linebreaks">LB</th><th title="Tackles">Tkl</th><th title="Tackle Efficiency">Eff%</th><th title="Tackle Breaks">TB</th><th title="Avg Run Metres per game">RM/g</th><th title="Offloads">Off</th></tr></thead><tbody>`;
  sortedRows.forEach(row=>{
    const p=STATE.team[row.slot];if(!p)return;
    const ex=extraStats[row.slot]||{};
    const _bg=CLUB_COLORS[p.club]||'#1a1a2a';
    const _fg=CLUB_SECONDARY[p.club]||'#fff';
    const _ab=CLUB_ABBR[p.club]||p.club.slice(0,3).toUpperCase();
    const _badge=`<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:4px;background:${_bg};color:${_fg};font-size:6.5px;font-weight:800;letter-spacing:.2px;line-height:1;text-align:center;margin-right:5px;flex-shrink:0">${_ab}</span>`;
    const _rColor=p.rating>=90?'#E8A848':p.rating>=85?'#a3e635':p.rating>=80?'#3b82f6':p.rating>=75?'#9ca3af':'#cd7f32';
    const _isTrib=p.name==='Jai Arrow';
    sh+=`<tr${_isTrib?' class="tr-tribute"':''}><td class="pst-name" style="display:flex;align-items:center">${_badge}${p.name}</td><td class="pst-pos">${displayAbbr(SLOTS[row.slot].abbr)}</td><td style="font-weight:700;color:${_isTrib?'#72BE8F':_rColor}">${p.rating}</td><td>${row.tries}</td><td>${row.assists}</td><td>${ex.lb??'-'}</td><td>${ex.tackles??'-'}</td><td>${ex.eff??'-'}%</td><td>${ex.tb??'-'}</td><td>${ex.rm??'-'}</td><td>${ex.off??'-'}</td></tr>`;
  });
  sh+=`</tbody></table></div><div style="font-size:10px;color:var(--muted);margin-top:6px">T=Tries · TA=Assists · LB=Linebreaks · Tkl=Tackles · Eff%=Tackle Eff · TB=Tackle Breaks · RM/g=Run Metres · Off=Offloads</div>`;
  // The long part folds away (4 Oct 2026, the owner's call): Season Awards stays open above, the rest opens with a tap
  const _fold=(t,inner)=>`<details class="cp-fold"><summary>${t}</summary><div class="cp-fold-in">${inner}</div></details>`;
  _rb+=`<div class="results-section cp-folds">${_fold('📊 Season Summary',_secSum)}${_fold('🏆 Finals Bracket',_secBracket)}`+
    `${_fold(`📅 Regular Season Results: ${s.wins}W ${s.losses}L`,_secReg)}${_fold('📋 Final Ladder: All 18 Teams',_secLadder)}${_fold('📈 Player Stats',sh)}</div>`;
  if (STATE.gameMode === 'pack' && STATE.packAllCards && STATE.packAllCards.length) {
    const bestPull = STATE.packAllCards.reduce((a, b) => b.rating > a.rating ? b : a);
    const starters = STATE.team.filter(Boolean).sort((a, b) => a.rating - b.rating);
    const worstStarter = starters[0];
    // Top 3 pulls by overall rating
    const allCards = [...STATE.packAllCards].sort((a,b) => b.rating - a.rating);
    const top3 = allCards.slice(0,3);
    // Rarity breakdown across all 36 cards
    const rarityCount = {GOLD:0,GREEN:0,BLUE:0,SILVER:0,BRONZE:0};
    allCards.forEach(card => {
      const r = packRarityColor(card.rating);
      rarityCount[r.label] = (rarityCount[r.label]||0) + 1;
    });
    const rarityHTML = [
      {label:'GOLD',count:rarityCount.GOLD,color:'#f1c073'},
      {label:'GREEN',count:rarityCount.GREEN,color:'#a3e635'},
      {label:'BLUE',count:rarityCount.BLUE,color:'#93c5fd'},
      {label:'SILVER',count:rarityCount.SILVER,color:'#9ca3af'},
      {label:'BRONZE',count:rarityCount.BRONZE,color:'#cd7f32'},
    ].filter(r=>r.count>0).map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1a1a2e"><span style="font-size:11px;font-weight:800;color:${r.color}">${r.label}</span><span style="font-size:11px;font-weight:700;color:#ccc">${r.count} card${r.count!==1?'s':''}</span></div>`).join('');
    const top3HTML = top3.map((card,i)=>{
      const r=packRarityColor(card.rating);
      const medal=['🥇','🥈','🥉'][i];
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1a1a2e"><span style="font-size:16px">${medal}</span><span style="font-size:20px;font-weight:900;color:${r.text};font-family:'Inter',sans-serif;min-width:28px">${card.rating}</span><div style="flex:1"><div style="font-size:13px;font-weight:800;color:#fff">${card.name}</div><div style="font-size:10px;color:#666">${CLUBS[card.club]?.name||card.club.charAt(0).toUpperCase()+card.club.slice(1)} · ${card.year}</div></div></div>`;
    }).join('');
    _rb=`<div class="results-section" style="background:linear-gradient(135deg,#0a1530,#0e1040);border:1.5px solid #3b5bdb;border-radius:12px;padding:16px;margin-bottom:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="font-size:20px">📦</span><div><div style="font-size:11px;font-weight:900;letter-spacing:2px;color:#6688ff;text-transform:uppercase">Pack Mode</div><div style="font-size:16px;font-weight:900;color:#fff;font-family:'Inter',sans-serif">Your Pack Summary</div></div></div><div style="font-size:10px;font-weight:900;letter-spacing:1.5px;color:#6688ff;text-transform:uppercase;margin-bottom:8px">Top 3 Pulls</div>${top3HTML}<div style="font-size:10px;font-weight:900;letter-spacing:1.5px;color:#6688ff;text-transform:uppercase;margin:12px 0 8px">Rarity Breakdown · ${allCards.length} Cards</div>${rarityHTML}${worstStarter?`<div style="margin-top:10px;font-size:10px;font-weight:900;letter-spacing:1.5px;color:#666;text-transform:uppercase;margin-bottom:4px">Lowest Rated Starter</div><div style="font-size:13px;color:#ccc">${worstStarter.rating} · <strong style="color:#fff">${worstStarter.name}</strong> (${worstStarter.year||''})</div>`:''}</div>`+_rb;
  }
  body.innerHTML=_rb;

  const rtl=document.getElementById('resultsTeamLabel');
  if(rtl) rtl.textContent=`${myTeam()} · Rating: ${s.rating}`;
  const isWoodenSpoon=s.myLadderPos===18;
  const _fW2=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;
  const _fL2=f.myTeamInFinals?f.myJourney.filter(j=>!j.won).length:0;
  if(typeof gtag!=='undefined')gtag('event','season_result',{event_category:'game',wins:s.wins+_fW2,losses:s.losses+_fL2,ladder_pos:s.myLadderPos,squad_rating:s.rating,is_champion:f.isChampion?'yes':'no',is_27_0:total27_0?'yes':'no',is_wooden_spoon:isWoodenSpoon?'yes':'no'});
  if(total27_0){if(typeof gtag!=='undefined')gtag('event','celebration_shown',{event_category:'game',result:'27_0'});show270Celebration(()=>showScreen('results'));}
  else if(isWoodenSpoon){if(typeof gtag!=='undefined')gtag('event','wooden_spoon_shown',{event_category:'game',ladder_pos:s.myLadderPos});showScreen('results');showWoodenSpoonAnimation();}
  else{showScreen('results');}
}

function showWoodenSpoonAnimation(){
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:9990;pointer-events:none;overflow:hidden';
  document.body.appendChild(ov);

  // Spoon drop
  const spoon=document.createElement('div');
  spoon.textContent='🥄';
  spoon.style.cssText='position:absolute;left:50%;top:-120px;transform:translateX(-50%);font-size:90px;filter:drop-shadow(0 0 24px rgba(205,127,50,0.8));transition:top 1.4s cubic-bezier(.22,1,.36,1),opacity .5s';
  ov.appendChild(spoon);

  // Text banner
  const banner=document.createElement('div');
  banner.innerHTML='<div style="font-size:22px;font-weight:900;color:#cd7f32;letter-spacing:1px;margin-bottom:6px">WOODEN SPOON</div><div style="font-size:13px;color:#aaa;font-weight:600">Last on the ladder. Western Suburbs would be proud.</div>';
  banner.style.cssText='position:absolute;bottom:-80px;left:0;right:0;text-align:center;padding:20px;background:linear-gradient(0deg,rgba(0,0,0,0.85),transparent);transition:bottom 1s ease .8s';
  ov.appendChild(banner);

  // Particles (small spoons floating up)
  for(let i=0;i<12;i++){
    const p=document.createElement('div');
    p.textContent='🥄';
    p.style.cssText=`position:absolute;font-size:${14+Math.random()*18}px;left:${Math.random()*100}%;bottom:-30px;opacity:0;transition:bottom ${1.8+Math.random()*1.4}s ease ${0.4+Math.random()*1.2}s,opacity .4s ease ${0.4+i*0.1}s`;
    ov.appendChild(p);
    requestAnimationFrame(()=>{requestAnimationFrame(()=>{p.style.bottom=(40+Math.random()*55)+'%';p.style.opacity=(0.3+Math.random()*0.5).toString();});});
  }

  requestAnimationFrame(()=>{requestAnimationFrame(()=>{
    spoon.style.top='18%';
    banner.style.bottom='0';
  });});

  // Click to dismiss
  setTimeout(()=>{
    ov.style.pointerEvents='auto';ov.style.cursor='pointer';
    ov.onclick=()=>{ov.style.opacity='0';ov.style.transition='opacity .4s';setTimeout(()=>ov.remove(),400);};
  },1800);
  setTimeout(()=>{ov.style.opacity='0';ov.style.transition='opacity .6s';setTimeout(()=>ov.remove(),600);},4500);
}

function ratingLabel(r){if(r>=95)return'All-Time Great';if(r>=90)return'Dynasty-Level';if(r>=85)return'Finals Contender';if(r>=80)return'Solid Side';if(r>=75)return'Mid-Table';return'Rebuilding Year';}

function winPercentile(w){
  if(w>=26)return'That record puts you in the top 1% of all players.';
  if(w>=25)return'That record puts you in the top 3% of all players.';
  if(w>=24)return'That record puts you in the top 8% of all players.';
  if(w>=23)return'That puts you in the top 15% of all players.';
  if(w>=22)return'That puts you in the top 25% of all players.';
  if(w>=21)return'That puts you in the top 35% of all players.';
  if(w>=20)return'That puts you in the top 45% of all players.';
  if(w>=19)return'That puts you in the top 55% of all players.';
  if(w>=18)return'That puts you in the top 65% of all players.';
  if(w>=17)return'That puts you in the top 72% of all players.';
  if(w>=16)return'That puts you in the top 80% of all players.';
  if(w>=15)return'That puts you in the bottom 35% of all players.';
  if(w>=14)return'That puts you in the bottom 25% of all players.';
  if(w>=13)return'That puts you in the bottom 18% of all players.';
  if(w>=12)return'That puts you in the bottom 12% of all players.';
  if(w>=11)return'That puts you in the bottom 8% of all players.';
  if(w>=10)return'That puts you in the bottom 5% of all players.';
  return'That puts you in the bottom 3% of all players.';
}
// The line under the score (4 Oct 2026, the owner's call: one line, so the buttons sit higher): the story's first sentence
// and where the record ranks. A first sentence that only repeats the score ("12 wins.", "6-18.") is skipped, and a very
// short one ("Runner-up.") takes the next one too. A 27-0 keeps its whole story
function shortNarrative(text,is27,totalW){
  if(is27) return text;
  const pct=winPercentile(totalW), body=pct&&text.endsWith(' '+pct)?text.slice(0,-(pct.length+1)):text;
  const parts=body.match(/[^.!?]+[.!?]+(?=\s|$)/g)||[body];
  let i=parts.length>1&&/^\s*\d+(-\d+| wins?)\.$/.test(parts[0])?1:0, out=parts[i].trim();
  while(out.length<24&&parts[i+1]) out+=' '+parts[++i].trim();
  return out.replace(/\b1 wins\b/g,'1 win')+(pct&&body!==text?' '+pct:'');
}
function generateNarrative(s,f,is27,totalW,totalL){
  const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
  const pct=' '+winPercentile(totalW);
  const fw=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;
  const lastRound=f.myJourney&&f.myJourney.length?f.myJourney[f.myJourney.length-1].round:'';
  if(is27) return pick([
    'Unbelievable. 27 games, 27 wins. The last team to go undefeated in Rugby League was St George in 1959. No one has done it since. Until now.',
    'Perfect. Absolutely perfect. Not a blemish on the record. No team has gone undefeated in the NRL era. Your team just changed that.',
    'Everyone said 27-0 was impossible. The last undefeated season in Rugby League history was 1959. You just ended a 60-plus year wait.',
    'Immortal. St George won 11 straight premierships and never went 27-0. South Sydney have 21 titles and never went 27-0. You did.',
    '27-0. Only six teams in all of Rugby League history have ever gone undefeated in a season. All of them before 1960. Your team just wrote a new chapter.',
    'The 1925 South Sydney Rabbitohs are the only team in Rugby League history to win every single game without a draw. 100 years later, your team just matched that standard.',
    'South Sydney went undefeated in 1925. St George in 1959. No one since. Until your team just ended 65-plus years of waiting.'
  ]);
  if(f.isChampion) return pick([
    `After a ${s.wins}-win regular season, your team battled through the Finals to lift the trophy. Premiers. Now come back and chase the Rabbitohs all-time record of 21 premierships.${pct}`,
    `${totalW} wins and a premiership. St George won 11 consecutive premierships between 1956 and 1966 and never once went undefeated through a full season. You've won the title. Now come back and chase 27-0.${pct}`,
    `The trophy is yours. A ${s.wins}-${s.losses} regular season and you delivered when it mattered most. The 2013 Roosters kept the opposition scoreless 6 times in a season. Your team has that same ruthless edge.${pct}`,
    `Premiers. South Sydney hold the all-time record with 21 premierships. Your team has the title. Now come back and chase 27-0.${pct}`,
    `Unbothered. Unmatched. Champions. Now time to chase the Rabbitohs all-time record of 21 premierships since 1908. Come back and go again.${pct}`
  ]);
  if(lastRound==='GRAND FINAL') return pick([
    `So close. A ${totalW}-win season and you made the grand final but couldn't finish the job. Gut-wrenching. Come back and chase 27-0. Only six teams in Rugby League history have ever gone undefeated through a full season.${pct}`,
    `Grand final appearance. ${totalW} wins all year and it ended in heartbreak at the last hurdle. The Roosters hold the record for most runners-up with 15. You are in good company.${pct}`,
    `You made it to the big dance but couldn't lift the trophy. A ${totalW}-${totalL} season to be proud of. The real challenge is 27-0. The last team to go undefeated through a full season was St George in 1959.${pct}`,
    `Runner-up. The hardest place to finish. Your team gave everything in a brilliant ${totalW}-win year.${pct}`
  ]);
  if(lastRound==='Preliminary Finals') return pick([
    `So close to the grand final. A ${s.wins}-win regular season and ${fw===1?"one finals win":"two finals wins"} before the dream ended.${pct}`,
    `Preliminary finalist. Your squad showed genuine class through ${s.wins} regular season wins. Just ran out of steam. Don't forget: since 1908 only six teams in Rugby League history have ever gone undefeated through a full season. The last was St George in 1959. Keep trying.${pct}`,
    `One win away from the grand final. A ${totalW}-${totalL} campaign that will sting for a while.${pct}`,
    `The prelim was as far as it went. But a ${s.wins}-win regular season proves your team is the real deal.${pct}`
  ]);
  if(lastRound==='Semi Finals') return pick([
    `Made the semis and won ${fw} finals game${fw!==1?'s':''}. A ${s.wins}-win regular season. Solid, but unfinished business.${pct}`,
    `Semi-finalist. The squad competed hard across ${s.wins} wins. Just couldn't push through to the pointy end.${pct}`,
    `A ${s.wins}-win season with some finals action. The team had something, just not quite enough.${pct}`,
    `Semi final exit. ${s.wins} wins in the regular season sets a decent foundation. Spin again and go deeper.${pct}`
  ]);
  if(f.myTeamInFinals) return pick([
    `Made the finals but bowed out in week one after ${s.wins} regular season wins. The bracket was brutal.${pct}`,
    `Week one and done. ${s.wins} wins got you into the eight. Just couldn't survive the first cut.${pct}`,
    `Qualified but fell at the first hurdle. A ${s.wins}-win regular season deserved more.${pct}`,
    `Into the finals, out in week one. A ${totalW}-${totalL} season with plenty to build on next time.${pct}`
  ]);
  if(s.wins>=20) return pick([
    `${s.wins} wins in the regular season, dominant, but the finals dream was over before it started. Agonising.${pct}`,
    `Top of the league all year with ${s.wins} wins and couldn't crack the eight. That one hurts.${pct}`,
    `${s.wins} wins and no finals? The 2001 Parramatta Eels scored 943 points in a season and still didn't win the title. Dominant regular seasons mean nothing without October footy.${pct}`,
    `Dominant all year. ${s.wins} wins. But the draw had other plans. Should have been a finals side.${pct}`
  ]);
  if(s.wins>=14) return pick([
    `A competitive ${s.wins}-win season. Hovered around finals contention. This squad has real potential.${pct}`,
    `${s.wins} wins is respectable. Your team wasn't quite elite but showed plenty of promise. Remember, since 1908 only six teams in Rugby League history have gone undefeated through a full season. The last was St George in 1959. Keep spinning.${pct}`,
    `Solid rather than spectacular. ${s.wins} wins, some great moments, but the finals remained out of reach.${pct}`,
    `On the fringes all season with ${s.wins} wins. A tweak or two in the draft could change everything.${pct}`
  ]);
  if(s.wins>=10) return pick([
    `${s.wins} wins. Competed hard but couldn't crack the top eight. Rebuild time. The last team to go undefeated through a full season of Rugby League was St George way back in 1959. Since then, no one has managed it. Keep at it.${pct}`,
    `A frustrating ${totalW}-${totalL} season. There was fight in this squad, just not enough firepower.${pct}`,
    `${s.wins} wins. Competitive but ultimately not enough. The eight was a bridge too far this time.${pct}`,
    `Mid-table and stuck. ${s.wins} wins shows the squad can compete. You just need more of everything.${pct}`
  ]);
  if(s.wins>=6) return pick([
    `${s.wins} wins. That is rough. The draft didn't go your way at all. Spin again and go again. Only six teams in Rugby League history have ever gone undefeated through a full season since 1908. The last was St George in 1959. You've got time.${pct}`,
    `${totalW}-${totalL}. Your team was never going to trouble the top eight. Try a different club.${pct}`,
    `${s.wins} wins. Not much to show for it. The draft gods were unkind.${pct}`,
    `That's a spoon contender right there. ${s.wins} wins and not much else. Dust yourself off.${pct}`
  ]);
  return pick([
    `${s.wins} wins. That's CAST. Absolutely CAST. The draft could not have gone much worse than this.${pct}`,
    `${totalW}-${totalL}. That's CAST. Wooden spoon territory. Western Suburbs Magpies conceded 944 points in a single season in 1999. Now you know how they felt.${pct}`,
    `Mate, that's CAST. ${s.wins} wins from ${s.wins+s.losses} games. Only three clubs in history have failed to win a single match all season. Your team is flirting with that list.${pct}`,
    `${s.wins} wins. CAST. Completely and utterly CAST. The NRL would have sacked the coach by round three.${pct}`
  ]);
}

function confirmReset(){
  if(confirm('Restart the game? Your current team will be lost.')) resetGame();
}
function resetGame(){
  if(typeof gtag!=='undefined')gtag('event','new_season_started',{event_category:'game'});
  const _lastMode=STATE.gameMode||'classic';
  STATE={team:Array(13).fill(null),takenNames:new Set(),currentSpin:null,pendingPlayer:null,season:null,spinPickedThisSpin:false,teamName:'My Team',gameMode:_lastMode,packs:[],packIdx:0,packAllCards:[],packPlayers:[]};
  const _rtni=document.getElementById('teamNameInput');
  if(_rtni){try{const _sn=localStorage.getItem('27_teamName');_rtni.value=(_sn&&_sn.toUpperCase()!=='NRLFANATIC'?_sn:'');}catch(e){_rtni.value='';}  _rtni.style.borderColor='#333';}
  if(typeof _autoTimer!=='undefined'&&_autoTimer){clearInterval(_autoTimer);_autoTimer=null;}
  const _apb=document.getElementById('autoPlayBtn'); if(_apb) _apb.textContent='⚡ Auto Play';
  const rb=document.getElementById('resultsBody'); if(rb) rb.innerHTML='';
  const rh=document.getElementById('resultHero'); if(rh) rh.innerHTML='';
  const fl=document.getElementById('fixtureList'); if(fl) fl.innerHTML='';
  const ps=document.getElementById('playerSection');
  if(ps) ps.innerHTML='<div style="margin:20px 16px;padding:16px;border-radius:12px;background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #2a2a4a;text-align:center"><div style="font-size:28px;margin-bottom:8px">⬆️</div><div style="color:#f5c518;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Spin to Select a Player</div><div style="color:var(--muted);font-size:11px">Tap the button above to get started</div></div>';
  const sv=document.getElementById('spinClubVal'); if(sv) sv.textContent='-';
  const sy=document.getElementById('spinYearVal'); if(sy) sy.textContent='-';
  _resetClubColor();
  const sbn=document.getElementById('spinBtn'); if(sbn){sbn.disabled=false;}
  renderField();
  showScreen('setup');
  selectMode(STATE.gameMode||'classic');
}

// ════════════════════════════════════════════════════════
// SHARE CARD
// ════════════════════════════════════════════════════════
let _shareCanvas=null;

let _smFormat='4x5';

function showShareCard(){
  if(typeof gtag!=='undefined'){gtag('event','share_card_opened',{event_category:'engagement'});gtag('event','share_tapped',{event_category:'engagement'});}
  _smFormat='4x5';
  document.querySelectorAll('.sm-fmt-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('sm-fmt-4x5').classList.add('active');
  document.getElementById('shareModal').classList.add('open');
  document.body.style.overflow='hidden';
  try{
    _shareCanvas=buildShareCanvas('4x5');
    document.getElementById('sm-preview').src=_shareCanvas.toDataURL('image/png');
  }catch(e){console.warn('Share canvas error:',e);}
}
function smClose(){document.getElementById('shareModal').classList.remove('open');document.body.style.overflow='';}

let _deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();_deferredInstallPrompt=e;const btn=document.getElementById('installPromptBtn');if(btn)btn.style.display='block';});
function showInstallModal(){const m=document.getElementById('installModal');if(m){m.style.display='flex';document.body.style.overflow='hidden';}}
function closeInstallModal(){const m=document.getElementById('installModal');if(m){m.style.display='none';document.body.style.overflow='';}}
function closePackPromoModal(){const m=document.getElementById('packPromoModal');if(m){m.style.display='none';document.body.style.overflow='';}try{localStorage.setItem('27_packPromoSeen_v2','1');}catch(e){}}
function tryPackModeNow(){
  closePackPromoModal();
  if(typeof selectMode==='function') selectMode('pack');
  if(typeof startSelectedMode==='function') startSelectedMode(); // a mode starts in one tap (no Spin the Wheel step)
}
function maybeShowPackPromoModal(){
  try{ if(localStorage.getItem('27_packPromoSeen_v2')) return; }catch(e){return;}
  const setupScreen=document.getElementById('setup');
  if(!setupScreen || !setupScreen.classList.contains('active')) return;
  const m=document.getElementById('packPromoModal');
  if(m){ setTimeout(()=>{ m.style.display='flex'; document.body.style.overflow='hidden'; }, 900); }
}

function triggerPWAInstall(){if(_deferredInstallPrompt){_deferredInstallPrompt.prompt();_deferredInstallPrompt.userChoice.then(function(){_deferredInstallPrompt=null;closeInstallModal();});}}
function smSetFormat(fmt){
  _smFormat=fmt;
  _shareCanvas=buildShareCanvas(fmt);
  document.getElementById('sm-preview').src=_shareCanvas.toDataURL('image/png');
  document.querySelectorAll('.sm-fmt-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(fmt==='4x5'?'sm-fmt-4x5':'sm-fmt-story').classList.add('active');
}
function smShareText(){
  const s=STATE.season,f=s.finals;
  const fw=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;
  const fl=f.myTeamInFinals?f.myJourney.filter(j=>!j.won).length:0;
  const tw=s.wins+fw,tl=s.losses+fl;
  if(tw===27&&tl===0)return'I just went 27-0 with my ultimate NRL era team. Undefeated. Can you do the same? Play at 27-0.app';
  return`I just went ${tw}-${tl} with my ultimate NRL era team. Think you can go 27-0? Play at 27-0.app`;
}
function smShareImage(){
  if(!_shareCanvas)return;
  _shareCanvas.toBlob(async blob=>{
    if(navigator.share&&blob){
      try{
        const file=new File([blob],'27-0-season.png',{type:'image/png'});
        await navigator.share({title:'27-0 NRL Era Team',text:smShareText(),files:[file]});
        if(typeof gtag!=='undefined')gtag('event','share_completed',{event_category:'engagement',method:'native_share'});
        return;
      }catch(e){}
    }
    const a=document.createElement('a');a.download=`27-0-season-${Date.now()}.png`;a.href=_shareCanvas.toDataURL('image/png');a.click();
    if(typeof gtag!=='undefined')gtag('event','share_completed',{event_category:'engagement',method:'download'});
  });
}
function smSocial(p){
  const t=smShareText(),u='https://castgames.com.au/27-0/',et=encodeURIComponent(t+' '+u),eu=encodeURIComponent(u);
  if(p==='instagram'){smShareImage();return;}
  const links={x:`https://twitter.com/intent/tweet?text=${et}`,whatsapp:`https://wa.me/?text=${et}`,facebook:`https://www.facebook.com/sharer/sharer.php?u=${eu}&quote=${encodeURIComponent(t)}`};
  if(links[p])window.open(links[p],'_blank');
}
function smSaveImage(){
  if(!_shareCanvas)return;
  const a=document.createElement('a');
  a.download=`27-0-season-${Date.now()}.png`;
  a.href=_shareCanvas.toDataURL('image/png');
  a.click();
}
function smCopyLink(){
  const txt=smShareText()+' https://castgames.com.au/27-0/';
  const btn=document.getElementById('sm-copy-btn');
  const orig=btn.innerHTML;
  function done(){btn.innerHTML='&#x2705; Copied!';setTimeout(()=>btn.innerHTML=orig,2200);}
  if(navigator.clipboard){navigator.clipboard.writeText(txt).then(done).catch(()=>{fbCopy(txt);done();});}
  else{fbCopy(txt);done();}
}
function fbCopy(t){const i=document.createElement('textarea');i.value=t;document.body.appendChild(i);i.select();document.execCommand('copy');document.body.removeChild(i);}

const _CAST_LOGO_B64='assets/img/cast-logo-sm.png';
const _TSHIRT_B64='assets/img/cast-logo-md.png';
function generateShareCard(){
  const s=STATE.season,f=s.finals;
  const sub=calcSubRatings();
  const dm=getDallyMWinner(s,f);
  const finalsW=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;
  const finalsL=f.myTeamInFinals?f.myJourney.filter(j=>!j.won).length:0;
  const totalW=s.wins+finalsW,totalL=s.losses+finalsL;
  const finalsWins27=f.myTeamInFinals?f.myJourney.filter(j=>j.won).length:0;const total27_0=s.wins===24&&s.losses===0&&f.isChampion&&f.myJourney.every(j=>j.won)&&(s.wins+finalsWins27)===27;

  // Top scorers
  const tArr=STATE.season.playerTries.map((t,i)=>({slot:i,tries:t,assists:STATE.season.playerAssists[i]}));
  const topT=[...tArr].sort((a,b)=>b.tries-a.tries)[0];
  const topA=[...tArr].sort((a,b)=>b.assists-a.assists)[0];

  // Finals label
  let finalsLabel,finalsColor,finalsGlow=false;
  if(total27_0){finalsLabel='27-0 INVINCIBLE';finalsColor='#FFD700';finalsGlow=true;}
  else if(f.isChampion){finalsLabel='PREMIERS';finalsColor='#E8A848';finalsGlow=true;}
  else if(f.myTeamInFinals){
    const lr=f.myJourney[f.myJourney.length-1]?.round||'';
    if(lr==='GRAND FINAL')finalsLabel='GRAND FINALIST';
    else if(lr==='Preliminary Finals')finalsLabel='PRELIMINARY FINALIST';
    else if(lr==='Semi Finals')finalsLabel='SEMI-FINALIST';
    else finalsLabel='TOP EIGHT';
    finalsColor='#ffffff';
  } else {
    finalsLabel=s.myLadderPos<=4?'TOP FOUR':`${s.myLadderPos}${ordinal(s.myLadderPos)} ON LADDER`;
    finalsColor='#777788';
  }

  const eraLabel=STATE.gameMode==='pack'?'Pack Mode':STATE.yearFrom===1998&&STATE.yearTo===2026?'All-Time':STATE.yearFrom===STATE.yearTo?String(STATE.yearFrom):`${STATE.yearFrom} to ${STATE.yearTo}`;
  const W=400,EXTRA=total27_0?68:0,H=860+EXTRA;
  const canvas=document.createElement('canvas');
  canvas.width=W*2;canvas.height=H*2;
  const ctx=canvas.getContext('2d');
  ctx.scale(2,2);

  // ── helpers ──────────────────────────────────────────
  function rrect(x,y,w,h,r,fill,stroke,lw){
    ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
    if(fill!=null){ctx.fillStyle=fill;ctx.fill();}
    if(stroke!=null){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1;ctx.stroke();}
  }
  function tx(str,x,y,font,color,align,base){
    ctx.font=font;ctx.fillStyle=color;
    ctx.textAlign=align||'left';ctx.textBaseline=base||'top';
    ctx.fillText(String(str),x,y);
  }
  function hdiv(y,col){
    ctx.strokeStyle=col||'#222233';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(W-20,y);ctx.stroke();
  }
  function lbl(str,x,y){tx(str,x,y,'700 9px system-ui,sans-serif','#444455');}
  function rColor(r){return r>=90?'#E8A848':r>=85?'#4ade80':r>=75?'#ffffff':'#888899';}
  const POS_C={FB:'#3b82f6',W:'#8b5cf6',C:'#10b981',FE:'#d97706',HB:'#ec4899',P:'#ef4444',HK:'#f97316',SR:'#64748b',LK:'#475569'};
  const ABBRS=['FB','RW','RC','LC','LW','5/8','HB','P','HK','P','SR','LK','SR'];
  const PTYP=['FB','W','C','C','W','FE','HB','P','HK','P','SR','LK','SR'];

  // ── BACKGROUND ───────────────────────────────────────
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#090910');bg.addColorStop(1,'#07070e');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const g1=ctx.createRadialGradient(0,0,0,0,0,250);
  g1.addColorStop(0,'rgba(106,76,197,0.16)');g1.addColorStop(1,'rgba(106,76,197,0)');
  ctx.fillStyle=g1;ctx.fillRect(0,0,250,250);
  if(finalsGlow){
    const g2=ctx.createRadialGradient(W,H,0,W,H,260);
    g2.addColorStop(0,'rgba(241,192,115,0.1)');g2.addColorStop(1,'rgba(241,192,115,0)');
    ctx.fillStyle=g2;ctx.fillRect(W-260,H-260,260,260);
  }

  let y=18;
  // Pre-load Cast logo
  const _castImg=new Image();_castImg.src=_CAST_LOGO_B64;
  const _logoImg=new Image();_logoImg.src='assets/img/27-0-logo.png';
  const _tshirtImg=new Image();_tshirtImg.src=_TSHIRT_B64;

  // ── HEADER ───────────────────────────────────────────
  try{const _lW=110,_lH=Math.round(110*(358/601));ctx.drawImage(_logoImg,20,y,_lW,_lH);}catch(e){tx('27-0',20,y,'900 26px system-ui,sans-serif','#ffffff');}
  // OVR badge
  const ovrTxt=`OVR ${s.rating}`;ctx.font='700 10px system-ui,sans-serif';
  const ovrW=ctx.measureText(ovrTxt).width+18;
  rrect(W-20-ovrW,y,ovrW,22,11,'#141428','#6a4cc5',1.5);
  tx(ovrTxt,W-20-ovrW/2,y+11,'700 10px system-ui,sans-serif','#ffffff','center','middle');
  // Era badge
  ctx.font='600 9px system-ui,sans-serif';
  const eraW=ctx.measureText(eraLabel).width+16;
  rrect(W-20-ovrW-7-eraW,y,eraW,22,11,'#141428','#2a2a3e',1);
  tx(eraLabel,W-20-ovrW-7-eraW/2,y+11,'600 9px system-ui,sans-serif','#778','center','middle');
  // T-shirt logo lockup below '27-0'
  try{const tW=80,tH=40;ctx.drawImage(_tshirtImg,20,y+26,tW,tH);}catch(e){}
  y+=78;

  // ── TEAM NAME ────────────────────────────────────────
  const tname=(STATE.teamName||'My Team').toUpperCase();
  ctx.font='900 20px system-ui,sans-serif';
  const tnW=ctx.measureText(tname).width,maxW=W-40;
  const tnFont=tnW>maxW?`900 ${Math.floor(20*maxW/tnW)}px system-ui,sans-serif`:'900 20px system-ui,sans-serif';
  tx(tname,W/2,y,tnFont,'#ffffff','center');
  y+=28;

  // ── RECORD ───────────────────────────────────────────
  tx(`${totalW}-${totalL}`,W/2,y,'900 64px system-ui,sans-serif','#ffffff','center');
  y+=70;
  tx('WON  ·  LOST',W/2,y,'400 10px system-ui,sans-serif','#444455','center');
  y+=20;

  // ── RESULT BADGE ─────────────────────────────────────
  ctx.font='700 11px system-ui,sans-serif';
  const bw=ctx.measureText(finalsLabel).width+30;
  const bx=(W-bw)/2;
  if(finalsGlow)rrect(bx,y,bw,26,13,'rgba(241,192,115,0.12)','#E8A848',1.5);
  else if(f.myTeamInFinals)rrect(bx,y,bw,26,13,'rgba(255,255,255,0.04)','#3a3a4e',1);
  else rrect(bx,y,bw,26,13,'rgba(60,60,80,0.08)','#2a2a3e',1);
  tx(finalsLabel,W/2,y+13,'700 11px system-ui,sans-serif',finalsColor,'center','middle');
  y+=36;

  // ── STATS ROW ────────────────────────────────────────
  const pts=s.wins*2,diff=s.pf-s.pa;
  const sCols=[
    {v:String(pts),l:'POINTS',c:'#E8A848'},
    {v:`${s.myLadderPos}${ordinal(s.myLadderPos)}`,l:'LADDER',c:'#E8A848'},
    {v:`${diff>=0?'+':''}${diff}`,l:'DIFF',c:diff>=0?'#4ade80':'#f87171'},
    {v:String(s.tries),l:'TRIES',c:'#E8A848'},
  ];
  const cw=W/4;
  sCols.forEach((col,i)=>{
    const cx=cw*i+cw/2;
    tx(col.v,cx,y+2,'700 17px system-ui,sans-serif',col.c,'center');
    tx(col.l,cx,y+24,'400 8px system-ui,sans-serif','#444455','center');
  });
  y+=44;
  hdiv(y);y+=14;

  // ── SQUAD ────────────────────────────────────────────
  lbl('YOUR SQUAD',20,y);y+=13;
  const RH=23,MID=W/2-3;
  const leftS=[0,1,2,3,4,5,6],rightS=[7,8,9,10,11,12];
  const sqTop=y;
  [[leftS,20,MID-20-20],[rightS,MID+7,W-20-(MID+7)]].forEach(([slots,xBase,colW])=>{
    slots.forEach((si,ri)=>{
      const p=STATE.team[si],ry=sqTop+ri*RH;
      const pc=POS_C[PTYP[si]]||'#555';
      // pos badge
      rrect(xBase,ry+3,26,16,4,pc+'28',pc,1);
      tx(ABBRS[si],xBase+13,ry+11,'700 7px system-ui,sans-serif',pc,'center','middle');
      if(p){
        // name (truncate)
        const rW=24,nameMaxW=colW-32;
        ctx.font='500 11px system-ui,sans-serif';
        let nm=p.name;
        while(ctx.measureText(nm).width>nameMaxW&&nm.length>4)nm=nm.slice(0,-2)+'…';
        tx(nm,xBase+30,ry+11,'500 11px system-ui,sans-serif','#ccd','left','middle');
        tx(p.rating,xBase+colW,ry+11,'700 11px system-ui,sans-serif',rColor(p.rating),'right','middle');
      } else {
        tx('-',xBase+32,ry+11,'400 11px system-ui,sans-serif','#333','left','middle');
      }
    });
  });
  y=sqTop+leftS.length*RH+6;
  hdiv(y);y+=14;

  // ── RATINGS ──────────────────────────────────────────
  lbl('RATINGS',20,y);y+=12;
  const rItems=[
    {l:'OVR',v:s.rating},
    {l:'Backs',v:sub.backs??'-'},
    {l:'Fwds',v:sub.forwards??'-'},
    {l:'Spine',v:sub.spine??'-'},
  ];
  const rcw=(W-40)/4;
  rItems.forEach((r,i)=>{
    const rx=20+rcw*i,rv=rcw-8;
    rrect(rx,y,rv,48,7,'#0e0e1c','#1e1e2e',1);
    const rc=typeof r.v==='number'?rColor(r.v):'#888899';
    tx(r.v,rx+rv/2,y+24,'700 19px system-ui,sans-serif',rc,'center','middle');
    tx(r.l,rx+rv/2,y+40,'400 9px system-ui,sans-serif','#444455','center','middle');
  });
  y+=58;
  hdiv(y);y+=14;

  // ── AWARDS ───────────────────────────────────────────
  lbl('SEASON AWARDS',20,y);y+=12;
  const awards=[
    {icon:'🏅',title:'Dally M Medal',name:dm?.name||'-',stat:dm?.pos||''},
    {icon:'🔴',title:'Top Try Scorer',name:STATE.team[topT?.slot]?.name||'-',stat:topT?`${topT.tries} tries`:''},
    {icon:'🎯',title:'Most Try Assists',name:STATE.team[topA?.slot]?.name||'-',stat:topA?`${topA.assists} assists`:''},
  ];
  awards.forEach(a=>{
    rrect(20,y,W-40,38,7,'#0c0c1a','#1a1a2c',1);
    tx(a.icon,34,y+19,'14px system-ui,sans-serif','#fff','left','middle');
    tx(a.title,54,y+10,'600 9px system-ui,sans-serif','#444466','left','top');
    tx(a.name,54,y+24,'700 12px system-ui,sans-serif','#dde','left','top');
    if(a.stat)tx(a.stat,W-32,y+26,'600 10px system-ui,sans-serif','#E8A848','right','middle');
    y+=46;
  });

  // ── 27-0 BANNER ──────────────────────────────────────
  if(total27_0){
    y+=4;
    ctx.beginPath();
    const br=10,bx2=20,by2=y,bw2=W-40,bh2=52;
    ctx.moveTo(bx2+br,by2);ctx.lineTo(bx2+bw2-br,by2);ctx.arcTo(bx2+bw2,by2,bx2+bw2,by2+br,br);
    ctx.lineTo(bx2+bw2,by2+bh2-br);ctx.arcTo(bx2+bw2,by2+bh2,bx2+bw2-br,by2+bh2,br);
    ctx.lineTo(bx2+br,by2+bh2);ctx.arcTo(bx2,by2+bh2,bx2,by2+bh2-br,br);
    ctx.lineTo(bx2,by2+br);ctx.arcTo(bx2,by2,bx2+br,by2,br);ctx.closePath();
    const bng=ctx.createLinearGradient(bx2,by2,bx2+bw2,by2);
    bng.addColorStop(0,'rgba(106,76,197,0.28)');bng.addColorStop(0.5,'rgba(241,192,115,0.18)');bng.addColorStop(1,'rgba(106,76,197,0.28)');
    ctx.fillStyle=bng;ctx.fill();ctx.strokeStyle='#E8A848';ctx.lineWidth=1.5;ctx.stroke();
    tx('🏆 27-0 INVINCIBLE',W/2,y+14,'900 14px system-ui,sans-serif','#FFD700','center');
    tx('An achievement that may never be replicated.',W/2,y+33,'400 9px system-ui,sans-serif','#aaa','center');
    y+=62;
  }

  // ── FOOTER: Cast Patrol branding lockup ─────────────
  hdiv(y);y+=16;
  // Cast logo centred, large
  const fLogoW=90,fLogoH=45;
  try{ctx.drawImage(_castImg,(W-fLogoW)/2,y,fLogoW,fLogoH);}catch(e){}
  y+=fLogoH+8;
  tx('THE CAST PATROL',W/2,y,'900 12px system-ui,sans-serif','#f1c073','center');
  y+=16;
  tx('27-0.app',W/2,y,'600 9px system-ui,sans-serif','#6666aa','center');

  return canvas;
}

showScreen('setup');
selectMode('classic');
// maybeShowPackPromoModal removed
// Re-render field on resize so circle sizes stay correct at any viewport width
(function(){
  let _resizeTimer;
  window.addEventListener('resize', function(){
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(function(){ _cachedFieldSize = null;
      const packSquad = document.getElementById('pack-squad');
      if (packSquad && packSquad.classList.contains('active')) { renderPackSquad(); }
      const draftScreen = document.getElementById('draft');
      if (draftScreen && draftScreen.classList.contains('active') && typeof renderField === 'function') { renderField(); }
    }, 150);
  });
})();
try{const _sn=localStorage.getItem('27_teamName');if(_sn&&_sn.toUpperCase()!=='NRLFANATIC'){const _i=document.getElementById('teamNameInput');if(_i)_i.value=_sn;}else if(_sn?.toUpperCase()==='NRLFANATIC'){localStorage.removeItem('27_teamName');}}catch(e){}
// Back from another page (the browser's back-forward cache): a game in progress stays exactly where it was (11 Oct 2026,
// the review: Back from the CAST Pass checkout on iPhone dropped a half-built team and could leave the Daily on);
// anywhere else goes home as before
window.addEventListener('pageshow', function(e){
  if(!e.persisted) return;
  var on=document.querySelector('.screen.active'), id=on?on.id:'';
  if(['draft','squad-complete','season','wc-season','finals-viewer','pack-setup','pack-opening','pack-squad','pack-squad-complete'].indexOf(id)>=0) return;
  if(id==='setup') return; // already home
  resetGame(); // a finished game's results: home the usual way (the Daily and the World Cup timers end with it)
});
