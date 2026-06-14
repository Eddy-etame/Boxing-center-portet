import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { whoosh, soundOn } from "./audio";

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initScroll() {
  let lenis: Lenis | null = null;

  if (!reduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis");
  }

  initNav(lenis);
  initLineReveals();
  initHeroIntro();
  initReveals();
  initMarquee();
  initMediaReveal();
  initScrubVideo(lenis);
  initParallax(lenis);
  initRounds();
  initReel(lenis);
  ScrollTrigger.refresh();
  // Web fonts (Anton) shift layout after load — recompute trigger positions.
  if ((document as any).fonts?.ready) {
    (document as any).fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => ScrollTrigger.refresh());
  return lenis;
}

/** All line-by-line headline reveals via a CSS class (no animation-lib
 *  dependency — gsap's yPercent tween proved unreliable on these nodes). */
function initLineReveals() {
  const lines = document.querySelectorAll<HTMLElement>(".reveal-line");
  if (!lines.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -4% 0px" }
  );
  lines.forEach((l) => io.observe(l));
}

/** Hero supporting text fade-in (line reveals handled by initLineReveals). */
function initHeroIntro() {
  if (reduced) return;
  gsap.fromTo(
    ".hero [data-reveal]",
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.55 }
  );
}

function initNav(lenis: Lenis | null) {
  const nav = document.getElementById("nav");
  if (!nav) return;
  let last = 0;
  const onScroll = (y: number) => {
    nav.classList.toggle("scrolled", y > 40);
    nav.classList.toggle("hidden", y > last && y > 400);
    last = y;
  };
  if (lenis) lenis.on("scroll", (e: any) => onScroll(e.scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
}

function initReveals() {
  if (reduced) return;

  // generic fade-up, with optional stagger via [data-reveal-group]
  gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
    gsap.to(group.querySelectorAll("[data-reveal]"), {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.08,
      scrollTrigger: { trigger: group, start: "top 82%" },
    });
  });
  gsap.utils
    .toArray<HTMLElement>("[data-reveal]:not([data-reveal-group] [data-reveal])")
    .filter((el) => !el.closest(".hero"))
    .forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

  // count-up stats
  gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count || "0");
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: () => (el.firstChild!.textContent = Math.round(obj.v).toString()),
    });
  });
}

/** The fight journey: round-cards reveal + whoosh, and a scorecard HUD that
 *  tracks which round you're in as you descend. */
function initRounds() {
  const cards = document.querySelectorAll<HTMLElement>(".round-card");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          if (soundOn()) whoosh();
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.45 }
  );
  cards.forEach((c) => io.observe(c));

  const hud = document.getElementById("hud");
  if (!hud) return;
  const num = hud.querySelector<HTMLElement>(".hud__round");
  const name = hud.querySelector<HTMLElement>(".hud__name");
  const ticks = hud.querySelectorAll<HTMLElement>(".hud__ticks i");
  const sections = document.querySelectorAll<HTMLElement>("[data-round]");
  const io2 = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const r = parseInt((e.target as HTMLElement).dataset.round || "0", 10);
        const shown = Math.min(6, Math.max(0, r));
        if (num) num.textContent = String(shown).padStart(2, "0");
        if (name) name.textContent = (e.target as HTMLElement).dataset.roundName || "";
        ticks.forEach((t, i) => t.classList.toggle("on", i < shown));
        hud.classList.toggle("hud--hidden", r === 0);
      });
    },
    { threshold: 0.5 }
  );
  sections.forEach((s) => io2.observe(s));
}

/** Continuous scroll parallax — elements drift at different depths so the
 *  page reads like a moving camera, not a stack of static blocks. */
function initParallax(lenis: Lenis | null) {
  if (reduced) return;
  const items: { el: HTMLElement; amt: number }[] = [];
  const add = (sel: string, amt: number) =>
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => items.push({ el, amt }));
  add(".sec-head .display", 26);
  add(".feature-card", 46);
  add(".cta-block", 30);
  add(".showcase__frame", 70);
  if (!items.length) return;

  let ticking = false;
  const apply = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const { el, amt } of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const prog = (r.top + r.height / 2 - vh / 2) / vh; // ~ -1..1
      el.style.transform = `translate3d(0, ${(-prog * amt).toFixed(1)}px, 0)`;
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(apply);
    }
  };
  if (lenis) lenis.on("scroll", onScroll);
  else window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  apply();
}

/** Photos load grayscale and bleed into colour as they enter the viewport. */
function initMediaReveal() {
  const items = document.querySelectorAll<HTMLElement>(".shot, .feature-img");
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/** Pinned horizontal disciplines reel — vertical scroll drives the track
 *  sideways (the award-site "horizontal section" inside a sticky pin). */
function initReel(lenis: Lenis | null) {
  const reel = document.querySelector<HTMLElement>(".reel");
  const track = document.getElementById("reel-track");
  if (!reel || !track) return;
  const update = () => {
    const total = reel.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const p = Math.min(1, Math.max(0, -reel.getBoundingClientRect().top / total));
    const max = track.scrollWidth - window.innerWidth + 2 * 24;
    track.style.transform = `translate3d(${(-p * Math.max(0, max)).toFixed(1)}px, 0, 0)`;
  };
  if (lenis) lenis.on("scroll", update);
  else window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  // recompute once images affect scrollWidth
  window.addEventListener("load", update);
  setTimeout(update, 600);
  update();
}

/** Scroll-scrubbed footage (Zentry's ScrollyVideo technique): the clip's
 *  playhead is driven by scroll progress through a sticky section — cinematic
 *  slow-motion. Touch/reduced-motion fall back to an autoplay loop. */
function initScrubVideo(lenis: Lenis | null) {
  const sec = document.querySelector<HTMLElement>(".scrub");
  const v = sec?.querySelector<HTMLVideoElement>("video");
  if (!sec || !v) return;

  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (reduced || touch) {
    v.loop = true;
    v.muted = true;
    v.autoplay = true;
    v.play().catch(() => {});
    return;
  }

  v.pause();
  let dur = 0;
  const setDur = () => (dur = v.duration || 0);
  v.addEventListener("loadedmetadata", setDur);
  setDur();

  const update = () => {
    const total = sec.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / total));
    sec.style.setProperty("--p", p.toFixed(3));
    if (dur) {
      try {
        v.currentTime = p * (dur - 0.05);
      } catch {}
    }
  };
  if (lenis) lenis.on("scroll", update);
  else window.addEventListener("scroll", update, { passive: true });
  update();
}

function initMarquee() {
  gsap.utils.toArray<HTMLElement>(".marquee__track").forEach((track) => {
    const dir = track.dataset.dir === "rev" ? 1 : -1;
    gsap.to(track, { xPercent: 50 * dir, duration: 24, ease: "none", repeat: -1, yoyo: false });
  });
}
