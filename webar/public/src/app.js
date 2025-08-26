// src/app.js
import { isIOS, dbg } from "./utils.js";
import {
  initAR, ensureCamera, onFrame,
  videoTexture, fitPlaneToVideo, applyScale,
} from "./ar.js";
import {
  bindIntroButtons, updateIntroButtons,
  showMenuOverlay, closeMenu, stopIntroButtons,
} from "./ui.js";

// ======= Тохиргоо =======
const ALLOW_DUPLICATE_TO_ENTER = false; // давхар бүртгэлтэй дугаар ч орж болох эсэх
const DEFAULT_LOC_RADIUS_M = 200;       // QR байршил тойргийн default радиус (метр)

// 🔗 Firebase (ESM CDN) + local config
import { firebaseConfig } from "./firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, serverTimestamp,
  // ↓ Firestore queries/collections
  collection, addDoc, getDoc, getDocs,
  query as fsQuery, where, orderBy, limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ========= Geolocation helpers ========= */
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
  return `GPS: lat=${latitude?.toFixed(6)} lng=${longitude?.toFixed(6)} ±${Math.round(accuracy || 0)}m`;
}

/* ========= Query параметр ========= */
function getQueryParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name) || "";
}
const QR_LOC_ID = getQueryParam("loc") || "";  // QR-ээс ирсэн locationId

/* ========= Phone normalize (MN) ========= */
function normalizeMnPhone(raw = "") {
  const digits = String(raw).replace(/\D/g, "");
  if (/^\+976\d{8}$/.test(raw)) return raw;
  if (/^\d{8}$/.test(digits))   return `+976${digits}`;
  if (/^\+?[1-9]\d{7,14}$/.test(raw)) return raw.startsWith("+") ? raw : `+${raw}`;
  throw new Error("Утасны дугаар буруу байна. (+976XXXXXXXX хэлбэр)");
}

/* ========= DOM ========= */
const vIntro = document.getElementById("vidIntro");
const vEx    = document.getElementById("vidExercise");
const btnUnmute = document.getElementById("btnUnmute");
const tapLay = document.getElementById("tapToStart");

/* ✅ Gate overlay (form) */
const otpGate     = document.getElementById("otpGate");
const otpPhoneEl  = document.getElementById("otpPhone");
const btnSendCode = document.getElementById("btnSendCode");
const otpCodeWrap = document.getElementById("otpCodeWrap");
const otpError    = document.getElementById("otpError");

let currentVideo = null;

/* ========= Firebase ========= */
const fbApp = initializeApp(firebaseConfig);
const auth  = getAuth(fbApp);
const db    = getFirestore(fbApp);

/* ========= Location match helpers (NEW) ========= */
async function fetchLocationById(id){
  if (!id) return null;
  const d = await getDoc(doc(db, "locations", id)).catch(() => null);
  if (!d?.exists()) return null;
  const { lat, lng, name, radiusMeters } = d.data() || {};
  return {
    id: d.id,
    name: name || null,
    lat: Number(lat),
    lng: Number(lng),
    radiusMeters: Number(radiusMeters || 0)
  };
}

function distanceMeters(a, b){
  const R = 6371000;
  const toRad = (x)=> x*Math.PI/180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function isWithinQrLocation(pos, qrLocId, fallbackRadius=DEFAULT_LOC_RADIUS_M){
  const loc = await fetchLocationById(qrLocId);
  if (!loc || !pos?.coords) {
    return { ok:false, reason: (!loc ? "loc-missing" : "gps-missing"), loc, dist:null, radius:fallbackRadius };
  }
  const user = { lat: Number(pos.coords.latitude), lng: Number(pos.coords.longitude) };
  const dist = distanceMeters(user, { lat: loc.lat, lng: loc.lng });
  const radius = loc.radiusMeters > 0 ? loc.radiusMeters : fallbackRadius;
  return { ok: dist <= radius, reason: dist <= radius ? "ok" : "too-far", loc, dist, radius };
}

/* ========= Video: Sources + robust load ========= */
// sources нэмж, canplay/error-г найдвартай сонсоно
async function setSourcesAwait(v, webm, mp4, forceMp4 = false) {
  try { v.pause(); } catch {}
  v.removeAttribute("src");
  while (v.firstChild) v.removeChild(v.firstChild);

  // autoplay-д бэлдэх (зарим Chrome-д muted property + attribute хоёулаа хэрэгтэй)
  v.muted = true;
  v.setAttribute("muted", "");
  v.playsInline = true;
  v.crossOrigin = "anonymous";
  v.preload = "auto";

  const pickMp4 = forceMp4 || !webm;
  const first = pickMp4 ? mp4 : webm;
  const firstType = pickMp4 ? "video/mp4" : "video/webm";
  const alt = pickMp4 ? webm : mp4;
  const altType = pickMp4 ? "video/webm" : "video/mp4";

  const add = (url, type) => {
    if (!url) return;
    const s = document.createElement("source");
    s.src = url; s.type = type;
    v.appendChild(s);
  };

  add(first, firstType);
  add(alt, altType); // fallback source

  v.load();

  // canplay эсвэл error-г хүлээнэ
  await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error("video load timeout")), 12000);
    const onReady = () => { cleanup(); res(); };
    const onErr = () => { cleanup(); rej(new Error("video load failed")); };
    const cleanup = () => {
      clearTimeout(to);
      v.removeEventListener("canplay", onReady);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("error", onErr);
      v.removeEventListener("stalled", onErr);
      v.removeEventListener("abort", onErr);
    };
    v.addEventListener("canplay", onReady, { once: true });
    v.addEventListener("loadeddata", onReady, { once: true });
    v.addEventListener("error", onErr, { once: true });
    v.addEventListener("stalled", onErr, { once: true });
    v.addEventListener("abort", onErr, { once: true });
  });
}

// Autoplay-г найдвартай эхлүүлэх utility
async function tryPlayAutoplay(v, { showTap = true } = {}) {
  try {
    await v.play();
    return true;
  } catch {
    if (showTap) {
      tapLay.style.display = "grid";
      const onTap = async () => {
        tapLay.style.display = "none";
        try { await v.play(); } catch {}
        tapLay.removeEventListener("pointerdown", onTap);
      };
      tapLay.addEventListener("pointerdown", onTap, { once: true });
    }
    return false;
  }
}

// Видео дебаг (шаардлагатай бол дуудаад лог хар)
function wireVideoDebug(v, tag) {
  const log = (ev) => dbg(`${tag}: ${ev.type}`);
  ["loadedmetadata","canplay","play","playing","pause","waiting","stalled","error","ended"].forEach(t => {
    v.addEventListener(t, log);
  });
}

/* ========= Firestore: видео татах ========= */
// doc → {webm, mp4} сонголт гаргах
function pickSourcesFromDoc(v) {
  if (v?.url && v?.format) {
    return {
      webm: v.format === "webm" ? v.url : null,
      mp4 : v.format === "mp4"  ? v.url : null,
    };
  }
  if (v?.urls) return { webm: v.urls.webm || null, mp4: v.urls.mp4 || null };
  return { webm: null, mp4: null };
}

// Global intro (isGlobal == true), хамгийн сүүлийнх
// Global intro: хамгийн идэвхтэй глобал нь ганцхан байна гэсэн дүрэмтэй байгаад limit(1)
async function fetchLatestIntro() {
  const col = collection(db, "videos");
  const q = fsQuery(
    col,
    where("active", "==", true),
    where("isGlobal", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// Байршлын exercise: uploadedAt/orderBy-гүй, зөвхөн шүүлтүүр + limit(1)
async function fetchLatestExerciseFor(locationId) {
  if (!locationId) return null;
  const col = collection(db, "videos");
  const q = fsQuery(
    col,
    where("active", "==", true),
    where("isGlobal", "==", false),
    where("locationIds", "array-contains", locationId),
    // Хэрвээ илүү найдвартай хүсвэл энд where("isCurrent","==",true) нэмэж болно
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}


/* ========= Scan LOG ========= */
async function logScan({ phone, loc, pos, ua, decision }) {
  try {
    let locationName = null;
    if (loc) {
      const d = await getDoc(doc(db, "locations", loc)).catch(() => null);
      if (d?.exists()) locationName = d.data()?.name || null;
    }
    await addDoc(collection(db, "scans"), {
      phone,
      locId: loc || null,
      locationName: locationName || null,
      lat: Number(pos?.coords?.latitude ?? null),
      lng: Number(pos?.coords?.longitude ?? null),
      accuracy: Number(pos?.coords?.accuracy ?? null),
      decision: decision || null, // { ok, dist, radius, reason }
      ua: String(ua || "").slice(0, 1000),
      source: "webar",
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("scan log failed:", e?.message || e);
  }
}

/* ========= Phone gate (overlay form) ========= */
let gateWired = false;
function showPhoneGate() {
  otpGate.hidden = false;
  if (otpCodeWrap) otpCodeWrap.hidden = true;
  if (btnSendCode) btnSendCode.textContent = "Бүртгэх";
  if (gateWired) return;
  gateWired = true;

  btnSendCode?.addEventListener("click", async () => {
    let busy = false;
    if (busy) return;
    try {
      busy = true;
      btnSendCode.disabled = true;

      otpError.textContent = "";
      const phone = normalizeMnPhone(otpPhoneEl.value.trim());

      // Anonymous sign-in
      if (!auth.currentUser) await signInAnonymously(auth).catch(() => {});

      // 1) Байршлыг авах
      let pos;
      try {
        pos = await getGeoOnce({ enableHighAccuracy: true, timeout: 12000 });
      } catch (e) {
        otpError.textContent =
          e?.code === 1
            ? "Байршлын зөвшөөрөл хэрэгтэй байна. Browser-ийнхаа Location-г асаагаад дахин оролдоно уу."
            : "Байршил олдсонгүй. GPS-ээ асаагаад дахин туршина уу.";
        setTimeout(() => { otpError.textContent = ""; }, 3500);
        return;
      }

      // 2) phone_regs — НЭГ удаагийн бүртгэл
      try {
        await setDoc(
          doc(db, "phone_regs", phone),
          {
            phone,
            source: "webar",
            createdAt: serverTimestamp(),
            ua: navigator.userAgent.slice(0, 1000),
            lat: Number(pos.coords.latitude),
            lng: Number(pos.coords.longitude),
            accuracy: Number(pos.coords.accuracy ?? 0),
            qrId: QR_LOC_ID || null, // аль QR/байршлыг уншуулсан
          },
          { merge: false }
        );
      } catch (e) {
        if (e?.code === "permission-denied") {
          // аль хэдийн бүртгэлтэй
          otpError.textContent = "Энэ дугаар аль хэдийн бүртгэлтэй байна.";
          setTimeout(() => { otpError.textContent = ""; }, 2200);

          if (ALLOW_DUPLICATE_TO_ENTER) {
            otpGate.hidden = true;
            otpPhoneEl.value = "";
            if (!window.__introStarted) {
              window.__introStarted = true;
              await startIntroFlow(true);
            }
          }
          // бүртгэл давхардуулсан ч доор scan-аа LOG хийж болно:
          const chkOld = await isWithinQrLocation(pos, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
          await logScan({ phone, loc: QR_LOC_ID, pos, ua: navigator.userAgent, decision: {
            ok: chkOld.ok, dist: Math.round(chkOld.dist || 0), radius: chkOld.radius, reason: chkOld.reason
          }});
          return;
        }
        throw e;
      }

      // 3) Уншуулсан бүрийг LOG хийнэ (+ decision)
      const chk = await isWithinQrLocation(pos, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
      await logScan({ phone, loc: QR_LOC_ID, pos, ua: navigator.userAgent, decision: {
        ok: chk.ok, dist: Math.round(chk.dist || 0), radius: chk.radius, reason: chk.reason
      }});

      // 4) Амжилттай → AR эхлүүлнэ
      otpGate.hidden = true;
      otpPhoneEl.value = "";
      if (!window.__introStarted) {
        window.__introStarted = true;
        await startIntroFlow(true);
      }
    } catch (e) {
      console.error(e);
      otpError.textContent = e?.message || "Бүртгэл амжилтгүй";
      setTimeout(() => { otpError.textContent = ""; }, 3500);
    } finally {
      busy = false;
      btnSendCode.disabled = false;
    }
  }, { passive: true });
}

/* ========= main ========= */
await initAR();
signInAnonymously(auth).catch(() => {}); // optional

// GPS нэг удаа авч debug-д
try {
  const pos = await getGeoOnce().catch(() => null);
  if (pos) dbg(fmtLoc(pos));
} catch {}

// ✅ Эхлээд форм
showPhoneGate();

// Tap-to-start fallback (интро аль хэдийн эхэлсэн үед л хэрэгтэй)
tapLay.addEventListener("pointerdown", async () => {
  tapLay.style.display = "none";
  try { if (window.__introStarted) await startIntroFlow(true); }
  catch (e) { dbg("after tap failed: " + (e?.message || e)); }
});

// Меню товч
document.getElementById("mExercise")?.addEventListener("click", startExerciseDirect);

// Интро үед world-tracked UI-г хөдөлгөнө
onFrame(() => { if (currentVideo === vIntro) updateIntroButtons(); });

/* ========= Flows ========= */
async function startIntroFlow(fromTap = false) {
  bindIntroButtons(vIntro);

  // Камерын зөвшөөрөл
  try { await ensureCamera(); }
  catch (e) { dbg("camera start failed: " + (e?.message || e)); return; }

  // 🔹 Firestore-оос видеонуудыг татна
  const introDoc = await fetchLatestIntro();
  if (!introDoc) { dbg("No global intro video"); return; }
  const introSrc = pickSourcesFromDoc(introDoc);

  // --- Exercise-г өмнө нь GPS≈QR шалгаад л ачаална
  let exDoc = null;
  let exSrc = null;
  let posNow = null;
  let chk = null;

  if (QR_LOC_ID) {
    posNow = await getGeoOnce({ enableHighAccuracy:true, timeout: 12000 }).catch(() => null);
    chk = await isWithinQrLocation(posNow, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
    if (chk.ok) {
      exDoc = await fetchLatestExerciseFor(QR_LOC_ID);
      if (exDoc) exSrc = pickSourcesFromDoc(exDoc);
    } else {
      dbg(`Exercise locked: need to be near "${chk?.loc?.name || QR_LOC_ID}". dist=${Math.round(chk?.dist || -1)}m ≤ ${chk?.radius}m`);
    }
  } else {
    dbg("QR loc not provided → exercise байхгүй");
  }

  // Видеог бүрэн ачаалдтал нь хүлээнэ
  await setSourcesAwait(vIntro, introSrc.webm, introSrc.mp4, isIOS);
  if (exSrc) await setSourcesAwait(vEx, exSrc.webm, exSrc.mp4, isIOS);

  const texIntro = videoTexture(vIntro);
  if (isIOS) {
    vIntro.hidden = false;
    vIntro.onloadedmetadata = () => fitPlaneToVideo(vIntro);
    planeUseShader(texIntro);
  } else {
    planeUseMap(texIntro);
    if (vIntro.readyState >= 1) fitPlaneToVideo(vIntro);
    else vIntro.addEventListener("loadedmetadata", () => fitPlaneToVideo(vIntro), { once: true });
  }

  currentVideo = vIntro;

  // Autoplay policy-д тааруулж эхлүүлэх
  try {
    vIntro.muted = false; await vIntro.play(); btnUnmute.style.display = "none";
  } catch {
    try { vIntro.muted = true; await vIntro.play(); btnUnmute.style.display = "inline-block"; }
    catch (e) { if (!fromTap) { tapLay.style.display = "grid"; throw e; } }
  }

  applyScale();
  dbg("intro playing");

  // Интро явж байх хугацаанд GPS watch
  try {
    startGeoWatch((pos, err) => {
      if (err) { dbg("GPS watch error: " + (err?.message || err)); return; }
      dbg(fmtLoc(pos));
    });
  } catch (e) { dbg("GPS watch failed: " + (e?.message || e)); }

  // Интро дуусмагц меню
  vIntro.onended = () => {
    try { ["ibExercise","ibGrowth","ibKnowledge"].forEach(id => document.getElementById(id)?.classList.add("mini")); } catch {}
    showMenuOverlay();
    dbg("intro ended → menu shown; intro buttons sticky.");
  };
}

async function startExerciseDirect() {
  closeMenu();
  stopIntroButtons();
  stopGeoWatch();

  // Камер зөвшөөрөл
  try { await ensureCamera(); }
  catch (e) { dbg("camera start failed: " + (e?.message || e)); return; }

  try { currentVideo?.pause?.(); } catch {}

  // Дахин GPS≈QR шалгана
  const posNow = await getGeoOnce({ enableHighAccuracy:true, timeout:12000 }).catch(() => null);
  const chk = await isWithinQrLocation(posNow, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
  if (!chk.ok) {
    dbg(`Exercise locked: not within location. dist=${Math.round(chk?.dist || -1)}m ≤ ${chk?.radius}m`);
    return;
  }

  // Байршлын exercise-г Firestore-оос
  const exDoc = await fetchLatestExerciseFor(QR_LOC_ID);
  if (!exDoc) { dbg("No exercise video for this location"); return; }
  const exSrc = pickSourcesFromDoc(exDoc);

  await setSourcesAwait(vEx, exSrc.webm, exSrc.mp4, isIOS);
  const texEx = videoTexture(vEx);
  if (isIOS) planeUseShader(texEx); else planeUseMap(texEx);

  if (vEx.readyState >= 1) fitPlaneToVideo(vEx);
  else await new Promise((r) => vEx.addEventListener("loadedmetadata", () => { fitPlaneToVideo(vEx); r(); }, { once: true }));

  vEx.currentTime = 0; currentVideo = vEx;

  try { vEx.muted = false; await vEx.play(); btnUnmute.style.display = "none"; }
  catch { try { vEx.muted = true; await vEx.play(); btnUnmute.style.display = "inline-block"; } catch {} }

  dbg("exercise playing (AR, no menu).");
}

/* ========= helpers (texture→material) ========= */
function planeUseMap(tex) {
  import("./ar.js").then(({ plane }) => {
    plane.material.map = tex;
    plane.material.transparent = true;
    plane.material.needsUpdate = true;
  });
}
function planeUseShader(tex) {
  import("./ar.js").then(({ plane, makeSbsAlphaMaterial }) => {
    plane.material?.dispose?.();
    plane.material = makeSbsAlphaMaterial(tex);
    plane.material.needsUpdate = true;
  });
}

/* ========= Unmute ========= */
btnUnmute.addEventListener("click", async () => {
  try {
    if (!currentVideo) return;
    currentVideo.muted = false;
    await currentVideo.play();
    btnUnmute.style.display = "none";
  } catch { dbg("unmute failed"); }
});
