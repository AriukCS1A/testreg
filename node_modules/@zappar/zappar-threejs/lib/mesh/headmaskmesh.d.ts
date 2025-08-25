import * as Zappar from "@zappar/zappar";
import { THREE } from "../three";
import { FaceAnchorGroup } from "../trackers/faceanchorgroup";
/**
 * A THREE.Mesh that fits the user's head and fills the depth buffer,
 * ensuring that the camera image of the head shows instead of any 3D elements behind it in the scene.
 *
 * Works using a full-head ZapparThree.FaceMesh with the mouth, eyes and neck filled in.
 * Its renderOrder is set to Number.MIN_SAFE_INTEGER to ensure it's rendered before any other objects in the scene,
 * and its material has the colorWrite property set to false so it fills the depth buffer but not the color buffer.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/face-tracking/
 */
export declare class HeadMaskMesh extends THREE.Mesh {
    onLoad?: (() => void) | undefined;
    onError?: (() => void) | undefined;
    private faceMesh;
    private faceBufferGeometry;
    /**
     * Constructs a new head mask mesh.
     * @param onLoad - Callback function which runs when the mesh is loaded.
     * @param onError - Callback which is called if there's an error loading the mesh.
     */
    constructor(onLoad?: (() => void) | undefined, onError?: (() => void) | undefined);
    /**
     * Updates pose directly from the [[FaceAnchorGroup]] anchor.
     * @param f - The anchor to derive the expression and identity from.
     */
    updateFromFaceAnchorGroup(f: FaceAnchorGroup): void;
    /**
     * Updates pose directly from the expression and identity in a [[FaceAnchor]].
     * @param f - The anchor to derive the expression and identity from.
     */
    updateFromFaceAnchor(f: Zappar.FaceAnchor): void;
    /**
     * Updates pose directly from identity and expression coefficients.
     * @param identity  - The identity coefficients.
     * @param expression - The expression coefficients.
     */
    updateFromIdentityExpression(identity: Float32Array, expression: Float32Array): void;
    /**
     * Destroys the face mesh and disposes of resources.
     */
    dispose(): void;
}
