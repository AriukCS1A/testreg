import { FaceMesh, FaceAnchor } from "@zappar/zappar";
import { THREE } from "../three";
import { FaceAnchorGroup } from "../trackers/faceanchorgroup";
/**
 * A THREE.BufferGeometry that fits to the user's face and deforms as the user's expression changes.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/face-tracking/
 */
export declare class FaceBufferGeometry extends THREE.BufferGeometry {
    private _faceMesh;
    private hasSetIndices;
    private hasSetUVs;
    private vertices;
    private verticesAttribute;
    private normals;
    private normalsAttribute;
    private recalculateNormals;
    /**
     * Constructs a new FaceBufferGeometry.
     * @param faceMesh - The face mesh which will be used. If not specified, the default face mesh will be loaded.
     */
    constructor(faceMesh?: FaceMesh);
    private _updateIndices;
    private _updateUVs;
    /**
     * @ignore
     */
    get calculateNormals(): boolean;
    /**
     * @ignore
     */
    set calculateNormals(b: boolean);
    /**
     * Updates the geometry to the most recent identity and expression output from a face anchor group.
     * @param f - The face anchor group which will be used to update the geometry.
     */
    updateFromFaceAnchorGroup(f: FaceAnchorGroup): void;
    /**
     * Updates the geometry to the most recent identity and expression output from a face anchor.
     * @param f - The face anchor which will be used to update the geometry.
     */
    updateFromFaceAnchor(f: FaceAnchor): void;
    /**
     * Updates the geometry to the provided identity and expression coefficients.
     * @param identity  - The identity coefficients.
     * @param expression - The expression coefficients.
     */
    updateFromIdentityExpression(identity: Float32Array, expression: Float32Array): void;
}
