import { zappar_face_mesh_t } from "./gen/zappar";
import { FaceLandmarkNameData } from "./facelandmarkinterface";
export declare function createFaceMesh(): zappar_face_mesh_t;
export declare function destroyFaceMesh(m: zappar_face_mesh_t): void;
export declare function getFaceMesh(m: zappar_face_mesh_t): FaceMesh | undefined;
export declare class FaceMesh {
    private render_mean_;
    private render_identity_;
    private render_expression_;
    private render_uvs_;
    private render_indices_;
    private render_indices_reversed;
    private vertices_;
    private normals_;
    private normalsCalculated_;
    private modelVersion_;
    private mirrored_;
    loadFromMemory(ab: ArrayBuffer, fillMouth: boolean, fillEyeL: boolean, fillEyeR: boolean, fillNeck: boolean): void;
    getVertices(): Float32Array;
    getUVs(): Float32Array;
    getIndices(): Uint16Array;
    getNormals(): Float32Array;
    getModelVersion(): number;
    getLandmarkDataForVertex(v: number): FaceLandmarkNameData;
    update(identity: Float32Array, expression: Float32Array, mirrored: boolean): void;
    calculateNormals(): void;
}
