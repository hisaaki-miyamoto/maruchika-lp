/* ===================================================================
   株式会社 P.FORWARD  オフィシャルサイト  -  main.js
=================================================================== */
(function () {
  "use strict";

  /* ヘッダー：スクロールで白背景に切替 */
  var header = document.getElementById("header");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 60);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* モバイル：ハンバーガーメニューの開閉 */
  var navToggle = document.getElementById("navToggle");
  var primaryNav = document.getElementById("primaryNav");
  if (navToggle && primaryNav) {
    var setOpen = function (open) {
      header.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
      document.body.style.overflow = open ? "hidden" : "";
    };
    navToggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("nav-open"));
    });
    /* リンクをタップしたら閉じる */
    primaryNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    /* メニュー外（暗幕）をタップしたら閉じる */
    primaryNav.addEventListener("click", function (e) {
      if (e.target === primaryNav) setOpen(false);
    });
    /* Escキーで閉じる */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ヒーロー：背景スライドのフェード自動切替（6秒ごと・フェード2.4秒） */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
  if (slides.length > 1) {
    var idx = 0;
    setInterval(function () {
      slides[idx].classList.remove("active");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add("active");
    }, 6000);
  }

  /* ヒーロー：海の泡（ごく控えめにゆっくり上る） */
  (function bubbles() {
    var canvas = document.querySelector(".hero__bubbles");
    var hero = document.querySelector(".hero");
    if (!canvas || !hero) return;
    // 動きが苦手な方向けには表示しない
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], running = true, last = performance.now();
    var pointer = { x: 0, y: 0, active: false };
    var RANGE = 200;   // 反発が効く距離(px)

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function resize() {
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make(initial) {
      return {
        bx: rnd(0, W), y: initial ? rnd(0, H) : H + rnd(0, 40),
        r: rnd(3, 10), sp: rnd(8, 24), sway: rnd(8, 20),
        phase: rnd(0, Math.PI * 2), op: rnd(0.10, 0.22),
        ox: 0, oy: 0   // ポインタ反発のオフセット
      };
    }
    function init() {
      parts = [];
      var n = Math.max(6, Math.min(12, Math.round(W / 120)));
      for (var i = 0; i < n; i++) parts.push(make(true));
    }
    function frame(now) {
      if (!running) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.sp * dt; p.phase += dt;
        if (p.y < -12) { parts[i] = make(false); continue; }
        var x = p.bx + Math.sin(p.phase) * p.sway;
        // ポインタが近いと離れる→離れると徐々に戻る
        if (pointer.active) {
          var dx = (x + p.ox) - pointer.x, dy = (p.y + p.oy) - pointer.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < RANGE && d > 0.01) {
            var f = (1 - d / RANGE) * 4;
            p.ox += (dx / d) * f; p.oy += (dy / d) * f;
          }
        }
        p.ox *= 0.88; p.oy *= 0.88;
        var rx = x + p.ox, ry = p.y + p.oy;
        // ガラス球のようなツヤ：中心は透明、縁が光る（フレネル）＋ハイライト
        var body = ctx.createRadialGradient(rx, ry, p.r * 0.1, rx, ry, p.r);
        body.addColorStop(0, "rgba(255,255,255,0)");
        body.addColorStop(0.72, "rgba(255,255,255," + (p.op * 0.12) + ")");
        body.addColorStop(0.93, "rgba(255,255,255," + p.op + ")");   // 光る縁
        body.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = body;
        ctx.beginPath(); ctx.arc(rx, ry, p.r, 0, Math.PI * 2); ctx.fill();
        // 左上のハイライト（球体への反射点）
        var hx = rx - p.r * 0.34, hy = ry - p.r * 0.34, hr = p.r * 0.5;
        var hl = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        hl.addColorStop(0, "rgba(255,255,255," + Math.min(0.85, p.op * 3.5) + ")");
        hl.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hl;
        ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    function setPointer(e) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left; pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }
    resize(); init();
    window.addEventListener("resize", function () { resize(); init(); }, { passive: true });
    hero.addEventListener("mousemove", setPointer, { passive: true });
    hero.addEventListener("mouseleave", function () { pointer.active = false; }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { last = performance.now(); requestAnimationFrame(frame); }
    });
    requestAnimationFrame(frame);
  })();

  /* ページトップボタン */
  var pagetop = document.getElementById("pagetop");
  if (pagetop) {
    window.addEventListener("scroll", function () {
      pagetop.classList.toggle("show", window.scrollY > 300);
    }, { passive: true });
    pagetop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* スクロールで要素をふわっと表示 */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }
})();
