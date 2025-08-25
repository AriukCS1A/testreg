import { compileShader, linkProgram } from "./shader";
export class FaceDrawProject {
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
        gl.bufferData(gl.ARRAY_BUFFER, face, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return this._vbo;
    }
    _generateUVBO(face, gl) {
        if (!this._uvbo)
            this._uvbo = gl.createBuffer();
        if (!this._uvbo)
            throw new Error("Unable to create buffer object");
        gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbo);
        gl.bufferData(gl.ARRAY_BUFFER, face, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return this._uvbo;
    }
    drawFace(matrix, vertices, uvMatrix, uvs, indices, texture) {
        let gl = this._gl;
        let shader = this._getShader(gl);
        let v = this._generateVBO(vertices, gl);
        let u = this._generateUVBO(uvs, gl);
        let i = this._generateIBO(indices, gl);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.ONE, gl.ONE);
        // gl.blendEquation(gl.FUNC_SUBTRACT);
        gl.useProgram(shader.prog);
        gl.uniformMatrix4fv(shader.unif_matrix, false, matrix);
        gl.uniformMatrix4fv(shader.unif_uvmatrix, false, uvMatrix);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(shader.unif_sampler, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, v);
        gl.vertexAttribPointer(shader.attr_position, 3, gl.FLOAT, false, 3 * 4, 0);
        gl.enableVertexAttribArray(shader.attr_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, u);
        gl.vertexAttribPointer(shader.attr_uv, 3, gl.FLOAT, false, 3 * 4, 0);
        gl.enableVertexAttribArray(shader.attr_uv);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i);
        gl.drawElements(gl.TRIANGLES, 2304 * 3, gl.UNSIGNED_SHORT, 0);
        gl.disableVertexAttribArray(shader.attr_position);
        gl.disableVertexAttribArray(shader.attr_uv);
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
            throw new Error("Unable to get uniform location matrix");
        let unif_uvmatrix = gl.getUniformLocation(prog, "uvmatrix");
        if (!unif_uvmatrix)
            throw new Error("Unable to get uniform location matrix");
        let unif_sampler = gl.getUniformLocation(prog, "uSampler");
        if (!unif_sampler)
            throw new Error("Unable to get uniform location sampler");
        this._shader = {
            prog,
            unif_matrix,
            unif_sampler,
            unif_uvmatrix,
            attr_position: gl.getAttribLocation(prog, "position"),
            attr_uv: gl.getAttribLocation(prog, "uv"),
            attr_texturecoord: gl.getAttribLocation(prog, "aTextureCoord"),
        };
        return this._shader;
    }
}
let vertexShaderSrc = `
#ifndef GL_ES
#define highp
#define mediump
#define lowp
#endif

uniform mat4 matrix;
uniform mat4 uvmatrix;
attribute vec4 position;
attribute vec3 normal;
attribute vec3 uv;

// varying highp vec3 vnormal;

varying highp vec2 vTextureCoord;
varying highp float vAlpha;

void main()
{
    gl_Position = matrix * position;
    vec4 ret = uvmatrix * vec4(uv.x, uv.y, uv.z, 1.0);
    ret.x /= ret.w * 2.0;
    ret.y /= ret.w * 2.0;
    ret.x += 0.5;
    ret.y += 0.0;
    vAlpha = 1.0;
    vTextureCoord = ret.xy;
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
varying highp vec3 vnormal;
varying highp float vAlpha;
uniform lowp sampler2D uSampler;

void main()
{
    // vec3 normal2 = 0.5 * vnormal + 0.5;
    vec4 p = texture2D(uSampler, vTextureCoord);
    p.a = vAlpha;
    gl_FragColor = p; // vec4(normal2.x , normal2.y, normal2.z, 1.0);
}`;
