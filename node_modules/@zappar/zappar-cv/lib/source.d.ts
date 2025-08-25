/// <reference types="dom-webcodecs" />
export interface CameraFrameInfo {
    data?: ArrayBuffer;
    texture: WebGLTexture | undefined;
    dataWidth: number;
    dataHeight: number;
    cameraModel: Float32Array;
    cameraToDevice: Float32Array;
    cameraSource: Source;
    cameraSourceData?: any;
    uvTransform?: Float32Array;
    userFacing: boolean;
    frame?: VideoFrame | ImageBitmap;
}
export declare abstract class Source {
    abstract getFrame(currentlyProcessing: boolean): void;
    abstract pause(): void;
    abstract uploadGL(info: CameraFrameInfo): void;
}
