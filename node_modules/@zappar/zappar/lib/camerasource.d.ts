import { Pipeline } from "./pipeline";
/**
 * Creates a source of frames from a device camera.
 * @see https://docs.zap.works/universal-ar/javascript/pipelines-and-camera-processing/
 */
export declare class CameraSource {
    private _z;
    private _impl;
    /**
     * Constructs a new CameraSource.
     * @param _pipeline - The pipeline that this tracker will operate within.
     * @param deviceId - The camera device ID which will be used as the source.
     * @see https://docs.zap.works/universal-ar/javascript/pipelines-and-camera-processing/
    */
    constructor(pipeline: Pipeline, deviceId: string);
    /**
    * Destroys the camera source.
    */
    destroy(): void;
    /**
    * Starts the camera source.
    *
    * Starting a given source pauses any other sources within the same pipeline.
    */
    start(): void;
    /**
    * Pauses the camera source.
    */
    pause(): void;
}
