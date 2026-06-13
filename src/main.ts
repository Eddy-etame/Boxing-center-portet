import "./styles/main.css";
import { mountLayout } from "./layout";
import { initThemeSwitch } from "./theme";
import { initScroll } from "./scroll";
import { initFx } from "./fx";
import { renderPage } from "./pages";
import { DISCIPLINES, TARIFS, GALLERY, CLIPS } from "./data";

function renderHomeGrids() {
  const disc = document.getElementById("disc-grid");
  if (disc) {
    disc.innerHTML = DISCIPLINES.slice(0, 8)
      .map(
        (d) => `
      <article class="disc" data-reveal>
        <div class="disc__top"><span class="disc__key">${d.key}</span><span class="disc__tag">${d.tag}</span></div>
        <div>
          <h3 class="disc__name">${d.name}</h3>
          <p class="disc__desc">${d.desc}</p>
        </div>
      </article>`
      )
      .join("");
  }

  const tarifs = document.getElementById("tarifs-grid");
  if (tarifs) {
    tarifs.innerHTML = TARIFS.map(
      (t) => `
      <div class="tarif ${t.feature ? "tarif--feature" : ""}" data-reveal>
        ${t.feature ? '<span class="tarif__badge">Le plus choisi</span>' : ""}
        <span class="tarif__name">${t.name}</span>
        <span class="tarif__price">${t.price}<small> ${t.unit}</small></span>
        <p class="tarif__note">${t.note}</p>
      </div>`
    ).join("");
  }

  renderMedia();
}

function renderMedia() {
  const gal = document.getElementById("gallery");
  if (gal) {
    gal.innerHTML = GALLERY.map((g) => {
      const cls = g.span === "wide" ? "shot--wide" : g.span === "tall" ? "shot--tall" : "";
      return `<figure class="shot ${cls}"><img src="${g.src}" alt="${g.label}" loading="lazy" />
        <figcaption class="shot__label">${g.label}</figcaption></figure>`;
    }).join("");
  }
  const clips = document.getElementById("clips");
  if (clips) {
    clips.innerHTML = CLIPS.map(
      (c) => `<div class="clip"><video src="${c.src}" autoplay muted loop playsinline preload="metadata"></video>
        <span class="clip__label">${c.label}</span></div>`
    ).join("");
  }
}

function boot() {
  mountLayout();
  initThemeSwitch();

  const page = document.body.dataset.page;
  if (page === "home") renderHomeGrids();
  else renderPage(page);

  initScroll();
  initFx();

  if (page === "home") {
    const host = document.getElementById("hero-canvas");
    if (host && "WebGLRenderingContext" in window) {
      import("./three/hero")
        .then((m) => m.initHero(host))
        .catch(() => host.classList.add("hero__canvas--fallback"));
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
