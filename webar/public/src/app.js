// src/app.js
import {
  INTRO_WEBM_URL, INTRO_MP4_URL, EXERCISE_WEBM_URL, EXERCISE_MP4_URL
} from "./config.js";
import { isIOS, dbg } from "./utils.js";
import {
  initAR, ensureCamera, onFrame, setSources, videoTexture,
  fitPlaneToVideo, makeSbsAlphaMaterial, applyScale
} from "./ar.js";
import {
  bindIntroButtons, updateIntroButtons, showMenuOverlay, closeMenu, stopIntroButtons
} from "./ui.js";

// 🔗 Firebase (ESM CDN) + таны local config
import { firebaseConfig } from "./firebase.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ====== Geolocation helpers ======
let geoWatchId = null;
let lastGeo = null;
function canGeolocate(){ return 'geolocation' in navigator; }
function getGeoOnce(options={}){
  if (!canGeolocate()) return Promise.reject(new Error("Geolocation not supported"));
  const opts = { enableHighAccuracy:true, timeout:10000, maximumAge:0, ...options };
  return new Promise((resolve,reject)=>{
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}
function startGeoWatch(onUpdate, options={}){
  if (!canGeolocate()) throw new Error("Geolocation not supported");
  const opts = { enableHighAccuracy:true, timeout:20000, maximumAge:5000, ...options };
  if (geoWatchId!=null) stopGeoWatch();
  geoWatchId = navigator.geolocation.watchPosition(
    (pos)=>{ lastGeo = pos; onUpdate?.(pos, null); },
    (err)=> onUpdate?.(null, err),
    opts
  );
}
function stopGeoWatch(){
  if (geoWatchId!=null && navigator.geolocation?.clearWatch){
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}
function fmtLoc(pos){
  if (!pos) return "";
  const { latitude, longitude, accuracy } = pos.coords || {};
  return `GPS: lat=${latitude?.toFixed(6)} lng=${longitude?.toFixed(6)} ±${Math.round(accuracy||0)}m`;
}

// ====== Phone normalize (MN) ======
function normalizeMnPhone(raw = ""){
  const digits = String(raw).replace(/\D/g, "");
  if (/^\+976\d{8}$/.test(raw)) return raw;           // аль хэдийн зөв
  if (/^\d{8}$/.test(digits))   return `+976${digits}`;
  if (/^\+?[1-9]\d{7,14}$/.test(raw)) return raw.startsWith("+") ? raw : `+${raw}`;
  throw new Error("Утасны дугаар буруу байна. (+976XXXXXXXX хэлбэр)");
}

// ====== DOM ======
const vIntro = document.getElementById("vidIntro");
const vEx    = document.getElementById("vidExercise");
const btnUnmute = document.getElementById("btnUnmute");
const tapLay = document.getElementById("tapToStart");
let currentVideo = null;

// ====== Firebase init ======
const fbApp = initializeApp(firebaseConfig);
const auth  = getAuth(fbApp);
const db    = getFirestore(fbApp);

// ====== Түр бүртгэлийн жижиг UI (OTP-гүй) ======
function renderQuickRegister(){
  const host = document.createElement("div");
  Object.assign(host.style, {
    position:"fixed", left:"50%", bottom:"24px", transform:"translateX(-50%)",
    zIndex:9999, background:"rgba(0,0,0,.6)", backdropFilter:"blur(6px)",
    color:"#fff", padding:"8px 10px", borderRadius:"12px", display:"flex",
    gap:"8px", alignItems:"center", boxShadow:"0 6px 18px rgba(0,0,0,.35)"
  });
  host.innerHTML = `
    <span style="opacity:.8">Утас:</span>
    <input id="qr_phone" placeholder="+976XXXXXXXX" inputmode="tel"
      style="padding:6px 8px;border-radius:8px;border:0;outline:none;width:150px">
    <button id="qr_btn" style="padding:6px 10px;border-radius:8px;border:0;font-weight:700;background:#22d3ee;color:#07202a">
      Бүртгэх
    </button>
    <span id="qr_msg" style="margin-left:6px;font-size:12px;opacity:.9"></span>
  `;
  document.body.appendChild(host);

  const $btn = host.querySelector("#qr_btn");
  const $inp = host.querySelector("#qr_phone");
  const $msg = host.querySelector("#qr_msg");
  let busy = false;

  $btn.addEventListener("click", async ()=>{
    if (busy) return;
    try{
      busy = true;
      $msg.textContent = "Түр хүлээнэ үү…";
      const phone = normalizeMnPhone($inp.value.trim());

      // Anonymous sign-in (нэг удаа)
      if (!auth.currentUser) await signInAnonymously(auth).catch(()=>{});

      // Байршил: watch-аас олдсон бол тэр, үгүй бол нэг удаагийн хүсэлт
      let loc = lastGeo;
      if (!loc) { try { loc = await getGeoOnce({ timeout: 6000 }); } catch {} }

      await addDoc(collection(db, "phone_regs"), {
        phone,
        source: "webar",
        createdAt: serverTimestamp(),
        ua: navigator.userAgent,
        lat:  loc?.coords?.latitude  ?? null,
        lng:  loc?.coords?.longitude ?? null,
        accuracy: loc?.coords?.accuracy ?? null,
      });

      $msg.textContent = "✅ Амжилттай!";
      $inp.value = "";
      setTimeout(()=>{ $msg.textContent = ""; }, 2500);
    }catch(e){
      console.error(e);
      $msg.textContent = "❌ Алдаа: " + (e.message || "бүртгэл амжилтгүй");
      setTimeout(()=>{ $msg.textContent = ""; }, 4000);
    }finally{
      busy = false;
    }
  });
}

// ====== main ======
await initAR();

// Урьдчилж anonymous оролдоно (сайн дураар)
signInAnonymously(auth).catch(()=>{});

// GPS нэг удаа авч debug-д харуулна (алдаа бол зүгээр)
try{
  const pos = await getGeoOnce().catch(()=>null);
  if (pos) dbg(fmtLoc(pos));
}catch{}

// Интро урсгал руу орно
await startIntroFlow(true);

// tap-to-start fallback
tapLay.addEventListener("pointerdown", async ()=>{
  tapLay.style.display="none";
  try{ await startIntroFlow(true); }catch(e){ dbg("after tap failed: "+(e?.message||e)); }
});

// Меню товч
document.getElementById("mExercise")?.addEventListener("click", startExerciseDirect);

// render callback (интро үед world-tracked UI-г хөдөлгөх)
onFrame(()=>{ if (currentVideo===vIntro) updateIntroButtons(); });

// Түр бүртгэлийн UI-г асаая
renderQuickRegister();

// ===== flows =====
async function startIntroFlow(fromTap=false){
  bindIntroButtons(vIntro);

  await ensureCamera();

  setSources(vIntro, INTRO_WEBM_URL, INTRO_MP4_URL, isIOS);
  setSources(vEx,    EXERCISE_WEBM_URL, EXERCISE_MP4_URL, isIOS);

  const texIntro = videoTexture(vIntro);
  if (isIOS) {
    vIntro.hidden = false;
    vIntro.onloadedmetadata = ()=>fitPlaneToVideo(vIntro);
    planeUseShader(texIntro);
  } else {
    planeUseMap(texIntro);
    if (vIntro.readyState>=1) fitPlaneToVideo(vIntro);
    else vIntro.addEventListener("loadedmetadata", ()=>fitPlaneToVideo(vIntro), { once:true });
  }

  currentVideo = vIntro;

  // iOS autoplay policy-д тааруулж эхлүүлэх
  try { vIntro.muted=false; await vIntro.play(); btnUnmute.style.display="none"; }
  catch {
    try { vIntro.muted=true; await vIntro.play(); btnUnmute.style.display="inline-block"; }
    catch(e){ if(!fromTap){ tapLay.style.display="grid"; throw e; } }
  }

  applyScale();
  dbg("intro playing");

  // 🔄 GPS watch асаах (интро явж байх хугацаанд)
  try{
    startGeoWatch((pos, err)=>{
      if (err) { dbg("GPS watch error: " + (err?.message||err)); return; }
      dbg(fmtLoc(pos));
    });
  }catch(e){ dbg("GPS watch failed: " + (e?.message||e)); }

  // Интро дуусахад: sticky + том меню
  vIntro.onended = () => {
    try {
      ["ibExercise","ibGrowth","ibKnowledge"].forEach(id=>{
        document.getElementById(id)?.classList.add("mini");
      });
    } catch {}
    showMenuOverlay();
    dbg("intro ended → menu shown; intro buttons sticky.");
  };
}

async function startExerciseDirect(){
  closeMenu();
  stopIntroButtons();
  stopGeoWatch();     // ✅ дасгал руу ороход GPS watch-ийг унтраана
  await ensureCamera();

  try{ currentVideo?.pause?.(); }catch{}

  setSources(vEx, EXERCISE_WEBM_URL, EXERCISE_MP4_URL, isIOS);
  const texEx = videoTexture(vEx);
  if (isIOS) planeUseShader(texEx); else planeUseMap(texEx);

  if (vEx.readyState>=1) fitPlaneToVideo(vEx);
  else await new Promise(r => vEx.addEventListener("loadedmetadata", ()=>{ fitPlaneToVideo(vEx); r(); }, { once:true }));

  vEx.currentTime=0; currentVideo=vEx;

  try { vEx.muted=false; await vEx.play(); btnUnmute.style.display="none"; }
  catch { try { vEx.muted=true; await vEx.play(); btnUnmute.style.display="inline-block"; } catch{} }

  dbg("exercise playing (AR, no menu).");
}

// ===== helpers (texture→material) =====
function planeUseMap(tex){
  import("./ar.js").then(({ plane }) => {
    plane.material.map = tex;
    plane.material.transparent = true;
    plane.material.needsUpdate = true;
  });
}
function planeUseShader(tex){
  import("./ar.js").then(({ plane, makeSbsAlphaMaterial }) => {
    plane.material?.dispose?.();
    plane.material = makeSbsAlphaMaterial(tex);
    plane.material.needsUpdate = true;
  });
}

// Unmute
btnUnmute.addEventListener("click", async ()=>{
  try {
    if (!currentVideo) return;
    currentVideo.muted=false;
    await currentVideo.play();
    btnUnmute.style.display="none";
  } catch { dbg("unmute failed"); }
});
