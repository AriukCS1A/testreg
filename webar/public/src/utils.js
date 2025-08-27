// utils.js

export const $  = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// iOS таних (iPadOS 13+ Mac гэж танилцуулахыг хамруулсан)
export const isIOS =
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// dbg: олон аргумент хүлээж авч, UI дээр ба консол дээр хоёуланд нь харуулна
export const dbg = (...args) => {
  const msg = args.map(a => {
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  }).join(' ');
  const el = $("#debug");
  if (el) el.textContent = "DEBUG: " + msg;
  // console-д давхар үлдээнэ (app.js wrapper үүгээр дамжина)
  console.log(msg);
};

// storage
export const storage = {
  get(key, def = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? def : JSON.parse(raw);
    } catch {
      return def;
    }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  del(key)      { localStorage.removeItem(key); }
};
