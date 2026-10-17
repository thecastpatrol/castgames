



















(function (root) {
  'use strict';
  var DATA = (root && root.CAST_KITS_DATA) || null, uid = 0;

  function n(v) { return Math.round(v * 10) / 10; }
  function pts(a) { return a.map(function (p) { return n(p[0]) + ',' + n(p[1]); }).join(' '); }
  function poly(a, f, extra) { return '<polygon points="' + pts(a) + '" fill="' + f + '"' + (extra || '') + '/>'; }
  function rect(x, y, w, h, f) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '" fill="' + f + '"/>'; }
  function path(d, f, extra) { return '<path d="' + d + '" fill="' + f + '"' + (extra || '') + '/>'; }
  function stroke(d, col, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + n(w) + '"' + (extra || '') + '/>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) || 0; }); }
  function hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  function shade(h, t) { var c = rgb(h); return hex(c.map(function (v) { return t < 0 ? v * (1 + t) : v + (255 - v) * t; })); }
  function lum(h) { var c = rgb(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  
  function edgeFor(base) { return lum(base) > 0.6 ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,.55)'; }
  function wrap(inner, vw, vh, opts, label) {
    var w = (opts && opts.w) || vw, h = (opts && opts.h) || vh;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + n(w) + '" height="' + n(h) + '" viewBox="0 0 ' + vw + ' ' + vh +
      '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(label || 'Kit') + '" focusable="false">' + inner + '</svg>';
  }
  function clipDef(id, d) { return '<defs><clipPath id="' + id + '"><path d="' + d + '"/></clipPath></defs>'; }
  
  function get(sport, id) {
    var D = DATA || (root && root.CAST_KITS_DATA) || null;
    return D && D[sport] && Object.prototype.hasOwnProperty.call(D[sport], id) ? D[sport][id] : null;
  }

  

  var AFL = {
    body: 'M64,10 L84,6 Q100,24 116,6 L136,10 Q138,40 156,50 L152,144 Q100,149 48,144 L44,50 Q62,40 64,10 Z',
    X: function (f) { return 44 + f * 112; }, Y: function (f) { return 6 + f * 140; }
  };
  function aflLayer(L, base) {
    var X = AFL.X, Y = AFL.Y, s = '', i, k;
    if (L.t === 'vstripes') {
      var bw = 112 / L.count;
      for (i = 0; i < L.count; i++) s += rect(44 + i * bw, 0, bw + 0.4, 150, L.colors[i % L.colors.length]);
    } else if (L.t === 'hoops') {
      var y0 = Y(L.from || 0), y1 = Y(L.to == null ? 1 : L.to), bh = (y1 - y0) / L.count;
      if (!L.from) y0 = 0; 
      for (i = 0; i < L.count; i++) { var top = i ? Y(L.from || 0) + i * bh : y0; s += rect(30, top, 140, (Y(L.from || 0) + (i + 1) * bh) - top + 0.4, L.colors[i % L.colors.length]); }
    } else if (L.t === 'bands') {
      L.bands.forEach(function (b) { s += rect(30, Y(b[1]), 140, Y(b[2]) - Y(b[1]), b[0]); });
    } else if (L.t === 'panels') {
      var tot = L.sizes.reduce(function (a, b) { return a + b; }, 0), x = 44;
      L.colors.forEach(function (c, j) { var w = 112 * L.sizes[j] / tot; s += rect(j ? x : 20, 0, (j ? w : w + 24) + (j === L.colors.length - 1 ? 24 : 0.4), 150, c); x += w; });
    } else if (L.t === 'sash') {
      
      var a = L.from === 'left' ? [56, 2] : [146, 2], b = L.from === 'left' ? [160, 136] : [40, 136];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy), hw = L.width * 140 / 2, nx = -dy / len * hw, ny = dx / len * hw;
      var ex = dx / len * 30, ey = dy / len * 30;
      s += poly([[a[0] + nx - ex, a[1] + ny - ey], [b[0] + nx + ex, b[1] + ny + ey], [b[0] - nx + ex, b[1] - ny + ey], [a[0] - nx - ex, a[1] - ny - ey]], L.color);
    } else if (L.t === 'yoke') {
      var d = Y(L.depth);
      if (L.shape === 'v') s += poly([[20, 0], [180, 0], [180, d], [100, Y(L.point)], [20, d]], L.color);
      else if (L.shape === 'sails') {
        
        var e = [[20, 0], [180, 0], [180, d - 6]], drops = [0.05, -0.02, 0.07, -0.01, 0.09, 0, 0.06, -0.02, 0.08, 0.01, 0.04];
        for (i = 0; i < drops.length; i++) e.push([156 - i * (112 / (drops.length - 1)), d + drops[i] * 140 - (i % 2 ? 0 : 2)]);
        e.push([20, d - 6]);
        s += poly(e, L.color);
      } else if (L.shape === 'wings') {
        
        s += poly([[20, 0], [86, 0], [97, Y(0.36)], [72, Y(0.4)], [44, Y(L.depth)], [20, Y(L.depth)]], L.color) +
          poly([[180, 0], [114, 0], [103, Y(0.36)], [128, Y(0.4)], [156, Y(L.depth)], [180, Y(L.depth)]], L.color);
      } else s += rect(20, 0, 160, d, L.color);
      if (L.edge) s += rect(20, d, 160, L.edge[1] * 140, L.edge[0]);
    } else if (L.t === 'chevrons') {
      for (k = 0; k < L.count; k++) {
        var t0 = Y(L.top + k * (L.gap + L.width)), t1 = t0 + L.width * 140, dp = L.depth * 140;
        s += poly([[50, t0], [100, t0 + dp], [150, t0], [150, t1], [100, t1 + dp], [50, t1]], L.color);
      }
    } else if (L.t === 'vee') {
      
      var off = 0;
      L.bands.forEach(function (b) {
        var o0 = off * 140, o1 = (off + b[1]) * 140;
        s += poly([[30, Y(-0.02) + o0], [100, Y(L.point) + o0], [170, Y(-0.02) + o0], [170, Y(-0.02) + o1], [100, Y(L.point) + o1], [30, Y(-0.02) + o1]], b[0]);
        off += b[1];
      });
    }
    return s;
  }
  function drawAfl(k, opts, label) {
    var id = 'ck' + (++uid), s = clipDef(id, AFL.body) + '<g clip-path="url(#' + id + ')">' + rect(0, 0, 200, 150, k.base);
    (k.layers || []).forEach(function (L) { s += aflLayer(L, k.base); });
    s += '</g>';
    var trim = k.trim || shade(k.base, -0.3);
    s += stroke('M84,6 Q100,24 116,6', trim, 4.5, ' stroke-linecap="round"') +
      stroke('M64,10 Q62,40 44,50', trim, 3) + stroke('M136,10 Q138,40 156,50', trim, 3) +
      path(AFL.body, 'none', ' stroke="' + edgeFor(k.base) + '" stroke-width="1.6" stroke-linejoin="round"');
    return wrap(s, 200, 150, opts, label);
  }

  

  var NFL = {
    body: 'M78,8 Q100,30 122,8 L150,14 L180,40 L170,72 L150,64 L148,142 L52,142 L50,64 L30,72 L20,40 L50,14 Z',
    A: [20, 40], B: [30, 72]
  };
  
  function sleeveBands(list, at, base) {
    var K = 1.3, A = NFL.A, B = NFL.B, ux = B[0] - A[0], uy = B[1] - A[1], L = Math.sqrt(ux * ux + uy * uy), tx = ux / L, ty = uy / L, nx = ty, ny = -tx, s = '', d = (at || 0) * K;
    var a = [A[0] - tx * 30, A[1] - ty * 30], b = [B[0] + tx * 10, B[1] + ty * 10];
    list.forEach(function (st) {
      var c = st[0] === 'base' ? base : st[0], w = st[1] * K;
      if (st[0] !== 'base') s += poly([[a[0] + nx * d, a[1] + ny * d], [b[0] + nx * d, b[1] + ny * d], [b[0] + nx * (d + w), b[1] + ny * (d + w)], [a[0] + nx * (d + w), a[1] + ny * (d + w)]], c);
      d += w;
    });
    return s;
  }
  function shoulderArt(sh, base) {
    if (!sh) return '';
    if (sh.t === 'tiger') {
      return poly([[58, 13], [64, 15], [40, 40], [36, 36]], sh.color) + poly([[44, 22], [49, 24], [29, 52], [25, 48]], sh.color) +
        poly([[30, 34], [35, 36], [24, 58], [21, 54]], sh.color) + poly([[70, 12], [76, 12], [62, 30], [58, 28]], sh.color);
    }
    if (sh.t === 'sweep') return poly([[16, 34], [46, 46], [40, 58], [34, 76], [24, 76]], sh.colors[1]) + poly([[16, 38], [44, 49], [38, 60], [33, 76], [24, 76]], sh.colors[0]);
    if (sh.t === 'bolt') {
      var bolt = [[66, 11], [56, 11], [38, 40], [46, 39], [34, 66], [58, 31], [50, 32]];
      return poly(bolt, sh.color, sh.edge ? ' stroke="' + sh.edge + '" stroke-width="1.6" stroke-linejoin="round"' : '');
    }
    if (sh.t === 'horn') return path('M62,13 C32,14 18,46 34,70 L40,68 C30,48 40,26 64,21 Z', sh.color);
    if (sh.t === 'over') {
      
      var s = '', cs = sh.colors, w = 3.4, P = [84, 9], Q = [24, 60], dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.sqrt(dx * dx + dy * dy), nx = -dy / L, ny = dx / L;
      cs.forEach(function (c, i) {
        var o = (i - (cs.length - 1) / 2) * w;
        s += stroke('M' + n(P[0] + nx * o) + ',' + n(P[1] + ny * o) + ' L' + n(Q[0] + nx * o) + ',' + n(Q[1] + ny * o), c, w + 0.3);
      });
      return s;
    }
    return '';
  }
  function drawNfl(k, opts, label) {
    var j = k.jersey, id = 'ck' + (++uid), s = clipDef(id, NFL.body) + '<g clip-path="url(#' + id + ')">' + rect(0, 0, 200, 150, j.base);
    var left = '';
    if (j.sides) left += poly([[46, 60], [60, 64], [58, 146], [46, 146]], j.sides);
    if (j.sleeve) left += sleeveBands(j.sleeve, j.sleeveAt, j.base);
    left += shoulderArt(j.shoulder, j.base);
    s += left + '<g transform="translate(200,0) scale(-1,1)">' + left + '</g>';
    if (j.collar) s += stroke('M78,8 Q100,30 122,8', j.collar, 7);
    if (j.collarEdge) s += stroke('M80,11.5 Q100,33 120,11.5', j.collarEdge, 1.6);
    s += '</g>';
    if (opts && opts.number) {
      var num = opts.number === true ? '10' : String(opts.number).slice(0, 2), nm = j.numbers || ['#FFFFFF', '#000000'];
      s += '<text x="100" y="104" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="50" fill="' + nm[0] +
        '" stroke="' + nm[1] + '" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">' + esc(num) + '</text>';
    }
    s += path(NFL.body, 'none', ' stroke="' + edgeFor(j.base) + '" stroke-width="1.6" stroke-linejoin="round"');
    if (opts && opts.helmet && k.helmet) s += '<g transform="translate(150,96) scale(0.42)">' + helmetInner(k.helmet) + '</g>';
    return wrap(s, 200, 150, opts, label);
  }

  

  var SHELL = 'M24,66 C14,34 38,10 70,10 C98,10 116,32 112,62 C111,72 106,78 98,80 L66,80 C60,80 56,76 54,72 L40,70 C34,74 26,74 24,66 Z';
  function helmetInner(h) {
    var id = 'ck' + (++uid), s = clipDef(id, SHELL) + '<g clip-path="url(#' + id + ')">' + rect(0, 0, 120, 100, h.base);
    var arc = 'M30,30 C48,8 96,6 112,44';
    if (h.stripe && h.stripe.length) {
      var st = h.stripe, W = 10;
      if (st.length % 2) { for (var i = 0; i < (st.length + 1) / 2; i++) s += stroke(arc, st[i], W * (1 - i / ((st.length + 1) / 2)) + (i ? 0 : 0)); }
      else st.forEach(function (c, i) { s += stroke(arc, c, W / st.length, ' transform="translate(' + n((i - (st.length - 1) / 2) * 1.2) + ',' + n((i - (st.length - 1) / 2) * W / st.length) + ')"'); });
    }
    if (h.tiger) s += poly([[50, 10], [58, 10], [48, 36], [44, 34]], h.tiger) + poly([[70, 8], [78, 9], [70, 40], [65, 38]], h.tiger) + poly([[92, 14], [99, 18], [92, 46], [88, 44]], h.tiger) + poly([[34, 22], [41, 20], [34, 46], [30, 44]], h.tiger);
    if (h.horn) s += path('M50,16 C80,6 112,24 104,58 C100,72 86,76 78,68 C92,62 96,46 86,36 C78,28 62,26 50,30 Z', h.horn);
    if (h.wings) s += path('M40,40 C56,18 90,14 112,24 C96,26 84,30 74,38 C88,36 98,38 106,42 C88,46 74,48 60,56 Z', h.wings);
    s += '</g>' + path(SHELL, 'none', ' stroke="' + edgeFor(h.base) + '" stroke-width="2" stroke-linejoin="round"');
    
    s += '<circle cx="70" cy="56" r="5" fill="' + shade(h.base, -0.45) + '"/>';
    var m = h.mask || '#A5ACAF';
    s += stroke('M40,62 L10,62 L8,82 L30,86 L56,82 M10,72 L48,72 M24,62 L22,86 M40,62 L40,84', m, 4.2, ' stroke-linejoin="round" stroke-linecap="round"');
    s += stroke('M40,62 L10,62 L8,82 L30,86 L56,82 M10,72 L48,72 M24,62 L22,86 M40,62 L40,84', 'rgba(0,0,0,.35)', 0.8, ' stroke-linejoin="round"');
    return s;
  }
  function helmet(clubId, opts) {
    var k = get('nfl', clubId);
    if (!k || !k.helmet) return '';
    return wrap(helmetInner(k.helmet), 120, 100, { w: (opts && opts.w) || 120, h: (opts && opts.h) || 100 }, k.name + ' helmet');
  }

   
  var BBL = { body: 'M80,8 Q100,26 120,8 L148,14 L178,44 L166,62 L148,52 L148,142 L52,142 L52,52 L34,62 L22,44 L52,14 Z' };
  function bblLayer(L, k) {
    var s = '', i;
    if (L.t === 'lower') s += rect(0, 8 + L.from * 134, 200, 150, L.color);
    else if (L.t === 'tonal-stripes') { var top = 8 + L.from * 134, bw = 96 / L.count; for (i = 0; i < L.count; i += 2) s += rect(52 + i * bw, top, bw, 150, L.color); s += rect(0, top - 1, 200, 2, L.color); }
    else if (L.t === 'shards') s += poly([[60, 30], [96, 18], [88, 30], [56, 42]], L.color) + poly([[104, 34], [146, 20], [140, 30], [100, 46]], L.color) + poly([[64, 50], [86, 44], [80, 52], [60, 58]], L.color);
    else if (L.t === 'flames') {
      var f = ' fill="none" stroke="' + L.color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
      s += path('M66,142 C58,120 72,108 70,92 C80,104 78,116 84,122 C86,110 92,104 90,90 C104,106 102,128 96,142', 'none', f) +
        path('M104,142 C100,128 112,120 110,108 C120,118 120,128 124,132 C128,124 126,116 130,110 C138,124 136,136 132,142', 'none', f);
    } else if (L.t === 'star') {
      var cx = 92, cy = 112, R = 38, r = 15, p = [];
      for (i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
      s += poly(p, L.color);
    } else if (L.t === 'topo') {
      
      var o = ' opacity="0.85"';
      s += path('M46,30 C62,18 84,40 74,52 C66,62 82,72 70,84 C58,94 44,80 52,68 C58,58 40,48 46,30 Z', L.color, o) +
        path('M108,22 C128,14 150,30 140,44 C132,54 112,46 106,58 C100,70 118,82 108,92 C96,100 88,84 94,72 C100,58 88,30 108,22 Z', L.color, o) +
        path('M120,98 C138,90 156,104 150,122 C146,136 128,130 122,142 L104,142 C104,128 118,124 112,114 C108,106 112,102 120,98 Z', L.color, o) +
        path('M58,108 C70,100 86,110 82,124 C80,134 66,132 62,142 L50,142 C48,128 50,114 58,108 Z', L.color, o) +
        path('M84,62 C92,58 100,64 98,72 C96,80 86,78 84,70 Z', L.color, o);
    } else if (L.t === 'tonal-diagonals') { for (i = -6; i < 12; i += 2) s += poly([[i * 18, 0], [i * 18 + 9, 0], [i * 18 + 9 + 120, 150], [i * 18 + 120, 150]], L.color, ' opacity="0.6"'); }
    else if (L.t === 'bolt') s += poly([[96, 70], [124, 70], [104, 100], [120, 100], [76, 142], [90, 108], [74, 108]], 'none', ' stroke="' + L.color + '" stroke-width="2.6" stroke-linejoin="round"');
    return s;
  }
  function drawBbl(k, opts, label) {
    var id = 'ck' + (++uid), s = clipDef(id, BBL.body) + '<g clip-path="url(#' + id + ')">' + rect(0, 0, 200, 150, k.base);
    (k.layers || []).forEach(function (L) { s += bblLayer(L, k); });
    if (k.sides) s += poly([[48, 50], [64, 58], [62, 146], [48, 146]], k.sides) + poly([[152, 50], [136, 58], [138, 146], [152, 146]], k.sides);
    if (k.piping) s += stroke('M82,10 L28,47', k.piping, 1.2) + stroke('M118,10 L172,47', k.piping, 1.2);
    s += stroke('M80,8 Q100,26 120,8', k.collar || shade(k.base, -0.35), 6);
    s += '</g>' + path(BBL.body, 'none', ' stroke="' + edgeFor(k.base) + '" stroke-width="1.6" stroke-linejoin="round"');
    return wrap(s, 200, 150, opts, label);
  }

  

  function capArt(c) {
    var base = c.base, dark = shade(base, -0.28), seam = shade(base, -0.4), hi = shade(base, 0.12), s = '';
    var dome = c.baggy ? 'M54,56 C48,14 152,14 146,56 Z' : 'M58,56 C56,20 144,20 142,56 Z';
    s += path(dome, base) + path(c.baggy ? 'M70,30 C80,20 96,18 108,20 C92,24 80,30 74,40 Z' : 'M72,32 C82,24 96,22 106,24 C92,27 82,32 76,42 Z', hi, ' opacity="0.55"');
    s += stroke('M100,' + (c.baggy ? 22 : 26) + ' L100,56 M100,24 C86,30 78,42 76,56 M100,24 C114,30 122,42 124,56', seam, 1.1, ' opacity="0.8"');
    s += '<circle cx="100" cy="' + (c.baggy ? 22 : 25) + '" r="3.2" fill="' + seam + '"/>';
    
    s += path('M56,54 Q100,62 146,54 Q160,58 160,64 Q126,76 92,72 Q66,70 54,62 Z', dark) + stroke('M56,55 Q100,63 146,55', seam, 1.4);
    s += path(dome, 'none', ' stroke="rgba(0,0,0,.45)" stroke-width="1.4"');
    return s;
  }
  function drawTest(k, opts, label) {
    var id = 'ck' + (++uid), body = 'M80,64 Q100,82 120,64 L140,68 L162,86 L154,104 L140,98 L139,148 L61,148 L60,98 L46,104 L38,86 L60,68 Z';
    var tr = k.trim && k.trim.length ? k.trim : ['#999999'], s = clipDef(id, body) + '<g clip-path="url(#' + id + ')">' + rect(0, 0, 200, 150, '#F7F5EE');
    
    for (var x = 70; x < 136; x += 12) s += stroke('M' + x + ',84 L' + x + ',148', '#E4E0D4', 1.4);
    var W = 7;
    tr.forEach(function (c, i) { s += stroke('M80,64 Q100,82 120,64', c, W - i * (W / tr.length) + 0.2); });
    tr.forEach(function (c, i) {
      var w = 6 / tr.length;
      s += poly([[38 + i * 1.2, 82 + i * w * 0.4], [50 + i * 1.2, 106 + i * w * 0.4], [50 + (i + 1) * 1.2, 106 + (i + 1) * w * 0.4], [38 + (i + 1) * 1.2, 82 + (i + 1) * w * 0.4]], c);
      s += '<g transform="translate(200,0) scale(-1,1)">' + poly([[38 + i * 1.2, 82 + i * w * 0.4], [50 + i * 1.2, 106 + i * w * 0.4], [50 + (i + 1) * 1.2, 106 + (i + 1) * w * 0.4], [38 + (i + 1) * 1.2, 82 + (i + 1) * w * 0.4]], c) + '</g>';
      s += rect(0, 141 + i * w, 200, w + 0.3, c);
    });
    s += '</g>' + path(body, 'none', ' stroke="rgba(0,0,0,.35)" stroke-width="1.4" stroke-linejoin="round"');
    s += '<g transform="translate(100,34) scale(0.86) translate(-100,-40)">' + capArt(k.cap) + '</g>';
    return wrap(s, 200, 150, opts, label);
  }

  














  
  function nrlFill(k, w, h) {
    var r = function (v) { return Math.round(v * 10) / 10; };
    var R = function (x, y, a, b, f) { return '<rect x="' + r(x) + '" y="' + r(y) + '" width="' + r(a) + '" height="' + r(b) + '" fill="' + f + '"/>'; };
    var P = function (pts, f) { return '<polygon points="' + pts.map(function (q) { return r(q[0] * w) + ',' + r(q[1] * h); }).join(' ') + '" fill="' + f + '"/>'; };
    var out = R(0, 0, w, h, k.base || '#5A6270'), L = k.layers || [];
    L.forEach(function (l) {
      var i, n, a, b;
      if (l.t === 'hoops' || l.t === 'stripes') {
        n = Math.max(1, l.count || 2); a = l.from == null ? 0 : l.from; b = l.to == null ? 1 : l.to;
        for (i = 0; i < n; i++) {
          var c = l.colors[i % l.colors.length], p0 = a + (b - a) * i / n, p1 = a + (b - a) * (i + 1) / n;
          out += l.t === 'hoops' ? R(0, p0 * h, w, (p1 - p0) * h + 0.4, c) : R(p0 * w, 0, (p1 - p0) * w + 0.4, h, c);
        }
      } else if (l.t === 'bands') l.bands.forEach(function (q) { out += R(0, q[1] * h, w, (q[2] - q[1]) * h, q[0]); });
      else if (l.t === 'cols') l.cols.forEach(function (q) { out += R(q[1] * w, 0, (q[2] - q[1]) * w, h, q[0]); });
      else if (l.t === 'v') {
        var top = l.top || 0, pt = l.point, off = 0;
        if (l.above) out += P([[-0.02, -0.02], [1.02, -0.02], [1.02, top], [0.5, pt], [-0.02, top]], l.above);
        l.bands.forEach(function (q) {
          out += P([[-0.02, top + off], [0.5, pt + off], [1.02, top + off], [1.02, top + off + q[1]], [0.5, pt + off + q[1]], [-0.02, top + off + q[1]]], q[0]);
          off += q[1];
        });
      } else if (l.t === 'yoke') {
        out += R(0, 0, w, l.depth * h, l.color);
        if (l.edge) out += R(0, l.depth * h, w, l.edge[1] * h, l.edge[0]);
      } else if (l.t === 'sash') {
        
        var sw = l.width || 0.24, right = l.dir !== 'left';
        var band = function (wd, col) {
          var hw = wd / 2, A = right ? [1.08, -0.08] : [-0.08, -0.08], B = right ? [-0.08, 1.08] : [1.08, 1.08];
          return P([[A[0] - hw, A[1]], [A[0] + hw, A[1]], [B[0] + hw, B[1]], [B[0] - hw, B[1]]].map(function (q) { return [q[0], q[1]]; }), col);
        };
        if (l.edge) out += band(sw + 2 * l.edge[1], l.edge[0]);
        out += band(sw, l.color);
      } else if (l.t === 'sides') {
        var sd = l.width || 0.14;
        if (l.edge) out += R(0, 0, (sd + l.edge[1]) * w, h, l.edge[0]) + R((1 - sd - l.edge[1]) * w, 0, (sd + l.edge[1]) * w, h, l.edge[0]);
        out += R(0, 0, sd * w, h, l.color) + R((1 - sd) * w, 0, sd * w, h, l.color);
      } else if (l.t === 'chevrons') {
        for (i = 0; i < (l.count || 1); i++) {
          var t0 = l.top + i * (l.width + (l.gap || 0)), t1 = t0 + l.width, dp = l.depth;
          out += P([[-0.02, t0], [0.5, t0 + dp], [1.02, t0], [1.02, t1], [0.5, t1 + dp], [-0.02, t1]], l.color);
        }
      } else if (l.t === 'poly') {
        out += P(l.pts, l.color);
        if (l.mirror) out += P(l.pts.map(function (q) { return [1 - q[0], q[1]]; }), l.color);
      }
    });
    
    if (!L.length && k.collar) out += P([[0.34, 0], [0.66, 0], [0.5, 0.2]], k.collar);
    return out;
  }
  

  

  var NRL = {
    body: 'M80,8 Q100,26 120,8 L146,12 L172,34 L160,58 L146,50 L146,142 L54,142 L54,50 L40,58 L28,34 L54,12 Z',
    torso: 'M80,8 Q100,26 120,8 L146,12 L146,142 L54,142 L54,12 Z',
    sleeve: 'M54,12 L28,34 L40,58 L54,50 Z', cuffA: [28, 34], cuffB: [40, 58]
  };
  function nested(inner, x, y, w, h, vw, vh) {
    return '<svg x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '" viewBox="0 0 ' + n(vw) + ' ' + n(vh) + '" preserveAspectRatio="none" overflow="hidden">' + inner + '</svg>';
  }
  function drawNrl(k, opts, label) {
    var id = 'ck' + (++uid), s = clipDef(id, NRL.body) + '<g clip-path="url(#' + id + ')">', sl = k.sleeves || {};
    
    
    var one = rect(0, 0, 60, 150, sl.c || k.base);
    if (sl.body) { var hz = (k.layers || []).filter(function (l) { return l.t === 'hoops' || l.t === 'bands'; }); if (hz.length) one = nested(nrlFill({ base: sl.c || k.base, layers: hz }, 92, 134), 0, 8, 60, 134, 92, 134); }
    if (sl.bands) {
      var A = NRL.cuffA, B = NRL.cuffB, ux = B[0] - A[0], uy = B[1] - A[1], Ln = Math.sqrt(ux * ux + uy * uy), tx = ux / Ln, ty = uy / Ln, nx = ty, ny = -tx, d = 0;
      var a = [A[0] - tx * 20, A[1] - ty * 20], b = [B[0] + tx * 20, B[1] + ty * 20];
      sl.bands.forEach(function (q) {
        if (q[0] !== 'base') one += poly([[a[0] + nx * d, a[1] + ny * d], [b[0] + nx * d, b[1] + ny * d], [b[0] + nx * (d + q[1]), b[1] + ny * (d + q[1])], [a[0] + nx * (d + q[1]), a[1] + ny * (d + q[1])]], q[0]);
        d += q[1];
      });
    }
    s += one + '<g transform="translate(200,0) scale(-1,1)">' + one + '</g>';
    var tid = 'ck' + (++uid);
    s += clipDef(tid, NRL.torso) + '<g clip-path="url(#' + tid + ')">' + nested(nrlFill(k, 92, 134), 54, 8, 92, 134, 92, 134) + '</g>';
    s += stroke('M80,8 Q100,26 120,8', k.collar || shade(k.base, -0.35), 5);
    s += '</g>' + path(NRL.body, 'none', ' stroke="' + edgeFor(k.base) + '" stroke-width="1.6" stroke-linejoin="round"');
    return wrap(s, 200, 150, opts, label);
  }

  



  var EMB = {
    'letter-m': 'M5 35V5h8l7 13.5L27 5h8v30h-7V17.5l-6 11.5h-4l-6-11.5V35z',
    star: 'M20 3l4.9 10.1 11.1 1.5-8.1 7.7 2 11L20 28l-9.9 5.3 2-11L4 14.6l11.1-1.5z',
    diamond: 'M20 3l15 17-15 17L5 20z', square: 'M8 8h24v24H8z',
    horseshoe: 'M9 6h7v13a4 4 0 0 0 8 0V6h7v13a11 11 0 0 1-22 0z',
    bolt: 'M23 3L9 23h9l-3 14 16-21h-9l4-13z',
    maltese: 'M20 20L11 4h18zM20 20l16-9v18zM20 20l9 16H11zM20 20L4 29V11z',
    diabolo: 'M6 4h28L20 20l14 16H6l14-16z'
  };
  function emblem(e, cx, cy, size) {
    if (!e || !e.t) return '';
    var sc = size / 40, g = '<g transform="translate(' + n(cx - 20 * sc) + ' ' + n(cy - 20 * sc) + ') scale(' + n(sc * 100) / 100 + ')" fill="' + e.c + '">';
    if (e.t === 'shamrock') return g + '<circle cx="20" cy="12" r="7"/><circle cx="12.5" cy="21" r="7"/><circle cx="27.5" cy="21" r="7"/><path d="M19 22h2.4l2.6 15h-3z"/></g>';
    if (e.t === 'disc') return g + '<circle cx="20" cy="20" r="14"/></g>';
    return EMB[e.t] ? g + '<path d="' + EMB[e.t] + '"/></g>' : '';
  }
  
  function tile(t, a, b, sz) {
    var id = 'ck' + (++uid), u = sz / 24, inner = '';
    if (t === 'stars') inner = '<path transform="scale(' + n(u * 100) / 100 + ')" d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" fill="' + b + '"/>';
    else if (t === 'spots') inner = '<circle cx="' + n(12 * u) + '" cy="' + n(12 * u) + '" r="' + n(4.6 * u) + '" fill="' + b + '"/>';
    else if (t === 'diamonds') inner = '<path transform="scale(' + n(u * 100) / 100 + ')" d="M12 1l11 11-11 11L1 12z" fill="' + b + '"/>';
    else if (t === 'checks') inner = rect(0, 0, sz / 2, sz / 2, b) + rect(sz / 2, sz / 2, sz / 2, sz / 2, b);
    else if (t === 'hoops') inner = rect(0, 0, sz, sz / 2, b);
    else if (t === 'stripes') inner = rect(0, 0, sz / 2, sz, b);
    else if (t === 'chevrons') inner = poly([[0, sz * 0.25], [sz / 2, sz * 0.58], [sz, sz * 0.25], [sz, sz * 0.5], [sz / 2, sz * 0.83], [0, sz * 0.5]], b);
    return { def: '<defs><pattern id="' + id + '" width="' + n(sz) + '" height="' + n(sz) + '" patternUnits="userSpaceOnUse">' + rect(0, 0, sz, sz, a) + inner + '</pattern></defs>', fill: 'url(#' + id + ')' };
  }
  
  function silkBody(k, W, H) {
    var p = k.pattern || {}, a = k.body, c = p.c || a, s = rect(0, 0, W, H, a), t = p.t, i, T;
    var tw = H / 4; 
    if (t === 'hoops') { var cs = p.c2 ? [a, c, p.c2] : [a, c], nh = 7; for (i = 0; i < nh; i++) s += rect(0, i * H / nh, W, H / nh + 0.3, cs[i % cs.length]); }
    else if (t === 'band') s += rect(0, H * 0.4, W, H * 0.2, c);
    else if (t === 'stripes') { var sw = H / 8, x0 = W / 2 - sw / 2; for (var x = x0; x < W; x += 2 * sw) s += rect(x, 0, sw, H, c); for (x = x0 - 2 * sw; x > -sw; x -= 2 * sw) s += rect(x, 0, sw, H, c); if (p.c2) for (x = x0 + sw; x < W; x += 4 * sw) s += rect(x, 0, sw, H, p.c2); }
    else if (t === 'stripe') s += rect(W / 2 - H * 0.08, 0, H * 0.16, H, c);
    else if (t === 'diagonal-stripes') { for (i = -12; i < 12; i++) s += poly([[W / 2 + i * H * 0.24, 0], [W / 2 + i * H * 0.24 + H * 0.12, 0], [W / 2 + i * H * 0.24 + H * 0.12 - H, H], [W / 2 + i * H * 0.24 - H, H]], i % 2 && p.c2 ? p.c2 : c); }
    else if (t === 'sash' || t === 'cross-sashes') {
      
      var band = function (flip) { var hw = H * 0.13, dx = Math.min(W * 0.42, H * 0.55), q = [[W / 2 + dx - hw, -2], [W / 2 + dx + hw, -2], [W / 2 - dx + hw, H + 2], [W / 2 - dx - hw, H + 2]]; if (flip) q = q.map(function (v) { return [W - v[0], v[1]]; }); return q; };
      var fillOf = function () { if (p.fill) { T = tile(p.fill, c, p.c2 || a, tw * 0.6); s += T.def; return T.fill; } return c; };
      s += poly(band(false), fillOf());
      if (t === 'cross-sashes') s += poly(band(true), c);
    }
    else if (t === 'stars' || t === 'spots' || t === 'diamonds' || t === 'checks' || t === 'chevrons') {
      var A2 = t === 'checks' && p.c2 ? c : a, B2 = t === 'checks' && p.c2 ? p.c2 : c;
      if (t === 'checks' && p.c2) A2 = a, B2 = c;
      T = tile(t, A2, B2, t === 'checks' ? tw * 0.8 : tw); s += T.def + rect(0, 0, W, H, T.fill);
    }
    else if (t === 'quarters' || t === 'quarters-check') {
      var qf = c;
      if (t === 'quarters-check') { T = tile('checks', c, p.c2 || '#FFFFFF', tw * 0.6); s += T.def; qf = T.fill; }
      s += rect(W / 2, 0, W / 2, H / 2, qf) + rect(0, H / 2, W / 2, H / 2, qf);
    }
    else if (t === 'halves') s += rect(W / 2, 0, W / 2, H, c);
    else if (t === 'diagonal-halves') s += poly([[W, 0], [W, H], [0, H]], c);
    else if (t === 'vee') s += poly([[W / 2 - H * 0.62, -2], [W / 2 - H * 0.42, -2], [W / 2, H * 0.5], [W / 2 + H * 0.42, -2], [W / 2 + H * 0.62, -2], [W / 2, H * 0.72]], c);
    else if (t === 'seams') s += stroke('M' + n(W / 2) + ',0 V' + H, c, H * 0.035) + stroke('M' + n(W * 0.18) + ',0 V' + H + ' M' + n(W * 0.82) + ',0 V' + H, c, H * 0.03);
    else if (t === 'braces') s += rect(W * 0.3 - H * 0.05, 0, H * 0.1, H, c) + rect(W * 0.7 - H * 0.05, 0, H * 0.1, H, c);
    else if (t === 'diamond-band') { for (i = -6; i <= 6; i++) s += poly([[W / 2 + i * H * 0.2, H * 0.4], [W / 2 + i * H * 0.2 + H * 0.1, H * 0.5], [W / 2 + i * H * 0.2, H * 0.6], [W / 2 + i * H * 0.2 - H * 0.1, H * 0.5]], c); }
    if (k.pattern2) {
      var q2 = k.pattern2;
      if (q2.t === 'sash') { var dx2 = Math.min(W * 0.42, H * 0.55); s += poly([[W / 2 + dx2 - H * 0.13, -2], [W / 2 + dx2 + H * 0.13, -2], [W / 2 - dx2 + H * 0.13, H + 2], [W / 2 - dx2 - H * 0.13, H + 2]], q2.c); }
      else if (q2.t === 'band') s += rect(0, H * 0.42, W, H * 0.16, q2.c);
      else if (q2.t === 'stripe') s += rect(W / 2 - H * 0.08, 0, H * 0.16, H, q2.c);
    }
    if (k.sides) s += rect(0, 0, H * 0.12, H, k.sides) + rect(W - H * 0.12, 0, H * 0.12, H, k.sides);
    if (k.emblem) s += emblem(k.emblem, W / 2, H * 0.5, H * 0.56);
    return s;
  }
  
  function silkSleeve(k, L, D) {
    var sv = k.sleeves || {}, c = sv.c || k.body, s = rect(0, 0, L, D, c), i, T;
    if (sv.t === 'hoops') { var cs = sv.cs || [c, sv.c2 || k.body], nb = 7; for (i = 0; i < nb; i++) s += rect(i * L / nb, 0, L / nb + 0.3, D, cs[i % cs.length]); }
    else if (sv.t === 'halves') s += rect(0, D / 2, L, D / 2, sv.c2);
    else if (sv.t === 'seams') s += rect(0, D / 2 - D * 0.06, L, D * 0.12, sv.c2);
    else if (sv.t) { T = tile(sv.t === 'stripes' ? 'hoops' : sv.t, c, sv.c2 || k.body, D * 0.7); s += T.def + rect(0, 0, L, D, T.fill); }
    if (k.armbands) s += rect(L * 0.6, 0, L * 0.14, D, k.armbands);
    return s;
  }
  function silkCap(c, x, y, sc) {
    
    c = c || {};
    var base = c.c || '#5A6270', id = 'ck' + (++uid), dome = 'M-30,0 C-30,-38 30,-38 30,0 Z', s = '', T;
    s += clipDef(id, dome) + '<g clip-path="url(#' + id + ')">' + rect(-32, -40, 64, 42, base);
    if (c.t === 'quarters') s += rect(0, -40, 32, 20, c.c2) + rect(-32, -20, 32, 22, c.c2);
    else if (c.t === 'hoops') { for (var i = 1; i < 6; i += 2) s += rect(-32, -40 + i * 7, 64, 7, c.c2); }
    else if (c.t === 'seams') s += stroke('M0,-30 V0 M-14,-27 Q-22,-14 -22,0 M14,-27 Q22,-14 22,0', c.c2, 2.4);
    else if (c.t) { T = tile(c.t, base, c.c2 || '#FFFFFF', 18); s += T.def + rect(-32, -40, 64, 42, T.fill); }
    s += '</g>' + path(dome, 'none', ' stroke="rgba(0,0,0,.45)" stroke-width="1.4"');
    s += path('M-30,-1 Q0,6 30,-1 Q40,2 42,6 Q8,14 -30,6 Z', shade(base, -0.25), ' stroke="rgba(0,0,0,.45)" stroke-width="1.2"');
    s += '<circle cx="0" cy="-30" r="2.4" fill="' + shade(base, -0.4) + '"/>';
    return '<g transform="translate(' + n(x) + ',' + n(y) + ') scale(' + sc + ')">' + s + '</g>';
  }
   
  var SILK = {
    body: 'M86,40 Q100,50 114,40 L132,44 L136,146 L64,146 L68,44 Z',
    sleeveL: 'M68,44 L46,52 L16,118 L34,126 L62,74 Z'
  };
  function drawRacing(k, opts, label) {
    var s = '', id = 'ck' + (++uid), sid = 'ck' + (++uid);
    
    var ax = 68 - 25, ay = 44 - 122, len = Math.sqrt(ax * ax + ay * ay), ang = Math.atan2(122 - 48, 25 - 66) * 180 / Math.PI;
    var sleeve = '<g transform="translate(66,48) rotate(' + n(ang) + ') translate(0,-14)">' + silkSleeve(k, len + 8, 28) + '</g>';
    s += clipDef(sid, SILK.sleeveL) + '<g clip-path="url(#' + sid + ')">' + sleeve + '</g>';
    s += '<g transform="translate(200,0) scale(-1,1)"><g clip-path="url(#' + sid + ')">' + sleeve + '</g></g>';
    s += path(SILK.sleeveL, 'none', ' stroke="' + edgeFor(k.body) + '" stroke-width="1.4" stroke-linejoin="round"');
    s += '<g transform="translate(200,0) scale(-1,1)">' + path(SILK.sleeveL, 'none', ' stroke="' + edgeFor(k.body) + '" stroke-width="1.4" stroke-linejoin="round"') + '</g>';
    s += clipDef(id, SILK.body) + '<g clip-path="url(#' + id + ')">' + nested(silkBody(k, 72, 106), 64, 40, 72, 106, 72, 106);
    if (k.epaulettes) s += poly([[64, 40], [86, 38], [88, 50], [64, 54]], k.epaulettes) + poly([[136, 40], [114, 38], [112, 50], [136, 54]], k.epaulettes);
    s += stroke('M86,40 Q100,50 114,40', shade(k.body, -0.3), 3) + '</g>';
    s += path(SILK.body, 'none', ' stroke="' + edgeFor(k.body) + '" stroke-width="1.6" stroke-linejoin="round"');
    s += silkCap(k.cap || { c: k.body }, 100, 34, 0.62);
    return wrap(s, 200, 150, opts, label);
  }

  








  function fillWrap(inner, W, H, opts, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + n(opts.w) + '" height="' + n(opts.h) + '" viewBox="0 0 ' + n(W) + ' ' + n(H) +
      '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(label) + '" focusable="false">' + inner + '</svg>';
  }
  
  function windowOn(inner, W, H, x0, span, y, yMax) {
    var sc = W / span, vis = H / sc, top = Math.max(0, Math.min(y, yMax - vis));
    return '<g transform="scale(' + n(sc * 1000) / 1000 + ') translate(' + n(-x0) + ',' + n(-top) + ')">' + inner + '</g>';
  }
  
  var CW = 38, CH = 78; 
  function corner(W, art) {
    var id = 'ck' + (++uid), tri = 'M0,0 L' + CW + ',0 L0,' + CH + ' Z';
    var one = clipDef(id, tri) + '<g clip-path="url(#' + id + ')">' + art + '</g>';
    return one + '<g transform="translate(' + n(W) + ',0) scale(-1,1)">' + one.replace(new RegExp(id, 'g'), id + 'm') + '</g>';
  }
  
  function cornerBands(list, at, scale, base) {
    var L = Math.sqrt(CW * CW + CH * CH), nx = CH / L, ny = CW / L, d = (at || 0) * scale, s = '';
    list.forEach(function (q) {
      var w = q[1] * scale, c = q[0] === 'base' ? base : q[0];
      if (q[0] !== 'base') s += poly([[d / nx, 0], [(d + w) / nx, 0], [0, (d + w) / ny], [0, d / ny]], c);
      d += w;
    });
    return s;
  }
  function seamLine(base) { return stroke('M' + CW + ',0 L0,' + CH, shade(base, lum(base) > 0.5 ? -0.3 : 0.25), 1.2, ' opacity="0.7"'); }
  function fillAfl(k, W, H) {
    var s = rect(-200, -200, 600, 600, k.base);
    (k.layers || []).forEach(function (L) { s += aflLayer(L, k.base); });
    if (!(k.layers || []).length) s += stroke('M84,6 Q100,24 116,6', k.trim || shade(k.base, -0.3), 5, ' stroke-linecap="round"');
    var top = AFL.Y((k.fill && k.fill.top) || 0) - 2;
    return windowOn(s, W, H, 44, 112, top, 146);
  }
  function fillBbl(k, W, H) {
    var s = rect(-200, -200, 600, 600, k.base), L = k.layers || [];
    L.forEach(function (l) { s += bblLayer(l, k); });
    if (k.sides) s += poly([[48, 50], [64, 58], [62, 146], [48, 146]], k.sides) + poly([[152, 50], [136, 58], [138, 146], [152, 146]], k.sides);
    if (k.piping) s += stroke('M82,10 L28,47', k.piping, 1.2) + stroke('M118,10 L172,47', k.piping, 1.2);
    if (!L.length && !k.sides) s += stroke('M80,8 Q100,26 120,8', k.collar || shade(k.base, -0.35), 6);
    var top = 8 + ((k.fill && k.fill.top) || 0) * 134 - 2;
    return windowOn(s, W, H, 40, 120, top, 142);
  }
  function fillTest(k, W, H) {
    
    var tr = k.trim && k.trim.length ? k.trim : ['#999999'], s = rect(0, 0, W, H, '#F7F5EE'), cx = W / 2, x;
    for (x = cx - 6; x > 0; x -= 14) s += stroke('M' + n(x) + ',0 V' + H, '#E6E2D6', 2);
    for (x = cx + 6; x < W; x += 14) s += stroke('M' + n(x) + ',0 V' + H, '#E6E2D6', 2);
    var v = 'M' + n(cx - 40) + ',-4 L' + n(cx) + ',60 L' + n(cx + 40) + ',-4';
    s += path('M' + n(cx - 40) + ',-4 L' + n(cx) + ',60 L' + n(cx + 40) + ',-4 Z', '#E9E5D8');
    var Wd = 16;
    tr.forEach(function (c, i) { s += stroke(v, c, Wd - i * (Wd / tr.length) + 0.2, ' stroke-linejoin="miter" stroke-miterlimit="8"'); });
    return s;
  }
  function fillNfl(k, W, H, opts) {
    var j = k.jersey, s = rect(0, 0, W, H, j.base), art = rect(0, 0, CW, CH, j.base), sh = j.shoulder;
    if (j.sides) s += rect(0, H * 0.5, 9, H * 0.5, j.sides) + rect(W - 9, H * 0.5, 9, H * 0.5, j.sides);
    if (j.sleeve) art += cornerBands(j.sleeve, (j.sleeveAt || 0) + 6, 1.05, j.base); 
    if (sh) {
      var up = function (x) { return '<g transform="scale(' + n(CW / 30 * 100) / 100 + ',' + n(CH / 64 * 100) / 100 + ')">' + x + '</g>'; }; 
      if (sh.t === 'tiger') art += up(poly([[6, 0], [12, 0], [0, 26], [0, 14]], sh.color) + poly([[18, 0], [24, 0], [4, 44], [0, 44], [0, 40]], sh.color) + poly([[28, 4], [30, 8], [8, 56], [4, 54]], sh.color));
      else if (sh.t === 'sweep') { art += cornerBands([[sh.colors[1], 3], [sh.colors[0], 10]], 18, 1, j.base); }
      else if (sh.t === 'bolt') art += up(poly([[22, 0], [12, 0], [2, 22], [9, 21], [0, 44], [17, 15], [10, 16]], sh.color, sh.edge ? ' stroke="' + sh.edge + '" stroke-width="1.6" stroke-linejoin="round"' : ''));
      else if (sh.t === 'horn') art += up(path('M26,0 C8,2 -2,22 4,44 L10,42 C6,26 12,10 28,6 Z', sh.color));
      else if (sh.t === 'over') { var w = 3.6, m = sh.colors.length; art += cornerBands(sh.colors.map(function (c) { return [c, w]; }), 34 - m * w / 2 - 2, 1, j.base); }
    }
    s += corner(W, art + seamLine(j.base));
    if (j.collar) s += stroke('M' + n(W / 2 - 17) + ',-1 Q' + n(W / 2) + ',22 ' + n(W / 2 + 17) + ',-1', j.collar, 7);
    if (j.collarEdge) s += stroke('M' + n(W / 2 - 15) + ',3 Q' + n(W / 2) + ',25 ' + n(W / 2 + 15) + ',3', j.collarEdge, 1.6);
    if (opts.number) {
      var num = opts.number === true ? '10' : String(opts.number).slice(0, 2), nm = j.numbers || ['#FFFFFF', '#000000'];
      s += '<text x="' + n(W / 2) + '" y="' + n(H * 0.86) + '" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="54" fill="' + nm[0] +
        '" stroke="' + nm[1] + '" stroke-width="2.8" paint-order="stroke" stroke-linejoin="round">' + esc(num) + '</text>';
    }
    return s;
  }
  function fillRacing(k, W, H) {
    var s = silkBody(k, W, H), sv = k.sleeves, art = '';
    
    if (sv || k.armbands || k.epaulettes) {
      art = sv || k.armbands ? silkSleeveCorner(k) : '';
      if (k.epaulettes) art += poly([[0, 0], [CW, 0], [CW * 0.62, 15], [0, 15]], k.epaulettes);
      s += corner(W, (art || '') + (sv || k.armbands ? seamLine(k.body) : ''));
    }
    return s;
  }
  
  
  function silkSleeveCorner(k) {
    var sv = k.sleeves || {}, c = sv.c || k.body, s = rect(0, 0, CW, CH, c), T, i;
    if (sv.t === 'hoops') { var cs = sv.cs || [c, sv.c2 || k.body], list = []; for (i = 0; i < 9; i++) list.push([cs[i % cs.length], 3.2]); s += cornerBands(list, 0, 1, c); }
    else if (sv.t === 'halves') s += poly([[0, 0], [CW / 2, CH / 2], [0, CH]], sv.c2);
    else if (sv.t === 'seams') s += stroke('M0,0 L' + n(CW / 2) + ',' + n(CH / 2), sv.c2, 2.6);
    else if (sv.t) { T = tile(sv.t === 'stripes' ? 'hoops' : sv.t, c, sv.c2 || k.body, 14); s += T.def + rect(0, 0, CW, CH, T.fill); }
    if (k.armbands) s += cornerBands([[k.armbands, 5]], 13, 1, c);
    return s;
  }
  


  function fillNba(k, W, H) {
    var j = k.jersey || {}, base = j.base || '#5A6270', tr = j.trim && j.trim.length ? j.trim : [shade(base, -0.35)], s = rect(0, 0, W, H, base);
    if (j.sides) s += rect(0, H * 0.42, 8, H * 0.58, j.sides) + rect(W - 8, H * 0.42, 8, H * 0.58, j.sides);
    var arm = function (x0, dir) { 
      var x1 = x0 + dir * 30, d = 'M' + n(x1) + ',0 C' + n(x1) + ',30 ' + n(x0 + dir * 18) + ',54 ' + n(x0) + ',62';
      var out = path(d + ' L' + n(x0) + ',0 Z', '#0b0907');
      tr.forEach(function (c, i) { out += stroke(d, c, 7 - i * (6 / tr.length), ''); });
      return out;
    };
    s += arm(0, 1) + arm(W, -1);
    var cx = W / 2, nk = j.neck === 'v' ? 'M' + n(cx - 22) + ',-2 L' + n(cx) + ',26 L' + n(cx + 22) + ',-2' : 'M' + n(cx - 24) + ',-2 Q' + n(cx) + ',30 ' + n(cx + 24) + ',-2';
    s += path(nk + ' Z', '#0b0907');
    tr.forEach(function (c, i) { s += stroke(nk, c, 7 - i * (6 / tr.length), ' stroke-linejoin="round"'); });
    return s;
  }
  function drawFill(sport, clubId, opts) {
    opts = opts || {};
    opts.w = opts.w || 150; opts.h = opts.h || 100;
    var H = 100, W = H * opts.w / opts.h, k = get(sport, clubId), label = (k && k.name ? k.name : clubId) + (sport === 'racing' ? ' silks' : ' home kit');
    if (!k) {
      var fb = opts.fallback || {}, base = fb.base || '#5A6270', acc = fb.accent || shade(base, -0.3);
      if (sport === 'racing') k = { body: base, pattern: null };
      else if (sport === 'nfl') k = { jersey: { base: base, collar: acc, numbers: ['#FFFFFF', acc] } };
      else if (sport === 'tests') k = { trim: [acc] };
      else if (sport === 'nba') k = { jersey: { base: base, trim: [acc], neck: 'round' } };
      else k = { base: base, trim: acc, collar: acc, layers: [] };
    }
    var s = '';
    if (sport === 'nrl') s = nrlFill(k, W, H);
    else if (sport === 'afl') s = fillAfl(k, W, H);
    else if (sport === 'bbl') s = fillBbl(k, W, H);
    else if (sport === 'tests') s = fillTest(k, W, H);
    else if (sport === 'nfl') s = fillNfl(k, W, H, opts);
    else if (sport === 'racing') s = fillRacing(k, W, H);
    else if (sport === 'nba') s = fillNba(k, W, H);
    else return '';
    return fillWrap(s, W, H, opts, label);
  }

  
  function plain(sport, fb, opts, label) {
    var base = (fb && fb.base) || '#5A6270', trim = (fb && fb.accent) || shade(base, -0.3);
    if (sport === 'afl') return drawAfl({ base: base, trim: trim, layers: [] }, opts, label);
    if (sport === 'nfl') return drawNfl({ jersey: { base: base, collar: trim, numbers: ['#FFFFFF', trim] } }, opts, label);
    if (sport === 'bbl') return drawBbl({ base: base, collar: trim, layers: [] }, opts, label);
    if (sport === 'tests') return drawTest({ cap: { base: base }, trim: [trim] }, opts, label);
    if (sport === 'nrl') return drawNrl({ base: base, collar: trim, layers: [] }, opts, label);
    if (sport === 'racing') return drawRacing({ body: base, cap: { c: base } }, opts, label);
    return '';
  }

  function drawKit(sport, clubId, opts) {
    opts = opts || {};
    var k = get(sport, clubId), label = (k && k.name ? k.name : clubId) + (sport === 'tests' ? ' Test cap' : sport === 'racing' ? ' silks' : ' home kit');
    if (!k) return plain(sport, opts.fallback, opts, label);
    if (sport === 'afl') return drawAfl(k, opts, label);
    if (sport === 'nfl') return drawNfl(k, opts, label);
    if (sport === 'bbl') return drawBbl(k, opts, label);
    if (sport === 'tests') return drawTest(k, opts, label);
    if (sport === 'nrl') return drawNrl(k, opts, label);
    if (sport === 'racing') return drawRacing(k, opts, label);
    return '';
  }

  var api = {
    setData: function (d) { DATA = d; },
    drawKit: drawKit,
    drawFill: drawFill,
    nrlFill: nrlFill,
    helmet: helmet,
    has: function (sport, id) { return !!get(sport, id); },
    info: function (sport, id) { return get(sport, id); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CastKits = api;
})(typeof window !== 'undefined' ? window : null);
