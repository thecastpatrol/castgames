# CAST Games (castgames.com.au)

Every CAST game under one address. The games are built from their own folders (27-0, 1000TRIES, 4000 GOALS) by
`python3 tools/build.py`; the home page (index.html, js/home.js, css/home.css) and the bar and game switcher
(shared/cg.js, cg.css) live here. A new game or sport is one entry in shared/cg.js.

Hidden (noindex, robots.txt closed) until the switch-over: `python3 tools/build.py --live`.
