import { InstantWorldTracker } from "@zappar/zappar";
import { InstantWorldTrackerTransformOrigin } from "@zappar/zappar/lib/instantworldtracker";
import { THREE } from "../three";
import { Camera } from "../camera";
/**
 * A THREE.Group which attaches content to a point on a surface in front of the user as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/instant-world-tracking/
 */
export declare class InstantWorldAnchorGroup extends THREE.Group {
    private camera;
    readonly instantTracker: InstantWorldTracker;
    /**
     * Constructs a new InstantWorldAnchorGroup.
     * @param camera - A ZapparThree.Camera.
     * @param instantTracker - The instant world tracker which will be used.
     */
    constructor(camera: Camera, instantTracker: InstantWorldTracker);
    /**
     * Sets the point in the user's environment that the anchor tracks from.
     *
     * The parameters passed in to this function correspond to the X, Y and Z coordinates (in camera space) of the point to track.
     * Choosing a position with X and Y coordinates of zero, and a negative Z coordinate,
     * will select a point on a surface directly in front of the center of the screen.
     *
     * @param orientation -  The orientation of the point in space.
     */
    setAnchorPoseFromCameraOffset(x: number, y: number, z: number, orientation?: InstantWorldTrackerTransformOrigin): void;
    updateMatrixWorld(force?: boolean): void;
}
