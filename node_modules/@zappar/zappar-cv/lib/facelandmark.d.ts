import { zappar_face_landmark_t, face_landmark_name_t } from "./gen/zappar";
export declare function createFaceLandmark(n: face_landmark_name_t): zappar_face_landmark_t;
export declare function destroyFaceLandmark(m: zappar_face_landmark_t): void;
export declare function getFaceLandmark(m: zappar_face_landmark_t): FaceLandmark | undefined;
export declare class FaceLandmark {
    private _name;
    anchor_pose: Float32Array;
    constructor(_name: face_landmark_name_t);
    private _getVertex;
    update(identity: Float32Array, expression: Float32Array, mirrored: boolean): void;
}
