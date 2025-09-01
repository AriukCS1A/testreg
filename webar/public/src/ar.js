// public/src/ar.js
import { VIDEO_ROT_Z } from "./config.js";
import { dbg } from "./utils.js";

let THREE, ZT; // ZapparThree (UMD-ээс)
export let renderer, camera, scene, tracker, anchor, plane;
export let scaleFactor = 1.35;
const MIN_S = 0.6, MAX_S = 3;

let onFrameCb = null;
let cameraStarted = false; // ← камераа нэг л удаа асаана

export async function initAR() {
  ({ THREE, ZapparThree: ZT } = await window.__depsReady);

  if (!window.isSecureContext) {
    dbg("site must be HTTPS/secure context for camera");
  }

  if (ZT.browserIncompatible()) {
    ZT.browserIncompatibleUI();
    throw new Error("browser incompatible");
  }

  // Renderer (✓ transparent canvas)
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // 🔸 ил тод canvas
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0); // 🔸 ар талыг 0 alpha
  renderer.domElement.style.background = "transparent";
  renderer.domElement.classList.add("webgl");
  document.body.appendChild(renderer.domElement);

  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  });

  // GL → Zappar
  ZT.glContextSet(renderer.getContext());

  // Camera / Scene
  camera = new ZT.Camera({ userFacing: false });
  scene = new THREE.Scene();
  scene.background = camera.backgroundTexture; // Zappar-ийн камер feed

  // World tracking
  tracker = new ZT.InstantWorldTracker();
  anchor = new ZT.InstantWorldAnchorGroup(camera, tracker);
  scene.add(anchor);

  // Video plane
  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, opacity: 0 }) // эхлээд ил тод
  );
  plane.visibe = false;
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

  // ⚠️ Permission авахаас өмнө start() бүү дуудаарай
  document.addEventListener("visibilitychange", () => {
    if (!cameraStarted) return;
    try { document.hidden ? camera.pause() : camera.start(); } catch {}
  });
  window.addEventListener("focus", () => {
    if (!cameraStarted) return;
    try { camera.start(); } catch {}
  });

  // WebGL context guards
  const gl = renderer.getContext();
  gl.canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    dbg("webgl context LOST");
  });
  gl.canvas.addEventListener("webglcontextrestored", () => {
    ZT.glContextSet(renderer.getContext());
    scene.background = camera.backgroundTexture;
    renderer.setClearColor(0x000000, 0); // 🔸 restore үед ч мөн
    if(plane) {
      plane.visibe = false;
      if(plane.material) {
        plane.material.colorWrite = false;
        plane.material.opacity = 0;
      }
    }
    if (cameraStarted) { try { camera.start(); } catch {} }
    dbg("webgl context RESTORED + camera restarted");
  });

  // ✋ жестүүд
  hookGestures();

  dbg("AR ready");
}

export function onFrame(cb) { onFrameCb = cb; }

/* ===== Камер зөв асаалт ===== */
export async function ensureCamera() {
  if (cameraStarted) return;

  dbg("asking camera permission…");
  try {
    let granted = await ZT.permissionGranted();
    if (!granted) {
      try { granted = await ZT.permissionRequest(); } catch { granted = false; }
    }
    if (!granted) {
      await ZT.permissionDeniedUI();
      throw new Error("camera permission denied");
    }

    await camera.start(); // rear camera
    scene.background = camera.backgroundTexture;
    cameraStarted = true;

    await new Promise(r => requestAnimationFrame(r));
    dbg("camera started (bg bound)");
  } catch (e) {
    dbg("camera start failed: " + (e?.message || e));
    throw e;
  }
}

/* ===== ВИДЕО / ТЕКСТУР ===== */
export function setSources(videoEl, webm = "", mp4 = "", forceMP4 = false) {
  videoEl.crossOrigin = "anonymous";
  videoEl.setAttribute("playsinline", "");
  videoEl.setAttribute("preload", "auto");
  videoEl.innerHTML = "";

  if (forceMP4 && mp4) {
    const s = document.createElement("source");
    s.src = mp4; s.type = "video/mp4";
    videoEl.appendChild(s);
  } else if (webm) {
    const s = document.createElement("source");
    s.src = webm; s.type = 'video/webm; codecs="vp8,opus"';
    videoEl.appendChild(s);
  } else if (mp4) {
    const s = document.createElement("source");
    s.src = mp4; s.type = "video/mp4";
    videoEl.appendChild(s);
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

// iOS SBS MP4 → альфа сэргээх шэйдэр
export function makeSbsAlphaMaterial(tex) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { map: { value: tex } },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      precision highp float;
      uniform sampler2D map;
      varying vec2 vUv;
      void main(){
        // Зүүн талын хагас: RGB
        vec3 rgb = texture2D(map, vec2(vUv.x * 0.5, vUv.y)).rgb;
        // Баруун талын хагас: Alpha (R суваг)
        float a  = texture2D(map, vec2(0.5 + vUv.x * 0.5, vUv.y)).r;
        gl_FragColor = vec4(rgb, a);
      }`,
  });
}

// Luma-key fallback (альфа байхгүй MP4-д)
// --- REPLACE makeLumaKeyMaterial WITH THIS ---
export function makeLumaKeyMaterial(
  tex,
  { cut = 0.08, feather = 0.20, gamma = 0.85 } = {}
) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      map:   { value: tex },
      uCut:  { value: cut },
      uFea:  { value: feather },
      uGam:  { value: gamma },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D map;
      uniform float uCut, uFea, uGam;
      varying vec2 vUv;

      void main() {
        vec4 c = texture2D(map, vUv);

        // 1) Near-black key: value = max(R,G,B)  → улаан давамгай хэсгийг хамгаална
        float value = max(max(c.r, c.g), c.b);

        // 2) Soft threshold + gamma boost
        float a = smoothstep(uCut, uCut + uFea, value);
        a = pow(a, uGam);

        // 3) Un-premultiply to remove dark/halo edges
        vec3 rgb = c.rgb / max(a, 1e-3);

        gl_FragColor = vec4(rgb, a);
      }`,
  });
}
// --- ADD in ar.js ---
export function makeChromaKeyMaterial(tex, opts = {}) {
  const {
    keyColor = 0x00ff00,   // ногоон
    similarity = 0.32,     // 0.1–0.6 (ихсэх тусам илүү устгана)
    smoothness = 0.08,     // 0.0–0.2 (ирмэг зөөлрөл)
    spill = 0.18,          // 0.0–0.4 (ногоон асгаралт дарах)
  } = opts;

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: tex },
      uKey: { value: new THREE.Color(keyColor).toArray().slice(0,3) },
      uSimilarity: { value: similarity },
      uSmoothness: { value: smoothness },
      uSpill: { value: spill },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 uKey;
      uniform float uSimilarity;
      uniform float uSmoothness;
      uniform float uSpill;
      varying vec2 vUv;

      // RGB->YCbCr (BT.601)
      vec3 rgb2ycbcr(vec3 c){
        float y  = 0.299*c.r + 0.587*c.g + 0.114*c.b;
        float cb = -0.168736*c.r - 0.331264*c.g + 0.5*c.b + 0.5;
        float cr = 0.5*c.r - 0.418688*c.g - 0.081312*c.b + 0.5;
        return vec3(y,cb,cr);
      }

      void main(){
        vec4 src = texture2D(map, vUv);
        vec3 ycc = rgb2ycbcr(src.rgb);
        vec3 key = rgb2ycbcr(uKey);

        // зай (CbCr хавтгай дээр)
        float dist = distance(ycc.yz, key.yz);

        // alpha: similarity & smoothness
        float a = 1.0 - smoothstep(uSimilarity - uSmoothness, uSimilarity + uSmoothness, dist);

        // spill reduction
        float spillMask = smoothstep(uSimilarity, uSimilarity + uSmoothness, dist);
        vec3 col = src.rgb;
        col.g = mix(col.g, (col.r + col.b) * 0.5, uSpill * (1.0 - spillMask));

        gl_FragColor = vec4(col, a);
      }`,
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
  return {
    x: (p.x * 0.5 + 0.5) * rect.width + rect.left,
    y: (-p.y * 0.5 + 0.5) * rect.height + rect.top,
  };
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
