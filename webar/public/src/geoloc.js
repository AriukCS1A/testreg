// geoloc.js — энгийн геолок функцууд

let watchId = null;

export function canGeolocate(){
  return 'geolocation' in navigator;
}

export async function getOnce(options={}){
  if (!canGeolocate()) throw new Error("Geolocation not supported");
  const opts = {
    enableHighAccuracy: true,  // GPS чадамжтай бол өндөр нарийвчлал
    timeout: 10000,            // 10 сек дотор ирэхгүй бол алдаа
    maximumAge: 0,
    ...options
  };
  return new Promise((resolve, reject)=>{
    navigator.geolocation.getCurrentPosition(
      (pos)=> resolve(normalize(pos)),
      (err)=> reject(err),
      opts
    );
  });
}

export function startWatch(onUpdate, options={}){
  if (!canGeolocate()) throw new Error("Geolocation not supported");
  const opts = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 5000,
    ...options
  };
  if (watchId!=null) stopWatch();
  watchId = navigator.geolocation.watchPosition(
    (pos)=> onUpdate?.(normalize(pos)),
    (err)=> onUpdate?.({ error: err }),
    opts
  );
}

export function stopWatch(){
  if (watchId!=null && navigator.geolocation?.clearWatch){
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

function normalize(pos){
  const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = pos.coords || {};
  return {
    lat: latitude, lng: longitude, acc: accuracy,
    alt: altitude ?? null, altAcc: altitudeAccuracy ?? null,
    heading: heading ?? null, speed: speed ?? null,
    ts: pos.timestamp
  };
}
