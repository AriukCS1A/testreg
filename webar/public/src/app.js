// src/app.js
import {
  INTRO_WEBM_URL,
  INTRO_MP4_URL,
  EXERCISE_WEBM_URL,
  EXERCISE_MP4_URL,
} from "./config.js";
import { isIOS, dbg } from "./utils.js";
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

// ======= Тохиргоо =======
const ALLOW_DUPLICATE_TO_ENTER = false; // давхардсан дугаар оруулсан үед AR руу оруулах эсэх

// 🔗 Firebase (ESM CDN) + таны local config
import { firebaseConfig } from "./firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
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

/* ========= Video sources – canplay хүртэл хүлээнэ ========= */
async function setSourcesAwait(v, webm, mp4, forceMp4 = false) {
  try { v.pause(); } catch {}
  v.removeAttribute("src");
  while (v.firstChild) v.removeChild(v.firstChild);
  v.load();

  const ss = [];
  if (!forceMp4 && webm) { const s = document.createElement("source"); s.src = webm; s.type = "video/webm"; ss.push(s); }
  if (mp4)                { const s = document.createElement("source"); s.src = mp4; s.type = "video/mp4"; ss.push(s); }
  ss.forEach((s) => v.appendChild(s));

  await new Promise((res, rej) => {
    const onErr = () => rej(new Error("video load failed"));
    v.addEventListener("error", onErr, { once: true });
    if (v.readyState >= 3) res();
    else v.addEventListener("canplay", () => res(), { once: true });
  });
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

      // Anonymous sign-in (нэг удаа хангалттай)
      if (!auth.currentUser) await signInAnonymously(auth).catch(() => {});

      // 1) Байршлыг заавал авна
      let loc;
      try {
        loc = await getGeoOnce({ enableHighAccuracy: true, timeout: 12000 });
      } catch (e) {
        otpError.textContent =
          e?.code === 1
            ? "Байршлын зөвшөөрөл хэрэгтэй байна. Browser-ийнхаа Location-г асаагаад дахин оролдоно уу."
            : "Байршил олдсонгүй. GPS-ээ асаагаад дахин туршина уу.";
        setTimeout(() => { otpError.textContent = ""; }, 3500);
        return;
      }

      // 2) Координатыг шалгана
      const { latitude, longitude, accuracy } = loc.coords || {};
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        otpError.textContent = "Байршил буруу байна. Дахин оролдоно уу.";
        setTimeout(() => { otpError.textContent = ""; }, 3500);
        return;
      }

      // 3) Firestore — doc ID = phone (давхардал барина)
      try {
        await setDoc(
          doc(db, "phone_regs", phone),
          {
            phone,
            source: "webar",
            createdAt: serverTimestamp(),
            ua: navigator.userAgent.slice(0, 1000),
            lat: Number(latitude),
            lng: Number(longitude),
            accuracy: Number(accuracy ?? 0),
          },
          { merge: false }
        );
      } catch (e) {
        // Давхардсан үед update тооцогдоод rules-оор хориглоно → permission-denied
        if (e?.code === "permission-denied") {
          otpError.textContent = "Энэ дугаар аль хэдийн бүртгэлтэй байна.";
          setTimeout(() => { otpError.textContent = ""; }, 2200);

          if (ALLOW_DUPLICATE_TO_ENTER) {
            // Давхардсан ч AR руу оруулна
            otpGate.hidden = true;
            otpPhoneEl.value = "";
            if (!window.__introStarted) {
              window.__introStarted = true;
              await startIntroFlow(true);
            }
          }
          return;
        }
        throw e; // бусад алдаа хэвийн урсгалаар гараг
      }

      // Амжилттай → form хааж AR эхлүүлнэ
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

// Урьдчилж anonymous оролдоно (заавал биш)
signInAnonymously(auth).catch(() => {});

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

  // Камерын зөвшөөрөлгүй бол цааш үргэлжлүүлэхгүй
  try { await ensureCamera(); }
  catch (e) { dbg("camera start failed: " + (e?.message || e)); return; }

  // Видеог бүрэн ачаалдтал нь хүлээж байж texture үүсгэнэ
  await setSourcesAwait(vIntro, INTRO_WEBM_URL, INTRO_MP4_URL, isIOS);
  await setSourcesAwait(vEx,    EXERCISE_WEBM_URL, EXERCISE_MP4_URL, isIOS);

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

  // Камер зөвшөөрөлгүй бол үргэлжлүүлэхгүй
  try { await ensureCamera(); }
  catch (e) { dbg("camera start failed: " + (e?.message || e)); return; }

  try { currentVideo?.pause?.(); } catch {}

  await setSourcesAwait(vEx, EXERCISE_WEBM_URL, EXERCISE_MP4_URL, isIOS);
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
