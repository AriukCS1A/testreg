import { FaceMesh } from "@zappar/zappar";
import { THREE } from "../three";
/**
 * The features which may be filled with polygons.
 * @property fillMouth - If true, fills this face feature with polygons.
 * @property fillEyeLeft - If true, fills this face feature with polygons.
 * @property fillEyeRight - If true, fills this face feature with polygons.
 * @property fillNeck - If true, fills this face feature with polygons.
 */
export interface FaceMeshLoaderOptions {
    customModel?: string;
    fillMouth?: boolean;
    fillEyeLeft?: boolean;
    fillEyeRight?: boolean;
    fillNeck?: boolean;
}
/**
 * Loader for adaptive face mesh data.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/face-tracking/
 */
export declare class FaceMeshLoader extends THREE.Loader {
    /**
     * Loads the data for a face mesh.
     * @param options - A URL or ArrayBuffer of the source mesh data or defines if some face features should be filled with polygons.
     * @param onLoad - Callback which returns the FaceMesh once it's loaded.
     * @param onError - Callback which is called if there's an error loading the mesh.
     * @returns The FaceMesh.
     */
    load(options?: string | FaceMeshLoaderOptions, onLoad?: (i: FaceMesh) => void, onProgress?: () => void, onError?: (message?: unknown) => void): FaceMesh;
    /**
     * Loads the default face mesh.
     * @param options - Defines if some face features should be filled with polygons.
     * @param onLoad - Callback which returns the FaceMesh once it's loaded.
     * @param onError - Callback which is called if there's an error loading the mesh.
     * @returns The FaceMesh.
     */
    loadFace(options?: FaceMeshLoaderOptions, onLoad?: (i: FaceMesh) => void, onProgress?: () => void, onError?: (message?: unknown) => void): FaceMesh;
    /**
     * Loads the full head simplified mesh which covers the whole of the user's head, including some neck.
     * It's ideal for drawing into the depth buffer in order to mask out the back of 3D models placed on the user's head.
     * @param options - Defines if some face features should be filled with polygons.
     * @param onLoad - Callback which returns the FaceMesh once it's loaded.
     * @param onError - Callback which is called if there's an error loading the mesh.
     * @returns The FaceMesh.
     */
    loadFullHeadSimplified(options?: FaceMeshLoaderOptions, onLoad?: (i: FaceMesh) => void, onProgress?: () => void, onError?: (message?: unknown) => void): FaceMesh;
    /**
     * @ignore
     */
    parse(): void;
}
