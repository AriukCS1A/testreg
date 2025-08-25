import { ImageProcessGL } from "./image-process-gl";
import { profile } from "./profile";
import { mat4 } from "gl-matrix";
let pixels;
let texture;
let _imageProcessor;
let _gl;
function getImageProcessor() {
    if (!_imageProcessor || !_gl) {
        const canvas = new OffscreenCanvas(1, 1);
        _gl = canvas.getContext("webgl");
        if (!_gl)
            throw new Error("Unable to get offscreen GL context");
        _imageProcessor = new ImageProcessGL(_gl);
    }
    return [_imageProcessor, _gl];
}
export function handleImageBitmap(m, r, server, mgr) {
    // img: ImageBitmap,
    //                                 rot: number,
    //                                 tokenId: number,
    //                                 r: zappar_cwrap,
    //                                 p: zappar_pipeline_t,
    //                                 userFacing: boolean,
    //                                 server: zappar_server,
    //                                 mgr: MsgManager) {
    const [imageProcessor, gl] = getImageProcessor();
    if (!texture) {
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    if (!texture)
        return;
    if (!pixels || pixels.byteLength < profile.dataWidth * profile.dataHeight) {
        console.log("Generating pixel buffer", profile.dataWidth * profile.dataHeight);
        pixels = new ArrayBuffer(profile.dataWidth * profile.dataHeight);
    }
    imageProcessor.uploadFrame(texture, m.i, m.r, m.userFacing);
    let info = imageProcessor.readFrame(texture, pixels);
    let msg = {
        t: "imageBitmapS2C",
        dataWidth: info.dataWidth,
        dataHeight: info.dataHeight,
        frame: m.i,
        userFacing: info.userFacing,
        uvTransform: info.uvTransform || mat4.create(),
        tokenId: m.tokenId, p: m.p
    };
    mgr.postOutgoingMessage(msg, [m.i]);
    let pipeline = server._pipeline_by_instance.get(m.p);
    if (pipeline) {
        r.pipeline_camera_frame_submit(pipeline, pixels, info.dataWidth, info.dataHeight, m.tokenId, m.cameraToDevice, m.cameraModel, info.userFacing);
        r.pipeline_frame_update(pipeline);
        server.exploreState();
    }
}
