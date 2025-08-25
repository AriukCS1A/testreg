import { CameraSource } from "./camera-source";
import { ImageBitmapCameraSource } from "./imagebitmap-camera-source";
import { zcout } from "./loglevel";
import { MSTPCameraSource } from "./mstp-camera-source";
import { profile } from "./profile";
let latest = 1;
let byId = new Map();
export function getNextCameraSourceId() {
    return (latest++);
}
export function setCameraSourceId(id, c) {
    byId.set(id, c);
}
export function getCameraSource(id) {
    return byId.get(id);
}
export function deleteCameraSource(id) {
    byId.delete(id);
}
export function createCameraSource(p, deviceId) {
    let ret = getNextCameraSourceId();
    if (profile.preferMediaStreamTrackProcessorCamera &&
        'MediaStreamTrackProcessor' in window &&
        'MediaStreamTrackGenerator' in window)
        setCameraSourceId(ret, new MSTPCameraSource(ret, p, deviceId));
    else if (profile.preferImageBitmapCamera && typeof OffscreenCanvas !== "undefined")
        setCameraSourceId(ret, new ImageBitmapCameraSource(ret, p, deviceId));
    else
        setCameraSourceId(ret, new CameraSource(ret, p, deviceId));
    zcout("camera_source_t initialized");
    return ret;
}
