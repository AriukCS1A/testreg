import { compileShader, linkProgram } from "./shader";
export class FaceDraw {
    constructor(_gl) {
        this._gl = _gl;
    }
    dispose() {
        if (this._vbo)
            this._gl.deleteBuffer(this._vbo);
        if (this._normalbo)
            this._gl.deleteBuffer(this._normalbo);
        if (this._ibo)
            this._gl.deleteBuffer(this._ibo);
        if (this._shader)
            this._gl.deleteProgram(this._shader.prog);
        this._vbo = undefined;
        this._normalbo = undefined;
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
    _generateNormalBO(face, gl) {
        if (!this._normalbo)
            this._normalbo = gl.createBuffer();
        if (!this._normalbo)
            throw new Error("Unable to create buffer object");
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalbo);
        gl.bufferData(gl.ARRAY_BUFFER, face, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return this._normalbo;
    }
    drawFace(matrix, o) {
        let gl = this._gl;
        let shader = this._getShader(gl);
        let v = this._generateVBO(o.getVertices(), gl);
        let n = this._generateNormalBO(o.getNormals(), gl);
        let i = this._generateIBO(o.getIndices(), gl);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.useProgram(shader.prog);
        gl.uniformMatrix4fv(shader.unif_matrix, false, matrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, v);
        gl.vertexAttribPointer(shader.attr_position, 3, gl.FLOAT, false, 3 * 4, 0);
        gl.enableVertexAttribArray(shader.attr_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, n);
        gl.vertexAttribPointer(shader.attr_normal, 3, gl.FLOAT, false, 3 * 4, 0);
        gl.enableVertexAttribArray(shader.attr_normal);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i);
        gl.drawElements(gl.TRIANGLES, o.getIndices().length, gl.UNSIGNED_SHORT, 0);
        gl.disableVertexAttribArray(shader.attr_position);
        gl.disableVertexAttribArray(shader.attr_normal);
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
        this._shader = {
            prog,
            unif_matrix,
            attr_position: gl.getAttribLocation(prog, "position"),
            attr_normal: gl.getAttribLocation(prog, "normal")
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
attribute vec4 position;
attribute vec3 normal;
varying highp vec3 vnormal;

void main()
{
    gl_Position = matrix * position;
    vnormal = normal;
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

varying vec4 skinTexVarying;
varying highp vec3 vnormal;
uniform lowp sampler2D skinSampler;

void main()
{
    vec3 normal2 = 0.5 * vnormal + 0.5;
    gl_FragColor = vec4(normal2.x , normal2.y, normal2.z, 1.0);
}`;
