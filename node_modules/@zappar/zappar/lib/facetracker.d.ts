import { Event, Event1 } from "./event";
import { Pipeline } from "./pipeline";
import { Anchor } from "./anchor";
/**
 * A point in 3D space (including orientation) in a fixed location relative to a tracked face, including identity and expression coefficients.
 */
export interface FaceAnchor extends Anchor {
    /**
     * Emitted when the anchor becomes visible in a camera frame.
     */
    onVisible: Event;
    /**
     * Emitted when the anchor goes from being visible in the previous camera frame, to not being visible in the current frame.
     */
    onNotVisible: Event;
    /**
     * A string that's unique for this anchor.
     */
    id: string;
    /**
     * `true` if the anchor is visible in the current frame.
     */
    visible: boolean;
    /**
     * The identity coefficients of the face.
     */
    identity: Float32Array;
    /**
     * The expression coefficients of the face.
     */
    expression: Float32Array;
    /**
     * The index of the anchor.
     */
    indx: number;
}
/**
 * Attaches content to a face as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/javascript/face-tracking/
 */
export declare class FaceTracker {
    private _pipeline;
    /**
    * Emitted when an anchor becomes visible in a camera frame.
    */
    onVisible: Event1<FaceAnchor>;
    /**
    * Emitted when an anchor goes from being visible in the previous camera frame, to not being visible in the current frame.
    */
    onNotVisible: Event1<FaceAnchor>;
    /**
    * Emitted when a new anchor is created by the tracker.
    */
    onNewAnchor: Event1<FaceAnchor>;
    /**
     * The set of currently visible anchors.
     */
    visible: Set<FaceAnchor>;
    /**
    * A map of the available anchors by their respective IDs.
    */
    anchors: Map<string, FaceAnchor>;
    private _visibleLastFrame;
    private _z;
    private _impl;
    /**
     * Constructs a new FaceTracker
     * @param _pipeline - The pipeline that this tracker will operate within.
    */
    constructor(_pipeline: Pipeline);
    /**
      * Destroys the face tracker.
     */
    destroy(): void;
    private _frameUpdate;
    /**
     * Loads face tracking model data.
     * @param src - A URL to, or ArrayBuffer of, model data.
     * @returns A promise that's resolved once the model is loaded. It may still take a few frames for the tracker to fully initialize and detect faces.
    */
    loadModel(src: string | ArrayBuffer): Promise<void>;
    /**
     * Loads the default face tracking model.
     * @returns A promise that's resolved once the model is loaded. It may still take a few frames for the tracker to fully initialize and detect faces.
    */
    loadDefaultModel(): Promise<void>;
    /**
     * Gets/sets the enabled state of the face tracker.
     * Disable when not in use to save computational resources during frame processing.
     */
    get enabled(): boolean;
    set enabled(e: boolean);
    /**
     * Gets/sets the maximum number of faces to track.
     *
     * By default only one face is tracked in any given frame. Increasing this number may reduce runtime performance.
     */
    get maxFaces(): number;
    set maxFaces(m: number);
}
