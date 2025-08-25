import { Camera } from "./camera";
export declare class CameraEnvironmentMap {
    private cubeMapScene;
    private renderTarget;
    private cubeCamera;
    private sphereMaterial;
    private sphereGroup;
    /**
     * The resulting map texture. Set this as your `scene.environment` or as a material's `envMap`.
     */
    environmentMap: import("three").CubeTexture;
    /**
     * Constructs a new Camera Environment Map.
     */
    constructor();
    /**
     * Destroy the resources held by this object.
     */
    dispose(): void;
    /**
     * Update the contents of the environment map with the latest texture from the camera.
     *
     * Call this each frame after you call `update` on your Zappar camera, but before you render the scene.
     * @param renderer - Your renderer object
     * @param zapparCamera - The Zappar camera you're using to render your scene
     */
    update(renderer: THREE.WebGLRenderer, zapparCamera: Camera): void;
}
