import { Pipeline } from "./pipeline";
/**
 * Creates a source of frames from a HTML <video> or <img> element.
 * @see https://docs.zap.works/universal-ar/javascript/pipelines-and-camera-processing/
 */
export declare class HTMLElementSource {
    private _z;
    private _impl;
    /**
     * Constructs a new HTMLElementSource.
     * @param pipeline - The pipeline that this tracker will operate within.
     * @param element -  The HTML source element.
    */
    constructor(pipeline: Pipeline, element: HTMLVideoElement | HTMLImageElement);
    /**
    * Destroys the source.
    */
    destroy(): void;
    /**
    * Starts the source sending frames into the pipeline.
    *
    * Starting a given source pauses any other sources within the same pipeline.
    */
    start(): void;
    /**
    * Pauses the source.
    */
    pause(): void;
}
