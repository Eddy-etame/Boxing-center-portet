import * as THREE from "three";
import { whoosh, soundOn } from "../audio";

/**
 * « Forgés dans le feu » — the team treatment. Each fighter's portrait is
 * sampled into a cloud of glowing ember-points (deep red → white-hot by
 * brightness) under a walk-out spotlight; navigating morphs one person's embers
 * into the next. A boxing-native answer to the Lusion dot-portrait: same idea
 * (a face materialising from a particle field, one subject at a time), our
 * material (sparks, not cold data) — it rhymes the hero's forged wordmark.
 *
 * Reusable: pass a roster + a "heat" so Champions burn hotter than Coachs.
 */
export type TeamMember = { name: string; role: string; kind: string; img: string; desc?: string };
export type TeamHandle = { dispose: () => void };

const N = 3600; // fixed point count so any portrait can morph into any other
type Sampled = { pos: Float32Array; col: Float32Array };

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
}

/** Sample one photo into N ember-points (centred, radial focus on the subject). */
async function samplePortrait(url: string, cool: THREE.Color, hot: THREE.Color): Promise<Sampled> {
  const img = await loadImg(url);
  const W = 200;
  const H = Math.round((img.height / img.width) * W) || 260;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;

  const cand: number[] = []; // x, y, luminance
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const dx = x / W - 0.5, dy = y / H - 0.42;
      const rad = Math.sqrt(dx * dx + dy * dy);
      if (lum > 0.16 && rad < 0.64 - lum * 0.08) cand.push(x, y, lum);
    }
  }
  const count = cand.length / 3;
  const worldW = 6.4, worldH = (H / W) * worldW;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) {
    const c = count > 0 ? Math.floor(Math.random() * count) * 3 : -1;
    const x = c >= 0 ? cand[c] : Math.random() * W;
    const y = c >= 0 ? cand[c + 1] : Math.random() * H;
    const lum = c >= 0 ? cand[c + 2] : 0.5;
    pos[k * 3] = (x / W - 0.5) * worldW + (Math.random() - 0.5) * 0.03;
    pos[k * 3 + 1] = -(y / H - 0.5) * worldH + (Math.random() - 0.5) * 0.03;
    pos[k * 3 + 2] = (Math.random() - 0.5) * 0.5;
    const t = Math.min(1, lum * 1.25);
    col[k * 3] = cool.r + (hot.r - cool.r) * t;
    col[k * 3 + 1] = cool.g + (hot.g - cool.g) * t;
    col[k * 3 + 2] = cool.b + (hot.b - cool.b) * t;
  }
  return { pos, col };
}

export function initTeam(section: HTMLElement, members: TeamMember[], heat = 1): TeamHandle | null {
  const host = section.querySelector<HTMLElement>(".team__canvas");
  if (!host || !members.length) return null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // text fields
  const $ = <T extends HTMLElement>(s: string) => section.querySelector<T>(s);
  const nameEl = $(".team__name"), roleEl = $(".team__role"), kindEl = $(".team__kind"),
    descEl = $(".team__desc"), idxEl = $(".team__idx"), dotsEl = $(".team__dots");

  // build the dot navigator
  if (dotsEl) {
    dotsEl.innerHTML = members.map((_, i) => `<li><button class="team__dot" data-i="${i}" aria-label="Membre ${i + 1}"></button></li>`).join("");
  }

  const cool = new THREE.Color(heat >= 1 ? "#7a1208" : "#5a0d06");
  const hot = new THREE.Color(heat >= 1 ? "#ffd49a" : "#ffb070");

  let cur = 0, target = 0, raf = 0, alive = true, visible = true;
  const cache: (Sampled | null)[] = members.map(() => null);

  // reduced-motion: skip WebGL — a static graded photo with DOM-only nav
  if (reduced) {
    const img = document.createElement("img");
    img.style.cssText = "width:100%;height:100%;object-fit:cover;object-position:50% 18%;filter:grayscale(.35) contrast(1.1)";
    host.appendChild(img);
    let ri = 0;
    const render = (i: number) => { ri = (i + members.length) % members.length; img.src = members[ri].img; img.alt = members[ri].name; fillCard(ri); };
    section.querySelector(".team__next")?.addEventListener("click", () => render(ri + 1));
    section.querySelector(".team__prev")?.addEventListener("click", () => render(ri - 1));
    section.querySelectorAll<HTMLElement>(".team__dot").forEach((d) => d.addEventListener("click", () => render(+(d.dataset.i || 0))));
    render(0);
    return { dispose() { alive = false; } };
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 11;

  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  // start scattered
  for (let i = 0; i < N; i++) {
    const r = 7 + Math.random() * 8, a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(b) * Math.cos(a);
    pos[i * 3 + 1] = r * Math.sin(b) * Math.sin(a);
    pos[i * 3 + 2] = r * Math.cos(b) - 3;
    col[i * 3] = hot.r; col[i * 3 + 1] = hot.g; col[i * 3 + 2] = hot.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // faint graded photo behind the embers → you can still tell who it is
  const ghost = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#b05040"), transparent: true, opacity: 0, depthWrite: false })
  );
  ghost.position.z = -1.5;
  scene.add(ghost);
  const texLoader = new THREE.TextureLoader();
  const texCache: (THREE.Texture | null)[] = members.map(() => null);

  let curTarget: Sampled | null = null;
  let morph = 1; // 0=just switched, 1=settled

  async function show(i: number) {
    if (!alive) return;
    i = (i + members.length) % members.length;
    target = i;
    fillCard(i);
    if (soundOn()) whoosh();
    // ghost photo
    if (!texCache[i]) {
      texCache[i] = texLoader.load(members[i].img, (t) => (t.colorSpace = THREE.SRGBColorSpace));
      const im = new Image(); im.onload = () => { const a = im.width / im.height || 0.8; ghost.scale.set(7 * a, 7, 1); }; im.src = members[i].img;
    }
    (ghost.material as THREE.MeshBasicMaterial).map = texCache[i];
    (ghost.material as THREE.MeshBasicMaterial).needsUpdate = true;
    // sampled targets
    if (!cache[i]) cache[i] = await samplePortrait(members[i].img, cool, hot).catch(() => null);
    if (!alive) return;
    curTarget = cache[i];
    cur = i;
    morph = 0;
  }

  function fillCard(i: number) {
    const m = members[i];
    if (nameEl) nameEl.textContent = m.name;
    if (roleEl) roleEl.textContent = m.role;
    if (kindEl) kindEl.textContent = m.kind;
    if (descEl) descEl.textContent = m.desc || "";
    if (idxEl) idxEl.textContent = `${String(i + 1).padStart(2, "0")} / ${String(members.length).padStart(2, "0")}`;
    section.querySelectorAll(".team__dot").forEach((d, di) => d.classList.toggle("on", di === i));
  }

  let autoTimer = 0;
  const queueAuto = () => {
    clearTimeout(autoTimer);
    autoTimer = window.setTimeout(() => { show(target + 1); queueAuto(); }, 7000);
  };
  function go(i: number) { show(i); queueAuto(); }

  function wireNav() {
    section.querySelector(".team__next")?.addEventListener("click", () => go(target + 1));
    section.querySelector(".team__prev")?.addEventListener("click", () => go(target - 1));
    section.querySelectorAll<HTMLElement>(".team__dot").forEach((d) =>
      d.addEventListener("click", () => go(+(d.dataset.i || 0)))
    );
  }
  wireNav();

  const resize = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);
  const io = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0 });
  io.observe(section);

  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
  const colAttr = geo.getAttribute("color") as THREE.BufferAttribute;
  const tgt = { x: 0, y: 0 };
  window.addEventListener("pointermove", onMove);
  function onMove(e: PointerEvent) { tgt.x = (e.clientX / innerWidth - 0.5) * 2; tgt.y = (e.clientY / innerHeight - 0.5) * 2; }

  const clock = new THREE.Clock();
  function frame() {
    if (!alive) return;
    if (!section.isConnected) { dispose(); return; }
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();

    if (curTarget) {
      const tp = curTarget.pos, tc = curTarget.col;
      const p = posAttr.array as Float32Array, c = colAttr.array as Float32Array;
      morph = Math.min(1, morph + 0.02);
      const e = 1 - Math.pow(1 - morph, 3);
      for (let i = 0; i < N * 3; i++) {
        p[i] += (tp[i] - p[i]) * 0.12;
        c[i] += (tc[i] - c[i]) * 0.08;
      }
      // settle shimmer
      if (morph > 0.98) for (let i = 0; i < N; i++) p[i * 3 + 2] = tp[i * 3 + 2] + Math.sin(t * 1.4 + tp[i * 3] * 2) * 0.05;
      posAttr.needsUpdate = true; colAttr.needsUpdate = true;
      (ghost.material as THREE.MeshBasicMaterial).opacity = 0.16 * e;
    }

    camera.position.x += (tgt.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-tgt.y * 0.35 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    points.rotation.y = Math.sin(t * 0.15) * 0.06;
    renderer.render(scene, camera);
  }

  function dispose() {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    clearTimeout(autoTimer);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    io.disconnect();
    geo.dispose(); mat.dispose();
    (ghost.geometry as THREE.BufferGeometry).dispose();
    (ghost.material as THREE.Material).dispose();
    texCache.forEach((t) => t?.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  }

  show(0);
  queueAuto();
  frame();
  return { dispose };
}

/** Lazily build a team showcase only while near the viewport. */
export function mountTeam(section: HTMLElement, members: TeamMember[], heat: number) {
  let active: TeamHandle | null = null;
  const io = new IntersectionObserver(
    (es) => {
      const near = es[0].isIntersecting;
      if (near && !active) active = initTeam(section, members, heat);
      else if (!near && active) { active.dispose(); active = null; }
    },
    { rootMargin: "120% 0px 120% 0px" }
  );
  io.observe(section);
}
