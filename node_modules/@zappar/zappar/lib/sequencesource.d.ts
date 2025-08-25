import { Pipeline } from "./pipeline";
/**
 * Plays back a previously recorded sequence of camera and motion data.
 */
export declare class SequenceSource {
    private _z;
    private _impl;
    /**
     * Constructs a new SequenceSource.
     * @param _pipeline - The pipeline that this source will operate within.
    */
    constructor(pipeline: Pipeline);
    /**
    * Destroys the sequence source.
    */
    destroy(): void;
    /**
    * Starts the sequence source.
    *
    * Starting a given source pauses any other sources within the same pipeline.
    */
    start(): void;
    /**
    * Pauses the sequence source.
    */
    pause(): void;
    /**
     * Loads sequence data.
     * @param src - A URL to, or an ArrayBuffer of, the sequence data you'd like to play back.
     * @returns A promise that's resolved once the data is downloaded.
    */
    load(src: string | ArrayBuffer): Promise<void>;
    /**
     * Manually set the current time for the sequence.
     * @param t The time in ms, or `undefined` to use the system time.
     */
    setTime(t: number | undefined): void;
}
