import { mat4 } from "gl-matrix";
import { GLStateManager } from "./gl-state-manager";
import { profile } from "./profile";
import { compileShader, linkProgram } from "./shader";
export class ImageProcessGL {
    constructor(_gl) {
        this._gl = _gl;
        this._isPaused = true;
        this._hadFrames = false;
        this._isUserFacing = false;
        this._cameraToScreenRotation = 0;
        this._isUploadFrame = true;
        this._computedTransformRotation = -1;
        this._computedFrontCameraRotation = false;
        this._cameraUvTransform = mat4.create();
        this._framebufferWidth = 0;
        this._framebufferHeight = 0;
        this._framebufferId = null;
        this._renderTexture = null;
        this._isWebGL2 = false;
        this._isWebGL2 = _gl.getParameter(_gl.VERSION).indexOf("WebGL 2") >= 0;
        if (!this._isWebGL2) {
            this._instancedArraysExtension = this._gl.getExtension("ANGLE_instanced_arrays");
        }
    }
    resetGLContext() {
        this._framebufferId = null;
        this._renderTexture = null;
        this._vertexBuffer = undefined;
        this._indexBuffer = undefined;
        this._greyscaleShader = undefined;
    }
    destroy() {
        this.resetGLContext();
    }
    uploadFrame(texture, img, rotation, fc) {
        let gl = this._gl;
        const glStateManager = GLStateManager.get(gl);
        glStateManager.push();
        const reenableScissorTest = gl.isEnabled(gl.SCISSOR_TEST);
        const reenableDepthTest = gl.isEnabled(gl.DEPTH_TEST);
        const reenableBlend = gl.isEnabled(gl.BLEND);
        const reenableCullFace = gl.isEnabled(gl.CULL_FACE);
        const reenableStencilTest = gl.isEnabled(gl.STENCIL_TEST);
        const previousActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        const previousUnpackFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
        const previousProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.activeTexture(gl.TEXTURE0);
        const previousBoundTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
        const previousBoundFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        const previousBoundArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
        const previousBoundElementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        gl.disable(gl.SCISSOR_TEST);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.STENCIL_TEST);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, img);
        let videoWidth = 0;
        let videoHeight = 0;
        if (typeof HTMLVideoElement !== "undefined" && img instanceof HTMLVideoElement) {
            videoWidth = img.videoWidth;
            videoHeight = img.videoHeight;
        }
        else {
            videoWidth = img.width;
            videoHeight = img.height;
        }
        if (videoHeight > videoWidth)
            videoHeight = [videoWidth, videoWidth = videoHeight][0];
        this._updateTransforms(rotation, fc);
        let framebuffer = this._getFramebuffer(gl, profile.dataWidth / 4, profile.dataHeight);
        let vbo = this._getVertexBuffer(gl);
        let ibo = this._getIndexBuffer(gl);
        let shader = this._getGreyscaleShader(gl);
        const previousVertexAttribSize = gl.getVertexAttrib(shader.aVertexPositionLoc, gl.VERTEX_ATTRIB_ARRAY_SIZE);
        const previousVertexAttribType = gl.getVertexAttrib(shader.aVertexPositionLoc, gl.VERTEX_ATTRIB_ARRAY_TYPE);
        const previousVertexAttribNormalized = gl.getVertexAttrib(shader.aVertexPositionLoc, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
        const previousVertexAttribStride = gl.getVertexAttrib(shader.aVertexPositionLoc, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
        const previousVertexAttribOffset = gl.getVertexAttribOffset(shader.aVertexPositionLoc, gl.VERTEX_ATTRIB_ARRAY_POINTER);
        const previousVertexAttribEnabled = gl.getVertexAttrib(shader.aVertexPositionLoc, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        const previousVertexAttribBufferBinding = gl.getVertexAttrib(shader.aVertexPositionLoc, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
        const previousTextureAttribSize = gl.getVertexAttrib(shader.aTextureCoordLoc, gl.VERTEX_ATTRIB_ARRAY_SIZE);
        const previousTextureAttribType = gl.getVertexAttrib(shader.aTextureCoordLoc, gl.VERTEX_ATTRIB_ARRAY_TYPE);
        const previousTextureAttribNormalized = gl.getVertexAttrib(shader.aTextureCoordLoc, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
        const previousTextureAttribStride = gl.getVertexAttrib(shader.aTextureCoordLoc, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
        const previousTextureAttribOffset = gl.getVertexAttribOffset(shader.aTextureCoordLoc, gl.VERTEX_ATTRIB_ARRAY_POINTER);
        const previousTextureAttribBufferBinding = gl.getVertexAttrib(shader.aTextureCoordLoc, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
        const previousTextureAttribEnabled = gl.getVertexAttrib(shader.aTextureCoordLoc, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        let previousVertexAttribDivisor = 0;
        let previousTextureAttribDivisor = 0;
        if (this._isWebGL2) {
            previousVertexAttribDivisor = gl.getVertexAttrib(shader.aVertexPositionLoc, gl.VERTEX_ATTRIB_ARRAY_DIVISOR);
            previousTextureAttribDivisor = gl.getVertexAttrib(shader.aTextureCoordLoc, gl.VERTEX_ATTRIB_ARRAY_DIVISOR);
            gl.vertexAttribDivisor(shader.aVertexPositionLoc, 0);
            gl.vertexAttribDivisor(shader.aTextureCoordLoc, 0);
        }
        else if (this._instancedArraysExtension) {
            previousVertexAttribDivisor = gl.getVertexAttrib(shader.aVertexPositionLoc, this._instancedArraysExtension.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE);
            previousTextureAttribDivisor = gl.getVertexAttrib(shader.aTextureCoordLoc, this._instancedArraysExtension.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE);
            this._instancedArraysExtension.vertexAttribDivisorANGLE(shader.aVertexPositionLoc, 0);
            this._instancedArraysExtension.vertexAttribDivisorANGLE(shader.aTextureCoordLoc, 0);
        }
        // Rendering to the greyscale conversion buffer - bind the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, this._framebufferWidth, this._framebufferHeight);
        // We'll be replacing all the content - clear is a good hint for this on mobile
        gl.clear(gl.COLOR_BUFFER_BIT);
        // Set up bindings for vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.vertexAttribPointer(shader.aVertexPositionLoc, 2, gl.FLOAT, false, 4 * 4, 0);
        gl.enableVertexAttribArray(shader.aVertexPositionLoc);
        gl.vertexAttribPointer(shader.aTextureCoordLoc, 2, gl.FLOAT, false, 4 * 4, 2 * 4);
        gl.enableVertexAttribArray(shader.aTextureCoordLoc);
        // Bind the index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        // Tell WebGL to use our program when drawing
        gl.useProgram(shader.program);
        // Specify greyscale width for the correct offsets, and the uv transform
        gl.uniform1f(shader.uTexWidthLoc, profile.dataWidth);
        gl.uniformMatrix4fv(shader.uUvTransformLoc, false, this._cameraUvTransform);
        gl.activeTexture(gl.TEXTURE0);
        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(shader.uSamplerLoc, 0);
        // Do the drawing...
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, previousVertexAttribBufferBinding);
        gl.vertexAttribPointer(shader.aVertexPositionLoc, previousVertexAttribSize, previousVertexAttribType, previousVertexAttribNormalized, previousVertexAttribStride, previousVertexAttribOffset);
        gl.bindBuffer(gl.ARRAY_BUFFER, previousTextureAttribBufferBinding);
        gl.vertexAttribPointer(shader.aTextureCoordLoc, previousTextureAttribSize, previousTextureAttribType, previousTextureAttribNormalized, previousTextureAttribStride, previousTextureAttribOffset);
        gl.bindBuffer(gl.ARRAY_BUFFER, previousBoundArrayBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, previousBoundElementArrayBuffer);
        if (!previousVertexAttribEnabled)
            gl.disableVertexAttribArray(shader.aVertexPositionLoc);
        if (!previousTextureAttribEnabled)
            gl.disableVertexAttribArray(shader.aTextureCoordLoc);
        if (this._isWebGL2) {
            gl.vertexAttribDivisor(shader.aVertexPositionLoc, previousVertexAttribDivisor);
            gl.vertexAttribDivisor(shader.aTextureCoordLoc, previousTextureAttribDivisor);
        }
        else if (this._instancedArraysExtension) {
            this._instancedArraysExtension.vertexAttribDivisorANGLE(shader.aVertexPositionLoc, previousVertexAttribDivisor);
            this._instancedArraysExtension.vertexAttribDivisorANGLE(shader.aTextureCoordLoc, previousTextureAttribDivisor);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, previousBoundFramebuffer);
        gl.useProgram(previousProgram);
        gl.bindTexture(gl.TEXTURE_2D, previousBoundTexture);
        gl.activeTexture(previousActiveTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousUnpackFlip);
        glStateManager.pop();
        if (reenableBlend)
            gl.enable(gl.BLEND);
        if (reenableCullFace)
            gl.enable(gl.CULL_FACE);
        if (reenableDepthTest)
            gl.enable(gl.DEPTH_TEST);
        if (reenableScissorTest)
            gl.enable(gl.SCISSOR_TEST);
        if (reenableStencilTest)
            gl.enable(gl.STENCIL_TEST);
    }
    readFrame(texture, pixels) {
        let gl = this._gl;
        let pixelsView = new Uint8Array(pixels);
        const previousBoundFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        let framebuffer = this._getFramebuffer(gl, profile.dataWidth / 4, profile.dataHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.readPixels(0, 0, this._framebufferWidth, this._framebufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixelsView);
        gl.bindFramebuffer(gl.FRAMEBUFFER, previousBoundFramebuffer);
        return {
            uvTransform: this._cameraUvTransform,
            data: pixels,
            texture,
            dataWidth: profile.dataWidth,
            dataHeight: profile.dataHeight,
            userFacing: this._computedFrontCameraRotation
        };
    }
    _updateTransforms(rot, fc) {
        if (rot == this._computedTransformRotation && fc == this._computedFrontCameraRotation)
            return;
        this._computedTransformRotation = rot;
        this._computedFrontCameraRotation = fc;
        this._cameraUvTransform = this._getCameraUvTransform();
    }
    _getCameraUvTransform() {
        switch (this._computedTransformRotation) {
            case 270: return new Float32Array([0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1]);
            case 180: return new Float32Array([-1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1]);
            case 90: return new Float32Array([0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1]);
        }
        return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }
    _getFramebuffer(gl, fbWidth, fbHeight) {
        if (this._framebufferWidth === fbWidth && this._framebufferHeight === fbHeight && this._framebufferId)
            return this._framebufferId;
        if (this._framebufferId) {
            gl.deleteFramebuffer(this._framebufferId);
            this._framebufferId = null;
        }
        if (this._renderTexture) {
            gl.deleteTexture(this._renderTexture);
            this._renderTexture = null;
        }
        this._framebufferId = gl.createFramebuffer();
        if (!this._framebufferId)
            throw new Error("Unable to create framebuffer");
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebufferId);
        this._renderTexture = gl.createTexture();
        if (!this._renderTexture)
            throw new Error("Unable to create render texture");
        gl.activeTexture(gl.TEXTURE0);
        const previousBoundTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
        gl.bindTexture(gl.TEXTURE_2D, this._renderTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbWidth, fbHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._renderTexture, 0);
        let fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (fbStatus !== gl.FRAMEBUFFER_COMPLETE)
            throw new Error("Framebuffer not complete: " + fbStatus.toString());
        this._framebufferWidth = fbWidth;
        this._framebufferHeight = fbHeight;
        gl.bindTexture(gl.TEXTURE_2D, previousBoundTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return this._framebufferId;
    }
    _getVertexBuffer(gl) {
        if (this._vertexBuffer)
            return this._vertexBuffer;
        this._vertexBuffer = gl.createBuffer();
        if (!this._vertexBuffer)
            throw new Error("Unable to create vertex buffer");
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        let buffer = new Float32Array([-1.0, -1.0, 0.0, 0.0,
            -1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0]);
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
        return this._vertexBuffer;
    }
    _getIndexBuffer(gl) {
        if (this._indexBuffer)
            return this._indexBuffer;
        this._indexBuffer = gl.createBuffer();
        if (!this._indexBuffer)
            throw new Error("Unable to create index buffer");
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        let buffer = new Uint16Array([0, 1, 2, 0, 2, 3]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
        return this._indexBuffer;
    }
    _getGreyscaleShader(gl) {
        if (this._greyscaleShader)
            return this._greyscaleShader;
        let prog = gl.createProgram();
        if (!prog)
            throw new Error("Unable to create program");
        let vertexShader = compileShader(gl, gl.VERTEX_SHADER, greyscaleVsSource);
        let fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, greyscaleFsSource);
        gl.attachShader(prog, vertexShader);
        gl.attachShader(prog, fragmentShader);
        linkProgram(gl, prog);
        let uTexWidthLoc = gl.getUniformLocation(prog, "uTexWidth");
        if (!uTexWidthLoc)
            throw new Error("Unable to get uniform location uTexWidth");
        let uUvTransformLoc = gl.getUniformLocation(prog, "uUvTransform");
        if (!uUvTransformLoc)
            throw new Error("Unable to get uniform location uUvTransform");
        let uSamplerLoc = gl.getUniformLocation(prog, "uSampler");
        if (!uSamplerLoc)
            throw new Error("Unable to get uniform location uSampler");
        this._greyscaleShader = {
            program: prog,
            aVertexPositionLoc: gl.getAttribLocation(prog, "aVertexPosition"),
            aTextureCoordLoc: gl.getAttribLocation(prog, "aTextureCoord"),
            uTexWidthLoc: uTexWidthLoc,
            uUvTransformLoc: uUvTransformLoc,
            uSamplerLoc: uSamplerLoc
        };
        return this._greyscaleShader;
    }
}
let greyscaleVsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    varying highp vec2 vTextureCoord1;
    varying highp vec2 vTextureCoord2;
    varying highp vec2 vTextureCoord3;
    varying highp vec2 vTextureCoord4;

    uniform float uTexWidth;
	uniform mat4 uUvTransform;

    void main(void) {
      highp vec2 offset1 = vec2(1.5 / uTexWidth, 0);
      highp vec2 offset2 = vec2(0.5 / uTexWidth, 0);

      gl_Position = aVertexPosition;
      vTextureCoord1 = (uUvTransform * vec4(aTextureCoord - offset1, 0, 1)).xy;
      vTextureCoord2 = (uUvTransform * vec4(aTextureCoord - offset2, 0, 1)).xy;
      vTextureCoord3 = (uUvTransform * vec4(aTextureCoord + offset2, 0, 1)).xy;
      vTextureCoord4 = (uUvTransform * vec4(aTextureCoord + offset1, 0, 1)).xy;
    }
`;
// Fragment shader program
let greyscaleFsSource = `
  varying highp vec2 vTextureCoord1;
  varying highp vec2 vTextureCoord2;
  varying highp vec2 vTextureCoord3;
  varying highp vec2 vTextureCoord4;

  uniform sampler2D uSampler;

  const lowp vec3 colorWeights = vec3(77.0 / 256.0, 150.0 / 256.0, 29.0 / 256.0);

  void main(void) {
    lowp vec4 outpx;

    outpx.r = dot(colorWeights, texture2D(uSampler, vTextureCoord1).xyz);
    outpx.g = dot(colorWeights, texture2D(uSampler, vTextureCoord2).xyz);
    outpx.b = dot(colorWeights, texture2D(uSampler, vTextureCoord3).xyz);
    outpx.a = dot(colorWeights, texture2D(uSampler, vTextureCoord4).xyz);

    gl_FragColor = outpx;
  }
`;
