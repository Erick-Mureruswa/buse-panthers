/* ============================================================================
   BUSE PANTHERS — interaction engine
   Lenis · GSAP · ScrollTrigger · canvas · custom cursor · scroll choreography
   Engineered by ZimDevs (zimdevs.co.zw)
   ========================================================================== */
(function () {
  "use strict";

  window.__err = [];
  window.addEventListener("error", function (e) { window.__err.push(e.message); });

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COARSE  = window.matchMedia("(pointer: coarse)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST   = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  var hasLenis = typeof window.Lenis !== "undefined";
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var qs  = function (s, c) { return (c || document).querySelector(s); };
  var qsa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------------- */
  /*  SPLIT TEXT — wrap glyphs in <span class="char"> (preserves elements)  */
  /* ---------------------------------------------------------------------- */
  function splitChars(el) {
    var chars = [];
    (function walk(node) {
      qsa_nodes(node).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split("").forEach(function (ch) {
            if (ch === " ") { frag.appendChild(document.createTextNode(" ")); return; }
            var s = document.createElement("span");
            s.className = "char"; s.textContent = ch;
            frag.appendChild(s); chars.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          walk(n);
        }
      });
    })(el);
    return chars;
  }
  function qsa_nodes(node) { return Array.prototype.slice.call(node.childNodes); }

  /* ---------------------------------------------------------------------- */
  /*  SMOOTH SCROLL (Lenis) + ScrollTrigger sync                            */
  /* ---------------------------------------------------------------------- */
  var lenis = null;
  function initSmooth() {
    if (REDUCED || !hasLenis) return;
    lenis = new Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__lenis = lenis;
    if (hasST) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  }

  function initAnchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = qs(id);
        if (!target) return;
        e.preventDefault();
        closeMenu();
        if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.2 });
        else target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  PRELOADER                                                             */
  /* ---------------------------------------------------------------------- */
  function runPreloader(done) {
    var pre = qs("#preloader"), bar = qs(".pre__bar", pre), count = qs(".pre__count", pre);
    var draw = qs(".draw", pre), eyes = qsa(".pre-eye", pre);
    if (REDUCED || !hasGSAP) { pre.style.display = "none"; done(); return; }
    document.documentElement.classList.add("lenis-stopped");
    var finished = false;
    function finish(animate) {
      if (finished) return; finished = true;
      var rv = document.getElementById("reveal"); if (rv) rv.style.display = "none";
      gsap.set(pre, { display: "none" });
      document.documentElement.classList.remove("lenis-stopped");
      done(animate);
    }
    /* safety net: never leave a visitor stuck behind the preloader/reveal */
    setTimeout(function () { finish(true); }, 7000);

    var counter = { v: 0 };
    var tl = gsap.timeline({ onComplete: startReveal });
    gsap.set(draw, { strokeDashoffset: 1 });
    tl.to(draw, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 0);
    tl.to(counter, { v: 100, duration: 1.4, ease: "power1.inOut",
      onUpdate: function () { var p = Math.round(counter.v); count.textContent = p + "%"; bar.style.width = p + "%"; } }, 0);
    tl.to(eyes, { opacity: 1, duration: 0.25, stagger: 0.08, ease: "power2.out" }, 1.0);
    tl.to(qs(".pre__mark", pre), { scale: 1.06, duration: 0.4, ease: "power2.out" }, 1.2);

    /* ── REVEAL: ice-shatter matte tears the loading screen open onto the live hero ── */
    function startReveal() {
      var rv = document.getElementById("reveal");
      var vid = rv && rv.querySelector("video");
      var canVideo = !REDUCED && rv && vid && vid.canPlayType && vid.canPlayType("video/mp4") !== "";
      if (!canVideo) {                                  /* fallback: classic curtain */
        gsap.to(pre, { yPercent: -100, duration: 0.9, ease: "power4.inOut",
          onComplete: function () { finish(true); } });
        return;
      }
      gsap.set(qsa(".hero__title .word"), { yPercent: 0 });  /* hero ready behind the shatter */
      rv.style.display = "block";
      gsap.set(pre, { display: "none" });                    /* video's first frame is black — no flash */
      try { vid.playbackRate = 2.4; vid.currentTime = 0; } catch (e) {}
      var ended = false;
      function endReveal() {
        if (ended) return; ended = true;
        rv.classList.add("is-hiding");
        setTimeout(function () { if (rv) rv.style.display = "none"; }, 450);
        finish(false);
      }
      vid.addEventListener("timeupdate", function () { if (vid.currentTime >= 5.0) endReveal(); });
      vid.addEventListener("ended", endReveal);
      setTimeout(endReveal, 4500);                           /* hard cap in real time */
      var pr = vid.play();
      if (pr && pr.catch) pr.catch(function () { endReveal(); });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  CUSTOM CURSOR (+ contextual labels)                                   */
  /* ---------------------------------------------------------------------- */
  function initCursor() {
    if (COARSE || REDUCED || !hasGSAP) return;
    var ring = qs("#cursor"), dot = qs("#cursor-dot"), label = qs(".cursor__label", ring);
    var rx = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
    var ry = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });
    var dx = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    var dy = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
    ring.classList.add("is-hidden"); dot.classList.add("is-hidden");
    var shown = false;
    window.addEventListener("pointermove", function (e) {
      if (!shown) { ring.classList.remove("is-hidden"); dot.classList.remove("is-hidden"); shown = true; }
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
    });
    qsa("[data-hover]").forEach(function (el) {
      el.addEventListener("pointerenter", function () { if (!el.closest("[data-cursor]")) ring.classList.add("is-hover"); });
      el.addEventListener("pointerleave", function () { ring.classList.remove("is-hover"); });
    });
    /* contextual label via bubbling pointerover/out */
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest ? e.target.closest("[data-cursor]") : null;
      if (t) { label.textContent = t.getAttribute("data-cursor"); ring.classList.add("is-label"); }
    });
    document.addEventListener("pointerout", function (e) {
      var from = e.target.closest ? e.target.closest("[data-cursor]") : null;
      var to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest("[data-cursor]") : null;
      if (from && from !== to) ring.classList.remove("is-label");
    });
    document.addEventListener("pointerleave", function () { ring.classList.add("is-hidden"); dot.classList.add("is-hidden"); });
    document.addEventListener("pointerenter", function () { ring.classList.remove("is-hidden"); dot.classList.remove("is-hidden"); });
  }

  /* ---------------------------------------------------------------------- */
  /*  NAV (stuck, mobile menu, scroll progress, scrollspy)                  */
  /* ---------------------------------------------------------------------- */
  var nav = qs("#nav"), toggle = qs("#nav-toggle");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }
  function initNav() {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
    var progress = qs("#scroll-progress");
    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle("is-stuck", y > 40);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
    if (lenis) lenis.on("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  function initScrollSpy() {
    if (!hasST) return;
    ["identity", "roster", "numbers", "season", "sponsor", "zimdevs"].forEach(function (id) {
      var sec = document.getElementById(id), link = qs('.nav__links a[href="#' + id + '"]');
      if (!sec || !link) return;
      ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%",
        onToggle: function (self) { link.classList.toggle("is-active", self.isActive); } });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  HEADING REVEALS — per-letter rise-in on scroll                        */
  /* ---------------------------------------------------------------------- */
  function initHeadingReveals() {
    var sels = [".roster__title", ".numbers__head h2", ".season__head h2",
                ".gallery__head h2", ".join__copy h2", ".zd__headline"];
    sels.forEach(function (s) {
      var el = qs(s); if (!el) return;
      var chars = splitChars(el);
      if (REDUCED || !hasST || !chars.length) return;
      gsap.set(chars, { yPercent: 120, opacity: 0 });
      gsap.to(chars, { yPercent: 0, opacity: 1, duration: 0.8, ease: "power4.out", stagger: 0.028,
        scrollTrigger: { trigger: el, start: "top 85%" } });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  HERO — intro, scroll parallax, mouse parallax, reactive canvas        */
  /* ---------------------------------------------------------------------- */
  function initHeroIntro(animate) {
    if (REDUCED || !hasGSAP) return;
    var words = qsa(".hero__title .word");
    if (animate) {                         /* curtain path: words slide up */
      gsap.set(words, { yPercent: 115 });
      var tl = gsap.timeline({ delay: 0.1 });
      tl.to(words, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: "power4.out" });
      tl.from(".hero__top, .hero__base, .hero__ticker", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, "-=0.7");
    } else {                               /* video-reveal path: hero already shown through the shatter */
      gsap.set(words, { yPercent: 0 });
    }
    if (hasST) {
      gsap.to(".hero__title", { yPercent: 18, opacity: 0.25, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero__grid", { yPercent: 12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }
  }
  function initHeroParallax() {
    if (REDUCED || COARSE || !hasGSAP) return;
    var hero = qs(".hero"); if (!hero) return;
    var tx = gsap.quickTo(".hero__title", "x", { duration: 0.9, ease: "power3" });
    var gx = gsap.quickTo(".hero__grid", "x", { duration: 1.3, ease: "power3" });
    var gy = gsap.quickTo(".hero__grid", "y", { duration: 1.3, ease: "power3" });
    hero.addEventListener("pointermove", function (e) {
      var cx = e.clientX / window.innerWidth - 0.5, cy = e.clientY / window.innerHeight - 0.5;
      tx(cx * 34); gx(cx * -28); gy(cy * -18);
    });
    hero.addEventListener("pointerleave", function () { tx(0); gx(0); gy(0); });
  }
  function initHeroShutter() {
    if (REDUCED || !hasST) return;
    var slats = qsa(".hero__shutter span"); if (!slats.length) return;
    var mark = qs(".hero__shutter-mark");
    gsap.set(slats, { scaleX: 0 });
    if (mark) gsap.set(mark, { opacity: 0, scale: 0.84 });
    /* close (cover) then open (reveal next section) across the hero's scroll —
       the panther emblem appears while the shutter is closed */
    var tl = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 } });
    /* phases (timeline 0–1): close 0→0.37 · logo hold 0.46→0.62 · open 0.62→1
       durations account for the per-slat stagger so the shutter fully seals before opening */
    tl.to(slats, { scaleX: 1, ease: "power2.in", stagger: { each: 0.018, from: "start" }, duration: 0.24 }, 0);
    if (mark) {
      tl.to(mark, { opacity: 1, scale: 1, ease: "power2.out", duration: 0.16 }, 0.3);
      tl.to(mark, { opacity: 0, scale: 1.1, ease: "power2.in", duration: 0.16 }, 0.6);
    }
    tl.to(slats, { scaleX: 0, ease: "power2.out", stagger: { each: 0.018, from: "end" }, duration: 0.24 }, 0.62);
  }
  function initHeroCanvas() {
    var canvas = qs("#hero-canvas"); if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, nodes = [], vis = true;
    var COUNT = REDUCED ? 0 : (window.innerWidth < 700 ? 26 : 54);
    var mouse = { x: -999, y: -999 };
    function resize() {
      var r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      nodes = [];
      for (var i = 0; i < COUNT; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
    }
    function frame() {
      requestAnimationFrame(frame);
      if (!vis || COUNT === 0) return;
      ctx.clearRect(0, 0, W, H);
      var i, n;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i]; n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        var mdx = mouse.x - n.x, mdy = mouse.y - n.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 150) { n.x -= (mdx / md) * 0.5; n.y -= (mdy / md) * 0.5; }
      }
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            var al = (1 - d2 / 16000) * 0.5;
            ctx.strokeStyle = "rgba(34,211,238," + al + ")"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var mx = mouse.x - nodes[k].x, my = mouse.y - nodes[k].y, mm = Math.sqrt(mx * mx + my * my);
        if (mm < 150) {
          ctx.strokeStyle = "rgba(103,232,249," + (1 - mm / 150) * 0.6 + ")"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(nodes[k].x, nodes[k].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(103,232,249,0.7)";
        ctx.beginPath(); ctx.arc(nodes[k].x, nodes[k].y, 1.4, 0, 6.283); ctx.fill();
      }
    }
    resize(); seed();
    window.addEventListener("resize", function () { resize(); seed(); });
    canvas.addEventListener("pointermove", function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    canvas.addEventListener("pointerleave", function () { mouse.x = -999; mouse.y = -999; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(canvas);
    if (COUNT > 0) requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------------- */
  /*  MAGNETIC BUTTONS                                                      */
  /* ---------------------------------------------------------------------- */
  function initMagnetic() {
    if (REDUCED || COARSE || !hasGSAP) return;
    qsa(".btn").forEach(function (el) {
      var qx = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
      var qy = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.35);
        qy((e.clientY - (r.top + r.height / 2)) * 0.5);
      });
      el.addEventListener("pointerleave", function () { qx(0); qy(0); });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  3D TILT — player cards                                                */
  /* ---------------------------------------------------------------------- */
  function initTilt() {
    if (REDUCED || COARSE || !hasGSAP) return;
    qsa(".player-card").forEach(function (card) {
      var rxq = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
      var ryq = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
      card.addEventListener("pointerenter", function () { card.classList.add("is-tilt"); });
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        ryq(px * 16); rxq(-py * 16);
      });
      card.addEventListener("pointerleave", function () { card.classList.remove("is-tilt"); rxq(0); ryq(0); });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  DUAL-IMAGE SWAP CARDS — tap to swap on touch (hover handles desktop)  */
  /* ---------------------------------------------------------------------- */
  function initSwapCards() {
    qsa("[data-swap]").forEach(function (card) {
      card.addEventListener("click", function () { if (COARSE) card.classList.toggle("is-swapped"); });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  GENERIC REVEALS                                                       */
  /* ---------------------------------------------------------------------- */
  function initReveals() {
    var els = qsa("[data-reveal]");
    if (REDUCED || !("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------- */
  /*  MANIFESTO — split words, light up on scroll                           */
  /* ---------------------------------------------------------------------- */
  function initManifesto() {
    var el = qs("[data-split]"); if (!el) return;
    var text = el.textContent.trim().replace(/\s+/g, " ");
    var accentEl = el.querySelector(".accent");
    var accentWords = accentEl ? accentEl.textContent.trim().split(" ") : [];
    el.textContent = "";
    text.split(" ").forEach(function (w) {
      var s = document.createElement("span");
      s.className = "word is-dim";
      if (accentWords.indexOf(w) !== -1) s.classList.add("accent");
      s.textContent = w; el.appendChild(s); el.appendChild(document.createTextNode(" "));
    });
    var words = el.querySelectorAll(".word");
    if (REDUCED || !hasST) { words.forEach(function (w) { w.classList.remove("is-dim"); }); return; }
    ScrollTrigger.create({ trigger: el, start: "top 80%", end: "bottom 55%", scrub: true,
      onUpdate: function (self) {
        var nn = Math.floor(self.progress * words.length);
        words.forEach(function (w, idx) { w.classList.toggle("is-dim", idx > nn); });
      } });
  }

  /* ---------------------------------------------------------------------- */
  /*  COUNT-UP STATS                                                        */
  /* ---------------------------------------------------------------------- */
  function initCounters() {
    var stats = qsa(".stat__num");
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "";
      el.parentElement.classList.add("is-in");
      function render(v) {
        el.innerHTML = (pre ? '<span class="prefix">' + pre + "</span>" : "") + Math.round(v) +
          (suf ? '<span class="suffix">' + suf + "</span>" : "");
      }
      if (REDUCED || !hasGSAP) { render(target); return; }
      var obj = { v: 0 };
      gsap.to(obj, { v: target, duration: 1.4, ease: "power2.out", onUpdate: function () { render(obj.v); } });
    }
    if (!("IntersectionObserver" in window)) { stats.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------- */
  /*  ROSTER — desktop: pinned horizontal scroll · mobile: drag             */
  /* ---------------------------------------------------------------------- */
  var dragBound = false;
  function bindDrag() {
    if (dragBound) return; dragBound = true;
    var track = qs(".roster__track-wrap"); if (!track) return;
    var down = false, startX = 0, startScroll = 0, moved = 0;
    track.addEventListener("pointerdown", function (e) {
      down = true; moved = 0; startX = e.clientX; startScroll = track.scrollLeft;
      track.setPointerCapture(e.pointerId); track.style.cursor = "grabbing";
    });
    track.addEventListener("pointermove", function (e) {
      if (!down) return; var dx = e.clientX - startX; moved = Math.abs(dx); track.scrollLeft = startScroll - dx;
    });
    function up() { down = false; track.style.cursor = ""; }
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    track.addEventListener("click", function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  function initRoster() {
    var section = qs(".roster"), track = qs(".roster__track");
    if (!track) return;
    if (!hasST || REDUCED) { bindDrag(); return; }
    var mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 900px)" }, function (ctx) {
      if (ctx.conditions.desk) {
        section.classList.add("is-pinned");
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        gsap.to(track, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: function () { return "+=" + dist(); },
            pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
        return function () { section.classList.remove("is-pinned"); gsap.set(track, { x: 0 }); };
      }
    });
    mm.add({ mob: "(max-width: 899px)" }, function (ctx) { if (ctx.conditions.mob) bindDrag(); });
  }

  /* ---------------------------------------------------------------------- */
  /*  GALLERY — clip reveal + scroll parallax                               */
  /* ---------------------------------------------------------------------- */
  function initGallery() {
    if (REDUCED || !hasST) return;
    qsa(".gallery__tile").forEach(function (t, i) {
      gsap.fromTo(t, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "power4.out",
        scrollTrigger: { trigger: t, start: "top 88%" } });
      gsap.fromTo(t, { yPercent: i % 2 ? 8 : 13 }, { yPercent: i % 2 ? -8 : -13, ease: "none",
        scrollTrigger: { trigger: ".gallery", start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  MARQUEE — velocity-reactive infinite scroll                           */
  /* ---------------------------------------------------------------------- */
  function initMarquee() {
    if (REDUCED || !hasGSAP) return;
    qsa("[data-marquee]").forEach(function (m) {
      var track = qs(".marquee__track", m), first = track.children[0];
      var w = first.getBoundingClientRect().width, x = 0, base = 0.6;
      var setX = gsap.quickSetter(track, "x", "px"), setSkew = gsap.quickSetter(track, "skewX", "deg");
      gsap.ticker.add(function () {
        var vel = lenis ? lenis.velocity : 0;
        x -= base + Math.abs(vel) * 0.55;
        if (x <= -w) x += w;
        setX(x);
        setSkew(gsap.utils.clamp(-10, 10, vel * -0.35));
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  COUNTDOWN                                                             */
  /* ---------------------------------------------------------------------- */
  function initCountdown() {
    var root = qs("#countdown"); if (!root) return;
    function nextTarget() {
      var now = new Date(), t = new Date(now), day = t.getDay(), add = (6 - day + 7) % 7;
      if (add === 0 && now.getHours() >= 16) add = 7;
      t.setDate(t.getDate() + add); t.setHours(16, 0, 0, 0); return t;
    }
    var target = nextTarget();
    var map = { d: qs('[data-cd="d"]', root), h: qs('[data-cd="h"]', root), m: qs('[data-cd="m"]', root), s: qs('[data-cd="s"]', root) };
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function tick() {
      var diff = Math.max(0, target - new Date()), sec = Math.floor(diff / 1000);
      map.d.textContent = pad(Math.floor(sec / 86400));
      map.h.textContent = pad(Math.floor((sec % 86400) / 3600));
      map.m.textContent = pad(Math.floor((sec % 3600) / 60));
      map.s.textContent = pad(sec % 60);
      if (diff === 0) target = nextTarget();
    }
    tick(); setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------------- */
  /*  BOOT                                                                  */
  /* ---------------------------------------------------------------------- */
  function boot() {
    initSmooth();
    initAnchors();
    initNav();
    initCursor();
    initHeadingReveals();
    initHeroCanvas();
    initHeroParallax();
    initHeroShutter();
    initSwapCards();
    initReveals();
    initManifesto();
    initCounters();
    initRoster();
    initTilt();
    initMagnetic();
    initGallery();
    initMarquee();
    initCountdown();
    initScrollSpy();
    runPreloader(function (animate) { initHeroIntro(animate !== false); if (hasST) ScrollTrigger.refresh(); });
    if (document.fonts && hasST) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener("load", function () { if (hasST) ScrollTrigger.refresh(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
