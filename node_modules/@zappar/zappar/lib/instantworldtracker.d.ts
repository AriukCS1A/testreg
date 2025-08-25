import { instant_world_tracker_transform_orientation_t } from "@zappar/zappar-cv";
import { Pipeline } from "./pipeline";
import { Anchor } from "./anchor";
export declare type InstantWorldTrackerTransformOrigin = instant_world_tracker_transform_orientation_t;
export interface InstantWorldAnchor extends Anchor {
}
/**
 * Attaches content to a point on a surface in front of the user as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/javascript/instant-world-tracking/
 */
export declare class InstantWorldTracker {
    private _pipeline;
    /**
    * The instant world tracking anchor.
    */
    anchor: InstantWorldAnchor;
    private _z;
    private _impl;
    /**
     * Constructs a new InstantWorldTracker.
     * @param _pipeline - The pipeline that this tracker will operate within.
    */
    constructor(_pipeline: Pipeline);
    /**
     * Destroys the instant tracker.
     */
    destroy(): void;
    private _anchorPoseCameraRelative;
    private _anchorPose;
    /**
     * Gets/sets the enabled state of the instant world tracker.
     * Disable when not in use to save computational resources during frame processing.
     */
    get enabled(): boolean;
    set enabled(e: boolean);
    /**
     * Sets the point in the user's environment that the anchor tracks from.
     *
     * The parameters passed in to this function correspond to the X, Y and Z coordinates (in camera space) of the point to track. Choosing a position with X and Y coordinates of zero, and a negative Z coordinate, will select a point on a surface directly in front of the center of the screen.
     *
     * @param orientation -  The orientation of the point in space.
     */
    setAnchorPoseFromCameraOffset(x: number, y: number, z: number, orientation?: InstantWorldTrackerTransformOrigin): void;
}
