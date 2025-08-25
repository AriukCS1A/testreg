import { THREE } from "../three";
import { FaceTracker } from "../defaultpipeline";
/**
 * Loader for face tracking model data.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/face-tracking/
 */
export declare class FaceTrackerLoader extends THREE.Loader {
    /**
     * Loads face tracking model data.
     * @param customModel - A URL to, or ArrayBuffer of, model data.
     * @param options - A URL or ArrayBuffer of the source mesh data or defines if some face features should be filled with polygons.
     * @param onLoad - Callback which returns the FaceMesh once it's loaded.
     * @param onError - Callback which is called if there's an error loading the mesh.
     * @returns The FaceTracker.
     */
    load(customModel?: string | ArrayBuffer, onLoad?: (i: FaceTracker) => void, onProgress?: () => void, onError?: (message?: unknown) => void): FaceTracker;
    /**
     * @ignore
     */
    parse(): void;
}
