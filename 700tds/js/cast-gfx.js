/* Graphics for social posts, drawn on the phone (4 Oct 2026, the owner's call). The master copy is
   shared/cast-account/cast-gfx.js; tools/sync_shared.py copies it to js/ on both sites. No page loads it now (the Grand
   Final card left Admin on 5 Oct 2026); ~/cast-dev/cardgen uses the same file for the posts and backups.

   CastGfx.premiers(o) draws the 2026 Premiers post in the Team of the Year layout (Drive folder 18): the logos, the
   kicker, the title, a scoreboard (the Grand Final and its score, the team's number, the medal winner), the premiers'
   starting 13 on a field in their club colours with a trophy-gold foil edge (gold, like proper winners: the owner's call;
   the medal winner holographic, with the medal's tab), and the call to play. The starting 13 only, never the interchange
   (the owner's call): the field runs down to the headline. Portrait 1080x1350 or Story 1080x1920, drawn at 2x. Resolves to a PNG blob.
     o: { lg: 'nrl' or 'nrlw', game: '1000tries' (tries) or '27-0' (ratings), format: 'portrait' or 'story', club, clubName,
          medal, mclub (the medal winner's club), score ("Knights 24, Roosters 18"), side: { start, bench } as
          [name, position, club, tries] (CAST_PROMO.side), logos: { cast, game } (optional image URLs) } */
(function () {
  var SCALE = 2;
  var CLUB = { roosters: ['#012D5C', '#CC0000', 'SYD'], knights: ['#003087', '#D22730', 'NEW'], broncos: ['#6B0046', '#F5A623', 'BRI'] };
  var SITE = '/1000tries/assets/logos/';
  var FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
  var FOIL = ['#8a5a14', '#f6d27a', '#fff1c1', '#d4a23c', '#8a5a14'], HOLO = ['#c7d2fe', '#f0abfc', '#99f6e4', '#fde68a', '#c7d2fe'], GOLDT = '#ffd978', PINK = '#f5d0fe';

  function img(src) {
    return new Promise(function (ok) {
      if (!src) { ok(null); return; }
      var i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = function () { ok(i); };
      i.onerror = function () { ok(null); };
      i.src = src;
    });
  }
  // Inter from Google Fonts (the sites' own type), so the post looks the same on any phone
  var fontP = null;
  function fonts() {
    if (fontP) return fontP;
    fontP = new Promise(function (ok) {
      if (!document.fonts || !document.fonts.load) { ok(); return; }
      var have = Array.prototype.some.call(document.querySelectorAll('link[href*="fonts.googleapis.com"]'), function (l) { return /Inter/.test(l.href) && /900/.test(l.href); });
      var go = function () { Promise.all(['700', '800', '900'].map(function (w) { return document.fonts.load(w + ' 40px Inter'); })).then(function () { ok(); }, function () { ok(); }); };
      if (have) { go(); return; }
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap';
      l.onload = go; l.onerror = function () { ok(); };
      document.head.appendChild(l);
      setTimeout(go, 4000);
    });
    return fontP;
  }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hex(c) { var m = /^#?([0-9a-f]{6})$/i.exec(c || ''); var n = m ? parseInt(m[1], 16) : 0; return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(c, k, to) { var a = hex(c), b = hex(to || '#000000'); return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }).join(',') + ')'; }
  function rr(x, c, y, w, h, r) { x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r); x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath(); }
  // Text that fits: the size drops until it does
  function fit(x, text, weight, size, max, min) {
    var s = size;
    do { x.font = weight + ' ' + s + 'px ' + FONT; if (x.measureText(text).width <= max) break; s -= 1; } while (s > (min || 10));
    return s;
  }
  function spaced(x, text, cx, y, gap, align) {
    // Letter-spaced capitals (canvas letterSpacing where the browser has it)
    if ('letterSpacing' in x) { x.letterSpacing = gap + 'px'; x.textAlign = align || 'center'; x.fillText(text, cx + (align === 'left' ? 0 : align === 'right' ? 0 : gap / 2), y); x.letterSpacing = '0px'; return; }
    x.textAlign = align || 'center'; x.fillText(text, cx, y);
  }
  // The trophy-gold foil, and the medal winner's holographic one
  function foil(x, x0, y0, x1, y1, list) { var g = x.createLinearGradient(x0, y0, x1, y1), L = list || FOIL; L.forEach(function (c, i) { g.addColorStop(i / (L.length - 1), c); }); return g; }
  function surname(n) {
    var parts = String(n).split(' ');
    if (parts.length < 2) return n;
    var last = parts[parts.length - 1];
    // "De Courcey", "Cherry-Evans": keep a lower-case or short prefix with the surname
    if (parts.length > 2 && /^(de|van|von|da|le|la|mc|st)$/i.test(parts[parts.length - 2])) last = parts[parts.length - 2] + ' ' + last;
    return last;
  }

  function premiers(o) {
    var story = o.format === 'story', W = 1080, H = story ? 1920 : 1350, r27 = o.game === '27-0', nrlw = o.lg === 'nrlw';
    var cl = CLUB[o.club] || ['#1a1a2e', '#ffffff', String(o.club || '').slice(0, 3).toUpperCase()];
    var logos = o.logos || {};
    return Promise.all([fonts(), img(logos.cast || SITE + 'cast-patrol.png'), img(logos.game || SITE + (r27 ? '27-0.png' : '1000tries.png'))]).then(function (got) {
      var cv = document.createElement('canvas');
      cv.width = W * SCALE; cv.height = H * SCALE;
      var x = cv.getContext('2d');
      x.scale(SCALE, SCALE);
      x.textBaseline = 'alphabetic';
      // Layout: [logos top, kicker, title baseline, scoreboard top, field top, field bottom, bench top, headline, button top]
      var Y = story ? { logo: 150, logoH: 104, kick: 316, title: 440, sb: 486, sbH: 104, f0: 640, f1: 1430, bench: 1462, head: 1660, btn: 1700 }
        : { logo: 48, logoH: 84, kick: 176, title: 290, sb: 322, sbH: 88, f0: 432, f1: 1092, bench: 1110, head: 1236, btn: 1258 };

      // ---- The night sky in the club's colour, with stars
      var bg = x.createRadialGradient(W / 2, H * 0.18, 40, W / 2, H * 0.35, H * 0.95);
      bg.addColorStop(0, mix(cl[0], 0.25)); bg.addColorStop(0.45, mix(cl[0], 0.7)); bg.addColorStop(1, mix(cl[0], 0.9, '#03040a'));
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      var r = rng(story ? 77 : 41);
      for (var i = 0; i < (story ? 170 : 120); i++) {
        x.fillStyle = 'rgba(255,255,255,' + (0.15 + r() * 0.5).toFixed(2) + ')';
        x.beginPath(); x.arc(r() * W, r() * H, 0.6 + r() * 1.6, 0, Math.PI * 2); x.fill();
      }

      // ---- The logos: cast | the game
      var cast = got[1], gm = got[2], lh = Y.logoH;
      if (cast) { var cw = lh * 0.86 * cast.width / cast.height; x.drawImage(cast, W / 2 - 26 - cw, Y.logo + lh * 0.07, cw, lh * 0.86); }
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(W / 2 - 1, Y.logo + 4, 2, lh - 8);
      if (gm) { var gw = lh * 1.12 * gm.width / gm.height; x.drawImage(gm, W / 2 + 22, Y.logo - lh * 0.06, gw, lh * 1.12); }

      // ---- The kicker in a gold-edged pill
      var kick = 'GRAND FINAL SPECIAL · 4 DAYS ONLY';
      x.font = '800 24px ' + FONT;
      var kw = x.measureText(kick).width + kick.length * 2.2 + 56;
      rr(x, W / 2 - kw / 2, Y.kick - 34, kw, 50, 25);
      x.fillStyle = 'rgba(255,255,255,.07)'; x.fill();
      x.lineWidth = 2; x.strokeStyle = foil(x, W / 2 - kw / 2, 0, W / 2 + kw / 2, 0); x.stroke();
      x.fillStyle = '#fff6dc'; spaced(x, kick, W / 2, Y.kick, 2.2);

      // ---- The title
      x.save();
      x.shadowColor = 'rgba(246,210,122,.55)'; x.shadowBlur = 30;
      x.fillStyle = '#ffffff'; x.font = '900 ' + (story ? 100 : 86) + 'px ' + FONT; x.textAlign = 'center';
      x.fillText('2026 Premiers', W / 2, Y.title);
      x.restore();

      // ---- The scoreboard: the Grand Final, the team's number, the medal winner
      rr(x, 70, Y.sb, W - 140, Y.sbH, 18);
      x.fillStyle = 'rgba(6,9,20,.55)'; x.fill();
      x.lineWidth = 2; x.strokeStyle = foil(x, 70, 0, W - 70, 0); x.stroke();
      var top = Y.sb + Y.sbH * 0.42, bot = Y.sb + Y.sbH * 0.78;
      x.textAlign = 'left'; x.fillStyle = GOLDT; x.font = '800 21px ' + FONT;
      spaced(x, (nrlw ? 'NRLW' : 'NRL') + ' GRAND FINAL', 100, top, 1.5, 'left');
      var left = o.score || 'Accor Stadium, Sydney';
      x.fillStyle = '#ffffff'; fit(x, left, '800', 24, 290, 15); x.textAlign = 'left'; x.fillText(left, 100, bot);
      var start = (o.side && o.side.start) || [], bench = []; // the starting side only, never the interchange (the owner's call)
      Y.f1 = Y.head - (story ? 96 : 74); // so the field takes the bench's space, down to the headline
      var total = start.reduce(function (t, p) { return t + (+p[3] || 0); }, 0);
      var big = r27 ? '95+' : String(total), unit = r27 ? 'RATED' : nrlw ? 'NRLW TRIES' : 'NRL TRIES';
      x.font = '900 60px ' + FONT; var bw = x.measureText(big).width; x.font = '800 20px ' + FONT; var uw = x.measureText(unit).width + unit.length * 1.2;
      var bx = W / 2 - (bw + 14 + uw) / 2 + (r27 ? 0 : 0);
      x.fillStyle = '#ffffff'; x.font = '900 60px ' + FONT; x.textAlign = 'left'; x.fillText(big, bx, Y.sb + Y.sbH * 0.72);
      x.fillStyle = GOLDT; x.font = '800 20px ' + FONT; spaced(x, unit, bx + bw + 14, Y.sb + Y.sbH * 0.66, 1.2, 'left');
      // The medal winner (a premier also gets the trophy); no medal yet (the backups): the premiers themselves
      var mname = o.medal ? (nrlw ? 'KARYN MURPHY MEDAL' : 'CLIVE CHURCHILL MEDAL') : '2026 PREMIERS', mline = o.medal ? o.medal + ' 🏅' + (o.mclub === o.club ? '🏆' : '') : (o.clubName || '') + ' 🏆';
      x.fillStyle = o.medal ? PINK : GOLDT; x.font = '800 21px ' + FONT; x.textAlign = 'right'; spaced(x, mname, W - 100, top, 1.5, 'right');
      x.fillStyle = '#ffffff'; fit(x, mline, '800', 24, 300, 14); x.textAlign = 'right'; x.fillText(mline, W - 100, bot);

      // ---- The field: green stripes, the halfway line
      var fx = 120, fw = W - 240, fy = Y.f0, fh = Y.f1 - Y.f0;
      x.save(); rr(x, fx, fy, fw, fh, 24); x.clip();
      var stripes = 10;
      for (i = 0; i < stripes; i++) { x.fillStyle = i % 2 ? '#1f6a33' : '#1a5c2c'; x.fillRect(fx, fy + i * fh / stripes, fw, fh / stripes + 1); }
      var vg = x.createRadialGradient(W / 2, fy + fh / 2, 50, W / 2, fy + fh / 2, fh * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = vg; x.fillRect(fx, fy, fw, fh);
      x.setLineDash([14, 12]); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(fx, fy + fh * 0.5); x.lineTo(fx + fw, fy + fh * 0.5); x.stroke(); x.setLineDash([]);
      x.restore();
      rr(x, fx, fy, fw, fh, 24); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.28)'; x.stroke();

      // ---- The 13 on the field: FB / W C C W / FE HB / P HK P / SR SR / LK
      var by = {}; start.forEach(function (p) { (by[p[1]] = by[p[1]] || []).push(p); });
      var take = function (pos) { return (by[pos] || []).shift() || null; };
      var shape = [['FB'], ['W', 'C', 'C', 'W'], ['FE', 'HB'], ['P', 'HK', 'P'], ['SR', 'SR'], ['LK']];
      var rows = shape.map(function (row) { return row.map(take); });
      // Anyone the shape missed fills the first empty spot
      var spare = start.filter(function (p) { return !rows.some(function (rw) { return rw.indexOf(p) >= 0; }); });
      rows.forEach(function (rw) { rw.forEach(function (p, k) { if (!p && spare.length) rw[k] = spare.shift(); }); });
      var cwid = 184, chgt = story ? 116 : 98, gap = 14, step = (fh - 40) / 6;
      rows.forEach(function (rw, ri) {
        var n = rw.length, tw = n * cwid + (n - 1) * gap, cy = fy + 20 + step * ri + (step - chgt) / 2;
        rw.forEach(function (p, k) { if (p) card(x, p, fx + fw / 2 - tw / 2 + k * (cwid + gap), cy, cwid, chgt, o, cl, r27, story); });
      });

      // ---- The bench
      if (bench.length) {
        var bh = story ? 64 : 54, bwid = 188, bg2 = 14, btw = bench.length * bwid + (bench.length - 1) * bg2, b0 = W / 2 - btw / 2, byy = Y.bench + (story ? 34 : 26);
        x.fillStyle = GOLDT; x.font = '800 17px ' + FONT; spaced(x, 'INTERCHANGE', W / 2, Y.bench + (story ? 18 : 14), 2);
        bench.forEach(function (p, k) { mini(x, p, b0 + k * (bwid + bg2), byy, bwid, bh, o, cl, r27); });
      }

      // ---- The call to play
      x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = '900 ' + (story ? 46 : 38) + 'px ' + FONT;
      x.fillText('Draft the 2026 Premiers', W / 2, Y.head);
      var cta = 'PLAY FREE AT ' + (r27 ? '27-0.APP' : '1000TRIES.COM.AU'), ch = story ? 70 : 60;
      x.font = '900 ' + (story ? 28 : 25) + 'px ' + FONT; var ctw = x.measureText(cta).width + 80;
      rr(x, W / 2 - ctw / 2, Y.btn, ctw, ch, ch / 2);
      x.fillStyle = foil(x, W / 2 - ctw / 2, 0, W / 2 + ctw / 2, 0); x.fill();
      x.fillStyle = '#1a1204'; x.fillText(cta, W / 2, Y.btn + ch * 0.65);

      return new Promise(function (ok, no) {
        cv.toBlob(function (b) { cv.width = 1; cv.height = 1; if (b) ok(b); else no(new Error('The picture could not be saved.')); }, 'image/png');
      });
    });
  }

  // One premier on the field: club colours, trophy-gold foil edge (the medal winner holographic, with the medal's tab)
  function card(x, p, cx, cy, w, h, o, cl, r27, story) {
    var med = !!o.medal && p[0] === o.medal, nrlw = o.lg === 'nrlw';
    x.save();
    x.shadowColor = med ? 'rgba(240,171,252,.6)' : 'rgba(0,0,0,.45)'; x.shadowBlur = med ? 26 : 12; x.shadowOffsetY = med ? 0 : 4;
    rr(x, cx, cy, w, h, 14);
    var g = x.createLinearGradient(cx, cy, cx + w * 0.6, cy + h);
    g.addColorStop(0, mix(cl[0], 0.22, '#ffffff')); g.addColorStop(0.3, cl[0]); g.addColorStop(1, mix(cl[0], 0.55));
    x.fillStyle = g; x.fill();
    x.restore();
    // The foil: a gold (or holographic) edge, and a soft shine across the top
    x.save(); rr(x, cx, cy, w, h, 14); x.clip();
    var sh = x.createLinearGradient(cx, cy, cx + w, cy + h * 0.7);
    sh.addColorStop(0, 'rgba(255,255,255,.22)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(0.65, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,.12)');
    x.fillStyle = sh; x.fillRect(cx, cy, w, h);
    x.fillStyle = cl[1]; x.globalAlpha = 0.9; x.fillRect(cx, cy + h - 6, w, 6); x.globalAlpha = 1; // the club's second colour along the foot
    x.restore();
    rr(x, cx + 1.5, cy + 1.5, w - 3, h - 3, 13);
    x.lineWidth = med ? 4 : 3.5; x.strokeStyle = foil(x, cx, cy, cx + w, cy + h, med ? HOLO : FOIL); x.stroke();
    // Position and club
    var pad = 12, small = h < 105;
    x.fillStyle = med ? PINK : GOLDT; x.font = '800 ' + (small ? 19 : 21) + 'px ' + FONT; x.textAlign = 'left';
    x.fillText(p[1], cx + pad, cy + (small ? 26 : 30));
    // The name, with the trophy (and the medal)
    var nm = surname(p[0]) + (med ? ' 🏅' : ' ') + '🏆';
    x.fillStyle = '#ffffff'; x.textAlign = 'center';
    fit(x, nm, '900', small ? 27 : 30, w - 16, 14); x.fillText(nm, cx + w / 2, cy + h * (small ? 0.535 : 0.545));
    // The number: tries (1000TRIES) or the rating (27-0: 95+, the medal winner 99)
    var v = r27 ? (med ? '99' : '95') : String(p[3] == null ? '' : p[3]), u = r27 ? 'RATING' : +p[3] === 1 ? 'TRY' : 'TRIES', vs = small ? 31 : 35;
    x.font = '900 ' + vs + 'px ' + FONT; var vw = x.measureText(v).width; x.font = '800 15px ' + FONT; var uw = x.measureText(u).width + 6;
    var vx = cx + w / 2 - (vw + 8 + uw) / 2, vy = cy + h - (small ? 14 : 18);
    if (med) { var hg = x.createLinearGradient(vx, 0, vx + vw, 0); ['#c7d2fe', '#f0abfc', '#99f6e4', '#fde68a'].forEach(function (c, i) { hg.addColorStop(i / 3, c); }); x.fillStyle = hg; }
    else x.fillStyle = '#ffffff';
    x.font = '900 ' + vs + 'px ' + FONT; x.textAlign = 'left'; x.fillText(v, vx, vy);
    x.fillStyle = med ? PINK : GOLDT; x.font = '800 15px ' + FONT; spaced(x, u, vx + vw + 8, vy - 2, 1, 'left');
    if (med) {
      var tab = nrlw ? 'KARYN MURPHY MEDAL' : 'CLIVE CHURCHILL MEDAL';
      x.font = '900 13px ' + FONT; var tw = x.measureText(tab).width + tab.length * 1 + 22;
      rr(x, cx + w / 2 - tw / 2, cy - 19, tw, 24, 12); x.fillStyle = foil(x, cx + w / 2 - tw / 2, 0, cx + w / 2 + tw / 2, 0, HOLO); x.fill();
      x.fillStyle = '#1a1204'; spaced(x, tab, cx + w / 2, cy - 2, 1);
    }
  }
  // One on the bench: smaller, in a row under the field
  function mini(x, p, cx, cy, w, h, o, cl, r27) {
    var med = !!o.medal && p[0] === o.medal;
    rr(x, cx, cy, w, h, 12);
    var g = x.createLinearGradient(cx, cy, cx, cy + h); g.addColorStop(0, cl[0]); g.addColorStop(1, mix(cl[0], 0.55));
    x.fillStyle = g; x.fill();
    rr(x, cx + 1, cy + 1, w - 2, h - 2, 11); x.lineWidth = 2.5; x.strokeStyle = foil(x, cx, cy, cx + w, cy + h, med ? HOLO : FOIL); x.stroke();
    var v = r27 ? (med ? '99' : '95') : String(p[3] == null ? '' : p[3]);
    x.fillStyle = '#ffffff'; x.textAlign = 'left';
    var nm = surname(p[0]) + (med ? ' 🏅' : ' ') + '🏆';
    fit(x, nm, '900', 21, w - 70, 12); x.fillText(nm, cx + 12, cy + h * 0.62);
    x.textAlign = 'right'; x.font = '900 24px ' + FONT; x.fillStyle = med ? PINK : '#ffffff'; x.fillText(v, cx + w - 12, cy + h * 0.66);
  }

  window.CastGfx = { premiers: premiers };
})();
