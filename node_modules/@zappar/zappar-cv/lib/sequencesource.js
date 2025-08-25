import { zcerr, zcout } from "./loglevel";
import { SequenceDecoder, SequenceRecorderPacketType } from "./sequencerecorder";
import { Source } from "./source";
import { Pipeline } from "./pipeline";
import { mat4 } from "gl-matrix";
let latest = 1;
let byId = new Map();
export class SequenceSource extends Source {
    constructor(_impl, _pipeline) {
        super();
        this._impl = _impl;
        this._pipeline = _pipeline;
        this._packetNumber = 0;
        this._motionUpdatesQueued = 0;
        this._motionUpdatesSent = 0;
        this._minFrameGapMs = 0;
        this._lastUpdateTime = 0;
    }
    static create(p) {
        let ret = (latest++);
        byId.set(ret, new SequenceSource(ret, p));
        zcout("sequence_source_source_t initialized");
        return ret;
    }
    static get(m) {
        return byId.get(m);
    }
    loadFromMemory(data) {
        try {
            this._decoder = new SequenceDecoder(data);
            this._packetNumber = 0;
            this._lastUpdateTime = 0;
        }
        catch (err) {
            zcerr("Unable to decode sequence:", err);
        }
    }
    maxPlaybackFpsSet(fps) {
        if (fps <= 0) {
            this._minFrameGapMs = 0;
            return;
        }
        this._minFrameGapMs = 1000.0 / fps;
    }
    setTime(t) {
        if (t < 0)
            delete this._time;
        else
            this._time = t;
    }
    getFrame(currentlyProcessing) {
        var _a;
        let pipeline = Pipeline.get(this._pipeline);
        if (!pipeline)
            return;
        if (!this._decoder)
            return;
        this._submitMotionUpdates(pipeline);
        if (this._motionUpdatesQueued > this._motionUpdatesSent)
            return;
        if (currentlyProcessing)
            return;
        let curTime = (_a = this._time) !== null && _a !== void 0 ? _a : performance.now();
        if (curTime < this._lastUpdateTime + this._minFrameGapMs)
            return;
        if (this._packetNumber >= this._decoder.numberPackets)
            return;
        let packet = this._decoder.dataByPacket.get(this._packetNumber);
        if (packet.type != SequenceRecorderPacketType.CAMERA_FRAME)
            return;
        this._packetNumber++;
        let pixels = pipeline.cameraPixelArrays.pop();
        while (pixels) {
            if (pixels.byteLength === packet.greyscale.byteLength)
                break;
            pixels = pipeline.cameraPixelArrays.pop();
        }
        if (!pixels) {
            pixels = new ArrayBuffer(packet.greyscale.byteLength);
        }
        (new Uint8Array(pixels)).set(packet.greyscale);
        this._lastUpdateTime = curTime;
        let info = {
            data: pixels,
            cameraSourceData: packet.greyscale,
            cameraModel: packet.cameraModel,
            cameraToDevice: packet.cameraToDevice,
            dataWidth: packet.width,
            dataHeight: packet.height,
            texture: undefined,
            userFacing: packet.userFacing,
            uvTransform: mat4.create(),
            cameraSource: this
        };
        // We can queue the motion updates for the follwing frame immediately
        // as this camera frame will be sent immediately, but the next motion
        // updates will be one frame later
        this._submitMotionUpdates(pipeline);
        const token = pipeline.registerToken(info);
        pipeline.sendDataToWorker(info.data || new ArrayBuffer(0), token, info.dataWidth, info.dataHeight, info.userFacing, info.cameraToDevice, info.cameraModel);
    }
    destroy() {
        byId.delete(this._impl);
        this.pause();
    }
    start() {
        var _a;
        let p = Pipeline.get(this._pipeline);
        if (p && p.currentCameraSource !== this) {
            (_a = p.currentCameraSource) === null || _a === void 0 ? void 0 : _a.pause();
            p.currentCameraSource = this;
        }
    }
    pause() {
        let p = Pipeline.get(this._pipeline);
        if (p && p.currentCameraSource === this)
            p.currentCameraSource = undefined;
    }
    uploadGL(info) {
        let pipeline = Pipeline.get(this._pipeline);
        if (!pipeline)
            return;
        let gl = pipeline === null || pipeline === void 0 ? void 0 : pipeline.glContext;
        if (!gl)
            return;
        if (!info.texture)
            info.texture = pipeline.getVideoTexture();
        if (!info.texture)
            return;
        if (!info.cameraSourceData)
            return;
        gl.bindTexture(gl.TEXTURE_2D, info.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, info.dataWidth, info.dataHeight, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(info.cameraSourceData));
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    _submitMotionUpdates(pipeline) {
        let pendingMotionUpdate = false;
        while (this._packetNumber < this._decoder.numberPackets) {
            let packet = this._decoder.dataByPacket.get(this._packetNumber);
            if (packet.type == SequenceRecorderPacketType.CAMERA_FRAME)
                break;
            switch (packet.type) {
                case SequenceRecorderPacketType.ACCELEROMETER:
                    pipeline.motionAccelerometerSubmit(packet.t, packet.x, packet.y, packet.z);
                    pendingMotionUpdate = true;
                    break;
                case SequenceRecorderPacketType.ROTATION_RATE:
                    pipeline.motionRotationRateSubmit(packet.t, packet.x, packet.y, packet.z);
                    pendingMotionUpdate = true;
                    break;
                case SequenceRecorderPacketType.ATTITUDE:
                    pipeline.motionAttitudeSubmit(packet.t, packet.x, packet.y, packet.z);
                    pendingMotionUpdate = true;
                    break;
                case SequenceRecorderPacketType.ATTITUDE_MATRIX:
                    pipeline.motionAttitudeMatrix(packet.attitude);
                    pendingMotionUpdate = true;
                    break;
            }
            this._packetNumber++;
        }
        // If we've submitted motion updates, add a setTimeout to reflect when
        // the message serializer will actually have sent them over to the worker
        if (pendingMotionUpdate) {
            this._motionUpdatesQueued++;
            setTimeout(() => {
                this._motionUpdatesSent++;
            }, 0);
        }
        return;
    }
}
