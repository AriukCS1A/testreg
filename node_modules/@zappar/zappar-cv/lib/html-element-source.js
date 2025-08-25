import { Pipeline } from "./pipeline";
import { Source } from "./source";
import { profile } from "./profile";
import { mat4 } from "gl-matrix";
import { zcout } from "./loglevel";
import { ImageProcessGL } from "./image-process-gl";
let latest = 1;
let byId = new Map();
export class HTMLElementSource extends Source {
    constructor(_video, _pipeline) {
        super();
        this._video = _video;
        this._pipeline = _pipeline;
        this._isPaused = true;
        this._hadFrames = false;
        this._isUserFacing = false;
        this._cameraToScreenRotation = 0;
        this._isUploadFrame = true;
        this._cameraToDeviceTransform = mat4.create();
        this._cameraToDeviceTransformUserFacing = mat4.create();
        this._cameraModel = new Float32Array([300, 300, 160, 120, 0, 0]);
        mat4.fromScaling(this._cameraToDeviceTransformUserFacing, [-1, 1, -1]);
        let video = this._video;
        if (this._video instanceof HTMLVideoElement) {
            video.addEventListener("loadedmetadata", () => { this._hadFrames = true; });
        }
        else {
            this._hadFrames = true;
        }
        this._resetGLContext = this._resetGLContext.bind(this);
        let p = Pipeline.get(this._pipeline);
        if (p)
            p.onGLContextReset.bind(this._resetGLContext);
    }
    static createVideoElementSource(p, element) {
        let ret = (latest++);
        byId.set(ret, new HTMLElementSource(element, p));
        zcout("html_element_source_t initialized");
        return ret;
    }
    static getVideoElementSource(m) {
        return byId.get(m);
    }
    _resetGLContext() {
        var _a, _b;
        this._currentVideoTexture = undefined;
        (_b = (_a = this._imageProcessor) === null || _a === void 0 ? void 0 : _a.resetGLContext) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    destroy() {
        let p = Pipeline.get(this._pipeline);
        if (p)
            p.onGLContextReset.unbind(this._resetGLContext);
        this.pause();
        this._resetGLContext();
    }
    pause() {
        this._isPaused = true;
        let p = Pipeline.get(this._pipeline);
        if (p && p.currentCameraSource === this)
            p.currentCameraSource = undefined;
    }
    start() {
        var _a;
        if (this._isPaused) {
            this._isUploadFrame = true;
            if (this._video instanceof HTMLVideoElement)
                this._hadFrames = false;
        }
        this._isPaused = false;
        let p = Pipeline.get(this._pipeline);
        if (p && p.currentCameraSource !== this) {
            (_a = p.currentCameraSource) === null || _a === void 0 ? void 0 : _a.pause();
            p.currentCameraSource = this;
        }
    }
    getFrame(currentlyProcessing) {
        let pipeline = Pipeline.get(this._pipeline);
        if (!pipeline)
            return;
        let gl = pipeline.glContext;
        if (!gl)
            return;
        if (this._isPaused)
            return;
        if (!this._hadFrames)
            return;
        try {
            let info = this._processFrame(gl, this._cameraToScreenRotation, currentlyProcessing);
            if (info) {
                let token = pipeline.registerToken(info);
                pipeline.sendDataToWorker(info.data || new ArrayBuffer(0), token, info.dataWidth, info.dataHeight, info.userFacing, info.cameraToDevice, info.cameraModel);
            }
        }
        catch (ex) {
            console.log("Unable to process frame");
        }
        return;
    }
    _processFrame(gl, rotation, currentlyProcessing) {
        let pipeline = Pipeline.get(this._pipeline);
        if (!pipeline)
            return undefined;
        if (!this._imageProcessor)
            this._imageProcessor = new ImageProcessGL(gl);
        if (this._isUploadFrame) {
            if (!this._currentVideoTexture) {
                this._currentVideoTexture = pipeline.getVideoTexture();
            }
            if (!this._currentVideoTexture)
                return undefined;
            this._imageProcessor.uploadFrame(this._currentVideoTexture, this._video, rotation, this._isUserFacing);
            this._isUploadFrame = !this._isUploadFrame;
            return undefined;
        }
        if (currentlyProcessing || !this._currentVideoTexture)
            return undefined;
        this._isUploadFrame = !this._isUploadFrame;
        let greySize = profile.dataWidth * profile.dataHeight;
        let pixels = pipeline.cameraPixelArrays.pop();
        while (pixels) {
            if (pixels.byteLength === greySize)
                break;
            pixels = pipeline.cameraPixelArrays.pop();
        }
        if (!pixels) {
            pixels = new ArrayBuffer(greySize);
        }
        let tex = this._currentVideoTexture;
        this._currentVideoTexture = undefined;
        let focalLength = 300.0 * profile.dataWidth / 320.0;
        this._cameraModel[0] = focalLength;
        this._cameraModel[1] = focalLength;
        this._cameraModel[2] = profile.dataWidth * 0.5;
        this._cameraModel[3] = profile.dataHeight * 0.5;
        return Object.assign(Object.assign({}, this._imageProcessor.readFrame(tex, pixels)), { cameraModel: this._cameraModel, cameraSource: this, cameraToDevice: (this._isUserFacing ? this._cameraToDeviceTransformUserFacing : this._cameraToDeviceTransform) });
    }
    uploadGL() {
        // No-op as already uploaded
    }
}
