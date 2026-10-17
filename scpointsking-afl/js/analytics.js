/* SC POINTS KING: AFL analytics (GA4). Loads on the live site only; on localhost track() is a no-op. */
(function (T) {
  'use strict';

  var GA_ID = 'G-XXXXXXXXXX'; // off until it has its own property, as SC POINTS KING's

  // Local testing never reaches GA, so reports only show real players
  var local = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname) || location.protocol === 'file:';
  var enabled = !local && /^G-[A-Z0-9]+$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX';

  if (enabled) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  T.track = function (event, params) {
    if (enabled && typeof window.gtag === 'function') window.gtag('event', event, params || {});
  };
})(window.T = window.T || {});
