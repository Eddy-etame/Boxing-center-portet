/**
 * Immersion layer: custom cursor, magnetic buttons, page-transition curtain,
 * and interaction sound. All degrade safely (touch / reduced-motion / no-JS).
 */
import { tick, thud, bell, soundOn } from "./audio";

const fine = window.matchMedia("(pointer: fine)").matches;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initFx() {
  initCurtain();
  if (fine && !reduced) {
    initCursor();
    initMagnetic();
    initGalleryWarp();
  }
  initSound();
}

/** Photos drift toward the cursor (parallax distortion) like the award sites. */
function initGalleryWarp() {
  document.querySelectorAll<HTMLElement>(".shot").forEach((shot) => {
    const img = shot.querySelector<HTMLElement>("img");
    if (!img) return;
    shot.addEventListener("pointermove", (e) => {
      const r = shot.getBoundingClientRect();
      const mx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const my = (e.clientY - (r.top + r.height / 2)) / r.height;
      img.style.transform = `scale(1.08) translate(${mx * -16}px, ${my * -16}px)`;
    });
    shot.addEventListener("pointerleave", () => (img.style.transform = ""));
  });
}

/* ---------- page-transition curtain ----------
   Reveal is pure CSS (runs on load, never traps the page).
   Exit is JS-enhanced on internal link clicks. */
function initCurtain() {
  const curtain = document.getElementById("curtain");
  if (!curtain || reduced) return;
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const target = a.getAttribute("target");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.button !== 0
      )
        return;
      e.preventDefault();
      if (soundOn()) thud();
      curtain.classList.add("curtain--in");
      window.setTimeout(() => (window.location.href = href), 560);
      // hard fallback so navigation can never be swallowed
      window.setTimeout(() => (window.location.href = href), 1200);
    },
    true
  );
}

/* ---------- custom cursor ---------- */
function initCursor() {
  const dot = document.createElement("div");
  dot.className = "cursor";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);

  let x = innerWidth / 2,
    y = innerHeight / 2,
    cx = x,
    cy = y;
  window.addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.style.opacity = "1";
  });
  const loop = () => {
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;
    dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  const interactive = "a, button, .disc, .tarif, .shot, .clip, input, .coach";
  document.addEventListener("pointerover", (e) => {
    if ((e.target as HTMLElement).closest(interactive)) dot.classList.add("cursor--grow");
  });
  document.addEventListener("pointerout", (e) => {
    if ((e.target as HTMLElement).closest(interactive)) dot.classList.remove("cursor--grow");
  });
}

/* ---------- magnetic buttons ---------- */
function initMagnetic() {
  document.querySelectorAll<HTMLElement>(".btn, .icon-btn").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

/* ---------- interaction sound ---------- */
function initSound() {
  // tactile tick on every interactive card + the primary CTA
  document.querySelectorAll(".disc, .tarif, .aud, .coach, .shot, .value, .btn--primary").forEach((el) =>
    el.addEventListener("pointerenter", () => tick())
  );
  // the bell rings ONCE, as the closing call-to-action arrives — the round's end
  const finalCta = document.querySelector(".cta-block, .page-head");
  if (finalCta) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (soundOn()) bell();
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    // only the home closing CTA, not every page-head
    const target = document.querySelector(".cta-block");
    if (target) io.observe(target);
  }
}
