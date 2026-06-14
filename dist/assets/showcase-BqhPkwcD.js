import{W as f,T as x,L as p,S as y,O as b,V as n,M as T,e as M,f as U,d as H}from"./three.module-CxvZx800.js";const R=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,S=`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uTime, uHover;
  uniform vec2 uMouse, uRes, uImg;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  vec2 cover(vec2 uv){
    float ca = uRes.x / uRes.y, ia = uImg.x / uImg.y;
    vec2 st = uv;
    // keep the subjects centred on a wide crop (legible, not cropped to limbs)
    if (ca > ia) st.y = (uv.y - 0.5) * (ia / ca) + 0.5;
    else         st.x = (uv.x - 0.5) * (ca / ia) + 0.5;
    return st;
  }
  void main(){
    float dist = distance(vUv, uMouse);
    float ripple = sin(dist * 22.0 - uTime * 2.5) * exp(-dist * 5.0) * uHover;
    float flow = (noise(vUv * 3.0 + uTime * 0.12) - 0.5) * 0.012;
    vec2 dir = normalize(vUv - uMouse + 0.0001);
    vec2 disp = dir * ripple * 0.05 + vec2(flow);
    float ca = (abs(ripple) * 0.02 + 0.0035) * (0.4 + uHover);

    vec3 col = vec3(
      texture2D(uTex, cover(vUv + disp + dir * ca)).r,
      texture2D(uTex, cover(vUv + disp)).g,
      texture2D(uTex, cover(vUv + disp - dir * ca)).b
    );

    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 shadow = vec3(0.08, 0.10, 0.16);    // lifted shadow (keeps detail readable)
    vec3 mid = vec3(0.80, 0.18, 0.14);       // combat red midtone
    vec3 hi = vec3(0.98, 0.88, 0.80);        // warm highlight
    vec3 duo = mix(shadow, mid, smoothstep(0.1, 0.55, lum));
    duo = mix(duo, hi, smoothstep(0.62, 0.97, lum));
    col = mix(col, duo, 0.32);               // lighter grade so the photo stays legible

    float vig = smoothstep(1.2, 0.4, distance(vUv, vec2(0.5)));
    col *= 0.7 + 0.3 * vig;
    gl_FragColor = vec4(col, 1.0);
  }
`;async function C(e){const a=e.querySelector("img");if(!a)return;let t;try{t=new f({antialias:!0,powerPreference:"high-performance"})}catch{return}t.setPixelRatio(Math.min(window.devicePixelRatio,2));let r;try{r=await new x().loadAsync(a.currentSrc||a.src)}catch{t.dispose();return}r.minFilter=p,r.magFilter=p;const v=t.domElement;v.className="showcase__gl",e.appendChild(v),a.style.opacity="0";const l=new y,g=new b(-1,1,1,-1,0,1),s={uTex:{value:r},uTime:{value:0},uHover:{value:0},uMouse:{value:new n(.5,.5)},uRes:{value:new n(1,1)},uImg:{value:new n(r.image.width,r.image.height)}};l.add(new T(new M(2,2),new U({uniforms:s,vertexShader:R,fragmentShader:S})));const u=()=>{const i=e.clientWidth||window.innerWidth,o=e.clientHeight||window.innerHeight;t.setSize(i,o,!1),s.uRes.value.set(i,o)};u(),window.addEventListener("resize",u);const d=new n(.5,.5);let c=0;e.addEventListener("pointermove",i=>{const o=e.getBoundingClientRect();d.set((i.clientX-o.left)/o.width,1-(i.clientY-o.top)/o.height),c=1}),e.addEventListener("pointerleave",()=>c=0);let h=!0;new IntersectionObserver(i=>h=i[0].isIntersecting,{threshold:0}).observe(e);const w=new H,m=()=>{if(!e.isConnected){t.dispose();return}requestAnimationFrame(m),!(!h||document.hidden)&&(s.uTime.value=w.getElapsedTime(),s.uMouse.value.lerp(d,.08),s.uHover.value+=(c-s.uHover.value)*.06,t.render(l,g))};m()}export{C as initShowcaseGL};
