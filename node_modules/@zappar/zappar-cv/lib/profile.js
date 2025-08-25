import * as UAParser from "ua-parser-js";
export var EmbeddedVideoImplementation;
(function (EmbeddedVideoImplementation) {
    EmbeddedVideoImplementation[EmbeddedVideoImplementation["OBJECT_URL"] = 0] = "OBJECT_URL";
    EmbeddedVideoImplementation[EmbeddedVideoImplementation["SRC_OBJECT"] = 1] = "SRC_OBJECT";
})(EmbeddedVideoImplementation || (EmbeddedVideoImplementation = {}));
export let profile = {
    deviceMotionMutliplier: -1.0,
    blacklisted: false,
    showGyroPermissionsWarningIfNecessary: false,
    showSafariPermissionsResetIfNecessary: false,
    requestHighFrameRate: false,
    videoWidth: 640,
    videoHeight: 480,
    dataWidth: 320,
    dataHeight: 240,
    videoElementInDOM: false,
    preferMediaStreamTrackProcessorCamera: false,
    preferImageBitmapCamera: false,
    ios164CameraSelection: false,
    relyOnConstraintsForCameraSelection: false,
    forceWindowOrientation: false,
};
if (typeof window !== "undefined") {
    window["zeeProfile"] = profile;
    if (window.location.href.indexOf("_mstppipeline") >= 0) {
        console.log("Configuring for MSTP camera pipeline (if supported)");
        profile.preferMediaStreamTrackProcessorCamera = true;
    }
    if (window.location.href.indexOf("_imagebitmappipeline") >= 0) {
        console.log("Configuring for ImageBitmap camera pipeline (if supported)");
        profile.preferImageBitmapCamera = true;
    }
}
let agent = new UAParser.UAParser();
let os = (agent.getOS().name || "unknown").toLowerCase();
let engine = (agent.getEngine().name || "unknown").toLowerCase();
if (engine === "webkit" && os !== "ios") {
    profile.deviceMotionMutliplier = 1.0;
    if (typeof window !== "undefined" && window.orientation !== undefined) {
        // iPad
        iDevice("15.0");
    }
}
if (engine === "webkit" && os === "ios") {
    profile.deviceMotionMutliplier = 1.0;
    const version = agent.getOS().version || "15.0";
    iDevice(version);
}
function iDevice(version) {
    profile.forceWindowOrientation = true;
    let versionParts = version.split(".");
    if (versionParts.length >= 2) {
        const majorVersion = parseInt(versionParts[0]);
        const minorVersion = parseInt(versionParts[1]);
        if (majorVersion < 11 ||
            (majorVersion === 11 && minorVersion < 3)) {
            profile.blacklisted = true;
        }
        if (majorVersion < 12 ||
            (majorVersion === 12 && minorVersion < 2)) {
            profile.videoElementInDOM = true;
        }
        if ((majorVersion === 12 && minorVersion >= 2) || (majorVersion >= 13))
            profile.showGyroPermissionsWarningIfNecessary = true;
        if (majorVersion >= 13) {
            profile.showSafariPermissionsResetIfNecessary = true;
        }
        if (((majorVersion >= 12 && minorVersion > 1) || (majorVersion >= 13)) &&
            navigator.mediaDevices &&
            navigator.mediaDevices.getSupportedConstraints &&
            navigator.mediaDevices.getSupportedConstraints().frameRate) {
            profile.requestHighFrameRate = true;
            if (majorVersion < 14) {
                // Avoid bug where iOS letterboxes 16:9 into 4:3 for high fps
                // Doesn't seem needed with newer versions of iOS, tested on 14.8.1 and 15.2
                profile.videoHeight = 360;
                profile.dataHeight = 180;
            }
        }
        if (majorVersion === 16 && minorVersion >= 4) {
            profile.ios164CameraSelection = true;
        }
        if (majorVersion >= 17) {
            profile.relyOnConstraintsForCameraSelection = true;
        }
    }
}
