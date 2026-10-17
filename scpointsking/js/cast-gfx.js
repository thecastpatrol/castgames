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

  /* World Cup Team of the Week (15 Oct 2026, the owner's BUILD IT; Admin's Team of the Week card): the week's 13 on a field
     in World Cup blue, each with his new rating and the boost, the week, when it ends, and the call to play 27-0.
     o: { format: 'portrait' or 'story', label ('Week 1'), until (ms), set: [{ s: 1-13, n, k (nation), r (his own rating), b }] } */
  var WCB = ['#0369a1', '#38bdf8', '#e0f2fe', '#38bdf8', '#0369a1'], SKY = '#7dd3fc';
  var NATC = { aus: ['#00843D', 'AUS'], nzl: ['#111111', 'NZL'], eng: ['#F4F4F4', 'ENG'], fra: ['#1B3A8C', 'FRA'], sam: ['#0B2D7A', 'SAM'],
    ton: ['#C10F1F', 'TON'], fij: ['#5DB8E6', 'FIJ'], png: ['#C8102E', 'PNG'], leb: ['#008D45', 'LEB'], cok: ['#0A2A66', 'COK'] };
  var TPOS = ['FB', 'W', 'C', 'C', 'W', 'FE', 'HB', 'P', 'HK', 'P', 'SR', 'SR', 'LK'];
  function lightC(h) { var c = hex(h); return (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000 > 150; }
  function sydTime(ms) {
    try { return new Date(ms).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).replace(/\s?(am|pm)/i, function (m) { return m.trim().toLowerCase(); }); } catch (e) { return ''; }
  }
  function totw(o) {
    // The Team of the Year and Premiers layout (the owner, 15 Oct 2026: "make it like the toty for the roosters"), in World
    // Cup blue: logos, kicker, title, a scoreboard, the 13 on a field in six lines, the call to play
    var story = o.format === 'story', W = 1080, H = story ? 1920 : 1350, logos = o.logos || {};
    return Promise.all([fonts(), img(logos.cast || SITE + 'cast-patrol.png'), img(logos.game || SITE + '27-0.png')]).then(function (got) {
      var cv = document.createElement('canvas');
      cv.width = W * SCALE; cv.height = H * SCALE;
      var x = cv.getContext('2d');
      x.scale(SCALE, SCALE);
      x.textBaseline = 'alphabetic';
      var Y = story ? { logo: 150, logoH: 104, kick: 316, title: 440, sb: 486, sbH: 104, f0: 640, head: 1660, btn: 1700 }
        : { logo: 48, logoH: 84, kick: 176, title: 290, sb: 322, sbH: 88, f0: 432, head: 1236, btn: 1258 };
      Y.f1 = Y.head - (story ? 96 : 74);
      // ---- The night sky in World Cup blue, with stars
      var bg = x.createRadialGradient(W / 2, H * 0.18, 40, W / 2, H * 0.35, H * 0.95);
      bg.addColorStop(0, '#123f6e'); bg.addColorStop(0.45, '#0a2442'); bg.addColorStop(1, '#040a14');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      var r = rng(story ? 77 : 41);
      for (var i = 0; i < (story ? 170 : 120); i++) {
        x.fillStyle = 'rgba(255,255,255,' + (0.15 + r() * 0.5).toFixed(2) + ')';
        x.beginPath(); x.arc(r() * W, r() * H, 0.6 + r() * 1.6, 0, Math.PI * 2); x.fill();
      }
      // ---- The logos: cast | 27-0
      var cast = got[1], gm = got[2], lh = Y.logoH;
      if (cast) { var cw = lh * 0.86 * cast.width / cast.height; x.drawImage(cast, W / 2 - 26 - cw, Y.logo + lh * 0.07, cw, lh * 0.86); }
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(W / 2 - 1, Y.logo + 4, 2, lh - 8);
      if (gm) { var gw = lh * 1.12 * gm.width / gm.height; x.drawImage(gm, W / 2 + 22, Y.logo - lh * 0.06, gw, lh * 1.12); }
      // ---- The kicker in a blue-edged pill
      var kick = ('WORLD CUP · ' + (o.label || '')).toUpperCase();
      x.font = '800 24px ' + FONT;
      var kw = x.measureText(kick).width + kick.length * 2.2 + 56;
      rr(x, W / 2 - kw / 2, Y.kick - 34, kw, 50, 25);
      x.fillStyle = 'rgba(255,255,255,.07)'; x.fill();
      x.lineWidth = 2; x.strokeStyle = foil(x, W / 2 - kw / 2, 0, W / 2 + kw / 2, 0, WCB); x.stroke();
      x.fillStyle = '#e0f2fe'; spaced(x, kick, W / 2, Y.kick, 2.2);
      // ---- The title
      x.save(); x.shadowColor = 'rgba(56,189,248,.55)'; x.shadowBlur = 30;
      x.fillStyle = '#ffffff'; x.font = '900 ' + (story ? 100 : 86) + 'px ' + FONT; x.textAlign = 'center';
      x.fillText('Team of the Week', W / 2, Y.title); x.restore();
      // ---- The scoreboard: the tournament, how many are in form, when the boosts end
      rr(x, 70, Y.sb, W - 140, Y.sbH, 18);
      x.fillStyle = 'rgba(6,9,20,.55)'; x.fill();
      x.lineWidth = 2; x.strokeStyle = foil(x, 70, 0, W - 70, 0, WCB); x.stroke();
      var top = Y.sb + Y.sbH * 0.42, bot = Y.sb + Y.sbH * 0.78;
      x.textAlign = 'left'; x.fillStyle = SKY; x.font = '800 21px ' + FONT; spaced(x, 'RUGBY LEAGUE WORLD CUP', 100, top, 1.5, 'left');
      x.fillStyle = '#ffffff'; fit(x, (o.label || '') + ' Boosts', '800', 24, 300, 15); x.textAlign = 'left'; x.fillText((o.label || '') + ' Boosts', 100, bot);
      // The lowest new rating in the 13, like the Team of the Year's 95+ RATED (the owner didn't like "13 IN FORM")
      var low = Math.min.apply(null, (o.set || []).map(function (e) { return Math.min(99, (+e.r || 0) + (+e.b || 0)); }).concat([99]));
      var big = low + '+', unit = 'RATED';
      x.font = '900 60px ' + FONT; var bw = x.measureText(big).width; x.font = '800 20px ' + FONT; var uw = x.measureText(unit).width + unit.length * 1.2;
      var bx = W / 2 - (bw + 14 + uw) / 2;
      x.fillStyle = '#ffffff'; x.font = '900 60px ' + FONT; x.textAlign = 'left'; x.fillText(big, bx, Y.sb + Y.sbH * 0.72);
      x.fillStyle = SKY; x.font = '800 20px ' + FONT; spaced(x, unit, bx + bw + 14, Y.sb + Y.sbH * 0.66, 1.2, 'left');
      var endTxt = o.until ? sydTime(o.until) : '';
      x.fillStyle = SKY; x.font = '800 21px ' + FONT; x.textAlign = 'right'; spaced(x, 'BOOSTED UNTIL', W - 100, top, 1.5, 'right');
      x.fillStyle = '#ffffff'; fit(x, endTxt, '800', 24, 300, 14); x.textAlign = 'right'; x.fillText(endTxt, W - 100, bot);
      // ---- The field: green stripes, the halfway line
      var fx = 120, fw = W - 240, fy = Y.f0, fh = Y.f1 - Y.f0;
      x.save(); rr(x, fx, fy, fw, fh, 24); x.clip();
      for (i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#1f6a33' : '#1a5c2c'; x.fillRect(fx, fy + i * fh / 10, fw, fh / 10 + 1); }
      var vg = x.createRadialGradient(W / 2, fy + fh / 2, 50, W / 2, fy + fh / 2, fh * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = vg; x.fillRect(fx, fy, fw, fh);
      x.setLineDash([14, 12]); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(fx, fy + fh * 0.5); x.lineTo(fx + fw, fy + fh * 0.5); x.stroke(); x.setLineDash([]);
      x.restore();
      rr(x, fx, fy, fw, fh, 24); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.28)'; x.stroke();
      // ---- The 13 by their spots: FB / W C C W / FE HB / P HK P / SR SR / LK
      var at = {}; (o.set || []).forEach(function (e) { at[e.s] = e; });
      var shape = [[1], [2, 3, 4, 5], [6, 7], [8, 9, 10], [11, 12], [13]];
      var cwid = 184, chgt = story ? 116 : 98, gap = 14, step = (fh - 40) / 6;
      shape.forEach(function (row, ri) {
        var n = row.length, tw = n * cwid + (n - 1) * gap, cy = fy + 20 + step * ri + (step - chgt) / 2;
        row.forEach(function (s, k) { if (at[s]) tcard(x, at[s], fx + fw / 2 - tw / 2 + k * (cwid + gap), cy, cwid, chgt); });
      });
      // ---- The call to play
      x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = '900 ' + (story ? 46 : 38) + 'px ' + FONT;
      x.fillText('Draft the Team of the Week', W / 2, Y.head);
      var cta = 'PLAY FREE AT 27-0.APP', ch = story ? 70 : 60;
      x.font = '900 ' + (story ? 28 : 25) + 'px ' + FONT; var ctw = x.measureText(cta).width + 80;
      rr(x, W / 2 - ctw / 2, Y.btn, ctw, ch, ch / 2);
      var bgr = x.createLinearGradient(W / 2 - ctw / 2, 0, W / 2 + ctw / 2, 0); bgr.addColorStop(0, '#7dd3fc'); bgr.addColorStop(0.5, '#e0f2fe'); bgr.addColorStop(1, '#7dd3fc'); x.fillStyle = bgr; x.fill();
      x.fillStyle = '#04121f'; x.fillText(cta, W / 2, Y.btn + ch * 0.65);
      return new Promise(function (ok, no) {
        cv.toBlob(function (b) { cv.width = 1; cv.height = 1; if (b) ok(b); else no(new Error('The picture could not be saved.')); }, 'image/png');
      });
    });
  }
  // One player, like the Team of the Year cards: World Cup blue, a sky edge; his spot and nation's tag on top, his name,
  // then the new rating with RATING and the boost
  function tcard(x, e, cx, cy, w, h) {
    var nat = NATC[e.k] || ['#334155', String(e.k || '').toUpperCase()], v = Math.min(99, (+e.r || 0) + (+e.b || 0)), small = h < 105;
    x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 12; x.shadowOffsetY = 4;
    rr(x, cx, cy, w, h, 14);
    var g = x.createLinearGradient(cx, cy, cx + w * 0.6, cy + h); g.addColorStop(0, '#1d5a94'); g.addColorStop(0.3, '#123a66'); g.addColorStop(1, '#0a2242');
    x.fillStyle = g; x.fill(); x.restore();
    x.save(); rr(x, cx, cy, w, h, 14); x.clip();
    var sh = x.createLinearGradient(cx, cy, cx + w, cy + h * 0.7);
    sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,.08)');
    x.fillStyle = sh; x.fillRect(cx, cy, w, h); x.restore();
    rr(x, cx + 1.5, cy + 1.5, w - 3, h - 3, 13); x.lineWidth = 3; x.strokeStyle = foil(x, cx, cy, cx + w, cy + h, WCB); x.stroke();
    var pad = 12;
    // The spot and the nation's tag
    x.fillStyle = SKY; x.font = '800 ' + (small ? 19 : 21) + 'px ' + FONT; x.textAlign = 'left'; x.fillText(TPOS[e.s - 1] || '', cx + pad, cy + (small ? 26 : 30));
    x.font = '900 14px ' + FONT; var tw = x.measureText(nat[1]).width + 14;
    rr(x, cx + w - pad - tw, cy + (small ? 9 : 12), tw, 22, 5); x.fillStyle = nat[0]; x.fill();
    if (lightC(nat[0])) { x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.3)'; x.stroke(); }
    x.fillStyle = lightC(nat[0]) ? '#111111' : '#ffffff'; x.textAlign = 'center'; x.fillText(nat[1], cx + w - pad - tw / 2, cy + (small ? 25 : 28));
    // The name
    var nm = surname(e.n);
    x.fillStyle = '#ffffff'; x.textAlign = 'center'; fit(x, nm, '900', small ? 27 : 30, w - 16, 14); x.fillText(nm, cx + w / 2, cy + h * (small ? 0.535 : 0.545));
    // The rating, RATING, and the boost
    var vt = String(v), vs = small ? 31 : 35, bt = '+' + e.b;
    x.font = '900 ' + vs + 'px ' + FONT; var vw = x.measureText(vt).width; x.font = '800 15px ' + FONT; var uw = x.measureText('RATING').width + 6;
    x.font = '900 15px ' + FONT; var bw = x.measureText(bt).width + 14;
    var vx = cx + w / 2 - (vw + 8 + uw + 8 + bw) / 2, vy = cy + h - (small ? 14 : 18);
    x.fillStyle = '#ffffff'; x.font = '900 ' + vs + 'px ' + FONT; x.textAlign = 'left'; x.fillText(vt, vx, vy);
    x.fillStyle = SKY; x.font = '800 15px ' + FONT; spaced(x, 'RATING', vx + vw + 8, vy - 2, 1, 'left');
    var px = vx + vw + 8 + uw + 8;
    rr(x, px, vy - 19, bw, 22, 11); x.fillStyle = '#38bdf8'; x.fill();
    x.fillStyle = '#04121f'; x.font = '900 15px ' + FONT; x.textAlign = 'center'; x.fillText(bt, px + bw / 2, vy - 3);
  }

  /* World Champions (15 Oct 2026, the owner's calls; Admin's World Champions card): the World Cup final's winners, their
     starting 13 on a field (never the interchange; the whole squad is boosted) in premium World Cup blue foil, each at his
     boosted rating with the trophy, the Player of the Final at 99 with the medal and a pearl-white edge, a scoreboard
     (the final, 95+ rated, when it ends) and the call to play 27-0. Never gold (gold is the CAST Pass's).
     o: { format: 'portrait' or 'story', nation, nationName, opp, oppName, potf, pnat, until (ms),
          team: [{ s: 1-13, n, k, own, r (boosted), medal }] } */
  var WCF = ['#0c4a6e', '#38bdf8', '#f0f9ff', '#7dd3fc', '#0369a1', '#bae6fd', '#0c4a6e'], PEARL = ['#7dd3fc', '#ffffff', '#bae6fd', '#ffffff', '#7dd3fc'];
  function wch(o) {
    var story = o.format === 'story', W = 1080, H = story ? 1920 : 1350, logos = o.logos || {};
    return Promise.all([fonts(), img(logos.cast || SITE + 'cast-patrol.png'), img(logos.game || SITE + '27-0.png')]).then(function (got) {
      var cv = document.createElement('canvas');
      cv.width = W * SCALE; cv.height = H * SCALE;
      var x = cv.getContext('2d');
      x.scale(SCALE, SCALE);
      x.textBaseline = 'alphabetic';
      var Y = story ? { logo: 140, logoH: 104, kick: 300, title: 420, nm: 494, sb: 530, sbH: 104, f0: 680, head: 1680, btn: 1720 }
        : { logo: 44, logoH: 80, kick: 166, title: 268, nm: 330, sb: 356, sbH: 86, f0: 466, head: 1240, btn: 1262 };
      Y.f1 = Y.head - (story ? 96 : 70);
      // ---- Deep World Cup blue, a spotlight from the top and foil confetti
      var bg = x.createRadialGradient(W / 2, H * 0.12, 40, W / 2, H * 0.35, H * 0.95);
      bg.addColorStop(0, '#1a5a94'); bg.addColorStop(0.4, '#0a2a4f'); bg.addColorStop(1, '#030914');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      var r = rng(story ? 151 : 115);
      for (var i = 0; i < (story ? 90 : 64); i++) {
        x.save(); x.translate(r() * W, r() * H * 0.55); x.rotate(r() * Math.PI);
        x.globalAlpha = 0.25 + r() * 0.5; x.fillStyle = ['#e0f2fe', '#7dd3fc', '#ffffff', '#38bdf8'][Math.floor(r() * 4)];
        x.fillRect(-5, -2, 10 + r() * 8, 4); x.restore();
      }
      // ---- The logos: cast | 27-0
      var cast = got[1], gm = got[2], lh = Y.logoH;
      if (cast) { var cw = lh * 0.86 * cast.width / cast.height; x.drawImage(cast, W / 2 - 26 - cw, Y.logo + lh * 0.07, cw, lh * 0.86); }
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(W / 2 - 1, Y.logo + 4, 2, lh - 8);
      if (gm) { var gw = lh * 1.12 * gm.width / gm.height; x.drawImage(gm, W / 2 + 22, Y.logo - lh * 0.06, gw, lh * 1.12); }
      // ---- The kicker in a foil-edged pill
      var kick = 'RUGBY LEAGUE WORLD CUP 2026';
      x.font = '800 24px ' + FONT;
      var kw = x.measureText(kick).width + kick.length * 2.2 + 56;
      rr(x, W / 2 - kw / 2, Y.kick - 34, kw, 50, 25);
      x.fillStyle = 'rgba(255,255,255,.07)'; x.fill();
      x.lineWidth = 2; x.strokeStyle = foil(x, W / 2 - kw / 2, 0, W / 2 + kw / 2, 0, WCF); x.stroke();
      x.fillStyle = '#e0f2fe'; spaced(x, kick, W / 2, Y.kick, 2.2);
      // ---- The title, in foil, and the champions' name
      x.save(); x.shadowColor = 'rgba(56,189,248,.6)'; x.shadowBlur = 34;
      x.font = '900 ' + (story ? 108 : 92) + 'px ' + FONT; x.textAlign = 'center';
      var tw0 = x.measureText('World Champions').width;
      x.fillStyle = foil(x, W / 2 - tw0 / 2, 0, W / 2 + tw0 / 2, 0, ['#bae6fd', '#ffffff', '#7dd3fc', '#ffffff', '#bae6fd']);
      x.fillText('World Champions', W / 2, Y.title); x.restore();
      x.fillStyle = '#ffffff'; x.textAlign = 'center'; fit(x, (o.nationName || '') + ' 🏆', '900', story ? 46 : 40, W - 200, 20); x.fillText((o.nationName || '') + ' 🏆', W / 2, Y.nm);
      // ---- The scoreboard: the final, 95+ RATED, when it ends
      rr(x, 70, Y.sb, W - 140, Y.sbH, 18);
      x.fillStyle = 'rgba(6,9,20,.6)'; x.fill();
      x.lineWidth = 2.5; x.strokeStyle = foil(x, 70, 0, W - 70, 0, WCF); x.stroke();
      var top = Y.sb + Y.sbH * 0.42, bot = Y.sb + Y.sbH * 0.78;
      x.textAlign = 'left'; x.fillStyle = SKY; x.font = '800 21px ' + FONT; spaced(x, 'THE FINAL', 100, top, 1.5, 'left');
      var fl = (o.nationName || '') + ' beat ' + (o.oppName || '');
      x.fillStyle = '#ffffff'; fit(x, fl, '800', 24, 300, 14); x.textAlign = 'left'; x.fillText(fl, 100, bot);
      var big = '95+', unit = 'RATED';
      x.font = '900 60px ' + FONT; var bw = x.measureText(big).width; x.font = '800 20px ' + FONT; var uw = x.measureText(unit).width + unit.length * 1.2;
      var bx = W / 2 - (bw + 14 + uw) / 2;
      x.fillStyle = '#ffffff'; x.font = '900 60px ' + FONT; x.textAlign = 'left'; x.fillText(big, bx, Y.sb + Y.sbH * 0.72);
      x.fillStyle = SKY; x.font = '800 20px ' + FONT; spaced(x, unit, bx + bw + 14, Y.sb + Y.sbH * 0.66, 1.2, 'left');
      var endTxt = o.until ? sydTime(o.until) : '';
      x.fillStyle = SKY; x.font = '800 21px ' + FONT; x.textAlign = 'right'; spaced(x, 'BOOSTED UNTIL', W - 100, top, 1.5, 'right');
      x.fillStyle = '#ffffff'; fit(x, endTxt, '800', 24, 300, 14); x.textAlign = 'right'; x.fillText(endTxt, W - 100, bot);
      // ---- The field
      var fx = 120, fw = W - 240, fy = Y.f0, fh = Y.f1 - Y.f0;
      x.save(); rr(x, fx, fy, fw, fh, 24); x.clip();
      for (i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#1f6a33' : '#1a5c2c'; x.fillRect(fx, fy + i * fh / 10, fw, fh / 10 + 1); }
      var vg = x.createRadialGradient(W / 2, fy + fh / 2, 50, W / 2, fy + fh / 2, fh * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = vg; x.fillRect(fx, fy, fw, fh);
      x.setLineDash([14, 12]); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(fx, fy + fh * 0.5); x.lineTo(fx + fw, fy + fh * 0.5); x.stroke(); x.setLineDash([]);
      x.restore();
      rr(x, fx, fy, fw, fh, 24); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.28)'; x.stroke();
      var at = {}; (o.team || []).forEach(function (e) { at[e.s] = e; });
      var shape = [[1], [2, 3, 4, 5], [6, 7], [8, 9, 10], [11, 12], [13]];
      var cwid = 184, chgt = story ? 116 : 98, gap = 14, step = (fh - 40) / 6;
      shape.forEach(function (row, ri) {
        var n = row.length, tw = n * cwid + (n - 1) * gap, cy = fy + 20 + step * ri + (step - chgt) / 2;
        row.forEach(function (s, k) { if (at[s]) wcard(x, at[s], o, fx + fw / 2 - tw / 2 + k * (cwid + gap), cy, cwid, chgt); });
      });
      // ---- The Player of the Final and the call to play
      x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = '900 ' + (story ? 42 : 34) + 'px ' + FONT;
      var pf = o.potf ? 'Player of the Final: ' + o.potf + ' 🏅' + (!o.pnat || o.pnat === o.nation ? '🏆' : '') : 'Draft the World Champions';
      fit(x, pf, '900', story ? 42 : 34, W - 160, 18); x.fillText(pf, W / 2, Y.head);
      var cta = 'PLAY WORLD CUP 8-0 AT 27-0.APP', ch = story ? 70 : 60;
      x.font = '900 ' + (story ? 28 : 25) + 'px ' + FONT; var ctw = x.measureText(cta).width + 80;
      rr(x, W / 2 - ctw / 2, Y.btn, ctw, ch, ch / 2);
      var bgr = x.createLinearGradient(W / 2 - ctw / 2, 0, W / 2 + ctw / 2, 0); bgr.addColorStop(0, '#7dd3fc'); bgr.addColorStop(0.5, '#f0f9ff'); bgr.addColorStop(1, '#7dd3fc'); x.fillStyle = bgr; x.fill();
      x.fillStyle = '#04121f'; x.fillText(cta, W / 2, Y.btn + ch * 0.65);
      return new Promise(function (ok, no) {
        cv.toBlob(function (b) { cv.width = 1; cv.height = 1; if (b) ok(b); else no(new Error('The picture could not be saved.')); }, 'image/png');
      });
    });
  }
  // One champion: premium blue foil with a shine, his spot and nation's tag, his name with the trophy (and the medal), and
  // his rating in a filled foil box. The Player of the Final has a pearl-white edge
  function wcard(x, e, o, cx, cy, w, h) {
    var nat = NATC[e.k] || ['#334155', String(e.k || '').toUpperCase()], small = h < 105, med = !!e.medal || e.n === o.potf;
    x.save(); x.shadowColor = 'rgba(56,189,248,.45)'; x.shadowBlur = 16; x.shadowOffsetY = 4;
    rr(x, cx, cy, w, h, 14);
    var g = x.createLinearGradient(cx, cy, cx + w * 0.7, cy + h); g.addColorStop(0, '#1f6aa8'); g.addColorStop(0.35, '#0f3d6e'); g.addColorStop(1, '#071d38');
    x.fillStyle = g; x.fill(); x.restore();
    x.save(); rr(x, cx, cy, w, h, 14); x.clip();
    var sh = x.createLinearGradient(cx, cy, cx + w, cy + h);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.42, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,.28)'); sh.addColorStop(0.58, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,.06)');
    x.fillStyle = sh; x.fillRect(cx, cy, w, h); x.restore();
    rr(x, cx + 1.5, cy + 1.5, w - 3, h - 3, 13); x.lineWidth = 3.5; x.strokeStyle = foil(x, cx, cy, cx + w, cy + h, med ? PEARL : WCF); x.stroke();
    var pad = 12;
    x.fillStyle = SKY; x.font = '800 ' + (small ? 19 : 21) + 'px ' + FONT; x.textAlign = 'left'; x.fillText(TPOS[e.s - 1] || '', cx + pad, cy + (small ? 26 : 30));
    x.font = '900 14px ' + FONT; var tw = x.measureText(nat[1]).width + 14;
    rr(x, cx + w - pad - tw, cy + (small ? 9 : 12), tw, 22, 5); x.fillStyle = nat[0]; x.fill();
    if (lightC(nat[0])) { x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.3)'; x.stroke(); }
    x.fillStyle = lightC(nat[0]) ? '#111111' : '#ffffff'; x.textAlign = 'center'; x.fillText(nat[1], cx + w - pad - tw / 2, cy + (small ? 25 : 28));
    var nm = surname(e.n) + ' ' + (med ? '🏅' : '') + '🏆';
    x.fillStyle = '#ffffff'; x.textAlign = 'center'; fit(x, nm, '900', small ? 25 : 28, w - 16, 13); x.fillText(nm, cx + w / 2, cy + h * (small ? 0.535 : 0.545));
    // The rating in its filled foil box
    var vt = String(e.r), bh = small ? 30 : 34, bw = small ? 62 : 68, by = cy + h - bh - (small ? 7 : 9), bx = cx + w / 2 - bw / 2;
    rr(x, bx, by, bw, bh, 8); x.fillStyle = foil(x, bx, by, bx + bw, by + bh, med ? PEARL : ['#7dd3fc', '#f0f9ff', '#38bdf8', '#e0f2fe', '#7dd3fc']); x.fill();
    x.fillStyle = '#04121f'; x.font = '900 ' + (small ? 25 : 28) + 'px ' + FONT; x.textAlign = 'center'; x.fillText(vt, cx + w / 2, by + bh * 0.8);
  }

  window.CastGfx = { premiers: premiers, totw: totw, wch: wch };
})();
