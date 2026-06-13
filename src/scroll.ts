import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
    { threshold: 0.25 }
  );
  items.forEach((el) => io.observe(el));
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
