import { ImageTarget } from "@zappar/zappar/lib/imagetracker";
import { THREE } from "../three";
/**
 * A THREE.BufferGeometry that fits to the target image.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/image-tracking/
 */
export declare class TargetImagePreviewBufferGeometry extends THREE.BufferGeometry {
    private imageTarget;
    private hasSetIndices;
    private hasSetUVs;
    private vertices;
    private recalculateNormals;
    /**
     * Constructs a new TargetImagePreviewBufferGeometry.
     * @param imageTarget - The image target which will be used.
     */
    constructor(imageTarget: ImageTarget);
    /**
     * @ignore
     */
    private _updateIndices;
    /**
     * @ignore
     */
    private _updateUVs;
    /**
     * @ignore
     */
    get calculateNormals(): boolean;
}
