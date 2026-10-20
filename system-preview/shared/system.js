/* AiGRI app system. One classic script, one global (window.AG). No modules, no fetch. See PLAN.md section 4.2. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;

  /* ---- boot: js class, still mode ---- */
  root.classList.add('js');
  if (/[?&]still(?:[=&]|$)/.test(location.search)) root.setAttribute('data-still', '');
  var still = root.hasAttribute('data-still');
  var mqReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var AG = window.AG = window.AG || {};

  /* ---- country packs ---- */
  var PACKS = {
    ID: { code: 'ID', name: 'Indonesia', currency: 'IDR', symbol: 'Rp', locale: 'id-ID', sepT: '.', sepD: ',', areaUnit: 'ha', haPerUnit: 1, tz: 'WIB',
      regulator: 'OJK', rails: ['BI-FAST', 'Virtual account', 'GoPay', 'OVO', 'DANA'],
      hazards: ['BMKG', 'BNPB InaRISK', 'BNPB DIBI', 'Copernicus GFM', 'Sentinel-1', 'Sentinel-2', 'Open-Meteo', 'GDACS'],
      insurers: [{ name: 'Asuransi Jasindo', code: 'JSD', status: 'live' }, { name: 'Askrindo', code: 'ASK', status: 'live' },
        { name: 'Asuransi Sinar Mas', code: 'SMI', status: 'live' }, { name: 'Asuransi Central Asia (ACA)', code: 'ACA', status: 'verification' }],
      status: 'live' },
    PH: { code: 'PH', name: 'Philippines', currency: 'PHP', symbol: '₱', locale: 'en-PH', sepT: ',', sepD: '.', areaUnit: 'ha', haPerUnit: 1, tz: 'PHT',
      regulator: 'Insurance Commission', rails: ['InstaPay', 'PESONet'], hazards: ['PAGASA', 'PhilSA'], insurers: [], status: 'planned' },
    VN: { code: 'VN', name: 'Vietnam', currency: 'VND', symbol: '₫', locale: 'vi-VN', sepT: '.', sepD: ',', areaUnit: 'ha', haPerUnit: 1, tz: 'ICT',
      regulator: 'Ministry of Finance Insurance Supervisory Authority', rails: ['NAPAS'], hazards: ['NCHMF'], insurers: [], status: 'planned' },
    TH: { code: 'TH', name: 'Thailand', currency: 'THB', symbol: '฿', locale: 'th-TH', sepT: ',', sepD: '.', areaUnit: 'rai', haPerUnit: 0.16, tz: 'ICT',
      regulator: 'Office of Insurance Commission (OIC)', rails: ['PromptPay'], hazards: ['Thai Meteorological Department', 'GISTDA'], insurers: [], status: 'planned' }
  };
  AG.packs = PACKS;
  AG.pack = PACKS.ID;

  /* ---- formatting (manual grouping so output never depends on ICU) ---- */
  var MINUS = '−';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, AG.pack.sepT); }
  function numAbs(n, d) {
    var s = Math.abs(n).toFixed(d || 0), p = s.split('.');
    return group(p[0]) + (p[1] ? AG.pack.sepD + p[1] : '');
  }
  function trim(n, d) { return numAbs(n, d).replace(new RegExp(AG.pack.sepD.replace('.', '\\.') + '?0+$'), ''); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  AG.fmt = {
    num: function (n, d) { return (n < 0 ? MINUS : '') + numAbs(n, d); },
    pct: function (n, d) { return AG.fmt.num(n, d) + '%'; },
    money: function (n, o) {
      o = o || {};
      var p = AG.pack, a = Math.abs(n), body;
      var sign = n < 0 ? MINUS : (o.sign ? '+' : '');
      if (o.compact && a >= 1e6) {
        if (p.code === 'ID') body = a >= 1e9 ? p.symbol + trim(a / 1e9, 2) + ' M' : p.symbol + trim(a / 1e6, 1) + ' jt';
        else body = a >= 1e9 ? p.symbol + trim(a / 1e9, 2) + ' B' : p.symbol + trim(a / 1e6, 1) + ' M';
      } else body = p.symbol + numAbs(a, 0);
      return sign + body;
    },
    area: function (n) { var p = AG.pack; return numAbs(n / p.haPerUnit, 1) + ' ' + p.areaUnit; },
    date: function (s) {
      var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
      if (!m) return String(s);
      return parseInt(m[3], 10) + ' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1];
    },
    dateTime: function (s) {
      var m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(s);
      if (!m) return AG.fmt.date(s);
      return AG.fmt.date(s) + ', ' + m[4] + ':' + m[5] + ' ' + AG.pack.tz;
    }
  };
  function formatBy(kind) {
    if (typeof kind === 'function') return kind;
    if (kind === 'num') return function (v) { return AG.fmt.num(Math.round(v)); };
    if (kind === 'ha') return function (v) { return AG.fmt.area(v); };
    return function (v) { return AG.fmt.money(Math.round(v)); };
  }

  AG.reduced = function () { return still || mqReduce.matches; };

  /* ---- icons ---- */
  var ICONS = {
    'home': '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    'farm': '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    'parcel': '<path d="M5 6.5 14 4l5 5-2 9-9 2.5-4-6.5z"/><path d="M10 12h.01"/>',
    'cow': '<path d="M3.5 5c.5 2.5 1.8 3.5 3.5 3.5M20.5 5c-.5 2.5-1.8 3.5-3.5 3.5"/><path d="M7 8.5h10l1.5 3.5v4.5A3.5 3.5 0 0 1 15 20H9a3.5 3.5 0 0 1-3.5-3.5V12z"/><path d="M9.5 12.5h.01M14.5 12.5h.01M10 16.5h4"/>',
    'sprout': '<path d="M7 21h10M12 21v-9"/><path d="M12 12C12 8 9.5 5.5 5 5.5 5 9.5 7.5 12 12 12z"/><path d="M12 14.5c0-3.5 2.5-5.5 7-5.5 0 3.5-2.5 5.5-7 5.5z"/>',
    'shield': '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    'shield-check': '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    'file': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    'file-check': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/>',
    'file-pen': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M14 3l5 5v2"/><path d="M14 3v5h5"/><path d="m13 20 .6-2.4 5.4-5.4a1.6 1.6 0 0 1 2.3 2.3L15.9 19.9z"/>',
    'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    'settings': '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
    'building': '<path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17"/><path d="M15 9h3a1 1 0 0 1 1 1v11M3 21h18M9 7h2M9 11h2M9 15h2"/>',
    'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'filter': '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'minus': '<path d="M5 12h14"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    'chevron-left': '<path d="m15 6-6 6 6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    'arrow-down-left': '<path d="M17 7 7 17M16 17H7V8"/>',
    'alert': '<path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    'rain': '<path d="M4 13.9A7 7 0 1 1 15.7 7h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M8 16v4M12 18v4M16 16v4"/>',
    'rain-alert': '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 13v4M12 20h.01"/>',
    'flood': '<path d="M2 7c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'thermometer': '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>',
    'bug': '<path d="M9 7.5a3 3 0 0 1 6 0"/><path d="M7 12a5 5 0 0 1 10 0v3a5 5 0 0 1-10 0z"/><path d="M12 11v9M3 13h4M17 13h4M4 7l3 2M20 7l-3 2M4 20l3-2M20 20l-3-2"/>',
    'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    'image': '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-9 9"/>',
    'upload': '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    'download': '<path d="M12 4v12M7 11l5 5 5-5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    'satellite': '<path d="m7 4 4 4-3 3-4-4z"/><path d="m13 10 4 4-3 3-4-4z"/><path d="m9.5 9.5 5 5"/><path d="M15 5l4 4M3 14a7 7 0 0 0 7 7M3 18a3 3 0 0 0 3 3"/>',
    'layers': '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    'tag': '<path d="M3 3h8l10 10-8 8L3 11z"/><path d="M7.5 7.5h.01"/>',
    'pin': '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    'bank': '<path d="M3 10 12 4l9 6z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    'send': '<path d="m21 3-9 18-2.5-7.5L3 11z"/><path d="M21 3 9.5 13.5"/>',
    'scale': '<path d="M12 3v18M7 21h10M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    'list': '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    'activity': '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    'chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    'lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    'eye': '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'edit': '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="m14 7 3 3"/>',
    'copy': '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    'external': '<path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    'logout': '<path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9"/>',
    'hash': '<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
    'refresh': '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5M3 12A9 9 0 0 1 18.5 5.8L21 8M21 3v5h-5"/>'
  };
  AG.iconNames = [];
  for (var k in ICONS) if (Object.prototype.hasOwnProperty.call(ICONS, k)) AG.iconNames.push(k);
  AG.icon = function (name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  };
  function injectSprite() {
    if (doc.getElementById('ag-sprite') || !doc.body) return !!doc.getElementById('ag-sprite');
    var s = '<svg id="ag-sprite" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>';
    for (var i = 0; i < AG.iconNames.length; i++) {
      s += '<symbol id="i-' + AG.iconNames[i] + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[AG.iconNames[i]] + '</symbol>';
    }
    s += '</defs></svg>';
    var tpl = doc.createElement('div');
    tpl.innerHTML = s;
    doc.body.insertBefore(tpl.firstChild, doc.body.firstChild);
    return true;
  }

  /* ---- helpers ---- */
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return [].slice.call((ctx || doc).querySelectorAll(sel)); }
  function frame(fn) { return window.requestAnimationFrame ? requestAnimationFrame(fn) : setTimeout(fn, 16); }
  function dispatch(el, name, detail) {
    var ev;
    try { ev = new CustomEvent(name, { bubbles: true, detail: detail }); }
    catch (err) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, true, false, detail); }
    el.dispatchEvent(ev);
  }
  function tween(ms, ease, step, done) {
    var t0 = null;
    function tick(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / ms);
      step(ease(p));
      if (p < 1) frame(tick); else if (done) done();
    }
    frame(tick);
  }
  function easeOut(p) { return 1 - Math.pow(1 - p, 4); }
  function easeInOut(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

  /* ---- toasts ---- */
  function region() {
    var r = $('.toast-region');
    if (!r) {
      r = doc.createElement('div');
      r.className = 'toast-region';
      r.setAttribute('role', 'status');
      r.setAttribute('aria-live', 'polite');
      doc.body.appendChild(r);
    }
    return r;
  }
  function removeToast(t) {
    if (!t || !t.parentNode || t.__gone) return;
    t.__gone = true;
    clearTimeout(t.__timer);
    t.classList.remove('in');
    t.classList.add('out');
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, still ? 0 : 200);
  }
  var TONE_ICON = { ok: 'check', info: 'info', need: 'alert', alert: 'rain-alert' };
  AG.toast = function (text, o) {
    o = o || {};
    var tone = o.tone || 'ok', dur = o.duration == null ? 4000 : o.duration;
    var r = region(), live = $$('.toast', r).filter(function (x) { return !x.__gone; });
    while (live.length >= 3) removeToast(live.shift());
    var t = doc.createElement('div');
    t.className = 'toast';
    t.setAttribute('data-tone', tone);
    t.innerHTML = AG.icon(TONE_ICON[tone] || 'info', 'i-sm') + '<span class="toast-text"></span>';
    t.querySelector('.toast-text').textContent = text;
    if (o.action && o.action.label) {
      var a = doc.createElement('a');
      a.className = 'toast-action';
      a.href = o.action.href || '#';
      a.textContent = o.action.label;
      t.appendChild(a);
    }
    r.appendChild(t);
    frame(function () { frame(function () { t.classList.add('in'); }); });
    var left = dur, started = 0;
    function start() { if (dur <= 0) return; started = Date.now(); clearTimeout(t.__timer); t.__timer = setTimeout(function () { removeToast(t); }, left); }
    function pause() { if (!started) return; clearTimeout(t.__timer); left -= Date.now() - started; started = 0; }
    t.addEventListener('mouseenter', pause);
    t.addEventListener('mouseleave', start);
    doc.addEventListener('visibilitychange', function () { if (t.__gone) return; if (doc.hidden) pause(); else start(); });
    start();
    return t;
  };

  /* ---- dialogs ---- */
  AG.open = function (id) {
    var d = typeof id === 'string' ? doc.getElementById(id) : id;
    if (!d || d.open) return;
    d.__trigger = doc.activeElement;
    if (!d.__bound) {
      d.__bound = true;
      d.addEventListener('cancel', function (e) { e.preventDefault(); AG.close(d); });
      d.addEventListener('click', function (e) {
        if (e.target !== d) return;
        var r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) AG.close(d);
      });
    }
    try { d.showModal(); } catch (err) { d.setAttribute('open', ''); }
    root.classList.add('has-dialog');
    if (still) d.classList.add('is-open'); else frame(function () { frame(function () { d.classList.add('is-open'); }); });
    var f = $('[autofocus]', d) || $('.ov-body input,.ov-body select,.ov-body textarea', d);
    if (f) { try { f.focus({ preventScroll: true }); } catch (err2) {} }
  };
  AG.close = function (id) {
    var d = typeof id === 'string' ? doc.getElementById(id) : id;
    if (!d || !d.open) return;
    d.classList.remove('is-open');
    function fin() {
      try { d.close(); } catch (err) { d.removeAttribute('open'); }
      if (!$('dialog[open]')) root.classList.remove('has-dialog');
      var t = d.__trigger;
      if (t && t.focus) { try { t.focus({ preventScroll: true }); } catch (err2) {} }
    }
    if (still) fin(); else setTimeout(fin, AG.reduced() ? 200 : 180);
  };

  /* ---- count-up ---- */
  AG.countUp = function (el, to, o) {
    o = o || {};
    var from = o.from || 0, fmt = formatBy(o.format), dur = o.duration || 900;
    if (AG.reduced()) { el.textContent = fmt(to); return; }
    el.textContent = fmt(from);
    tween(dur, easeOut, function (e) { el.textContent = fmt(from + (to - from) * e); }, function () { el.textContent = fmt(to); });
  };

  /* ---- flow ---- */
  AG.flow = function (el) {
    if (typeof el === 'string') el = $(el);
    if (!el) return null;
    if (el.__flow) return el.__flow;
    var panels = $$('[data-flow-step]', el);
    var stepper = $('.stepper', el);
    var compact = null;
    if (stepper) {
      compact = stepper.nextElementSibling && stepper.nextElementSibling.classList.contains('stepper-compact') ? stepper.nextElementSibling : null;
      if (!compact) {
        compact = doc.createElement('div');
        compact.className = 'stepper-compact';
        compact.innerHTML = '<span class="sc-text"></span><div class="meter" aria-hidden="true"><span></span></div>';
        stepper.parentNode.insertBefore(compact, stepper.nextSibling);
      }
    }
    var dots = stepper ? $$('.step', stepper) : [];
    var total = panels.length ? Math.max.apply(null, panels.map(function (p) { return parseInt(p.getAttribute('data-flow-step'), 10) || 1; })) : dots.length;
    var cur = parseInt(el.getAttribute('data-flow-start'), 10) || 0;
    if (!cur) { for (var i = 0; i < panels.length; i++) if (panels[i].classList.contains('is-active')) cur = parseInt(panels[i].getAttribute('data-flow-step'), 10); }
    cur = cur || 1;

    function paint(n, user) {
      panels.forEach(function (p) {
        var on = parseInt(p.getAttribute('data-flow-step'), 10) === n;
        var was = p.classList.contains('is-active');
        p.classList.toggle('is-active', on);
        if (on && !was && user && !AG.reduced() && p.animate) {
          p.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(0.23,1,0.32,1)' });
        } else if (on && !was && user && p.animate) {
          p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
        }
      });
      var label = '';
      dots.forEach(function (d, i) {
        d.classList.toggle('is-done', i + 1 < n);
        d.classList.toggle('is-now', i + 1 === n);
        if (i + 1 === n) { d.setAttribute('aria-current', 'step'); var lb = $('.step-label', d); label = lb ? lb.textContent : ''; }
        else d.removeAttribute('aria-current');
      });
      var p = total > 1 ? (n - 1) / (total - 1) : 0;
      if (stepper) stepper.style.setProperty('--p', p);
      if (compact) {
        var t = $('.sc-text', compact);
        if (t) t.textContent = 'Step ' + n + ' of ' + total + (label ? ' · ' + label : '');
        var m = $('.meter', compact);
        if (m) m.style.setProperty('--p', n / total);
      }
    }
    var ctl = el.__flow = {
      el: el, total: total,
      current: function () { return cur; },
      go: function (n, quiet) {
        n = Math.max(1, Math.min(total, parseInt(n, 10) || 1));
        var changed = n !== cur;
        cur = n;
        paint(n, !quiet);
        if (!quiet) {
          var panel = panels.filter(function (p) { return parseInt(p.getAttribute('data-flow-step'), 10) === n; })[0];
          var h = panel && (panel.querySelector('[data-flow-focus]') || panel.querySelector('h1,h2,h3'));
          if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (err) {} }
          if (changed) dispatch(el, 'flow:change', { step: n });
        }
        return ctl;
      }
    };
    paint(cur, false);
    return ctl;
  };

  /* ---- component inits ---- */
  function initNav() {
    var page = doc.body && doc.body.getAttribute('data-page');
    $$('.nav-item,.tab').forEach(function (a) {
      var list = (a.getAttribute('data-nav') || '').split(/\s+/);
      if (page && list.indexOf(page) > -1) a.setAttribute('aria-current', 'page');
      if (a.classList.contains('nav-item') && !a.getAttribute('title')) {
        var tn = ''; for (var n = a.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) tn += n.nodeValue;
        tn = tn.replace(/\s+/g, ' ').trim();
        if (tn) a.setAttribute('title', tn);
      }
    });
  }
  function initScrolled() {
    var bars = $$('.topbar,.mbar');
    if (!bars.length) return;
    var tick = false;
    function paint() { tick = false; var y = (window.pageYOffset || 0) > 8; bars.forEach(function (b) { b.classList.toggle('scrolled', y); }); }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; frame(paint); } }, { passive: true });
    paint();
  }
  function initChoices() {
    $$('.choice').forEach(function (c) {
      if (!$('.choice-badge', c)) { var b = doc.createElement('span'); b.className = 'choice-badge'; b.innerHTML = AG.icon('check'); c.appendChild(b); }
    });
    $$('[data-select-group]').forEach(function (g) {
      $$('.choice,.chip', g).forEach(function (c) {
        c.setAttribute('aria-pressed', c.classList.contains('is-sel') ? 'true' : 'false');
        if (c.tagName !== 'BUTTON' && c.tagName !== 'A') { c.setAttribute('role', 'button'); if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0'); }
      });
    });
  }
  function selectChoice(c) {
    var g = c.closest('[data-select-group]');
    if (!g) return;
    var multi = g.hasAttribute('data-multi');
    if (multi) { c.classList.toggle('is-sel'); }
    else { $$('.choice,.chip', g).forEach(function (o) { o.classList.remove('is-sel'); o.setAttribute('aria-pressed', 'false'); }); c.classList.add('is-sel'); }
    c.setAttribute('aria-pressed', c.classList.contains('is-sel') ? 'true' : 'false');
    dispatch(g, 'select:change', { item: c });
  }

  function placeInk(tabs, instant) {
    var ink = $('.tabs-ink', tabs), sel = $('[role=tab][aria-selected="true"]', tabs);
    if (!ink || !sel) return;
    var pl = parseFloat(getComputedStyle(sel).paddingLeft) || 0;
    var x = sel.offsetLeft + pl, w = Math.max(1, sel.offsetWidth - pl * 2);
    if (instant) ink.style.transition = 'none';
    ink.style.transform = 'translateX(' + x + 'px) scaleX(' + w + ')';
    if (instant) { void ink.offsetWidth; ink.style.transition = ''; }
  }
  function selectTab(tabs, tab, focus) {
    $$('[role=tab]', tabs).forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.setAttribute('tabindex', on ? '0' : '-1');
      var pid = t.getAttribute('aria-controls'), p = pid && doc.getElementById(pid);
      if (p) p.hidden = !on;
    });
    placeInk(tabs, false);
    if (focus) tab.focus();
    dispatch(tabs, 'tabs:change', { tab: tab });
  }
  function initTabs() {
    $$('[data-tabs]').forEach(function (tabs) {
      var all = $$('[role=tab]', tabs), sel = all.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || all[0];
      if (!sel) return;
      all.forEach(function (t) {
        var on = t === sel;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        var pid = t.getAttribute('aria-controls'), p = pid && doc.getElementById(pid);
        if (p) p.hidden = !on;
      });
      placeInk(tabs, true);
    });
  }
  function placeSeg(seg, instant) {
    var btns = $$('button', seg), th = $('.seg-thumb', seg);
    if (!th) { th = doc.createElement('span'); th.className = 'seg-thumb'; seg.insertBefore(th, seg.firstChild); }
    var i = 0; btns.forEach(function (b, n) { if (b.getAttribute('aria-pressed') === 'true') i = n; });
    var b = btns[i]; if (!b) return;
    if (instant) th.style.transition = 'none';
    th.style.width = b.offsetWidth + 'px';
    th.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)';
    seg.classList.add('has-thumb');
    if (instant) { void th.offsetWidth; th.style.transition = ''; }
  }
  function selectSeg(seg, btn) {
    $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    placeSeg(seg, false);
    var tgt = seg.getAttribute('data-seg-target'), host = tgt && $(tgt);
    var val = btn.getAttribute('data-value');
    if (host) $$('[data-seg-panel]', host).forEach(function (p) { p.hidden = p.getAttribute('data-seg-panel') !== val; if (!p.hidden) revealIn(p); });
    dispatch(seg, 'seg:change', { value: val });
  }
  function initSeg() {
    $$('[data-seg]').forEach(function (seg) {
      var btns = $$('button', seg);
      if (!btns.some(function (b) { return b.getAttribute('aria-pressed') === 'true'; }) && btns[0]) btns[0].setAttribute('aria-pressed', 'true');
      btns.forEach(function (b) { if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'false'); });
      placeSeg(seg, true);
      var tgt = seg.getAttribute('data-seg-target'), host = tgt && $(tgt);
      if (host) { var cur = $('button[aria-pressed="true"]', seg).getAttribute('data-value'); $$('[data-seg-panel]', host).forEach(function (p) { p.hidden = p.getAttribute('data-seg-panel') !== cur; }); }
    });
  }
  function relayout() {
    $$('[data-tabs]').forEach(function (t) { placeInk(t, true); });
    $$('[data-seg]').forEach(function (s) { placeSeg(s, true); });
  }

  function initDisc() {
    $$('details.disc').forEach(function (d) {
      if (d.__disc) return; d.__disc = true;
      var s = d.querySelector('summary'), b = d.querySelector('.disc-body');
      if (!s) return;
      if (!b) {
        b = doc.createElement('div'); b.className = 'disc-body';
        var inner = doc.createElement('div'); inner.className = 'disc-inner';
        [].slice.call(d.childNodes).forEach(function (n) { if (n !== s) inner.appendChild(n); });
        b.appendChild(inner); d.appendChild(b);
      }
      var inn = b.firstElementChild, a = null, closing = false;
      var EASE = 'cubic-bezier(0.23,1,0.32,1)';
      s.addEventListener('click', function (e) {
        if (AG.reduced() || !b.animate) return;
        e.preventDefault();
        var from = b.getBoundingClientRect().height;
        if (a) a.cancel();
        if (d.open && !closing) {
          closing = true;
          a = b.animate([{ height: from + 'px' }, { height: '0px' }], { duration: 200, easing: EASE });
          a.onfinish = function () { d.open = false; closing = false; a = null; };
        } else {
          closing = false; d.open = true;
          var to = b.scrollHeight;
          a = b.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 260, easing: EASE });
          if (inn && from === 0) inn.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: 60, easing: EASE, fill: 'backwards' });
          a.onfinish = function () { a = null; };
        }
      });
    });
  }

  function initSat() {
    $$('.sat[data-compare]').forEach(function (sat) {
      if (sat.__sat) return; sat.__sat = true;
      var range = $('.sat-range', sat);
      function set(v) { sat.style.setProperty('--x', v + '%'); if (range) range.value = v; }
      if (range) {
        if (!range.getAttribute('aria-label')) range.setAttribute('aria-label', 'Compare before and after');
        range.min = 0; range.max = 100; range.step = 1;
        range.addEventListener('input', function () { sat.__user = true; set(range.value); });
      }
      sat.__sweep = function () {
        if (AG.reduced() || sat.__user) { set(50); return; }
        tween(1600, easeInOut, function (e) { if (!sat.__user) set(100 - 50 * e); }, function () { if (!sat.__user) set(50); });
      };
      set(AG.reduced() ? 50 : 100);
    });
  }

  function initCounts() {
    $$('[data-count]').forEach(function (el) {
      if (el.__cnt) return; el.__cnt = true;
      if (!AG.reduced()) { var f = el.getAttribute('data-from'); if (f !== null) el.textContent = formatBy(el.getAttribute('data-format'))(parseFloat(f)); }
    });
  }

  /* reveal engine: one observer for every motion hook; adds .in once */
  var io = null;
  function onIn(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-count') && !el.__counted) {
      el.__counted = true;
      var to = parseFloat(el.getAttribute('data-count')), from = parseFloat(el.getAttribute('data-from') || '0');
      AG.countUp(el, to, { from: from, format: el.getAttribute('data-format') });
    }
    if (el.__sweep) el.__sweep();
  }
  function revealIn(el) {
    $$('.rv,.pop,.settle,.sun-rise,svg.chart[data-draw],.sat[data-compare],[data-count]', el).concat([el]).forEach(function (x) {
      if (x.classList && !x.classList.contains('in') && x.matches('.rv,.pop,.settle,.sun-rise,svg.chart[data-draw],.sat[data-compare],[data-count]')) {
        if (io && !still) { /* observer will catch it once visible */ io.observe(x); } else onIn(x);
      }
    });
  }
  function initReveal() {
    var els = $$('.rv,.pop,.settle,.sun-rise,svg.chart[data-draw],.sat[data-compare],[data-count]');
    if (still || !('IntersectionObserver' in window)) { els.forEach(onIn); return; }
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); onIn(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* delegated behaviour */
  function copyText(text) {
    function fallback() {
      try {
        var ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
        doc.body.appendChild(ta); ta.select(); doc.execCommand('copy'); doc.body.removeChild(ta);
      } catch (err) {}
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(fallback); else fallback();
    } catch (err) { fallback(); }
  }
  function bindDelegates() {
    doc.addEventListener('click', function (e) {
      var t = e.target, el;
      if (!t || !t.closest) return;
      if ((el = t.closest('[data-stub]'))) {
        e.preventDefault();
        AG.toast(el.getAttribute('data-stub'), { tone: 'info' });
        return;
      }
      if ((el = t.closest('[data-copy]'))) {
        copyText(el.getAttribute('data-copy'));
        AG.toast('Copied', { tone: 'ok', duration: 2000 });
      }
      if ((el = t.closest('[data-toast]'))) {
        var href = el.getAttribute('data-toast-href');
        AG.toast(el.getAttribute('data-toast'), { tone: el.getAttribute('data-tone') || 'ok', action: href ? { label: el.getAttribute('data-toast-label') || 'View', href: href } : null });
        if (el.tagName === 'A' && (el.getAttribute('href') || '#') === '#') e.preventDefault();
      }
      if ((el = t.closest('[data-close]'))) {
        var dlg = el.closest('dialog'); var tid = el.getAttribute('data-close');
        if (tid) AG.close(tid); else if (dlg) AG.close(dlg);
      }
      if ((el = t.closest('[data-open]'))) { e.preventDefault(); AG.open(el.getAttribute('data-open')); }
      if ((el = t.closest('[data-toggle]'))) {
        var tgt = doc.getElementById(el.getAttribute('data-toggle'));
        if (tgt) { tgt.hidden = !tgt.hidden; el.setAttribute('aria-expanded', tgt.hidden ? 'false' : 'true'); }
      }
      if ((el = t.closest('[data-tabs] [role=tab]'))) { selectTab(el.closest('[data-tabs]'), el, false); }
      if ((el = t.closest('[data-seg] button'))) { selectSeg(el.closest('[data-seg]'), el); }
      if ((el = t.closest('[data-select-group] .choice,[data-select-group] .chip'))) { selectChoice(el); }
      if ((el = t.closest('[data-flow] [data-next],[data-flow] [data-prev],[data-flow] [data-goto]'))) {
        var fl = AG.flow(el.closest('[data-flow]'));
        if (el.hasAttribute('data-next')) fl.go(fl.current() + 1);
        else if (el.hasAttribute('data-prev')) fl.go(fl.current() - 1);
        else fl.go(el.getAttribute('data-goto'));
      }
      if ((el = t.closest('tr[data-href],.card-link[data-href]')) && !t.closest('a,button,input,select,textarea,summary')) {
        location.href = el.getAttribute('data-href');
      }
    });
    doc.addEventListener('keydown', function (e) {
      var t = e.target, k = e.key, el;
      if (!t || !t.closest) return;
      if ((el = t.closest('[data-tabs] [role=tab]'))) {
        var tabs = el.closest('[data-tabs]'), all = $$('[role=tab]', tabs), i = all.indexOf(el), n = -1;
        if (k === 'ArrowRight') n = (i + 1) % all.length;
        else if (k === 'ArrowLeft') n = (i - 1 + all.length) % all.length;
        else if (k === 'Home') n = 0;
        else if (k === 'End') n = all.length - 1;
        if (n > -1) { e.preventDefault(); selectTab(tabs, all[n], true); }
        return;
      }
      if ((k === 'Enter' || k === ' ') && (el = t.closest('[data-select-group] .choice,[data-select-group] .chip')) && el.tagName !== 'BUTTON') { e.preventDefault(); selectChoice(el); return; }
      if (k === 'Enter' && (el = t.closest('tr[data-href],.card-link[data-href]')) && t === el) { location.href = el.getAttribute('data-href'); }
    });
    var rz = 0;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(relayout, 100); });
    window.addEventListener('load', relayout);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayout);
  }

  var inited = false;
  AG.init = function () {
    injectSprite();
    initNav();
    initScrolled();
    initChoices();
    initTabs();
    initSeg();
    initDisc();
    initSat();
    initCounts();
    $$('[data-flow]').forEach(function (f) { AG.flow(f); });
    $$('tr[data-href],.card-link[data-href]').forEach(function (r) { if (!r.hasAttribute('tabindex')) r.setAttribute('tabindex', '0'); });
    initReveal();
    if (!inited) { inited = true; bindDelegates(); }
  };

  /* ---- start ---- */
  function start() { AG.init(); }
  if (doc.body) injectSprite();
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
