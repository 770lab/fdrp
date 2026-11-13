/* FDRP — démo 770LAB. Le scroll compile les papiers en bilan (séquence 241 images, 5 plans clés à p = 0 / .25 / .5 / .75 / 1). */
(function () {
  'use strict';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ---------- nav ---------- */
  var nav = $('#nav'), hero = $('#top');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function updateNav() {
    var y = window.scrollY + window.innerHeight * .4, cur = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
    nav.classList.toggle('is-solid', window.scrollY > hero.offsetHeight - window.innerHeight);
  }

  /* ---------- séquence ---------- */
  var stage = $('#stage'), canvas = $('#seq'), ctx = canvas.getContext('2d'), poster = $('.poster');
  var frames = [], loaded = [], count = 0, pad = 3, ext = 'jpg', ver = '', dir = 'img/seq/';
  var cur = 0, target = 0, drawn = -1, dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
  function resize() { W = stage.clientWidth; H = stage.clientHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; drawn = -1; draw(); }
  function cover(img) {
    var iw = img.naturalWidth, ih = img.naturalHeight; if (!iw) return;
    var s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
    var fx = W / H < 1.2 ? focus(drawing) : .5; // en portrait, on suit l'action plan par plan
    var x = clamp(W / 2 - dw * fx, W - dw, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.drawImage(img, x, (H - dh) / 2, dw, dh);
  }
  // point de mire horizontal (fraction de la largeur de l'image) aux 5 plans clés : papiers, pile, livre, bilan, étagère
  var FOCUS = [.63, .68, .67, .68, .57], drawing = 0;
  function focus(i) { if (count < 2) return FOCUS[0]; var t = i / (count - 1) * (FOCUS.length - 1), k = Math.min(FOCUS.length - 2, Math.floor(t)), f = t - k; return FOCUS[k] + (FOCUS[k + 1] - FOCUS[k]) * f; }
  function nearestLoaded(i) { if (loaded[i]) return i; for (var d = 1; d < count; d++) { if (loaded[i - d]) return i - d; if (loaded[i + d]) return i + d; } return -1; }
  function draw() { if (!count) return; var i = nearestLoaded(Math.round(cur)); if (i < 0 || i === drawn) return; drawing = i; cover(frames[i]); drawn = i; stage.classList.add('has-seq'); }
  function src(i) { var s = String(i + 1); while (s.length < pad) s = '0' + s; return dir + s + '.' + ext + (ver ? '?v=' + ver : ''); }
  function load(i, cb) {
    if (frames[i]) { if (cb) cb(); return; }
    var im = new Image(); frames[i] = im;
    im.onload = function () { loaded[i] = true; if (cb) cb(); if (Math.abs(i - cur) < 3) { drawn = -1; draw(); } };
    im.onerror = function () { frames[i] = null; if (cb) cb(); };
    im.src = src(i);
  }
  function loadAll() {
    // d'abord les 5 plans clés (jamais d'écran vide), puis tout le reste dans l'ordre
    var order = [0, 60, 120, 180, 240].filter(function (k) { return k < count; });
    for (var k = 0; k < count; k++) if (order.indexOf(k) < 0) order.push(k);
    var idx = 0, inflight = 0;
    function next() { while (inflight < 6 && idx < order.length) { (function (i) { inflight++; load(i, function () { inflight--; next(); }); })(order[idx++]); } }
    next();
  }

  /* ---------- chorégraphie : 5 temps, compteurs qui tournent ---------- */
  var phs = document.querySelectorAll('.ph'), bars = document.querySelectorAll('.progress i');
  var phase = 0;
  function spin(el) {
    var to = parseInt(el.dataset.to, 10), suf = el.dataset.suf || '';
    if (REDUCED || !to) { el.textContent = to + suf; return; }
    var t0 = performance.now(), dur = 1300;
    (function tick(now) {
      var k = Math.min(1, (now - t0) / dur);
      if (k < 1) {
        var spread = Math.max(3, Math.round(to * (1 - k) * .9));
        el.textContent = Math.max(0, to + Math.round((Math.random() - .5) * 2 * spread)) + suf;
        requestAnimationFrame(tick);
      } else el.textContent = to + suf;
    })(t0);
  }
  function setPhase(n) {
    if (n === phase) return; phase = n;
    for (var i = 0; i < phs.length; i++) { var on = i === n; phs[i].classList.toggle('on', on); phs[i].setAttribute('aria-hidden', on ? 'false' : 'true'); }
    for (var j = 0; j < bars.length; j++) bars[j].classList.toggle('on', j <= n);
    var st = phs[n] && phs[n].querySelector('.stat b[data-to]'); if (st) spin(st);
  }
  function choreo(p) {
    hero.classList.toggle('is-moving', p > .02);
    setPhase(p < .125 ? 0 : p < .375 ? 1 : p < .625 ? 2 : p < .875 ? 3 : 4);
  }

  var rafId = 0;
  function progress() { var top = hero.offsetTop, h = hero.offsetHeight - stage.offsetHeight; return h > 0 ? clamp((window.scrollY - top) / h, 0, 1) : 0; }
  function tick() {
    rafId = 0; var p = progress(); target = p * (count - 1);
    cur += (target - cur) * (REDUCED ? 1 : .2); if (Math.abs(target - cur) < .05) cur = target;
    draw(); choreo(p);
    if (Math.abs(target - cur) > .01) rafId = requestAnimationFrame(tick);
  }
  function onScroll() { if (!rafId) rafId = requestAnimationFrame(tick); updateNav(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { resize(); onScroll(); });

  resize(); updateNav();
  if (REDUCED) { poster.src = 'img/keys/k5.jpg'; setPhase(4); }
  else fetch(dir + 'manifest.json?v=' + Date.now().toString(36).slice(0, -4)).then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
    if (!m || !m.count) { choreo(progress()); return; }
    count = m.count; pad = m.pad || 3; ext = m.ext || 'jpg'; ver = m.v || ''; frames = new Array(count); loaded = new Array(count);
    loadAll(); onScroll();
  }).catch(function () { choreo(progress()); });

  /* ---------- apparition des sections ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { io.observe(el); });
  } else Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { el.classList.add('is-in'); });
})();
