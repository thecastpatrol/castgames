/* CAST Kits (16 Oct 2026, the owner: "For team jerseys you really need to make sure that they are accurate to what they
   actually are. This applies in all the modes except NRL." and "Don't just assume they are always a V-shaped jersey design.")
   Each club's real current home kit drawn in code from kits.json: colours and design only, never logos, badges, sponsors
   or wordmarks. Nothing defaults to a V: a V is drawn only where the real design has one (a few AFL guernseys), and a club
   with no researched design is drawn plain in its colours.
     CastKits.setData(json)                   the kits.json object (kits-data.js sets window.CAST_KITS_DATA, read when first needed)
     CastKits.drawKit(sport, clubId, opts)    an <svg> string, or '' for an unknown sport
       sport: 'afl' (a sleeveless guernsey), 'nfl' (a jersey with sleeve stripes), 'bbl' (a coloured-clothing shirt),
              'tests' (the Test cap above whites with the nation's trim)
       opts: { w, h }  the size (default 200 x 150; 64 x 48 and 200 x 150 are the sizes it is drawn for)
             number    NFL: true for '10', or a string, on the chest
             helmet    NFL: true to set the helmet beside the jersey
             fallback  { base, accent } colours for a club with no kit data (drawn plain)
     CastKits.helmet(clubId, opts)            NFL helmet side view as an <svg> (opts.w, opts.h; default 120 x 100)
     CastKits.has(sport, clubId)              whether a researched kit exists
     CastKits.info(sport, clubId)             its data (name, status, note, sources) or null */
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
  // An outline that shows on light and dark kits alike
  function edgeFor(base) { return lum(base) > 0.6 ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,.55)'; }
  function wrap(inner, vw, vh, opts, label) {
    var w = (opts && opts.w) || vw, h = (opts && opts.h) || vh;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + n(w) + '" height="' + n(h) + '" viewBox="0 0 ' + vw + ' ' + vh +
      '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(label || 'Kit') + '" focusable="false">' + inner + '</svg>';
  }
  function clipDef(id, d) { return '<defs><clipPath id="' + id + '"><path d="' + d + '"/></clipPath></defs>'; }
  // The data, read when first needed, so kits-data.js may load before or after this file
  function get(sport, id) {
    var D = DATA || (root && root.CAST_KITS_DATA) || null;
    return D && D[sport] && Object.prototype.hasOwnProperty.call(D[sport], id) ? D[sport][id] : null;
  }

  /* AFL: a sleeveless guernsey. Body fractions: x 0 at the left armhole side (44) to 1 (156); y 0 at the shoulders (6) to 1
     at the hem (146) */
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
      if (!L.from) y0 = 0; // the first hoop runs up over the shoulders
      for (i = 0; i < L.count; i++) { var top = i ? Y(L.from || 0) + i * bh : y0; s += rect(30, top, 140, (Y(L.from || 0) + (i + 1) * bh) - top + 0.4, L.colors[i % L.colors.length]); }
    } else if (L.t === 'bands') {
      L.bands.forEach(function (b) { s += rect(30, Y(b[1]), 140, Y(b[2]) - Y(b[1]), b[0]); });
    } else if (L.t === 'panels') {
      var tot = L.sizes.reduce(function (a, b) { return a + b; }, 0), x = 44;
      L.colors.forEach(function (c, j) { var w = 112 * L.sizes[j] / tot; s += rect(j ? x : 20, 0, (j ? w : w + 24) + (j === L.colors.length - 1 ? 24 : 0.4), 150, c); x += w; });
    } else if (L.t === 'sash') {
      // From the viewer's right shoulder to the left hip ('right'), or the mirror
      var a = L.from === 'left' ? [56, 2] : [146, 2], b = L.from === 'left' ? [160, 136] : [40, 136];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy), hw = L.width * 140 / 2, nx = -dy / len * hw, ny = dx / len * hw;
      var ex = dx / len * 30, ey = dy / len * 30;
      s += poly([[a[0] + nx - ex, a[1] + ny - ey], [b[0] + nx + ex, b[1] + ny + ey], [b[0] - nx + ex, b[1] - ny + ey], [a[0] - nx - ex, a[1] - ny - ey]], L.color);
    } else if (L.t === 'yoke') {
      var d = Y(L.depth);
      if (L.shape === 'v') s += poly([[20, 0], [180, 0], [180, d], [100, Y(L.point)], [20, d]], L.color);
      else if (L.shape === 'sails') {
        // The lower edge cut in points of different lengths (the Opera House sails)
        var e = [[20, 0], [180, 0], [180, d - 6]], drops = [0.05, -0.02, 0.07, -0.01, 0.09, 0, 0.06, -0.02, 0.08, 0.01, 0.04];
        for (i = 0; i < drops.length; i++) e.push([156 - i * (112 / (drops.length - 1)), d + drops[i] * 140 - (i % 2 ? 0 : 2)]);
        e.push([20, d - 6]);
        s += poly(e, L.color);
      } else if (L.shape === 'wings') {
        // Gold shoulders sweeping down each side, the body colour up the middle to the neck
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
      // A real V (only where the design has one): bands stacked down from the shoulders to a point on the chest
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

  /* NFL: a short-sleeved jersey. The left sleeve (viewer's) runs from the shoulder seam to the cuff A to B; the right one is
     its mirror */
  var NFL = {
    body: 'M78,8 Q100,30 122,8 L150,14 L180,40 L170,72 L150,64 L148,142 L52,142 L50,64 L30,72 L20,40 L50,14 Z',
    A: [20, 40], B: [30, 72]
  };
  // Bands across the sleeve, from offset d (in from the cuff) for each [colour, width]
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
      // Stripes running from the collar over the shoulder and down the sleeve
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

  /* An NFL helmet from the side, facing left (120 x 100). A centre stripe shows as bands along the top of the shell:
     an odd list nests from the outside in (white, red, white: red edged in white), an even list sits side by side */
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
    // Ear hole and the facemask bars
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

  /* BBL: cricket coloured clothing, a V-neck shirt with black side panels (the BBL|15 New Balance cut) */
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
      // Marbled swirls (a topographic map of red dirt), not bands
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

  /* Test cricket: whites are white for everyone, so the nation is its Test cap, set above a white shirt with its trim
     on the V-neck, the cuffs and the hem */
  function capArt(c) {
    var base = c.base, dark = shade(base, -0.28), seam = shade(base, -0.4), hi = shade(base, 0.12), s = '';
    var dome = c.baggy ? 'M54,56 C48,14 152,14 146,56 Z' : 'M58,56 C56,20 144,20 142,56 Z';
    s += path(dome, base) + path(c.baggy ? 'M70,30 C80,20 96,18 108,20 C92,24 80,30 74,40 Z' : 'M72,32 C82,24 96,22 106,24 C92,27 82,32 76,42 Z', hi, ' opacity="0.55"');
    s += stroke('M100,' + (c.baggy ? 22 : 26) + ' L100,56 M100,24 C86,30 78,42 76,56 M100,24 C114,30 122,42 124,56', seam, 1.1, ' opacity="0.8"');
    s += '<circle cx="100" cy="' + (c.baggy ? 22 : 25) + '" r="3.2" fill="' + seam + '"/>';
    // The peak, out to the front and a little to the right
    s += path('M56,54 Q100,62 146,54 Q160,58 160,64 Q126,76 92,72 Q66,70 54,62 Z', dark) + stroke('M56,55 Q100,63 146,55', seam, 1.4);
    s += path(dome, 'none', ' stroke="rgba(0,0,0,.45)" stroke-width="1.4"');
    return s;
  }
  function drawTest(k, opts, label) {
    var id = 'ck' + (++uid), body = 'M80,64 Q100,82 120,64 L140,68 L162,86 L154,104 L140,98 L139,148 L61,148 L60,98 L46,104 L38,86 L60,68 Z';
    var tr = k.trim && k.trim.length ? k.trim : ['#999999'], s = clipDef(id, body) + '<g clip-path="url(#' + id + ')">' + rect(0, 0, 200, 150, '#F7F5EE');
    // Cable-knit hint, then the trim: nested on the V-neck (outside in), and bands at the cuffs and the hem
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

  // A club with no researched kit: plain in its colours (never a guessed V)
  function plain(sport, fb, opts, label) {
    var base = (fb && fb.base) || '#5A6270', trim = (fb && fb.accent) || shade(base, -0.3);
    if (sport === 'afl') return drawAfl({ base: base, trim: trim, layers: [] }, opts, label);
    if (sport === 'nfl') return drawNfl({ jersey: { base: base, collar: trim, numbers: ['#FFFFFF', trim] } }, opts, label);
    if (sport === 'bbl') return drawBbl({ base: base, collar: trim, layers: [] }, opts, label);
    if (sport === 'tests') return drawTest({ cap: { base: base }, trim: [trim] }, opts, label);
    return '';
  }

  function drawKit(sport, clubId, opts) {
    opts = opts || {};
    var k = get(sport, clubId), label = (k && k.name ? k.name : clubId) + (sport === 'tests' ? ' Test cap' : ' home kit');
    if (!k) return plain(sport, opts.fallback, opts, label);
    if (sport === 'afl') return drawAfl(k, opts, label);
    if (sport === 'nfl') return drawNfl(k, opts, label);
    if (sport === 'bbl') return drawBbl(k, opts, label);
    if (sport === 'tests') return drawTest(k, opts, label);
    return '';
  }

  var api = {
    setData: function (d) { DATA = d; },
    drawKit: drawKit,
    helmet: helmet,
    has: function (sport, id) { return !!get(sport, id); },
    info: function (sport, id) { return get(sport, id); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CastKits = api;
})(typeof window !== 'undefined' ? window : null);
