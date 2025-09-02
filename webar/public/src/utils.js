// utils.js
/* =========================================================================
 * Туслах функцууд (DOM, platform detect, debug logger, storage, geo)
 * ========================================================================= */

/* ------------------------ DOM богино туслахууд ------------------------ */
export const $  = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ------------------------ UA / Платформ танигч ------------------------ */
// Нэг удаа тооцоолоод кэчлэгдэнэ (IIFE)
export const uaString = (() => {
  try {
    return navigator.userAgent || navigator.vendor || "";
  } catch {
    return "";
  }
})();

export const isWebKit = (() => {
  try {
    return !!window.webkit || /AppleWebKit/i.test(uaString);
  } catch {
    return false;
  }
})();

export const isSafari = (() => {
  // Chrome/Edge/Firefox-ын iOS хувилбарууд ч WebKit тул Safari-г ялгаж шүүе
  try {
    const isSafariLike = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(uaString);
    return isSafariLike && isWebKit;
  } catch {
    return false;
  }
})();

export const isAndroid = /Android/i.test(uaString);

// iOS (iPadOS desktop-UA case-ийг хамруулсан)
export const isIOS = (() => {
  try {
    const iThing = /iPad|iPhone|iPod/i.test(uaString);
    const iPadDesktopUA = /Macintosh/.test(uaString) && ("ontouchend" in document);
    return iThing || iPadDesktopUA;
  } catch {
    return false;
  }
})();

export const isStandalonePWA = (() => {
  try {
    return window.matchMedia?.("(display-mode: standalone)")?.matches === true
      || window.navigator?.standalone === true;
  } catch {
    return false;
  }
})();

/* ------------------------------ Debug logger --------------------------- */
/**
 * dbgEnabled: ?debug=1, эсвэл localStorage.debug=1 үед UI (#debug)-д бичнэ.
 * Идэвхгүй үед console.log хэвээр үлдэнэ (prod лог хадгална).
 */
function readDebugFlag() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("debug") === "1") return true;
  } catch {}
  try {
    return localStorage.getItem("debug") === "1";
  } catch {}
  return false;
}
export const dbgEnabled = readDebugFlag();

/**
 * dbg: олон аргумент хүлээж аваад
 *  - Console: үргэлж хэвлэнэ
 *  - UI: dbgEnabled үед #debug элементэд мөр нэмж (200 мөрийн буфер) бичнэ
 */
const DEBUG_MAX_LINES = 200;
function formatArg(a) {
  if (typeof a === "string") return a;
  try { return JSON.stringify(a); } catch { return String(a); }
}
export const dbg = (...args) => {
  const msg = args.map(formatArg).join(" ");
  // Console — үргэлж үлдээнэ
  try { console.log(msg); } catch {}

  // UI — зөвхөн dbgEnabled үед
  if (!dbgEnabled) return;

  try {
    const el = $("#debug");
    if (!el) return;
    if (!Array.isArray(el.__lines)) el.__lines = [];
    el.__lines.push(`DEBUG: ${msg}`);
    if (el.__lines.length > DEBUG_MAX_LINES) {
      el.__lines.splice(0, el.__lines.length - DEBUG_MAX_LINES);
    }
    el.textContent = el.__lines.join("\n");
  } catch {}
};

/* --------------------------- Жижиг туслахууд --------------------------- */
export const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
export const lerp  = (a, b, t) => a + (b - a) * t;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** once: нэг удаа л ажиллах handler буцаана */
export function once(fn) {
  let done = false, val;
  return (...args) => {
    if (done) return val;
    done = true;
    val = fn?.(...args);
    return val;
  };
}

/** throttle: тодорхой хугацаанд нэг л удаа дуудагдана */
export function throttle(fn, wait = 100) {
  let last = 0, timer = null, lastArgs = null;
  return (...args) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    lastArgs = args;
    if (remaining <= 0) {
      last = now;
      try { return fn(...lastArgs); } finally { lastArgs = null; }
    }
    if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        try { fn(...(lastArgs || [])); } finally { lastArgs = null; }
      }, remaining);
    }
  };
}

/* ----------------------------- Storage wrapper ------------------------- */
/**
 * localStorage байхгүй/хаалттай үед in-memory fallback хэрэглэнэ.
 */
const _memStore = new Map();

function _lsAvailable() {
  try {
    const k = "__ls_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
const _hasLS = _lsAvailable();

export const storage = {
  get(key, def = null) {
    try {
      if (_hasLS) {
        const raw = localStorage.getItem(key);
        return raw == null ? def : JSON.parse(raw);
      }
      return _memStore.has(key) ? _memStore.get(key) : def;
    } catch {
      return def;
    }
  },
  set(key, val) {
    try {
      const raw = JSON.stringify(val);
      if (_hasLS) localStorage.setItem(key, raw);
      else _memStore.set(key, val);
    } catch {
      // no-op
    }
  },
  del(key) {
    try {
      if (_hasLS) localStorage.removeItem(key);
      else _memStore.delete(key);
    } catch {
      // no-op
    }
  },
  has(key) {
    try {
      if (_hasLS) return localStorage.getItem(key) != null;
      return _memStore.has(key);
    } catch {
      return false;
    }
  }
};

/* ------------------------------ Geolocation ---------------------------- */
/** Төхөөрөмж geolocation дэмждэг эсэх */
export const canGeolocate = () => {
  try { return "geolocation" in navigator; } catch { return false; }
};

/** Байршлыг нэг удаа авах (option-уудтай) */
export function getGeoOnce(options = {}) {
  if (!canGeolocate()) return Promise.reject(new Error("Geolocation not supported"));
  const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options };
  return new Promise((resolve, reject) => {
    try {
      navigator.geolocation.getCurrentPosition(resolve, reject, opts);
    } catch (e) {
      reject(e);
    }
  });
}

/** watchPosition wrapper (clear хийхэд id буцаана) */
export function startGeoWatch(onUpdate, options = {}) {
  if (!canGeolocate()) throw new Error("Geolocation not supported");
  const opts = { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000, ...options };
  return navigator.geolocation.watchPosition(
    (pos) => onUpdate?.(pos, null),
    (err) => onUpdate?.(null, err),
    opts
  );
}

export function stopGeoWatch(id) {
  try {
    if (id != null && navigator.geolocation?.clearWatch) navigator.geolocation.clearWatch(id);
  } catch {}
}

/** Байршлын форматлогч (debug-д хэрэгтэй) */
export function fmtLoc(pos) {
  try {
    if (!pos?.coords) return "";
    const { latitude, longitude, accuracy } = pos.coords;
    return `GPS lat=${(+latitude).toFixed(6)} lng=${(+longitude).toFixed(6)} ±${Math.round(+accuracy || 0)}m`;
  } catch {
    return "";
  }
}
