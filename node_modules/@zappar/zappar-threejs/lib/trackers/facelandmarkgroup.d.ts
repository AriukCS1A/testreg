import { FaceTracker, FaceAnchor, FaceLandmarkName, FaceLandmark } from "@zappar/zappar";
import { THREE } from "../three";
import { Camera } from "../camera";
/**
 * A THREE.Group which attaches content to a known point (landmark) on a face as it moves around in the camera view.
 * Landmarks will remain accurate, even as the user's expression changes.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/face-tracking/
 */
export declare class FaceLandmarkGroup extends THREE.Group {
    private camera;
    readonly faceTracker: FaceTracker;
    currentAnchor: FaceAnchor | undefined;
    landmark: FaceLandmark;
    private pose;
    /**
     * Constructs a new FaceLandmarkGroup.
     * @param camera - A ZapparThree.Camera.
     * @param faceTracker - The face tracker which will be used.
     * @param landmark - The landmark to which the group will be anchored.
     */
    constructor(camera: Camera, faceTracker: FaceTracker, landmark: FaceLandmarkName);
    updateMatrixWorld(force?: boolean): void;
    /**
     * Destroys the face landmark.
     */
    dispose(): void;
}
