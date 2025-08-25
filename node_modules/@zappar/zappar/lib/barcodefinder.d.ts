import { Event1 } from "./event";
import { barcode_format_t } from "@zappar/zappar-cv";
import { Pipeline } from "./pipeline";
export declare type BarcodeFormat = barcode_format_t;
/**
 * A barcode found in the camera source.
 */
export interface BarcodeFinderFound {
    /**
     * The text of the barcode.
     */
    text: string;
    /**
     * The format of the barcode.
     */
    format: BarcodeFormat;
}
/**
 * Detects barcodes in the images from the camera.
 */
export declare class BarcodeFinder {
    private _pipeline;
    /**
    * Emitted when a barcode becomes visible in a camera frame.
    */
    onDetection: Event1<BarcodeFinderFound>;
    private _lastDetected;
    private _z;
    private _impl;
    private _found;
    private _formats;
    /**
     * Constructs a new BarcodeFinder.
     * @param _pipeline - The pipeline that this BarcodeFinder will operate within.
    */
    constructor(_pipeline: Pipeline);
    /**
     * Destroys the barcode finder.
     */
    destroy(): void;
    private _frameUpdate;
    /**
      * Returns an array of discovered barcodes
      */
    get found(): BarcodeFinderFound[];
    /**
     * Gets/sets the enabled state of the barcode finder.
     * Disable when not in use to save computational resources during frame processing.
    */
    get enabled(): boolean;
    set enabled(e: boolean);
    /**
      * Gets/sets the barcode formats to scan for.
      */
    get formats(): BarcodeFormat[];
    set formats(f: BarcodeFormat[]);
}
