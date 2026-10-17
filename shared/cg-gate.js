/* Testers only (16 Oct 2026, the owner: "make castgames behind a password for now so random people cant play").
   GitHub Pages has no logins, so this hides every page until the tester password is typed once on that phone. It keeps
   casual visitors out, not someone who reads the files. tools/build.py adds it to every page until the --live build.
   To change the password: put the new one's SHA-256 in H (python3 -c "import hashlib;print(hashlib.sha256(b'new').hexdigest())"). */
(function () {
  // Opened over plain http (17 Oct 2026, the owner's phone): the browser has no crypto.subtle there, so Come In did
  // nothing. The live site always moves to https first
  if (location.protocol === 'http:' && /castgames\.com\.au$/.test(location.hostname)) {
    location.replace('https://' + location.host + location.pathname + location.search + location.hash);
    return;
  }
  var K = 'cg_gate_v1', H = '1ac7d344b66a9785d33317ef45c038f3e42090cdc62c4d412897c92970dcd25b';
  try { if (localStorage.getItem(K) === H) return; } catch (e) { /* storage blocked: ask every time */ }
  var root = document.documentElement;
  root.classList.add('cg-locked');
  var css = document.createElement('style');
  css.textContent = 'html.cg-locked, html.cg-locked body { overflow: hidden !important; background: #0a0a12 !important; }' +
    'html.cg-locked body > *:not(#cgGate) { display: none !important; }' +
    '#cgGate { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 16px; background: radial-gradient(120% 80% at 50% 0%, #1b1b33 0%, #0a0a12 70%); font-family: Inter, -apple-system, system-ui, sans-serif; color: #fff; }' +
    '#cgGate form { width: 100%; max-width: 360px; display: grid; gap: 12px; text-align: center; }' +
    '#cgGate img { width: 180px; height: auto; margin: 0 auto 6px; }' +
    '#cgGate h1 { margin: 0; font: 900 22px/1.15 Inter, sans-serif; text-wrap: balance; }' +
    '#cgGate p { margin: 0; color: #a2a2b8; font: 500 14px/1.4 Inter, sans-serif; text-wrap: pretty; }' +
    '#cgGate input { height: 48px; padding: 0 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,.18); background: #141420; color: #fff; font: 600 16px Inter, sans-serif; text-align: center; }' +
    '#cgGate button { height: 48px; border: 0; border-radius: 999px; background: #fff; color: #0a0a12; font: 900 15px Inter, sans-serif; cursor: pointer; }' +
    '#cgGate .cg-gate-err { color: #ff8a8a; font-weight: 700; min-height: 1.4em; }';
  (document.head || root).appendChild(css);
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function show() {
    if (document.getElementById('cgGate')) return;
    var g = document.createElement('div');
    g.id = 'cgGate';
    g.innerHTML = '<form autocomplete="off"><img src="/assets/logos/castgames.png" alt="CAST Games">' +
      '<h1>Testers Only for Now</h1><p>CAST Games opens soon. Type the tester password to come in.</p>' +
      '<input type="password" aria-label="Tester password" placeholder="Password" autocapitalize="off" autocorrect="off" spellcheck="false">' +
      '<button type="submit">Come In</button><p class="cg-gate-err" role="alert"></p></form>';
    document.body.appendChild(g);
    var f = g.querySelector('form'), inp = g.querySelector('input'), err = g.querySelector('.cg-gate-err');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = (inp.value || '').trim().toLowerCase();
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)).then(function (d) {
        if (hex(d) !== H) { err.textContent = 'That password is not right.'; inp.select(); return; }
        try { localStorage.setItem(K, H); } catch (x) { /* this visit only */ }
        location.reload(); // the page starts again unhidden, so every game draws at its real size
      });
    });
    setTimeout(function () { inp.focus(); }, 50);
  }
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
