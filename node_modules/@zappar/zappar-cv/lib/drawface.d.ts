import { FaceMesh } from "./facemesh";
export declare class FaceDraw {
    private _gl;
    private _vbo;
    private _normalbo;
    private _ibo;
    private _lastIndices;
    private _shader;
    constructor(_gl: WebGLRenderingContext);
    dispose(): void;
    private _generateIBO;
    private _generateVBO;
    private _generateNormalBO;
    drawFace(matrix: Float32Array, o: FaceMesh): void;
    private _getShader;
}
