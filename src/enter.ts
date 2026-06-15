import { enableSound, resumeSound, prefMuted } from "./audio";

/**
 * « ENTRER DANS L'ARÈNE » gate — doubles as a preloader. On first visit it
 * shows a loading bar while critical assets warm up; the enter button only
 * becomes clickable once ready. The click also captures the gesture browsers
 * require for audio (sound ON by default after entry). On later pages in the
 * same session the gate is skipped and sound resumes on first interaction.
 */
const KEY = "bcp-entered";

// above-the-fold / first-interaction assets to warm before entry
const PRELOAD = [
  "/logo.png",
  "/img/gym-01.jpg",
  "/img/gym-12.jpg",
  "/img/gym-21.jpg",
  "/img/disc/boxe-anglaise.webp",
  "/img/disc/muay-thai.webp",
];

export function initEnterGate() {
  let entered = false;
  try {
    entered = sessionStorage.getItem(KEY) === "1";
  } catch {}

  if (entered) {
    if (!prefMuted()) armGestureResume();
    return;
  }

  const gate = document.createElement("div");
  gate.className = "gate";
  gate.setAttribute("aria-busy", "true");
  gate.innerHTML = `
    <div class="gate__glow" aria-hidden="true"></div>
    <div class="gate__embers" aria-hidden="true"></div>
    <div class="gate__inner">
      <div class="gate__logo-wrap"><img class="gate__logo" src="/logo.png" alt="Boxing Center" width="150" height="71" /></div>
      <p class="gate__kicker">Portet-sur-Garonne</p>
      <div class="gate__loader" aria-hidden="true"><div class="gate__bar"><i></i></div><span class="gate__pct">0%</span></div>
      <p class="gate__phase">Mise en place du ring…</p>
      <button class="gate__enter" type="button" disabled>
        <span class="gate__label">Chargement…</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="gate__hint">Expérience sonore · <button class="gate__silent" type="button" disabled>entrer en silence</button></p>
    </div>`;
  document.body.appendChild(gate);
  document.documentElement.classList.add("gated");
  // drifting ember dots (cheap, CSS-animated)
  const emb = gate.querySelector<HTMLElement>(".gate__embers")!;
  for (let i = 0; i < 18; i++) {
    const d = document.createElement("i");
    d.style.cssText = `left:${Math.random() * 100}%;animation-delay:${(-Math.random() * 6).toFixed(2)}s;animation-duration:${(4 + Math.random() * 5).toFixed(2)}s;transform:scale(${(0.5 + Math.random()).toFixed(2)})`;
    emb.appendChild(d);
  }

  const bar = gate.querySelector<HTMLElement>(".gate__bar i")!;
  const pctEl = gate.querySelector<HTMLElement>(".gate__pct")!;
  const enterBtn = gate.querySelector<HTMLButtonElement>(".gate__enter")!;
  const silentBtn = gate.querySelector<HTMLButtonElement>(".gate__silent")!;
  const label = gate.querySelector<HTMLElement>(".gate__label")!;

  // ---- preload progress ----
  const total = PRELOAD.length + 1; // +1 for web fonts
  let done = 0, isReady = false;
  const bump = () => {
    done = Math.min(total, done + 1);
    const pct = Math.round((done / total) * 100);
    bar.style.width = pct + "%";
    pctEl.textContent = pct + "%";
    if (done >= total) ready();
  };
  const ready = () => {
    if (isReady) return;
    isReady = true;
    bar.style.width = "100%";
    pctEl.textContent = "100%";
    gate.classList.add("gate--ready");
    label.textContent = "Entrer dans l'arène";
    enterBtn.disabled = false;
    silentBtn.disabled = false;
  };

  PRELOAD.forEach((src) => {
    const im = new Image();
    im.onload = im.onerror = bump;
    im.src = src;
  });
  (document.fonts?.ready || Promise.resolve()).then(bump).catch(bump);
  window.setTimeout(ready, 7000); // never hang on a slow asset

  const enter = (withSound: boolean) => {
    if (!isReady) return;
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    if (withSound) enableSound();
    document.documentElement.classList.remove("gated");
    gate.classList.add("gate--out");
    window.setTimeout(() => gate.remove(), 1000);
  };

  enterBtn.addEventListener("click", () => enter(true));
  silentBtn.addEventListener("click", (e) => { e.stopPropagation(); enter(false); });
}

function armGestureResume() {
  const fn = () => {
    resumeSound();
    window.removeEventListener("pointerdown", fn);
    window.removeEventListener("keydown", fn);
  };
  window.addEventListener("pointerdown", fn, { once: true });
  window.addEventListener("keydown", fn, { once: true });
}
