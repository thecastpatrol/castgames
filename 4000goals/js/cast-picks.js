/* Picks (27-0): the players a Pick offers when they don't come from a promo (js/cast-promo.js). The one list both sites
   read: the 27-0 game (js/picks.js), and both sites' Shop and payment pop-up (js/cast-account.js).
   The Immortal Pick (1 Oct 2026, the owner's call): all year, bought only ($4.99, or 3 for $11.99). Choose one of three
   Immortals for an open spot in your 13; he joins at 99, as many as you like in a 13. The 14 Immortals as 1000TRIES has
   them (data/legends.json, tier 'immortal'): [name, positions, club as 1000TRIES has it (Eastern Suburbs and Glebe
   are historic: 27-0 has their badges only), first year at that club (the team sheet's season), career, career premiership tries (1000TRIES)]. Saved as
   "Name (Immortal)", the name the leaderboards accept (firebase/functions/lib/boards.js). */
(function () {
  var IMMORTALS = [
    ['Dally Messenger', ['C'], 'easts', 1908, '1908-1913', 21],
    ['Frank Burge', ['LK', 'P'], 'glebe', 1911, '1911-1927', 148],
    ['Dave Brown', ['C'], 'easts', 1930, '1930-1941', 93],
    ['Clive Churchill', ['FB'], 'rabbitohs', 1947, '1947-1958', 13],
    ['Norm Provan', ['SR'], 'stgeorge', 1951, '1951-1965', 64],
    ['John Raper', ['LK', 'FE'], 'stgeorge', 1959, '1957-1969', 57],
    ['Reg Gasnier', ['C'], 'stgeorge', 1959, '1959-1967', 127],
    ['Graeme Langlands', ['FB', 'C'], 'stgeorge', 1963, '1963-1976', 86],
    ['Ron Coote', ['LK', 'SR'], 'rabbitohs', 1964, '1964-1978', 88],
    ['Bob Fulton', ['C', 'FE'], 'seaeagles', 1966, '1966-1979', 147],
    ['Arthur Beetson', ['P', 'SR'], 'easts', 1971, '1966-1980', 24],
    ['Mal Meninga', ['C'], 'raiders', 1986, '1986-1994', 74],
    ['Wally Lewis', ['FE', 'LK'], 'broncos', 1988, '1988-1992', 26],
    ['Andrew Johns', ['HB'], 'knights', 1993, '1993-2007', 80]
  ];
  window.CAST_PICKS = {
    immortals: IMMORTALS.map(function (x) { return { name: x[0], positions: x[1], club: x[2], year: x[3], era: x[4], tries: x[5], rec: x[0] + ' (Immortal)' }; })
    // On sale only once the owner launches it from Admin ('imm' in config/launch; CastAccount.immOn), after the Grand
    // Final promos. Before then nothing sells it, and one already bought still works
  };
})();
