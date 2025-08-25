import { CameraFrameInfo } from "./source";
export declare enum SequenceRecorderPacketType {
    CAMERA_FRAME = 0,
    ACCELEROMETER = 1,
    ROTATION_RATE = 2,
    ATTITUDE = 3,
    ATTITUDE_MATRIX = 4
}
export declare class SequenceRecorder {
    static headerSizeBytes: number;
    static psbPacketType: number;
    static psbCameraFrameWidth: number;
    static psbCameraFrameHeight: number;
    static psbFlags: number;
    static psbCameraToDeviceTransform: number;
    static psbCameraModel: number;
    static cameraPacketSizeBytes: number;
    static accelerometerPacketSizeBytes: number;
    static rotationRatePacketSizeBytes: number;
    static attitudePacketSizeBytes: number;
    static attitudeMatrixPacketSizeBytes: number;
    private _data;
    private _dataView;
    private _dataUint8;
    private _dataFloat32;
    private _insertionByte;
    private _numberPackets;
    private _started;
    private _hasLoggedUnsuppored;
    constructor(estimatedFrames: number);
    private _estimatedSize;
    start(): void;
    stop(): void;
    data(): Uint8Array;
    appendCameraFrame(c: CameraFrameInfo): void;
    appendAccelerometer(t: number, x: number, y: number, z: number): void;
    appendRotationRate(t: number, x: number, y: number, z: number): void;
    appendAttitude(t: number, x: number, y: number, z: number): void;
    private _appendTimestampedVec3;
    appendAttitudeMatrix(m: Float32Array): void;
    private _growArrayBuffer;
}
export interface SequenceCameraData {
    type: SequenceRecorderPacketType.CAMERA_FRAME;
    width: number;
    height: number;
    greyscale: Uint8Array;
    userFacing: boolean;
    cameraToDevice: Float32Array;
    cameraModel: Float32Array;
}
export interface SequenceVec3Data {
    t: number;
    x: number;
    y: number;
    z: number;
}
export interface SequenceAccelerometerData extends SequenceVec3Data {
    type: SequenceRecorderPacketType.ACCELEROMETER;
}
export interface SequenceRotationRateData extends SequenceVec3Data {
    type: SequenceRecorderPacketType.ROTATION_RATE;
}
export interface SequenceAttitudeData extends SequenceVec3Data {
    type: SequenceRecorderPacketType.ATTITUDE;
}
export interface SequenceAttitudeMatrixData {
    type: SequenceRecorderPacketType.ATTITUDE_MATRIX;
    attitude: Float32Array;
}
export declare type SequencePacketData = SequenceCameraData | SequenceAccelerometerData | SequenceRotationRateData | SequenceAttitudeData | SequenceAttitudeMatrixData;
export declare class SequenceDecoder {
    private _data;
    dataByPacket: Map<number, SequencePacketData>;
    dataByCameraFrame: Map<number, SequenceCameraData>;
    numberPackets: number;
    numberCameraFrames: number;
    numberAccelerometerPackets: number;
    numberRotationRatePackets: number;
    numberAttitudePackets: number;
    numberAttitudeMatrixPackets: number;
    constructor(_data: ArrayBuffer);
}
