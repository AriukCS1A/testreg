// public/src/ar.js
import { VIDEO_ROT_Z } from "./config.js";
import { dbg } from "./utils.js";

let THREE, ZT; // ZapparThree (UMD-ээс)
export let renderer, camera, scene, tracker, anchor, plane;
export let scaleFactor = 1.35;
const MIN_S = 0.6, MAX_S = 3;

let onFrameCb = null;
let cameraStarted = false; // ← камераа нэг л удаа асаана

// --- iOS WebView / Code Scanner илрүүлэх ---
function looksLikeIOSWebView() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const hasWK = !!window.webkit?.messageHandlers;
  return isIOS && hasWK && !window.navigator.standalone;
}

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
    alpha: true,
    powerPreference: "high-performance",
  });
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

  // Pause/resume on visibility
  document.addEventListener("visibilitychange", () => {
    if (!cameraStarted) return;
    if (document.hidden) { try { camera.pause(); } catch {} }
    else { try { camera.start(); } catch {} }
  });
  window.addEventListener("pageshow", () => { if (cameraStarted) try { camera.start(); } catch {} });
  window.addEventListener("pagehide", () => { if (cameraStarted) try { camera.pause(); } catch {} });

  // WebGL context guards
  const gl = renderer.getContext();
  gl.canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    dbg("webgl context LOST");
  });
  gl.canvas.addEventListener("webglcontextrestored", () => {
    ZT.glContextSet(renderer.getContext());
    scene.background = camera.backgroundTexture;
    renderer.setClearColor(0x000000, 0);
    if (plane) {
      plane.visible = false;
      if (plane.material) {
        plane.material.colorWrite = false;
        plane.material.opacity = 0;
      }
    }
    if (cameraStarted) { try { camera.start(); } catch {} }
    dbg("webgl context RESTORED + camera restarted");
  });

  hookGestures();
  dbg("AR ready");
}

export function onFrame(cb) { onFrameCb = cb; }

/* ===== Камер зөв асаалт ===== */
export async function ensureCamera() {
  if (cameraStarted) return;

  if (looksLikeIOSWebView()) {
    throw new Error("iOS in-app WebView/Code Scanner орчинд камер ажиллахгүй. Safari-д нээгээрэй.");
  }

  dbg("asking camera permission…");
  try {
    let granted = await ZT.permissionGranted();
    if (!granted) {
      try { granted = await ZT.permissionRequestUI(); } catch { granted = false; }
    }
    if (!granted) {
      await ZT.permissionDeniedUI();
      throw new Error("camera permission denied");
    }

    try {
      await camera.start(true); // rear камер
    } catch {
      await camera.start();
    }

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

// === Шэйдэр материалууд (tanai өмнөх шиг) ===
export function makeSbsAlphaMaterial(tex) { /* ...таны одоогийн код хэвээр... */ }
export function makeLumaKeyMaterial(tex, opts) { /* ... */ }
export function makeChromaKeyMaterial(tex, opts) { /* ... */ }

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
