const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasHover = window.matchMedia("(hover:hover)").matches;

let revealObserver;
let barObserver;
let counterObserver;
let timelineObserver;

export function initTheme() {
  const root = document.documentElement;
  const button = document.querySelector("#themeBtn");
  const sun = document.querySelector("#icoSun");
  const moon = document.querySelector("#icoMoon");
  const stored = (() => { try { return localStorage.getItem("kj-theme"); } catch { return null; } })();
  const initial = stored || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  function setTheme(theme) {
    root.dataset.theme = theme;
    if (sun) sun.style.display = theme === "dark" ? "block" : "none";
    if (moon) moon.style.display = theme === "dark" ? "none" : "block";
    try { localStorage.setItem("kj-theme", theme); } catch {}
  }
  setTheme(initial);
  button?.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
}

export function initGlobalEffects() {
  initScrollUi();
  initCursor();
  initDrawer();
  initHeroTilt();
  refreshEffects();
}

export function refreshEffects() {
  initRevealTargets();
  initBars();
  initGlowTargets();
  initMagneticTargets();
  initCounters();
  initTimeline();
}

function initScrollUi() {
  const nav = document.querySelector("#nav");
  const progress = document.querySelector("#prog");
  const top = document.querySelector("#totop");
  const links = [...document.querySelectorAll("#navlinks a")];

  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle("stuck", y > 18);
    const height = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${height > 0 ? (y / height) * 100 : 0}%`;
    top?.classList.toggle("show", y > 520);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  top?.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((section) => spy.observe(section));
}

function initCursor() {
  if (!hasHover) return;
  const dot = document.querySelector("#cursorDot");
  const ring = document.querySelector("#cursorRing");
  if (!dot || !ring) return;
  let rx = innerWidth / 2, ry = innerHeight / 2, mx = rx, my = ry;
  const move = (event) => { mx = event.clientX; my = event.clientY; dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`; };
  addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", (event) => {
    if (event.target.closest("a,button,input,textarea,.hot-target,.pj,.tool,.int,.svc")) ring.classList.add("hot");
  });
  document.addEventListener("pointerout", (event) => {
    if (event.target.closest("a,button,input,textarea,.hot-target,.pj,.tool,.int,.svc")) ring.classList.remove("hot");
  });
  addEventListener("pointerdown", () => ring.classList.add("press"));
  addEventListener("pointerup", () => ring.classList.remove("press"));
  function tick() {
    rx += (mx - rx) * .16; ry += (my - ry) * .16;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initDrawer() {
  const drawer = document.querySelector("#drawer");
  const open = document.querySelector("#burger");
  const close = document.querySelector("#dclose");
  if (!drawer) return;
  const setOpen = (value) => {
    drawer.classList.toggle("open", value);
    drawer.setAttribute("aria-hidden", String(!value));
    document.body.style.overflow = value ? "hidden" : "";
    [...drawer.querySelectorAll("a")].forEach((link, i) => link.style.transitionDelay = value ? `${.05 + i * .05}s` : "0s");
  };
  open?.addEventListener("click", () => setOpen(true));
  close?.addEventListener("click", () => setOpen(false));
  drawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setOpen(false); });
}

function initRevealTargets() {
  revealObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .13, rootMargin: "0px 0px -55px 0px" });
  document.querySelectorAll(".rv:not([data-reveal-bound])").forEach((el) => {
    el.dataset.revealBound = "1";
    if (reduceMotion) el.classList.add("in"); else revealObserver.observe(el);
  });
}

function initBars() {
  barObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const fill = entry.target.querySelector(".bar-fill");
      if (fill) fill.style.width = `${entry.target.dataset.val || 0}%`;
      barObserver.unobserve(entry.target);
    });
  }, { threshold: .35 });
  document.querySelectorAll(".bar:not([data-bar-bound])").forEach((bar) => {
    bar.dataset.barBound = "1";
    if (reduceMotion) bar.querySelector(".bar-fill").style.width = `${bar.dataset.val}%`; else barObserver.observe(bar);
  });
}

function initCounters() {
  counterObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      counterObserver.unobserve(el);
      if (reduceMotion) { el.textContent = target; return; }
      let start = 0;
      const step = (time) => {
        if (!start) start = time;
        const p = Math.min((time - start) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .5 });
  document.querySelectorAll("[data-count]:not([data-count-bound])").forEach((el) => { el.dataset.countBound = "1"; counterObserver.observe(el); });
}

function initTimeline() {
  timelineObserver ??= new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("in");
  }), { threshold: .2 });
  const timeline = document.querySelector("#timeline");
  if (timeline && !timeline.dataset.tlBound) { timeline.dataset.tlBound = "1"; timelineObserver.observe(timeline); }
}

function initGlowTargets() {
  document.querySelectorAll(".glowy:not([data-glow-bound])").forEach((el) => {
    el.dataset.glowBound = "1";
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  });
}

function initMagneticTargets() {
  if (reduceMotion || !hasHover) return;
  document.querySelectorAll(".magnet:not([data-magnet-bound])").forEach((el) => {
    el.dataset.magnetBound = "1";
    const strength = el.classList.contains("strong-magnet") ? .26 : .14;
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * strength;
      const y = (event.clientY - rect.top - rect.height / 2) * strength;
      el.style.transform = `translate(${x}px,${y}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

function initHeroTilt() {
  if (reduceMotion || !hasHover) return;
  const art = document.querySelector("#heroArt");
  const card = document.querySelector("#card3d");
  if (!art || !card) return;
  art.addEventListener("pointermove", (event) => {
    const rect = art.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - .5;
    const py = (event.clientY - rect.top) / rect.height - .5;
    card.style.transform = `rotateY(${px * 13}deg) rotateX(${-py * 13}deg) translateZ(6px)`;
  });
  art.addEventListener("pointerleave", () => { card.style.transform = ""; });
}
