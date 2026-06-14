import{W as f,T as x,L as p,S as y,O as T,V as n,M as b,e as M,f as U,d as H}from"./three.module-a8-wDQn7.js";const R=`
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
    // bias the vertical crop up (0.34) so faces at the top of the photo stay in frame
    if (ca > ia) st.y = (uv.y - 0.5) * (ia / ca) + 0.34;
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
    vec3 shadow = vec3(0.055, 0.07, 0.13);   // near-black navy shadow
    vec3 mid = vec3(0.78, 0.16, 0.12);       // combat red midtone
    vec3 hi = vec3(0.97, 0.86, 0.78);        // warm highlight
    vec3 duo = mix(shadow, mid, smoothstep(0.1, 0.55, lum));
    duo = mix(duo, hi, smoothstep(0.62, 0.97, lum));
    col = mix(col, duo, 0.46);

    float vig = smoothstep(1.15, 0.35, distance(vUv, vec2(0.5)));
    col *= 0.55 + 0.45 * vig;
    gl_FragColor = vec4(col, 1.0);
  }
`;async function C(e){const s=e.querySelector("img");if(!s)return;let t;try{t=new f({antialias:!0,powerPreference:"high-performance"})}catch{return}t.setPixelRatio(Math.min(window.devicePixelRatio,2));let a;try{a=await new x().loadAsync(s.currentSrc||s.src)}catch{t.dispose();return}a.minFilter=p,a.magFilter=p;const v=t.domElement;v.className="showcase__gl",e.appendChild(v),s.style.opacity="0";const u=new y,g=new T(-1,1,1,-1,0,1),r={uTex:{value:a},uTime:{value:0},uHover:{value:0},uMouse:{value:new n(.5,.5)},uRes:{value:new n(1,1)},uImg:{value:new n(a.image.width,a.image.height)}};u.add(new b(new M(2,2),new U({uniforms:r,vertexShader:R,fragmentShader:S})));const l=()=>{const i=e.clientWidth||window.innerWidth,o=e.clientHeight||window.innerHeight;t.setSize(i,o,!1),r.uRes.value.set(i,o)};l(),window.addEventListener("resize",l);const d=new n(.5,.5);let c=0;e.addEventListener("pointermove",i=>{const o=e.getBoundingClientRect();d.set((i.clientX-o.left)/o.width,1-(i.clientY-o.top)/o.height),c=1}),e.addEventListener("pointerleave",()=>c=0);let h=!0;new IntersectionObserver(i=>h=i[0].isIntersecting,{threshold:0}).observe(e);const w=new H,m=()=>{if(!e.isConnected){t.dispose();return}requestAnimationFrame(m),!(!h||document.hidden)&&(r.uTime.value=w.getElapsedTime(),r.uMouse.value.lerp(d,.08),r.uHover.value+=(c-r.uHover.value)*.06,t.render(u,g))};m()}export{C as initShowcaseGL};
