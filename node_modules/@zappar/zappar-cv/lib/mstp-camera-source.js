var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { profile } from "./profile";
import { Pipeline } from "./pipeline";
import { Source } from "./source";
import { cameraRotationForScreenOrientation } from "./cameramodel";
import { zcout } from "./loglevel";
import { deleteCameraSource } from "./camera-source-map";
export class MSTPCameraSource extends Source {
    constructor(_impl, _pipeline, _deviceId) {
        super();
        this._impl = _impl;
        this._pipeline = _pipeline;
        this._deviceId = _deviceId;
        this._currentStream = null;
        this._activeDeviceId = null;
        this._isPaused = true;
        this._isUserFacing = false;
        this._cameraToScreenRotation = 0;
        this._hasStartedOrientation = false;
        this._deviceMotionListener = (ev) => {
            let pipeline = Pipeline.get(this._pipeline);
            if (!pipeline)
                return;
            let timeStamp = (ev.timeStamp !== undefined && ev.timeStamp !== null) ? ev.timeStamp : performance.now();
            if (ev.accelerationIncludingGravity !== null &&
                ev.accelerationIncludingGravity.x !== null &&
                ev.accelerationIncludingGravity.y !== null &&
                ev.accelerationIncludingGravity.z !== null) {
                pipeline.motionAccelerometerSubmit(timeStamp, ev.accelerationIncludingGravity.x * profile.deviceMotionMutliplier, ev.accelerationIncludingGravity.y * profile.deviceMotionMutliplier, ev.accelerationIncludingGravity.z * profile.deviceMotionMutliplier);
            }
            if (ev.rotationRate !== null &&
                ev.rotationRate.alpha !== null &&
                ev.rotationRate.beta !== null &&
                ev.rotationRate.gamma !== null && !this._hasStartedOrientation) {
                ev.timeStamp;
                pipeline.motionRotationRateSubmit(timeStamp, ev.rotationRate.alpha * Math.PI / -180.0, ev.rotationRate.beta * Math.PI / -180.0, ev.rotationRate.gamma * Math.PI / -180.0);
            }
            else if (!this._hasStartedOrientation) {
                this._startDeviceOrientation();
            }
        };
        zcout("Using MSTP camera source");
    }
    destroy() {
        this.pause();
        deleteCameraSource(this._impl);
    }
    _stop() {
        if (!this._currentStream)
            return;
        let tracks = this._currentStream.getTracks();
        tracks.forEach(t => t.stop());
        this._currentStream = null;
    }
    pause() {
        this._isPaused = true;
        let p = Pipeline.get(this._pipeline);
        if (p && p.currentCameraSource === this)
            p.currentCameraSource = undefined;
        this._stopDeviceMotion();
        this._syncCamera();
    }
    start() {
        var _a;
        let p = Pipeline.get(this._pipeline);
        if (p && p.currentCameraSource !== this) {
            (_a = p.currentCameraSource) === null || _a === void 0 ? void 0 : _a.pause();
            p.currentCameraSource = this;
        }
        this._isPaused = false;
        this._startDeviceMotion();
        this._syncCamera();
    }
    _getConstraints() {
        return __awaiter(this, void 0, void 0, function* () {
            let deviceId;
            let facingMode;
            if (this._deviceId !== MSTPCameraSource.DEFAULT_DEVICE_ID &&
                this._deviceId !== MSTPCameraSource.USER_DEFAULT_DEVICE_ID) {
                // Custom device
                deviceId = this._deviceId;
            }
            else {
                facingMode = (this._deviceId === MSTPCameraSource.DEFAULT_DEVICE_ID) ? "environment" : "user";
            }
            let constraints = {
                audio: false,
                video: {
                    facingMode: facingMode,
                    width: profile.videoWidth,
                    height: profile.videoHeight,
                    frameRate: profile.requestHighFrameRate ? 60 : 30,
                    deviceId: deviceId
                }
            };
            if (deviceId)
                return constraints;
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
                return constraints;
            let devices = yield navigator.mediaDevices.enumerateDevices();
            let hasHadCapabilities = false;
            devices = devices.filter(val => {
                // Remove non-video devices
                if (val.kind !== "videoinput")
                    return false;
                // If the media info object contains capabilities, use it to filter to the correct facing cameras
                if (val.getCapabilities) {
                    hasHadCapabilities = true;
                    let capabilities = val.getCapabilities();
                    if (capabilities && capabilities.facingMode && capabilities.facingMode.indexOf(facingMode === "user" ? "user" : "environment") < 0)
                        return false;
                }
                return true;
            });
            // If none of the devices had capability info, or we have no devices left, fall back to the standard constraints
            if (!hasHadCapabilities || devices.length === 0) {
                return constraints;
            }
            if (typeof constraints.video === "object") {
                zcout("choosing device ID", devices[devices.length - 1].deviceId);
                constraints.video.deviceId = devices[devices.length - 1].deviceId;
            }
            return constraints;
        });
    }
    getFrame(allowRead) {
        var _a, _b;
        let rotation = cameraRotationForScreenOrientation(false);
        if (rotation != this._cameraToScreenRotation) {
            (_b = (_a = Pipeline.get(this._pipeline)) === null || _a === void 0 ? void 0 : _a.sendCameraToScreenRotationToWorker) === null || _b === void 0 ? void 0 : _b.call(_a, rotation);
            this._cameraToScreenRotation = rotation;
        }
        return;
    }
    _getUserMedia() {
        return __awaiter(this, void 0, void 0, function* () {
            let constraints = yield this._getConstraints();
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
                return yield navigator.mediaDevices.getUserMedia(constraints);
            return yield new Promise((resolve, reject) => {
                navigator.getUserMedia(constraints, resolve, reject);
            });
        });
    }
    _syncCamera() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._currentStream && this._isPaused) {
                this._stop();
                return;
            }
            if (this._currentStream && this._activeDeviceId !== this._deviceId)
                this._stop();
            if (!this._isPaused) {
                this._activeDeviceId = this._deviceId;
                this._currentStream = yield this._getUserMedia();
                if (this._isPaused) {
                    yield this._syncCamera();
                    return;
                }
                this._isUserFacing = false;
                if (this._currentStream) {
                    let videoTracks = this._currentStream.getVideoTracks();
                    if (videoTracks.length > 0) {
                        this._isUserFacing = videoTracks[0].getSettings().facingMode === "user";
                        let processor = new MediaStreamTrackProcessor({
                            track: videoTracks[0]
                        });
                        let p = Pipeline.get(this._pipeline);
                        if (p)
                            p.sendCameraStreamToWorker(this._impl, processor.readable, this._isUserFacing);
                    }
                }
            }
        });
    }
    _startDeviceOrientation() {
        if (this._hasStartedOrientation)
            return;
        this._hasStartedOrientation = true;
        window.addEventListener("deviceorientation", (ev) => {
            let pipeline = Pipeline.get(this._pipeline);
            if (!pipeline)
                return;
            let timeStamp = (ev.timeStamp !== undefined && ev.timeStamp !== null) ? ev.timeStamp : performance.now();
            if (ev.alpha === null || ev.beta === null || ev.gamma === null)
                return;
            pipeline.motionAttitudeSubmit(timeStamp, ev.alpha, ev.beta, ev.gamma);
        });
    }
    _startDeviceMotion() {
        window.addEventListener("devicemotion", this._deviceMotionListener, false);
    }
    _stopDeviceMotion() {
        window.removeEventListener("devicemotion", this._deviceMotionListener);
    }
    uploadGL(info) {
        const pipeline = Pipeline.get(this._pipeline);
        const gl = pipeline === null || pipeline === void 0 ? void 0 : pipeline.glContext;
        if (!info ||
            info.texture ||
            !info.frame ||
            !pipeline ||
            !gl)
            return;
        let texture = pipeline.getVideoTexture();
        if (!texture)
            return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, info.frame);
        gl.bindTexture(gl.TEXTURE_2D, null);
        info.texture = texture;
        info.frame.close();
        delete info.frame;
    }
}
MSTPCameraSource.USER_DEFAULT_DEVICE_ID = "Simulated User Default Device ID: a908df7f-5661-4d20-b227-a1c15d2fdb4b";
MSTPCameraSource.DEFAULT_DEVICE_ID = "Simulated Default Device ID: a908df7f-5661-4d20-b227-a1c15d2fdb4b";
