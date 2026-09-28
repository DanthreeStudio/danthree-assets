/* Danthree form attribution. Consent-aware revision 2026-09-28.
   source_url remains available for form routing. Optional attribution requires
   Cookiebot consent. Existing form names, transport and recipients are unchanged. */
(function () {
  'use strict';
  var MAX_AGE = 90 * 864e5;
  var ADS = 'dt_attribution';
  var SOURCE = 'dt_herkunft';
  var consentReady = false;

  function consent(category) {
    return !!(window.Cookiebot && window.Cookiebot.consent &&
      window.Cookiebot.hasResponse && window.Cookiebot.consent[category] === true);
  }
  function field(name, value) {
    document.querySelectorAll('input[name="' + name + '"], input[id="' + name + '"]')
      .forEach(function (el) { el.value = value || ''; });
  }
  function forget(key) {
    try { window.localStorage.removeItem(key); } catch (e) {}
  }
  function stored(key) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.ts !== 'number' || !isFinite(data.ts) ||
          data.ts > Date.now() || Date.now() - data.ts >= MAX_AGE) {
        forget(key);
        return null;
      }
      return data;
    } catch (e) { forget(key); return null; }
  }
  function save(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    return value;
  }
  function pageUrl() {
    // The form route needs the page/language, not query strings or fragments.
    return window.location.origin + window.location.pathname;
  }
  function cleanUrl(value) {
    try { var url = new URL(value); return /^https?:$/.test(url.protocol) ? url.origin + url.pathname : ''; }
    catch (e) { return ''; }
  }
  function referrer() {
    try {
      if (!document.referrer) return 'direkt';
      var ref = new URL(document.referrer);
      if (!/^https?:$/.test(ref.protocol)) return 'direkt';
      var host = window.location.hostname.replace(/^www\./, '');
      return ref.hostname.replace(/^www\./, '') === host ? 'direkt' : ref.origin + ref.pathname;
    } catch (e) { return 'direkt'; }
  }
  function userId() {
    var parts = document.cookie.split(';');
    for (var i = 0; i < parts.length; i++) {
      var item = parts[i].trim();
      if (item.indexOf('stape=') === 0) {
        try { return JSON.parse(decodeURIComponent(item.substring(6))).user_id || ''; }
        catch (e) { return ''; }
      }
    }
    return '';
  }
  function refresh() {
    field('source_url', pageUrl());
    var statistics = consent('statistics');
    var marketing = consent('marketing');
    if (statistics) {
      var source = stored(SOURCE) || save(SOURCE, {
        referrer: referrer(), landing_page: pageUrl(), ts: Date.now()
      });
      field('referrer', source.referrer === 'direkt' ? 'direkt' : cleanUrl(source.referrer));
      field('landing_page', cleanUrl(source.landing_page));
    } else {
      field('referrer', '');
      field('landing_page', '');
      if (consentReady) forget(SOURCE);
    }
    // A cross-visit identifier is only forwarded with both optional categories.
    field('custom_user_id', statistics && marketing ? userId() : '');
    var ad = null;
    if (marketing) {
      ad = stored(ADS);
      if (!ad) {
        var params = new URLSearchParams(window.location.search);
        var gclid = params.get('gclid') ||
          (params.get('gbraid') ? 'gbraid:' + params.get('gbraid') : '') ||
          (params.get('wbraid') ? 'wbraid:' + params.get('wbraid') : '');
        var sourceName = params.get('utm_source') || '';
        var campaign = params.get('utm_campaign') || '';
        if (gclid || sourceName || campaign) ad = save(ADS, {
          gclid: gclid, utm_source: sourceName, utm_campaign: campaign, ts: Date.now()
        });
      }
    } else if (consentReady) { forget(ADS); }
    ['gclid', 'utm_source', 'utm_campaign'].forEach(function (name) {
      field(name, ad && ad[name]);
    });
  }
  function onConsent() {
    consentReady = true;
    refresh();
    window.setTimeout(refresh, 1000);
    window.setTimeout(refresh, 4000);
  }
  ['CookiebotOnConsentReady', 'CookiebotOnAccept', 'CookiebotOnDecline'].forEach(function (event) {
    window.addEventListener(event, onConsent);
  });
  function start() {
    if (window.Cookiebot && window.Cookiebot.hasResponse) consentReady = true;
    refresh();
    window.setTimeout(refresh, 1000);
    window.setTimeout(refresh, 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  // Capture phase refreshes existing fields before native form serialization.
  document.addEventListener('submit', refresh, true);
})();
