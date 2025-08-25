export interface ProcessedFrame {
    data?: ArrayBuffer;
    texture: WebGLTexture | undefined;
    dataWidth: number;
    dataHeight: number;
    uvTransform?: Float32Array;
    userFacing: boolean;
}
export declare class ImageProcessGL {
    private _gl;
    protected _isPaused: boolean;
    protected _hadFrames: boolean;
    protected _isUserFacing: boolean;
    protected _cameraToScreenRotation: number;
    private _isUploadFrame;
    private _computedTransformRotation;
    private _computedFrontCameraRotation;
    private _cameraUvTransform;
    private _framebufferWidth;
    private _framebufferHeight;
    private _framebufferId;
    private _renderTexture;
    private _vertexBuffer;
    private _indexBuffer;
    private _greyscaleShader;
    private _isWebGL2;
    private _instancedArraysExtension;
    constructor(_gl: WebGL2RenderingContext | WebGLRenderingContext);
    resetGLContext(): void;
    destroy(): void;
    uploadFrame(texture: WebGLTexture, img: HTMLVideoElement | HTMLImageElement | ImageBitmap, rotation: number, fc: boolean): void;
    readFrame(texture: WebGLTexture, pixels: ArrayBuffer): ProcessedFrame;
    private _updateTransforms;
    private _getCameraUvTransform;
    private _getFramebuffer;
    private _getVertexBuffer;
    private _getIndexBuffer;
    private _getGreyscaleShader;
}
