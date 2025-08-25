export const VIDEO_ROT_Z = 0;

// алсын URL-ууд (локал хэрэглэвэл public/assets/video/ руу тавиад линкээ солиорой)
export const INTRO_WEBM_URL    = "https://res.cloudinary.com/djailgt2g/video/upload/v1755665483/webar/video/aymmoaxnpoie2avqemcc.webm";
export const INTRO_MP4_URL     = "https://ariukcs1a.github.io/video/intro1_SBS.mp4";
export const EXERCISE_WEBM_URL = "https://res.cloudinary.com/djailgt2g/video/upload/v1755575236/webar/video/atdd74gkrkpynzvcpcrj.webm";
export const EXERCISE_MP4_URL  = "https://ariukcs1a.github.io/video/dasgal_SBS.mp4";

// интро товч world-track (u,v: -1..+1)
export const BTN_TIMELINE = [
  { id:"ex", t:[20.5,22.8], u:-0.25, v:0.27, show:true },
  { id:"gr", t:[30.5,33.2], u: 0.26, v:0.23, show:true },
  { id:"kn", t:[35.0,37.0], u:-0.25, v:0.02, show:true },
];
export const BTN_OFFSETS_LOCKED = {
  ex:{dx:-5,dy:-28}, kn:{dx:-5,dy:28}, gr:{dx:15,dy:0},
};

// OTP
export const OTP_CODE_STATIC = "000000";
export const OTP_STORE_KEY   = "otp_verified_v1"; // once-per-device
