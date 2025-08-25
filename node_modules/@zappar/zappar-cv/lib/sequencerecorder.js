import { zcerr } from "./loglevel";
export var SequenceRecorderPacketType;
(function (SequenceRecorderPacketType) {
    SequenceRecorderPacketType[SequenceRecorderPacketType["CAMERA_FRAME"] = 0] = "CAMERA_FRAME";
    SequenceRecorderPacketType[SequenceRecorderPacketType["ACCELEROMETER"] = 1] = "ACCELEROMETER";
    SequenceRecorderPacketType[SequenceRecorderPacketType["ROTATION_RATE"] = 2] = "ROTATION_RATE";
    SequenceRecorderPacketType[SequenceRecorderPacketType["ATTITUDE"] = 3] = "ATTITUDE";
    SequenceRecorderPacketType[SequenceRecorderPacketType["ATTITUDE_MATRIX"] = 4] = "ATTITUDE_MATRIX";
})(SequenceRecorderPacketType || (SequenceRecorderPacketType = {}));
export class SequenceRecorder {
    constructor(estimatedFrames) {
        this._insertionByte = 0;
        this._numberPackets = 0;
        this._started = false;
        this._hasLoggedUnsuppored = false;
        this._data = new ArrayBuffer(this._estimatedSize(estimatedFrames, 320, 240));
        this._dataView = new DataView(this._data);
        this._dataUint8 = new Uint8Array(this._data);
        this._dataFloat32 = new Float32Array(this._data);
    }
    _estimatedSize(frames, cameraFrameWidth, cameraFrameHeight) {
        return SequenceRecorder.headerSizeBytes + (SequenceRecorder.psbPacketType + SequenceRecorder.cameraPacketSizeBytes + cameraFrameWidth * cameraFrameHeight) * frames;
    }
    start() {
        this._started = true;
        this._insertionByte = 0;
        this._numberPackets = 0;
        this._growArrayBuffer(SequenceRecorder.headerSizeBytes);
        let enc = new TextEncoder();
        let headerData = enc.encode("UAR1");
        this._dataUint8.set(headerData);
        this._dataView.setUint32(4, 0, true);
        this._insertionByte += 8;
    }
    stop() {
        this._started = false;
        let trimmed = this._data.slice(0, this._insertionByte);
        this._data = trimmed;
        this._dataUint8 = new Uint8Array(this._data);
        this._dataFloat32 = new Float32Array(this._data);
        this._dataView = new DataView(this._data);
    }
    data() {
        return this._dataUint8;
    }
    appendCameraFrame(c) {
        if (!this._started)
            return;
        if (!c.data) {
            if (this._hasLoggedUnsuppored)
                return;
            this._hasLoggedUnsuppored = true;
            zcerr("Unable to record frames from this camera source");
            return;
        }
        if (c.data.byteLength !== (c.dataWidth * c.dataHeight)) {
            zcerr("Unable to record frame to sequence: greyscale array doesn't match dimensions");
            return;
        }
        let increment = SequenceRecorder.psbPacketType + SequenceRecorder.cameraPacketSizeBytes + (c.dataWidth * c.dataHeight);
        this._growArrayBuffer(increment);
        this._dataView.setUint32(this._insertionByte, SequenceRecorderPacketType.CAMERA_FRAME, true);
        this._insertionByte += SequenceRecorder.psbPacketType;
        this._dataView.setUint32(this._insertionByte, c.dataWidth, true);
        this._insertionByte += SequenceRecorder.psbCameraFrameWidth;
        this._dataView.setUint32(this._insertionByte, c.dataHeight, true);
        this._insertionByte += SequenceRecorder.psbCameraFrameHeight;
        this._dataFloat32.set(c.cameraToDevice, this._insertionByte / 4);
        this._insertionByte += SequenceRecorder.psbCameraToDeviceTransform;
        this._dataFloat32.set(c.cameraModel, this._insertionByte / 4);
        this._insertionByte += SequenceRecorder.psbCameraModel;
        this._dataView.setUint32(this._insertionByte, c.userFacing ? 1 : 0, true);
        this._insertionByte += SequenceRecorder.psbFlags;
        this._dataUint8.set(new Uint8Array(c.data), this._insertionByte);
        this._insertionByte += c.data.byteLength;
        this._numberPackets++;
        this._dataView.setUint32(4, this._numberPackets, true);
    }
    appendAccelerometer(t, x, y, z) {
        this._appendTimestampedVec3(SequenceRecorderPacketType.ACCELEROMETER, t, x, y, z);
    }
    appendRotationRate(t, x, y, z) {
        this._appendTimestampedVec3(SequenceRecorderPacketType.ROTATION_RATE, t, x, y, z);
    }
    appendAttitude(t, x, y, z) {
        this._appendTimestampedVec3(SequenceRecorderPacketType.ATTITUDE, t, x, y, z);
    }
    _appendTimestampedVec3(type, t, x, y, z) {
        if (!this._started)
            return;
        let increment = SequenceRecorder.psbPacketType + SequenceRecorder.accelerometerPacketSizeBytes;
        this._growArrayBuffer(increment);
        this._dataView.setUint32(this._insertionByte, type, true);
        this._insertionByte += SequenceRecorder.psbPacketType;
        this._dataView.setUint32(this._insertionByte, t, true);
        this._insertionByte += 4;
        this._dataView.setFloat32(this._insertionByte, x, true);
        this._insertionByte += 4;
        this._dataView.setFloat32(this._insertionByte, y, true);
        this._insertionByte += 4;
        this._dataView.setFloat32(this._insertionByte, z, true);
        this._insertionByte += 4;
        this._numberPackets++;
        this._dataView.setUint32(4, this._numberPackets, true);
    }
    appendAttitudeMatrix(m) {
        if (!this._started)
            return;
        let increment = SequenceRecorder.psbPacketType + SequenceRecorder.attitudeMatrixPacketSizeBytes;
        this._growArrayBuffer(increment);
        this._dataView.setUint32(this._insertionByte, SequenceRecorderPacketType.ATTITUDE_MATRIX, true);
        this._insertionByte += SequenceRecorder.psbPacketType;
        this._dataFloat32.set(m, this._insertionByte / 4);
        this._insertionByte += SequenceRecorder.attitudeMatrixPacketSizeBytes;
        this._numberPackets++;
        this._dataView.setUint32(4, this._numberPackets, true);
    }
    _growArrayBuffer(requiredIncrement) {
        while (this._insertionByte + requiredIncrement > this._data.byteLength) {
            let newSize = Math.max(this._data.byteLength * 2, this._estimatedSize(50, 320, 240));
            let newData = new ArrayBuffer(newSize);
            let newDataUint8 = new Uint8Array(newData);
            newDataUint8.set(this._dataUint8);
            this._data = newData;
            this._dataUint8 = newDataUint8;
            this._dataFloat32 = new Float32Array(this._data);
            this._dataView = new DataView(this._data);
        }
    }
}
// Header (8 bytes): "UAR1" + number of frames (uint32)
SequenceRecorder.headerSizeBytes = 8;
// Per-frame packet byte sizes
SequenceRecorder.psbPacketType = 4;
// Camera frames
SequenceRecorder.psbCameraFrameWidth = 4;
SequenceRecorder.psbCameraFrameHeight = 4;
SequenceRecorder.psbFlags = 4;
SequenceRecorder.psbCameraToDeviceTransform = 4 * 16;
SequenceRecorder.psbCameraModel = 4 * 6;
SequenceRecorder.cameraPacketSizeBytes = SequenceRecorder.psbCameraFrameWidth +
    SequenceRecorder.psbCameraFrameHeight +
    SequenceRecorder.psbCameraToDeviceTransform +
    SequenceRecorder.psbCameraModel +
    SequenceRecorder.psbFlags;
// Accelerometer
SequenceRecorder.accelerometerPacketSizeBytes = 4 * 4; // t, x, y, z
// Rotation rate
SequenceRecorder.rotationRatePacketSizeBytes = 4 * 4; // t, x, y, z
// Attitude
SequenceRecorder.attitudePacketSizeBytes = 4 * 4; // t, x, y, z
// Attitude matrix
SequenceRecorder.attitudeMatrixPacketSizeBytes = 4 * 16;
export class SequenceDecoder {
    constructor(_data) {
        this._data = _data;
        this.dataByPacket = new Map();
        this.dataByCameraFrame = new Map();
        this.numberPackets = 0;
        this.numberCameraFrames = 0;
        this.numberAccelerometerPackets = 0;
        this.numberRotationRatePackets = 0;
        this.numberAttitudePackets = 0;
        this.numberAttitudeMatrixPackets = 0;
        let dec = new TextDecoder();
        let txt = "";
        try {
            txt = dec.decode(this._data.slice(0, 4));
        }
        catch (err) {
            throw new Error("Unable to decode header - perhaps this isn't a sequence file?");
        }
        if (txt !== "UAR1") {
            throw new Error(`Invalid - perhaps this isn't a sequence file: ${txt}`);
        }
        let readPoint = 0;
        let dataView = new DataView(this._data);
        this.numberPackets = dataView.getUint32(4, true);
        readPoint += SequenceRecorder.headerSizeBytes;
        for (let i = 0; i < this.numberPackets; i++) {
            let type = dataView.getUint32(readPoint, true);
            readPoint += SequenceRecorder.psbPacketType;
            switch (type) {
                case SequenceRecorderPacketType.CAMERA_FRAME:
                    {
                        let width = dataView.getUint32(readPoint, true);
                        readPoint += SequenceRecorder.psbCameraFrameWidth;
                        let height = dataView.getUint32(readPoint, true);
                        readPoint += SequenceRecorder.psbCameraFrameHeight;
                        let cameraToDevice = new Float32Array(this._data, readPoint, SequenceRecorder.psbCameraToDeviceTransform / 4);
                        readPoint += SequenceRecorder.psbCameraToDeviceTransform;
                        let cameraModel = new Float32Array(this._data, readPoint, SequenceRecorder.psbCameraModel / 4);
                        readPoint += SequenceRecorder.psbCameraModel;
                        let flags = dataView.getUint32(readPoint, true);
                        readPoint += SequenceRecorder.psbFlags;
                        let userFacing = flags === 1;
                        let greyscale = new Uint8Array(this._data, readPoint, width * height);
                        readPoint += width * height;
                        let d = {
                            type: SequenceRecorderPacketType.CAMERA_FRAME,
                            width,
                            height,
                            cameraToDevice,
                            cameraModel,
                            userFacing,
                            greyscale
                        };
                        this.dataByPacket.set(i, d);
                        this.dataByCameraFrame.set(this.numberCameraFrames, d);
                        this.numberCameraFrames++;
                        break;
                    }
                case SequenceRecorderPacketType.ACCELEROMETER:
                    {
                        let t = dataView.getUint32(readPoint, true);
                        readPoint += 4;
                        let x = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        let y = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        let z = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        this.dataByPacket.set(i, {
                            type: SequenceRecorderPacketType.ACCELEROMETER,
                            t, x, y, z
                        });
                        this.numberAccelerometerPackets++;
                        break;
                    }
                case SequenceRecorderPacketType.ROTATION_RATE:
                    {
                        let t = dataView.getUint32(readPoint, true);
                        readPoint += 4;
                        let x = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        let y = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        let z = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        this.dataByPacket.set(i, {
                            type: SequenceRecorderPacketType.ROTATION_RATE,
                            t, x, y, z
                        });
                        this.numberRotationRatePackets++;
                        break;
                    }
                case SequenceRecorderPacketType.ATTITUDE:
                    {
                        let t = dataView.getUint32(readPoint, true);
                        readPoint += 4;
                        let x = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        let y = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        let z = dataView.getFloat32(readPoint, true);
                        readPoint += 4;
                        this.dataByPacket.set(i, {
                            type: SequenceRecorderPacketType.ATTITUDE,
                            t, x, y, z
                        });
                        this.numberAttitudePackets++;
                        break;
                    }
                case SequenceRecorderPacketType.ATTITUDE_MATRIX:
                    {
                        let attitude = new Float32Array(this._data, readPoint, SequenceRecorder.attitudeMatrixPacketSizeBytes / 4);
                        readPoint += SequenceRecorder.attitudeMatrixPacketSizeBytes;
                        this.dataByPacket.set(i, {
                            type: SequenceRecorderPacketType.ATTITUDE_MATRIX,
                            attitude
                        });
                        this.numberAttitudeMatrixPackets++;
                        break;
                    }
            }
        }
    }
}
