import { NAV, SITE, THEMES } from "./data";
import { bell, tick, whoosh, setSound, soundOn } from "./audio";

const svgArrow = `<svg class="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function navMarkup(path: string) {
  const links = NAV.map((n) => {
    const current = n.href === path ? ' aria-current="page"' : "";
    return `<a href="${n.href}"${current}>${n.label}</a>`;
  }).join("");

  const themes = THEMES.map(
    (t) => `<button data-th="${t.id}" title="Thème ${t.label} — ${t.hint}" aria-label="Thème ${t.label}"><span></span></button>`
  ).join("");

  return `
  <nav class="nav" id="nav" translate="no">
    <div class="nav__inner">
      <a class="brand" href="/" aria-label="Boxing Center Portet — accueil">
        <span class="dot"></span>
        <img class="brand__logo" src="/logo.png" alt="Boxing Center" width="150" height="71" />
        <span class="brand__loc">Portet</span>
      </a>
      <div class="nav__links">${links}</div>
      <div class="nav__right">
        <div class="theme-switch" role="group" aria-label="Choisir le thème">${themes}</div>
        <button class="icon-btn sound-toggle" id="sound" aria-label="Activer le son" title="Son">
          <span class="bars"><i></i><i></i><i></i></span>
        </button>
        <a class="btn btn--primary" href="/contact/">Essai 10€ ${svgArrow}</a>
        <button class="icon-btn nav__burger" id="burger" aria-label="Menu" aria-expanded="false">
          <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 6h14M3 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  </nav>
  <div class="menu" id="menu" translate="no">
    ${NAV.map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}
    <a class="btn btn--primary" style="margin-top:1.6rem;align-self:flex-start" href="/contact/">Séance d'essai · 10€ ${svgArrow}</a>
  </div>`;
}

function footerMarkup() {
  const a = SITE.address;
  return `
  <footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <div class="footer__big">Prêt à<br>monter sur<br>le ring ?</div>
          <a class="btn btn--primary" href="/contact/">Réserver ma séance d'essai ${svgArrow}</a>
        </div>
        <div>
          <h4>Le club</h4>
          ${NAV.slice(1).map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}
        </div>
        <div>
          <h4>Contact</h4>
          <a href="https://maps.google.com/?q=${encodeURIComponent(a.street + " " + a.zip + " " + a.city)}" target="_blank" rel="noopener">${a.street}<br>${a.zip} ${a.city}</a>
          <a href="tel:${SITE.phoneHref}">${SITE.phone}</a>
          <a href="mailto:${SITE.email}">${SITE.email}</a>
          <p class="muted" style="margin-top:.6rem">${SITE.hours}</p>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© ${new Date().getFullYear()} ${SITE.name} · Groupe ${SITE.group} depuis ${SITE.since}</span>
        <span class="fed">${SITE.federations.map((f) => `<span>${f}</span>`).join("")}</span>
      </div>
    </div>
  </footer>`;
}

export function mountLayout() {
  const path = location.pathname.replace(/index\.html$/, "") || "/";
  const nav = document.getElementById("site-nav");
  const foot = document.getElementById("site-footer");
  if (nav) nav.outerHTML = navMarkup(path);
  if (foot) foot.outerHTML = footerMarkup();

  if (!document.getElementById("curtain")) {
    const c = document.createElement("div");
    c.className = "curtain";
    c.id = "curtain";
    c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
  }
  if (!document.querySelector(".grain")) {
    const g = document.createElement("div");
    g.className = "grain";
    g.setAttribute("aria-hidden", "true");
    document.body.appendChild(g);
  }
  // fight scorecard HUD (home only — it tracks rounds)
  if (document.body.dataset.page === "home" && !document.getElementById("hud")) {
    const hud = document.createElement("aside");
    hud.id = "hud";
    hud.className = "hud hud--hidden";
    hud.setAttribute("aria-hidden", "true");
    hud.innerHTML =
      '<span class="hud__round">00</span><span class="hud__slash">/06</span>' +
      '<span class="hud__name"></span>' +
      '<div class="hud__ticks">' +
      Array.from({ length: 6 }, () => "<i></i>").join("") +
      "</div>";
    document.body.appendChild(hud);
  }

  // mobile menu
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  burger?.addEventListener("click", () => {
    const open = menu?.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(!!open));
    whoosh();
  });
  menu?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => menu.classList.remove("open"))
  );

  // sound toggle (mute / unmute — sound is ON by default after the enter gate)
  const sound = document.getElementById("sound");
  const syncSound = (on: boolean) => {
    sound?.classList.toggle("on", on);
    sound?.setAttribute("aria-label", on ? "Couper le son" : "Activer le son");
  };
  sound?.addEventListener("click", () => {
    const on = !soundOn();
    setSound(on);
    if (on) bell();
  });
  window.addEventListener("bcp-sound", (e) => syncSound(!!(e as CustomEvent).detail));
  syncSound(soundOn());

  // UI sounds
  window.addEventListener("ui-tick", () => bell());
  document.querySelectorAll(".btn--primary, .nav__links a").forEach((el) =>
    el.addEventListener("mouseenter", () => tick())
  );
}
