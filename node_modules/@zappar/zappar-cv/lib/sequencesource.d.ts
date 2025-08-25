import { CameraFrameInfo, Source } from "./source";
import { zappar_sequence_source_t, zappar_pipeline_t } from "./gen/zappar";
export declare class SequenceSource extends Source {
    private _impl;
    private _pipeline;
    private _packetNumber;
    private _motionUpdatesQueued;
    private _motionUpdatesSent;
    private _decoder;
    private _minFrameGapMs;
    private _lastUpdateTime;
    private _time;
    static create(p: zappar_pipeline_t): zappar_sequence_source_t;
    static get(m: zappar_sequence_source_t): SequenceSource | undefined;
    constructor(_impl: zappar_sequence_source_t, _pipeline: zappar_pipeline_t);
    loadFromMemory(data: ArrayBuffer): void;
    maxPlaybackFpsSet(fps: number): void;
    setTime(t: number): void;
    getFrame(currentlyProcessing: boolean): void;
    destroy(): void;
    start(): void;
    pause(): void;
    uploadGL(info: CameraFrameInfo): void;
    private _submitMotionUpdates;
}
