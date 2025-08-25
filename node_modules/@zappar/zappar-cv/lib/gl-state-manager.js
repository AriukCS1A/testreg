const managers = new Map();
export class GLStateManager {
    constructor(_gl) {
        this._gl = _gl;
        this._viewports = [];
        this._underlyingViewport = this._gl.viewport;
        this._viewports.push(this._gl.getParameter(this._gl.VIEWPORT));
        this._gl.viewport = (x, y, width, height) => {
            this._viewports[this._viewports.length - 1] = [x, y, width, height];
            this._underlyingViewport.call(this._gl, x, y, width, height);
        };
    }
    static get(gl) {
        let existing = managers.get(gl);
        if (!existing) {
            existing = new GLStateManager(gl);
            managers.set(gl, existing);
        }
        return existing;
    }
    push() {
        this._viewports.push(this._viewports[this._viewports.length - 1]);
    }
    pop() {
        const current = this._viewports.pop();
        const prev = this._viewports[this._viewports.length - 1];
        if (!current || current[0] !== prev[0] || current[1] !== prev[1] || current[2] !== prev[2] || current[3] !== prev[3]) {
            this._underlyingViewport.call(this._gl, prev[0], prev[1], prev[2], prev[3]);
        }
    }
}
