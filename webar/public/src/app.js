// src/app.js
import { isIOS, dbg as _dbg } from "./utils.js";
import {
  initAR, ensureCamera, onFrame,
  videoTexture, fitPlaneToVideo, applyScale,
} from "./ar.js";
import {
  bindIntroButtons, updateIntroButtons,
  showMenuOverlay, closeMenu, stopIntroButtons,
} from "./ui.js";

// ------- dbg wrapper (prefix-тай) -------
const dbg = (...a) => _dbg ? _dbg("[AR]", ...a) : console.log("[AR]", ...a);

// ==== Swallow "play() was interrupted by a new load request" globally ====
window.addEventListener("unhandledrejection", (e) => {
  const r = e?.reason;
  const msg = String(r?.message || r || "");
  if (r?.name === "AbortError" || /play\(\) request was interrupted/i.test(msg)) {
    e.preventDefault();
    dbg("Ignored AbortError from play():", msg);
  }
});

// ======= Тохиргоо =======
const ALLOW_DUPLICATE_TO_ENTER = false;
const DEFAULT_LOC_RADIUS_M = 200;
const ACCURACY_BUFFER_MAX = 75;

// 🔗 Firebase (ESM CDN)
import { firebaseConfig } from "./firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, serverTimestamp,
  collection, addDoc, getDoc, getDocs,
  query as fsQuery, where, limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ========= Geolocation helpers ========= */
let geoWatchId = null;
function canGeolocate(){ return "geolocation" in navigator; }
function getGeoOnce(options = {}){
  if (!canGeolocate()) return Promise.reject(new Error("Geolocation not supported"));
  const opts = { enableHighAccuracy:true, timeout:10000, maximumAge:0, ...options };
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}
function startGeoWatch(onUpdate, options = {}){
  if (!canGeolocate()) throw new Error("Geolocation not supported");
  const opts = { enableHighAccuracy:true, timeout:20000, maximumAge:5000, ...options };
  if (geoWatchId != null) stopGeoWatch();
  geoWatchId = navigator.geolocation.watchPosition(
    (pos)=> onUpdate?.(pos, null),
    (err)=> onUpdate?.(null, err),
    opts
  );
}
function stopGeoWatch(){
  if (geoWatchId != null && navigator.geolocation?.clearWatch) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}
function fmtLoc(pos){
  if (!pos) return "";
  const { latitude, longitude, accuracy } = pos.coords || {};
  return `GPS lat=${latitude?.toFixed(6)} lng=${longitude?.toFixed(6)} ±${Math.round(accuracy||0)}m`;
}

/* ========= Query param ========= */
function getQueryParam(name){
  const u = new URL(window.location.href);
  return u.searchParams.get(name) || "";
}
const QR_LOC_ID = getQueryParam("loc") || "";
dbg("QR loc =", QR_LOC_ID || "(none)");

/* ========= Phone normalize (MN) ========= */
function normalizeMnPhone(raw=""){
  const digits = String(raw).replace(/\D/g,"");
  if (/^\+976\d{8}$/.test(raw)) return raw;
  if (/^\d{8}$/.test(digits))   return `+976${digits}`;
  if (/^\+?[1-9]\d{7,14}$/.test(raw)) return raw.startsWith("+") ? raw : `+${raw}`;
  throw new Error("Утасны дугаар буруу байна. (+976XXXXXXXX хэлбэр)");
}

/* ========= DOM ========= */
const vIntro     = document.getElementById("vidIntro");
const vEx        = document.getElementById("vidExercise");
const btnUnmute  = document.getElementById("btnUnmute");
const tapLay     = document.getElementById("tapToStart");
const otpGate    = document.getElementById("otpGate");
const otpPhoneEl = document.getElementById("otpPhone");
const btnSendCode= document.getElementById("btnSendCode");
const otpCodeWrap= document.getElementById("otpCodeWrap");
const otpError   = document.getElementById("otpError");

let currentVideo = null;

/* ========= Firebase ========= */
const fbApp = initializeApp(firebaseConfig);
const auth  = getAuth(fbApp);
const db    = getFirestore(fbApp);

/* ========= helpers ========= */
async function safePlay(v){
  if (!v) return;
  try { await v.play(); }
  catch (e) {
    if (e?.name === "AbortError") dbg("play() aborted (new load?)");
    else throw e;
  }
}
// Видеог decode болохоор боловч харагдахгүй байлгах
function makeVideoDecodeFriendly(v){
  try {
    v.removeAttribute("hidden");
    Object.assign(v.style, {
      position: "fixed", left: "-9999px", top: "-9999px",
      width: "1px", height: "1px", opacity: "0", pointerEvents: "none",
    });
  } catch {}
}

// ensureCamera() → once/cache
let __camPromise = null;
async function ensureCameraOnce() {
  if (__camPromise) return __camPromise;
  __camPromise = ensureCamera().catch((e) => { __camPromise = null; throw e; });
  return __camPromise;
}

/* ========= Location match helpers ========= */
async function fetchLocationById(id){
  if (!id) return null;
  const d = await getDoc(doc(db, "locations", id)).catch(() => null);
  if (!d?.exists()) return null;
  const { lat, lng, name, radiusMeters } = d.data() || {};
  return { id:d.id, name:name||null, lat:Number(lat), lng:Number(lng), radiusMeters:Number(radiusMeters||0) };
}
function distanceMeters(a,b){
  const R=6371000, toRad=(x)=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const la1=toRad(a.lat), la2=toRad(b.lat);
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
async function isWithinQrLocation(pos, qrLocId, fallbackRadius=DEFAULT_LOC_RADIUS_M){
  const loc = await fetchLocationById(qrLocId);
  if (!loc || !pos?.coords) {
    return { ok:false, reason:(!loc?"loc-missing":"gps-missing"), loc, dist:null, radius:fallbackRadius, buffer:0 };
  }
  const user={ lat:Number(pos.coords.latitude), lng:Number(pos.coords.longitude) };
  const dist = distanceMeters(user, { lat:loc.lat, lng:loc.lng });
  const radius = loc.radiusMeters>0 ? loc.radiusMeters : fallbackRadius;
  const buffer = Math.min(Number(pos.coords.accuracy||0), ACCURACY_BUFFER_MAX);
  const ok = dist <= (radius + buffer);
  return { ok, reason: ok?"ok":"too-far", loc, dist, radius, buffer };
}

/* ========= Format & source helpers ========= */
function cleanUrl(u=""){
  u = String(u || "").trim();
  return u.replace(/^"+|"+$/g, "");
}
function normFormat(x){
  const s = String(x||"").toLowerCase();
  if (s.includes("webm")) return "webm";
  if (s.includes("mp4_sbs") || /sbs/.test(s)) return "mp4_sbs";
  if (s.includes("mp4"))  return "mp4";
  return s;
}
function extFromUrl(u=""){ try{ return (new URL(u).pathname.match(/\.([a-z0-9]+)$/i)?.[1]||"").toLowerCase(); }catch{ return ""; } }
function pickSourcesFromDoc(doc) {
  const urls = { webm:null, mp4_sbs:null, mp4:null };

  if (doc?.urls && typeof doc.urls === "object") {
    urls.webm    = cleanUrl(doc.urls.webm);
    urls.mp4_sbs = cleanUrl(doc.urls.mp4_sbs);
    urls.mp4     = cleanUrl(doc.urls.mp4);
  }

  const url = cleanUrl(doc?.url);
  const fmt = normFormat(doc?.format || "") || normFormat(extFromUrl(url));

  if (url) {
    if (fmt === "webm") urls.webm = url;
    else if (fmt === "mp4_sbs" || /_sbs\.(mp4|mov)$/i.test(url)) urls.mp4_sbs = url;
    else if (fmt === "mp4") urls.mp4 = url;
    else {
      const ext = normFormat(extFromUrl(url));
      if (ext === "webm") urls.webm = url;
      else if (ext === "mp4") urls.mp4 = url;
    }
  }
  return urls; // {webm, mp4_sbs, mp4}
}

/* ===== Alpha төрлийг ялгах — SBS эсэх ===== */
function isSbsVideo(doc, vEl) {
  const hint = String(doc?.alphaMode || doc?.format || "").toLowerCase();
  if (hint.includes("sbs")) return true;
  if (hint.includes("vp8")) return false;

  const tagStr = (doc?.name || "") + " " + (doc?.url || "") + " " + JSON.stringify(doc?.urls||{});
  if (/_sbs\b/i.test(tagStr)) return true;

  const w = vEl?.videoWidth || 0, h = vEl?.videoHeight || 0;
  if (w && h) {
    const r = w/h;
    if (r > 1.9 && r < 2.1) return true; // ихэнх SBS 2:1
  }
  return false;
}

// -------- Cloudinary seek hack ----------
function isCloudinary(u){ try{ return /res\.cloudinary\.com/.test(new URL(u).host); }catch{ return false; } }
function withSeekHack(u){
  if (!u) return u;
  return isCloudinary(u) ? (u + (u.includes("#") ? "" : "#t=0.001")) : u;
}

// Төхөөрөмжийн дэмжлэг шалгаад хамгийн зөв candidate жагсаалт
function pickBestForDevice({ webm, mp4_sbs, mp4 }) {
  const v = document.createElement("video");
  const can = (t) => (!!v.canPlayType && v.canPlayType(t).replace(/no/,''));
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const webmOK = webm && (can('video/webm; codecs="vp8"') || can('video/webm'));
  const sbsOK  = mp4_sbs && can('video/mp4');
  const mp4OK  = mp4 && can('video/mp4');

  if (isiOS) {
    const list = [];
    if (sbsOK) list.push({ url: mp4_sbs, type: "video/mp4", kind:"sbs" });
    if (mp4OK) list.push({ url: mp4, type: "video/mp4", kind:"flat" });
    return list;
  }
  const list = [];
  if (webmOK) list.push({ url:webm, type:"video/webm", kind:"alpha" });
  if (sbsOK)  list.push({ url:mp4_sbs, type:"video/mp4", kind:"sbs" });
  if (mp4OK)  list.push({ url:mp4, type:"video/mp4", kind:"flat" });
  return list;
}

/* ========= Video: robust load (device-aware) ========= */
async function setSourcesAwait(v, webm, mp4, mp4_sbs){
  try { v.pause(); } catch {}
  v.removeAttribute("src");
  while (v.firstChild) v.removeChild(v.firstChild);

  v.muted = true; v.setAttribute("muted","");
  v.playsInline = true;
  v.crossOrigin = "anonymous";
  v.preload = "auto"; v.controls = false;

  makeVideoDecodeFriendly(v);

  const candidates = pickBestForDevice({ webm, mp4_sbs, mp4 });
  if (!candidates.length) throw new Error("No playable sources for this device");

  async function tryOne(c){
    const s = document.createElement("source");
    s.src = withSeekHack(c.url);
    s.type = c.type;
    while (v.firstChild) v.removeChild(v.firstChild);
    v.appendChild(s);
    v.load();
    dbg("VIDEO try:", c.type, s.src);

    return new Promise((resolve, reject) => {
      const t = setTimeout(() => onErr(new Error("video load timeout")), 15000);
      const ok = () => { cleanup(); v.dataset.srcType = c.type; v.dataset.alphaKind=c.kind; dbg("VIDEO ok:", c.type, "ready", v.readyState); resolve(c.kind); };
      const onErr = (e) => { cleanup(); dbg("VIDEO fail:", c.type, e?.message||e); reject(e||new Error("video load failed")); };
      const cleanup = () => {
        clearTimeout(t);
        v.removeEventListener("canplay", ok);
        v.removeEventListener("loadeddata", ok);
        v.removeEventListener("error", onErr);
        v.removeEventListener("stalled", onErr);
        v.removeEventListener("abort", onErr);
        s.removeEventListener("error", onErr);
      };
      v.addEventListener("canplay", ok,   { once:true });
      v.addEventListener("loadeddata", ok,{ once:true });
      v.addEventListener("error", onErr,  { once:true });
      v.addEventListener("stalled", onErr,{ once:true });
      v.addEventListener("abort", onErr,  { once:true });
      if (v.readyState >= 3) ok();
    });
  }

  let lastKind, lastErr;
  for (const c of candidates) {
    try { lastKind = await tryOne(c); break; }
    catch(e){ lastErr = e; }
  }
  if (!lastKind) throw lastErr || new Error("video load failed");
  return lastKind; // "alpha" | "sbs" | "flat"
}

// Debug events
function wireVideoDebug(v, tag){
  const log = (ev) => dbg(`[${tag}]`, ev.type, "t=", v.currentTime.toFixed(2));
  ["loadedmetadata","canplay","play","playing","pause","waiting","stalled","error","ended"].forEach(t => {
    v.addEventListener(t, log);
  });
}

/* ========= Firestore queries ========= */
async function fetchLatestIntro(){
  const qs = [
    fsQuery(collection(db,"videos"), where("active","==",true), where("isGlobal","==",true), limit(1)),
    fsQuery(collection(db,"videos"), where("active","==",true), where("name","==","intro"), limit(1)),
  ];
  for (const q of qs) {
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = { id:snap.docs[0].id, ...snap.docs[0].data() };
      dbg("Intro doc:", d.id, "format=", d.format, "url=", (d.url||"").slice(-32));
      return d;
    }
  }
  return null;
}

async function fetchLatestExerciseFor(locationId){
  if (!locationId) return null;
  const q = fsQuery(
    collection(db,"videos"),
    where("active","==",true),
    where("isGlobal","==",false),
    where("locationIds","array-contains",locationId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = { id:snap.docs[0].id, ...snap.docs[0].data() };
  dbg("Exercise doc:", d.id, "format=", d.format, "url=", (d.url||"").slice(-32));
  return d;
}

/* ========= Scan LOG ========= */
async function logScan({ phone, loc, pos, ua, decision }){
  try {
    let locationName = null;
    if (loc) {
      const d = await getDoc(doc(db,"locations",loc)).catch(()=>null);
      if (d?.exists()) locationName = d.data()?.name || null;
    }
    await addDoc(collection(db,"scans"), {
      phone, locId:loc||null, locationName:locationName||null,
      lat:Number(pos?.coords?.latitude ?? null),
      lng:Number(pos?.coords?.longitude ?? null),
      accuracy:Number(pos?.coords?.accuracy ?? null),
      decision: decision || null,
      ua: String(ua||"").slice(0,1000),
      source:"webar",
      createdAt: serverTimestamp(),
    });
  } catch (e) { console.warn("scan log failed:", e?.message||e); }
}

/* ========= Phone gate ========= */
let gateWired = false;
function showPhoneGate(){
  otpGate.hidden = false;
  if (otpCodeWrap) otpCodeWrap.hidden = true;
  if (btnSendCode) btnSendCode.textContent = "Бүртгэх";
  if (gateWired) return;
  gateWired = true;

  btnSendCode?.addEventListener("click", async () => {
    let busy = false;
    if (busy) return;
    try {
      busy = true; btnSendCode.disabled = true;
      otpError.textContent = "";
      const phone = normalizeMnPhone(otpPhoneEl.value.trim());
      if (!auth.currentUser) await signInAnonymously(auth).catch(()=>{});

      let pos;
      try {
        pos = await getGeoOnce({ enableHighAccuracy:true, timeout:12000 });
        dbg("Gate position:", fmtLoc(pos));
      } catch (e) {
        otpError.textContent = e?.code===1
          ? "Байршлын зөвшөөрөл хэрэгтэй байна."
          : "Байршил олдсонгүй.";
        setTimeout(()=>{ otpError.textContent=""; }, 3500);
        return;
      }

      try {
        await setDoc(doc(db,"phone_regs",phone), {
          phone, source:"webar", createdAt: serverTimestamp(),
          ua: navigator.userAgent.slice(0,1000),
          lat:Number(pos.coords.latitude), lng:Number(pos.coords.longitude),
          accuracy:Number(pos.coords.accuracy ?? 0), qrId: QR_LOC_ID || null,
        }, { merge:false });
      } catch (e) {
        if (e?.code === "permission-denied") {
          otpError.textContent = "Энэ дугаар аль хэдийн бүртгэлтэй байна.";
          setTimeout(()=>{ otpError.textContent=""; }, 2200);
          if (ALLOW_DUPLICATE_TO_ENTER) {
            otpGate.hidden = true; otpPhoneEl.value = "";
            if (!window.__introStarted) { window.__introStarted = true; await startIntroFlow(true); }
          }
          const chkOld = await isWithinQrLocation(pos, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
          await logScan({ phone, loc:QR_LOC_ID, pos, ua:navigator.userAgent, decision:{
            ok:chkOld.ok, dist:Math.round(chkOld.dist||0), radius:chkOld.radius,
            buffer:Math.round(chkOld.buffer||0), reason:chkOld.reason
          }});
          return;
        }
        throw e;
      }

      const chk = await isWithinQrLocation(pos, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
      dbg("Gate decision:", chk);
      await logScan({ phone, loc:QR_LOC_ID, pos, ua:navigator.userAgent, decision:{
        ok:chk.ok, dist:Math.round(chk.dist||0), radius:chk.radius,
        buffer:Math.round(chk.buffer||0), reason:chk.reason
      }});

      otpGate.hidden = true; otpPhoneEl.value = "";
      if (!window.__introStarted) { window.__introStarted = true; await startIntroFlow(true); }
    } catch (e) {
      console.error(e);
      otpError.textContent = e?.message || "Бүртгэл амжилтгүй";
      setTimeout(()=>{ otpError.textContent=""; }, 3500);
    } finally {
      busy = false; btnSendCode.disabled = false;
    }
  }, { passive:true });
}

/* ========= main ========= */
await initAR();
signInAnonymously(auth).catch(()=>{});

// Видео элементүүдийг decoding-д бэлэн болгоно
makeVideoDecodeFriendly(vIntro);
makeVideoDecodeFriendly(vEx);

try {
  const pos = await getGeoOnce().catch(()=>null);
  if (pos) dbg("Boot pos:", fmtLoc(pos));
} catch {}

showPhoneGate();

tapLay.addEventListener("pointerdown", async ()=>{
  tapLay.style.display = "none";
  try {
    if (!window.__introStarted) {
      window.__introStarted = true;
      await startIntroFlow(true);
    } else if (!introLoading && currentVideo) {
      await safePlay(currentVideo);
    }
  } catch (e) { dbg("after tap failed:", e?.message||e); }
});

// Меню товч
document.getElementById("mExercise")?.addEventListener("click", startExerciseDirect);

// Интро үед world-tracked UI-г update + frame safeguard
onFrame(()=>{
  if (currentVideo === vIntro) updateIntroButtons();
  const v = currentVideo;
  if (v && v.readyState >= 2) {
    try { v.__threeVideoTex && (v.__threeVideoTex.needsUpdate = true); } catch {}
  }
});

/* ========= Flows ========= */
let introLoading = false;
async function startIntroFlow(fromTap=false){
  if (introLoading) return;
  introLoading = true;
  try {
    wireVideoDebug(vIntro, "intro");
    bindIntroButtons(vIntro);

    try { await ensureCameraOnce(); }
    catch (e) { dbg("camera start failed:", e?.message||e); return; }

    const introDoc = await fetchLatestIntro();
    if (!introDoc) {
      dbg("No global intro video → try starting exercise directly");
      if (QR_LOC_ID) {
        const posNow = await getGeoOnce({ enableHighAccuracy:true, timeout:12000 }).catch(()=>null);
        const chk = await isWithinQrLocation(posNow, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
        if (chk.ok) { await startExerciseDirect(); }
        else       { dbg(`Exercise locked: not within location. dist=${Math.round(chk?.dist||-1)} > allowed=${chk?.radius}+${Math.round(chk?.buffer||0)}`); }
      }
      return;
    }
    const introSrc = pickSourcesFromDoc(introDoc);
    dbg("Intro sources:", introSrc);

    // Exercise prefetch (GPS≈QR)
    let exDoc=null, exSrc=null, posNow=null, chk=null;
    if (QR_LOC_ID) {
      posNow = await getGeoOnce({ enableHighAccuracy:true, timeout:12000 }).catch(()=>null);
      if (posNow) dbg("IntroFlow pos:", fmtLoc(posNow));
      chk = await isWithinQrLocation(posNow, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
      dbg("IntroFlow within?", chk);
      if (chk.ok) {
        exDoc = await fetchLatestExerciseFor(QR_LOC_ID);
        if (exDoc) { exSrc = pickSourcesFromDoc(exDoc); dbg("Exercise sources:", exSrc); }
      } else {
        const name = chk?.loc?.name || QR_LOC_ID;
        dbg(`Exercise locked: need near "${name}". dist=${Math.round(chk?.dist||-1)} > allowed=${chk?.radius}+${Math.round(chk?.buffer||0)}`);
      }
    } else {
      dbg("QR loc not provided → exercise prefetch disabled");
    }

    // Load intro (+prefetch exercise)
    const introKind = await setSourcesAwait(vIntro, introSrc.webm, introSrc.mp4, introSrc.mp4_sbs);
    if (exSrc) await setSourcesAwait(vEx, exSrc.webm, exSrc.mp4, exSrc.mp4_sbs);

    // metadata хүртэл хүлээгээд texture үүсгэнэ
    if (vIntro.readyState < 1) {
      await new Promise(r => vIntro.addEventListener("loadedmetadata", r, { once:true }));
    }
    const texIntro = videoTexture(vIntro);
    texIntro.needsUpdate = true;
    vIntro.__threeVideoTex = texIntro;

    // ✅ Android: VP8a → map, iOS/SBS → shader
    if (introKind === "sbs" || isSbsVideo(introDoc, vIntro)) { planeUseShader(texIntro); }
    else                                                      { planeUseMap(texIntro); }

    fitPlaneToVideo(vIntro);

    currentVideo = vIntro;

    try { vIntro.muted = false; await safePlay(vIntro); btnUnmute.style.display="none"; } catch {}
    if (vIntro.paused) {
      try { vIntro.muted = true; await safePlay(vIntro); btnUnmute.style.display="inline-block"; } catch {}
    }

    applyScale();
    dbg("intro playing…");

    try {
      startGeoWatch((pos, err)=>{
        if (err) { dbg("GPS watch error:", err?.message||err); return; }
        dbg("Watch", fmtLoc(pos));
      });
    } catch (e) { dbg("GPS watch failed:", e?.message||e); }

    vIntro.onended = ()=>{
      try { ["ibExercise","ibGrowth","ibKnowledge"].forEach(id=>document.getElementById(id)?.classList.add("mini")); } catch {}
      showMenuOverlay();
      dbg("intro ended → menu shown; sticky UI");
    };
  } finally {
    introLoading = false;
  }
}

let exLoading = false;
async function startExerciseDirect(){
  if (exLoading) return;
  exLoading = true;
  try {
    wireVideoDebug(vEx, "exercise");
    closeMenu(); stopIntroButtons(); stopGeoWatch();

    try { await ensureCameraOnce(); }
    catch (e) { dbg("camera start failed:", e?.message||e); return; }

    try { currentVideo?.pause?.(); } catch {}

    const posNow = await getGeoOnce({ enableHighAccuracy:true, timeout:12000 }).catch(()=>null);
    if (posNow) dbg("Exercise pos:", fmtLoc(posNow));
    const chk = await isWithinQrLocation(posNow, QR_LOC_ID, DEFAULT_LOC_RADIUS_M);
    dbg("Exercise within?", chk);
    if (!chk.ok) {
      dbg(`Exercise locked: not within location. dist=${Math.round(chk?.dist||-1)} > allowed=${chk?.radius}+${Math.round(chk?.buffer||0)}`);
      return;
    }

    const exDoc = await fetchLatestExerciseFor(QR_LOC_ID);
    if (!exDoc) { dbg("No exercise video for this location"); return; }
    const exSrc = pickSourcesFromDoc(exDoc);
    dbg("Exercise sources:", exSrc);

    const exKind = await setSourcesAwait(vEx, exSrc.webm, exSrc.mp4, exSrc.mp4_sbs);

    if (vEx.readyState < 1) {
      await new Promise(r => vEx.addEventListener("loadedmetadata", r, { once:true }));
    }
    const texEx = videoTexture(vEx);
    texEx.needsUpdate = true;
    vEx.__threeVideoTex = texEx;

    if (exKind === "sbs" || isSbsVideo(exDoc, vEx)) { planeUseShader(texEx); }
    else                                            { planeUseMap(texEx); }

    fitPlaneToVideo(vEx);

    vEx.currentTime = 0; currentVideo = vEx;

    try { vEx.muted = false; await safePlay(vEx); btnUnmute.style.display="none"; } catch {}
    if (vEx.paused) {
      try { vEx.muted = true; await safePlay(vEx); btnUnmute.style.display="inline-block"; } catch {}
    }

    dbg("exercise playing (AR, no menu).");
  } finally {
    exLoading = false;
  }
}

/* ========= helpers (texture→material) ========= */
function planeUseMap(tex){
  import("./ar.js").then(({ plane }) => {
    plane.material.map = tex;
    plane.material.transparent = true;
    plane.material.depthWrite = false;
    plane.material.needsUpdate = true;
  });
}
function planeUseShader(tex){
  import("./ar.js").then(({ plane, makeSbsAlphaMaterial }) => {
    plane.material?.dispose?.();
    plane.material = makeSbsAlphaMaterial(tex);
    plane.material.transparent = true;
    plane.material.depthWrite = false;
    plane.material.needsUpdate = true;
  });
}

/* ========= Unmute ========= */
btnUnmute.addEventListener("click", async ()=>{
  try {
    if (!currentVideo) return;
    currentVideo.muted = false;
    await safePlay(currentVideo);
    btnUnmute.style.display = "none";
  } catch { dbg("unmute failed"); }
});
