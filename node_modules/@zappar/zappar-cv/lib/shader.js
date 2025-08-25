export function compileShader(gl, type, src) {
    let ret = gl.createShader(type);
    if (!ret)
        throw new Error("Unable to create shader");
    gl.shaderSource(ret, src);
    gl.compileShader(ret);
    let msg = gl.getShaderInfoLog(ret);
    if (msg && msg.trim().length > 0)
        throw new Error("Shader compile error: " + msg);
    return ret;
}
export function linkProgram(gl, prog) {
    gl.linkProgram(prog);
    let msg = gl.getProgramInfoLog(prog);
    if (msg && msg.trim().length > 0)
        throw new Error("Unable to link: " + msg);
}
