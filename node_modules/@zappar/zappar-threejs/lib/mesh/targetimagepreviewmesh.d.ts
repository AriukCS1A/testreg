import { ImageTarget } from "@zappar/zappar/lib/imagetracker";
import { THREE } from "../three";
/**
 * A THREE.Mesh that fits the target image.
 * If a material is not specified, it will use a default THREE.MeshBasicMaterial with a map of the target image.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/image-tracking/
 */
export declare class TargetImagePreviewMesh extends THREE.Mesh {
    constructor(target: ImageTarget, material?: THREE.Material);
}
