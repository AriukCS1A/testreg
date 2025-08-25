import { Zappar } from "@zappar/zappar-cv";
import { Options } from "@zappar/zappar-cv/lib/options";
export declare function setOptions(opts: Partial<Options>): void;
/**
 * @ignore
*/
export declare function z(): Zappar;
/**
 * Gets the ID or the default rear- or user-facing camera.
 * @param userFacing - Whether 'selfie' camera ID should be returned.
 * @returns The camera device ID.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
*/
export declare function cameraDefaultDeviceID(userFacing?: boolean): string;
/**
 * Inverts a 4x4 Float32Array Matrix.
 * @param m - The 4x4 matrix to be inverted.
 * @returns The inverted Float32Array matrix.
*/
export declare function invert(m: Float32Array): Float32Array;
/**
  * Calculates the projection matrix from a given camera model (i.e. intrinsic camera parameters)
  * @param model - The camera model.
  * @param renderWidth - The width of the canvas.
  * @param renderHeight - The height of the canvas.
  * @param zNear - The near clipping plane.
  * @param zFar - The far clipping plane.
  * @returns A 4x4 column-major projection matrix.
 */
export declare function projectionMatrixFromCameraModel(model: Float32Array, renderWidth: number, renderHeight: number, zNear?: number, zFar?: number): Float32Array;
/**
 * @ignore
*/
export declare function drawPlane(gl: WebGLRenderingContext, projectionMatrix: Float32Array, cameraMatrix: Float32Array, targetMatrix: Float32Array, texture: string): void;
/**
 * Detects if your page is running in a browser that's not supported
 * @returns 'true' if the browser is incompatible.
*/
export declare function browserIncompatible(): boolean;
/**
 * Shows a full-page dialog that informs the user they're using an unsupported browser,
 * and provides a button to 'copy' the current page URL so they can 'paste' it into the
 * address bar of a compatible alternative.
*/
export declare function browserIncompatibleUI(): void;
/**
 * Check if the Zappar library is fully loaded and ready to process data.
 * Note that you can still use the full API before this function returns true - it's here to help implement loading screens.
 *
 * @returns 'true' if the library is fully loaded.
*/
export declare function loaded(): boolean;
/**
 * Gets a promise that resolves when the Zappar library is fully loaded and ready to process data.
 * Note that you can still use the full API before this promise is resolved - it's here to help implement loading screens.
 *
 * @returns a promise that resolves when the library is fully loaded.
*/
export declare function loadedPromise(): Promise<void>;
/**
 * Pass true to this function if your user has consented to analytics cookies.
 * If set to true, a local storage item will store a pseudorandom identifier for the user for the purposes of
 * reporting 'unique user' analytics if the page is hosted using Zapworks.
 *
 * @param c - if cookies are permitted or not
 */
export declare function cookiesPermitted(c: boolean): void;
