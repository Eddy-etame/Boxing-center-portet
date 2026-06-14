import{W as w,T as x,L as p,S as y,O as T,V as s,M as b,e as M,f as U,d as H}from"./three.module-3h5ZTJyy.js";const R=`
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
    vec3 navy = vec3(0.086, 0.133, 0.247);
    vec3 bronze = vec3(0.69, 0.475, 0.247);
    vec3 hi = vec3(0.96, 0.93, 0.87);
    vec3 duo = mix(navy, bronze, smoothstep(0.12, 0.6, lum));
    duo = mix(duo, hi, smoothstep(0.62, 0.96, lum));
    col = mix(col, duo, 0.42);

    float vig = smoothstep(1.15, 0.35, distance(vUv, vec2(0.5)));
    col *= 0.55 + 0.45 * vig;
    gl_FragColor = vec4(col, 1.0);
  }
`;async function z(e){const a=e.querySelector("img");if(!a)return;let o;try{o=new w({antialias:!0,powerPreference:"high-performance"})}catch{return}o.setPixelRatio(Math.min(window.devicePixelRatio,2));let r;try{r=await new x().loadAsync(a.currentSrc||a.src)}catch{o.dispose();return}r.minFilter=p,r.magFilter=p;const v=o.domElement;v.className="showcase__gl",e.appendChild(v),a.style.opacity="0";const u=new y,g=new T(-1,1,1,-1,0,1),n={uTex:{value:r},uTime:{value:0},uHover:{value:0},uMouse:{value:new s(.5,.5)},uRes:{value:new s(1,1)},uImg:{value:new s(r.image.width,r.image.height)}};u.add(new b(new M(2,2),new U({uniforms:n,vertexShader:R,fragmentShader:S})));const l=()=>{const t=e.clientWidth||window.innerWidth,i=e.clientHeight||window.innerHeight;o.setSize(t,i,!1),n.uRes.value.set(t,i)};l(),window.addEventListener("resize",l);const d=new s(.5,.5);let c=0;e.addEventListener("pointermove",t=>{const i=e.getBoundingClientRect();d.set((t.clientX-i.left)/i.width,1-(t.clientY-i.top)/i.height),c=1}),e.addEventListener("pointerleave",()=>c=0);let h=!0;new IntersectionObserver(t=>h=t[0].isIntersecting,{threshold:0}).observe(e);const f=new H,m=()=>{requestAnimationFrame(m),!(!h||document.hidden)&&(n.uTime.value=f.getElapsedTime(),n.uMouse.value.lerp(d,.08),n.uHover.value+=(c-n.uHover.value)*.06,o.render(u,g))};m()}export{z as initShowcaseGL};
