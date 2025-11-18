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
  showBackButton,
  hideBackButton,
  onBackButton,
} from "./ui.js";

const dbg = (...a) => (_dbg ? _dbg("[AR]", ...a) : console.log("[AR]", ...a));

/* ===== Тоглуулах видео (Cloudinary) ===== */
// 🔹 ЭНД өөрийн washing-hands бичлэгийн Cloudinary URL-ээ тавина
const CLOUDINARY_VIDEO_URL =
  "https://res.cloudinary.com/dzwchq5e5/video/upload/v1763456497/%D0%B3%D0%B0%D1%80_%D1%83%D0%B3%D0%B0%D0%B0%D1%85_gtbece.mp4";

/* ===== Swallow "play() was interrupted..." ===== */
window.addEventListener("unhandledrejection", (e) => {
  const r = e?.reason;
  const msg = String(r?.message || r || "");
  if (
    r?.name === "AbortError" ||
    /play\(\) request was interrupted/i.test(msg)
  ) {
    e.preventDefault();
    dbg("Ignored AbortError from play():", msg);
  }
});

/* ===== DOM ===== */
const vIntro = document.getElementById("vidIntro");
const vEx = document.getElementById("vidExercise");
const btnUnmute = document.getElementById("btnUnmute");
const tapLay = document.getElementById("tapToStart");

let currentVideo = null;
let introLoading = false;
let exLoading = false;

/* ===== Camera helpers (Firebase-с хамаарахгүй) ===== */
let CAM_REQ_IN_FLIGHT = false;
let CAM_PROMPTED = false;

async function thereIsCameraDevice() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return true;
    const list = await navigator.mediaDevices.enumerateDevices();
    const hasVideo = list.some((d) => d.kind === "videoinput");
    if (!hasVideo) dbg("enumerateDevices: no videoinput found");
    return hasVideo || isIOS; // iOS заримдаа хоосон буудаг
  } catch {
    return true;
  }
}

async function logPermissionStates() {
  if (!navigator.permissions?.query) return;
  for (const n of ["camera"]) {
    try {
      const st = await navigator.permissions.query({ name: n });
      dbg(`perm[${n}] =`, st.state);
    } catch {}
  }
}

function attachToHiddenVideoOnce(stream) {
  return new Promise((resolve) => {
    try {
      const v = document.createElement("video");
      v.muted = true;
      v.setAttribute("muted", "");
      v.playsInline = true;
      v.preload = "auto";
      makeVideoDecodeFriendly(v);
      v.srcObject = stream;
      const done = () => {
        try {
          v.pause();
        } catch {}
        try {
          v.srcObject = null;
        } catch {}
        resolve();
      };
      const onLoaded = () => {
        requestAnimationFrame(done);
      };
      v.addEventListener("loadedmetadata", onLoaded, { once: true });
      v.addEventListener("error", done, { once: true });
      v.play().catch(() => done());
    } catch {
      resolve();
    }
  });
}
function stopAll(stream) {
  try {
    stream?.getTracks?.().forEach((t) => t.stop());
  } catch {}
}

async function requestCameraOnce() {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error("Камер ашиглах боломжгүй төхөөрөмж.");
  await logPermissionStates();

  if (navigator.permissions?.query) {
    try {
      const st = await navigator.permissions.query({ name: "camera" });
      if (st.state === "denied") {
        throw new Error(
          "Камерын зөвшөөрөл хаалттай байна. Settings → Safari → Camera → Allow (эсвэл Ask) болгож, хуудсаа Refresh хийнэ үү."
        );
      }
    } catch {}
  }

  if (CAM_PROMPTED) {
    dbg("camera already prompted – skip duplicate getUserMedia");
    return true;
  }
  if (CAM_REQ_IN_FLIGHT) {
    dbg("camera request in-flight – wait");
    await new Promise((r) => {
      const id = setInterval(() => {
        if (!CAM_REQ_IN_FLIGHT) {
          clearInterval(id);
          r();
        }
      }, 50);
    });
    return CAM_PROMPTED;
  }

  if (!(await thereIsCameraDevice())) {
    throw new Error(
      "Камер олдсонгүй. Өөр апп камер ашиглаж байгаа эсэхээ шалгаад дахин оролдоно уу."
    );
  }

  CAM_REQ_IN_FLIGHT = true;

  const tryWithTimeout = (constraints, label, ms = 16000) =>
    new Promise((resolve, reject) => {
      let done = false;
      const to = setTimeout(() => {
        if (!done) {
          done = true;
          reject(new Error(`Camera request timed out: ${label}`));
        }
      }, ms);

      dbg("getUserMedia →", label);
      navigator.mediaDevices.getUserMedia(constraints).then(
        async (stream) => {
          if (done) {
            stopAll(stream);
            return;
          }
          clearTimeout(to);
          done = true;
          try {
            await attachToHiddenVideoOnce(stream);
          } catch {
          } finally {
            stopAll(stream);
          }
          resolve(stream);
        },
        (err) => {
          if (done) return;
          clearTimeout(to);
          done = true;
          reject(err);
        }
      );
    });

  const attempts = [
    [
      { video: { facingMode: { exact: "environment" } }, audio: false },
      "env-exact",
    ],
    [
      { video: { facingMode: { ideal: "environment" } }, audio: false },
      "env-ideal",
    ],
    [{ video: true, audio: false }, "video:true"],
    [{ video: { facingMode: "user" }, audio: false }, "user"],
    [
      {
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      },
      "1280x720",
    ],
  ];

  let lastErr;
  try {
    for (const [c, label] of attempts) {
      try {
        await tryWithTimeout(c, label);
        CAM_PROMPTED = true;
        return true;
      } catch (e) {
        lastErr = e;
        dbg("camera attempt failed:", label, e?.name || e?.message || e);
      }
    }
    const name = lastErr?.name;
    if (name === "NotAllowedError")
      throw new Error(
        "Камерын зөвшөөрөл хаалттай байна. Settings → Safari → Camera → Allow (эсвэл Ask) болгож, хуудсаа Refresh хийнэ үү."
      );
    if (name === "NotFoundError")
      throw new Error(
        "Камер олдсонгүй. Өөр апп камер ашиглаж байгаа эсэхээ шалгаад дахин оролдоно уу."
      );
    throw new Error(
      "Камерт хандах боломжгүй: " + (lastErr?.message || lastErr)
    );
  } finally {
    CAM_REQ_IN_FLIGHT = false;
  }
}

/** Overlay дээрээс дуудагдах permission gate
 *  Одоо зөвхөн CAMERA асууна, location ашиглахгүй.
 */
async function ensurePermissionsGate() {
  await requestCameraOnce();
  return null;
}

/* ===== helpers ===== */
async function safePlay(v) {
  if (!v) return;
  try {
    await v.play();
  } catch (e) {
    if (e?.name === "AbortError") dbg("play() aborted (new load?)");
    else throw e;
  }
}
function makeVideoDecodeFriendly(v) {
  try {
    v.removeAttribute("hidden");
    Object.assign(v.style, {
      position: "fixed",
      left: "-9999px",
      top: "-9999px",
      width: "1px",
      height: "1px",
      opacity: "0",
      pointerEvents: "none",
    });
  } catch {}
}

/* ---- Cloudinary seek hack (ашигтай тул үлдээе) ---- */
function isCloudinary(u) {
  try {
    return /res\.cloudinary\.com/.test(new URL(u).host);
  } catch {
    return false;
  }
}
function withSeekHack(u) {
  if (!u) return u;
  return isCloudinary(u) ? u + (u.includes("#") ? "" : "#t=0.001") : u;
}

/* ===== AR init (single-flight) ===== */
let __arReady = false;
const __arInitP = initAR()
  .then(() => {
    __arReady = true;
    dbg("initAR OK");
  })
  .catch((e) => {
    console.error("initAR failed:", e);
    dbg("initAR failed:", e?.message || e);
    throw e;
  });

/* ===== ensureCamera once/cache ===== */
let __camPromise = null;
async function ensureCameraOnce() {
  try {
    if (!__arReady) await __arInitP;
  } catch {}
  if (__camPromise) return __camPromise;
  if (typeof ensureCamera !== "function") {
    throw new Error("AR engine is not ready (ensureCamera missing)");
  }
  __camPromise = ensureCamera().catch((e) => {
    __camPromise = null;
    throw e;
  });
  return __camPromise;
}

/* ===== Simple video loader (1 Cloudinary MP4) ===== */
async function setVideoSource(v, url) {
  try {
    v.pause?.();
  } catch {}
  v.removeAttribute("src");
  while (v.firstChild) v.removeChild(v.firstChild);

  v.muted = true;
  v.setAttribute("muted", "");
  v.playsInline = true;
  v.crossOrigin = "anonymous";
  v.preload = "auto";
  v.controls = false;

  makeVideoDecodeFriendly(v);

  const src = document.createElement("source");
  src.src = withSeekHack(url);
  src.type = "video/mp4";

  v.appendChild(src);
  v.load();

  const TIMEOUT_MS = 15000;

  return new Promise((resolve, reject) => {
    let done = false;
    const finishOk = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve("flat");
    };
    const finishErr = (why) => {
      if (done) return;
      done = true;
      cleanup();
      dbg("VIDEO error:", why);
      reject(new Error(why));
    };
    const to = setTimeout(() => finishErr("timeout"), TIMEOUT_MS);

    const onCanPlay = () => finishOk();
    const onError = () => finishErr("error");

    const cleanup = () => {
      clearTimeout(to);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("canplaythrough", onCanPlay);
      v.removeEventListener("loadeddata", onCanPlay);
      v.removeEventListener("error", onError);
      src.removeEventListener("error", onError);
    };

    v.addEventListener("canplay", onCanPlay, { once: true });
    v.addEventListener("canplaythrough", onCanPlay, { once: true });
    v.addEventListener("loadeddata", onCanPlay, { once: true });
    v.addEventListener("error", onError, { once: true });
    src.addEventListener("error", onError, { once: true });

    dbg("VIDEO try:", src.src);
    if (v.readyState >= 3) finishOk();
  });
}

/* ===== Plane visibility helpers ===== */
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
    if (v.readyState < 2) {
      await new Promise((r) =>
        v.addEventListener("loadeddata", r, { once: true })
      );
    }
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
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

/* ===== texture→material (background арилгаагүй, шууд RECTANGLE) ===== */
function planeUseMap(tex) {
  import("./ar.js").then(({ plane }) => {
    plane.material.map = tex;
    plane.material.transparent = false;
    plane.material.depthWrite = true;
    plane.material.alphaTest = 0;
    plane.material.opacity = 1;
    plane.material.needsUpdate = true;
  });
}

/* ===== Debug events (шаардвал) ===== */
function wireVideoDebug(v, tag) {
  const log = (ev) =>
    dbg(
      `[${tag}]`,
      ev.type,
      "t=",
      (v.currentTime || 0).toFixed(2),
      "rs=",
      v.readyState,
      "ns=",
      v.networkState
    );
  [
    "loadstart",
    "loadedmetadata",
    "loadeddata",
    "canplay",
    "canplaythrough",
    "play",
    "playing",
    "pause",
    "waiting",
    "stalled",
    "suspend",
    "abort",
    "error",
    "ended",
  ].forEach((t) => v.addEventListener(t, log));
}

/* ===== Back → Menu ===== */
async function backToMenuFromExercise() {
  try {
    try {
      vEx?.pause?.();
    } catch {}
    hidePlane();
    currentVideo = null;
    showMenuOverlay();
  } finally {
    hideBackButton();
  }
}
onBackButton(backToMenuFromExercise);

/* ===== main boot ===== */
makeVideoDecodeFriendly(vIntro);
makeVideoDecodeFriendly(vEx);
try {
  hideBackButton();
} catch (_) {}

/* ===== Tap-to-start: permission → camera → intro ===== */
tapLay.addEventListener("pointerdown", async () => {
  tapLay.style.display = "none";
  try {
    try {
      await ensurePermissionsGate();
      dbg("Permission gate OK");
    } catch (e) {
      dbg("Permission gate failed:", e?.message || e);
      alert(e?.message || "Зөвшөөрөл амжилтгүй.");
      tapLay.style.display = "flex";
      return;
    }

    try {
      await ensureCameraOnce();
    } catch (e) {
      dbg("camera on tap:", e?.message || e);
    }

    if (!window.__introStarted) {
      window.__introStarted = true;
      await startIntroFlow(true);
    } else if (!introLoading && currentVideo) {
      await safePlay(currentVideo);
    }
  } catch (e) {
    dbg("after tap failed:", e?.message || e);
  }
});

/* ===== Меню → Дасгал товч ===== */
document
  .getElementById("mExercise")
  ?.addEventListener("click", startExerciseDirect);

/* ===== Frame loop: видео texture шинэчлэх ===== */
onFrame(() => {
  if (currentVideo === vIntro) updateIntroButtons();
  const v = currentVideo;
  if (v && v.readyState >= 2) {
    try {
      v.__threeVideoTex && (v.__threeVideoTex.needsUpdate = true);
    } catch {}
  }
});

/* ===== visibility хамгаалалт ===== */
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && currentVideo) {
    try {
      await safePlay(currentVideo);
    } catch {}
  }
});
window.addEventListener("pageshow", async () => {
  if (currentVideo && currentVideo.paused) {
    try {
      await safePlay(currentVideo);
    } catch {}
  }
});

/* ===== Flows ===== */
async function startIntroFlow(fromTap = false) {
  if (introLoading) return;
  introLoading = true;
  try {
    hideBackButton();
    wireVideoDebug(vIntro, "intro");
    bindIntroButtons(vIntro);

    try {
      await ensureCameraOnce();
    } catch (e) {
      dbg("camera start failed:", e?.message || e);
      return;
    }

    // 🔸 Интро дээр CLOUDINARY_VIDEO_URL ачаална
    await setVideoSource(vIntro, CLOUDINARY_VIDEO_URL);

    if (vIntro.readyState < 1) {
      await new Promise((r) =>
        vIntro.addEventListener("loadedmetadata", r, { once: true })
      );
    }

    const texIntro = videoTexture(vIntro);
    texIntro.needsUpdate = true;
    vIntro.__threeVideoTex = texIntro;

    hidePlane();
    planeUseMap(texIntro);
    fitPlaneToVideo(vIntro);

    currentVideo = vIntro;

    try {
      vIntro.muted = false;
      await safePlay(vIntro);
      btnUnmute.style.display = "none";
    } catch {}
    if (vIntro.paused) {
      try {
        vIntro.muted = true;
        await safePlay(vIntro);
        btnUnmute.style.display = "inline-block";
      } catch {}
    }

    applyScale();
    dbg("intro playing…");

    await revealPlaneWhenReady(vIntro);

    vIntro.onended = async () => {
      try {
        ["ibExercise", "ibGrowth", "ibKnowledge"].forEach((id) =>
          document.getElementById(id)?.classList.add("mini")
        );
      } catch {}
      // Интро дуусмагц шууд меню
      showMenuOverlay();
      dbg("intro ended → show menu");
    };
  } finally {
    introLoading = false;
  }
}

async function startExerciseDirect() {
  if (exLoading) return;
  exLoading = true;
  try {
    wireVideoDebug(vEx, "exercise");
    closeMenu();
    stopIntroButtons();

    try {
      await ensureCameraOnce();
    } catch (e) {
      dbg("camera start failed:", e?.message || e);
      return;
    }

    try {
      currentVideo?.pause?.();
    } catch {}

    // 🔸 Дасгал дээр бас л CLOUDINARY_VIDEO_URL
    await setVideoSource(vEx, CLOUDINARY_VIDEO_URL);

    if (vEx.readyState < 1) {
      await new Promise((r) =>
        vEx.addEventListener("loadedmetadata", r, { once: true })
      );
    }

    const texEx = videoTexture(vEx);
    texEx.needsUpdate = true;
    vEx.__threeVideoTex = texEx;

    hidePlane();
    planeUseMap(texEx);
    fitPlaneToVideo(vEx);

    vEx.currentTime = 0;
    currentVideo = vEx;

    try {
      vEx.muted = false;
      await safePlay(vEx);
      btnUnmute.style.display = "none";
    } catch {}
    if (vEx.paused) {
      try {
        vEx.muted = true;
        await safePlay(vEx);
        btnUnmute.style.display = "inline-block";
      } catch {}
    }

    await revealPlaneWhenReady(vEx);
    showBackButton();

    dbg("exercise playing (AR, no menu).");
  } finally {
    exLoading = false;
  }
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

/* ===== Window-оос дуудах функцууд ===== */
window.ensurePermissionsGate = ensurePermissionsGate;
window.ensureCameraOnce = ensureCameraOnce;
window.startIntroFlow = startIntroFlow;
window.__appReady = true;
