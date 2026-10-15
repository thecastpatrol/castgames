/* 4000 GOALS share card: draws the result (mode, total, all 18 picks) onto a 1080x1350 post image,
   and a full-height 1080x1920 Story image with a Cast Patrol | 4000 GOALS logo lockup.
   Built as soon as the results page shows, so tapping Share can hand the file straight to the
   phone's share sheet (iOS only allows sharing inside the tap itself). */
(function (T) {
  'use strict';

  var W = 1080, H = 1350;
  var GOLD = '#f1c073'; // the GOAT's only; the game's own colour is MODE_SKIN.plus (16 Oct 2026)
  // Each mode's own colour (matches the home cards and the in-game skin):
  // 4000+ maroon (16 Oct 2026: the game's own colour, gold stays with the CAST Pass), Exactly red, Team Spin purple, NRLW teal.
  var MODE_SKIN = {
    plus:  { id: 'plus',  a: '#ff5c6c', hi: '#ffc4cb', lo: '#a3192b', rgb: '255,92,108',  pill: '#a3192b', ink: '#ffffff', icon: '',    bg: ['#1c0b10', '#08060a'] },
    exact: { id: 'exact', a: '#ef4444', hi: '#fecaca', lo: '#b91c1c', rgb: '239,68,68',   pill: '#dc2626', ink: '#ffffff', icon: '🔥 ', bg: ['#1d0a0d', '#08060a'] },
    spin:  { id: 'spin',  a: '#a78bfa', hi: '#ede9fe', lo: '#7c3aed', rgb: '139,92,246',  pill: '#7c3aed', ink: '#ffffff', icon: '🎰 ', bg: ['#160f27', '#07070b'] },
    nrlw:  { id: 'nrlw',  a: '#2dd4bf', hi: '#ccfbf1', lo: '#0f9488', rgb: '20,184,166',  pill: '#2dd4bf', ink: '#042f2e', icon: '⭐ ', bg: ['#0a1b1b', '#06090b'] },
    // World Cup 200+ (4 Oct 2026): sky blue (like 27-0's World Cup), a globe behind the total
    wc:    { id: 'wc',    a: '#38bdf8', hi: '#e0f2fe', lo: '#0284c7', rgb: '14,165,233',  pill: '#38bdf8', ink: '#082f49', icon: '🌏 ', bg: ['#07131d', '#06070b'] }
  };
  // Each mode's background motif, drawn faintly behind the content (cx, cy = centre of the big number)
  function motif(ctx, M, H, cx, cy) {
    var c = function (a) { return 'rgba(' + M.rgb + ',' + a + ')'; };
    ctx.save();
    if (M.id === 'exact') {
      // A target: rings and a crosshair behind the total
      [140, 250, 360, 470].forEach(function (r, i) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = c(.16 - i * .03); ctx.lineWidth = i ? 3 : 5; ctx.stroke(); });
      ctx.strokeStyle = c(.12); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 520, cy); ctx.lineTo(cx - 90, cy); ctx.moveTo(cx + 90, cy); ctx.lineTo(cx + 520, cy);
      ctx.moveTo(cx, cy - 520); ctx.lineTo(cx, cy - 170); ctx.stroke();
    } else if (M.id === 'spin') {
      // Slot-machine reels: three tall columns with symbol ticks
      for (var r = -1; r <= 1; r++) {
        var rx = cx + r * 260 - 110, ry = cy - 360;
        roundRect(ctx, rx, ry, 220, 720, 40); ctx.fillStyle = c(.06); ctx.fill(); ctx.strokeStyle = c(.14); ctx.lineWidth = 3; ctx.stroke();
        for (var t = 0; t < 6; t++) { ctx.fillStyle = c(.08); roundRect(ctx, rx + 40, ry + 40 + t * 112, 140, 70, 16); ctx.fill(); }
      }
    } else if (M.id === 'wc') {
      // A globe: the outline, three meridians and three parallels, faint behind the total
      ctx.strokeStyle = c(.12); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, 420, 0, Math.PI * 2); ctx.stroke();
      [140, 280].forEach(function (rx) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, 420, 0, 0, Math.PI * 2); ctx.stroke(); });
      [-210, 0, 210].forEach(function (dy) { var hw = Math.sqrt(420 * 420 - dy * dy); ctx.beginPath(); ctx.moveTo(cx - hw, cy + dy); ctx.lineTo(cx + hw, cy + dy); ctx.stroke(); });
    } else if (M.id === 'nrlw') {
      // Scattered stars
      var pts = [[.1, .06, 34], [.88, .1, 46], [.2, .24, 22], [.82, .27, 28], [.04, .2, 30], [.93, .2, 24], [.5, .03, 20]]; // top area only, clear of the rows
      pts.forEach(function (p) { star(ctx, p[0] * W, p[1] * H, p[2], c(.16)); });
    } else {
      // 4000+: speed streaks like the logo
      ctx.strokeStyle = c(.07); ctx.lineWidth = 14; ctx.lineCap = 'round';
      for (var i = 0; i < 9; i++) { var yy = cy - 300 + i * 70; ctx.beginPath(); ctx.moveTo(-40, yy + 120); ctx.lineTo(W * .32 - i * 12, yy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(W + 40, yy + 120); ctx.lineTo(W * .68 + i * 12, yy); ctx.stroke(); }
    }
    ctx.restore();
  }
  function star(ctx, x, y, r, col) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  // Optional overrides for promo cards (never set by the game): S.cardSkin, S.cardTitle, S.cardBadge
  function skinOf(S) {
    if (S.cardSkin) return S.cardSkin; return MODE_SKIN[S.mode && S.mode.id] || MODE_SKIN.plus; }
  var logoImg = null;

  function loadLogo() {
    if (logoImg) return Promise.resolve(logoImg);
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { logoImg = img; resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = 'assets/logos/4000goals.png';
    });
  }

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 64px Inter'),
      document.fonts.load('800 30px Inter'),
      document.fonts.load('700 26px Inter')
    ]).catch(function () {});
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fitText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    var t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t + '…';
  }

  // Story (1080x1920) has its own full-height layout: big Cast logo, bigger total and rows.
  // Instagram covers roughly the top 220px and bottom 250px with its buttons, so text avoids those.
  var LAYOUT = {
    post: { H: 1350, logoW: 320, top: 60, modeSize: 26, totalSize: 180, badgeSize: 34, rowH: 50, rowMax: 64, gap: 7, footerSize: 34 },
    story: { H: 1920, lockH: 170, logoW: 300, top: 170, modeSize: 30, totalSize: 210, badgeSize: 38, rowH: 66, rowMax: 74, gap: 10, footerSize: 38 }
  };
  var castImg = null;
  function loadCast() {
    if (castImg) return Promise.resolve(castImg);
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { castImg = img; resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = 'assets/logos/cast-patrol.png';
    });
  }

  function draw(S, out, story) {
    var L = story ? LAYOUT.story : LAYOUT.post, H = L.H, k = L.rowH / 50, M = skinOf(S), ACC = M.a;
    var c = document.createElement('canvas');
    var SC = T.SHARE_SCALE || 1; // 2 for high-res promo exports; the game uses 1
    c.width = W * SC; c.height = H * SC;
    var ctx = c.getContext('2d'); ctx.scale(SC, SC);
    var F = 'Inter, system-ui, -apple-system, sans-serif';

    // Background
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, M.bg[0]); bg.addColorStop(1, M.bg[1]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // Mode colour bars along the top and bottom edges
    var bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0, M.lo); bar.addColorStop(.5, M.a); bar.addColorStop(1, M.lo);
    ctx.fillStyle = bar; ctx.fillRect(0, 0, W, 14); ctx.fillRect(0, H - 14, W, 14);

    var y = L.top;
    var gx = story ? W / 2 : 745, gy = story ? y + 320 : y + 150; // behind the big number
    var glow = ctx.createRadialGradient(gx, gy, 20, gx, gy, 560);
    glow.addColorStop(0, 'rgba(' + M.rgb + ',' + (out.win ? '.26' : '.16') + ')');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, y + 900);
    motif(ctx, M, H, gx, story ? y + 420 : gy);

    // Portrait: the 4000 GOALS logo on the left and the result on the right, so the width is used.
    // Story: the Cast Patrol | 4000 GOALS lockup on top, the result centred underneath.
    var side = !story && !!logoImg, hx = side ? 745 : W / 2, headTop = y;
    if (side) {
      // logo is drawn below, once the height of the result column is known
    } else if (castImg && logoImg) {
      var LH = L.lockH, cw = LH * castImg.width / castImg.height, gw = LH * logoImg.width / logoImg.height, gapX = 56;
      var x = (W - (cw + gapX + gw)) / 2;
      ctx.drawImage(castImg, x, y, cw, LH);
      ctx.fillStyle = 'rgba(' + M.rgb + ',.6)'; ctx.fillRect(x + cw + gapX / 2 - 1.5, y + LH * 0.12, 3, LH * 0.76);
      ctx.drawImage(logoImg, x + cw + gapX, y, gw, LH);
      y += LH + 30;
    } else {
      ctx.fillStyle = MODE_SKIN.plus.a; ctx.font = '900 italic 92px ' + F; ctx.textAlign = 'center'; // the game's own colour, not gold (16 Oct 2026)
      ctx.fillText('4000 GOALS', W / 2, y + 90); y += 120;
    }

    // Mode, then the total as the hero, then the result as a coloured badge
    var h = T.render.headline(S, out);
    ctx.textAlign = 'center';
    // Mode pill, filled in the mode's colour
    var modeLabel = S.cardTitle || M.icon + (S.mode.name + ' mode').toUpperCase();
    ctx.font = '900 ' + L.modeSize + 'px ' + F;
    var mpH = Math.round(L.modeSize * 1.75), mpW = ctx.measureText(modeLabel).width + 48, mpY = y - 6;
    roundRect(ctx, hx - mpW / 2, mpY, mpW, mpH, mpH / 2);
    ctx.fillStyle = M.pill; ctx.fill();
    ctx.fillStyle = M.ink; ctx.fillText(modeLabel, hx, mpY + mpH / 2 + L.modeSize * 0.36);
    y = mpY + mpH - L.modeSize + 6;
    var tTop = y + L.modeSize - 6, tBase = tTop + L.totalSize * 0.92;
    var numGrad = ctx.createLinearGradient(0, tTop, 0, tBase);
    numGrad.addColorStop(0, M.hi); numGrad.addColorStop(.45, ACC); numGrad.addColorStop(1, M.lo);
    var tSize = L.totalSize, tMax = side ? 500 : W - 160;
    ctx.font = '900 ' + tSize + 'px ' + F;
    while (ctx.measureText(String(out.total)).width > tMax && tSize > 90) { tSize -= 6; ctx.font = '900 ' + tSize + 'px ' + F; }
    ctx.fillStyle = numGrad;
    ctx.fillText(String(out.total), hx, tBase); // no comma (12 Oct 2026, the owner): it hung into the line below
    ctx.fillStyle = '#b8b8cc'; ctx.font = '800 ' + L.modeSize + 'px ' + F;
    ctx.fillText((T.totalLabel ? T.totalLabel(S) : T.ERA_LABEL).toUpperCase(), hx, tBase + 50);
    var label = S.cardBadge || (out.win ? '✅ ' : '') + h.title.toUpperCase();
    ctx.font = '900 ' + L.badgeSize + 'px ' + F;
    var bh = Math.round(L.badgeSize * 1.7), bw = ctx.measureText(label).width + 56, bx = hx - bw / 2, by = tBase + 72;
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    var bWin = S.cardBadge ? null : out.win;
    ctx.fillStyle = bWin === null ? 'rgba(' + M.rgb + ',.16)' : bWin ? 'rgba(74,222,128,.16)' : 'rgba(248,113,113,.16)'; ctx.fill();
    ctx.strokeStyle = bWin === null ? M.a : bWin ? 'rgba(74,222,128,.6)' : 'rgba(248,113,113,.6)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = bWin === null ? M.hi : bWin ? '#86efac' : '#fca5a5';
    ctx.fillText(label, hx, by + bh / 2 + L.badgeSize * 0.36);
    y = by + bh + 26;
    if (side) {
      // Logo centred down the left of the result column
      var lw = L.logoW, lh = lw * logoImg.height / logoImg.width, colB = by + bh;
      var ly = headTop + Math.max(0, (colB - headTop - lh) / 2);
      ctx.drawImage(logoImg, 70 + (390 - lw) / 2, ly, lw, lh);
      y = Math.max(colB, ly + lh) + 30;
    }

    // Team: 13 rows, shrunk only if they would not fit above the footer
    var best = null;
    S.slots.forEach(function (sl) { if (sl.player && sl.player.tries_1998_plus > 0 && (!best || sl.player.tries_1998_plus > best.tries_1998_plus)) best = sl.player; }); // no TOP SCORER when nobody scored
    var x0 = 70, rowW = W - 140, rowH = L.rowH, gap = L.gap;
    var footerTop = story ? H - 150 : H - 110;
    var avail = footerTop - y;
    // Rows fill the space down to the footer (up to rowMax), so there is no dead space either way
    rowH = Math.min(L.rowMax, Math.floor(avail / S.slots.length) - gap); k = rowH / 50;
    S.slots.forEach(function (sl, i) {
      var ry = y + i * (rowH + gap);
      var p = sl.player;
      roundRect(ctx, x0, ry, rowW, rowH, 10 * k);
      ctx.fillStyle = '#17172a'; ctx.fill();
      ctx.fillStyle = p && T.isGoat(p) ? 'rgba(241,192,115,.18)' : 'rgba(' + M.rgb + ',.07)'; ctx.fill();
      if (p === best) { ctx.strokeStyle = ACC; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8a8aa0'; ctx.font = '800 ' + Math.round(22 * k) + 'px ' + F;
      ctx.fillText(sl.code, x0 + 18, ry + rowH / 2 + 8 * k);
      if (!p) { ctx.fillStyle = '#5c5c72'; ctx.font = '700 ' + Math.round(24 * k) + 'px ' + F; ctx.fillText('Not picked', x0 + 170 * k, ry + rowH / 2 + 8 * k); return; }
      var club = T.club(T.slotClub(sl));
      var cx = x0 + 70 * k, cwid = 80 * k;
      ctx.save(); roundRect(ctx, cx, ry + 6 * k, cwid, rowH - 12 * k, 7); ctx.clip();
      ctx.fillStyle = club.primary; ctx.fillRect(cx, ry + 6 * k, cwid, rowH - 12 * k);
      ctx.fillStyle = club.accent; ctx.fillRect(cx, ry + 6 * k, 6 * k, rowH - 12 * k);
      ctx.restore();
      ctx.fillStyle = club.text; ctx.font = '900 ' + Math.round(20 * k) + 'px ' + F; ctx.textAlign = 'center';
      ctx.fillText(club.abbr, cx + cwid / 2 + 3, ry + rowH / 2 + 7 * k);
      ctx.textAlign = 'left';
      var nameFont = '800 ' + Math.round(27 * k) + 'px ' + F;
      ctx.fillStyle = T.isGoat(p) ? GOLD : '#f0f0f0'; ctx.font = nameFont;
      var nm = p.name + (T.isGoat(p) ? ' 🐐' : '');
      var nameX = cx + cwid + 22, nameMax = x0 + rowW - 130 * k - nameX;
      var tag = 'TOP SCORER', tagW = 0, tagH = 30 * k, tagFont = '900 ' + Math.round(17 * k) + 'px ' + F;
      if (p === best) { ctx.font = tagFont; tagW = ctx.measureText(tag).width + 22; nameMax -= tagW + 30; ctx.font = nameFont; }
      /* The whole name, never cut (11 Oct 2026, the owner: "Raymond Contra..." beside TOP SCORER): a long name gets a
         smaller font first, then the tag says TOP, and only a name that still won't fit is shortened */
      var nsz = 27;
      while (ctx.measureText(nm).width > nameMax && nsz > 21) { nsz--; nameFont = '800 ' + Math.round(nsz * k) + 'px ' + F; ctx.font = nameFont; }
      if (p === best && ctx.measureText(nm).width > nameMax) {
        nameMax += tagW; tag = 'TOP'; ctx.font = tagFont; tagW = ctx.measureText(tag).width + 22; nameMax -= tagW; ctx.font = nameFont;
      }
      var shown = fitText(ctx, nm, nameMax);
      ctx.fillText(shown, nameX, ry + rowH / 2 + 9 * k);
      if (p === best) {
        var tx = nameX + ctx.measureText(shown).width + 30, ty = ry + (rowH - tagH) / 2;
        roundRect(ctx, tx, ty, tagW, tagH, 6);
        ctx.fillStyle = M.pill; ctx.fill();
        ctx.fillStyle = M.ink; ctx.font = tagFont; ctx.textAlign = 'center';
        ctx.fillText(tag, tx + tagW / 2, ty + tagH / 2 + 6 * k);
        ctx.textAlign = 'left';
      }
      ctx.textAlign = 'right';
      ctx.fillStyle = p === best ? ACC : '#ffffff'; ctx.font = '900 ' + Math.round(30 * k) + 'px ' + F;
      ctx.fillText(T.fmt(p.tries_1998_plus), x0 + rowW - 20, ry + rowH / 2 + 11 * k);
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = ACC; ctx.font = '900 ' + L.footerSize + 'px ' + F;
    if (story) {
      ctx.fillText('CAN YOU BEAT IT?', W / 2, H - 100);
      ctx.fillStyle = '#ffffff'; ctx.font = '900 ' + (L.footerSize + 6) + 'px ' + F;
      ctx.fillText('4000GOALS.COM.AU', W / 2, H - 50);
    } else {
      ctx.fillText('CAN YOU BEAT IT?  4000GOALS.COM.AU', W / 2, H - 46);
    }
    return c;
  }

  function toCard(canvas, name) {
    return new Promise(function (resolve) {
      if (!canvas.toBlob) { resolve(null); return; }
      canvas.toBlob(function (blob) {
        if (!blob) { resolve(null); return; }
        var file = null;
        try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { file = null; }
        resolve({ file: file, blob: blob, url: URL.createObjectURL(blob), name: name });
      }, 'image/png');
    });
  }

  // Build both cards for the current result: { post, story }, each { file, blob, url, name } (or null)
  T.buildShareCard = function (S, out) {
    return Promise.all([loadLogo(), loadCast(), fontsReady()]).then(function () {
      return Promise.all([toCard(draw(S, out, false), 'my-4000goals.png'), toCard(draw(S, out, true), 'my-4000goals-story.png')]);
    }).then(function (r) { return r[0] || r[1] ? { post: r[0], story: r[1] } : null; })
      .catch(function () { return null; });
  };
})(window.T = window.T || {});
