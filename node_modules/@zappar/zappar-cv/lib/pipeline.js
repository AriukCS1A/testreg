import { cameraFrameTextureMatrix, CameraDraw } from "./drawcamera";
import { mat4 } from "gl-matrix";
import { cameraRotationForScreenOrientation } from "./cameramodel";
import { FaceDraw } from "./drawface";
import { FaceDrawProject } from "./drawfaceproject";
import { disposeDrawPlane } from "./drawplane";
import { Event } from "./event";
import { zcerr } from "./loglevel";
import { SequenceRecorder } from "./sequencerecorder";
import { getCameraSource } from "./camera-source-map";
import { PreviewMeshDraw } from "./drawpreviewmesh";
let byId = new Map();
let identity = mat4.create();
export class Pipeline {
    constructor(_client, _impl, _mgr) {
        this._client = _client;
        this._impl = _impl;
        this._mgr = _mgr;
        this.pendingMessages = [];
        this.cameraTokens = new Map();
        this.nextCameraToken = 1;
        this.tokensInFlight = 0;
        this.videoTextures = [];
        this.cameraPixelArrays = [];
        this._sequenceRecordDeviceAttitudeMatrices = true;
        this._sequenceRecorderFirstCameraToken = 0;
        this.onGLContextReset = new Event();
    }
    static create(client, mgr) {
        let ret = client.pipeline_create();
        byId.set(ret, new Pipeline(client, ret, mgr));
        return ret;
    }
    static get(p) {
        return byId.get(p);
    }
    frameUpdate(client) {
        for (let msg of this.pendingMessages) {
            client.processMessages(msg);
            this._mgr.postOutgoingMessage({
                t: "buf",
                p: this._impl,
                d: msg
            }, [msg]);
        }
        this.pendingMessages = [];
        this.cleanOldFrames();
    }
    cleanOldFrames() {
        var _a, _b;
        let currentToken = this._client.pipeline_camera_frame_user_data(this._impl);
        if (!currentToken)
            return;
        for (let t of this.cameraTokens) {
            if (t[0] < currentToken) {
                if (t[1].texture)
                    this.videoTextures.push(t[1].texture);
                (_b = (_a = t[1].frame) === null || _a === void 0 ? void 0 : _a.close) === null || _b === void 0 ? void 0 : _b.call(_a);
                this.cameraTokens.delete(t[0]);
            }
        }
    }
    cameraTokenReturn(msg) {
        if (this._sequenceRecorder && this._sequenceRecordDeviceAttitudeMatrices
            && msg.token >= this._sequenceRecorderFirstCameraToken) {
            let info = this.cameraTokens.get(msg.token);
            if (info) {
                if (msg.att)
                    this._sequenceRecorder.appendAttitudeMatrix(msg.att);
                info.data = msg.d;
                this._sequenceRecorder.appendCameraFrame(info);
            }
        }
        this.cameraPixelArrays.push(msg.d);
        this.tokensInFlight--;
    }
    sequenceRecordStart(expectedFrames) {
        if (!this._sequenceRecorder)
            this._sequenceRecorder = new SequenceRecorder(expectedFrames);
        this._sequenceRecorder.start();
        this._sequenceRecorderFirstCameraToken = this.nextCameraToken;
    }
    sequenceRecordStop() {
        var _a;
        (_a = this._sequenceRecorder) === null || _a === void 0 ? void 0 : _a.stop();
    }
    sequenceRecordData() {
        var _a;
        return ((_a = this._sequenceRecorder) === null || _a === void 0 ? void 0 : _a.data()) || new Uint8Array(0);
    }
    sequenceRecordClear() {
        delete this._sequenceRecorder;
    }
    sequenceRecordDeviceAttitudeMatrices(v) {
        this._sequenceRecordDeviceAttitudeMatrices = v;
    }
    getVideoTexture() {
        return this.videoTextures.pop();
    }
    destroy() {
        this._client.pipeline_destroy(this._impl);
        byId.delete(this._impl);
    }
    getCurrentCameraInfo() {
        let currentToken = this._client.pipeline_camera_frame_user_data(this._impl);
        if (!currentToken)
            return undefined;
        return this.cameraTokens.get(currentToken);
    }
    cameraFrameDrawGL(screenWidth, screenHeight, mirror) {
        if (!this.glContext)
            return;
        let token = this.getCurrentCameraInfo();
        if (!token)
            return;
        if (!this._cameraDraw)
            this._cameraDraw = new CameraDraw(this.glContext);
        this._cameraDraw.drawCameraFrame(screenWidth, screenHeight, token, mirror === true);
    }
    glContextLost() {
        if (this._cameraDraw)
            this._cameraDraw.dispose();
        if (this._faceDraw)
            this._faceDraw.dispose();
        if (this._imageTargetPreviewDraw)
            this._imageTargetPreviewDraw.dispose();
        if (this._faceProjectDraw)
            this._faceProjectDraw.dispose();
        delete this._cameraDraw;
        delete this._faceDraw;
        delete this._imageTargetPreviewDraw;
        delete this._faceProjectDraw;
        disposeDrawPlane();
        this.onGLContextReset.emit();
        for (let tex of this.videoTextures) {
            if (this.glContext)
                this.glContext.deleteTexture(tex);
        }
        this.videoTextures = [];
        for (let info of this.cameraTokens) {
            if (this.glContext && info[1].texture)
                this.glContext.deleteTexture(info[1].texture);
            info[1].texture = undefined;
        }
        this.glContext = undefined;
    }
    glContextSet(gl, texturePool) {
        this.glContextLost();
        this.glContext = gl;
        texturePool = texturePool || [];
        for (let i = 0; i < 4; i++) {
            let tex = texturePool[i] || gl.createTexture();
            if (tex) {
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                this.videoTextures.push(tex);
            }
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    drawFace(projectionMatrix, cameraMatrix, targetMatrix, o) {
        if (!this.glContext)
            return;
        if (!this._faceDraw)
            this._faceDraw = new FaceDraw(this.glContext);
        let mat = mat4.create();
        mat4.multiply(mat, projectionMatrix, cameraMatrix);
        mat4.multiply(mat, mat, targetMatrix);
        this._faceDraw.drawFace(mat, o);
    }
    drawImageTargetPreview(projectionMatrix, cameraMatrix, targetMatrix, indx, o) {
        if (!this.glContext)
            return;
        if (!this._imageTargetPreviewDraw)
            this._imageTargetPreviewDraw = new PreviewMeshDraw(this.glContext);
        let mat = mat4.create();
        mat4.multiply(mat, projectionMatrix, cameraMatrix);
        mat4.multiply(mat, mat, targetMatrix);
        this._imageTargetPreviewDraw.draw(mat, o, indx);
    }
    drawFaceProject(matrix, vertices, uvMatrix, uvs, indices, texture) {
        if (!this.glContext)
            return;
        if (!this._faceProjectDraw)
            this._faceProjectDraw = new FaceDrawProject(this.glContext);
        this._faceProjectDraw.drawFace(matrix, vertices, uvMatrix, uvs, indices, texture);
    }
    cameraFrameTexture() {
        var _a;
        return (_a = this.getCurrentCameraInfo()) === null || _a === void 0 ? void 0 : _a.texture;
    }
    cameraFrameTextureMatrix(sw, sh, mirror) {
        let info = this.getCurrentCameraInfo();
        if (!info)
            return mat4.create();
        return cameraFrameTextureMatrix(info.dataWidth, info.dataHeight, sw, sh, info.uvTransform || identity, mirror);
    }
    cameraFrameUserFacing() {
        var _a;
        return ((_a = this.getCurrentCameraInfo()) === null || _a === void 0 ? void 0 : _a.userFacing) || false;
    }
    cameraPoseWithAttitude(mirror) {
        let res = applyScreenCounterRotation(this.getCurrentCameraInfo(), this._client.pipeline_camera_frame_camera_attitude(this._impl));
        if (mirror) {
            let scale = mat4.create();
            mat4.fromScaling(scale, [-1, 1, 1]);
            mat4.multiply(res, scale, res);
            mat4.multiply(res, res, scale);
        }
        mat4.invert(res, res);
        return res;
    }
    videoFrameFromWorker(msg) {
        let tokenId = this.nextCameraToken++;
        const cameraSource = getCameraSource(msg.source);
        if (!cameraSource)
            return;
        this.cameraTokens.set(tokenId, {
            dataWidth: msg.w,
            dataHeight: msg.h,
            texture: undefined,
            frame: msg.d,
            userFacing: msg.userFacing,
            uvTransform: msg.uvTransform,
            cameraModel: msg.cameraModel,
            cameraToDevice: msg.cameraToDevice,
            cameraSource
        });
        this.cleanOldFrames();
    }
    imageBitmapFromWorker(msg) {
        let data = this.cameraTokens.get(msg.tokenId);
        if (!data)
            return;
        data.dataWidth = msg.dataWidth;
        data.dataHeight = msg.dataHeight;
        data.frame = msg.frame;
        data.userFacing = msg.userFacing;
        data.uvTransform = msg.uvTransform;
        this.tokensInFlight--;
        this.cleanOldFrames();
    }
    uploadGL() {
        var _a, _b;
        let info = this.getCurrentCameraInfo();
        (_b = (_a = info === null || info === void 0 ? void 0 : info.cameraSource) === null || _a === void 0 ? void 0 : _a.uploadGL) === null || _b === void 0 ? void 0 : _b.call(_a, info);
    }
    registerToken(info) {
        let tokenId = this.nextCameraToken++;
        this.cameraTokens.set(tokenId, info);
        this.tokensInFlight++;
        return tokenId;
    }
    processGL() {
        if (!this.glContext) {
            zcerr("no GL context for camera frames - please call pipeline_gl_context_set");
            return;
        }
        if (!this.currentCameraSource)
            return;
        if (this.tokensInFlight > 0) {
            this.currentCameraSource.getFrame(true);
            return;
        }
        this.currentCameraSource.getFrame(false);
    }
    motionAccelerometerSubmit(timestamp, x, y, z) {
        var _a;
        if (!this._sequenceRecordDeviceAttitudeMatrices)
            (_a = this._sequenceRecorder) === null || _a === void 0 ? void 0 : _a.appendAccelerometer(timestamp, x, y, z);
        this._client.pipeline_motion_accelerometer_submit(this._impl, timestamp, x, y, z);
    }
    motionRotationRateSubmit(timestamp, x, y, z) {
        var _a;
        if (!this._sequenceRecordDeviceAttitudeMatrices)
            (_a = this._sequenceRecorder) === null || _a === void 0 ? void 0 : _a.appendRotationRate(timestamp, x, y, z);
        this._client.pipeline_motion_rotation_rate_submit(this._impl, timestamp, x, y, z);
    }
    motionAttitudeSubmit(timestamp, x, y, z) {
        var _a;
        if (!this._sequenceRecordDeviceAttitudeMatrices)
            (_a = this._sequenceRecorder) === null || _a === void 0 ? void 0 : _a.appendAttitude(timestamp, x, y, z);
        this._client.pipeline_motion_attitude_submit(this._impl, timestamp, x, y, z);
    }
    motionAttitudeMatrix(m) {
        // This doesn't need to be added to the sequence since that's done on frame update instead
        this._client.pipeline_motion_attitude_matrix_submit(this._impl, m);
    }
    sendCameraStreamToWorker(source, stream, userFacing) {
        let msg = {
            t: "streamC2S",
            p: this._impl,
            s: stream,
            userFacing,
            source
        };
        this._mgr.postOutgoingMessage(msg, [msg.s]);
    }
    sendCameraToScreenRotationToWorker(rot) {
        let msg = {
            p: this._impl,
            t: "cameraToScreenC2S",
            r: rot
        };
        this._mgr.postOutgoingMessage(msg, []);
    }
    sendImageBitmapToWorker(img, rot, userFacing, tokenId, cameraModel, cameraToDevice) {
        let msg = {
            p: this._impl,
            t: "imageBitmapC2S",
            i: img,
            r: rot,
            tokenId,
            userFacing,
            cameraModel,
            cameraToDevice
        };
        this._mgr.postOutgoingMessage(msg, [img]);
    }
    sendDataToWorker(data, token, width, height, userFacing, cameraToDevice, cameraModel) {
        let msg = {
            d: data,
            p: this._impl,
            width, height, token, userFacing,
            c2d: cameraToDevice,
            cm: cameraModel,
            t: "cameraFrameC2S"
        };
        this._mgr.postOutgoingMessage(msg, [data]);
    }
}
export function applyScreenCounterRotation(info, inp) {
    let userFacing = false;
    userFacing = info ? info.userFacing : false;
    let mult = mat4.create();
    mat4.fromRotation(mult, cameraRotationForScreenOrientation(userFacing) * Math.PI / 180.0, [0, 0, 1]);
    mat4.multiply(mult, mult, inp);
    return mult;
}
