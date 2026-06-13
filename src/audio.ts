/**
 * Asset-free sound design via the Web Audio API.
 * - A boxing-bell "ding" on the round-bell motif (theme switch, primary CTA).
 * - A soft UI tick on hover/interaction.
 * Respects autoplay policy: the context is created/resumed on first gesture,
 * and everything stays silent until the user enables sound.
 */
let ctx: AudioContext | null = null;
let enabled = false;

function ensure() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setSound(on: boolean) {
  enabled = on;
  if (on) ensure();
}
export function soundOn() { return enabled; }

/** Metallic boxing bell — two detuned partials with a long shimmer tail. */
export function bell() {
  if (!enabled) return;
  const ac = ensure();
  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.0001;
  master.connect(ac.destination);
  [660, 990, 1320].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
    g.gain.value = 0.5 / (i + 1);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 1.6);
  });
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.008);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
}

/** Deep glove-impact thud for primary actions. */
export function thud() {
  if (!enabled) return;
  const ac = ensure();
  const now = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(180, now);
  o.frequency.exponentialRampToValueAtTime(46, now + 0.18);
  g.gain.setValueAtTime(0.28, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  o.connect(g).connect(ac.destination);
  o.start(now);
  o.stop(now + 0.34);
}

/** Tiny percussive tick for hovers / small UI events. */
export function tick() {
  if (!enabled) return;
  const ac = ensure();
  const now = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(420, now);
  o.frequency.exponentialRampToValueAtTime(180, now + 0.06);
  g.gain.setValueAtTime(0.06, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  o.connect(g).connect(ac.destination);
  o.start(now);
  o.stop(now + 0.09);
}
