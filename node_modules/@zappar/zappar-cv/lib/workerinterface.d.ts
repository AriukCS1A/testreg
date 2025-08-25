/// <reference types="dom-webcodecs" />
import { zappar_camera_source_t, zappar_pipeline_t } from "./gen/zappar-native";
export interface CameraFrameC2S {
    t: "cameraFrameC2S";
    d: ArrayBuffer;
    p: zappar_pipeline_t;
    userFacing: boolean;
    c2d: Float32Array;
    cm: Float32Array;
    token: number;
    width: number;
    height: number;
}
export interface CameraFrameReturnS2C {
    t: "cameraFrameRecycleS2C";
    token: number;
    d: ArrayBuffer;
    p: zappar_pipeline_t;
    att?: Float32Array;
}
export interface VideoFrameS2C {
    t: "videoFrameS2C";
    token: number;
    d: VideoFrame;
    p: zappar_pipeline_t;
    source: zappar_camera_source_t;
    userFacing: boolean;
    uvTransform: Float32Array;
    w: number;
    h: number;
    cameraModel: Float32Array;
    cameraToDevice: Float32Array;
}
export interface StreamC2S {
    t: "streamC2S";
    p: zappar_pipeline_t;
    s: ReadableStream<VideoFrame>;
    userFacing: boolean;
    source: zappar_camera_source_t;
}
export interface CameraToScreenRotationC2S {
    t: "cameraToScreenC2S";
    p: zappar_pipeline_t;
    r: number;
}
export interface ImageBitmapC2S {
    t: "imageBitmapC2S";
    p: zappar_pipeline_t;
    i: ImageBitmap;
    r: number;
    userFacing: boolean;
    tokenId: number;
    cameraModel: Float32Array;
    cameraToDevice: Float32Array;
}
export interface ImageBitmapS2C {
    t: "imageBitmapS2C";
    p: zappar_pipeline_t;
    dataWidth: number;
    dataHeight: number;
    uvTransform: Float32Array;
    userFacing: boolean;
    frame: ImageBitmap;
    tokenId: number;
}
