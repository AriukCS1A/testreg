import { Pipeline } from "@zappar/zappar";
import { Event1 } from "@zappar/zappar/lib/event";
import { CameraMirrorMode } from "./camera";
import { THREE } from "./three";
/**
 * Creates a texture to be used internally by `ZapparThree.Camera`.
 */
export declare class CameraTexture extends THREE.Texture {
    private viewMatrix;
    private textureMatrix3;
    MirrorMode: CameraMirrorMode;
    onTextureUpdated: Event1<{
        texture: THREE.Texture;
        renderer: THREE.WebGLRenderer;
    }>;
    constructor();
    /**
     * Override three.js update function since we update the camera texture ourselves.
     */
    protected update(): void;
    /**
     * Processes camera frames and updates the texture.
     * @param renderer - The Three.js WebGL renderer.
     * @param pipeline - A ZapparThree Pipeline.
     */
    updateFromPipeline(renderer: THREE.WebGLRenderer, pipeline: Pipeline): void;
    dispose(): void;
}
/**
 * A helper class used to decode the camera texture.
 */
export declare class InlineDecoder {
    /**
     * A THREE scene to hold shader object.
     */
    private shaderScene;
    private shaderRenderTarget;
    private shaderMaterial;
    private shaderCamera;
    private intermediateRenderTarget;
    /**
     * Get the texture of the render target.
     * @public
     * @returns THREE.Texture The texture of the render target.
     */
    get texture(): import("three").Texture;
    constructor(cameraTexture: CameraTexture);
    /**
     * Updates the shader uniform with a new texture and renders the shader scene to the target texture.
     */
    private update;
    /**
     * Releases the resources held by this object.
     * @public
     */
    dispose(): void;
}
