import { THREE } from "../three";
declare type OnProgress = ((url: string, loaded: number, total: number) => void) | undefined;
declare type OnLoad = (() => void) | undefined;
declare type OnError = ((url: string) => void) | undefined;
/**
 * Elements available for styling.
 * @param container - The base container of the loader.
 * @param inner - The inner container of the loader.
 * @param title - The title of the loader.
 * @param progress - The progress bar of the loader.
 * @param progressValue - The value of the progress bar.
 */
export interface LoaderStyle {
    container?: Partial<CSSStyleDeclaration>;
    inner?: Partial<CSSStyleDeclaration>;
    title?: Partial<CSSStyleDeclaration>;
    progress?: Partial<CSSStyleDeclaration>;
    progressValue?: Partial<CSSStyleDeclaration>;
}
declare class UI {
    containerDiv: HTMLElement;
    customStyle: LoaderStyle | undefined;
    lastLoadPercentage: number;
    divs: {
        inner: HTMLDivElement;
        title: HTMLDivElement;
        progress: HTMLDivElement;
        progressValue: HTMLDivElement;
    };
    css: LoaderStyle;
    constructor(style?: LoaderStyle);
    updateLoader: (loadPercentage: number) => void;
    dispose: () => void;
    initialize(): void;
    refreshStyle(): void;
}
/**
 * Creates a THREE.DefaultLoadingManager which is applied to all assets that can be loaded.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/loading-manager/
 */
export declare class DefaultLoaderUI extends UI {
    /**
     * Constructs a new DefaultLoaderUI.
     * @param options - The styling of the UI.
     * @param onload - The callback function to be called when assets are loaded.
     */
    constructor(options?: {
        style?: LoaderStyle;
        onLoad?: OnLoad;
    });
}
/**
 * A LoadingManager with a user friendly interface.
 * @see https://docs.zap.works/universal-ar/web-libraries/threejs/loading-manager/
 */
export declare class LoadingManager extends THREE.LoadingManager {
    ui: UI;
    private onStartCallback;
    /**
     * Constructs a new LoadingManager.
     * @param options - Styling may be defined here, as well as any event callbacks.
     */
    constructor(options?: {
        style?: LoaderStyle;
        onLoad?: OnLoad;
        onProgress?: OnProgress;
        onError?: OnError;
    });
    /**
     * @ignore
     */
    readonly onStart: () => void;
    /**
     * Calls provided function when loading begins.
     * @param callback - Function that is called when loading starts.
     */
    _onStart: (callback: Function) => void;
    /**
     * Destroys the UI.
     */
    dispose: () => void;
}
export {};
