export declare class GLStateManager {
    private _gl;
    static get(gl: WebGLRenderingContext): GLStateManager;
    private _viewports;
    private _underlyingViewport;
    private constructor();
    push(): void;
    pop(): void;
}
