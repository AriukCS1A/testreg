export const $ = sel => document.querySelector(sel);
export const $$ = sel => Array.from(document.querySelectorAll(sel));
export const dbg = (m) => { const el = $("#debug"); if (el) el.textContent = "DEBUG: " + m; };
export const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// storage
export const storage = {
  get(key, def=null){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch{ return def; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },
  del(key){ localStorage.removeItem(key); }
};
