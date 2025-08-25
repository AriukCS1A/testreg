import { ImageTracker, ImageAnchor } from "@zappar/zappar";
import { THREE } from "../three";
import { Camera } from "../camera";
/**
 * A THREE.Group that attaches content to a known image as it moves around in the camera view.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/image-tracking/
 */
export declare class ImageAnchorGroup extends THREE.Group {
    private camera;
    readonly imageTracker: ImageTracker;
    anchorId?: string | undefined;
    /**
     * @ignore
     */
    isReady: boolean;
    currentAnchor: ImageAnchor | undefined;
    /**
     * Constructs a new ImageAnchorGroup.
     * @param camera - A ZapparThree.Camera.
     * @param imageTracker - The image tracker which will be used.
     * @param anchorId - Specify this to limit the group to tracking an anchor with the provided ID.
     */
    constructor(camera: Camera, imageTracker: ImageTracker, anchorId?: string | undefined);
    updateMatrixWorld(force?: boolean): void;
}
