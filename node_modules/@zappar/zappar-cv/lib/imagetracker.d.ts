import { zappar_image_tracker_t, zappar_pipeline_t } from "./gen/zappar";
import { image_target_type_t, zappar_cwrap } from "./gen/zappar-native";
interface PreviewInfo {
    compressed: Uint8Array;
    mimeType: string;
    image?: HTMLImageElement;
}
export interface PreviewMesh {
    indices: Uint16Array;
    vertices: Float32Array;
    normals: Float32Array;
    uvs: Float32Array;
}
export interface ParsedTargetInfo {
    preview?: PreviewInfo;
    previewMesh?: PreviewMesh;
    physicalScaleFactor: number;
    topRadius: number;
    bottomRadius: number;
    sideLength: number;
    type: image_target_type_t;
    trainedWidth: number;
    trainedHeight: number;
}
export declare class ImageTracker {
    private _client;
    private _impl;
    private _targets;
    static create(pipeline: zappar_pipeline_t, client: zappar_cwrap): zappar_image_tracker_t;
    static get(p: zappar_image_tracker_t): ImageTracker | undefined;
    private constructor();
    destroy(): void;
    loadFromMemory(data: ArrayBuffer): void;
    targetCount(): number;
    getTargetInfo(i: number): ParsedTargetInfo;
    private _parseOdle;
    private _parseOdleV1;
    private _parseOdleV3;
    getDecodedPreview(i: number): HTMLImageElement | undefined;
    getPreviewMesh(i: number): PreviewMesh;
}
export {};
