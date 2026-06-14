import * as THREE from "three";
import { themeColors } from "../theme";
import { bell, soundOn } from "../audio";

/**
 * In portal — a slow, one-way dive INTO the next part of the club. The camera
 * flies forward down a corridor of ring-ropes + embers toward a real gym scene
 * (a graded Portet photo) that fills the frame as you arrive — it reads as
 * stepping deeper into the complex, never empty, and never reverses out.
 * Theme-reactive, paused offscreen, self-disposes on soft-nav.
 */
export function initPortal(section: HTMLElement) {
  const host = section.querySelector<HTMLElement>(".portal__canvas");
  const lineEl = section.querySelector<HTMLElement>(".portal__line");
  if (!host) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  let cols = themeColors();
  const C = (h: string) => new THREE.Color(h);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C("#08090c"), 0.04);
  const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 90);

  // destination: a real gym scene we fly into
  const DEST_Z = -26;
  const dest = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 21),
    new THREE.MeshBasicMaterial({ color: C("#3a0c0c"), transparent: true, opacity: 0 })
  );
  dest.position.z = DEST_Z;
  scene.add(dest);
  const imgSrc = section.dataset.img;
  if (imgSrc) {
    new THREE.TextureLoader().load(imgSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      (dest.material as THREE.MeshBasicMaterial).map = tex;
      (dest.material as THREE.MeshBasicMaterial).color = C("#9a5a52"); // warm/red grade multiply
      (dest.material as THREE.MeshBasicMaterial).needsUpdate = true;
    });
  }

  // corridor of ring-ropes (the boxing tunnel)
  const group = new THREE.Group();
  scene.add(group);
  const ropeMat = new THREE.MeshStandardMaterial({
    color: C(cols.accent), emissive: C(cols.accent), emissiveIntensity: 0.75, metalness: 0.5, roughness: 0.35,
  });
  const SEGMENTS = 9;
  for (let i = 0; i < SEGMENTS; i++) {
    const z = 4 - i * 3; // 4 → -20, a corridor leading to the gym
    // a square of 4 ropes per segment (the ring frame)
    const frame = new THREE.Group();
    const r = 3.4;
    const bar = (w: number, h: number, x: number, y: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), ropeMat);
      m.position.set(x, y, z);
      frame.add(m);
    };
    bar(r * 2, 0.06, 0, r);
    bar(r * 2, 0.06, 0, -r);
    bar(0.06, r * 2, -r, 0);
    bar(0.06, r * 2, r, 0);
    group.add(frame);
  }

  // embers / dust
  const E = 420;
  const ep = new Float32Array(E * 3);
  for (let i = 0; i < E; i++) {
    ep[i * 3] = (Math.random() - 0.5) * 16;
    ep[i * 3 + 1] = (Math.random() - 0.5) * 16;
    ep[i * 3 + 2] = (Math.random() - 0.5) * 50 - 8;
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.BufferAttribute(ep, 3));
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({ color: C(cols.energy), size: 0.05, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(embers);

  const key = new THREE.PointLight(C(cols.energy), 26, 60);
  key.position.set(0, 0, 4);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.22));

  window.addEventListener("themechange", () => {
    cols = themeColors();
    ropeMat.color.set(cols.accent);
    ropeMat.emissive.set(cols.accent);
    (embers.material as THREE.PointsMaterial).color.set(cols.energy);
    key.color.set(cols.energy);
  });

  const resize = () => {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let visible = true;
  new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0 }).observe(section);
  const fade = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  let belled = false;

  function frame() {
    if (!section.isConnected) { renderer.dispose(); return; }
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const total = section.offsetHeight - window.innerHeight;
    let p = total > 0 ? -section.getBoundingClientRect().top / total : 0;
    p = Math.min(1, Math.max(0, p));
    if (reduced) p = 0.5;

    // ONE-WAY dive: camera travels forward the whole time, arriving at the gym
    camera.position.z = 8 - p * 30; // 8 → -22, ends just in front of the gym scene
    camera.lookAt(0, 0, DEST_Z);
    group.rotation.z = p * 0.5;
    (dest.material as THREE.MeshBasicMaterial).opacity = fade(p, 0.2, 0.85); // the gym resolves as you arrive

    if (lineEl) lineEl.style.opacity = (fade(p, 0.28, 0.42) * (1 - fade(p, 0.82, 0.96))).toFixed(2);
    if (!belled && p > 0.34 && p < 0.42) {
      belled = true;
      if (soundOn()) bell();
    }

    renderer.render(scene, camera);
  }
  frame();
}

export function initPortals() {
  document.querySelectorAll<HTMLElement>(".portal").forEach((s) => initPortal(s));
}
