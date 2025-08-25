/**
 * A point in 3D space (including orientation) in a fixed location relative to a tracked object or environment.
 */
export interface Anchor {
    /**
     * Returns the world pose for the anchor for a given camera location.
     * @param cameraPose - The location of the camera as a 4x4 column-major matrix.
     * @param mirror - Pass `true` to mirror the location in the X-axis.
     * @returns A 4x4 column-major transformation matrix.
     */
    pose(cameraPose: Float32Array, mirror?: boolean): Float32Array;
    /**
     * Returns the pose of the anchor relative to the camera.
     * @param mirror - Pass `true` to mirror the location in the X-axis.
     * @returns A 4x4 column-major transformation matrix.
     */
    poseCameraRelative(mirror?: boolean): Float32Array;
}
