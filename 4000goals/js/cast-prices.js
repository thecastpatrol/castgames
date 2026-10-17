














(function (root) {
  'use strict';
  var VERSION = 1;
  var LIST = ['aud', 'nzd', 'usd', 'gbp', 'pgk'];
  
  
  var RATES = { aud: 1, nzd: 1.2289, usd: 0.6946, gbp: 0.5214, pgk: 3.1308 };
  var RATES_ON = '2026-10-17';
  
  var NAMES = {
    aud: ['A$', 'Australian Dollars', 'Australia', 'AUD'],
    nzd: ['NZ$', 'New Zealand Dollars', 'New Zealand', 'NZD'],
    usd: ['US$', 'US Dollars', 'United States', 'USD'],
    gbp: ['£', 'Pounds', 'United Kingdom', 'GBP'],
    pgk: ['K', 'Kina', 'Papua New Guinea', 'PGK']
  };
  var COUNTRY = { AU: 'aud', NZ: 'nzd', US: 'usd', GB: 'gbp', PG: 'pgk' };

  
  
  var AUD = {
    one: 99, five: 299, twelve: 599, remove1: 99, remove5: 299, remove12: 699, reveal1: 99, reveal5: 299,
    rib1: 99, rib3: 199, goat1: 999, wild1: 299, wild3: 699, freeze1: 299, freeze3: 199, cap1: 499,
    legend1: 199, legend3: 499, superstar1: 199, superstar3: 499,
    toty1: 399, toty3: 899, prem1: 399, prem3: 899, imm1: 499, imm3: 1199, wcp1: 399, wcp3: 899,
    ileg1: 499, ileg3: 1199, wch1: 599, wch3: 1499, restore: 499
  };
  
  var PRICES = {
    nzd: {
      one: 99, five: 349, twelve: 699, remove1: 99, remove5: 349, remove12: 799, reveal1: 99, reveal5: 349,
      rib1: 99, rib3: 249, goat1: 1199, wild1: 349, wild3: 899, freeze1: 349, freeze3: 249, cap1: 599,
      legend1: 249, legend3: 599, superstar1: 249, superstar3: 599,
      toty1: 499, toty3: 1099, prem1: 499, prem3: 1099, imm1: 599, imm3: 1499, wcp1: 499, wcp3: 1099,
      ileg1: 599, ileg3: 1499, wch1: 699, wch3: 1799, restore: 599
    },
    usd: {
      one: 99, five: 199, twelve: 399, remove1: 99, remove5: 199, remove12: 449, reveal1: 99, reveal5: 199,
      rib1: 99, rib3: 149, goat1: 699, wild1: 199, wild3: 499, freeze1: 199, freeze3: 149, cap1: 349,
      legend1: 149, legend3: 349, superstar1: 149, superstar3: 349,
      toty1: 299, toty3: 599, prem1: 299, prem3: 599, imm1: 349, imm3: 799, wcp1: 299, wcp3: 599,
      ileg1: 349, ileg3: 799, wch1: 399, wch3: 999, restore: 349
    },
    gbp: {
      one: 49, five: 149, twelve: 299, remove1: 49, remove5: 149, remove12: 349, reveal1: 49, reveal5: 149,
      rib1: 49, rib3: 99, goat1: 499, wild1: 149, wild3: 349, freeze1: 149, freeze3: 99, cap1: 249,
      legend1: 99, legend3: 249, superstar1: 99, superstar3: 249,
      toty1: 199, toty3: 449, prem1: 199, prem3: 449, imm1: 249, imm3: 599, wcp1: 199, wcp3: 449,
      ileg1: 249, ileg3: 599, wch1: 299, wch3: 799, restore: 249
    },
    pgk: {
      one: 299, five: 899, twelve: 1899, remove1: 299, remove5: 899, remove12: 2099, reveal1: 299, reveal5: 899,
      rib1: 299, rib3: 599, goat1: 3099, wild1: 899, wild3: 2199, freeze1: 899, freeze3: 599, cap1: 1599,
      legend1: 599, legend3: 1599, superstar1: 599, superstar3: 1599,
      toty1: 1299, toty3: 2799, prem1: 1299, prem3: 2799, imm1: 1599, imm3: 3799, wcp1: 1299, wcp3: 2799,
      ileg1: 1599, ileg3: 3799, wch1: 1899, wch3: 4699, restore: 1599
    }
  };
  
  
  var PASS = {
    aud: { monthly: 599, annual: 4999 },
    nzd: { monthly: 699, annual: 5999 },
    usd: { monthly: 399, annual: 3499 },
    gbp: { monthly: 299, annual: 2599 },
    pgk: { monthly: 1899, annual: 15999 }
  };
  function passLookup(plan, cur) { return 'cast_pass_' + (plan === 'annual' ? 'annual_4999' : 'monthly_599') + '_' + cur; }
  
  
  var BAG = {
    aud: [[2000, 10], [1000, 5]],
    nzd: [[2500, 10], [1200, 5]],
    usd: [[1400, 10], [700, 5]],
    gbp: [[1000, 10], [500, 5]],
    pgk: [[6000, 10], [3000, 5]]
  };
  
  var MIN = { aud: 50, nzd: 50, usd: 50, gbp: 30, pgk: 157 };

  function ok(cur) { return LIST.indexOf(cur) >= 0; }
  
  function clean(cur) { var c = String(cur || '').toLowerCase(); return ok(c) ? c : 'aud'; }
  
  function price(pack, cur) {
    var c = clean(cur), t = c === 'aud' ? AUD : PRICES[c];
    return t && Object.prototype.hasOwnProperty.call(t, pack) ? t[pack] : null;
  }
  function passPrice(plan, cur) { var p = PASS[clean(cur)]; return p ? p[plan === 'annual' ? 'annual' : 'monthly'] : null; }
  function bagTiers(cur) { return BAG[clean(cur)].map(function (x) { return x.slice(); }); }
  
  function fx(cur) { var c = clean(cur); return c === 'aud' ? 1 : Math.round(1e6 / RATES[c]) / 1e6; }
  
  function toAud(cents, cur, rate) {
    var c = clean(cur), r = Number(rate);
    if (c === 'aud') return Math.round(cents);
    return Math.round(cents * (r > 0 ? r : fx(c)));
  }
  function sym(cur, a) { var c = clean(cur); return c === 'aud' && !a ? '$' : NAMES[c][0]; }
  
  
  function fmt(cents, cur, opts) {
    var o = opts || {}, n = Math.round(Number(cents) || 0), neg = n < 0, v = Math.abs(n) / 100;
    var s = o.whole && Math.abs(n) % 100 === 0 ? String(Math.round(v)) : v.toFixed(2);
    return (neg ? '-' : '') + sym(cur, o.a) + s;
  }
  
  function each(cents, n, cur, opts) {
    var c = clean(cur), e = (Number(cents) || 0) / Math.max(1, n || 1);
    if (e < 99.5 && c !== 'pgk') return Math.round(e) + (c === 'gbp' ? 'p' : 'c');
    return fmt(Math.round(e), c, opts);
  }
  
  function saving(pack, single, n, cur) {
    var p = price(pack, cur), s = price(single, cur);
    return p && s && n > 1 ? Math.max(0, Math.floor((1 - p / (s * n)) * 100 + 1e-9)) : 0;
  }
  
  
  function passCopy(cur, opts) {
    var c = clean(cur), p = PASS[c], mc = p.monthly, yc = p.annual;
    return { cur: c, mc: mc, yc: yc, m: fmt(mc, c, opts), y: fmt(yc, c, opts), yM: fmt(Math.round(yc / 12), c, opts), yW: each(yc, 52, c, opts), mW: each(mc * 12, 52, c, opts),
      save: Math.floor((1 - yc / (mc * 12)) * 100 + 1e-9) + '%', x12: fmt(mc * 12, c, opts) };
  }

  

  var TZ_US = /^(America\/(New_York|Detroit|Chicago|Denver|Boise|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak|Menominee|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu|US\/.+)$/;
  function tzRegion(tz) {
    var z = String(tz || '');
    if (!z || /^(UTC|GMT|Etc\/.*|Universal|Zulu)$/i.test(z)) return '';
    if (/^Australia\//.test(z) || z === 'Antarctica/Macquarie') return 'AU';
    if (/^(Pacific\/Auckland|Pacific\/Chatham|NZ|NZ-CHAT)$/.test(z)) return 'NZ';
    if (TZ_US.test(z)) return 'US';
    if (/^(Europe\/(London|Belfast|Jersey|Guernsey|Isle_of_Man)|GB|GB-Eire)$/.test(z)) return 'GB';
    if (/^Pacific\/(Port_Moresby|Bougainville)$/.test(z)) return 'PG';
    return 'XX'; 
  }
  function langRegion(langs) {
    var list = Array.isArray(langs) ? langs : langs ? [langs] : [];
    for (var i = 0; i < list.length; i++) {
      var m = /^[a-z]{2,3}(?:[-_][A-Za-z]{4})?[-_]([A-Za-z]{2})(?:[-_]|$)/.exec(String(list[i] || ''));
      if (m) return m[1].toUpperCase();
    }
    return '';
  }
  function regionOf(langs, tz) { var t = tzRegion(tz); return t && t !== 'XX' ? t : t === 'XX' ? (langRegion(langs) === 'AU' ? 'AU' : 'XX') : langRegion(langs); }
  function curOfRegion(r) { return COUNTRY[r] || 'aud'; }

  
  var LS = 'cast_cur_v1', seen = null;
  function phone() {
    if (seen) return seen;
    var nav = root.navigator || {}, tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    var langs = nav.languages && nav.languages.length ? Array.prototype.slice.call(nav.languages) : nav.language ? [nav.language] : [];
    var r = regionOf(langs, tz);
    seen = { region: r || 'AU', cur: curOfRegion(r), tz: tz };
    return seen;
  }
  function chosen() { try { var v = root.localStorage && root.localStorage.getItem(LS); return v && ok(v) ? v : null; } catch (e) { return null; } }
  function current() { return chosen() || phone().cur; }
  function set(cur) {
    var c = clean(cur);
    try { if (root.localStorage) { if (c === phone().cur) root.localStorage.removeItem(LS); else root.localStorage.setItem(LS, c); } } catch (e) {   }
    seen = Object.assign({}, phone(), { pick: c });
    return c;
  }
  function now() { var p = phone(); return p.pick || current(); }
  
  function audAmbiguous() { return phone().region !== 'AU'; }
  function opts() { return { a: audAmbiguous() }; }
  
  function label(pack, fallback) { var c = now(), p = price(pack, c); return p == null ? fallback || '' : fmt(p, c, opts()); }

  var api = {
    VERSION: VERSION, LIST: LIST, RATES: RATES, RATES_ON: RATES_ON, NAMES: NAMES, AUD: AUD, PRICES: PRICES, PASS: PASS, BAG: BAG, MIN: MIN,
    ok: ok, clean: clean, price: price, passPrice: passPrice, passLookup: passLookup, bagTiers: bagTiers, fx: fx, toAud: toAud, sym: sym, fmt: fmt,
    each: each, saving: saving, passCopy: passCopy, tzRegion: tzRegion, langRegion: langRegion, regionOf: regionOf, curOfRegion: curOfRegion,
    phone: phone, current: now, set: set, audAmbiguous: audAmbiguous, opts: opts, label: label
  };
  root.CastPrices = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
