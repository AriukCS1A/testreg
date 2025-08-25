import { ImageTracker } from "./imagetracker";
export declare class PreviewMeshDraw {
    private _gl;
    private _vbo;
    private _uvbo;
    private _ibo;
    private _lastIndices;
    private _shader;
    constructor(_gl: WebGLRenderingContext);
    dispose(): void;
    private _generateIBO;
    private _generateVBO;
    private _generateUVBO;
    draw(matrix: Float32Array, tracker: ImageTracker, indx: number): void;
    private _getShader;
}
