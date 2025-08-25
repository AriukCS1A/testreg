import { face_landmark_name_t as FaceLandmarkName, zappar_face_landmark_t } from "@zappar/zappar-cv";
import { FaceAnchor } from "./facetracker";
export { face_landmark_name_t as FaceLandmarkName } from "@zappar/zappar-cv";
/**
 * Attaches content to a known point (landmark) on a face as it moves around in the camera view.
 * Landmarks will remain accurate, even as the user's expression changes.
 * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
 */
export declare class FaceLandmark {
    private _name;
    /**
     * The most recent pose of this landmark, relative to the [[FaceAnchor]] used to update it.
     * A 4x4 column-major transformation matrix.
     */
    pose: Float32Array;
    private _z;
    private _impl;
    /**
     * Constructs a new FaceLanmdmark.
     * @param _name - The name of the landmark to track.
     * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
    */
    constructor(_name: FaceLandmarkName);
    /**
     * Destroys the face landmark.
     */
    destroy(): void;
    /**
     * Updates pose directly from the expression and identity in a [[FaceAnchor]].
     * @param f - The anchor to derive the expression and identity from.
     * @param mirror - Pass `true` to mirror the location in the X-axis.
    */
    updateFromFaceAnchor(f: FaceAnchor, mirror?: boolean): void;
    /**
     * Updates pose directly from identity and expression coefficients.
     * @param identity  - The identity coefficients.
     * @param expression - The expression coefficients.
     * @param mirror - Pass `true` to mirror the location in the X-axis.
    */
    updateFromIdentityExpression(identity: Float32Array, expression: Float32Array, mirror?: boolean): void;
    /**
     * @ignore
    */
    _getImpl(): zappar_face_landmark_t;
}
