export declare enum EmbeddedVideoImplementation {
    OBJECT_URL = 0,
    SRC_OBJECT = 1
}
export declare let profile: {
    deviceMotionMutliplier: number;
    blacklisted: boolean;
    showGyroPermissionsWarningIfNecessary: boolean;
    showSafariPermissionsResetIfNecessary: boolean;
    requestHighFrameRate: boolean;
    videoWidth: number;
    videoHeight: number;
    dataWidth: number;
    dataHeight: number;
    videoElementInDOM: boolean;
    preferMediaStreamTrackProcessorCamera: boolean;
    preferImageBitmapCamera: boolean;
    ios164CameraSelection: boolean;
    relyOnConstraintsForCameraSelection: boolean;
    forceWindowOrientation: boolean;
};
