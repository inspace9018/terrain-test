(function () {
  'use strict';
  var CFG = window.TERRAIN_TEST;
  var LS = 'terrain_test:' + CFG.testId;           // 이벤트 기록
  var VS = 'terrain_visitor:' + CFG.testId;        // 방문자 배정
  var params = new URLSearchParams(location.search);

  // ---------- 저장소 (localStorage 불가 시 메모리) ----------
  var mem = {};
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }

  // ---------- 난수 ----------
  function rand01() {
    if (window.crypto && crypto.getRandomValues) {
      var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296;
    }
    return Math.random();
  }
  function uid() {
    var s = '';
    for (var i = 0; i < 4; i++) s += Math.floor(rand01() * 4294967296).toString(16).padStart(8, '0');
    return s;
  }

  // ---------- 방문자 배정: 첫 방문에 50:50, 이후 유지 ----------
  function loadVisitor() {
    var raw = lsGet(VS), v = null;
    try { v = raw ? JSON.parse(raw) : null; } catch (e) { v = null; }
    if (v && v.vid && CFG.variants[v.variant] !== undefined) return v;
    var variant = rand01() < 0.5 ? 'A' : 'B';
    v = { vid: uid(), variant: variant, createdAt: new Date().toISOString() };
    lsSet(VS, JSON.stringify(v));
    return v;
  }

  // ---------- 유입 구분 ----------
  var ch = (params.get('ch') || params.get('utm_source') || 'direct').toLowerCase().slice(0, 30);
  var flags = [];
  if (params.get('internal') === '1') { lsSet('terrain_internal', '1'); }
  if (lsGet('terrain_internal') === '1') flags.push('internal');
  if (navigator.webdriver) flags.push('bot_suspect');

  var visitor = loadVisitor();
  var price = CFG.variants[visitor.variant];

  function inWindow() {
    var now = Date.now();
    if (CFG.startAt && now < Date.parse(CFG.startAt)) return false;
    if (CFG.endAt && now >= Date.parse(CFG.endAt)) return false;
    return true;
  }

  // ---------- 구글 폼 전송 (응답을 읽을 수 없는 no-cors 방식) ----------
  function postForm(cfg, values) {
    if (!cfg || !cfg.action || !window.fetch) return;
    var body = new URLSearchParams();
    for (var k in cfg.entries) {
      if (cfg.entries[k] && values[k] !== undefined && values[k] !== null) body.append(cfg.entries[k], String(values[k]));
    }
    try { fetch(cfg.action, { method: 'POST', mode: 'no-cors', body: body, keepalive: true }); } catch (e) {}
  }

  // ---------- 이벤트 기록 ----------
  var fired = {};
  function readLog() {
    try { return JSON.parse(lsGet(LS) || '[]'); } catch (e) { return []; }
  }
  function track(name, extra, once) {
    if (once && fired[name]) return;
    fired[name] = true;
    if (!inWindow()) return;
    var rec = {
      test_id: CFG.testId, vid: visitor.vid, variant: visitor.variant, price: price,
      sku: 'hero150', channel: ch, flags: flags.slice(), event: name,
      t: new Date().toISOString()
    };
    if (extra) for (var k in extra) rec[k] = extra[k];
    var log = readLog(); log.push(rec); lsSet(LS, JSON.stringify(log));
    if (name !== 'signup' && name !== 'intent_check' && flags.indexOf('internal') < 0) {
      postForm(CFG.eventForm, { event: name, variant: rec.variant, price: rec.price, channel: rec.channel, vid: rec.vid, flags: rec.flags.join(','), t: rec.t });
    }
    if (CFG.endpoint && navigator.sendBeacon) {
      try { navigator.sendBeacon(CFG.endpoint, new Blob([JSON.stringify(rec)], { type: 'application/json' })); } catch (e) {}
    }
  }

  // ---------- 가격 표시 ----------
  var won = price.toLocaleString('ko-KR');
  ['price-text', 'sheet-price', 'intent-price'].forEach(function (id) {
    document.getElementById(id).textContent = won;
  });

  // ---------- 구상 일러스트(결정적 생성, 실물 사진 아님) ----------
  (function art() {
    var W = 600, H = 420, cx = 300, cy = 215, N = 11, ns = 'http://www.w3.org/2000/svg';
    var seed = 7;
    function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var ph = [r() * 6.28, r() * 6.28, r() * 6.28], am = [0.11, 0.07, 0.04];
    function ring(k) {
      var t = k / N, base = 205 * (1 - t * 0.86), pts = [];
      for (var i = 0; i < 72; i++) {
        var a = i / 72 * 6.2832;
        var n = 1 + am[0] * Math.sin(2 * a + ph[0]) + am[1] * Math.sin(3 * a + ph[1]) + am[2] * Math.sin(5 * a + ph[2]);
        var rad = base * n;
        var x = cx + rad * Math.cos(a) * 1.18, y = cy + rad * Math.sin(a) * 0.52 - k * 9;
        pts.push((i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
      }
      return pts.join('') + 'Z';
    }
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '등고선이 층층이 쌓인 지형 오브제를 단순화해 그린 일러스트');
    var base = document.createElementNS(ns, 'ellipse');
    base.setAttribute('cx', cx); base.setAttribute('cy', cy + 62); base.setAttribute('rx', 262); base.setAttribute('ry', 76);
    base.setAttribute('fill', 'rgba(43,58,92,.14)'); svg.appendChild(base);
    for (var k = 0; k < N; k++) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', ring(k));
      p.setAttribute('fill', k % 2 === 0 ? '#2B3A5C' : '#F0E8D8');
      p.setAttribute('stroke', '#1d2a47'); p.setAttribute('stroke-width', '1.2');
      if (k % 2 === 0) p.setAttribute('opacity', String(1 - k * 0.025));
      svg.appendChild(p);
    }
    document.getElementById('art').appendChild(svg);
  })();

  // ---------- price_view: 가격 영역이 실제로 보일 때 ----------
  var box = document.getElementById('price-box');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio >= 0.5) { track('price_view', null, true); io.disconnect(); } });
    }, { threshold: [0.5] });
    io.observe(box);
  } else {
    track('price_view', null, true);
  }

  track('page_view', { referrer: document.referrer ? new URL(document.referrer, location.href).hostname : '' }, true);

  // ---------- 시트(구매 버튼 다음 화면) ----------
  var sheet = document.getElementById('sheet');
  var stepNotice = document.getElementById('step-notice');
  var form = document.getElementById('signup');
  var stepDone = document.getElementById('step-done');
  var lastFocus = null;

  function openSheet(src) {
    lastFocus = document.activeElement;
    track('buy_click', { cta: src });
    stepNotice.hidden = false; form.hidden = true; stepDone.hidden = true;
    sheet.hidden = false;
    document.getElementById('to-form').focus();
  }
  function closeSheet() { sheet.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  document.getElementById('cta-hero').addEventListener('click', function () { openSheet('hero'); });
  document.getElementById('cta-final').addEventListener('click', function () { openSheet('final'); });
  document.getElementById('sheet-close').addEventListener('click', closeSheet);
  document.getElementById('done-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
  document.getElementById('to-form').addEventListener('click', function () {
    stepNotice.hidden = true; form.hidden = false;
    track('form_open', null, true);
    document.getElementById('f-email').focus();
  });

  // ---------- 신청 제출 ----------
  var submitting = false;
  var SUBMITTED = 'terrain_signed:' + CFG.testId;
  function showErr(name, on) {
    var el = form.querySelector('.err[data-for="' + name + '"]'); if (el) el.hidden = !on;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return;
    var email = form.email.value.trim();
    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    var okPrivacy = form.privacy.checked;
    showErr('email', !okEmail); showErr('privacy', !okPrivacy);
    if (!okEmail) { form.email.focus(); return; }
    if (!okPrivacy) { form.privacy.focus(); return; }
    submitting = true;
    try {
      var dup = lsGet(SUBMITTED) === '1';
      var rec = {
        email: email, name: form.name.value.trim(), mountain: form.mountain.value.trim(),
        privacyConsent: true, marketingConsent: form.marketing.checked,
        intent: form.intent.checked, intent_price: form.intent.checked ? price : null,
        duplicate_submit: dup
      };
      track('signup', rec);
      if (inWindow() && flags.indexOf('internal') < 0) {
        postForm(CFG.signupForm, { email: email, name: rec.name, mountain: rec.mountain, variant: visitor.variant, price: price,
          intent: rec.intent ? '구매 의향 있음' : '', channel: ch, vid: visitor.vid, marketing: rec.marketingConsent ? '동의' : '' });
      }
      if (rec.intent) track('intent_check', { intent_price: price, duplicate_submit: dup });
      lsSet(SUBMITTED, '1');
      form.hidden = true; stepDone.hidden = false;
    } finally { submitting = false; }
  });

  // ---------- 관리 패널: ?admin=1 ----------
  if (params.get('admin') === '1') {
    var admin = document.getElementById('admin'); admin.hidden = false;
    function info() {
      var log = readLog();
      document.getElementById('admin-info').textContent =
        '배정 ' + visitor.variant + ' (' + won + '원) · 기록 ' + log.length + '건 · 내부표시 ' + (flags.indexOf('internal') >= 0 ? '켜짐' : '꺼짐');
    }
    info();
    document.getElementById('admin-export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(readLog(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = CFG.testId + '_events_' + Date.now() + '.json'; a.click();
    });
    document.getElementById('admin-reset').addEventListener('click', function () {
      if (confirm('이 브라우저의 시험 기록과 배정을 지웁니다. 계속할까요?')) {
        try { localStorage.removeItem(LS); localStorage.removeItem(VS); localStorage.removeItem(SUBMITTED); } catch (e) {}
        location.href = location.pathname + '?admin=1';
      }
    });
  }

  // 검사용 읽기 전용 상태
  window.__terrainState = function () { return { variant: visitor.variant, price: price, vid: visitor.vid, channel: ch, flags: flags.slice(), events: readLog().length }; };
})();
