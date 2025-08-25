import { zappar_face_mesh_t } from "@zappar/zappar-cv";
import { FaceAnchor } from "./facetracker";
/**
 * A mesh that fits to the user's face and deforms as the user's expression changes.
 * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
 */
export declare class FaceMesh {
    private _z;
    private _impl;
    /**
     * Constructs a new FaceMesh.
     * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
    */
    constructor();
    /**
     * Destroys the face mesh.
     */
    destroy(): void;
    /**
     * Loads the data for a face mesh.
     * @param src - A URL or ArrayBuffer of the source mesh data.
     * @param fillMouth - If true, fills this face feature with polygons.
     * @param fillEyeLeft - If true, fills this face feature with polygons.
     * @param fillEyeRight - If true, fills this face feature with polygons.
     * @param fillNeck - If true, fills this face feature with polygons.
     * @returns A promise that's resolved once the data is loaded.
     */
    load(src?: string | ArrayBuffer, fillMouth?: boolean, fillEyeLeft?: boolean, fillEyeRight?: boolean, fillNeck?: boolean): Promise<void>;
    /**
      * Loads the default face mesh data.
      * @returns A promise that's resolved once the data is loaded.
      */
    loadDefault(): Promise<void>;
    /**
      * Loads the default face mesh.
      * @param fillMouth - If true, fills this face feature with polygons.
      * @param fillEyeLeft - If true, fills this face feature with polygons.
      * @param fillEyeRight - If true, fills this face feature with polygons.
      * @returns A promise that's resolved once the data is loaded.
      */
    loadDefaultFace(fillMouth?: boolean, fillEyeLeft?: boolean, fillEyeRight?: boolean): Promise<void>;
    /**
      * The full head simplified mesh covers the whole of the user's head, including some neck.
      * It's ideal for drawing into the depth buffer in order to mask out the back of 3D models placed on the user's head.
      * @param fillMouth - If true, fills this face feature with polygons.
      * @param fillEyeLeft - If true, fills this face feature with polygons.
      * @param fillEyeRight - If true, fills this face feature with polygons.
      * @param fillNeck - If true, fills this face feature with polygons.
      * @returns A promise that's resolved once the data is loaded.
      */
    loadDefaultFullHeadSimplified(fillMouth?: boolean, fillEyeLeft?: boolean, fillEyeRight?: boolean, fillNeck?: boolean): Promise<void>;
    /**
      * Update the face mesh directly from a [[FaceAnchor]].
      * @param f - The face anchor.
      * @param mirror - Pass `true` to mirror the location in the X-axis.
      */
    updateFromFaceAnchor(f: FaceAnchor, mirror?: boolean): void;
    /**
      * Updates the face mesh directly from a identity and expression coefficients.
      * @param identity - The identity coefficients.
      * @param expression - The expression coefficients.
      * @param mirror - Pass `true` to mirror the location in the X-axis.
     */
    updateFromIdentityExpression(identity: Float32Array, expression: Float32Array, mirror?: boolean): void;
    /**
     *
     * @returns The vertices of the mesh.
     */
    get vertices(): Float32Array;
    /**
     * @returns The indices of the mesh.
     */
    get indices(): Uint16Array;
    /**
     * @returns The UVs of the mesh.
     */
    get uvs(): Float32Array;
    /**
     * @returns The normals of the mesh.
     */
    get normals(): Float32Array;
    /**
     * @ignore
    */
    _getImpl(): zappar_face_mesh_t;
}
