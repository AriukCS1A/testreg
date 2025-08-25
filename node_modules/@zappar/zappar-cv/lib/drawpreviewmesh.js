import { compileShader, linkProgram } from "./shader";
export class PreviewMeshDraw {
    constructor(_gl) {
        this._gl = _gl;
    }
    dispose() {
        if (this._vbo)
            this._gl.deleteBuffer(this._vbo);
        if (this._uvbo)
            this._gl.deleteBuffer(this._uvbo);
        if (this._ibo)
            this._gl.deleteBuffer(this._ibo);
        if (this._shader)
            this._gl.deleteProgram(this._shader.prog);
        this._vbo = undefined;
        this._uvbo = undefined;
        this._ibo = undefined;
        this._shader = undefined;
    }
    _generateIBO(indices, gl) {
        if (this._ibo && this._lastIndices === indices)
            return this._ibo;
        this._lastIndices = indices;
        if (!this._ibo)
            this._ibo = gl.createBuffer();
        if (!this._ibo)
            throw new Error("Unable to create buffer object");
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return this._ibo;
    }
    _generateVBO(face, gl) {
        if (!this._vbo)
            this._vbo = gl.createBuffer();
        if (!this._vbo)
            throw new Error("Unable to create buffer object");
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
        gl.bufferData(gl.ARRAY_BUFFER, face, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return this._vbo;
    }
    _generateUVBO(face, gl) {
        if (!this._uvbo)
            this._uvbo = gl.createBuffer();
        if (!this._uvbo)
            throw new Error("Unable to create buffer object");
        gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbo);
        gl.bufferData(gl.ARRAY_BUFFER, face, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return this._uvbo;
    }
    draw(matrix, tracker, indx) {
        var _a;
        const o = tracker.getPreviewMesh(indx);
        const image = (_a = tracker.getTargetInfo(indx).preview) === null || _a === void 0 ? void 0 : _a.image;
        if (!o || !image)
            return;
        if (!image.complete)
            return;
        let gl = this._gl;
        let shader = this._getShader(gl);
        let v = this._generateVBO(o.vertices, gl);
        let n = this._generateUVBO(o.uvs, gl);
        let i = this._generateIBO(o.indices, gl);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.useProgram(shader.prog);
        gl.uniformMatrix4fv(shader.unif_matrix, false, matrix);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, loadTexture(gl, image));
        gl.uniform1i(shader.unif_skinSampler, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, v);
        gl.vertexAttribPointer(shader.attr_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attr_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, n);
        gl.vertexAttribPointer(shader.attr_textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attr_textureCoord);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i);
        gl.drawElements(gl.TRIANGLES, o.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.disableVertexAttribArray(shader.attr_position);
        gl.disableVertexAttribArray(shader.attr_textureCoord);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    _getShader(gl) {
        if (this._shader)
            return this._shader;
        let prog = gl.createProgram();
        if (!prog)
            throw new Error("Unable to create program");
        let vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
        let fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        gl.attachShader(prog, vertexShader);
        gl.attachShader(prog, fragmentShader);
        linkProgram(gl, prog);
        let unif_matrix = gl.getUniformLocation(prog, "matrix");
        if (!unif_matrix)
            throw new Error("Unable to get uniform location mattrix");
        let unif_skinSampler = gl.getUniformLocation(prog, "skinSampler");
        if (!unif_skinSampler)
            throw new Error("Unable to get uniform location skinSampler");
        this._shader = {
            prog,
            unif_matrix,
            unif_skinSampler,
            attr_position: gl.getAttribLocation(prog, "position"),
            attr_textureCoord: gl.getAttribLocation(prog, "textureCoord")
        };
        return this._shader;
    }
}
const texturesByElement = new Map();
function loadTexture(gl, elm) {
    let existing = texturesByElement.get(elm);
    if (existing)
        return existing;
    existing = gl.createTexture() || undefined;
    if (!existing)
        throw new Error("Unable to create texture");
    texturesByElement.set(elm, existing);
    gl.bindTexture(gl.TEXTURE_2D, existing);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, elm);
    elm.addEventListener("load", () => {
        if (!existing)
            return;
        gl.bindTexture(gl.TEXTURE_2D, existing);
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, elm);
    });
    return existing;
}
let vertexShaderSrc = `
#ifndef GL_ES
#define highp
#define mediump
#define lowp
#endif

uniform mat4 matrix;
attribute vec4 position;
attribute vec2 textureCoord;

varying highp vec2 vTextureCoord;

void main()
{
    gl_Position = matrix * position;
    vTextureCoord = textureCoord;
}`;
let fragmentShaderSrc = `
#define highp mediump
#ifdef GL_ES
    // define default precision for float, vec, mat.
    precision highp float;
#else
#define highp
#define mediump
#define lowp
#endif

varying highp vec2 vTextureCoord;
uniform sampler2D skinSampler;

void main()
{
    gl_FragColor = texture2D(skinSampler, vTextureCoord);
}`;
