import { THREE } from "../three";
/**
 * Loader for library itself.
 * This library uses some additional resources (e.g web workers and WebAssembly) - this loader resolves once the library has fully loaded these resources.
 * If you're using the LoadingManager included in this library you don't need to explicitly use this yourself as one is automatically created.
 */
export declare class LibraryLoader extends THREE.Loader {
    /**
     * Resolves once the library is loaded and ready to process data.
     * @param onLoad - Callback which runs once the library is fully loaded.
     * @param onError - Callback which is called if there's an error loading library.
     */
    load(onLoad?: () => void, onProgress?: () => void, onError?: () => void): void;
    /**
     * @ignore
     */
    parse(): void;
}
