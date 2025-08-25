export declare class FaceDrawProject {
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
    drawFace(matrix: Float32Array, vertices: Float32Array, uvMatrix: Float32Array, uvs: Float32Array, indices: Uint16Array, texture: WebGLTexture): void;
    private _getShader;
}
