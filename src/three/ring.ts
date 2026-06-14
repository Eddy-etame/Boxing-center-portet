import * as THREE from "three";
import { themeColors } from "../theme";

/**
 * 3D ring fly-through. As you scroll the section, the camera descends from
 * cage-side, dives through the ropes and lands at canvas centre under the
 * spotlight — "Monte sur le ring." Stylised geometry (posts + ropes + canvas),
 * spotlit, embers, bloom. Theme-reactive, paused offscreen, static when reduced.
 */
export async function initRing(section: HTMLElement, host: HTMLElement) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  let cols = themeColors();
  const C = (h: string) => new THREE.Color(h);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C("#08090c"), 0.05);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  const ring = new THREE.Group();
  scene.add(ring);
  const S = 3; // ring half-size
  const POST_H = 1.9;
  const ropeHeights = [0.65, 1.15, 1.65];
  const corners = [
    new THREE.Vector3(-S, 0, -S),
    new THREE.Vector3(S, 0, -S),
    new THREE.Vector3(S, 0, S),
    new THREE.Vector3(-S, 0, S),
  ];

  // canvas floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(S * 2.2, S * 2.2),
    new THREE.MeshStandardMaterial({ color: C("#0b1733"), roughness: 0.85, metalness: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  ring.add(floor);

  // corner posts
  const postMat = new THREE.MeshStandardMaterial({ color: C("#f3efe7"), roughness: 0.4, metalness: 0.3, emissive: C(cols.accent), emissiveIntensity: 0.25 });
  corners.forEach((c) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, POST_H, 16), postMat);
    post.position.set(c.x, POST_H / 2, c.z);
    ring.add(post);
  });

  // ropes
  const ropeMat = new THREE.MeshStandardMaterial({ color: C(cols.accent), roughness: 0.5, emissive: C(cols.accent), emissiveIntensity: 0.5 });
  const up = new THREE.Vector3(0, 1, 0);
  const ropeBetween = (a: THREE.Vector3, b: THREE.Vector3, y: number) => {
    const va = a.clone().setY(y);
    const vb = b.clone().setY(y);
    const len = va.distanceTo(vb);
    const geo = new THREE.CylinderGeometry(0.03, 0.03, len, 8);
    const m = new THREE.Mesh(geo, ropeMat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up, vb.clone().sub(va).normalize());
    ring.add(m);
  };
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    ropeHeights.forEach((y) => ropeBetween(a, b, y));
  }

  // embers
  const E = 500;
  const ep = new Float32Array(E * 3);
  for (let i = 0; i < E; i++) {
    ep[i * 3] = (Math.random() - 0.5) * 10;
    ep[i * 3 + 1] = Math.random() * 6;
    ep[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.BufferAttribute(ep, 3));
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({ color: C(cols.energy), size: 0.04, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(embers);

  // lights — the spotlight over the ring
  const key = new THREE.SpotLight(C(cols.accent), 120, 30, 0.6, 0.5, 1.0);
  key.position.set(0, 9, 0);
  key.target.position.set(0, 0, 0);
  const rim = new THREE.PointLight(C(cols.energy), 30, 26);
  rim.position.set(-6, 3, -4);
  const fill = new THREE.PointLight(C(cols.accent2), 14, 26);
  fill.position.set(6, 2, 6);
  scene.add(key, key.target, rim, fill, new THREE.AmbientLight(0xffffff, 0.1));

  // bloom
  let composer: any = null;
  try {
    const { EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js");
    const { RenderPass } = await import("three/addons/postprocessing/RenderPass.js");
    const { UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js");
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.7, 0.2));
  } catch {
    composer = null;
  }

  const resize = () => {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("themechange", () => {
    cols = themeColors();
    ropeMat.color.set(cols.accent);
    ropeMat.emissive.set(cols.accent);
    postMat.emissive.set(cols.accent);
    key.color.set(cols.accent);
    rim.color.set(cols.energy);
    fill.color.set(cols.accent2);
    (embers.material as THREE.PointsMaterial).color.set(cols.energy);
  });

  // camera keyframes: cage-side -> through the ropes -> inside centre -> rise back out
  const A = { p: new THREE.Vector3(7, 5.5, 9), t: new THREE.Vector3(0, 1, 0) };
  const B = { p: new THREE.Vector3(2.4, 2.1, 4.2), t: new THREE.Vector3(0, 1.2, 0) };
  const Cc = { p: new THREE.Vector3(0, 1.15, 0.4), t: new THREE.Vector3(0, 1.5, -S) };
  const D = { p: new THREE.Vector3(0, 9, 0.2), t: new THREE.Vector3(0, 0, 0) }; // pull straight out, look down
  const ss = (t: number) => t * t * (3 - 2 * t);
  const lerpV = (a: THREE.Vector3, b: THREE.Vector3, t: number, o: THREE.Vector3) => o.copy(a).lerp(b, t);
  const camP = new THREE.Vector3();
  const camT = new THREE.Vector3();

  const blocks = Array.from(section.querySelectorAll<HTMLElement>(".ring__txt"));
  const fade = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  // opacity windows across scroll progress: enter, then 3 selling beats inside
  const windows: ((p: number) => number)[] = [
    (p) => 1 - fade(p, 0.16, 0.28),
    (p) => fade(p, 0.3, 0.37) * (1 - fade(p, 0.45, 0.5)),
    (p) => fade(p, 0.5, 0.55) * (1 - fade(p, 0.62, 0.66)),
    (p) => fade(p, 0.66, 0.72) * (1 - fade(p, 0.93, 0.99)),
  ];

  let visible = true;
  new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0 }).observe(section);

  const epArr = eg.getAttribute("position").array as Float32Array;
  const clock = new THREE.Clock();
  function frame() {
    if (!section.isConnected) { renderer.dispose(); return; } // stop after a soft-nav swap
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const total = section.offsetHeight - window.innerHeight;
    let p = total > 0 ? -section.getBoundingClientRect().top / total : 0;
    p = Math.min(1, Math.max(0, p));
    if (reduced) p = 0;

    if (p < 0.28) {
      // enter: cage-side -> through the ropes -> centre
      const k = ss(p / 0.28);
      if (k < 0.5) {
        lerpV(A.p, B.p, k * 2, camP);
        lerpV(A.t, B.t, k * 2, camT);
      } else {
        lerpV(B.p, Cc.p, (k - 0.5) * 2, camP);
        lerpV(B.t, Cc.t, (k - 0.5) * 2, camT);
      }
    } else if (p < 0.72) {
      // INSIDE the ring — a held beat that slowly looks around the arena
      const k = (p - 0.28) / 0.44;
      const ang = -Math.PI * 0.25 + k * Math.PI * 1.0;
      camP.set(Math.sin(ang) * 0.5, 1.15 + Math.sin(k * Math.PI) * 0.18, Math.cos(ang) * 0.5);
      camT.set(Math.sin(ang + Math.PI) * S, 1.45, Math.cos(ang + Math.PI) * S);
    } else {
      // exit: rise straight back out, look down — return to the scroll
      const k = ss((p - 0.72) / 0.28);
      lerpV(Cc.p, D.p, k, camP);
      lerpV(Cc.t, D.t, k, camT);
    }
    camera.position.copy(camP);
    camera.lookAt(camT);

    blocks.forEach((b, i) => {
      b.style.opacity = (windows[i] ? windows[i](p) : 0).toFixed(2);
    });

    if (!reduced) {
      ring.rotation.y = p * 0.5;
      const t = clock.getElapsedTime();
      for (let i = 0; i < E; i++) {
        epArr[i * 3 + 1] += 0.006;
        if (epArr[i * 3 + 1] > 6) epArr[i * 3 + 1] = 0;
      }
      eg.getAttribute("position").needsUpdate = true;
      embers.rotation.y = t * 0.02;
    }
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  frame();
}
