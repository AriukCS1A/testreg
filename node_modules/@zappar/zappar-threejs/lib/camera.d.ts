import * as Zappar from "@zappar/zappar";
import { InstantWorldAnchor } from "@zappar/zappar/lib/instantworldtracker";
import { THREE } from "./three";
import { CameraSource } from "./defaultpipeline";
import { CameraTexture } from "./cameraTexture";
/**
 * The pose modes that determine how the camera moves around in the scene.
 */
export declare enum CameraPoseMode {
    /**
     * The camera sits, stationary, at the origin of world space, and points down the negative Z axis.
     * In this mode, tracked anchors move in world space as the user moves the device or tracked objects in the real world.
     */
    Default = 0,
    /**
     * The camera sits at the origin of world space, but rotates as the user rotates the physical device.
     *
     * When the Zappar library initializes, the negative Z axis of world space points forward in front of the user.
     *
     * In this mode, tracked anchors move in world space as the user moves the device or tracked objects in the real world.
     */
    Attitude = 1,
    /**
     * In this case the camera moves and rotates in world space around the anchor at the origin.
     */
    AnchorOrigin = 2
}
/**
 * The mirror modes that may be used.
 */
export declare enum CameraMirrorMode {
    /**
     * No mirroring.
     */
    None = 0,
    /**
     * This mode mirrors the background camera texture and ensures content still appears correctly tracked.
     * In this mode your content itself isn't flipped, so any text in your tracked content doesn't appear mirrored.
     * This is the default mode for the user-facing camera.
     */
    Poses = 1,
    /**
     * In this mode, the Zappar camera applies a scaleX(-1) CSS transform to your whole canvas.
     * This way both the camera and your content appear mirrored.
     */
    CSS = 2
}
/**
 * The source of frames.
 */
declare type Source = HTMLImageElement | HTMLVideoElement | string;
/**
 * Rear and user camera source options.
 * @property rearCameraSource? - The camera source which will be used for the rear camera.
 * @property userCameraSource? - The camera source which will be used for the user camera.
 */
declare type SourceOptions = {
    rearCameraSource?: Source;
    userCameraSource?: Source;
};
/**
 * Options to modify the camera behavior.
 * @param pipeline - The pipeline that this tracker will operate within.
 * @property pipeline? - The pipeline that this tracker will operate within.
 * @property zNear? - The near clipping plane.
 * @property zFar? - The far clipping plane.
 * @property backgroundTexture? - An instance of CameraTexture to use. This should usually be left blank.
 */
export declare type Options = Zappar.Pipeline | (Partial<{
    pipeline: Zappar.Pipeline;
    zNear: number;
    zFar: number;
    backgroundTexture: CameraTexture;
}> & SourceOptions);
/**
 * Creates a camera that you can use instead of a perspective camera.
 *
 * The camera provides a {@link Camera.backgroundTexture} property containing the camera feed.
 *
 * The ZapparThree library needs to use your WebGL context in order to process camera frames.
 * You can set it when your page loads using {@link glContextSet}.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/camera-setup/
 */
export declare class Camera extends THREE.Camera {
    /**
     * The far clipping plane.
     */
    set far(value: number);
    /**
     * The far clipping plane.
     */
    get far(): number;
    /**
     * The near clipping plane.
     */
    set near(value: number);
    /**
     * The near clipping plane.
     */
    get near(): number;
    pipeline: Zappar.Pipeline;
    /**
     * The camera feed texture.
     *
     * You can use this texture however you wish but the easiest way to show the camera feed behind your content is to set it as your scene's background.
     */
    backgroundTexture: CameraTexture;
    /**
     * A 4x4 column-major transformation matrix where the camera sits.
     */
    rawPose: Float32Array;
    /**
     * The pose mode that determines how the camera moves in the scene.
     */
    poseMode: CameraPoseMode;
    /**
     * The transformation with the (camera-relative) origin specified by the anchor.
     */
    poseAnchorOrigin: Zappar.ImageAnchor | Zappar.FaceAnchor | InstantWorldAnchor | undefined;
    /**
     * The mirror mode that is used for the rear camera.
     */
    rearCameraMirrorMode: CameraMirrorMode;
    /**
     * The mirror mode that is used for the user camera.
     */
    userCameraMirrorMode: CameraMirrorMode;
    private _currentMirrorMode;
    /**
     * @ignore
     * Needed for raycasters to work.
     */
    isPerspectiveCamera: boolean;
    /**
     * The camera source which is used for the rear camera.
     */
    rearCameraSource: CameraSource | Zappar.HTMLElementSource;
    /**
     * The camera source which is used for the user camera.
     */
    userCameraSource: CameraSource | Zappar.HTMLElementSource;
    private cameraDirection;
    private hasSetCSSScaleX;
    private zFar;
    private zNear;
    private renderWidth;
    private renderHeight;
    /**
     * Constructs a new Camera.
     * @param pipeline - The pipeline that this tracker will operate within.
     * @property pipeline - The pipeline that this tracker will operate within.
     * @property zNear - The near clipping plane.
     * @property zFar - The far clipping plane.
     * @property rearCameraSource? - The camera source which will be used for the rear camera.
     * @property userCameraSource? - The camera source which will be used for the user camera.
     */
    constructor(opts?: Options);
    /**
     * Constructs a new CameraSource or HTMLElementSource based on parameters passed in.
     * @param cameraSource - HTML element or camera device ID which will be used as a source
     * @returns CameraSource if cameraSource param is undefined or string, otherwise HTMLElementSource.
     */
    private cameraSourceFromOpts;
    /**
     * Pauses the camera source.
     */
    private pause;
    /**
     * Starts the camera source.
     *
     * Starting a given source pauses any other sources within the same pipeline.
     */
    private resume;
    /**
     * Starts the camera source.
     * @param userFacing - If true, starts the user facing camera. (i.e selfie).
     */
    start(userFacing?: boolean): void;
    /**
     * Stops the camera source.
     */
    stop(): void;
    /**
     * Sets the pose mode to 'Anchor Origin'.
     *
     * In this case the camera moves and rotates in world space around the anchor at the origin.
     * @param anchor - The anchor that defines the origin.
     */
    setPoseModeAnchorOrigin(anchor: Zappar.Anchor): void;
    /**
     * Gets the current mirror mode.
     */
    get currentMirrorMode(): CameraMirrorMode;
    private inlineDecoder?;
    handleColorSpace(renderer: THREE.WebGLRenderer): void;
    /**
     * Processes camera frames and updates `backgroundTexture`.
     * Call this function on your pipeline once an animation frame (e.g. during your `requestAnimationFrame` function).
     * @param renderer - The Three.js WebGL renderer.
     */
    updateFrame(renderer: THREE.WebGLRenderer): void;
    _updateProjectionMatrix(): void;
    updateMatrixWorld(force?: boolean): void;
    private getOriginPose;
    /**
     * Destroys the camera sources.
     */
    dispose(): void;
}
export {};
