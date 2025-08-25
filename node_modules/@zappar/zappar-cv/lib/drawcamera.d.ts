import { CameraFrameInfo } from "./source";
export declare class CameraDraw {
    private _gl;
    private _vbo;
    private _shader;
    constructor(_gl: WebGLRenderingContext);
    dispose(): void;
    private _generate;
    drawCameraFrame(screenWidth: number, screenHeight: number, i: CameraFrameInfo, mirror: boolean): void;
    private _getCameraShader;
}
export declare function cameraFrameTextureMatrix(frameWidth: number, frameHeight: number, screenWidth: number, screenHeight: number, uvMatrix: Float32Array, mirror: boolean): Float32Array;
