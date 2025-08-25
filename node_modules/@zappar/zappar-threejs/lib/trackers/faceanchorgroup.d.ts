import { FaceTracker, FaceAnchor } from "@zappar/zappar";
import { THREE } from "../three";
import { Camera } from "../camera";
/**
 * A THREE.Group which attaches content to a face as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/face-tracking/
 */
export declare class FaceAnchorGroup extends THREE.Group {
    private camera;
    readonly faceTracker: FaceTracker;
    anchorId?: string | undefined;
    /**
     * @ignore
     */
    isReady: boolean;
    /**
     * A point in 3D space (including orientation) in a fixed location relative to a tracked object or environment.
     */
    currentAnchor: FaceAnchor | undefined;
    /**
     * Constructs a new FaceAnchorGroup.
     * @param camera - A ZapparThree.Camera.
     * @param faceTracker - The face tracker which will be used.
     * @param anchorId - Specify this to limit the group to tracking an anchor with the provided ID.
     */
    constructor(camera: Camera, faceTracker: FaceTracker, anchorId?: string | undefined);
    updateMatrixWorld(force?: boolean): void;
}
