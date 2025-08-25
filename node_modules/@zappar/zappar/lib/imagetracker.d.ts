import { Event, Event1 } from "./event";
import { Zappar, zappar_image_tracker_t } from "@zappar/zappar-cv";
import { Pipeline } from "./pipeline";
import { Anchor } from "./anchor";
/**
 * A point in 3D space (including orientation) in a fixed location relative to a tracked image.
 */
export interface ImageAnchor extends Anchor {
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
}
/**
 * Attaches content to a known image as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/javascript/image-tracking/
 */
export declare class ImageTracker {
    private _pipeline;
    /**
    * Emitted when an anchor becomes visible in a camera frame.
    */
    onVisible: Event1<ImageAnchor>;
    /**
    * Emitted when an anchor goes from being visible in the previous camera frame, to not being visible in the current frame.
    */
    onNotVisible: Event1<ImageAnchor>;
    /**
    * Emitted when a new anchor is created by the tracker.
    */
    onNewAnchor: Event1<ImageAnchor>;
    /**
    * The set of currently visible anchors.
    */
    visible: Set<ImageAnchor>;
    /**
    * A map of the available image anchors by their respective IDs.
    */
    anchors: Map<string, ImageAnchor>;
    private _visibleLastFrame;
    private _z;
    private _impl;
    private _targets;
    /**
     * Constructs a new ImageTracker
     * @param _pipeline - The pipeline that this tracker will operate within.
     * @param targetFile - The .zpt target file from the source image you'd like to track.
     * @see https://docs.zap.works/universal-ar/zapworks-cli/
    */
    constructor(_pipeline: Pipeline, targetFile?: string | ArrayBuffer);
    /**
     * Destroys the image tracker.
     */
    destroy(): void;
    private _frameUpdate;
    /**
     * Loads a target file.
     * @param src - A URL to, or an ArrayBuffer of, the target file from the source image you'd like to track.
     * @see https://docs.zap.works/universal-ar/zapworks-cli/
     * @returns A promise that's resolved once the file is downloaded. It may still take a few frames for the tracker to fully initialize and detect images.
    */
    loadTarget(src: string | ArrayBuffer): Promise<void>;
    /**
     * Gets/sets the enabled state of the image tracker.
     * Disable when not in use to save computational resources during frame processing.
     */
    get enabled(): boolean;
    set enabled(e: boolean);
    /**
     * An array of information for each of the target images loaded by this tracker.
     */
    get targets(): ImageTarget[];
}
/**
 * A target image embedded with a target file.
 */
export declare class ImageTarget {
    private _z;
    private _impl;
    private _indx;
    /**
     * A factor to multiply 'target units' by to obtain values in meters. This is only present in the file if the physical image dimensions, or a DPI, are specified during image training.
     */
    physicalScaleFactor: number | undefined;
    /**
     * For cylindrical targets, the radius (in target units) of the cylinder at the top of the target image. For non-conical cylinders, this value will equal `bottomRadius`. If the target is not cylindrical, this will be `undefined`.
     */
    topRadius: number | undefined;
    /**
     * For cylindrical targets, the radius (in target units) of the cylinder at the bottom of the target image. For non-conical cylinders, this value will equal `topRadius`. If the target is not cylindrical, this will be `undefined`.
     */
    bottomRadius: number | undefined;
    /**
     * For conical targets, the length of the side of the target (in target units) within the trained image file. If the target is not conical, this will be `undefined`.
     */
    sideLength: number | undefined;
    private _image;
    private _preview;
    constructor(_z: Zappar, _impl: zappar_image_tracker_t, _indx: number);
    /**
     * An <img> element containing the embedded preview image, or `undefined` if the target file does not contain one.
     */
    get image(): HTMLImageElement | undefined;
    /**
     * An object containing a mesh that represents this image target.
     */
    get preview(): ImageTargetPreview;
}
/**
 * Stores a mesh that represents an image target.
 */
export declare class ImageTargetPreview {
    private _z;
    private _impl;
    private _indx;
    /**
     * The vertices of the mesh.
     */
    vertices: Float32Array;
    /**
     * The UVs of the mesh.
     */
    uvs: Float32Array;
    /**
     * The indices of the mesh.
     */
    indices: Uint16Array;
    constructor(_z: Zappar, _impl: zappar_image_tracker_t, _indx: number);
}
