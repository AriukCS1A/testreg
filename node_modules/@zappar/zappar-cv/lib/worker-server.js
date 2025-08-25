var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as ZNM from "./zappar-cv";
import { getRuntimeObject } from "./gen/zappar-cwrap";
import { zappar_server } from "./gen/zappar-server";
import { MsgManager } from "./messages";
import { mat4 } from "gl-matrix";
import { frame_pixel_format_t } from "./gen/zappar-native";
import { handleImageBitmap } from "./worker-imagebitmap";
import { profile } from "./profile";
export let messageManager = new MsgManager();
let latestCameraToScreenRotation = 0;
export function launchWorkerServer(wasmUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        let mod = ZNM.default({
            locateFile: (path, prefix) => {
                if (path.endsWith("zappar-cv.wasm")) {
                    return wasmUrl;
                }
                return prefix + path;
            },
            onRuntimeInitialized: () => {
                let r = getRuntimeObject(mod);
                let server = new zappar_server(r, (pipelineId, ab) => {
                    messageManager.postOutgoingMessage({
                        p: pipelineId,
                        t: "zappar",
                        d: ab
                    }, [ab]);
                });
                messageManager.postOutgoingMessage("loaded", []);
                messageManager.onIncomingMessage.bind((msg) => {
                    var _a;
                    switch (msg.t) {
                        case "zappar":
                            server.processBuffer(msg.d);
                            messageManager.postOutgoingMessage({ t: "buf", d: msg.d }, [msg.d]);
                            break;
                        case "buf":
                            (_a = server.serializersByPipelineId.get(msg.p)) === null || _a === void 0 ? void 0 : _a.bufferReturn(msg.d);
                            break;
                        case "cameraFrameC2S": {
                            let msgt = msg;
                            let pipeline = server._pipeline_by_instance.get(msgt.p);
                            let att;
                            if (pipeline) {
                                r.pipeline_camera_frame_submit(pipeline, msgt.d, msgt.width, msgt.height, msgt.token, msgt.c2d, msgt.cm, msgt.userFacing);
                                r.pipeline_frame_update(pipeline);
                                att = r.pipeline_camera_frame_device_attitude(pipeline);
                                server.exploreState();
                            }
                            let ret = {
                                token: msgt.token,
                                d: msgt.d,
                                p: msgt.p,
                                t: "cameraFrameRecycleS2C",
                                att
                            };
                            messageManager.postOutgoingMessage(ret, [msgt.d]);
                            break;
                        }
                        case "streamC2S": {
                            let msgt = msg;
                            consumeStream(mod, r, msgt.s, msgt.p, msgt.userFacing, server, msgt.source);
                            break;
                        }
                        case "cameraToScreenC2S": {
                            let msgt = msg;
                            latestCameraToScreenRotation = msgt.r;
                            break;
                        }
                        case "imageBitmapC2S": {
                            let msgt = msg;
                            handleImageBitmap(msgt, r, server, messageManager);
                            break;
                        }
                    }
                });
            }
        });
    });
}
;
let streamDataBufferPointer = 0;
let streamDataBufferLength = 0;
let tokenId = 1;
const cameraToDeviceTransform = mat4.create();
const cameraModel = new Float32Array([300, 300, 160, 120, 0, 0]);
function consumeStream(mod, r, stream, p, userFacing, server, source) {
    return __awaiter(this, void 0, void 0, function* () {
        const reader = yield stream.getReader();
        while (true) {
            let result = yield reader.read();
            if (result.done) {
                console.log("Stream done");
                return;
            }
            let frame = result.value;
            let size = frame.allocationSize();
            if (size > streamDataBufferLength) {
                if (streamDataBufferPointer > 0)
                    mod._free(streamDataBufferPointer);
                streamDataBufferPointer = mod._malloc(size);
                streamDataBufferLength = size;
            }
            yield frame.copyTo(mod.HEAPU8.subarray(streamDataBufferPointer, streamDataBufferPointer + streamDataBufferLength));
            let token = tokenId;
            tokenId++;
            const width = frame.visibleRect.width;
            const height = frame.visibleRect.height;
            let uvTransform;
            let dataWidth = width;
            let dataHeight = height;
            switch (latestCameraToScreenRotation) {
                case 270:
                    uvTransform = new Float32Array([0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1]);
                    dataWidth = height;
                    dataHeight = width;
                    break;
                case 180:
                    uvTransform = new Float32Array([-1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1]);
                    break;
                case 90:
                    uvTransform = new Float32Array([0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1]);
                    dataWidth = height;
                    dataHeight = width;
                    break;
                default:
                    uvTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
                    break;
            }
            let clone = frame.clone();
            if (userFacing)
                mat4.fromScaling(cameraToDeviceTransform, [-1, 1, -1]);
            else
                mat4.identity(cameraToDeviceTransform);
            let focalLength = 300.0 * profile.dataWidth / 320.0;
            cameraModel[0] = focalLength;
            cameraModel[1] = focalLength;
            cameraModel[2] = profile.dataWidth * 0.5;
            cameraModel[3] = profile.dataHeight * 0.5;
            const ret = {
                token: token,
                d: clone,
                p: p,
                t: "videoFrameS2C",
                userFacing,
                uvTransform,
                w: dataWidth,
                h: dataHeight,
                cameraToDevice: cameraToDeviceTransform,
                cameraModel,
                source
            };
            messageManager.postOutgoingMessage(ret, [ret.d, ret.uvTransform.buffer]);
            const pipeline = server._pipeline_by_instance.get(p);
            if (pipeline) {
                r.pipeline_camera_frame_submit_raw_pointer(pipeline, streamDataBufferPointer, size, framePixelFormatFromFormat(frame.format), width, height, token, cameraToDeviceTransform, latestCameraToScreenRotation, cameraModel, userFacing);
                r.pipeline_frame_update(pipeline);
                server.exploreState();
            }
            frame.close();
        }
    });
}
function framePixelFormatFromFormat(f) {
    switch (f) {
        case "I420": return frame_pixel_format_t.FRAME_PIXEL_FORMAT_I420;
        case "I420A": return frame_pixel_format_t.FRAME_PIXEL_FORMAT_I420A;
        case "I422": return frame_pixel_format_t.FRAME_PIXEL_FORMAT_I422;
        case "I444": return frame_pixel_format_t.FRAME_PIXEL_FORMAT_I444;
        case "NV12": return frame_pixel_format_t.FRAME_PIXEL_FORMAT_NV12;
        case "RGBA":
        case "RGBX":
            return frame_pixel_format_t.FRAME_PIXEL_FORMAT_RGBA;
        case "BGRA":
        case "BGRX":
            return frame_pixel_format_t.FRAME_PIXEL_FORMAT_BGRA;
    }
    return frame_pixel_format_t.FRAME_PIXEL_FORMAT_Y;
}
