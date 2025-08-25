import { compileShader, linkProgram } from "./shader";
let shader;
let vbo;
let uvbo;
let texturesByUrl = {};
export function disposeDrawPlane() {
    shader = undefined;
    vbo = undefined;
    uvbo = undefined;
    texturesByUrl = {};
}
function generate(gl) {
    if (vbo)
        return vbo;
    vbo = gl.createBuffer();
    if (!vbo)
        throw new Error("Unable to create buffer object");
    let coords = [
        -0.5, 0.125, 0,
        -0.5, -0.125, 0,
        0.5, 0.125, 0,
        0.5, -0.125, 0
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}
function generateUVBO(gl) {
    if (uvbo)
        return uvbo;
    uvbo = gl.createBuffer();
    if (!uvbo)
        throw new Error("Unable to create buffer object");
    let coords = [
        0, 1,
        0, 0,
        1, 1,
        1, 0
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, uvbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return uvbo;
}
export function drawPlane(gl, projectionMatrix, cameraMatrix, targetMatrix, textureUrl) {
    let shader = getShader(gl);
    let v = generate(gl);
    let uvbo = generateUVBO(gl);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(shader.prog);
    gl.uniformMatrix4fv(shader.unif_proj, false, projectionMatrix);
    gl.uniformMatrix4fv(shader.unif_camera, false, cameraMatrix);
    gl.uniformMatrix4fv(shader.unif_matrix, false, targetMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, v);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, loadTexture(gl, textureUrl));
    gl.uniform1i(shader.unif_skinSampler, 0);
    gl.vertexAttribPointer(shader.attr_position, 3, gl.FLOAT, false, 3 * 4, 0);
    gl.enableVertexAttribArray(shader.attr_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvbo);
    gl.vertexAttribPointer(shader.attr_textureCoord, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.enableVertexAttribArray(shader.attr_textureCoord);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(shader.attr_position);
    gl.disableVertexAttribArray(shader.attr_textureCoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
function generateLocalMatrix() {
    let position = [0, 0, -5];
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, position[0], position[1], position[2], 1]);
}
let vertexShaderSrc = `
#ifndef GL_ES
#define highp
#define mediump
#define lowp
#endif

uniform mat4 projMatrix;
uniform mat4 cameraMatrix;
uniform mat4 modelViewMatrix;
attribute vec4 position;
attribute vec2 textureCoord;

varying highp vec2 vTextureCoord;

void main()
{
    gl_Position = projMatrix * cameraMatrix * modelViewMatrix * position;
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
function getShader(gl) {
    if (shader)
        return shader;
    let prog = gl.createProgram();
    if (!prog)
        throw new Error("Unable to create program");
    let vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    let fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    linkProgram(gl, prog);
    let unif_proj = gl.getUniformLocation(prog, "projMatrix");
    if (!unif_proj)
        throw new Error("Unable to get uniform location projMatrix");
    let unif_matrix = gl.getUniformLocation(prog, "modelViewMatrix");
    if (!unif_matrix)
        throw new Error("Unable to get uniform location modelViewMatrix");
    let unif_camera = gl.getUniformLocation(prog, "cameraMatrix");
    if (!unif_camera)
        throw new Error("Unable to get uniform location cameraMatrix");
    let unif_skinSampler = gl.getUniformLocation(prog, "skinSampler");
    if (!unif_skinSampler)
        throw new Error("Unable to get uniform location skinSampler");
    shader = {
        prog,
        unif_matrix,
        unif_proj,
        unif_camera,
        unif_skinSampler,
        attr_position: gl.getAttribLocation(prog, "position"),
        attr_textureCoord: gl.getAttribLocation(prog, "textureCoord")
    };
    return shader;
}
function loadTexture(gl, url) {
    if (texturesByUrl[url])
        return texturesByUrl[url];
    let texture = gl.createTexture();
    if (!texture)
        throw new Error("Unable to create texture");
    texturesByUrl[url] = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    image.src = url;
    return texture;
}
