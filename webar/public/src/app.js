// src/app.js
import { isIOS, dbg as _dbg } from "./utils.js";
import {
  initAR,
  ensureCamera,
  onFrame,
  videoTexture,
  fitPlaneToVideo,
  applyScale,
} from "./ar.js";
import {
  bindIntroButtons,
  updateIntroButtons,
  showMenuOverlay,
  closeMenu,
  stopIntroButtons,
} from "./ui.js";

const dbg = (...a) => (_dbg ? _dbg("[AR]", ...a) : console.log("[AR]", ...a));

/* ===== Swallow "play() was interrupted..." ===== */
window.addEventListener("unhandledrejection", (e) => {
  const r = e?.reason;
  const msg = String(r?.message || r || "");
  if (r?.name === "AbortError" || /play\(\) request was interrupted/i.test(msg)) {
    e.preventDefault();
    dbg("Ignored AbortError from play():", msg);
  }
});

/* ===== Config ===== */
const ALLOW_DUPLICATE_TO_ENTER = false;
const DEFAULT_LOC_RADIUS_M = 200;
const ACCURACY_BUFFER_MAX = 75;

/* ===== Firebase (ESM CDN) ===== */
import { firebaseConfig } from "./firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
  getDocs,
  query as fsQuery,
  where,
  limit,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===== Geolocation helpers ===== */
let geoWatchId = null;
function canGeolocate() { return "geolocation" in navigator; }
function getGeoOnce(options = {}) {
  if (!canGeolocate()) return Promise.reject(new Error("Geolocation not supported"));
  const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options };
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}
function startGeoWatch(onUpdate, options = {}) {
  if (!canGeolocate()) throw new Error("Geolocation not supported");
  const opts = { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000, ...options };
  if (geoWatchId != null) stopGeoWatch();
  geoWatchId = navigator.geolocation.watchPosition(
    (pos) => onUpdate?.(pos, null),
    (err) => onUpdate?.(null, err),
    opts
  );
}
function stopGeoWatch() {
  if (geoWatchId != null && navigator.geolocation?.clearWatch) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}
function fmtLoc(pos) {
  if (!pos) return "";
  const { latitude, longitude, accuracy } = pos.coords || {};
  return `GPS lat=${latitude?.toFixed(6)} lng=${longitude?.toFixed(6)} ±${Math.round(accuracy || 0)}m`;
}

/* ===== Query param ===== */
function getQueryParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name) || "";
}
const QR_LOC_ID = getQueryParam("loc") || "";
dbg("QR loc =", QR_LOC_ID || "(none)");

/* ===== Phone normalize (MN) ===== */
function normalizeMnPhone(raw = "") {
  const digits = String(raw).replace(/\D/g, "");
  if (/^\+976\d{8}$/.test(raw)) return raw;
  if (/^\d{8}$/.test(digits)) return `+976${digits}`;
  if (/^\+?[1-9]\d{7,14}$/.test(raw)) return raw.startsWith("+") ? raw : `+${raw}`;
  throw new Error("Утасны дугаар буруу байна. (+976XXXXXXXX хэлбэр)");
}

/* ===== DOM ===== */
const vIntro = document.getElementById("vidIntro");
const vEx = document.getElementById("vidExercise");
const btnUnmute = document.getElementById("btnUnmute");
const tapLay = document.getElementById("tapToStart");
const otpGate = document.getElementById("otpGate");
const otpPhoneEl = document.getElementById("otpPhone");
const btnSendCode = document.getElementById("btnSendCode");
const otpCodeWrap = document.getElementById("otpCodeWrap");
const otpError = document.getElementById("otpError");

let currentVideo = null;
let introLoading = false;
let exLoading = false;

/* ===== Firebase ===== */
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

/* ===== Media / GL diagnostics ===== */
const MEDIA_ERR = {
  1: "MEDIA_ERR_ABORTED (user/JS aborted)",
  2: "MEDIA_ERR_NETWORK (download/network)",
  3: "MEDIA_ERR_DECODE (decode failed/unsupported)",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED (src/type unsupported)",
};
const readReadyState = (rs) =>
  `${rs} (${["HAVE_NOTHING", "HAVE_METADATA", "HAVE_CURRENT_DATA", "HAVE_FUTURE_DATA", "HAVE_ENOUGH_DATA"][rs] || "?"})`;
const readNetworkState = (ns) =>
  `${ns} (${["NETWORK_EMPTY", "NETWORK_IDLE", "NETWORK_LOADING", "NETWORK_NO_SOURCE"][ns] || "?"})`;
function logVideoError(v, tag = "video") {
  const code = v?.error?.code ?? 0;
  dbg(`[${tag}] VIDEO ERROR: code=${code} ${MEDIA_ERR[code] || "Unknown"}`);
  dbg(`[${tag}] src=${v.currentSrc || v.src || "(no src)"}`);
  dbg(`[${tag}] readyState=${readReadyState(v.readyState)} networkState=${readNetworkState(v.networkState)}`);
  try {
    const ct =
      v.dataset?.srcType ||
      (v.currentSrc?.includes(".webm")
        ? 'video/webm; codecs="vp8,opus"'
        : 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
    navigator.mediaCapabilities
      ?.decodingInfo?.({
        type: "file",
        video: { contentType: ct, width: v.videoWidth || 640, height: v.videoHeight || 360, bitrate: 1_000_000, framerate: 30 },
      })
      .then((info) => dbg(`[${tag}] mediaCapabilities: ${JSON.stringify(info)}`))
      .catch(() => {});
  } catch {}
}

/* ======================================================================= */
/* ======================  Permission gate (шинэ)  ======================== */
/* ======================================================================= */

let CAM_REQ_IN_FLIGHT = false;
let CAM_PROMPTED = false;

async function thereIsCameraDevice() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return true;
    const list = await navigator.mediaDevices.enumerateDevices();
    const hasVideo = list.some((d) => d.kind === "videoinput");
    if (!hasVideo) dbg("enumerateDevices: no videoinput found");
    return hasVideo || isIOS; // iOS ихэнхдээ хоосон – true гэж үзье
  } catch { return true; }
}

async function logPermissionStates() {
  if (!navigator.permissions?.query) return;
  for (const n of ["camera", "geolocation"]) {
    try { const st = await navigator.permissions.query({ name: n }); dbg(`perm[${n}] =`, st.state); } catch {}
  }
}

async function requestCameraOnce() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Камер ашиглах боломжгүй төхөөрөмж.");
  await logPermissionStates();

  if (navigator.permissions?.query) {
    try {
      const st = await navigator.permissions.query({ name: "camera" });
      if (st.state === "denied") {
        throw new Error("Камерын зөвшөөрөл хаалттай байна. Settings → Safari → Camera → Allow (эсвэл Ask) болгож, хуудсаа Refresh хийнэ үү.");
      }
    } catch {}
  }

  if (CAM_PROMPTED) { dbg("camera already prompted – skip duplicate getUserMedia"); return true; }
  if (CAM_REQ_IN_FLIGHT) {
    dbg("camera request in-flight – wait");
    await new Promise((r) => {
      const id = setInterval(() => { if (!CAM_REQ_IN_FLIGHT) { clearInterval(id); r(); } }, 50);
    });
    return CAM_PROMPTED;
  }

  if (!(await thereIsCameraDevice())) {
    throw new Error("Камер олдсонгүй. Өөр апп камер ашиглаж байгаа эсэхээ шалгаад дахин оролдоно уу.");
  }

  CAM_REQ_IN_FLIGHT = true;

  const tryWithTimeout = (constraints, label, ms = 12000) =>
    new Promise((resolve, reject) => {
      let done = false;
      const to = setTimeout(() => { if (!done) { done = true; reject(new Error(`Camera request timed out: ${label}`)); } }, ms);

      dbg("getUserMedia →", label);
      navigator.mediaDevices.getUserMedia(constraints).then(
        (stream) => {
          if (done) { try { stream.getTracks().forEach((t) => t.stop()); } catch {} return; }
          clearTimeout(to); done = true; resolve(stream);
        },
        (err) => { if (done) return; clearTimeout(to); done = true; reject(err); }
      );
    });

  const attempts = [
    [{ video: { facingMode: { exact: "environment" } }, audio: false }, "env-exact"],
    [{ video: { facingMode: { ideal: "environment" } }, audio: false }, "env-ideal"],
    [{ video: true, audio: false }, "video:true"],
    [{ video: { facingMode: "user" }, audio: false }, "user"],
    [{ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }, "1280x720"],
  ];

  let lastErr;
  try {
    for (const [c, label] of attempts) {
      try {
        const s = await tryWithTimeout(c, label);
        CAM_PROMPTED = true;
        try { s.getTracks().forEach((t) => t.stop()); } catch {}
        return true;
      } catch (e) { lastErr = e; dbg("camera attempt failed:", label, e?.name || e?.message || e); }
    }
    const name = lastErr?.name;
    if (name === "NotAllowedError") throw new Error("Камерын зөвшөөрөл хаалттай байна. Settings → Safari → Camera → Allow (эсвэл Ask) болгож, хуудсаа Refresh хийнэ үү.");
    if (name === "NotFoundError") throw new Error("Камер олдсонгүй. Өөр апп камер ашиглаж байгаа эсэхээ шалгаад дахин оролдоно уу.");
    throw new Error("Камерт хандах боломжгүй: " + (lastErr?.message || lastErr));
  } finally { CAM_REQ_IN_FLIGHT = false; }
}

/* --- GEO-г gesture дотор эхлүүлэх тусдаа wrapper (await ХИЙХГҮЙ эхлүүлдэг) --- */
function requestGeoInGesture(opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, ...opts }
      );
    } catch (e) { reject(e); }
  });
}

/** ✅ НЭГ gesture дээр CAMERA + GEO-г зэрэг эхлүүлээд дараа нь хамтад нь хүлээнэ */
async function ensurePermissionsGate() {
  // Эхлүүлэх үед ямар ч await БҮҮ хий – popup-ууд тэгж байж гарна
  const geoP = requestGeoInGesture();   // Location popup асаана
  const camP = requestCameraOnce();     // Camera popup асаана

  try {
    const [_cam, pos] = await Promise.all([
      camP.catch(e => { throw e; }),
      geoP.catch(e => { throw e; }),
    ]);
    return pos;
  } catch (e) {
    // Алдааг Монгол тайлбартай болгоод цааш шиднэ
    if (e?.code === 1) throw new Error("Байршлын зөвшөөрөл хэрэгтэй. Settings → Safari → Location → While Using the App болгож, дахин оролдоно уу.");
    if (e?.code === 2) throw new Error("GPS дохио сул байна. Илүү нээлттэй газар дахин оролдоно уу.");
    throw new Error(e?.message || "Зөвшөөрөл амжилтгүй.");
  }
}

/* ===== helpers ===== */
async function safePlay(v) {
  if (!v) return;
  try { await v.play(); }
  catch (e) { if (e?.name === "AbortError") dbg("play() aborted (new load?)"); else throw e; }
}
function makeVideoDecodeFriendly(v) {
  try {
    v.removeAttribute("hidden");
    Object.assign(v.style, {
      position: "fixed", left: "-9999px", top: "-9999px",
      width: "1px", height: "1px", opacity: "0", pointerEvents: "none",
    });
  } catch {}
}

/* ===== ensureCamera once/cache ===== */
let __camPromise = null;
async function ensureCameraOnce() {
  if (__camPromise) return __camPromise;
  __camPromise = ensureCamera().catch((e) => { __camPromise = null; throw e; });
  return __camPromise;
}

/* ----- Video alpha sniff helpers ----- */
async function waitReady(v, minRS = 2) {
  if (v.readyState >= minRS) return;
  await new Promise((resolve) => {
    const ok = () => { if (v.readyState >= minRS) { cleanup(); resolve(); } };
    const to = setTimeout(() => { cleanup(); resolve(); }, 1500);
    const cleanup = () => {
      clearTimeout(to);
      v.removeEventListener("loadeddata", ok);
      v.removeEventListener("canplay", ok);
      v.removeEventListener("canplaythrough", ok);
    };
    v.addEventListener("loadeddata", ok);
    v.addEventListener("canplay", ok);
    v.addEventListener("canplaythrough", ok);
  });
}

async function videoLooksOpaque(v) {
  try {
    await waitReady(v, 2);
    const w = Math.max(2, Math.min(64, v.videoWidth || 0));
    const h = Math.max(2, Math.min(64, v.videoHeight || 0));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(v, 0, 0, w, h);
    const a = ctx.getImageData(0, 0, w, h).data;
    let minA = 255;
    for (let i = 3; i < a.length; i += 4) if (a[i] < minA) minA = a[i];
    return minA > 250;
  } catch { return true; }
}

/* ===== Location match helpers ===== */
async function fetchLocationById(id) {
  if (!id) return null;
  const d = await getDoc(doc(db, "locations", id)).catch(() => null);
  if (!d?.exists()) return null;
  const { lat, lng, name, radiusMeters } = d.data() || {};
  return { id: d.id, name: name || null, lat: Number(lat), lng: Number(lng), radiusMeters: Number(radiusMeters || 0) };
}
function distanceMeters(a, b) {
  const R = 6371000, toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(Math.abs(dLng)/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function isWithinQrLocation(pos, qrLocId, fallbackRadius = DEFAULT_LOC_RADIUS_M) {
  const loc = await fetchLocationById(qrLocId);
  if (!loc || !pos?.coords) {
    return { ok: false, reason: !loc ? "loc-missing" : "gps-missing", loc, dist: null, radius: fallbackRadius, buffer: 0 };
  }
  const user = { lat: Number(pos.coords.latitude), lng: Number(pos.coords.longitude) };
  const dist = distanceMeters(user, { lat: loc.lat, lng: loc.lng });
  const radius = loc.radiusMeters > 0 ? loc.radiusMeters : fallbackRadius;
  const buffer = Math.min(Number(pos.coords.accuracy || 0), ACCURACY_BUFFER_MAX);
  const ok = dist <= radius + buffer;
  return { ok, reason: ok ? "ok" : "too-far", loc, dist, radius, buffer };
}

/* ===== Format & source helpers ===== */
function cleanUrl(u = "") { return (String(u || "").trim().replace(/^['"]+|['"]+$/g, "") || null); }
function normFormat(x = "") {
  const s = String(x).toLowerCase();
  if (s.includes("webm")) return "webm";
  if (s.includes("mp4_sbs") || /sbs/.test(s)) return "mp4_sbs";
  if (s.includes("mp4")) return "mp4";
  return s;
}
function extFromUrl(u = "") {
  try { return (new URL(u).pathname.match(/\.([a-z0-9]+)$/i)?.[1] || "").toLowerCase(); }
  catch { return ""; }
}

// Firestore doc: { url, format }
function pickSourcesFromDoc(doc) {
  const out = { webm: null, mp4_sbs: null, mp4: null };
  const url = cleanUrl(doc?.url);
  if (!url) return out;

  const ext = extFromUrl(url);
  const hasSbsTag = /(?:^|[_-])sbs(?:[_-]|\.|$)/i.test(url) || /_sbs\.(mp4|mov)$/i.test(url);

  if (ext === "webm") out.webm = url;
  else if (ext === "mp4" || ext === "mov") { if (hasSbsTag) out.mp4_sbs = url; else out.mp4 = url; }

  if (!out.webm && !out.mp4_sbs && !out.mp4) {
    const fmt = normFormat(doc?.format || "");
    if (fmt === "webm") out.webm = url;
    else if (fmt === "mp4_sbs") out.mp4_sbs = url;
    else if (fmt === "mp4") out.mp4 = url;
  }

  dbg("pickSources:", out);
  return out;
}

/* ===== SBS эсэх ===== */
function isSbsVideo(doc, vEl) {
  const hint = String(doc?.alphaMode || doc?.format || "").toLowerCase();
  if (hint.includes("sbs")) return true;
  if (hint.includes("vp8")) return false;
  const tagStr = (doc?.name || "") + " " + (doc?.url || "");
  if (/(?:^|[_-])sbs(?:[_-]|\.|$)/i.test(tagStr)) return true;
  const w = vEl?.videoWidth || 0, h = vEl?.videoHeight || 0;
  if (w && h) { const r = w / h; if (r > 1.9 && r < 2.1) return true; }
  return false;
}

/* ---- Cloudinary seek hack ---- */
function isCloudinary(u) { try { return /res\.cloudinary\.com/.test(new URL(u).host); } catch { return false; } }
function withSeekHack(u) { if (!u) return u; return isCloudinary(u) ? u + (u.includes("#") ? "" : "#t=0.001") : u; }

/* Candidates for device */
function pickBestForDevice({ webm, mp4_sbs, mp4 }) {
  const v = document.createElement("video");
  const can = (t) => !!v.canPlayType && v.canPlayType(t).replace(/no/, "");

  const isiOSDevice = isIOS === true;

  if (isiOSDevice) {
    const list = [];
    if (mp4_sbs && can("video/mp4")) list.push({ url: mp4_sbs, type: "video/mp4", kind: "sbs" });
    if (mp4 && can("video/mp4")) list.push({ url: mp4, type: "video/mp4", kind: "flat" });
    return list;
  }

  const list = [];
  if (webm && (can('video/webm; codecs="vp8,opus"') || can("video/webm")))
    list.push({ url: webm, type: "video/webm", kind: "alpha" });
  if (mp4_sbs && can("video/mp4")) list.push({ url: mp4_sbs, type: "video/mp4", kind: "sbs" });
  if (mp4 && can("video/mp4")) list.push({ url: mp4, type: "video/mp4", kind: "flat" });
  return list;
}

/* ===== Robust video loader ===== */
async function setSourcesAwait(v, webm, mp4, mp4_sbs) {
  try { v.pause?.(); } catch {}
  v.removeAttribute("src");
  while (v.firstChild) v.removeChild(v.firstChild);

  v.muted = true;
  v.setAttribute("muted", "");
  v.playsInline = true;
  v.crossOrigin = "anonymous";
  v.preload = "auto";
  v.controls = false;

  makeVideoDecodeFriendly(v);

  if (isIOS === true) webm = null; // iOS дээр webm унтраах

  const base = pickBestForDevice({ webm, mp4_sbs, mp4 });
  if (!base.length) throw new Error("No playable sources for this device");

  const attempts = [];
  for (const c of base) {
    const plain = { ...c, label: c.kind + "|no-seek|sniff", url: c.url, type: null };
    const plainTyped = { ...c, label: c.kind + "|no-seek|typed", url: c.url, type: c.type };
    const seek = { ...c, label: c.kind + "|seek|sniff", url: withSeekHack(c.url), type: null };
    const seekTyped = { ...c, label: c.kind + "|seek|typed", url: withSeekHack(c.url), type: c.type };
    attempts.push(plain, plainTyped, seek, seekTyped);
  }

  function tryOnce({ url, type, label }) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("source");
      s.src = url;
      if (type) s.type = type;

      while (v.firstChild) v.removeChild(v.firstChild);
      v.appendChild(s);
      v.load();

      const TIMEOUT_MS = 15000;
      let done = false;

      const finishOk = () => {
        if (done) return;
        done = true;
        cleanup();
        v.dataset.srcType = type || "";
        dbg("VIDEO ok:", label, "rs=", v.readyState, "ns=", v.networkState);
        resolve(true);
      };
      const finishErr = (why) => {
        if (done) return;
        done = true;
        cleanup();
        dbg("VIDEO fail-one:", label, why);
        reject(new Error(why));
      };

      const to = setTimeout(() => finishErr("timeout"), TIMEOUT_MS);

      const onAbort = () => { dbg("VIDEO abort (ignore, keep waiting)"); };
      const onError = () => {
        if (v.networkState === 3 && v.readyState === 0) finishErr("NETWORK_NO_SOURCE");
        else finishErr("error");
      };
      const onCanPlay = () => finishOk();
      const onLoadedData = () => finishOk();
      const onCanPlayThrough = () => finishOk();

      const cleanup = () => {
        clearTimeout(to);
        v.removeEventListener("abort", onAbort);
        v.removeEventListener("error", onError);
        v.removeEventListener("stalled", onError);
        v.removeEventListener("canplay", onCanPlay);
        v.removeEventListener("canplaythrough", onCanPlayThrough);
        v.removeEventListener("loadeddata", onLoadedData);
        s.removeEventListener("error", onError);
      };

      v.addEventListener("abort", onAbort, { once: true });
      v.addEventListener("error", onError, { once: true });
      v.addEventListener("stalled", onError, { once: true });
      v.addEventListener("canplay", onCanPlay, { once: true });
      v.addEventListener("canplaythrough", onCanPlayThrough, { once: true });
      v.addEventListener("loadeddata", onLoadedData, { once: true });
      s.addEventListener("error", onError, { once: true });

      dbg("VIDEO try:", label, url);
      if (v.readyState >= 3) finishOk();
    });
  }
  let lastErr;
  for (const a of attempts) {
    try {
      await tryOnce(a);
      const kind =
        a.kind ||
        (a.type === "video/webm" ? "alpha" : a.label.includes("sbs") ? "sbs" : "flat");
      return kind;
    } catch (e) {
      logVideoError(v, "candidate");
      lastErr = e;
    }
  }
  throw lastErr || new Error("video load failed");
}

/* ===== Debug events ===== */
function wireVideoDebug(v, tag) {
  const log = (ev) =>
    dbg(`[${tag}]`, ev.type, "t=", (v.currentTime || 0).toFixed(2), "rs=", v.readyState, "ns=", v.networkState);
  [
    "loadstart", "loadedmetadata", "loadeddata", "canplay", "canplaythrough",
    "play", "playing", "pause", "waiting", "stalled", "suspend", "abort",
    "error", "ended", "timeupdate",
  ].forEach((t) => { v.addEventListener(t, log); });
  v.addEventListener("error", () => logVideoError(v, tag));
}

/* ===== Firestore queries ===== */
async function fetchLatestIntro() {
  const qs = [
    fsQuery(collection(db, "videos"), where("active", "==", true), where("isGlobal", "==", true), limit(1)),
    fsQuery(collection(db, "videos"), where("active", "==", true), where("name", "==", "intro"), limit(1)),
  ];
  for (const q of qs) {
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = { id: snap.docs[0].id, ...snap.docs[0].data() };
      dbg("Intro doc:", d.id, "format=", d.format, "url=", (d.url || "").slice(-32));
      return d;
    }
  }
  return null;
}

async function fetchLatestExerciseFor(locationId) {
  if (!locationId) return null;
  const q = fsQuery(
    collection(db, "videos"),
    where("active", "==", true),
    where("isGlobal", "==", false),
    where("locationIds", "array-contains", locationId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = { id: snap.docs[0].id, ...snap.docs[0].data() };
  dbg("Exercise doc:", d.id, "format=", d.format, "url=", (d.url || "").slice(-32));
  return d;
}

async function logScan({ phone, loc, pos, ua, decision }) {
  const uid = auth.currentUser?.uid || null;
  try {
    let locationName = null;
    if (loc) {
      const d = await getDoc(doc(db, "locations", loc)).catch(() => null);
      if (d?.exists()) locationName = d.data()?.name || null;
    }
    await addDoc(collection(db, "scans"), {
      uid,
      phone: phone || null,
      locId: loc || null,
      locationName: locationName || null,
      lat: Number(pos?.coords?.latitude ?? null),
      lng: Number(pos?.coords?.longitude ?? null),
      accuracy: Number(pos?.coords?.accuracy ?? 0),
      decision: decision || null,
      ua: String(ua || "").slice(0, 1000),
      source: "webar",
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("scan log failed:", e?.message || e);
  }
}

/* ===== phone_regs heartbeat ===== */
async function updateRegHeartbeat(phone, pos) {
  if (!phone) return;
  try {
    await setDoc(
      doc(db, "phone_regs", phone),
      {
        lastSeenAt: serverTimestamp(),
        lastQrId: QR_LOC_ID || null,
        lat: Number(pos?.coords?.latitude ?? null),
        lng: Number(pos?.coords?.longitude ?? null),
        accuracy: Number(pos?.coords?.accuracy ?? 0),
      },
      { merge: true }
    );
  } catch (e) { dbg("updateRegHeartbeat failed:", e?.code || e?.message || e); }
}

/* ---- DeviceKey (uid-с ангид) ---- */
async function makeDeviceKeyBytes() { const b = new Uint8Array(32); crypto.getRandomValues(b); return b; }
function b64(buf) { return btoa(String.fromCharCode(...buf)); }
function fromB64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function sha256Hex(bytes) {
  const dig = await crypto.subtle.digest("SHA-256", bytes);
  const arr = new Uint8Array(dig);
  return Array.from(arr).map((x) => x.toString(16).padStart(2, "0")).join("");
}
const LS_KEY = "webar_reg_key";

/** Анхны бүртгэлийн дараа төхөөрөмжийг phone-той холбоно */
async function bindDeviceToPhone(phone) {
  let devB64 = localStorage.getItem(LS_KEY);
  let devBytes;
  if (!devB64) {
    devBytes = await makeDeviceKeyBytes();
    devB64 = b64(devBytes);
    localStorage.setItem(LS_KEY, devB64);
  } else {
    devBytes = fromB64(devB64);
  }
  const hashHex = await sha256Hex(devBytes);

  await setDoc(doc(db, "device_keys", hashHex), { phone, createdAt: serverTimestamp() }, { merge: true });
  await setDoc(doc(db, "phone_regs", phone), { deviceKeyHashes: arrayUnion(hashHex) }, { merge: true });

  dbg("Device bound:", hashHex.slice(0, 12), "… =>", phone);
}

/** Орох болгонд deviceKey-оор бүртгэл шалгах */
async function getRegistrationByDeviceKey() {
  const devB64 = localStorage.getItem(LS_KEY);
  if (!devB64) return null;
  const hashHex = await sha256Hex(fromB64(devB64));
  const snap = await getDoc(doc(db, "device_keys", hashHex)).catch(() => null);
  if (snap?.exists()) {
    const d = snap.data() || {};
    const phone = d.phone || null;
    return phone ? { docId: phone, phone } : null;
  }
  return null;
}

/* ===== Локал төлөв ===== */
let REG_INFO = null;

/* ===== Phone gate ===== */
let gateWired = false;
let gateBusy = false;
function showPhoneGate() {
  otpGate.hidden = false;
  if (otpCodeWrap) otpCodeWrap.hidden = true;
  if (btnSendCode) btnSendCode.textContent = "Бүртгэх";
  if (gateWired) return;
  gateWired = true;

  btnSendCode?.addEventListener("click", async () => {
    if (gateBusy) return;
    gateBusy = true;
    btnSendCode.disabled = true;
    try {
      otpError.textcontent = "";
      const phone = normalizeMnPhone(otpPhoneEl.value.trim());
      if (!auth.currentUser) await signInAnonymously(auth).catch(() => {});

      // 1) GPS
      let pos;
      try {
        pos = await getGeoOnce({ enableHighAccuracy: true, timeout: 12000 });
        dbg("Gate position:", fmtLoc(pos));
      } catch (e) {
        otpError.textContent = e?.code === 1 ? "Байршлын зөвшөөрөл хэрэгтэй байна." : "Байршил олдсонгүй.";
        setTimeout(() => { otpError.textContent = ""; }, 3500);
        return;
      }

      // 2) Давхардсан эсэх
      const ref = doc(db, "phone_regs", phone);
      const snap = await getDoc(ref).catch(() => null);
      if (snap && snap.exists()) {
        await updateRegHeartbeat(phone, pos);

        const chkOld = await isWithinQrLocation(pos, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
        await logScan({
          phone, loc: QR_LOC_ID, pos, ua: navigator.userAgent,
          decision: { ok: chkOld.ok, dist: Math.round(chkOld.dist || 0), radius: chkOld.radius, buffer: Math.round(chkOld.buffer || 0), reason: chkOld.reason },
        });

        otpGate.hidden = true;
        otpPhoneEl.value = "";
        if (!window.__introStarted) { window.__introStarted = true; await startIntroFlow(true); }
        return;
      }

      // 3) ШИНЭ бүртгэл
      try {
        await setDoc(
          ref,
          {
            phone, uid: auth.currentUser?.uid || null, source: "webar",
            createdAt: serverTimestamp(), lastSeenAt: serverTimestamp(),
            ua: navigator.userAgent.slice(0, 1000),
            lat: Number(pos.coords.latitude), lng: Number(pos.coords.longitude),
            accuracy: Number(pos.coords.accuracy ?? 0),
            qrId: QR_LOC_ID || null, lastQrId: QR_LOC_ID || null,
          },
          { merge: false }
        );
        REG_INFO = { phone, docId: phone };
        await bindDeviceToPhone(phone);
      } catch (e) {
        console.error("setDoc failed:", e);
        otpError.textContent =
          e?.code === "permission-denied" ? "Бүртгэх эрх байхгүй байна (rules-аа шалгана уу)." : e?.message || "Бүртгэл амжилтгүй";
        setTimeout(() => { otpError.textContent = ""; }, 3500);
        return;
      }

      // 4) Лог
      const chk = await isWithinQrLocation(pos, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
      dbg("Gate decision:", chk);
      await logScan({
        phone, loc: QR_LOC_ID, pos, ua: navigator.userAgent,
        decision: { ok: chk.ok, dist: Math.round(chk.dist || 0), radius: chk.radius, buffer: Math.round(chk.buffer || 0), reason: chk.reason },
      });

      otpGate.hidden = true;
      otpPhoneEl.value = "";
      if (!window.__introStarted) { window.__introStarted = true; await startIntroFlow(true); }
    } catch (e) {
      console.error(e);
      otpError.textContent = e?.message || "Бүртгэл амжилтгүй";
      setTimeout(() => { otpError.textContent = ""; }, 3500);
    } finally {
      gateBusy = false;
      btnSendCode.disabled = false;
    }
  }, { passive: true });
}

/* ===== Init: gate эсвэл шууд оруулах ===== */
async function initGateOrAutoEnter() {
  // Boot дээр гео/камер асуухгүй
  let pos = null;

  const reg = await getRegistrationByDeviceKey();
  let chk = null;

  if (reg) {
    REG_INFO = reg;
    otpGate.hidden = true;
    try { await updateRegHeartbeat(reg.phone, pos); } catch {}
  } else {
    showPhoneGate();
  }

  await logScan({
    phone: reg?.phone || null,
    loc: QR_LOC_ID,
    pos,
    ua: navigator.userAgent,
    decision: chk ? {
      ok: chk.ok,
      dist: Math.round(chk.dist || 0),
      radius: chk.radius,
      buffer: Math.round(chk.buffer || 0),
      reason: chk.reason,
    } : null,
  });
}

/* ===== main ===== */
await initAR();

// Boot дээр автоматаар камера асаахгүй
await signInAnonymously(auth).catch(() => {});
makeVideoDecodeFriendly(vIntro);
makeVideoDecodeFriendly(vEx);
await initGateOrAutoEnter();

/* ===== iOS/Android: эхний tap дээр permission + camera + flow ===== */
tapLay.addEventListener("pointerdown", async () => {
  tapLay.style.display = "none";
  try {
    try {
      await ensurePermissionsGate(); // CAMERA + GEO-г нэг gesture-д
      dbg("Permission gate OK");
    } catch(e){
      dbg("Permission gate failed:", e?.message||e);
      alert(e?.message || "Зөвшөөрөл амжилтгүй.");
      tapLay.style.display = "flex";
      return;
    }

    try { await ensureCameraOnce(); } catch (e) { dbg("camera on tap:", e?.message || e); }

    if (!window.__introStarted) {
      window.__introStarted = true;
      await startIntroFlow(true);
    } else if (!introLoading && currentVideo) {
      await safePlay(currentVideo);
    }
  } catch (e) { dbg("after tap failed:", e?.message || e); }
});

/* ===== Меню товч ===== */
document.getElementById("mExercise")?.addEventListener("click", startExerciseDirect);

/* ===== Интро үед UI + frame safeguard ===== */
onFrame(() => {
  if (currentVideo === vIntro) updateIntroButtons();
  const v = currentVideo;
  if (v && v.readyState >= 2) {
    try { v.__threeVideoTex && (v.__threeVideoTex.needsUpdate = true); } catch {}
  }
});

/* ===== iOS autoplay/visibility хамгаалалт ===== */
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && currentVideo) {
    try { await safePlay(currentVideo); } catch {}
  }
});
window.addEventListener("pageshow", async () => {
  if (currentVideo && currentVideo.paused) {
    try { await safePlay(currentVideo); } catch {}
  }
});

/* ===== Plane visibility helpers (anti-white-flash) ===== */
function hidePlane() {
  import("./ar.js").then(({ plane }) => {
    if (!plane) return;
    plane.visible = false;
    if (plane.material) {
      plane.material.colorWrite = false;
      plane.material.opacity = 0;
      plane.material.needsUpdate = true;
    }
  });
}
async function revealPlaneWhenReady(v) {
  try {
    await waitReady(v, 2);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  } catch {}
  import("./ar.js").then(({ plane }) => {
    if (!plane) return;
    if (plane.material) {
      plane.material.colorWrite = true;
      plane.material.opacity = 1;
      plane.material.needsUpdate = true;
    }
    plane.visible = true;
  });
}

/* ===== Flows ===== */
async function startIntroFlow(fromTap = false) {
  if (introLoading) return;
  introLoading = true;
  try {
    wireVideoDebug(vIntro, "intro");
    bindIntroButtons(vIntro);

    try { await ensureCameraOnce(); }
    catch (e) { dbg("camera start failed:", e?.message || e); return; }

    const introDoc = await fetchLatestIntro();
    if (!introDoc) {
      dbg("No global intro video → try starting exercise directly");
      if (QR_LOC_ID) {
        const posNow = await getGeoOnce({ enableHighAccuracy: true, timeout: 12000 }).catch(() => null);
        const chk = await isWithinQrLocation(posNow, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
        if (chk.ok) { await startExerciseDirect(); }
        else { dbg(`Exercise locked: not within location. dist=${Math.round(chk?.dist || -1)} > allowed=${chk?.radius}+${Math.round(chk?.buffer || 0)}`); }
      }
      return;
    }
    const introSrc = pickSourcesFromDoc(introDoc);
    dbg("Intro sources:", introSrc);

    // Exercise prefetch (GPS≈QR)
    let exDoc = null, exSrc = null, posNow = null, chk = null;
    if (QR_LOC_ID) {
      posNow = await getGeoOnce({ enableHighAccuracy: true, timeout: 12000 }).catch(() => null);
      if (posNow) dbg("IntroFlow pos:", fmtLoc(posNow));
      chk = await isWithinQrLocation(posNow, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
      dbg("IntroFlow within?", chk);
      if (chk.ok) {
        exDoc = await fetchLatestExerciseFor(QR_LOC_ID);
        if (exDoc) { exSrc = pickSourcesFromDoc(exDoc); dbg("Exercise sources:", exSrc); }
      } else {
        const name = chk?.loc?.name || QR_LOC_ID;
        dbg(`Exercise locked: need near "${name}". dist=${Math.round(chk?.dist || -1)} > allowed=${chk?.radius}+${Math.round(chk?.buffer || 0)}`);
      }
    } else {
      dbg("QR loc not provided → exercise prefetch disabled");
    }

    // Load intro (+prefetch exercise)
    const introKind = await setSourcesAwait(vIntro, introSrc.webm, introSrc.mp4, introSrc.mp4_sbs);
    if (exSrc) await setSourcesAwait(vEx, exSrc.webm, exSrc.mp4, exSrc.mp4_sbs);

    if (vIntro.readyState < 1) { await new Promise((r) => vIntro.addEventListener("loadedmetadata", r, { once: true })); }
    const texIntro = videoTexture(vIntro);
    texIntro.needsUpdate = true;
    vIntro.__threeVideoTex = texIntro;

    hidePlane();

    // opaque sniff
    let useIntroKind = introKind;
    const looksOpaqueIntro = await videoLooksOpaque(vIntro);
    if (looksOpaqueIntro && useIntroKind === "alpha") useIntroKind = "flat";

    // === Material select → CHROMA KEY default ===
    if (useIntroKind === "alpha") {
      planeUseMap(texIntro); // VP8/HEVC alpha
    } else {
      planeUseChroma(texIntro, { keyColor: 0x00ff00, similarity: 0.32, smoothness: 0.08, spill: 0.18 });
    }

    fitPlaneToVideo(vIntro);

    currentVideo = vIntro;

    try { vIntro.muted = false; await safePlay(vIntro); btnUnmute.style.display = "none"; } catch {}
    if (vIntro.paused) {
      try { vIntro.muted = true; await safePlay(vIntro); btnUnmute.style.display = "inline-block"; } catch {}
    }

    applyScale();
    dbg("intro playing…");

    await revealPlaneWhenReady(vIntro);

    try {
      startGeoWatch((pos, err) => {
        if (err) { dbg("GPS watch error:", err?.message || err); return; }
        dbg("Watch", fmtLoc(pos));
      });
    } catch (e) { dbg("GPS watch failed:", e?.message || e); }

    vIntro.onended = () => {
      try { ["ibExercise", "ibGrowth", "ibKnowledge"].forEach((id) => document.getElementById(id)?.classList.add("mini")); } catch {}
      showMenuOverlay();
      dbg("intro ended → menu shown; sticky UI");
    };
  } finally { introLoading = false; }
}

async function startExerciseDirect() {
  if (exLoading) return;
  exLoading = true;
  try {
    wireVideoDebug(vEx, "exercise");
    closeMenu();
    stopIntroButtons();
    stopGeoWatch();

    try { await ensureCameraOnce(); } catch (e) { dbg("camera start failed:", e?.message || e); return; }

    try { currentVideo?.pause?.(); } catch {}

    const posNow = await getGeoOnce({ enableHighAccuracy: true, timeout: 12000 }).catch(() => null);
    if (posNow) dbg("Exercise pos:", fmtLoc(posNow));
    const chk = await isWithinQrLocation(posNow, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
    dbg("Exercise within?", chk);
    if (!chk.ok) {
      dbg(`Exercise locked: not within location. dist=${Math.round(chk?.dist || -1)} > allowed=${chk?.radius}+${Math.round(chk?.buffer || 0)}`);
      return;
    }

    const exDoc = await fetchLatestExerciseFor(QR_LOC_ID);
    if (!exDoc) { dbg("No exercise video for this location"); return; }
    const exSrc = pickSourcesFromDoc(exDoc);
    dbg("Exercise sources:", exSrc);

    const exKind = await setSourcesAwait(vEx, exSrc.webm, exSrc.mp4, exSrc.mp4_sbs);

    if (vEx.readyState < 1) { await new Promise((r) => vEx.addEventListener("loadedmetadata", r, { once: true })); }
    const texEx = videoTexture(vEx);
    texEx.needsUpdate = true;
    vEx.__threeVideoTex = texEx;

    hidePlane();

    let useExKind = exKind;
    const looksOpaqueEx = await videoLooksOpaque(vEx);
    if (looksOpaqueEx && useExKind === "alpha") useExKind = "flat";

    // === Material select → CHROMA KEY default ===
    if (useExKind === "alpha") {
      planeUseMap(texEx);
    } else {
      planeUseChroma(texEx, { keyColor: 0x00ff00, similarity: 0.32, smoothness: 0.08, spill: 0.18 });
    }

    fitPlaneToVideo(vEx);

    vEx.currentTime = 0;
    currentVideo = vEx;

    try { vEx.muted = false; await safePlay(vEx); btnUnmute.style.display = "none"; } catch {}
    if (vEx.paused) {
      try { vEx.muted = true; await safePlay(vEx); btnUnmute.style.display = "inline-block"; } catch {}
    }

    await revealPlaneWhenReady(vEx);

    dbg("exercise playing (AR, no menu).");
  } finally { exLoading = false; }
}

/* ===== texture→material ===== */
function planeUseMap(tex) {
  import("./ar.js").then(({ plane }) => {
    plane.material.map = tex;
    plane.material.transparent = true;
    plane.material.depthWrite = false;
    plane.material.alphaTest = 0.01;
    plane.material.opacity = 1;
    plane.material.needsUpdate = true;
  });
}
function planeUseShader(tex) { // SBS-alpha үед
  import("./ar.js").then(({ plane, makeSbsAlphaMaterial }) => {
    plane.material?.dispose?.();
    plane.material = makeSbsAlphaMaterial(tex);
    plane.material.transparent = true;
    plane.material.depthWrite = false;
    plane.material.needsUpdate = true;
  });
}
function planeUseChroma(tex, opts) {
  import("./ar.js").then(({ plane, makeChromaKeyMaterial }) => {
    plane.material?.dispose?.();
    plane.material = makeChromaKeyMaterial(tex, opts);
    plane.material.transparent = true;
    plane.material.depthWrite = false;
    plane.material.needsUpdate = true;
  });
}

/* ===== Unmute ===== */
btnUnmute.addEventListener("click", async () => {
  try {
    if (!currentVideo) return;
    currentVideo.muted = false;
    await safePlay(currentVideo);
    btnUnmute.style.display = "none";
  } catch {
    dbg("unmute failed");
  }
});

/* ===== Overlay-аас дуудах боломжтой болгож window дээр экспортлоё ===== */
window.ensurePermissionsGate = ensurePermissionsGate;
window.ensureCameraOnce = ensureCameraOnce;
window.startIntroFlow = startIntroFlow;
window.__appReady = true;
