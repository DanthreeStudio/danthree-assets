/* Danthree Tracking
   Enthaelt: Stape User ID + source_url, Ads-Attribution, Herkunft
   Ersetzt die frueheren Footer-Abschnitte 5, 6 und 7 */

/* ---------- 5. Stape User ID + source_url ---------- */
(function () {
  function getStapeUserId() {
    var cookies = document.cookie.split(';');
    var match = cookies.map(function (c) { return c.trim(); })
                       .find(function (c) { return c.indexOf('stape=') === 0; });
    if (!match) return null;
    try {
      return JSON.parse(decodeURIComponent(match.substring(6))).user_id || null;
    } catch (e) { return null; }
  }

  function injectTrackingData() {
    var userId = getStapeUserId();
    var currentUrl = window.location.href;
    var idFields = document.querySelectorAll('input[id="custom_user_id"], input[name="custom_user_id"]');
    var urlFields = document.querySelectorAll('input[id="source_url"], input[name="source_url"]');
    var success = false;

    if (userId && idFields.length) {
      idFields.forEach(function (f) { f.value = userId; });
      success = true;
    }
    if (currentUrl && urlFields.length) {
      urlFields.forEach(function (f) { f.value = currentUrl; });
    }
    return success;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!injectTrackingData()) {
      setTimeout(function () {
        if (!injectTrackingData()) { setTimeout(injectTrackingData, 3000); }
      }, 1000);
    }
  });
})();

/* ---------- 6. Ads-Attribution (gclid + UTM), First-Touch, 90 Tage ---------- */
(function () {
  var KEY = 'dt_attribution';
  var MAX_AGE_DAYS = 90;

  function readStored() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d.ts || (Date.now() - d.ts) > MAX_AGE_DAYS * 864e5) return null;
      return d;
    } catch (e) { return null; }
  }

  function captureFirstTouch() {
    var p = new URLSearchParams(window.location.search);
    var gclid = p.get('gclid') || (p.get('gbraid') ? 'gbraid:' + p.get('gbraid') : '') ||
                (p.get('wbraid') ? 'wbraid:' + p.get('wbraid') : '');
    var us = p.get('utm_source') || '';
    var uc = p.get('utm_campaign') || '';
    if (!gclid && !us && !uc) return;
    if (readStored()) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ gclid: gclid, utm_source: us, utm_campaign: uc, ts: Date.now() }));
    } catch (e) {}
  }

  function injectAttribution() {
    var d = readStored();
    if (!d) return true;
    var map = { gclid: d.gclid, utm_source: d.utm_source, utm_campaign: d.utm_campaign };
    var found = false;
    Object.keys(map).forEach(function (name) {
      var fields = document.querySelectorAll('input[name="' + name + '"], input[id="' + name + '"]');
      if (fields.length) found = true;
      fields.forEach(function (f) { f.value = map[name] || ''; });
    });
    return found;
  }

  captureFirstTouch();
  document.addEventListener('DOMContentLoaded', function () {
    if (!injectAttribution()) {
      setTimeout(function () {
        if (!injectAttribution()) { setTimeout(injectAttribution, 3000); }
      }, 1000);
    }
  });
})();

/* ---------- 7. Herkunft (referrer + landing_page), First-Touch, 90 Tage ---------- */
(function () {
  var KEY = 'dt_herkunft';
  var MAX_AGE_DAYS = 90;
  var HOST = window.location.hostname.replace(/^www\./, '');

  function readStored() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d.ts || (Date.now() - d.ts) > MAX_AGE_DAYS * 864e5) return null;
      return d;
    } catch (e) { return null; }
  }

  function captureFirstTouch() {
    if (readStored()) return;
    var ref = document.referrer || '';
    var istExtern = ref && ref.indexOf(HOST) === -1;
    try {
      localStorage.setItem(KEY, JSON.stringify({
        referrer: istExtern ? ref : 'direkt',
        landing_page: window.location.href,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function injectHerkunft() {
    var d = readStored();
    if (!d) return true;
    var map = { referrer: d.referrer, landing_page: d.landing_page };
    var found = false;
    Object.keys(map).forEach(function (name) {
      var fields = document.querySelectorAll('input[name="' + name + '"], input[id="' + name + '"]');
      if (fields.length) found = true;
      fields.forEach(function (f) { f.value = map[name] || ''; });
    });
    return found;
  }

  captureFirstTouch();
  document.addEventListener('DOMContentLoaded', function () {
    if (!injectHerkunft()) {
      setTimeout(function () {
        if (!injectHerkunft()) { setTimeout(injectHerkunft, 3000); }
      }, 1000);
    }
  });
})();
