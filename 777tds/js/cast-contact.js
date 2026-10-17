/* CAST Games Contact Us and Report a Bug (17 Oct 2026, the owner's BUILD IT): one form in every CAST game, in place of
   the plain email links, so every message is tracked and actioned in Admin > Inbox (js/cast-account.js).
   MASTER COPY: edit shared/cast-account/ in the 1000TRIES repo, then copy it to each game's js/ folder.

   On a page: <script src="js/cast-contact.js?v=..." data-site="1000tries"></script> in the <head> (early, so it also
   catches the page's own errors), then any button with data-cast-contact opens the form:
     <button type="button" class="ctc-pill" data-cast-contact="contact">&#x2709;&#xFE0F; Contact Us</button>
     <button type="button" class="ctc-pill" data-cast-contact="bug">&#x1F41E; Report a Bug</button>
   (data-cast-contact: contact, bug, pay, account, idea or other). Or CastContact.open('bug'), or ?contact=bug in the address.

   What it sends (shown on the form as "We'll also send: game, page, device"): the message, its type, the reply email,
   which game and screen, the page address without anything secret after ?, the game's version (?v=), the browser and
   device, the screen size and the last 5 script error messages on this page (messages only). The server adds who is
   signed in. Self-contained: its own styles (ctc- prefix) and, on a page without js/cast-account.js (the policy pages),
   its own small Firebase load, only when it is needed. Guests send nothing until they press Send. */
(function () {
  'use strict';
  if (window.CastContact) return;
  var ME = document.currentScript;
  var FIREBASE = {
    apiKey: 'AIzaSyC76_SWOqYJbwfqPWhx0eVX2WwruE5ryRU', // public by design; locked to our domains in Google Cloud
    authDomain: 'cast-games-bd641.firebaseapp.com',
    projectId: 'cast-games-bd641',
    storageBucket: 'cast-games-bd641.firebasestorage.app',
    messagingSenderId: '49757572054',
    appId: '1:49757572054:web:8b5dff817d5de90fa3f277'
  };
  var SDK = 'https://www.gstatic.com/firebasejs/12.19.0/'; // the same as js/cast-account.js, so both share one Firebase
  var EMU = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]castemu=1(&|$)/.test(location.search);
  var TYPES = [['bug', '&#x1F41E;', 'Report a Bug'], ['pay', '&#x1F4B3;', 'Payment or Purchase'], ['account', '&#x1F464;', 'My Account'], ['idea', '&#x1F4A1;', 'Idea or Feedback'], ['other', '&#x1F4AC;', 'Something Else']];
  var MIN = 10, MAX = 2000, DOING = 300;

  /* The last 5 script errors on this page (messages, the file and line, nothing else), for bug reports */
  var ERRS = [];
  function keepErr(m) {
    m = String(m || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!m || ERRS[ERRS.length - 1] === m) return;
    ERRS.push(m);
    if (ERRS.length > 5) ERRS.shift();
  }
  window.addEventListener('error', function (e) {
    var t = e && e.target;
    if (t && t !== window && t.tagName) { // a script or stylesheet that did not load (images are left out: too noisy)
      if (t.tagName === 'SCRIPT' || t.tagName === 'LINK') keepErr('Did not load: ' + String(t.src || t.href || '').split('?')[0].split('/').slice(-2).join('/'));
      return;
    }
    keepErr((e.message || 'Script error') + (e.filename ? ' (' + String(e.filename).split('?')[0].split('/').pop() + ':' + (e.lineno || 0) + ')' : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    keepErr('Unhandled: ' + (r && r.message ? r.message : typeof r === 'string' ? r : 'promise rejected'));
  });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function site() {
    var s = ME && ME.getAttribute('data-site');
    if (s) return s;
    if (window.CAST_ACCOUNT && window.CAST_ACCOUNT.game) return window.CAST_ACCOUNT.game;
    var h = location.hostname;
    if (/1000tries/.test(h)) return '1000tries';
    if (/^27-0\./.test(h)) return '27-0';
    if (/4000goals/.test(h)) return '4000goals';
    return 'castgames';
  }
  var SITE_NAMES = { '1000tries': '1000TRIES', '27-0': '27-0', '4000goals': '4000 GOALS', bigbash: '25000 RUNS', tests: '60000 RUNS', nfl: '777 TDS', racing: 'G1 WINNER SPINNER', epl: '650 GOALS', castgames: 'CAST Games' };
  // Where in the game: the page's own hook, else the screen and mode the game marks on <body>, else the page's name
  function screenNow() {
    var s = '';
    try { if (window.CAST_ACCOUNT && typeof window.CAST_ACCOUNT.contactScreen === 'function') s = String(window.CAST_ACCOUNT.contactScreen() || ''); } catch (e) { s = ''; }
    if (!s) {
      var b = document.body;
      s = [b.getAttribute('data-screen'), b.getAttribute('data-mode'), b.getAttribute('data-view')].filter(Boolean).join(' / ');
    }
    if (!s) s = (location.pathname.split('/').pop() || 'home').replace(/\.html$/, '') || 'home';
    var ca = document.querySelector('.ca:not([hidden])');
    return (s + (ca ? ' + CAST pop-up' : '')).slice(0, 60);
  }
  // The game's version: the ?v= on its main script (app.js and friends), else this file's
  function version() {
    var list = document.querySelectorAll('script[src*="?v="]'), own = '';
    for (var i = 0; i < list.length; i++) {
      var src = list[i].getAttribute('src'), m = /[?&]v=([0-9A-Za-z._-]{1,30})/.exec(src);
      if (!m) continue;
      if (/\/(app|main|game)\.js\?/.test(src) || /^(app|main|game)\.js\?/.test(src)) return m[1];
      if (/cast-contact\.js/.test(src)) own = m[1];
    }
    return own;
  }
  function safeUrl() {
    var keep = [];
    try {
      new URLSearchParams(location.search).forEach(function (v, k) {
        if (/^(cast[a-z0-9]{0,20}|v|mode|po|tab)$/i.test(k) && !/(token|key|code|pass|secret|session|auth|email|gift|sig|uid)/i.test(k)) keep.push(encodeURIComponent(k) + (v ? '=' + encodeURIComponent(v.slice(0, 30)) : ''));
      });
    } catch (e) { keep = []; }
    return location.origin + location.pathname + (keep.length ? '?' + keep.join('&') : '');
  }
  // The device line the form shows ("iPhone, Safari"); the full browser details go with the message
  function devShort(ua) {
    var d = /iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'Chromebook' : 'Computer';
    var b = /FBAN|FBAV|FB_IAB/.test(ua) ? 'Facebook app' : /Instagram/.test(ua) ? 'Instagram app' : /TikTok|musical_ly|Bytedance/.test(ua) ? 'TikTok app' : /Edg/.test(ua) ? 'Edge'
      : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'a browser';
    return d + ', ' + b;
  }
  function context() {
    var dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;
    return { site: site(), screen: screenNow(), url: safeUrl(), ver: version(), ua: String(navigator.userAgent || '').slice(0, 400),
      scr: Math.round(window.innerWidth) + 'x' + Math.round(window.innerHeight) + '@' + dpr, errs: ERRS.slice() };
  }

  /* Firebase, only on a page without js/cast-account.js (that page's account does the sending there) */
  var fbP = null;
  function sdk() {
    if (fbP) return fbP;
    fbP = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-functions.js')]).then(function (m) {
      var cfg = EMU ? Object.assign({}, FIREBASE, { projectId: 'demo-cast-games' }) : FIREBASE;
      var app = m[0].getApps().length ? m[0].getApp() : m[0].initializeApp(cfg);
      var auth = m[1].getAuth(app), fns = m[2].getFunctions(app, 'australia-southeast1');
      if (EMU && !app.__ctcEmu) {
        app.__ctcEmu = true;
        try { m[2].connectFunctionsEmulator(fns, '127.0.0.1', 5001); m[1].connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); } catch (e) { /* already connected by the account */ }
      }
      return { auth: auth, fns: fns, Fn: m[2], ready: auth.authStateReady ? auth.authStateReady() : Promise.resolve() };
    });
    fbP.catch(function () { fbP = null; });
    return fbP;
  }
  // Who is signed in: { email, username } or null (a guest). Signed in on this site before (cast_signed_in): wait for it
  function who() {
    var CA = window.CastAccount;
    if (CA && CA.contactWho) {
      var w = CA.contactWho();
      if (!w || w.state !== 'loading') return Promise.resolve(w && w.state === 'in' ? w : null);
      return new Promise(function (res) {
        var done = false, fin = function () { if (done) return; done = true; window.removeEventListener('cast-account', fin); var x = CA.contactWho(); res(x && x.state === 'in' ? x : null); };
        window.addEventListener('cast-account', fin);
        setTimeout(fin, 6000);
      });
    }
    if (lsGet('cast_signed_in') !== '1') return Promise.resolve(null);
    return sdk().then(function (f) {
      return f.ready.then(function () { var u = f.auth.currentUser; return u ? { state: 'in', email: u.email || '', username: null } : null; });
    }).catch(function () { return null; });
  }
  function send(data) {
    var CA = window.CastAccount;
    if (CA && CA.contactSend) return CA.contactSend(data);
    return sdk().then(function (f) { return f.ready.then(function () { return f.Fn.httpsCallable(f.fns, 'contactSend')(data); }); }).then(function (r) { return r.data; });
  }
  // A send that fails for any reason other than something the person can fix in the form (a message too short, say) also
  // gives them our email address as plain text, so a message never goes nowhere if contactSend is down or unreachable
  var MAIL = 'cast@thecastpatrol.com.au';
  function errText(err) {
    var code = String((err && err.code) || '').replace(/^functions\//, '');
    if (code === 'invalid-argument' && err.message) return { t: err.message, mail: false };
    if (['resource-exhausted', 'unavailable', 'not-found'].indexOf(code) >= 0 && err.message) return { t: err.message, mail: true };
    return { t: 'Your message did not send. Check your connection and try again.', mail: true };
  }

  /* The form */
  var el = null, st = { type: null, msg: '', doing: '', email: '', who: null, loading: false, busy: false, err: '', sent: null }, lastFocus = null;
  var CSS = '' +
    '.ctc{--ctc-line:#2a2a44;--ctc-muted:#a9a9c1;--ctc-text:#f0f0f5;--ctc-bad:#f87171;position:fixed;inset:0;z-index:10090;display:flex;align-items:flex-end;justify-content:center;font-family:Inter,system-ui,-apple-system,sans-serif;color:var(--ctc-text);padding-top:env(safe-area-inset-top,0px);box-sizing:border-box;text-align:left}' +
    '.ctc .ctc-panel:focus,.ctc .ctc-panel:focus-visible{outline:none}.ctc :focus-visible{outline:2px solid #fff;outline-offset:2px}' + // white focus rings, never the site's gold
    '.ctc[hidden]{display:none!important}html.ctc-open,html.ctc-open body{overflow:hidden}' +
    '.ctc *{box-sizing:border-box}.ctc h2,.ctc h3,.ctc button,.ctc label,.ctc small,.ctc summary,.ctc b{text-wrap:balance}.ctc p,.ctc li{text-wrap:pretty}' +
    '.ctc-backdrop{position:absolute;inset:0;background:rgba(5,5,10,.74)}' +
    '.ctc-panel{position:relative;display:flex;flex-direction:column;width:100%;max-width:520px;max-height:calc(100vh - 24px);max-height:var(--ctc-h,calc(100dvh - 24px - env(safe-area-inset-top,0px)));border-radius:20px 20px 0 0;background:linear-gradient(180deg,#1b1830,#0f0d1d);border:1.5px solid rgba(255,255,255,.22);border-bottom:0;box-shadow:0 -10px 40px rgba(0,0,0,.5);animation:ctcUp .25s ease both;outline:none}' +
    '@keyframes ctcUp{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}' +
    '@media (min-width:720px){.ctc{align-items:center;padding:24px}.ctc-panel{border-radius:22px;border-bottom:1.5px solid rgba(255,255,255,.22);max-height:calc(100vh - 48px);box-shadow:0 30px 70px rgba(0,0,0,.6)}}' +
    '.ctc-x{position:absolute;top:12px;right:12px;z-index:2;width:38px;height:38px;border-radius:50%;border:1px solid var(--ctc-line);background:#1b1830;color:var(--ctc-muted);font:700 15px/1 Inter,sans-serif;cursor:pointer}' +
    '@media (hover:hover){.ctc-x:hover{color:#fff;border-color:rgba(255,255,255,.6)}}' +
    '.ctc-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:20px 18px 12px}' +
    '.ctc-foot{flex:0 0 auto;padding:12px 18px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--ctc-line);background:#0f0d1d}' +
    '@media (min-width:720px){.ctc-foot{border-radius:0 0 22px 22px;padding-bottom:16px}}' +
    '.ctc-kicker{margin:0 46px 6px 0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--ctc-muted)}' +
    '.ctc-title{margin:0 46px 6px 0;font:italic 900 24px/1.12 Inter,sans-serif;text-transform:uppercase;letter-spacing:-.3px;color:#fff}' +
    '.ctc-sub{margin:0 0 14px;font-size:14px;line-height:1.5;color:#c9c9da}' +
    '.ctc-lbl{display:block;margin:16px 0 8px;font-size:12px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;color:#d6d6e4}.ctc-lbl small{font-weight:700;letter-spacing:.4px;text-transform:none;color:var(--ctc-muted)}' +
    '.ctc-chips{display:flex;flex-wrap:wrap;gap:8px}' +
    '.ctc-chip{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;border:1.5px solid var(--ctc-line);background:rgba(255,255,255,.03);color:#d6d6e4;font:800 13px/1.15 Inter,sans-serif;cursor:pointer;text-align:left}' +
    '.ctc-chip.is-on{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.6);color:#fff}' +
    '@media (hover:hover){.ctc-chip:hover{border-color:rgba(255,255,255,.4)}}' +
    '.ctc-field{display:block;width:100%;min-height:48px;padding:12px 14px;border-radius:12px;border:1.5px solid var(--ctc-line);background:#0f0e1c;color:#fff;font:600 16px/1.4 Inter,sans-serif}' +
    '.ctc-field:focus{outline:none;border-color:rgba(255,255,255,.6)}.ctc-field[readonly]{color:#c9c9da;background:rgba(255,255,255,.04)}' +
    'textarea.ctc-field{min-height:132px;resize:vertical}' +
    '.ctc-count{display:block;margin-top:6px;font-size:12px;font-weight:700;color:var(--ctc-muted);text-align:right}.ctc-count.is-bad{color:#fca5a5}' +
    '.ctc-note{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--ctc-muted)}' +
    '.ctc-extra{margin:16px 0 4px;border-radius:12px;border:1px solid var(--ctc-line);background:rgba(255,255,255,.02)}' +
    '.ctc-extra summary{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:8px 14px;cursor:pointer;list-style:none;font-size:13px;font-weight:700;color:#c9c9da}' +
    '.ctc-extra summary::-webkit-details-marker{display:none}.ctc-extra summary i{font-style:normal;color:var(--ctc-muted);transition:transform .2s}.ctc-extra[open] summary i{transform:rotate(45deg)}' +
    '.ctc-extra dl{margin:0;padding:0 14px 12px;display:grid;gap:6px}.ctc-extra dl div{display:grid;grid-template-columns:96px 1fr;gap:10px}' +
    '.ctc-extra dt{font-size:11px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:var(--ctc-muted)}.ctc-extra dd{margin:0;font-size:12.5px;color:#e8e8f0;overflow-wrap:anywhere}' +
    '.ctc-err{margin:12px 0 0;padding:10px 12px;border-radius:10px;font-size:13px;line-height:1.4;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.5);color:#fecaca}' +
    '.ctc-err b.ctc-mail{color:#fff;overflow-wrap:anywhere;user-select:all;-webkit-user-select:all}' +
    '.ctc-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}' +
    '.ctc-send{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;padding:12px 16px;border-radius:12px;border:2px solid #fff;background:#fff;color:#111;font:900 15px/1.1 Inter,sans-serif;text-transform:uppercase;letter-spacing:.4px;cursor:pointer}' +
    '.ctc-send:disabled{opacity:.45;cursor:not-allowed}@media (hover:hover){.ctc-send:hover:not(:disabled){filter:brightness(.92)}}' +
    '.ctc-spin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(0,0,0,.2);border-top-color:#111;animation:ctcSpin .8s linear infinite}.ctc-wait{display:flex;justify-content:center;padding:6px 0}.ctc-wait .ctc-spin{border-color:rgba(255,255,255,.2);border-top-color:#fff}' +
    '@keyframes ctcSpin{to{transform:rotate(360deg)}}' +
    '.ctc-done{text-align:center;padding:10px 0 4px}.ctc-done .ctc-title,.ctc-done .ctc-kicker{margin-right:0}.ctc-tick{width:60px;height:60px;margin:6px auto 12px;display:grid;place-items:center;font-size:28px;border-radius:50%;border:2px solid #4ade80;background:rgba(74,222,128,.12)}' +
    '.ctc-ref{display:inline-block;margin:4px 0 12px;padding:8px 16px;border-radius:12px;border:1.5px dashed rgba(255,255,255,.4);font:900 22px/1 Inter,sans-serif;letter-spacing:2px;color:#fff;user-select:all}' +
    '.ctc-pill{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#d6d6e4;font:800 12.5px/1.15 Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;vertical-align:middle;white-space:nowrap}' +
    '@media (hover:hover){.ctc-pill:hover{border-color:rgba(255,255,255,.4);color:#fff}}' +
    '.ctc-pills{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:10px 0 0}.ctc-pills.is-left{justify-content:flex-start}';
  function addCss() {
    if (document.getElementById('ctcCss')) return;
    var s = document.createElement('style');
    s.id = 'ctcCss'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  addCss();

  function typeOf(k) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i][0] === k) return TYPES[i]; return null; }
  function msgLen() { return st.msg.trim().length; }
  function ready() { return !!st.type && msgLen() >= MIN && msgLen() <= MAX && (st.who && st.who.email ? true : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(st.email.trim())); }

  function formHtml() {
    var bug = st.type === 'bug', c = context(), w = st.who;
    var h = '<p class="ctc-kicker">The Cast Patrol</p><h2 class="ctc-title" id="ctcTitle">' + (bug ? 'Report a Bug' : 'Contact Us') + '</h2>' +
      '<p class="ctc-sub">' + (bug ? 'Something not working? Tell us what happened and we&rsquo;ll look into it.' : 'Questions, problems or ideas: we read every message and reply by email.') + '</p>' +
      '<span class="ctc-lbl" id="ctcTypeL">What&rsquo;s It About?</span><div class="ctc-chips" role="radiogroup" aria-labelledby="ctcTypeL">' + TYPES.map(function (t) {
        return '<button type="button" role="radio" aria-checked="' + (st.type === t[0]) + '" class="ctc-chip' + (st.type === t[0] ? ' is-on' : '') + '" data-ctc="type" data-v="' + t[0] + '"><span aria-hidden="true">' + t[1] + '</span>' + t[2] + '</button>';
      }).join('') + '</div>' +
      '<label class="ctc-lbl" for="ctcMsg">Your Message</label>' +
      '<textarea class="ctc-field" id="ctcMsg" maxlength="' + MAX + '" rows="5" placeholder="' + (bug ? 'What went wrong? The more detail, the quicker we can fix it.' : 'How can we help?') + '">' + esc(st.msg) + '</textarea>' +
      '<span class="ctc-count" id="ctcCount" aria-live="polite">' + countText() + '</span>' +
      (bug ? '<label class="ctc-lbl" for="ctcDoing">What Were You Doing? <small>(optional)</small></label>' +
        '<input class="ctc-field" id="ctcDoing" type="text" maxlength="' + DOING + '" autocomplete="off" placeholder="For example: my third pick in 1000+" value="' + esc(st.doing) + '">' : '') +
      '<label class="ctc-lbl" for="ctcEmail">Your Email</label>' +
      (w && w.email ? '<input class="ctc-field" id="ctcEmail" type="email" readonly value="' + esc(w.email) + '"><p class="ctc-note">We&rsquo;ll reply to the email on your CAST Profile.</p>'
        : '<input class="ctc-field" id="ctcEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="254" required placeholder="you@example.com" value="' + esc(st.email) + '"><p class="ctc-note">So we can reply. We only use it for this message.</p>') +
      '<div class="ctc-hp" aria-hidden="true"><label>Website <input id="ctcHp" type="text" tabindex="-1" autocomplete="off"></label></div>' +
      '<details class="ctc-extra"><summary><span>We&rsquo;ll also send: game, page, device</span><i aria-hidden="true">+</i></summary><dl>' +
        '<div><dt>Game</dt><dd>' + esc(SITE_NAMES[c.site] || c.site) + (c.ver ? ' (version ' + esc(c.ver) + ')' : '') + '</dd></div>' +
        '<div><dt>Page</dt><dd>' + esc(c.url.replace(/^https?:\/\//, '')) + ' &middot; ' + esc(c.screen) + '</dd></div>' +
        '<div><dt>Device</dt><dd>' + esc(devShort(c.ua)) + '</dd></div>' +
        '<div><dt>Screen</dt><dd>' + esc(c.scr.replace('@', ' at ') + 'x') + '</dd></div>' +
        '<div><dt>Errors</dt><dd>' + (c.errs.length ? c.errs.map(esc).join('<br>') : 'None on this page') + '</dd></div>' +
        (w ? '<div><dt>Account</dt><dd>Your CAST Profile' + (w.username ? ' (' + esc(w.username) + ')' : '') + '</dd></div>' : '') +
      '</dl></details>' +
      (st.err ? '<p class="ctc-err" role="alert">' + esc(st.err.t) + (st.err.mail ? ' Still not working? Email us at <b class="ctc-mail">' + MAIL + '</b> and we&rsquo;ll sort it out.' : '') + '</p>' : '');
    return h;
  }
  function countText() { var n = msgLen(); return n < MIN ? (n ? MIN - n + ' more to go' : 'At least ' + MIN + ' characters') : n + ' of ' + MAX; }
  function doneHtml() {
    var w = st.who, mail = (w && w.email) || st.sentTo || '';
    return '<div class="ctc-done"><div class="ctc-tick" aria-hidden="true">&#x2705;</div><p class="ctc-kicker">Message Sent</p><h2 class="ctc-title" id="ctcTitle">Thanks, We&rsquo;ve Got It</h2>' +
      '<p class="ctc-sub">Your reference is</p><div class="ctc-ref">' + esc(st.sent) + '</div>' +
      '<p class="ctc-sub">We&rsquo;ll reply to <b>' + esc(mail) + '</b> as soon as we can. Quote your reference if you write to us about it.</p></div>';
  }
  function render() {
    if (!el) return;
    var body = el.querySelector('.ctc-scroll'), foot = el.querySelector('.ctc-foot');
    if (st.loading) { body.innerHTML = '<p class="ctc-kicker">The Cast Patrol</p><h2 class="ctc-title" id="ctcTitle">Contact Us</h2><div class="ctc-wait"><div class="ctc-spin" aria-hidden="true"></div></div>'; foot.innerHTML = ''; return; }
    if (st.sent) { body.innerHTML = doneHtml(); foot.innerHTML = '<button type="button" class="ctc-send" data-ctc="close">Done</button>'; return; }
    var y = body.scrollTop;
    body.innerHTML = formHtml();
    body.scrollTop = y;
    foot.innerHTML = '<button type="button" class="ctc-send" data-ctc="send"' + (st.busy || !ready() ? ' disabled' : '') + '>' + (st.busy ? '<span class="ctc-spin" aria-hidden="true"></span>Sending' : 'Send Message') + '</button>';
  }
  // Typing updates only the counter and the Send button, so the keyboard and caret never jump
  function soft() {
    var c = document.getElementById('ctcCount'), b = el && el.querySelector('[data-ctc="send"]');
    if (c) { c.textContent = countText(); c.classList.toggle('is-bad', msgLen() > MAX); }
    if (b && !st.busy) b.disabled = !ready();
  }
  function fit() { // keep the Send button above the phone's keyboard
    if (!el || el.hidden) return;
    var vv = window.visualViewport, p = el.querySelector('.ctc-panel');
    if (vv && p && window.innerWidth < 720) { p.style.setProperty('--ctc-h', Math.max(260, vv.height - 12) + 'px'); el.style.height = vv.height + 'px'; el.style.top = vv.offsetTop + 'px'; }
    else if (p) { p.style.removeProperty('--ctc-h'); el.style.height = ''; el.style.top = ''; }
  }
  function build() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'ctc'; el.hidden = true;
    el.innerHTML = '<div class="ctc-backdrop" data-ctc="close"></div><div class="ctc-panel" role="dialog" aria-modal="true" aria-labelledby="ctcTitle" tabindex="-1">' +
      '<button type="button" class="ctc-x" data-ctc="close" aria-label="Close">&#x2715;</button><div class="ctc-scroll"></div><div class="ctc-foot"></div></div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-ctc]') : null;
      if (!t || !el.contains(t)) return;
      var a = t.getAttribute('data-ctc');
      if (a === 'close') close();
      else if (a === 'type') { st.type = t.getAttribute('data-v'); st.err = ''; render(); }
      else if (a === 'send') go();
    });
    el.addEventListener('input', function (e) {
      if (e.target.id === 'ctcMsg') st.msg = e.target.value;
      else if (e.target.id === 'ctcDoing') st.doing = e.target.value;
      else if (e.target.id === 'ctcEmail' && !(st.who && st.who.email)) st.email = e.target.value;
      soft();
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Enter' && (e.target.id === 'ctcEmail' || e.target.id === 'ctcDoing')) { e.preventDefault(); if (ready()) go(); }
    });
    if (window.visualViewport) { visualViewport.addEventListener('resize', fit); visualViewport.addEventListener('scroll', fit); }
  }
  function go() {
    if (st.busy || !ready()) return;
    var hp = document.getElementById('ctcHp');
    st.busy = true; st.err = ''; render();
    var c = context(), data = { type: st.type, msg: st.msg.trim(), doing: st.type === 'bug' ? st.doing.trim() : '', email: st.who && st.who.email ? '' : st.email.trim(), hp: hp ? hp.value : '',
      site: c.site, screen: c.screen, url: c.url, ver: c.ver, ua: c.ua, scr: c.scr, errs: c.errs };
    send(data).then(function (r) {
      st.busy = false; st.sent = (r && r.ref) || 'CG-'; st.sentTo = data.email;
      st.msg = ''; st.doing = '';
      track('contact_sent', { type: data.type });
      render();
      var p = el.querySelector('.ctc-panel'); if (p) p.focus();
    }, function (err) { st.busy = false; st.err = errText(err); render(); });
  }
  function track(ev, p) {
    try { if (window.CAST_ACCOUNT && typeof window.CAST_ACCOUNT.track === 'function') window.CAST_ACCOUNT.track(ev, Object.assign({ game: site() }, p)); else if (typeof window.gtag === 'function') window.gtag('event', ev, Object.assign({ game: site() }, p)); } catch (e) { /* analytics blocked */ }
  }
  function open(type, opts) {
    build();
    opts = opts || {};
    if (st.sent) { st.sent = null; st.type = null; }
    if (type && typeOf(type)) st.type = type; else if (type === 'contact' && st.type === 'bug' && !st.msg) st.type = null;
    if (opts.msg && !st.msg) st.msg = String(opts.msg);
    st.err = '';
    lastFocus = document.activeElement;
    el.hidden = false;
    document.documentElement.classList.add('ctc-open');
    st.loading = !st.who && (lsGet('cast_signed_in') === '1');
    render(); fit();
    var p = el.querySelector('.ctc-panel'); if (p) p.focus({ preventScroll: true });
    who().then(function (w) { var redo = st.loading || (w && w.email) !== (st.who && st.who.email); st.who = w; st.loading = false; if (redo) { render(); fit(); } });
    track('contact_open', { type: st.type || 'contact' });
  }
  function close() {
    if (!el) return;
    el.hidden = true;
    document.documentElement.classList.remove('ctc-open');
    if (st.sent) { st.sent = null; st.type = null; }
    try { if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); } catch (e) { /* gone */ }
  }

  // Any data-cast-contact button on the page opens the form
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cast-contact]') : null;
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute('data-cast-contact') || 'contact', { msg: t.getAttribute('data-cast-contact-msg') || '' });
  });
  // ?contact=bug (or contact, pay, account, idea, other) in the address opens it
  function fromUrl() {
    var m = /[?&]contact=([a-z]{2,10})(&|$)/.exec(location.search);
    if (m) open(m[1]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fromUrl); else fromUrl();

  window.CastContact = { open: open, close: close, errors: function () { return ERRS.slice(); }, context: context };
})();
