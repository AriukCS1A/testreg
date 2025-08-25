import { BTN_TIMELINE, BTN_OFFSETS_LOCKED } from "./config.js";
import { worldToScreen, localPointOnPlane } from "./ar.js";

const introBtnEls = {
  ex: document.getElementById("ibExercise"),
  gr: document.getElementById("ibGrowth"),
  kn: document.getElementById("ibKnowledge"),
};
const introBtnState = { ex:{shown:false,u:null,v:null}, gr:{shown:false,u:null,v:null}, kn:{shown:false,u:null,v:null} };

let vIntro = null, lastUIT = -1, showIntroBtns = false;

export function bindIntroButtons(videoEl){
  vIntro = videoEl;
  showIntroBtns = true;
}
export function stopIntroButtons(){ showIntroBtns=false; ["ex","gr","kn"].forEach(id=>introBtnEls[id].classList.remove("show","mini")); }

export function updateIntroButtons(){
  if (!showIntroBtns || !vIntro) return;
  const t = vIntro.currentTime || 0;
  if (Math.abs(t-lastUIT) < 0.033) return;
  lastUIT = t;

  const segOf = id => {
    const f=BTN_TIMELINE.filter(s=>s.id===id && t>=s.t[0] && t<s.t[1]);
    return f.length?f[f.length-1]:null;
  };
  const proc = (key, el) => {
    const seg = segOf(key);
    const st = introBtnState[key];
    if (seg && seg.show){ st.shown=true; st.u=seg.u; st.v=seg.v; }
    if (st.shown && st.u!=null && st.v!=null){
      const scr = worldToScreen(localPointOnPlane(st.u, st.v));
      if (seg){ el.style.left = scr.x+"px"; el.style.top = scr.y+"px"; el.classList.remove("mini"); }
      else { const off = BTN_OFFSETS_LOCKED[key]||{dx:0,dy:0}; el.style.left=(scr.x+off.dx)+"px"; el.style.top=(scr.y+off.dy)+"px"; el.classList.add("mini"); }
      el.classList.add("show");
    } else el.classList.remove("show","mini");
  };
  proc("ex", introBtnEls.ex); proc("gr", introBtnEls.gr); proc("kn", introBtnEls.kn);
}

// Меню
const menu = document.getElementById("menu");
export function showMenuOverlay(){ menu.style.display="flex"; menu.style.opacity="1"; menu.style.pointerEvents="auto"; }
export function closeMenu(){ menu.style.display="none"; }
