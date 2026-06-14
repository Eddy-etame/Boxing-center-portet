import { DISCIPLINES, TARIFS, PLANNING, COACHS, SITE, type Member } from "./data";

const el = (id: string) => document.getElementById(id);

/** Treated "sci-fi" portrait card (duotone + scanlines via CSS; reveals to
 *  colour on hover). Shared by the home team strip and the /coachs/ page. */
export function coachCard(m: Member) {
  return `
    <article class="coach" data-reveal>
      <div class="coach__media">
        <img src="${m.img}" alt="${m.name} — ${m.kind}, Boxing Center Portet" loading="lazy" decoding="async" />
        <span class="coach__fallback" aria-hidden="true">${m.initials}</span>
        <span class="coach__kind">${m.kind}</span>
      </div>
      <div class="coach__meta">
        <h3 class="coach__name">${m.name}</h3>
        <p class="coach__role">${m.role}</p>
      </div>
    </article>`;
}

export function renderPage(page: string | undefined) {
  if (page === "activites") {
    const g = el("act-grid");
    if (g)
      g.innerHTML = DISCIPLINES.map(
        (d) => `
        <article class="disc" data-reveal>
          <div class="disc__top"><span class="disc__key">${d.key}</span><span class="disc__tag">${d.tag}</span></div>
          <div><h3 class="disc__name">${d.name}</h3><p class="disc__desc">${d.desc}</p></div>
        </article>`
      ).join("");
  }

  if (page === "tarifs") {
    const g = el("tarifs-grid");
    if (g)
      g.innerHTML = TARIFS.map(
        (t) => `
        <div class="tarif ${t.feature ? "tarif--feature" : ""}" data-reveal>
          ${t.feature ? '<span class="tarif__badge">Le plus choisi</span>' : ""}
          <span class="tarif__name">${t.name}</span>
          <span class="tarif__price">${t.price}<small> ${t.unit}</small></span>
          <p class="tarif__note">${t.note}</p>
        </div>`
      ).join("");
  }

  if (page === "plannings") {
    const g = el("planning-grid");
    if (g)
      g.innerHTML = PLANNING.map(
        (col) => `
        <div class="plan-col" data-reveal>
          <h3 class="plan-col__day">${col.day}</h3>
          ${col.items
            .map(
              ([time, name]) =>
                `<div class="plan-slot"><span class="plan-slot__t">${time}</span><span class="plan-slot__n">${name}</span></div>`
            )
            .join("")}
        </div>`
      ).join("");
  }

  if (page === "coachs") {
    const g = el("coach-grid");
    if (g) g.innerHTML = COACHS.map(coachCard).join("");
  }

  if (page === "salles") {
    const g = el("specs");
    if (g)
      g.innerHTML = SITE.surfaces
        .map((s) => `<div class="spec"><span class="spec__l">${s.label}</span><span class="spec__v">${s.value}</span></div>`)
        .join("");
  }
}
