


(function () {
  'use strict';
  var base = window.buildShareCanvas;
  if (typeof base !== 'function') return;

  var GOLD = '#f1c073';
  
  var MODE_SKIN = {
    classic: { id: 'classic', a: '#f1c073', hi: '#ffe2a8', lo: '#c9953a', rgb: '241,192,115', pill: '#f1c073', ink: '#111111', bg: ['#16140f', '#07070b'] },
    daily:   { id: 'daily',   a: '#f1c073', hi: '#ffe2a8', lo: '#c9953a', rgb: '241,192,115', pill: '#f1c073', ink: '#111111', bg: ['#16140f', '#07070b'] },
    pack:    { id: 'pack',    a: '#7c9cff', hi: '#dbe4ff', lo: '#3b5bdb', rgb: '59,91,219',   pill: '#3b5bdb', ink: '#ffffff', bg: ['#0d1330', '#07070b'] },
    hard:    { id: 'hard',    a: '#ef4444', hi: '#fecaca', lo: '#b91c1c', rgb: '239,68,68',   pill: '#dc2626', ink: '#ffffff', bg: ['#1d0a0d', '#08060a'] }
  };
  function modeSkin() {
    if (window.CastDaily && CastDaily.current && CastDaily.current()) return MODE_SKIN.daily;
    return MODE_SKIN[(typeof STATE !== 'undefined' && STATE.gameMode) || 'classic'] || MODE_SKIN.classic;
  }
  window.cpModeSkin = modeSkin;
  
  function motif(ctx, M, W, H, k, noStamp) {
    var c = function (a) { return 'rgba(' + M.rgb + ',' + a + ')'; };
    ctx.save();
    if (M.id === 'hard') {
      
      [[14 * k, 22 * k], [H - 36 * k, 22 * k]].forEach(function (b) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, b[0], W, b[1]); ctx.clip();
        ctx.fillStyle = '#16060a'; ctx.fillRect(0, b[0], W, b[1]);
        ctx.fillStyle = c(.85);
        for (var x = -60 * k; x < W + 60 * k; x += 56 * k) { ctx.beginPath(); ctx.moveTo(x, b[0] + b[1]); ctx.lineTo(x + 28 * k, b[0] + b[1]); ctx.lineTo(x + 58 * k, b[0]); ctx.lineTo(x + 30 * k, b[0]); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      });
      ctx.strokeStyle = c(.05); ctx.lineWidth = 10 * k;
      for (var d = -H; d < W; d += 90 * k) { ctx.beginPath(); ctx.moveTo(d, 60 * k); ctx.lineTo(d + H * .6, H * .6); ctx.stroke(); }
    } else if (M.id === 'pack') {
      
      var holo = ctx.createLinearGradient(0, 0, W, H * .6);
      ['#ff6ad5', '#ad8cff', '#94d0ff', '#7af0c8', '#fff38a'].forEach(function (col, i) { holo.addColorStop(i / 4, col); });
      ctx.globalAlpha = .07; ctx.fillStyle = holo; ctx.fillRect(0, 0, W, H * .6); ctx.globalAlpha = 1;
      [[-.06, .12, -14], [.84, .1, 12], [.8, .36, -8], [-.04, .38, 9]].forEach(function (q) {
        ctx.save(); ctx.translate(q[0] * W + 100 * k, q[1] * H + 140 * k); ctx.rotate(q[2] * Math.PI / 180);
        rr(ctx, -100 * k, -140 * k, 200 * k, 280 * k, 18 * k); ctx.strokeStyle = c(.22); ctx.lineWidth = 4 * k; ctx.stroke();
        ctx.fillStyle = c(.06); ctx.fill(); ctx.restore();
      });
    } else {
      
      ctx.strokeStyle = c(.07); ctx.lineWidth = 3 * k;
      for (var yy = 60 * k; yy < H * .5; yy += 110 * k) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(60 * k, 0); ctx.lineTo(60 * k, H * .5); ctx.moveTo(W - 60 * k, 0); ctx.lineTo(W - 60 * k, H * .5); ctx.stroke();
      if (M.id === 'daily' && !noStamp) {
        
        var d8 = new Date(), mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d8.getMonth()];
        ctx.save(); ctx.translate(W - 150 * k, 150 * k); ctx.rotate(12 * Math.PI / 180);
        rr(ctx, -95 * k, -70 * k, 190 * k, 140 * k, 18 * k); ctx.strokeStyle = c(.55); ctx.lineWidth = 5 * k; ctx.stroke();
        ctx.fillStyle = c(.6); ctx.textAlign = 'center';
        ctx.font = '900 ' + Math.round(26 * k) + 'px Inter, sans-serif'; ctx.fillText('DAILY', 0, -30 * k);
        ctx.font = '900 ' + Math.round(58 * k) + 'px Inter, sans-serif'; ctx.fillText(d8.getDate() + ' ' + mon, 0, 38 * k);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  window.cpModeMotif = motif;
  var castImg = new Image(); castImg.src = 'assets/img/cast-wordmark.png';
  var gameImg = new Image(); gameImg.src = 'assets/img/27-0-logo.png';
  function ready(img) { return img.complete && img.naturalWidth > 0; }

  
  var CLUB = {
    broncos: ['#6B0046', '#F5A623'], raiders: ['#36AD2D', '#FFFFFF'], bulldogs: ['#00468B', '#FFFFFF'], sharks: ['#0182BB', '#FFFFFF'],
    dolphins: ['#FB141C', '#FFFFFF'], titans: ['#00A2E0', '#FFFFFF'], seaeagles: ['#6B1D45', '#FFFFFF'], storm: ['#592B8D', '#FFD600'],
    knights: ['#003087', '#FFFFFF'], warriors: ['#111111', '#FFFFFF'], cowboys: ['#0B233F', '#C4A84B'], eels: ['#002D71', '#FFD700'],
    panthers: ['#111111', '#FFFFFF'], rabbitohs: ['#003C1A', '#FFFFFF'], dragons: ['#D22730', '#FFFFFF'], roosters: ['#012D5C', '#FFFFFF'],
    tigers: ['#F37221', '#111111'], northerneagles: ['#8B1A1A', '#FFFFFF'], steelers: ['#C8102E', '#FFFFFF'], stgeorge: ['#D22730', '#FFFFFF'],
    wmagpies: ['#111111', '#FFFFFF']
  };
  function clubAbbr(c) {
    try { if (typeof CLUB_ABBR !== 'undefined' && CLUB_ABBR[c]) return CLUB_ABBR[c]; } catch (e) {   }
    return String(c || '').slice(0, 3).toUpperCase();
  }
  function rCol(r) { return r >= 95 ? '#f5c518' : r >= 90 ? '#fbbf24' : r >= 85 ? '#4ade80' : r >= 80 ? '#60a5fa' : '#94a3b8'; }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  
  
  function card(portrait) {
    var s = STATE.season, f = s.finals, sub = typeof calcSubRatings === 'function' ? calcSubRatings() : {};
    var journey = f.myTeamInFinals ? (f.myJourney || []) : [];
    var fw = journey.filter(function (j) { return j.won; }).length, fl = journey.length - fw;
    var tw = s.wins + fw, tl = s.losses + fl, is27 = tw === 27 && tl === 0;
    var result;
    if (is27) result = ['👑 27-0 INVINCIBLE', true];
    else if (f.isChampion) result = ['🏆 PREMIERS', true];
    else if (f.myTeamInFinals) {
      var lr = (journey[journey.length - 1] || {}).round || '';
      result = [lr === 'GRAND FINAL' ? 'GRAND FINALIST' : lr === 'Preliminary Finals' ? 'PRELIMINARY FINALIST' : lr === 'Semi Finals' ? 'SEMI-FINALIST' : 'TOP EIGHT', false];
    } else result = [s.myLadderPos === 18 ? '🥄 WOODEN SPOON' : ord(s.myLadderPos).toUpperCase() + ' ON THE LADDER', false];
    var era = STATE.gameMode === 'pack' ? 'PACK MODE' : STATE.yearFrom === 1998 && STATE.yearTo === 2026 ? 'ALL-TIME' :
      STATE.yearFrom === STATE.yearTo ? String(STATE.yearFrom) : STATE.yearFrom + ' to ' + STATE.yearTo;
    var daily = window.CastDaily && CastDaily.current && CastDaily.current();
    var M = modeSkin();

    var W = 1080, H = portrait ? 1350 : 1920, F = 'Inter, system-ui, -apple-system, sans-serif';
    var hx = portrait ? 745 : W / 2, gy = portrait ? 230 : 540;
    var SC = window.CP_SHARE_SCALE || 1; 
    var c = document.createElement('canvas'); c.width = W * SC; c.height = H * SC;
    var ctx = c.getContext('2d'); ctx.scale(SC, SC);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, M.bg[0]); bg.addColorStop(1, M.bg[1]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    
    var bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0, M.lo); bar.addColorStop(.5, M.a); bar.addColorStop(1, M.lo);
    ctx.fillStyle = bar; ctx.fillRect(0, 0, W, 14); ctx.fillRect(0, H - 14, W, 14);
    var glow = ctx.createRadialGradient(hx, gy, 20, hx, gy, 560);
    glow.addColorStop(0, 'rgba(' + M.rgb + ',' + (result[1] ? '.28' : '.16') + ')'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 1100);
    motif(ctx, M, W, H, 1, portrait);
    ctx.textAlign = 'center';

    
    var y = portrait ? 118 : 170, LH = 150, headTop = 60;
    if (portrait) {
      
    } else if (ready(castImg) && ready(gameImg)) {
      var cw = LH * castImg.naturalWidth / castImg.naturalHeight, gw = LH * gameImg.naturalWidth / gameImg.naturalHeight, gap = 56;
      var x = (W - (cw + gap + gw)) / 2;
      ctx.drawImage(castImg, x, y, cw, LH);
      ctx.fillStyle = 'rgba(' + M.rgb + ',.6)'; ctx.fillRect(x + cw + gap / 2 - 1.5, y + LH * 0.12, 3, LH * 0.76);
      ctx.drawImage(gameImg, x + cw + gap, y, gw, LH);
    } else { ctx.fillStyle = GOLD; ctx.font = '900 italic 120px ' + F; ctx.fillText('27-0', W / 2, y + 120); }
    if (!portrait) y += LH + 44;

    
    var dd = new Date(), ddTxt = dd.getDate() + ' ' + ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][dd.getMonth()];
    var modeTxt = daily ? (portrait ? '📅 DAILY · ' + ddTxt + ' · ' : '📅 DAILY CHALLENGE · ') + daily.theme.name.toUpperCase() : (STATE.gameMode === 'pack' ? '📦 PACK MODE' : STATE.gameMode === 'hard' ? '🔥 HARD MODE · ' + era : 'CLASSIC · ' + era);
    var mpF = portrait ? 26 : 30; ctx.font = '900 ' + mpF + 'px ' + F;
    while (portrait && ctx.measureText(modeTxt).width > 470 && mpF > 18) { mpF -= 1; ctx.font = '900 ' + mpF + 'px ' + F; }
    var mpW = ctx.measureText(modeTxt).width + 52, mpH = portrait ? 48 : 54, mpY = y - (portrait ? 34 : 38);
    rr(ctx, hx - mpW / 2, mpY, mpW, mpH, mpH / 2); ctx.fillStyle = M.pill; ctx.fill();
    ctx.fillStyle = M.ink; ctx.fillText(modeTxt, hx, mpY + mpH / 2 + mpF * 0.36);
    y += 14;
    
    var recSize = portrait ? 190 : 230, rTop = y + (portrait ? 4 : 24), rBase = rTop + recSize * 0.89;
    var g = ctx.createLinearGradient(0, rTop, 0, rBase);
    g.addColorStop(0, M.hi); g.addColorStop(.45, M.a); g.addColorStop(1, M.lo);
    ctx.fillStyle = is27 || f.isChampion || tw >= 20 ? g : '#ffffff'; ctx.font = '900 ' + recSize + 'px ' + F;
    ctx.fillText(tw + '-' + tl, hx, rBase);
    ctx.fillStyle = '#b8b8cc'; ctx.font = '800 ' + (portrait ? 24 : 28) + 'px ' + F;
    ctx.fillText('WON  ·  LOST', hx, rBase + (portrait ? 44 : 54));
    
    var bF = portrait ? 32 : 38; ctx.font = '900 ' + bF + 'px ' + F;
    while (portrait && ctx.measureText(result[0]).width > 440 && bF > 22) { bF -= 1; ctx.font = '900 ' + bF + 'px ' + F; }
    var bw = ctx.measureText(result[0]).width + 64, bh = portrait ? 58 : 66, bx = hx - bw / 2, by = rBase + (portrait ? 68 : 82);
    rr(ctx, bx, by, bw, bh, bh / 2);
    ctx.fillStyle = result[1] ? 'rgba(' + M.rgb + ',.18)' : 'rgba(255,255,255,.05)'; ctx.fill();
    ctx.strokeStyle = result[1] ? M.a : '#3a3a4e'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = result[1] ? M.hi : '#ffffff'; ctx.fillText(result[0], hx, by + bh / 2 + bF * 0.36);
    y = by + bh + 60;
    var name = (typeof myTeam === 'function' ? myTeam() : 'My Team').toUpperCase();
    var chips = [['OVERALL', s.rating], ['BACKS', sub.backs], ['FORWARDS', sub.forwards], ['SPINE', sub.spine]];
    if (portrait) {
      
      var colB = by + bh, lw = 300, lh = ready(gameImg) ? lw * gameImg.naturalHeight / gameImg.naturalWidth : 0;
      var stackH = lh + 22 + 30 + 18 + 2 * 66 + 10, sy = headTop + Math.max(0, (colB - headTop - stackH) / 2), lcx = 70 + 195;
      if (lh) ctx.drawImage(gameImg, lcx - lw / 2, sy, lw, lh);
      var ny = sy + lh + 22 + 26; ctx.textAlign = 'center';
      var nF2 = 30; ctx.font = '900 ' + nF2 + 'px ' + F;
      while (ctx.measureText(name).width > 380 && nF2 > 16) { nF2 -= 1; ctx.font = '900 ' + nF2 + 'px ' + F; }
      ctx.fillStyle = '#ffffff'; ctx.fillText(name, lcx, ny);
      var cy0 = ny + 18, cw2 = 185;
      chips.forEach(function (ch, i) {
        var cx = 70 + (i % 2) * (cw2 + 10), cyy = cy0 + Math.floor(i / 2) * 76;
        rr(ctx, cx, cyy, cw2, 66, 12); ctx.fillStyle = '#16162a'; ctx.fill();
        ctx.fillStyle = ch[1] != null ? rCol(ch[1]) : '#555566'; ctx.font = '900 32px ' + F;
        ctx.fillText(ch[1] != null ? ch[1] : '--', cx + cw2 / 2, cyy + 36);
        ctx.fillStyle = '#8a8aa0'; ctx.font = '800 15px ' + F; ctx.fillText(ch[0], cx + cw2 / 2, cyy + 57);
      });
      y = Math.max(colB, sy + stackH) + 34;
    }
    
    if (!portrait) {
    var nF = portrait ? 36 : 44; ctx.font = '900 ' + nF + 'px ' + F;
    var nw = ctx.measureText(name).width; if (nw > W - 140) ctx.font = '900 ' + Math.floor(nF * (W - 140) / nw) + 'px ' + F;
    ctx.fillStyle = '#ffffff'; ctx.fillText(name, W / 2, y);
    y += portrait ? 22 : 30;
    
    var cwid = (W - 140 - 3 * 16) / 4;
    var chH = portrait ? 78 : 96;
    chips.forEach(function (ch, i) {
      var cx = 70 + i * (cwid + 16);
      rr(ctx, cx, y, cwid, chH, 14); ctx.fillStyle = '#16162a'; ctx.fill();
      ctx.fillStyle = ch[1] != null ? rCol(ch[1]) : '#555566'; ctx.font = '900 ' + (portrait ? 36 : 44) + 'px ' + F;
      ctx.fillText(ch[1] != null ? ch[1] : '--', cx + cwid / 2, y + (portrait ? 42 : 52));
      ctx.fillStyle = '#8a8aa0'; ctx.font = '800 ' + (portrait ? 17 : 20) + 'px ' + F; ctx.fillText(ch[0], cx + cwid / 2, y + (portrait ? 66 : 82));
    });
    y += chH + (portrait ? 20 : 26);
    }

    
    var POS = ['FB', 'W', 'C', 'C', 'W', 'FE', 'HB', 'P', 'HK', 'P', 'SR', 'LK', 'SR'];
    
    var x0 = 70, rowW = W - 140, gapY = portrait ? 7 : 8;
    var avail = H - (portrait ? 110 : 170) - y, rowH = Math.min(portrait ? 62 : 74, Math.floor(avail / 13) - gapY), k = rowH / 54;
    for (var i = 0; i < 13; i++) {
      var p = STATE.team[i], ry = y + i * (rowH + gapY), mid = ry + rowH / 2;
      rr(ctx, x0, ry, rowW, rowH, 10); ctx.fillStyle = '#1a1a2c'; ctx.fill();
      ctx.textAlign = 'left'; ctx.fillStyle = '#8a8aa0'; ctx.font = '800 ' + Math.round(22 * k) + 'px ' + F;
      ctx.fillText(POS[i], x0 + 18, mid + 8 * k);
      if (!p) continue;
      var col = CLUB[p.club] || ['#444466', '#FFFFFF'];
      var cbW = 84 * k, cbX = x0 + 78 * k;
      rr(ctx, cbX, ry + 7 * k, cbW, rowH - 14 * k, 7); ctx.fillStyle = col[0]; ctx.fill();
      ctx.fillStyle = col[1]; ctx.font = '900 ' + Math.round(20 * k) + 'px ' + F; ctx.textAlign = 'center';
      ctx.fillText(clubAbbr(p.club), cbX + cbW / 2, mid + 7 * k);
      ctx.textAlign = 'left'; ctx.fillStyle = '#f0f0f0'; ctx.font = '800 ' + Math.round(28 * k) + 'px ' + F;
      var nx = cbX + cbW + 20, nm = p.name, maxW = x0 + rowW - 110 * k - nx;
      while (ctx.measureText(nm).width > maxW && nm.length > 4) nm = nm.slice(0, -2) + '…';
      ctx.fillText(nm, nx, mid + 10 * k);
      var rat = p.rating || 0, rbW = 76 * k;
      rr(ctx, x0 + rowW - rbW - 16, ry + 7 * k, rbW, rowH - 14 * k, 7); ctx.fillStyle = rCol(rat); ctx.fill();
      ctx.fillStyle = '#111111'; ctx.font = '900 ' + Math.round(26 * k) + 'px ' + F; ctx.textAlign = 'center';
      ctx.fillText(rat, x0 + rowW - 16 - rbW / 2, mid + 9 * k);
    }

    
    ctx.textAlign = 'center';
    if (portrait) {
      ctx.fillStyle = M.a; ctx.font = '900 32px ' + F; ctx.fillText('CAN YOU GO 27-0?  CASTGAMES.COM.AU', W / 2, H - 44);
    } else {
      ctx.fillStyle = M.a; ctx.font = '900 38px ' + F; ctx.fillText('CAN YOU GO 27-0?', W / 2, H - 100);
      ctx.fillStyle = '#ffffff'; ctx.font = '900 40px ' + F; ctx.fillText('CASTGAMES.COM.AU', W / 2, H - 50);
    }
    return c;
  }

  window.buildShareCanvas = function (fmt) {
    try { return card(fmt !== 'story'); } catch (e) {   }
    return base.apply(this, arguments);
  };
})();
