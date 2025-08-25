import { zappar_pipeline_t } from "@zappar/zappar-cv";
import { Event } from "./event";
import { FaceMesh } from "./facemesh";
/**
 * Pipelines manage the flow of data coming in (i.e. the camera frames) through to the output from the different tracking types and computer vision algorithms.
 * @see https://docs.zap.works/universal-ar/javascript/pipelines-and-camera-processing/
 */
export declare class Pipeline {
    /**
     * Emitted when the frame is updated.
    */
    onFrameUpdate: Event;
    /**
     * @ignore
    */
    _onFrameUpdateInternal: Event;
    private _z;
    private _impl;
    private _lastFrameNumber;
    /**
     * Constructs a new Pipeline.
    */
    constructor();
    /**
     * Destroys the pipeline.
     */
    destroy(): void;
    /**
     * Updates the pipeline and trackers to expose tracking data from the most recently processed camera frame.
     */
    frameUpdate(): void;
    /**
     * @ignore
    */
    _getImpl(): zappar_pipeline_t;
    /**
     * Sets the WebGL context used for the processing and upload of camera textures.
     * @param gl - The WebGL context.
    */
    glContextSet(gl: WebGLRenderingContext): void;
    /**
     * Informs the pipeline that the GL context is lost and should not be used.
    */
    glContextLost(): void;
    /**
     * Returns the most recent camera frame texture.
    */
    cameraFrameTextureGL(): WebGLTexture | undefined;
    /**
     * Returns a matrix that you can use to transform the UV coordinates of the following full-screen quad in order to render the camera texture:
     *
     * Vertex 0: `-1, -1, 0`
     *
     * UV 0: `0, 0`
     *
     * Vertex 1: `-1, 1, 0`
     *
     * UV 1: `0, 1`
     *
     * Vertex 2: `1, -1, 0`
     *
     * UV 1: `1, 0`
     *
     * Vertex 3: `1, 1, 0`
     *
     * UV 1: `1, 1`
     *
     * @param renderWidth - The width of the canvas.
     * @param renderHeight - The height of the canvas.
     * @param mirror - Pass `true` to mirror the camera image in the X-axis.
     * @returns A 4x4 column-major transformation matrix.
    */
    cameraFrameTextureMatrix(renderWidth: number, renderHeight: number, mirror?: boolean): Float32Array;
    /**
    * Draw the camera to the screen as a full screen quad.
    *
    * Please note this function modifies some GL state during its operation so you may need to reset the following GL state if you use it:
    * - The currently bound texture 2D is set to `null` (e.g. `gl.bindTexture(gl.TEXTURE_2D, null)`)
    * - The currently bound array buffer is set to `null` (e.g. `gl.bindBuffer(gl.ARRAY_BUFFER, null);`)
    * - The currently bound program is set to `null` (e.g. `gl.useProgram(null)`)
    * - The currently active texture is set to `gl.TEXTURE0` (e.g. `gl.activeTexture(gl.TEXTURE0)`)
    * - These features are disabled: `gl.SCISSOR_TEST`, `gl.DEPTH_TEST`, `gl.BLEND`, `gl.CULL_FACE`
    * @param renderWidth - The width of the canvas.
    * @param renderHeight - The height of the canvas.
    * @param mirror - Pass `true` to mirror the camera image in the X-axis.
   */
    cameraFrameDrawGL(renderWidth: number, renderHeight: number, mirror?: boolean): void;
    /**
     * Uploads the current camera frame to a WebGL texture.
    */
    cameraFrameUploadGL(): void;
    /**
     * Prepares camera frames for processing.
     *
     * Call this function on your pipeline once an animation frame (e.g. during your `requestAnimationFrame` function) in order to process incoming camera frames.
     *
     * Please note this function modifies some GL state during its operation so you may need to reset the following GL state if you use it:
     * - The currently bound framebuffer is set to `null` (e.g. `gl.bindFramebuffer(gl.FRAMEBUFFER, null)`)
     * - The currently bound texture 2D is set to `null` (e.g. `gl.bindTexture(gl.TEXTURE_2D, null)`)
     * - The currently bound array buffer is set to `null` (e.g. `gl.bindBuffer(gl.ARRAY_BUFFER, null);`)
     * - The currently bound element array buffer is set to `null` (e.g. `gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)`)
     * - The currently bound program is set to `null` (e.g. `gl.useProgram(null)`)
     * - The currently active texture is set to `gl.TEXTURE0` (e.g. `gl.activeTexture(gl.TEXTURE0)`)
     * - These features are disabled: `gl.SCISSOR_TEST`, `gl.DEPTH_TEST`, `gl.BLEND`, `gl.CULL_FACE`
     * - The pixel store flip-Y mode is disabled (e.g. `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)`)
     * - The viewport is changed (e.g. `gl.viewport(...)`)
     * - The clear color is changed (e.g. `gl.clearColor(...)`)
    */
    processGL(): void;
    /**
     * Returns the camera model (i.e. the intrinsic camera parameters) for the current frame.
    */
    cameraModel(): Float32Array;
    /**
     * Returns a transformation where the camera sits, stationary, at the origin of world space, and points down the negative Z axis.
     *
     * In this mode, tracked anchors move in world space as the user moves the device or tracked objects in the real world.
     *
     * @returns A 4x4 column-major transformation matrix
    */
    cameraPoseDefault(): Float32Array;
    /**
     * Returns a transformation where the camera sits at the origin of world space, but rotates as the user rotates the physical device.
     *
     * When the Zappar library initializes, the negative Z axis of world space points forward in front of the user.
     *
     * In this mode, tracked anchors move in world space as the user moves the device or tracked objects in the real world.
     *
     * @param mirror -  Pass `true` to mirror the location in the X-axis.
     * @returns A 4x4 column-major transformation matrix
    */
    cameraPoseWithAttitude(mirror?: boolean): Float32Array;
    /**
     * Returns a transformation with the (camera-relative) origin specified by the supplied parameter.
     *
     * This is used with the `poseCameraRelative(...) : Float32Array` functions provided by the various anchor types to allow a given anchor (e.g. a tracked image or face) to be the origin of world space.
     *
     * In this case the camera moves and rotates in world space around the anchor at the origin.
     *
     * @param o - The origin matrix.
     * @returns A 4x4 column-major transformation matrix
    */
    cameraPoseWithOrigin(o: Float32Array): Float32Array;
    /**
      * Returns true if the current camera frame came from a user-facing camera
     */
    cameraFrameUserFacing(): boolean;
    /**
      * @ignore
     */
    drawFace(projectionMatrix: Float32Array, cameraMatrix: Float32Array, targetMatrix: Float32Array, m: FaceMesh): void;
    /**
      * Returns the number of the current frame.
     */
    frameNumber(): number;
    /**
     * Start recording camera and motion data into memory. This data can then used with SequenceSource to replay the sequence.
     *
     * @param expectedFrames - The number of camera frames you expect to capture. If supplied, memory will be pre-allocated to improve performance
     */
    sequenceRecordStart(expectedFrames?: number): void;
    /**
     * Stop recording camera and motion data.
     */
    sequenceRecordStop(): void;
    /**
     * Remove any camera and motion data currently stored in memory.
     */
    sequenceRecordClear(): void;
    /**
     * Get the data captured by sequence recording.
     *
     * @returns A Uint8Array of packed camera and motion data
     */
    sequenceRecordData(): Uint8Array;
}
