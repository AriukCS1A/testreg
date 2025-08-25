import { zappar_pipeline_t } from "./gen/zappar";
import { Source } from "./source";
import { zappar_html_element_source_t } from "./additional";
export declare class HTMLElementSource extends Source {
    protected _video: HTMLVideoElement | HTMLImageElement;
    protected _pipeline: zappar_pipeline_t;
    protected _isPaused: boolean;
    protected _hadFrames: boolean;
    protected _isUserFacing: boolean;
    protected _cameraToScreenRotation: number;
    private _isUploadFrame;
    private _currentVideoTexture;
    private _imageProcessor;
    private _cameraToDeviceTransform;
    private _cameraToDeviceTransformUserFacing;
    private _cameraModel;
    static createVideoElementSource(p: zappar_pipeline_t, element: HTMLVideoElement | HTMLImageElement): zappar_html_element_source_t;
    static getVideoElementSource(m: zappar_html_element_source_t): HTMLElementSource | undefined;
    constructor(_video: HTMLVideoElement | HTMLImageElement, _pipeline: zappar_pipeline_t);
    private _resetGLContext;
    destroy(): void;
    pause(): void;
    start(): void;
    getFrame(currentlyProcessing: boolean): void;
    private _processFrame;
    uploadGL(): void;
}
