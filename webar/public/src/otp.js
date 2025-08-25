import { OTP_CODE_STATIC, OTP_STORE_KEY } from "./config.js";
import { dbg, storage } from "./utils.js";

const els = {
  gate: document.getElementById("otpGate"),
  phone: document.getElementById("otpPhone"),
  send:  document.getElementById("btnSendCode"),
  wrap:  document.getElementById("otpCodeWrap"),
  inputsWrap: document.getElementById("otpInputs"),
  verify: document.getElementById("btnVerifyCode"),
  error: document.getElementById("otpError"),
  resend: document.getElementById("btnResend"),
  timer: document.getElementById("otpTimer"),
  reset: document.getElementById("btnOtpReset"),
};

function isOtpVerified(){
  const d = storage.get(OTP_STORE_KEY);
  return !!(d && d.ok === true);         // once-per-device
}
function saveOtpVerified(phone){
  storage.set(OTP_STORE_KEY, { ok:true, phone: phone||"", ts: Date.now() });
}

function createInputs(){
  els.inputsWrap.innerHTML="";
  for (let i=0;i<6;i++){
    const inp = document.createElement("input");
    inp.maxLength=1; inp.inputMode="numeric"; inp.pattern="\\d*";
    inp.addEventListener("input", e=>{ e.target.value=e.target.value.replace(/\D/g,"").slice(0,1); if (e.target.value && i<5) els.inputsWrap.children[i+1].focus(); });
    inp.addEventListener("keydown", e=>{ if (e.key==="Backspace" && !e.target.value && i>0) els.inputsWrap.children[i-1].focus(); });
    inp.addEventListener("paste", e=>{
      const txt=(e.clipboardData.getData("text")||"").replace(/\D/g,"").slice(0,6);
      if (!txt) return; e.preventDefault();
      [...txt].forEach((d,idx)=>{ if (els.inputsWrap.children[idx]) els.inputsWrap.children[idx].value=d; });
      if (txt.length===6) els.verify.click();
    });
    els.inputsWrap.appendChild(inp);
  }
}
function enteredCode(){ return [...els.inputsWrap.querySelectorAll("input")].map(i=>i.value||"").join(""); }
function clearInputs(){ els.inputsWrap.querySelectorAll("input").forEach(i=>i.value=""); els.inputsWrap.firstChild?.focus(); }
function showError(m){ els.error.textContent=m||""; }
function setCooldown(sec=60){
  let left=sec; els.resend.disabled=true; els.timer.textContent=left;
  const iv=setInterval(()=>{ left--; els.timer.textContent=left; if (left<=0){ clearInterval(iv); els.resend.disabled=false; } },1000);
}

export async function ensureOtp(openCb){
  // openCb: баталгаажмагц юу хийх вэ (интро эхлүүлэх)
  if (isOtpVerified()){ openCb?.(); return; }

  // UI setup
  els.gate.hidden=false; createInputs(); showError(""); els.wrap.hidden=true;
  els.send.onclick = () => {
    const p = (els.phone.value||"").replace(/\D/g,"");
    if (p.length!==8){ showError("Утасны 8 цифр оруулна уу."); return; }
    showError(""); els.wrap.hidden=false; clearInputs(); setCooldown(60); dbg("OTP sent (demo): "+OTP_CODE_STATIC);
  };
  els.verify.onclick = () => {
    const code = enteredCode();
    if (code.length!==6){ showError("6 оронтой кодоо бүрэн оруулна уу."); return; }
    if (code!==OTP_CODE_STATIC){ showError("Буруу код. Дахин оролдоно уу."); return; }
    saveOtpVerified(els.phone.value);
    els.gate.hidden=true; showError("");
    openCb?.();
  };
  els.resend.onclick = ()=>{ clearInputs(); setCooldown(60); dbg("OTP re-sent (demo): "+OTP_CODE_STATIC); };
  els.reset.onclick  = ()=>{ storage.del(OTP_STORE_KEY); els.gate.hidden=false; };
}
