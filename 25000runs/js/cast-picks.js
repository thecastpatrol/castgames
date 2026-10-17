






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
    
    
  };
})();
