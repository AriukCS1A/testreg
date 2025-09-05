// public/src/ar.js
import { VIDEO_ROT_Z } from "./config.js";
import { dbg } from "./utils.js";

let THREE, ZT; // ZapparThree (UMD)
export let renderer, camera, scene, tracker, anchor, plane;
export let scaleFactor = 1.35;
const MIN_S = 0.6, MAX_S = 3;

let onFrameCb = null;
let cameraStarted = false;

// --- iOS WebView / Code Scanner илрүүлэх ---
function looksLikeIOSWebView() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const hasWK = !!window.webkit?.messageHandlers;
  return isIOS && hasWK && !window.navigator.standalone;
}

export async function initAR() {
  // === 1) Dependencies-ийг аюулгүй авч, хамгаалалт тавина
  let deps = null;
  try {
    if (!window.__depsReady) throw new Error("__depsReady байхгүй (скриптүүд бүрэн ачаалагдаагүй).");
    deps = await window.__depsReady;
  } catch (e) {
    dbg("deps load failed:", e?.message || e);
    throw new Error("AR-ийн хамаарал (THREE / Zappar) ачаалагдаагүй байна.");
  }

  THREE = deps?.THREE || window.THREE;
  ZT    = deps?.ZapparThree || deps?.ZT || window.ZapparThree;

  if (!THREE) throw new Error("THREE.js ачаалагдаагүй байна.");
  if (!ZT)    throw new Error("ZapparThree ачаалагдаагүй байна.");

  // HTTPS шаардлага
  if (!window.isSecureContext) dbg("site must be HTTPS/secure context for camera");

  // === 2) Browser compatibility-г хамгаалалттай шалгана
  try {
    const incompatible = typeof ZT.browserIncompatible === "function" ? ZT.browserIncompatible() : false;
    if (incompatible) {
      // Zappar-ийн өөрийнх overlay-г ашиглахгүй тул эндээс тайлбартайгаар тасална
      throw new Error("Тухайн браузер AR-д тохирохгүй байна.");
    }
  } catch (e) {
    // Зарим билдүүдэд browserIncompatible байхгүй байж болно — ийм үед зүгээр алгасна
    if (e?.message) dbg("browserIncompatible check skipped/failed:", e.message);
  }

  // === 3) Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.background = "transparent";
  renderer.domElement.classList.add("webgl");
  document.body.appendChild(renderer.domElement);

  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  });

  // GL → Zappar
  ZT.glContextSet(renderer.getContext());

  // === 4) Camera / Scene
  camera = new ZT.Camera({ userFacing: false });
  scene = new THREE.Scene();
  scene.background = camera.backgroundTexture;

  // World tracking
  tracker = new ZT.InstantWorldTracker();
  anchor = new ZT.InstantWorldAnchorGroup(camera, tracker);
  scene.add(anchor);

  // Video plane
  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, opacity: 0 })
  );
  plane.visible = false;
  plane.material.colorWrite = false;
  anchor.add(plane);

  // Render loop
  let anchorSet = false;
  renderer.setAnimationLoop(() => {
    if (!anchorSet) { tracker.setAnchorPoseFromCameraOffset(0, 0, -1.5); anchorSet = true; }
    faceCameraNoRotate();
    try { camera.updateFrame(renderer); } catch {}
    renderer.render(scene, camera);
    onFrameCb?.();
  });

  // Pause/resume
  document.addEventListener("visibilitychange", () => {
    if (!cameraStarted) return;
    if (document.hidden) { try { camera.pause(); } catch {} }
    else { try { camera.start(); } catch {} }
  });
  addEventListener("pageshow", () => { if (cameraStarted) try { camera.start(); } catch {} });
  addEventListener("pagehide", () => { if (cameraStarted) try { camera.pause(); } catch {} });

  // WebGL context guards
  const gl = renderer.getContext();
  gl.canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); dbg("webgl context LOST"); });
  gl.canvas.addEventListener("webglcontextrestored", () => {
    ZT.glContextSet(renderer.getContext());
    scene.background = camera.backgroundTexture;
    renderer.setClearColor(0x000000, 0);
    if (plane) {
      plane.visible = false;
      if (plane.material) { plane.material.colorWrite = false; plane.material.opacity = 0; }
    }
    if (cameraStarted) { try { camera.start(); } catch {} }
    dbg("webgl context RESTORED + camera restarted");
  });

  hookGestures();
  dbg("AR ready");
}

export function onFrame(cb) { onFrameCb = cb; }

/* ===== Камер зөв асаалт (Зөвхөн системийн popup) ===== */
export async function ensureCamera() {
  if (cameraStarted) return;
  if (looksLikeIOSWebView()) throw new Error("iOS in-app WebView… (Code Scanner/mini webview дотор camera хориглогддог)");

  // permissionGranted / permissionRequest хэсгийг та өөрийнхөөрөө үлдээсэн
  try {
    if (camera.stop) { try { camera.stop(); } catch {} }

    // ✅ rear/environment-ийг хүчдэж асаана
    await camera.start(false);

    // Зарим төхөөрөмж front руу унадаг — дахин rear болгоно
    await new Promise(r => requestAnimationFrame(r));
    if (camera.userFacing === true) {
      await camera.start(false);
    }
  } catch {
    // Fallback — rear-ийг дахин оролд
    await camera.start(false);
  }

  scene.background = camera.backgroundTexture;
  cameraStarted = true;
  await new Promise(r => requestAnimationFrame(r));
  dbg("camera started (rear)");
}

/* ===== ВИДЕО / ТЕКСТУР ===== */
export function setSources(videoEl, webm = "", mp4 = "", forceMP4 = false) {
  videoEl.crossOrigin = "anonymous";
  videoEl.setAttribute("playsinline", "");
  videoEl.setAttribute("preload", "auto");
  videoEl.innerHTML = "";

  if (forceMP4 && mp4) {
    const s = document.createElement("source"); s.src = mp4; s.type = "video/mp4"; videoEl.appendChild(s);
  } else if (webm) {
    const s = document.createElement("source"); s.src = webm; s.type = 'video/webm; codecs="vp8,opus"'; videoEl.appendChild(s);
  } else if (mp4) {
    const s = document.createElement("source"); s.src = mp4; s.type = "video/mp4"; videoEl.appendChild(s);
  }

  try { videoEl.load(); } catch {}
}

export function videoTexture(el) {
  const t = new THREE.VideoTexture(el);
  t.colorSpace = THREE.SRGBColorSpace;
  t.format = THREE.RGBAFormat;
  t.generateMipmaps = false;
  t.flipY = true;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

export function fitPlaneToVideo(el) {
  const w = el.videoWidth || 1280;
  const h = el.videoHeight || 720;
  const baseH = 0.9;
  const W = (baseH * w) / h;
  plane.geometry?.dispose?.();
  plane.geometry = new THREE.PlaneGeometry(W, baseH);
  applyScale();
}

export function applyScale() {
  if (!plane) return;
  plane.scale.set(scaleFactor, scaleFactor, 1);
  plane.position.set(0, 0, 0);
}

export function faceCameraNoRotate() {
  if (!plane || !camera) return;
  plane.quaternion.copy(camera.quaternion);
  plane.rotation.z = VIDEO_ROT_Z;
}

/* ================= Shader материалууд ================= */

export function makeSbsAlphaMaterial(tex) {
  tex.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    uniforms: { mapTex: { value: tex } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D mapTex;
      varying vec2 vUv;
      void main(){
        vec2 uvLeft  = vec2(vUv.x * 0.5, vUv.y);
        vec2 uvRight = vec2(0.5 + vUv.x * 0.5, vUv.y);
        vec4 rgb  = texture2D(mapTex, uvLeft);
        float a   = texture2D(mapTex, uvRight).r;
        gl_FragColor = vec4(rgb.rgb, a);
      }`,
    transparent: true,
    depthWrite: false,
  });
  return mat;
}

export function makeLumaKeyMaterial(tex, opts = {}) {
  const { threshold = 0.9, smoothness = 0.1 } = opts;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      mapTex: { value: tex },
      uThreshold: { value: threshold },
      uSmooth: { value: smoothness },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D mapTex;
      uniform float uThreshold;
      uniform float uSmooth;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(mapTex, vUv);
        float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        float a = smoothstep(uThreshold, uThreshold - uSmooth, luma);
        gl_FragColor = vec4(c.rgb, a);
      }`,
    transparent: true,
    depthWrite: false,
  });
  return mat;
}

export function makeChromaKeyMaterial(tex, opts = {}) {
  const {
    keyColor = 0x00ff00,
    similarity = 0.32,
    smoothness = 0.08,
    spill = 0.18,
  } = opts;

  const kc = [
    ((keyColor >> 16) & 255) / 255,
    ((keyColor >> 8) & 255) / 255,
    (keyColor & 255) / 255,
  ];

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      mapTex: { value: tex },
      uKeyColor: { value: new THREE.Vector3(kc[0], kc[1], kc[2]) },
      uSimilarity: { value: similarity },
      uSmoothness: { value: smoothness },
      uSpill: { value: spill },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D mapTex;
      uniform vec3  uKeyColor;
      uniform float uSimilarity;
      uniform float uSmoothness;
      uniform float uSpill;

      vec3 rgb2ycbcr(vec3 c){
        float y  = dot(c, vec3(0.2989, 0.5866, 0.1145));
        float cb = (c.b - y) * 0.565;
        float cr = (c.r - y) * 0.713;
        return vec3(y, cb, cr);
      }

      void main(){
        vec4 col = texture2D(mapTex, vUv);
        vec3  k   = uKeyColor;
        vec3  ycc = rgb2ycbcr(col.rgb);
        vec3  kycc= rgb2ycbcr(k);

        float dist = distance(ycc.yz, kycc.yz);
        float edge0 = uSimilarity;
        float edge1 = uSimilarity + uSmoothness;
        float alpha = 1.0 - smoothstep(edge0, edge1, dist);

        float desat = clamp((dist - uSimilarity) / max(uSmoothness, 1e-5), 0.0, 1.0);
        vec3  rgb   = mix(col.rgb, vec3(ycc.x), desat * uSpill);

        gl_FragColor = vec4(rgb, alpha * col.a);
      }`,
    transparent: true,
    depthWrite: false,
  });
  return mat;
}

export function applyLumaKey(tex, opts) {
  plane.material?.dispose?.();
  plane.material = makeLumaKeyMaterial(tex, opts);
  plane.material.transparent = true;
  plane.material.depthWrite = false;
  plane.material.needsUpdate = true;
}

/* ===== Туслах ===== */
export function worldToScreen(v) {
  if (!renderer || !camera) return { x: -9999, y: -9999 };
  const rect = renderer.domElement.getBoundingClientRect();
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * rect.width + rect.left, y: (-p.y * 0.5 + 0.5) * rect.height + rect.top };
}

export function localPointOnPlane(u, v) {
  const w = plane.geometry.parameters.width;
  const h = plane.geometry.parameters.height;
  const pt = new THREE.Vector3(u * w * 0.5, v * h * 0.5, 0);
  return plane.localToWorld(pt);
}

function hookGestures() {
  addEventListener("touchstart", () => {}, { passive: true });

  addEventListener("touchmove", (e) => {
    if (e.touches.length === 2 && plane) {
      const d = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const k = d(e.touches[0], e.touches[1]);
      const prev = Number(plane.dataset_prevDist || k);
      if (prev > 0) {
        const ratio = k / prev;
        scaleFactor = Math.min(MAX_S, Math.max(MIN_S, scaleFactor * ratio));
        applyScale();
      }
      plane.dataset_prevDist = k;
    }
  }, { passive: true });

  addEventListener("touchend", () => { if (plane) plane.dataset_prevDist = ""; }, { passive: true });

  addEventListener("wheel", (e) => {
    scaleFactor = Math.min(MAX_S, Math.max(MIN_S, scaleFactor * (e.deltaY > 0 ? 0.95 : 1.05)));
    applyScale();
  }, { passive: true });
}
