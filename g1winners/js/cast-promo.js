/* Promos both games read: the one list for each (the master copy is shared/cast-account/cast-promo.js; tools/sync_shared.py
   copies it to js/cast-promo.js on both sites, loaded before the game scripts). A game dealt while a promo runs carries
   the promo's mark at the start of its seed (three letters), so a friend's challenge plays it the same way even after
   the promo ends (the server allows 6 to 16 lowercase letters and numbers, and a 12-character seed plus a mark is 15).
   The Daily Challenge stays the same for everyone in both games. window.CAST_PROMO: now() is the promo on now in this
   game (or null) and of(seed) the one a game was dealt in, each with on, tier, look, team and medal (below).

   1. The Dally M promo ('dmx'; 30 Sep 2026, the owner's call): for 48 hours (Thursday morning to 8 am Saturday) the 2026
      Dally M Team of the Year are super rare Dally M navy cards and the Dally M Medal winners have a gold edge.
        27-0      Team of the Year 95, the Medal winner 99, on their 2026 season in Classic and Hard, and a super rare
                  pull in Packs; spins stop boosting at three in a 13, and Team of the Year Picks have no limit
                  (js/game-data-sim.js, js/game-core.js, js/picks.js)
        1000TRIES navy cards that turn up a little more often in 1000+ and Exactly 1000, and the NRLW Team of the
                  Year the same in NRLW 250+; their tries never change (js/draft.js, js/render.js)
      Everything ends by itself at UNTIL.

   2. The Grand Final promo, 2026 Premiers ('pnx', 'pwx' or 'pbx'; 4 Oct 2026, the owner's call): the owner launches it from
      Admin on Grand Final night, a league at a time (the NRLW first), choosing the winner and the Clive Churchill or Karyn
      Murphy Medal winner (config/launch premiers; js/cast-account.js reads it and calls setPremiers). Each league runs 96
      hours from its launch and ends by itself. The winning club's 2026 squad (SQUAD: every player the games have at that
      club in 2026; for the 2026 Roosters, only their Grand Final sides, the owner's call on 5 Oct 2026) are premiers, on cards in their club colours with a
      silver foil edge and a trophy after their names; the medal winner has a gold edge, the medal and, as a premier,
      the trophy too (a medal winner from the losing side gets the medal only).
        27-0      premiers 95+ on their 2026 season (that club's 2026 spin) in Classic and Hard, the medal winner 99, three
                  at most from spins; a rare pull in Packs; Premiers Picks (js/game-data-sim.js, js/game-core.js, js/picks.js)
        1000TRIES premiers cards turn up a little more often in 1000+ and Exactly 1000, the NRLW premiers in NRLW 250+;
                  their tries never change (js/draft.js, js/render.js)
      The pop-up and the graphics lead with the Grand Final 17 (GF: the 22 named on Friday; at launch the owner's Admin
      card sends the final 17 from NRL.com when it can). A game's mark says which leagues were on when it was dealt:
      'pnx' the NRL, 'pwx' the NRLW, 'pbx' both. 27-0 has no NRLW, so there only the NRL counts.

   Localhost only: ?dallym=1 / ?dallym=0 forces the Dally M promo on or off; ?prem=knights (the NRL winner) and
   ?premw=broncos (the NRLW winner), with ?premm= and ?premwm= for the medal winners, preview the Premiers as if each
   was launched an hour before. */
(function () {
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  function arg(k) { var m = local ? location.search.match(new RegExp('[?&]' + k + '=([^&#]*)')) : null; return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  // The game this page is (27-0 has only the NRL); asked when needed, since 27-0 loads this file before its settings
  function game() { return (window.CAST_ACCOUNT && window.CAST_ACCOUNT.game) || ''; }

  /* ---------------- 1. The Dally M promo ---------------- */
  var FROM = Date.parse('2026-09-30T09:00:00Z');  // Wednesday 30 Sep, 7 pm Sydney (Dally M night)
  var UNTIL = Date.parse('2026-10-02T22:00:00Z'); // Saturday 3 Oct, 8 am Sydney (still AEST: daylight saving starts Sunday)
  // The 2026 Dally M Team of the Year (announced 30 Sep 2026): [name as in both games' player lists, position, 2026 club,
  // NRL tries (1000TRIES, so its pop-up shows them even before the game's player list has loaded on a slow phone)]
  var TEAM = [
    ['Dylan Edwards', 'FB', 'panthers', 70],
    ['Selwyn Cobbo', 'W', 'dolphins', 67],
    ['Thomas Jenkins', 'W', 'panthers', 48],
    ['Herbie Farnworth', 'C', 'dolphins', 69],
    ['Robert Toia', 'C', 'roosters', 22],
    ['Braydon Trindall', 'FE', 'sharks', 37],
    ['Nathan Cleary', 'HB', 'panthers', 73],
    ['James Fisher-Harris', 'P', 'warriors', 21],
    ['Wayde Egan', 'HK', 'warriors', 24],
    ['Naufahu Whyte', 'P', 'roosters', 4],
    ["Haumole Olakau'atu", 'SR', 'seaeagles', 50],
    ['Hamish Stewart', 'SR', 'dragons', 6],
    ['Erin Clark', 'LK', 'warriors', 11]
  ];
  var MEDAL = 'Nathan Cleary'; // the Dally M Medal winner
  // The NRLW Team of the Year (1000TRIES NRLW 250+ only; 27-0 has no NRLW): [name, position, club, NRLW tries], names
  // as in data/nrlw-players.json (checked 30 Sep 2026)
  var TEAM_W = [
    ['Tamika Upton', 'FB', 'broncos', 61],
    ['Julia Robinson', 'W', 'broncos', 40],
    ['Brydie Parker', 'W', 'roosters', 25],
    ['Isabelle Kelly', 'C', 'roosters', 29],
    ['Jessica Sergis', 'C', 'roosters', 45],
    ['Teagan Levi', 'FE', 'titans', 9],
    ['Raecene McGregor', 'HB', 'tigers', 5],
    ['Millie Elliott', 'P', 'roosters', 10],
    ['Keeley Nizza', 'HK', 'roosters', 12],
    ['Sarah Togatuki', 'P', 'tigers', 9],
    ["Evania Isa'ako", 'SR', 'titans', 21],
    ['Shaylee Bent', 'SR', 'tigers', 8],
    ['Olivia Kernick', 'LK', 'roosters', 24]
  ];
  var MEDAL_W = 'Tamika Upton'; // the NRLW Dally M Medal winner
  var dq = arg('dallym');
  var dmBy = {};
  TEAM.forEach(function (t) { dmBy[t[0]] = { pos: t[1], club: t[2], lg: 'nrl' }; });
  TEAM_W.forEach(function (t) { dmBy[t[0]] = { pos: t[1], club: t[2], lg: 'nrlw' }; });
  function dmOn(at) { if (dq === '1' || dq === '0') return dq === '1'; var t = at || Date.now(); return t >= FROM && t < UNTIL; }
  function dmTier(name) { return name && (name === MEDAL || name === MEDAL_W) ? 'medal' : dmBy[name] ? 'toty' : ''; }
  var DM = {
    id: 'dallym26', kind: 'toty', ga: 'dallym', from: FROM, until: UNTIL, team: TEAM, medal: MEDAL, teamW: TEAM_W, medalW: MEDAL_W,
    on: dmOn,
    // 'medal', 'toty' or '' for a player's name (while the promo is on, or always with force for a marked game)
    tier: function (name, force) { return force || dmOn() ? dmTier(name) : ''; },
    info: function (name) { return dmBy[name] || null; },
    // A promo player's card words, what follows their name (HTML) and their club, or null
    look: function (name) {
      var t = dmTier(name);
      return t ? { tier: t, label: t === 'medal' ? 'Dally M Medal' : 'Team of the Year', mark: t === 'medal' ? ' &#x1F3C5;' : '', club: dmBy[name].club, lg: dmBy[name].lg } : null;
    }
  };

  /* ---------------- 2. The Grand Final promo: 2026 Premiers ---------------- */
  // The Grand Final teams as named on Friday 2 Oct 2026 (NRL.com): [name as in the games, position (INT interchange, RES
  // reserve), jersey number, tries (NRL tries; NRLW tries for the NRLW; both include the Grand Finals', 5 Oct)]. The
  // Knights' hooker wears 14.
  var GF = {
    nrl: {
      roosters: [['James Tedesco', 'FB', 1, 161], ['Daniel Tupou', 'W', 2, 198], ['Billy Smith', 'C', 3, 29], ['Robert Toia', 'C', 4, 22], ['Mark Nawaqanitawase', 'W', 5, 47], ['Daly Cherry-Evans', 'FE', 6, 105], ['Sam Walker', 'HB', 7, 36], ['Naufahu Whyte', 'P', 8, 4], ['Reece Robson', 'HK', 9, 28], ['Lindsay Collins', 'P', 10, 13], ['Salesi Foketi', 'SR', 11, 4], ['Siua Wong', 'SR', 12, 10], ['Victor Radley', 'LK', 13, 28], ['Connor Watson', 'INT', 14, 35], ['Angus Crichton', 'INT', 15, 52], ['Nat Butcher', 'INT', 16, 27], ['Spencer Leniu', 'INT', 17, 10], ['Hugo Savala', 'INT', 18, 12], ['Cody Ramsey', 'INT', 19, 16], ['Benaiah Ioelu', 'RES', 20, 0], ['Tommy Talau', 'RES', 21, 42], ['Egan Butcher', 'RES', 22, 9]],
      knights: [['Kalyn Ponga', 'FB', 1, 61], ['Dominic Young', 'W', 2, 96], ['Dane Gagai', 'C', 3, 93], ['Bradman Best', 'C', 4, 47], ['Greg Marzhew', 'W', 5, 75], ['Fletcher Sharpe', 'FE', 6, 35], ['Sandon Smith', 'HB', 7, 9], ['Tyson Frizell', 'P', 8, 42], ['Cody Hopwood', 'P', 10, 0], ['Jermaine McEwen', 'SR', 11, 7], ['Francis Manuleleua', 'SR', 12, 4], ['Mat Croker', 'LK', 13, 8], ['Harrison Graham', 'HK', 14, 4], ['Lachlan Crouch', 'INT', 15, 0], ['Pasami Saulo', 'INT', 16, 0], ['Dylan Lucas', 'INT', 17, 24], ['Fletcher Hunt', 'INT', 18, 18], ['Thomas Cant', 'INT', 19, 0], ['Kyle McCarthy', 'INT', 20, 1], ['Diesel Hagan', 'RES', 21, 0], ['Elijah Salesa-Leaumoana', 'RES', 22, 1]]
    },
    nrlw: {
      roosters: [['Corban Baxter', 'FB', 1, 13], ['Brydie Parker', 'W', 2, 28], ['Jessica Sergis', 'C', 3, 45], ['Isabelle Kelly', 'C', 4, 30], ['Jayme Fressard', 'W', 5, 36], ['Jocelyn Kelleher', 'FE', 6, 8], ['Tarryn Aiken', 'HB', 7, 24], ['Millie Elliott', 'P', 8, 10], ['Keeley Nizza', 'HK', 9, 12], ['Otesa Pule', 'P', 10, 11], ['Sariah Paki', 'SR', 11, 6], ['Jasmin Strange', 'SR', 12, 11], ['Olivia Kernick', 'LK', 13, 24], ['Taina Naividi', 'INT', 14, 16], ['Aliyah Nasio', 'INT', 15, 4], ['Rima Butler', 'INT', 16, 9], ['Amber Hall', 'INT', 17, 16], ['Mia Wood', 'RES', 18, 16], ['Taneisha Gray', 'RES', 19, 1], ['Nikiah Campbell', 'RES', 20, 0], ['Shawden Burton', 'RES', 21, 0], ['Keighley Simpson', 'RES', 22, 4]],
      broncos: [['Tamika Upton', 'FB', 1, 61], ['Kerri Johnson', 'W', 2, 21], ['Deleni Paitai', 'C', 3, 2], ['Georgia Bartlett', 'C', 4, 6], ['Julia Robinson', 'W', 5, 40], ['Ali Brigginshaw', 'FE', 6, 14], ['Jesse Southwell', 'HB', 7, 9], ['Shannon Mato', 'P', 8, 4], ['Jada Ferguson', 'HK', 9, 9], ['Brianna Clark', 'P', 10, 4], ['Lauren Dam', 'SR', 11, 20], ['Romy Teitzel', 'SR', 12, 17], ['Lillian Yarrow', 'LK', 13, 1], ['Rhemy Hinckesman', 'INT', 14, 2], ['Chelsea Lenarduzzi', 'INT', 15, 22], ['Reegan Hicks', 'INT', 16, 0], ['Harlem Walker', 'INT', 17, 2], ['Caitlin Urwin', 'RES', 18, 2], ['Tara McGrath-West', 'RES', 19, 0], ['Linneke Gevers', 'RES', 20, 0], ['Breanna Eales', 'RES', 21, 0], ['Amanii Misa', 'RES', 22, 0]]
    }
  };
  // Each finalist's whole 2026 squad as both games have it (players-master.json and nrlw-master.json, 2 Oct 2026: every
  // player with a 2026 season at the club, the same names in 27-0 and 1000TRIES). 4 Oct 2026: the club years audit added
  // 2026 seasons RLP shows for Tyson Gamble, James Schiller and Brodie Jones (Knights) and Junior Tupou, Junior Pauga,
  // Blake Steep and Taylor Losalu (Roosters), so they are premiers too. Kyle McCarthy stays (no 2026 games on RLP)
  var SQUAD = {
    nrl: {
      knights: ['Bradman Best', 'Brodie Jones', 'Cody Hopwood', 'Dane Gagai', 'Diesel Hagan', 'Dominic Young', 'Dylan Brown', 'Dylan Lucas', 'Elijah Salesa-Leaumoana', 'Fletcher Hunt', 'Fletcher Sharpe', 'Francis Manuleleua', 'Greg Marzhew', 'Harrison Graham', 'Jacob Saifiti', 'James Schiller', 'Jermaine McEwen', 'Kalyn Ponga', 'Kyle McCarthy', 'Lachlan Crouch', 'Mat Croker', 'Pasami Saulo', 'Phoenix Crossland', 'Sandon Smith', 'Thomas Cant', 'Toby Winter', 'Trey Mooney', 'Tyson Frizell', 'Tyson Gamble', 'Wilson De Courcey'],
      // The 2026 premiers (5 Oct 2026, the owner's call): the 19 on NRL.com's Grand Final team list, plus Connor Watson. Not the
      // rest of the 2026 squad (Junior Tupou, Junior Pauga, Blake Steep, Taylor Losalu, Rex Bassingthwaighte, Tommy Talau and
      // Egan Butcher were premiers by the old rule)
      roosters: ['Angus Crichton', 'Benaiah Ioelu', 'Billy Smith', 'Cody Ramsey', 'Connor Watson', 'Daly Cherry-Evans', 'Daniel Tupou', 'Hugo Savala', 'James Tedesco', 'Lindsay Collins', 'Mark Nawaqanitawase', 'Nat Butcher', 'Naufahu Whyte', 'Reece Robson', 'Robert Toia', 'Salesi Foketi', 'Sam Walker', 'Siua Wong', 'Spencer Leniu', 'Victor Radley']
    },
    nrlw: {
      // The 2026 premiers (5 Oct 2026, the owner's call): the Grand Final 17 and Mia Wood, not the whole squad (Keighley Simpson,
      // Macie Carlile, Nikiah Campbell, Shawden Burton and Taneisha Gray were premiers by the old rule)
      roosters: ['Aliyah Nasio', 'Amber Hall', 'Brydie Parker', 'Corban Baxter', 'Isabelle Kelly', 'Jasmin Strange', 'Jayme Fressard', 'Jessica Sergis', 'Jocelyn Kelleher', 'Keeley Nizza', 'Mia Wood', 'Millie Elliott', 'Olivia Kernick', 'Otesa Pule', 'Rima Butler', 'Sariah Paki', 'Taina Naividi', 'Tarryn Aiken'],
      broncos: ['Ali Brigginshaw', 'Amanii Misa', 'Breanna Eales', 'Bree Spreadborough', 'Brianna Clark', 'Caitlin Urwin', 'Chelsea Lenarduzzi', 'Deleni Paitai', 'Destiny Brill', 'Georgia Bartlett', 'Harlem Walker', 'Jada Ferguson', 'Jesse Southwell', 'Julia Robinson', 'Kerri Johnson', 'Lauren Dam', 'Lillian Yarrow', 'Linneke Gevers', 'Reegan Hicks', 'Rhemy Hinckesman', 'Romy Teitzel', 'Shannon Mato', 'Tamika Upton', 'Tara McGrath-West', 'Tavarna Papalii']
    }
  };
  var CLUB = { roosters: ['Roosters', 'Sydney Roosters'], knights: ['Knights', 'Newcastle Knights'], broncos: ['Broncos', 'Brisbane Broncos'] };
  // kick: kick-off (NRL.com, 4 Oct 2026), so Admin can say when each launch is due
  var LG = {
    nrl: { name: 'NRL', medal: 'Clive Churchill Medal', clubs: ['roosters', 'knights'], kick: Date.parse('2026-10-04T08:30:00Z') },
    nrlw: { name: 'NRLW', medal: 'Karyn Murphy Medal', clubs: ['roosters', 'broncos'], kick: Date.parse('2026-10-04T05:00:00Z') }
  };
  var HOURS = 96, LS_PREM = 'cast_premiers_v1';
  var inSq = {};
  Object.keys(SQUAD).forEach(function (lg) { inSq[lg] = {}; Object.keys(SQUAD[lg]).forEach(function (c) { inSq[lg][c] = {}; SQUAD[lg][c].forEach(function (n) { inSq[lg][c][n] = 1; }); }); });
  function inSquad(lg, club, name) { return !!(inSq[lg] && inSq[lg][club] && inSq[lg][club][name]); }

  // A league's launch as config/launch has it, checked: { club, medal, mclub (the medal winner's club), at, until,
  // team (the final 17 from NRL.com, each { n, p, no }), score }. Its team comes out as [name, position, number]
  function clean1(x, lg) {
    if (!x || typeof x !== 'object' || LG[lg].clubs.indexOf(x.club) < 0) return null;
    var at = +x.at || 0, until = +x.until || 0;
    if (!at || !(until > at)) return null;
    var o = { club: x.club, medal: typeof x.medal === 'string' ? x.medal.slice(0, 60) : '', mclub: LG[lg].clubs.indexOf(x.mclub) >= 0 ? x.mclub : x.club, at: at, until: until };
    if (Array.isArray(x.team)) {
      o.team = x.team.map(function (r) { return Array.isArray(r) ? r : r && typeof r === 'object' ? [r.n, r.p, r.no] : null; })
        .filter(function (r) { return r && typeof r[0] === 'string' && r[0]; }).slice(0, 22)
        .map(function (r) { return [String(r[0]).slice(0, 60), String(r[1] || ''), +r[2] || 0]; });
    }
    if (typeof x.score === 'string') o.score = x.score.slice(0, 80);
    return o;
  }
  function cleanAll(x) {
    var o = { nrl: clean1(x && x.nrl, 'nrl'), nrlw: clean1(x && x.nrlw, 'nrlw') };
    return o.nrl || o.nrlw ? o : null;
  }
  // A localhost preview (?prem=, ?premw=) wins over the launch
  var pq = (function () {
    var n = arg('prem'), w = arg('premw');
    if (!n && !w) return null;
    var at = Date.now() - 3600000, mk = function (club, medal) { return club ? { club: club, medal: medal || '', at: at, until: at + HOURS * 3600000 } : null; };
    return cleanAll({ nrl: mk(n, arg('premm')), nrlw: mk(w, arg('premwm')) });
  })();
  var PS = pq || (function () { try { return cleanAll(JSON.parse(lsGet(LS_PREM) || 'null')); } catch (e) { return null; } })();

  function lgOn(lg, at) { var x = PS && PS[lg], t = at || Date.now(); return !!x && t >= x.at && t < x.until; }
  function lgsHere() { return game() === '27-0' ? ['nrl'] : ['nrl', 'nrlw']; } // the leagues this game has
  function liveHere(at) { return lgsHere().filter(function (lg) { return lgOn(lg, at); }); }

  // Matching NRL.com's names to the games' (apostrophes, accents and hyphens aside)
  function norm(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    return s.toLowerCase().replace(/['’.]/g, '').replace(/[-\s]+/g, ' ').trim();
  }
  function gameName(lg, club, name) {
    var k = norm(name), list = ((GF[lg] || {})[club] || []).map(function (r) { return r[0]; }).concat((SQUAD[lg] || {})[club] || []);
    for (var i = 0; i < list.length; i++) if (norm(list[i]) === k) return list[i];
    return String(name || '');
  }
  var SHAPE = ['FB', 'W', 'W', 'C', 'C', 'FE', 'HB', 'P', 'HK', 'P', 'SR', 'SR', 'LK'];
  /* A side for the pop-up and the graphics: the 13 in team-sheet order (fullback, wingers, centres, halves, props and
     hooker, second rowers, lock) and up to four on the bench. rows: [name, position, number(, tries)], the final 17
     from NRL.com or the 22 named on Friday. Out: { start, bench } as [name, position, club, tries] */
  function side(lg, club, rows) {
    var named = (GF[lg] || {})[club] || [], triesOf = {};
    named.forEach(function (r) { triesOf[r[0]] = r[3]; });
    var list = (rows && rows.length ? rows : named).map(function (r) {
      var n = gameName(lg, club, r[0]);
      return { n: n, p: r[1], no: +r[2] || 99, t: r[3] != null ? r[3] : triesOf[n] };
    });
    list.sort(function (a, b) { return a.no - b.no; });
    var on = list.filter(function (x) { return x.p !== 'INT' && x.p !== 'RES'; }), start = [];
    SHAPE.forEach(function (pos) { for (var i = 0; i < on.length; i++) if (on[i].p === pos) { start.push(on.splice(i, 1)[0]); return; } });
    start = start.concat(on).slice(0, 13); // anything the shape missed, in number order
    var bench = list.filter(function (x) { return x.p === 'INT' && start.indexOf(x) < 0; }).slice(0, 4);
    var row = function (x) { return [x.n, x.p, club, x.t == null ? null : x.t]; };
    return { start: start.map(row), bench: bench.map(row) };
  }

  /* The Premiers as one promo. L: the leagues it covers here (now: the ones on in this game; a marked game: the ones on
     when it was dealt, played as dealt whatever the time: force). Reads the launch live, so a kept copy stays current;
     data: Admin's look at a launch before it happens (previewOf) */
  function premDef(L, force, data) {
    function X(lg) { var s = data || PS; return s && s[lg] || null; }
    function lgs(live) { return L.filter(function (lg) { return X(lg) && (!live || lgOn(lg)); }); }
    function tierOf(name, club, live) {
      if (!name) return null;
      var ls = lgs(live), i, x;
      for (i = 0; i < ls.length; i++) { x = X(ls[i]); if (x.medal && name === x.medal && (!club || club === x.mclub)) return { t: 'medal', lg: ls[i], club: x.mclub }; }
      for (i = 0; i < ls.length; i++) { x = X(ls[i]); if (inSquad(ls[i], x.club, name) && (!club || club === x.club)) return { t: 'prem', lg: ls[i], club: x.club }; }
      return null;
    }
    function premier(name) { return lgs(false).some(function (lg) { return inSquad(lg, X(lg).club, name); }); }
    function sideOf(lg) { var x = L.indexOf(lg) >= 0 && X(lg); return x ? side(lg, x.club, x.team) : null; }
    var D = {
      id: 'premiers26', kind: 'prem', ga: 'premiers', leagues: L, hours: HOURS,
      on: function (at) { return L.some(function (lg) { return lgOn(lg, at); }); },
      // 'medal', 'prem' or '' for a player's name (club: only in that club's colours, for 27-0's spins)
      tier: function (name, f, club) { var r = tierOf(name, club, !(f || force)); return r ? r.t : ''; },
      info: function (name) { var r = tierOf(name, null, false); return r ? { club: r.club, lg: r.lg } : null; },
      look: function (name, f) {
        var r = tierOf(name, null, !(f || force));
        if (!r) return null;
        return r.t === 'medal' ? { tier: 'medal', label: LG[r.lg].medal, mark: ' &#x1F3C5;' + (premier(name) ? '&#x1F3C6;' : ''), club: r.club, lg: r.lg }
          : { tier: 'prem', label: '2026 Premiers', mark: ' &#x1F3C6;', club: r.club, lg: r.lg };
      },
      premier: premier,
      // A league's premiers: the whole squad (27-0's Premiers Pick and pack pulls), the launch, and the 17 for show
      squad: function (lg) { var x = L.indexOf(lg) >= 0 && X(lg); return x ? SQUAD[lg][x.club].slice() : []; },
      launch: function (lg) { return L.indexOf(lg) >= 0 ? X(lg) : null; },
      side: sideOf,
      clubName: function (lg, full) { var x = X(lg); return x && CLUB[x.club] ? CLUB[x.club][full ? 1 : 0] : ''; }
    };
    // The pop-up's lists, the same shape as the Dally M's: the starting 13 only, never the interchange (the owner's call)
    // as [name, position, club, tries]. The whole squad still counts as premiers in the games (squad)
    Object.defineProperty(D, 'team', { get: function () { var s = sideOf('nrl'); return s ? s.start.slice() : []; } });
    Object.defineProperty(D, 'teamW', { get: function () { var s = sideOf('nrlw'); return s ? s.start.slice() : []; } });
    Object.defineProperty(D, 'medal', { get: function () { var x = L.indexOf('nrl') >= 0 && X('nrl'); return x ? x.medal : ''; } });
    Object.defineProperty(D, 'medalW', { get: function () { var x = L.indexOf('nrlw') >= 0 && X('nrlw'); return x ? x.medal : ''; } });
    Object.defineProperty(D, 'from', { get: function () { return lgs(false).reduce(function (m, lg) { return Math.min(m, X(lg).at); }, Infinity); } });
    // The end: the last league's (each runs 96 hours from its own launch)
    Object.defineProperty(D, 'until', { get: function () { return lgs(!force).reduce(function (m, lg) { return Math.max(m, X(lg).until); }, 0); } });
    return D;
  }

  /* ---------------- Marks, and the promo on now ---------------- */
  var PREM_MARK = { pnx: ['nrl'], pwx: ['nrlw'], pbx: ['nrl', 'nrlw'] };
  function markOf(seed) { var m = typeof seed === 'string' ? seed.slice(0, 3) : ''; return m === 'dmx' || PREM_MARK[m] ? m : ''; }
  function premMark() { var l = liveHere(); return l.length === 2 ? 'pbx' : l[0] === 'nrl' ? 'pnx' : l[0] === 'nrlw' ? 'pwx' : ''; }
  function now(at) { var l = liveHere(at); return l.length ? premDef(l, false) : dmOn(at) ? DM : null; }
  function of(seed) {
    var m = markOf(seed);
    if (m === 'dmx') return DM;
    if (!m) return null;
    var here = lgsHere(), L = PREM_MARK[m].filter(function (lg) { return here.indexOf(lg) >= 0; });
    return L.length ? premDef(L, true) : null;
  }
  var P = {
    now: now,
    of: of,
    on: function (at) { return !!now(at); },
    // Is this promo (its id) the one on now here
    isOn: function (id) { var d = now(); return !!d && d.id === id; },
    // A seed dealt now carries the promo's mark; a normal seed never starts with one (clean it first)
    mark: function (seed) { return (premMark() || (dmOn() ? 'dmx' : '')) + seed; },
    marked: function (seed) { return !!markOf(seed); },
    clean: function (seed) { return markOf(seed) ? seed.slice(0, 2) + seed.slice(3) : seed; },
    tier: function (name, force) { var d = now(); return d ? d.tier(name, force) : ''; },
    info: function (name) { var d = now(); return d ? d.info(name) : null; },
    /* The Premiers launch from config/launch (js/cast-account.js), kept on the device so a reload during the promo has it
       straight away. True when it changed (the page then draws the promo again) */
    setPremiers: function (x) {
      if (pq) return false;
      var next = cleanAll(x);
      if (JSON.stringify(next) === JSON.stringify(PS)) return false;
      PS = next;
      lsSet(LS_PREM, next ? JSON.stringify(next) : null);
      return true;
    },
    premiers: function () { return PS ? JSON.parse(JSON.stringify(PS)) : null; },
    // Admin's Preview: the promo as it would be with this launch ({ nrl: { club, medal, mclub }, ... }), shown on this
    // phone only and changing nothing
    previewOf: function (x) {
      var t = Date.now(), o = {};
      Object.keys(LG).forEach(function (lg) { if (x && x[lg]) o[lg] = Object.assign({ at: t, until: t + HOURS * 3600000 }, x[lg]); });
      var d = cleanAll(o), L = d ? lgsHere().filter(function (lg) { return d[lg]; }) : [];
      return L.length ? premDef(L, true, d) : null;
    },
    // For Admin's Grand Final card and the graphics
    gf: GF, squads: SQUAD, clubs: CLUB, leagues: LG, hours: HOURS, side: side, gameName: gameName, preview: !!pq
  };
  // The promo on now, for code that reads a single promo's id, lists and dates
  ['id', 'kind', 'from', 'until', 'team', 'medal', 'teamW', 'medalW'].forEach(function (k) {
    Object.defineProperty(P, k, { get: function () { var d = now() || DM; return d[k]; } });
  });
  window.CAST_PROMO = P;
})();
