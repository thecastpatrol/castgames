












(function () {
  'use strict';
  function n(v) { return Math.round(v * 10) / 10; }
  function rect(x, y, w, h, f) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '" fill="' + f + '"/>'; }
  function poly(pts, f) { return '<polygon points="' + pts.map(function (p) { return n(p[0]) + ',' + n(p[1]); }).join(' ') + '" fill="' + f + '"/>'; }
  function line(x1, y1, x2, y2, col, sw) { return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) + '" stroke="' + col + '" stroke-width="' + n(sw) + '"/>'; }
  
  function vee(W, H, drop, width, col) {
    return '<polyline points="' + n(-0.06 * W) + ',' + n(-0.2 * H) + ' ' + n(W / 2) + ',' + n(drop * H) + ' ' + n(1.06 * W) + ',' + n(-0.2 * H) +
      '" fill="none" stroke="' + col + '" stroke-width="' + n(width * H) + '"/>';
  }
  function star(cx, cy, r) {
    var p = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    return poly(p, '#fff');
  }
  
  function southernCross(cx, cy, u) {
    return '<g data-stars="">' + star(cx, cy - 0.29 * u, 0.12 * u) + star(cx + 0.48 * u, cy - 0.02 * u, 0.12 * u) + star(cx, cy + 0.31 * u, 0.12 * u) +
      star(cx - 0.45 * u, cy + 0.02 * u, 0.1 * u) + star(cx + 0.24 * u, cy + 0.12 * u, 0.07 * u) + '</g>';
  }
  
  function zigzag(W, y0, y1, step, sw) {
    var p = [];
    for (var x = -step, i = 0; x < W + step; x += step / 2, i++) p.push(n(x) + ',' + n(i % 2 ? y1 : y0));
    return '<polyline points="' + p.join(' ') + '" fill="none" stroke="#111" stroke-width="' + n(sw) + '"/>';
  }
  function diamonds(W, y, step, size, col) {
    var s = '';
    for (var x = step / 2; x < W + step; x += step) s += poly([[x, y - size], [x + size, y], [x, y + size], [x - size, y]], col);
    return s;
  }
  
  function bird(x, y, size) {
    return '<g data-emblem="bird" fill="#FCD116" transform="translate(' + n(x) + ',' + n(y) + ') scale(' + (Math.round(size / 100 * 1000) / 1000) + ')">' +
      '<circle cx="24" cy="20" r="6"/><polygon points="18,18 7,21 18,23"/>' +
      '<path d="M26,24 C36,20 50,28 55,42 C57,50 49,54 41,50 C33,46 27,36 26,24 Z"/>' +
      '<path d="M34,28 C42,10 60,4 78,8 C68,14 60,22 54,36 Z"/>' +
      '<path d="M48,48 C58,64 70,74 94,80 M45,50 C52,70 62,84 82,96 M52,45 C66,56 82,60 98,62" fill="none" stroke="#FCD116" stroke-width="3.4" stroke-linecap="round"/></g>';
  }
  
  function cedar(x, y, size) {
    var tier = function (top, bot, half) { return '<polygon points="50,' + top + ' ' + (50 - half) + ',' + (bot - 3) + ' ' + (50 - half + 6) + ',' + bot + ' ' + (50 + half - 6) + ',' + bot + ' ' + (50 + half) + ',' + (bot - 3) + '"/>'; };
    return '<g data-emblem="cedar" fill="#00A651" transform="translate(' + n(x) + ',' + n(y) + ') scale(' + (Math.round(size / 100 * 1000) / 1000) + ')">' +
      tier(2, 20, 16) + tier(12, 36, 30) + tier(26, 54, 42) + tier(40, 74, 50) + '<rect x="43" y="72" width="14" height="24"/></g>';
  }
  function tricolore(W, H, a, b, c) { return rect(0, 0, W / 3 + 0.5, H, a) + rect(W / 3, 0, W / 3 + 0.5, H, b) + rect(2 * W / 3, 0, W / 3, H, c); }

  var LOOKS = {
    aus: function (W, H) { return rect(0, 0, W, H, '#00843D') + vee(W, H, 0.66, 0.18, '#FFCD00'); },
    nzl: function (W, H) { return rect(0, 0, W, H, '#0b0b0b') + vee(W, H, 0.66, 0.14, '#fff'); },
    eng: function (W, H) { var t = Math.max(2, 0.24 * H); return rect(0, 0, W, H, '#fff') + rect(0, (H - t) / 2, W, t, '#CE1124') + rect((W - t) / 2, 0, t, H, '#CE1124'); },
    fra: function (W, H) { return tricolore(W, H, '#002395', '#fff', '#ED2939'); },
    ita: function (W, H) { return tricolore(W, H, '#009246', '#fff', '#CE2B37'); },
    sco: function (W, H) { return rect(0, 0, W, H, '#005EB8') + line(0, 0, W, H, '#fff', 0.2 * H) + line(W, 0, 0, H, '#fff', 0.2 * H); },
    
    gbr: function (W, H) { return rect(0, 0, W, H, '#fff') + vee(W, H, 0.52, 0.11, '#012169') + vee(W, H, 0.7, 0.11, '#C8102E'); },
    
    sam: function (W, H, L) {
      var ch = 0.54 * H, cw = Math.min(0.43 * W, ch * 2.4);
      return rect(0, 0, W, H, '#CE1126') + rect(0, 0, cw, ch, '#002B7F') + (L >= 2 ? southernCross(cw / 2, ch / 2, ch) : '');
    },
    
    ton: function (W, H) {
      var ch = 0.5 * H, cw = Math.max(1.2 * ch, Math.min(0.42 * W, 1.6 * ch)), m = Math.min(cw, ch), arm = 0.68 * m, t = 0.24 * m, cx = cw / 2, cy = ch / 2;
      return rect(0, 0, W, H, '#C10000') + rect(0, 0, cw, ch, '#fff') + rect(cx - arm / 2, cy - t / 2, arm, t, '#C10000') + rect(cx - t / 2, cy - arm / 2, t, arm, '#C10000');
    },
    
    
    fij: function (W, H, L) {
      var y0 = 0.27 * H, y1 = 0.73 * H, t = Math.max(1, 0.03 * H), sw = Math.max(0.8, 0.018 * H), zig = 0.06 * H, step = 0.17 * H;
      var s = rect(0, 0, W, H, '#68BFE5') + '<g data-masi="">' + rect(0, y0, W, y1 - y0, '#fff') + rect(0, y0, W, t, '#111') + rect(0, y1 - t, W, t, '#111');
      if (L >= 2) {
        s += (H >= 30 ? zigzag(W, y0 + t + 0.035 * H, y0 + t + 0.035 * H + zig, step, sw) + zigzag(W, y1 - t - 0.035 * H, y1 - t - 0.035 * H - zig, step, sw) : '') + 
          line(0, H / 2, W, H / 2, '#111', Math.max(0.6, 0.012 * H)) + diamonds(W, H / 2, 0.3 * H, 0.075 * H, '#111') + diamonds(W, H / 2, 0.3 * H, 0.03 * H, '#68BFE5');
      }
      return s + '</g>';
    },
    
    png: function (W, H, L) {
      return poly([[0, 0], [W, 0], [W, H]], '#CE1126') + poly([[0, 0], [0, H], [W, H]], '#0b0b0b') +
        (L >= 2 ? southernCross(0.33 * H, 0.73 * H, 0.42 * H) : '') + (L >= 3 ? bird(W - 0.66 * H, 0.04 * H, 0.6 * H) : '');
    },
    
    leb: function (W, H, L) {
      var s = 0.44 * H;
      return rect(0, 0, W, H, '#ED1C24') + rect(0, 0.25 * H, W, 0.5 * H, '#fff') + (L >= 3 ? cedar(W - 0.5 * H - s / 2, 0.28 * H, s) : '');
    },
    
    cok: function (W, H, L) {
      var s = rect(0, 0, W, H, '#185818') + rect(0, 0.885 * H, W, 0.115 * H, '#F8D000');
      if (L >= 2) {
        var cx = W - 0.3 * H, cy = 0.44 * H, r = 0.19 * H, ring = '';
        for (var i = 0; i < 15; i++) { var a = i * 2 * Math.PI / 15; ring += star(cx + r * Math.cos(a), cy + r * Math.sin(a), 0.034 * H); }
        s += '<g data-stars="">' + ring + '</g>';
      }
      return s;
    }
  };

  var cache = {};
  function svg(key, w, h, opts) {
    if (!has(key) || !(w > 0) || !(h > 0)) return '';
    w = Math.round(w); h = Math.round(h);
    var L = opts && opts.level ? opts.level : h < 30 ? 2 : 3, id = key + ' ' + w + 'x' + h + ' ' + L;
    if (!cache[id]) cache[id] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">' + LOOKS[key](w, h, L) + '</svg>';
    return cache[id];
  }
  function has(key) { return typeof key === 'string' && Object.prototype.hasOwnProperty.call(LOOKS, key); }
  var FIELD = { aus: '#00843D', nzl: '#0b0b0b', eng: '#ffffff', fra: '#002395', sam: '#CE1126', ton: '#C10000', fij: '#68BFE5', png: '#CE1126',
    leb: '#ED1C24', cok: '#185818', gbr: '#ffffff', sco: '#005EB8', ita: '#009246' };
  function field(key) { return has(key) ? FIELD[key] : ''; }

  


  function draw(el) {
    var r = el.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height), k = (el.getAttribute('data-nat-fit') || '').split(' ');
    if (!(w > 0 && h > 0) || el.getAttribute('data-nat-size') === w + 'x' + h || !has(k[0])) return;
    el.setAttribute('data-nat-size', w + 'x' + h);
    el.innerHTML = svg(k[0], w, h, { level: Number(k[1]) || 2 });
  }
  
  var ro = window.ResizeObserver ? new ResizeObserver(function (list) { list.forEach(function (e) { draw(e.target); }); }) : null;
  function fit(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-nat-fit]'), function (el) {
      if (ro && !el.getAttribute('data-nat-obs')) { el.setAttribute('data-nat-obs', '1'); ro.observe(el); }
      draw(el);
    });
  }
  var fitT = null;
  if (!ro) window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(function () { fit(document); }, 150); });

  window.CastNations = { svg: svg, has: has, field: field, fit: fit };
})();
