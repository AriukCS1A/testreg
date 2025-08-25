import { barcode_format_t, face_landmark_name_t, instant_world_tracker_transform_orientation_t, log_level_t } from "./gen/zappar-native";
interface Message {
    int: () => number;
    float: () => number;
    bool: () => boolean;
    string: () => string;
    dataWithLength: () => ArrayBuffer;
    type: () => number;
    matrix4x4: () => Float32Array;
    matrix3x3: () => Float32Array;
    identityCoefficients: () => Float32Array;
    expressionCoefficients: () => Float32Array;
    cameraModel: () => Float32Array;
    timestamp: () => number;
    barcodeFormat: () => barcode_format_t;
    faceLandmarkName: () => face_landmark_name_t;
    instantTrackerTransformOrientation: () => instant_world_tracker_transform_orientation_t;
    logLevel: () => log_level_t;
}
export declare class MessageDeserializer {
    private _buffer;
    private _i32View;
    private _f32View;
    private _f64View;
    private _u8View;
    private _u16View;
    private _u32View;
    private _offset;
    private _length;
    private _startOffset;
    setData(data: ArrayBuffer): void;
    hasMessage(): boolean;
    private _processor;
    forMessages(cb: (id: number, msg: Message) => void): void;
}
export {};
