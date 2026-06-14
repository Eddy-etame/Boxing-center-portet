import { enableSound, resumeSound, prefMuted } from "./audio";

/**
 * "ENTRER DANS L'ARÈNE" gate. On first visit it captures the gesture browsers
 * require for audio, so sound is ON by default once you step in. On later pages
 * (same session) the gate is skipped and sound resumes on the first interaction
 * unless the user has muted.
 */
const KEY = "bcp-entered";

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
  gate.innerHTML = `
    <div class="gate__inner">
      <img class="gate__logo" src="/logo.png" alt="Boxing Center" width="150" height="71" />
      <p class="gate__kicker">Portet-sur-Garonne</p>
      <button class="gate__enter" type="button">
        <span>Entrer dans l'arène</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="gate__hint">Expérience sonore · <button class="gate__silent" type="button">entrer en silence</button></p>
    </div>`;
  document.body.appendChild(gate);
  document.documentElement.classList.add("gated");

  const enter = (withSound: boolean) => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    if (withSound) enableSound();
    document.documentElement.classList.remove("gated");
    gate.classList.add("gate--out");
    window.setTimeout(() => gate.remove(), 1000);
  };

  gate.querySelector<HTMLButtonElement>(".gate__enter")!.addEventListener("click", () => enter(true));
  gate.querySelector<HTMLButtonElement>(".gate__silent")!.addEventListener("click", () => enter(false));
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
