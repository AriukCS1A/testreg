// public/src/ar.js
import { VIDEO_ROT_Z } from "./config.js";
import { dbg } from "./utils.js";

let THREE, ZT; // ZapparThree
export let renderer, camera, scene, tracker, anchor, plane;
export let scaleFactor = 1.35;
const MIN_S = 0.6, MAX_S = 3;

let onFrameCb = null;

export async function initAR() {
  ({ THREE, ZapparThree: ZT } = await window.__depsReady);

  if (!window.isSecureContext) {
    dbg("site must be HTTPS/secure context for camera");
  }

  if (ZT.browserIncompatible()) {
    ZT.browserIncompatibleUI();
    throw new Error("browser incompatible");
  }

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
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
  scene.background = camera.backgroundTexture;

  // World tracking
  tracker = new ZT.InstantWorldTracker();
  anchor = new ZT.InstantWorldAnchorGroup(camera, tracker);
  scene.add(anchor);

  // Video plane
  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide })
  );
  anchor.add(plane);

  // Gestures
  hookGestures();

  // Render loop
  let anchorSet = false;
  renderer.setAnimationLoop(() => {
    if (!anchorSet) { tracker.setAnchorPoseFromCameraOffset(0, 0, -1.5); anchorSet = true; }
    faceCameraNoRotate();
    try { camera.updateFrame(renderer); } catch {}
    renderer.render(scene, camera);
    onFrameCb?.();
  });

  // Visibility/focus
  document.addEventListener("visibilitychange", () => {
    try { document.hidden ? camera.pause() : camera.start(); } catch {}
  });
  window.addEventListener("focus", () => { try { camera.start(); } catch {} });

  // WebGL context guards
  const gl = renderer.getContext();
  gl.canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    dbg("webgl context LOST");
  });
  gl.canvas.addEventListener("webglcontextrestored", () => {
    ZT.glContextSet(renderer.getContext());
    scene.background = camera.backgroundTexture;
    try { camera.start(); } catch {}
    dbg("webgl context RESTORED + camera restarted");
  });

  dbg("AR ready");
}

export function onFrame(cb) { onFrameCb = cb; }

// Камер зөв асаалт
export async function ensureCamera() {
  dbg("asking camera permission…");
  try {
    const ok = await ZT.permissionRequest();
    dbg("permission result: " + ok);
    if (!ok) { ZT.permissionDeniedUI(); throw new Error("camera permission denied"); }

    await camera.start();

    // 🔑 Зарим төхөөрөмж дээр backgroundTexture binding-д 1 frame хэрэгтэй
    scene.background = camera.backgroundTexture;
    await new Promise(r => requestAnimationFrame(r));

    dbg("camera started (bg bound)");
  } catch (e) {
    dbg("camera start failed: " + (e?.message || e));
    throw e;
  }
}

// ===== ВИДЕО / ТЕКСТУР =====
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
    s.src = webm; s.type = 'video/webm; codecs="vp9,opus"';
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
  t.flipY = true;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
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

// ===== Туслах =====
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
